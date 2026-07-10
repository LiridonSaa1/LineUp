---
name: Legacy schema drift on re-import
description: How to handle drizzle-kit push data-loss prompts and orphan migration files after importing/re-provisioning the DB
---

When re-provisioning or reconnecting to an existing Supabase DB for this project, the live DB can contain columns/tables not present in any tracked Drizzle migration (e.g. a leftover `services.barber_id` column). `drizzle-kit push` requires a TTY to confirm data-loss statements and just errors out in the Replit shell.

**Why:** the DB schema and the migration history can drift apart when migrations were applied by hand outside the normal `drizzle-kit push`/`generate` flow in an earlier session.

**How to apply:** don't blindly force `push`. Introspect the live DB (`information_schema.columns`) and cross-check the column against the current Drizzle schema files and all migration SQL. If it's absent from both, it's safe legacy drift — drop it manually via a one-off SQL script against `SUPABASE_DB_URL`. Also watch for orphan migration `.sql` files not referenced in `drizzle/meta/_journal.json` (e.g. a hand-written migration superseded by a `drizzle-kit generate` output) — delete the orphan rather than keeping two files for the same change.
