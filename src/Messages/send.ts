/**
 * sendMessage entry — delegates to Message Engine pipeline for true E2E path.
 *
 * Pipeline:
 *  1. generateWAMessage
 *  2. protobuf serialize
 *  3. optional Signal encrypt
 *  4. WABinary <message> node
 *  5. NoiseSession.seal → transport
 *  6. optional server ACK wait
 *  7. messages.upsert (+ messages.update on ACK)
 */

import type {
  AnyMessageContent,
  WAMessage,
  WAMessageSendOptions,
} from "../Types/Messages.js";
import type { EventEmitter } from "../Events/emitter.js";
import type { NoiseSession } from "../Noise/session.js";
import type { SignalSessionState } from "../Signal/session.js";
import { createMessageEngine, type MessageEngineNet } from "./engine.js";

export type SendContext = {
  ev: EventEmitter;
  userJid?: string;
  session?: NoiseSession;
  sendFrame?: (frame: Buffer) => void;
  signalSession?: SignalSessionState;
  onSignalSessionUpdate?: (next: SignalSessionState) => void;
  waitForAck?: boolean;
  /** Reuse engine instance when provided by socket */
  engine?: ReturnType<typeof createMessageEngine>;
};

/**
 * Public send helper used by tests and thin callers.
 * Prefer sock.sendMessage which uses a long-lived engine.
 */
export async function sendMessage(
  jid: string,
  content: AnyMessageContent,
  options: WAMessageSendOptions = {},
  ctx?: SendContext,
): Promise<WAMessage> {
  const engine =
    ctx?.engine ??
    createMessageEngine({
      ev: ctx?.ev as EventEmitter,
      userJid: ctx?.userJid ?? options.userJid,
      waitForAck: ctx?.waitForAck ?? !!ctx?.session,
    });

  if (!ctx?.ev && !ctx?.engine) {
    throw new Error("sendMessage requires ctx.ev or ctx.engine");
  }

  const net: MessageEngineNet | undefined =
    ctx?.session && ctx.sendFrame
      ? { session: ctx.session, sendFrame: ctx.sendFrame }
      : undefined;

  try {
    return await engine.sendMessage(
      jid,
      content,
      { ...options, userJid: options.userJid ?? ctx?.userJid },
      net,
      ctx?.signalSession,
      ctx?.onSignalSessionUpdate,
    );
  } finally {
    // Only dispose ephemeral engines
    if (!ctx?.engine) {
      engine.dispose();
    }
  }
}
