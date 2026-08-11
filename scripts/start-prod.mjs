/**
 * Production entry for self-hosted Node (Nitro node-server output).
 * Loads `.env` when present, binds HOST=0.0.0.0 by default, then starts Nitro.
 *
 * Usage:
 *   node scripts/start-prod.mjs
 *   npm start
 *   pm2 start ecosystem.config.cjs
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

function loadEnvFileIfPresent(filePath = path.resolve(process.cwd(), ".env")) {
  if (!existsSync(filePath)) return;
  const text = readFileSync(filePath, "utf8");
  for (const rawLine of text.split(/\r?\n/)) {
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

process.env.HOST ||= process.env.NITRO_HOST || "0.0.0.0";
process.env.PORT ||= process.env.NITRO_PORT || "3000";
process.env.NITRO_PRESET ||= "node-server";

const required = ["DATABASE_URL", "BETTER_AUTH_SECRET", "BETTER_AUTH_URL"];
const missing = required.filter((k) => !process.env[k]?.trim());
if (missing.length) {
  console.error(
    `[start] Missing required env: ${missing.join(", ")}. Copy .env.example → .env (or set PM2 env).`,
  );
  process.exit(1);
}

const serverEntry = path.resolve(process.cwd(), ".output/server/index.mjs");
if (!existsSync(serverEntry)) {
  console.error(
    `[start] Missing ${serverEntry}. Run \`npm run build\` first (Nitro node-server output).`,
  );
  process.exit(1);
}

console.info(
  `[start] Node server → http://${process.env.HOST}:${process.env.PORT} (BETTER_AUTH_URL=${process.env.BETTER_AUTH_URL})`,
);

await import(pathToFileURL(serverEntry).href);
