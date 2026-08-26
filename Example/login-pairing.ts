/**
 * PRIORITY #1 — Pairing code login + persist + reconnect without pairing.
 *
 * Flow:
 * 1. useMultiFileAuthState("./auth")
 * 2. If not registered → requestPairingCode after Noise
 * 3. saveCreds on every creds.update
 * 4. Restart process → should resume as registered (no pairing)
 */
import makeWASocket, { useMultiFileAuthState, DisconnectStatus } from "../src/index.js";

const { state, saveCreds } = await useMultiFileAuthState("./auth");

const sock = makeWASocket({
  auth: state,
  printQRInTerminal: true, // also prints QR if server sends ref
});

sock.ev.on("creds.update", async (patch) => {
  Object.assign(state.creds, patch);
  await saveCreds();
  console.log("creds saved", {
    registered: state.creds.registered,
    me: state.creds.me?.id,
    pairingCode: state.creds.pairingCode,
  });
});

sock.ev.on("connection.update", async (u) => {
  console.log("connection:", u.connection, u.qr ? "qr=yes" : "", u.isNewLogin ? "newLogin" : "");

  if (u.qr) {
    console.log("QR payload length:", u.qr.length);
  }

  // After Noise + client payload, request pairing if not registered
  if (u.connection === "connecting" && !state.creds.registered) {
    // Small delay so client payload is sent first
    setTimeout(async () => {
      try {
        const phone = process.env.PAIR_PHONE || "6281234567890";
        console.log("requesting pairing code for", phone);
        const code = await sock.requestPairingCode(phone);
        console.log("PAIRING CODE:", code);
        console.log("Enter this code on your primary WhatsApp device.");
      } catch (err) {
        console.error("pairing failed:", (err as Error).message);
      }
    }, 2000);
  }

  if (u.connection === "open") {
    console.log("LOGGED IN as", sock.user?.id || state.creds.me?.id);
  }

  if (u.connection === "close") {
    const err = u.lastDisconnect?.error as { isLoggedOut?: boolean; statusCode?: number } | undefined;
    if (err?.isLoggedOut || err?.statusCode === DisconnectStatus.loggedOut) {
      console.log("LOGGED OUT — delete ./auth to start fresh or pair again");
    } else {
      console.log("disconnected — library may reconnect if not intentional");
    }
  }
});
