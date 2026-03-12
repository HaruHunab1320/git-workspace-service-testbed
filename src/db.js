const db = {
  async ping() {
    // In production, this would execute something like `SELECT 1`
    return true;
  }
};

module.exports = db;
