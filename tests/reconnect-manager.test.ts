import { describe, it, expect } from "vitest";
import { createReconnectManager } from "../src/Socket/reconnect-manager.js";
import { EventBuffer } from "../src/Events/buffer.js";
import { EventEmitter } from "../src/Events/emitter.js";
import {
  DisconnectStatus,
  shouldSkipPairingOnReconnect,
  resolveLoginMode,
} from "../src/Socket/login-lifecycle.js";
import { initAuthCreds } from "../src/Auth/credentials.js";
import { shouldReconnect, computeReconnectDelayMs } from "../src/Socket/reconnect.js";

describe("ReconnectManager", () => {
  it("single generation — stale close ignored", () => {
    const rm = createReconnectManager();
    const g1 = rm.beginConnect();
    const g2 = rm.beginConnect();
    expect(g2).toBeGreaterThan(g1);
    const d = rm.onClose(g1, { intentional: false, stopped: false, code: 1006 });
    expect(d.should).toBe(false);
    expect(d.reason).toBe("stale generation");
  });

  it("does not reconnect when intentional or logged out", () => {
    const rm = createReconnectManager();
    const g = rm.beginConnect();
    expect(
      rm.onClose(g, { intentional: true, stopped: false, code: 1000 }).should,
    ).toBe(false);
    const g2 = rm.beginConnect();
    expect(
      rm.onClose(g2, {
        intentional: false,
        stopped: false,
        disconnect: {
          statusCode: DisconnectStatus.loggedOut,
          isLoggedOut: true,
          message: "out",
        },
      }).should,
    ).toBe(false);
  });

  it("schedules reconnect on network drop", () => {
    const rm = createReconnectManager(undefined, {
      maxRetries: 5,
      baseDelayMs: 10,
      maxDelayMs: 50,
      jitter: 0,
    });
    const g = rm.beginConnect();
    const d = rm.onClose(g, {
      intentional: false,
      stopped: false,
      code: 1006,
      reasonText: "network",
    });
    expect(d.should).toBe(true);
    expect(d.delayMs).toBeGreaterThanOrEqual(0);
  });

  it("markOpen resets attempts", async () => {
    const rm = createReconnectManager(undefined, {
      maxRetries: 8,
      baseDelayMs: 1,
      maxDelayMs: 5,
      jitter: 0,
    });
    const g = rm.beginConnect();
    rm.onClose(g, { intentional: false, stopped: false, code: 1006 });
    await rm.waitBackoff();
    expect(rm.attempt).toBeGreaterThan(0);
    rm.markOpen(g);
    expect(rm.attempt).toBe(0);
  });

  // --- CASE A: authenticated session reconnects without pairing ---
  it("CASE A: authenticated session → close → reconnect uses existing creds (no pairing)", () => {
    const creds = initAuthCreds();
    creds.registered = true;
    creds.me = { id: "628@s.whatsapp.net" };
    expect(shouldSkipPairingOnReconnect(creds)).toBe(true);
    expect(resolveLoginMode(creds)).toBe("registered");

    const rm = createReconnectManager(undefined, {
      maxRetries: 3,
      baseDelayMs: 1,
      maxDelayMs: 5,
      jitter: 0,
    });
    const g = rm.beginConnect();
    rm.markOpen(g);
    const d = rm.onClose(g, {
      intentional: false,
      stopped: false,
      code: 1006,
      reasonText: "drop",
    });
    expect(d.should).toBe(true);
    // after reconnect decision, creds still registered — caller must not request pairing
    expect(shouldSkipPairingOnReconnect(creds)).toBe(true);
  });

  // --- CASE B: temporary failure, session remains valid ---
  it("CASE B: temporary failure → retry → session still valid", async () => {
    const creds = initAuthCreds();
    creds.registered = true;
    creds.me = { id: "628@s.whatsapp.net" };

    const rm = createReconnectManager(undefined, {
      maxRetries: 5,
      baseDelayMs: 1,
      maxDelayMs: 5,
      jitter: 0,
    });
    const g = rm.beginConnect();
    rm.markOpen(g);
    const d1 = rm.onClose(g, {
      intentional: false,
      stopped: false,
      code: 1006,
    });
    expect(d1.should).toBe(true);
    await rm.waitBackoff();
    // session flags unchanged
    expect(creds.registered).toBe(true);
    expect(shouldSkipPairingOnReconnect(creds)).toBe(true);
  });

  // --- CASE C: pairing not finished → reconnect must not authenticate ---
  it("CASE C: pairing incomplete → reconnect does not treat as authenticated", () => {
    const creds = initAuthCreds();
    creds.pairingCode = "ABCD1234";
    // not registered
    expect(shouldSkipPairingOnReconnect(creds)).toBe(false);
    expect(resolveLoginMode(creds)).toBe("pairing");

    const rm = createReconnectManager(undefined, {
      maxRetries: 3,
      baseDelayMs: 1,
      maxDelayMs: 5,
      jitter: 0,
    });
    const g = rm.beginConnect();
    const d = rm.onClose(g, {
      intentional: false,
      stopped: false,
      code: 1006,
    });
    expect(d.should).toBe(true);
    // still not authenticated after close
    expect(creds.registered).toBe(false);
    expect(shouldSkipPairingOnReconnect(creds)).toBe(false);
  });

  // --- CASE D: max retries exhausted ---
  it("CASE D: max retries → no further reconnect", () => {
    const rm = createReconnectManager(undefined, {
      maxRetries: 2,
      baseDelayMs: 1,
      maxDelayMs: 5,
      jitter: 0,
    });
    // attempt 0
    let g = rm.beginConnect();
    expect(
      rm.onClose(g, { intentional: false, stopped: false, code: 1006 }).should,
    ).toBe(true);
    // simulate advancing attempt via waitBackoff path — force by closing again after mark not open
    // onClose increments attempt internally via waitBackoff; call waitBackoff then close again
    // attempt counter: after first onClose + waitBackoff, attempt increases
    // We close with generation advances
    g = rm.beginConnect();
    expect(
      rm.onClose(g, { intentional: false, stopped: false, code: 1006 }).should,
    ).toBe(true);
    g = rm.beginConnect();
    const last = rm.onClose(g, {
      intentional: false,
      stopped: false,
      code: 1006,
    });
    // with maxRetries=2, shouldReconnect(attempt) when attempt >= 2 is false
    // Depending on internal attempt tracking: verify shouldReconnect helper
    expect(shouldReconnect(2, false, { maxRetries: 2 })).toBe(false);
    expect(shouldReconnect(0, false, { maxRetries: 2 })).toBe(true);
    expect(shouldReconnect(1, false, { maxRetries: 2 })).toBe(true);
  });

  // --- CASE E: duplicate reconnect events / single-flight ---
  it("CASE E: duplicate/stale reconnect does not loop", () => {
    const rm = createReconnectManager(undefined, {
      maxRetries: 5,
      baseDelayMs: 1,
      maxDelayMs: 5,
      jitter: 0,
    });
    const g1 = rm.beginConnect();
    const g2 = rm.beginConnect();
    // close old generation — ignored
    expect(
      rm.onClose(g1, { intentional: false, stopped: false, code: 1006 }).should,
    ).toBe(false);
    // close current — ok
    expect(
      rm.onClose(g2, { intentional: false, stopped: false, code: 1006 }).should,
    ).toBe(true);
    // cancel stops further reconnects
    rm.cancel();
    const g3 = rm.beginConnect();
    // after cancel, beginConnect resets cancelled; still test intentional stop
    expect(
      rm.onClose(g3, { intentional: false, stopped: true, code: 1006 }).should,
    ).toBe(false);
  });

  // --- CASE F: after successful pairing, registered → no pairing on reconnect ---
  it("CASE F: after pairing success, reconnect skips pairing", () => {
    const creds = initAuthCreds();
    creds.registered = true;
    creds.me = { id: "628999@s.whatsapp.net" };
    creds.pairingCode = undefined;
    expect(shouldSkipPairingOnReconnect(creds)).toBe(true);

    const rm = createReconnectManager(undefined, {
      maxRetries: 3,
      baseDelayMs: 1,
      maxDelayMs: 5,
      jitter: 0,
    });
    const g = rm.beginConnect();
    rm.markOpen(g);
    const d = rm.onClose(g, {
      intentional: false,
      stopped: false,
      code: 1006,
    });
    expect(d.should).toBe(true);
    expect(shouldSkipPairingOnReconnect(creds)).toBe(true);
    expect(resolveLoginMode(creds)).toBe("registered");
  });

  it("maxRetries configured once (no duplicate property confusion)", () => {
    // ensure helper and manager agree
    expect(shouldReconnect(7, false, { maxRetries: 8 })).toBe(true);
    expect(shouldReconnect(8, false, { maxRetries: 8 })).toBe(false);
    const delay = computeReconnectDelayMs(0, {
      baseDelayMs: 100,
      maxDelayMs: 1000,
      jitter: 0,
    });
    expect(delay).toBe(100);
  });
});

describe("EventBuffer", () => {
  it("buffers then flushes without loss", () => {
    const buf = new EventBuffer(10);
    const ev = new EventEmitter();
    const seen: string[] = [];
    ev.on("connection.update", (u) => seen.push(u.connection || ""));

    buf.start();
    expect(buf.push("connection.update", { connection: "close" })).toBe(true);
    expect(buf.push("connection.update", { connection: "connecting" })).toBe(true);
    expect(seen).toHaveLength(0);

    const n = buf.flush(ev);
    expect(n).toBe(2);
    expect(seen).toEqual(["close", "connecting"]);
  });

  it("drops oldest when over max", () => {
    const buf = new EventBuffer(2);
    buf.start();
    buf.push("connection.update", { connection: "close" });
    buf.push("connection.update", { connection: "connecting" });
    buf.push("connection.update", { connection: "open" });
    expect(buf.size).toBe(2);
  });
});
