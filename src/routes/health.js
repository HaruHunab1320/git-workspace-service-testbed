import { Router } from "express";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { version } = require("../../package.json");

const router = Router();

// Configurable database check function; defaults to a no-op returning "connected".
// In production, the app should supply a real check via setDbCheck().
let dbCheck = async () => "connected";

export function setDbCheck(fn) {
  dbCheck = fn;
}

router.get("/", async (_req, res) => {
  const uptime = process.uptime();
  const commit = process.env.GIT_COMMIT || "unknown";

  let database;
  try {
    database = await Promise.race([
      dbCheck(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), 2000)
      ),
    ]);
  } catch {
    database = "disconnected";
  }

  const status = database === "connected" ? "ok" : "error";

  res.json({ status, version, commit, uptime, database });
});

export default router;
