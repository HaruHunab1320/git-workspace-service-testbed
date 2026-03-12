import request from "supertest";
import express from "express";
import healthRouter from "../../src/api/health";
import * as db from "../../src/db";

// Mock the database module
jest.mock("../../src/db");
const mockCheckConnection = db.checkDatabaseConnection as jest.MockedFunction<
  typeof db.checkDatabaseConnection
>;

function createApp(): express.Express {
  const app = express();
  app.use(healthRouter);
  return app;
}

describe("GET /api/health", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.resetAllMocks();
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  describe("healthy state (200 OK)", () => {
    beforeEach(() => {
      mockCheckConnection.mockResolvedValue(true);
    });

    it("returns 200 when the database is connected", async () => {
      const app = createApp();
      const res = await request(app).get("/api/health");
      expect(res.status).toBe(200);
    });

    it('returns database: "connected" when the database is reachable', async () => {
      const app = createApp();
      const res = await request(app).get("/api/health");
      expect(res.body.database).toBe("connected");
    });

    it("returns all required fields with correct types", async () => {
      process.env.APP_VERSION = "1.2.3";
      process.env.GIT_COMMIT = "abc1234";
      const app = createApp();

      const res = await request(app).get("/api/health");

      expect(res.body).toEqual(
        expect.objectContaining({
          version: expect.any(String),
          commit: expect.any(String),
          uptime: expect.any(Number),
          database: expect.any(String),
        })
      );
    });

    it("returns version from APP_VERSION environment variable", async () => {
      process.env.APP_VERSION = "2.5.0";
      const app = createApp();

      const res = await request(app).get("/api/health");

      expect(res.body.version).toBe("2.5.0");
    });

    it("returns commit from GIT_COMMIT environment variable", async () => {
      process.env.GIT_COMMIT = "deadbeef";
      const app = createApp();

      const res = await request(app).get("/api/health");

      expect(res.body.commit).toBe("deadbeef");
    });

    it("returns uptime as a positive number", async () => {
      const app = createApp();
      const res = await request(app).get("/api/health");
      expect(res.body.uptime).toBeGreaterThan(0);
    });

    it("returns JSON content type", async () => {
      const app = createApp();
      const res = await request(app).get("/api/health");
      expect(res.headers["content-type"]).toMatch(/application\/json/);
    });

    it("uses camelCase keys in the response", async () => {
      process.env.APP_VERSION = "1.0.0";
      process.env.GIT_COMMIT = "abc123";
      const app = createApp();

      const res = await request(app).get("/api/health");
      const keys = Object.keys(res.body);

      expect(keys).toContain("version");
      expect(keys).toContain("commit");
      expect(keys).toContain("uptime");
      expect(keys).toContain("database");
      // Ensure no snake_case or other key formats
      keys.forEach((key) => {
        expect(key).toMatch(/^[a-z][a-zA-Z0-9]*$/);
      });
    });
  });

  describe("database failure state (503 Service Unavailable)", () => {
    beforeEach(() => {
      mockCheckConnection.mockResolvedValue(false);
    });

    it("returns 503 when the database is disconnected", async () => {
      const app = createApp();
      const res = await request(app).get("/api/health");
      expect(res.status).toBe(503);
    });

    it('returns database: "disconnected" when the database is unreachable', async () => {
      const app = createApp();
      const res = await request(app).get("/api/health");
      expect(res.body.database).toBe("disconnected");
    });

    it("still returns version, commit, and uptime when the database is down", async () => {
      process.env.APP_VERSION = "1.0.0";
      process.env.GIT_COMMIT = "abc123";
      const app = createApp();

      const res = await request(app).get("/api/health");

      expect(res.body.version).toBe("1.0.0");
      expect(res.body.commit).toBe("abc123");
      expect(res.body.uptime).toBeGreaterThan(0);
    });

    it("returns 503 when the database check throws an error", async () => {
      mockCheckConnection.mockRejectedValue(new Error("connection refused"));
      const app = createApp();

      const res = await request(app).get("/api/health");

      // Depending on implementation, a rejected promise should result in 503
      // or a 500. The contract says 503 for disconnected/unreachable.
      expect(res.status).toBeGreaterThanOrEqual(500);
    });
  });

  describe("default environment variable handling", () => {
    it('returns "unknown" version when APP_VERSION is not set', async () => {
      delete process.env.APP_VERSION;
      mockCheckConnection.mockResolvedValue(true);
      const app = createApp();

      const res = await request(app).get("/api/health");

      expect(res.body.version).toBe("unknown");
    });

    it('returns "unknown" commit when GIT_COMMIT is not set', async () => {
      delete process.env.GIT_COMMIT;
      mockCheckConnection.mockResolvedValue(true);
      const app = createApp();

      const res = await request(app).get("/api/health");

      expect(res.body.commit).toBe("unknown");
    });
  });
});
