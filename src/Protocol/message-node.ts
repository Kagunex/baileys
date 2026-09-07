/**
 * Message stanza builders/parsers — protobuf Message content when possible.
 */

import type { BinaryNode } from "../WABinary/types.js";
import { encodeBinaryNode } from "../WABinary/encode.js";
import { decodeBinaryNode } from "../WABinary/decode.js";
import { getBinaryNodeAttr, getBinaryNodeChild } from "../WABinary/index.js";
import { encodeWaMessageContent, decodeWaMessageContent } from "../WAProto/message.js";
import {
  decodeMessagePayload,
  encodeTextMessagePayload,
} from "../WAProto/message-codec.js";
import { generateMessageID } from "../Utils/generics.js";
import type { WAMessage, WAMessageContent } from "../Types/Messages.js";

export function buildMessageNode(opts: {
  to: string;
  content: WAMessageContent;
  id?: string;
  participant?: string;
  /** raw body override (e.g. signal-encrypted) */
  body?: Buffer;
}): { id: string; node: BinaryNode; encoded: Buffer } {
  const id = opts.id ?? generateMessageID();
  const body = opts.body ?? encodeWaMessageContent(opts.content);
  const attrs: Record<string, string> = {
    to: opts.to,
    id,
    type: "text",
  };
  if (opts.participant) attrs.participant = opts.participant;

  const node: BinaryNode = {
    tag: "message",
    attrs,
    content: body,
  };
  return { id, node, encoded: encodeBinaryNode(node) };
}

export function buildTextMessageNode(opts: {
  to: string;
  text: string;
  id?: string;
  participant?: string;
}): { id: string; node: BinaryNode; encoded: Buffer } {
  return buildMessageNode({
    to: opts.to,
    id: opts.id,
    participant: opts.participant,
    content: { conversation: opts.text },
  });
}

function decodeBodyToContent(body: Buffer): WAMessageContent | undefined {
  // Prefer protobuf Message
  try {
    const content = decodeWaMessageContent(body);
    if (
      content.conversation ||
      content.extendedTextMessage ||
      content.imageMessage ||
      content.reactionMessage ||
      content.protocolMessage
    ) {
      return content;
    }
  } catch {
    /* fall through */
  }
  // Legacy KXM1
  const legacy = decodeMessagePayload(body);
  if (legacy.type === "text" && legacy.text) {
    return { conversation: legacy.text };
  }
  return undefined;
}

export function parseMessageNode(payload: Buffer): WAMessage | undefined {
  try {
    const node = decodeBinaryNode(payload);
    if (node.tag !== "message") return undefined;
    const remoteJid =
      getBinaryNodeAttr(node, "from") || getBinaryNodeAttr(node, "to") || "";
    const id = getBinaryNodeAttr(node, "id") || "";
    const participant = getBinaryNodeAttr(node, "participant");
    const fromMe = getBinaryNodeAttr(node, "fromMe") === "true";

    let message: WAMessageContent | undefined;
    if (Buffer.isBuffer(node.content) || node.content instanceof Uint8Array) {
      message = decodeBodyToContent(Buffer.from(node.content));
    } else if (typeof node.content === "string") {
      message = { conversation: node.content };
    } else {
      const body = getBinaryNodeChild(node, "body");
      if (body && typeof body.content === "string") {
        message = { conversation: body.content };
      }
    }

    return {
      key: { remoteJid, id, fromMe, participant },
      message: message ?? null,
      messageTimestamp: Math.floor(Date.now() / 1000),
    };
  } catch {
    return undefined;
  }
}

export function isMessageNodePayload(payload: Buffer): boolean {
  try {
    return decodeBinaryNode(payload).tag === "message";
  } catch {
    return false;
  }
}

/** @deprecated use protobuf path; kept for tests */
export { encodeTextMessagePayload };
