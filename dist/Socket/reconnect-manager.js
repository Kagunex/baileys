/**
 * Single-flight reconnect manager — no duplicate sockets, backoff, reason handling.
 */
import { computeReconnectDelayMs, shouldReconnect, DEFAULT_RECONNECT, } from "./reconnect.js";
import { DisconnectStatus } from "./login-lifecycle.js";
import { delay } from "../Utils/timeout.js";
export function createReconnectManager(logger, options = {}) {
    const opts = { ...DEFAULT_RECONNECT, ...options };
    let generation = 0;
    let attempt = 0;
    let isReconnecting = false;
    let cancelled = false;
    let reconnectToken = 0;
    const mapWsCode = (code, reasonText) => {
        if (code === 1000 && !reasonText)
            return undefined;
        if (code === 1006) {
            return {
                code: 1006,
                statusCode: DisconnectStatus.timedOut,
                message: reasonText || "abnormal closure / network drop",
                isLoggedOut: false,
            };
        }
        if (code === 1001) {
            return {
                code: 1001,
                message: reasonText || "going away",
                isLoggedOut: false,
            };
        }
        return undefined;
    };
    return {
        get generation() {
            return generation;
        },
        get attempt() {
            return attempt;
        },
        get isReconnecting() {
            return isReconnecting;
        },
        beginConnect() {
            cancelled = false;
            generation += 1;
            isReconnecting = false;
            logger?.debug({ generation }, "beginConnect");
            return generation;
        },
        markOpen(gen) {
            if (gen !== generation) {
                logger?.debug({ gen, generation }, "markOpen ignored — stale generation");
                return;
            }
            attempt = 0;
            isReconnecting = false;
            logger?.debug({ generation }, "connection open — reconnect attempt reset");
        },
        onClose(gen, closeOpts) {
            if (gen !== generation) {
                return { should: false, delayMs: 0, reason: "stale generation" };
            }
            if (closeOpts.stopped || closeOpts.intentional || cancelled) {
                isReconnecting = false;
                return { should: false, delayMs: 0, reason: "intentional/stopped" };
            }
            const disc = closeOpts.disconnect ||
                mapWsCode(closeOpts.code, closeOpts.reasonText);
            // Never auto-reconnect after logout
            if (disc?.isLoggedOut) {
                isReconnecting = false;
                return { should: false, delayMs: 0, reason: "logged out" };
            }
            // 401/logged out status codes
            if (disc?.statusCode === DisconnectStatus.loggedOut ||
                disc?.statusCode === DisconnectStatus.forbidden) {
                isReconnecting = false;
                return { should: false, delayMs: 0, reason: `fatal ${disc.statusCode}` };
            }
            if (!shouldReconnect(attempt, false, opts)) {
                isReconnecting = false;
                return { should: false, delayMs: 0, reason: "max retries" };
            }
            const delayMs = computeReconnectDelayMs(attempt, opts);
            isReconnecting = true;
            logger?.info({
                generation,
                attempt,
                delayMs,
                code: closeOpts.code,
                disc,
            }, "reconnect scheduled");
            return {
                should: true,
                delayMs,
                reason: disc?.message || closeOpts.reasonText || `ws ${closeOpts.code}`,
            };
        },
        async waitBackoff() {
            const token = ++reconnectToken;
            const delayMs = computeReconnectDelayMs(attempt, opts);
            attempt += 1;
            await delay(delayMs);
            if (cancelled || token !== reconnectToken) {
                return -1;
            }
            return delayMs;
        },
        cancel() {
            cancelled = true;
            isReconnecting = false;
            reconnectToken += 1;
        },
        isCurrent(gen) {
            return gen === generation && !cancelled;
        },
    };
}
//# sourceMappingURL=reconnect-manager.js.map