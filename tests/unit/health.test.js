const request = require('supertest');
const app = require('../../src/index');
const db = require('../../src/db');
const packageJson = require('../../package.json');

jest.mock('../../src/db');

describe('GET /api/health', () => {
  const FAKE_UPTIME = 12345.678;
  const FAKE_COMMIT = 'abc123def456';

  beforeEach(() => {
    jest.restoreAllMocks();
    jest.spyOn(process, 'uptime').mockReturnValue(FAKE_UPTIME);
    process.env.GIT_COMMIT = FAKE_COMMIT;
  });

  afterEach(() => {
    delete process.env.GIT_COMMIT;
  });

  describe('when database is connected', () => {
    beforeEach(() => {
      db.ping.mockResolvedValue(true);
    });

    it('should return 200 status code', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
    });

    it('should return status "ok"', async () => {
      const res = await request(app).get('/api/health');
      expect(res.body.status).toBe('ok');
    });

    it('should return database as "connected"', async () => {
      const res = await request(app).get('/api/health');
      expect(res.body.database).toBe('connected');
    });

    it('should return the version from package.json', async () => {
      const res = await request(app).get('/api/health');
      expect(res.body.version).toBe(packageJson.version);
    });

    it('should return the git commit from GIT_COMMIT env var', async () => {
      const res = await request(app).get('/api/health');
      expect(res.body.commit).toBe(FAKE_COMMIT);
    });

    it('should return uptime as a number in seconds', async () => {
      const res = await request(app).get('/api/health');
      expect(res.body.uptime).toBe(FAKE_UPTIME);
      expect(typeof res.body.uptime).toBe('number');
    });

    it('should return JSON content type', async () => {
      const res = await request(app).get('/api/health');
      expect(res.headers['content-type']).toMatch(/application\/json/);
    });

    it('should return exactly the required keys', async () => {
      const res = await request(app).get('/api/health');
      const keys = Object.keys(res.body).sort();
      expect(keys).toEqual(['commit', 'database', 'status', 'uptime', 'version']);
    });
  });

  describe('when database is disconnected', () => {
    beforeEach(() => {
      db.ping.mockRejectedValue(new Error('Connection refused'));
    });

    it('should return 503 status code', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(503);
    });

    it('should return status "error"', async () => {
      const res = await request(app).get('/api/health');
      expect(res.body.status).toBe('error');
    });

    it('should return database as "disconnected"', async () => {
      const res = await request(app).get('/api/health');
      expect(res.body.database).toBe('disconnected');
    });

    it('should still return version, commit, and uptime', async () => {
      const res = await request(app).get('/api/health');
      expect(res.body.version).toBe(packageJson.version);
      expect(res.body.commit).toBe(FAKE_COMMIT);
      expect(res.body.uptime).toBe(FAKE_UPTIME);
    });

    it('should still return exactly the required keys', async () => {
      const res = await request(app).get('/api/health');
      const keys = Object.keys(res.body).sort();
      expect(keys).toEqual(['commit', 'database', 'status', 'uptime', 'version']);
    });
  });

  describe('when GIT_COMMIT is not set', () => {
    beforeEach(() => {
      db.ping.mockResolvedValue(true);
      delete process.env.GIT_COMMIT;
    });

    it('should return "unknown" as the commit value', async () => {
      const res = await request(app).get('/api/health');
      expect(res.body.commit).toBe('unknown');
    });
  });

  describe('response schema validation', () => {
    beforeEach(() => {
      db.ping.mockResolvedValue(true);
    });

    it('should have status as a string', async () => {
      const res = await request(app).get('/api/health');
      expect(typeof res.body.status).toBe('string');
    });

    it('should have version as a string', async () => {
      const res = await request(app).get('/api/health');
      expect(typeof res.body.version).toBe('string');
    });

    it('should have commit as a string', async () => {
      const res = await request(app).get('/api/health');
      expect(typeof res.body.commit).toBe('string');
    });

    it('should have uptime as a number', async () => {
      const res = await request(app).get('/api/health');
      expect(typeof res.body.uptime).toBe('number');
    });

    it('should have database as a string', async () => {
      const res = await request(app).get('/api/health');
      expect(typeof res.body.database).toBe('string');
    });

    it('should only contain valid status values', async () => {
      const res = await request(app).get('/api/health');
      expect(['ok', 'error']).toContain(res.body.status);
    });

    it('should only contain valid database values', async () => {
      const res = await request(app).get('/api/health');
      expect(['connected', 'disconnected']).toContain(res.body.database);
    });
  });
});
