import { describe, it, expect } from "vitest";
import {
  resolveLoginMode,
  classifyStreamError,
  detectDisconnectFromPayload,
  applyPairSuccess,
  applyLoggedOut,
  shouldSkipPairingOnReconnect,
  buildQrFromServerRef,
  DisconnectStatus,
} from "../src/Socket/login-lifecycle.js";
import { initAuthCreds } from "../src/Auth/credentials.js";
import { encodeBinaryNode } from "../src/WABinary/encode.js";

describe("Login lifecycle (PRIORITY #1)", () => {
  it("resolveLoginMode", () => {
    const c = initAuthCreds();
    expect(resolveLoginMode(c)).toBe("qr");
    c.pairingCode = "ABCD1234";
    expect(resolveLoginMode(c)).toBe("pairing");
    c.registered = true;
    c.me = { id: "628@s.whatsapp.net" };
    expect(resolveLoginMode(c)).toBe("registered");
    expect(shouldSkipPairingOnReconnect(c)).toBe(true);
  });

  it("detects loggedOut from stream:error", () => {
    const buf = encodeBinaryNode({
      tag: "stream:error",
      attrs: { code: "401", text: "logged out" },
    });
    const d = detectDisconnectFromPayload(buf);
    expect(d?.isLoggedOut).toBe(true);
    expect(d?.statusCode).toBe(DisconnectStatus.loggedOut);
  });

  it("classifies connection replaced", () => {
    const d = classifyStreamError("440", "replaced");
    expect(d.statusCode).toBe(DisconnectStatus.connectionReplaced);
    expect(d.isLoggedOut).toBe(false);
  });

  it("applyPairSuccess patches creds (valid)", () => {
    const existing = initAuthCreds();
    const applied = applyPairSuccess(
      {
        pairSuccess: true,
        me: { id: "628123@s.whatsapp.net", name: "Test" },
      },
      existing,
    );
    expect(applied?.credsPatch.registered).toBe(true);
    expect(applied?.credsPatch.me?.id).toContain("628");
    expect(applied?.connectionUpdate.connection).toBe("open");
    expect(applied?.credsPatch.pairingCode).toBeUndefined();
  });

  it("malformed pair-success without me → not open", () => {
    expect(
      applyPairSuccess({ pairSuccess: true }, initAuthCreds()),
    ).toBeUndefined();
  });

  it("incomplete pair-success with empty/invalid jid → not open", () => {
    expect(
      applyPairSuccess(
        { pairSuccess: true, me: { id: "" } },
        initAuthCreds(),
      ),
    ).toBeUndefined();
    expect(
      applyPairSuccess(
        { pairSuccess: true, me: { id: "not-a-jid" } },
        initAuthCreds(),
      ),
    ).toBeUndefined();
  });

  it("pairSuccess=false even with me → not open", () => {
    expect(
      applyPairSuccess(
        { pairSuccess: false, me: { id: "628@s.whatsapp.net" } },
        initAuthCreds(),
      ),
    ).toBeUndefined();
    expect(
      applyPairSuccess(
        { me: { id: "628@s.whatsapp.net" } },
        initAuthCreds(),
      ),
    ).toBeUndefined();
  });

  it("pair-success rejected when local key material missing", () => {
    const broken = initAuthCreds();
    (broken as { noiseKey: { public: Uint8Array; private: Uint8Array } }).noiseKey = {
      public: new Uint8Array(0),
      private: new Uint8Array(0),
    };
    expect(
      applyPairSuccess(
        { pairSuccess: true, me: { id: "628@s.whatsapp.net" } },
        broken,
      ),
    ).toBeUndefined();
  });

  it("duplicate valid pair-success is idempotent (no corruption)", () => {
    const existing = initAuthCreds();
    existing.registered = true;
    existing.me = { id: "628@s.whatsapp.net", name: "A" };
    const applied = applyPairSuccess(
      { pairSuccess: true, me: { id: "628@s.whatsapp.net", name: "B" } },
      existing,
    );
    expect(applied?.credsPatch.registered).toBe(true);
    expect(applied?.credsPatch.me?.id).toBe("628@s.whatsapp.net");
    expect(applied?.credsPatch.pairingCode).toBeUndefined();
  });

  it("code-only state is not registered and does not skip pairing on reconnect", () => {
    const c = initAuthCreds();
    c.pairingCode = "ABCD1234";
    expect(resolveLoginMode(c)).toBe("pairing");
    expect(c.registered).toBe(false);
    expect(shouldSkipPairingOnReconnect(c)).toBe(false);
  });

  it("applyLoggedOut clears registration", () => {
    const c = initAuthCreds();
    c.registered = true;
    c.me = { id: "1@s.whatsapp.net" };
    const patch = applyLoggedOut(c);
    expect(patch.registered).toBe(false);
    expect(patch.me).toBeUndefined();
  });

  it("buildQrFromServerRef requires real ref", () => {
    const c = initAuthCreds();
    expect(buildQrFromServerRef("short", c)).toBeUndefined();
    const qr = buildQrFromServerRef("ABCDEFGH12345678", c);
    expect(qr).toBeDefined();
    expect(qr!.split(",").length).toBe(4);
  });
});
