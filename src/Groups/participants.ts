import type {
  GroupModificationResponse,
  GroupParticipantAction,
} from "../Types/Groups.js";
import { NotImplementedError } from "../Errors/errors.js";
import { buildGroupParticipantsIq } from "../Protocol/iq.js";
import { parseGroupModification } from "./parse.js";
import type { GroupNet } from "./net.js";
import { sealSend } from "./net.js";

export async function groupParticipantsUpdate(
  jid: string,
  participants: string[],
  action: GroupParticipantAction,
  net?: GroupNet,
): Promise<GroupModificationResponse> {
  if (!net) {
    throw new NotImplementedError("groupParticipantsUpdate (requires authenticated IQ)");
  }
  const { id, encoded } = buildGroupParticipantsIq(jid, participants, action);
  const result = await net.iq.query(encoded, id, {
    session: net.session,
    send: (pt) => sealSend(net, pt),
  }, net.timeoutMs);
  return parseGroupModification(result);
}
