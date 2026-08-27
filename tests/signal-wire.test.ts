import { describe, it, expect } from "vitest";
import { generateX25519KeyPair } from "../src/Utils/crypto.js";
import {
  initSessionAsInitiator,
  signalEncrypt,
  signalDecrypt,
} from "../src/Signal/session.js";
import {
  encodeSignalWire,
  decodeSignalWire,
  wrapEncryptedBody,
  unwrapEncryptedBody,
} from "../src/Signal/wire.js";
import {
  encodeWaMessageContent,
  decodeWaMessageContent,
} from "../src/WAProto/message.js";
import { buildMessageNode, parseMessageNode } from "../src/Protocol/message-node.js";
import { handleIncomingPayload } from "../src/Messages/receive.js";
import { EventEmitter } from "../src/Events/emitter.js";

describe("Signal wire + E2E path", () => {
  it("wire encode/decode", () => {
    const msg = {
      counter: 3,
      ratchetPub: Buffer.alloc(32, 1),
      ciphertext: Buffer.from("cipher"),
    };
    const wire = encodeSignalWire(msg);
    const back = decodeSignalWire(wire);
    expect(back.counter).toBe(3);
    expect(back.ciphertext.toString()).toBe("cipher");
  });

  it("encrypt protobuf → wire → decrypt", () => {
    const localId = generateX25519KeyPair();
    const remoteId = generateX25519KeyPair();
    const remoteSpk = generateX25519KeyPair();
    let session = initSessionAsInitiator({
      remoteAddress: "bob",
      localIdentity: {
        public: new Uint8Array(localId.public),
        private: new Uint8Array(localId.private),
      },
      remoteIdentityPub: remoteId.public,
      remoteSignedPreKeyPub: remoteSpk.public,
    });
    // mirror for self-test
    session = {
      ...session,
      receiving: {
        chainKey: Buffer.from(session.sending.chainKey),
        counter: 0,
      },
    };

    const proto = encodeWaMessageContent({ conversation: "e2e hello" });
    // Capture original sending chain before encrypt advances it
    const origSendingChainKey = Buffer.from(session.sending.chainKey);
    const { message } = signalEncrypt(session, proto);
    const wire = encodeSignalWire(message);
    // For self-test: mirror chain + set remoteRatchetPub to the header key so
    // decrypt does not perform an extra DH ratchet step (which would change keys).
    const dec = signalDecrypt(
      {
        ...session,
        receiving: {
          chainKey: origSendingChainKey,
          counter: 0,
        },
        remoteRatchetPub: Buffer.from(message.ratchetPub),
      },
      decodeSignalWire(wire),
    );
    expect(decodeWaMessageContent(dec.plaintext).conversation).toBe("e2e hello");
  });

  it("message node with plain protobuf still parses", () => {
    const { encoded } = buildMessageNode({
      to: "1@s.whatsapp.net",
      content: { conversation: "plain" },
    });
    const ev = new EventEmitter();
    let got = "";
    ev.on("messages.upsert", (u) => {
      got = u.messages[0]?.message?.conversation || "";
    });
    handleIncomingPayload(encoded, ev);
    expect(got).toBe("plain");
  });
});
