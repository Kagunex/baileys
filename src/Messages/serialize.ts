/**
 * Proper message serialization / deserialization (JSON-safe + binary protobuf).
 */

import type { WAMessage, WAMessageContent, WAMessageKey } from "../Types/Messages.js";
import { encodeWaMessageContent, decodeWaMessageContent } from "../WAProto/message.js";

export type SerializedWAMessage = {
  key: WAMessageKey;
  messageTimestamp?: number;
  status?: number;
  pushName?: string;
  messageStubType?: number;
  /** base64 protobuf of message content when present */
  messageProto?: string;
  /** structured content mirror for debugging */
  message?: WAMessageContent | null;
};

export function serializeMessage(msg: WAMessage): SerializedWAMessage {
  let messageProto: string | undefined;
  if (msg.message) {
    try {
      messageProto = encodeWaMessageContent(msg.message).toString("base64");
    } catch {
      messageProto = undefined;
    }
  }
  return {
    key: { ...msg.key },
    messageTimestamp: msg.messageTimestamp,
    status: msg.status,
    pushName: msg.pushName,
    messageStubType: msg.messageStubType,
    messageProto,
    message: msg.message ?? null,
  };
}

export function deserializeMessage(data: SerializedWAMessage): WAMessage {
  let message: WAMessageContent | null | undefined = data.message ?? null;
  if (data.messageProto) {
    try {
      message = decodeWaMessageContent(Buffer.from(data.messageProto, "base64"));
    } catch {
      /* keep structured message */
    }
  }
  return {
    key: { ...data.key },
    messageTimestamp: data.messageTimestamp,
    status: data.status,
    pushName: data.pushName,
    messageStubType: data.messageStubType,
    message: message ?? null,
  };
}

/** Binary protobuf only (content body). */
export function serializeMessageContent(content: WAMessageContent): Buffer {
  return encodeWaMessageContent(content);
}

export function deserializeMessageContent(buf: Buffer): WAMessageContent {
  return decodeWaMessageContent(buf);
}
