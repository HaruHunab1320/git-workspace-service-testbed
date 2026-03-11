const express = require('express');
const router = express.Router();
const db = require('../db');

const startTime = Date.now();

router.get('/', async (req, res) => {
  let database_status = 'disconnected';
  let statusCode = 503;

  try {
    const isConnected = await db.checkConnection();
    if (isConnected) {
      database_status = 'connected';
      statusCode = 200;
    }
  } catch {
    database_status = 'disconnected';
    statusCode = 503;
  }

  const uptimeMs = Date.now() - startTime;

  res.status(statusCode).json({
    version: process.env.APP_VERSION || 'unknown',
    git_commit: process.env.GIT_COMMIT_HASH || 'unknown',
    uptime_seconds: Math.floor(uptimeMs / 1000),
    database_status,
  });
});

module.exports = router;
