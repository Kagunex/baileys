import { describe, it, expect } from "vitest";
import { createInitialState } from "../src/Socket/state.js";
import { initAuthCreds } from "../src/Auth/credentials.js";
import { makeInMemorySignalKeyStore } from "../src/Signal/store.js";
import { EventEmitter } from "../src/Events/emitter.js";
import { emitConnectionUpdate } from "../src/Socket/events.js";

describe("socket state", () => {
  it("initial state is connecting", () => {
    const state = createInitialState({
      creds: initAuthCreds(),
      keys: makeInMemorySignalKeyStore(),
    });
    expect(state.connection).toBe("connecting");
    expect(state.auth?.creds.registered).toBe(false);
  });

  it("emitConnectionUpdate delivers to listeners", () => {
    const ev = new EventEmitter();
    let got: string | undefined;
    ev.on("connection.update", (u) => {
      got = u.connection;
    });
    emitConnectionUpdate(ev, { connection: "close" });
    expect(got).toBe("close");
  });
});
