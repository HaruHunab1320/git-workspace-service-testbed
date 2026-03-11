const request = require('supertest');
const express = require('express');

// Mock the db module before requiring the health router
jest.mock('../../src/db', () => ({
  query: jest.fn(),
}));

const db = require('../../src/db');
const healthRouter = require('../../src/api/health');

function createApp() {
  const app = express();
  app.use('/api/health', healthRouter);
  return app;
}

// Store originals for restoration
const originalEnv = process.env.GIT_COMMIT;
const originalUptime = process.uptime;

afterEach(() => {
  jest.restoreAllMocks();
  process.env.GIT_COMMIT = originalEnv;
  process.uptime = originalUptime;
});

describe('GET /api/health', () => {
  // ── Happy path ──────────────────────────────────────────────

  describe('when all checks pass', () => {
    beforeEach(() => {
      db.query.mockResolvedValue({ rows: [{ '?column?': 1 }] });
      process.env.GIT_COMMIT = 'abc1234';
      process.uptime = () => 42;
    });

    it('returns 200', async () => {
      const res = await request(createApp()).get('/api/health');
      expect(res.status).toBe(200);
    });

    it('returns status "ok"', async () => {
      const res = await request(createApp()).get('/api/health');
      expect(res.body.status).toBe('ok');
    });

    it('returns the version from package.json', async () => {
      const pkg = require('../../package.json');
      const res = await request(createApp()).get('/api/health');
      expect(res.body.version).toBe(pkg.version);
    });

    it('returns the git commit from the environment', async () => {
      const res = await request(createApp()).get('/api/health');
      expect(res.body.commit).toBe('abc1234');
    });

    it('returns uptime as a number', async () => {
      const res = await request(createApp()).get('/api/health');
      expect(typeof res.body.uptime).toBe('number');
      expect(res.body.uptime).toBeGreaterThanOrEqual(0);
    });

    it('returns database as "connected"', async () => {
      const res = await request(createApp()).get('/api/health');
      expect(res.body.database).toBe('connected');
    });

    it('returns Content-Type application/json', async () => {
      const res = await request(createApp()).get('/api/health');
      expect(res.headers['content-type']).toMatch(/application\/json/);
    });

    it('contains exactly the expected keys', async () => {
      const res = await request(createApp()).get('/api/health');
      expect(Object.keys(res.body).sort()).toEqual(
        ['commit', 'database', 'status', 'uptime', 'version']
      );
    });
  });

  // ── Database failure ────────────────────────────────────────

  describe('when the database is unreachable', () => {
    beforeEach(() => {
      db.query.mockRejectedValue(new Error('connection refused'));
      process.env.GIT_COMMIT = 'abc1234';
      process.uptime = () => 10;
    });

    it('returns 503', async () => {
      const res = await request(createApp()).get('/api/health');
      expect(res.status).toBe(503);
    });

    it('returns status "error"', async () => {
      const res = await request(createApp()).get('/api/health');
      expect(res.body.status).toBe('error');
    });

    it('returns database as "disconnected"', async () => {
      const res = await request(createApp()).get('/api/health');
      expect(res.body.database).toBe('disconnected');
    });

    it('still returns version, commit, and uptime', async () => {
      const pkg = require('../../package.json');
      const res = await request(createApp()).get('/api/health');
      expect(res.body.version).toBe(pkg.version);
      expect(res.body.commit).toBe('abc1234');
      expect(typeof res.body.uptime).toBe('number');
    });
  });

  // ── Database query timeout ──────────────────────────────────

  describe('when the database query times out', () => {
    beforeEach(() => {
      db.query.mockRejectedValue(new Error('query timeout'));
      process.env.GIT_COMMIT = 'def5678';
      process.uptime = () => 100;
    });

    it('returns 503 with database "disconnected"', async () => {
      const res = await request(createApp()).get('/api/health');
      expect(res.status).toBe(503);
      expect(res.body.database).toBe('disconnected');
      expect(res.body.status).toBe('error');
    });
  });

  // ── Missing GIT_COMMIT env var ──────────────────────────────

  describe('when GIT_COMMIT is not set', () => {
    beforeEach(() => {
      db.query.mockResolvedValue({ rows: [{ '?column?': 1 }] });
      delete process.env.GIT_COMMIT;
      process.uptime = () => 5;
    });

    it('returns 200 (commit is informational, not a health gate)', async () => {
      const res = await request(createApp()).get('/api/health');
      expect(res.status).toBe(200);
    });

    it('returns commit as "unknown"', async () => {
      const res = await request(createApp()).get('/api/health');
      expect(res.body.commit).toBe('unknown');
    });
  });

  // ── Response schema validation ──────────────────────────────

  describe('response schema', () => {
    beforeEach(() => {
      db.query.mockResolvedValue({ rows: [{ '?column?': 1 }] });
      process.env.GIT_COMMIT = 'schema-test';
      process.uptime = () => 1;
    });

    it('status is one of "ok" or "error"', async () => {
      const res = await request(createApp()).get('/api/health');
      expect(['ok', 'error']).toContain(res.body.status);
    });

    it('version is a string', async () => {
      const res = await request(createApp()).get('/api/health');
      expect(typeof res.body.version).toBe('string');
      expect(res.body.version.length).toBeGreaterThan(0);
    });

    it('commit is a string', async () => {
      const res = await request(createApp()).get('/api/health');
      expect(typeof res.body.commit).toBe('string');
    });

    it('uptime is a non-negative number', async () => {
      const res = await request(createApp()).get('/api/health');
      expect(typeof res.body.uptime).toBe('number');
      expect(res.body.uptime).toBeGreaterThanOrEqual(0);
    });

    it('database is one of "connected" or "disconnected"', async () => {
      const res = await request(createApp()).get('/api/health');
      expect(['connected', 'disconnected']).toContain(res.body.database);
    });
  });

  // ── HTTP method handling ────────────────────────────────────

  describe('unsupported methods', () => {
    beforeEach(() => {
      db.query.mockResolvedValue({ rows: [{ '?column?': 1 }] });
      process.env.GIT_COMMIT = 'abc1234';
    });

    it('POST returns 404 or 405', async () => {
      const res = await request(createApp()).post('/api/health');
      expect([404, 405]).toContain(res.status);
    });

    it('PUT returns 404 or 405', async () => {
      const res = await request(createApp()).put('/api/health');
      expect([404, 405]).toContain(res.status);
    });

    it('DELETE returns 404 or 405', async () => {
      const res = await request(createApp()).delete('/api/health');
      expect([404, 405]).toContain(res.status);
    });
  });

  // ── Database ping is minimal ────────────────────────────────

  describe('database ping', () => {
    beforeEach(() => {
      db.query.mockResolvedValue({ rows: [{ '?column?': 1 }] });
      process.env.GIT_COMMIT = 'abc1234';
      process.uptime = () => 1;
    });

    it('calls db.query exactly once per request', async () => {
      await request(createApp()).get('/api/health');
      expect(db.query).toHaveBeenCalledTimes(1);
    });

    it('executes a minimal query (SELECT 1 or similar)', async () => {
      await request(createApp()).get('/api/health');
      const queryArg = db.query.mock.calls[0][0];
      expect(typeof queryArg).toBe('string');
      expect(queryArg.toLowerCase()).toMatch(/select\s+1/);
    });
  });
});
