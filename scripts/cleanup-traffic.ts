/**
 * Delete site_traffic_events older than ~2 months.
 * Usage: npm run traffic:cleanup
 * Schedule via cron, e.g. daily: 0 3 * * * cd /path/to/app && npm run traffic:cleanup
 */
import { pool } from "../src/lib/db";

const RETENTION_DAYS = 62;

async function main() {
  const { rowCount } = await pool.query(
    `DELETE FROM site_traffic_events
     WHERE created_at < now() - ($1::int * interval '1 day')`,
    [RETENTION_DAYS],
  );
  console.log(`Traffic cleanup: deleted ${rowCount ?? 0} event(s) older than ${RETENTION_DAYS} days.`);
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
