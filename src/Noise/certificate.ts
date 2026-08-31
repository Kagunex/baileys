/**
 * WhatsApp Noise certificate validation (KaguneX).
 *
 * Publicly documented shape:
 *   NoiseCertificate { details = 1, signature = 2 }
 *   Details { serial, issuer, expires, subject, key }
 *
 * Signature is over `details` bytes, verified with trusted Ed25519 public keys.
 * Load keys via argument or env KAGUNEX_NOISE_CA_KEYS (comma-separated base64).
 */

import { createPublicKey, verify } from "node:crypto";
import {
  readFields,
  fieldBytes,
  fieldString,
  fieldInt,
  encodeBytes,
} from "../WAProto/protobuf.js";

export type NoiseCertificateDetails = {
  serial?: number;
  issuer?: string;
  expires?: number;
  subject?: string;
  key?: Buffer;
};

export type NoiseCertificate = {
  details: Buffer;
  signature: Buffer;
  parsed?: NoiseCertificateDetails;
  serverStaticPublic?: Buffer;
};

export type CertValidationResult =
  | { ok: true; certificate: NoiseCertificate }
  | { ok: false; reason: string; certificate?: NoiseCertificate };

function loadEnvTrustedKeys(): Buffer[] {
  const raw = process.env.KAGUNEX_NOISE_CA_KEYS;
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => Buffer.from(s, "base64"))
    .filter((b) => b.length === 32);
}

function verifyEd25519(pubRaw: Buffer, message: Buffer, signature: Buffer): boolean {
  try {
    const spkiPrefix = Buffer.from("302a300506032b6570032100", "hex");
    const key = createPublicKey({
      key: Buffer.concat([spkiPrefix, pubRaw]),
      format: "der",
      type: "spki",
    });
    return verify(null, message, key, signature);
  } catch {
    return false;
  }
}

/** Parse Details protobuf (best-effort field numbers). */
export function parseCertificateDetails(details: Buffer): NoiseCertificateDetails {
  try {
    const fields = readFields(details);
    return {
      serial: fieldInt(fields, 1),
      issuer: fieldString(fields, 2),
      expires: fieldInt(fields, 3),
      subject: fieldString(fields, 4),
      key: fieldBytes(fields, 5),
    };
  } catch {
    return {};
  }
}

/**
 * Parse NoiseCertificate protobuf or fallback to [details][64-byte sig].
 */
export function parseNoiseCertificate(payload: Buffer): NoiseCertificate | undefined {
  if (!payload || payload.length < 64) return undefined;

  // Prefer protobuf NoiseCertificate { details=1, signature=2 }
  try {
    const fields = readFields(payload);
    const details = fieldBytes(fields, 1);
    const signature = fieldBytes(fields, 2);
    if (details && signature && signature.length === 64) {
      const parsed = parseCertificateDetails(details);
      return {
        details,
        signature,
        parsed,
        serverStaticPublic: parsed.key,
      };
    }
  } catch {
    /* fallback */
  }

  // Fallback: trailing 64-byte signature
  if (payload.length >= 64 + 16) {
    const signature = payload.subarray(payload.length - 64);
    const details = payload.subarray(0, payload.length - 64);
    const parsed = parseCertificateDetails(details);
    return {
      details,
      signature,
      parsed,
      serverStaticPublic: parsed.key ?? details.subarray(0, Math.min(32, details.length)),
    };
  }

  return undefined;
}

/**
 * Validate certificate against trusted Ed25519 public keys.
 */
export function validateNoiseCertificate(
  payload: Buffer,
  trustedKeys: Buffer[] = [],
): CertValidationResult {
  const keys = [...trustedKeys, ...loadEnvTrustedKeys()];
  const certificate = parseNoiseCertificate(payload);
  if (!certificate) {
    return { ok: false, reason: "unable to parse noise certificate" };
  }

  // Expiry check when present (unix seconds)
  if (certificate.parsed?.expires) {
    const now = Math.floor(Date.now() / 1000);
    if (now > certificate.parsed.expires) {
      return { ok: false, reason: "certificate expired", certificate };
    }
  }

  if (!keys.length) {
    return {
      ok: false,
      reason:
        "no trusted Noise CA keys (set KAGUNEX_NOISE_CA_KEYS or pass trustedKeys)",
      certificate,
    };
  }

  for (const pub of keys) {
    if (pub.length !== 32) continue;
    if (verifyEd25519(pub, certificate.details, certificate.signature)) {
      return { ok: true, certificate };
    }
  }

  return {
    ok: false,
    reason: "certificate signature not valid under any trusted key",
    certificate,
  };
}

export function isStrictCertEnabled(): boolean {
  return process.env.KAGUNEX_NOISE_STRICT_CERT !== "0";
}

/** Encode a synthetic cert for local tests (unsigned unless you sign externally). */
export function encodeNoiseCertificateForTest(
  details: Buffer,
  signature: Buffer,
): Buffer {
  return Buffer.concat([encodeBytes(1, details), encodeBytes(2, signature)]);
}
