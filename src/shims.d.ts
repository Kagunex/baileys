declare module "pino" {
  export interface Logger {
    level: string;
    info: (...args: unknown[]) => void;
    warn: (...args: unknown[]) => void;
    error: (...args: unknown[]) => void;
    debug: (...args: unknown[]) => void;
    trace: (...args: unknown[]) => void;
    fatal: (...args: unknown[]) => void;
    child: (bindings: Record<string, unknown>) => Logger;
  }
  export type LoggerOptions = {
    level?: string;
    [key: string]: unknown;
  };
  function pino(options?: LoggerOptions): Logger;
  export default pino;
  export { pino };
}

declare module "ws" {
  import { EventEmitter } from "events";
  export default class WebSocket extends EventEmitter {
    constructor(url: string | URL, options?: unknown);
    readyState: number;
    bufferedAmount: number;
    send(data: Buffer | string | ArrayBuffer | Uint8Array, cb?: ((err?: Error) => void) | { binary?: boolean; mask?: boolean; compress?: boolean; fin?: boolean }): void;
    close(code?: number, reason?: string): void;
    terminate(): void;
    ping(data?: Buffer | string, mask?: boolean, cb?: (err?: Error) => void): void;
    static readonly CONNECTING: number;
    static readonly OPEN: number;
    static readonly CLOSING: number;
    static readonly CLOSED: number;
  }
}
