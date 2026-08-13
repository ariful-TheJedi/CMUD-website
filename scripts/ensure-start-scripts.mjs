#!/usr/bin/env node
/**
 * Ensures package.json has production start scripts for self-hosted Node.
 * Safe to run on the VM if `npm start` says "Missing script: start".
 *
 *   node ./scripts/ensure-start-scripts.mjs
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const pkgPath = path.join(root, "package.json");
const startCmd = "node ./scripts/start-prod.mjs";

if (!existsSync(pkgPath)) {
  console.error("[ensure-start] No package.json in", root);
  process.exit(1);
}

const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
pkg.scripts ??= {};

const before = { ...pkg.scripts };
pkg.scripts.build ??= "vite build";
pkg.scripts.start = startCmd;
pkg.scripts.preview = startCmd;
pkg.scripts.serve = startCmd;
pkg.scripts.prod ??= "npm run build && npm start";

writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`, "utf8");

console.log("[ensure-start] Updated scripts in", pkgPath);
console.log("  start   :", pkg.scripts.start);
console.log("  preview :", pkg.scripts.preview);
console.log("  serve   :", pkg.scripts.serve);

if (!existsSync(path.join(root, "scripts/start-prod.mjs"))) {
  console.error(
    "[ensure-start] Missing scripts/start-prod.mjs — run: git pull origin main",
  );
  process.exit(1);
}

if (!existsSync(path.join(root, ".output/server/index.mjs"))) {
  console.log("[ensure-start] No build yet. Next: npm run build && npm start");
} else {
  console.log("[ensure-start] Build found. Next: npm start");
}

const removed = Object.keys(before).filter((k) => !(k in pkg.scripts));
if (removed.length) console.log("[ensure-start] (unchanged keys kept)");
