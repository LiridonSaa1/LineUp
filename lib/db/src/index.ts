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
export const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
export const db = drizzle(pool, { schema });

export * from "./schema";
