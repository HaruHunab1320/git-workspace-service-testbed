let pool = null;

function setPool(dbPool) {
  pool = dbPool;
}

function getPool() {
  return pool;
}

async function checkConnection() {
  if (!pool) {
    return false;
  }
  try {
    await pool.query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}

module.exports = { setPool, getPool, checkConnection };
