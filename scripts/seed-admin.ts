/**
 * Seed a local administrator for Phase 2 Better Auth.
 *
 * Prerequisites:
 *   1. DATABASE_URL + BETTER_AUTH_SECRET in .env
 *   2. npm run auth:migrate
 *
 * Usage:
 *   npm run auth:seed-admin
 */
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { Pool } from "pg";

const EMAIL = "admin@local.dev";
const PASSWORD = "password123";
const NAME = "Local Admin";
const ROLE = "administrator";

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

async function main() {
  loadDotEnv();

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("Missing DATABASE_URL in .env");
  }
  if (!process.env.BETTER_AUTH_SECRET) {
    throw new Error("Missing BETTER_AUTH_SECRET in .env");
  }

  const { auth } = await import("../src/lib/auth");
  const pool = new Pool({ connectionString: databaseUrl });

  try {
    const existing = await pool.query<{ id: string; role: string | null }>(
      `SELECT id, role FROM "user" WHERE email = $1 LIMIT 1`,
      [EMAIL],
    );

    if (existing.rows[0]) {
      await pool.query(`UPDATE "user" SET role = $1 WHERE id = $2`, [ROLE, existing.rows[0].id]);
      console.log(`User ${EMAIL} already exists — ensured role='${ROLE}'.`);
      console.log("\nSign in with:");
      console.log(`  email:    ${EMAIL}`);
      console.log(`  password: ${PASSWORD}`);
      return;
    }

    console.log(`Creating user ${EMAIL}…`);
    const result = await auth.api.signUpEmail({
      body: {
        email: EMAIL,
        password: PASSWORD,
        name: NAME,
      },
    });

    const userId = result.user.id;
    console.log(`Created user id=${userId}`);

    const { rowCount } = await pool.query(`UPDATE "user" SET role = $1 WHERE id = $2`, [
      ROLE,
      userId,
    ]);
    if (!rowCount) {
      throw new Error(`No row updated for user id=${userId} — did auth:migrate create "user"?`);
    }
    console.log(`Set role='${ROLE}' for ${EMAIL}`);
    console.log("\nDone. Sign in with:");
    console.log(`  email:    ${EMAIL}`);
    console.log(`  password: ${PASSWORD}`);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
