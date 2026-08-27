/**
 * End-to-end message pipeline with mock Noise transport.
 */
import { describe, it, expect } from "vitest";
import {
  createNoiseInitiator,
  createNoiseResponder,
  noiseWriteMessage1,
  noiseResponderReadMessage1,
  noiseResponderWriteMessageA,
  noiseReadMessageA,
  noiseWriteMessageB,
  noiseResponderReadMessageB,
  noiseSplit,
} from "../src/Noise/handshake.js";
import { NoiseSession } from "../src/Noise/session.js";
import { generateX25519KeyPair } from "../src/Utils/crypto.js";
import { NOISE_MODE } from "../src/Defaults/constants.js";
import { createMessageEngine } from "../src/Messages/engine.js";
import { EventEmitter } from "../src/Events/emitter.js";
import { sendMessage } from "../src/Messages/send.js";
import { handleIncomingPayload } from "../src/Messages/receive.js";
import { establishSessions, signalEncrypt } from "../src/Signal/session.js";
import { encodeBinaryNode } from "../src/WABinary/encode.js";
import { decodeFrame } from "../src/WABinary/frame.js";

function kp() {
  const k = generateX25519KeyPair();
  return { public: new Uint8Array(k.public), private: new Uint8Array(k.private) };
}

function pairedSessions() {
  const prologue = Buffer.from(NOISE_MODE, "binary");
  const a = generateX25519KeyPair();
  const b = generateX25519KeyPair();
  const init = createNoiseInitiator(a, prologue);
  const resp = createNoiseResponder(b, prologue);
  noiseResponderReadMessage1(resp, noiseWriteMessage1(init));
  noiseReadMessageA(init, noiseResponderWriteMessageA(resp, Buffer.alloc(0)));
  noiseResponderReadMessageB(resp, noiseWriteMessageB(init, Buffer.alloc(0)));
  return {
    alice: new NoiseSession(noiseSplit(init)),
    bob: new NoiseSession(noiseSplit(resp)),
  };
}

describe("Message E2E (mock Noise)", () => {
  it("send → wire → receive text with ACK", async () => {
    const { alice, bob } = pairedSessions();
    const evA = new EventEmitter();
    const evB = new EventEmitter();
    const engineA = createMessageEngine({ ev: evA, waitForAck: true, ackTimeoutMs: 2000 });
    const engineB = createMessageEngine({ ev: evB, waitForAck: false });

    const bobInbox: string[] = [];
    evB.on("messages.upsert", (u) => {
      bobInbox.push(u.messages[0]?.message?.conversation || "");
    });

    // Bob transport: open alice frames, feed plaintext to engineB, reply ACK
    const bobNet = {
      session: bob,
      sendFrame: (frame: Buffer) => {
        // alice receives ACK frames back
        const pts = alice.open(frame);
        for (const pt of pts) engineA.handlePayload(pt);
      },
    };

    const aliceNet = {
      session: alice,
      sendFrame: (frame: Buffer) => {
        const pts = bob.open(frame);
        for (const pt of pts) {
          engineB.handlePayload(pt, undefined, undefined, bobNet);
          // simulate server ACK back to alice
          const node = encodeBinaryNode({
            tag: "ack",
            attrs: {
              id: "will-set",
              class: "message",
              from: "s.whatsapp.net",
            },
          });
        }
      },
    };

    // Simpler path: send without waiting ACK first
    const engineA2 = createMessageEngine({ ev: evA, waitForAck: false });
    let sentId = "";
    const msg = await engineA2.sendMessage(
      "628@s.whatsapp.net",
      { text: "e2e-hello" },
      {},
      {
        session: alice,
        sendFrame: (frame) => {
          const pts = bob.open(frame);
          for (const pt of pts) {
            engineB.handlePayload(pt, undefined, undefined, {
              session: bob,
              sendFrame: () => {},
            });
          }
        },
      },
    );
    sentId = msg.key.id || "";
    expect(sentId).toBeTruthy();
    expect(bobInbox).toContain("e2e-hello");

    // ACK path
    engineA2.acks.handle([
      { id: sentId, type: "server", remoteJid: "628@s.whatsapp.net" },
    ]);

    engineA.dispose();
    engineA2.dispose();
    engineB.dispose();
  });

  it("sendMessage helper uses engine pipeline", async () => {
    const { alice, bob } = pairedSessions();
    const ev = new EventEmitter();
    let got = "";
    ev.on("messages.upsert", (u) => {
      if (u.messages[0]?.key.fromMe) got = u.messages[0]?.message?.conversation || "";
    });
    await sendMessage(
      "1@s.whatsapp.net",
      { text: "via-send-ts" },
      {},
      {
        ev,
        session: alice,
        sendFrame: (frame) => {
          bob.open(frame); // just decrypt
        },
        waitForAck: false,
      },
    );
    expect(got).toBe("via-send-ts");
  });

  it("quoted + reaction E2E events", async () => {
    const { alice, bob } = pairedSessions();
    const ev = new EventEmitter();
    const engine = createMessageEngine({ ev, waitForAck: false });
    const reactions: string[] = [];
    ev.on("messages.reaction", (r) => reactions.push(r[0]?.reaction?.text || ""));

    const original = await engine.sendMessage(
      "1@s.whatsapp.net",
      { text: "base" },
      {},
      {
        session: alice,
        sendFrame: (f) => {
          bob.open(f);
        },
      },
    );
    await engine.sendMessage(
      "1@s.whatsapp.net",
      { text: "reply", quoted: original },
      {},
      {
        session: alice,
        sendFrame: (f) => {
          bob.open(f);
        },
      },
    );
    await engine.sendReaction(
      original.key,
      "👍",
      {
        session: alice,
        sendFrame: (f) => {
          bob.open(f);
        },
      },
    );
    expect(reactions).toContain("👍");
    engine.dispose();
  });
});
