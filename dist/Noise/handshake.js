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
import { createCipheriv, createDecipheriv, createHash, createHmac, createPrivateKey, createPublicKey, diffieHellman, generateKeyPairSync, } from "node:crypto";
export const NOISE_PROTOCOL_NAME = "Noise_XX_25519_AESGCM_SHA256";
const HASH_LEN = 32;
const DH_LEN = 32;
const KEY_LEN = 32;
const TAG_LEN = 16;
function sha256(...parts) {
    const h = createHash("sha256");
    for (const p of parts)
        h.update(p);
    return h.digest();
}
function hmacSha256(key, data) {
    return createHmac("sha256", key).update(data).digest();
}
/** HKDF as defined in Noise (extract + expand via HMAC-SHA256). */
export function noiseHkdf(chainingKey, inputKeyMaterial, numOutputs) {
    const tempKey = inputKeyMaterial.length
        ? hmacSha256(chainingKey, inputKeyMaterial)
        : hmacSha256(chainingKey, Buffer.alloc(HASH_LEN, 0));
    const out1 = hmacSha256(tempKey, Buffer.from([1]));
    const out2 = hmacSha256(tempKey, Buffer.concat([out1, Buffer.from([2])]));
    if (numOutputs === 2)
        return [out1, out2];
    const out3 = hmacSha256(tempKey, Buffer.concat([out2, Buffer.from([3])]));
    return [out1, out2, out3];
}
function mixHash(h, data) {
    return sha256(h, data);
}
function mixKey(state, inputKeyMaterial) {
    const [ck, k] = noiseHkdf(state.ck, inputKeyMaterial, 2);
    state.ck = ck;
    state.k = k;
    state.n = 0n;
}
export function generateX25519KeyPair() {
    const { publicKey, privateKey } = generateKeyPairSync("x25519");
    const pubDer = publicKey.export({ type: "spki", format: "der" });
    const privDer = privateKey.export({ type: "pkcs8", format: "der" });
    return {
        public: Buffer.from(pubDer.subarray(pubDer.length - DH_LEN)),
        private: Buffer.from(privDer.subarray(privDer.length - DH_LEN)),
    };
}
export function dh(privateRaw, publicRaw) {
    if (privateRaw.length !== DH_LEN || publicRaw.length !== DH_LEN) {
        throw new Error("DH keys must be 32 bytes");
    }
    const pkcs8Prefix = Buffer.from("302e020100300506032b656e04220420", "hex");
    const spkiPrefix = Buffer.from("302a300506032b656e032100", "hex");
    const privKey = createPrivateKey({
        key: Buffer.concat([pkcs8Prefix, privateRaw]),
        format: "der",
        type: "pkcs8",
    });
    const pubKey = createPublicKey({
        key: Buffer.concat([spkiPrefix, publicRaw]),
        format: "der",
        type: "spki",
    });
    return Buffer.from(diffieHellman({ privateKey: privKey, publicKey: pubKey }));
}
/** Noise AESGCM nonce: 4 zero bytes + 64-bit big-endian counter */
export function noiseNonce(n) {
    const nonce = Buffer.alloc(12, 0);
    nonce.writeUInt32BE(Number((n >> 32n) & 0xffffffffn), 4);
    nonce.writeUInt32BE(Number(n & 0xffffffffn), 8);
    return nonce;
}
function encryptAndHash(state, plaintext) {
    if (!state.k) {
        state.h = mixHash(state.h, plaintext);
        return Buffer.from(plaintext);
    }
    const cipher = createCipheriv("aes-256-gcm", state.k, noiseNonce(state.n));
    cipher.setAAD(state.h);
    const enc = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const ciphertext = Buffer.concat([enc, cipher.getAuthTag()]);
    state.h = mixHash(state.h, ciphertext);
    state.n += 1n;
    return Buffer.from(ciphertext);
}
function decryptAndHash(state, ciphertext) {
    if (!state.k) {
        state.h = mixHash(state.h, ciphertext);
        return Buffer.from(ciphertext);
    }
    if (ciphertext.length < TAG_LEN)
        throw new Error("Noise ciphertext too short");
    const data = ciphertext.subarray(0, ciphertext.length - TAG_LEN);
    const tag = ciphertext.subarray(ciphertext.length - TAG_LEN);
    const decipher = createDecipheriv("aes-256-gcm", state.k, noiseNonce(state.n));
    decipher.setAAD(state.h);
    decipher.setAuthTag(tag);
    const plaintext = Buffer.concat([decipher.update(data), decipher.final()]);
    state.h = mixHash(state.h, ciphertext);
    state.n += 1n;
    // Buffer.from ensures Buffer<ArrayBuffer> (avoids TS2322 with @types/node Buffer generics)
    return Buffer.from(plaintext);
}
function initializeHash(prologue) {
    const name = Buffer.from(NOISE_PROTOCOL_NAME, "utf-8");
    const h0 = name.length === HASH_LEN ? Buffer.from(name) : sha256(name);
    return {
        ck: Buffer.from(h0),
        h: mixHash(h0, prologue),
    };
}
/** Create XX initiator (WhatsApp client role). */
export function createNoiseInitiator(staticKeyPair, prologue) {
    const { h, ck } = initializeHash(prologue);
    return {
        role: "initiator",
        step: 0,
        h,
        ck,
        n: 0n,
        ephemeral: generateX25519KeyPair(),
        staticKeyPair,
    };
}
/** Create XX responder (for local tests / server simulation). */
export function createNoiseResponder(staticKeyPair, prologue) {
    const { h, ck } = initializeHash(prologue);
    return {
        role: "responder",
        step: 0,
        h,
        ck,
        n: 0n,
        ephemeral: generateX25519KeyPair(),
        staticKeyPair,
    };
}
// ——— Initiator messages ———
/** -> e */
export function noiseWriteMessage1(state) {
    if (state.role !== "initiator" || state.step !== 0) {
        throw new Error("Noise: initiator message1 invalid state");
    }
    state.h = mixHash(state.h, state.ephemeral.public);
    state.step = 1;
    return Buffer.from(state.ephemeral.public);
}
/**
 * <- e, ee, s, es  (+ optional encrypted payload / cert)
 */
export function noiseReadMessageA(state, message) {
    if (state.role !== "initiator" || state.step !== 1) {
        throw new Error("Noise: initiator read A invalid state");
    }
    if (message.length < DH_LEN)
        throw new Error("Noise: message A too short");
    const re = message.subarray(0, DH_LEN);
    state.remoteEphemeral = Buffer.from(re);
    state.h = mixHash(state.h, re);
    mixKey(state, dh(state.ephemeral.private, state.remoteEphemeral)); // ee
    const rest = message.subarray(DH_LEN);
    if (rest.length < DH_LEN + TAG_LEN) {
        throw new Error("Noise: message A missing encrypted static");
    }
    const encS = rest.subarray(0, DH_LEN + TAG_LEN);
    const payloadEnc = rest.subarray(DH_LEN + TAG_LEN);
    const remoteStatic = decryptAndHash(state, encS);
    if (remoteStatic.length !== DH_LEN) {
        throw new Error("Noise: remote static key length invalid");
    }
    state.remoteStatic = Buffer.from(remoteStatic);
    mixKey(state, dh(state.ephemeral.private, state.remoteStatic)); // es
    let payload = Buffer.alloc(0);
    if (payloadEnc.length > 0) {
        payload = decryptAndHash(state, payloadEnc);
    }
    state.remotePayload = Buffer.from(payload);
    state.step = 2;
    return payload;
}
/** -> s, se  (+ optional payload) */
export function noiseWriteMessageB(state, payload = Buffer.alloc(0)) {
    if (state.role !== "initiator" || state.step !== 2) {
        throw new Error("Noise: initiator message B invalid state");
    }
    if (!state.remoteEphemeral)
        throw new Error("Noise: missing remote ephemeral");
    const encS = encryptAndHash(state, state.staticKeyPair.public);
    mixKey(state, dh(state.staticKeyPair.private, state.remoteEphemeral)); // se
    const encPayload = encryptAndHash(state, payload);
    state.step = 3;
    return Buffer.concat([encS, encPayload]);
}
// ——— Responder messages (for tests) ———
/** Process -> e */
export function noiseResponderReadMessage1(state, message) {
    if (state.role !== "responder" || state.step !== 0) {
        throw new Error("Noise: responder read1 invalid state");
    }
    if (message.length < DH_LEN)
        throw new Error("Noise: message1 too short");
    state.remoteEphemeral = Buffer.from(message.subarray(0, DH_LEN));
    state.h = mixHash(state.h, state.remoteEphemeral);
    state.step = 1;
}
/** <- e, ee, s, es */
export function noiseResponderWriteMessageA(state, payload = Buffer.alloc(0)) {
    if (state.role !== "responder" || state.step !== 1) {
        throw new Error("Noise: responder write A invalid state");
    }
    if (!state.remoteEphemeral)
        throw new Error("Noise: missing remote e");
    state.h = mixHash(state.h, state.ephemeral.public);
    mixKey(state, dh(state.ephemeral.private, state.remoteEphemeral)); // ee
    const encS = encryptAndHash(state, state.staticKeyPair.public);
    mixKey(state, dh(state.staticKeyPair.private, state.remoteEphemeral)); // es
    const encPayload = encryptAndHash(state, payload);
    state.step = 2;
    return Buffer.concat([state.ephemeral.public, encS, encPayload]);
}
/** Process -> s, se */
export function noiseResponderReadMessageB(state, message) {
    if (state.role !== "responder" || state.step !== 2) {
        throw new Error("Noise: responder read B invalid state");
    }
    if (message.length < DH_LEN + TAG_LEN) {
        throw new Error("Noise: message B too short");
    }
    const encS = message.subarray(0, DH_LEN + TAG_LEN);
    const payloadEnc = message.subarray(DH_LEN + TAG_LEN);
    const remoteStatic = decryptAndHash(state, encS);
    state.remoteStatic = Buffer.from(remoteStatic);
    mixKey(state, dh(state.ephemeral.private, state.remoteStatic)); // se
    let payload = Buffer.alloc(0);
    if (payloadEnc.length > 0) {
        payload = decryptAndHash(state, payloadEnc);
    }
    state.remotePayload = Buffer.from(payload);
    state.step = 3;
    return payload;
}
/** Split transport keys — initiator: send=k1 recv=k2; responder reversed. */
export function noiseSplit(state) {
    if (state.step !== 3)
        throw new Error("Noise: handshake incomplete");
    const [k1, k2] = noiseHkdf(state.ck, Buffer.alloc(0), 2);
    const isInitiator = state.role === "initiator";
    return {
        sendKey: isInitiator ? k1 : k2,
        recvKey: isInitiator ? k2 : k1,
        writeNonce: 0n,
        readNonce: 0n,
        remoteStaticPublic: state.remoteStatic,
        handshakeHash: Buffer.from(state.h),
    };
}
export function noiseEncrypt(key, nonceCounter, plaintext, aad = Buffer.alloc(0)) {
    const cipher = createCipheriv("aes-256-gcm", key, noiseNonce(nonceCounter));
    if (aad.length)
        cipher.setAAD(aad);
    const enc = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    return Buffer.concat([enc, cipher.getAuthTag()]);
}
export function noiseDecrypt(key, nonceCounter, ciphertext, aad = Buffer.alloc(0)) {
    if (ciphertext.length < TAG_LEN)
        throw new Error("ciphertext too short");
    const data = ciphertext.subarray(0, ciphertext.length - TAG_LEN);
    const tag = ciphertext.subarray(ciphertext.length - TAG_LEN);
    const decipher = createDecipheriv("aes-256-gcm", key, noiseNonce(nonceCounter));
    if (aad.length)
        decipher.setAAD(aad);
    decipher.setAuthTag(tag);
    return Buffer.from(Buffer.concat([decipher.update(data), decipher.final()]));
}
export function noiseKeyPairFromAuth(noiseKey) {
    return {
        public: Buffer.from(noiseKey.public),
        private: Buffer.from(noiseKey.private),
    };
}
//# sourceMappingURL=handshake.js.map