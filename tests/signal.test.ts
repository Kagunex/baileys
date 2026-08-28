import { describe, it, expect } from "vitest";
import { generateX25519KeyPair } from "../src/Utils/crypto.js";
import {
  establishSessions,
  signalEncrypt,
  signalDecrypt,
  serializeSession,
  deserializeSession,
  SignalSessionManager,
} from "../src/Signal/session.js";
import { encodeWaMessageContent, decodeWaMessageContent } from "../src/WAProto/message.js";
import { encodeSignalWire, decodeSignalWire } from "../src/Signal/wire.js";

function kp() {
  const k = generateX25519KeyPair();
  return {
    public: new Uint8Array(k.public),
    private: new Uint8Array(k.private),
  };
}

describe("Signal session (upgraded)", () => {
  it("Alice → Bob encrypt/decrypt with establishSessions", () => {
    const aliceId = kp();
    const bobId = kp();
    const bobSpk = kp();
    let { alice, bob } = establishSessions({
      remoteAddress: "bob",
      aliceIdentity: aliceId,
      bobIdentity: bobId,
      bobSignedPreKey: bobSpk,
    });

    const pt = Buffer.from("hello from alice");
    const enc = signalEncrypt(alice, pt);
    alice = enc.session;
    const dec = signalDecrypt(bob, enc.message);
    expect(dec.plaintext.toString()).toBe("hello from alice");
  });

  it("multi-message chain", () => {
    const aliceId = kp();
    const bobId = kp();
    const bobSpk = kp();
    let { alice, bob } = establishSessions({
      remoteAddress: "bob",
      aliceIdentity: aliceId,
      bobIdentity: bobId,
      bobSignedPreKey: bobSpk,
    });

    for (const text of ["one", "two", "three"]) {
      const enc = signalEncrypt(alice, Buffer.from(text));
      alice = enc.session;
      const dec = signalDecrypt(bob, enc.message);
      bob = dec.session;
      expect(dec.plaintext.toString()).toBe(text);
    }
  });

  it("protobuf over signal", () => {
    const aliceId = kp();
    const bobId = kp();
    const bobSpk = kp();
    let { alice, bob } = establishSessions({
      remoteAddress: "bob",
      aliceIdentity: aliceId,
      bobIdentity: bobId,
      bobSignedPreKey: bobSpk,
    });
    const proto = encodeWaMessageContent({ conversation: "e2e" });
    const enc = signalEncrypt(alice, proto);
    const dec = signalDecrypt(bob, encodeSignalWire(enc.message) && enc.message);
    expect(decodeWaMessageContent(dec.plaintext).conversation).toBe("e2e");
  });

  it("session manager", () => {
    const aliceId = kp();
    const bobId = kp();
    const bobSpk = kp();
    const { alice, bob } = establishSessions({
      remoteAddress: "bob",
      aliceIdentity: aliceId,
      bobIdentity: bobId,
      bobSignedPreKey: bobSpk,
    });
    const mgrA = new SignalSessionManager();
    const mgrB = new SignalSessionManager();
    mgrA.set("bob", alice);
    mgrB.set("alice", bob);
    const msg = mgrA.encrypt("bob", Buffer.from("mgr"));
    expect(mgrB.decrypt("alice", msg).toString()).toBe("mgr");
  });

  it("serialize roundtrip", () => {
    const aliceId = kp();
    const bobId = kp();
    const bobSpk = kp();
    const { alice } = establishSessions({
      remoteAddress: "bob",
      aliceIdentity: aliceId,
      bobIdentity: bobId,
      bobSignedPreKey: bobSpk,
    });
    const back = deserializeSession(serializeSession(alice));
    expect(back.remoteAddress).toBe("bob");
    expect(back.rootKey.equals(alice.rootKey)).toBe(true);
  });
});
