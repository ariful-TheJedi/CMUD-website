import { Pool } from "pg";

if (!process.env.DATABASE_URL) {
  throw new Error("Missing DATABASE_URL. Add it to .env for local Postgres.");
}

/** Shared Postgres pool for Better Auth + CMS (Phase 3). */
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export type DbClient = Pool;
