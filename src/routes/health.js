import { Router } from 'express';
import { createRequire } from 'module';
import { checkDatabase } from '../db.js';

const require = createRequire(import.meta.url);
const { version } = require('../../package.json');

const router = Router();

router.get('/api/health', async (_req, res) => {
  const dbStatus = await checkDatabase();

  const payload = {
    status: dbStatus === 'connected' ? 'ok' : 'error',
    version,
    commit: process.env.GIT_COMMIT || 'unknown',
    uptime: Math.floor(process.uptime()),
    database: dbStatus,
  };

  res.json(payload);
});

export default router;
