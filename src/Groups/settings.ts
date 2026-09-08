import { NotImplementedError } from "../Errors/errors.js";
import {
  buildGroupSubjectIq,
  buildGroupDescriptionIq,
  buildGroupInviteCodeIq,
  buildGroupRevokeInviteIq,
  buildGroupLeaveIq,
} from "../Protocol/iq.js";
import { parseInviteCode } from "./parse.js";
import type { GroupNet } from "./net.js";
import { sealSend } from "./net.js";

export async function groupUpdateSubject(
  jid: string,
  subject: string,
  net?: GroupNet,
): Promise<void> {
  if (!net) throw new NotImplementedError("groupUpdateSubject");
  const { id, encoded } = buildGroupSubjectIq(jid, subject);
  await net.iq.query(encoded, id, {
    session: net.session,
    send: (pt) => sealSend(net, pt),
  }, net.timeoutMs);
}

export async function groupUpdateDescription(
  jid: string,
  description?: string,
  net?: GroupNet,
): Promise<void> {
  if (!net) throw new NotImplementedError("groupUpdateDescription");
  const { id, encoded } = buildGroupDescriptionIq(jid, description);
  await net.iq.query(encoded, id, {
    session: net.session,
    send: (pt) => sealSend(net, pt),
  }, net.timeoutMs);
}

export async function groupInviteCode(jid: string, net?: GroupNet): Promise<string> {
  if (!net) throw new NotImplementedError("groupInviteCode");
  const { id, encoded } = buildGroupInviteCodeIq(jid);
  const result = await net.iq.query(encoded, id, {
    session: net.session,
    send: (pt) => sealSend(net, pt),
  }, net.timeoutMs);
  const code = parseInviteCode(result);
  if (!code) throw new Error("groupInviteCode: no code in response");
  return code;
}

export async function groupRevokeInvite(jid: string, net?: GroupNet): Promise<string> {
  if (!net) throw new NotImplementedError("groupRevokeInvite");
  const { id, encoded } = buildGroupRevokeInviteIq(jid);
  const result = await net.iq.query(encoded, id, {
    session: net.session,
    send: (pt) => sealSend(net, pt),
  }, net.timeoutMs);
  return parseInviteCode(result) || "";
}

export async function groupLeave(jid: string, net?: GroupNet): Promise<void> {
  if (!net) throw new NotImplementedError("groupLeave");
  const { id, encoded } = buildGroupLeaveIq(jid);
  await net.iq.query(encoded, id, {
    session: net.session,
    send: (pt) => sealSend(net, pt),
  }, net.timeoutMs);
}
