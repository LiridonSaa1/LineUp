import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

// Always use Supabase — never silently fall back to a platform-provided
// DATABASE_URL (e.g. a Render Postgres add-on), which would point at a
// different, empty database and look like "data is missing" in production.
const connectionString = process.env.SUPABASE_DB_URL?.trim() || undefined;

if (!connectionString) {
  throw new Error(
    "SUPABASE_DB_URL must be set to your Supabase Transaction Pooler connection string. " +
      "On Render, set it under the service's Environment tab — it is not auto-provisioned.",
  );
}

// Supabase Transaction Pooler (pooler.supabase.com:6543) uses a certificate
// chain that cannot be verified with the default CA store. rejectUnauthorized
// must be false; the connection is still TLS-encrypted in transit.
export const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  // The pooler aggressively recycles idle connections. Keep the local pool
  // small and cycle connections proactively so we never hand out one the
  // pooler has already dropped on its end.
  max: 10,
  idleTimeoutMillis: 20_000,
  connectionTimeoutMillis: 10_000,
});

// node-postgres's Pool emits "error" whenever an *idle* client in the pool
// hits a network-level error (e.g. the Supabase pooler closing a connection
// it considers stale). Without a listener here, Node treats it as an
// unhandled EventEmitter error and crashes the whole process — which is why
// data loading looked "intermittent": the API server was silently dying and
// restarting every time the pooler dropped a connection. Log and swallow
// instead; the pool automatically replaces the broken client on next use.
pool.on("error", (err) => {
  console.error("[db] idle client error (pool will recover):", err.message);
});

export const db = drizzle(pool, { schema });

export * from "./schema";
