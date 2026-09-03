export * from "./crypto.js";
export * from "./keys.js";
export * from "./store.js";
export { initSessionAsInitiator, initSessionAsResponder, establishSessions, signalEncrypt, signalDecrypt, serializeSession, deserializeSession, encryptSignalMessage, decryptSignalMessage, SignalSessionManager, type SignalSessionState, type SignalCiphertext, type SignalAddress, type PreKeyBundle, } from "./session.js";
export { encodeSignalWire, decodeSignalWire, wrapEncryptedBody, unwrapEncryptedBody, SIGNAL_WIRE_MAGIC, } from "./wire.js";
export { generateAndStorePreKeys, rotateSignedPreKey, shouldRotateSignedPreKey, ensurePreKeyPool, takePreKey, signPreKey, verifySignedPreKeyLocal, } from "./prekeys.js";
export { getDeviceIdentity, upsertRemoteIdentity, findRemoteIdentity, rotateDeviceIdentity, } from "./identity.js";
export { loadSession, saveSession, deleteSession, sessionAddressKey, listSessionIds, } from "./session-store.js";
export { migrateSignalStore, loadStoreMeta, saveStoreMeta, SIGNAL_STORE_VERSION, } from "./migration.js";
export { loadSessionHealthy, validateSessionBytes, purgeSessions, } from "./recovery.js";
//# sourceMappingURL=index.d.ts.map