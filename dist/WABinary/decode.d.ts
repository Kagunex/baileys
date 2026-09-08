/**
 * Decode WhatsApp-style binary XML into BinaryNode trees.
 * Compatible with the KaguneX encoder and typical WA list/string/binary tokens.
 */
import type { BinaryNode } from "./types.js";
/** Decode a single BinaryNode from a buffer. */
export declare function decodeBinaryNode(data: Buffer | Uint8Array): BinaryNode;
//# sourceMappingURL=decode.d.ts.map