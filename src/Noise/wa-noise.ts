/**
 * WhatsApp Web Noise helpers (KaguneX).
 *
 * WA uses Noise_XX_25519_AESGCM_SHA256 with a fixed prologue string
 * (see Defaults NOISE_MODE) and length-prefixed handshake/transport frames.
 */

import { NOISE_MODE } from "../Defaults/constants.js";
import { encodeFrame, decodeFrame } from "../WABinary/frame.js";
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
  /** First frame to send on WebSocket open */
  firstFrame: Buffer;
};

/** Start WA client Noise handshake — returns first frame (-> e). */
export function startWaNoiseHandshake(opts: WaNoiseOptions): WaNoiseHandshake {
  const prologue = opts.prologue ?? Buffer.from(NOISE_MODE, "binary");
  const state = createNoiseInitiator(opts.staticKey, prologue);
  const msg1 = noiseWriteMessage1(state);
  return { state, firstFrame: encodeFrame(msg1) };
}

export type WaNoiseContinueResult =
  | {
      done: false;
      /** Second client frame (-> s, se) */
      frame: Buffer;
      cert?: CertValidationResult;
      serverPayload: Buffer;
    }
  | {
      done: true;
      session: NoiseSession;
      keys: NoiseHandshakeResult;
      cert?: CertValidationResult;
      serverPayload: Buffer;
    };

/**
 * Process server handshake frame (message A), produce client finish frame,
 * then split into transport session.
 *
 * Call with the payload of one decoded length-prefixed frame from the server.
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
  const serverPayload = noiseReadMessageA(state, serverFramePayload);

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
  const msgB = noiseWriteMessageB(state, finishPayload);
  const keys = noiseSplit(state);
  const session = new NoiseSession(keys);

  return {
    finishFrame: encodeFrame(msgB),
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
export { encodeFrame, decodeFrame };
