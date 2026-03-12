import { Router, Request, Response } from "express";
import { checkDatabaseConnection } from "../db";

const router = Router();

router.get("/api/health", async (_req: Request, res: Response) => {
  const version = process.env.APP_VERSION || "unknown";
  const commit = process.env.GIT_COMMIT || "unknown";
  const uptime = process.uptime();

  let dbConnected: boolean;
  try {
    dbConnected = await checkDatabaseConnection();
  } catch {
    dbConnected = false;
  }

  const status = dbConnected ? 200 : 503;
  const database = dbConnected ? "connected" : "disconnected";

  res.status(status).json({
    version,
    commit,
    uptime,
    database,
  });
});

export default router;
