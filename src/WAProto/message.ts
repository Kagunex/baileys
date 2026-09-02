/**
 * WA Message content codec (KaguneX interim).
 *
 * Uses a minimal protobuf-like encoding for conversation / extendedText
 * so round-trips work inside the library. Not claimed as official WA wire format.
 */

import type { WAMessageContent } from "../Types/Messages.js";
import { encodeBytes, encodeString, encodeVarint, readFields, fieldBytes, fieldString } from "./protobuf.js";
import { encodeTextMessagePayload, decodeMessagePayload } from "./message-codec.js";

/**
 * Encode WAMessageContent → Buffer.
 * Prefer protobuf-like for text; fall back to KXM1.
 */
export function encodeWaMessageContent(content: WAMessageContent): Buffer {
  if (content.conversation) {
    // field 1 = conversation (string)
    return encodeString(1, content.conversation);
  }
  if (content.extendedTextMessage?.text) {
    // field 6 = extendedTextMessage { text = 1 }
    const inner = encodeString(1, content.extendedTextMessage.text);
    return encodeBytes(6, inner);
  }
  if (content.reactionMessage) {
    const parts: Buffer[] = [];
    if (content.reactionMessage.key?.id) {
      const keyParts: Buffer[] = [];
      if (content.reactionMessage.key.remoteJid) {
        keyParts.push(encodeString(1, content.reactionMessage.key.remoteJid));
      }
      if (content.reactionMessage.key.fromMe != null) {
        keyParts.push(encodeVarint(2, content.reactionMessage.key.fromMe ? 1 : 0));
      }
      keyParts.push(encodeString(3, content.reactionMessage.key.id));
      parts.push(encodeBytes(1, Buffer.concat(keyParts)));
    }
    if (content.reactionMessage.text != null) {
      parts.push(encodeString(2, content.reactionMessage.text));
    }
    return encodeBytes(46, Buffer.concat(parts)); // reactionMessage field number (approx)
  }
  // Fallback KXM1
  const text =
    content.conversation ||
    content.extendedTextMessage?.text ||
    "";
  return encodeTextMessagePayload(text);
}

/**
 * Decode Buffer → WAMessageContent.
 */
export function decodeWaMessageContent(buf: Buffer | Uint8Array): WAMessageContent {
  const data = Buffer.from(buf);
  try {
    const fields = readFields(data);
    const conversation = fieldString(fields, 1);
    if (conversation) return { conversation };

    const ext = fieldBytes(fields, 6);
    if (ext) {
      const inner = readFields(ext);
      const text = fieldString(inner, 1);
      if (text) return { extendedTextMessage: { text } };
    }

    const reaction = fieldBytes(fields, 46);
    if (reaction) {
      const inner = readFields(reaction);
      const keyBuf = fieldBytes(inner, 1);
      const text = fieldString(inner, 2) ?? "";
      let key: { remoteJid?: string; fromMe?: boolean; id?: string } | undefined;
      if (keyBuf) {
        const kf = readFields(keyBuf);
        key = {
          remoteJid: fieldString(kf, 1),
          fromMe: fieldString(kf, 2) != null ? false : undefined,
          id: fieldString(kf, 3),
        };
      }
      return { reactionMessage: { key, text } };
    }
  } catch {
    /* fall through to legacy */
  }

  const legacy = decodeMessagePayload(data);
  if (legacy.type === "text") {
    return { conversation: legacy.text };
  }
  return {};
}
