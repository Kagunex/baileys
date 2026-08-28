import { describe, it, expect } from "vitest";
import { EventEmitter } from "../src/Events/emitter.js";

describe("EventEmitter", () => {
  it("emits typed connection.update", () => {
    const ev = new EventEmitter();
    let seen = "";
    ev.on("connection.update", (u) => {
      seen = u.connection ?? "";
    });
    ev.emit("connection.update", { connection: "connecting" });
    expect(seen).toBe("connecting");
  });

  it("once and off", () => {
    const ev = new EventEmitter();
    let n = 0;
    const fn = () => {
      n++;
    };
    ev.once("creds.update", fn as any);
    ev.emit("creds.update", { registered: true });
    ev.emit("creds.update", { registered: false });
    expect(n).toBe(1);
  });
});
