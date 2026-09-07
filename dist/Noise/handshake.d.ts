/**
 * Noise Protocol Framework — XX pattern, DH25519, AESGCM, SHA256.
 * KaguneX implementation for WhatsApp Web-style handshakes.
 *
 * Spec: https://noiseprotocol.org/noise.html
 * Pattern XX:
 *   -> e
 *   <- e, ee, s, es
 *   -> s, se
 */
export declare const NOISE_PROTOCOL_NAME = "Noise_XX_25519_AESGCM_SHA256";
export type NoiseKeyPair = {
    private: Buffer;
    public: Buffer;
};
export type NoiseHandshakeResult = {
    /** Key for writing (initiator -> responder) */
    sendKey: Buffer;
    /** Key for reading (responder -> initiator) */
    recvKey: Buffer;
    writeNonce: bigint;
    readNonce: bigint;
    remoteStaticPublic?: Buffer;
    handshakeHash: Buffer;
};
export type NoiseHandshakeState = {
    role: "initiator" | "responder";
    step: number;
    h: Buffer;
    ck: Buffer;
    k?: Buffer;
    n: bigint;
    ephemeral: NoiseKeyPair;
    staticKeyPair: NoiseKeyPair;
    remoteEphemeral?: Buffer;
    remoteStatic?: Buffer;
    /** Accumulated remote handshake payload (e.g. cert) */
    remotePayload?: Buffer;
};
/** HKDF as defined in Noise (extract + expand via HMAC-SHA256). */
export declare function noiseHkdf(chainingKey: Buffer, inputKeyMaterial: Buffer, numOutputs: 2 | 3): Buffer[];
export declare function generateX25519KeyPair(): NoiseKeyPair;
export declare function dh(privateRaw: Buffer, publicRaw: Buffer): Buffer;
/** Noise AESGCM nonce: 4 zero bytes + 64-bit big-endian counter */
export declare function noiseNonce(n: bigint): Buffer;
/** Create XX initiator (WhatsApp client role). */
export declare function createNoiseInitiator(staticKeyPair: NoiseKeyPair, prologue: Buffer): NoiseHandshakeState;
/** Create XX responder (for local tests / server simulation). */
export declare function createNoiseResponder(staticKeyPair: NoiseKeyPair, prologue: Buffer): NoiseHandshakeState;
/** -> e */
export declare function noiseWriteMessage1(state: NoiseHandshakeState): Buffer;
/**
 * <- e, ee, s, es  (+ optional encrypted payload / cert)
 */
export declare function noiseReadMessageA(state: NoiseHandshakeState, message: Buffer): Buffer;
/** -> s, se  (+ optional payload) */
export declare function noiseWriteMessageB(state: NoiseHandshakeState, payload?: Buffer): Buffer;
/** Process -> e */
export declare function noiseResponderReadMessage1(state: NoiseHandshakeState, message: Buffer): void;
/** <- e, ee, s, es */
export declare function noiseResponderWriteMessageA(state: NoiseHandshakeState, payload?: Buffer): Buffer;
/** Process -> s, se */
export declare function noiseResponderReadMessageB(state: NoiseHandshakeState, message: Buffer): Buffer;
/** Split transport keys — initiator: send=k1 recv=k2; responder reversed. */
export declare function noiseSplit(state: NoiseHandshakeState): NoiseHandshakeResult;
export declare function noiseEncrypt(key: Buffer, nonceCounter: bigint, plaintext: Buffer, aad?: Buffer): Buffer;
export declare function noiseDecrypt(key: Buffer, nonceCounter: bigint, ciphertext: Buffer, aad?: Buffer): Buffer;
export declare function noiseKeyPairFromAuth(noiseKey: {
    public: Uint8Array;
    private: Uint8Array;
}): NoiseKeyPair;
//# sourceMappingURL=handshake.d.ts.map