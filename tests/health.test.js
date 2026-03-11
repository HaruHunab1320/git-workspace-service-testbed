import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import request from "supertest";
import express from "express";

/**
 * Unit tests for GET /api/health
 *
 * Expected response schema:
 * {
 *   "version": "1.0.0",
 *   "commit": "string",
 *   "uptime": 123.45,
 *   "database": "connected" | "disconnected"
 * }
 */

/**
 * Helper: creates an Express app with the health route using a mocked db.
 * @param {object} dbMock - mock for the db module's default export
 * @returns {Promise<import('express').Express>}
 */
async function createApp(dbMock) {
  vi.resetModules();
  vi.doMock("../src/db.js", () => ({ default: dbMock }));
  const { default: healthRoute } = await import("../src/routes/health.js");
  const app = express();
  app.use("/api/health", healthRoute);
  return app;
}

// A db mock that simulates a healthy connection (SELECT 1 succeeds)
const connectedDb = () => ({
  query: vi.fn().mockResolvedValue({ rows: [{ "?column?": 1 }] }),
});

// A db mock that simulates a failed connection
const disconnectedDb = () => ({
  query: vi.fn().mockRejectedValue(new Error("ECONNREFUSED")),
});

describe("GET /api/health", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  // ── Healthy state ─────────────────────────────────────────────────

  describe("healthy state (database connected)", () => {
    let app;

    beforeEach(async () => {
      app = await createApp(connectedDb());
    });

    it("returns 200 status code", async () => {
      const res = await request(app).get("/api/health");
      expect(res.status).toBe(200);
    });

    it("returns JSON content-type", async () => {
      const res = await request(app).get("/api/health");
      expect(res.headers["content-type"]).toMatch(/application\/json/);
    });

    it("returns all required fields", async () => {
      const res = await request(app).get("/api/health");
      expect(res.body).toHaveProperty("version");
      expect(res.body).toHaveProperty("commit");
      expect(res.body).toHaveProperty("uptime");
      expect(res.body).toHaveProperty("database");
    });

    it("returns version from package.json", async () => {
      const res = await request(app).get("/api/health");
      expect(res.body.version).toBe("1.0.0");
    });

    it("returns uptime as a positive number", async () => {
      const res = await request(app).get("/api/health");
      expect(typeof res.body.uptime).toBe("number");
      expect(res.body.uptime).toBeGreaterThan(0);
    });

    it('returns database status as "connected" when db is reachable', async () => {
      const res = await request(app).get("/api/health");
      expect(res.body.database).toBe("connected");
    });

    it("returns no extra top-level fields", async () => {
      const res = await request(app).get("/api/health");
      const keys = Object.keys(res.body).sort();
      expect(keys).toEqual(["commit", "database", "uptime", "version"]);
    });
  });

  // ── GIT_COMMIT environment variable ───────────────────────────────

  describe("commit field", () => {
    let app;

    beforeEach(async () => {
      app = await createApp(connectedDb());
    });

    it('defaults to "development" when GIT_COMMIT is not set', async () => {
      delete process.env.GIT_COMMIT;
      const res = await request(app).get("/api/health");
      expect(res.body.commit).toBe("development");
    });

    it("uses GIT_COMMIT env var when set", async () => {
      vi.stubEnv("GIT_COMMIT", "abc123def456");
      const res = await request(app).get("/api/health");
      expect(res.body.commit).toBe("abc123def456");
    });

    it("handles a full 40-char SHA", async () => {
      const sha = "a".repeat(40);
      vi.stubEnv("GIT_COMMIT", sha);
      const res = await request(app).get("/api/health");
      expect(res.body.commit).toBe(sha);
    });

    it("returns commit as a string type", async () => {
      const res = await request(app).get("/api/health");
      expect(typeof res.body.commit).toBe("string");
    });
  });

  // ── Uptime ────────────────────────────────────────────────────────

  describe("uptime field", () => {
    let app;

    beforeEach(async () => {
      app = await createApp(connectedDb());
    });

    it("reflects process.uptime()", async () => {
      const fakeUptime = 42.5;
      vi.spyOn(process, "uptime").mockReturnValue(fakeUptime);
      const res = await request(app).get("/api/health");
      expect(res.body.uptime).toBe(fakeUptime);
    });

    it("returns a number even when uptime is very small", async () => {
      vi.spyOn(process, "uptime").mockReturnValue(0.001);
      const res = await request(app).get("/api/health");
      expect(typeof res.body.uptime).toBe("number");
      expect(res.body.uptime).toBe(0.001);
    });

    it("returns a number when uptime is large", async () => {
      vi.spyOn(process, "uptime").mockReturnValue(999999.99);
      const res = await request(app).get("/api/health");
      expect(res.body.uptime).toBe(999999.99);
    });
  });

  // ── Database disconnected ─────────────────────────────────────────

  describe("database disconnected", () => {
    let app;

    beforeEach(async () => {
      app = await createApp(disconnectedDb());
    });

    it("returns 200 even when the database is unreachable", async () => {
      const res = await request(app).get("/api/health");
      expect(res.status).toBe(200);
    });

    it('returns "disconnected" when db ping fails', async () => {
      const res = await request(app).get("/api/health");
      expect(res.body.database).toBe("disconnected");
    });

    it("still returns version, commit, and uptime when db is down", async () => {
      const res = await request(app).get("/api/health");
      expect(res.body).toHaveProperty("version");
      expect(res.body).toHaveProperty("commit");
      expect(res.body).toHaveProperty("uptime");
      expect(res.body.version).toBe("1.0.0");
      expect(typeof res.body.uptime).toBe("number");
    });
  });

  // ── HTTP method handling ──────────────────────────────────────────

  describe("HTTP method handling", () => {
    let app;

    beforeEach(async () => {
      app = await createApp(connectedDb());
    });

    it("responds to GET requests", async () => {
      const res = await request(app).get("/api/health");
      expect(res.status).toBe(200);
    });

    it("returns 404 or 405 for POST requests", async () => {
      const res = await request(app).post("/api/health");
      expect([404, 405]).toContain(res.status);
    });

    it("returns 404 or 405 for PUT requests", async () => {
      const res = await request(app).put("/api/health");
      expect([404, 405]).toContain(res.status);
    });

    it("returns 404 or 405 for DELETE requests", async () => {
      const res = await request(app).delete("/api/health");
      expect([404, 405]).toContain(res.status);
    });
  });

  // ── Response structure validation ─────────────────────────────────

  describe("response structure", () => {
    let app;

    beforeEach(async () => {
      app = await createApp(connectedDb());
    });

    it("version is a non-empty string", async () => {
      const res = await request(app).get("/api/health");
      expect(typeof res.body.version).toBe("string");
      expect(res.body.version.length).toBeGreaterThan(0);
    });

    it("version matches semver pattern", async () => {
      const res = await request(app).get("/api/health");
      expect(res.body.version).toMatch(/^\d+\.\d+\.\d+/);
    });

    it("database is one of the allowed values", async () => {
      const res = await request(app).get("/api/health");
      expect(["connected", "disconnected"]).toContain(res.body.database);
    });

    it("uptime is not negative", async () => {
      const res = await request(app).get("/api/health");
      expect(res.body.uptime).toBeGreaterThanOrEqual(0);
    });
  });
});
