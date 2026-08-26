import { describe, it, expect } from "vitest";
import { generateWAMessage, normalizeMessage } from "../src/Messages/index.js";
import { getMessageType, extractMessageText } from "../src/Messages/helpers.js";

describe("messages", () => {
  it("generates text message", () => {
    const msg = generateWAMessage("1@s.whatsapp.net", { text: "Hello KaguneX" });
    expect(msg.key.fromMe).toBe(true);
    expect(msg.message?.conversation).toBe("Hello KaguneX");
    expect(getMessageType(msg)).toBe("conversation");
    expect(extractMessageText(msg)).toBe("Hello KaguneX");
  });

  it("normalizes message", () => {
    const msg = normalizeMessage({
      key: { remoteJid: "1@s.whatsapp.net", fromMe: true, id: "x" },
      message: { conversation: "hi" },
    });
    expect(msg.messageTimestamp).toBeTypeOf("number");
  });
});
