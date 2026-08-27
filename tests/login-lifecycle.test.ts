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

  it("applyPairSuccess patches creds", () => {
    const applied = applyPairSuccess({
      pairSuccess: true,
      me: { id: "628123@s.whatsapp.net", name: "Test" },
    });
    expect(applied?.credsPatch.registered).toBe(true);
    expect(applied?.credsPatch.me?.id).toContain("628");
    expect(applied?.connectionUpdate.connection).toBe("open");
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
