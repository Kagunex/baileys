# KaguneX Baileys

**@kagunex/baileys** `1.8.1` — WhatsApp Web client library for Node.js ≥ 18 (TypeScript).

Independent implementation. Not a runtime dependency of WhiskeySockets/Baileys.

## Install (NPM — primary)

```bash
npm install @kagunex/baileys
```

```bash
npm ls @kagunex/baileys
# @kagunex/baileys@1.8.1
```

### CommonJS

```js
const {
  default: makeWASocket,
  useMultiFileAuthState,
} = require("@kagunex/baileys");

console.log(typeof makeWASocket); // function
console.log(typeof useMultiFileAuthState); // function
```

### ESM

```js
import makeWASocket, {
  useMultiFileAuthState,
} from "@kagunex/baileys";

console.log(typeof makeWASocket); // function
console.log(typeof useMultiFileAuthState); // function
```

### GitHub (development / fallback)

```bash
npm install github:remzzxelipsce/Kagunex-baileys
```

Package identity remains `@kagunex/baileys@1.8.1`.

## Quick start

```ts
import makeWASocket, { useMultiFileAuthState } from "@kagunex/baileys";

const { state, saveCreds } = await useMultiFileAuthState("./auth");
const sock = makeWASocket({ auth: state });

sock.ev.on("creds.update", saveCreds);
sock.ev.on("connection.update", (u) => {
  console.log("connection:", u.connection);
});
```

Keep `./auth` out of git. Treat credentials as secret.

## Scripts

```bash
npm install
npm run build
npm test
npm run verify
```

## License

MIT © KaguneX
