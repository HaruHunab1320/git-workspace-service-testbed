const { Router } = require('express');
const db = require('../db');
const pkg = require('../../package.json');

const router = Router();

router.get('/api/health', async (_req, res) => {
  const version = pkg.version;
  const commit = process.env.GIT_COMMIT || 'unknown';
  const uptime = Math.floor(process.uptime());

  let database = 'connected';
  let status = 'ok';
  let httpStatus = 200;

  try {
    await db.ping();
  } catch {
    database = 'disconnected';
    status = 'error';
    httpStatus = 503;
  }

  res.status(httpStatus).json({ status, version, commit, uptime, database });
});

module.exports = router;
