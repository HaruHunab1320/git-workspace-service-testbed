const startTime = Date.now();

let dbPool = null;

function setDbPool(pool) {
  dbPool = pool;
}

async function getHealthStatus(req, res) {
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);

  let database = 'disconnected';
  if (dbPool) {
    try {
      await dbPool.query('SELECT 1');
      database = 'connected';
    } catch {
      database = 'disconnected';
    }
  }

  res.status(200).json({
    version: process.env.APP_VERSION || '1.0.0',
    commit: process.env.GIT_COMMIT || 'unknown',
    uptime: uptimeSeconds,
    database,
  });
}

module.exports = { getHealthStatus, setDbPool, startTime };
