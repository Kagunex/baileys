import { describe, it, expect, vi } from "vitest";
import {
  buildPairingCodeIq,
  parsePairingPayload,
  isPairingResponse,
  pairingRetryDelayMs,
  normalizePairingCode,
} from "../src/Protocol/pairing.js";
import { encodeBinaryNode, decodeBinaryNode } from "../src/WABinary/index.js";
import { createPairingController } from "../src/Socket/pairing-controller.js";
import { NoiseSession } from "../src/Noise/session.js";
import { generateX25519KeyPair, noiseSplit, createNoiseInitiator, createNoiseResponder, noiseWriteMessage1, noiseResponderReadMessage1, noiseResponderWriteMessageA, noiseReadMessageA, noiseWriteMessageB, noiseResponderReadMessageB } from "../src/Noise/handshake.js";
import { NOISE_MODE } from "../src/Defaults/constants.js";

function makeSessions() {
  const prologue = Buffer.from(NOISE_MODE, "binary");
  const a = generateX25519KeyPair();
  const b = generateX25519KeyPair();
  const init = createNoiseInitiator(a, prologue);
  const resp = createNoiseResponder(b, prologue);
  const m1 = noiseWriteMessage1(init);
  noiseResponderReadMessage1(resp, m1);
  const mA = noiseResponderWriteMessageA(resp, Buffer.alloc(0));
  noiseReadMessageA(init, mA);
  const mB = noiseWriteMessageB(init, Buffer.alloc(0));
  noiseResponderReadMessageB(resp, mB);
  return {
    client: new NoiseSession(noiseSplit(init)),
    server: new NoiseSession(noiseSplit(resp)),
  };
}

describe("Pairing IQ stable", () => {
  it("builds iq with key material", () => {
    const pub = Buffer.alloc(32, 3);
    const req = buildPairingCodeIq("6281234567890", {
      keys: {
        companionEphemeralPub: pub,
        companionAuthPub: pub,
        platformDisplay: "Chrome (Linux)",
      },
      attempt: 1,
    });
    expect(req.stage).toBe("companion_hello");
    expect(req.attempt).toBe(1);
    const node = decodeBinaryNode(req.encoded);
    expect(node.attrs.xmlns).toBe("md");
    const reg = (node.content as any[])[0];
    expect(reg.tag).toBe("link_code_companion_reg");
  });

  it("normalizes codes", () => {
    expect(normalizePairingCode("abcd1234")).toBe("ABCD-1234");
    expect(normalizePairingCode("AB")).toBeUndefined();
  });

  it("retry delays increase", () => {
    expect(pairingRetryDelayMs(1)).toBe(500);
    expect(pairingRetryDelayMs(2)).toBe(1000);
    expect(pairingRetryDelayMs(5)).toBe(8000);
  });

  it("parse result + error + pair-success", () => {
    const resultNode = {
      tag: "iq",
      attrs: { type: "result", id: "ID1" },
      content: [
        { tag: "link_code_companion_reg", attrs: { link_code: "WXYZ9876" } },
      ],
    };
    const p = parsePairingPayload(encodeBinaryNode(resultNode));
    expect(p.code).toBe("WXYZ-9876");
    expect(p.iqId).toBe("ID1");

    const errNode = {
      tag: "iq",
      attrs: { type: "error", id: "ID2" },
      content: [{ tag: "error", attrs: { code: "400", text: "bad" } }],
    };
    const e = parsePairingPayload(encodeBinaryNode(errNode));
    expect(e.errorCode).toBe("400");

    const ok = {
      tag: "pair-success",
      attrs: {},
      content: [{ tag: "device", attrs: { jid: "628@s.whatsapp.net" } }],
    };
    expect(parsePairingPayload(encodeBinaryNode(ok)).pairSuccess).toBe(true);
  });

  it("controller resolves when response arrives", async () => {
    const { client } = makeSessions();
    const pairing = createPairingController();
    const sent: Buffer[] = [];

    const p = pairing.requestCode("6281234567890", {
      timeoutMs: 5000,
      maxAttempts: 1,
      session: client,
      send: (pt) => sent.push(pt),
    });

    // wait microtask so IQ is built
    await new Promise((r) => setTimeout(r, 20));
    expect(sent.length).toBeGreaterThanOrEqual(1);

    const reqNode = decodeBinaryNode(sent[0]);
    const id = reqNode.attrs.id;
    const response = encodeBinaryNode({
      tag: "iq",
      attrs: { type: "result", id },
      content: [
        { tag: "link_code_companion_reg", attrs: { link_code: "TESTCODE" } },
      ],
    });
    pairing.onPayload(response);

    const code = await p;
    expect(code).toBe("TEST-CODE");
  });

  it("isPairingResponse matches id", () => {
    const buf = encodeBinaryNode({
      tag: "iq",
      attrs: { type: "result", id: "XYZ" },
      content: [],
    });
    expect(isPairingResponse(buf, "XYZ")).toBe(true);
    expect(isPairingResponse(buf, "OTHER")).toBe(false);
  });

  it("rejects invalid phone numbers", async () => {
    const { normalizePairingPhone } = await import("../src/Web/pairing.js");
    expect(() => normalizePairingPhone("123")).toThrow(/Invalid phone/);
    expect(() => normalizePairingPhone("abc")).toThrow(/Invalid phone/);
    expect(normalizePairingPhone("+62 812-3456-7890")).toBe("6281234567890");
  });

  it("builds IQ with should_show_push_notification for native WA notification", () => {
    const req = buildPairingCodeIq("6281234567890");
    const node = decodeBinaryNode(req.encoded);
    const reg = (node.content as any[])[0];
    expect(reg.attrs.should_show_push_notification).toBe("true");
    expect(reg.attrs.stage).toBe("companion_hello");
    expect(reg.attrs.jid).toBe("6281234567890@s.whatsapp.net");
  });

  it("receiving code is not the same as authentication success", () => {
    const withCode = parsePairingPayload(
      encodeBinaryNode({
        tag: "iq",
        attrs: { type: "result", id: "C1" },
        content: [
          { tag: "link_code_companion_reg", attrs: { link_code: "ABCD1234" } },
        ],
      }),
    );
    expect(withCode.code).toBe("ABCD-1234");
    expect(withCode.pairSuccess).toBeUndefined();

    const withSuccess = parsePairingPayload(
      encodeBinaryNode({
        tag: "pair-success",
        attrs: {},
        content: [{ tag: "device", attrs: { jid: "628@s.whatsapp.net" } }],
      }),
    );
    expect(withSuccess.pairSuccess).toBe(true);
    expect(withSuccess.me?.id).toBe("628@s.whatsapp.net");
  });
});
