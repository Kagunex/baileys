/**
 * Reconnect backoff with full jitter (AWS-style).
 * delay = random(0, min(cap, base * 2^attempt))
 */
export type ReconnectOptions = {
    maxRetries?: number;
    baseDelayMs?: number;
    maxDelayMs?: number;
    /** 0 = no jitter (pure exponential), 1 = full jitter */
    jitter?: number;
};
export declare const DEFAULT_RECONNECT: Required<ReconnectOptions>;
/** Compute delay for attempt (0-based). */
export declare function computeReconnectDelayMs(attempt: number, options?: ReconnectOptions): number;
export declare function waitForReconnectBackoff(attempt: number, options?: ReconnectOptions): Promise<number>;
/** Whether another reconnect should be attempted (attempt is 0-based count so far). */
export declare function shouldReconnect(attempt: number, intentionalClose: boolean, options?: ReconnectOptions): boolean;
//# sourceMappingURL=reconnect.d.ts.map