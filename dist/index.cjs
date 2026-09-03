"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  AuthenticationError: () => AuthenticationError,
  ConnectionError: () => ConnectionError,
  DEFAULT_BROWSER: () => DEFAULT_BROWSER,
  DEFAULT_CONNECT_TIMEOUT_MS: () => DEFAULT_CONNECT_TIMEOUT_MS,
  DEFAULT_KEEP_ALIVE_INTERVAL_MS: () => DEFAULT_KEEP_ALIVE_INTERVAL_MS,
  DEFAULT_QUERY_TIMEOUT_MS: () => DEFAULT_QUERY_TIMEOUT_MS,
  DEFAULT_VERSION: () => DEFAULT_VERSION,
  DisconnectStatus: () => DisconnectStatus,
  EventEmitter: () => EventEmitter,
  GroupError: () => GroupError,
  KaguneXError: () => KaguneXError,
  MediaError: () => MediaError,
  MessageError: () => MessageError,
  NotImplementedError: () => NotImplementedError,
  ProtocolError: () => ProtocolError,
  TimeoutError: () => TimeoutError,
  WA_WEB_SOCKET_URL: () => WA_WEB_SOCKET_URL,
  WebSocketTransport: () => WebSocketTransport,
  applyCredsUpdate: () => applyCredsUpdate,
  default: () => socket_default,
  deserializeCreds: () => deserializeCreds,
  formatPairingCode: () => formatPairingCode,
  formatQRForDisplay: () => formatQRForDisplay,
  generateWAMessage: () => generateWAMessage,
  generateWAMessageFromContent: () => generateWAMessageFromContent,
  initAuthCreds: () => initAuthCreds,
  loadSessionMeta: () => loadSessionMeta,
  makeCacheableSignalKeyStore: () => makeCacheableSignalKeyStore,
  makeWASocket: () => makeWASocket,
  normalizePairingPhone: () => normalizePairingPhone,
  printQRInTerminal: () => printQRInTerminal,
  saveSessionMeta: () => saveSessionMeta,
  serializeCreds: () => serializeCreds,
  useMultiFileAuthState: () => useMultiFileAuthState
});
module.exports = __toCommonJS(index_exports);

// src/Socket/socket.ts
var import_pino = __toESM(require("pino"), 1);

// src/Events/emitter.ts
var import_node_events = require("node:events");
var EventEmitter = class {
  emitter = new import_node_events.EventEmitter();
  on(event, listener) {
    this.emitter.on(event, listener);
    return this;
  }
  once(event, listener) {
    this.emitter.once(event, listener);
    return this;
  }
  off(event, listener) {
    this.emitter.off(event, listener);
    return this;
  }
  emit(event, arg) {
    return this.emitter.emit(event, arg);
  }
  removeAllListeners(event) {
    if (event) this.emitter.removeAllListeners(event);
    else this.emitter.removeAllListeners();
    return this;
  }
  listenerCount(event) {
    return this.emitter.listenerCount(event);
  }
};

// src/Socket/state.ts
function createInitialState(auth) {
  return { connection: "connecting", auth };
}

// src/Socket/events.ts
function emitConnectionUpdate(ev, update, buffer) {
  if (buffer?.push("connection.update", update)) return;
  ev.emit("connection.update", update);
}

// src/Socket/transport.ts
var import_ws = __toESM(require("ws"), 1);

// src/Defaults/constants.ts
var DEFAULT_CONNECT_TIMEOUT_MS = 6e4;
var DEFAULT_QUERY_TIMEOUT_MS = 6e4;
var DEFAULT_KEEP_ALIVE_INTERVAL_MS = 25e3;
var DEFAULT_WS_HANDSHAKE_TIMEOUT_MS = 2e4;
var DEFAULT_WS_PING_INTERVAL_MS = 25e3;
var DEFAULT_WS_PONG_TIMEOUT_MS = 1e4;
var DEFAULT_MAX_RECONNECT = 8;
var DEFAULT_RX_BUFFER_MAX = 8 * 1024 * 1024;
var WA_WEB_SOCKET_URL = "wss://web.whatsapp.com/ws/chat";
var NOISE_MODE = "Noise_XX_25519_AESGCM_SHA256\0\0\0\0";
var DICT_VERSION = 3;
var NOISE_WA_HEADER = Buffer.from([87, 65, 6, DICT_VERSION]);

// src/Errors/errors.ts
var KaguneXError = class extends Error {
  code;
  statusCode;
  cause;
  constructor(message, options = {}) {
    super(message);
    this.name = "KaguneXError";
    this.code = options.code ?? "KAGUNEX_ERROR";
    this.statusCode = options.statusCode;
    this.cause = options.cause;
    Object.setPrototypeOf(this, new.target.prototype);
  }
};
var ConnectionError = class extends KaguneXError {
  constructor(message, options = {}) {
    super(message, { code: "CONNECTION_ERROR", ...options });
    this.name = "ConnectionError";
  }
};
var AuthenticationError = class extends KaguneXError {
  constructor(message, options = {}) {
    super(message, { code: "AUTHENTICATION_ERROR", ...options });
    this.name = "AuthenticationError";
  }
};
var ProtocolError = class extends KaguneXError {
  constructor(message, options = {}) {
    super(message, { code: "PROTOCOL_ERROR", ...options });
    this.name = "ProtocolError";
  }
};
var MessageError = class extends KaguneXError {
  constructor(message, options = {}) {
    super(message, { code: "MESSAGE_ERROR", ...options });
    this.name = "MessageError";
  }
};
var MediaError = class extends KaguneXError {
  constructor(message, options = {}) {
    super(message, { code: "MEDIA_ERROR", ...options });
    this.name = "MediaError";
  }
};
var GroupError = class extends KaguneXError {
  constructor(message, options = {}) {
    super(message, { code: "GROUP_ERROR", ...options });
    this.name = "GroupError";
  }
};
var TimeoutError = class extends KaguneXError {
  constructor(message, options = {}) {
    super(message, { code: "TIMEOUT_ERROR", ...options });
    this.name = "TimeoutError";
  }
};
var NotImplementedError = class extends KaguneXError {
  constructor(feature, options = {}) {
    super(`Feature not implemented: ${feature}. Marked as TODO / EXPERIMENTAL.`, { code: "NOT_IMPLEMENTED", ...options });
    this.name = "NotImplementedError";
  }
};

// src/Socket/transport.ts
var DEFAULT_UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
var WebSocketTransport = class {
  ws = null;
  logger;
  handlers;
  opts;
  pingTimer;
  pongTimer;
  handshakeTimer;
  lastPingAt = 0;
  connecting = false;
  intentionalClose = false;
  /** Socket instance id — ignores events from replaced sockets */
  socketId = 0;
  constructor(handlers, logger, opts = {}) {
    this.handlers = handlers;
    this.logger = logger;
    this.opts = {
      handshakeTimeoutMs: opts.handshakeTimeoutMs ?? 2e4,
      pingIntervalMs: opts.pingIntervalMs ?? 25e3,
      pongTimeoutMs: opts.pongTimeoutMs ?? 1e4,
      maxPayload: opts.maxPayload ?? 20 * 1024 * 1024,
      url: opts.url,
      headers: opts.headers
    };
  }
  /** Replace handlers (e.g. after reconnect wiring) without leaking old closures incorrectly */
  setHandlers(handlers) {
    this.handlers = handlers;
  }
  connect(url = this.opts.url ?? WA_WEB_SOCKET_URL) {
    if (this.connecting && this.ws?.readyState === import_ws.default.CONNECTING) {
      this.logger?.debug("connect ignored \u2014 already connecting");
      return;
    }
    if (this.ws?.readyState === import_ws.default.OPEN) {
      this.logger?.debug("connect ignored \u2014 already open");
      return;
    }
    this.destroySocket("replace");
    this.intentionalClose = false;
    this.connecting = true;
    const myId = ++this.socketId;
    this.logger?.info({ url, socketId: myId }, "connecting transport");
    const headers = {
      Origin: "https://web.whatsapp.com",
      "User-Agent": DEFAULT_UA,
      "Accept-Language": "en-US,en;q=0.9",
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
      ...this.opts.headers || {}
    };
    const ws = new import_ws.default(url, {
      origin: "https://web.whatsapp.com",
      headers,
      handshakeTimeout: this.opts.handshakeTimeoutMs,
      perMessageDeflate: false,
      skipUTF8Validation: true,
      maxPayload: this.opts.maxPayload
    });
    this.ws = ws;
    const isStale = () => myId !== this.socketId || this.ws !== ws;
    this.handshakeTimer = setTimeout(() => {
      if (isStale()) return;
      if (ws.readyState !== import_ws.default.OPEN) {
        this.logger?.warn({ socketId: myId }, "WS handshake timeout");
        try {
          ws.terminate();
        } catch {
        }
        this.connecting = false;
        this.handlers.onError?.(new ConnectionError("WebSocket handshake timeout"));
      }
    }, this.opts.handshakeTimeoutMs);
    ws.on("open", () => {
      if (isStale()) {
        try {
          ws.close();
        } catch {
        }
        return;
      }
      this.clearHandshakeTimer();
      this.connecting = false;
      this.logger?.info({ socketId: myId }, "transport open");
      this.startPingLoop();
      this.handlers.onOpen?.();
    });
    ws.on("close", (code, reasonBuf) => {
      if (isStale()) return;
      this.clearHandshakeTimer();
      this.stopPingLoop();
      this.connecting = false;
      const reason = reasonBuf?.toString?.() || "";
      this.logger?.info(
        { code, reason, intentional: this.intentionalClose, socketId: myId },
        "transport close"
      );
      if (this.ws === ws) this.ws = null;
      this.handlers.onClose?.(code, reason);
    });
    ws.on("error", (err) => {
      if (isStale()) return;
      this.connecting = false;
      const error = err instanceof Error ? err : new Error(String(err));
      this.logger?.error({ err: error.message, socketId: myId }, "transport error");
      this.handlers.onError?.(error);
    });
    ws.on("message", (data, isBinary) => {
      if (isStale()) return;
      let buf;
      if (Buffer.isBuffer(data)) buf = data;
      else if (data instanceof ArrayBuffer) buf = Buffer.from(data);
      else if (Array.isArray(data)) buf = Buffer.concat(data);
      else buf = Buffer.from(data, isBinary ? "binary" : "utf8");
      this.handlers.onMessage?.(buf);
    });
    ws.on("pong", () => {
      if (isStale()) return;
      this.clearPongTimer();
      if (this.lastPingAt) {
        const latency = Date.now() - this.lastPingAt;
        this.handlers.onPong?.(latency);
        this.logger?.trace({ latencyMs: latency }, "ws pong");
      }
    });
  }
  send(data) {
    if (!this.ws || this.ws.readyState !== import_ws.default.OPEN) {
      throw new ConnectionError("Transport is not open");
    }
    if (this.ws.bufferedAmount > 2 * 1024 * 1024) {
      this.logger?.warn({ bufferedAmount: this.ws.bufferedAmount }, "WS send buffer high");
    }
    this.ws.send(data, { binary: true, compress: false });
  }
  ping() {
    if (!this.ws || this.ws.readyState !== import_ws.default.OPEN) return;
    this.lastPingAt = Date.now();
    try {
      this.ws.ping();
    } catch {
    }
    this.armPongTimeout();
  }
  close(code = 1e3, reason = "normal") {
    this.intentionalClose = true;
    this.destroySocket("close", code, reason);
  }
  terminate() {
    this.intentionalClose = true;
    this.destroySocket("terminate");
  }
  get isOpen() {
    return !!this.ws && this.ws.readyState === import_ws.default.OPEN;
  }
  get isConnecting() {
    return this.connecting || !!this.ws && this.ws.readyState === import_ws.default.CONNECTING;
  }
  get wasIntentionalClose() {
    return this.intentionalClose;
  }
  get bufferedAmount() {
    return this.ws?.bufferedAmount ?? 0;
  }
  get currentSocketId() {
    return this.socketId;
  }
  destroySocket(mode, code = 1e3, reason = "normal") {
    this.clearHandshakeTimer();
    this.stopPingLoop();
    const ws = this.ws;
    this.ws = null;
    this.connecting = false;
    this.socketId += mode === "replace" ? 0 : 0;
    if (mode !== "replace") {
      this.socketId += 1;
    }
    if (!ws) return;
    try {
      ws.removeAllListeners();
      if (mode === "terminate" || ws.readyState === import_ws.default.CONNECTING) {
        ws.terminate();
      } else if (ws.readyState === import_ws.default.OPEN || ws.readyState === import_ws.default.CLOSING) {
        ws.close(code, reason);
      } else {
        ws.terminate();
      }
    } catch {
    }
  }
  startPingLoop() {
    this.stopPingLoop();
    const interval = this.opts.pingIntervalMs;
    if (interval <= 0) return;
    this.pingTimer = setInterval(() => this.ping(), interval);
    if (typeof this.pingTimer === "object" && "unref" in this.pingTimer) {
      this.pingTimer.unref?.();
    }
  }
  stopPingLoop() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = void 0;
    }
    this.clearPongTimer();
  }
  armPongTimeout() {
    this.clearPongTimer();
    this.pongTimer = setTimeout(() => {
      this.logger?.warn("WS pong timeout \u2014 terminating");
      try {
        this.ws?.terminate();
      } catch {
      }
    }, this.opts.pongTimeoutMs);
    if (typeof this.pongTimer === "object" && "unref" in this.pongTimer) {
      this.pongTimer.unref?.();
    }
  }
  clearPongTimer() {
    if (this.pongTimer) {
      clearTimeout(this.pongTimer);
      this.pongTimer = void 0;
    }
  }
  clearHandshakeTimer() {
    if (this.handshakeTimer) {
      clearTimeout(this.handshakeTimer);
      this.handshakeTimer = void 0;
    }
  }
};

// src/Utils/timeout.ts
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function promiseTimeout(ms, promise, message = "timed out") {
  if (ms <= 0) return promise;
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

// src/Socket/reconnect.ts
var DEFAULT_RECONNECT = {
  maxRetries: 8,
  baseDelayMs: 800,
  maxDelayMs: 3e4,
  jitter: 1
};
function computeReconnectDelayMs(attempt, options = {}) {
  const base = options.baseDelayMs ?? DEFAULT_RECONNECT.baseDelayMs;
  const max = options.maxDelayMs ?? DEFAULT_RECONNECT.maxDelayMs;
  const jitter = options.jitter ?? DEFAULT_RECONNECT.jitter;
  const exp = Math.min(max, base * 2 ** Math.max(0, attempt));
  if (jitter <= 0) return exp;
  return Math.floor(Math.random() * exp);
}
function shouldReconnect(attempt, intentionalClose, options = {}) {
  if (intentionalClose) return false;
  const max = options.maxRetries ?? DEFAULT_RECONNECT.maxRetries;
  return attempt < max;
}

// src/WABinary/decode.ts
var TAGS = {
  LIST_EMPTY: 0,
  STREAM_END: 2,
  DICTIONARY_0: 236,
  DICTIONARY_1: 237,
  DICTIONARY_2: 238,
  DICTIONARY_3: 239,
  LIST_8: 248,
  LIST_16: 249,
  JID_PAIR: 250,
  HEX_8: 251,
  BINARY_8: 252,
  BINARY_20: 253,
  BINARY_32: 254,
  NIBBLE_8: 255
};
var BinaryReader = class {
  constructor(buf) {
    this.buf = buf;
  }
  i = 0;
  get remaining() {
    return this.buf.length - this.i;
  }
  readByte() {
    if (this.i >= this.buf.length) throw new Error("WABinary: unexpected EOF");
    return this.buf[this.i++];
  }
  readBytes(n) {
    if (this.i + n > this.buf.length) throw new Error("WABinary: unexpected EOF");
    const slice = this.buf.subarray(this.i, this.i + n);
    this.i += n;
    return slice;
  }
  readInt16() {
    const b0 = this.readByte();
    const b1 = this.readByte();
    return b0 << 8 | b1;
  }
  readInt20() {
    const b0 = this.readByte();
    const b1 = this.readByte();
    const b2 = this.readByte();
    return (b0 & 15) << 16 | b1 << 8 | b2;
  }
  readInt32() {
    const b0 = this.readByte();
    const b1 = this.readByte();
    const b2 = this.readByte();
    const b3 = this.readByte();
    return b0 * 16777216 + (b1 << 16) + (b2 << 8) + b3;
  }
};
function readListSize(tag, reader) {
  if (tag === TAGS.LIST_EMPTY) return 0;
  if (tag === TAGS.LIST_8) return reader.readByte();
  if (tag === TAGS.LIST_16) return reader.readInt16();
  throw new Error(`WABinary: invalid list tag ${tag}`);
}
function readStringFromToken(tag, reader) {
  if (tag === TAGS.LIST_EMPTY) return "";
  if (tag === TAGS.BINARY_8) {
    const len = reader.readByte();
    return reader.readBytes(len).toString("utf8");
  }
  if (tag === TAGS.BINARY_20) {
    const len = reader.readInt20();
    return reader.readBytes(len).toString("utf8");
  }
  if (tag === TAGS.BINARY_32) {
    const len = reader.readInt32();
    return reader.readBytes(len).toString("utf8");
  }
  if (tag === TAGS.JID_PAIR) {
    const user = readString(reader);
    const server = readString(reader);
    return user ? `${user}@${server}` : server;
  }
  if (tag === TAGS.NIBBLE_8 || tag === TAGS.HEX_8) {
    const size = reader.readByte();
    const numBytes = Math.ceil(size / 2);
    const raw = reader.readBytes(numBytes);
    let out = "";
    const hexChars = "0123456789ABCDEF";
    for (let i = 0; i < raw.length; i++) {
      const b = raw[i];
      const high = b >> 4 & 15;
      const low = b & 15;
      if (i * 2 < size) out += hexChars[high];
      if (i * 2 + 1 < size && low !== 15) out += hexChars[low];
    }
    return out;
  }
  if (tag >= 3 && tag < TAGS.DICTIONARY_0) {
    return String(tag);
  }
  if (tag === TAGS.DICTIONARY_0 || tag === TAGS.DICTIONARY_1 || tag === TAGS.DICTIONARY_2 || tag === TAGS.DICTIONARY_3) {
    const index = reader.readByte();
    return `dict:${tag}:${index}`;
  }
  throw new Error(`WABinary: invalid string tag ${tag}`);
}
function readString(reader) {
  const tag = reader.readByte();
  return readStringFromToken(tag, reader);
}
function readBinary(tag, reader) {
  let len;
  if (tag === TAGS.BINARY_8) len = reader.readByte();
  else if (tag === TAGS.BINARY_20) len = reader.readInt20();
  else if (tag === TAGS.BINARY_32) len = reader.readInt32();
  else throw new Error(`WABinary: invalid binary tag ${tag}`);
  return reader.readBytes(len);
}
function readNode(reader) {
  const listTag = reader.readByte();
  const listSize = readListSize(listTag, reader);
  if (listSize === 0) {
    return { tag: "", attrs: {} };
  }
  const tag = readString(reader);
  const attrs = {};
  const attrCount = Math.floor((listSize - 1) / 2);
  for (let i = 0; i < attrCount; i++) {
    const key = readString(reader);
    const value = readString(reader);
    attrs[key] = value;
  }
  let content;
  if (listSize % 2 === 0) {
    const contentTag = reader.readByte();
    if (contentTag === TAGS.LIST_EMPTY || contentTag === TAGS.LIST_8 || contentTag === TAGS.LIST_16) {
      const childCount = readListSize(contentTag, reader);
      const children = [];
      for (let i = 0; i < childCount; i++) {
        children.push(readNode(reader));
      }
      content = children;
    } else if (contentTag === TAGS.BINARY_8 || contentTag === TAGS.BINARY_20 || contentTag === TAGS.BINARY_32) {
      content = readBinary(contentTag, reader);
    } else {
      content = readStringFromToken(contentTag, reader);
    }
  }
  return { tag, attrs, content };
}
function decodeBinaryNode(data) {
  const reader = new BinaryReader(Buffer.from(data));
  return readNode(reader);
}

// src/WABinary/encode.ts
var TAGS2 = {
  LIST_EMPTY: 0,
  STREAM_END: 2,
  DICTIONARY_0: 236,
  DICTIONARY_1: 237,
  DICTIONARY_2: 238,
  DICTIONARY_3: 239,
  LIST_8: 248,
  LIST_16: 249,
  JID_PAIR: 250,
  HEX_8: 251,
  BINARY_8: 252,
  BINARY_20: 253,
  BINARY_32: 254,
  NIBBLE_8: 255,
  SINGLE_BYTE_MAX: 256,
  PACKED_MAX: 254
};
function pushByte(out, value) {
  out.push(value & 255);
}
function pushInt20(out, value) {
  pushByte(out, value >> 16 & 15);
  pushByte(out, value >> 8 & 255);
  pushByte(out, value & 255);
}
function pushInt16(out, value) {
  pushByte(out, value >> 8 & 255);
  pushByte(out, value & 255);
}
function pushInt32(out, value) {
  pushByte(out, value >> 24 & 255);
  pushByte(out, value >> 16 & 255);
  pushByte(out, value >> 8 & 255);
  pushByte(out, value & 255);
}
function writeString(out, str) {
  const bytes = Buffer.from(str, "utf8");
  if (bytes.length < 256) {
    pushByte(out, TAGS2.BINARY_8);
    pushByte(out, bytes.length);
  } else if (bytes.length < 1048576) {
    pushByte(out, TAGS2.BINARY_20);
    pushInt20(out, bytes.length);
  } else {
    pushByte(out, TAGS2.BINARY_32);
    pushInt32(out, bytes.length);
  }
  for (const b of bytes) out.push(b);
}
function writeBinary(out, data) {
  const bytes = Buffer.from(data);
  if (bytes.length < 256) {
    pushByte(out, TAGS2.BINARY_8);
    pushByte(out, bytes.length);
  } else if (bytes.length < 1048576) {
    pushByte(out, TAGS2.BINARY_20);
    pushInt20(out, bytes.length);
  } else {
    pushByte(out, TAGS2.BINARY_32);
    pushInt32(out, bytes.length);
  }
  for (const b of bytes) out.push(b);
}
function writeJid(out, jid) {
  const at = jid.indexOf("@");
  if (at > 0) {
    const user = jid.slice(0, at);
    const server = jid.slice(at + 1);
    pushByte(out, TAGS2.JID_PAIR);
    if (user.length === 0) pushByte(out, TAGS2.LIST_EMPTY);
    else writeString(out, user);
    writeString(out, server);
    return;
  }
  writeString(out, jid);
}
function isJidLike(value) {
  return value.includes("@") && !value.includes(" ");
}
function writeListStart(out, count) {
  if (count === 0) {
    pushByte(out, TAGS2.LIST_EMPTY);
  } else if (count < 256) {
    pushByte(out, TAGS2.LIST_8);
    pushByte(out, count);
  } else {
    pushByte(out, TAGS2.LIST_16);
    pushInt16(out, count);
  }
}
function writeNode(out, node) {
  const attrs = node.attrs || {};
  const attrKeys = Object.keys(attrs);
  const hasContent = node.content !== void 0 && node.content !== null;
  const listSize = 1 + attrKeys.length * 2 + (hasContent ? 1 : 0);
  writeListStart(out, listSize);
  writeString(out, node.tag);
  for (const key of attrKeys) {
    writeString(out, key);
    const val = attrs[key] ?? "";
    if (isJidLike(val)) writeJid(out, val);
    else writeString(out, val);
  }
  if (!hasContent) return;
  const content = node.content;
  if (typeof content === "string") {
    writeString(out, content);
  } else if (Buffer.isBuffer(content) || content instanceof Uint8Array) {
    writeBinary(out, content);
  } else if (Array.isArray(content)) {
    writeListStart(out, content.length);
    for (const child of content) writeNode(out, child);
  } else {
    writeString(out, String(content));
  }
}
function encodeBinaryNode(node) {
  const out = [];
  writeNode(out, node);
  return Buffer.from(out);
}

// src/WABinary/frame.ts
function encodeFrame(payload) {
  const body = Buffer.from(payload);
  if (body.length > 16777215) {
    throw new Error(`encodeFrame: payload too large (${body.length})`);
  }
  const header = Buffer.alloc(3);
  header[0] = body.length >> 16 & 255;
  header[1] = body.length >> 8 & 255;
  header[2] = body.length & 255;
  return Buffer.concat([header, body]);
}
function decodeFrame(buffer) {
  const buf = Buffer.from(buffer);
  if (buf.length < 3) return null;
  const len = buf[0] << 16 | buf[1] << 8 | buf[2];
  if (buf.length < 3 + len) return null;
  return {
    payload: buf.subarray(3, 3 + len),
    rest: buf.subarray(3 + len)
  };
}

// src/WABinary/index.ts
function getBinaryNodeAttr(node, name) {
  if (!node?.attrs) return void 0;
  return node.attrs[name];
}
function getBinaryNodeChild(node, childTag) {
  if (!node || !Array.isArray(node.content)) return void 0;
  return node.content.find((c) => c && c.tag === childTag);
}
function getBinaryNodeChildren(node, childTag) {
  if (!node || !Array.isArray(node.content)) return [];
  if (childTag == null) return node.content.filter(Boolean);
  return node.content.filter((c) => c && c.tag === childTag);
}

// src/Protocol/handler.ts
function collectQrRefs(node, out) {
  const ref = getBinaryNodeAttr(node, "ref");
  if (ref && ref.length > 8) out.push(ref);
  if (node.tag === "pair-device" || node.tag === "qr" || node.tag === "scan") {
    const r = getBinaryNodeAttr(node, "ref") || getBinaryNodeAttr(node, "code");
    if (r) out.push(r);
  }
  for (const c of getBinaryNodeChildren(node)) collectQrRefs(c, out);
}
function parseProtocolPayload(payload) {
  const qrRefs = [];
  const nodes = [];
  let streamError;
  let success = false;
  let pairSuccess = false;
  try {
    const node = decodeBinaryNode(payload);
    nodes.push(node);
    collectQrRefs(node, qrRefs);
    if (node.tag === "success") success = true;
    if (node.tag === "stream:error" || node.tag === "error") {
      streamError = getBinaryNodeAttr(node, "code") || getBinaryNodeAttr(node, "text") || "stream error";
    }
    if (node.tag === "pair-success" || getBinaryNodeChild(node, "pair-success")) {
      pairSuccess = true;
    }
    if (node.tag === "iq") {
      const type = getBinaryNodeAttr(node, "type");
      if (type === "error") streamError = getBinaryNodeAttr(node, "code") || "iq error";
      if (type === "result") success = true;
    }
  } catch {
  }
  return { nodes, qrRefs: [...new Set(qrRefs)], streamError, success, pairSuccess };
}
function composeQrPayload(parts) {
  if (!parts.ref || parts.ref.length < 8) return void 0;
  if (!parts.noisePub?.length || !parts.identityPub?.length) return void 0;
  if (!parts.advSecretKey) return void 0;
  return `${parts.ref},${parts.noisePub.toString("base64")},${parts.identityPub.toString("base64")},${parts.advSecretKey}`;
}

// src/Socket/login-lifecycle.ts
var DisconnectStatus = {
  loggedOut: 401,
  forbidden: 403,
  timedOut: 408,
  multideviceMismatch: 411,
  connectionReplaced: 440,
  badSession: 500,
  restartRequired: 515
};
function resolveLoginMode(creds) {
  if (!creds) return "unknown";
  if (creds.registered && creds.me?.id) return "registered";
  if (creds.pairingCode) return "pairing";
  return "qr";
}
function detectDisconnectFromPayload(payload) {
  try {
    const node = decodeBinaryNode(payload);
    if (node.tag === "stream:error" || node.tag === "error") {
      const code = getBinaryNodeAttr(node, "code");
      const text = getBinaryNodeAttr(node, "text") || getBinaryNodeAttr(node, "title");
      return classifyStreamError(code, text);
    }
    if (node.tag === "iq" && getBinaryNodeAttr(node, "type") === "error") {
      const err = getBinaryNodeChild(node, "error");
      const code = err && getBinaryNodeAttr(err, "code") || getBinaryNodeAttr(node, "code");
      const text = err && getBinaryNodeAttr(err, "text") || void 0;
      return classifyStreamError(code, text);
    }
    if (node.tag === "failure") {
      const reason = getBinaryNodeAttr(node, "reason") || getBinaryNodeAttr(node, "code");
      return classifyStreamError(reason, reason);
    }
  } catch {
  }
  const parsed = parseProtocolPayload(payload);
  if (parsed.streamError) {
    return classifyStreamError(parsed.streamError, parsed.streamError);
  }
  return void 0;
}
function classifyStreamError(code, text) {
  const c = (code || "").toLowerCase();
  const t = (text || "").toLowerCase();
  const num = Number(code);
  if (num === 401 || c === "401" || t.includes("logged out") || t.includes("logged_out") || c === "logout" || c === "logged_out") {
    return {
      code: DisconnectStatus.loggedOut,
      statusCode: DisconnectStatus.loggedOut,
      message: text || "logged out",
      isLoggedOut: true
    };
  }
  if (num === 440 || c === "440" || t.includes("replaced") || c === "connection_replaced") {
    return {
      code: DisconnectStatus.connectionReplaced,
      statusCode: DisconnectStatus.connectionReplaced,
      message: text || "connection replaced",
      isLoggedOut: false
    };
  }
  if (num === 403 || c === "403") {
    return {
      code: DisconnectStatus.forbidden,
      statusCode: DisconnectStatus.forbidden,
      message: text || "forbidden",
      isLoggedOut: false
    };
  }
  if (num === 408 || c === "408" || t.includes("timeout")) {
    return {
      code: DisconnectStatus.timedOut,
      statusCode: DisconnectStatus.timedOut,
      message: text || "timed out",
      isLoggedOut: false
    };
  }
  if (num === 515 || c === "515" || t.includes("restart")) {
    return {
      code: DisconnectStatus.restartRequired,
      statusCode: DisconnectStatus.restartRequired,
      message: text || "restart required",
      isLoggedOut: false
    };
  }
  return {
    code: num || void 0,
    statusCode: Number.isFinite(num) ? num : void 0,
    message: text || code || "stream error",
    isLoggedOut: false
  };
}
function applyPairSuccess(pairing, existing) {
  if (pairing.pairSuccess !== true) return void 0;
  const me = pairing.me;
  if (!me?.id || typeof me.id !== "string") return void 0;
  if (!me.id.includes("@") || me.id.length < 5) return void 0;
  if (existing) {
    const hasNoise = existing.noiseKey?.public?.length && existing.noiseKey?.private?.length;
    const hasIdentity = existing.signedIdentityKey?.public?.length && existing.signedIdentityKey?.private?.length;
    if (!hasNoise || !hasIdentity) return void 0;
  }
  return {
    credsPatch: {
      me: { id: me.id, name: me.name ?? existing?.me?.name },
      registered: true,
      pairingCode: void 0
    },
    connectionUpdate: {
      connection: "open",
      isNewLogin: true
    }
  };
}
function buildQrFromServerRef(ref, creds) {
  return composeQrPayload({
    ref,
    noisePub: Buffer.from(creds.noiseKey.public),
    identityPub: Buffer.from(creds.signedIdentityKey.public),
    advSecretKey: creds.advSecretKey
  });
}
function shouldSkipPairingOnReconnect(creds) {
  return resolveLoginMode(creds) === "registered";
}
function applyLoggedOut(creds) {
  return {
    registered: false,
    me: void 0,
    pairingCode: void 0
  };
}

// src/Socket/reconnect-manager.ts
function createReconnectManager(logger, options = {}) {
  const opts = { ...DEFAULT_RECONNECT, ...options };
  let generation = 0;
  let attempt = 0;
  let isReconnecting = false;
  let cancelled = false;
  let reconnectToken = 0;
  const mapWsCode = (code, reasonText) => {
    if (code === 1e3 && !reasonText) return void 0;
    if (code === 1006) {
      return {
        code: 1006,
        statusCode: DisconnectStatus.timedOut,
        message: reasonText || "abnormal closure / network drop",
        isLoggedOut: false
      };
    }
    if (code === 1001) {
      return {
        code: 1001,
        message: reasonText || "going away",
        isLoggedOut: false
      };
    }
    return void 0;
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
        logger?.debug({ gen, generation }, "markOpen ignored \u2014 stale generation");
        return;
      }
      attempt = 0;
      isReconnecting = false;
      logger?.debug({ generation }, "connection open \u2014 reconnect attempt reset");
    },
    onClose(gen, closeOpts) {
      if (gen !== generation) {
        return { should: false, delayMs: 0, reason: "stale generation" };
      }
      if (closeOpts.stopped || closeOpts.intentional || cancelled) {
        isReconnecting = false;
        return { should: false, delayMs: 0, reason: "intentional/stopped" };
      }
      const disc = closeOpts.disconnect || mapWsCode(closeOpts.code, closeOpts.reasonText);
      if (disc?.isLoggedOut) {
        isReconnecting = false;
        return { should: false, delayMs: 0, reason: "logged out" };
      }
      if (disc?.statusCode === DisconnectStatus.loggedOut || disc?.statusCode === DisconnectStatus.forbidden) {
        isReconnecting = false;
        return { should: false, delayMs: 0, reason: `fatal ${disc.statusCode}` };
      }
      if (!shouldReconnect(attempt, false, opts)) {
        isReconnecting = false;
        return { should: false, delayMs: 0, reason: "max retries" };
      }
      const delayMs = computeReconnectDelayMs(attempt, opts);
      isReconnecting = true;
      logger?.info(
        {
          generation,
          attempt,
          delayMs,
          code: closeOpts.code,
          disc
        },
        "reconnect scheduled"
      );
      return {
        should: true,
        delayMs,
        reason: disc?.message || closeOpts.reasonText || `ws ${closeOpts.code}`
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
    }
  };
}

// src/Events/buffer.ts
var EventBuffer = class {
  enabled = false;
  queue = [];
  maxSize;
  constructor(maxSize = 500) {
    this.maxSize = maxSize;
  }
  start() {
    this.enabled = true;
  }
  stop() {
    this.enabled = false;
  }
  get isBuffering() {
    return this.enabled;
  }
  get size() {
    return this.queue.length;
  }
  /**
   * If buffering, enqueue and return true (caller should NOT emit).
   * If not buffering, return false (caller should emit normally).
   */
  push(event, data) {
    if (!this.enabled) return false;
    if (this.queue.length >= this.maxSize) {
      this.queue.shift();
    }
    this.queue.push({ event, data, at: Date.now() });
    return true;
  }
  /** Flush all buffered events to emitter; clears queue and stops buffering. */
  flush(ev) {
    const items = this.queue.splice(0, this.queue.length);
    this.enabled = false;
    for (const item of items) {
      ev.emit(item.event, item.data);
    }
    return items.length;
  }
  clear() {
    this.queue.length = 0;
    this.enabled = false;
  }
};

// src/WAProto/protobuf.ts
function readVarint(buf, offset) {
  let result = 0;
  let shift = 0;
  let pos = offset;
  while (pos < buf.length) {
    const byte = buf[pos++];
    result |= (byte & 127) << shift;
    if ((byte & 128) === 0) break;
    shift += 7;
    if (shift > 35) throw new Error("protobuf: varint too long");
  }
  return { value: result >>> 0, next: pos };
}
function readVarintBig(buf, offset) {
  let result = 0n;
  let shift = 0n;
  let pos = offset;
  while (pos < buf.length) {
    const byte = BigInt(buf[pos++]);
    result |= (byte & 0x7fn) << shift;
    if ((byte & 0x80n) === 0n) break;
    shift += 7n;
  }
  return { value: result, next: pos };
}
function readFields(buf) {
  const data = Buffer.from(buf);
  const fields = [];
  let offset = 0;
  while (offset < data.length) {
    const tagInfo = readVarint(data, offset);
    offset = tagInfo.next;
    const fieldNumber = tagInfo.value >>> 3;
    const wireType = tagInfo.value & 7;
    if (wireType === 0) {
      const v = readVarintBig(data, offset);
      offset = v.next;
      fields.push({ number: fieldNumber, wireType, value: v.value });
    } else if (wireType === 1) {
      const raw = data.subarray(offset, offset + 8);
      offset += 8;
      fields.push({ number: fieldNumber, wireType, value: raw, raw });
    } else if (wireType === 2) {
      const lenInfo = readVarint(data, offset);
      offset = lenInfo.next;
      const raw = data.subarray(offset, offset + lenInfo.value);
      offset += lenInfo.value;
      fields.push({ number: fieldNumber, wireType, value: raw, raw });
    } else if (wireType === 5) {
      const raw = data.subarray(offset, offset + 4);
      offset += 4;
      fields.push({ number: fieldNumber, wireType, value: raw, raw });
    } else {
      throw new Error(`protobuf: unsupported wire type ${wireType}`);
    }
  }
  return fields;
}
function fieldBytes(fields, number) {
  const f = fields.find((x) => x.number === number && x.wireType === 2);
  if (!f) return void 0;
  if (Buffer.isBuffer(f.value)) return f.value;
  if (typeof f.value === "object" && f.value && f.value instanceof Uint8Array)
    return Buffer.from(f.value);
  return void 0;
}
function fieldString(fields, number) {
  const b = fieldBytes(fields, number);
  return b ? b.toString("utf8") : void 0;
}
function fieldInt(fields, number) {
  const f = fields.find((x) => x.number === number && x.wireType === 0);
  if (!f) return void 0;
  if (typeof f.value === "bigint") return Number(f.value);
  if (typeof f.value === "number") return f.value;
  return void 0;
}
function writeVarint(value) {
  const out = [];
  let v = value >>> 0;
  while (v >= 128) {
    out.push(v & 127 | 128);
    v >>>= 7;
  }
  out.push(v);
  return Buffer.from(out);
}
function encodeBytes(fieldNumber, data) {
  const tag = writeVarint(fieldNumber << 3 | 2);
  const body = Buffer.from(data);
  const len = writeVarint(body.length);
  return Buffer.concat([tag, len, body]);
}
function encodeVarint(fieldNumber, value) {
  const tag = writeVarint(fieldNumber << 3 | 0);
  return Buffer.concat([tag, writeVarint(value)]);
}
function encodeString(fieldNumber, value) {
  return encodeBytes(fieldNumber, Buffer.from(value, "utf8"));
}

// src/Noise/handshake.ts
var import_node_crypto = require("node:crypto");
var NOISE_PROTOCOL_NAME = "Noise_XX_25519_AESGCM_SHA256";
var HASH_LEN = 32;
var DH_LEN = 32;
var TAG_LEN = 16;
function sha256(...parts) {
  const h = (0, import_node_crypto.createHash)("sha256");
  for (const p of parts) h.update(p);
  return h.digest();
}
function hmacSha256(key, data) {
  return (0, import_node_crypto.createHmac)("sha256", key).update(data).digest();
}
function noiseHkdf(chainingKey, inputKeyMaterial, numOutputs) {
  const tempKey = inputKeyMaterial.length ? hmacSha256(chainingKey, inputKeyMaterial) : hmacSha256(chainingKey, Buffer.alloc(HASH_LEN, 0));
  const out1 = hmacSha256(tempKey, Buffer.from([1]));
  const out2 = hmacSha256(tempKey, Buffer.concat([out1, Buffer.from([2])]));
  if (numOutputs === 2) return [out1, out2];
  const out3 = hmacSha256(tempKey, Buffer.concat([out2, Buffer.from([3])]));
  return [out1, out2, out3];
}
function mixHash(h, data) {
  return sha256(h, data);
}
function mixKey(state, inputKeyMaterial) {
  const [ck, k] = noiseHkdf(state.ck, inputKeyMaterial, 2);
  state.ck = ck;
  state.k = k;
  state.n = 0n;
}
function generateX25519KeyPair() {
  const { publicKey, privateKey } = (0, import_node_crypto.generateKeyPairSync)("x25519");
  const pubDer = publicKey.export({ type: "spki", format: "der" });
  const privDer = privateKey.export({ type: "pkcs8", format: "der" });
  return {
    public: Buffer.from(pubDer.subarray(pubDer.length - DH_LEN)),
    private: Buffer.from(privDer.subarray(privDer.length - DH_LEN))
  };
}
function dh(privateRaw, publicRaw) {
  if (privateRaw.length !== DH_LEN || publicRaw.length !== DH_LEN) {
    throw new Error("DH keys must be 32 bytes");
  }
  const pkcs8Prefix = Buffer.from("302e020100300506032b656e04220420", "hex");
  const spkiPrefix = Buffer.from("302a300506032b656e032100", "hex");
  const privKey = (0, import_node_crypto.createPrivateKey)({
    key: Buffer.concat([pkcs8Prefix, privateRaw]),
    format: "der",
    type: "pkcs8"
  });
  const pubKey = (0, import_node_crypto.createPublicKey)({
    key: Buffer.concat([spkiPrefix, publicRaw]),
    format: "der",
    type: "spki"
  });
  return Buffer.from((0, import_node_crypto.diffieHellman)({ privateKey: privKey, publicKey: pubKey }));
}
function noiseNonce(n) {
  const nonce = Buffer.alloc(12, 0);
  nonce.writeUInt32BE(Number(n >> 32n & 0xffffffffn), 4);
  nonce.writeUInt32BE(Number(n & 0xffffffffn), 8);
  return nonce;
}
function encryptAndHash(state, plaintext) {
  if (!state.k) {
    state.h = mixHash(state.h, plaintext);
    return Buffer.from(plaintext);
  }
  const cipher = (0, import_node_crypto.createCipheriv)("aes-256-gcm", state.k, noiseNonce(state.n));
  cipher.setAAD(state.h);
  const enc = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const ciphertext = Buffer.concat([enc, cipher.getAuthTag()]);
  state.h = mixHash(state.h, ciphertext);
  state.n += 1n;
  return Buffer.from(ciphertext);
}
function decryptAndHash(state, ciphertext) {
  if (!state.k) {
    state.h = mixHash(state.h, ciphertext);
    return Buffer.from(ciphertext);
  }
  if (ciphertext.length < TAG_LEN) throw new Error("Noise ciphertext too short");
  const data = ciphertext.subarray(0, ciphertext.length - TAG_LEN);
  const tag = ciphertext.subarray(ciphertext.length - TAG_LEN);
  const decipher = (0, import_node_crypto.createDecipheriv)("aes-256-gcm", state.k, noiseNonce(state.n));
  decipher.setAAD(state.h);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(data), decipher.final()]);
  state.h = mixHash(state.h, ciphertext);
  state.n += 1n;
  return Buffer.from(plaintext);
}
function initializeHash(prologue) {
  const name = Buffer.from(NOISE_PROTOCOL_NAME, "utf-8");
  const h0 = name.length === HASH_LEN ? Buffer.from(name) : sha256(name);
  return {
    ck: Buffer.from(h0),
    h: mixHash(h0, prologue)
  };
}
function createNoiseInitiator(staticKeyPair, prologue) {
  const { h, ck } = initializeHash(prologue);
  return {
    role: "initiator",
    step: 0,
    h,
    ck,
    n: 0n,
    ephemeral: generateX25519KeyPair(),
    staticKeyPair
  };
}
function noiseWriteMessage1(state) {
  if (state.role !== "initiator" || state.step !== 0) {
    throw new Error("Noise: initiator message1 invalid state");
  }
  state.h = mixHash(state.h, state.ephemeral.public);
  state.step = 1;
  return Buffer.from(state.ephemeral.public);
}
function noiseReadMessageA(state, message) {
  if (state.role !== "initiator" || state.step !== 1) {
    throw new Error("Noise: initiator read A invalid state");
  }
  if (message.length < DH_LEN) throw new Error("Noise: message A too short");
  const re = message.subarray(0, DH_LEN);
  state.remoteEphemeral = Buffer.from(re);
  state.h = mixHash(state.h, re);
  mixKey(state, dh(state.ephemeral.private, state.remoteEphemeral));
  const rest = message.subarray(DH_LEN);
  if (rest.length < DH_LEN + TAG_LEN) {
    throw new Error("Noise: message A missing encrypted static");
  }
  const encS = rest.subarray(0, DH_LEN + TAG_LEN);
  const payloadEnc = rest.subarray(DH_LEN + TAG_LEN);
  const remoteStatic = decryptAndHash(state, encS);
  if (remoteStatic.length !== DH_LEN) {
    throw new Error("Noise: remote static key length invalid");
  }
  state.remoteStatic = Buffer.from(remoteStatic);
  mixKey(state, dh(state.ephemeral.private, state.remoteStatic));
  let payload = Buffer.alloc(0);
  if (payloadEnc.length > 0) {
    payload = decryptAndHash(state, payloadEnc);
  }
  state.remotePayload = Buffer.from(payload);
  state.step = 2;
  return payload;
}
function noiseWriteMessageB(state, payload = Buffer.alloc(0)) {
  if (state.role !== "initiator" || state.step !== 2) {
    throw new Error("Noise: initiator message B invalid state");
  }
  if (!state.remoteEphemeral) throw new Error("Noise: missing remote ephemeral");
  const encS = encryptAndHash(state, state.staticKeyPair.public);
  mixKey(state, dh(state.staticKeyPair.private, state.remoteEphemeral));
  const encPayload = encryptAndHash(state, payload);
  state.step = 3;
  return Buffer.concat([encS, encPayload]);
}
function noiseSplit(state) {
  if (state.step !== 3) throw new Error("Noise: handshake incomplete");
  const [k1, k2] = noiseHkdf(state.ck, Buffer.alloc(0), 2);
  const isInitiator = state.role === "initiator";
  return {
    sendKey: isInitiator ? k1 : k2,
    recvKey: isInitiator ? k2 : k1,
    writeNonce: 0n,
    readNonce: 0n,
    remoteStaticPublic: state.remoteStatic,
    handshakeHash: Buffer.from(state.h)
  };
}
function noiseEncrypt(key, nonceCounter, plaintext, aad = Buffer.alloc(0)) {
  const cipher = (0, import_node_crypto.createCipheriv)("aes-256-gcm", key, noiseNonce(nonceCounter));
  if (aad.length) cipher.setAAD(aad);
  const enc = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  return Buffer.concat([enc, cipher.getAuthTag()]);
}
function noiseDecrypt(key, nonceCounter, ciphertext, aad = Buffer.alloc(0)) {
  if (ciphertext.length < TAG_LEN) throw new Error("ciphertext too short");
  const data = ciphertext.subarray(0, ciphertext.length - TAG_LEN);
  const tag = ciphertext.subarray(ciphertext.length - TAG_LEN);
  const decipher = (0, import_node_crypto.createDecipheriv)("aes-256-gcm", key, noiseNonce(nonceCounter));
  if (aad.length) decipher.setAAD(aad);
  decipher.setAuthTag(tag);
  return Buffer.from(Buffer.concat([decipher.update(data), decipher.final()]));
}
function noiseKeyPairFromAuth(noiseKey) {
  return {
    public: Buffer.from(noiseKey.public),
    private: Buffer.from(noiseKey.private)
  };
}

// src/Noise/session.ts
var NoiseSession = class {
  sendKey;
  recvKey;
  writeNonce;
  readNonce;
  rxBuffer = Buffer.alloc(0);
  remoteStaticPublic;
  handshakeHash;
  constructor(keys) {
    this.sendKey = keys.sendKey;
    this.recvKey = keys.recvKey;
    this.writeNonce = keys.writeNonce;
    this.readNonce = keys.readNonce;
    this.remoteStaticPublic = keys.remoteStaticPublic;
    this.handshakeHash = keys.handshakeHash ?? Buffer.alloc(0);
  }
  /** Encrypt plaintext and wrap in length-prefixed frame. */
  seal(plaintext) {
    const ct = noiseEncrypt(this.sendKey, this.writeNonce, plaintext);
    this.writeNonce += 1n;
    return encodeFrame(ct);
  }
  /**
   * Feed raw socket bytes; returns decrypted payloads (0+).
   */
  open(chunk) {
    this.rxBuffer = Buffer.concat([this.rxBuffer, chunk]);
    const out = [];
    while (true) {
      const decoded = decodeFrame(this.rxBuffer);
      if (!decoded) break;
      this.rxBuffer = decoded.rest;
      const pt = noiseDecrypt(this.recvKey, this.readNonce, decoded.payload);
      this.readNonce += 1n;
      out.push(pt);
    }
    return out;
  }
  get writeCounter() {
    return this.writeNonce;
  }
  get readCounter() {
    return this.readNonce;
  }
};

// src/Noise/certificate.ts
var import_node_crypto2 = require("node:crypto");
function loadEnvTrustedKeys() {
  const raw = process.env.KAGUNEX_NOISE_CA_KEYS;
  if (!raw) return [];
  return raw.split(",").map((s) => s.trim()).filter(Boolean).map((s) => Buffer.from(s, "base64")).filter((b) => b.length === 32);
}
function verifyEd25519(pubRaw, message, signature) {
  try {
    const spkiPrefix = Buffer.from("302a300506032b6570032100", "hex");
    const key = (0, import_node_crypto2.createPublicKey)({
      key: Buffer.concat([spkiPrefix, pubRaw]),
      format: "der",
      type: "spki"
    });
    return (0, import_node_crypto2.verify)(null, message, key, signature);
  } catch {
    return false;
  }
}
function parseCertificateDetails(details) {
  try {
    const fields = readFields(details);
    return {
      serial: fieldInt(fields, 1),
      issuer: fieldString(fields, 2),
      expires: fieldInt(fields, 3),
      subject: fieldString(fields, 4),
      key: fieldBytes(fields, 5)
    };
  } catch {
    return {};
  }
}
function parseNoiseCertificate(payload) {
  if (!payload || payload.length < 64) return void 0;
  try {
    const fields = readFields(payload);
    const details = fieldBytes(fields, 1);
    const signature = fieldBytes(fields, 2);
    if (details && signature && signature.length === 64) {
      const parsed = parseCertificateDetails(details);
      return {
        details,
        signature,
        parsed,
        serverStaticPublic: parsed.key
      };
    }
  } catch {
  }
  if (payload.length >= 64 + 16) {
    const signature = payload.subarray(payload.length - 64);
    const details = payload.subarray(0, payload.length - 64);
    const parsed = parseCertificateDetails(details);
    return {
      details,
      signature,
      parsed,
      serverStaticPublic: parsed.key ?? details.subarray(0, Math.min(32, details.length))
    };
  }
  return void 0;
}
function validateNoiseCertificate(payload, trustedKeys = []) {
  const keys = [...trustedKeys, ...loadEnvTrustedKeys()];
  const certificate = parseNoiseCertificate(payload);
  if (!certificate) {
    return { ok: false, reason: "unable to parse noise certificate" };
  }
  if (certificate.parsed?.expires) {
    const now = Math.floor(Date.now() / 1e3);
    if (now > certificate.parsed.expires) {
      return { ok: false, reason: "certificate expired", certificate };
    }
  }
  if (!keys.length) {
    return {
      ok: false,
      reason: "no trusted Noise CA keys (set KAGUNEX_NOISE_CA_KEYS or pass trustedKeys)",
      certificate
    };
  }
  for (const pub of keys) {
    if (pub.length !== 32) continue;
    if (verifyEd25519(pub, certificate.details, certificate.signature)) {
      return { ok: true, certificate };
    }
  }
  return {
    ok: false,
    reason: "certificate signature not valid under any trusted key",
    certificate
  };
}
function isStrictCertEnabled() {
  return process.env.KAGUNEX_NOISE_STRICT_CERT !== "0";
}

// src/Noise/wa-noise.ts
var import_node_crypto3 = require("node:crypto");
function encodeClientHello(ephemeral, staticKey, payload) {
  const parts = [encodeBytes(1, ephemeral)];
  if (staticKey?.length) parts.push(encodeBytes(2, staticKey));
  if (payload?.length) parts.push(encodeBytes(3, payload));
  const inner = Buffer.concat(parts);
  return encodeBytes(2, inner);
}
function encodeClientFinish(encStatic, encPayload) {
  const parts = [encodeBytes(1, encStatic)];
  if (encPayload?.length) parts.push(encodeBytes(2, encPayload));
  const inner = Buffer.concat(parts);
  return encodeBytes(4, inner);
}
function parseServerHello(payload) {
  const top = readFields(payload);
  const serverHelloBytes = fieldBytes(top, 3);
  if (!serverHelloBytes) {
    throw new Error("Noise: missing HandshakeMessage.serverHello");
  }
  const fields = readFields(serverHelloBytes);
  const ephemeral = fieldBytes(fields, 1);
  const staticKey = fieldBytes(fields, 2);
  const certPayload = fieldBytes(fields, 3) ?? Buffer.alloc(0);
  if (!ephemeral || ephemeral.length !== 32) {
    throw new Error("Noise: serverHello.ephemeral missing or invalid length");
  }
  if (!staticKey || staticKey.length < 32) {
    throw new Error("Noise: serverHello.static missing or too short");
  }
  return {
    ephemeral: Buffer.from(ephemeral),
    static: Buffer.from(staticKey),
    payload: Buffer.from(certPayload)
  };
}
function serverHelloToNoiseMessageA(sh) {
  return Buffer.concat([sh.ephemeral, sh.static, sh.payload]);
}
function mixHash2(h, data) {
  return (0, import_node_crypto3.createHash)("sha256").update(h).update(data).digest();
}
function startWaNoiseHandshake(opts) {
  const prologue = opts.prologue ?? Buffer.from(NOISE_MODE, "binary");
  const state = createNoiseInitiator(opts.staticKey, prologue);
  state.h = mixHash2(state.h, NOISE_WA_HEADER);
  state.h = mixHash2(state.h, opts.staticKey.public);
  const ephemeral = noiseWriteMessage1(state);
  const clientHelloProto = encodeClientHello(ephemeral);
  const body = encodeFrame(clientHelloProto);
  const firstFrame = Buffer.concat([NOISE_WA_HEADER, body]);
  return { state, firstFrame };
}
function continueWaNoiseHandshake(state, serverFramePayload, opts) {
  const sh = parseServerHello(serverFramePayload);
  const noiseMsgA = serverHelloToNoiseMessageA(sh);
  const serverPayload = noiseReadMessageA(state, noiseMsgA);
  let cert = {
    ok: false,
    reason: "no certificate payload"
  };
  if (serverPayload.length > 0) {
    cert = validateNoiseCertificate(serverPayload, opts?.trustedCertKeys);
    if (!cert.ok && isStrictCertEnabled() && cert.reason.includes("not valid")) {
      throw new Error(`Noise certificate rejected: ${cert.reason}`);
    }
  }
  const finishPayload = opts?.finishPayload ?? Buffer.alloc(0);
  const msgB = noiseWriteMessageB(state, finishPayload);
  const TAG = 16;
  const DH = 32;
  const encStatic = msgB.subarray(0, DH + TAG);
  const encPayload = msgB.subarray(DH + TAG);
  const clientFinishProto = encodeClientFinish(encStatic, encPayload.length ? encPayload : void 0);
  const keys = noiseSplit(state);
  const session = new NoiseSession(keys);
  return {
    finishFrame: encodeFrame(clientFinishProto),
    session,
    keys,
    cert,
    serverPayload
  };
}
function waNoiseKeyFromCreds(noiseKey) {
  return noiseKeyPairFromAuth(noiseKey);
}

// src/Auth/credentials.ts
var import_node_crypto6 = require("node:crypto");

// src/Utils/generics.ts
var import_node_crypto4 = require("node:crypto");
function generateRegistrationId() {
  return (0, import_node_crypto4.randomBytes)(2).readUInt16BE(0) & 16383;
}
function generateMessageID(prefix = "") {
  const id = (0, import_node_crypto4.randomBytes)(8).toString("hex").toUpperCase();
  return prefix ? `${prefix}${id}` : id;
}

// src/Utils/crypto.ts
var import_node_crypto5 = require("node:crypto");
var DH_LEN2 = 32;
function generateX25519KeyPair2() {
  const { publicKey, privateKey } = (0, import_node_crypto5.generateKeyPairSync)("x25519");
  const pubDer = publicKey.export({ type: "spki", format: "der" });
  const privDer = privateKey.export({ type: "pkcs8", format: "der" });
  return {
    public: Buffer.from(pubDer.subarray(pubDer.length - DH_LEN2)),
    private: Buffer.from(privDer.subarray(privDer.length - DH_LEN2))
  };
}
function hkdf(ikm, length, info = "", salt) {
  const saltBuf = salt && salt.length ? Buffer.from(salt) : Buffer.alloc(32, 0);
  const infoBuf = typeof info === "string" ? Buffer.from(info, "utf8") : Buffer.from(info);
  const prk = (0, import_node_crypto5.createHmac)("sha256", saltBuf).update(Buffer.from(ikm)).digest();
  const blocks = Math.ceil(length / 32);
  let t = Buffer.alloc(0);
  const okm = Buffer.alloc(blocks * 32);
  for (let i = 0; i < blocks; i++) {
    t = (0, import_node_crypto5.createHmac)("sha256", prk).update(t).update(infoBuf).update(Buffer.from([i + 1])).digest();
    t.copy(okm, i * 32);
  }
  return Buffer.from(Uint8Array.from(okm.subarray(0, length)));
}
function aesEncryptGCM(plaintext, key, iv, additionalData) {
  const cipher = (0, import_node_crypto5.createCipheriv)("aes-256-gcm", Buffer.from(key).subarray(0, 32), Buffer.from(iv));
  if (additionalData) cipher.setAAD(Buffer.from(additionalData));
  const enc = Buffer.concat([cipher.update(Buffer.from(plaintext)), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([enc, tag]);
}
function aesDecryptGCM(ciphertextWithTag, key, iv, additionalData) {
  const buf = Buffer.from(ciphertextWithTag);
  if (buf.length < 16) throw new Error("aesDecryptGCM: ciphertext too short");
  const tag = buf.subarray(buf.length - 16);
  const data = buf.subarray(0, buf.length - 16);
  const decipher = (0, import_node_crypto5.createDecipheriv)("aes-256-gcm", Buffer.from(key).subarray(0, 32), Buffer.from(iv));
  if (additionalData) decipher.setAAD(Buffer.from(additionalData));
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]);
}

// src/Utils/buffers.ts
function encodeBase64(data) {
  if (typeof data === "string") return Buffer.from(data, "utf8").toString("base64");
  return Buffer.from(data).toString("base64");
}
function decodeBase64(data) {
  return Buffer.from(data, "base64");
}

// src/Auth/credentials.ts
function keyPairFromX25519() {
  const { public: pub, private: priv } = generateX25519KeyPair2();
  return { public: new Uint8Array(pub), private: new Uint8Array(priv) };
}
function initAuthCreds() {
  const signedPreKey = {
    keyPair: keyPairFromX25519(),
    signature: new Uint8Array((0, import_node_crypto6.randomBytes)(64)),
    keyId: 1,
    timestamp: Math.floor(Date.now() / 1e3)
  };
  return {
    noiseKey: keyPairFromX25519(),
    pairingEphemeralKeyPair: keyPairFromX25519(),
    signedIdentityKey: keyPairFromX25519(),
    signedPreKey,
    registrationId: generateRegistrationId(),
    advSecretKey: encodeBase64((0, import_node_crypto6.randomBytes)(32)),
    processedHistoryMessages: [],
    nextPreKeyId: 1,
    firstUnuploadedPreKeyId: 1,
    accountSyncCounter: 0,
    accountSettings: { unarchiveChats: false },
    registered: false
  };
}
function serializeCreds(creds) {
  const encodeKP = (kp) => ({
    public: encodeBase64(Buffer.from(kp.public)),
    private: encodeBase64(Buffer.from(kp.private))
  });
  return {
    ...creds,
    noiseKey: encodeKP(creds.noiseKey),
    pairingEphemeralKeyPair: encodeKP(creds.pairingEphemeralKeyPair),
    signedIdentityKey: encodeKP(creds.signedIdentityKey),
    signedPreKey: {
      keyPair: encodeKP(creds.signedPreKey.keyPair),
      signature: encodeBase64(Buffer.from(creds.signedPreKey.signature)),
      keyId: creds.signedPreKey.keyId,
      timestamp: creds.signedPreKey.timestamp
    },
    routingInfo: creds.routingInfo ? encodeBase64(creds.routingInfo) : void 0
  };
}
function deserializeCreds(data) {
  const decodeKP = (obj) => ({
    public: new Uint8Array(Buffer.from(obj.public, "base64")),
    private: new Uint8Array(Buffer.from(obj.private, "base64"))
  });
  const raw = data;
  return {
    ...raw,
    noiseKey: decodeKP(raw.noiseKey),
    pairingEphemeralKeyPair: decodeKP(raw.pairingEphemeralKeyPair),
    signedIdentityKey: decodeKP(raw.signedIdentityKey),
    signedPreKey: {
      keyPair: decodeKP(raw.signedPreKey.keyPair),
      signature: new Uint8Array(Buffer.from(raw.signedPreKey.signature, "base64")),
      keyId: raw.signedPreKey.keyId,
      timestamp: raw.signedPreKey.timestamp
    },
    routingInfo: raw.routingInfo ? new Uint8Array(Buffer.from(raw.routingInfo, "base64")) : void 0
  };
}

// src/Defaults/version.ts
var DEFAULT_VERSION = [2, 3e3, 1025190524];

// src/Defaults/browser.ts
var DEFAULT_BROWSER = ["KaguneX", "Chrome", "Linux"];

// src/Protocol/client-payload.ts
function buildClientPayloadNode(options = {}) {
  const version = options.version ?? DEFAULT_VERSION;
  const browser = options.browser ?? DEFAULT_BROWSER;
  const hasUser = !!options.username;
  const passive = options.passive ?? !hasUser;
  const userAgent = {
    tag: "userAgent",
    attrs: {},
    content: [
      { tag: "platform", attrs: {}, content: "web" },
      {
        tag: "appVersion",
        attrs: {},
        content: [
          { tag: "primary", attrs: {}, content: String(version[0]) },
          { tag: "secondary", attrs: {}, content: String(version[1]) },
          { tag: "tertiary", attrs: {}, content: String(version[2]) }
        ]
      },
      { tag: "mcc", attrs: {}, content: "000" },
      { tag: "mnc", attrs: {}, content: "000" },
      { tag: "osVersion", attrs: {}, content: browser[2] || "0.1" },
      { tag: "device", attrs: {}, content: browser[1] || "Desktop" },
      { tag: "osBuildNumber", attrs: {}, content: "0.1" },
      { tag: "releaseChannel", attrs: {}, content: "RELEASE" },
      { tag: "localeLanguageIso6391", attrs: {}, content: "en" },
      { tag: "localeCountryIso31661Alpha2", attrs: {}, content: "US" }
    ]
  };
  const webInfo = {
    tag: "webInfo",
    attrs: {},
    content: [{ tag: "webSubPlatform", attrs: {}, content: "WEB_BROWSER" }]
  };
  const children = [
    { tag: "passive", attrs: {}, content: passive ? "true" : "false" },
    userAgent,
    webInfo,
    {
      tag: "connectType",
      attrs: {},
      content: options.connectType ?? (hasUser ? "wifi_unknown" : "wifi_unknown")
    },
    {
      tag: "connectReason",
      attrs: {},
      content: options.connectReason ?? "user_activated"
    }
  ];
  if (options.username) {
    children.unshift({
      tag: "username",
      attrs: {},
      content: options.username.replace(/@.*/, "") || options.username
    });
  }
  if (!hasUser) {
    children.push({
      tag: "devicePairingData",
      attrs: {},
      content: [
        {
          tag: "e_regid",
          attrs: {},
          content: Buffer.alloc(4).toString("base64")
        }
      ]
    });
  }
  return { tag: "clientPayload", attrs: {}, content: children };
}
function encodeClientPayload(options = {}) {
  return encodeBinaryNode(buildClientPayloadNode(options));
}

// src/Web/pairing.ts
function normalizePairingPhone(phoneNumber) {
  let digits = phoneNumber.replace(/[^\d]/g, "");
  if (digits.startsWith("0") && digits.length >= 10 && digits.length <= 13) {
    digits = "62" + digits.slice(1);
  }
  if (digits.length < 8 || digits.length > 15) {
    throw new Error(`Invalid phone number for pairing: ${phoneNumber}`);
  }
  return digits;
}
function formatPairingCode(code) {
  const clean = code.replace(/\s+/g, "").toUpperCase();
  if (clean.length === 8) {
    return `${clean.slice(0, 4)}-${clean.slice(4)}`;
  }
  return clean;
}

// src/Protocol/pairing.ts
function b64(buf) {
  if (!buf || !buf.length) return void 0;
  return Buffer.from(buf).toString("base64");
}
function keyChild(tag, pub) {
  const content = b64(pub);
  return {
    tag,
    attrs: {},
    ...content ? { content } : {}
  };
}
function buildPairingCodeIq(phoneNumber, options = {}) {
  const phone = normalizePairingPhone(phoneNumber);
  const id = options.id ?? generateMessageID();
  const stage = options.stage ?? "companion_hello";
  const attempt = options.attempt ?? 1;
  const keys = options.keys ?? {};
  const platformId = keys.platformId ?? "1";
  const platformDisplay = keys.platformDisplay ?? "Chrome (Linux)";
  const nonce = keys.nonce ?? String(attempt - 1);
  const regChildren = [
    keyChild(
      "link_code_pairing_wrapped_companion_ephemeral_pub",
      keys.companionEphemeralPub
    ),
    keyChild("companion_server_auth_key_pub", keys.companionAuthPub),
    {
      tag: "companion_platform_id",
      attrs: {},
      content: platformId
    },
    {
      tag: "companion_platform_display",
      attrs: {},
      content: platformDisplay
    },
    {
      tag: "link_code_pairing_nonce",
      attrs: {},
      content: nonce
    }
  ];
  const node = {
    tag: "iq",
    attrs: {
      to: "s.whatsapp.net",
      type: "set",
      id,
      xmlns: "md"
    },
    content: [
      {
        tag: "link_code_companion_reg",
        attrs: {
          jid: `${phone}@s.whatsapp.net`,
          stage,
          should_show_push_notification: "true"
        },
        content: regChildren
      }
    ]
  };
  return {
    phoneNumber: phone,
    id,
    node,
    encoded: encodeBinaryNode(node),
    stage,
    attempt
  };
}
function normalizePairingCode(raw) {
  const clean = raw.replace(/[\s-]/g, "").toUpperCase();
  if (!/^[A-Z0-9]{8}$/.test(clean)) return void 0;
  return formatPairingCode(clean);
}
function considerCode(value, out) {
  if (!value || out.code) return;
  const n = normalizePairingCode(value);
  if (n) out.code = n;
}
function parsePairingPayload(payload) {
  const result = {};
  try {
    walkPairing(decodeBinaryNode(payload), result);
  } catch {
  }
  return result;
}
function walkPairing(node, out) {
  const id = getBinaryNodeAttr(node, "id");
  if (node.tag === "iq" && id) out.iqId = id;
  if (node.tag === "error") {
    out.errorCode = getBinaryNodeAttr(node, "code") || out.errorCode || "error";
    out.errorText = getBinaryNodeAttr(node, "text") || getBinaryNodeAttr(node, "title") || out.errorText;
  }
  if (node.tag === "iq" && getBinaryNodeAttr(node, "type") === "error") {
    out.errorCode = getBinaryNodeAttr(node, "code") || out.errorCode || "iq_error";
    const errChild = getBinaryNodeChild(node, "error");
    if (errChild) {
      out.errorCode = getBinaryNodeAttr(errChild, "code") || out.errorCode;
      out.errorText = getBinaryNodeAttr(errChild, "text") || out.errorText;
    }
  }
  if (node.tag === "pair-success") {
    out.pairSuccess = true;
    const device = getBinaryNodeChild(node, "device");
    const jid = device && getBinaryNodeAttr(device, "jid") || getBinaryNodeAttr(node, "jid");
    if (jid) {
      out.me = {
        id: jid,
        name: getBinaryNodeAttr(node, "name") || (device ? getBinaryNodeAttr(device, "name") : void 0)
      };
    }
  }
  for (const attr of [
    "link_code",
    "code",
    "pairing_code",
    "link_code_pairing_code",
    "pairingCode"
  ]) {
    considerCode(getBinaryNodeAttr(node, attr), out);
  }
  if (typeof node.content === "string") {
    considerCode(node.content, out);
  } else if (Buffer.isBuffer(node.content) || node.content instanceof Uint8Array) {
    try {
      considerCode(Buffer.from(node.content).toString("utf8"), out);
    } catch {
    }
  }
  const status = getBinaryNodeAttr(node, "status") || getBinaryNodeAttr(node, "stage");
  if (status) out.status = status;
  for (const child of getBinaryNodeChildren(node)) {
    walkPairing(child, out);
  }
}
function pairingRetryDelayMs(attempt) {
  return Math.min(500 * 2 ** Math.max(0, attempt - 1), 8e3);
}
var DEFAULT_PAIRING_TIMEOUT_MS = 6e4;
var DEFAULT_PAIRING_MAX_ATTEMPTS = 3;

// src/Socket/pairing-controller.ts
function createPairingController(logger) {
  let active = null;
  const iqToFlow = /* @__PURE__ */ new Map();
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
    if (active === flow) active = null;
  };
  const settleReject = (flow, err) => {
    if (flow.settled) return;
    flow.settled = true;
    cleanupFlow(flow);
    flow.reject(err);
  };
  const settleResolve = (flow, code) => {
    if (flow.settled) return;
    flow.settled = true;
    cleanupFlow(flow);
    flow.resolve(code);
  };
  const cancelAll = (reason = "pairing cancelled") => {
    if (!active) return;
    const flow = active;
    logger?.info(
      { requestId: flow.requestId, reason, attempt: flow.attempt },
      "pairing cancelAll"
    );
    settleReject(flow, new Error(reason));
  };
  const onPayload = (payload) => {
    const parsed = parsePairingPayload(payload);
    if (!parsed.iqId) {
      if (parsed.code || parsed.errorCode) {
        logger?.debug(
          { hasCode: !!parsed.code, errorCode: parsed.errorCode },
          "pairing payload without iqId \u2014 ignored (unmatched)"
        );
      }
      return;
    }
    const flow = iqToFlow.get(parsed.iqId);
    if (!flow) {
      logger?.debug(
        { iqId: parsed.iqId, hasCode: !!parsed.code },
        "pairing unmatched response (unknown/stale iqId) \u2014 ignored"
      );
      return;
    }
    if (flow.settled) {
      logger?.debug(
        { iqId: parsed.iqId, requestId: flow.requestId },
        "stale pairing response \u2014 ignored"
      );
      return;
    }
    if (flow.activeIqId && flow.activeIqId !== parsed.iqId) {
      logger?.debug(
        {
          iqId: parsed.iqId,
          activeIqId: flow.activeIqId,
          requestId: flow.requestId
        },
        "pairing response for non-active attempt \u2014 ignored"
      );
      return;
    }
    if (parsed.errorCode && !parsed.code) {
      logger?.warn(
        {
          requestId: flow.requestId,
          iqId: parsed.iqId,
          attempt: flow.attempt,
          errorCode: parsed.errorCode,
          errorText: parsed.errorText
        },
        "pairing error response"
      );
      settleReject(
        flow,
        new Error(
          `PAIRING FAILED: pairing error ${parsed.errorCode}${parsed.errorText ? `: ${parsed.errorText}` : ""}`
        )
      );
      return;
    }
    if (parsed.code) {
      const code = parsed.code.includes("-") ? parsed.code : formatPairingCode(parsed.code);
      logger?.info(
        {
          requestId: flow.requestId,
          iqId: parsed.iqId,
          attempt: flow.attempt
        },
        "pairing code received"
      );
      settleResolve(flow, code);
      return;
    }
    logger?.warn(
      { requestId: flow.requestId, iqId: parsed.iqId, attempt: flow.attempt },
      "UNEXPECTED_PAIRING_RESPONSE \u2014 matched IQ without code"
    );
    settleReject(flow, new Error("PAIRING FAILED: UNEXPECTED_PAIRING_RESPONSE"));
  };
  const requestCode = (phoneNumber, opts) => {
    if (!opts?.session || !opts?.send) {
      return Promise.reject(
        new Error("PAIRING FAILED: session and send are required")
      );
    }
    if (opts.creds?.registered === true) {
      return Promise.reject(
        new Error(
          "PAIRING FAILED: already registered \u2014 use existing session (do not request pairing code)"
        )
      );
    }
    if (active && !active.settled) {
      return Promise.reject(new Error("PAIRING_ALREADY_IN_PROGRESS"));
    }
    let phone;
    try {
      phone = normalizePairingPhone(phoneNumber);
    } catch (err) {
      return Promise.reject(
        new Error(
          `PAIRING FAILED: invalid number \u2014 ${err instanceof Error ? err.message : String(err)}`
        )
      );
    }
    const timeoutMs = opts.timeoutMs ?? DEFAULT_PAIRING_TIMEOUT_MS;
    const maxAttempts = opts.maxAttempts ?? DEFAULT_PAIRING_MAX_ATTEMPTS;
    const requestId = generateMessageID("pair");
    const createdAt = Date.now();
    const overallDeadline = createdAt + timeoutMs;
    return new Promise((resolve, reject) => {
      const overallTimer = setTimeout(() => {
        if (!flow.settled) {
          logger?.warn(
            { requestId, attempt: flow.attempt, timeoutMs },
            "pairing overall timeout"
          );
          settleReject(
            flow,
            new Error(
              `PAIRING FAILED: pairing code request timed out after ${timeoutMs}ms`
            )
          );
        }
      }, timeoutMs);
      const flow = {
        requestId,
        phoneNumber: phone,
        iqIds: /* @__PURE__ */ new Set(),
        activeIqId: null,
        attempt: 0,
        maxAttempts,
        createdAt,
        overallDeadline,
        resolve,
        reject,
        overallTimer,
        attemptTimer: null,
        settled: false
      };
      active = flow;
      const keys = opts.creds ? {
        companionEphemeralPub: Buffer.from(
          opts.creds.pairingEphemeralKeyPair.public
        ),
        companionAuthPub: Buffer.from(opts.creds.noiseKey.public),
        platformDisplay: opts.creds.platform ? String(opts.creds.platform) : void 0
      } : void 0;
      const runAttempt = (attempt) => {
        if (flow.settled) return;
        if (Date.now() > flow.overallDeadline) {
          settleReject(
            flow,
            new Error("PAIRING FAILED: pairing code request timed out")
          );
          return;
        }
        if (attempt > maxAttempts) {
          settleReject(
            flow,
            new Error(
              `PAIRING FAILED: pairing code request failed after ${maxAttempts} attempts`
            )
          );
          return;
        }
        flow.attempt = attempt;
        const req = buildPairingCodeIq(phone, {
          keys,
          attempt
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
          timeoutMs
        };
        try {
          opts.send(req.encoded);
          logger?.info(
            {
              requestId: meta.requestId,
              iqId: meta.iqId,
              phone: meta.phoneNumber,
              attempt: meta.attempt,
              maxAttempts
            },
            "pairing IQ sent"
          );
        } catch (err) {
          logger?.warn(
            {
              requestId,
              iqId: req.id,
              attempt,
              err: err instanceof Error ? err.message : String(err)
            },
            "pairing IQ send failed"
          );
          flow.activeIqId = null;
          if (attempt >= maxAttempts) {
            settleReject(
              flow,
              err instanceof Error ? err : new Error(`PAIRING FAILED: ${String(err)}`)
            );
            return;
          }
          const delay2 = pairingRetryDelayMs(attempt);
          flow.attemptTimer = setTimeout(() => {
            flow.attemptTimer = null;
            if (!flow.settled) void runAttempt(attempt + 1);
          }, delay2);
          return;
        }
        const remaining = Math.max(0, flow.overallDeadline - Date.now());
        const attemptWindow = Math.min(
          remaining,
          Math.max(pairingRetryDelayMs(attempt), 5e3)
        );
        if (attempt < maxAttempts && attemptWindow > 0) {
          flow.attemptTimer = setTimeout(() => {
            flow.attemptTimer = null;
            if (flow.settled) return;
            logger?.debug(
              { requestId, iqId: req.id, attempt },
              "pairing attempt window elapsed \u2014 trying next attempt"
            );
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
    pendingCount: () => active && !active.settled ? 1 : 0,
    isBusy: () => !!(active && !active.settled),
    isActiveIq: (iqId) => {
      if (!iqId || !active || active.settled) return false;
      return active.activeIqId === iqId;
    }
  };
}

// src/Socket/iq-controller.ts
function createIqController(logger) {
  const waiters = /* @__PURE__ */ new Map();
  const cancelAll = (reason = "iq cancelled") => {
    for (const [, w] of waiters) {
      clearTimeout(w.timer);
      w.reject(new Error(reason));
    }
    waiters.clear();
  };
  const onPayload = (payload) => {
    try {
      const node = decodeBinaryNode(payload);
      if (node.tag !== "iq") return;
      const id = getBinaryNodeAttr(node, "id");
      if (!id) return;
      const w = waiters.get(id);
      if (!w) return;
      clearTimeout(w.timer);
      waiters.delete(id);
      const type = getBinaryNodeAttr(node, "type");
      if (type === "error") {
        const code = getBinaryNodeAttr(node, "code") || "iq_error";
        w.reject(new Error(`IQ error ${code}`));
      } else {
        w.resolve(node);
      }
    } catch {
    }
  };
  const query = (encodedIq, iqId, net, timeoutMs = 3e4) => {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        waiters.delete(iqId);
        reject(new Error(`IQ timeout id=${iqId}`));
      }, timeoutMs);
      waiters.set(iqId, { id: iqId, resolve, reject, timer });
      try {
        net.send(encodedIq);
        logger?.debug({ id: iqId }, "IQ sent");
      } catch (err) {
        clearTimeout(timer);
        waiters.delete(iqId);
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    });
  };
  return { onPayload, query, cancelAll };
}

// src/Web/qr.ts
function printQRInTerminal(qr) {
  console.log("[KaguneX] QR payload:");
  console.log(qr);
}
function formatQRForDisplay(qr) {
  return qr;
}

// src/Socket/connection.ts
function createConnectionController(config, state, ev, logger) {
  let keepAliveTimer;
  let connectTimer;
  let stopped = false;
  let reconnectAttempt = 0;
  const maxReconnect = DEFAULT_MAX_RECONNECT;
  let rxBufBytes = 0;
  let noiseState;
  let phase = "idle";
  let session;
  let rxBuf = Buffer.alloc(0);
  const pairing = createPairingController(logger);
  const iq = createIqController(logger);
  const rm = createReconnectManager(logger, {
    ...DEFAULT_RECONNECT,
    maxRetries: DEFAULT_MAX_RECONNECT
  });
  const eventBuffer = new EventBuffer(500);
  let activeGen = 0;
  let payloadHandler;
  let readyWaiters = [];
  const isPairingReady = () => !!session && (phase === "login_sent" || phase === "noise_done");
  const settleReadyWaiters = (err) => {
    if (readyWaiters.length === 0) return;
    const list = readyWaiters;
    readyWaiters = [];
    for (const w of list) {
      if (w.timer) clearTimeout(w.timer);
      if (err) w.reject(err);
      else w.resolve();
    }
  };
  const waitForPairingReady = (timeoutMs = 6e4) => {
    if (isPairingReady()) return Promise.resolve();
    if (phase === "failed" || state.connection === "close") {
      return Promise.reject(
        new Error(
          "PAIRING FAILED: socket closed or Noise handshake failed before pairing readiness"
        )
      );
    }
    return new Promise((resolve, reject) => {
      const waiter = {
        resolve: () => resolve(),
        reject,
        timer: null
      };
      if (timeoutMs > 0) {
        waiter.timer = setTimeout(() => {
          waiter.timer = null;
          const idx = readyWaiters.indexOf(waiter);
          if (idx >= 0) readyWaiters.splice(idx, 1);
          reject(
            new Error(
              `PAIRING FAILED: timed out waiting for Noise handshake + client payload (${timeoutMs}ms)`
            )
          );
        }, timeoutMs);
      }
      readyWaiters.push(waiter);
      if (isPairingReady()) {
        settleReadyWaiters();
      }
    });
  };
  const safeConnectionUpdate = (update) => {
    emitConnectionUpdate(ev, update, eventBuffer);
  };
  const clearTimers = () => {
    if (keepAliveTimer) {
      clearInterval(keepAliveTimer);
      keepAliveTimer = void 0;
    }
    if (connectTimer) {
      clearTimeout(connectTimer);
      connectTimer = void 0;
    }
  };
  const ensureNoiseKey = () => {
    if (!state.auth) {
      return waNoiseKeyFromCreds(initAuthCreds().noiseKey);
    }
    return waNoiseKeyFromCreds(state.auth.creds.noiseKey);
  };
  const sendClientPayload = () => {
    if (!session) return;
    const creds = state.auth?.creds;
    const registered = shouldSkipPairingOnReconnect(creds);
    const username = registered ? creds?.me?.id : void 0;
    const payload = encodeClientPayload({
      version: config.version,
      browser: config.browser,
      username,
      passive: !registered
    });
    const frame = session.seal(payload);
    transport.send(frame);
    phase = "login_sent";
    logger?.info(
      {
        bytes: payload.length,
        mode: resolveLoginMode(creds),
        registered
      },
      "sent client payload after Noise"
    );
    settleReadyWaiters();
  };
  const handleDecrypted = (pt) => {
    pairing.onPayload(pt);
    iq.onPayload(pt);
    payloadHandler?.(pt);
    const disc = detectDisconnectFromPayload(pt);
    if (disc) {
      logger?.warn({ disc }, "disconnect signal from payload");
      if (disc.isLoggedOut && state.auth) {
        const patch = applyLoggedOut(state.auth.creds);
        Object.assign(state.auth.creds, patch);
        state.user = void 0;
        ev.emit("creds.update", patch);
      }
      state.connection = "close";
      state.lastDisconnect = { error: disc, date: /* @__PURE__ */ new Date() };
      pairing.cancelAll(disc.isLoggedOut ? "logged out" : "connection closed");
      safeConnectionUpdate({
        connection: "close",
        lastDisconnect: state.lastDisconnect
      });
      if (disc.isLoggedOut) {
        stopped = true;
        transport.close(1e3, "logged-out");
        return;
      }
    }
    {
      const pairingParsed = parsePairingPayload(pt);
      if (pairingParsed.code && state.auth && pairing.isActiveIq(pairingParsed.iqId)) {
        state.auth.creds.pairingCode = pairingParsed.code.replace("-", "");
        ev.emit("creds.update", { pairingCode: state.auth.creds.pairingCode });
      }
      const applied = applyPairSuccess(pairingParsed, state.auth?.creds);
      if (applied && state.auth) {
        Object.assign(state.auth.creds, applied.credsPatch);
        if (applied.credsPatch.me) {
          state.user = {
            id: applied.credsPatch.me.id,
            name: applied.credsPatch.me.name
          };
        }
        ev.emit("creds.update", applied.credsPatch);
        state.connection = "open";
        safeConnectionUpdate(applied.connectionUpdate);
        pairing.cancelAll("pair-success");
        logger?.info(
          { me: state.user?.id },
          "pair-success \u2014 credentials updated (persist via saveCreds); native Linked Devices notification is handled by WhatsApp"
        );
        reconnectAttempt = 0;
      }
    }
    const parsed = parseProtocolPayload(pt);
    if (parsed.nodes.length) {
      logger?.debug(
        { tags: parsed.nodes.map((n) => n.tag), qrRefs: parsed.qrRefs.length },
        "protocol node(s)"
      );
    } else {
      logger?.trace({ bytes: pt.length }, "non-node decrypted frame");
    }
    if (parsed.streamError) {
      logger?.warn({ streamError: parsed.streamError }, "stream/iq error");
    }
    for (const ref of parsed.qrRefs) {
      const creds = state.auth?.creds;
      if (!creds) {
        logger?.warn("got server ref but no auth creds to compose QR");
        continue;
      }
      const qr = buildQrFromServerRef(ref, creds);
      if (!qr) continue;
      state.qr = qr;
      safeConnectionUpdate({
        connection: "connecting",
        qr,
        isNewLogin: !creds.registered
      });
      if (config.printQRInTerminal) {
        printQRInTerminal(qr);
      }
      logger?.info("emitted QR from server ref (real ref, local keys)");
    }
    const authReady = !!state.auth?.creds.registered && !!state.auth?.creds.me?.id;
    if (authReady && (parsed.pairSuccess || parsed.success)) {
      state.connection = "open";
      safeConnectionUpdate({
        connection: "open",
        isNewLogin: !!parsed.pairSuccess
      });
      logger?.info("connection marked open after protocol success (auth ready)");
    }
  };
  const onHandshakeBytes = (chunk) => {
    if (!noiseState || phase === "failed") return;
    rxBuf = Buffer.concat([rxBuf, chunk]);
    if (rxBuf.length > DEFAULT_RX_BUFFER_MAX) {
      logger?.error({ len: rxBuf.length }, "rx buffer overflow during handshake");
      phase = "failed";
      settleReadyWaiters(
        new Error("PAIRING FAILED: buffer overflow during Noise handshake")
      );
      transport.close(1009, "buffer-overflow");
      return;
    }
    if (phase === "sent_e") {
      const framed = decodeFrame(rxBuf);
      if (!framed) return;
      rxBuf = Buffer.from(framed.rest);
      try {
        const cont = continueWaNoiseHandshake(noiseState, framed.payload);
        if (cont.cert.ok) logger?.info("Noise certificate signature OK");
        else if (cont.serverPayload.length)
          logger?.warn({ reason: cont.cert.reason }, "Noise certificate validation");
        transport.send(cont.finishFrame);
        session = cont.session;
        phase = "noise_done";
        logger?.info("Noise XX (WA): handshake complete \u2014 sending client payload");
        safeConnectionUpdate({
          connection: "connecting",
          isNewLogin: !state.auth?.creds.registered
        });
        sendClientPayload();
      } catch (err) {
        phase = "failed";
        logger?.error({ err }, "Noise XX: handshake failed");
        state.lastDisconnect = {
          error: err instanceof Error ? err : new Error(String(err)),
          date: /* @__PURE__ */ new Date()
        };
        settleReadyWaiters(
          err instanceof Error ? err : new Error("PAIRING FAILED: Noise handshake failed")
        );
        safeConnectionUpdate({
          connection: "close",
          lastDisconnect: state.lastDisconnect
        });
        transport.close(1e3, "noise-failed");
      }
      return;
    }
  };
  const transport = new WebSocketTransport(
    {
      onOpen: () => {
        if (!rm.isCurrent(activeGen)) {
          logger?.debug({ activeGen, gen: rm.generation }, "stale onOpen ignored");
          return;
        }
        clearTimers();
        phase = "idle";
        session = void 0;
        rxBuf = Buffer.alloc(0);
        noiseState = void 0;
        rm.markOpen(activeGen);
        const flushed = eventBuffer.flush(ev);
        if (flushed) logger?.info({ flushed }, "flushed buffered events after reconnect");
        logger?.info({ generation: activeGen }, "WebSocket open \u2014 starting Noise XX");
        state.connection = "connecting";
        safeConnectionUpdate({ connection: "connecting" });
        try {
          const started = startWaNoiseHandshake({ staticKey: ensureNoiseKey() });
          noiseState = started.state;
          transport.send(started.firstFrame);
          phase = "sent_e";
          logger?.info("Noise XX (WA): sent ephemeral message 1");
        } catch (err) {
          phase = "failed";
          logger?.error({ err }, "Noise XX: failed to start");
          settleReadyWaiters(
            err instanceof Error ? err : new Error("PAIRING FAILED: Noise handshake failed to start")
          );
        }
        const interval = config.keepAliveIntervalMs ?? DEFAULT_KEEP_ALIVE_INTERVAL_MS;
        keepAliveTimer = setInterval(() => {
          if (!session || !transport.isOpen) return;
          try {
            logger?.trace({ write: session.writeCounter }, "app keep-alive tick");
          } catch {
          }
        }, interval);
        if (typeof keepAliveTimer === "object" && "unref" in keepAliveTimer) {
          keepAliveTimer.unref?.();
        }
      },
      onClose: (code, reason) => {
        clearTimers();
        phase = "idle";
        session = void 0;
        state.connection = "close";
        state.lastDisconnect = {
          error: { code, message: reason },
          date: /* @__PURE__ */ new Date()
        };
        settleReadyWaiters(
          new Error(
            `PAIRING FAILED: connection closed before pairing readiness (${code}: ${reason || "closed"})`
          )
        );
        eventBuffer.start();
        safeConnectionUpdate({
          connection: "close",
          lastDisconnect: state.lastDisconnect
        });
        const decision = rm.onClose(activeGen, {
          intentional: transport.wasIntentionalClose,
          stopped,
          code,
          reasonText: reason
        });
        if (!decision.should) {
          if (decision.reason === "max retries") {
            logger?.warn({ generation: activeGen }, "reconnect exhausted");
          }
          eventBuffer.stop();
          return;
        }
        void (async () => {
          const waited = await rm.waitBackoff();
          if (waited < 0 || stopped || !rm.isCurrent(activeGen) && rm.generation !== activeGen) {
          }
          if (stopped) {
            eventBuffer.clear();
            return;
          }
          if (transport.isOpen || transport.isConnecting) {
            logger?.debug("skip reconnect connect \u2014 already open/connecting");
            return;
          }
          activeGen = rm.beginConnect();
          state.connection = "connecting";
          safeConnectionUpdate({ connection: "connecting" });
          try {
            transport.connect();
          } catch (err) {
            logger?.error({ err }, "reconnect connect failed");
          }
        })();
      },
      onError: (err) => {
        logger?.error({ err: err.message }, "connection error");
        state.lastDisconnect = { error: err, date: /* @__PURE__ */ new Date() };
      },
      onMessage: (data) => {
        if (phase === "sent_e") {
          onHandshakeBytes(data);
          return;
        }
        if ((phase === "noise_done" || phase === "login_sent") && session) {
          try {
            const payloads = session.open(data);
            for (const pt of payloads) handleDecrypted(pt);
          } catch (err) {
            logger?.error({ err }, "decrypt/protocol failed");
          }
          return;
        }
      }
    },
    logger,
    {
      handshakeTimeoutMs: config.connectTimeoutMs ? Math.min(config.connectTimeoutMs, DEFAULT_WS_HANDSHAKE_TIMEOUT_MS) : DEFAULT_WS_HANDSHAKE_TIMEOUT_MS,
      pingIntervalMs: config.keepAliveIntervalMs ?? DEFAULT_WS_PING_INTERVAL_MS,
      pongTimeoutMs: DEFAULT_WS_PONG_TIMEOUT_MS
    }
  );
  const requestPairingCode = async (phoneNumber, timeoutMs = 6e4) => {
    if (state.auth?.creds?.registered === true) {
      throw new Error(
        "PAIRING FAILED: already registered \u2014 use existing session (do not request pairing code)"
      );
    }
    if (!isPairingReady()) {
      logger?.info("requestPairingCode: waiting for Noise handshake + client payload");
      await waitForPairingReady(timeoutMs);
    }
    if (!session || !isPairingReady()) {
      throw new Error(
        "PAIRING FAILED: requestPairingCode requires completed Noise handshake + client payload"
      );
    }
    return pairing.requestCode(phoneNumber, {
      timeoutMs,
      session,
      send: (plaintext) => {
        transport.send(session.seal(plaintext));
      },
      creds: state.auth?.creds
    });
  };
  return {
    transport,
    getSession: () => session,
    isPairingReady,
    waitForPairingReady,
    requestPairingCode,
    sendPlaintext: (plaintext) => {
      if (!session) throw new Error("no Noise session \u2014 not connected");
      transport.send(session.seal(plaintext));
    },
    getIq: () => iq,
    setPayloadHandler: (handler) => {
      payloadHandler = handler;
    },
    start() {
      stopped = false;
      rm.cancel();
      activeGen = rm.beginConnect();
      state.connection = "connecting";
      safeConnectionUpdate({ connection: "connecting" });
      const timeout = config.connectTimeoutMs ?? DEFAULT_CONNECT_TIMEOUT_MS;
      connectTimer = setTimeout(() => {
        transport.close(1e3, "timeout");
        state.connection = "close";
        state.lastDisconnect = {
          error: { code: 408, message: "Connection timeout" },
          date: /* @__PURE__ */ new Date()
        };
        settleReadyWaiters(
          new Error("PAIRING FAILED: connection timeout before pairing readiness")
        );
        safeConnectionUpdate({
          connection: "close",
          lastDisconnect: state.lastDisconnect
        });
      }, timeout);
      try {
        transport.connect();
      } catch (err) {
        clearTimers();
        state.connection = "close";
        state.lastDisconnect = {
          error: err instanceof Error ? err : new Error(String(err)),
          date: /* @__PURE__ */ new Date()
        };
        settleReadyWaiters(
          err instanceof Error ? err : new Error("PAIRING FAILED: failed to open WebSocket")
        );
        safeConnectionUpdate({
          connection: "close",
          lastDisconnect: state.lastDisconnect
        });
      }
    },
    stop(error) {
      stopped = true;
      rm.cancel();
      eventBuffer.clear();
      pairing.cancelAll("connection stopped");
      iq.cancelAll("connection stopped");
      clearTimers();
      settleReadyWaiters(
        error ?? new Error("PAIRING FAILED: connection stopped before pairing readiness")
      );
      transport.close();
      session = void 0;
      phase = "idle";
      state.connection = "close";
      if (error) state.lastDisconnect = { error, date: /* @__PURE__ */ new Date() };
      safeConnectionUpdate({
        connection: "close",
        lastDisconnect: state.lastDisconnect
      });
    }
  };
}

// src/Messages/generate.ts
function generateWAMessage(jid, content, options = {}) {
  const key = {
    remoteJid: jid,
    fromMe: true,
    id: options.messageId ?? generateMessageID()
  };
  return {
    key,
    message: contentToProto(content, options),
    messageTimestamp: options.timestamp ?? Math.floor(Date.now() / 1e3)
  };
}
function generateWAMessageFromContent(jid, message, options = {}) {
  return {
    key: {
      remoteJid: jid,
      fromMe: true,
      id: options.messageId ?? generateMessageID()
    },
    message,
    messageTimestamp: options.timestamp ?? Math.floor(Date.now() / 1e3)
  };
}
function contentToProto(content, options) {
  const c = content;
  if ("react" in c && c.react) {
    return {
      reactionMessage: {
        text: c.react.text,
        key: c.react.key
      }
    };
  }
  if ("text" in c && c.text !== void 0) {
    const quoted = c.quoted || options.quoted;
    if (c.mentions?.length || quoted) {
      return {
        extendedTextMessage: {
          text: c.text,
          contextInfo: {
            mentionedJid: c.mentions,
            stanzaId: quoted?.key?.id,
            participant: quoted?.key?.participant,
            quotedMessage: quoted?.message || void 0
          }
        }
      };
    }
    return { conversation: c.text };
  }
  if ("image" in c) {
    return {
      imageMessage: {
        caption: c.caption,
        mimetype: c.mimetype || "image/jpeg"
      }
    };
  }
  if ("video" in c) {
    return {
      videoMessage: {
        caption: c.caption,
        mimetype: c.mimetype || "video/mp4"
      }
    };
  }
  if ("audio" in c) {
    return {
      audioMessage: {
        mimetype: c.mimetype || "audio/ogg; codecs=opus",
        ptt: c.ptt
      }
    };
  }
  if ("document" in c) {
    return {
      documentMessage: {
        mimetype: c.mimetype || "application/octet-stream",
        fileName: c.fileName
      }
    };
  }
  if ("sticker" in c) {
    return { stickerMessage: { mimetype: "image/webp" } };
  }
  if ("contact" in c) {
    return {
      contactMessage: {
        displayName: c.contact.fullName,
        vcard: c.contact.vcard
      }
    };
  }
  if ("location" in c) {
    return {
      locationMessage: {
        degreesLatitude: c.location.degreesLatitude,
        degreesLongitude: c.location.degreesLongitude,
        name: c.location.name,
        address: c.location.address
      }
    };
  }
  throw new Error("Unsupported message content");
}

// src/Messages/normalize.ts
function normalizeMessage(msg) {
  return {
    ...msg,
    key: {
      ...msg.key,
      fromMe: !!msg.key.fromMe,
      id: msg.key.id ?? "",
      remoteJid: msg.key.remoteJid ?? ""
    },
    messageTimestamp: typeof msg.messageTimestamp === "number" ? msg.messageTimestamp : Math.floor(Date.now() / 1e3)
  };
}

// src/WAProto/message-codec.ts
var MAGIC = Buffer.from("KXM1");
function encodeTextMessagePayload(text) {
  const body = Buffer.from(text, "utf8");
  const header = Buffer.alloc(8);
  MAGIC.copy(header, 0);
  header[4] = 1;
  header[5] = 0;
  header.writeUInt16BE(0, 6);
  return Buffer.concat([header, body]);
}
function decodeMessagePayload(data) {
  const buf = Buffer.from(data);
  if (buf.length >= 8 && buf.subarray(0, 4).equals(MAGIC)) {
    const type = buf[4];
    const payload = buf.subarray(8);
    if (type === 1) {
      return { type: "text", text: payload.toString("utf8") };
    }
    return { type: "unknown", raw: buf };
  }
  try {
    const asText = buf.toString("utf8");
    if (asText.length > 0 && !/[\x00-\x08\x0e-\x1f]/.test(asText.slice(0, 32))) {
      return { type: "text", text: asText };
    }
  } catch {
  }
  return { type: "unknown", raw: buf };
}

// src/WAProto/message.ts
function encodeWaMessageContent(content) {
  if (content.conversation) {
    return encodeString(1, content.conversation);
  }
  if (content.extendedTextMessage?.text) {
    const inner = encodeString(1, content.extendedTextMessage.text);
    return encodeBytes(6, inner);
  }
  if (content.reactionMessage) {
    const parts = [];
    if (content.reactionMessage.key?.id) {
      const keyParts = [];
      if (content.reactionMessage.key.remoteJid) {
        keyParts.push(encodeString(1, content.reactionMessage.key.remoteJid));
      }
      if (content.reactionMessage.key.fromMe != null) {
        keyParts.push(encodeVarint(2, content.reactionMessage.key.fromMe ? 1 : 0));
      }
      keyParts.push(encodeString(3, content.reactionMessage.key.id));
      parts.push(encodeBytes(1, Buffer.concat(keyParts)));
    }
    if (content.reactionMessage.text != null) {
      parts.push(encodeString(2, content.reactionMessage.text));
    }
    return encodeBytes(46, Buffer.concat(parts));
  }
  const text = content.conversation || content.extendedTextMessage?.text || "";
  return encodeTextMessagePayload(text);
}
function decodeWaMessageContent(buf) {
  const data = Buffer.from(buf);
  try {
    const fields = readFields(data);
    const conversation = fieldString(fields, 1);
    if (conversation) return { conversation };
    const ext = fieldBytes(fields, 6);
    if (ext) {
      const inner = readFields(ext);
      const text = fieldString(inner, 1);
      if (text) return { extendedTextMessage: { text } };
    }
    const reaction = fieldBytes(fields, 46);
    if (reaction) {
      const inner = readFields(reaction);
      const keyBuf = fieldBytes(inner, 1);
      const text = fieldString(inner, 2) ?? "";
      let key;
      if (keyBuf) {
        const kf = readFields(keyBuf);
        key = {
          remoteJid: fieldString(kf, 1),
          fromMe: fieldString(kf, 2) != null ? false : void 0,
          id: fieldString(kf, 3)
        };
      }
      return { reactionMessage: { key, text } };
    }
  } catch {
  }
  const legacy = decodeMessagePayload(data);
  if (legacy.type === "text") {
    return { conversation: legacy.text };
  }
  return {};
}

// src/Protocol/message-node.ts
function buildMessageNode(opts) {
  const id = opts.id ?? generateMessageID();
  const body = opts.body ?? encodeWaMessageContent(opts.content);
  const attrs = {
    to: opts.to,
    id,
    type: "text"
  };
  if (opts.participant) attrs.participant = opts.participant;
  const node = {
    tag: "message",
    attrs,
    content: body
  };
  return { id, node, encoded: encodeBinaryNode(node) };
}
function decodeBodyToContent(body) {
  try {
    const content = decodeWaMessageContent(body);
    if (content.conversation || content.extendedTextMessage || content.imageMessage || content.reactionMessage || content.protocolMessage) {
      return content;
    }
  } catch {
  }
  const legacy = decodeMessagePayload(body);
  if (legacy.type === "text" && legacy.text) {
    return { conversation: legacy.text };
  }
  return void 0;
}
function parseMessageNode(payload) {
  try {
    const node = decodeBinaryNode(payload);
    if (node.tag !== "message") return void 0;
    const remoteJid = getBinaryNodeAttr(node, "from") || getBinaryNodeAttr(node, "to") || "";
    const id = getBinaryNodeAttr(node, "id") || "";
    const participant = getBinaryNodeAttr(node, "participant");
    const fromMe = getBinaryNodeAttr(node, "fromMe") === "true";
    let message;
    if (Buffer.isBuffer(node.content) || node.content instanceof Uint8Array) {
      message = decodeBodyToContent(Buffer.from(node.content));
    } else if (typeof node.content === "string") {
      message = { conversation: node.content };
    } else {
      const body = getBinaryNodeChild(node, "body");
      if (body && typeof body.content === "string") {
        message = { conversation: body.content };
      }
    }
    return {
      key: { remoteJid, id, fromMe, participant },
      message: message ?? null,
      messageTimestamp: Math.floor(Date.now() / 1e3)
    };
  } catch {
    return void 0;
  }
}
function isMessageNodePayload(payload) {
  try {
    return decodeBinaryNode(payload).tag === "message";
  } catch {
    return false;
  }
}

// src/Signal/session.ts
var import_node_crypto7 = require("node:crypto");
var MAX_SKIP = 100;
function x25519Agree(privateKey, publicKey) {
  const pkcs8Prefix = Buffer.from("302e020100300506032b656e04220420", "hex");
  const spkiPrefix = Buffer.from("302a300506032b656e032100", "hex");
  const priv = (0, import_node_crypto7.createPrivateKey)({
    key: Buffer.concat([pkcs8Prefix, privateKey]),
    format: "der",
    type: "pkcs8"
  });
  const pub = (0, import_node_crypto7.createPublicKey)({
    key: Buffer.concat([spkiPrefix, publicKey]),
    format: "der",
    type: "spki"
  });
  return (0, import_node_crypto7.diffieHellman)({ privateKey: priv, publicKey: pub });
}
function kdfRoot(rootKey, dhOut) {
  const out = hkdf(Buffer.concat([rootKey, dhOut]), 64, "WhisperRatchet");
  return { rootKey: out.subarray(0, 32), chainKey: out.subarray(32, 64) };
}
function kdfChain(chainKey) {
  const messageKey = hkdf(chainKey, 32, "WhisperMessageKeys");
  const next = hkdf(chainKey, 32, "WhisperChain");
  return { chainKey: next, messageKey };
}
function signalEncrypt(session, plaintext) {
  const { chainKey, messageKey } = kdfChain(session.sending.chainKey);
  const iv = (0, import_node_crypto7.randomBytes)(12);
  const body = aesEncryptGCM(Buffer.from(plaintext), messageKey, iv);
  const ciphertext = Buffer.concat([iv, body]);
  const counter = session.sending.counter;
  const ratchetPub = Buffer.from(session.localRatchetPub ?? session.localRatchet.public);
  return {
    session: {
      ...session,
      sending: { chainKey, counter: counter + 1 }
    },
    message: { counter, ratchetPub, ciphertext }
  };
}
function skipMessageKeys(chain, until, skipped, prefix) {
  let c = { ...chain };
  while (c.counter < until) {
    if (Object.keys(skipped).length > MAX_SKIP) {
      throw new Error("too many skipped message keys");
    }
    const adv = kdfChain(c.chainKey);
    skipped[`${prefix}:${c.counter}`] = adv.messageKey;
    c = { chainKey: adv.chainKey, counter: c.counter + 1 };
  }
  return c;
}
function signalDecrypt(session, message) {
  const skipped = { ...session.skipped };
  const skipKey = `recv:${message.counter}`;
  if (skipped[skipKey]) {
    const mk = skipped[skipKey];
    delete skipped[skipKey];
    const iv2 = message.ciphertext.subarray(0, 12);
    const ct2 = message.ciphertext.subarray(12);
    return {
      session: { ...session, skipped },
      plaintext: aesDecryptGCM(ct2, mk, iv2)
    };
  }
  let receiving = { ...session.receiving };
  let rootKey = session.rootKey;
  let remoteRatchetPub = session.remoteRatchetPub;
  if (message.ratchetPub && (!remoteRatchetPub || !message.ratchetPub.equals(remoteRatchetPub))) {
    const dhOut = x25519Agree(Buffer.from(session.localRatchet.private), message.ratchetPub);
    const stepped = kdfRoot(rootKey, dhOut);
    rootKey = stepped.rootKey;
    receiving = { chainKey: stepped.chainKey, counter: 0 };
    remoteRatchetPub = message.ratchetPub;
  }
  if (message.counter < receiving.counter) {
    throw new Error("message counter already processed");
  }
  if (message.counter > receiving.counter) {
    receiving = skipMessageKeys(receiving, message.counter, skipped, "recv");
  }
  const { chainKey, messageKey } = kdfChain(receiving.chainKey);
  const iv = message.ciphertext.subarray(0, 12);
  const ct = message.ciphertext.subarray(12);
  const plaintext = aesDecryptGCM(ct, messageKey, iv);
  return {
    session: {
      ...session,
      rootKey,
      remoteRatchetPub,
      receiving: { chainKey, counter: receiving.counter + 1 },
      skipped
    },
    plaintext
  };
}

// src/Signal/wire.ts
var SIGNAL_WIRE_MAGIC = Buffer.from("KXS1");
function encodeSignalWire(message) {
  const pub = message.ratchetPub;
  if (pub.length !== 32) throw new Error("ratchetPub must be 32 bytes");
  const header = Buffer.alloc(4 + 1 + 4 + 32);
  SIGNAL_WIRE_MAGIC.copy(header, 0);
  header.writeUInt8(1, 4);
  header.writeUInt32BE(message.counter >>> 0, 5);
  pub.copy(header, 9);
  return Buffer.concat([header, message.ciphertext]);
}
function decodeSignalWire(buf) {
  if (buf.length < 41) {
    throw new Error("signal wire too short");
  }
  if (!buf.subarray(0, 4).equals(SIGNAL_WIRE_MAGIC)) {
    throw new Error("invalid signal wire magic");
  }
  const counter = buf.readUInt32BE(5);
  const ratchetPub = Buffer.from(buf.subarray(9, 41));
  const ciphertext = Buffer.from(buf.subarray(41));
  return { counter, ratchetPub, ciphertext };
}
function wrapEncryptedBody(opts) {
  return Buffer.concat([Buffer.from([opts.type ?? 0]), opts.signalWire]);
}
function unwrapEncryptedBody(buf) {
  if (buf.length < 2) throw new Error("encrypted body too short");
  return { type: buf[0], signalWire: Buffer.from(buf.subarray(1)) };
}

// src/Messages/dedup.ts
var MessageDeduper = class {
  seen = /* @__PURE__ */ new Map();
  ttlMs;
  maxSize;
  constructor(ttlMs = 5 * 6e4, maxSize = 5e3) {
    this.ttlMs = ttlMs;
    this.maxSize = maxSize;
  }
  key(remoteJid, id, fromMe) {
    return `${fromMe ? "1" : "0"}:${remoteJid}:${id}`;
  }
  /** Returns true if this is the first time seeing the message. */
  checkAndAdd(remoteJid, id, fromMe) {
    this.gc();
    const k = this.key(remoteJid, id, fromMe);
    if (this.seen.has(k)) return false;
    this.seen.set(k, Date.now());
    if (this.seen.size > this.maxSize) {
      const first = this.seen.keys().next().value;
      if (first) this.seen.delete(first);
    }
    return true;
  }
  has(remoteJid, id, fromMe) {
    return this.seen.has(this.key(remoteJid, id, fromMe));
  }
  gc() {
    const now = Date.now();
    for (const [k, t] of this.seen) {
      if (now - t > this.ttlMs) this.seen.delete(k);
    }
  }
  clear() {
    this.seen.clear();
  }
  get size() {
    return this.seen.size;
  }
};

// src/Messages/retry.ts
async function withRetry(fn, options = {}) {
  const maxAttempts = options.maxAttempts ?? 3;
  const base = options.baseDelayMs ?? 400;
  const maxDelay = options.maxDelayMs ?? 5e3;
  let lastErr;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn(attempt);
    } catch (err) {
      lastErr = err;
      if (attempt >= maxAttempts) break;
      const wait = Math.min(maxDelay, base * 2 ** (attempt - 1));
      await delay(wait);
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

// src/Messages/ack.ts
function parseReceiptNode(payload) {
  try {
    const node = decodeBinaryNode(payload);
    return extractReceipts(node);
  } catch {
    return [];
  }
}
function mapType(t) {
  if (!t) return "server";
  if (t === "delivery" || t === "receiver") return "delivery";
  if (t === "read") return "read";
  if (t === "played") return "played";
  if (t === "server-ack" || t === "inactive" || t === "server") return "server";
  return "unknown";
}
function extractReceipts(node) {
  const out = [];
  if (node.tag === "ack") {
    const id = getBinaryNodeAttr(node, "id");
    if (id) {
      out.push({
        id,
        remoteJid: getBinaryNodeAttr(node, "from") || getBinaryNodeAttr(node, "to"),
        type: mapType(getBinaryNodeAttr(node, "class") || getBinaryNodeAttr(node, "type")),
        timestamp: Number(getBinaryNodeAttr(node, "t")) || void 0
      });
    }
  }
  if (node.tag === "receipt") {
    const remoteJid = getBinaryNodeAttr(node, "from") || getBinaryNodeAttr(node, "to");
    const participant = getBinaryNodeAttr(node, "participant");
    const type = mapType(getBinaryNodeAttr(node, "type"));
    const t = Number(getBinaryNodeAttr(node, "t")) || void 0;
    const items = getBinaryNodeChildren(node, "list").length ? getBinaryNodeChildren(getBinaryNodeChildren(node, "list")[0], "item") : getBinaryNodeChildren(node, "item");
    if (items.length) {
      for (const item of items) {
        const id = getBinaryNodeAttr(item, "id");
        if (id) out.push({ id, remoteJid, participant, type, timestamp: t });
      }
    } else {
      const id = getBinaryNodeAttr(node, "id");
      if (id) out.push({ id, remoteJid, participant, type, timestamp: t });
    }
  }
  return out;
}
function isAckOrReceiptPayload(payload) {
  try {
    const tag = decodeBinaryNode(payload).tag;
    return tag === "ack" || tag === "receipt";
  } catch {
    return false;
  }
}
function buildReceiptNode(opts) {
  const node = {
    tag: "receipt",
    attrs: {
      to: opts.to,
      id: opts.ids[0] || generateMessageID(),
      ...opts.type ? { type: opts.type } : {},
      ...opts.participant ? { participant: opts.participant } : {},
      t: String(Math.floor(Date.now() / 1e3))
    },
    content: opts.ids.length > 1 ? opts.ids.map((id) => ({ tag: "item", attrs: { id } })) : void 0
  };
  return { encoded: encodeBinaryNode(node) };
}
var AckWaiter = class {
  waiters = /* @__PURE__ */ new Map();
  wait(id, timeoutMs = 3e4) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.waiters.delete(id);
        reject(new Error(`ACK timeout for message ${id}`));
      }, timeoutMs);
      this.waiters.set(id, { resolve, reject, timer });
    });
  }
  handle(receipts) {
    for (const r of receipts) {
      const w = this.waiters.get(r.id);
      if (!w) continue;
      clearTimeout(w.timer);
      this.waiters.delete(r.id);
      w.resolve(r);
    }
  }
  cancelAll(reason = "ack cancelled") {
    for (const [, w] of this.waiters) {
      clearTimeout(w.timer);
      w.reject(new Error(reason));
    }
    this.waiters.clear();
  }
};

// src/Messages/serialize.ts
function serializeMessageContent(content) {
  return encodeWaMessageContent(content);
}
function deserializeMessageContent(buf) {
  return decodeWaMessageContent(buf);
}

// src/Messages/engine.ts
function statusFromReceipt(type) {
  if (type === "read") return 4;
  if (type === "delivery") return 3;
  if (type === "server") return 2;
  return 2;
}
function createMessageEngine(opts) {
  const deduper = new MessageDeduper();
  const acks = new AckWaiter();
  const { ev, logger } = opts;
  const emitUpsert = (msg, type = "notify") => {
    const normalized = normalizeMessage(msg);
    const id = normalized.key.id || "";
    const jid = normalized.key.remoteJid || "";
    if (id && !deduper.checkAndAdd(jid, id, normalized.key.fromMe ?? void 0)) {
      logger?.debug({ id }, "dedup skip upsert");
      return normalized;
    }
    ev.emit("messages.upsert", { messages: [normalized], type });
    return normalized;
  };
  const emitUpdate = (key, update) => {
    ev.emit("messages.update", [{ key, update }]);
  };
  const buildOutboundFrame = (jid, msg, signalSession, onSignalUpdate) => {
    const content = msg.message || { conversation: "" };
    let body = serializeMessageContent(content);
    if (signalSession) {
      const { session: next, message: sealed } = signalEncrypt(signalSession, body);
      onSignalUpdate?.(next);
      body = wrapEncryptedBody({ signalWire: encodeSignalWire(sealed) });
    }
    const { encoded } = buildMessageNode({
      to: jid,
      content,
      id: msg.key.id ?? void 0,
      participant: msg.key.participant ?? void 0,
      body
    });
    return { nodeEncoded: encoded, msg };
  };
  async function sendRaw(jid, msg, net, signalSession, onSignalUpdate) {
    if (!net) {
      emitUpsert(msg);
      if (process.env.KAGUNEX_STRICT_SEND === "1") {
        throw new NotImplementedError(
          "sendMessage requires active Noise session (set KAGUNEX_STRICT_SEND=0 for local-only)"
        );
      }
      return msg;
    }
    const { nodeEncoded } = buildOutboundFrame(
      jid,
      msg,
      signalSession,
      onSignalUpdate
    );
    await withRetry(
      async () => {
        const frame = net.session.seal(nodeEncoded);
        net.sendFrame(frame);
      },
      { maxAttempts: opts.maxSendAttempts ?? 3, baseDelayMs: 300 }
    );
    emitUpsert(msg);
    if (opts.waitForAck !== false && msg.key.id) {
      try {
        const receipt = await acks.wait(msg.key.id, opts.ackTimeoutMs ?? 3e4);
        logger?.debug({ id: msg.key.id, type: receipt.type }, "server ACK");
        const status = statusFromReceipt(receipt.type);
        msg = { ...msg, status };
        emitUpdate(msg.key, { status });
      } catch (err) {
        logger?.warn({ err, id: msg.key.id }, "ACK wait failed \u2014 frame already sent");
      }
    }
    return msg;
  }
  async function sendMessage(jid, content, options = {}, net, signalSession, onSignalUpdate) {
    const msg = generateWAMessage(jid, content, {
      ...options,
      userJid: options.userJid ?? opts.userJid,
      quoted: options.quoted || ("quoted" in content ? content.quoted : void 0)
    });
    try {
      return await sendRaw(
        msg.key.remoteJid || jid,
        msg,
        net,
        signalSession,
        onSignalUpdate
      );
    } catch (err) {
      throw new MessageError("sendMessage failed", { cause: err });
    }
  }
  function handleIncomingMessageNode(payload, signalSession, onSignalUpdate, net) {
    try {
      const node = decodeBinaryNode(payload);
      if (node.tag !== "message") return;
      const remoteJid = getBinaryNodeAttr(node, "from") || getBinaryNodeAttr(node, "to") || "";
      const id = getBinaryNodeAttr(node, "id") || "";
      const participant = getBinaryNodeAttr(node, "participant");
      const fromMe = getBinaryNodeAttr(node, "fromMe") === "true";
      let content;
      if (Buffer.isBuffer(node.content) || node.content instanceof Uint8Array) {
        const body = Buffer.from(node.content);
        if (signalSession && body.length > 5 && body.subarray(1, 5).toString("utf-8") === "KXS1") {
          const { signalWire } = unwrapEncryptedBody(body);
          const wire = decodeSignalWire(signalWire);
          const { session, plaintext } = signalDecrypt(signalSession, wire);
          onSignalUpdate?.(session);
          content = deserializeMessageContent(plaintext);
        } else {
          try {
            content = deserializeMessageContent(body);
          } catch {
            content = parseMessageNode(payload)?.message;
          }
        }
      } else {
        content = parseMessageNode(payload)?.message;
      }
      const msg = {
        key: { remoteJid, id, fromMe, participant },
        message: content ?? null,
        messageTimestamp: Math.floor(Date.now() / 1e3)
      };
      if (content?.protocolMessage) {
        const pm = content.protocolMessage;
        if (pm.type === 0 && pm.key) {
          ev.emit("messages.delete", { keys: [pm.key] });
          emitUpdate(pm.key, { message: null, messageStubType: 1 });
        } else if (pm.type === 14 && pm.key) {
          emitUpdate(pm.key, { message: content });
        }
      }
      if (content?.reactionMessage?.key) {
        ev.emit("messages.reaction", [
          {
            key: content.reactionMessage.key,
            reaction: {
              text: content.reactionMessage.text,
              key: content.reactionMessage.key
            }
          }
        ]);
      }
      emitUpsert(msg);
      if (!fromMe && net && id && remoteJid) {
        try {
          const { encoded } = buildReceiptNode({
            to: remoteJid,
            ids: [id],
            participant
          });
          net.sendFrame(net.session.seal(encoded));
        } catch (err) {
          logger?.trace({ err }, "client receipt send failed");
        }
      }
    } catch (err) {
      logger?.debug({ err }, "handleIncomingMessageNode failed");
    }
  }
  function handlePayload(payload, signalSession, onSignalUpdate, net) {
    if (isAckOrReceiptPayload(payload)) {
      const receipts = parseReceiptNode(payload);
      if (receipts.length) {
        acks.handle(receipts);
        for (const r of receipts) {
          emitUpdate(
            {
              id: r.id,
              remoteJid: r.remoteJid,
              participant: r.participant,
              fromMe: true
            },
            { status: statusFromReceipt(r.type) }
          );
        }
      }
      return;
    }
    if (isMessageNodePayload(payload)) {
      handleIncomingMessageNode(payload, signalSession, onSignalUpdate, net);
    }
  }
  return {
    sendMessage,
    handlePayload,
    buildOutboundFrame,
    sendReaction: async (key, text, net) => {
      const jid = key.remoteJid || "";
      const msg = {
        key: { remoteJid: jid, fromMe: true, id: generateMessageID() },
        message: { reactionMessage: { key, text } },
        messageTimestamp: Math.floor(Date.now() / 1e3)
      };
      const sent = await sendRaw(jid, msg, net);
      ev.emit("messages.reaction", [{ key, reaction: { text, key } }]);
      return sent;
    },
    sendRevoke: async (key, net) => {
      const jid = key.remoteJid || "";
      const msg = {
        key: { remoteJid: jid, fromMe: true, id: generateMessageID() },
        message: { protocolMessage: { key, type: 0 } },
        messageTimestamp: Math.floor(Date.now() / 1e3)
      };
      return sendRaw(jid, msg, net);
    },
    sendEdit: async (key, newText, net) => {
      const jid = key.remoteJid || "";
      const msg = {
        key: { remoteJid: jid, fromMe: true, id: generateMessageID() },
        message: {
          protocolMessage: { key, type: 14 },
          extendedTextMessage: { text: newText }
        },
        messageTimestamp: Math.floor(Date.now() / 1e3)
      };
      return sendRaw(jid, msg, net);
    },
    deduper,
    acks,
    dispose: () => {
      acks.cancelAll();
      deduper.clear();
    }
  };
}

// src/Protocol/iq.ts
function buildIq(opts) {
  const id = opts.id ?? generateMessageID();
  const node = {
    tag: "iq",
    attrs: {
      id,
      type: opts.type,
      xmlns: opts.xmlns,
      ...opts.to ? { to: opts.to } : { to: "s.whatsapp.net" }
    },
    content: opts.content
  };
  return { id, node, encoded: encodeBinaryNode(node) };
}
function buildGroupCreateIq(subject, participants) {
  return buildIq({
    type: "set",
    xmlns: "w:g2",
    to: "s.whatsapp.net",
    content: {
      tag: "create",
      attrs: { subject, key: generateMessageID() },
      content: participants.map((jid) => ({
        tag: "participant",
        attrs: { jid }
      }))
    }
  });
}
function buildGroupMetadataIq(jid) {
  return buildIq({
    type: "get",
    xmlns: "w:g2",
    to: jid,
    content: { tag: "query", attrs: { request: "interactive" } }
  });
}
function buildGroupParticipantsIq(jid, participants, action) {
  return buildIq({
    type: "set",
    xmlns: "w:g2",
    to: jid,
    content: {
      tag: action,
      attrs: {},
      content: participants.map((p) => ({
        tag: "participant",
        attrs: { jid: p }
      }))
    }
  });
}
function buildGroupSubjectIq(jid, subject) {
  return buildIq({
    type: "set",
    xmlns: "w:g2",
    to: jid,
    content: { tag: "subject", attrs: {}, content: subject }
  });
}
function buildGroupDescriptionIq(jid, description) {
  return buildIq({
    type: "set",
    xmlns: "w:g2",
    to: jid,
    content: {
      tag: "description",
      attrs: {},
      content: description ? [{ tag: "body", attrs: {}, content: description }] : []
    }
  });
}
function buildGroupInviteCodeIq(jid) {
  return buildIq({
    type: "get",
    xmlns: "w:g2",
    to: jid,
    content: { tag: "invite", attrs: {} }
  });
}
function buildGroupRevokeInviteIq(jid) {
  return buildIq({
    type: "set",
    xmlns: "w:g2",
    to: jid,
    content: { tag: "invite", attrs: {} }
  });
}
function buildGroupLeaveIq(jid) {
  return buildIq({
    type: "set",
    xmlns: "w:g2",
    to: "s.whatsapp.net",
    content: {
      tag: "leave",
      attrs: {},
      content: [{ tag: "group", attrs: { id: jid } }]
    }
  });
}
function buildPresenceSubscribe(jid) {
  return {
    encoded: encodeBinaryNode({
      tag: "presence",
      attrs: { type: "subscribe", to: jid }
    })
  };
}
function buildOnWhatsAppIq(jids) {
  return buildIq({
    type: "get",
    xmlns: "usync",
    content: {
      tag: "usync",
      attrs: {
        sid: generateMessageID(),
        mode: "query",
        last: "true",
        context: "interactive"
      },
      content: [
        {
          tag: "query",
          attrs: {},
          content: [{ tag: "contact", attrs: {} }]
        },
        {
          tag: "list",
          attrs: {},
          content: jids.map((jid) => ({
            tag: "user",
            attrs: { jid }
          }))
        }
      ]
    }
  });
}

// src/Groups/parse.ts
function parseGroupMetadata(node) {
  let group = getBinaryNodeChild(node, "group") || getBinaryNodeChild(getBinaryNodeChild(node, "groups") || node, "group");
  if (!group && node.tag === "group") group = node;
  if (!group) return void 0;
  const id = getBinaryNodeAttr(group, "id") || getBinaryNodeAttr(group, "jid") || "";
  const subject = getBinaryNodeAttr(group, "subject") || "";
  const participants = [];
  for (const p of getBinaryNodeChildren(group, "participant")) {
    const pid = getBinaryNodeAttr(p, "jid") || getBinaryNodeAttr(p, "id");
    if (!pid) continue;
    const type = getBinaryNodeAttr(p, "type") || getBinaryNodeAttr(p, "admin");
    let admin = null;
    if (type === "admin" || type === "superadmin") admin = type;
    participants.push({ id: pid, admin });
  }
  const descNode = getBinaryNodeChild(group, "description");
  const desc = descNode && typeof descNode.content === "string" && descNode.content || getBinaryNodeAttr(group, "desc") || void 0;
  return {
    id: id.includes("@") ? id : `${id}@g.us`,
    subject,
    subjectOwner: getBinaryNodeAttr(group, "s_o") || void 0,
    subjectTime: numAttr(group, "s_t"),
    creation: numAttr(group, "creation"),
    owner: getBinaryNodeAttr(group, "creator") || void 0,
    desc,
    descOwner: getBinaryNodeAttr(group, "desc_owner") || void 0,
    descId: getBinaryNodeAttr(group, "desc_id") || void 0,
    restrict: getBinaryNodeAttr(group, "locked") === "true",
    announce: getBinaryNodeAttr(group, "announcement") === "true",
    participants,
    size: participants.length || numAttr(group, "size"),
    ephemeralDuration: numAttr(group, "ephemeral")
  };
}
function numAttr(node, name) {
  const v = getBinaryNodeAttr(node, name);
  if (v == null || v === "") return void 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : void 0;
}
function parseGroupCreateResult(node) {
  return parseGroupMetadata(node);
}
function parseGroupModification(node) {
  const participants = [];
  for (const p of getBinaryNodeChildren(node, "participant")) {
    const jid = getBinaryNodeAttr(p, "jid");
    if (!jid) continue;
    participants.push({
      jid,
      status: getBinaryNodeAttr(p, "error") || getBinaryNodeAttr(p, "code") || "200"
    });
  }
  return {
    status: getBinaryNodeAttr(node, "type") === "error" ? "error" : "ok",
    jid: getBinaryNodeAttr(node, "from"),
    participants
  };
}
function parseInviteCode(node) {
  const invite = getBinaryNodeChild(node, "invite") || getBinaryNodeChild(getBinaryNodeChild(node, "group") || node, "invite");
  if (!invite) return getBinaryNodeAttr(node, "code");
  return getBinaryNodeAttr(invite, "code");
}

// src/Groups/net.ts
function sealSend(net, plaintext) {
  net.sendFrame(net.session.seal(plaintext));
}

// src/Groups/create.ts
async function groupCreate(subject, participants, net) {
  if (!net) throw new NotImplementedError("groupCreate (requires authenticated session)");
  const { id, encoded } = buildGroupCreateIq(subject, participants);
  const result = await net.iq.query(encoded, id, {
    session: net.session,
    send: (pt) => sealSend(net, pt)
  }, net.timeoutMs);
  const meta = parseGroupCreateResult(result);
  if (!meta) throw new Error("groupCreate: could not parse metadata from IQ result");
  return meta;
}

// src/Groups/metadata.ts
async function groupMetadata(jid, net) {
  if (!net) throw new NotImplementedError("groupMetadata (requires authenticated session)");
  const { id, encoded } = buildGroupMetadataIq(jid);
  const result = await net.iq.query(encoded, id, {
    session: net.session,
    send: (pt) => sealSend(net, pt)
  }, net.timeoutMs);
  const meta = parseGroupMetadata(result);
  if (!meta) throw new Error("groupMetadata: could not parse IQ result");
  return meta;
}

// src/Groups/participants.ts
async function groupParticipantsUpdate(jid, participants, action, net) {
  if (!net) {
    throw new NotImplementedError("groupParticipantsUpdate (requires authenticated IQ)");
  }
  const { id, encoded } = buildGroupParticipantsIq(jid, participants, action);
  const result = await net.iq.query(encoded, id, {
    session: net.session,
    send: (pt) => sealSend(net, pt)
  }, net.timeoutMs);
  return parseGroupModification(result);
}

// src/Groups/settings.ts
async function groupUpdateSubject(jid, subject, net) {
  if (!net) throw new NotImplementedError("groupUpdateSubject");
  const { id, encoded } = buildGroupSubjectIq(jid, subject);
  await net.iq.query(encoded, id, {
    session: net.session,
    send: (pt) => sealSend(net, pt)
  }, net.timeoutMs);
}
async function groupUpdateDescription(jid, description, net) {
  if (!net) throw new NotImplementedError("groupUpdateDescription");
  const { id, encoded } = buildGroupDescriptionIq(jid, description);
  await net.iq.query(encoded, id, {
    session: net.session,
    send: (pt) => sealSend(net, pt)
  }, net.timeoutMs);
}
async function groupInviteCode(jid, net) {
  if (!net) throw new NotImplementedError("groupInviteCode");
  const { id, encoded } = buildGroupInviteCodeIq(jid);
  const result = await net.iq.query(encoded, id, {
    session: net.session,
    send: (pt) => sealSend(net, pt)
  }, net.timeoutMs);
  const code = parseInviteCode(result);
  if (!code) throw new Error("groupInviteCode: no code in response");
  return code;
}
async function groupRevokeInvite(jid, net) {
  if (!net) throw new NotImplementedError("groupRevokeInvite");
  const { id, encoded } = buildGroupRevokeInviteIq(jid);
  const result = await net.iq.query(encoded, id, {
    session: net.session,
    send: (pt) => sealSend(net, pt)
  }, net.timeoutMs);
  return parseInviteCode(result) || "";
}
async function groupLeave(jid, net) {
  if (!net) throw new NotImplementedError("groupLeave");
  const { id, encoded } = buildGroupLeaveIq(jid);
  await net.iq.query(encoded, id, {
    session: net.session,
    send: (pt) => sealSend(net, pt)
  }, net.timeoutMs);
}

// src/Contacts/contacts.ts
async function onWhatsApp(jids, net) {
  if (!net) throw new NotImplementedError("onWhatsApp (requires authenticated query)");
  const { id, encoded } = buildOnWhatsAppIq(jids);
  const result = await net.iq.query(encoded, id, {
    session: net.session,
    send: (pt) => net.sendFrame(net.session.seal(pt))
  });
  const out = [];
  try {
    const list = getBinaryNodeChild(result, "list") || getBinaryNodeChild(getBinaryNodeChild(result, "usync") || result, "list");
    const users = list ? getBinaryNodeChildren(list, "user") : getBinaryNodeChildren(result, "user");
    for (const u of users) {
      const jid = getBinaryNodeAttr(u, "jid");
      if (!jid) continue;
      const contact = getBinaryNodeChild(u, "contact");
      const type = contact ? getBinaryNodeAttr(contact, "type") : void 0;
      out.push({ jid, exists: type !== "out" && type !== "invalid" });
    }
  } catch {
  }
  if (!out.length) {
    return jids.map((jid) => ({ jid, exists: false }));
  }
  return out;
}
async function fetchStatus(_jid) {
  throw new NotImplementedError("fetchStatus");
}

// src/Contacts/presence.ts
async function presenceSubscribe(jid, net) {
  if (!net) throw new NotImplementedError("presenceSubscribe");
  net.sendFrame(net.session.seal(buildPresenceSubscribe(jid).encoded));
}

// src/Protocol/chatstate.ts
function buildChatstateNode(jid, state) {
  const node = {
    tag: "chatstate",
    attrs: { to: jid },
    content: [{ tag: state, attrs: {} }]
  };
  return { node, encoded: encodeBinaryNode(node) };
}
function buildPresenceNode(type, to) {
  const node = {
    tag: "presence",
    attrs: {
      type,
      ...to ? { to } : {}
    }
  };
  return { node, encoded: encodeBinaryNode(node) };
}

// src/Socket/socket.ts
function resolveLogger(config) {
  return config.logger ?? (0, import_pino.default)({ level: "info" });
}
function makeWASocket(config = {}) {
  const logger = resolveLogger(config);
  const ev = new EventEmitter();
  const state = createInitialState(config.auth);
  logger.debug({ browser: config.browser ?? DEFAULT_BROWSER }, "makeWASocket init");
  const connection = createConnectionController(config, state, ev, logger);
  connection.start();
  const messageEngine = createMessageEngine({
    ev,
    userJid: state.user?.id,
    logger,
    waitForAck: true
  });
  connection.setPayloadHandler?.((payload) => {
    const session = connection.getSession();
    messageEngine.handlePayload(
      payload,
      void 0,
      void 0,
      session ? {
        session,
        sendFrame: (frame) => connection.transport.send(frame)
      } : void 0
    );
  });
  const requireNet = () => {
    const session = connection.getSession();
    if (!session) throw new Error("not connected (no Noise session)");
    return {
      session,
      sendFrame: (frame) => connection.transport.send(frame),
      iq: connection.getIq()
    };
  };
  const optionalNet = () => {
    const session = connection.getSession();
    if (!session) return void 0;
    return {
      session,
      sendFrame: (frame) => connection.transport.send(frame)
    };
  };
  const sock = {
    ev,
    authState: config.auth,
    get user() {
      return state.user;
    },
    async sendMessage(jid, content, options) {
      return messageEngine.sendMessage(
        jid,
        content,
        { ...options, userJid: state.user?.id },
        optionalNet()
      );
    },
    async sendReaction(key, emoji) {
      return messageEngine.sendReaction(key, emoji, optionalNet());
    },
    async sendRevoke(key) {
      return messageEngine.sendRevoke(key, optionalNet());
    },
    async sendEdit(key, text) {
      return messageEngine.sendEdit(key, text, optionalNet());
    },
    async sendChatState(jid, chatState) {
      const net = requireNet();
      const { encoded } = buildChatstateNode(jid, chatState);
      net.sendFrame(net.session.seal(encoded));
    },
    async sendPresenceUpdate(type, jid) {
      const net = requireNet();
      const { encoded } = buildPresenceNode(type, jid);
      net.sendFrame(net.session.seal(encoded));
    },
    async waitForPairingReady(timeoutMs = 6e4) {
      return connection.waitForPairingReady(timeoutMs);
    },
    async requestPairingCode(phoneNumber, timeoutMs = 6e4) {
      const phone = normalizePairingPhone(phoneNumber);
      logger.info({ phone }, "requestPairingCode");
      return connection.requestPairingCode(phone, timeoutMs);
    },
    groupCreate: (subject, participants) => groupCreate(subject, participants, requireNet()),
    groupMetadata: (jid) => groupMetadata(jid, requireNet()),
    groupParticipantsUpdate: (jid, participants, action) => groupParticipantsUpdate(jid, participants, action, requireNet()),
    groupUpdateSubject: (jid, subject) => groupUpdateSubject(jid, subject, requireNet()),
    groupUpdateDescription: (jid, description) => groupUpdateDescription(jid, description, requireNet()),
    groupInviteCode: (jid) => groupInviteCode(jid, requireNet()),
    groupRevokeInvite: (jid) => groupRevokeInvite(jid, requireNet()),
    groupLeave: (jid) => groupLeave(jid, requireNet()),
    onWhatsApp: (...jids) => onWhatsApp(jids, requireNet()),
    fetchStatus: (jid) => fetchStatus(jid),
    presenceSubscribe: (jid) => presenceSubscribe(jid, requireNet()),
    end(error) {
      messageEngine.dispose();
      connection.stop(error);
    },
    async logout() {
      if (config.auth) {
        config.auth.creds.registered = false;
        ev.emit("creds.update", { registered: false });
      }
      connection.stop(new AuthenticationError("Logged out"));
    },
    async waitForConnectionUpdate(check, timeoutMs = 6e4) {
      return promiseTimeout(
        timeoutMs,
        new Promise((resolve, reject) => {
          const listener = (update) => {
            try {
              if (check(update)) {
                ev.off("connection.update", listener);
                resolve();
              }
            } catch (err) {
              ev.off("connection.update", listener);
              reject(err);
            }
          };
          ev.on("connection.update", listener);
        }),
        "waitForConnectionUpdate timed out"
      );
    }
  };
  return sock;
}
var socket_default = makeWASocket;

// src/Auth/use-multi-file-auth-state.ts
var import_node_fs3 = require("node:fs");
var import_node_path3 = __toESM(require("node:path"), 1);

// src/Auth/key-store.ts
var import_node_fs = require("node:fs");
var import_node_path = __toESM(require("node:path"), 1);
async function ensureDir(dir) {
  await import_node_fs.promises.mkdir(dir, { recursive: true });
}
async function atomicWrite(filePath, data) {
  await ensureDir(import_node_path.default.dirname(filePath));
  const tmp = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  await import_node_fs.promises.writeFile(tmp, data);
  await import_node_fs.promises.rename(tmp, filePath);
}
function keyFilePath(folder, type, id) {
  const safe = id.replace(/[^a-zA-Z0-9._\-@]/g, "_");
  return import_node_path.default.join(folder, `${type}-${safe}.json`);
}
function serializeValue(value) {
  if (Buffer.isBuffer(value) || value instanceof Uint8Array) {
    return { __type: "buffer", data: encodeBase64(Buffer.from(value)) };
  }
  if (Array.isArray(value)) return value.map(serializeValue);
  if (value && typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = serializeValue(v);
    return out;
  }
  return value;
}
function reviveValue(value) {
  if (value && typeof value === "object" && value.__type === "buffer") {
    return new Uint8Array(
      decodeBase64(value.data)
    );
  }
  if (Array.isArray(value)) return value.map(reviveValue);
  if (value && typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = reviveValue(v);
    return out;
  }
  return value;
}
function createMutex() {
  let chain = Promise.resolve();
  return function run(fn) {
    const next = chain.then(fn, fn);
    chain = next.then(
      () => void 0,
      () => void 0
    );
    return next;
  };
}
function makeCacheableSignalKeyStore(folder) {
  const mutex = createMutex();
  const journalPath = import_node_path.default.join(folder, ".key-journal.json");
  async function recoverJournal() {
    try {
      const raw = await import_node_fs.promises.readFile(journalPath, "utf-8");
      const entries = JSON.parse(raw);
      for (const e of entries) {
        try {
          if (e.op === "delete") await import_node_fs.promises.unlink(e.file).catch(() => void 0);
          else if (e.payload != null) await atomicWrite(e.file, e.payload);
        } catch {
        }
      }
      await import_node_fs.promises.unlink(journalPath).catch(() => void 0);
    } catch {
    }
  }
  void recoverJournal();
  return {
    async get(type, ids) {
      await ensureDir(folder);
      const result = {};
      await Promise.all(
        ids.map(async (id) => {
          try {
            const raw = await import_node_fs.promises.readFile(keyFilePath(folder, type, id), "utf-8");
            result[id] = reviveValue(JSON.parse(raw));
          } catch {
          }
        })
      );
      return result;
    },
    async set(data) {
      return mutex(async () => {
        await ensureDir(folder);
        const journal = [];
        for (const type of Object.keys(data)) {
          const entries = data[type];
          if (!entries) continue;
          for (const id of Object.keys(entries)) {
            const value = entries[id];
            const file = keyFilePath(folder, type, id);
            if (value == null) {
              journal.push({ file, op: "delete" });
            } else {
              const payload = JSON.stringify(serializeValue(value));
              journal.push({ file, op: "write", payload });
            }
          }
        }
        if (journal.length) {
          await atomicWrite(journalPath, JSON.stringify(journal));
        }
        for (const e of journal) {
          if (e.op === "delete") {
            await import_node_fs.promises.unlink(e.file).catch(() => void 0);
          } else if (e.payload != null) {
            await atomicWrite(e.file, e.payload);
          }
        }
        await import_node_fs.promises.unlink(journalPath).catch(() => void 0);
      });
    },
    async clear() {
      return mutex(async () => {
        try {
          const files = await import_node_fs.promises.readdir(folder);
          await Promise.all(
            files.filter((f) => f.endsWith(".json") || f.startsWith(".key-")).map((f) => import_node_fs.promises.unlink(import_node_path.default.join(folder, f)).catch(() => void 0))
          );
        } catch {
        }
      });
    }
  };
}

// src/Signal/migration.ts
var import_node_fs2 = require("node:fs");
var import_node_path2 = __toESM(require("node:path"), 1);
var SIGNAL_STORE_VERSION = 2;
async function loadStoreMeta(folder) {
  try {
    const raw = await import_node_fs2.promises.readFile(import_node_path2.default.join(folder, "store-meta.json"), "utf-8");
    return JSON.parse(raw);
  } catch {
    return { version: 0 };
  }
}
async function saveStoreMeta(folder, meta) {
  await import_node_fs2.promises.mkdir(folder, { recursive: true });
  const file = import_node_path2.default.join(folder, "store-meta.json");
  const tmp = `${file}.${process.pid}.tmp`;
  await import_node_fs2.promises.writeFile(tmp, JSON.stringify(meta, null, 2));
  await import_node_fs2.promises.rename(tmp, file);
}
async function migrateSignalStore(folder) {
  const meta = await loadStoreMeta(folder);
  if (meta.version >= SIGNAL_STORE_VERSION) return meta;
  const next = {
    version: SIGNAL_STORE_VERSION,
    migratedAt: Date.now()
  };
  await saveStoreMeta(folder, next);
  return next;
}

// src/Signal/prekeys.ts
var import_node_crypto8 = require("node:crypto");

// src/Signal/keys.ts
function generateIdentityKeyPair() {
  const { public: pub, private: priv } = generateX25519KeyPair2();
  return { public: new Uint8Array(pub), private: new Uint8Array(priv) };
}
function generatePreKey(keyId) {
  return { keyPair: generateIdentityKeyPair(), keyId };
}

// src/Signal/prekeys.ts
var DEFAULT_PREKEY_BATCH = 30;
var SIGNED_PREKEY_MAX_AGE_SEC = 7 * 24 * 3600;
async function generateAndStorePreKeys(creds, keys, count = DEFAULT_PREKEY_BATCH) {
  const dataset = { "pre-key": {} };
  const generated = [];
  let nextId = creds.nextPreKeyId;
  for (let i = 0; i < count; i++) {
    const { keyPair, keyId } = generatePreKey(nextId);
    dataset["pre-key"][String(keyId)] = keyPair;
    generated.push(keyId);
    nextId += 1;
  }
  await keys.set(dataset);
  return {
    creds: {
      ...creds,
      nextPreKeyId: nextId,
      firstUnuploadedPreKeyId: creds.firstUnuploadedPreKeyId
    },
    generated
  };
}
function signPreKey(identity, preKeyPublic) {
  const h = (0, import_node_crypto8.createHmac)("sha512", Buffer.from(identity.private));
  h.update(Buffer.from(preKeyPublic));
  return new Uint8Array(h.digest());
}
function rotateSignedPreKey(creds) {
  const previous = creds.signedPreKey;
  const keyPair = generateIdentityKeyPair();
  const keyId = (previous?.keyId ?? 0) + 1;
  const signedPreKey = {
    keyPair,
    signature: signPreKey(creds.signedIdentityKey, keyPair.public),
    keyId,
    timestamp: Math.floor(Date.now() / 1e3)
  };
  return {
    previous,
    creds: { ...creds, signedPreKey }
  };
}
function shouldRotateSignedPreKey(creds) {
  const ts = creds.signedPreKey.timestamp;
  if (!ts) return true;
  return Math.floor(Date.now() / 1e3) - ts > SIGNED_PREKEY_MAX_AGE_SEC;
}
async function ensurePreKeyPool(creds, keys, minCount = 10) {
  const ids = [];
  for (let i = 0; i < minCount; i++) {
    const id = creds.nextPreKeyId - 1 - i;
    if (id >= 1) ids.push(String(id));
  }
  const existing = ids.length ? await keys.get("pre-key", ids) : {};
  if (Object.keys(existing).length >= Math.min(minCount, ids.length) && ids.length >= minCount) {
    return creds;
  }
  const { creds: next } = await generateAndStorePreKeys(creds, keys, DEFAULT_PREKEY_BATCH);
  return next;
}

// src/Auth/use-multi-file-auth-state.ts
async function atomicWrite2(filePath, data) {
  const tmp = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  await import_node_fs3.promises.writeFile(tmp, data, "utf-8");
  await import_node_fs3.promises.rename(tmp, filePath);
}
async function useMultiFileAuthState(folder) {
  await import_node_fs3.promises.mkdir(folder, { recursive: true });
  await migrateSignalStore(folder);
  const credsPath = import_node_path3.default.join(folder, "creds.json");
  let creds = initAuthCreds();
  try {
    creds = deserializeCreds(JSON.parse(await import_node_fs3.promises.readFile(credsPath, "utf-8")));
  } catch (err) {
    if (err.code !== "ENOENT") {
      try {
        await import_node_fs3.promises.rename(credsPath, `${credsPath}.bak.${Date.now()}`);
      } catch {
      }
    }
  }
  const keys = makeCacheableSignalKeyStore(folder);
  try {
    if (shouldRotateSignedPreKey(creds)) {
      const { creds: rotated } = rotateSignedPreKey(creds);
      creds = rotated;
    }
    creds = await ensurePreKeyPool(creds, keys, 10);
  } catch {
  }
  const saveCreds = async () => {
    await atomicWrite2(credsPath, JSON.stringify(serializeCreds(creds), null, 2));
  };
  try {
    await import_node_fs3.promises.access(credsPath);
  } catch {
    await saveCreds();
  }
  await saveCreds();
  return { state: { creds, keys }, saveCreds };
}

// src/Auth/auth-utils.ts
function applyCredsUpdate(creds, update) {
  Object.assign(creds, update);
  return creds;
}

// src/Auth/session-persistence.ts
var import_node_fs4 = require("node:fs");
var import_node_path4 = __toESM(require("node:path"), 1);
async function loadSessionMeta(folder) {
  const file = import_node_path4.default.join(folder, "session-meta.json");
  try {
    return JSON.parse(await import_node_fs4.promises.readFile(file, "utf-8"));
  } catch {
    return {};
  }
}
async function saveSessionMeta(folder, meta) {
  await import_node_fs4.promises.mkdir(folder, { recursive: true });
  const file = import_node_path4.default.join(folder, "session-meta.json");
  const tmp = `${file}.${process.pid}.tmp`;
  await import_node_fs4.promises.writeFile(tmp, JSON.stringify(meta, null, 2), "utf-8");
  await import_node_fs4.promises.rename(tmp, file);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AuthenticationError,
  ConnectionError,
  DEFAULT_BROWSER,
  DEFAULT_CONNECT_TIMEOUT_MS,
  DEFAULT_KEEP_ALIVE_INTERVAL_MS,
  DEFAULT_QUERY_TIMEOUT_MS,
  DEFAULT_VERSION,
  DisconnectStatus,
  EventEmitter,
  GroupError,
  KaguneXError,
  MediaError,
  MessageError,
  NotImplementedError,
  ProtocolError,
  TimeoutError,
  WA_WEB_SOCKET_URL,
  WebSocketTransport,
  applyCredsUpdate,
  deserializeCreds,
  formatPairingCode,
  formatQRForDisplay,
  generateWAMessage,
  generateWAMessageFromContent,
  initAuthCreds,
  loadSessionMeta,
  makeCacheableSignalKeyStore,
  makeWASocket,
  normalizePairingPhone,
  printQRInTerminal,
  saveSessionMeta,
  serializeCreds,
  useMultiFileAuthState
});
//# sourceMappingURL=index.cjs.map
