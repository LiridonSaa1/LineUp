ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "barber_id" integer;
ALTER TABLE "services" DROP CONSTRAINT IF EXISTS "services_barber_id_barbers_id_fk";
ALTER TABLE "services" ADD CONSTRAINT "services_barber_id_barbers_id_fk"
  FOREIGN KEY ("barber_id") REFERENCES "public"."barbers"("id") ON DELETE cascade ON UPDATE no action;
