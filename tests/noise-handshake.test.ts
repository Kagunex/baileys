/**
 * Noise XX + WA HandshakeMessage unit tests.
 * No real network — pure crypto + protobuf wire format.
 */
import { createHash } from "node:crypto";
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

/** SHA-256 helper for regression test assertions. */
function sha256(...bufs: Buffer[]): Buffer {
  const h = createHash("sha256");
  for (const b of bufs) h.update(b);
  return h.digest() as Buffer;
}

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

// ---------------------------------------------------------------------------
// REGRESSION TESTS — verifying the root cause bugs from RC1 are fixed.
//
// Root cause: "Unsupported state or unable to authenticate data" in
// decryptAndHash() during noiseReadMessageA (ServerHello processing).
//
// Three bugs caused client h ≠ server h, making AES-GCM tag verification fail:
//   Bug #1: initializeHash SHA256'd the 28-byte protocol name instead of
//           zero-padding it to 32 bytes per Noise spec §3.4.
//   Bug #2: startWaNoiseHandshake used NOISE_MODE (32 bytes) as prologue
//           instead of NOISE_WA_HEADER (4 bytes).
//   Bug #3: NOISE_WA_HEADER was mixed into h a SECOND time after init
//           (already mixed as prologue) → double mix diverged from server.
//   Bug #4: ClientHello omitted the static public key (field 2), so new/
//           unregistered devices' servers could not sync their h state.
// ---------------------------------------------------------------------------
describe("REGRESSION: Noise initialization correctness (RC1 root cause)", () => {
  it("REG-1: ck equals zero-padded protocol name (not SHA256 of 28-byte name)", () => {
    // Noise spec §3.4: len("Noise_XX_25519_AESGCM_SHA256") = 28 ≤ 32 = HASHLEN
    // → h0 = protocolName || zeros (zero-padded to 32 bytes)
    // → ck = h0
    // Bug: RC1 used sha256(28-byte name) which produced a completely different ck,
    // making all HKDF-derived AES-GCM keys wrong.
    const kp = generateX25519KeyPair();
    const state = createNoiseInitiator(kp, Buffer.alloc(0));

    // After zero-padding "Noise_XX_25519_AESGCM_SHA256" to 32 bytes the result
    // is identical to Buffer.from(NOISE_MODE, "binary").
    const expectedCk = Buffer.from(NOISE_MODE, "binary");
    expect(state.ck.equals(expectedCk)).toBe(true);

    // Explicitly verify it is NOT the SHA256 of the 28-byte name (the old bug).
    const wrongCk = sha256(Buffer.from(NOISE_PROTOCOL_NAME, "utf-8"));
    expect(state.ck.equals(wrongCk)).toBe(false);
  });

  it("REG-2: startWaNoiseHandshake h state matches expected WA sequence", () => {
    // Correct WA handshake hash sequence (must match WhatsApp server):
    //   h0 = zero_pad("Noise_XX_25519_AESGCM_SHA256", 32)  = NOISE_MODE bytes
    //   h1 = sha256(h0 || NOISE_WA_HEADER)                  [prologue]
    //   h2 = sha256(h1 || staticKey.public)                  [WA pre-auth]
    //   h3 = sha256(h2 || ephemeral.public)                  [noiseWriteMessage1]
    //
    // After startWaNoiseHandshake (step=1), state.h must equal h3.
    const kp = generateX25519KeyPair();
    const { state } = startWaNoiseHandshake({ staticKey: kp });

    const h0 = Buffer.from(NOISE_MODE, "binary");
    const h1 = sha256(h0, NOISE_WA_HEADER);          // prologue = NOISE_WA_HEADER
    const h2 = sha256(h1, kp.public);                 // WA static key pre-auth
    const h3 = sha256(h2, state.ephemeral.public);    // message 1 ephemeral

    expect(state.h.equals(h3)).toBe(true);

    // Also verify it does NOT match the buggy RC1 sequence (NOISE_MODE prologue + double WA_HEADER).
    const h0_wrong = sha256(Buffer.from(NOISE_PROTOCOL_NAME, "utf-8")); // SHA256 of 28-byte name
    const h1_wrong = sha256(h0_wrong, Buffer.from(NOISE_MODE, "binary")); // wrong prologue
    const h2_wrong = sha256(h1_wrong, NOISE_WA_HEADER);                   // double mix
    const h3_wrong = sha256(h2_wrong, kp.public);
    const h4_wrong = sha256(h3_wrong, state.ephemeral.public);
    expect(state.h.equals(h4_wrong)).toBe(false);
  });

  it("REG-3: ClientHello includes static public key in field 2", () => {
    // The server (for new/unregistered devices) reads ClientHello.static (field 2)
    // to authenticate the client's noise key into its own h state.
    // Without this field the server's h diverges from the client's → AES-GCM fail.
    const kp = generateX25519KeyPair();
    const { firstFrame } = startWaNoiseHandshake({ staticKey: kp });

    // Decode: NOISE_WA_HEADER (4) + 3-byte length + HandshakeMessage protobuf
    const body = firstFrame.subarray(4);
    const framed = decodeFrame(body);
    expect(framed).not.toBeNull();

    // HandshakeMessage field 2 = ClientHello
    const topFields = readFields(framed!.payload);
    const clientHelloBytes = fieldBytes(topFields, 2);
    expect(clientHelloBytes).toBeTruthy();

    const chFields = readFields(clientHelloBytes!);
    // field 1 = ephemeral (32 bytes)
    const ephemeral = fieldBytes(chFields, 1);
    expect(ephemeral?.length).toBe(32);

    // field 2 = static public key (32 bytes) — MUST be present and match kp.public
    const staticInProto = fieldBytes(chFields, 2);
    expect(staticInProto).toBeTruthy();
    expect(staticInProto!.length).toBe(32);
    expect(staticInProto!.equals(kp.public)).toBe(true);
  });

  it("REG-4: NOISE_WA_HEADER is prologue (not mixed twice)", () => {
    // If NOISE_WA_HEADER is mixed twice (once as prologue, once explicitly),
    // state.h diverges from server. This test verifies single-mix behavior.
    const kp = generateX25519KeyPair();
    const { state } = startWaNoiseHandshake({ staticKey: kp });

    // Compute h with NOISE_WA_HEADER mixed ONCE (correct):
    const h0 = Buffer.from(NOISE_MODE, "binary");
    const h_single_mix = sha256(sha256(h0, NOISE_WA_HEADER), kp.public);

    // Compute h with NOISE_WA_HEADER mixed TWICE (the RC1 bug):
    const h_double_mix = sha256(sha256(sha256(h0, NOISE_WA_HEADER), NOISE_WA_HEADER), kp.public);

    // After noiseWriteMessage1, state.h has ephemeral mixed in.
    // Check the pre-ephemeral h by reversing: we know state.ephemeral.public.
    // Instead of trying to "reverse" SHA256, we just recompute with ephemeral:
    const correct_final = sha256(h_single_mix, state.ephemeral.public);
    const double_mix_final = sha256(h_double_mix, state.ephemeral.public);

    expect(state.h.equals(correct_final)).toBe(true);
    expect(state.h.equals(double_mix_final)).toBe(false);
  });
});
