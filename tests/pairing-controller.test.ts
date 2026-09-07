/**
 * Pairing controller stability + IQ-id safety tests.
 * Pure unit tests — no real WhatsApp network.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createPairingController } from "../src/Socket/pairing-controller.js";
import { normalizePairingCode } from "../src/Protocol/pairing.js";
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

async function extractIqId(buf: Buffer): Promise<string> {
  const { decodeBinaryNode } = await import("../src/WABinary/decode.js");
  const { getBinaryNodeAttr } = await import("../src/WABinary/index.js");
  return getBinaryNodeAttr(decodeBinaryNode(buf), "id")!;
}

describe("pairing-controller", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  // ------------------------------------------------------------------
  // TEST 1 — Successful pairing code response
  // ------------------------------------------------------------------
  it("TEST 1: returns pairing code on matching IQ response", async () => {
    const ctrl = createPairingController();
    const sent: Buffer[] = [];
    const p = ctrl.requestCode("6281234567890", {
      session: fakeSession(),
      send: (b) => sent.push(b),
      timeoutMs: 30_000,
      maxAttempts: 1,
    });
    await vi.advanceTimersByTimeAsync(0);
    expect(sent.length).toBe(1);
    const iqId = await extractIqId(sent[0]!);
    expect(ctrl.isActiveIq(iqId)).toBe(true);
    expect(ctrl.isActiveIq("WRONG")).toBe(false);

    ctrl.onPayload(makeCodeResultNode(iqId, "ABCD1234"));
    const code = await p;
    expect(normalizePairingCode(code.replace("-", ""))).toBe("ABCD-1234");
    expect(ctrl.pendingCount()).toBe(0);
    expect(ctrl.isBusy()).toBe(false);
    expect(ctrl.isActiveIq(iqId)).toBe(false);
  });

  // ------------------------------------------------------------------
  // TEST 2 — registered skip
  // ------------------------------------------------------------------
  it("TEST 2: rejects when already registered", async () => {
    const ctrl = createPairingController();
    const creds = { registered: true } as AuthenticationCreds;
    await expect(
      ctrl.requestCode("6281234567890", {
        session: fakeSession(),
        send: () => {},
        creds,
      }),
    ).rejects.toThrow(/already registered/);
    expect(ctrl.isBusy()).toBe(false);
  });

  // ------------------------------------------------------------------
  // TEST 3 — concurrent request rejected
  // ------------------------------------------------------------------
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

    ctrl.cancelAll("test cleanup");
    await expect(p1).rejects.toThrow(/cancelled|cleanup/);
  });

  // ------------------------------------------------------------------
  // TEST 4 — response for old attempt IQ does not resolve new attempt
  // ------------------------------------------------------------------
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
    const firstId = await extractIqId(sent[0]!);
    expect(ctrl.isActiveIq(firstId)).toBe(true);

    // Advance past attempt window so attempt 2 starts
    await vi.advanceTimersByTimeAsync(5_100);
    expect(sent.length).toBeGreaterThanOrEqual(2);
    const secondId = await extractIqId(sent[1]!);
    expect(secondId).not.toBe(firstId);
    expect(ctrl.isActiveIq(firstId)).toBe(false);
    expect(ctrl.isActiveIq(secondId)).toBe(true);

    // Stale response for attempt 1 must be ignored
    ctrl.onPayload(makeCodeResultNode(firstId, "OLDCODE1"));
    expect(ctrl.pendingCount()).toBe(1);
    expect(ctrl.isActiveIq(secondId)).toBe(true);

    // Matching active attempt resolves
    ctrl.onPayload(makeCodeResultNode(secondId, "NEWCODE2"));
    const code = await p;
    expect(code.replace("-", "").length).toBe(8);
    expect(ctrl.isBusy()).toBe(false);
  });

  // ------------------------------------------------------------------
  // TEST 5 — wrong IQ id is ignored; pairing stays active until timeout
  // ------------------------------------------------------------------
  it("TEST 5: response with wrong IQ id is ignored", async () => {
    const ctrl = createPairingController();
    const sent: Buffer[] = [];
    const p = ctrl.requestCode("6281234567890", {
      session: fakeSession(),
      send: (b) => sent.push(b),
      timeoutMs: 5_000,
      maxAttempts: 1,
    });
    // Attach rejection handler BEFORE any timer that can reject
    let capturedError: unknown;
    const handled = p.catch((err) => {
      capturedError = err;
    });
    await vi.advanceTimersByTimeAsync(0);
    const realId = await extractIqId(sent[0]!);
    expect(ctrl.isActiveIq(realId)).toBe(true);
    expect(ctrl.isActiveIq("WRONG_ID_XXXX")).toBe(false);

    ctrl.onPayload(makeCodeResultNode("WRONG_ID_XXXX", "ABCD1234"));
    expect(ctrl.pendingCount()).toBe(1);
    expect(ctrl.isBusy()).toBe(true);
    // still active for real id
    expect(ctrl.isActiveIq(realId)).toBe(true);

    // Timeout
    await vi.advanceTimersByTimeAsync(5_100);
    await handled;
    expect(capturedError).toBeInstanceOf(Error);
    expect(String(capturedError)).toMatch(/timed out|PAIRING FAILED/);
    expect(ctrl.pendingCount()).toBe(0);
    expect(ctrl.isBusy()).toBe(false);
    expect(ctrl.isActiveIq(realId)).toBe(false);
  });

  // ------------------------------------------------------------------
  // TEST 6 — response after timeout is ignored
  // ------------------------------------------------------------------
  it("TEST 6: response after timeout is ignored (no throw)", async () => {
    const ctrl = createPairingController();
    const sent: Buffer[] = [];
    const p = ctrl.requestCode("6281234567890", {
      session: fakeSession(),
      send: (b) => sent.push(b),
      timeoutMs: 3_000,
      maxAttempts: 1,
    });
    let capturedError: unknown;
    const handled = p.catch((err) => {
      capturedError = err;
    });
    await vi.advanceTimersByTimeAsync(0);
    const iqId = await extractIqId(sent[0]!);

    await vi.advanceTimersByTimeAsync(3_100);
    await handled;
    expect(capturedError).toBeInstanceOf(Error);
    expect(String(capturedError)).toMatch(/timed out|PAIRING FAILED/);
    expect(ctrl.isActiveIq(iqId)).toBe(false);

    // Late response must not throw or re-lock
    expect(() => ctrl.onPayload(makeCodeResultNode(iqId, "LATECODE"))).not.toThrow();
    expect(ctrl.pendingCount()).toBe(0);
    expect(ctrl.isBusy()).toBe(false);
  });

  // ------------------------------------------------------------------
  // TEST 7 — successful pairing returns formatted code and clears lock
  // ------------------------------------------------------------------
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
    const iqId = await extractIqId(sent[0]!);
    // Phone should be normalized to 62...
    const { decodeBinaryNode } = await import("../src/WABinary/decode.js");
    const node = decodeBinaryNode(sent[0]!);
    const reg = (node.content as BinaryNode[])[0];
    expect(reg?.attrs?.jid).toMatch(/^62/);

    ctrl.onPayload(makeCodeResultNode(iqId, "WXYZ9876"));
    const code = await p;
    expect(code).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    expect(ctrl.isBusy()).toBe(false);
    expect(ctrl.isActiveIq(iqId)).toBe(false);
  });

  // ------------------------------------------------------------------
  // TEST 8 — registered creds skip pairing
  // ------------------------------------------------------------------
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

  // ------------------------------------------------------------------
  // TEST 9 — after cancel, new flow can start independently
  // ------------------------------------------------------------------
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
    const oldId = await extractIqId(sent[0]!);
    ctrl.cancelAll("disconnect");
    await expect(p1).rejects.toThrow(/disconnect|cancelled/);
    expect(ctrl.isActiveIq(oldId)).toBe(false);

    // New flow
    const p2 = ctrl.requestCode("6282222222222", {
      session: fakeSession(),
      send: (b) => sent.push(b),
      timeoutMs: 30_000,
      maxAttempts: 1,
    });
    await vi.advanceTimersByTimeAsync(0);
    expect(ctrl.isBusy()).toBe(true);
    const iqId = await extractIqId(sent[sent.length - 1]!);
    expect(ctrl.isActiveIq(oldId)).toBe(false);
    expect(ctrl.isActiveIq(iqId)).toBe(true);
    ctrl.onPayload(makeCodeResultNode(iqId, "AAAA1111"));
    await expect(p2).resolves.toMatch(/AAAA-1111/);
  });

  // ------------------------------------------------------------------
  // TEST 10 — cancelAll on logout-style reason clears lock
  // ------------------------------------------------------------------
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

  // ------------------------------------------------------------------
  // invalid phone
  // ------------------------------------------------------------------
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

  // ------------------------------------------------------------------
  // TEST 11 — success before retry timer → no extra IQ
  // ------------------------------------------------------------------
  it("TEST 11: success before retry timer does not send extra IQ", async () => {
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
    const iqId = await extractIqId(sent[0]!);
    ctrl.onPayload(makeCodeResultNode(iqId, "SUCC0001"));
    await expect(p).resolves.toMatch(/SUCC-0001/);
    // Advance past attempt window — must not send more
    await vi.advanceTimersByTimeAsync(10_000);
    expect(sent.length).toBe(1);
    expect(ctrl.isBusy()).toBe(false);
  });

  // ------------------------------------------------------------------
  // TEST 12 — cancel before retry timer → no extra IQ
  // ------------------------------------------------------------------
  it("TEST 12: cancel before retry timer does not send extra IQ", async () => {
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
    ctrl.cancelAll("user cancel");
    await expect(p).rejects.toThrow(/user cancel/);
    await vi.advanceTimersByTimeAsync(10_000);
    expect(sent.length).toBe(1);
    expect(ctrl.isBusy()).toBe(false);
  });

  // ------------------------------------------------------------------
  // TEST 13 — old flow timeout after new flow started is isolated
  // ------------------------------------------------------------------
  it("TEST 13: old flow timeout after new flow started does not affect new flow", async () => {
    const ctrl = createPairingController();
    const sent: Buffer[] = [];

    // Flow A — short timeout
    const pA = ctrl.requestCode("6281111111111", {
      session: fakeSession(),
      send: (b) => sent.push(b),
      timeoutMs: 2_000,
      maxAttempts: 1,
    });
    let errA: unknown;
    const handledA = pA.catch((e) => {
      errA = e;
    });
    await vi.advanceTimersByTimeAsync(0);
    const idA = await extractIqId(sent[0]!);

    // Cancel A early so we can start B (cancel simulates disconnect)
    ctrl.cancelAll("switch");
    await handledA;
    expect(String(errA)).toMatch(/switch/);

    // Flow B
    const pB = ctrl.requestCode("6282222222222", {
      session: fakeSession(),
      send: (b) => sent.push(b),
      timeoutMs: 30_000,
      maxAttempts: 1,
    });
    await vi.advanceTimersByTimeAsync(0);
    const idB = await extractIqId(sent[sent.length - 1]!);
    expect(ctrl.isActiveIq(idA)).toBe(false);
    expect(ctrl.isActiveIq(idB)).toBe(true);

    // Old IQ from A must be ignored
    ctrl.onPayload(makeCodeResultNode(idA, "OLDAAAAA"));
    expect(ctrl.isBusy()).toBe(true);

    // B resolves with its own code
    ctrl.onPayload(makeCodeResultNode(idB, "NEWBBBBB"));
    await expect(pB).resolves.toMatch(/NEWB-BBBB/);
    expect(ctrl.isBusy()).toBe(false);
  });

  // ------------------------------------------------------------------
  // TEST 14 — isActiveIq / wrong IQ must not be accepted for code save
  // ------------------------------------------------------------------
  it("TEST 14: isActiveIq rejects wrong and stale IQ ids (creds safety)", async () => {
    const ctrl = createPairingController();
    const sent: Buffer[] = [];
    const p = ctrl.requestCode("6281234567890", {
      session: fakeSession(),
      send: (b) => sent.push(b),
      timeoutMs: 30_000,
      maxAttempts: 1,
    });
    await vi.advanceTimersByTimeAsync(0);
    const realId = await extractIqId(sent[0]!);

    // Wrong id
    expect(ctrl.isActiveIq("WRONG")).toBe(false);
    expect(ctrl.isActiveIq(undefined)).toBe(false);
    expect(ctrl.isActiveIq(null)).toBe(false);
    expect(ctrl.isActiveIq("")).toBe(false);
    // Real active id
    expect(ctrl.isActiveIq(realId)).toBe(true);

    // After success → no longer active
    ctrl.onPayload(makeCodeResultNode(realId, "SAFE1234"));
    await p;
    expect(ctrl.isActiveIq(realId)).toBe(false);
    expect(ctrl.isBusy()).toBe(false);
  });

  // ------------------------------------------------------------------
  // TEST 15 — multiple settle protection (onPayload after settle)
  // ------------------------------------------------------------------
  it("TEST 15: multiple settle protection — late onPayload does nothing", async () => {
    const ctrl = createPairingController();
    const sent: Buffer[] = [];
    const p = ctrl.requestCode("6281234567890", {
      session: fakeSession(),
      send: (b) => sent.push(b),
      timeoutMs: 30_000,
      maxAttempts: 1,
    });
    await vi.advanceTimersByTimeAsync(0);
    const iqId = await extractIqId(sent[0]!);
    ctrl.onPayload(makeCodeResultNode(iqId, "ONCE0001"));
    const code = await p;
    expect(code).toMatch(/ONCE-0001/);
    // Second response must not throw / re-resolve
    expect(() => ctrl.onPayload(makeCodeResultNode(iqId, "TWICE002"))).not.toThrow();
    expect(ctrl.isBusy()).toBe(false);
    expect(ctrl.isActiveIq(iqId)).toBe(false);
  });

  // ------------------------------------------------------------------
  // TEST 16 — error response on active IQ rejects properly
  // ------------------------------------------------------------------
  it("TEST 16: error response on active IQ rejects the flow", async () => {
    const ctrl = createPairingController();
    const sent: Buffer[] = [];
    const p = ctrl.requestCode("6281234567890", {
      session: fakeSession(),
      send: (b) => sent.push(b),
      timeoutMs: 30_000,
      maxAttempts: 1,
    });
    await vi.advanceTimersByTimeAsync(0);
    const iqId = await extractIqId(sent[0]!);
    ctrl.onPayload(makeErrorResultNode(iqId, "400"));
    await expect(p).rejects.toThrow(/PAIRING FAILED|400/);
    expect(ctrl.isBusy()).toBe(false);
    expect(ctrl.isActiveIq(iqId)).toBe(false);
  });
});
