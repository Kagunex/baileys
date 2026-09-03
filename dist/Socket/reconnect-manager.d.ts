/**
 * Single-flight reconnect manager — no duplicate sockets, backoff, reason handling.
 */
import type { Logger } from "pino";
import type { DisconnectReason } from "../Types/Events.js";
import { type ReconnectOptions } from "./reconnect.js";
export type ReconnectDecision = {
    should: boolean;
    delayMs: number;
    reason: string;
};
export type ReconnectManager = {
    /** Monotonic generation — increments each new connection attempt */
    readonly generation: number;
    readonly attempt: number;
    readonly isReconnecting: boolean;
    /** Call before opening a new WS — returns generation for this attempt */
    beginConnect: () => number;
    /** Mark current generation as successfully open (resets attempt) */
    markOpen: (generation: number) => void;
    /** Evaluate close and schedule reconnect if appropriate */
    onClose: (generation: number, opts: {
        intentional: boolean;
        stopped: boolean;
        disconnect?: DisconnectReason;
        code?: number;
        reasonText?: string;
    }) => ReconnectDecision;
    /** Wait backoff for current attempt (call after onClose if should) */
    waitBackoff: () => Promise<number>;
    /** Invalidate all pending reconnects (stop / logout) */
    cancel: () => void;
    /** True if gen is still the active connection generation */
    isCurrent: (generation: number) => boolean;
};
export declare function createReconnectManager(logger?: Logger, options?: ReconnectOptions): ReconnectManager;
//# sourceMappingURL=reconnect-manager.d.ts.map