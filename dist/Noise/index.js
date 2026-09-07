export { NOISE_PROTOCOL_NAME, createNoiseInitiator, createNoiseResponder, noiseWriteMessage1, noiseReadMessageA, noiseWriteMessageB, noiseResponderReadMessage1, noiseResponderWriteMessageA, noiseResponderReadMessageB, noiseSplit, noiseEncrypt, noiseDecrypt, noiseHkdf, noiseNonce, dh, generateX25519KeyPair, noiseKeyPairFromAuth, } from "./handshake.js";
export { NoiseSession } from "./session.js";
export { parseNoiseCertificate, validateNoiseCertificate, isStrictCertEnabled, } from "./certificate.js";
export { startWaNoiseHandshake, continueWaNoiseHandshake, waNoiseKeyFromCreds, parseServerHello, } from "./wa-noise.js";
export { NOISE_WA_HEADER } from "../Defaults/constants.js";
//# sourceMappingURL=index.js.map