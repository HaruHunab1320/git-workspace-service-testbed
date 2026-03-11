// Health endpoint — agent "alpha" will provide the real implementation.
// This stub follows the agreed-upon contract so tests can validate structure.

import { Router } from "express";
import { createRequire } from "module";
import db from "../db.js";

const require = createRequire(import.meta.url);
const pkg = require("../../package.json", { with: { type: "json" } });

const router = Router();

router.get("/", async (_req, res) => {
  let database = "disconnected";
  try {
    await db.query("SELECT 1");
    database = "connected";
  } catch {
    // database remains "disconnected"
  }

  res.json({
    version: pkg.version,
    commit: process.env.GIT_COMMIT || "development",
    uptime: process.uptime(),
    database,
  });
});

export default router;
