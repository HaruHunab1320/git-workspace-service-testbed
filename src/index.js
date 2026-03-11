const express = require('express');
const healthHandler = require('./routes/health');

const app = express();

app.get('/api/health', healthHandler);

const port = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

module.exports = app;
