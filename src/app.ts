import express from "express";
import healthRouter from "./api/health";

const app = express();

app.use(healthRouter);

export default app;
