/**
 * Send retry with exponential backoff.
 */
import { delay } from "../Utils/timeout.js";
export async function withRetry(fn, options = {}) {
    const maxAttempts = options.maxAttempts ?? 3;
    const base = options.baseDelayMs ?? 400;
    const maxDelay = options.maxDelayMs ?? 5000;
    let lastErr;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn(attempt);
        }
        catch (err) {
            lastErr = err;
            if (attempt >= maxAttempts)
                break;
            const wait = Math.min(maxDelay, base * 2 ** (attempt - 1));
            await delay(wait);
        }
    }
    throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}
//# sourceMappingURL=retry.js.map