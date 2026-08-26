import { describe, it, expect, vi } from "vitest";
import { createMessageEngine } from "../src/Messages/engine.js";
import { EventEmitter } from "../src/Events/emitter.js";
import { encodeWaMessageContent, decodeWaMessageContent } from "../src/WAProto/message.js";
import { buildMessageNode, parseMessageNode } from "../src/Protocol/message-node.js";
import {
  parseReceiptNode,
  buildReceiptNode,
  AckWaiter,
} from "../src/Messages/ack.js";
import { MessageDeduper } from "../src/Messages/dedup.js";
import { encodeBinaryNode } from "../src/WABinary/encode.js";
import { generateWAMessage } from "../src/Messages/generate.js";

describe("Message Engine", () => {
  it("protobuf conversation roundtrip", () => {
    const buf = encodeWaMessageContent({ conversation: "hello engine" });
    expect(decodeWaMessageContent(buf).conversation).toBe("hello engine");
  });

  it("quoted message generates contextInfo", () => {
    const quoted = generateWAMessage("1@s.whatsapp.net", { text: "original" });
    const msg = generateWAMessage("1@s.whatsapp.net", {
      text: "reply",
      quoted,
    });
    expect(msg.message?.extendedTextMessage?.text).toBe("reply");
    expect(msg.message?.extendedTextMessage?.contextInfo?.stanzaId).toBe(
      quoted.key.id,
    );
  });

  it("dedup skips second upsert", () => {
    const ev = new EventEmitter();
    let count = 0;
    ev.on("messages.upsert", () => {
      count++;
    });
    const engine = createMessageEngine({ ev, waitForAck: false });
    const { encoded } = buildMessageNode({
      to: "1@s.whatsapp.net",
      content: { conversation: "x" },
      id: "SAMEID",
    });
    // parse path via handle — inject from attr for remote
    const node = encodeBinaryNode({
      tag: "message",
      attrs: { from: "2@s.whatsapp.net", id: "SAMEID", type: "text" },
      content: encodeWaMessageContent({ conversation: "x" }),
    });
    engine.handlePayload(node);
    engine.handlePayload(node);
    expect(count).toBe(1);
    engine.dispose();
  });

  it("ACK waiter resolves", async () => {
    const waiter = new AckWaiter();
    const p = waiter.wait("MID1", 2000);
    waiter.handle([
      { id: "MID1", type: "server", remoteJid: "1@s.whatsapp.net" },
    ]);
    const r = await p;
    expect(r.id).toBe("MID1");
  });

  it("parse receipt node", () => {
    const buf = encodeBinaryNode({
      tag: "receipt",
      attrs: { id: "ABC", from: "1@s.whatsapp.net", type: "delivery", t: "1700000000" },
    });
    const list = parseReceiptNode(buf);
    expect(list[0].id).toBe("ABC");
    expect(list[0].type).toBe("delivery");
  });

  it("reaction content via generate", () => {
    const key = { remoteJid: "1@s.whatsapp.net", id: "X", fromMe: false };
    const msg = generateWAMessage("1@s.whatsapp.net", {
      react: { text: "👍", key },
    });
    expect(msg.message?.reactionMessage?.text).toBe("👍");
  });

  it("local send without net emits upsert", async () => {
    const ev = new EventEmitter();
    let got = "";
    ev.on("messages.upsert", (u) => {
      got = u.messages[0]?.message?.conversation || "";
    });
    const engine = createMessageEngine({ ev, waitForAck: false });
    await engine.sendMessage("1@s.whatsapp.net", { text: "local-only" });
    expect(got).toBe("local-only");
    engine.dispose();
  });

  it("revoke builds protocolMessage type 0", async () => {
    const ev = new EventEmitter();
    const engine = createMessageEngine({ ev, waitForAck: false });
    const msg = await engine.sendRevoke({
      remoteJid: "1@s.whatsapp.net",
      id: "TODEL",
      fromMe: true,
    });
    expect(msg.message?.protocolMessage?.type).toBe(0);
    engine.dispose();
  });
});
