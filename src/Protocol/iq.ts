import type { BinaryNode } from "../WABinary/types.js";
import { encodeBinaryNode } from "../WABinary/encode.js";
import { generateMessageID } from "../Utils/generics.js";

export function buildIq(opts: {
  to?: string;
  type: "get" | "set";
  xmlns: string;
  content?: BinaryNode | BinaryNode[];
  id?: string;
}): { id: string; node: BinaryNode; encoded: Buffer } {
  const id = opts.id ?? generateMessageID();
  const node: BinaryNode = {
    tag: "iq",
    attrs: {
      id,
      type: opts.type,
      xmlns: opts.xmlns,
      ...(opts.to ? { to: opts.to } : { to: "s.whatsapp.net" }),
    },
    content: opts.content,
  };
  return { id, node, encoded: encodeBinaryNode(node) };
}

export function buildGroupCreateIq(subject: string, participants: string[]) {
  return buildIq({
    type: "set",
    xmlns: "w:g2",
    to: "s.whatsapp.net",
    content: {
      tag: "create",
      attrs: { subject, key: generateMessageID() },
      content: participants.map((jid) => ({
        tag: "participant",
        attrs: { jid },
      })),
    },
  });
}

export function buildGroupMetadataIq(jid: string) {
  return buildIq({
    type: "get",
    xmlns: "w:g2",
    to: jid,
    content: { tag: "query", attrs: { request: "interactive" } },
  });
}

export function buildGroupParticipantsIq(
  jid: string,
  participants: string[],
  action: "add" | "remove" | "promote" | "demote",
) {
  return buildIq({
    type: "set",
    xmlns: "w:g2",
    to: jid,
    content: {
      tag: action,
      attrs: {},
      content: participants.map((p) => ({
        tag: "participant",
        attrs: { jid: p },
      })),
    },
  });
}

export function buildGroupSubjectIq(jid: string, subject: string) {
  return buildIq({
    type: "set",
    xmlns: "w:g2",
    to: jid,
    content: { tag: "subject", attrs: {}, content: subject },
  });
}

export function buildGroupDescriptionIq(jid: string, description?: string) {
  return buildIq({
    type: "set",
    xmlns: "w:g2",
    to: jid,
    content: {
      tag: "description",
      attrs: {},
      content: description
        ? [{ tag: "body", attrs: {}, content: description }]
        : [],
    },
  });
}

export function buildGroupInviteCodeIq(jid: string) {
  return buildIq({
    type: "get",
    xmlns: "w:g2",
    to: jid,
    content: { tag: "invite", attrs: {} },
  });
}

export function buildGroupRevokeInviteIq(jid: string) {
  return buildIq({
    type: "set",
    xmlns: "w:g2",
    to: jid,
    content: { tag: "invite", attrs: {} },
  });
}

export function buildGroupLeaveIq(jid: string) {
  return buildIq({
    type: "set",
    xmlns: "w:g2",
    to: "s.whatsapp.net",
    content: {
      tag: "leave",
      attrs: {},
      content: [{ tag: "group", attrs: { id: jid } }],
    },
  });
}

export function buildPresenceIq(type: "available" | "unavailable") {
  return {
    node: { tag: "presence", attrs: { type } } as BinaryNode,
    encoded: encodeBinaryNode({ tag: "presence", attrs: { type } }),
  };
}

export function buildPresenceSubscribe(jid: string) {
  return {
    encoded: encodeBinaryNode({
      tag: "presence",
      attrs: { type: "subscribe", to: jid },
    }),
  };
}

export function buildOnWhatsAppIq(jids: string[]) {
  return buildIq({
    type: "get",
    xmlns: "usync",
    content: {
      tag: "usync",
      attrs: {
        sid: generateMessageID(),
        mode: "query",
        last: "true",
        context: "interactive",
      },
      content: [
        {
          tag: "query",
          attrs: {},
          content: [{ tag: "contact", attrs: {} }],
        },
        {
          tag: "list",
          attrs: {},
          content: jids.map((jid) => ({
            tag: "user",
            attrs: { jid },
          })),
        },
      ],
    },
  });
}
