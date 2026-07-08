import { pool } from "@workspace/db";

const tables = [
  "activity_log",
  "ads",
  "appointments",
  "coupon_usages",
  "coupons",
  "holidays",
  "loyalty_transactions",
  "loyalty_accounts",
  "loyalty_programs",
  "notifications",
  "order_items",
  "orders",
  "payments",
  "products",
  "recurring_rules",
  "services",
  "waiting_list",
  "barbers",
  "barbershops",
  "users",
];

function q(table: string) {
  return `"${table.replace(/"/g, '""')}"`;
}

async function countRows(client: Awaited<ReturnType<typeof pool.connect>>) {
  const counts: Record<string, number> = {};
  for (const table of tables) {
    const result = await client.query(`select count(*)::int as count from public.${q(table)}`);
    counts[table] = result.rows[0]?.count ?? 0;
  }
  return counts;
}

async function clearAllData() {
  const client = await pool.connect();
  try {
    await client.query("begin");

    const before = await countRows(client);
    await client.query(`truncate table ${tables.map((table) => `public.${q(table)}`).join(", ")} restart identity cascade`);
    const after = await countRows(client);

    await client.query("commit");

    console.log("Supabase app data cleared.");
    for (const table of tables) {
      console.log(`${table}: ${before[table]} -> ${after[table]}`);
    }
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

clearAllData().catch((error) => {
  console.error("Failed to clear Supabase data:", error);
  process.exit(1);
});
