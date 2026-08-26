/**
 * Interim message payload codec (KaguneX).
 * NOT WhatsApp production protobuf — used until WAProto extraction exists.
 *
 * Wire (versioned):
 *   magic "KXM1" (4) | type u8 | flags u8 | textLen u32be | utf8 text
 */

export const KX_MESSAGE_MAGIC = Buffer.from("KXM1");

export type DecodedKxMessage = {
  type: "text" | "unknown";
  text?: string;
  rawType: number;
};

export function encodeTextMessagePayload(text: string): Buffer {
  const body = Buffer.from(text, "utf-8");
  const out = Buffer.alloc(4 + 1 + 1 + 4 + body.length);
  KX_MESSAGE_MAGIC.copy(out, 0);
  out.writeUInt8(1, 4); // type text
  out.writeUInt8(0, 5); // flags
  out.writeUInt32BE(body.length, 6);
  body.copy(out, 10);
  return out;
}

export function decodeMessagePayload(buf: Buffer): DecodedKxMessage {
  if (buf.length < 10 || !buf.subarray(0, 4).equals(KX_MESSAGE_MAGIC)) {
    return { type: "unknown", rawType: -1 };
  }
  const rawType = buf.readUInt8(4);
  const textLen = buf.readUInt32BE(6);
  if (rawType === 1 && buf.length >= 10 + textLen) {
    return {
      type: "text",
      text: buf.subarray(10, 10 + textLen).toString("utf-8"),
      rawType,
    };
  }
  return { type: "unknown", rawType };
}
