import { NotImplementedError } from "../Errors/errors.js";
import { buildPresenceSubscribe, buildPresenceIq } from "../Protocol/iq.js";
import type { NoiseSession } from "../Noise/session.js";

export type PresenceNet = {
  session: NoiseSession;
  sendFrame: (frame: Buffer) => void;
};

export async function presenceSubscribe(
  jid: string,
  net?: PresenceNet,
): Promise<void> {
  if (!net) throw new NotImplementedError("presenceSubscribe");
  net.sendFrame(net.session.seal(buildPresenceSubscribe(jid).encoded));
}

export async function sendPresenceUpdate(
  type: "available" | "unavailable",
  net?: PresenceNet,
): Promise<void> {
  if (!net) throw new NotImplementedError("sendPresenceUpdate");
  net.sendFrame(net.session.seal(buildPresenceIq(type).encoded));
}
