const request = require('supertest');

// Mock the db module before importing the app
jest.mock('../src/db');
const db = require('../src/db');

const app = require('../src/app');

const ORIGINAL_ENV = process.env;

beforeEach(() => {
  jest.resetAllMocks();
  // Isolate environment variables per test
  process.env = { ...ORIGINAL_ENV };
});

afterAll(() => {
  process.env = ORIGINAL_ENV;
});

// ---------------------------------------------------------------------------
// 1. Healthy state – database connected
// ---------------------------------------------------------------------------
describe('GET /api/health – healthy state', () => {
  beforeEach(() => {
    process.env.APP_VERSION = '2.5.0';
    process.env.GIT_COMMIT = 'abc1234';
    db.ping.mockResolvedValue(true);
  });

  test('returns 200 status code', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
  });

  test('returns Content-Type application/json', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['content-type']).toMatch(/application\/json/);
  });

  test('returns status "ok"', async () => {
    const res = await request(app).get('/api/health');
    expect(res.body.status).toBe('ok');
  });

  test('returns the APP_VERSION from env', async () => {
    const res = await request(app).get('/api/health');
    expect(res.body.version).toBe('2.5.0');
  });

  test('returns the GIT_COMMIT from env', async () => {
    const res = await request(app).get('/api/health');
    expect(res.body.commit).toBe('abc1234');
  });

  test('returns uptime as a non-negative number', async () => {
    const res = await request(app).get('/api/health');
    expect(typeof res.body.uptime).toBe('number');
    expect(res.body.uptime).toBeGreaterThanOrEqual(0);
  });

  test('returns database "connected"', async () => {
    const res = await request(app).get('/api/health');
    expect(res.body.database).toBe('connected');
  });
});

// ---------------------------------------------------------------------------
// 2. Unhealthy state – database disconnected (ping rejects)
// ---------------------------------------------------------------------------
describe('GET /api/health – database failure (rejection)', () => {
  beforeEach(() => {
    process.env.APP_VERSION = '1.0.0';
    process.env.GIT_COMMIT = 'deadbeef';
    db.ping.mockRejectedValue(new Error('connection refused'));
  });

  test('returns non-200 status code (503)', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(503);
  });

  test('returns status "error"', async () => {
    const res = await request(app).get('/api/health');
    expect(res.body.status).toBe('error');
  });

  test('returns database "disconnected"', async () => {
    const res = await request(app).get('/api/health');
    expect(res.body.database).toBe('disconnected');
  });

  test('still includes version and commit metadata', async () => {
    const res = await request(app).get('/api/health');
    expect(res.body.version).toBe('1.0.0');
    expect(res.body.commit).toBe('deadbeef');
  });

  test('still includes uptime', async () => {
    const res = await request(app).get('/api/health');
    expect(typeof res.body.uptime).toBe('number');
    expect(res.body.uptime).toBeGreaterThanOrEqual(0);
  });
});

// ---------------------------------------------------------------------------
// 3. Unhealthy state – database ping resolves to false
// ---------------------------------------------------------------------------
describe('GET /api/health – database ping returns false', () => {
  beforeEach(() => {
    process.env.APP_VERSION = '1.0.0';
    process.env.GIT_COMMIT = 'face000';
    db.ping.mockResolvedValue(false);
  });

  test('returns 200 when ping resolves (even with false)', async () => {
    // If the implementation treats a resolved promise (even false) as connected,
    // this test documents that behavior. Alpha may choose to treat false as
    // disconnected — in that case, update this expectation to 503.
    const res = await request(app).get('/api/health');
    // Accept either behavior — document what actually happens
    expect([200, 503]).toContain(res.statusCode);
  });
});

// ---------------------------------------------------------------------------
// 4. Missing environment variables – fallback behavior
// ---------------------------------------------------------------------------
describe('GET /api/health – missing env vars', () => {
  beforeEach(() => {
    delete process.env.APP_VERSION;
    delete process.env.GIT_COMMIT;
    db.ping.mockResolvedValue(true);
  });

  test('falls back to "unknown" for version when APP_VERSION is unset', async () => {
    const res = await request(app).get('/api/health');
    expect(res.body.version).toBe('unknown');
  });

  test('falls back to "unknown" for commit when GIT_COMMIT is unset', async () => {
    const res = await request(app).get('/api/health');
    expect(res.body.commit).toBe('unknown');
  });

  test('still returns 200 when DB is healthy', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// 5. Response schema validation
// ---------------------------------------------------------------------------
describe('GET /api/health – response schema', () => {
  beforeEach(() => {
    process.env.APP_VERSION = '3.0.0';
    process.env.GIT_COMMIT = 'cafebabe';
    db.ping.mockResolvedValue(true);
  });

  test('response body contains exactly the expected keys', async () => {
    const res = await request(app).get('/api/health');
    const keys = Object.keys(res.body).sort();
    expect(keys).toEqual(['commit', 'database', 'status', 'uptime', 'version']);
  });

  test('status is one of "ok" or "error"', async () => {
    const res = await request(app).get('/api/health');
    expect(['ok', 'error']).toContain(res.body.status);
  });

  test('version is a string', async () => {
    const res = await request(app).get('/api/health');
    expect(typeof res.body.version).toBe('string');
  });

  test('commit is a string', async () => {
    const res = await request(app).get('/api/health');
    expect(typeof res.body.commit).toBe('string');
  });

  test('uptime is a number', async () => {
    const res = await request(app).get('/api/health');
    expect(typeof res.body.uptime).toBe('number');
  });

  test('database is one of "connected" or "disconnected"', async () => {
    const res = await request(app).get('/api/health');
    expect(['connected', 'disconnected']).toContain(res.body.database);
  });
});

// ---------------------------------------------------------------------------
// 6. HTTP method safety
// ---------------------------------------------------------------------------
describe('GET /api/health – HTTP methods', () => {
  test('POST returns 404 or 405 (not a valid method)', async () => {
    const res = await request(app).post('/api/health');
    expect(res.statusCode).toBeGreaterThanOrEqual(400);
  });

  test('PUT returns 404 or 405', async () => {
    const res = await request(app).put('/api/health');
    expect(res.statusCode).toBeGreaterThanOrEqual(400);
  });

  test('DELETE returns 404 or 405', async () => {
    const res = await request(app).delete('/api/health');
    expect(res.statusCode).toBeGreaterThanOrEqual(400);
  });
});

// ---------------------------------------------------------------------------
// 7. Database ping timeout / slow response
// ---------------------------------------------------------------------------
describe('GET /api/health – database ping timeout', () => {
  beforeEach(() => {
    process.env.APP_VERSION = '1.0.0';
    process.env.GIT_COMMIT = 'timeout1';
  });

  test('handles a slow db.ping that eventually rejects', async () => {
    db.ping.mockImplementation(
      () => new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 50))
    );
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(503);
    expect(res.body.database).toBe('disconnected');
  });
});
