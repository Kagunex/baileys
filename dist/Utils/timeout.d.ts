/**
 * Async delay and promise timeout helpers.
 */
export declare function delay(ms: number): Promise<void>;
/**
 * Race a promise against a timeout.
 * Rejects with Error(message) when the timer fires first.
 */
export declare function promiseTimeout<T>(ms: number, promise: Promise<T>, message?: string): Promise<T>;
//# sourceMappingURL=timeout.d.ts.map