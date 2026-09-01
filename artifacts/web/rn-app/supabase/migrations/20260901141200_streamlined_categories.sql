-- Migration: Streamlined Categories and Subcategories

TRUNCATE TABLE public.subcategories CASCADE;
DELETE FROM public.categories;

-- 1. Insert 8 Main Categories
INSERT INTO public.categories (id, name, icon, target_audience) VALUES
('c1000000-0000-0000-0000-000000000001', 'Flokët', 'Scissors', 'both'),
('c1000000-0000-0000-0000-000000000002', 'Mjekra & Rruajtja', 'User', 'men'),
('c1000000-0000-0000-0000-000000000003', 'Ngjyrosja', 'Palette', 'both'),
('c1000000-0000-0000-0000-000000000004', 'Paketa', 'Sparkles', 'both'),
('c1000000-0000-0000-0000-000000000005', 'Vetulla & Qerpikë', 'Eye', 'both'),
('c1000000-0000-0000-0000-000000000006', 'Thonjtë', 'Hand', 'both'),
('c1000000-0000-0000-0000-000000000007', 'Makeup', 'Smile', 'women'),
('c1000000-0000-0000-0000-000000000008', 'Depilim & Trup', 'Zap', 'both');

-- 2. Insert Subcategories
-- 1. Flokët
INSERT INTO public.subcategories (id, category_id, name) VALUES
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000001', 'Prerje flokësh'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000001', 'Larje flokësh'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000001', 'Stilim flokësh'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000001', 'Frizurë'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000001', 'Trajtim flokësh');

-- 2. Mjekra & Rruajtja
INSERT INTO public.subcategories (id, category_id, name) VALUES
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000002', 'Rregullim mjekre'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000002', 'Rruajtje'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000002', 'Rruajtje koke'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000002', 'Ngjyrosje mjekre');

-- 3. Ngjyrosja
INSERT INTO public.subcategories (id, category_id, name) VALUES
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000003', 'Ngjyrosje flokësh'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000003', 'Ngjyrosje rrënjësh'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000003', 'Fije & Balayage'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000003', 'Zbardhim'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000003', 'Toner');

-- 4. Paketa
INSERT INTO public.subcategories (id, category_id, name) VALUES
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000004', 'Paketa për Nuse'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000004', 'Paketa për Dhëndër'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000004', 'Paketa për Event'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000004', 'Paketa për Dasmë'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000004', 'Paketa të personalizuara');

-- 5. Vetulla & Qerpikë
INSERT INTO public.subcategories (id, category_id, name) VALUES
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000005', 'Vetulla'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000005', 'Ngjyrosje vetullash'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000005', 'Laminim vetullash'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000005', 'Qerpikë'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000005', 'Lash Lift');

-- 6. Thonjtë
INSERT INTO public.subcategories (id, category_id, name) VALUES
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000006', 'Manikyr'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000006', 'Pedikyr'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000006', 'Xhel'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000006', 'Zgjatje thonjsh'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000006', 'Dizajn thonjsh'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000006', 'Heqje xheli');

-- 7. Makeup
INSERT INTO public.subcategories (id, category_id, name) VALUES
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000007', 'Makeup'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000007', 'Makeup për Event'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000007', 'Makeup për Nuse'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000007', 'Makeup për Foto');

-- 8. Depilim & Trup
INSERT INTO public.subcategories (id, category_id, name) VALUES
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000008', 'Depilim fytyre'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000008', 'Depilim trupi'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000008', 'Depilim këmbësh'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000008', 'Depilim duarsh'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000008', 'Depilim me laser');
