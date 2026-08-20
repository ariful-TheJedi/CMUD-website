/**
 * One-time migrate: move project `public/media` + `public/attachment`
 * into the external assets root (ASSETS_ROOT / cmud-assets).
 *
 * Site icon lives in `src/assets/favicon.png` (bundled), not under public/.
 *
 * Usage (on VPS, from app root):
 *   ASSETS_ROOT=/www/wwwroot/cmud-assets node scripts/migrate-public-to-assets.mjs
 *
 * Or with .env already set:
 *   node scripts/migrate-public-to-assets.mjs
 *
 * Safe to re-run: copies then removes sources under public/{media,attachment}.
 */
import { existsSync, mkdirSync, readdirSync, rmSync, statSync, copyFileSync, readFileSync } from "node:fs";
import path from "node:path";

function loadEnvFileIfPresent(filePath = path.resolve(process.cwd(), ".env")) {
  if (!existsSync(filePath)) return;
  for (const rawLine of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    if (!key || process.env[key] !== undefined) continue;
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

loadEnvFileIfPresent();

const projectRoot = process.env.PROJECT_ROOT?.trim() || process.cwd();
const assetsRoot =
  process.env.ASSETS_ROOT?.trim() ||
  process.env.PUBLIC_ASSETS_DIR?.trim() ||
  path.resolve(projectRoot, "..", "cmud-assets");

const publicDir = path.join(projectRoot, "public");
const folders = ["media", "attachment"];

function copyRecursive(src, dest) {
  if (!existsSync(src)) return 0;
  mkdirSync(dest, { recursive: true });
  let count = 0;
  for (const name of readdirSync(src)) {
    const from = path.join(src, name);
    const to = path.join(dest, name);
    const st = statSync(from);
    if (st.isDirectory()) {
      count += copyRecursive(from, to);
    } else {
      mkdirSync(path.dirname(to), { recursive: true });
      copyFileSync(from, to);
      count += 1;
    }
  }
  return count;
}

console.info(`[migrate] project=${projectRoot}`);
console.info(`[migrate] assets =${assetsRoot}`);

if (!existsSync(publicDir)) {
  console.error(`[migrate] No public/ at ${publicDir}`);
  process.exit(1);
}

mkdirSync(assetsRoot, { recursive: true });

let total = 0;
for (const folder of folders) {
  const src = path.join(publicDir, folder);
  const dest = path.join(assetsRoot, folder);
  if (!existsSync(src)) {
    console.info(`[migrate] skip missing ${src}`);
    continue;
  }
  const n = copyRecursive(src, dest);
  total += n;
  console.info(`[migrate] copied ${n} file(s) ${folder}/ → ${dest}`);
  rmSync(src, { recursive: true, force: true });
  console.info(`[migrate] removed ${src}`);
}

console.info(`[migrate] done. ${total} file(s).`);
console.info(`[migrate] Set ASSETS_ROOT=${assetsRoot} and rebuild if VITE_ASSETS_PREFIX changed.`);
console.info(`[migrate] Favicon is bundled from src/assets/favicon.png (not public/).`);
