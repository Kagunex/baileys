import { describe, it, expect } from "vitest";
import {
  generateX25519KeyPair,
  createNoiseInitiator,
  noiseWriteMessage1,
  noiseEncrypt,
  noiseDecrypt,
  noiseKeyPairFromAuth,
} from "../src/Noise/handshake.js";
import { initAuthCreds } from "../src/Auth/credentials.js";
import { encodeFrame, decodeFrame } from "../src/WABinary/frame.js";
import { NOISE_MODE } from "../src/Defaults/constants.js";

describe("Noise basics", () => {
  it("generates x25519 keypair 32 bytes", () => {
    const kp = generateX25519KeyPair();
    expect(kp.public.length).toBe(32);
    expect(kp.private.length).toBe(32);
  });

  it("message1 is 32-byte ephemeral", () => {
    const staticKp = generateX25519KeyPair();
    const state = createNoiseInitiator(staticKp, Buffer.from(NOISE_MODE, "binary"));
    const msg1 = noiseWriteMessage1(state);
    expect(msg1.length).toBe(32);
    expect(state.step).toBe(1);
  });

  it("transport encrypt/decrypt roundtrip", () => {
    const key = Buffer.alloc(32, 9);
    const pt = Buffer.from("kagunex-noise");
    const ct = noiseEncrypt(key, 0n, pt);
    const back = noiseDecrypt(key, 0n, ct);
    expect(back.equals(pt)).toBe(true);
  });

  it("auth noise key converts", () => {
    const creds = initAuthCreds();
    const kp = noiseKeyPairFromAuth(creds.noiseKey);
    expect(kp.public.length).toBe(32);
  });

  it("frame wrap ephemeral", () => {
    const msg = Buffer.alloc(32, 1);
    const framed = encodeFrame(msg);
    const decoded = decodeFrame(framed);
    expect(decoded?.payload.equals(msg)).toBe(true);
  });
});
