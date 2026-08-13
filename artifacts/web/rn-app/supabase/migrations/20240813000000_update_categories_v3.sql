-- 1. Update Schema to support Gender-Based Filtering
ALTER TABLE public.barbershops
ADD COLUMN IF NOT EXISTS target_audience TEXT DEFAULT 'both' CHECK (target_audience IN ('men', 'women', 'both'));

ALTER TABLE public.categories
ADD COLUMN IF NOT EXISTS target_audience TEXT DEFAULT 'both' CHECK (target_audience IN ('men', 'women', 'both'));

-- 2. Clear old categories (Transactional data preservation depends on how you want to handle existing shops)
-- Since we are doing a "Start Fresh" style update as requested:
TRUNCATE TABLE public.subcategories CASCADE;
DELETE FROM public.categories;

-- 3. Insert Men's Categories
INSERT INTO public.categories (id, name, icon, target_audience) VALUES
('b1010000-0000-4000-8000-000000000001', '✂️ Haircuts (M)', '✂️', 'men'),
('b1010000-0000-4000-8000-000000000002', '🧔 Beard Services', '🧔', 'men'),
('b1010000-0000-4000-8000-000000000003', '🎨 Hair Color (M)', '🎨', 'men'),
('b1010000-0000-4000-8000-000000000004', '💆 Hair & Scalp Care (M)', '💆', 'men'),
('b1010000-0000-4000-8000-000000000005', '👁️ Grooming (M)', '👁️', 'men'),
('b1010000-0000-4000-8000-000000000006', '🧖 Facial Care (M)', '🧖', 'men'),
('b1010000-0000-4000-8000-000000000007', '📦 Packages (M)', '📦', 'men');

-- 4. Insert Women's Categories
INSERT INTO public.categories (id, name, icon, target_audience) VALUES
('f1010000-0000-4000-8000-000000000001', '✂️ Haircuts (F)', '✂️', 'women'),
('f1010000-0000-4000-8000-000000000002', '🎨 Hair Coloring (F)', '🎨', 'women'),
('f1010000-0000-4000-8000-000000000003', '💆 Hair Treatments (F)', '💆', 'women'),
('f1010000-0000-4000-8000-000000000004', '💇 Hair Styling (F)', '💇', 'women'),
('f1010000-0000-4000-8000-000000000005', '💇‍♀️ Hair Extensions', '💇‍♀️', 'women'),
('f1010000-0000-4000-8000-000000000006', '💄 Makeup', '💄', 'women'),
('f1010000-0000-4000-8000-000000000007', '👁️ Eyebrows & Eyelashes', '👁️', 'women'),
('f1010000-0000-4000-8000-000000000008', '💅 Nails', '💅', 'women'),
('f1010000-0000-4000-8000-000000000009', '🌸 Waxing', '🌸', 'women'),
('f1010000-0000-4000-8000-000000000010', '🧖 Facial & Skin Care (F)', '🧖', 'women'),
('f1010000-0000-4000-8000-000000000011', '💆 Spa & Massage (F)', '💆', 'women');

-- 5. Insert Men's Subcategories
-- Haircuts (M)
INSERT INTO public.subcategories (id, category_id, name) VALUES
(gen_random_uuid(), 'b1010000-0000-4000-8000-000000000001', 'Haircut'),
(gen_random_uuid(), 'b1010000-0000-4000-8000-000000000001', 'Skin Fade'),
(gen_random_uuid(), 'b1010000-0000-4000-8000-000000000001', 'Buzz Cut'),
(gen_random_uuid(), 'b1010000-0000-4000-8000-000000000001', 'Kids Haircut'),
(gen_random_uuid(), 'b1010000-0000-4000-8000-000000000001', 'Senior Haircut'),
(gen_random_uuid(), 'b1010000-0000-4000-8000-000000000001', 'Head Shave');
-- Beard Services
INSERT INTO public.subcategories (id, category_id, name) VALUES
(gen_random_uuid(), 'b1010000-0000-4000-8000-000000000002', 'Beard Trim'),
(gen_random_uuid(), 'b1010000-0000-4000-8000-000000000002', 'Beard Shaping'),
(gen_random_uuid(), 'b1010000-0000-4000-8000-000000000002', 'Hot Towel Shave'),
(gen_random_uuid(), 'b1010000-0000-4000-8000-000000000002', 'Beard Coloring');
-- Hair Color (M)
INSERT INTO public.subcategories (id, category_id, name) VALUES
(gen_random_uuid(), 'b1010000-0000-4000-8000-000000000003', 'Hair Coloring'),
(gen_random_uuid(), 'b1010000-0000-4000-8000-000000000003', 'Hair Bleaching'),
(gen_random_uuid(), 'b1010000-0000-4000-8000-000000000003', 'Grey Coverage');
-- Hair & Scalp Care (M)
INSERT INTO public.subcategories (id, category_id, name) VALUES
(gen_random_uuid(), 'b1010000-0000-4000-8000-000000000004', 'Hair Wash'),
(gen_random_uuid(), 'b1010000-0000-4000-8000-000000000004', 'Hair Styling'),
(gen_random_uuid(), 'b1010000-0000-4000-8000-000000000004', 'Scalp Treatment'),
(gen_random_uuid(), 'b1010000-0000-4000-8000-000000000004', 'Hair Treatment');
-- Grooming (M)
INSERT INTO public.subcategories (id, category_id, name) VALUES
(gen_random_uuid(), 'b1010000-0000-4000-8000-000000000005', 'Eyebrow Trim'),
(gen_random_uuid(), 'b1010000-0000-4000-8000-000000000005', 'Nose Wax'),
(gen_random_uuid(), 'b1010000-0000-4000-8000-000000000005', 'Ear Wax');
-- Facial Care (M)
INSERT INTO public.subcategories (id, category_id, name) VALUES
(gen_random_uuid(), 'b1010000-0000-4000-8000-000000000006', 'Facial Treatment'),
(gen_random_uuid(), 'b1010000-0000-4000-8000-000000000006', 'Deep Facial Cleansing'),
(gen_random_uuid(), 'b1010000-0000-4000-8000-000000000006', 'Black Mask Facial'),
(gen_random_uuid(), 'b1010000-0000-4000-8000-000000000006', 'Face Scrub');
-- Packages (M)
INSERT INTO public.subcategories (id, category_id, name) VALUES
(gen_random_uuid(), 'b1010000-0000-4000-8000-000000000007', 'Haircut + Beard'),
(gen_random_uuid(), 'b1010000-0000-4000-8000-000000000007', 'Haircut + Wash'),
(gen_random_uuid(), 'b1010000-0000-4000-8000-000000000007', 'Full Grooming Package');

-- 6. Insert Women's Subcategories
-- Haircuts (F)
INSERT INTO public.subcategories (id, category_id, name) VALUES
(gen_random_uuid(), 'f1010000-0000-4000-8000-000000000001', 'Women''s Haircut'),
(gen_random_uuid(), 'f1010000-0000-4000-8000-000000000001', 'Bangs Trim'),
(gen_random_uuid(), 'f1010000-0000-4000-8000-000000000001', 'Kids Haircut');
-- Hair Coloring (F)
INSERT INTO public.subcategories (id, category_id, name) VALUES
(gen_random_uuid(), 'f1010000-0000-4000-8000-000000000002', 'Full Color'),
(gen_random_uuid(), 'f1010000-0000-4000-8000-000000000002', 'Root Touch-up'),
(gen_random_uuid(), 'f1010000-0000-4000-8000-000000000002', 'Highlights'),
(gen_random_uuid(), 'f1010000-0000-4000-8000-000000000002', 'Balayage'),
(gen_random_uuid(), 'f1010000-0000-4000-8000-000000000002', 'Ombre'),
(gen_random_uuid(), 'f1010000-0000-4000-8000-000000000002', 'Toner'),
(gen_random_uuid(), 'f1010000-0000-4000-8000-000000000002', 'Hair Gloss'),
(gen_random_uuid(), 'f1010000-0000-4000-8000-000000000002', 'Bleaching'),
(gen_random_uuid(), 'f1010000-0000-4000-8000-000000000002', 'Color Correction');
-- Hair Treatments (F)
INSERT INTO public.subcategories (id, category_id, name) VALUES
(gen_random_uuid(), 'f1010000-0000-4000-8000-000000000003', 'Hair Treatment Mask'),
(gen_random_uuid(), 'f1010000-0000-4000-8000-000000000003', 'Keratin Treatment'),
(gen_random_uuid(), 'f1010000-0000-4000-8000-000000000003', 'Hair Botox'),
(gen_random_uuid(), 'f1010000-0000-4000-8000-000000000003', 'Scalp Treatment'),
(gen_random_uuid(), 'f1010000-0000-4000-8000-000000000003', 'Deep Conditioning'),
(gen_random_uuid(), 'f1010000-0000-4000-8000-000000000003', 'Protein Treatment'),
(gen_random_uuid(), 'f1010000-0000-4000-8000-000000000003', 'Hair Spa');
-- Hair Styling (F)
INSERT INTO public.subcategories (id, category_id, name) VALUES
(gen_random_uuid(), 'f1010000-0000-4000-8000-000000000004', 'Blow Dry'),
(gen_random_uuid(), 'f1010000-0000-4000-8000-000000000004', 'Hair Styling'),
(gen_random_uuid(), 'f1010000-0000-4000-8000-000000000004', 'Straightening'),
(gen_random_uuid(), 'f1010000-0000-4000-8000-000000000004', 'Curl Styling'),
(gen_random_uuid(), 'f1010000-0000-4000-8000-000000000004', 'Bridal Hairstyle'),
(gen_random_uuid(), 'f1010000-0000-4000-8000-000000000004', 'Evening Hairstyle');
-- Hair Extensions
INSERT INTO public.subcategories (id, category_id, name) VALUES
(gen_random_uuid(), 'f1010000-0000-4000-8000-000000000005', 'Hair Extensions'),
(gen_random_uuid(), 'f1010000-0000-4000-8000-000000000005', 'Extension Refill'),
(gen_random_uuid(), 'f1010000-0000-4000-8000-000000000005', 'Extension Removal');
-- Makeup
INSERT INTO public.subcategories (id, category_id, name) VALUES
(gen_random_uuid(), 'f1010000-0000-4000-8000-000000000006', 'Day Makeup'),
(gen_random_uuid(), 'f1010000-0000-4000-8000-000000000006', 'Evening Makeup'),
(gen_random_uuid(), 'f1010000-0000-4000-8000-000000000006', 'Bridal Makeup'),
(gen_random_uuid(), 'f1010000-0000-4000-8000-000000000006', 'Photoshoot Makeup');
-- Eyebrows & Eyelashes
INSERT INTO public.subcategories (id, category_id, name) VALUES
(gen_random_uuid(), 'f1010000-0000-4000-8000-000000000007', 'Eyebrow Shaping'),
(gen_random_uuid(), 'f1010000-0000-4000-8000-000000000007', 'Eyebrow Tint'),
(gen_random_uuid(), 'f1010000-0000-4000-8000-000000000007', 'Brow Lamination'),
(gen_random_uuid(), 'f1010000-0000-4000-8000-000000000007', 'Lash Lift'),
(gen_random_uuid(), 'f1010000-0000-4000-8000-000000000007', 'Lash Tint'),
(gen_random_uuid(), 'f1010000-0000-4000-8000-000000000007', 'Classic Lash Extensions'),
(gen_random_uuid(), 'f1010000-0000-4000-8000-000000000007', 'Volume Lash Extensions'),
(gen_random_uuid(), 'f1010000-0000-4000-8000-000000000007', 'Lash Refill');
-- Nails
INSERT INTO public.subcategories (id, category_id, name) VALUES
(gen_random_uuid(), 'f1010000-0000-4000-8000-000000000008', 'Classic Manicure'),
(gen_random_uuid(), 'f1010000-0000-4000-8000-000000000008', 'Gel Manicure'),
(gen_random_uuid(), 'f1010000-0000-4000-8000-000000000008', 'Acrylic Nails'),
(gen_random_uuid(), 'f1010000-0000-4000-8000-000000000008', 'Nail Refill'),
(gen_random_uuid(), 'f1010000-0000-4000-8000-000000000008', 'Nail Art'),
(gen_random_uuid(), 'f1010000-0000-4000-8000-000000000008', 'Classic Pedicure'),
(gen_random_uuid(), 'f1010000-0000-4000-8000-000000000008', 'Gel Pedicure'),
(gen_random_uuid(), 'f1010000-0000-4000-8000-000000000008', 'Spa Pedicure');
-- Waxing
INSERT INTO public.subcategories (id, category_id, name) VALUES
(gen_random_uuid(), 'f1010000-0000-4000-8000-000000000009', 'Face Wax'),
(gen_random_uuid(), 'f1010000-0000-4000-8000-000000000009', 'Arms Wax'),
(gen_random_uuid(), 'f1010000-0000-4000-8000-000000000009', 'Underarm Wax'),
(gen_random_uuid(), 'f1010000-0000-4000-8000-000000000009', 'Legs Wax'),
(gen_random_uuid(), 'f1010000-0000-4000-8000-000000000009', 'Bikini Wax'),
(gen_random_uuid(), 'f1010000-0000-4000-8000-000000000009', 'Brazilian Wax'),
(gen_random_uuid(), 'f1010000-0000-4000-8000-000000000009', 'Full Body Wax');
-- Facial & Skin Care (F)
INSERT INTO public.subcategories (id, category_id, name) VALUES
(gen_random_uuid(), 'f1010000-0000-4000-8000-000000000010', 'Facial Cleansing'),
(gen_random_uuid(), 'f1010000-0000-4000-8000-000000000010', 'Hydrating Facial'),
(gen_random_uuid(), 'f1010000-0000-4000-8000-000000000010', 'Anti-Aging Facial'),
(gen_random_uuid(), 'f1010000-0000-4000-8000-000000000010', 'Acne Treatment'),
(gen_random_uuid(), 'f1010000-0000-4000-8000-000000000010', 'Skin Peeling'),
(gen_random_uuid(), 'f1010000-0000-4000-8000-000000000010', 'Face Massage');
-- Spa & Massage (F)
INSERT INTO public.subcategories (id, category_id, name) VALUES
(gen_random_uuid(), 'f1010000-0000-4000-8000-000000000011', 'Relax Massage'),
(gen_random_uuid(), 'f1010000-0000-4000-8000-000000000011', 'Body Massage'),
(gen_random_uuid(), 'f1010000-0000-4000-8000-000000000011', 'Neck & Shoulder Massage'),
(gen_random_uuid(), 'f1010000-0000-4000-8000-000000000011', 'Body Scrub');
