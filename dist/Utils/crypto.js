/**
 * Shared crypto primitives for Signal / Media / Auth.
 * Uses Node.js built-in crypto only (no external curve libs).
 */
import { createCipheriv, createDecipheriv, createHash, createHmac, createPrivateKey, createPublicKey, diffieHellman, generateKeyPairSync, randomBytes as nodeRandomBytes, } from "node:crypto";
const DH_LEN = 32;
/** Generate raw X25519 key pair (32-byte public + private). */
export function generateX25519KeyPair() {
    const { publicKey, privateKey } = generateKeyPairSync("x25519");
    const pubDer = publicKey.export({ type: "spki", format: "der" });
    const privDer = privateKey.export({ type: "pkcs8", format: "der" });
    return {
        public: Buffer.from(pubDer.subarray(pubDer.length - DH_LEN)),
        private: Buffer.from(privDer.subarray(privDer.length - DH_LEN)),
    };
}
/** X25519 ECDH shared secret. */
export function sharedSecret(privateKey, publicKey) {
    const pkcs8Prefix = Buffer.from("302e020100300506032b656e04220420", "hex");
    const spkiPrefix = Buffer.from("302a300506032b656e032100", "hex");
    const priv = createPrivateKey({
        key: Buffer.concat([pkcs8Prefix, Buffer.from(privateKey)]),
        format: "der",
        type: "pkcs8",
    });
    const pub = createPublicKey({
        key: Buffer.concat([spkiPrefix, Buffer.from(publicKey)]),
        format: "der",
        type: "spki",
    });
    return diffieHellman({ privateKey: priv, publicKey: pub });
}
/**
 * HKDF-SHA256 expand.
 * Signature used across Media + Signal: hkdf(ikm, length, info) → Buffer
 */
export function hkdf(ikm, length, info = "", salt) {
    const saltBuf = salt && salt.length ? Buffer.from(salt) : Buffer.alloc(32, 0);
    const infoBuf = typeof info === "string" ? Buffer.from(info, "utf8") : Buffer.from(info);
    const prk = createHmac("sha256", saltBuf).update(Buffer.from(ikm)).digest();
    const blocks = Math.ceil(length / 32);
    let t = Buffer.alloc(0);
    const okm = Buffer.alloc(blocks * 32);
    for (let i = 0; i < blocks; i++) {
        t = createHmac("sha256", prk)
            .update(t)
            .update(infoBuf)
            .update(Buffer.from([i + 1]))
            .digest();
        t.copy(okm, i * 32);
    }
    return Buffer.from(Uint8Array.from(okm.subarray(0, length)));
}
export function sha256(data) {
    return createHash("sha256").update(Buffer.from(data)).digest();
}
export function hmacSha256(key, data) {
    return createHmac("sha256", Buffer.from(key)).update(Buffer.from(data)).digest();
}
/**
 * AES-256-GCM encrypt.
 * Returns ciphertext || tag (16 bytes).
 */
export function aesEncryptGCM(plaintext, key, iv, additionalData) {
    const cipher = createCipheriv("aes-256-gcm", Buffer.from(key).subarray(0, 32), Buffer.from(iv));
    if (additionalData)
        cipher.setAAD(Buffer.from(additionalData));
    const enc = Buffer.concat([cipher.update(Buffer.from(plaintext)), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([enc, tag]);
}
/**
 * AES-256-GCM decrypt. Expects ciphertext || tag.
 */
export function aesDecryptGCM(ciphertextWithTag, key, iv, additionalData) {
    const buf = Buffer.from(ciphertextWithTag);
    if (buf.length < 16)
        throw new Error("aesDecryptGCM: ciphertext too short");
    const tag = buf.subarray(buf.length - 16);
    const data = buf.subarray(0, buf.length - 16);
    const decipher = createDecipheriv("aes-256-gcm", Buffer.from(key).subarray(0, 32), Buffer.from(iv));
    if (additionalData)
        decipher.setAAD(Buffer.from(additionalData));
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]);
}
export function randomBytesBuffer(size) {
    return nodeRandomBytes(size);
}
//# sourceMappingURL=crypto.js.map