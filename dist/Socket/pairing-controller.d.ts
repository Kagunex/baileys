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
import type { Logger } from "pino";
import type { NoiseSession } from "../Noise/session.js";
import type { AuthenticationCreds } from "../Types/Auth.js";
export type PairingSend = (plaintext: Buffer) => void;
/** Structured per-attempt / per-flow pairing request metadata. */
export type PairingRequest = {
    requestId: string;
    iqId: string;
    phoneNumber: string;
    attempt: number;
    createdAt: number;
    timeoutMs: number;
};
export type PairingController = {
    /** Handle decrypted frame; resolve waiters only on exact IQ match */
    onPayload: (payload: Buffer) => void;
    /** Request code with sequential retries until overall timeout */
    requestCode: (phoneNumber: string, opts?: {
        timeoutMs?: number;
        maxAttempts?: number;
        session: NoiseSession;
        send: PairingSend;
        creds?: AuthenticationCreds;
    }) => Promise<string>;
    /** Cancel all pending waiters (disconnect / pair-success / stop) */
    cancelAll: (reason?: string) => void;
    pendingCount: () => number;
    /** True while a pairing flow holds the lock */
    isBusy: () => boolean;
    /**
     * True only when the given IQ id is the currently active attempt
     * of the active (non-settled) pairing flow.
     * Used by connection layer so pairingCode is never saved from
     * wrong / stale / unsolicited IQ responses.
     */
    isActiveIq: (iqId: string | undefined | null) => boolean;
};
export declare function createPairingController(logger?: Logger): PairingController;
//# sourceMappingURL=pairing-controller.d.ts.map