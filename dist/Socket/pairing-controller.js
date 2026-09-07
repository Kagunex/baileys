/**
 * Pairing request controller — stabilizes IQ send / wait / retry.
 *
 * Guarantees:
 *  - one active pairing flow at a time (PAIRING_ALREADY_IN_PROGRESS)
 *  - each attempt has its own IQ id
 *  - response only accepted on exact IQ id match (no "single waiter" fallback)
 *  - sequential retries (attempt N settles before N+1)
 *  - stale responses after timeout/cancel/disconnect are ignored
 *  - full cleanup on success / error / timeout / cancel
 */
import { buildPairingCodeIq, parsePairingPayload, pairingRetryDelayMs, DEFAULT_PAIRING_MAX_ATTEMPTS, DEFAULT_PAIRING_TIMEOUT_MS, } from "../Protocol/pairing.js";
import { normalizePairingPhone, formatPairingCode } from "../Web/pairing.js";
import { generateMessageID } from "../Utils/generics.js";
export function createPairingController(logger) {
    /** At most one active pairing flow */
    let active = null;
    /** Map IQ id → flow for O(1) matching */
    const iqToFlow = new Map();
    const cleanupFlow = (flow) => {
        clearTimeout(flow.overallTimer);
        if (flow.attemptTimer) {
            clearTimeout(flow.attemptTimer);
            flow.attemptTimer = null;
        }
        for (const id of flow.iqIds) {
            iqToFlow.delete(id);
        }
        flow.iqIds.clear();
        flow.activeIqId = null;
        if (active === flow)
            active = null;
    };
    const settleReject = (flow, err) => {
        if (flow.settled)
            return;
        flow.settled = true;
        cleanupFlow(flow);
        flow.reject(err);
    };
    const settleResolve = (flow, code) => {
        if (flow.settled)
            return;
        flow.settled = true;
        cleanupFlow(flow);
        flow.resolve(code);
    };
    const cancelAll = (reason = "pairing cancelled") => {
        if (!active)
            return;
        const flow = active;
        logger?.info({ requestId: flow.requestId, reason, attempt: flow.attempt }, "pairing cancelAll");
        settleReject(flow, new Error(reason));
    };
    /**
     * Only exact IQ-id match may settle the active flow.
     * No fallback for "single waiter" / unsolicited codes.
     */
    const onPayload = (payload) => {
        const parsed = parsePairingPayload(payload);
        if (!parsed.iqId) {
            if (parsed.code || parsed.errorCode) {
                logger?.debug({ hasCode: !!parsed.code, errorCode: parsed.errorCode }, "pairing payload without iqId — ignored (unmatched)");
            }
            return;
        }
        const flow = iqToFlow.get(parsed.iqId);
        if (!flow) {
            logger?.debug({ iqId: parsed.iqId, hasCode: !!parsed.code }, "pairing unmatched response (unknown/stale iqId) — ignored");
            return;
        }
        if (flow.settled) {
            logger?.debug({ iqId: parsed.iqId, requestId: flow.requestId }, "stale pairing response — ignored");
            return;
        }
        // Only the currently active attempt IQ may resolve
        if (flow.activeIqId && flow.activeIqId !== parsed.iqId) {
            logger?.debug({
                iqId: parsed.iqId,
                activeIqId: flow.activeIqId,
                requestId: flow.requestId,
            }, "pairing response for non-active attempt — ignored");
            return;
        }
        if (parsed.errorCode && !parsed.code) {
            logger?.warn({
                requestId: flow.requestId,
                iqId: parsed.iqId,
                attempt: flow.attempt,
                errorCode: parsed.errorCode,
                errorText: parsed.errorText,
            }, "pairing error response");
            settleReject(flow, new Error(`PAIRING FAILED: pairing error ${parsed.errorCode}${parsed.errorText ? `: ${parsed.errorText}` : ""}`));
            return;
        }
        if (parsed.code) {
            const code = parsed.code.includes("-")
                ? parsed.code
                : formatPairingCode(parsed.code);
            logger?.info({
                requestId: flow.requestId,
                iqId: parsed.iqId,
                attempt: flow.attempt,
            }, "pairing code received");
            settleResolve(flow, code);
            return;
        }
        logger?.warn({ requestId: flow.requestId, iqId: parsed.iqId, attempt: flow.attempt }, "UNEXPECTED_PAIRING_RESPONSE — matched IQ without code");
        settleReject(flow, new Error("PAIRING FAILED: UNEXPECTED_PAIRING_RESPONSE"));
    };
    const requestCode = (phoneNumber, opts) => {
        if (!opts?.session || !opts?.send) {
            return Promise.reject(new Error("PAIRING FAILED: session and send are required"));
        }
        if (opts.creds?.registered === true) {
            return Promise.reject(new Error("PAIRING FAILED: already registered — use existing session (do not request pairing code)"));
        }
        if (active && !active.settled) {
            return Promise.reject(new Error("PAIRING_ALREADY_IN_PROGRESS"));
        }
        let phone;
        try {
            phone = normalizePairingPhone(phoneNumber);
        }
        catch (err) {
            return Promise.reject(new Error(`PAIRING FAILED: invalid number — ${err instanceof Error ? err.message : String(err)}`));
        }
        const timeoutMs = opts.timeoutMs ?? DEFAULT_PAIRING_TIMEOUT_MS;
        const maxAttempts = opts.maxAttempts ?? DEFAULT_PAIRING_MAX_ATTEMPTS;
        const requestId = generateMessageID("pair");
        const createdAt = Date.now();
        const overallDeadline = createdAt + timeoutMs;
        return new Promise((resolve, reject) => {
            const overallTimer = setTimeout(() => {
                if (!flow.settled) {
                    logger?.warn({ requestId, attempt: flow.attempt, timeoutMs }, "pairing overall timeout");
                    settleReject(flow, new Error(`PAIRING FAILED: pairing code request timed out after ${timeoutMs}ms`));
                }
            }, timeoutMs);
            const flow = {
                requestId,
                phoneNumber: phone,
                iqIds: new Set(),
                activeIqId: null,
                attempt: 0,
                maxAttempts,
                createdAt,
                overallDeadline,
                resolve,
                reject,
                overallTimer,
                attemptTimer: null,
                settled: false,
            };
            active = flow;
            const keys = opts.creds
                ? {
                    companionEphemeralPub: Buffer.from(opts.creds.pairingEphemeralKeyPair.public),
                    companionAuthPub: Buffer.from(opts.creds.noiseKey.public),
                    platformDisplay: opts.creds.platform
                        ? String(opts.creds.platform)
                        : undefined,
                }
                : undefined;
            /**
             * Sequential attempt runner.
             * Next attempt starts only after previous attempt window elapsed
             * (no parallel IQs).
             */
            const runAttempt = (attempt) => {
                if (flow.settled)
                    return;
                if (Date.now() > flow.overallDeadline) {
                    settleReject(flow, new Error("PAIRING FAILED: pairing code request timed out"));
                    return;
                }
                if (attempt > maxAttempts) {
                    settleReject(flow, new Error(`PAIRING FAILED: pairing code request failed after ${maxAttempts} attempts`));
                    return;
                }
                flow.attempt = attempt;
                const req = buildPairingCodeIq(phone, {
                    keys,
                    attempt,
                });
                flow.iqIds.add(req.id);
                flow.activeIqId = req.id;
                iqToFlow.set(req.id, flow);
                const meta = {
                    requestId,
                    iqId: req.id,
                    phoneNumber: phone,
                    attempt,
                    createdAt: Date.now(),
                    timeoutMs,
                };
                try {
                    opts.send(req.encoded);
                    logger?.info({
                        requestId: meta.requestId,
                        iqId: meta.iqId,
                        phone: meta.phoneNumber,
                        attempt: meta.attempt,
                        maxAttempts,
                    }, "pairing IQ sent");
                }
                catch (err) {
                    logger?.warn({
                        requestId,
                        iqId: req.id,
                        attempt,
                        err: err instanceof Error ? err.message : String(err),
                    }, "pairing IQ send failed");
                    flow.activeIqId = null;
                    if (attempt >= maxAttempts) {
                        settleReject(flow, err instanceof Error
                            ? err
                            : new Error(`PAIRING FAILED: ${String(err)}`));
                        return;
                    }
                    const delay = pairingRetryDelayMs(attempt);
                    flow.attemptTimer = setTimeout(() => {
                        flow.attemptTimer = null;
                        if (!flow.settled)
                            void runAttempt(attempt + 1);
                    }, delay);
                    return;
                }
                // Per-attempt wait window (bounded by overall deadline)
                const remaining = Math.max(0, flow.overallDeadline - Date.now());
                const attemptWindow = Math.min(remaining, Math.max(pairingRetryDelayMs(attempt), 5_000));
                if (attempt < maxAttempts && attemptWindow > 0) {
                    flow.attemptTimer = setTimeout(() => {
                        flow.attemptTimer = null;
                        if (flow.settled)
                            return;
                        logger?.debug({ requestId, iqId: req.id, attempt }, "pairing attempt window elapsed — trying next attempt");
                        // Expire this attempt so a late response is treated as stale
                        flow.activeIqId = null;
                        void runAttempt(attempt + 1);
                    }, attemptWindow);
                }
            };
            void runAttempt(1);
        });
    };
    return {
        onPayload,
        requestCode,
        cancelAll,
        pendingCount: () => (active && !active.settled ? 1 : 0),
        isBusy: () => !!(active && !active.settled),
        isActiveIq: (iqId) => {
            if (!iqId || !active || active.settled)
                return false;
            // Only the currently in-flight attempt may accept a code
            return active.activeIqId === iqId;
        },
    };
}
//# sourceMappingURL=pairing-controller.js.map