/**
 * Pairing request controller — KaguneX Baileys 1.8.5
 *
 * Guarantees:
 *  - one active pairing flow at a time
 *  - each attempt gets a fresh IQ id
 *  - only the active IQ id may resolve the request
 *  - stale / unknown IQ responses are ignored
 *  - retries are sequential
 *  - timeout / cancel / success always clean up state
 *  - registered credentials cannot request pairing code
 */

import type { Logger } from "pino";
import type { NoiseSession } from "../Noise/session.js";
import type { AuthenticationCreds } from "../Types/Auth.js";

import {
  buildPairingCodeIq,
  parsePairingPayload,
  pairingRetryDelayMs,
  DEFAULT_PAIRING_MAX_ATTEMPTS,
  DEFAULT_PAIRING_TIMEOUT_MS,
  type PairingCodeRequest,
} from "../Protocol/pairing.js";

import {
  normalizePairingPhone,
  formatPairingCode,
} from "../Web/pairing.js";

import { generateMessageID } from "../Utils/generics.js";

export type PairingSend = (plaintext: Buffer) => void;

export type PairingRequest = {
  requestId: string;
  iqId: string;
  phoneNumber: string;
  attempt: number;
  createdAt: number;
  timeoutMs: number;
};

export type PairingController = {
  onPayload: (payload: Buffer) => void;

  requestCode: (
    phoneNumber: string,
    opts: {
      timeoutMs?: number;
      maxAttempts?: number;
      session: NoiseSession;
      send: PairingSend;
      creds?: AuthenticationCreds;
    },
  ) => Promise<string>;

  cancelAll: (reason?: string) => void;

  pendingCount: () => number;

  isBusy: () => boolean;
};

type ActiveFlow = {
  requestId: string;
  phoneNumber: string;

  /**
   * Semua IQ id yang pernah dibuat oleh flow ini.
   * Disimpan supaya response lama bisa dikenali sebagai stale.
   */
  iqIds: Set<string>;

  /**
   * Hanya IQ id ini yang boleh menyelesaikan flow.
   */
  activeIqId: string | null;

  attempt: number;
  maxAttempts: number;

  createdAt: number;
  overallDeadline: number;

  resolve: (code: string) => void;
  reject: (error: Error) => void;

  overallTimer: ReturnType<typeof setTimeout>;
  attemptTimer: ReturnType<typeof setTimeout> | null;

  settled: boolean;
};

export function createPairingController(
  logger?: Logger,
): PairingController {
  let active: ActiveFlow | null = null;

  /**
   * IQ id -> active flow
   */
  const iqToFlow = new Map<string, ActiveFlow>();

  /**
   * Remove every timer and IQ reference belonging to a flow.
   */
  const cleanupFlow = (flow: ActiveFlow): void => {
    clearTimeout(flow.overallTimer);

    if (flow.attemptTimer !== null) {
      clearTimeout(flow.attemptTimer);
      flow.attemptTimer = null;
    }

    for (const iqId of flow.iqIds) {
      iqToFlow.delete(iqId);
    }

    flow.iqIds.clear();
    flow.activeIqId = null;

    if (active === flow) {
      active = null;
    }
  };

  /**
   * Reject exactly once.
   */
  const settleReject = (
    flow: ActiveFlow,
    error: Error,
  ): void => {
    if (flow.settled) {
      return;
    }

    flow.settled = true;

    cleanupFlow(flow);

    flow.reject(error);
  };

  /**
   * Resolve exactly once.
   */
  const settleResolve = (
    flow: ActiveFlow,
    code: string,
  ): void => {
    if (flow.settled) {
      return;
    }

    flow.settled = true;

    cleanupFlow(flow);

    flow.resolve(code);
  };

  /**
   * Cancel the currently active pairing flow.
   */
  const cancelAll = (
    reason = "pairing cancelled",
  ): void => {
    const flow = active;

    if (!flow || flow.settled) {
      return;
    }

    logger?.info(
      {
        requestId: flow.requestId,
        reason,
        attempt: flow.attempt,
      },
      "pairing cancelAll",
    );

    settleReject(
      flow,
      new Error(reason),
    );
  };

  /**
   * Handle decrypted pairing payload.
   *
   * IMPORTANT:
   * There is intentionally NO fallback based only on
   * "there is one pending request".
   *
   * A response must belong to the currently active IQ id.
   */
  const onPayload = (
    payload: Buffer,
  ): void => {
    const parsed = parsePairingPayload(payload);

    /**
     * Payload without IQ id cannot safely be associated
     * with the current request.
     */
    if (!parsed.iqId) {
      if (parsed.code || parsed.errorCode) {
        logger?.debug(
          {
            hasCode: Boolean(parsed.code),
            errorCode: parsed.errorCode,
          },
          "pairing payload without iqId ignored",
        );
      }

      return;
    }

    const flow = iqToFlow.get(parsed.iqId);

    /**
     * Unknown / stale IQ.
     */
    if (!flow) {
      logger?.debug(
        {
          iqId: parsed.iqId,
          hasCode: Boolean(parsed.code),
        },
        "pairing unmatched response ignored",
      );

      return;
    }

    /**
     * Flow already settled.
     */
    if (flow.settled) {
      logger?.debug(
        {
          iqId: parsed.iqId,
          requestId: flow.requestId,
        },
        "stale pairing response ignored",
      );

      return;
    }

    /**
     * IQ belongs to this flow but not to the current attempt.
     *
     * This is important when attempt #1 times out and attempt #2
     * has already been sent.
     */
    if (
      flow.activeIqId !== null &&
      flow.activeIqId !== parsed.iqId
    ) {
      logger?.debug(
        {
          iqId: parsed.iqId,
          activeIqId: flow.activeIqId,
          requestId: flow.requestId,
        },
        "pairing response for old attempt ignored",
      );

      return;
    }

    /**
     * Server returned an error.
     */
    if (
      parsed.errorCode &&
      !parsed.code
    ) {
      logger?.warn(
        {
          requestId: flow.requestId,
          iqId: parsed.iqId,
          attempt: flow.attempt,
          errorCode: parsed.errorCode,
          errorText: parsed.errorText,
        },
        "pairing error response",
      );

      settleReject(
        flow,
        new Error(
          `PAIRING FAILED: pairing error ${parsed.errorCode}${
            parsed.errorText
              ? `: ${parsed.errorText}`
              : ""
          }`,
        ),
      );

      return;
    }

    /**
     * Valid pairing code.
     */
    if (parsed.code) {
      const code = parsed.code.includes("-")
        ? parsed.code
        : formatPairingCode(parsed.code);

      logger?.info(
        {
          requestId: flow.requestId,
          iqId: parsed.iqId,
          attempt: flow.attempt,
        },
        "pairing code received",
      );

      settleResolve(
        flow,
        code,
      );

      return;
    }

    /**
     * IQ matched but contains neither code nor error.
     */
    logger?.warn(
      {
        requestId: flow.requestId,
        iqId: parsed.iqId,
        attempt: flow.attempt,
      },
      "unexpected pairing response",
    );

    settleReject(
      flow,
      new Error(
        "PAIRING FAILED: UNEXPECTED_PAIRING_RESPONSE",
      ),
    );
  };

  /**
   * Start pairing-code request.
   */
  const requestCode = (
    phoneNumber: string,
    opts: {
      timeoutMs?: number;
      maxAttempts?: number;
      session: NoiseSession;
      send: PairingSend;
      creds?: AuthenticationCreds;
    },
  ): Promise<string> => {
    if (!opts?.session || !opts?.send) {
      return Promise.reject(
        new Error(
          "PAIRING FAILED: session and send are required",
        ),
      );
    }

    /**
     * Registered WhatsApp accounts must not request
     * a new pairing code.
     */
    if (opts.creds?.registered === true) {
      return Promise.reject(
        new Error(
          "PAIRING FAILED: already registered — use existing session (do not request pairing code)",
        ),
      );
    }

    /**
     * Only one pairing operation at a time.
     */
    if (
      active !== null &&
      !active.settled
    ) {
      return Promise.reject(
        new Error(
          "PAIRING_ALREADY_IN_PROGRESS",
        ),
      );
    }

    let phone: string;

    try {
      phone = normalizePairingPhone(
        phoneNumber,
      );
    } catch (error) {
      return Promise.reject(
        new Error(
          `PAIRING FAILED: invalid number — ${
            error instanceof Error
              ? error.message
              : String(error)
          }`,
        ),
      );
    }

    const timeoutMs =
      opts.timeoutMs ??
      DEFAULT_PAIRING_TIMEOUT_MS;

    const maxAttempts =
      opts.maxAttempts ??
      DEFAULT_PAIRING_MAX_ATTEMPTS;

    if (
      !Number.isFinite(timeoutMs) ||
      timeoutMs <= 0
    ) {
      return Promise.reject(
        new Error(
          "PAIRING FAILED: invalid timeout",
        ),
      );
    }

    if (
      !Number.isInteger(maxAttempts) ||
      maxAttempts <= 0
    ) {
      return Promise.reject(
        new Error(
          "PAIRING FAILED: invalid maxAttempts",
        ),
      );
    }

    const requestId =
      generateMessageID("pair");

    const createdAt =
      Date.now();

    const overallDeadline =
      createdAt + timeoutMs;

    return new Promise<string>(
      (resolve, reject) => {
        /**
         * The flow variable is assigned before this timer
         * can execute because the timer callback runs later.
         */
        let flow!: ActiveFlow;

        const overallTimer =
          setTimeout(() => {
            if (flow.settled) {
              return;
            }

            logger?.warn(
              {
                requestId,
                attempt: flow.attempt,
                timeoutMs,
              },
              "pairing overall timeout",
            );

            settleReject(
              flow,
              new Error(
                `PAIRING FAILED: pairing code request timed out after ${timeoutMs}ms`,
              ),
            );
          }, timeoutMs);

        flow = {
          requestId,
          phoneNumber: phone,

          iqIds: new Set<string>(),

          activeIqId: null,

          attempt: 0,
          maxAttempts,

          createdAt,
          overallDeadline,

          resolve,
          reject,

          overallTimer,
          attemptTimer: null,

          settled: false,
        };

        active = flow;

        /**
         * Include real credential key material when available.
         */
        const keys = opts.creds
          ? {
              companionEphemeralPub:
                Buffer.from(
                  opts.creds
                    .pairingEphemeralKeyPair
                    .public,
                ),

              companionAuthPub:
                Buffer.from(
                  opts.creds
                    .noiseKey
                    .public,
                ),

              platformDisplay:
                opts.creds.platform
                  ? String(
                      opts.creds.platform,
                    )
                  : undefined,
            }
          : undefined;

        /**
         * Sequential attempt runner.
         *
         * This function is deliberately synchronous.
         * It does not return a Promise, so there is no
         * fire-and-forget Promise rejection to leak into
         * Node/Vitest unhandled-rejection handling.
         */
        const runAttempt = (
          attempt: number,
        ): void => {
          if (flow.settled) {
            return;
          }

          if (
            Date.now() >=
            flow.overallDeadline
          ) {
            settleReject(
              flow,
              new Error(
                "PAIRING FAILED: pairing code request timed out",
              ),
            );

            return;
          }

          if (
            attempt > flow.maxAttempts
          ) {
            settleReject(
              flow,
              new Error(
                `PAIRING FAILED: pairing code request failed after ${flow.maxAttempts} attempts`,
              ),
            );

            return;
          }

          flow.attempt = attempt;

          let request: PairingCodeRequest;

          try {
            request =
              buildPairingCodeIq(
                phone,
                {
                  keys,
                  attempt,
                },
              );
          } catch (error) {
            settleReject(
              flow,
              error instanceof Error
                ? error
                : new Error(
                    `PAIRING FAILED: ${String(
                      error,
                    )}`,
                  ),
            );

            return;
          }

          /**
           * New IQ id for every attempt.
           */
          flow.iqIds.add(
            request.id,
          );

          flow.activeIqId =
            request.id;

          iqToFlow.set(
            request.id,
            flow,
          );

          const meta: PairingRequest = {
            requestId,
            iqId: request.id,
            phoneNumber: phone,
            attempt,
            createdAt: Date.now(),
            timeoutMs,
          };

          /**
           * Send IQ.
           */
          try {
            opts.send(
              request.encoded,
            );

            logger?.info(
              {
                requestId:
                  meta.requestId,

                iqId:
                  meta.iqId,

                phone:
                  meta.phoneNumber,

                attempt:
                  meta.attempt,

                maxAttempts,
              },
              "pairing IQ sent",
            );
          } catch (error) {
            logger?.warn(
              {
                requestId,
                iqId: request.id,
                attempt,
                error:
                  error instanceof Error
                    ? error.message
                    : String(error),
              },
              "pairing IQ send failed",
            );

            /**
             * This IQ must no longer be considered active.
             */
            iqToFlow.delete(
              request.id,
            );

            flow.activeIqId =
              null;

            if (
              flow.settled
            ) {
              return;
            }

            if (
              attempt >=
              flow.maxAttempts
            ) {
              settleReject(
                flow,
                error instanceof Error
                  ? error
                  : new Error(
                      `PAIRING FAILED: ${String(
                        error,
                      )}`,
                    ),
              );

              return;
            }

            const delay =
              pairingRetryDelayMs(
                attempt,
              );

            flow.attemptTimer =
              setTimeout(() => {
                flow.attemptTimer =
                  null;

                if (
                  flow.settled
                ) {
                  return;
                }

                runAttempt(
                  attempt + 1,
                );
              }, delay);

            return;
          }

          /**
           * Calculate the maximum time this attempt may
           * remain active before another attempt starts.
           */
          const remaining =
            Math.max(
              0,
              flow.overallDeadline -
                Date.now(),
            );

          const attemptWindow =
            Math.min(
              remaining,
              Math.max(
                pairingRetryDelayMs(
                  attempt,
                ),
                5_000,
              ),
            );

          if (
            attempt <
              flow.maxAttempts &&
            attemptWindow > 0
          ) {
            flow.attemptTimer =
              setTimeout(() => {
                flow.attemptTimer =
                  null;

                if (
                  flow.settled
                ) {
                  return;
                }

                /**
                 * Current attempt is no longer allowed
                 * to resolve the flow.
                 */
                if (
                  flow.activeIqId ===
                  request.id
                ) {
                  flow.activeIqId =
                    null;
                }

                logger?.debug(
                  {
                    requestId,
                    iqId: request.id,
                    attempt,
                  },
                  "pairing attempt window elapsed",
                );

                runAttempt(
                  attempt + 1,
                );
              }, attemptWindow);
          }
        };

        /**
         * Start synchronously.
         *
         * runAttempt() itself does not return a Promise,
         * therefore no unhandled rejection can originate
         * from this call.
         */
        runAttempt(1);
      },
    );
  };

  return {
    onPayload,
    requestCode,
    cancelAll,

    pendingCount: () =>
      active !== null &&
      !active.settled
        ? 1
        : 0,

    isBusy: () =>
      active !== null &&
      !active.settled,
  };
            }
