const db = {
  query: async (sql) => {
    throw new Error("Database not configured");
  }
};

module.exports = db;
