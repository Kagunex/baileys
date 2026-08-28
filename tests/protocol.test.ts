import { describe, it, expect } from "vitest";
import {
  buildClientPayloadNode,
  encodeClientPayload,
} from "../src/Protocol/client-payload.js";
import {
  parseProtocolPayload,
  composeQrPayload,
} from "../src/Protocol/handler.js";
import { encodeBinaryNode, decodeBinaryNode } from "../src/WABinary/index.js";

describe("Protocol", () => {
  it("builds client payload node", () => {
    const node = buildClientPayloadNode({
      version: [2, 3000, 1],
      browser: ["KaguneX", "Chrome", "Linux"],
    });
    expect(node.tag).toBe("clientPayload");
    const encoded = encodeClientPayload({ version: [2, 3000, 1] });
    expect(encoded.length).toBeGreaterThan(10);
    const back = decodeBinaryNode(encoded);
    expect(back.tag).toBe("clientPayload");
  });

  it("composeQrPayload requires real ref", () => {
    const qr = composeQrPayload({
      ref: "ABCDEFGHrealref12",
      noisePub: Buffer.alloc(32, 1),
      identityPub: Buffer.alloc(32, 2),
      advSecretKey: Buffer.alloc(32, 3).toString("base64"),
    });
    expect(qr).toBeDefined();
    expect(qr!.split(",").length).toBe(4);

    const missing = composeQrPayload({
      ref: "short",
      noisePub: Buffer.alloc(32, 1),
      identityPub: Buffer.alloc(32, 2),
      advSecretKey: "x",
    });
    expect(missing).toBeUndefined();
  });

  it("parses pair-device ref from node", () => {
    const node = {
      tag: "iq",
      attrs: { type: "set", id: "1" },
      content: [
        {
          tag: "pair-device",
          attrs: { ref: "SERVERREFVALUE12345", id: "1" },
        },
      ],
    };
    const buf = encodeBinaryNode(node);
    const parsed = parseProtocolPayload(buf);
    expect(parsed.qrRefs.length).toBeGreaterThan(0);
    expect(parsed.qrRefs[0]).toContain("SERVERREF");
  });
});
