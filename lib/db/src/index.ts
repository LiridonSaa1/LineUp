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
let lastPoolError: { message: string; at: string } | null = null;

pool.on("error", (err) => {
  lastPoolError = { message: err.message, at: new Date().toISOString() };
  console.error("[db] idle client error (pool will recover):", err.message);
});

pool.on("connect", () => {
  console.log("[db] new connection established to Supabase pool");
});

export const db = drizzle(pool, { schema });

export interface DbStatus {
  connected: boolean;
  latencyMs: number | null;
  lastPoolError: { message: string; at: string } | null;
  poolSize: number;
  idleCount: number;
  waitingCount: number;
}

// Lightweight connectivity probe used by the /healthz/db endpoint and by the
// periodic self-check below. Runs a trivial query through the pool so it
// exercises the exact same connection path the app uses.
export async function checkDbConnection(): Promise<DbStatus> {
  const start = Date.now();
  try {
    await pool.query("select 1");
    return {
      connected: true,
      latencyMs: Date.now() - start,
      lastPoolError,
      poolSize: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount,
    };
  } catch (err) {
    return {
      connected: false,
      latencyMs: null,
      lastPoolError: { message: err instanceof Error ? err.message : String(err), at: new Date().toISOString() },
      poolSize: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount,
    };
  }
}

// Periodic background probe: if Supabase connectivity degrades or drops, this
// logs it loudly right away instead of only surfacing as a failed request
// later. Runs every 30s and is intentionally silent on success.
const DB_PROBE_INTERVAL_MS = 30_000;
setInterval(() => {
  checkDbConnection().then((status) => {
    if (!status.connected) {
      console.error("[db] connectivity probe FAILED:", status.lastPoolError?.message);
    }
  });
}, DB_PROBE_INTERVAL_MS).unref();

export * from "./schema";
