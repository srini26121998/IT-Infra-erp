'use strict';
/**
 * Seed script — creates a super-admin user for first-run.
 * Usage: node src/db/seed.js
 */
require('dotenv').config();
const bcrypt   = require('bcrypt');
const { pool } = require('./pool');

async function seed() {
  const client = await pool.connect();
  try {
    const email    = 'superadmin@infraerp.com';
    const password = 'Admin@1234';
    const hash     = await bcrypt.hash(password, 12);

    await client.query(`
      INSERT INTO users (name, email, username, password_hash, role)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (email) DO NOTHING
    `, ['Super Admin', email, 'superadmin', hash, 'super-admin']);

    console.log('✅ Seed complete.');
    console.log(`   Email   : ${email}`);
    console.log(`   Password: ${password}`);
    console.log('   ⚠️  Change this password immediately after first login!\n');
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(err => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
