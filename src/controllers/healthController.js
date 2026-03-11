const db = require('../db');

async function getHealth(req, res) {
  const version = process.env.APP_VERSION || 'development';
  const commit = process.env.GIT_COMMIT || 'development';
  const uptime = process.uptime();

  let database = 'connected';
  let statusCode = 200;

  try {
    await db.query('SELECT 1');
  } catch (err) {
    database = 'disconnected';
    statusCode = 503;
  }

  res.status(statusCode).json({
    version,
    commit,
    uptime,
    database
  });
}

module.exports = { getHealth };
