import type { Logger } from "pino";
import type { EventEmitter } from "../Events/emitter.js";
import type { SocketConfig } from "../Types/Socket.js";
import type { InternalSocketState } from "./state.js";
import { WebSocketTransport } from "./transport.js";
import { NoiseSession } from "../Noise/session.js";
export type ConnectionController = {
    start: () => void;
    stop: (error?: Error) => void;
    transport: WebSocketTransport;
    getSession: () => NoiseSession | undefined;
    /** True when Noise handshake completed and client payload has been sent */
    isPairingReady: () => boolean;
    /** Resolves when socket is ready for requestPairingCode (or rejects on close/fail) */
    waitForPairingReady: (timeoutMs?: number) => Promise<void>;
    requestPairingCode: (phoneNumber: string, timeoutMs?: number) => Promise<string>;
    sendPlaintext: (plaintext: Buffer) => void;
    getIq: () => import("./iq-controller.js").IqController;
    setPayloadHandler: (handler: (payload: Buffer) => void) => void;
};
/**
 * Connection lifecycle:
 * WebSocket → Noise XX → client payload → parse server nodes (QR ref if real).
 */
export declare function createConnectionController(config: SocketConfig, state: InternalSocketState, ev: EventEmitter, logger?: Logger): ConnectionController;
//# sourceMappingURL=connection.d.ts.map