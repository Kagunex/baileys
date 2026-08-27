import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { makeCacheableSignalKeyStore } from "../src/Auth/key-store.js";
import { establishSessions, serializeSession } from "../src/Signal/session.js";
import { generateX25519KeyPair } from "../src/Utils/crypto.js";
import {
  saveSession,
  loadSession,
  deleteSession,
} from "../src/Signal/session-store.js";
import {
  generateAndStorePreKeys,
  rotateSignedPreKey,
  shouldRotateSignedPreKey,
  verifySignedPreKeyLocal,
  takePreKey,
} from "../src/Signal/prekeys.js";
import { initAuthCreds } from "../src/Auth/credentials.js";
import { loadSessionHealthy, validateSessionBytes } from "../src/Signal/recovery.js";
import { migrateSignalStore, SIGNAL_STORE_VERSION } from "../src/Signal/migration.js";
import {
  getDeviceIdentity,
  upsertRemoteIdentity,
} from "../src/Signal/identity.js";

function kp() {
  const k = generateX25519KeyPair();
  return { public: new Uint8Array(k.public), private: new Uint8Array(k.private) };
}

describe("Signal + Session Store", () => {
  let dir: string;

  beforeEach(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), "kx-signal-"));
  });

  afterEach(async () => {
    await fs.rm(dir, { recursive: true, force: true });
  });

  it("persists and loads session", async () => {
    const keys = makeCacheableSignalKeyStore(dir);
    const { alice } = establishSessions({
      remoteAddress: "bob",
      aliceIdentity: kp(),
      bobIdentity: kp(),
      bobSignedPreKey: kp(),
    });
    await saveSession(keys, alice, 0);
    const loaded = await loadSession(keys, "bob", 0);
    expect(loaded).toBeDefined();
    expect(loaded!.remoteAddress).toBe("bob");
    expect(loaded!.rootKey.equals(alice.rootKey)).toBe(true);
  });

  it("pre-key generate + take (consume)", async () => {
    const keys = makeCacheableSignalKeyStore(dir);
    let creds = initAuthCreds();
    const { creds: next, generated } = await generateAndStorePreKeys(creds, keys, 5);
    expect(generated).toHaveLength(5);
    const id = generated[0];
    const taken = await takePreKey(keys, id);
    expect(taken).toBeDefined();
    const again = await takePreKey(keys, id);
    expect(again).toBeUndefined();
    expect(next.nextPreKeyId).toBe(creds.nextPreKeyId + 5);
  });

  it("signed pre-key rotation + local verify", () => {
    const creds = initAuthCreds();
    // force old timestamp
    creds.signedPreKey.timestamp = 1;
    expect(shouldRotateSignedPreKey(creds)).toBe(true);
    const { creds: rotated } = rotateSignedPreKey(creds);
    expect(rotated.signedPreKey.keyId).toBeGreaterThan(creds.signedPreKey.keyId);
    expect(
      verifySignedPreKeyLocal(rotated.signedIdentityKey, rotated.signedPreKey),
    ).toBe(true);
  });

  it("device identity upsert", () => {
    let creds = initAuthCreds();
    creds.me = { id: "628123:1@s.whatsapp.net" };
    const id = getDeviceIdentity(creds);
    expect(id.address?.deviceId).toBe(1);
    creds = upsertRemoteIdentity(creds, { name: "628999", deviceId: 0 }, new Uint8Array(32));
    expect(creds.signalIdentities?.length).toBe(1);
  });

  it("corrupt session recovery", async () => {
    const keys = makeCacheableSignalKeyStore(dir);
    await keys.set({
      session: { "bob.0": new Uint8Array(Buffer.from("not-valid-json")) },
    });
    const health = await loadSessionHealthy(keys, "bob", 0);
    expect(health.ok).toBe(false);
    expect(health.recovered).toBe(true);
    // purged
    const again = await loadSession(keys, "bob", 0);
    expect(again).toBeUndefined();
  });

  it("validateSessionBytes", () => {
    const { alice } = establishSessions({
      remoteAddress: "bob",
      aliceIdentity: kp(),
      bobIdentity: kp(),
      bobSignedPreKey: kp(),
    });
    expect(validateSessionBytes(serializeSession(alice))).toBe(true);
    expect(validateSessionBytes(new Uint8Array([1, 2, 3]))).toBe(false);
  });

  it("migrate store meta", async () => {
    const meta = await migrateSignalStore(dir);
    expect(meta.version).toBe(SIGNAL_STORE_VERSION);
  });

  it("transaction-safe concurrent sets", async () => {
    const keys = makeCacheableSignalKeyStore(dir);
    await Promise.all([
      keys.set({ "pre-key": { "1": kp() } }),
      keys.set({ "pre-key": { "2": kp() } }),
      keys.set({ "pre-key": { "3": kp() } }),
    ]);
    const got = await keys.get("pre-key", ["1", "2", "3"]);
    expect(Object.keys(got).length).toBe(3);
  });
});
