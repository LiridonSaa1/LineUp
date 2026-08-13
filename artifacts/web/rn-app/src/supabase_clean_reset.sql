-- ============================================================================
-- LINEUP 2.0 - SUPABASE CLEAN DATABASE RESET & MASTER DATA SEED SCRIPT
-- ============================================================================
-- Description:
-- Clears all test transactional records (appointments, favorites, reviews, etc.)
-- and seeds cleanly default master records using valid UUIDs.
-- ============================================================================

-- Disable triggers temporarily for smooth cleanup
SET session_replication_role = 'replica';

-- 1. CLEAR TRANSACTIONAL TEST DATA
-- Note: PostgreSQL TRUNCATE does not support "IF EXISTS".
-- List only the tables that exist. Remove from list if they cause errors.
TRUNCATE TABLE
    appointments,
    favorites,
    reviews,
    subscriptions,
    customers
RESTART IDENTITY CASCADE;

-- 2. CREATE SCHEMA FOR SUBSCRIPTIONS (If not exists)
CREATE TABLE IF NOT EXISTS public.customers (
    customer_id TEXT PRIMARY KEY,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id TEXT UNIQUE,
    customer_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    business_id BIGINT REFERENCES public.barbershops(id) ON DELETE CASCADE,
    status TEXT,
    price_id TEXT,
    product_id TEXT,
    employee_limit INTEGER DEFAULT 1,
    paddle_customer_id TEXT,
    paddle_subscription_id TEXT UNIQUE,
    paddle_product_id TEXT,
    paddle_price_id TEXT,
    plan_id TEXT,
    plan_name TEXT,
    billing_cycle TEXT,
    amount DECIMAL(10,2),
    currency TEXT DEFAULT 'EUR',
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT false,
    subscription_start_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    subscription_end_date TIMESTAMP WITH TIME ZONE,
    last_payment_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS and Policies
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public access' AND tablename = 'subscriptions') THEN
        CREATE POLICY "Allow public access" ON public.subscriptions FOR ALL USING (true);
    END IF;
END $$;

-- Re-enable triggers
SET session_replication_role = 'origin';

-- 3. RE-SEED MASTER DATA: CATEGORIES
-- Using actual UUIDs from defaultCategories.ts
DELETE FROM categories;
INSERT INTO categories (id, name, icon) VALUES
('f7658e9f-8aa1-4ea8-9a7c-b995636d32c2', 'Flokë & Stilim', '💇'),
('602660e1-04c2-4d42-bd34-22cf4fa19474', 'Mjekër & Estetikë', '🧔'),
('208ed6e4-a97c-49c5-878a-d29cdc9e0570', 'Pako Combo (Flokë + Mjekërr)', '👑'),
('bfc791d2-abd0-4377-813b-566c63f8c0fd', 'Trajtime Fytyre & Larje', '🧖');

-- 4. RE-SEED MASTER DATA: SUBCATEGORIES
-- Using actual UUIDs from defaultCategories.ts
DELETE FROM subcategories;
INSERT INTO subcategories (id, category_id, name) VALUES
('4c3c4386-cb9f-4031-bc96-5c6716e1f99d', 'f7658e9f-8aa1-4ea8-9a7c-b995636d32c2', 'Prerje Fade / Skin Fade'),
('7f3dff40-83ae-46f5-a06b-851a8cc50aea', 'f7658e9f-8aa1-4ea8-9a7c-b995636d32c2', 'Stilim Flokësh'),
('78a2d39b-97a2-4a76-a03e-3247e737e9b7', 'f7658e9f-8aa1-4ea8-9a7c-b995636d32c2', 'Larje Flokësh'),
('af76fdc0-0b29-434a-8e9b-20ea730ef66d', '602660e1-04c2-4d42-bd34-22cf4fa19474', 'Shkurtim Mjekre'),
('67320091-fe3e-4a84-bb62-802a1eb9f5f5', '602660e1-04c2-4d42-bd34-22cf4fa19474', 'Rrojë me Peshqir të Nxehtë'),
('1b087d03-4e74-4303-a77b-31a0532bf65b', '208ed6e4-a97c-49c5-878a-d29cdc9e0570', 'VIP Combo (Flokë + Mjekërr + Masazh)'),
('1d965fd2-aaa4-46c5-bc4f-23b056c4cca7', 'bfc791d2-abd0-4377-813b-566c63f8c0fd', 'Maskë e Zezë & Scrub Fytyre');

-- 5. RE-SEED MASTER DATA: ADVERTISEMENTS (REKLAMAT)
DELETE FROM advertisements;
INSERT INTO advertisements (business_name, description, image_url, url, status, only_button) VALUES
('Vehees', 'Zbulo historikun e veturës tënde. Kontrollo çdo VIN në sekonda.', 'vehees_banner.jpg', 'https://vehees.com/', 'active', true),
('noasim', 'Udhëzues eSIM për udhëtim. Udhëzues praktikë për çdo udhëtim.', 'noasim_banner.jpg', 'https://noasim.com/guides', 'active', true),
('NOA IPTV', 'Pako Premium', 'noaiptv_banner.jpg', 'https://noaiptv.com', 'active', true),
('Technova', 'Partneri juaj teknologjik', 'technova_banner.jpg', 'https://technova-ks.com', 'active', true);

-- Verification Summary Output
SELECT 
  (SELECT COUNT(*) FROM categories) as total_categories,
  (SELECT COUNT(*) FROM subcategories) as total_subcategories,
  (SELECT COUNT(*) FROM advertisements) as total_advertisements,
  (SELECT COUNT(*) FROM appointments) as remaining_test_appointments,
  (SELECT COUNT(*) FROM favorites) as remaining_test_favorites,
  (SELECT COUNT(*) FROM reviews) as remaining_test_reviews,
  (SELECT COUNT(*) FROM subscriptions) as remaining_subscriptions;
