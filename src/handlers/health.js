const { execSync } = require('child_process');
const db = require('../db');

const startTime = Date.now();
const pkg = require('../../package.json');

let gitCommit;
try {
  gitCommit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
} catch {
  gitCommit = process.env.GIT_COMMIT || 'unknown';
}

function getHealthStatus(req, res) {
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  const database = db.ping() ? 'connected' : 'disconnected';

  res.json({
    version: pkg.version,
    commit: gitCommit,
    uptime,
    database,
  });
}

module.exports = { getHealthStatus };
