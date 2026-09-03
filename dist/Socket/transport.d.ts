/**
 * Single-socket WebSocket transport — no duplicate connections.
 */
import type { Logger } from "pino";
export type TransportHandlers = {
    onOpen?: () => void;
    onClose?: (code: number, reason: string) => void;
    onError?: (err: Error) => void;
    onMessage?: (data: Buffer) => void;
    onPong?: (latencyMs: number) => void;
};
export type TransportOptions = {
    url?: string;
    handshakeTimeoutMs?: number;
    pingIntervalMs?: number;
    pongTimeoutMs?: number;
    maxPayload?: number;
    headers?: Record<string, string>;
};
export declare class WebSocketTransport {
    private ws;
    private readonly logger?;
    private handlers;
    private readonly opts;
    private pingTimer?;
    private pongTimer?;
    private handshakeTimer?;
    private lastPingAt;
    private connecting;
    private intentionalClose;
    /** Socket instance id — ignores events from replaced sockets */
    private socketId;
    constructor(handlers: TransportHandlers, logger?: Logger, opts?: TransportOptions);
    /** Replace handlers (e.g. after reconnect wiring) without leaking old closures incorrectly */
    setHandlers(handlers: TransportHandlers): void;
    connect(url?: string): void;
    send(data: Buffer | Uint8Array): void;
    ping(): void;
    close(code?: number, reason?: string): void;
    terminate(): void;
    get isOpen(): boolean;
    get isConnecting(): boolean;
    get wasIntentionalClose(): boolean;
    get bufferedAmount(): number;
    get currentSocketId(): number;
    private destroySocket;
    private startPingLoop;
    private stopPingLoop;
    private armPongTimeout;
    private clearPongTimer;
    private clearHandshakeTimer;
}
//# sourceMappingURL=transport.d.ts.map