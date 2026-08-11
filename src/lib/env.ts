/**
 * Central server env helpers for self-hosted Node (dev, `npm start`, PM2).
 * Prefer process.env (from `--env-file=.env`, systemd, or PM2 env).
 * Optionally load a local `.env` when the file exists (PM2 / bare node without --env-file).
 */

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

let envFileLoaded = false;

/** Parse a simple KEY=VALUE .env file into process.env (does not override existing keys). */
export function loadEnvFileIfPresent(filePath = path.resolve(process.cwd(), ".env")): void {
  if (envFileLoaded) return;
  envFileLoaded = true;
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

export function requireEnv(name: string, hint?: string): string {
  loadEnvFileIfPresent();
  const value = process.env[name]?.trim();
  if (value) return value;
  const extra = hint ? ` ${hint}` : "";
  console.error(`[env] Missing required ${name}.${extra}`);
  throw new Error(`Missing required environment variable: ${name}.${extra}`);
}

export function optionalEnv(name: string, fallback = ""): string {
  loadEnvFileIfPresent();
  return process.env[name]?.trim() || fallback;
}

export function normalizeOrigin(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

/** Common local/dev ports allowed alongside BETTER_AUTH_URL. */
const DEFAULT_LOCAL_ORIGINS = [
  "http://localhost:8080",
  "http://127.0.0.1:8080",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
];

/**
 * Build Better Auth trustedOrigins from BETTER_AUTH_URL + BETTER_AUTH_TRUSTED_ORIGINS.
 * Also adds the same hostname on common ports to reduce "Invalid origin" on VMs.
 */
export function buildTrustedOrigins(baseURL: string): string[] {
  const extras = optionalEnv("BETTER_AUTH_TRUSTED_ORIGINS")
    .split(",")
    .map((o) => normalizeOrigin(o))
    .filter(Boolean);

  const origins = new Set<string>([...DEFAULT_LOCAL_ORIGINS, normalizeOrigin(baseURL), ...extras]);

  try {
    const u = new URL(baseURL);
    const host = u.hostname;
    const proto = u.protocol;
    for (const port of ["3000", "8080", "4173", "80", "443"]) {
      if (port === "80" && proto === "http:") origins.add(`http://${host}`);
      else if (port === "443" && proto === "https:") origins.add(`https://${host}`);
      else origins.add(`${proto}//${host}:${port}`);
    }
  } catch (err) {
    console.error("[env] BETTER_AUTH_URL is not a valid URL:", baseURL, err);
  }

  return [...origins];
}

export type AppEnv = {
  databaseUrl: string;
  betterAuthSecret: string;
  betterAuthUrl: string;
  trustedOrigins: string[];
  host: string;
  port: string;
};

/** Validate production-critical env once; safe to call from db/auth modules. */
export function getAppEnv(): AppEnv {
  loadEnvFileIfPresent();

  const databaseUrl = requireEnv(
    "DATABASE_URL",
    "Example: postgresql://user:pass@127.0.0.1:5432/medlearhub",
  );
  const betterAuthSecret = requireEnv(
    "BETTER_AUTH_SECRET",
    "Use a long random string (32+ chars).",
  );
  const betterAuthUrl = normalizeOrigin(
    optionalEnv("BETTER_AUTH_URL", "http://localhost:8080"),
  );

  if (betterAuthSecret.length < 16) {
    console.error("[env] BETTER_AUTH_SECRET should be at least 16 characters.");
  }

  return {
    databaseUrl,
    betterAuthSecret,
    betterAuthUrl,
    trustedOrigins: buildTrustedOrigins(betterAuthUrl),
    host: optionalEnv("HOST", optionalEnv("NITRO_HOST", "0.0.0.0")),
    port: optionalEnv("PORT", optionalEnv("NITRO_PORT", "3000")),
  };
}
