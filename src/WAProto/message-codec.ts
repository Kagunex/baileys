/**
 * Interim KaguneX message envelope (KXM1) used when full WA protobuf
 * is not available. Format is internal and not byte-compatible with
 * production WhatsApp clients.
 *
 * Layout:
 *   magic "KXM1" (4) | type u8 | flags u8 | reserved u16 BE | payload
 * type 1 = text (utf8)
 */

export type DecodedMessagePayload =
  | { type: "text"; text: string }
  | { type: "unknown"; raw: Buffer };

const MAGIC = Buffer.from("KXM1");

export function encodeTextMessagePayload(text: string): Buffer {
  const body = Buffer.from(text, "utf8");
  const header = Buffer.alloc(8);
  MAGIC.copy(header, 0);
  header[4] = 1; // text
  header[5] = 0; // flags
  header.writeUInt16BE(0, 6);
  return Buffer.concat([header, body]);
}

export function decodeMessagePayload(data: Buffer | Uint8Array): DecodedMessagePayload {
  const buf = Buffer.from(data);
  if (buf.length >= 8 && buf.subarray(0, 4).equals(MAGIC)) {
    const type = buf[4];
    const payload = buf.subarray(8);
    if (type === 1) {
      return { type: "text", text: payload.toString("utf8") };
    }
    return { type: "unknown", raw: buf };
  }
  // Fallback: treat entire buffer as utf8 text when short/printable
  try {
    const asText = buf.toString("utf8");
    if (asText.length > 0 && !/[\x00-\x08\x0e-\x1f]/.test(asText.slice(0, 32))) {
      return { type: "text", text: asText };
    }
  } catch {
    /* */
  }
  return { type: "unknown", raw: buf };
}
