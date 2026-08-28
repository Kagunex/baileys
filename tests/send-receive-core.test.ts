import { describe, it, expect } from "vitest";
import { generateWAMessage } from "../src/Messages/generate.js";
import {
  serializeMessage,
  deserializeMessage,
  serializeMessageContent,
  deserializeMessageContent,
} from "../src/Messages/serialize.js";
import { createMessageEngine } from "../src/Messages/engine.js";
import { EventEmitter } from "../src/Events/emitter.js";
import { encodeWaMessageContent } from "../src/WAProto/message.js";
import { encodeBinaryNode } from "../src/WABinary/encode.js";
import { buildChatstateNode, buildPresenceNode } from "../src/Protocol/chatstate.js";
import { decodeBinaryNode } from "../src/WABinary/decode.js";
import { MessageDeduper } from "../src/Messages/dedup.js";
import { withRetry } from "../src/Messages/retry.js";

describe("Send & Receive core", () => {
  it("text serialization roundtrip", () => {
    const msg = generateWAMessage("628@s.whatsapp.net", { text: "hello" });
    const ser = serializeMessage(msg);
    expect(ser.messageProto).toBeDefined();
    const back = deserializeMessage(ser);
    expect(back.message?.conversation).toBe("hello");
    expect(back.key.id).toBe(msg.key.id);
  });

  it("quoted reply context", () => {
    const original = generateWAMessage("628@s.whatsapp.net", { text: "orig" });
    const reply = generateWAMessage("628@s.whatsapp.net", {
      text: "reply",
      quoted: original,
    });
    const content = reply.message!;
    const bin = serializeMessageContent(content);
    const decoded = deserializeMessageContent(bin);
    expect(decoded.extendedTextMessage?.text).toBe("reply");
    expect(decoded.extendedTextMessage?.contextInfo?.stanzaId).toBe(
      original.key.id,
    );
  });

  it("reaction content", () => {
    const key = { remoteJid: "628@s.whatsapp.net", id: "MID", fromMe: false };
    const msg = generateWAMessage("628@s.whatsapp.net", {
      react: { text: "🔥", key },
    });
    const decoded = deserializeMessageContent(
      serializeMessageContent(msg.message!),
    );
    expect(decoded.reactionMessage?.text).toBe("🔥");
    expect(decoded.reactionMessage?.key?.id).toBe("MID");
  });

  it("edit and revoke via engine", async () => {
    const ev = new EventEmitter();
    const engine = createMessageEngine({ ev, waitForAck: false });
    const key = { remoteJid: "628@s.whatsapp.net", id: "X1", fromMe: true };
    const rev = await engine.sendRevoke(key);
    expect(rev.message?.protocolMessage?.type).toBe(0);
    const edit = await engine.sendEdit(key, "edited");
    expect(edit.message?.protocolMessage?.type).toBe(14);
    expect(edit.message?.extendedTextMessage?.text).toBe("edited");
    engine.dispose();
  });

  it("typing chatstate + presence nodes", () => {
    const c = buildChatstateNode("628@s.whatsapp.net", "composing");
    expect(decodeBinaryNode(c.encoded).tag).toBe("chatstate");
    const p = buildPresenceNode("available");
    expect(decodeBinaryNode(p.encoded).attrs.type).toBe("available");
  });

  it("duplicate prevention", () => {
    const d = new MessageDeduper();
    expect(d.checkAndAdd("j", "id1", false)).toBe(true);
    expect(d.checkAndAdd("j", "id1", false)).toBe(false);
  });

  it("retry succeeds on second attempt", async () => {
    let n = 0;
    const result = await withRetry(async () => {
      n++;
      if (n < 2) throw new Error("fail");
      return "ok";
    }, { maxAttempts: 3, baseDelayMs: 1 });
    expect(result).toBe("ok");
    expect(n).toBe(2);
  });

  it("incoming text → messages.upsert once", () => {
    const ev = new EventEmitter();
    const engine = createMessageEngine({ ev, waitForAck: false });
    let count = 0;
    let text = "";
    ev.on("messages.upsert", (u) => {
      count++;
      text = u.messages[0]?.message?.conversation || "";
    });
    const body = encodeWaMessageContent({ conversation: "inbox" });
    const node = encodeBinaryNode({
      tag: "message",
      attrs: { from: "628@s.whatsapp.net", id: "IN1", type: "text" },
      content: body,
    });
    engine.handlePayload(node);
    engine.handlePayload(node);
    expect(count).toBe(1);
    expect(text).toBe("inbox");
    engine.dispose();
  });
});
