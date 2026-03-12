const express = require('express');
const { checkConnection } = require('../db');

const router = express.Router();

const startTime = Date.now();

router.get('/health', async (req, res) => {
  const dbConnected = await checkConnection();
  const status = dbConnected ? 'ok' : 'error';
  const statusCode = dbConnected ? 200 : 503;

  res.status(statusCode).json({
    status,
    version: process.env.APP_VERSION || 'development',
    commit: process.env.GIT_COMMIT || 'development',
    uptime: (Date.now() - startTime) / 1000,
    checks: {
      database: dbConnected ? 'connected' : 'disconnected'
    }
  });
});

module.exports = router;
