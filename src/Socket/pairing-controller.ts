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
    seal: (buffer: Buffer) => buffer,
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


describe("pairing-controller", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });


  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });


  /*
   * TEST 1
   *
   * Matching IQ response must resolve
   * with a formatted pairing code.
   */
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

            send: (buffer) => {
              sent.push(buffer);
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
      } =
        await import(
          "../src/WABinary/decode.js"
        );


      const {
        getBinaryNodeAttr,
      } =
        await import(
          "../src/WABinary/index.js"
        );


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


  /*
   * TEST 2
   *
   * Registered credentials must not
   * start pairing.
   */
  it(
    "TEST 2: rejects when credentials are already registered",
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


  /*
   * TEST 3
   *
   * Only one pairing flow may run
   * at the same time.
   */
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

            send: (buffer) => {
              sent.push(buffer);
            },

            timeoutMs: 60_000,
            maxAttempts: 1,
          },
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
        /PAIRING_ALREADY_IN_PROGRESS/i,
      );


      /*
       * Cancel first flow so its rejection
       * is also explicitly handled.
       */
      const cancelPromise =
        p1.catch(
          (error) => error,
        );


      ctrl.cancelAll(
        "test cleanup",
      );


      const err =
        await cancelPromise;


      expect(
        err,
      ).toBeInstanceOf(Error);


      expect(
        ctrl.isBusy(),
      ).toBe(false);


      expect(
        ctrl.pendingCount(),
      ).toBe(0);
    },
  );


  /*
   * TEST 4
   *
   * Old IQ response must not resolve
   * the newer retry attempt.
   */
  it(
    "TEST 4: response for old attempt IQ does not resolve new attempt",
    async () => {
      const ctrl =
        createPairingController();

      const sent: Buffer[] = [];


      const p =
        ctrl.requestCode(
          "6281234567890",
          {
            session: fakeSession(),

            send: (buffer) => {
              sent.push(buffer);
            },

            timeoutMs: 60_000,
            maxAttempts: 3,
          },
        );


      /*
       * Attach rejection handler immediately.
       * This prevents an unhandled rejection if
       * the test fails before the final await.
       */
      const result =
        p.then(
          (value) => ({
            ok: true as const,
            value,
          }),

          (error) => ({
            ok: false as const,
            error,
          }),
        );


      await vi.advanceTimersByTimeAsync(0);


      expect(
        sent.length,
      ).toBe(1);


      const {
        decodeBinaryNode,
      } =
        await import(
          "../src/WABinary/decode.js"
        );


      const {
        getBinaryNodeAttr,
      } =
        await import(
          "../src/WABinary/index.js"
        );


      const firstId =
        getBinaryNodeAttr(
          decodeBinaryNode(
            sent[0]!,
          ),
          "id",
        )!;


      /*
       * Retry attempt starts after 5 seconds.
       */
      await vi.advanceTimersByTimeAsync(
        5_000,
      );


      expect(
        sent.length,
      ).toBeGreaterThanOrEqual(2);


      const secondId =
        getBinaryNodeAttr(
          decodeBinaryNode(
            sent[1]!,
          ),
          "id",
        )!;


      expect(
        secondId,
      ).not.toBe(
        firstId,
      );


      /*
       * Old IQ response.
       * Must be ignored.
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


      /*
       * Current IQ response.
       * Must resolve.
       */
      ctrl.onPayload(
        makeCodeResultNode(
          secondId,
          "NEWCODE2",
        ),
      );


      const finalResult =
        await result;


      expect(
        finalResult.ok,
      ).toBe(true);


      if (finalResult.ok) {
        expect(
          finalResult.value.replace(/-/g, ""),
        ).toBe(
          "NEWCODE2",
        );
      }


      expect(
        ctrl.isBusy(),
      ).toBe(false);


      expect(
        ctrl.pendingCount(),
      ).toBe(0);
    },
  );


  /*
   * TEST 5
   *
   * Wrong IQ ID must be ignored.
   *
   * IMPORTANT:
   * The Promise handler is attached BEFORE
   * advancing the fake timer.
   */
  it(
    "TEST 5: response with wrong IQ id is ignored",
    async () => {
      const ctrl =
        createPairingController();

      const sent: Buffer[] = [];


      const p =
        ctrl.requestCode(
          "6281234567890",
          {
            session: fakeSession(),

            send: (buffer) => {
              sent.push(buffer);
            },

            timeoutMs: 5_000,
            maxAttempts: 1,
          },
        );


      /*
       * Attach handler FIRST.
       *
       * Do not wait for p directly before
       * advancing the timer.
       */
      const result =
        p.then(
          (value) => ({
            ok: true as const,
            value,
          }),

          (error) => ({
            ok: false as const,
            error,
          }),
        );


      /*
       * Start request.
       */
      await vi.advanceTimersByTimeAsync(0);


      expect(
        sent.length,
      ).toBe(1);


      /*
       * Wrong IQ ID.
       *
       * This must NOT resolve the request.
       */
      ctrl.onPayload(
        makeCodeResultNode(
          "WRONG_ID_XXXX",
          "ABCD1234",
        ),
      );


      expect(
        ctrl.pendingCount(),
      ).toBe(1);


      expect(
        ctrl.isBusy(),
      ).toBe(true);


      /*
       * Trigger overall timeout.
       */
      await vi.advanceTimersByTimeAsync(
        5_000,
      );


      const finalResult =
        await result;


      expect(
        finalResult.ok,
      ).toBe(false);


      if (!finalResult.ok) {
        expect(
          finalResult.error,
        ).toBeInstanceOf(Error);


        expect(
          finalResult.error.message,
        ).toMatch(
          /timed out|PAIRING FAILED/i,
        );
      }


      expect(
        ctrl.pendingCount(),
      ).toBe(0);


      expect(
        ctrl.isBusy(),
      ).toBe(false);
    },
  );


  /*
   * TEST 6
   *
   * IQ response arriving after timeout
   * must be ignored safely.
   */
  it(
    "TEST 6: response after timeout is ignored",
    async () => {
      const ctrl =
        createPairingController();

      const sent: Buffer[] = [];


      const p =
        ctrl.requestCode(
          "6281234567890",
          {
            session: fakeSession(),

            send: (buffer) => {
              sent.push(buffer);
            },

            timeoutMs: 3_000,
            maxAttempts: 1,
          },
        );


      /*
       * IMPORTANT:
       * Attach the Promise rejection handler
       * before timeout is triggered.
       */
      const result =
        p.then(
          (value) => ({
            ok: true as const,
            value,
          }),

          (error) => ({
            ok: false as const,
            error,
          }),
        );


      await vi.advanceTimersByTimeAsync(0);


      expect(
        sent.length,
      ).toBe(1);


      const {
        decodeBinaryNode,
      } =
        await import(
          "../src/WABinary/decode.js"
        );


      const {
        getBinaryNodeAttr,
      } =
        await import(
          "../src/WABinary/index.js"
        );


      const iqId =
        getBinaryNodeAttr(
          decodeBinaryNode(
            sent[0]!,
          ),
          "id",
        )!;


      /*
       * Trigger timeout.
       */
      await vi.advanceTimersByTimeAsync(
        3_000,
      );


      const finalResult =
        await result;


      expect(
        finalResult.ok,
      ).toBe(false);


      if (!finalResult.ok) {
        expect(
          finalResult.error,
        ).toBeInstanceOf(Error);


        expect(
          finalResult.error.message,
        ).toMatch(
          /timed out|PAIRING FAILED/i,
        );
      }


      /*
       * Simulate a late WhatsApp response.
       *
       * It must be ignored.
       */
      expect(() => {
        ctrl.onPayload(
          makeCodeResultNode(
            iqId,
            "LATECODE",
          ),
        );
      }).not.toThrow();


      expect(
        ctrl.isBusy(),
      ).toBe(false);


      expect(
        ctrl.pendingCount(),
      ).toBe(0);
    },
  );


  /*
   * TEST 7
   *
   * Pairing code must be normalized.
   */
  it(
    "TEST 7: pairing code is normalized to XXXX-XXXX",
    async () => {
      const ctrl =
        createPairingController();

      const sent: Buffer[] = [];


      const p =
        ctrl.requestCode(
          "6281234567890",
          {
            session: fakeSession(),

            send: (buffer) => {
              sent.push(buffer);
            },

            timeoutMs: 30_000,
            maxAttempts: 1,
          },
        );


      await vi.advanceTimersByTimeAsync(0);


      const {
        decodeBinaryNode,
      } =
        await import(
          "../src/WABinary/decode.js"
        );


      const {
        getBinaryNodeAttr,
      } =
        await import(
          "../src/WABinary/index.js"
        );


      const iqId =
        getBinaryNodeAttr(
          decodeBinaryNode(
            sent[0]!,
          ),
          "id",
        )!;


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
      ).toMatch(
        /^[A-Z0-9]{4}-[A-Z0-9]{4}$/,
      );


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


  /*
   * TEST 8
   *
   * Registered account must not initiate
   * another pairing request.
   */
  it(
    "TEST 8: registered credentials reject pairing",
    async () => {
      const ctrl =
        createPairingController();


      const creds = {
        registered: true,

        me: {
          id: "6281234567890@s.whatsapp.net",
        },
      } as AuthenticationCreds;


      await expect(
        ctrl.requestCode(
          "6281234567890",
          {
            session: fakeSession(),

            send: () => {
              throw new Error(
                "send() must not be called",
              );
            },

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


  /*
   * TEST 9
   *
   * After cancellation, a new pairing
   * request must be allowed.
   */
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

            send: (buffer) => {
              sent.push(buffer);
            },

            timeoutMs: 60_000,
            maxAttempts: 1,
          },
        );


      /*
       * Handle p1 immediately.
       */
      const result1 =
        p1.then(
          (value) => ({
            ok: true as const,
            value,
          }),

          (error) => ({
            ok: false as const,
            error,
          }),
        );


      await vi.advanceTimersByTimeAsync(0);


      expect(
        ctrl.isBusy(),
      ).toBe(true);


      ctrl.cancelAll(
        "disconnect",
      );


      const firstResult =
        await result1;


      expect(
        firstResult.ok,
      ).toBe(false);


      expect(
        ctrl.isBusy(),
      ).toBe(false);


      expect(
        ctrl.pendingCount(),
      ).toBe(0);


      /*
       * Start completely new flow.
       */
      const p2 =
        ctrl.requestCode(
          "6282222222222",
          {
            session: fakeSession(),

            send: (buffer) => {
              sent.push(buffer);
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
      } =
        await import(
          "../src/WABinary/decode.js"
        );


      const {
        getBinaryNodeAttr,
      } =
        await import(
          "../src/WABinary/index.js"
        );


      const lastPacket =
        sent[
          sent.length - 1
        ]!;


      const iqId =
        getBinaryNodeAttr(
          decodeBinaryNode(
            lastPacket,
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


  /*
   * TEST 10
   *
   * cancelAll() must reject the active
   * request and clear controller state.
   */
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
       * Attach handler before cancellation.
       */
      const result =
        p.then(
          (value) => ({
            ok: true as const,
            value,
          }),

          (error) => ({
            ok: false as const,
            error,
          }),
        );


      await vi.advanceTimersByTimeAsync(0);


      expect(
        ctrl.isBusy(),
      ).toBe(true);


      ctrl.cancelAll(
        "logged out",
      );


      const finalResult =
        await result;


      expect(
        finalResult.ok,
      ).toBe(false);


      if (!finalResult.ok) {
        expect(
          finalResult.error,
        ).toBeInstanceOf(Error);


        expect(
          finalResult.error.message,
        ).toMatch(
          /logged out|cancel/i,
        );
      }


      expect(
        ctrl.isBusy(),
      ).toBe(false);


      expect(
        ctrl.pendingCount(),
      ).toBe(0);
    },
  );


  /*
   * TEST 11
   *
   * Invalid phone number must reject
   * without leaving the controller locked.
   */
  it(
    "TEST 11: invalid phone number is rejected without locking",
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
        /invalid|phone|number/i,
      );


      expect(
        ctrl.isBusy(),
      ).toBe(false);


      expect(
        ctrl.pendingCount(),
      ).toBe(0);
    },
  );
});
