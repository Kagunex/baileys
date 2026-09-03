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
import type { AnyMessageContent, WAMessage, WAMessageSendOptions } from "../Types/Messages.js";
import type { EventEmitter } from "../Events/emitter.js";
import type { NoiseSession } from "../Noise/session.js";
import type { SignalSessionState } from "../Signal/session.js";
import { createMessageEngine } from "./engine.js";
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
export declare function sendMessage(jid: string, content: AnyMessageContent, options?: WAMessageSendOptions, ctx?: SendContext): Promise<WAMessage>;
//# sourceMappingURL=send.d.ts.map