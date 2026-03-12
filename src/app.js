const express = require("express");
const healthRouter = require("./routes/health");

const app = express();

app.use("/api/health", healthRouter);

module.exports = app;
