/**
 * Reconnect backoff with full jitter (AWS-style).
 * delay = random(0, min(cap, base * 2^attempt))
 */

import { delay } from "../Utils/timeout.js";

export type ReconnectOptions = {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  /** 0 = no jitter (pure exponential), 1 = full jitter */
  jitter?: number;
};

export const DEFAULT_RECONNECT: Required<ReconnectOptions> = {
  maxRetries: 8,
  baseDelayMs: 800,
  maxDelayMs: 30_000,
  jitter: 1,
};

/** Compute delay for attempt (0-based). */
export function computeReconnectDelayMs(
  attempt: number,
  options: ReconnectOptions = {},
): number {
  const base = options.baseDelayMs ?? DEFAULT_RECONNECT.baseDelayMs;
  const max = options.maxDelayMs ?? DEFAULT_RECONNECT.maxDelayMs;
  const jitter = options.jitter ?? DEFAULT_RECONNECT.jitter;
  const exp = Math.min(max, base * 2 ** Math.max(0, attempt));
  if (jitter <= 0) return exp;
  // full jitter
  return Math.floor(Math.random() * exp);
}

export async function waitForReconnectBackoff(
  attempt: number,
  options: ReconnectOptions = {},
): Promise<number> {
  const ms = computeReconnectDelayMs(attempt, options);
  await delay(ms);
  return ms;
}

/** Whether another reconnect should be attempted (attempt is 0-based count so far). */
export function shouldReconnect(
  attempt: number,
  intentionalClose: boolean,
  options: ReconnectOptions = {},
): boolean {
  if (intentionalClose) return false;
  const max = options.maxRetries ?? DEFAULT_RECONNECT.maxRetries;
  return attempt < max;
}
