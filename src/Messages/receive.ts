/**
 * receive path — thin wrapper around Message Engine handlePayload.
 */

import type { WAMessage } from "../Types/Messages.js";
import type { EventEmitter } from "../Events/emitter.js";
import type { SignalSessionState } from "../Signal/session.js";
import type { NoiseSession } from "../Noise/session.js";
import { normalizeMessage } from "./normalize.js";
import {
  parseMessageNode,
  isMessageNodePayload,
} from "../Protocol/message-node.js";
import { createMessageEngine, type MessageEngineNet } from "./engine.js";

export type ReceiveContext = {
  signalSession?: SignalSessionState;
  onSignalSessionUpdate?: (next: SignalSessionState) => void;
  session?: NoiseSession;
  sendFrame?: (frame: Buffer) => void;
  engine?: ReturnType<typeof createMessageEngine>;
};

/**
 * Handle decrypted binary payload from Noise session.
 */
export function handleIncomingPayload(
  payload: Buffer,
  ev: EventEmitter,
  ctx?: ReceiveContext,
): WAMessage | undefined {
  const engine =
    ctx?.engine ??
    createMessageEngine({ ev, waitForAck: false });

  const net: MessageEngineNet | undefined =
    ctx?.session && ctx.sendFrame
      ? { session: ctx.session, sendFrame: ctx.sendFrame }
      : undefined;

  let last: WAMessage | undefined;
  const onUpsert = (u: { messages: WAMessage[] }) => {
    last = u.messages[0];
  };
  ev.on("messages.upsert", onUpsert);
  try {
    engine.handlePayload(
      payload,
      ctx?.signalSession,
      ctx?.onSignalSessionUpdate,
      net,
    );
  } finally {
    ev.off("messages.upsert", onUpsert);
    if (!ctx?.engine) engine.dispose();
  }

  if (last) return last;

  // fallback parse without engine side-effects already done
  if (isMessageNodePayload(payload)) {
    const raw = parseMessageNode(payload);
    if (raw) return normalizeMessage(raw);
  }
  return undefined;
}

export function handleIncomingMessage(
  raw: WAMessage,
  ev: EventEmitter,
): WAMessage {
  const normalized = normalizeMessage(raw);
  ev.emit("messages.upsert", { messages: [normalized], type: "notify" });
  return normalized;
}
