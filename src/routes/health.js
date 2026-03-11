import { Router } from "express";
import { createRequire } from "module";
import db from "../db.js";

const require = createRequire(import.meta.url);
const { version } = require("../../package.json");

const router = Router();

router.get("/", async (_req, res) => {
  let database = "disconnected";
  try {
    await db.ping();
    database = "connected";
  } catch {
    database = "disconnected";
  }

  res.json({
    version,
    commit: process.env.GIT_COMMIT || "development",
    uptime: process.uptime(),
    database,
  });
});

export default router;
