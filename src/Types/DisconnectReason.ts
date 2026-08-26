/**
 * Runtime disconnect reason codes (WA Web-style).
 * Available as a value for CJS/ESM consumers (not only a TypeScript type).
 */
export const DisconnectReason = {
  connectionClosed: 428,
  connectionLost: 408,
  connectionReplaced: 440,
  timedOut: 408,
  loggedOut: 401,
  badSession: 500,
  restartRequired: 515,
  multideviceMismatch: 411,
  forbidden: 403,
  unavailableService: 503,
} as const;

export type DisconnectReasonCode =
  (typeof DisconnectReason)[keyof typeof DisconnectReason];
