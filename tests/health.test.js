const { describe, it, before, after, beforeEach, afterEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const createApp = require('../src/app');

/**
 * Helper: make an HTTP GET request and return { statusCode, headers, body }.
 */
function get(server, path) {
  return new Promise((resolve, reject) => {
    const { port } = server.address();
    const req = http.get(`http://127.0.0.1:${port}${path}`, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: JSON.parse(data)
        });
      });
    });
    req.on('error', reject);
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GET /api/health', () => {
  let server;
  let mockDb;

  // --- Successful database scenario ---

  describe('when the database is connected', () => {
    before((_, done) => {
      mockDb = { query: mock.fn(async () => [{ '1': 1 }]) };
      const app = createApp(mockDb);
      server = app.listen(0, done);
    });

    after((_, done) => {
      server.close(done);
    });

    it('returns 200 status code', async () => {
      const res = await get(server, '/api/health');
      assert.equal(res.statusCode, 200);
    });

    it('returns Content-Type application/json', async () => {
      const res = await get(server, '/api/health');
      assert.match(res.headers['content-type'], /application\/json/);
    });

    it('returns status "ok"', async () => {
      const res = await get(server, '/api/health');
      assert.equal(res.body.status, 'ok');
    });

    it('returns database "connected"', async () => {
      const res = await get(server, '/api/health');
      assert.equal(res.body.database, 'connected');
    });

    it('returns uptime as a positive number', async () => {
      const res = await get(server, '/api/health');
      assert.equal(typeof res.body.uptime, 'number');
      assert.ok(res.body.uptime > 0, 'uptime should be positive');
    });

    it('returns version as a string', async () => {
      const res = await get(server, '/api/health');
      assert.equal(typeof res.body.version, 'string');
    });

    it('returns commit as a string', async () => {
      const res = await get(server, '/api/health');
      assert.equal(typeof res.body.commit, 'string');
    });

    it('contains exactly the expected keys', async () => {
      const res = await get(server, '/api/health');
      const keys = Object.keys(res.body).sort();
      assert.deepEqual(keys, ['commit', 'database', 'status', 'uptime', 'version']);
    });

    it('calls db.query at least once', async () => {
      mockDb.query.mock.resetCalls();
      await get(server, '/api/health');
      assert.ok(mockDb.query.mock.callCount() >= 1, 'db.query should be called');
    });
  });

  // --- Database failure scenario ---

  describe('when the database is disconnected', () => {
    before((_, done) => {
      mockDb = { query: mock.fn(async () => { throw new Error('ECONNREFUSED'); }) };
      const app = createApp(mockDb);
      server = app.listen(0, done);
    });

    after((_, done) => {
      server.close(done);
    });

    it('still returns 200 status code (endpoint itself does not crash)', async () => {
      const res = await get(server, '/api/health');
      assert.equal(res.statusCode, 200);
    });

    it('returns status "error"', async () => {
      const res = await get(server, '/api/health');
      assert.equal(res.body.status, 'error');
    });

    it('returns database "disconnected"', async () => {
      const res = await get(server, '/api/health');
      assert.equal(res.body.database, 'disconnected');
    });

    it('still returns version, commit, and uptime despite DB failure', async () => {
      const res = await get(server, '/api/health');
      assert.equal(typeof res.body.version, 'string');
      assert.equal(typeof res.body.commit, 'string');
      assert.equal(typeof res.body.uptime, 'number');
    });
  });

  // --- Environment variable behavior ---

  describe('environment variable handling', () => {
    let originalVersion;
    let originalCommit;

    before((_, done) => {
      originalVersion = process.env.APP_VERSION;
      originalCommit = process.env.GIT_COMMIT;
      mockDb = { query: mock.fn(async () => [{ '1': 1 }]) };
      const app = createApp(mockDb);
      server = app.listen(0, done);
    });

    afterEach(() => {
      // Restore env vars after each test
      if (originalVersion === undefined) delete process.env.APP_VERSION;
      else process.env.APP_VERSION = originalVersion;
      if (originalCommit === undefined) delete process.env.GIT_COMMIT;
      else process.env.GIT_COMMIT = originalCommit;
    });

    after((_, done) => {
      server.close(done);
    });

    it('returns "unknown" for version when APP_VERSION is not set', async () => {
      delete process.env.APP_VERSION;
      const res = await get(server, '/api/health');
      assert.equal(res.body.version, 'unknown');
    });

    it('returns "unknown" for commit when GIT_COMMIT is not set', async () => {
      delete process.env.GIT_COMMIT;
      const res = await get(server, '/api/health');
      assert.equal(res.body.commit, 'unknown');
    });

    it('returns the value of APP_VERSION when set', async () => {
      process.env.APP_VERSION = '2.5.0';
      const res = await get(server, '/api/health');
      assert.equal(res.body.version, '2.5.0');
    });

    it('returns the value of GIT_COMMIT when set', async () => {
      process.env.GIT_COMMIT = 'abc123def';
      const res = await get(server, '/api/health');
      assert.equal(res.body.commit, 'abc123def');
    });
  });
});
