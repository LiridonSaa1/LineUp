const { Client } = require('pg');
const client = new Client({
  connectionString: "postgresql://postgres.cnlhqxegzphtlvtgijuj:CYq497YuyBESSbPg@18.196.8.182:6543/postgres"
});

async function run() {
  await client.connect();
  console.log("Connected to Supabase Postgres.");

  try {
    // 1. Get category IDs for "Flokë & Stilim" and "Mjekër & Estetikë"
    const catRes = await client.query(`
      SELECT id, name FROM public.categories 
      WHERE name IN ('Flokë & Stilim', 'Mjekër & Estetikë');
    `);
    
    if (catRes.rows.length === 0) {
      console.log("No categories found with those names.");
      return;
    }
    
    const catIds = catRes.rows.map(r => r.id);
    console.log("Category IDs:", catIds);

    // 2. Get subcategory IDs under these categories
    const subRes = await client.query(`
      SELECT id, name FROM public.subcategories 
      WHERE category_id = ANY($1::uuid[]);
    `, [catIds]);
    
    const subIds = subRes.rows.map(r => r.id);
    console.log(`Found ${subIds.length} subcategories to link:`, subRes.rows.map(r => r.name));

    // 3. Check if XOXO Hair Salon exists
    const shopRes = await client.query(`
      SELECT id, name FROM public.barbershops WHERE id = 1;
    `);

    if (shopRes.rows.length === 0) {
      // If shop with id=1 does not exist, let's look for any active shop
      const activeShops = await client.query(`
        SELECT id, name FROM public.barbershops LIMIT 5;
      `);
      console.log("Active shops in database:", activeShops.rows);
      if (activeShops.rows.length > 0) {
        const shopId = activeShops.rows[0].id;
        await client.query(`
          UPDATE public.barbershops 
          SET subcategories = $1::text[]
          WHERE id = $2;
        `, [subIds, shopId]);
        console.log(`Updated shop '${activeShops.rows[0].name}' (ID: ${shopId}) with subcategories.`);
      } else {
        console.log("No barbershops found in database to update.");
      }
    } else {
      // Update shop with id = 1
      await client.query(`
        UPDATE public.barbershops 
        SET subcategories = $1::text[]
        WHERE id = 1;
      `, [subIds]);
      console.log("Updated XOXO Hair Salon (ID: 1) with subcategories successfully.");
    }

  } catch (err) {
    console.error("Error during execution:", err);
  } finally {
    await client.end();
  }
}

run();
