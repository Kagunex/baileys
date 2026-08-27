KaguneX Baileys

@kagunex/baileys "1.8.2" — WhatsApp Web client library for Node.js ≥ 18 (TypeScript).

Independent implementation maintained by KaguneX.

Not a runtime dependency of WhiskeySockets/Baileys.

Install

Install the latest public release from NPM:

npm install @kagunex/baileys

Check the installed version:

npm ls @kagunex/baileys
# @kagunex/baileys@1.8.2

CommonJS

const {
  default: makeWASocket,
  useMultiFileAuthState,
} = require("@kagunex/baileys");

console.log(typeof makeWASocket); // function
console.log(typeof useMultiFileAuthState); // function

ESM

import makeWASocket, {
  useMultiFileAuthState,
} from "@kagunex/baileys";

console.log(typeof makeWASocket); // function
console.log(typeof useMultiFileAuthState); // function

GitHub

Development source and repository:

git clone https://github.com/Kagunex/baileys.git
cd baileys
npm install

Or install directly from GitHub:

npm install github:Kagunex/baileys

The NPM package identity is:

@kagunex/baileys@1.8.2

Quick Start

import makeWASocket, {
  useMultiFileAuthState,
} from "@kagunex/baileys";

const { state, saveCreds } =
  await useMultiFileAuthState("./auth");

const sock = makeWASocket({
  auth: state,
});

sock.ev.on("creds.update", saveCreds);

sock.ev.on("connection.update", (update) => {
  console.log("connection:", update.connection);
});

Authentication

Keep the authentication directory out of Git.

auth/

Treat authentication credentials as sensitive information and never commit them to a public repository.

Requirements

- Node.js ≥ 18
- NPM
- TypeScript support
- WhatsApp account for authentication

Scripts

Install dependencies:

npm install

Build the project:

npm run build

Run tests:

npm test

Run verification:

npm run verify

Development

Clone the repository:

git clone https://github.com/Kagunex/baileys.git
cd baileys
npm install

Create your changes, test them, then build:

npm run build
npm test
npm run verify

Package

NPM:

@kagunex/baileys

Current version:

1.8.2

GitHub:

https://github.com/Kagunex/baileys

License

MIT © KaguneX
