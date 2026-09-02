# @kagunex/baileys

KaguneX WhatsApp Web client library for Node.js (TypeScript).

A lightweight, TypeScript-first WhatsApp Web multi-device client with first-class pairing code support and multi-file auth state.

## Requirements

- Node.js >= 18

## Install

```bash
npm install @kagunex/baileys
```

## Quick Start (Pairing Code)

```ts
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
} from "@kagunex/baileys";

const { state, saveCreds } = await useMultiFileAuthState("auth_info");

const sock = makeWASocket({
  auth: state,
  printQRInTerminal: false,
});

sock.ev.on("creds.update", saveCreds);

sock.ev.on("connection.update", async (update) => {
  const { connection, lastDisconnect } = update;
  if (connection === "open") {
    console.log("connected");
  }
  if (connection === "close") {
    const status = (lastDisconnect?.error as any)?.output?.statusCode;
    console.log("closed", status);
  }
});

// Wait for real protocol readiness (Noise + client payload), then request code
const code = await sock.requestPairingCode("6281234567890");
console.log("Pairing code:", code);
```

You can also wait explicitly:

```ts
await sock.waitForPairingReady(60_000);
const code = await sock.requestPairingCode("6281234567890");
```

## Auth

```ts
import { useMultiFileAuthState } from "@kagunex/baileys";

const { state, saveCreds } = await useMultiFileAuthState("./auth");
```

Registered sessions reconnect without requesting a new pairing code.

## Exports

Main entry provides:

- `makeWASocket` / default export
- `useMultiFileAuthState`
- `initAuthCreds`, credential helpers
- Types: `WASocket`, `SocketConfig`, `AuthenticationState`, etc.
- Utilities: `normalizePairingPhone`, `formatPairingCode`, `printQRInTerminal`

See TypeScript declarations in `dist/index.d.ts` for the full surface.

## Build / Verify (from source)

```bash
npm install
npm run build
npm run verify
npm test
```

## License

MIT
