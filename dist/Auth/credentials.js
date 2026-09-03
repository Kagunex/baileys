import { randomBytes } from "node:crypto";
import { generateRegistrationId } from "../Utils/generics.js";
import { generateX25519KeyPair } from "../Utils/crypto.js";
import { encodeBase64 } from "../Utils/buffers.js";
function keyPairFromX25519() {
    const { public: pub, private: priv } = generateX25519KeyPair();
    return { public: new Uint8Array(pub), private: new Uint8Array(priv) };
}
export function initAuthCreds() {
    const signedPreKey = {
        keyPair: keyPairFromX25519(),
        signature: new Uint8Array(randomBytes(64)),
        keyId: 1,
        timestamp: Math.floor(Date.now() / 1000),
    };
    return {
        noiseKey: keyPairFromX25519(),
        pairingEphemeralKeyPair: keyPairFromX25519(),
        signedIdentityKey: keyPairFromX25519(),
        signedPreKey,
        registrationId: generateRegistrationId(),
        advSecretKey: encodeBase64(randomBytes(32)),
        processedHistoryMessages: [],
        nextPreKeyId: 1,
        firstUnuploadedPreKeyId: 1,
        accountSyncCounter: 0,
        accountSettings: { unarchiveChats: false },
        registered: false,
    };
}
export function serializeCreds(creds) {
    const encodeKP = (kp) => ({
        public: encodeBase64(Buffer.from(kp.public)),
        private: encodeBase64(Buffer.from(kp.private)),
    });
    return {
        ...creds,
        noiseKey: encodeKP(creds.noiseKey),
        pairingEphemeralKeyPair: encodeKP(creds.pairingEphemeralKeyPair),
        signedIdentityKey: encodeKP(creds.signedIdentityKey),
        signedPreKey: {
            keyPair: encodeKP(creds.signedPreKey.keyPair),
            signature: encodeBase64(Buffer.from(creds.signedPreKey.signature)),
            keyId: creds.signedPreKey.keyId,
            timestamp: creds.signedPreKey.timestamp,
        },
        routingInfo: creds.routingInfo ? encodeBase64(creds.routingInfo) : undefined,
    };
}
export function deserializeCreds(data) {
    const decodeKP = (obj) => ({
        public: new Uint8Array(Buffer.from(obj.public, "base64")),
        private: new Uint8Array(Buffer.from(obj.private, "base64")),
    });
    const raw = data;
    return {
        ...raw,
        noiseKey: decodeKP(raw.noiseKey),
        pairingEphemeralKeyPair: decodeKP(raw.pairingEphemeralKeyPair),
        signedIdentityKey: decodeKP(raw.signedIdentityKey),
        signedPreKey: {
            keyPair: decodeKP(raw.signedPreKey.keyPair),
            signature: new Uint8Array(Buffer.from(raw.signedPreKey.signature, "base64")),
            keyId: raw.signedPreKey.keyId,
            timestamp: raw.signedPreKey.timestamp,
        },
        routingInfo: raw.routingInfo
            ? new Uint8Array(Buffer.from(raw.routingInfo, "base64"))
            : undefined,
    };
}
//# sourceMappingURL=credentials.js.map