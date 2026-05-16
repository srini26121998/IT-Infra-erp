const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function check() {
  try {
    const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'audit_logs'");
    console.log('Columns in audit_logs:', res.rows.map(r => r.column_name));
  } catch (err) {
    console.error(err.message);
  } finally {
    await pool.end();
  }
}

check();
