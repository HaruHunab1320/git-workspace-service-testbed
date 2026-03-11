import { describe, it, expect, beforeEach, afterEach } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import { setDbCheck } from "../src/routes/health.js";

describe("GET /api/health", () => {
  const originalEnv = process.env.GIT_COMMIT;

  beforeEach(() => {
    // Reset to a healthy database by default
    setDbCheck(async () => "connected");
  });

  afterEach(() => {
    // Restore original env
    if (originalEnv === undefined) {
      delete process.env.GIT_COMMIT;
    } else {
      process.env.GIT_COMMIT = originalEnv;
    }
  });

  // --- Status code ---

  it("returns 200 OK", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
  });

  // --- Response structure: all five keys present ---

  it("response contains all five required keys", async () => {
    const { body } = await request(app).get("/api/health");
    expect(body).toHaveProperty("status");
    expect(body).toHaveProperty("version");
    expect(body).toHaveProperty("commit");
    expect(body).toHaveProperty("uptime");
    expect(body).toHaveProperty("database");
  });

  it("response contains no extra top-level keys", async () => {
    const { body } = await request(app).get("/api/health");
    const keys = Object.keys(body).sort();
    expect(keys).toEqual(["commit", "database", "status", "uptime", "version"]);
  });

  // --- Data types ---

  it('"status" is a string', async () => {
    const { body } = await request(app).get("/api/health");
    expect(typeof body.status).toBe("string");
  });

  it('"version" is a string', async () => {
    const { body } = await request(app).get("/api/health");
    expect(typeof body.version).toBe("string");
  });

  it('"commit" is a string', async () => {
    const { body } = await request(app).get("/api/health");
    expect(typeof body.commit).toBe("string");
  });

  it('"uptime" is a number', async () => {
    const { body } = await request(app).get("/api/health");
    expect(typeof body.uptime).toBe("number");
  });

  it('"database" is a string', async () => {
    const { body } = await request(app).get("/api/health");
    expect(typeof body.database).toBe("string");
  });

  // --- Field values ---

  it('"status" is "ok" when database is connected', async () => {
    const { body } = await request(app).get("/api/health");
    expect(body.status).toBe("ok");
  });

  it('"version" matches package.json version', async () => {
    const { createRequire: cr } = await import("module");
    const pkg = cr(import.meta.url)("../package.json");

    const { body } = await request(app).get("/api/health");
    expect(body.version).toBe(pkg.version);
  });

  it('"uptime" is a positive number', async () => {
    const { body } = await request(app).get("/api/health");
    expect(body.uptime).toBeGreaterThan(0);
  });

  it('"database" is "connected" when db check succeeds', async () => {
    const { body } = await request(app).get("/api/health");
    expect(body.database).toBe("connected");
  });

  // --- GIT_COMMIT environment variable ---

  it('"commit" reflects the GIT_COMMIT env var', async () => {
    process.env.GIT_COMMIT = "abc1234";
    const { body } = await request(app).get("/api/health");
    expect(body.commit).toBe("abc1234");
  });

  it('"commit" falls back to "unknown" when GIT_COMMIT is unset', async () => {
    delete process.env.GIT_COMMIT;
    const { body } = await request(app).get("/api/health");
    expect(body.commit).toBe("unknown");
  });

  // --- Database failure scenarios ---

  it('"status" is "error" when database is disconnected', async () => {
    setDbCheck(async () => {
      throw new Error("connection refused");
    });
    const { body } = await request(app).get("/api/health");
    expect(body.status).toBe("error");
  });

  it('"database" is "disconnected" when db check throws', async () => {
    setDbCheck(async () => {
      throw new Error("connection refused");
    });
    const { body } = await request(app).get("/api/health");
    expect(body.database).toBe("disconnected");
  });

  it('"database" is "disconnected" when db check times out', async () => {
    setDbCheck(() => new Promise(() => {})); // never resolves
    const { body } = await request(app).get("/api/health");
    expect(body.database).toBe("disconnected");
  }, 10000);

  // --- Content-Type ---

  it("responds with application/json content type", async () => {
    const res = await request(app).get("/api/health");
    expect(res.headers["content-type"]).toMatch(/application\/json/);
  });

  // --- HTTP method restrictions ---

  it("returns 404 or 405 for POST requests", async () => {
    const res = await request(app).post("/api/health");
    expect([404, 405]).toContain(res.status);
  });

  // --- Schema conformance (integration-style check) ---

  it("full response matches the expected schema shape", async () => {
    process.env.GIT_COMMIT = "e2e-test-sha";
    setDbCheck(async () => "connected");

    const { body } = await request(app).get("/api/health");

    expect(body).toEqual({
      status: "ok",
      version: expect.any(String),
      commit: "e2e-test-sha",
      uptime: expect.any(Number),
      database: "connected",
    });
  });
});
