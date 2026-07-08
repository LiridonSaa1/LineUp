ALTER TABLE "barbers" ADD COLUMN IF NOT EXISTS "user_id" integer;

DO $$ BEGIN
 ALTER TABLE "barbers" ADD CONSTRAINT "barbers_user_id_users_id_fk"
 FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "barbers_user_id_unique" ON "barbers" ("user_id");
