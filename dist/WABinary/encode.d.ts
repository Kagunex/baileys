/**
 * Encode BinaryNode trees to WhatsApp-style binary XML.
 *
 * KaguneX uses a simplified but interoperable encoder:
 *  - list/string/binary tokens
 *  - full UTF-8 for unknown tags/attrs/JIDs
 *  - JID packing for *@s.whatsapp.net / *@g.us
 *
 * This is sufficient for the stanzas built by Protocol/, Groups/, Messages/.
 */
import type { BinaryNode } from "./types.js";
/** Encode a BinaryNode tree to a Buffer. */
export declare function encodeBinaryNode(node: BinaryNode): Buffer;
//# sourceMappingURL=encode.d.ts.map