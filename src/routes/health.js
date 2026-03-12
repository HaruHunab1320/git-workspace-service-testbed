const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/', async (req, res) => {
  const version = process.env.APP_VERSION || 'unknown';
  const commit = process.env.GIT_COMMIT || 'unknown';
  const uptime = process.uptime();

  let database = 'connected';
  try {
    await db.query('SELECT 1');
  } catch {
    database = 'disconnected';
  }

  const status = database === 'connected' ? 'ok' : 'error';

  res.status(200).json({
    status,
    version,
    commit,
    uptime,
    database,
  });
});

module.exports = router;
