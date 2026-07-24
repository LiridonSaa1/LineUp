import pg from "../lib/db/node_modules/pg/lib/index.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "../.env");

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const idx = trimmed.indexOf("=");
      if (idx > 0) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  });
}

const connectionString = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

const pool = new pg.Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

async function testRegistration() {
  console.log("Testing Registration DB Flow...");
  const client = await pool.connect();
  try {
    const testEmail = `testbarber_${Date.now()}@example.com`;
    console.log("1. Creating test user...", testEmail);
    const userRes = await client.query(
      `INSERT INTO users (name, email, password_hash, role, phone) VALUES ($1, $2, $3, $4, $5) RETURNING id, email`,
      ["Test Barber", testEmail, "hash123", "owner", "+38345123456"]
    );
    const ownerId = userRes.rows[0].id;
    console.log("User created successfully with ID:", ownerId);

    console.log("2. Creating test barbershop for ownerId:", ownerId);
    const shopRes = await client.query(
      `INSERT INTO barbershops (owner_id, name, city, address, phone, status, rating, total_reviews) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, name`,
      [ownerId, "Test Barber Cutz", "Prishtinë", "Rruga B, Prishtinë", "+38345123456", "active", 5.0, 0]
    );
    console.log("Barbershop created successfully with ID:", shopRes.rows[0].id);

    console.log("3. Cleanup test data...");
    await client.query(`DELETE FROM users WHERE id = $1`, [ownerId]);
    console.log("REGISTRATION TEST COMPLETED SUCCESSFULLY! 100% WORKING!");
  } catch (err) {
    console.error("Test Registration Failed:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

testRegistration();
