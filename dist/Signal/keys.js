import { generateX25519KeyPair } from "../Utils/crypto.js";
export function generateIdentityKeyPair() {
    const { public: pub, private: priv } = generateX25519KeyPair();
    return { public: new Uint8Array(pub), private: new Uint8Array(priv) };
}
export function generatePreKey(keyId) {
    return { keyPair: generateIdentityKeyPair(), keyId };
}
//# sourceMappingURL=keys.js.map