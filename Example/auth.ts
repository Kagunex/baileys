import { useMultiFileAuthState, initAuthCreds } from "../src/index.js";

const { state, saveCreds } = await useMultiFileAuthState("./auth");
console.log("registered:", state.creds.registered);
console.log("registrationId:", state.creds.registrationId);
await saveCreds();
console.log("creds saved to ./auth");

const fresh = initAuthCreds();
console.log("fresh registrationId:", fresh.registrationId);
