/**
 * Bootstrap one administrator via env vars (never hardcode credentials in source).
 *
 * Prerequisites:
 *   1. DATABASE_URL + BETTER_AUTH_SECRET in .env
 *   2. npm run auth:migrate
 *   3. Set SEED_ADMIN_EMAIL + SEED_ADMIN_PASSWORD in .env (or the shell)
 *
 * Usage:
 *   npm run auth:seed-admin
 *
 * The password is never logged. After first login, change it from Admin → Users.
 */
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { Pool } from "pg";

const ROLE = "administrator";
const MIN_PASSWORD_LENGTH = 12;

/** Load KEY=VALUE pairs from .env into process.env (does not override existing). */
function loadDotEnv() {
  const envPath = path.join(process.cwd(), ".env");
  if (!existsSync(envPath)) return;
  const text = readFileSync(envPath, "utf8");
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(
      `Missing ${name}. Set it in .env (see .env.example) — do not commit real passwords.`,
    );
  }
  return value;
}

async function main() {
  loadDotEnv();

  const databaseUrl = requireEnv("DATABASE_URL");
  requireEnv("BETTER_AUTH_SECRET");

  const email = requireEnv("SEED_ADMIN_EMAIL").toLowerCase();
  const password = requireEnv("SEED_ADMIN_PASSWORD");
  const name = (process.env.SEED_ADMIN_NAME?.trim() || "Administrator").slice(0, 120);

  if (!email.includes("@")) {
    throw new Error("SEED_ADMIN_EMAIL must be a valid email address.");
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(
      `SEED_ADMIN_PASSWORD must be at least ${MIN_PASSWORD_LENGTH} characters.`,
    );
  }

  const { auth } = await import("../src/lib/auth");
  const pool = new Pool({ connectionString: databaseUrl });

  try {
    const existing = await pool.query<{ id: string; role: string | null }>(
      `SELECT id, role FROM "user" WHERE email = $1 LIMIT 1`,
      [email],
    );

    if (existing.rows[0]) {
      await pool.query(`UPDATE "user" SET role = $1 WHERE id = $2`, [ROLE, existing.rows[0].id]);
      console.log(`User ${email} already exists — ensured role='${ROLE}'.`);
      console.log("Password was not changed. Use Admin → Users to reset if needed.");
      return;
    }

    console.log(`Creating administrator ${email}…`);
    const result = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
      },
    });

    const userId = result.user.id;
    const { rowCount } = await pool.query(`UPDATE "user" SET role = $1 WHERE id = $2`, [
      ROLE,
      userId,
    ]);
    if (!rowCount) {
      throw new Error(`No row updated for user id=${userId} — did auth:migrate create "user"?`);
    }
    console.log(`Created administrator ${email} (id=${userId}).`);
    console.log("Sign in at /admin/login with SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD from your .env.");
    console.log("Change the password after first login.");
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
