import { db } from "@workspace/db";
import { pool } from "@workspace/db";

async function clearDemo() {
  console.log("🗑️  Duke fshirë të dhënat demo nga Supabase...\n");

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const run = async (label: string, sql: string) => {
      const res = await client.query(sql);
      console.log(`✓ ${label}: ${res.rowCount ?? 0} fshirë`);
    };

    await run("Activity log",   `DELETE FROM activity_log`);
    await run("Notifications",  `DELETE FROM notifications`);
    await run("Ads",            `DELETE FROM ads`);
    await run("Order items",    `DELETE FROM order_items`);
    await run("Orders",         `DELETE FROM orders`);
    await run("Payments",       `DELETE FROM payments`);
    await run("Appointments",   `DELETE FROM appointments`);
    await run("Products",       `DELETE FROM products WHERE shop_id IN (1,2,3,4,5,6)`);
    await run("Barbers",        `DELETE FROM barbers   WHERE shop_id IN (1,2,3,4,5,6)`);
    await run("Services",       `DELETE FROM services  WHERE shop_id IN (1,2,3,4,5,6)`);
    await run("Barbershops",    `DELETE FROM barbershops WHERE id IN (1,2,3,4,5,6)`);
    await run("Users demo",     `DELETE FROM users WHERE email IN ('admin@lineup.com','artan@lineup.com','besim@gmail.com')`);

    await client.query("COMMIT");
    console.log("\n✅ Gati! Baza e të dhënave është pastër.");
  } catch (err: any) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
    await pool.end();
  }

  process.exit(0);
}

clearDemo().catch(err => {
  console.error("❌ Gabim:", err.message);
  process.exit(1);
});
