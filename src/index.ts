export { default, makeWASocket } from "./Socket/index.js";
export {
  useMultiFileAuthState,
  initAuthCreds,
  makeCacheableSignalKeyStore,
  loadSessionMeta,
  saveSessionMeta,
} from "./Auth/index.js";
export { EventEmitter } from "./Events/index.js";
export * from "./Errors/index.js";
export * from "./Types/index.js";
export { DisconnectReason } from "./Types/DisconnectReason.js";
export * from "./WABinary/index.js";
export * from "./Utils/generics.js";
export { delay, promiseTimeout } from "./Utils/timeout.js";
export { encryptMedia, decryptMedia, downloadMediaMessage, uploadMedia } from "./Media/index.js";
export {
  generateWAMessage,
  generateWAMessageFromContent,
  normalizeMessage,
  extractMessageText,
  getMessageType,
  handleIncomingPayload,
  createMessageEngine,
  serializeMessage,
  deserializeMessage,
  serializeMessageContent,
  deserializeMessageContent,
  MessageDeduper,
  parseReceiptNode,
} from "./Messages/index.js";
export {
  DEFAULT_BROWSER,
  DEFAULT_VERSION,
  WA_WEB_SOCKET_URL,
  NOISE_MODE,
} from "./Defaults/index.js";
export { printQRInTerminal, normalizePairingPhone, formatPairingCode } from "./Web/index.js";
export {
  createNoiseInitiator,
  createNoiseResponder,
  noiseEncrypt,
  noiseDecrypt,
  generateX25519KeyPair,
  NoiseSession,
  validateNoiseCertificate,
  parseNoiseCertificate,
  startWaNoiseHandshake,
  continueWaNoiseHandshake,
  NOISE_PROTOCOL_NAME,
} from "./Noise/index.js";
export {
  buildClientPayloadNode,
  encodeClientPayload,
  parseProtocolPayload,
  composeQrPayload,
  buildPairingCodeIq,
  extractPairingCode,
  buildTextMessageNode,
  buildMessageNode,
  parseMessageNode,
  buildIq,
  buildGroupCreateIq,
  buildOnWhatsAppIq,
} from "./Protocol/index.js";
export {
  initSessionAsInitiator,
  initSessionAsResponder,
  establishSessions,
  signalEncrypt,
  signalDecrypt,
  serializeSession,
  deserializeSession,
  SignalSessionManager,
  makeInMemorySignalKeyStore,
  encodeSignalWire,
  decodeSignalWire,
} from "./Signal/index.js";
export {
  encodeTextMessagePayload,
  decodeMessagePayload,
  encodeWaMessageContent,
  decodeWaMessageContent,
} from "./WAProto/index.js";

export {
  resolveLoginMode,
  detectDisconnectFromPayload,
  classifyStreamError,
  applyPairSuccess,
  applyLoggedOut,
  shouldSkipPairingOnReconnect,
  buildQrFromServerRef,
  DisconnectStatus,
} from "./Socket/login-lifecycle.js";

export { EventBuffer } from "./Events/buffer.js";
export { createReconnectManager } from "./Socket/reconnect-manager.js";
export { computeReconnectDelayMs, shouldReconnect } from "./Socket/reconnect.js";

export {
  loadSession,
  saveSession,
  deleteSession,
  generateAndStorePreKeys,
  rotateSignedPreKey,
  shouldRotateSignedPreKey,
  ensurePreKeyPool,
  getDeviceIdentity,
  upsertRemoteIdentity,
  migrateSignalStore,
  loadSessionHealthy,
  validateSessionBytes,
} from "./Signal/index.js";
