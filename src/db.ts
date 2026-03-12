import { Pool } from "pg";

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool();
  }
  return pool;
}

export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const client = await getPool().connect();
    client.release();
    return true;
  } catch {
    return false;
  }
}
