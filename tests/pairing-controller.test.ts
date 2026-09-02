/**
 * Pairing controller stability tests.
 * Pure unit tests — no real WhatsApp network.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createPairingController } from "../src/Socket/pairing-controller.js";
import { buildPairingCodeIq, normalizePairingCode } from "../src/Protocol/pairing.js";
import { encodeBinaryNode } from "../src/WABinary/encode.js";
import type { BinaryNode } from "../src/WABinary/types.js";
import type { NoiseSession } from "../src/Noise/session.js";
import type { AuthenticationCreds } from "../src/Types/Auth.js";

function fakeSession(): NoiseSession {
  return {
    seal: (b: Buffer) => b,
    open: () => [],
  } as unknown as NoiseSession;
}

function makeCodeResultNode(iqId: string, code: string): Buffer {
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
            content: code.replace("-", ""),
          },
        ],
      },
    ],
  };
  return encodeBinaryNode(node);
}

function makeErrorResultNode(iqId: string, code = "400"): Buffer {
  const node: BinaryNode = {
    tag: "iq",
    attrs: {
      id: iqId,
      type: "error",
      from: "s.whatsapp.net",
    },
    content: [
      {
        tag: "error",
        attrs: { code, text: "bad-request" },
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
    vi.useRealTimers();
  });

  it("TEST 1: returns pairing code on matching IQ response", async () => {
    const ctrl = createPairingController();
    const sent: Buffer[] = [];
    const p = ctrl.requestCode("6281234567890", {
      session: fakeSession(),
      send: (b) => sent.push(b),
      timeoutMs: 30_000,
      maxAttempts: 1,
    });

    // Allow send to run
    await vi.advanceTimersByTimeAsync(0);
    expect(sent.length).toBe(1);

    // Recover iq id from build (re-parse last sent is hard) — use onPayload with
    // a response we construct after extracting id from a parallel build.
    // Instead: send response using parse of what was encoded is complex;
    // build a known-id request path via intercepting.
    // We re-build with same phone to get structure, but need the actual id.
    // Hack: decode sent frame is binary node — extract id attr.
    const { decodeBinaryNode } = await import("../src/WABinary/decode.js");
    const { getBinaryNodeAttr } = await import("../src/WABinary/index.js");
    const node = decodeBinaryNode(sent[0]!);
    const iqId = getBinaryNodeAttr(node, "id")!;
    expect(iqId).toBeTruthy();

    ctrl.onPayload(makeCodeResultNode(iqId, "ABCD1234"));
    const code = await p;
    expect(normalizePairingCode(code.replace("-", ""))).toBe("ABCD-1234");
    expect(ctrl.pendingCount()).toBe(0);
  });

  it("TEST 2: rejects when socket readiness is enforced by caller (registered)", async () => {
    const ctrl = createPairingController();
    const creds = { registered: true } as AuthenticationCreds;
    await expect(
      ctrl.requestCode("6281234567890", {
        session: fakeSession(),
        send: () => {},
        creds,
      }),
    ).rejects.toThrow(/already registered/);
  });

  it("TEST 3: second concurrent request rejected with PAIRING_ALREADY_IN_PROGRESS", async () => {
    const ctrl = createPairingController();
    const sent: Buffer[] = [];
    const p1 = ctrl.requestCode("6281111111111", {
      session: fakeSession(),
      send: (b) => sent.push(b),
      timeoutMs: 60_000,
      maxAttempts: 1,
    });
    await vi.advanceTimersByTimeAsync(0);
    expect(ctrl.isBusy()).toBe(true);

    await expect(
      ctrl.requestCode("6282222222222", {
        session: fakeSession(),
        send: () => {},
        timeoutMs: 60_000,
        maxAttempts: 1,
      }),
    ).rejects.toThrow("PAIRING_ALREADY_IN_PROGRESS");

    // cleanup
    ctrl.cancelAll("test cleanup");
    await expect(p1).rejects.toThrow(/cancelled|cleanup/);
  });

  it("TEST 4: response for old attempt IQ does not resolve new attempt", async () => {
    const ctrl = createPairingController();
    const sent: Buffer[] = [];
    const p = ctrl.requestCode("6281234567890", {
      session: fakeSession(),
      send: (b) => sent.push(b),
      timeoutMs: 60_000,
      maxAttempts: 3,
    });
    await vi.advanceTimersByTimeAsync(0);
    expect(sent.length).toBe(1);

    const { decodeBinaryNode } = await import("../src/WABinary/decode.js");
    const { getBinaryNodeAttr } = await import("../src/WABinary/index.js");
    const firstId = getBinaryNodeAttr(decodeBinaryNode(sent[0]!), "id")!;

    // Advance past attempt window so attempt 2 starts
    await vi.advanceTimersByTimeAsync(10_000);
    expect(sent.length).toBeGreaterThanOrEqual(2);
    const secondId = getBinaryNodeAttr(decodeBinaryNode(sent[1]!), "id")!;
    expect(secondId).not.toBe(firstId);

    // Stale response for attempt 1 must be ignored
    ctrl.onPayload(makeCodeResultNode(firstId, "OLDCODE1"));
    // Still pending
    expect(ctrl.pendingCount()).toBe(1);

    // Matching active attempt resolves
    ctrl.onPayload(makeCodeResultNode(secondId, "NEWCODE2"));
    const code = await p;
    expect(code.replace("-", "").length).toBe(8);
  });

  it("TEST 5: response with wrong IQ id is ignored", async () => {
    const ctrl = createPairingController();
    const sent: Buffer[] = [];
    const p = ctrl.requestCode("6281234567890", {
      session: fakeSession(),
      send: (b) => sent.push(b),
      timeoutMs: 5_000,
      maxAttempts: 1,
    });
    await vi.advanceTimersByTimeAsync(0);

    ctrl.onPayload(makeCodeResultNode("WRONG_ID_XXXX", "ABCD1234"));
    expect(ctrl.pendingCount()).toBe(1);

    // Pasang rejection handler SEBELUM timer dijalankan
const rejection = expect(p).rejects.toThrow(/timed out|PAIRING FAILED/);

// Timeout
await vi.advanceTimersByTimeAsync(5_100);
await rejection;

  it("TEST 6: response after timeout is ignored (no throw)", async () => {
    const ctrl = createPairingController();
    const sent: Buffer[] = [];
    const p = ctrl.requestCode("6281234567890", {
      session: fakeSession(),
      send: (b) => sent.push(b),
      timeoutMs: 3_000,
      maxAttempts: 1,
    });
    await vi.advanceTimersByTimeAsync(0);
    const { decodeBinaryNode } = await import("../src/WABinary/decode.js");
    const { getBinaryNodeAttr } = await import("../src/WABinary/index.js");
    const iqId = getBinaryNodeAttr(decodeBinaryNode(sent[0]!), "id")!;

    const rejection = expect(p).rejects.toThrow(/timed out|PAIRING FAILED/);

await vi.advanceTimersByTimeAsync(3_100);
await rejection;
    // Late response must not throw or re-lock
    expect(() => ctrl.onPayload(makeCodeResultNode(iqId, "LATECODE"))).not.toThrow();
    expect(ctrl.isBusy()).toBe(false);
  });

  it("TEST 7: successful pairing returns formatted code and clears lock", async () => {
    const ctrl = createPairingController();
    const sent: Buffer[] = [];
    const p = ctrl.requestCode("081234567890", {
      session: fakeSession(),
      send: (b) => sent.push(b),
      timeoutMs: 30_000,
      maxAttempts: 1,
    });
    await vi.advanceTimersByTimeAsync(0);
    const { decodeBinaryNode } = await import("../src/WABinary/decode.js");
    const { getBinaryNodeAttr } = await import("../src/WABinary/index.js");
    const iqId = getBinaryNodeAttr(decodeBinaryNode(sent[0]!), "id")!;
    // Phone should be normalized to 62...
    const node = decodeBinaryNode(sent[0]!);
    const reg = (node.content as BinaryNode[])[0];
    expect(reg?.attrs?.jid).toMatch(/^62/);

    ctrl.onPayload(makeCodeResultNode(iqId, "WXYZ9876"));
    const code = await p;
    expect(code).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    expect(ctrl.isBusy()).toBe(false);
  });

  it("TEST 8: registered creds skip pairing", async () => {
    const ctrl = createPairingController();
    await expect(
      ctrl.requestCode("6281234567890", {
        session: fakeSession(),
        send: () => {
          throw new Error("should not send");
        },
        creds: { registered: true, me: { id: "628@s.whatsapp.net" } } as AuthenticationCreds,
      }),
    ).rejects.toThrow(/already registered/);
  });

  it("TEST 9: after cancel, new sender/flow can start independently", async () => {
    const ctrl = createPairingController();
    const sent: Buffer[] = [];
    const p1 = ctrl.requestCode("6281111111111", {
      session: fakeSession(),
      send: (b) => sent.push(b),
      timeoutMs: 60_000,
      maxAttempts: 1,
    });
    await vi.advanceTimersByTimeAsync(0);
    ctrl.cancelAll("disconnect");
    await expect(p1).rejects.toThrow(/disconnect|cancelled/);

    // New flow
    const p2 = ctrl.requestCode("6282222222222", {
      session: fakeSession(),
      send: (b) => sent.push(b),
      timeoutMs: 30_000,
      maxAttempts: 1,
    });
    await vi.advanceTimersByTimeAsync(0);
    expect(ctrl.isBusy()).toBe(true);
    const { decodeBinaryNode } = await import("../src/WABinary/decode.js");
    const { getBinaryNodeAttr } = await import("../src/WABinary/index.js");
    const iqId = getBinaryNodeAttr(decodeBinaryNode(sent[sent.length - 1]!), "id")!;
    ctrl.onPayload(makeCodeResultNode(iqId, "AAAA1111"));
    await expect(p2).resolves.toMatch(/AAAA-1111/);
  });

  it("TEST 10: cancelAll on logout-style reason clears lock", async () => {
    const ctrl = createPairingController();
    const p = ctrl.requestCode("6281234567890", {
      session: fakeSession(),
      send: () => {},
      timeoutMs: 60_000,
      maxAttempts: 1,
    });
    await vi.advanceTimersByTimeAsync(0);
    ctrl.cancelAll("logged out");
    await expect(p).rejects.toThrow(/logged out/);
    expect(ctrl.isBusy()).toBe(false);
    expect(ctrl.pendingCount()).toBe(0);
  });

  it("invalid phone is rejected without locking", async () => {
    const ctrl = createPairingController();
    await expect(
      ctrl.requestCode("12", {
        session: fakeSession(),
        send: () => {},
      }),
    ).rejects.toThrow(/invalid number|Invalid phone/);
    expect(ctrl.isBusy()).toBe(false);
  });
});
