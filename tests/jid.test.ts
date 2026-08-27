import { describe, it, expect } from "vitest";
import {
  jidEncode,
  jidDecode,
  isJidUser,
  isJidGroup,
  normalizeJid,
  generateMessageID,
} from "../src/Utils/generics.js";

describe("JID helpers", () => {
  it("encodes and decodes user jid", () => {
    const jid = jidEncode("1234567890", "s.whatsapp.net");
    expect(jid).toBe("1234567890@s.whatsapp.net");
    const d = jidDecode(jid);
    expect(d?.user).toBe("1234567890");
    expect(d?.server).toBe("s.whatsapp.net");
  });

  it("handles device suffix", () => {
    const jid = jidEncode("123", "s.whatsapp.net", 2);
    expect(jid).toBe("123:2@s.whatsapp.net");
    expect(jidDecode(jid)?.device).toBe(2);
  });

  it("classifies jids", () => {
    expect(isJidUser("1@s.whatsapp.net")).toBe(true);
    expect(isJidGroup("1@g.us")).toBe(true);
    expect(normalizeJid("1@c.us")).toBe("1@s.whatsapp.net");
  });

  it("generates message ids", () => {
    const id = generateMessageID();
    expect(id.startsWith("3EB0")).toBe(true);
    expect(id.length).toBeGreaterThan(8);
  });
});
