#!/usr/bin/env node
/**
 * Build script for @kagunex/baileys
 * 1. tsc → ESM + .d.ts in dist/
 * 2. esbuild → CJS bundle dist/index.cjs
 */

import { execSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");

function run(cmd, opts = {}) {
  console.log(`> ${cmd}`);
  execSync(cmd, { stdio: "inherit", cwd: root, ...opts });
}

// Clean
if (existsSync(dist)) {
  rmSync(dist, { recursive: true, force: true });
}
mkdirSync(dist, { recursive: true });

// TypeScript compile (ESM + declarations)
run("npx tsc -p tsconfig.build.json");

// Ensure package type is preserved for consumers that resolve subpaths
const indexJs = join(dist, "index.js");
if (!existsSync(indexJs)) {
  console.error("BUILD FAIL: dist/index.js was not emitted by tsc");
  process.exit(1);
}

// Bundle CJS entry
await esbuild.build({
  entryPoints: [join(root, "src/index.ts")],
  bundle: true,
  platform: "node",
  target: "node18",
  format: "cjs",
  outfile: join(dist, "index.cjs"),
  external: ["ws", "pino"],
  sourcemap: true,
});

// Verify required outputs
const required = ["index.js", "index.cjs", "index.d.ts"];
for (const f of required) {
  const p = join(dist, f);
  if (!existsSync(p)) {
    console.error(`BUILD FAIL: missing ${f}`);
    process.exit(1);
  }
}

console.log("BUILD OK");
console.log(
  required
    .map((f) => `  dist/${f} (${readFileSync(join(dist, f)).length} bytes)`)
    .join("\n"),
);
