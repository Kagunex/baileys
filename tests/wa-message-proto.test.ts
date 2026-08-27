import { describe, it, expect } from "vitest";
import {
  encodeWaMessageContent,
  decodeWaMessageContent,
} from "../src/WAProto/message.js";
import { buildMessageNode, parseMessageNode } from "../src/Protocol/message-node.js";

describe("WA Message protobuf", () => {
  it("conversation roundtrip", () => {
    const buf = encodeWaMessageContent({ conversation: "Hello KaguneX" });
    const back = decodeWaMessageContent(buf);
    expect(back.conversation).toBe("Hello KaguneX");
  });

  it("extended text + mention", () => {
    const buf = encodeWaMessageContent({
      extendedTextMessage: {
        text: "hi @user",
        contextInfo: { mentionedJid: ["1@s.whatsapp.net"], stanzaId: "ABC" },
      },
    });
    const back = decodeWaMessageContent(buf);
    expect(back.extendedTextMessage?.text).toBe("hi @user");
    expect(back.extendedTextMessage?.contextInfo?.mentionedJid?.[0]).toBe(
      "1@s.whatsapp.net",
    );
  });

  it("message node carries protobuf body", () => {
    const { encoded, id } = buildMessageNode({
      to: "628@s.whatsapp.net",
      content: { conversation: "proto-ping" },
    });
    const msg = parseMessageNode(encoded);
    expect(msg?.key.id).toBe(id);
    expect(msg?.message?.conversation).toBe("proto-ping");
  });
});
