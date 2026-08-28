/**
 * Pairing integration lifecycle (mock WhatsApp responses — no real account).
 *
 * Flow under test:
 *   requestPairingCode → code response → creds.update (pairingCode)
 *     → pair-success → applyPairSuccess → registered + connection open
 *
 * Critical: code generation alone must NOT open the connection.
 */
import { describe, it, expect } from "vitest";
import {
  buildPairingCodeIq,
  parsePairingPayload,
  isPairingResponse,
} from "../src/Protocol/pairing.js";
import { encodeBinaryNode, decodeBinaryNode } from "../src/WABinary/index.js";
import { createPairingController } from "../src/Socket/pairing-controller.js";
import {
  applyPairSuccess,
  resolveLoginMode,
  shouldSkipPairingOnReconnect,
} from "../src/Socket/login-lifecycle.js";
import { initAuthCreds } from "../src/Auth/credentials.js";
import { applyCredsUpdate } from "../src/Auth/auth-utils.js";
import { NoiseSession } from "../src/Noise/session.js";
import {
  generateX25519KeyPair,
  noiseSplit,
  createNoiseInitiator,
  createNoiseResponder,
  noiseWriteMessage1,
  noiseResponderReadMessage1,
  noiseResponderWriteMessageA,
  noiseReadMessageA,
  noiseWriteMessageB,
  noiseResponderReadMessageB,
} from "../src/Noise/handshake.js";
import { NOISE_MODE } from "../src/Defaults/constants.js";
import type { AuthenticationCreds } from "../src/Types/Auth.js";
import type { ConnectionState } from "../src/Types/Events.js";

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

type SimState = {
  phase: "idle" | "requesting" | "waiting_for_pair" | "authenticated" | "open" | "failed";
  connection: ConnectionState;
  creds: AuthenticationCreds;
};

describe("Pairing integration lifecycle", () => {
  it("full flow: request → code → pair-success → authenticated/open", async () => {
    const { client } = makeSessions();
    const pairing = createPairingController();
    const sent: Buffer[] = [];
    const state: SimState = {
      phase: "idle",
      connection: "connecting",
      creds: initAuthCreds(),
    };

    // --- request pairing code ---
    state.phase = "requesting";
    const codePromise = pairing.requestCode("6281234567890", {
      timeoutMs: 5000,
      maxAttempts: 1,
      session: client,
      send: (pt) => sent.push(pt),
      creds: state.creds,
    });

    await new Promise((r) => setTimeout(r, 20));
    expect(sent.length).toBeGreaterThanOrEqual(1);

    // IQ must request native push notification (WhatsApp handles Linked Devices UI)
    const reqNode = decodeBinaryNode(sent[0]);
    const reg = (reqNode.content as any[])[0];
    expect(reg.attrs.should_show_push_notification).toBe("true");
    expect(reg.attrs.stage).toBe("companion_hello");

    const iqId = reqNode.attrs.id as string;

    // --- mock server: pairing code response ---
    const codeResponse = encodeBinaryNode({
      tag: "iq",
      attrs: { type: "result", id: iqId },
      content: [
        { tag: "link_code_companion_reg", attrs: { link_code: "ABCD1234" } },
      ],
    });
    expect(isPairingResponse(codeResponse, iqId)).toBe(true);
    pairing.onPayload(codeResponse);

    const code = await codePromise;
    expect(code).toBe("ABCD-1234");

    // Apply code to creds (as connection.ts does) — NOT authenticated yet
    const parsedCode = parsePairingPayload(codeResponse);
    state.creds.pairingCode = parsedCode.code!.replace("-", "");
    state.phase = "waiting_for_pair";
    expect(resolveLoginMode(state.creds)).toBe("pairing");
    expect(state.creds.registered).toBe(false);
    expect(shouldSkipPairingOnReconnect(state.creds)).toBe(false);
    // connection must still not be open
    expect(state.connection).not.toBe("open");

    // --- mock server: pair-success ---
    const successNode = encodeBinaryNode({
      tag: "pair-success",
      attrs: {},
      content: [
        {
          tag: "device",
          attrs: { jid: "6281234567890:1@s.whatsapp.net", name: "Phone" },
        },
      ],
    });
    const successParsed = parsePairingPayload(successNode);
    expect(successParsed.pairSuccess).toBe(true);
    expect(successParsed.me?.id).toContain("@");

    const applied = applyPairSuccess(successParsed, state.creds);
    expect(applied).toBeDefined();
    applyCredsUpdate(state.creds, applied!.credsPatch);
    state.connection = applied!.connectionUpdate.connection!;
    state.phase = "authenticated";
    if (state.connection === "open") state.phase = "open";

    expect(state.creds.registered).toBe(true);
    expect(state.creds.me?.id).toContain("6281234567890");
    expect(state.creds.pairingCode).toBeUndefined();
    expect(state.connection).toBe("open");
    expect(resolveLoginMode(state.creds)).toBe("registered");
    expect(shouldSkipPairingOnReconnect(state.creds)).toBe(true);
  });

  it("code generated alone does not authenticate", async () => {
    const { client } = makeSessions();
    const pairing = createPairingController();
    const sent: Buffer[] = [];
    const creds = initAuthCreds();

    const p = pairing.requestCode("6289999888877", {
      timeoutMs: 3000,
      maxAttempts: 1,
      session: client,
      send: (pt) => sent.push(pt),
    });
    await new Promise((r) => setTimeout(r, 15));
    const id = decodeBinaryNode(sent[0]).attrs.id as string;
    pairing.onPayload(
      encodeBinaryNode({
        tag: "iq",
        attrs: { type: "result", id },
        content: [
          { tag: "link_code_companion_reg", attrs: { link_code: "ZZZZ9999" } },
        ],
      }),
    );
    const code = await p;
    expect(code).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/);

    creds.pairingCode = code.replace("-", "");
    // Still not registered
    expect(creds.registered).toBe(false);
    expect(applyPairSuccess({ code }, creds)).toBeUndefined();
    expect(shouldSkipPairingOnReconnect(creds)).toBe(false);
  });

  it("pairing error response fails without opening", async () => {
    const { client } = makeSessions();
    const pairing = createPairingController();
    const sent: Buffer[] = [];

    const p = pairing.requestCode("6281111222233", {
      timeoutMs: 3000,
      maxAttempts: 1,
      session: client,
      send: (pt) => sent.push(pt),
    });
    await new Promise((r) => setTimeout(r, 15));
    const id = decodeBinaryNode(sent[0]).attrs.id as string;
    pairing.onPayload(
      encodeBinaryNode({
        tag: "iq",
        attrs: { type: "error", id },
        content: [{ tag: "error", attrs: { code: "400", text: "bad phone" } }],
      }),
    );
    await expect(p).rejects.toThrow(/pairing error/);
  });

  it("buildPairingCodeIq is deterministic per attempt id", () => {
    const a = buildPairingCodeIq("6281234567890", { id: "FIXED1", attempt: 1 });
    const b = buildPairingCodeIq("6281234567890", { id: "FIXED1", attempt: 1 });
    expect(a.encoded.equals(b.encoded)).toBe(true);
    expect(a.phoneNumber).toBe("6281234567890");
  });
});
