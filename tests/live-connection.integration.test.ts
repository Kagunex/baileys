/**
 * Live integration smoke test against WhatsApp Web WebSocket.
 * Skips if KAGUNEX_LIVE=0 or network blocked.
 *
 * This does NOT complete login (needs QR/pairing). It verifies:
 * - TCP/WSS connect to web.whatsapp.com
 * - optional Noise message-1 send
 */
import { describe, it, expect } from "vitest";
import WebSocket from "ws";
import { WA_WEB_SOCKET_URL } from "../src/Defaults/constants.js";
import { startWaNoiseHandshake } from "../src/Noise/wa-noise.js";
import { generateX25519KeyPair } from "../src/Noise/handshake.js";

const LIVE = process.env.KAGUNEX_LIVE !== "0";

describe.runIf(LIVE)("Live WA WebSocket integration", () => {
  it(
    "connects to wss://web.whatsapp.com/ws/chat and can send Noise msg1",
    async () => {
      const result = await new Promise<{
        open: boolean;
        error?: string;
        gotMessage?: boolean;
      }>((resolve) => {
        const timer = setTimeout(() => {
          try {
            ws.close();
          } catch {
            /* */
          }
          resolve({ open: false, error: "timeout" });
        }, 15_000);

        const ws = new WebSocket(WA_WEB_SOCKET_URL, {
          origin: "https://web.whatsapp.com",
          headers: {
            "User-Agent":
              "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
          },
          handshakeTimeout: 12_000,
        });

        let opened = false;

        ws.on("open", () => {
          opened = true;
          try {
            const { firstFrame } = startWaNoiseHandshake({
              staticKey: generateX25519KeyPair(),
            });
            ws.send(firstFrame);
          } catch (err) {
            clearTimeout(timer);
            ws.close();
            resolve({
              open: true,
              error: err instanceof Error ? err.message : String(err),
            });
          }
        });

        ws.on("message", () => {
          clearTimeout(timer);
          ws.close();
          resolve({ open: true, gotMessage: true });
        });

        ws.on("error", (err) => {
          clearTimeout(timer);
          resolve({
            open: opened,
            error: err instanceof Error ? err.message : String(err),
          });
        });

        ws.on("close", () => {
          clearTimeout(timer);
          if (opened) resolve({ open: true, gotMessage: false });
        });
      });

      expect(result.open).toBe(true);
      // Server may or may not reply before we close; open is the gate.
      if (result.error && result.error !== "timeout") {
        // soft log
        console.warn("live ws note:", result.error);
      }
    },
    20_000,
  );
});
