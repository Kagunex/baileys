import type { AuthenticationCreds } from "../Types/Auth.js";
import type { NoiseSession } from "../Noise/session.js";
import type { BinaryNode } from "../WABinary/types.js";

import {
  decodeBinaryNode,
} from "../WABinary/decode.js";

import {
  getBinaryNodeAttr,
  getBinaryNodeChild,
  getBinaryNodeChildBuffer,
} from "../WABinary/index.js";

import {
  normalizePairingCode,
  makePairingNode,
} from "../Protocol/pairing.js";

type SendFn = (buffer: Buffer) => void | Promise<void>;

export interface PairingControllerOptions {
  session: NoiseSession;
  send: SendFn;
  creds?: AuthenticationCreds;

  timeoutMs?: number;
  maxAttempts?: number;
}

interface ActiveFlow {
  phoneNumber: string;

  session: NoiseSession;
  send: SendFn;
  creds?: AuthenticationCreds;

  timeoutMs: number;
  maxAttempts: number;

  settled: boolean;

  activeIqId?: string;

  overallTimer?: ReturnType<typeof setTimeout>;
  attemptTimer?: ReturnType<typeof setTimeout>;

  resolve: (code: string) => void;
  reject: (error: Error) => void;
}

export interface PairingController {
  requestCode(
    phoneNumber: string,
    options: PairingControllerOptions,
  ): Promise<string>;

  onPayload(payload: Buffer | BinaryNode): void;

  cancelAll(reason?: string): void;

  isBusy(): boolean;

  pendingCount(): number;
}

function createIqId(): string {
  return `pair-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function normalizePhoneNumber(
  phoneNumber: string,
): string {
  return phoneNumber.replace(/\D/g, "");
}

function validatePhoneNumber(
  phoneNumber: string,
): boolean {
  const normalized =
    normalizePhoneNumber(phoneNumber);

  return (
    normalized.length >= 8 &&
    normalized.length <= 15
  );
}

function getErrorMessage(
  error: unknown,
): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function createTimeoutError(
  timeoutMs: number,
): Error {
  return new Error(
    `PAIRING FAILED: pairing code request timed out after ${timeoutMs}ms`,
  );
}

function createCancelledError(
  reason: string,
): Error {
  return new Error(
    `PAIRING CANCELLED: ${reason}`,
  );
}

function extractPairingCode(
  node: BinaryNode,
): string | undefined {
  const registration =
    getBinaryNodeChild(
      node,
      "link_code_companion_reg",
    );

  if (!registration) {
    return undefined;
  }

  const pairingCode =
    getBinaryNodeChild(
      registration,
      "link_code_pairing_code",
    );

  if (!pairingCode) {
    return undefined;
  }

  const raw =
    getBinaryNodeChildBuffer(
      registration,
      "link_code_pairing_code",
    );

  if (raw) {
    return normalizePairingCode(
      raw.toString(),
    );
  }

  if (
    typeof pairingCode.content === "string"
  ) {
    return normalizePairingCode(
      pairingCode.content,
    );
  }

  return undefined;
}

export function createPairingController(): PairingController {
  let active: ActiveFlow | undefined;

  function cleanupFlow(
    flow: ActiveFlow,
  ): void {
    if (flow.overallTimer) {
      clearTimeout(flow.overallTimer);
      flow.overallTimer = undefined;
    }

    if (flow.attemptTimer) {
      clearTimeout(flow.attemptTimer);
      flow.attemptTimer = undefined;
    }

    flow.activeIqId = undefined;

    if (active === flow) {
      active = undefined;
    }
  }

  function settleResolve(
    flow: ActiveFlow,
    code: string,
  ): void {
    if (flow.settled) {
      return;
    }

    flow.settled = true;

    cleanupFlow(flow);

    flow.resolve(
      normalizePairingCode(code),
    );
  }

  function settleReject(
    flow: ActiveFlow,
    error: Error,
  ): void {
    if (flow.settled) {
      return;
    }

    flow.settled = true;

    cleanupFlow(flow);

    /*
     * IMPORTANT:
     * Reject only the original Promise.
     *
     * No background Promise is allowed
     * to reject from this controller.
     */
    flow.reject(error);
  }

  function pairingRetryDelayMs(
    attempt: number,
  ): number {
    return Math.min(
      500 * Math.pow(2, attempt - 1),
      8_000,
    );
  }

  function runAttempt(
    flow: ActiveFlow,
    attempt: number,
  ): void {
    /*
     * Intentionally NOT async.
     *
     * This is important because an async
     * fire-and-forget function can create an
     * unhandled rejection.
     */
    if (
      flow.settled ||
      active !== flow
    ) {
      return;
    }

    if (
      attempt > flow.maxAttempts
    ) {
      settleReject(
        flow,
        new Error(
          `PAIRING FAILED: maximum attempts (${flow.maxAttempts}) reached`,
        ),
      );

      return;
    }

    const iqId = createIqId();

    flow.activeIqId = iqId;

    const startedAt =
      Date.now();

    const remaining =
      Math.max(
        1,
        flow.timeoutMs -
          (startedAt -
            startedAt),
      );

    const attemptWindow =
      Math.min(
        Math.max(
          pairingRetryDelayMs(attempt),
          5_000,
        ),
        remaining,
      );

    let payload: Buffer;

    try {
      payload = makePairingNode(
        flow.phoneNumber,
        iqId,
      );
    } catch (error) {
      handleAttemptFailure(
        flow,
        attempt,
        error,
      );

      return;
    }

    try {
      const result =
        flow.send(payload);

      /*
       * If send() returns a Promise,
       * consume its rejection here.
       */
      if (
        result &&
        typeof (
          result as Promise<void>
        ).then === "function"
      ) {
        Promise.resolve(result).catch(
          (error) => {
            handleAttemptFailure(
              flow,
              attempt,
              error,
            );
          },
        );
      }
    } catch (error) {
      handleAttemptFailure(
        flow,
        attempt,
        error,
      );

      return;
    }

    flow.attemptTimer =
      setTimeout(() => {
        if (
          flow.settled ||
          active !== flow
        ) {
          return;
        }

        if (
          flow.activeIqId !== iqId
        ) {
          return;
        }

        flow.activeIqId =
          undefined;

        if (
          attempt >= flow.maxAttempts
        ) {
          settleReject(
            flow,
            createTimeoutError(
              flow.timeoutMs,
            ),
          );

          return;
        }

        const delay =
          pairingRetryDelayMs(
            attempt,
          );

        setTimeout(() => {
          runAttempt(
            flow,
            attempt + 1,
          );
        }, delay);
      }, attemptWindow);
  }

  function handleAttemptFailure(
    flow: ActiveFlow,
    attempt: number,
    error: unknown,
  ): void {
    if (
      flow.settled ||
      active !== flow
    ) {
      return;
    }

    if (
      attempt >= flow.maxAttempts
    ) {
      settleReject(
        flow,
        new Error(
          `PAIRING FAILED: ${getErrorMessage(
            error,
          )}`,
        ),
      );

      return;
    }

    flow.activeIqId =
      undefined;

    if (flow.attemptTimer) {
      clearTimeout(
        flow.attemptTimer,
      );

      flow.attemptTimer =
        undefined;
    }

    const delay =
      pairingRetryDelayMs(
        attempt,
      );

    setTimeout(() => {
      runAttempt(
        flow,
        attempt + 1,
      );
    }, delay);
  }

  function requestCode(
    phoneNumber: string,
    options: PairingControllerOptions,
  ): Promise<string> {
    const normalized =
      normalizePhoneNumber(
        phoneNumber,
      );

    if (
      !validatePhoneNumber(
        normalized,
      )
    ) {
      return Promise.reject(
        new Error(
          "Invalid phone number",
        ),
      );
    }

    if (
      options.creds?.registered
    ) {
      return Promise.reject(
        new Error(
          "Pairing cannot be requested: credentials are already registered",
        ),
      );
    }

    if (active) {
      return Promise.reject(
        new Error(
          "PAIRING_ALREADY_IN_PROGRESS",
        ),
      );
    }

    const timeoutMs =
      Math.max(
        options.timeoutMs ?? 60_000,
        1,
      );

    const maxAttempts =
      Math.max(
        options.maxAttempts ?? 3,
        1,
      );

    return new Promise<string>(
      (resolve, reject) => {
        const flow: ActiveFlow = {
          phoneNumber: normalized,

          session:
            options.session,

          send:
            options.send,

          creds:
            options.creds,

          timeoutMs,
          maxAttempts,

          settled: false,

          resolve,
          reject,
        };

        active = flow;

        /*
         * Overall timeout is the final
         * authority for the whole flow.
         */
        flow.overallTimer =
          setTimeout(() => {
            if (
              flow.settled ||
              active !== flow
            ) {
              return;
            }

            settleReject(
              flow,
              createTimeoutError(
                timeoutMs,
              ),
            );
          }, timeoutMs);

        /*
         * No `void asyncFunction()`.
         * runAttempt() itself cannot produce
         * an unhandled rejection.
         */
        runAttempt(
          flow,
          1,
        );
      },
    );
  }

  function onPayload(
    payload: Buffer | BinaryNode,
  ): void {
    if (!active) {
      return;
    }

    const flow = active;

    if (flow.settled) {
      return;
    }

    let node: BinaryNode;

    try {
      node =
        Buffer.isBuffer(payload)
          ? decodeBinaryNode(payload)
          : payload;
    } catch {
      return;
    }

    if (node.tag !== "iq") {
      return;
    }

    const iqId =
      getBinaryNodeAttr(
        node,
        "id",
      );

    /*
     * Ignore stale / unrelated IQ.
     */
    if (
      !iqId ||
      iqId !== flow.activeIqId
    ) {
      return;
    }

    const type =
      getBinaryNodeAttr(
        node,
        "type",
      );

    if (type === "error") {
      const errorNode =
        getBinaryNodeChild(
          node,
          "error",
        );

      const code =
        errorNode
          ? getBinaryNodeAttr(
              errorNode,
              "code",
            )
          : undefined;

      settleReject(
        flow,
        new Error(
          `PAIRING FAILED: WhatsApp returned error${
            code
              ? ` ${code}`
              : ""
          }`,
        ),
      );

      return;
    }

    if (
      type !== "result"
    ) {
      return;
    }

    const code =
      extractPairingCode(node);

    if (!code) {
      return;
    }

    settleResolve(
      flow,
      code,
    );
  }

  function cancelAll(
    reason = "cancelled",
  ): void {
    if (!active) {
      return;
    }

    const flow =
      active;

    settleReject(
      flow,
      createCancelledError(
        reason,
      ),
    );
  }

  function isBusy(): boolean {
    return (
      active !== undefined &&
      !active.settled
    );
  }

  function pendingCount(): number {
    return isBusy()
      ? 1
      : 0;
  }

  return {
    requestCode,
    onPayload,
    cancelAll,
    isBusy,
    pendingCount,
  };
}
