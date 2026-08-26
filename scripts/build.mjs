/**
 * Dual package build: ESM + CJS bundles via esbuild, declarations via tsc.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");

function run(cmd, args) {
  console.log(">", cmd, args.join(" "));
  const r = spawnSync(cmd, args, { cwd: root, stdio: "inherit", shell: false });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

function findEsbuild() {
  const candidates = [
    path.join(root, "node_modules/esbuild/bin/esbuild"),
    path.join(root, "node_modules/@esbuild/linux-x64/bin/esbuild"),
    "/tmp/package/bin/esbuild",
  ];
  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  return "esbuild";
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

mkdirSync(dist, { recursive: true });
const esbuild = findEsbuild();
const tsc = findTsc();

// ESM bundle
run(esbuild, [
  "src/index.ts",
  "--bundle",
  "--platform=node",
  "--format=esm",
  "--outfile=dist/index.js",
  "--target=node18",
  "--packages=external",
]);

// CJS bundle
run(esbuild, [
  "src/index.ts",
  "--bundle",
  "--platform=node",
  "--format=cjs",
  "--outfile=dist/index.cjs",
  "--target=node18",
  "--packages=external",
]);

// Declarations
run(tsc, ["-p", "tsconfig.build.json", "--pretty", "false"]);

for (const f of ["dist/index.js", "dist/index.cjs", "dist/index.d.ts"]) {
  if (!existsSync(path.join(root, f))) {
    console.error("MISSING", f);
    process.exit(1);
  }
  console.log("OK", f);
}

console.log("BUILD COMPLETE");
