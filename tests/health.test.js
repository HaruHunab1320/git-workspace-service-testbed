const request = require("supertest");
const app = require("../src/app");
const db = require("../src/db");

jest.mock("../src/db");

describe("GET /api/health", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("healthy state (database connected)", () => {
    beforeEach(() => {
      db.query.mockResolvedValue({ rows: [{ "?column?": 1 }] });
    });

    it("should return 200 OK", async () => {
      const res = await request(app).get("/api/health");
      expect(res.status).toBe(200);
    });

    it("should return JSON content type", async () => {
      const res = await request(app).get("/api/health");
      expect(res.headers["content-type"]).toMatch(/application\/json/);
    });

    it("should include all required keys in the response", async () => {
      const res = await request(app).get("/api/health");
      expect(res.body).toHaveProperty("version");
      expect(res.body).toHaveProperty("commit");
      expect(res.body).toHaveProperty("uptime");
      expect(res.body).toHaveProperty("database");
    });

    it('should return database status as "connected"', async () => {
      const res = await request(app).get("/api/health");
      expect(res.body.database).toBe("connected");
    });

    it("should return uptime as a number", async () => {
      const res = await request(app).get("/api/health");
      expect(typeof res.body.uptime).toBe("number");
      expect(res.body.uptime).toBeGreaterThan(0);
    });

    it("should use a lightweight SELECT 1 query for the database check", async () => {
      await request(app).get("/api/health");
      expect(db.query).toHaveBeenCalledWith("SELECT 1");
    });

    it("should return APP_VERSION from environment variable", async () => {
      process.env.APP_VERSION = "2.5.0";
      const res = await request(app).get("/api/health");
      expect(res.body.version).toBe("2.5.0");
    });

    it("should return GIT_COMMIT from environment variable", async () => {
      process.env.GIT_COMMIT = "abc123def";
      const res = await request(app).get("/api/health");
      expect(res.body.commit).toBe("abc123def");
    });

    it('should default version to "development" when APP_VERSION is unset', async () => {
      delete process.env.APP_VERSION;
      const res = await request(app).get("/api/health");
      expect(res.body.version).toBe("development");
    });

    it('should default commit to "development" when GIT_COMMIT is unset', async () => {
      delete process.env.GIT_COMMIT;
      const res = await request(app).get("/api/health");
      expect(res.body.commit).toBe("development");
    });

    it("should not include unexpected keys in the response", async () => {
      const res = await request(app).get("/api/health");
      const keys = Object.keys(res.body);
      expect(keys).toEqual(
        expect.arrayContaining(["version", "commit", "uptime", "database"])
      );
      expect(keys.length).toBe(4);
    });
  });

  describe("unhealthy state (database disconnected)", () => {
    beforeEach(() => {
      db.query.mockRejectedValue(new Error("Connection refused"));
    });

    it("should return 503 Service Unavailable", async () => {
      const res = await request(app).get("/api/health");
      expect(res.status).toBe(503);
    });

    it('should return database status as "disconnected"', async () => {
      const res = await request(app).get("/api/health");
      expect(res.body.database).toBe("disconnected");
    });

    it("should still include all required keys in the response", async () => {
      const res = await request(app).get("/api/health");
      expect(res.body).toHaveProperty("version");
      expect(res.body).toHaveProperty("commit");
      expect(res.body).toHaveProperty("uptime");
      expect(res.body).toHaveProperty("database");
    });

    it("should still return version and commit even when database is down", async () => {
      process.env.APP_VERSION = "1.0.0";
      process.env.GIT_COMMIT = "deadbeef";
      const res = await request(app).get("/api/health");
      expect(res.body.version).toBe("1.0.0");
      expect(res.body.commit).toBe("deadbeef");
    });

    it("should still return uptime even when database is down", async () => {
      const res = await request(app).get("/api/health");
      expect(typeof res.body.uptime).toBe("number");
      expect(res.body.uptime).toBeGreaterThan(0);
    });

    it("should handle database timeout errors gracefully", async () => {
      db.query.mockRejectedValue(new Error("Query timeout"));
      const res = await request(app).get("/api/health");
      expect(res.status).toBe(503);
      expect(res.body.database).toBe("disconnected");
    });
  });
});
