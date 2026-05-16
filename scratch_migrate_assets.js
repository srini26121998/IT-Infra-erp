const { query } = require('../src/db/pool');

async function migrate() {
  console.log('Starting migration...');
  try {
    await query(`
      ALTER TABLE company_assets 
      ADD COLUMN IF NOT EXISTS company_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS email VARCHAR(255),
      ADD COLUMN IF NOT EXISTS phone_number VARCHAR(50),
      ADD COLUMN IF NOT EXISTS address TEXT,
      ADD COLUMN IF NOT EXISTS company_status VARCHAR(50);
    `);
    console.log('Migration successful: Columns added to company_assets.');

    await query(`
      ALTER TABLE employee_assets 
      ADD COLUMN IF NOT EXISTS processor VARCHAR(255),
      ADD COLUMN IF NOT EXISTS memory VARCHAR(255),
      ADD COLUMN IF NOT EXISTS storage VARCHAR(255),
      ADD COLUMN IF NOT EXISTS network VARCHAR(255),
      ADD COLUMN IF NOT EXISTS encryption VARCHAR(255);
    `);
    console.log('Migration successful: Columns added to employee_assets.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    process.exit();
  }
}

migrate();
