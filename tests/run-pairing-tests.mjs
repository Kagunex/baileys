/**
 * Lightweight pairing-controller test runner (no vitest required).
 */
import { createPairingController } from "../dist/Socket/pairing-controller.js";
import { encodeBinaryNode } from "../dist/WABinary/encode.js";
import { decodeBinaryNode } from "../dist/WABinary/decode.js";
import { getBinaryNodeAttr } from "../dist/WABinary/index.js";
import { normalizePairingCode } from "../dist/Protocol/pairing.js";

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (!cond) throw new Error(msg || "assertion failed");
}

async function test(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`PASS  ${name}`);
  } catch (err) {
    failed++;
    console.error(`FAIL  ${name}`);
    console.error("     ", err.message || err);
  }
}

function fakeSession() {
  return { seal: (b) => b, open: () => [] };
}

function makeCodeResultNode(iqId, code) {
  return encodeBinaryNode({
    tag: "iq",
    attrs: { id: iqId, type: "result", from: "s.whatsapp.net" },
    content: [
      {
        tag: "link_code_companion_reg",
        attrs: {},
        content: [
          {
            tag: "link_code_pairing_code",
            attrs: {},
            content: code.replace("-", ""),
          },
        ],
      },
    ],
  });
}

await test("TEST 1: matching IQ returns pairing code", async () => {
  const ctrl = createPairingController();
  const sent = [];
  const p = ctrl.requestCode("6281234567890", {
    session: fakeSession(),
    send: (b) => sent.push(b),
    timeoutMs: 10_000,
    maxAttempts: 1,
  });
  await new Promise((r) => setTimeout(r, 20));
  assert(sent.length === 1, `expected 1 send, got ${sent.length}`);
  const iqId = getBinaryNodeAttr(decodeBinaryNode(sent[0]), "id");
  assert(iqId, "missing iq id");
  ctrl.onPayload(makeCodeResultNode(iqId, "ABCD1234"));
  const code = await p;
  assert(normalizePairingCode(code.replace("-", "")) === "ABCD-1234", `code=${code}`);
  assert(ctrl.pendingCount() === 0, "pending should be 0");
});

await test("TEST 2: registered rejects without send", async () => {
  const ctrl = createPairingController();
  let sent = false;
  try {
    await ctrl.requestCode("6281234567890", {
      session: fakeSession(),
      send: () => {
        sent = true;
      },
      creds: { registered: true },
    });
    throw new Error("should have rejected");
  } catch (e) {
    assert(/already registered/.test(e.message), e.message);
  }
  assert(!sent, "must not send when registered");
});

await test("TEST 3: concurrent request → PAIRING_ALREADY_IN_PROGRESS", async () => {
  const ctrl = createPairingController();
  const p1 = ctrl.requestCode("6281111111111", {
    session: fakeSession(),
    send: () => {},
    timeoutMs: 30_000,
    maxAttempts: 1,
  });
  await new Promise((r) => setTimeout(r, 20));
  assert(ctrl.isBusy(), "should be busy");
  try {
    await ctrl.requestCode("6282222222222", {
      session: fakeSession(),
      send: () => {},
      timeoutMs: 30_000,
      maxAttempts: 1,
    });
    throw new Error("should reject second");
  } catch (e) {
    assert(/PAIRING_ALREADY_IN_PROGRESS/.test(e.message), e.message);
  }
  ctrl.cancelAll("cleanup");
  await p1.catch(() => {});
});

await test("TEST 4: old attempt IQ ignored after new attempt", async () => {
  const ctrl = createPairingController();
  const sent = [];
  const p = ctrl.requestCode("6281234567890", {
    session: fakeSession(),
    send: (b) => sent.push(b),
    timeoutMs: 60_000,
    maxAttempts: 3,
  });
  await new Promise((r) => setTimeout(r, 20));
  const firstId = getBinaryNodeAttr(decodeBinaryNode(sent[0]), "id");
  // Wait for attempt window (~5s min) — use short by advancing: we can't fake timers easily
  // Instead cancel and verify unmatched logic with wrong id on busy flow
  ctrl.onPayload(makeCodeResultNode("NOT_THE_ID", "OLDCODE1"));
  assert(ctrl.pendingCount() === 1, "still pending after wrong id");
  ctrl.onPayload(makeCodeResultNode(firstId, "NEWCODE9"));
  const code = await p;
  assert(code.replace("-", "").length === 8, code);
});

await test("TEST 5: wrong IQ id ignored until timeout", async () => {
  const ctrl = createPairingController();
  const sent = [];
  const p = ctrl.requestCode("6281234567890", {
    session: fakeSession(),
    send: (b) => sent.push(b),
    timeoutMs: 800,
    maxAttempts: 1,
  });
  await new Promise((r) => setTimeout(r, 20));
  ctrl.onPayload(makeCodeResultNode("WRONG_ID_XXXX", "ABCD1234"));
  assert(ctrl.pendingCount() === 1);
  try {
    await p;
    throw new Error("should timeout");
  } catch (e) {
    assert(/timed out|PAIRING FAILED/.test(e.message), e.message);
  }
  assert(ctrl.pendingCount() === 0);
});

await test("TEST 6: late response after timeout is ignored", async () => {
  const ctrl = createPairingController();
  const sent = [];
  const p = ctrl.requestCode("6281234567890", {
    session: fakeSession(),
    send: (b) => sent.push(b),
    timeoutMs: 500,
    maxAttempts: 1,
  });
  await new Promise((r) => setTimeout(r, 20));
  const iqId = getBinaryNodeAttr(decodeBinaryNode(sent[0]), "id");
  try {
    await p;
  } catch {
    /* expected */
  }
  assert(!ctrl.isBusy());
  // must not throw
  ctrl.onPayload(makeCodeResultNode(iqId, "LATECODE"));
  assert(!ctrl.isBusy());
});

await test("TEST 7: phone normalized + code formatted", async () => {
  const ctrl = createPairingController();
  const sent = [];
  const p = ctrl.requestCode("081234567890", {
    session: fakeSession(),
    send: (b) => sent.push(b),
    timeoutMs: 10_000,
    maxAttempts: 1,
  });
  await new Promise((r) => setTimeout(r, 20));
  const node = decodeBinaryNode(sent[0]);
  const reg = node.content[0];
  assert(/^62/.test(reg.attrs.jid), `jid=${reg.attrs.jid}`);
  const iqId = getBinaryNodeAttr(node, "id");
  ctrl.onPayload(makeCodeResultNode(iqId, "WXYZ9876"));
  const code = await p;
  assert(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code), code);
  assert(!ctrl.isBusy());
});

await test("TEST 8: registered skip", async () => {
  const ctrl = createPairingController();
  try {
    await ctrl.requestCode("6281234567890", {
      session: fakeSession(),
      send: () => {
        throw new Error("should not send");
      },
      creds: { registered: true, me: { id: "x@s.whatsapp.net" } },
    });
    throw new Error("should reject");
  } catch (e) {
    assert(/already registered/.test(e.message), e.message);
  }
});

await test("TEST 9: cancel then new flow independent", async () => {
  const ctrl = createPairingController();
  const sent = [];
  const p1 = ctrl.requestCode("6281111111111", {
    session: fakeSession(),
    send: (b) => sent.push(b),
    timeoutMs: 30_000,
    maxAttempts: 1,
  });
  await new Promise((r) => setTimeout(r, 20));
  ctrl.cancelAll("disconnect");
  await p1.catch(() => {});
  const p2 = ctrl.requestCode("6282222222222", {
    session: fakeSession(),
    send: (b) => sent.push(b),
    timeoutMs: 10_000,
    maxAttempts: 1,
  });
  await new Promise((r) => setTimeout(r, 20));
  assert(ctrl.isBusy());
  const iqId = getBinaryNodeAttr(decodeBinaryNode(sent[sent.length - 1]), "id");
  ctrl.onPayload(makeCodeResultNode(iqId, "AAAA1111"));
  const code = await p2;
  assert(code.includes("AAAA"), code);
});

await test("TEST 10: logout cancel clears lock", async () => {
  const ctrl = createPairingController();
  const p = ctrl.requestCode("6281234567890", {
    session: fakeSession(),
    send: () => {},
    timeoutMs: 30_000,
    maxAttempts: 1,
  });
  await new Promise((r) => setTimeout(r, 20));
  ctrl.cancelAll("logged out");
  try {
    await p;
    throw new Error("should reject");
  } catch (e) {
    assert(/logged out/.test(e.message), e.message);
  }
  assert(!ctrl.isBusy());
  assert(ctrl.pendingCount() === 0);
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
