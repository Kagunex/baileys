/**
 * Pairing controller stability tests.
 * Pure unit tests — no real WhatsApp network.
 */

import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
} from "vitest";

import {
  createPairingController,
} from "../src/Socket/pairing-controller.js";

import {
  normalizePairingCode,
} from "../src/Protocol/pairing.js";

import {
  encodeBinaryNode,
} from "../src/WABinary/encode.js";

import type {
  BinaryNode,
} from "../src/WABinary/types.js";

import type {
  NoiseSession,
} from "../src/Noise/session.js";

import type {
  AuthenticationCreds,
} from "../src/Types/Auth.js";


function fakeSession(): NoiseSession {
  return {
    seal: (b: Buffer) => b,
    open: () => [],
  } as unknown as NoiseSession;
}


function makeCodeResultNode(
  iqId: string,
  code: string,
): Buffer {
  const node: BinaryNode = {
    tag: "iq",

    attrs: {
      id: iqId,
      type: "result",
      from: "s.whatsapp.net",
    },

    content: [
      {
        tag: "link_code_companion_reg",
        attrs: {},

        content: [
          {
            tag: "link_code_pairing_code",
            attrs: {},
            content: code.replace(/-/g, ""),
          },
        ],
      },
    ],
  };

  return encodeBinaryNode(node);
}


function getIqId(
  payload: Buffer,
): string {
  return getBinaryNodeAttr(
    decodeBinaryNode(payload),
    "id",
  )!;
}


async function getBinaryHelpers() {
  const {
    decodeBinaryNode,
  } = await import(
    "../src/WABinary/decode.js"
  );

  const {
    getBinaryNodeAttr,
  } = await import(
    "../src/WABinary/index.js"
  );

  return {
    decodeBinaryNode,
    getBinaryNodeAttr,
  };
}


describe(
  "pairing-controller",
  () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });


    afterEach(() => {
      vi.clearAllTimers();
      vi.useRealTimers();
    });


    it(
      "TEST 1: returns pairing code on matching IQ response",
      async () => {
        const ctrl =
          createPairingController();

        const sent: Buffer[] = [];

        const p =
          ctrl.requestCode(
            "6281234567890",
            {
              session: fakeSession(),

              send: (b) => {
                sent.push(b);
              },

              timeoutMs: 30_000,
              maxAttempts: 1,
            },
          );

        await vi.advanceTimersByTimeAsync(0);

        expect(
          sent.length,
        ).toBe(1);

        const {
          decodeBinaryNode,
          getBinaryNodeAttr,
        } = await getBinaryHelpers();

        const node =
          decodeBinaryNode(
            sent[0]!,
          );

        const iqId =
          getBinaryNodeAttr(
            node,
            "id",
          );

        expect(
          iqId,
        ).toBeTruthy();

        ctrl.onPayload(
          makeCodeResultNode(
            iqId!,
            "ABCD1234",
          ),
        );

        const code =
          await p;

        expect(
          normalizePairingCode(
            code.replace(/-/g, ""),
          ),
        ).toBe(
          "ABCD-1234",
        );

        expect(
          ctrl.pendingCount(),
        ).toBe(0);

        expect(
          ctrl.isBusy(),
        ).toBe(false);
      },
    );


    it(
      "TEST 2: registered credentials are rejected",
      async () => {
        const ctrl =
          createPairingController();

        const creds = {
          registered: true,
        } as AuthenticationCreds;

        await expect(
          ctrl.requestCode(
            "6281234567890",
            {
              session: fakeSession(),

              send: () => {},

              creds,
            },
          ),
        ).rejects.toThrow(
          /already registered/i,
        );

        expect(
          ctrl.isBusy(),
        ).toBe(false);

        expect(
          ctrl.pendingCount(),
        ).toBe(0);
      },
    );


    it(
      "TEST 3: second concurrent request is rejected",
      async () => {
        const ctrl =
          createPairingController();

        const sent: Buffer[] = [];

        const p1 =
          ctrl.requestCode(
            "6281111111111",
            {
              session: fakeSession(),

              send: (b) => {
                sent.push(b);
              },

              timeoutMs: 60_000,
              maxAttempts: 1,
            },
          );

        /*
         * Attach handler immediately.
         */
        const p1Handled =
          p1.catch(
            (error) => error,
          );

        await vi.advanceTimersByTimeAsync(0);

        expect(
          ctrl.isBusy(),
        ).toBe(true);

        await expect(
          ctrl.requestCode(
            "6282222222222",
            {
              session: fakeSession(),

              send: () => {},

              timeoutMs: 60_000,
              maxAttempts: 1,
            },
          ),
        ).rejects.toThrow(
          "PAIRING_ALREADY_IN_PROGRESS",
        );

        ctrl.cancelAll(
          "test cleanup",
        );

        const error =
          await p1Handled;

        expect(
          error,
        ).toBeInstanceOf(Error);

        expect(
          (error as Error).message,
        ).toMatch(
          /cleanup|cancel/i,
        );

        expect(
          ctrl.isBusy(),
        ).toBe(false);

        expect(
          ctrl.pendingCount(),
        ).toBe(0);
      },
    );


    it(
      "TEST 4: stale IQ response does not resolve new attempt",
      async () => {
        const ctrl =
          createPairingController();

        const sent: Buffer[] = [];

        const p =
          ctrl.requestCode(
            "6281234567890",
            {
              session: fakeSession(),

              send: (b) => {
                sent.push(b);
              },

              timeoutMs: 60_000,
              maxAttempts: 3,
            },
          );

        await vi.advanceTimersByTimeAsync(0);

        expect(
          sent.length,
        ).toBe(1);

        const {
          decodeBinaryNode,
          getBinaryNodeAttr,
        } = await getBinaryHelpers();

        const firstId =
          getBinaryNodeAttr(
            decodeBinaryNode(
              sent[0]!,
            ),
            "id",
          )!;

        expect(
          firstId,
        ).toBeTruthy();

        /*
         * Controller attempt window is 5 seconds.
         * After this, attempt #2 must exist.
         */
        await vi.advanceTimersByTimeAsync(
          5_000,
        );

        expect(
          sent.length,
        ).toBe(2);

        const secondId =
          getBinaryNodeAttr(
            decodeBinaryNode(
              sent[1]!,
            ),
            "id",
          )!;

        expect(
          secondId,
        ).toBeTruthy();

        expect(
          secondId,
        ).not.toBe(
          firstId,
        );

        /*
         * Old IQ response must be ignored.
         */
        ctrl.onPayload(
          makeCodeResultNode(
            firstId,
            "OLDCODE1",
          ),
        );

        expect(
          ctrl.pendingCount(),
        ).toBe(1);

        expect(
          ctrl.isBusy(),
        ).toBe(true);

        /*
         * Current IQ response must resolve.
         */
        ctrl.onPayload(
          makeCodeResultNode(
            secondId,
            "NEWCODE2",
          ),
        );

        const code =
          await p;

        expect(
          code,
        ).toMatch(
          /^[A-Z0-9]{4}-[A-Z0-9]{4}$/,
        );

        expect(
          ctrl.pendingCount(),
        ).toBe(0);

        expect(
          ctrl.isBusy(),
        ).toBe(false);
      },
    );


    it("TEST 5: response with wrong IQ id is ignored", async () => {
      const ctrl = createPairingController();
      const sent: Buffer[] = [];

      let rejectionError: Error | undefined;

      // Pasang handler catch SEGERA setelah promise dibuat
      const p = ctrl.requestCode("6281234567890", {
        session: fakeSession(),
        send: (b) => sent.push(b),
        timeoutMs: 5_000,
        maxAttempts: 1,
      }).catch((err) => {
        rejectionError = err;
      });

      await vi.advanceTimersByTimeAsync(0);

      expect(sent.length).toBe(1);

      // IQ ID salah → harus diabaikan
      ctrl.onPayload(
        makeCodeResultNode(
          "WRONG_ID_XXXX",
          "ABCD1234",
        ),
      );

      expect(ctrl.pendingCount()).toBe(1);
      expect(ctrl.isBusy()).toBe(true);

      // Trigger timeout
      await vi.advanceTimersByTimeAsync(5_000);
      // Tunggu microtask agar handler catch dieksekusi
      await Promise.resolve();

      expect(rejectionError).toBeInstanceOf(Error);
      expect(rejectionError!.message).toMatch(
        /timed out|PAIRING FAILED/i,
      );

      expect(ctrl.pendingCount()).toBe(0);
      expect(ctrl.isBusy()).toBe(false);
    });


    it("TEST 6: response after timeout is ignored (no throw)", async () => {
      const ctrl = createPairingController();
      const sent: Buffer[] = [];

      let rejectionError: Error | undefined;

      const p = ctrl.requestCode("6281234567890", {
        session: fakeSession(),
        send: (b) => sent.push(b),
        timeoutMs: 3_000,
        maxAttempts: 1,
      }).catch((err) => {
        rejectionError = err;
      });

      await vi.advanceTimersByTimeAsync(0);

      expect(sent.length).toBe(1);

      const { decodeBinaryNode } =
        await import("../src/WABinary/decode.js");

      const { getBinaryNodeAttr } =
        await import("../src/WABinary/index.js");

      const iqId = getBinaryNodeAttr(
        decodeBinaryNode(sent[0]!),
        "id",
      )!;

      expect(iqId).toBeTruthy();

      // Trigger timeout
      await vi.advanceTimersByTimeAsync(3_000);
      // Tunggu microtask
      await Promise.resolve();

      expect(rejectionError).toBeInstanceOf(Error);
      expect(rejectionError!.message).toMatch(
        /timed out|PAIRING FAILED/i,
      );

      // Response datang SETELAH timeout
      expect(() => {
        ctrl.onPayload(
          makeCodeResultNode(
            iqId,
            "LATECODE",
          ),
        );
      }).not.toThrow();

      expect(ctrl.pendingCount()).toBe(0);
      expect(ctrl.isBusy()).toBe(false);
    });


    it(
      "TEST 7: local phone number is normalized",
      async () => {
        const ctrl =
          createPairingController();

        const sent: Buffer[] = [];

        const p =
          ctrl.requestCode(
            "081234567890",
            {
              session: fakeSession(),

              send: (b) => {
                sent.push(b);
              },

              timeoutMs: 30_000,
              maxAttempts: 1,
            },
          );

        await vi.advanceTimersByTimeAsync(0);

        expect(
          sent.length,
        ).toBe(1);

        const {
          decodeBinaryNode,
          getBinaryNodeAttr,
        } = await getBinaryHelpers();

        const node =
          decodeBinaryNode(
            sent[0]!,
          );

        const iqId =
          getBinaryNodeAttr(
            node,
            "id",
          )!;

        expect(
          iqId,
        ).toBeTruthy();

        const reg =
          (
            node.content as BinaryNode[]
          )[0];

        expect(
          reg?.attrs?.jid,
        ).toMatch(
          /^62/,
        );

        ctrl.onPayload(
          makeCodeResultNode(
            iqId,
            "WXYZ9876",
          ),
        );

        const code =
          await p;

        expect(
          code,
        ).toBe(
          "WXYZ-9876",
        );

        expect(
          ctrl.isBusy(),
        ).toBe(false);

        expect(
          ctrl.pendingCount(),
        ).toBe(0);
      },
    );


    it(
      "TEST 8: registered creds skip pairing",
      async () => {
        const ctrl =
          createPairingController();

        await expect(
          ctrl.requestCode(
            "6281234567890",
            {
              session: fakeSession(),

              send: () => {
                throw new Error(
                  "should not send",
                );
              },

              creds: {
                registered: true,

                me: {
                  id:
                    "628@s.whatsapp.net",
                },
              } as AuthenticationCreds,
            },
          ),
        ).rejects.toThrow(
          /already registered/i,
        );

        expect(
          ctrl.isBusy(),
        ).toBe(false);

        expect(
          ctrl.pendingCount(),
        ).toBe(0);
      },
    );


    it(
      "TEST 9: new flow can start after cancellation",
      async () => {
        const ctrl =
          createPairingController();

        const sent: Buffer[] = [];

        const p1 =
          ctrl.requestCode(
            "6281111111111",
            {
              session: fakeSession(),

              send: (b) => {
                sent.push(b);
              },

              timeoutMs: 60_000,
              maxAttempts: 1,
            },
          );

        /*
         * Consume cancellation immediately.
         */
        const p1Handled =
          p1.catch(
            (error) => error,
          );

        await vi.advanceTimersByTimeAsync(0);

        expect(
          ctrl.isBusy(),
        ).toBe(true);

        ctrl.cancelAll(
          "disconnect",
        );

        const p1Error =
          await p1Handled;

        expect(
          p1Error,
        ).toBeInstanceOf(Error);

        expect(
          (p1Error as Error).message,
        ).toMatch(
          /disconnect|cancel/i,
        );

        expect(
          ctrl.isBusy(),
        ).toBe(false);

        expect(
          ctrl.pendingCount(),
        ).toBe(0);

        /*
         * Start independent flow.
         */
        const p2 =
          ctrl.requestCode(
            "6282222222222",
            {
              session: fakeSession(),

              send: (b) => {
                sent.push(b);
              },

              timeoutMs: 30_000,
              maxAttempts: 1,
            },
          );

        await vi.advanceTimersByTimeAsync(0);

        expect(
          ctrl.isBusy(),
        ).toBe(true);

        const {
          decodeBinaryNode,
          getBinaryNodeAttr,
        } = await getBinaryHelpers();

        const iqId =
          getBinaryNodeAttr(
            decodeBinaryNode(
              sent[
                sent.length - 1
              ]!,
            ),
            "id",
          )!;

        ctrl.onPayload(
          makeCodeResultNode(
            iqId,
            "AAAA1111",
          ),
        );

        await expect(
          p2,
        ).resolves.toBe(
          "AAAA-1111",
        );

        expect(
          ctrl.isBusy(),
        ).toBe(false);

        expect(
          ctrl.pendingCount(),
        ).toBe(0);
      },
    );


    it(
      "TEST 10: cancelAll clears active flow",
      async () => {
        const ctrl =
          createPairingController();

        const p =
          ctrl.requestCode(
            "6281234567890",
            {
              session: fakeSession(),

              send: () => {},

              timeoutMs: 60_000,
              maxAttempts: 1,
            },
          );

        /*
         * Consume cancellation immediately.
         */
        const handled =
          p.catch(
            (error) => error,
          );

        await vi.advanceTimersByTimeAsync(0);

        expect(
          ctrl.isBusy(),
        ).toBe(true);

        ctrl.cancelAll(
          "logged out",
        );

        const error =
          await handled;

        expect(
          error,
        ).toBeInstanceOf(Error);

        expect(
          (error as Error).message,
        ).toMatch(
          /logged out/i,
        );

        expect(
          ctrl.isBusy(),
        ).toBe(false);

        expect(
          ctrl.pendingCount(),
        ).toBe(0);
      },
    );


    it(
      "TEST 11: invalid phone is rejected without locking",
      async () => {
        const ctrl =
          createPairingController();

        await expect(
          ctrl.requestCode(
            "12",
            {
              session: fakeSession(),

              send: () => {},
            },
          ),
        ).rejects.toThrow(
          /invalid number|Invalid phone/i,
        );

        expect(
          ctrl.isBusy(),
        ).toBe(false);

        expect(
          ctrl.pendingCount(),
        ).toBe(0);
      },
    );
  },
);
