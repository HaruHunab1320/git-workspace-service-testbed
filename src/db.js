// Database module — swap the pool/client for your actual driver (pg, mysql2, etc.)
// This stub exports a query function for use by the health check.

let pool = null;

function setPool(p) {
  pool = p;
}

async function query(text, params) {
  if (!pool) {
    throw new Error('Database pool not initialized');
  }
  return pool.query(text, params);
}

module.exports = { setPool, query };
