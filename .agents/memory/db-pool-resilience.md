---
name: DB pool resilience and health checks
description: Why data loading looked "intermittent" with Supabase, and how it's monitored now
---

Root causes found for intermittent Supabase data loading (both locally and on Render):
1. `pg.Pool` had no `.on("error", ...)` listener. Supabase's Transaction Pooler
   recycles idle connections aggressively; without a listener, that idle-client
   error is an unhandled EventEmitter error and **crashes the whole Node process**,
   which then auto-restarts — looking like random "sometimes works" data loading.
2. A standalone artifact workflow (e.g. `artifacts/api-server: API Server`) and the
   combined `Start application` workflow both tried to bind the same port. Whichever
   held the port could be running stale/old code while the other silently failed.
3. `SUPABASE_DB_URL` can be absent from the dev Secrets pane even when
   `SUPABASE_URL`/`SUPABASE_ANON_KEY`/`SUPABASE_SERVICE_ROLE_KEY` are present —
   check `printenv | grep SUPABASE` for all four when data loading fails outright.

**How to apply:** Always attach a `pool.on("error", ...)` handler on any `pg.Pool`
in this codebase. `lib/db/src/index.ts` also now exports `checkDbConnection()`
(used by `GET /api/healthz/db`) and logs a background probe every 30s — check
that endpoint/log first when someone reports flaky data loading.
