/**
 * Apply Phase 3 CMS schema to local Postgres.
 * Usage: npm run db:schema
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { pool } from "../src/lib/db";

async function main() {
  const sqlPath = path.join(process.cwd(), "scripts", "schema-cms-local.sql");
  const sql = readFileSync(sqlPath, "utf8");
  await pool.query(sql);
  console.log("CMS schema applied to local Postgres.");
  await pool.end();
}

main().catch(async (err) => {
  console.error(err);
  try {
    await pool.end();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
