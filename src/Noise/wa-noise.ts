/**
 * WhatsApp Web Noise helpers (KaguneX).
 *
 * Wire format (compatible with current WhatsApp Web / upstream Baileys):
 *   First frame:  NOISE_WA_HEADER || 3-byte-BE-len || HandshakeMessage{clientHello}
 *   Later frames: 3-byte-BE-len || HandshakeMessage{serverHello|clientFinish} | transport
 *
 * Noise pattern: Noise_XX_25519_AESGCM_SHA256
 * Prologue: NOISE_MODE
 * Extra mix (WA): NOISE_WA_HEADER then static public key into handshake hash
 *                 before the first message (matches upstream authenticate order).
 */

import { NOISE_MODE, NOISE_WA_HEADER } from "../Defaults/constants.js";
import { encodeFrame, decodeFrame } from "../WABinary/frame.js";
import { encodeBytes, readFields, fieldBytes } from "../WAProto/protobuf.js";
import {
  createNoiseInitiator,
  noiseWriteMessage1,
  noiseReadMessageA,
  noiseWriteMessageB,
  noiseSplit,
  noiseKeyPairFromAuth,
  type NoiseHandshakeState,
  type NoiseHandshakeResult,
  type NoiseKeyPair,
} from "./handshake.js";
import { NoiseSession } from "./session.js";
import {
  validateNoiseCertificate,
  isStrictCertEnabled,
  type CertValidationResult,
} from "./certificate.js";
import { createHash } from "node:crypto";

export type WaNoiseOptions = {
  /** Device noise static key from auth creds */
  staticKey: NoiseKeyPair;
  /** Override prologue (default: NOISE_MODE binary) */
  prologue?: Buffer;
  /** Optional trusted cert public keys (32-byte Ed25519) */
  trustedCertKeys?: Buffer[];
};

export type WaNoiseHandshake = {
  state: NoiseHandshakeState;
  /** First frame to send on WebSocket open (includes WA header + clientHello) */
  firstFrame: Buffer;
};

// ---------------------------------------------------------------------------
// HandshakeMessage protobuf (field numbers from WAProto)
// message HandshakeMessage {
//   optional ClientHello clientHello = 2;
//   optional ServerHello serverHello = 3;
//   optional ClientFinish clientFinish = 4;
// }
// ClientHello { ephemeral=1, static=2, payload=3 }
// ServerHello { ephemeral=1, static=2, payload=3 }
// ClientFinish { static=1, payload=2 }
// ---------------------------------------------------------------------------

function encodeClientHello(ephemeral: Buffer, staticKey?: Buffer, payload?: Buffer): Buffer {
  const parts: Buffer[] = [encodeBytes(1, ephemeral)];
  if (staticKey?.length) parts.push(encodeBytes(2, staticKey));
  if (payload?.length) parts.push(encodeBytes(3, payload));
  const inner = Buffer.concat(parts);
  // HandshakeMessage.clientHello = field 2
  return encodeBytes(2, inner);
}

function encodeClientFinish(encStatic: Buffer, encPayload?: Buffer): Buffer {
  const parts: Buffer[] = [encodeBytes(1, encStatic)];
  if (encPayload?.length) parts.push(encodeBytes(2, encPayload));
  const inner = Buffer.concat(parts);
  // HandshakeMessage.clientFinish = field 4
  return encodeBytes(4, inner);
}

export type ParsedServerHello = {
  ephemeral: Buffer;
  static: Buffer;
  payload: Buffer;
};

/** Parse HandshakeMessage.serverHello from a protobuf buffer. */
export function parseServerHello(payload: Buffer): ParsedServerHello {
  const top = readFields(payload);
  const serverHelloBytes = fieldBytes(top, 3);
  if (!serverHelloBytes) {
    throw new Error("Noise: missing HandshakeMessage.serverHello");
  }
  const fields = readFields(serverHelloBytes);
  const ephemeral = fieldBytes(fields, 1);
  const staticKey = fieldBytes(fields, 2);
  const certPayload = fieldBytes(fields, 3) ?? Buffer.alloc(0);
  if (!ephemeral || ephemeral.length !== 32) {
    throw new Error("Noise: serverHello.ephemeral missing or invalid length");
  }
  if (!staticKey || staticKey.length < 32) {
    // encrypted static is 32 + 16 tag = 48
    throw new Error("Noise: serverHello.static missing or too short");
  }
  return {
    ephemeral: Buffer.from(ephemeral),
    static: Buffer.from(staticKey),
    payload: Buffer.from(certPayload),
  };
}

/** Reconstruct the raw Noise message A bytes that noiseReadMessageA expects. */
function serverHelloToNoiseMessageA(sh: ParsedServerHello): Buffer {
  // Noise XX message 2: e || encrypt(s) || encrypt(payload)
  return Buffer.concat([sh.ephemeral, sh.static, sh.payload]);
}

function mixHash(h: Buffer, data: Buffer): Buffer {
  return createHash("sha256").update(h).update(data).digest();
}

/**
 * Start WA client Noise handshake.
 * Returns the complete first WebSocket binary frame to send.
 */
export function startWaNoiseHandshake(opts: WaNoiseOptions): WaNoiseHandshake {
  const prologue = opts.prologue ?? Buffer.from(NOISE_MODE, "binary");
  const state = createNoiseInitiator(opts.staticKey, prologue);

  // Upstream WA authenticates NOISE_WA_HEADER then the static public key into
  // the handshake hash before sending the first message. Without this the
  // server rejects the clientHello and closes the socket (1006).
  state.h = mixHash(state.h, NOISE_WA_HEADER);
  state.h = mixHash(state.h, opts.staticKey.public);

  const ephemeral = noiseWriteMessage1(state);
  const clientHelloProto = encodeClientHello(ephemeral);

  // First frame: WA header + length-prefixed HandshakeMessage
  const body = encodeFrame(clientHelloProto);
  const firstFrame = Buffer.concat([NOISE_WA_HEADER, body]);

  return { state, firstFrame };
}

/**
 * Process server HandshakeMessage frame, produce clientFinish frame,
 * and split into a transport session.
 *
 * `serverFramePayload` is the payload of one decoded length-prefixed frame
 * (i.e. the HandshakeMessage protobuf bytes, NOT including the 3-byte length).
 */
export function continueWaNoiseHandshake(
  state: NoiseHandshakeState,
  serverFramePayload: Buffer,
  opts?: { trustedCertKeys?: Buffer[]; finishPayload?: Buffer },
): {
  finishFrame: Buffer;
  session: NoiseSession;
  keys: NoiseHandshakeResult;
  cert: CertValidationResult;
  serverPayload: Buffer;
} {
  const sh = parseServerHello(serverFramePayload);
  const noiseMsgA = serverHelloToNoiseMessageA(sh);
  const serverPayload = noiseReadMessageA(state, noiseMsgA);

  let cert: CertValidationResult = {
    ok: false,
    reason: "no certificate payload",
  };
  if (serverPayload.length > 0) {
    cert = validateNoiseCertificate(serverPayload, opts?.trustedCertKeys);
    if (
      !cert.ok &&
      isStrictCertEnabled() &&
      cert.reason.includes("not valid")
    ) {
      throw new Error(`Noise certificate rejected: ${cert.reason}`);
    }
  }

  const finishPayload = opts?.finishPayload ?? Buffer.alloc(0);
  // noiseWriteMessageB returns encrypt(static) || encrypt(payload)
  const msgB = noiseWriteMessageB(state, finishPayload);
  // Split: first 48 bytes = enc static (32+16), rest = enc payload
  const TAG = 16;
  const DH = 32;
  const encStatic = msgB.subarray(0, DH + TAG);
  const encPayload = msgB.subarray(DH + TAG);

  const clientFinishProto = encodeClientFinish(encStatic, encPayload.length ? encPayload : undefined);
  const keys = noiseSplit(state);
  const session = new NoiseSession(keys);

  return {
    finishFrame: encodeFrame(clientFinishProto),
    session,
    keys,
    cert,
    serverPayload,
  };
}

export function waNoiseKeyFromCreds(noiseKey: {
  public: Uint8Array;
  private: Uint8Array;
}): NoiseKeyPair {
  return noiseKeyPairFromAuth(noiseKey);
}

/** Re-export frame helpers for WA pipeline */
export { encodeFrame, decodeFrame, NOISE_WA_HEADER };
