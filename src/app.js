const express = require('express');
const { healthHandler } = require('./api/health');

const app = express();

app.get('/api/health', healthHandler);

module.exports = app;
