const express = require('express');
const healthRoute = require('./api/health');

const app = express();
app.use('/api/health', healthRoute);

module.exports = app;
