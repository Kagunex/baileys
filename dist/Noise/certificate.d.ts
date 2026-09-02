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
export type CertValidationResult = {
    ok: true;
    certificate: NoiseCertificate;
} | {
    ok: false;
    reason: string;
    certificate?: NoiseCertificate;
};
/** Parse Details protobuf (best-effort field numbers). */
export declare function parseCertificateDetails(details: Buffer): NoiseCertificateDetails;
/**
 * Parse NoiseCertificate protobuf or fallback to [details][64-byte sig].
 */
export declare function parseNoiseCertificate(payload: Buffer): NoiseCertificate | undefined;
/**
 * Validate certificate against trusted Ed25519 public keys.
 */
export declare function validateNoiseCertificate(payload: Buffer, trustedKeys?: Buffer[]): CertValidationResult;
export declare function isStrictCertEnabled(): boolean;
/** Encode a synthetic cert for local tests (unsigned unless you sign externally). */
export declare function encodeNoiseCertificateForTest(details: Buffer, signature: Buffer): Buffer;
//# sourceMappingURL=certificate.d.ts.map