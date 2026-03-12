const request = require('supertest');
const app = require('../src/app');
const db = require('../src/db');

jest.mock('../src/db');

describe('GET /api/health', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    delete process.env.APP_VERSION;
    delete process.env.GIT_COMMIT;
  });

  describe('when the database is connected', () => {
    beforeEach(() => {
      db.ping.mockResolvedValue(true);
    });

    it('should return 200 OK', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
    });

    it('should return JSON content type', async () => {
      const res = await request(app).get('/api/health');
      expect(res.headers['content-type']).toMatch(/application\/json/);
    });

    it('should include all required top-level fields', async () => {
      const res = await request(app).get('/api/health');
      expect(res.body).toHaveProperty('status');
      expect(res.body).toHaveProperty('version');
      expect(res.body).toHaveProperty('commit');
      expect(res.body).toHaveProperty('uptime');
      expect(res.body).toHaveProperty('checks');
    });

    it('should return status "ok"', async () => {
      const res = await request(app).get('/api/health');
      expect(res.body.status).toBe('ok');
    });

    it('should return checks.database as "connected"', async () => {
      const res = await request(app).get('/api/health');
      expect(res.body.checks.database).toBe('connected');
    });

    it('should have correct data types for all fields', async () => {
      const res = await request(app).get('/api/health');
      expect(typeof res.body.status).toBe('string');
      expect(typeof res.body.version).toBe('string');
      expect(typeof res.body.commit).toBe('string');
      expect(typeof res.body.uptime).toBe('number');
      expect(typeof res.body.checks).toBe('object');
      expect(typeof res.body.checks.database).toBe('string');
    });

    it('should return uptime as a non-negative number', async () => {
      const res = await request(app).get('/api/health');
      expect(res.body.uptime).toBeGreaterThanOrEqual(0);
    });

    it('should use APP_VERSION env var when set', async () => {
      process.env.APP_VERSION = '2.5.0';
      const res = await request(app).get('/api/health');
      expect(res.body.version).toBe('2.5.0');
    });

    it('should use GIT_COMMIT env var when set', async () => {
      process.env.GIT_COMMIT = 'abc123def';
      const res = await request(app).get('/api/health');
      expect(res.body.commit).toBe('abc123def');
    });

    it('should default version to "development" when APP_VERSION is unset', async () => {
      const res = await request(app).get('/api/health');
      expect(res.body.version).toBe('development');
    });

    it('should default commit to "development" when GIT_COMMIT is unset', async () => {
      const res = await request(app).get('/api/health');
      expect(res.body.commit).toBe('development');
    });

    it('should use camelCase for all JSON keys', async () => {
      const res = await request(app).get('/api/health');
      const keys = Object.keys(res.body);
      expect(keys).toEqual(expect.arrayContaining(['status', 'version', 'commit', 'uptime', 'checks']));
      expect(Object.keys(res.body.checks)).toEqual(expect.arrayContaining(['database']));
    });

    it('should only contain expected top-level keys', async () => {
      const res = await request(app).get('/api/health');
      const keys = Object.keys(res.body).sort();
      expect(keys).toEqual(['checks', 'commit', 'status', 'uptime', 'version']);
    });

    it('should only contain expected keys in checks', async () => {
      const res = await request(app).get('/api/health');
      expect(Object.keys(res.body.checks)).toEqual(['database']);
    });
  });

  describe('when the database is disconnected', () => {
    beforeEach(() => {
      db.ping.mockRejectedValue(new Error('Connection refused'));
    });

    it('should return 503 Service Unavailable', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(503);
    });

    it('should return status "error"', async () => {
      const res = await request(app).get('/api/health');
      expect(res.body.status).toBe('error');
    });

    it('should return checks.database as "disconnected"', async () => {
      const res = await request(app).get('/api/health');
      expect(res.body.checks.database).toBe('disconnected');
    });

    it('should still include all required fields', async () => {
      const res = await request(app).get('/api/health');
      expect(res.body).toHaveProperty('status');
      expect(res.body).toHaveProperty('version');
      expect(res.body).toHaveProperty('commit');
      expect(res.body).toHaveProperty('uptime');
      expect(res.body).toHaveProperty('checks');
    });

    it('should still have correct data types when unhealthy', async () => {
      const res = await request(app).get('/api/health');
      expect(typeof res.body.status).toBe('string');
      expect(typeof res.body.version).toBe('string');
      expect(typeof res.body.commit).toBe('string');
      expect(typeof res.body.uptime).toBe('number');
      expect(typeof res.body.checks).toBe('object');
      expect(typeof res.body.checks.database).toBe('string');
    });

    it('should still return version and commit even when database fails', async () => {
      process.env.APP_VERSION = '1.0.0';
      process.env.GIT_COMMIT = 'deadbeef';
      const res = await request(app).get('/api/health');
      expect(res.body.version).toBe('1.0.0');
      expect(res.body.commit).toBe('deadbeef');
    });
  });
});
