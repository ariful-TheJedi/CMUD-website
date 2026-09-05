/**
 * Ensure courses.whats_included exists and backfill empty rows with defaults.
 * Usage: npx tsx --env-file=.env scripts/migrate-course-whats-included.ts
 */
import { pool } from "../src/lib/db";
import { DEFAULT_COURSE_WHATS_INCLUDED } from "../src/data/courses";

async function main() {
  await pool.query(`
    ALTER TABLE courses
    ADD COLUMN IF NOT EXISTS whats_included TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[]
  `);
  console.log("Column courses.whats_included ensured.");

  const result = await pool.query<{ slug: string }>(
    `UPDATE courses
     SET whats_included = $1::text[]
     WHERE whats_included IS NULL OR cardinality(whats_included) = 0
     RETURNING slug`,
    [DEFAULT_COURSE_WHATS_INCLUDED],
  );

  console.log(`Backfilled ${result.rowCount ?? 0} course(s):`);
  for (const row of result.rows) {
    console.log(`  - ${row.slug}`);
  }

  const sample = await pool.query<{
    slug: string;
    n: number;
    whats_included: string[];
  }>(
    `SELECT slug, cardinality(whats_included) AS n, whats_included
     FROM courses
     ORDER BY sort_order ASC, name ASC
     LIMIT 3`,
  );
  console.log("Sample:", JSON.stringify(sample.rows, null, 2));
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
