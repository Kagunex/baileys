import { describe, it, expect } from "vitest";
import {
  computeReconnectDelayMs,
  shouldReconnect,
  DEFAULT_RECONNECT,
} from "../src/Socket/reconnect.js";

describe("reconnect backoff", () => {
  it("respects max delay without jitter", () => {
    const d = computeReconnectDelayMs(20, {
      baseDelayMs: 1000,
      maxDelayMs: 5000,
      jitter: 0,
    });
    expect(d).toBe(5000);
  });

  it("full jitter is within [0, exp]", () => {
    for (let i = 0; i < 20; i++) {
      const d = computeReconnectDelayMs(3, {
        baseDelayMs: 1000,
        maxDelayMs: 30_000,
        jitter: 1,
      });
      expect(d).toBeGreaterThanOrEqual(0);
      expect(d).toBeLessThanOrEqual(8000);
    }
  });

  it("shouldReconnect gates intentional close", () => {
    expect(shouldReconnect(0, true)).toBe(false);
    expect(shouldReconnect(0, false)).toBe(true);
    expect(shouldReconnect(DEFAULT_RECONNECT.maxRetries, false)).toBe(false);
  });
});
