
export type KaguneXErrorOptions = { code?: string; statusCode?: number; cause?: unknown };
export class KaguneXError extends Error {
  readonly code: string; readonly statusCode?: number; readonly cause?: unknown;
  constructor(message: string, options: KaguneXErrorOptions = {}) {
    super(message); this.name = "KaguneXError"; this.code = options.code ?? "KAGUNEX_ERROR";
    this.statusCode = options.statusCode; this.cause = options.cause;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
export class ConnectionError extends KaguneXError {
  constructor(message: string, options: KaguneXErrorOptions = {}) {
    super(message, { code: "CONNECTION_ERROR", ...options }); this.name = "ConnectionError";
  }
}
export class AuthenticationError extends KaguneXError {
  constructor(message: string, options: KaguneXErrorOptions = {}) {
    super(message, { code: "AUTHENTICATION_ERROR", ...options }); this.name = "AuthenticationError";
  }
}
export class ProtocolError extends KaguneXError {
  constructor(message: string, options: KaguneXErrorOptions = {}) {
    super(message, { code: "PROTOCOL_ERROR", ...options }); this.name = "ProtocolError";
  }
}
export class MessageError extends KaguneXError {
  constructor(message: string, options: KaguneXErrorOptions = {}) {
    super(message, { code: "MESSAGE_ERROR", ...options }); this.name = "MessageError";
  }
}
export class MediaError extends KaguneXError {
  constructor(message: string, options: KaguneXErrorOptions = {}) {
    super(message, { code: "MEDIA_ERROR", ...options }); this.name = "MediaError";
  }
}
export class GroupError extends KaguneXError {
  constructor(message: string, options: KaguneXErrorOptions = {}) {
    super(message, { code: "GROUP_ERROR", ...options }); this.name = "GroupError";
  }
}
export class TimeoutError extends KaguneXError {
  constructor(message: string, options: KaguneXErrorOptions = {}) {
    super(message, { code: "TIMEOUT_ERROR", ...options }); this.name = "TimeoutError";
  }
}
export class NotImplementedError extends KaguneXError {
  constructor(feature: string, options: KaguneXErrorOptions = {}) {
    super(`Feature not implemented: ${feature}. Marked as TODO / EXPERIMENTAL.`, { code: "NOT_IMPLEMENTED", ...options });
    this.name = "NotImplementedError";
  }
}
