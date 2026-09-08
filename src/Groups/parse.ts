/**
 * Parse group IQ result nodes into GroupMetadata / modification responses.
 */

import type { BinaryNode } from "../WABinary/types.js";
import {
  getBinaryNodeAttr,
  getBinaryNodeChild,
  getBinaryNodeChildren,
} from "../WABinary/index.js";
import type {
  GroupMetadata,
  GroupParticipant,
  GroupModificationResponse,
} from "../Types/Groups.js";

export function parseGroupMetadata(node: BinaryNode): GroupMetadata | undefined {
  // iq > group | iq > groups > group
  let group =
    getBinaryNodeChild(node, "group") ||
    getBinaryNodeChild(getBinaryNodeChild(node, "groups") || node, "group");

  // sometimes the node itself is group
  if (!group && node.tag === "group") group = node;
  if (!group) return undefined;

  const id =
    getBinaryNodeAttr(group, "id") ||
    getBinaryNodeAttr(group, "jid") ||
    "";
  const subject = getBinaryNodeAttr(group, "subject") || "";

  const participants: GroupParticipant[] = [];
  for (const p of getBinaryNodeChildren(group, "participant")) {
    const pid = getBinaryNodeAttr(p, "jid") || getBinaryNodeAttr(p, "id");
    if (!pid) continue;
    const type = getBinaryNodeAttr(p, "type") || getBinaryNodeAttr(p, "admin");
    let admin: GroupParticipant["admin"] = null;
    if (type === "admin" || type === "superadmin") admin = type;
    participants.push({ id: pid, admin });
  }

  const descNode = getBinaryNodeChild(group, "description");
  const desc =
    (descNode && typeof descNode.content === "string" && descNode.content) ||
    getBinaryNodeAttr(group, "desc") ||
    undefined;

  return {
    id: id.includes("@") ? id : `${id}@g.us`,
    subject,
    subjectOwner: getBinaryNodeAttr(group, "s_o") || undefined,
    subjectTime: numAttr(group, "s_t"),
    creation: numAttr(group, "creation"),
    owner: getBinaryNodeAttr(group, "creator") || undefined,
    desc,
    descOwner: getBinaryNodeAttr(group, "desc_owner") || undefined,
    descId: getBinaryNodeAttr(group, "desc_id") || undefined,
    restrict: getBinaryNodeAttr(group, "locked") === "true",
    announce: getBinaryNodeAttr(group, "announcement") === "true",
    participants,
    size: participants.length || numAttr(group, "size"),
    ephemeralDuration: numAttr(group, "ephemeral"),
  };
}

function numAttr(node: BinaryNode, name: string): number | undefined {
  const v = getBinaryNodeAttr(node, name);
  if (v == null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export function parseGroupCreateResult(node: BinaryNode): GroupMetadata | undefined {
  return parseGroupMetadata(node);
}

export function parseGroupModification(node: BinaryNode): GroupModificationResponse {
  const participants: GroupModificationResponse["participants"] = [];
  for (const p of getBinaryNodeChildren(node, "participant")) {
    const jid = getBinaryNodeAttr(p, "jid");
    if (!jid) continue;
    participants.push({
      jid,
      status: getBinaryNodeAttr(p, "error") || getBinaryNodeAttr(p, "code") || "200",
    });
  }
  return {
    status: getBinaryNodeAttr(node, "type") === "error" ? "error" : "ok",
    jid: getBinaryNodeAttr(node, "from"),
    participants,
  };
}

export function parseInviteCode(node: BinaryNode): string | undefined {
  const invite =
    getBinaryNodeChild(node, "invite") ||
    getBinaryNodeChild(getBinaryNodeChild(node, "group") || node, "invite");
  if (!invite) return getBinaryNodeAttr(node, "code");
  return getBinaryNodeAttr(invite, "code");
}
