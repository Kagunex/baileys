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
  noiseEncrypt,
  noiseDecrypt,
  NOISE_PROTOCOL_NAME,
} from "../src/Noise/handshake.js";
import { NoiseSession } from "../src/Noise/session.js";
import {
  startWaNoiseHandshake,
  continueWaNoiseHandshake,
} from "../src/Noise/wa-noise.js";
import { decodeFrame } from "../src/WABinary/frame.js";
import { NOISE_MODE } from "../src/Defaults/constants.js";

describe("Noise XX full handshake", () => {
  it("protocol name is XX AESGCM SHA256", () => {
    expect(NOISE_PROTOCOL_NAME).toBe("Noise_XX_25519_AESGCM_SHA256");
  });

  it("initiator <-> responder completes and transports", () => {
    const prologue = Buffer.from(NOISE_MODE, "binary");
    const initStatic = generateX25519KeyPair();
    const respStatic = generateX25519KeyPair();

    const initiator = createNoiseInitiator(initStatic, prologue);
    const responder = createNoiseResponder(respStatic, prologue);

    // -> e
    const msg1 = noiseWriteMessage1(initiator);
    expect(msg1.length).toBe(32);
    noiseResponderReadMessage1(responder, msg1);

    // <- e, ee, s, es
    const certPayload = Buffer.from("server-cert-placeholder");
    const msgA = noiseResponderWriteMessageA(responder, certPayload);
    const payloadA = noiseReadMessageA(initiator, msgA);
    expect(payloadA.toString()).toBe("server-cert-placeholder");

    // -> s, se
    const clientPayload = Buffer.from("client-finish");
    const msgB = noiseWriteMessageB(initiator, clientPayload);
    const payloadB = noiseResponderReadMessageB(responder, msgB);
    expect(payloadB.toString()).toBe("client-finish");

    const initKeys = noiseSplit(initiator);
    const respKeys = noiseSplit(responder);

    // Cross keys: initiator send == responder recv
    expect(initKeys.sendKey.equals(respKeys.recvKey)).toBe(true);
    expect(initKeys.recvKey.equals(respKeys.sendKey)).toBe(true);

    // Transport
    const initSess = new NoiseSession(initKeys);
    const respSess = new NoiseSession(respKeys);

    const frame = initSess.seal(Buffer.from("hello-wa-noise"));
    const opened = respSess.open(frame);
    expect(opened).toHaveLength(1);
    expect(opened[0].toString()).toBe("hello-wa-noise");

    const frame2 = respSess.seal(Buffer.from("ack"));
    const opened2 = initSess.open(frame2);
    expect(opened2[0].toString()).toBe("ack");
  });

  it("WA noise helper produces framed message1", () => {
    const staticKey = generateX25519KeyPair();
    const { state, firstFrame } = startWaNoiseHandshake({ staticKey });
    const decoded = decodeFrame(firstFrame);
    expect(decoded).toBeDefined();
    expect(decoded!.payload.length).toBe(32);
    expect(state.step).toBe(1);
  });

  it("encrypt/decrypt with explicit nonce", () => {
    const key = Buffer.alloc(32, 5);
    const pt = Buffer.from("gcm-test");
    const ct = noiseEncrypt(key, 0n, pt);
    const back = noiseDecrypt(key, 0n, ct);
    expect(back.equals(pt)).toBe(true);
  });
});
