import type { GroupMetadata } from "../Types/Groups.js";
import { NotImplementedError } from "../Errors/errors.js";
import { buildGroupMetadataIq } from "../Protocol/iq.js";
import { parseGroupMetadata } from "./parse.js";
import type { GroupNet } from "./net.js";
import { sealSend } from "./net.js";

export async function groupMetadata(
  jid: string,
  net?: GroupNet,
): Promise<GroupMetadata> {
  if (!net) throw new NotImplementedError("groupMetadata (requires authenticated session)");
  const { id, encoded } = buildGroupMetadataIq(jid);
  const result = await net.iq.query(encoded, id, {
    session: net.session,
    send: (pt) => sealSend(net, pt),
  }, net.timeoutMs);
  const meta = parseGroupMetadata(result);
  if (!meta) throw new Error("groupMetadata: could not parse IQ result");
  return meta;
}
