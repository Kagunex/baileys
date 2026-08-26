/**
 * QR login is NOT IMPLEMENTED until Noise handshake produces a real ref payload.
 * This example only observes connection.update without expecting a scannable QR.
 */
import makeWASocket, { useMultiFileAuthState } from "../src/index.js";

const { state, saveCreds } = await useMultiFileAuthState("./auth");
const sock = makeWASocket({ auth: state, printQRInTerminal: false });
sock.ev.on("creds.update", saveCreds);
sock.ev.on("connection.update", (u) => {
  console.log("connection:", u.connection);
  if (u.qr) {
    console.log("qr present (only after real auth flow is implemented)");
  }
  if (u.connection === "close") process.exit(0);
});
setTimeout(() => sock.end(), 4000);
