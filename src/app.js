const express = require('express');
const createHealthRouter = require('./routes/health');

function createApp(db) {
  const app = express();
  app.use(createHealthRouter(db));
  return app;
}

module.exports = createApp;
