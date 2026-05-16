'use strict';
const { Pool } = require('pg');
const logger   = require('../utils/logger');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max             : 20,
  idleTimeoutMillis   : 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on('connect', () => logger.debug('PostgreSQL: new client connected'));
pool.on('error',  (err) => logger.error(`PostgreSQL pool error: ${err.message}`));

/**
 * Helper – run a parameterised query against the pool.
 * @param {string}   text   SQL string with $1, $2 … placeholders
 * @param {any[]}    params Query parameters
 */
const query = (text, params) => pool.query(text, params);

module.exports = { pool, query };
