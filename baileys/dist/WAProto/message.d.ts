/**
 * WA Message content codec (KaguneX interim).
 *
 * Uses a minimal protobuf-like encoding for conversation / extendedText
 * so round-trips work inside the library. Not claimed as official WA wire format.
 */
import type { WAMessageContent } from "../Types/Messages.js";
/**
 * Encode WAMessageContent → Buffer.
 * Prefer protobuf-like for text; fall back to KXM1.
 */
export declare function encodeWaMessageContent(content: WAMessageContent): Buffer;
/**
 * Decode Buffer → WAMessageContent.
 */
export declare function decodeWaMessageContent(buf: Buffer | Uint8Array): WAMessageContent;
//# sourceMappingURL=message.d.ts.map