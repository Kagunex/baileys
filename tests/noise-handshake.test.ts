/**
 * Noise XX + WA HandshakeMessage unit tests.
 * No real network — pure crypto + protobuf wire format.
 */
import { describe, it, expect } from "vitest";
import {
  generateX25519KeyPair,
  createNoiseInitiator,
  createNoiseResponder,
  noiseWriteMessage1,
  noiseReadMessageA,
  noiseWriteMessageB,
  noiseResponderReadMessage1,
  noiseResponderWriteMessageA,
  noiseResponderReadMessageB,
  noiseSplit,
  NOISE_PROTOCOL_NAME,
} from "../src/Noise/handshake.js";
import {
  startWaNoiseHandshake,
  continueWaNoiseHandshake,
  parseServerHello,
} from "../src/Noise/wa-noise.js";
import { NOISE_WA_HEADER, NOISE_MODE } from "../src/Defaults/constants.js";
import { encodeFrame, decodeFrame } from "../src/WABinary/frame.js";
import { readFields, fieldBytes, encodeBytes } from "../src/WAProto/protobuf.js";

describe("Noise XX core", () => {
  it("TEST 1: Noise initialization produces valid state", () => {
    const kp = generateX25519KeyPair();
    expect(kp.public.length).toBe(32);
    expect(kp.private.length).toBe(32);
    const prologue = Buffer.from(NOISE_MODE, "binary");
    const state = createNoiseInitiator(kp, prologue);
    expect(state.role).toBe("initiator");
    expect(state.step).toBe(0);
    expect(state.h.length).toBe(32);
    expect(state.ck.length).toBe(32);
  });

  it("TEST 2: ClientHello serialization is HandshakeMessage protobuf", () => {
    const kp = generateX25519KeyPair();
    const { firstFrame, state } = startWaNoiseHandshake({ staticKey: kp });
    expect(state.step).toBe(1);
    // Must start with NOISE_WA_HEADER
    expect(firstFrame.subarray(0, 4).equals(NOISE_WA_HEADER)).toBe(true);
    // Then 3-byte length + body
    const withoutHeader = firstFrame.subarray(4);
    const framed = decodeFrame(withoutHeader);
    expect(framed).not.toBeNull();
    const fields = readFields(framed!.payload);
    // field 2 = clientHello
    const clientHello = fieldBytes(fields, 2);
    expect(clientHello).toBeTruthy();
    const chFields = readFields(clientHello!);
    const ephemeral = fieldBytes(chFields, 1);
    expect(ephemeral?.length).toBe(32);
  });

  it("TEST 3: ClientHello contains correct ephemeral field", () => {
    const kp = generateX25519KeyPair();
    const { firstFrame, state } = startWaNoiseHandshake({ staticKey: kp });
    const framed = decodeFrame(firstFrame.subarray(4))!;
    const clientHello = fieldBytes(readFields(framed.payload), 2)!;
    const ephemeral = fieldBytes(readFields(clientHello), 1)!;
    // Must match the ephemeral that was mixed into the Noise state
    expect(ephemeral.equals(state.ephemeral.public)).toBe(true);
  });

  it("TEST 4: Noise state transition after clientHello", () => {
    const kp = generateX25519KeyPair();
    const { state } = startWaNoiseHandshake({ staticKey: kp });
    expect(state.step).toBe(1);
    expect(state.ephemeral.public.length).toBe(32);
  });

  it("TEST 5–7: Full local XX handshake (initiator ↔ responder)", () => {
    const initKp = generateX25519KeyPair();
    const respKp = generateX25519KeyPair();
    const prologue = Buffer.from(NOISE_MODE, "binary");

    const init = createNoiseInitiator(initKp, prologue);
    const resp = createNoiseResponder(respKp, prologue);

    // -> e
    const msg1 = noiseWriteMessage1(init);
    expect(msg1.length).toBe(32);
    noiseResponderReadMessage1(resp, msg1);

    // <- e, ee, s, es
    const msgA = noiseResponderWriteMessageA(resp, Buffer.from("cert-payload"));
    const payloadA = noiseReadMessageA(init, msgA);
    expect(payloadA.toString()).toBe("cert-payload");

    // -> s, se
    const msgB = noiseWriteMessageB(init, Buffer.from("client-finish-payload"));
    const payloadB = noiseResponderReadMessageB(resp, msgB);
    expect(payloadB.toString()).toBe("client-finish-payload");

    const keysI = noiseSplit(init);
    const keysR = noiseSplit(resp);
    // Initiator send == Responder recv
    expect(keysI.sendKey.equals(keysR.recvKey)).toBe(true);
    expect(keysI.recvKey.equals(keysR.sendKey)).toBe(true);
  });

  it("TEST 8: Invalid server handshake is rejected", () => {
    const kp = generateX25519KeyPair();
    const { state } = startWaNoiseHandshake({ staticKey: kp });
    expect(() =>
      continueWaNoiseHandshake(state, Buffer.from("not-a-handshake")),
    ).toThrow();
  });

  it("TEST 9: Malformed frame is rejected safely", () => {
    const kp = generateX25519KeyPair();
    const { state } = startWaNoiseHandshake({ staticKey: kp });
    // Empty protobuf
    expect(() => continueWaNoiseHandshake(state, Buffer.alloc(0))).toThrow();
    // Wrong field only
    const junk = encodeBytes(1, Buffer.alloc(32));
    expect(() => continueWaNoiseHandshake(state, junk)).toThrow();
  });
});

describe("WA frame + header", () => {
  it("TEST 10: WebSocket binary frame is length-prefixed correctly", () => {
    const payload = Buffer.from("hello-noise");
    const frame = encodeFrame(payload);
    expect(frame.length).toBe(3 + payload.length);
    const decoded = decodeFrame(frame);
    expect(decoded).not.toBeNull();
    expect(decoded!.payload.equals(payload)).toBe(true);
    expect(decoded!.rest.length).toBe(0);
  });

  it("NOISE_WA_HEADER is WA + version 6 + dict 3", () => {
    expect(NOISE_WA_HEADER).toEqual(Buffer.from([87, 65, 6, 3]));
    expect(NOISE_WA_HEADER.toString("ascii", 0, 2)).toBe("WA");
  });

  it("first frame is header + length + clientHello proto", () => {
    const kp = generateX25519KeyPair();
    const { firstFrame } = startWaNoiseHandshake({ staticKey: kp });
    expect(firstFrame[0]).toBe(87); // W
    expect(firstFrame[1]).toBe(65); // A
    expect(firstFrame[2]).toBe(6);
    expect(firstFrame[3]).toBe(3);
    const body = firstFrame.subarray(4);
    const d = decodeFrame(body);
    expect(d).not.toBeNull();
    expect(d!.payload.length).toBeGreaterThan(32);
  });
});

describe("parseServerHello", () => {
  it("parses a synthetic serverHello protobuf", () => {
    // Build HandshakeMessage { serverHello: { ephemeral, static, payload } }
    const eph = Buffer.alloc(32, 1);
    const st = Buffer.alloc(48, 2); // 32 + 16 tag
    const pl = Buffer.alloc(16, 3);
    const inner = Buffer.concat([
      encodeBytes(1, eph),
      encodeBytes(2, st),
      encodeBytes(3, pl),
    ]);
    const msg = encodeBytes(3, inner); // field 3 = serverHello
    const parsed = parseServerHello(msg);
    expect(parsed.ephemeral.equals(eph)).toBe(true);
    expect(parsed.static.equals(st)).toBe(true);
    expect(parsed.payload.equals(pl)).toBe(true);
  });
});
