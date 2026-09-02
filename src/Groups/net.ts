import type { NoiseSession } from "../Noise/session.js";
import type { IqController } from "../Socket/iq-controller.js";

export type GroupNet = {
  session: NoiseSession;
  sendFrame: (frame: Buffer) => void;
  iq: IqController;
  timeoutMs?: number;
};

export function sealSend(net: GroupNet, plaintext: Buffer): void {
  net.sendFrame(net.session.seal(plaintext));
}
