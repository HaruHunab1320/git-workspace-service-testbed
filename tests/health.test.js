const request = require('supertest');
const app = require('../src/app');
const health = require('../src/handlers/health');

describe('GET /api/health', () => {
  describe('response status', () => {
    it('should return 200 OK', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
    });

    it('should return Content-Type application/json', async () => {
      const res = await request(app).get('/api/health');
      expect(res.headers['content-type']).toMatch(/application\/json/);
    });
  });

  describe('response body structure', () => {
    it('should contain all four required keys', async () => {
      const res = await request(app).get('/api/health');
      expect(res.body).toHaveProperty('version');
      expect(res.body).toHaveProperty('commit');
      expect(res.body).toHaveProperty('uptime');
      expect(res.body).toHaveProperty('database');
    });

    it('should contain exactly four keys', async () => {
      const res = await request(app).get('/api/health');
      expect(Object.keys(res.body)).toHaveLength(4);
    });

    it('should use camelCase key names', async () => {
      const res = await request(app).get('/api/health');
      const keys = Object.keys(res.body);
      expect(keys).toEqual(
        expect.arrayContaining(['version', 'commit', 'uptime', 'database'])
      );
    });
  });

  describe('version field', () => {
    it('should be a string', async () => {
      const res = await request(app).get('/api/health');
      expect(typeof res.body.version).toBe('string');
    });

    it('should return APP_VERSION when set', async () => {
      const original = process.env.APP_VERSION;
      process.env.APP_VERSION = '2.5.0';
      const res = await request(app).get('/api/health');
      expect(res.body.version).toBe('2.5.0');
      if (original !== undefined) {
        process.env.APP_VERSION = original;
      } else {
        delete process.env.APP_VERSION;
      }
    });

    it('should default to "1.0.0" when APP_VERSION is not set', async () => {
      const original = process.env.APP_VERSION;
      delete process.env.APP_VERSION;
      const res = await request(app).get('/api/health');
      expect(res.body.version).toBe('1.0.0');
      if (original !== undefined) {
        process.env.APP_VERSION = original;
      }
    });
  });

  describe('commit field', () => {
    it('should be a string', async () => {
      const res = await request(app).get('/api/health');
      expect(typeof res.body.commit).toBe('string');
    });

    it('should return GIT_COMMIT when set', async () => {
      const original = process.env.GIT_COMMIT;
      process.env.GIT_COMMIT = 'abc123def';
      const res = await request(app).get('/api/health');
      expect(res.body.commit).toBe('abc123def');
      if (original !== undefined) {
        process.env.GIT_COMMIT = original;
      } else {
        delete process.env.GIT_COMMIT;
      }
    });

    it('should default to "unknown" when GIT_COMMIT is not set', async () => {
      const original = process.env.GIT_COMMIT;
      delete process.env.GIT_COMMIT;
      const res = await request(app).get('/api/health');
      expect(res.body.commit).toBe('unknown');
      if (original !== undefined) {
        process.env.GIT_COMMIT = original;
      }
    });
  });

  describe('uptime field', () => {
    it('should be a number', async () => {
      const res = await request(app).get('/api/health');
      expect(typeof res.body.uptime).toBe('number');
    });

    it('should be a non-negative integer', async () => {
      const res = await request(app).get('/api/health');
      expect(res.body.uptime).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(res.body.uptime)).toBe(true);
    });

    it('should increase over time', async () => {
      const res1 = await request(app).get('/api/health');
      await new Promise((resolve) => setTimeout(resolve, 1100));
      const res2 = await request(app).get('/api/health');
      expect(res2.body.uptime).toBeGreaterThanOrEqual(res1.body.uptime);
    }, 10000);
  });

  describe('database field', () => {
    afterEach(() => {
      health.setDbPool(null);
    });

    it('should be a string', async () => {
      const res = await request(app).get('/api/health');
      expect(typeof res.body.database).toBe('string');
    });

    it('should be "disconnected" when no database pool is configured', async () => {
      health.setDbPool(null);
      const res = await request(app).get('/api/health');
      expect(res.body.database).toBe('disconnected');
    });

    it('should be "connected" when database ping succeeds', async () => {
      const mockPool = { query: jest.fn().mockResolvedValue({ rows: [{ 1: 1 }] }) };
      health.setDbPool(mockPool);
      const res = await request(app).get('/api/health');
      expect(res.body.database).toBe('connected');
      expect(mockPool.query).toHaveBeenCalledWith('SELECT 1');
    });

    it('should be "disconnected" when database ping fails', async () => {
      const mockPool = { query: jest.fn().mockRejectedValue(new Error('Connection refused')) };
      health.setDbPool(mockPool);
      const res = await request(app).get('/api/health');
      expect(res.body.database).toBe('disconnected');
    });

    it('should only contain "connected" or "disconnected" as values', async () => {
      const res = await request(app).get('/api/health');
      expect(['connected', 'disconnected']).toContain(res.body.database);
    });
  });

  describe('error resilience', () => {
    afterEach(() => {
      health.setDbPool(null);
    });

    it('should still return 200 even when database is unreachable', async () => {
      const mockPool = { query: jest.fn().mockRejectedValue(new Error('ECONNREFUSED')) };
      health.setDbPool(mockPool);
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.database).toBe('disconnected');
    });

    it('should still include all fields when database check fails', async () => {
      const mockPool = { query: jest.fn().mockRejectedValue(new Error('timeout')) };
      health.setDbPool(mockPool);
      const res = await request(app).get('/api/health');
      expect(res.body).toHaveProperty('version');
      expect(res.body).toHaveProperty('commit');
      expect(res.body).toHaveProperty('uptime');
      expect(res.body).toHaveProperty('database');
    });
  });

  describe('HTTP method handling', () => {
    it('should not respond to POST requests', async () => {
      const res = await request(app).post('/api/health');
      expect(res.status).not.toBe(200);
    });

    it('should not respond to PUT requests', async () => {
      const res = await request(app).put('/api/health');
      expect(res.status).not.toBe(200);
    });

    it('should not respond to DELETE requests', async () => {
      const res = await request(app).delete('/api/health');
      expect(res.status).not.toBe(200);
    });
  });
});
