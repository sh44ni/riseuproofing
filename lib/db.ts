import { Pool, PoolClient, QueryResultRow } from 'pg';

// Singleton pool — reused across hot reloads in dev
const globalForPg = globalThis as unknown as { pgPool?: Pool };

const isProduction = process.env.NODE_ENV === 'production';
const allowSelfSigned = process.env.DB_SSL_ALLOW_SELFSIGNED === 'true';

if (!globalForPg.pgPool) {
  globalForPg.pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: isProduction && !allowSelfSigned } : false,
    max: 20, // Increased capacity to prevent query queuing on multi-metric dashboards
    min: 2,  // Maintain minimum warm connections
    idleTimeoutMillis: 30000, // Keep idle sockets warm for 30s before recycling
    connectionTimeoutMillis: 5000, // 5s timeout prevents hung queries if database stalls
    keepAlive: true, // Keep TCP sockets alive through NAT & load balancers
    keepAliveInitialDelayMillis: 10000,
  });

  // Handle errors on idle clients so they do not crash the Node process
  globalForPg.pgPool.on('error', (err) => {
    console.error('[pg-pool] Unexpected error on idle client:', err.message);
  });
}

export const pool = globalForPg.pgPool;

/**
 * Fast direct query execution using native pool checkout/release
 */
export async function query<T extends QueryResultRow = Record<string, unknown>>(
  sql: string,
  params?: unknown[]
): Promise<T[]> {
  const result = await pool.query<T>(sql, params);
  return result.rows;
}

/**
 * Transaction helper for multi-statement atomic operations
 */
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
