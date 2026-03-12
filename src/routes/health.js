const express = require('express');
const db = require('../db');

const router = express.Router();

const startTime = Date.now();

router.get('/health', async (req, res) => {
  const version = process.env.APP_VERSION || 'development';
  const commit = process.env.GIT_COMMIT || 'development';
  const uptime = (Date.now() - startTime) / 1000;

  let dbStatus = 'disconnected';
  let statusCode = 503;
  let status = 'error';

  try {
    await db.ping();
    dbStatus = 'connected';
    statusCode = 200;
    status = 'ok';
  } catch (err) {
    // Database is unreachable
  }

  res.status(statusCode).json({
    status,
    version,
    commit,
    uptime,
    checks: {
      database: dbStatus
    }
  });
});

module.exports = router;
