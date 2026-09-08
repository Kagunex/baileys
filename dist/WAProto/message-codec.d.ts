/**
 * Interim KaguneX message envelope (KXM1) used when full WA protobuf
 * is not available. Format is internal and not byte-compatible with
 * production WhatsApp clients.
 *
 * Layout:
 *   magic "KXM1" (4) | type u8 | flags u8 | reserved u16 BE | payload
 * type 1 = text (utf8)
 */
export type DecodedMessagePayload = {
    type: "text";
    text: string;
} | {
    type: "unknown";
    raw: Buffer;
};
export declare function encodeTextMessagePayload(text: string): Buffer;
export declare function decodeMessagePayload(data: Buffer | Uint8Array): DecodedMessagePayload;
//# sourceMappingURL=message-codec.d.ts.map