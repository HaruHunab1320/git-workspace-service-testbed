const express = require("express");
const pool = require("../db");

const router = express.Router();

const startTime = Date.now();

router.get("/", async (req, res) => {
  const version = process.env.APP_VERSION || "unknown";
  const commit = process.env.GIT_COMMIT || "unknown";
  const uptime = Math.floor((Date.now() - startTime) / 1000);

  let database = "connected";
  let status = "ok";
  let statusCode = 200;

  try {
    await pool.query("SELECT 1");
  } catch (err) {
    database = "disconnected";
    status = "error";
    statusCode = 503;
  }

  res.status(statusCode).json({
    status,
    version,
    commit,
    uptime,
    database,
  });
});

module.exports = router;
