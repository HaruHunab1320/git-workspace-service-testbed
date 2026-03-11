const express = require('express');
const apiRoutes = require('./routes/api');

const app = express();

app.use('/api', apiRoutes);

if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

module.exports = app;
