import { NotImplementedError } from "../Errors/errors.js";
import { buildOnWhatsAppIq } from "../Protocol/iq.js";
import type { NoiseSession } from "../Noise/session.js";
import type { IqController } from "../Socket/iq-controller.js";
import { decodeBinaryNode } from "../WABinary/decode.js";
import {
  getBinaryNodeAttr,
  getBinaryNodeChild,
  getBinaryNodeChildren,
} from "../WABinary/index.js";

export type ContactNet = {
  session: NoiseSession;
  sendFrame: (frame: Buffer) => void;
  iq: IqController;
};

export async function onWhatsApp(
  jids: string[],
  net?: ContactNet,
): Promise<Array<{ jid: string; exists: boolean } | undefined>> {
  if (!net) throw new NotImplementedError("onWhatsApp (requires authenticated query)");
  const { id, encoded } = buildOnWhatsAppIq(jids);
  const result = await net.iq.query(encoded, id, {
    session: net.session,
    send: (pt) => net.sendFrame(net.session.seal(pt)),
  });
  // Best-effort parse usync list
  const out: Array<{ jid: string; exists: boolean } | undefined> = [];
  try {
    const list =
      getBinaryNodeChild(result, "list") ||
      getBinaryNodeChild(getBinaryNodeChild(result, "usync") || result, "list");
    const users = list ? getBinaryNodeChildren(list, "user") : getBinaryNodeChildren(result, "user");
    for (const u of users) {
      const jid = getBinaryNodeAttr(u, "jid");
      if (!jid) continue;
      const contact = getBinaryNodeChild(u, "contact");
      const type = contact ? getBinaryNodeAttr(contact, "type") : undefined;
      out.push({ jid, exists: type !== "out" && type !== "invalid" });
    }
  } catch {
    /* empty */
  }
  if (!out.length) {
    // fallback: unknown existence
    return jids.map((jid) => ({ jid, exists: false }));
  }
  return out;
}

export async function fetchStatus(
  _jid: string,
): Promise<{ status?: string; setAt?: Date } | undefined> {
  throw new NotImplementedError("fetchStatus");
}
