-- DEMO SHOP SEED SCRIPT
-- REPLACE 'YOUR_USER_ID' with your actual Auth ID from Supabase

DO $$
DECLARE
    v_user_id UUID := 'YOUR_USER_ID'; -- CHANGE THIS
    v_shop_id BIGINT;
    v_barber_id UUID;
BEGIN
    -- 1. Ensure user exists in public.users (if not already synced)
    INSERT INTO public.users (id, email, name, role)
    VALUES (v_user_id, 'demo@lineup.com', 'Demo Owner', 'owner')
    ON CONFLICT (id) DO NOTHING;

    -- 2. Create Barbershop
    INSERT INTO public.barbershops (owner_id, name, city, address, latitude, longitude, status, category)
    VALUES (v_user_id, 'LineUp Demo Salon', 'Prishtinë', 'Rruga B, Prishtinë', 42.6629, 21.1655, 'active', 'Flokë & Stilim')
    RETURNING id INTO v_shop_id;

    -- 3. Create Barber (The Owner as a Barber)
    INSERT INTO public.barbers (user_id, shop_id, name, is_active)
    VALUES (v_user_id, v_shop_id, 'Artan (Demo)', true)
    RETURNING id INTO v_barber_id;

    -- 4. Add Services for the Barber
    INSERT INTO public.barber_services (barber_id, subcategory_id, duration_minutes, price, shop_id)
    VALUES
    (v_user_id, '4c3c4386-cb9f-4031-bc96-5c6716e1f99d', 30, 10, v_shop_id), -- Prerje
    (v_user_id, 'af76fdc0-0b29-434a-8e9b-20ea730ef66d', 15, 5, v_shop_id);  -- Mjekrre

    -- 5. Set Schedule for all 7 days
    INSERT INTO public.barber_schedules (barber_id, day_of_week, is_closed, start_time, end_time)
    SELECT v_barber_id, d, false, '09:00', '18:00'
    FROM generate_series(0, 6) d;

    RAISE NOTICE 'Demo shop created with ID: %', v_shop_id;
END $$;
