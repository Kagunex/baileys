import { describe, it, expect } from "vitest";
import {
  buildGroupCreateIq,
  buildOnWhatsAppIq,
  buildPresenceIq,
} from "../src/Protocol/iq.js";
import { decodeBinaryNode } from "../src/WABinary/index.js";

describe("IQ builders", () => {
  it("group create iq", () => {
    const { encoded } = buildGroupCreateIq("Test", ["1@s.whatsapp.net"]);
    const node = decodeBinaryNode(encoded);
    expect(node.tag).toBe("iq");
    expect(node.attrs.xmlns).toBe("w:g2");
  });

  it("onWhatsApp usync iq", () => {
    const { encoded } = buildOnWhatsAppIq(["1@s.whatsapp.net"]);
    expect(decodeBinaryNode(encoded).tag).toBe("iq");
  });

  it("presence", () => {
    const { encoded } = buildPresenceIq("available");
    expect(decodeBinaryNode(encoded).tag).toBe("presence");
  });
});
