/**
 * Shared crypto primitives for Signal / Media / Auth.
 * Uses Node.js built-in crypto only (no external curve libs).
 */
export type X25519KeyPair = {
    public: Buffer;
    private: Buffer;
};
/** Generate raw X25519 key pair (32-byte public + private). */
export declare function generateX25519KeyPair(): X25519KeyPair;
/** X25519 ECDH shared secret. */
export declare function sharedSecret(privateKey: Buffer | Uint8Array, publicKey: Buffer | Uint8Array): Buffer;
/**
 * HKDF-SHA256 expand.
 * Signature used across Media + Signal: hkdf(ikm, length, info) → Buffer
 */
export declare function hkdf(ikm: Buffer | Uint8Array, length: number, info?: string | Buffer, salt?: Buffer | Uint8Array): Buffer<ArrayBufferLike>;
export declare function sha256(data: Buffer | Uint8Array): Buffer;
export declare function hmacSha256(key: Buffer | Uint8Array, data: Buffer | Uint8Array): Buffer;
/**
 * AES-256-GCM encrypt.
 * Returns ciphertext || tag (16 bytes).
 */
export declare function aesEncryptGCM(plaintext: Buffer | Uint8Array, key: Buffer | Uint8Array, iv: Buffer | Uint8Array, additionalData?: Buffer | Uint8Array): Buffer;
/**
 * AES-256-GCM decrypt. Expects ciphertext || tag.
 */
export declare function aesDecryptGCM(ciphertextWithTag: Buffer | Uint8Array, key: Buffer | Uint8Array, iv: Buffer | Uint8Array, additionalData?: Buffer | Uint8Array): Buffer;
export declare function randomBytesBuffer(size: number): Buffer;
//# sourceMappingURL=crypto.d.ts.map