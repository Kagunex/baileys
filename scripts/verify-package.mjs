/**
 * Post-build verification: CJS require + ESM import against dist.
 */
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const distJs = path.join(root, "dist/index.js");
const distCjs = path.join(root, "dist/index.cjs");
const distDts = path.join(root, "dist/index.d.ts");

function mustExist(file) {
  if (!existsSync(file)) {
    console.error("MISSING:", file);
    process.exit(1);
  }
  console.log("OK exists:", path.relative(root, file));
}

mustExist(distJs);
mustExist(distCjs);
mustExist(distDts);

// CJS
const require = createRequire(import.meta.url);
const cjs = require(distCjs);
const cjsDefault = cjs.default ?? cjs;
console.log("CJS default:", typeof cjsDefault);
console.log("CJS useMultiFileAuthState:", typeof cjs.useMultiFileAuthState);
console.log("CJS initAuthCreds:", typeof cjs.initAuthCreds);
console.log("CJS makeCacheableSignalKeyStore:", typeof cjs.makeCacheableSignalKeyStore);
console.log("CJS DisconnectReason:", typeof cjs.DisconnectReason);

if (typeof cjsDefault !== "function") {
  console.error("FAIL: CJS default is not a function");
  process.exit(1);
}
if (typeof cjs.useMultiFileAuthState !== "function") {
  console.error("FAIL: CJS useMultiFileAuthState is not a function");
  process.exit(1);
}
if (typeof cjs.DisconnectReason !== "object" || cjs.DisconnectReason == null) {
  console.error("FAIL: CJS DisconnectReason missing");
  process.exit(1);
}

// ESM
const esm = await import(pathToFileURL(distJs).href);
const esmDefault = esm.default;
console.log("ESM default:", typeof esmDefault);
console.log("ESM useMultiFileAuthState:", typeof esm.useMultiFileAuthState);

if (typeof esmDefault !== "function") {
  console.error("FAIL: ESM default is not a function");
  process.exit(1);
}
if (typeof esm.useMultiFileAuthState !== "function") {
  console.error("FAIL: ESM useMultiFileAuthState is not a function");
  process.exit(1);
}

console.log("VERIFY PASS");
