import { describe, it, expect } from "vitest";
import {
  parseNoiseCertificate,
  validateNoiseCertificate,
  encodeNoiseCertificateForTest,
  parseCertificateDetails,
} from "../src/Noise/certificate.js";
import {
  encodeBytes,
  encodeString,
  encodeInt32,
} from "../src/WAProto/protobuf.js";
import { generateKeyPairSync, sign } from "node:crypto";

describe("Noise certificate (upgraded)", () => {
  it("parses protobuf NoiseCertificate", () => {
    const details = Buffer.concat([
      encodeInt32(1, 42),
      encodeString(2, "test-issuer"),
      encodeBytes(5, Buffer.alloc(32, 7)),
    ]);
    const signature = Buffer.alloc(64, 9);
    const payload = encodeNoiseCertificateForTest(details, signature);
    const cert = parseNoiseCertificate(payload);
    expect(cert).toBeDefined();
    expect(cert!.parsed?.serial).toBe(42);
    expect(cert!.parsed?.issuer).toBe("test-issuer");
    expect(cert!.serverStaticPublic?.length).toBe(32);
  });

  it("validates with real Ed25519 key", () => {
    const { publicKey, privateKey } = generateKeyPairSync("ed25519");
    const pubDer = publicKey.export({ type: "spki", format: "der" }) as Buffer;
    const pubRaw = pubDer.subarray(pubDer.length - 32);

    const details = Buffer.concat([
      encodeInt32(1, 1),
      encodeString(2, "kagunex-test"),
      encodeBytes(5, Buffer.alloc(32, 1)),
    ]);
    const signature = sign(null, details, privateKey);
    const payload = encodeNoiseCertificateForTest(details, Buffer.from(signature));

    const ok = validateNoiseCertificate(payload, [pubRaw]);
    expect(ok.ok).toBe(true);

    const bad = validateNoiseCertificate(payload, [Buffer.alloc(32, 0)]);
    expect(bad.ok).toBe(false);
  });

  it("fails without trusted keys", () => {
    const details = Buffer.alloc(40, 1);
    const payload = Buffer.concat([details, Buffer.alloc(64, 2)]);
    // clear env
    const prev = process.env.KAGUNEX_NOISE_CA_KEYS;
    delete process.env.KAGUNEX_NOISE_CA_KEYS;
    const result = validateNoiseCertificate(payload, []);
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/no trusted/i);
    if (prev) process.env.KAGUNEX_NOISE_CA_KEYS = prev;
  });
});
