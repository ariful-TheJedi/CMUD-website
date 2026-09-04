import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

async function runMigration() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error("❌ DATABASE_URL is missing in your .env file.");
    process.exit(1);
  }

  const pool = new Pool({ connectionString });

  // Corrected column names: how_did_you_find_us and submitted_at
  const query = `
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
      address TEXT,
      applicant_message TEXT,
      status admission_status DEFAULT 'new',
      submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    console.log("⏳ Applying payment_admissions migration to database...");
    await pool.query(query);
    console.log("✅ Table 'payment_admissions' created successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
  } finally {
    await pool.end();
  }
}

runMigration();