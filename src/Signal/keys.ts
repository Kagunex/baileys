import { generateX25519KeyPair } from "../Utils/crypto.js";
import type { KeyPair } from "../Types/Auth.js";

export function generateIdentityKeyPair(): KeyPair {
  const { public: pub, private: priv } = generateX25519KeyPair();
  return { public: new Uint8Array(pub), private: new Uint8Array(priv) };
}

export function generatePreKey(keyId: number): { keyPair: KeyPair; keyId: number } {
  return { keyPair: generateIdentityKeyPair(), keyId };
}
