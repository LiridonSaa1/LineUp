import { pool } from "@workspace/db";

async function checkDb() {
  const client = await pool.connect();
  try {
    const shops = await client.query("SELECT id, name, created_at FROM barbershops ORDER BY id");
    console.log(`\n📋 Barbershops (${shops.rowCount}):`);
    shops.rows.forEach(r => console.log(`  ID:${r.id} | ${r.name} | ${String(r.created_at).slice(0,10)}`));

    const users = await client.query("SELECT id, email, role FROM users ORDER BY id");
    console.log(`\n👥 Users (${users.rowCount}):`);
    users.rows.forEach(r => console.log(`  ID:${r.id} | ${r.email} | ${r.role}`));

    const prods = await client.query("SELECT id, name, shop_id FROM products ORDER BY id");
    console.log(`\n🛒 Products (${prods.rowCount}):`);
    prods.rows.forEach(r => console.log(`  ID:${r.id} | ${r.name} | shopId:${r.shop_id}`));

    const barbers = await client.query("SELECT COUNT(*) as c FROM barbers");
    console.log(`\n✂️  Barbers: ${barbers.rows[0].c}`);
    const services = await client.query("SELECT COUNT(*) as c FROM services");
    console.log(`🔧 Services: ${services.rows[0].c}`);
    console.log(`\n✅ DB URL prefix: ${process.env.SUPABASE_DB_URL?.slice(0,30)}...`);
  } finally {
    client.release();
    await pool.end();
  }
  process.exit(0);
}

checkDb().catch(e => { console.error("❌", e.message); process.exit(1); });
