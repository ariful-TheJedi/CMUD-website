import { Pool } from "pg";
import { getAppEnv } from "@/lib/env";

const { databaseUrl } = getAppEnv();

/** Shared Postgres pool for Better Auth + CMS. */
export const pool = new Pool({
  connectionString: databaseUrl,
});

pool.on("error", (err) => {
  console.error("[db] Unexpected Postgres pool error:", err);
});

export type DbClient = Pool;
