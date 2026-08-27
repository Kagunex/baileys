/**
 * Pairing code example.
 * Requires an active Noise session (socket connected past handshake).
 */
import makeWASocket, { useMultiFileAuthState } from "../src/index.js";

const { state, saveCreds } = await useMultiFileAuthState("./auth");
const sock = makeWASocket({ auth: state, printQRInTerminal: false });
sock.ev.on("creds.update", saveCreds);

sock.ev.on("connection.update", async (u) => {
  console.log("connection:", u.connection);
  if (u.connection === "connecting") {
    // May still fail if server rejects IQ — that is expected until fully accepted.
    try {
      // Uncomment with a real number you own:
      // const code = await sock.requestPairingCode("6281234567890");
      // console.log("pairing code:", code);
    } catch (err) {
      console.log("pairing:", (err as Error).message);
    }
  }
});

setTimeout(() => sock.end(), 15_000);
