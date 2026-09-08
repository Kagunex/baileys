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
import { type NoiseHandshakeState, type NoiseHandshakeResult, type NoiseKeyPair } from "./handshake.js";
import { NoiseSession } from "./session.js";
import { type CertValidationResult } from "./certificate.js";
export type WaNoiseOptions = {
    /** Device noise static key from auth creds */
    staticKey: NoiseKeyPair;
    /** Override prologue (default: NOISE_WA_HEADER — the correct WA prologue) */
    prologue?: Buffer;
    /** Optional trusted cert public keys (32-byte Ed25519) */
    trustedCertKeys?: Buffer[];
};
export type WaNoiseHandshake = {
    state: NoiseHandshakeState;
    /** First frame to send on WebSocket open (includes WA header + clientHello) */
    firstFrame: Buffer;
};
export type ParsedServerHello = {
    ephemeral: Buffer;
    static: Buffer;
    payload: Buffer;
};
/** Parse HandshakeMessage.serverHello from a protobuf buffer. */
export declare function parseServerHello(payload: Buffer): ParsedServerHello;
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
export declare function startWaNoiseHandshake(opts: WaNoiseOptions): WaNoiseHandshake;
/**
 * Process server HandshakeMessage frame, produce clientFinish frame,
 * and split into a transport session.
 *
 * `serverFramePayload` is the payload of one decoded length-prefixed frame
 * (i.e. the HandshakeMessage protobuf bytes, NOT including the 3-byte length).
 */
export declare function continueWaNoiseHandshake(state: NoiseHandshakeState, serverFramePayload: Buffer, opts?: {
    trustedCertKeys?: Buffer[];
    finishPayload?: Buffer;
}): {
    finishFrame: Buffer;
    session: NoiseSession;
    keys: NoiseHandshakeResult;
    cert: CertValidationResult;
    serverPayload: Buffer;
};
export declare function waNoiseKeyFromCreds(noiseKey: {
    public: Uint8Array;
    private: Uint8Array;
}): NoiseKeyPair;
/** Re-export frame helpers for WA pipeline */
export { encodeFrame, decodeFrame, NOISE_WA_HEADER };
//# sourceMappingURL=wa-noise.d.ts.map