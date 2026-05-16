'use strict';
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  try {
    const { rows } = await pool.query(
      `SELECT employee_id, email, name, created_at FROM employees ORDER BY created_at DESC LIMIT 10`
    );
    console.log('=== Existing Employees ===');
    console.log(JSON.stringify(rows, null, 2));
  } catch (e) {
    console.error('DB Error:', e.message);
  } finally {
    await pool.end();
  }
})();
