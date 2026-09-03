export const DEFAULT_CONNECT_TIMEOUT_MS = 60_000;
export const DEFAULT_QUERY_TIMEOUT_MS = 60_000;
export const DEFAULT_KEEP_ALIVE_INTERVAL_MS = 25_000;
export const DEFAULT_RETRY_REQUEST_DELAY_MS = 250;
export const DEFAULT_WS_HANDSHAKE_TIMEOUT_MS = 20_000;
export const DEFAULT_WS_PING_INTERVAL_MS = 25_000;
export const DEFAULT_WS_PONG_TIMEOUT_MS = 10_000;
export const DEFAULT_MAX_RECONNECT = 8;
export const DEFAULT_RX_BUFFER_MAX = 8 * 1024 * 1024;
export const WA_WEB_SOCKET_URL = "wss://web.whatsapp.com/ws/chat";
export const NOISE_MODE = "Noise_XX_25519_AESGCM_SHA256\0\0\0\0";
/** Dictionary version used in WA Noise header */
export const DICT_VERSION = 3;
/**
 * WhatsApp Noise intro header: "WA" + protocol major (6) + DICT_VERSION.
 * Must be prepended exactly once on the first handshake frame.
 */
export const NOISE_WA_HEADER = Buffer.from([87, 65, 6, DICT_VERSION]);
export const MAX_QR_RETRIES = 5;
//# sourceMappingURL=constants.js.map