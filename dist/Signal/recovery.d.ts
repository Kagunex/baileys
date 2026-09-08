/**
 * Recovery when session data is corrupt.
 */
import type { SignalKeyStore } from "../Types/Auth.js";
import { type SignalSessionState } from "./session.js";
export type SessionHealth = {
    ok: true;
    session: SignalSessionState;
} | {
    ok: false;
    reason: string;
    recovered: boolean;
};
/**
 * Load session; if corrupt, delete and report recovered.
 */
export declare function loadSessionHealthy(keys: SignalKeyStore, name: string, deviceId?: number): Promise<SessionHealth>;
/** Validate serialized session bytes without loading into store */
export declare function validateSessionBytes(data: Uint8Array): boolean;
/**
 * Remove all sessions matching prefix (e.g. after identity rotation).
 */
export declare function purgeSessions(keys: SignalKeyStore, ids: string[]): Promise<number>;
//# sourceMappingURL=recovery.d.ts.map