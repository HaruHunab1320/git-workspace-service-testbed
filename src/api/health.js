const { checkConnection } = require('../db');

const startTime = Date.now();

async function healthHandler(req, res) {
  const version = process.env.APP_VERSION || 'unknown';
  const gitCommit = process.env.GIT_COMMIT_HASH || 'unknown';
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);

  let databaseStatus = 'disconnected';
  let statusCode = 503;

  try {
    const isConnected = await checkConnection();
    if (isConnected) {
      databaseStatus = 'connected';
      statusCode = 200;
    }
  } catch {
    // checkConnection failed — remain disconnected / 503
  }

  res.status(statusCode).json({
    version,
    git_commit: gitCommit,
    uptime_seconds: uptimeSeconds,
    database_status: databaseStatus,
  });
}

module.exports = { healthHandler, startTime };
