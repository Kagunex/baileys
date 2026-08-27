import { describe, it, expect } from "vitest";
import {
  generateX25519KeyPair,
  aesEncryptGCM,
  aesDecryptGCM,
  hkdf,
  sha256,
} from "../src/Utils/crypto.js";
import { encryptMedia, decryptMedia } from "../src/Media/encrypt.js";

describe("crypto", () => {
  it("x25519 keypair is 32 bytes", () => {
    const { public: pub, private: priv } = generateX25519KeyPair();
    expect(pub.length).toBe(32);
    expect(priv.length).toBe(32);
  });

  it("aes-gcm roundtrip", () => {
    const key = Buffer.alloc(32, 7);
    const iv = Buffer.alloc(12, 1);
    const pt = Buffer.from("hello kagunex");
    const ct = aesEncryptGCM(pt, key, iv);
    const back = aesDecryptGCM(ct, key, iv);
    expect(back.toString()).toBe("hello kagunex");
  });

  it("hkdf expands", () => {
    const out = hkdf(Buffer.from("ikm"), 64, "info");
    expect(out.length).toBe(64);
  });

  it("sha256", () => {
    expect(sha256("a").length).toBe(32);
  });

  it("media encrypt/decrypt roundtrip", () => {
    const plain = Buffer.from("media-bytes-kagunex");
    const enc = encryptMedia(plain);
    expect(enc.mediaKey.length).toBe(32);
    const back = decryptMedia(enc.ciphertext, enc.mediaKey);
    expect(back.equals(plain)).toBe(true);
  });
});
