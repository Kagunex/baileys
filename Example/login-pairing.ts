/**
 * PRIORITY #1 — Pairing code login + persist + reconnect without pairing.
 *
 * Flow:
 * 1. useMultiFileAuthState("./auth")
 * 2. If not registered → requestPairingCode after socket is ready
 *    (Noise + client payload). Retries on WAITING_FOR_SOCKET_READY.
 * 3. saveCreds on every creds.update
 * 4. Restart process → should resume as registered (no pairing)
 */
import makeWASocket, { useMultiFileAuthState, DisconnectStatus } from "../src/index.js";

const { state, saveCreds } = await useMultiFileAuthState("./auth");

const sock = makeWASocket({
  auth: state,
  printQRInTerminal: true,
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

let pairingRequested = false;

async function tryRequestPairing(phone: string, retries = 15) {
  if (pairingRequested || state.creds.registered) return;
  pairingRequested = true;
  for (let i = 0; i < retries; i++) {
    try {
      console.log("requesting pairing code for", phone, `(attempt ${i + 1})`);
      const code = await sock.requestPairingCode(phone);
      console.log("PAIRING CODE:", code);
      console.log("Enter this code on your primary WhatsApp device.");
      return;
    } catch (err) {
      const msg = (err as Error).message || "";
      if (msg.includes("WAITING_FOR_SOCKET_READY")) {
        pairingRequested = false;
        await new Promise((r) => setTimeout(r, 500));
        pairingRequested = true;
        continue;
      }
      if (msg.includes("PAIRING_ALREADY_IN_PROGRESS")) {
        console.log("pairing already in progress");
        return;
      }
      if (msg.includes("already registered")) {
        console.log("already registered — skip pairing");
        return;
      }
      console.error("pairing failed:", msg);
      pairingRequested = false;
      return;
    }
  }
  pairingRequested = false;
  console.error("pairing failed: socket never became ready");
}

sock.ev.on("connection.update", async (u) => {
  console.log(
    "connection:",
    u.connection,
    u.qr ? "qr=yes" : "",
    u.isNewLogin ? "newLogin" : "",
  );

  if (u.qr) {
    console.log("QR payload length:", u.qr.length);
  }

  // After Noise path starts connecting, try pairing when not registered
  if (u.connection === "connecting" && !state.creds.registered) {
    const phone = process.env.PAIR_PHONE || "6281234567890";
    void tryRequestPairing(phone);
  }

  if (u.connection === "open") {
    console.log("LOGGED IN as", sock.user?.id || state.creds.me?.id);
  }

  if (u.connection === "close") {
    const err = u.lastDisconnect?.error as
      | { isLoggedOut?: boolean; statusCode?: number }
      | undefined;
    if (err?.isLoggedOut || err?.statusCode === DisconnectStatus.loggedOut) {
      console.log("LOGGED OUT — delete ./auth to start fresh or pair again");
    } else {
      console.log("disconnected — library may reconnect if not intentional");
    }
  }
});
