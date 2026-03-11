const request = require('supertest');
const app = require('../src/app');
const db = require('../src/db');

jest.mock('../src/db');

describe('GET /api/health', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    delete process.env.APP_VERSION;
    delete process.env.GIT_COMMIT_HASH;
  });

  describe('when the database is connected', () => {
    beforeEach(() => {
      db.checkConnection.mockResolvedValue(true);
    });

    it('returns 200 OK with all expected fields', async () => {
      process.env.APP_VERSION = '1.2.3';
      process.env.GIT_COMMIT_HASH = 'abc1234';

      const res = await request(app).get('/api/health');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('version', '1.2.3');
      expect(res.body).toHaveProperty('git_commit', 'abc1234');
      expect(res.body).toHaveProperty('uptime_seconds');
      expect(res.body).toHaveProperty('database_status', 'connected');
    });

    it('uses snake_case for all JSON keys', async () => {
      const res = await request(app).get('/api/health');
      const keys = Object.keys(res.body);

      expect(keys).toEqual(
        expect.arrayContaining([
          'version',
          'git_commit',
          'uptime_seconds',
          'database_status',
        ])
      );
      // Ensure no camelCase keys exist
      keys.forEach((key) => {
        expect(key).toBe(key.toLowerCase());
        expect(key).not.toMatch(/[A-Z]/);
      });
    });

    it('returns fallback values when environment variables are not set', async () => {
      delete process.env.APP_VERSION;
      delete process.env.GIT_COMMIT_HASH;

      const res = await request(app).get('/api/health');

      expect(res.status).toBe(200);
      expect(res.body.version).toBe('unknown');
      expect(res.body.git_commit).toBe('unknown');
    });
  });

  describe('when the database is disconnected', () => {
    it('returns 503 Service Unavailable when checkConnection returns false', async () => {
      db.checkConnection.mockResolvedValue(false);

      const res = await request(app).get('/api/health');

      expect(res.status).toBe(503);
      expect(res.body.database_status).toBe('disconnected');
    });

    it('returns 503 when checkConnection throws an error', async () => {
      db.checkConnection.mockRejectedValue(new Error('Connection refused'));

      const res = await request(app).get('/api/health');

      expect(res.status).toBe(503);
      expect(res.body.database_status).toBe('disconnected');
    });

    it('still returns a complete JSON payload on 503', async () => {
      db.checkConnection.mockRejectedValue(new Error('timeout'));

      const res = await request(app).get('/api/health');

      expect(res.status).toBe(503);
      expect(res.body).toHaveProperty('version');
      expect(res.body).toHaveProperty('git_commit');
      expect(res.body).toHaveProperty('uptime_seconds');
      expect(res.body).toHaveProperty('database_status');
    });
  });

  describe('uptime_seconds validation', () => {
    it('is a non-negative number', async () => {
      db.checkConnection.mockResolvedValue(true);

      const res = await request(app).get('/api/health');

      expect(typeof res.body.uptime_seconds).toBe('number');
      expect(res.body.uptime_seconds).toBeGreaterThanOrEqual(0);
    });

    it('is an integer (not fractional)', async () => {
      db.checkConnection.mockResolvedValue(true);

      const res = await request(app).get('/api/health');

      expect(Number.isInteger(res.body.uptime_seconds)).toBe(true);
    });
  });
});
