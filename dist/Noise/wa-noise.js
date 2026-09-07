/**
 * WhatsApp Web Noise helpers (KaguneX).
 *
 * Wire format (compatible with current WhatsApp Web / upstream Baileys):
 *   First frame:  NOISE_WA_HEADER || 3-byte-BE-len || HandshakeMessage{clientHello}
 *   Later frames: 3-byte-BE-len || HandshakeMessage{serverHello|clientFinish} | transport
 *
 * Noise pattern: Noise_XX_25519_AESGCM_SHA256
 * Prologue: NOISE_WA_HEADER  (4 bytes: "WA" + protocol major + dict version)
 * Extra WA mix before message 1: client static public key → authenticated into h.
 * The server mirrors this step (from device DB for registered devices, or from
 * ClientHello.static field 2 for new/unregistered devices).
 *
 * FIXES vs RC1:
 *   1. Prologue is now NOISE_WA_HEADER (4 bytes), not NOISE_MODE (32 bytes).
 *      NOISE_WA_HEADER is already mixed into h by createNoiseInitiator →
 *      initializeHash; it must NOT be mixed again in startWaNoiseHandshake.
 *   2. ClientHello now includes the static public key (field 2) so the server
 *      can authenticate the same key into its h state for new devices.
 */
import { NOISE_WA_HEADER } from "../Defaults/constants.js";
import { encodeFrame, decodeFrame } from "../WABinary/frame.js";
import { encodeBytes, readFields, fieldBytes } from "../WAProto/protobuf.js";
import { createNoiseInitiator, noiseWriteMessage1, noiseReadMessageA, noiseWriteMessageB, noiseSplit, noiseKeyPairFromAuth, } from "./handshake.js";
import { NoiseSession } from "./session.js";
import { validateNoiseCertificate, isStrictCertEnabled, } from "./certificate.js";
import { createHash } from "node:crypto";
// ---------------------------------------------------------------------------
// HandshakeMessage protobuf (field numbers from WAProto)
// message HandshakeMessage {
//   optional ClientHello clientHello = 2;
//   optional ServerHello serverHello = 3;
//   optional ClientFinish clientFinish = 4;
// }
// ClientHello { ephemeral=1, static=2, payload=3 }
// ServerHello { ephemeral=1, static=2, payload=3 }
// ClientFinish { static=1, payload=2 }
// ---------------------------------------------------------------------------
function encodeClientHello(ephemeral, staticKey, payload) {
    const parts = [encodeBytes(1, ephemeral)];
    if (staticKey?.length)
        parts.push(encodeBytes(2, staticKey));
    if (payload?.length)
        parts.push(encodeBytes(3, payload));
    const inner = Buffer.concat(parts);
    // HandshakeMessage.clientHello = field 2
    return encodeBytes(2, inner);
}
function encodeClientFinish(encStatic, encPayload) {
    const parts = [encodeBytes(1, encStatic)];
    if (encPayload?.length)
        parts.push(encodeBytes(2, encPayload));
    const inner = Buffer.concat(parts);
    // HandshakeMessage.clientFinish = field 4
    return encodeBytes(4, inner);
}
/** Parse HandshakeMessage.serverHello from a protobuf buffer. */
export function parseServerHello(payload) {
    const top = readFields(payload);
    const serverHelloBytes = fieldBytes(top, 3);
    if (!serverHelloBytes) {
        throw new Error("Noise: missing HandshakeMessage.serverHello");
    }
    const fields = readFields(serverHelloBytes);
    const ephemeral = fieldBytes(fields, 1);
    const staticKey = fieldBytes(fields, 2);
    const certPayload = fieldBytes(fields, 3) ?? Buffer.alloc(0);
    if (!ephemeral || ephemeral.length !== 32) {
        throw new Error("Noise: serverHello.ephemeral missing or invalid length");
    }
    if (!staticKey || staticKey.length < 32) {
        // encrypted static is 32 + 16 tag = 48
        throw new Error("Noise: serverHello.static missing or too short");
    }
    return {
        ephemeral: Buffer.from(ephemeral),
        static: Buffer.from(staticKey),
        payload: Buffer.from(certPayload),
    };
}
/** Reconstruct the raw Noise message A bytes that noiseReadMessageA expects. */
function serverHelloToNoiseMessageA(sh) {
    // Noise XX message 2: e || encrypt(s) || encrypt(payload)
    return Buffer.concat([sh.ephemeral, sh.static, sh.payload]);
}
function mixHash(h, data) {
    return createHash("sha256").update(h).update(data).digest();
}
/**
 * Start WA client Noise handshake.
 * Returns the complete first WebSocket binary frame to send.
 *
 * Hash state sequence (must match WhatsApp server):
 *   h0 = zero_pad("Noise_XX_25519_AESGCM_SHA256", 32)  [in initializeHash — FIXED]
 *   ck = h0
 *   h  = sha256(h0 || NOISE_WA_HEADER)                  [prologue — FIXED]
 *   h  = sha256(h  || staticKey.public)                  [WA pre-auth — kept]
 *   h  = sha256(h  || ephemeral.public)                  [in noiseWriteMessage1]
 */
export function startWaNoiseHandshake(opts) {
    // FIX #2: Prologue is NOISE_WA_HEADER (4 bytes), NOT NOISE_MODE (32 bytes).
    // createNoiseInitiator → initializeHash mixes this into h as the prologue.
    const prologue = opts.prologue ?? NOISE_WA_HEADER;
    const state = createNoiseInitiator(opts.staticKey, prologue);
    // WA-specific: authenticate the client's static public key into h before message 1.
    // The server does the same:
    //   - Registered devices: server reads the key from its device database.
    //   - New devices (pairing): server reads the key from ClientHello field 2.
    //
    // FIX #3: NOISE_WA_HEADER is now the prologue (already mixed above).
    //         Do NOT mix NOISE_WA_HEADER again here — that was a double-mix bug in RC1.
    state.h = mixHash(state.h, opts.staticKey.public);
    const ephemeral = noiseWriteMessage1(state);
    // FIX #4: Include the static public key (unencrypted) in ClientHello field 2.
    // This is required so the WhatsApp server can authenticate it into its own h
    // state for new/unregistered devices (where the server has no prior knowledge
    // of the client's noise key).  Without this, server h ≠ client h → AES-GCM
    // tag mismatch → "Unsupported state or unable to authenticate data".
    const clientHelloProto = encodeClientHello(ephemeral, opts.staticKey.public);
    // First frame: WA header + length-prefixed HandshakeMessage
    const body = encodeFrame(clientHelloProto);
    const firstFrame = Buffer.concat([NOISE_WA_HEADER, body]);
    return { state, firstFrame };
}
/**
 * Process server HandshakeMessage frame, produce clientFinish frame,
 * and split into a transport session.
 *
 * `serverFramePayload` is the payload of one decoded length-prefixed frame
 * (i.e. the HandshakeMessage protobuf bytes, NOT including the 3-byte length).
 */
export function continueWaNoiseHandshake(state, serverFramePayload, opts) {
    const sh = parseServerHello(serverFramePayload);
    const noiseMsgA = serverHelloToNoiseMessageA(sh);
    const serverPayload = noiseReadMessageA(state, noiseMsgA);
    let cert = {
        ok: false,
        reason: "no certificate payload",
    };
    if (serverPayload.length > 0) {
        cert = validateNoiseCertificate(serverPayload, opts?.trustedCertKeys);
        if (!cert.ok &&
            isStrictCertEnabled() &&
            cert.reason.includes("not valid")) {
            throw new Error(`Noise certificate rejected: ${cert.reason}`);
        }
    }
    const finishPayload = opts?.finishPayload ?? Buffer.alloc(0);
    // noiseWriteMessageB returns encrypt(static) || encrypt(payload)
    const msgB = noiseWriteMessageB(state, finishPayload);
    // Split: first 48 bytes = enc static (32+16), rest = enc payload
    const TAG = 16;
    const DH = 32;
    const encStatic = msgB.subarray(0, DH + TAG);
    const encPayload = msgB.subarray(DH + TAG);
    const clientFinishProto = encodeClientFinish(encStatic, encPayload.length ? encPayload : undefined);
    const keys = noiseSplit(state);
    const session = new NoiseSession(keys);
    return {
        finishFrame: encodeFrame(clientFinishProto),
        session,
        keys,
        cert,
        serverPayload,
    };
}
export function waNoiseKeyFromCreds(noiseKey) {
    return noiseKeyPairFromAuth(noiseKey);
}
/** Re-export frame helpers for WA pipeline */
export { encodeFrame, decodeFrame, NOISE_WA_HEADER };
//# sourceMappingURL=wa-noise.js.map