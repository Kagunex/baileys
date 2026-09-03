/**
 * WhatsApp Web Noise helpers (KaguneX).
 *
 * WA uses Noise_XX_25519_AESGCM_SHA256 with a fixed prologue string
 * (see Defaults NOISE_MODE) and length-prefixed handshake/transport frames.
 */
import { NOISE_MODE } from "../Defaults/constants.js";
import { encodeFrame, decodeFrame } from "../WABinary/frame.js";
import { createNoiseInitiator, noiseWriteMessage1, noiseReadMessageA, noiseWriteMessageB, noiseSplit, noiseKeyPairFromAuth, } from "./handshake.js";
import { NoiseSession } from "./session.js";
import { validateNoiseCertificate, isStrictCertEnabled, } from "./certificate.js";
/** Start WA client Noise handshake — returns first frame (-> e). */
export function startWaNoiseHandshake(opts) {
    const prologue = opts.prologue ?? Buffer.from(NOISE_MODE, "binary");
    const state = createNoiseInitiator(opts.staticKey, prologue);
    const msg1 = noiseWriteMessage1(state);
    return { state, firstFrame: encodeFrame(msg1) };
}
/**
 * Process server handshake frame (message A), produce client finish frame,
 * then split into transport session.
 *
 * Call with the payload of one decoded length-prefixed frame from the server.
 */
export function continueWaNoiseHandshake(state, serverFramePayload, opts) {
    const serverPayload = noiseReadMessageA(state, serverFramePayload);
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
    const msgB = noiseWriteMessageB(state, finishPayload);
    const keys = noiseSplit(state);
    const session = new NoiseSession(keys);
    return {
        finishFrame: encodeFrame(msgB),
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
export { encodeFrame, decodeFrame };
//# sourceMappingURL=wa-noise.js.map