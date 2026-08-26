import { describe, it, expect } from "vitest";
import {
  buildTextMessageNode,
  parseMessageNode,
} from "../src/Protocol/message-node.js";
import {
  encodeTextMessagePayload,
  decodeMessagePayload,
} from "../src/WAProto/message-codec.js";

describe("message wire", () => {
  it("KXM1 text codec roundtrip", () => {
    const buf = encodeTextMessagePayload("Hello KaguneX");
    const decoded = decodeMessagePayload(buf);
    expect(decoded.type).toBe("text");
    expect(decoded.text).toBe("Hello KaguneX");
  });

  it("message node encode/parse", () => {
    const { encoded, id } = buildTextMessageNode({
      to: "6281234567890@s.whatsapp.net",
      text: "ping",
    });
    // parse expects from/to on node — builder sets `to`
    const msg = parseMessageNode(encoded);
    expect(msg).toBeDefined();
    expect(msg!.key.id).toBe(id);
    expect(msg!.message?.conversation).toBe("ping");
  });
});
