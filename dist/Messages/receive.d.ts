/**
 * receive path — thin wrapper around Message Engine handlePayload.
 */
import type { WAMessage } from "../Types/Messages.js";
import type { EventEmitter } from "../Events/emitter.js";
import type { SignalSessionState } from "../Signal/session.js";
import type { NoiseSession } from "../Noise/session.js";
import { createMessageEngine } from "./engine.js";
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
export declare function handleIncomingPayload(payload: Buffer, ev: EventEmitter, ctx?: ReceiveContext): WAMessage | undefined;
export declare function handleIncomingMessage(raw: WAMessage, ev: EventEmitter): WAMessage;
//# sourceMappingURL=receive.d.ts.map