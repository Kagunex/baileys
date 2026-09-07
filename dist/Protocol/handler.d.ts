/**
 * Lightweight protocol router for post-Noise binary nodes.
 * Extracts actionable fields without inventing server data.
 */
import type { BinaryNode } from "../WABinary/types.js";
export type ProtocolParseResult = {
    nodes: BinaryNode[];
    qrRefs: string[];
    streamError?: string;
    success?: boolean;
    pairSuccess?: boolean;
};
export declare function parseProtocolPayload(payload: Buffer): ProtocolParseResult;
/**
 * Compose multi-device QR string from a real server ref + local keys.
 * Returns undefined if any piece is missing — never invents a ref.
 */
export declare function composeQrPayload(parts: {
    ref: string;
    noisePub: Buffer;
    identityPub: Buffer;
    advSecretKey: string;
}): string | undefined;
//# sourceMappingURL=handler.d.ts.map