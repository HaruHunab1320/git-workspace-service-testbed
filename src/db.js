// Database module — replace ping() internals with your actual DB driver (e.g., pg, mysql2, knex).
const db = {
  async ping() {
    // Default stub: no database configured.
    // Replace with: await pool.query("SELECT 1");
    throw new Error("no database configured");
  },
};

export default db;
