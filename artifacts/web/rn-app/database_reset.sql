-- LINEUP FACTORY RESET SCRIPT
-- RUN THIS IN SUPABASE SQL EDITOR TO CLEAR ALL DATA

-- 1. Disable triggers temporarily to avoid errors during mass deletion
SET session_replication_role = 'replica';

-- 2. Truncate all application tables with CASCADE to handle foreign keys
-- This will also reset IDENTITY columns (like ID 1, 2, 3...)
TRUNCATE TABLE
    public.appointments,
    public.barbers,
    public.barbershops,
    public.barber_schedules,
    public.barber_services,
    public.favorites,
    public.reviews,
    public.subscriptions,
    public.subscription_payments,
    public.subscription_notifications,
    public.customers,
    public.advertisements,
    public.system_feedback,
    public.users
RESTART IDENTITY CASCADE;

-- 3. Optionally truncate metadata tables (Uncomment if you want to clear these too)
-- TRUNCATE TABLE public.categories, public.subcategories RESTART IDENTITY CASCADE;

-- 4. Re-enable triggers
SET session_replication_role = 'origin';

-- NOTE: This script does NOT delete Supabase Auth users.
-- You must delete users manually from the Authentication tab in Supabase dashboard.
