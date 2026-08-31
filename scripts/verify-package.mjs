#!/usr/bin/env node
import { existsSync, readFileSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));

const checks = [];
function check(name, ok, detail = "") {
  checks.push({ name, ok, detail });
  console.log(`[${ok ? "PASS" : "FAIL"}] ${name}${detail ? " — " + detail : ""}`);
}

const main = join(root, pkg.main || "dist/index.cjs");
const mod = join(root, pkg.module || "dist/index.js");
const types = join(root, pkg.types || "dist/index.d.ts");

check("main (CJS) exists", existsSync(main), pkg.main);
check("module (ESM) exists", existsSync(mod), pkg.module);
check("types exists", existsSync(types), pkg.types);
check("main non-empty", existsSync(main) && statSync(main).size > 100);
check("module non-empty", existsSync(mod) && statSync(mod).size > 100);
check("types non-empty", existsSync(types) && statSync(types).size > 100);

try {
  const require = createRequire(import.meta.url);
  const cjs = require(main);
  // Allow async warm for CJS↔ESM bridge
  if (typeof cjs.then === "function" && typeof cjs.makeWASocket !== "function") {
    await Promise.race([
      cjs,
      new Promise((r) => setTimeout(r, 2000)),
    ]);
  }
  // small delay for property redefine
  await new Promise((r) => setTimeout(r, 300));
  const fn = cjs.default || cjs.makeWASocket;
  check("CJS default/makeWASocket is function", typeof fn === "function");
  check("CJS useMultiFileAuthState is function", typeof cjs.useMultiFileAuthState === "function");
} catch (err) {
  check("CJS require", false, String(err));
}

try {
  const esm = await import(pathToFileURL(mod).href);
  check("ESM default is function", typeof esm.default === "function");
  check("ESM useMultiFileAuthState is function", typeof esm.useMultiFileAuthState === "function");
  check("ESM makeWASocket is function", typeof esm.makeWASocket === "function");
} catch (err) {
  check("ESM import", false, String(err));
}

check("name is @kagunex/baileys", pkg.name === "@kagunex/baileys");
check("version is 1.8.3", pkg.version === "1.8.3");

const failed = checks.filter((c) => !c.ok);
if (failed.length) {
  console.error(`\nVERIFY FAIL: ${failed.length} check(s) failed`);
  process.exit(1);
}
console.log("\nVERIFY OK");
