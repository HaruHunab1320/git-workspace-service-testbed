const { version } = require('../../package.json');
const db = require('../db');

async function healthHandler(req, res) {
  let database = 'disconnected';
  let statusCode = 503;

  try {
    const isConnected = await db.ping();
    if (isConnected) {
      database = 'connected';
      statusCode = 200;
    }
  } catch (err) {
    // database stays 'disconnected', statusCode stays 503
  }

  const status = statusCode === 200 ? 'ok' : 'error';

  res.status(statusCode).json({
    status,
    version,
    commit: process.env.GIT_COMMIT || 'unknown',
    uptime: process.uptime(),
    database,
  });
}

module.exports = healthHandler;
