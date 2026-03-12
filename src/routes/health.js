const express = require('express');
const router = express.Router();
const db = require('../db');

const startTime = Date.now();

/**
 * GET /api/health
 *
 * Returns:
 *   {
 *     "status": "ok" | "error",
 *     "version": string,
 *     "commit": string,
 *     "uptime": number (seconds),
 *     "database": "connected" | "disconnected"
 *   }
 *
 * Alpha agent should finalize this implementation.
 */
router.get('/', async (req, res) => {
  const version = process.env.APP_VERSION || 'unknown';
  const commit = process.env.GIT_COMMIT || 'unknown';
  const uptime = Math.floor((Date.now() - startTime) / 1000);

  let dbStatus;
  try {
    await db.ping();
    dbStatus = 'connected';
  } catch {
    dbStatus = 'disconnected';
  }

  const status = dbStatus === 'connected' ? 'ok' : 'error';
  const statusCode = status === 'ok' ? 200 : 503;

  res.status(statusCode).json({
    status,
    version,
    commit,
    uptime,
    database: dbStatus,
  });
});

module.exports = router;
