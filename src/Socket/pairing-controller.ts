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
      } = await import(
        "../src/WABinary/decode.js"
      );

      const {
        getBinaryNodeAttr,
      } = await import(
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

      let p1Error: unknown;

      const handled = p1.catch((error) => {
        p1Error = error;
      });

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

      ctrl.cancelAll(
        "test cleanup",
      );

      await handled;

      expect(
        p1Error,
      ).toBeInstanceOf(Error);

      expect(
        ctrl.isBusy(),
      ).toBe(false);

      expect(
        ctrl.pendingCount(),
      ).toBe(0);
    },
  );


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

      let resultValue: string | undefined;
      let resultError: unknown;

      const handled =
        p.then(
          (value) => {
            resultValue = value;
          },
          (error) => {
            resultError = error;
          },
        );

      await vi.advanceTimersByTimeAsync(0);

      expect(
        sent.length,
      ).toBe(1);

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

      const firstId =
        getBinaryNodeAttr(
          decodeBinaryNode(
            sent[0]!,
          ),
          "id",
        )!;

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

      ctrl.onPayload(
        makeCodeResultNode(
          firstId,
          "OLDCODE1",
        ),
      );

      expect(
        ctrl.pendingCount(),
      ).toBe(1);

      ctrl.onPayload(
        makeCodeResultNode(
          secondId,
          "NEWCODE2",
        ),
      );

      await handled;

      expect(
        resultError,
      ).toBeUndefined();

      expect(
        resultValue,
      ).toBeDefined();

      expect(
        resultValue?.replace(/-/g, ""),
      ).toBe(
        "NEWCODE2",
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
    "TEST 5: response with wrong IQ id is ignored",
    async () => {
      const ctrl =
        createPairingController();

      const sent: Buffer[] = [];

      let caughtError: unknown;

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
       * Keep the rejection handler attached to
       * the original Promise and explicitly await
       * the handled chain.
       */
      const handled =
        p.catch((error) => {
          caughtError = error;
        });

      await vi.advanceTimersByTimeAsync(0);

      expect(
        sent.length,
      ).toBe(1);

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

      await vi.advanceTimersByTimeAsync(
        5_000,
      );

      await handled;

      expect(
        caughtError,
      ).toBeInstanceOf(Error);

      expect(
        (caughtError as Error).message,
      ).toMatch(
        /timed out|PAIRING FAILED/i,
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
    "TEST 6: response after timeout is ignored (no throw)",
    async () => {
      const ctrl =
        createPairingController();

      const sent: Buffer[] = [];

      let caughtError: unknown;

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
       * Attach rejection handler immediately.
       */
      const handled =
        p.catch((error) => {
          caughtError = error;
        });

      await vi.advanceTimersByTimeAsync(0);

      expect(
        sent.length,
      ).toBe(1);

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

      const iqId =
        getBinaryNodeAttr(
          decodeBinaryNode(
            sent[0]!,
          ),
          "id",
        )!;

      expect(
        iqId,
      ).toBeTruthy();

      await vi.advanceTimersByTimeAsync(
        3_000,
      );

      await handled;

      expect(
        caughtError,
      ).toBeInstanceOf(Error);

      expect(
        (caughtError as Error).message,
      ).toMatch(
        /timed out|PAIRING FAILED/i,
      );

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


  it(
    "TEST 7: pairing code is normalized",
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
      } = await import(
        "../src/WABinary/decode.js"
      );

      const {
        getBinaryNodeAttr,
      } = await import(
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

      let p1Error: unknown;

      const handledP1 =
        p1.catch((error) => {
          p1Error = error;
        });

      await vi.advanceTimersByTimeAsync(0);

      expect(
        ctrl.isBusy(),
      ).toBe(true);

      ctrl.cancelAll(
        "disconnect",
      );

      await handledP1;

      expect(
        p1Error,
      ).toBeInstanceOf(Error);

      expect(
        ctrl.isBusy(),
      ).toBe(false);

      expect(
        ctrl.pendingCount(),
      ).toBe(0);

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
      } = await import(
        "../src/WABinary/decode.js"
      );

      const {
        getBinaryNodeAttr,
      } = await import(
        "../src/WABinary/index.js"
      );

      const iqId =
        getBinaryNodeAttr(
          decodeBinaryNode(
            sent[sent.length - 1]!,
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

      let caughtError: unknown;

      const handled =
        p.catch((error) => {
          caughtError = error;
        });

      await vi.advanceTimersByTimeAsync(0);

      expect(
        ctrl.isBusy(),
      ).toBe(true);

      ctrl.cancelAll(
        "logged out",
      );

      await handled;

      expect(
        caughtError,
      ).toBeInstanceOf(Error);

      expect(
        (caughtError as Error).message,
      ).toMatch(
        /logged out|cancel/i,
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
