---
name: Supabase DB connection
description: How to connect to Supabase from Replit — direct host fails, must use Transaction Pooler
---

**Rule:** Always use the Transaction Pooler URL (`aws-X-REGION.pooler.supabase.com:6543`), not the direct host (`db.supabase.co:5432`). The direct host is ENOTFOUND from Replit's network.

**SSL:** Must use `ssl: { rejectUnauthorized: false }` — the pooler uses a self-signed certificate chain that cannot be verified with the default CA store. The connection is still TLS-encrypted in transit. Using `ssl: true` fails with "self-signed certificate in certificate chain".

**drizzle-kit push:** Fails in non-TTY shell when schema conflicts exist. Use `drizzle-kit generate` then apply each SQL statement individually via pg, skipping "already exists" errors.

**Why:** Replit's container network cannot resolve the direct Supabase hostname. The pooler uses a different DNS path that works. The self-signed cert is a known Supabase pooler limitation.

**How to apply:** Set `SUPABASE_DB_URL` to the Transaction Pooler URI from Supabase Dashboard → Project Settings → Database → Connection Pooling → Transaction mode. Always use `{ rejectUnauthorized: false }` for SSL when `SUPABASE_DB_URL` is set.
