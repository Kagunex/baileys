/**
 * Message Engine — full client-side E2E pipeline:
 * generate → protobuf → (optional Signal) → WABinary node → Noise seal → send
 * receive: Noise open → receipt/ACK | message node → decrypt → upsert
 */
import type { Logger } from "pino";
import type { EventEmitter } from "../Events/emitter.js";
import type { AnyMessageContent, WAMessage, WAMessageKey, WAMessageSendOptions } from "../Types/Messages.js";
import type { NoiseSession } from "../Noise/session.js";
import type { SignalSessionState } from "../Signal/session.js";
import { MessageDeduper } from "./dedup.js";
import { AckWaiter } from "./ack.js";
export type MessageEngineNet = {
    session: NoiseSession;
    sendFrame: (frame: Buffer) => void;
};
export type MessageEngineOptions = {
    ev: EventEmitter;
    userJid?: string;
    logger?: Logger;
    waitForAck?: boolean;
    ackTimeoutMs?: number;
    maxSendAttempts?: number;
};
export type MessageEngine = {
    sendMessage: (jid: string, content: AnyMessageContent, options?: WAMessageSendOptions, net?: MessageEngineNet, signalSession?: SignalSessionState, onSignalUpdate?: (s: SignalSessionState) => void) => Promise<WAMessage>;
    handlePayload: (payload: Buffer, signalSession?: SignalSessionState, onSignalUpdate?: (s: SignalSessionState) => void, net?: MessageEngineNet) => void;
    sendReaction: (key: WAMessageKey, text: string, net?: MessageEngineNet) => Promise<WAMessage>;
    sendRevoke: (key: WAMessageKey, net?: MessageEngineNet) => Promise<WAMessage>;
    sendEdit: (key: WAMessageKey, newText: string, net?: MessageEngineNet) => Promise<WAMessage>;
    /** Encode message body exactly as it would go on the wire (pre-Noise). */
    buildOutboundFrame: (jid: string, msg: WAMessage, signalSession?: SignalSessionState, onSignalUpdate?: (s: SignalSessionState) => void) => {
        nodeEncoded: Buffer;
        msg: WAMessage;
    };
    deduper: MessageDeduper;
    acks: AckWaiter;
    dispose: () => void;
};
export declare function createMessageEngine(opts: MessageEngineOptions): MessageEngine;
//# sourceMappingURL=engine.d.ts.map