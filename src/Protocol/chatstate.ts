/**
 * Typing / presence chatstate stanzas.
 */

import type { BinaryNode } from "../WABinary/types.js";
import { encodeBinaryNode } from "../WABinary/encode.js";

export type ChatState =
  | "composing"
  | "paused"
  | "recording"
  | "available"
  | "unavailable";

/** WhatsApp-style chatstate for typing indicators */
export function buildChatstateNode(
  jid: string,
  state: "composing" | "paused" | "recording",
): { encoded: Buffer; node: BinaryNode } {
  const node: BinaryNode = {
    tag: "chatstate",
    attrs: { to: jid },
    content: [{ tag: state, attrs: {} }],
  };
  return { node, encoded: encodeBinaryNode(node) };
}

export function buildPresenceNode(
  type: "available" | "unavailable",
  to?: string,
): { encoded: Buffer; node: BinaryNode } {
  const node: BinaryNode = {
    tag: "presence",
    attrs: {
      type,
      ...(to ? { to } : {}),
    },
  };
  return { node, encoded: encodeBinaryNode(node) };
}
