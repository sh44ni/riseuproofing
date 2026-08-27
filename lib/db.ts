import { Pool } from 'pg';

// Singleton pool — reused across hot reloads in dev
const globalForPg = globalThis as unknown as { pgPool?: Pool };

if (!globalForPg.pgPool) {
  globalForPg.pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 10,
  });
}

export const pool = globalForPg.pgPool;

export async function query<T = Record<string, unknown>>(
  sql: string,
  params?: unknown[]
): Promise<T[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(sql, params);
    return result.rows as T[];
  } finally {
    client.release();
  }
}
