/**
 * Stable Pairing IQ (companion linking) — KaguneX.
 *
 * Design goals:
 *  - Deterministic stanza with real key material when available
 *  - Robust response parsing (multiple attr/tag shapes)
 *  - Retry-friendly request builder (fresh id each attempt)
 *  - Clear errors (not silent empty results)
 */

import type { BinaryNode } from "../WABinary/types.js";
import { encodeBinaryNode } from "../WABinary/encode.js";
import { decodeBinaryNode } from "../WABinary/decode.js";
import {
  getBinaryNodeAttr,
  getBinaryNodeChild,
  getBinaryNodeChildren,
} from "../WABinary/index.js";
import { generateMessageID } from "../Utils/generics.js";
import { normalizePairingPhone, formatPairingCode } from "../Web/pairing.js";

export type PairingStage = "companion_hello" | "companion_finish";

export type PairingKeyMaterial = {
  /** X25519 public (32 bytes) — companion ephemeral */
  companionEphemeralPub?: Buffer;
  /** X25519 public — companion noise/auth key */
  companionAuthPub?: Buffer;
  platformId?: string;
  platformDisplay?: string;
  /** nonce as decimal string */
  nonce?: string;
};

export type PairingCodeRequest = {
  phoneNumber: string;
  id: string;
  node: BinaryNode;
  encoded: Buffer;
  stage: PairingStage;
  attempt: number;
};

export type PairingResult = {
  code?: string;
  status?: string;
  errorCode?: string;
  errorText?: string;
  pairSuccess?: boolean;
  me?: { id: string; name?: string };
  /** raw iq id if present */
  iqId?: string;
};

export type PairingRequestOptions = {
  keys?: PairingKeyMaterial;
  stage?: PairingStage;
  attempt?: number;
  /** Override iq id (tests) */
  id?: string;
};

function b64(buf: Buffer | Uint8Array | undefined): string | undefined {
  if (!buf || !buf.length) return undefined;
  return Buffer.from(buf).toString("base64");
}

function keyChild(tag: string, pub?: Buffer | Uint8Array): BinaryNode {
  const content = b64(pub);
  return {
    tag,
    attrs: {},
    ...(content ? { content } : {}),
  };
}

/**
 * Build a pairing-code IQ. Call again for each retry (new id).
 */
export function buildPairingCodeIq(
  phoneNumber: string,
  options: PairingRequestOptions = {},
): PairingCodeRequest {
  const phone = normalizePairingPhone(phoneNumber);
  const id = options.id ?? generateMessageID();
  const stage = options.stage ?? "companion_hello";
  const attempt = options.attempt ?? 1;
  const keys = options.keys ?? {};

  const platformId = keys.platformId ?? "1";
  const platformDisplay = keys.platformDisplay ?? "Chrome (Linux)";
  const nonce = keys.nonce ?? String(attempt - 1);

  const regChildren: BinaryNode[] = [
    keyChild(
      "link_code_pairing_wrapped_companion_ephemeral_pub",
      keys.companionEphemeralPub,
    ),
    keyChild("companion_server_auth_key_pub", keys.companionAuthPub),
    {
      tag: "companion_platform_id",
      attrs: {},
      content: platformId,
    },
    {
      tag: "companion_platform_display",
      attrs: {},
      content: platformDisplay,
    },
    {
      tag: "link_code_pairing_nonce",
      attrs: {},
      content: nonce,
    },
  ];

  const node: BinaryNode = {
    tag: "iq",
    attrs: {
      to: "s.whatsapp.net",
      type: "set",
      id,
      xmlns: "md",
    },
    content: [
      {
        tag: "link_code_companion_reg",
        attrs: {
          jid: `${phone}@s.whatsapp.net`,
          stage,
          should_show_push_notification: "true",
        },
        content: regChildren,
      },
    ],
  };

  return {
    phoneNumber: phone,
    id,
    node,
    encoded: encodeBinaryNode(node),
    stage,
    attempt,
  };
}

export function buildPairDeviceIq(ref: string, companionRef: string): BinaryNode {
  return {
    tag: "iq",
    attrs: {
      to: "s.whatsapp.net",
      type: "set",
      id: generateMessageID(),
      xmlns: "md",
    },
    content: [{ tag: "pair-device", attrs: { ref, id: companionRef } }],
  };
}

/** Normalize raw code string → XXXX-XXXX when 8 chars. */
export function normalizePairingCode(raw: string): string | undefined {
  const clean = raw.replace(/[\s-]/g, "").toUpperCase();
  if (!/^[A-Z0-9]{8}$/.test(clean)) return undefined;
  return formatPairingCode(clean);
}

function considerCode(value: string | undefined, out: PairingResult): void {
  if (!value || out.code) return;
  const n = normalizePairingCode(value);
  if (n) out.code = n;
}

/**
 * Parse pairing-related IQ / notification from a decrypted payload.
 */
export function parsePairingPayload(payload: Buffer): PairingResult {
  const result: PairingResult = {};
  try {
    walkPairing(decodeBinaryNode(payload), result);
  } catch {
    // non-node payload
  }
  return result;
}

function walkPairing(node: BinaryNode, out: PairingResult): void {
  const id = getBinaryNodeAttr(node, "id");
  if (node.tag === "iq" && id) out.iqId = id;

  // Errors
  if (node.tag === "error") {
    out.errorCode = getBinaryNodeAttr(node, "code") || out.errorCode || "error";
    out.errorText =
      getBinaryNodeAttr(node, "text") ||
      getBinaryNodeAttr(node, "title") ||
      out.errorText;
  }
  if (node.tag === "iq" && getBinaryNodeAttr(node, "type") === "error") {
    out.errorCode = getBinaryNodeAttr(node, "code") || out.errorCode || "iq_error";
    const errChild = getBinaryNodeChild(node, "error");
    if (errChild) {
      out.errorCode = getBinaryNodeAttr(errChild, "code") || out.errorCode;
      out.errorText = getBinaryNodeAttr(errChild, "text") || out.errorText;
    }
  }

  // pair-success
  if (node.tag === "pair-success") {
    out.pairSuccess = true;
    const device = getBinaryNodeChild(node, "device");
    const jid =
      (device && getBinaryNodeAttr(device, "jid")) ||
      getBinaryNodeAttr(node, "jid");
    if (jid) {
      out.me = {
        id: jid,
        name:
          getBinaryNodeAttr(node, "name") ||
          (device ? getBinaryNodeAttr(device, "name") : undefined),
      };
    }
  }

  // Codes from common attributes
  for (const attr of [
    "link_code",
    "code",
    "pairing_code",
    "link_code_pairing_code",
    "pairingCode",
  ]) {
    considerCode(getBinaryNodeAttr(node, attr), out);
  }

  // Text / buffer content (encoder may round-trip strings as binary)
  if (typeof node.content === "string") {
    considerCode(node.content, out);
  } else if (Buffer.isBuffer(node.content) || node.content instanceof Uint8Array) {
    try {
      considerCode(Buffer.from(node.content).toString("utf8"), out);
    } catch {
      /* ignore non-utf8 */
    }
  }

  // Stage / status
  const status =
    getBinaryNodeAttr(node, "status") || getBinaryNodeAttr(node, "stage");
  if (status) out.status = status;

  for (const child of getBinaryNodeChildren(node)) {
    walkPairing(child, out);
  }
}

export function extractPairingCode(payload: Buffer): string | undefined {
  return parsePairingPayload(payload).code;
}

/**
 * Whether this payload is relevant to a pending pairing request.
 * Matches by iq id when known; also accepts code-bearing frames without id match
 * only when `acceptUnsolicitedCode` is true.
 */
export function isPairingResponse(
  payload: Buffer,
  expectedId?: string,
  opts?: { acceptUnsolicitedCode?: boolean },
): boolean {
  try {
    const node = decodeBinaryNode(payload);
    const parsed = parsePairingPayload(payload);

    if (parsed.pairSuccess) return true;

    if (node.tag === "iq") {
      const id = getBinaryNodeAttr(node, "id");
      const type = getBinaryNodeAttr(node, "type");
      if (expectedId && id === expectedId) {
        return type === "result" || type === "error";
      }
      // md namespace result with code
      if (parsed.code && type === "result") {
        return !expectedId || id === expectedId;
      }
    }

    if (opts?.acceptUnsolicitedCode && parsed.code) return true;
    return false;
  } catch {
    return false;
  }
}

/** @deprecated use isPairingResponse */
export function isPairingIqResult(payload: Buffer, expectedId?: string): boolean {
  return isPairingResponse(payload, expectedId);
}

/** Retry policy helper */
export function pairingRetryDelayMs(attempt: number): number {
  // 500ms, 1s, 2s, 4s… cap 8s
  return Math.min(500 * 2 ** Math.max(0, attempt - 1), 8000);
}

export const DEFAULT_PAIRING_TIMEOUT_MS = 60_000;
export const DEFAULT_PAIRING_MAX_ATTEMPTS = 3;
