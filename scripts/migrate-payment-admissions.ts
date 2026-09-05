import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

// Safe to run on any environment, any number of times:
// - Fresh database: creates the enum, the table (with every column), done.
// - Table already exists but predates the payment_admission_status enum
//   (e.g. status still using the old admission_status enum/text values):
//   converts it in place, mapping legacy values to the new enum.
// - Table already exists and is missing the bank-transfer columns
//   (account_number / account_name) or the amount column: adds them.
// All statements run in a single transaction, so a failure rolls back
// cleanly instead of leaving the schema half-migrated.
async function runMigration() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error("❌ DATABASE_URL is missing in your .env file.");
    process.exit(1);
  }

  const pool = new Pool({ connectionString });
  const client = await pool.connect();

  try {
    console.log("⏳ Applying payment_admissions migration...");
    await client.query("BEGIN");

    await client.query(`
      DO $$ BEGIN
        CREATE TYPE payment_admission_status AS ENUM ('pending', 'verified', 'not_verified');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    // Fresh installs get every column, including bank-transfer fields, in one shot.
    await client.query(`
      CREATE TABLE IF NOT EXISTS payment_admissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50) NOT NULL,
        qualification VARCHAR(255),
        medical_college VARCHAR(255),
        bmdc_number VARCHAR(100),
        preferred_branch VARCHAR(100) NOT NULL,
        course_slug VARCHAR(150) NOT NULL,
        preferred_batch VARCHAR(100),
        how_did_you_find_us VARCHAR(255),
        payment_method VARCHAR(50) NOT NULL,
        mobile_number VARCHAR(50),
        transaction_id VARCHAR(100),
        cash_serial_number VARCHAR(100),
        account_number VARCHAR(100),
        account_name VARCHAR(255),
        amount INTEGER,
        address TEXT,
        applicant_message TEXT,
        status payment_admission_status NOT NULL DEFAULT 'pending',
        submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Bring a pre-existing table up to date: correct the status column's type
    // (normalizing any legacy status values along the way) and add the
    // bank-transfer columns if they aren't there yet. No-ops on a table that
    // already matches the shape above.
    await client.query(`
      ALTER TABLE payment_admissions ADD COLUMN IF NOT EXISTS status payment_admission_status;
      ALTER TABLE payment_admissions ALTER COLUMN status DROP DEFAULT;
      ALTER TABLE payment_admissions ALTER COLUMN status TYPE payment_admission_status
        USING CASE
          WHEN status::text IN ('admitted', 'verified', 'varified') THEN 'verified'::payment_admission_status
          WHEN status::text IN ('rejected', 'not_verified', 'not varified') THEN 'not_verified'::payment_admission_status
          ELSE 'pending'::payment_admission_status
        END;
      ALTER TABLE payment_admissions
        ALTER COLUMN status SET DEFAULT 'pending'::payment_admission_status,
        ALTER COLUMN status SET NOT NULL;
      ALTER TABLE payment_admissions ADD COLUMN IF NOT EXISTS account_number VARCHAR(100);
      ALTER TABLE payment_admissions ADD COLUMN IF NOT EXISTS account_name VARCHAR(255);
      ALTER TABLE payment_admissions ADD COLUMN IF NOT EXISTS amount INTEGER;
    `);

    await client.query("COMMIT");
    console.log("✅ payment_admissions is up to date (table, status enum, bank-transfer columns, amount).");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Migration failed, all changes rolled back:", error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
