/**
 * Generic IQ request/response waiter over Noise session.
 */

import type { Logger } from "pino";
import { decodeBinaryNode } from "../WABinary/decode.js";
import { getBinaryNodeAttr } from "../WABinary/index.js";
import type { BinaryNode } from "../WABinary/types.js";
import type { NoiseSession } from "../Noise/session.js";

export type IqNet = {
  session: NoiseSession;
  send: (plaintext: Buffer) => void;
};

type Waiter = {
  id: string;
  resolve: (node: BinaryNode) => void;
  reject: (err: Error) => void;
  timer: ReturnType<typeof setTimeout>;
};

export type IqController = {
  onPayload: (payload: Buffer) => void;
  query: (
    encodedIq: Buffer,
    iqId: string,
    net: IqNet,
    timeoutMs?: number,
  ) => Promise<BinaryNode>;
  cancelAll: (reason?: string) => void;
};

export function createIqController(logger?: Logger): IqController {
  const waiters = new Map<string, Waiter>();

  const cancelAll = (reason = "iq cancelled") => {
    for (const [, w] of waiters) {
      clearTimeout(w.timer);
      w.reject(new Error(reason));
    }
    waiters.clear();
  };

  const onPayload = (payload: Buffer) => {
    try {
      const node = decodeBinaryNode(payload);
      if (node.tag !== "iq") return;
      const id = getBinaryNodeAttr(node, "id");
      if (!id) return;
      const w = waiters.get(id);
      if (!w) return;
      clearTimeout(w.timer);
      waiters.delete(id);
      const type = getBinaryNodeAttr(node, "type");
      if (type === "error") {
        const code = getBinaryNodeAttr(node, "code") || "iq_error";
        w.reject(new Error(`IQ error ${code}`));
      } else {
        w.resolve(node);
      }
    } catch {
      /* ignore */
    }
  };

  const query: IqController["query"] = (encodedIq, iqId, net, timeoutMs = 30_000) => {
    return new Promise<BinaryNode>((resolve, reject) => {
      const timer = setTimeout(() => {
        waiters.delete(iqId);
        reject(new Error(`IQ timeout id=${iqId}`));
      }, timeoutMs);
      waiters.set(iqId, { id: iqId, resolve, reject, timer });
      try {
        net.send(encodedIq);
        logger?.debug({ id: iqId }, "IQ sent");
      } catch (err) {
        clearTimeout(timer);
        waiters.delete(iqId);
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    });
  };

  return { onPayload, query, cancelAll };
}
