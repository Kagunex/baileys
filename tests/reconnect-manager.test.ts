import { describe, it, expect } from "vitest";
import { createReconnectManager } from "../src/Socket/reconnect-manager.js";
import { EventBuffer } from "../src/Events/buffer.js";
import { EventEmitter } from "../src/Events/emitter.js";
import { DisconnectStatus } from "../src/Socket/login-lifecycle.js";

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
    // live emit during buffer should not go to listener
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
