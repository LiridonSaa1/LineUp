ALTER TABLE "barbers" ADD COLUMN "user_id" integer;--> statement-breakpoint
ALTER TABLE "barbers" ADD CONSTRAINT "barbers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "barbers_user_id_unique" ON "barbers" USING btree ("user_id");