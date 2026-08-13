-- LINEUP SQL HELPER - ENABLE CASCADING DELETES
-- RUN THIS IN SUPABASE SQL EDITOR

-- 1. Cascading for Barbershops when Owner is deleted
ALTER TABLE public.barbershops
DROP CONSTRAINT IF EXISTS barbershops_owner_id_fkey,
ADD CONSTRAINT barbershops_owner_id_fkey
    FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- 2. Cascading for Barbers when Shop is deleted
ALTER TABLE public.barbers
DROP CONSTRAINT IF EXISTS barbers_shop_id_fkey,
ADD CONSTRAINT barbers_shop_id_fkey
    FOREIGN KEY (shop_id) REFERENCES public.barbershops(id) ON DELETE CASCADE;

-- 3. Cascading for Appointments when Shop is deleted
ALTER TABLE public.appointments
DROP CONSTRAINT IF EXISTS appointments_shop_id_fkey,
ADD CONSTRAINT appointments_shop_id_fkey
    FOREIGN KEY (shop_id) REFERENCES public.barbershops(id) ON DELETE CASCADE;

-- 4. Cascading for Schedules when Barber is deleted
ALTER TABLE public.barber_schedules
DROP CONSTRAINT IF EXISTS barber_schedules_barber_id_fkey,
ADD CONSTRAINT barber_schedules_barber_id_fkey
    FOREIGN KEY (barber_id) REFERENCES public.barbers(id) ON DELETE CASCADE;

-- 5. Cascading for Barber Services when Barber is deleted
ALTER TABLE public.barber_services
DROP CONSTRAINT IF EXISTS barber_services_barber_id_fkey,
ADD CONSTRAINT barber_services_barber_id_fkey
    FOREIGN KEY (barber_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- 6. Cascading for Favorites when User or Shop is deleted
ALTER TABLE public.favorites
DROP CONSTRAINT IF EXISTS favorites_user_id_fkey,
ADD CONSTRAINT favorites_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
DROP CONSTRAINT IF EXISTS favorites_shop_id_fkey,
ADD CONSTRAINT favorites_shop_id_fkey
    FOREIGN KEY (shop_id) REFERENCES public.barbershops(id) ON DELETE CASCADE;

-- 7. Cascading for Reviews when Shop or User is deleted
ALTER TABLE public.reviews
DROP CONSTRAINT IF EXISTS reviews_shop_id_fkey,
ADD CONSTRAINT reviews_shop_id_fkey
    FOREIGN KEY (shop_id) REFERENCES public.barbershops(id) ON DELETE CASCADE,
DROP CONSTRAINT IF EXISTS reviews_user_id_fkey,
ADD CONSTRAINT reviews_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
