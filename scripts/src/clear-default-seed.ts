import { pool } from "@workspace/db";

const seedEmails = [
  "admin@trimkosova.com",
  "artan@trimkosova.com",
  "besim@gmail.com",
];

const seedShopNames = [
  "The Barber Lab",
  "TRIM Prishtina",
  "Gentlemen's Corner",
  "Classic Cuts Prizren",
  "Sharp Cuts Peja",
  "BarberKing Ferizaj",
];

async function clearDefaultSeed() {
  const client = await pool.connect();
  try {
    await client.query("begin");

    await client.query(`
      alter table barbers add column if not exists user_id integer;
    `);
    await client.query(`
      do $$ begin
        alter table barbers add constraint barbers_user_id_users_id_fk
        foreign key (user_id) references public.users(id) on delete cascade on update no action;
      exception
        when duplicate_object then null;
      end $$;
    `);
    await client.query(`
      create unique index if not exists barbers_user_id_unique on barbers (user_id);
    `);

    const shops = await client.query(
      `delete from barbershops where name = any($1::text[]) returning id, name`,
      [seedShopNames],
    );

    const users = await client.query(
      `delete from users where email = any($1::text[]) returning id, email`,
      [seedEmails],
    );

    await client.query("commit");

    console.log("Deleted default shops:", shops.rowCount);
    for (const row of shops.rows) console.log(`  shop ${row.id}: ${row.name}`);
    console.log("Deleted default users:", users.rowCount);
    for (const row of users.rows) console.log(`  user ${row.id}: ${row.email}`);
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

clearDefaultSeed().catch((error) => {
  console.error("Failed to clear default seed data:", error);
  process.exit(1);
});
