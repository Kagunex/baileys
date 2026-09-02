/**
 * Async delay and promise timeout helpers.
 */
export function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
/**
 * Race a promise against a timeout.
 * Rejects with Error(message) when the timer fires first.
 */
export function promiseTimeout(ms, promise, message = "timed out") {
    if (ms <= 0)
        return promise;
    let timer;
    const timeout = new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(message)), ms);
    });
    return Promise.race([promise, timeout]).finally(() => {
        if (timer)
            clearTimeout(timer);
    });
}
//# sourceMappingURL=timeout.js.map