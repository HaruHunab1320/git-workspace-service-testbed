const db = {
  query: async (sql) => {
    // Placeholder: replace with actual database client (e.g., pg, mysql2, knex)
    // This default implementation simulates a connected database.
    if (sql === 'SELECT 1') {
      return { rows: [{ '?column?': 1 }] };
    }
    throw new Error('Not implemented');
  }
};

module.exports = db;
