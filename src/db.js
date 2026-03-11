// Minimal database connectivity check.
// Replace the implementation of `query` with your actual database client.

let db = null;

export function setDb(client) {
  db = client;
}

export async function checkDatabase() {
  if (!db) {
    return 'disconnected';
  }

  try {
    const timeout = new Promise((_resolve, reject) =>
      setTimeout(() => reject(new Error('timeout')), 2000),
    );
    await Promise.race([db.query('SELECT 1'), timeout]);
    return 'connected';
  } catch {
    return 'disconnected';
  }
}
