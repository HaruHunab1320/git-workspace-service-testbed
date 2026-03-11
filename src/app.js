const express = require('express');
const { getHealthStatus } = require('./handlers/health');

const app = express();

app.get('/api/health', getHealthStatus);

module.exports = app;
