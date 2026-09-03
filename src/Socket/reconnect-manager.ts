/**
 * Single-flight reconnect manager — no duplicate sockets, backoff, reason handling.
 */

import type { Logger } from "pino";
import type { DisconnectReason } from "../Types/Events.js";
import {
  computeReconnectDelayMs,
  shouldReconnect,
  DEFAULT_RECONNECT,
  type ReconnectOptions,
} from "./reconnect.js";
import { DisconnectStatus } from "./login-lifecycle.js";
import { delay } from "../Utils/timeout.js";

export type ReconnectDecision = {
  should: boolean;
  delayMs: number;
  reason: string;
};

export type ReconnectManager = {
  /** Monotonic generation — increments each new connection attempt */
  readonly generation: number;
  readonly attempt: number;
  readonly isReconnecting: boolean;
  /** Call before opening a new WS — returns generation for this attempt */
  beginConnect: () => number;
  /** Mark current generation as successfully open (resets attempt) */
  markOpen: (generation: number) => void;
  /** Evaluate close and schedule reconnect if appropriate */
  onClose: (
    generation: number,
    opts: {
      intentional: boolean;
      stopped: boolean;
      disconnect?: DisconnectReason;
      code?: number;
      reasonText?: string;
    },
  ) => ReconnectDecision;
  /** Wait backoff for current attempt (call after onClose if should) */
  waitBackoff: () => Promise<number>;
  /** Invalidate all pending reconnects (stop / logout) */
  cancel: () => void;
  /** True if gen is still the active connection generation */
  isCurrent: (generation: number) => boolean;
};

export function createReconnectManager(
  logger?: Logger,
  options: ReconnectOptions = {},
): ReconnectManager {
  const opts = { ...DEFAULT_RECONNECT, ...options };
  let generation = 0;
  let attempt = 0;
  let isReconnecting = false;
  let cancelled = false;
  let reconnectToken = 0;

  const mapWsCode = (code?: number, reasonText?: string): DisconnectReason | undefined => {
    if (code === 1000 && !reasonText) return undefined;
    if (code === 1006) {
      return {
        code: 1006,
        statusCode: DisconnectStatus.timedOut,
        message: reasonText || "abnormal closure / network drop",
        isLoggedOut: false,
      };
    }
    if (code === 1001) {
      return {
        code: 1001,
        message: reasonText || "going away",
        isLoggedOut: false,
      };
    }
    return undefined;
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

    markOpen(gen: number) {
      if (gen !== generation) {
        logger?.debug({ gen, generation }, "markOpen ignored — stale generation");
        return;
      }
      attempt = 0;
      isReconnecting = false;
      logger?.debug({ generation }, "connection open — reconnect attempt reset");
    },

    onClose(gen, closeOpts) {
      if (gen !== generation) {
        return { should: false, delayMs: 0, reason: "stale generation" };
      }
      if (closeOpts.stopped || closeOpts.intentional || cancelled) {
        isReconnecting = false;
        return { should: false, delayMs: 0, reason: "intentional/stopped" };
      }

      const disc =
        closeOpts.disconnect ||
        mapWsCode(closeOpts.code, closeOpts.reasonText);

      // Never auto-reconnect after logout
      if (disc?.isLoggedOut) {
        isReconnecting = false;
        return { should: false, delayMs: 0, reason: "logged out" };
      }

      // 401/logged out status codes
      if (
        disc?.statusCode === DisconnectStatus.loggedOut ||
        disc?.statusCode === DisconnectStatus.forbidden
      ) {
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
          disc,
        },
        "reconnect scheduled",
      );
      return {
        should: true,
        delayMs,
        reason: disc?.message || closeOpts.reasonText || `ws ${closeOpts.code}`,
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

    isCurrent(gen: number) {
      return gen === generation && !cancelled;
    },
  };
}
