/**
 * Stable Pairing IQ (companion linking) — KaguneX.
 *
 * Design goals:
 *  - Deterministic stanza with real key material when available
 *  - Robust response parsing (multiple attr/tag shapes)
 *  - Retry-friendly request builder (fresh id each attempt)
 *  - Clear errors (not silent empty results)
 */
import type { BinaryNode } from "../WABinary/types.js";
export type PairingStage = "companion_hello" | "companion_finish";
export type PairingKeyMaterial = {
    /** X25519 public (32 bytes) — companion ephemeral */
    companionEphemeralPub?: Buffer;
    /** X25519 public — companion noise/auth key */
    companionAuthPub?: Buffer;
    platformId?: string;
    platformDisplay?: string;
    /** nonce as decimal string */
    nonce?: string;
};
export type PairingCodeRequest = {
    phoneNumber: string;
    id: string;
    node: BinaryNode;
    encoded: Buffer;
    stage: PairingStage;
    attempt: number;
};
export type PairingResult = {
    code?: string;
    status?: string;
    errorCode?: string;
    errorText?: string;
    pairSuccess?: boolean;
    me?: {
        id: string;
        name?: string;
    };
    /** raw iq id if present */
    iqId?: string;
};
export type PairingRequestOptions = {
    keys?: PairingKeyMaterial;
    stage?: PairingStage;
    attempt?: number;
    /** Override iq id (tests) */
    id?: string;
};
/**
 * Build a pairing-code IQ. Call again for each retry (new id).
 */
export declare function buildPairingCodeIq(phoneNumber: string, options?: PairingRequestOptions): PairingCodeRequest;
export declare function buildPairDeviceIq(ref: string, companionRef: string): BinaryNode;
/** Normalize raw code string → XXXX-XXXX when 8 chars. */
export declare function normalizePairingCode(raw: string): string | undefined;
/**
 * Parse pairing-related IQ / notification from a decrypted payload.
 */
export declare function parsePairingPayload(payload: Buffer): PairingResult;
export declare function extractPairingCode(payload: Buffer): string | undefined;
/**
 * Whether this payload is relevant to a pending pairing request.
 * Matches by iq id when known; also accepts code-bearing frames without id match
 * only when `acceptUnsolicitedCode` is true.
 */
export declare function isPairingResponse(payload: Buffer, expectedId?: string, opts?: {
    acceptUnsolicitedCode?: boolean;
}): boolean;
/** @deprecated use isPairingResponse */
export declare function isPairingIqResult(payload: Buffer, expectedId?: string): boolean;
/** Retry policy helper */
export declare function pairingRetryDelayMs(attempt: number): number;
export declare const DEFAULT_PAIRING_TIMEOUT_MS = 60000;
export declare const DEFAULT_PAIRING_MAX_ATTEMPTS = 3;
//# sourceMappingURL=pairing.d.ts.map