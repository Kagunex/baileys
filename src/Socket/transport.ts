/**
 * Single-socket WebSocket transport — no duplicate connections.
 */

import WebSocket from "ws";
import type { Logger } from "pino";
import { WA_WEB_SOCKET_URL } from "../Defaults/constants.js";
import { ConnectionError } from "../Errors/errors.js";

export type TransportHandlers = {
  onOpen?: () => void;
  onClose?: (code: number, reason: string) => void;
  onError?: (err: Error) => void;
  onMessage?: (data: Buffer) => void;
  onPong?: (latencyMs: number) => void;
};

export type TransportOptions = {
  url?: string;
  handshakeTimeoutMs?: number;
  pingIntervalMs?: number;
  pongTimeoutMs?: number;
  maxPayload?: number;
  headers?: Record<string, string>;
};

const DEFAULT_UA =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export class WebSocketTransport {
  private ws: WebSocket | null = null;
  private readonly logger?: Logger;
  private handlers: TransportHandlers;
  private readonly opts: Required<
    Pick<
      TransportOptions,
      "handshakeTimeoutMs" | "pingIntervalMs" | "pongTimeoutMs" | "maxPayload"
    >
  > &
    TransportOptions;

  private pingTimer?: ReturnType<typeof setInterval>;
  private pongTimer?: ReturnType<typeof setTimeout>;
  private handshakeTimer?: ReturnType<typeof setTimeout>;
  private lastPingAt = 0;
  private connecting = false;
  private intentionalClose = false;
  /** Socket instance id — ignores events from replaced sockets */
  private socketId = 0;

  constructor(handlers: TransportHandlers, logger?: Logger, opts: TransportOptions = {}) {
    this.handlers = handlers;
    this.logger = logger;
    this.opts = {
      handshakeTimeoutMs: opts.handshakeTimeoutMs ?? 20_000,
      pingIntervalMs: opts.pingIntervalMs ?? 25_000,
      pongTimeoutMs: opts.pongTimeoutMs ?? 10_000,
      maxPayload: opts.maxPayload ?? 20 * 1024 * 1024,
      url: opts.url,
      headers: opts.headers,
    };
  }

  /** Replace handlers (e.g. after reconnect wiring) without leaking old closures incorrectly */
  setHandlers(handlers: TransportHandlers): void {
    this.handlers = handlers;
  }

  connect(url: string = this.opts.url ?? WA_WEB_SOCKET_URL): void {
    if (this.connecting && this.ws?.readyState === WebSocket.CONNECTING) {
      this.logger?.debug("connect ignored — already connecting");
      return;
    }
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.logger?.debug("connect ignored — already open");
      return;
    }

    // Tear down previous socket completely (listeners removed)
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
      ...(this.opts.headers || {}),
    };

    const ws = new WebSocket(url, {
      origin: "https://web.whatsapp.com",
      headers,
      handshakeTimeout: this.opts.handshakeTimeoutMs,
      perMessageDeflate: false,
      skipUTF8Validation: true,
      maxPayload: this.opts.maxPayload,
    });
    this.ws = ws;

    const isStale = () => myId !== this.socketId || this.ws !== ws;

    this.handshakeTimer = setTimeout(() => {
      if (isStale()) return;
      if (ws.readyState !== WebSocket.OPEN) {
        this.logger?.warn({ socketId: myId }, "WS handshake timeout");
        try {
          ws.terminate();
        } catch {
          /* */
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
          /* */
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
        "transport close",
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
      let buf: Buffer;
      if (Buffer.isBuffer(data)) buf = data;
      else if (data instanceof ArrayBuffer) buf = Buffer.from(data);
      else if (Array.isArray(data)) buf = Buffer.concat(data);
      else buf = Buffer.from(data as string, isBinary ? "binary" : "utf8");
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

  send(data: Buffer | Uint8Array): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new ConnectionError("Transport is not open");
    }
    if (this.ws.bufferedAmount > 2 * 1024 * 1024) {
      this.logger?.warn({ bufferedAmount: this.ws.bufferedAmount }, "WS send buffer high");
    }
    this.ws.send(data, { binary: true, compress: false });
  }

  ping(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.lastPingAt = Date.now();
    try {
      this.ws.ping();
    } catch {
      /* */
    }
    this.armPongTimeout();
  }

  close(code = 1000, reason = "normal"): void {
    this.intentionalClose = true;
    this.destroySocket("close", code, reason);
  }

  terminate(): void {
    this.intentionalClose = true;
    this.destroySocket("terminate");
  }

  get isOpen(): boolean {
    return !!this.ws && this.ws.readyState === WebSocket.OPEN;
  }

  get isConnecting(): boolean {
    return (
      this.connecting ||
      (!!this.ws && this.ws.readyState === WebSocket.CONNECTING)
    );
  }

  get wasIntentionalClose(): boolean {
    return this.intentionalClose;
  }

  get bufferedAmount(): number {
    return this.ws?.bufferedAmount ?? 0;
  }

  get currentSocketId(): number {
    return this.socketId;
  }

  private destroySocket(
    mode: "replace" | "close" | "terminate",
    code = 1000,
    reason = "normal",
  ): void {
    this.clearHandshakeTimer();
    this.stopPingLoop();
    const ws = this.ws;
    this.ws = null;
    this.connecting = false;
    // Invalidate in-flight handlers from old socket
    this.socketId += mode === "replace" ? 0 : 0;
    // Actually bump when destroying so late events ignored — on replace, connect() bumps
    if (mode !== "replace") {
      this.socketId += 1;
    }
    if (!ws) return;
    try {
      ws.removeAllListeners();
      if (mode === "terminate" || ws.readyState === WebSocket.CONNECTING) {
        ws.terminate();
      } else if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CLOSING) {
        ws.close(code, reason);
      } else {
        ws.terminate();
      }
    } catch {
      /* */
    }
  }

  private startPingLoop(): void {
    this.stopPingLoop();
    const interval = this.opts.pingIntervalMs;
    if (interval <= 0) return;
    this.pingTimer = setInterval(() => this.ping(), interval);
    if (typeof this.pingTimer === "object" && "unref" in this.pingTimer) {
      (this.pingTimer as NodeJS.Timeout).unref?.();
    }
  }

  private stopPingLoop(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = undefined;
    }
    this.clearPongTimer();
  }

  private armPongTimeout(): void {
    this.clearPongTimer();
    this.pongTimer = setTimeout(() => {
      this.logger?.warn("WS pong timeout — terminating");
      try {
        this.ws?.terminate();
      } catch {
        /* */
      }
    }, this.opts.pongTimeoutMs);
    if (typeof this.pongTimer === "object" && "unref" in this.pongTimer) {
      (this.pongTimer as NodeJS.Timeout).unref?.();
    }
  }

  private clearPongTimer(): void {
    if (this.pongTimer) {
      clearTimeout(this.pongTimer);
      this.pongTimer = undefined;
    }
  }

  private clearHandshakeTimer(): void {
    if (this.handshakeTimer) {
      clearTimeout(this.handshakeTimer);
      this.handshakeTimer = undefined;
    }
  }
}
