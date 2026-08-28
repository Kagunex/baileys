import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { useMultiFileAuthState, initAuthCreds } from "../src/Auth/index.js";
import { serializeCreds, deserializeCreds } from "../src/Auth/credentials.js";
import {
  applyPairSuccess,
  shouldSkipPairingOnReconnect,
  resolveLoginMode,
} from "../src/Socket/login-lifecycle.js";
import { applyCredsUpdate } from "../src/Auth/auth-utils.js";

describe("auth", () => {
  let dir: string;

  beforeEach(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), "kagunex-auth-"));
  });

  afterEach(async () => {
    await fs.rm(dir, { recursive: true, force: true });
  });

  it("initAuthCreds has required fields", () => {
    const c = initAuthCreds();
    expect(c.noiseKey.public.length).toBe(32);
    expect(c.registered).toBe(false);
    expect(typeof c.registrationId).toBe("number");
  });

  it("serialize/deserialize roundtrip", () => {
    const c = initAuthCreds();
    const back = deserializeCreds(serializeCreds(c));
    expect(Buffer.from(back.noiseKey.public).equals(Buffer.from(c.noiseKey.public))).toBe(true);
    expect(back.registrationId).toBe(c.registrationId);
  });

  it("useMultiFileAuthState persists", async () => {
    const { state, saveCreds } = await useMultiFileAuthState(dir);
    state.creds.registered = true;
    await saveCreds();
    const again = await useMultiFileAuthState(dir);
    expect(again.state.creds.registered).toBe(true);
  });
});

describe("session persistence across restart", () => {
  let dir: string;

  beforeEach(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), "kagunex-session-"));
  });

  afterEach(async () => {
    await fs.rm(dir, { recursive: true, force: true });
  });

  it("FIRST process: pair → save → SECOND process: load without re-pairing", async () => {
    // --- process 1: simulate successful pairing ---
    const first = await useMultiFileAuthState(dir);
    const applied = applyPairSuccess(
      {
        pairSuccess: true,
        me: { id: "6285555444433:1@s.whatsapp.net", name: "Device" },
      },
      first.state.creds,
    );
    expect(applied).toBeDefined();
    applyCredsUpdate(first.state.creds, applied!.credsPatch);
    await first.saveCreds();

    expect(first.state.creds.registered).toBe(true);
    expect(first.state.creds.me?.id).toContain("6285555444433");
    expect(first.state.creds.pairingCode).toBeUndefined();

    // snapshot key material to detect unwanted regeneration
    const noisePub = Buffer.from(first.state.creds.noiseKey.public);

    // --- process 2: load existing credentials ---
    const second = await useMultiFileAuthState(dir);
    expect(second.state.creds.registered).toBe(true);
    expect(second.state.creds.me?.id).toContain("6285555444433");
    expect(resolveLoginMode(second.state.creds)).toBe("registered");
    expect(shouldSkipPairingOnReconnect(second.state.creds)).toBe(true);
    // must not regenerate noise keys
    expect(
      Buffer.from(second.state.creds.noiseKey.public).equals(noisePub),
    ).toBe(true);
  });

  it("missing session starts unregistered", async () => {
    const emptyDir = await fs.mkdtemp(path.join(os.tmpdir(), "kagunex-empty-"));
    try {
      const { state } = await useMultiFileAuthState(emptyDir);
      expect(state.creds.registered).toBe(false);
      expect(shouldSkipPairingOnReconnect(state.creds)).toBe(false);
      expect(resolveLoginMode(state.creds)).toBe("qr");
    } finally {
      await fs.rm(emptyDir, { recursive: true, force: true });
    }
  });

  it("partial credentials (registered without me) still load but skip is false", async () => {
    const { state, saveCreds } = await useMultiFileAuthState(dir);
    state.creds.registered = true;
    // me intentionally missing
    state.creds.me = undefined;
    await saveCreds();

    const again = await useMultiFileAuthState(dir);
    expect(again.state.creds.registered).toBe(true);
    // resolveLoginMode requires me.id for "registered"
    expect(resolveLoginMode(again.state.creds)).not.toBe("registered");
    expect(shouldSkipPairingOnReconnect(again.state.creds)).toBe(false);
  });

  it("corrupted creds.json falls back to fresh creds", async () => {
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, "creds.json"), "{not-json", "utf-8");
    const { state } = await useMultiFileAuthState(dir);
    expect(state.creds.registered).toBe(false);
    expect(state.creds.noiseKey.public.length).toBe(32);
  });

  it("pairingCode alone is persisted but does not skip pairing on restart", async () => {
    const { state, saveCreds } = await useMultiFileAuthState(dir);
    state.creds.pairingCode = "TEMPCODE1";
    await saveCreds();

    const again = await useMultiFileAuthState(dir);
    expect(again.state.creds.pairingCode).toBe("TEMPCODE1");
    expect(again.state.creds.registered).toBe(false);
    expect(shouldSkipPairingOnReconnect(again.state.creds)).toBe(false);
  });
});
