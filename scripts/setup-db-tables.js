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

if (!connectionString) {
  console.error("SUPABASE_DB_URL environment variable is not defined");
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  console.log("Connecting to Supabase Database...");
  const client = await pool.connect();
  try {
    console.log("Creating ENUM types if not existing...");
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE shop_status AS ENUM ('pending', 'active', 'rejected', 'suspended');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        CREATE TYPE shop_gender AS ENUM ('male', 'female', 'both');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        CREATE TYPE user_role AS ENUM ('admin', 'owner', 'barber', 'user');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    console.log("Creating 'users' table if not existing...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role user_role NOT NULL DEFAULT 'user',
        phone TEXT,
        avatar_url TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    console.log("Creating 'barbershops' table if not existing...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS barbershops (
        id SERIAL PRIMARY KEY,
        owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        city TEXT NOT NULL,
        address TEXT NOT NULL,
        description TEXT,
        phone TEXT,
        image_url TEXT,
        status shop_status NOT NULL DEFAULT 'pending',
        subdomain TEXT UNIQUE,
        rating NUMERIC(3, 2),
        total_reviews INTEGER NOT NULL DEFAULT 0,
        latitude NUMERIC(10, 7),
        longitude NUMERIC(10, 7),
        open_time TEXT,
        close_time TEXT,
        stripe_subscription_id TEXT,
        stripe_customer_id TEXT,
        subscription_status TEXT DEFAULT 'inactive',
        max_barbers INTEGER NOT NULL DEFAULT 2,
        business_number TEXT,
        gender shop_gender DEFAULT 'both',
        stripe_connect_account_id TEXT,
        iban TEXT,
        photos TEXT[],
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    console.log("Creating 'barbers' table if not existing...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS barbers (
        id SERIAL PRIMARY KEY,
        shop_id INTEGER NOT NULL REFERENCES barbershops(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        avatar_url TEXT,
        bio TEXT,
        specialties TEXT[],
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    console.log("Verifying tables in Database...");
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public';
    `);
    console.log("Tables in database:", res.rows.map(r => r.table_name));

    console.log("SUCCESS: 'barbershops', 'users', and 'barbers' tables created and verified!");
  } catch (err) {
    console.error("Error setting up database tables:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
