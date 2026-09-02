/**
 * WhatsApp Web Noise helpers (KaguneX).
 *
 * WA uses Noise_XX_25519_AESGCM_SHA256 with a fixed prologue string
 * (see Defaults NOISE_MODE) and length-prefixed handshake/transport frames.
 */
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
    /** First frame to send on WebSocket open */
    firstFrame: Buffer;
};
/** Start WA client Noise handshake — returns first frame (-> e). */
export declare function startWaNoiseHandshake(opts: WaNoiseOptions): WaNoiseHandshake;
export type WaNoiseContinueResult = {
    done: false;
    /** Second client frame (-> s, se) */
    frame: Buffer;
    cert?: CertValidationResult;
    serverPayload: Buffer;
} | {
    done: true;
    session: NoiseSession;
    keys: NoiseHandshakeResult;
    cert?: CertValidationResult;
    serverPayload: Buffer;
};
/**
 * Process server handshake frame (message A), produce client finish frame,
 * then split into transport session.
 *
 * Call with the payload of one decoded length-prefixed frame from the server.
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
export { encodeFrame, decodeFrame };
//# sourceMappingURL=wa-noise.d.ts.map