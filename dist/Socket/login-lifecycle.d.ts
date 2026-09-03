/**
 * Login lifecycle helpers — QR / Pairing / registered session / loggedOut.
 * PRIORITY #1 for KaguneX Baileys.
 */
import type { AuthenticationCreds } from "../Types/Auth.js";
import type { ConnectionUpdate, DisconnectReason } from "../Types/Events.js";
import { type PairingResult } from "../Protocol/pairing.js";
/** WA-style disconnect status codes (public knowledge). */
export declare const DisconnectStatus: {
    readonly loggedOut: 401;
    readonly forbidden: 403;
    readonly timedOut: 408;
    readonly multideviceMismatch: 411;
    readonly connectionReplaced: 440;
    readonly badSession: 500;
    readonly restartRequired: 515;
};
export type LoginMode = "qr" | "pairing" | "registered" | "unknown";
export declare function resolveLoginMode(creds?: AuthenticationCreds): LoginMode;
/**
 * Detect logged-out / fatal stream errors from decrypted payload.
 */
export declare function detectDisconnectFromPayload(payload: Buffer): DisconnectReason | undefined;
export declare function classifyStreamError(code?: string | null, text?: string | null): DisconnectReason;
export type PairSuccessApply = {
    credsPatch: Partial<AuthenticationCreds>;
    connectionUpdate: ConnectionUpdate;
};
/**
 * Apply pair-success / login success onto creds.
 *
 * Requires an explicit pair-success signal AND a valid device identity (JID).
 * A pairing *code* alone must never open the connection.
 * Malformed / incomplete pair-success frames are rejected.
 */
export declare function applyPairSuccess(pairing: PairingResult, existing?: AuthenticationCreds): PairSuccessApply | undefined;
/**
 * Build QR string only when server ref is real + local keys exist.
 */
export declare function buildQrFromServerRef(ref: string, creds: AuthenticationCreds): string | undefined;
/**
 * After successful login, session should reconnect without pairing.
 */
export declare function shouldSkipPairingOnReconnect(creds?: AuthenticationCreds): boolean;
/**
 * Clear registration on logged-out (caller should persist via saveCreds).
 */
export declare function applyLoggedOut(creds: AuthenticationCreds): Partial<AuthenticationCreds>;
//# sourceMappingURL=login-lifecycle.d.ts.map