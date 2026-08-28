/**
 * Dual package build: ESM + CJS bundles via esbuild (JS API), declarations via tsc.
 * Uses the programmatic API to avoid CLI shebang / permission / multi-input issues on Termux/Android.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, chmodSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const require = createRequire(import.meta.url);

function run(cmd, args) {
  console.log(">", cmd, args.join(" "));
  const r = spawnSync(cmd, args, { cwd: root, stdio: "inherit", shell: false });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

function findTsc() {
  const candidates = [
    path.join(root, "node_modules/typescript/bin/tsc"),
    "/tmp/ts/package/bin/tsc",
  ];
  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  return "tsc";
}

/** Ensure native esbuild binary is executable (common on Termux / some FS). */
function ensureEsbuildBinaryExecutable() {
  const candidates = [
    path.join(root, "node_modules/@esbuild/linux-x64/bin/esbuild"),
    path.join(root, "node_modules/@esbuild/android-arm64/bin/esbuild"),
    path.join(root, "node_modules/@esbuild/android-arm/bin/esbuild"),
    path.join(root, "node_modules/@esbuild/linux-arm64/bin/esbuild"),
  ];
  for (const bin of candidates) {
    if (existsSync(bin)) {
      try {
        chmodSync(bin, 0o755);
      } catch {
        /* ignore */
      }
    }
  }
}

mkdirSync(dist, { recursive: true });
ensureEsbuildBinaryExecutable();

// Prefer programmatic esbuild API (more reliable across platforms)
let esbuild;
try {
  esbuild = require("esbuild");
} catch (e) {
  console.error("esbuild not found. Run: npm install");
  process.exit(1);
}

const common = {
  entryPoints: [path.join(root, "src/index.ts")],
  bundle: true,
  platform: "node",
  target: "node18",
  packages: "external",
  logLevel: "info",
};

console.log("> esbuild (ESM) src/index.ts -> dist/index.js");
await esbuild.build({
  ...common,
  format: "esm",
  outfile: path.join(dist, "index.js"),
});

console.log("> esbuild (CJS) src/index.ts -> dist/index.cjs");
await esbuild.build({
  ...common,
  format: "cjs",
  outfile: path.join(dist, "index.cjs"),
});

// Declarations via tsc
const tsc = findTsc();
run(tsc, ["-p", "tsconfig.build.json", "--pretty", "false"]);

for (const f of ["dist/index.js", "dist/index.cjs", "dist/index.d.ts"]) {
  if (!existsSync(path.join(root, f))) {
    console.error("MISSING", f);
    process.exit(1);
  }
  console.log("OK", f);
}

console.log("BUILD COMPLETE");
