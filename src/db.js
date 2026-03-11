/**
 * Database connectivity check.
 * Replace the implementation of checkConnection() with your actual
 * database driver's ping/query when a real database is configured.
 */

const DB_CHECK_TIMEOUT_MS = 2000;

async function checkConnection() {
  try {
    // TODO: Replace with actual database ping, e.g.:
    //   await pool.query('SELECT 1');
    // For now, resolve as connected (no database configured yet).
    return true;
  } catch {
    return false;
  }
}

module.exports = { checkConnection, DB_CHECK_TIMEOUT_MS };
