// ============================================
// SHARED: Database Connection Helper
// Each service uses its own database or schema
// This is a shared utility for creating pools
// ============================================

const { Pool } = require('pg');
const dns = require('dns');

// Force IPv4 preference
dns.setDefaultResultOrder('ipv4first');

/**
 * Create a PostgreSQL connection pool
 * @param {string} databaseUrl - The database connection string
 * @param {object} options - Additional pool options
 * @returns {Pool}
 */
function createPool(databaseUrl, options = {}) {
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required');
  }

  const url = new URL(databaseUrl);

  const pool = new Pool({
    host: url.hostname,
    port: url.port ? parseInt(url.port) : 5432,
    database: url.pathname.slice(1),
    user: url.username,
    password: decodeURIComponent(url.password),
    ssl: {
      rejectUnauthorized: false,
      servername: url.hostname,
    },
    connectionTimeoutMillis: 30000,
    idleTimeoutMillis: 30000,
    max: options.maxConnections || 10,
    ...options,
  });

  pool.on('error', (err) => {
    console.error('[DB Pool] Unexpected error:', err.message);
  });

  return pool;
}

/**
 * Run a parameterized query with retry logic
 * @param {Pool} pool - The database pool
 * @param {string} sql - The SQL query
 * @param {any[]} params - Query parameters
 * @param {number} retries - Number of retries
 * @returns {Promise<any[]>}
 */
async function query(pool, sql, params = [], retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await pool.query(sql, params);
      return result.rows;
    } catch (error) {
      if (attempt === retries) throw error;
      console.warn(`[DB] Query attempt ${attempt + 1} failed, retrying...`, error.message);
      await new Promise((resolve) => setTimeout(resolve, 200 * Math.pow(2, attempt)));
    }
  }
  throw new Error('Query failed after all retries');
}

module.exports = { createPool, query };
