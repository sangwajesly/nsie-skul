import pg, { type Pool as PgPool, type PoolClient, type QueryResult, type QueryResultRow } from "pg";
const { Pool } = pg;

let pool: PgPool | null = null;

export function getLocalPgPool(): PgPool {
  if (!pool) {
    const connectionString =
      process.env.HUB_DATABASE_URL ||
      `postgresql://${process.env.HUB_DB_USER || "postgres"}:${process.env.HUB_DB_PASSWORD || "postgres"}@${process.env.HUB_DB_HOST || "127.0.0.1"}:${process.env.HUB_DB_PORT || "5432"}/${process.env.HUB_DB_NAME || "nsei_sukul_hub"}`;

    pool = new Pool({
      connectionString,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool.on("error", (err: Error) => {
      console.error("[LocalPgPool] Unexpected client error:", err);
    });
  }

  return pool;
}

export async function closeLocalPgPool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

/**
 * Executes a query inside an authenticated session context,
 * setting request.jwt.claim.sub and request.jwt.claim.role
 * so auth.uid() and auth.role() resolve correctly in RLS.
 */
export async function withAuthenticatedSession<T>(
  userId: string | null,
  role: string = "authenticated",
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const p = getLocalPgPool();
  const client = await p.connect();
  try {
    await client.query("BEGIN;");
    if (userId) {
      await client.query({
        text: "SELECT set_config('request.jwt.claim.sub', $1, true);",
        values: [userId],
        types: { getTypeParser: () => (val: any) => val }
      });
      await client.query({
        text: "SELECT set_config('request.jwt.claim.role', $1, true);",
        values: [role],
        types: { getTypeParser: () => (val: any) => val }
      });
    } else {
      await client.query("SELECT set_config('request.jwt.claim.sub', '', true);");
      await client.query("SELECT set_config('request.jwt.claim.role', 'anon', true);");
    }

    const result = await callback(client);
    await client.query("COMMIT;");
    return result;
  } catch (err) {
    await client.query("ROLLBACK;");
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Standard query helper for administrative/unrestricted operations.
 */
export async function queryLocalDb<R extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<R>> {
  const p = getLocalPgPool();
  return p.query<R>(text, params);
}
