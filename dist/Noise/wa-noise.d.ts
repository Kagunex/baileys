/**
 * WhatsApp Web Noise helpers (KaguneX).
 *
 * Wire format (compatible with current WhatsApp Web / upstream Baileys):
 *   First frame:  NOISE_WA_HEADER || 3-byte-BE-len || HandshakeMessage{clientHello}
 *   Later frames: 3-byte-BE-len || HandshakeMessage{serverHello|clientFinish} | transport
 *
 * Noise pattern: Noise_XX_25519_AESGCM_SHA256
 * Prologue: NOISE_MODE
 * Extra mix (WA): NOISE_WA_HEADER then static public key into handshake hash
 *                 before the first message (matches upstream authenticate order).
 */
import { NOISE_WA_HEADER } from "../Defaults/constants.js";
import { encodeFrame, decodeFrame } from "../WABinary/frame.js";
import { type NoiseHandshakeState, type NoiseHandshakeResult, type NoiseKeyPair } from "./handshake.js";
import { NoiseSession } from "./session.js";
import { type CertValidationResult } from "./certificate.js";
export type WaNoiseOptions = {
    /** Device noise static key from auth creds */
    staticKey: NoiseKeyPair;
    /** Override prologue (default: NOISE_MODE binary) */
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