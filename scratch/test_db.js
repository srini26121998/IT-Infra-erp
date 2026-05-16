const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function testConnection() {
  try {
    console.log('Attempting to connect to:', process.env.DATABASE_URL.replace(/:([^:@]+)@/, ':****@'));
    const client = await pool.connect();
    console.log('Successfully connected!');
    const res = await client.query('SELECT NOW()');
    console.log('Query successful:', res.rows[0]);
    client.release();
  } catch (err) {
    console.error('Connection failed:', err.message);
  } finally {
    await pool.end();
  }
}

testConnection();
