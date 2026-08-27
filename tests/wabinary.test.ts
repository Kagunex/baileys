import { describe, it, expect } from "vitest";
import {
  encodeBinaryNode,
  decodeBinaryNode,
  getBinaryNodeAttr,
  encodeFrame,
  decodeFrame,
} from "../src/WABinary/index.js";
import type { BinaryNode } from "../src/WABinary/types.js";

describe("WABinary", () => {
  it("roundtrips a simple iq node", () => {
    const node: BinaryNode = {
      tag: "iq",
      attrs: { type: "get", id: "abc1", xmlns: "w:p" },
    };
    const encoded = encodeBinaryNode(node);
    expect(Buffer.isBuffer(encoded)).toBe(true);
    expect(encoded.length).toBeGreaterThan(0);
    const decoded = decodeBinaryNode(encoded);
    expect(decoded.tag).toBe("iq");
    expect(getBinaryNodeAttr(decoded, "type")).toBe("get");
    expect(getBinaryNodeAttr(decoded, "id")).toBe("abc1");
  });

  it("roundtrips nested content", () => {
    const node: BinaryNode = {
      tag: "iq",
      attrs: { type: "set", id: "n1" },
      content: [{ tag: "query", attrs: { xmlns: "jabber:iq:roster" } }],
    };
    const decoded = decodeBinaryNode(encodeBinaryNode(node));
    expect(decoded.tag).toBe("iq");
    expect(Array.isArray(decoded.content)).toBe(true);
    const child = (decoded.content as BinaryNode[])[0];
    expect(child.tag).toBe("query");
  });

  it("frame encode/decode", () => {
    const payload = Buffer.from("hello");
    const framed = encodeFrame(payload);
    expect(framed.length).toBe(3 + 5);
    const decoded = decodeFrame(framed);
    expect(decoded?.payload.toString()).toBe("hello");
    expect(decoded?.rest.length).toBe(0);
  });
});
