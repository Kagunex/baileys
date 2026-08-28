/**
 * Basic socket bootstrap (experimental connection — no real login yet).
 *
 * Run after build:
 *   node --loader ts-node/esm Example/basic.ts
 * or compile and run against dist.
 */
import makeWASocket, { useMultiFileAuthState } from "../src/index.js";

const { state, saveCreds } = await useMultiFileAuthState("./auth");
const sock = makeWASocket({
  auth: state,
  printQRInTerminal: true,
});

sock.ev.on("creds.update", saveCreds);
sock.ev.on("connection.update", (u) => {
  console.log("[basic] connection:", u.connection, u.qr ? "qr=yes" : "");
  if (u.connection === "close") {
    console.log("[basic] closed — Noise login not implemented");
    process.exit(0);
  }
});

// Stop after a few seconds in example mode
setTimeout(() => {
  sock.end();
  process.exit(0);
}, 5000);
