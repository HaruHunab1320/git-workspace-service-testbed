const express = require('express');
const healthRouter = require('./api/health');

const app = express();
app.use(healthRouter);

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

module.exports = app;
