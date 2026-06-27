import { Pool, type PoolClient, type QueryResultRow } from "pg";

type GlobalWithPool = typeof globalThis & {
  __procurementPool?: Pool;
};

const globalForPg = globalThis as GlobalWithPool;

function requireDatabaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required for the procurement backend.");
  }
  return url;
}

export function getPool() {
  if (!globalForPg.__procurementPool) {
    globalForPg.__procurementPool = new Pool({
      connectionString: requireDatabaseUrl(),
      max: Number(process.env.PG_POOL_MAX ?? 5),
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
      ssl:
        process.env.PGSSL === "false"
          ? false
          : {
              rejectUnauthorized: process.env.PGSSL_REJECT_UNAUTHORIZED === "true",
            },
    });
  }

  return globalForPg.__procurementPool;
}

export async function query<T extends QueryResultRow>(sql: string, params: unknown[] = []) {
  const result = await getPool().query<T>(sql, params);
  return result.rows;
}

export async function queryOne<T extends QueryResultRow>(sql: string, params: unknown[] = []) {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

export async function withTransaction<T>(handler: (client: PoolClient) => Promise<T>) {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const result = await handler(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export function asNumber(value: unknown) {
  if (value === null || value === undefined) return 0;
  return typeof value === "number" ? value : Number(value);
}