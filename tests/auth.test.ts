import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { useMultiFileAuthState, initAuthCreds } from "../src/Auth/index.js";
import { serializeCreds, deserializeCreds } from "../src/Auth/credentials.js";

describe("auth", () => {
  let dir: string;

  beforeAll(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), "kagunex-auth-"));
  });

  afterAll(async () => {
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
