/**
 * Better Auth user ids are opaque strings (not UUIDs).
 * CMS audit columns were originally UUID — widen them to TEXT.
 *
 * Usage: npm run db:fix-user-refs
 */
import { pool } from "../src/lib/db";

const STATEMENTS = [
  `ALTER TABLE courses ALTER COLUMN created_by TYPE TEXT USING created_by::text`,
  `ALTER TABLE courses ALTER COLUMN updated_by TYPE TEXT USING updated_by::text`,
  `ALTER TABLE courses ALTER COLUMN published_by TYPE TEXT USING published_by::text`,
  `ALTER TABLE courses ALTER COLUMN archived_by TYPE TEXT USING archived_by::text`,

  `ALTER TABLE faculty ALTER COLUMN created_by TYPE TEXT USING created_by::text`,
  `ALTER TABLE faculty ALTER COLUMN updated_by TYPE TEXT USING updated_by::text`,
  `ALTER TABLE faculty ALTER COLUMN published_by TYPE TEXT USING published_by::text`,
  `ALTER TABLE faculty ALTER COLUMN archived_by TYPE TEXT USING archived_by::text`,

  `ALTER TABLE faqs ALTER COLUMN created_by TYPE TEXT USING created_by::text`,
  `ALTER TABLE faqs ALTER COLUMN updated_by TYPE TEXT USING updated_by::text`,
  `ALTER TABLE faqs ALTER COLUMN published_by TYPE TEXT USING published_by::text`,
  `ALTER TABLE faqs ALTER COLUMN archived_by TYPE TEXT USING archived_by::text`,

  `ALTER TABLE audit_logs ALTER COLUMN actor_id TYPE TEXT USING actor_id::text`,
  `ALTER TABLE audit_logs ALTER COLUMN content_id TYPE TEXT USING content_id::text`,

  `ALTER TABLE admission_applications ALTER COLUMN status_updated_by TYPE TEXT USING status_updated_by::text`,
  `ALTER TABLE admission_applications ALTER COLUMN reviewed_by TYPE TEXT USING reviewed_by::text`,
  `ALTER TABLE admission_application_notes ALTER COLUMN created_by TYPE TEXT USING created_by::text`,
];

async function main() {
  for (const sql of STATEMENTS) {
    try {
      await pool.query(sql);
      console.log("ok:", sql.slice(0, 80) + "…");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      // Column may already be text, or table may not exist yet.
      console.warn("skip:", message);
    }
  }
  console.log("Done. Better Auth user ids can now be stored on CMS rows.");
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
