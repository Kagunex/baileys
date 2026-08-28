import {
  createHash,
  createHmac,
  createCipheriv,
  createDecipheriv,
  generateKeyPairSync,
  randomBytes,
} from "node:crypto";
import { toBuffer } from "./buffers.js";

export function sha256(data: Buffer | Uint8Array | string): Buffer {
  return createHash("sha256").update(toBuffer(data as Buffer | Uint8Array | string)).digest();
}

export function hmacSha256(key: Buffer | Uint8Array, data: Buffer | Uint8Array): Buffer {
  return createHmac("sha256", toBuffer(key)).update(toBuffer(data)).digest();
}

export function randomBytesBuffer(length: number): Buffer {
  return randomBytes(length);
}

export function generateX25519KeyPair(): { public: Buffer; private: Buffer } {
  const { publicKey, privateKey } = generateKeyPairSync("x25519", {
    publicKeyEncoding: { type: "spki", format: "der" },
    privateKeyEncoding: { type: "pkcs8", format: "der" },
  });
  return {
    public: Buffer.from(publicKey.subarray(publicKey.length - 32)),
    private: Buffer.from(privateKey.subarray(privateKey.length - 32)),
  };
}

export function aesEncryptGCM(
  plaintext: Buffer | Uint8Array,
  key: Buffer | Uint8Array,
  iv: Buffer | Uint8Array,
  additionalData?: Buffer | Uint8Array,
): Buffer {
  const cipher = createCipheriv("aes-256-gcm", toBuffer(key), toBuffer(iv));
  if (additionalData) cipher.setAAD(toBuffer(additionalData));
  const enc = Buffer.concat([cipher.update(toBuffer(plaintext)), cipher.final()]);
  return Buffer.concat([enc, cipher.getAuthTag()]);
}

export function aesDecryptGCM(
  ciphertextWithTag: Buffer | Uint8Array,
  key: Buffer | Uint8Array,
  iv: Buffer | Uint8Array,
  additionalData?: Buffer | Uint8Array,
): Buffer {
  const data = toBuffer(ciphertextWithTag);
  const tag = data.subarray(data.length - 16);
  const ciphertext = data.subarray(0, data.length - 16);
  const decipher = createDecipheriv("aes-256-gcm", toBuffer(key), toBuffer(iv));
  decipher.setAuthTag(tag);
  if (additionalData) decipher.setAAD(toBuffer(additionalData));
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

export function hkdf(
  ikm: Buffer | Uint8Array,
  length: number,
  info: string | Buffer = "",
  salt?: Buffer | Uint8Array,
): Buffer {
  const saltBuf = salt ? toBuffer(salt) : Buffer.alloc(32, 0);
  const prk = hmacSha256(saltBuf, toBuffer(ikm));
  const infoBuf = typeof info === "string" ? Buffer.from(info, "utf-8") : toBuffer(info);
  const blocks: Buffer[] = [];
  let previous: Buffer = Buffer.alloc(0);
  let generated = 0;
  let counter = 1;
  while (generated < length) {
    previous = hmacSha256(prk, Buffer.concat([previous, infoBuf, Buffer.from([counter])]));
    blocks.push(previous);
    generated += previous.length;
    counter += 1;
  }
  return Buffer.concat(blocks).subarray(0, length);
}
