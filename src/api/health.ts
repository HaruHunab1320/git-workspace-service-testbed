import { Router, Request, Response } from "express";
import { checkDatabaseConnection } from "../db";

const router = Router();

router.get("/api/health", async (_req: Request, res: Response) => {
  const dbConnected = await checkDatabaseConnection();
  const status = dbConnected ? 200 : 503;

  res.status(status).json({
    version: process.env.APP_VERSION || "unknown",
    commit: process.env.GIT_COMMIT || "unknown",
    uptime: process.uptime(),
    database: dbConnected ? "connected" : "disconnected",
  });
});

export default router;
