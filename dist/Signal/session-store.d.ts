/**
 * High-level Signal session persistence on top of SignalKeyStore.
 */
import type { SignalKeyStore } from "../Types/Auth.js";
import { type SignalSessionState } from "./session.js";
export declare function sessionAddressKey(name: string, deviceId?: number): string;
export declare function loadSession(keys: SignalKeyStore, name: string, deviceId?: number): Promise<SignalSessionState | undefined>;
export declare function saveSession(keys: SignalKeyStore, session: SignalSessionState, deviceId?: number): Promise<void>;
export declare function deleteSession(keys: SignalKeyStore, name: string, deviceId?: number): Promise<void>;
export declare function listSessionIds(keys: SignalKeyStore, ids: string[]): Promise<string[]>;
//# sourceMappingURL=session-store.d.ts.map