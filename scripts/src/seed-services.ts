import { pool } from "@workspace/db";

const services = [
  {
    name: "Prerje Flokesh",
    description: "Prerje klasike ose moderne sipas stilit te klientit.",
    price: "8.00",
    durationMinutes: 30,
  },
  {
    name: "Fade",
    description: "Fade profesional me finishim te paster.",
    price: "10.00",
    durationMinutes: 35,
  },
  {
    name: "Rregullim Mjekre",
    description: "Formim dhe pastrim i mjekres me detaje.",
    price: "5.00",
    durationMinutes: 20,
  },
  {
    name: "Prerje + Mjekre",
    description: "Pakete e plote per floke dhe mjekre.",
    price: "12.00",
    durationMinutes: 45,
  },
  {
    name: "Rroje me Peshqir te Nxehte",
    description: "Rroje klasike me peshqir te nxehte dhe finish qetesues.",
    price: "10.00",
    durationMinutes: 40,
  },
  {
    name: "Prerje per Femije",
    description: "Prerje e shpejte dhe e kujdesshme per femije.",
    price: "6.00",
    durationMinutes: 25,
  },
];

async function seedServices() {
  const shopIdArg = process.argv.find((arg) => /^\d+$/.test(arg));
  const client = await pool.connect();
  try {
    const shopResult = shopIdArg
      ? await client.query("select id, name from public.barbershops where id = $1 limit 1", [Number(shopIdArg)])
      : await client.query("select id, name from public.barbershops order by id limit 1");
    const shop = shopResult.rows[0];
    if (!shop) {
      throw new Error("Nuk u gjet asnje barbershop per seed.");
    }

    const existing = await client.query("select lower(name) as name from public.services where shop_id = $1", [shop.id]);
    const existingNames = new Set(existing.rows.map((service) => service.name));

    let created = 0;
    for (const service of services) {
      if (existingNames.has(service.name.toLowerCase())) continue;
      await client.query(
        `insert into public.services (shop_id, name, description, price, duration_minutes)
         values ($1, $2, $3, $4, $5)`,
        [shop.id, service.name, service.description, service.price, service.durationMinutes],
      );
      created++;
    }

    console.log(`Seed services for ${shop.name} (#${shop.id})`);
    console.log(`Created: ${created}`);
    console.log(`Skipped existing: ${services.length - created}`);
  } finally {
    client.release();
    await pool.end();
  }
}

seedServices()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seed services failed:", error);
    process.exit(1);
  });
