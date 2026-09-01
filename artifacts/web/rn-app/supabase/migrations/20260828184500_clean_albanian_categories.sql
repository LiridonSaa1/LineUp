-- Migration: Clean Albanian Categories & Subcategories without Emojis or Gender Tags

-- 1. Reset categories & subcategories to standard clean Albanian catalog
TRUNCATE TABLE public.subcategories CASCADE;
DELETE FROM public.categories;

-- 2. Insert Clean Categories
INSERT INTO public.categories (id, name, icon, target_audience) VALUES
('c1000000-0000-0000-0000-000000000001', 'Flokët & Prerje', 'Scissors', 'both'),
('c1000000-0000-0000-0000-000000000002', 'Mjekra & Rruajtja', 'User', 'men'),
('c1000000-0000-0000-0000-000000000003', 'Ngjyrosja e Flokëve', 'Palette', 'both'),
('c1000000-0000-0000-0000-000000000004', 'Kujdesi për Fytyrën', 'Shield', 'both'),
('c1000000-0000-0000-0000-000000000005', 'Vetulla & Qerpikë', 'Eye', 'both'),
('c1000000-0000-0000-0000-000000000006', 'Thonjtë', 'Hand', 'women'),
('c1000000-0000-0000-0000-000000000007', 'Makeup', 'Smile', 'women'),
('c1000000-0000-0000-0000-000000000008', 'Masazh & Spa', 'Sparkles', 'both');

-- 3. Insert Clean Subcategories
-- 1. Flokët & Prerje
INSERT INTO public.subcategories (id, category_id, name) VALUES
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000001', 'Prerje flokësh'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000001', 'Skin Fade'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000001', 'Buzz Cut'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000001', 'Prerje për fëmijë'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000001', 'Prerje majash'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000001', 'Larje & Stilim'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000001', 'Drejtim me Keratinë'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000001', 'Botox flokësh'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000001', 'Trajtim rigjenerues'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000001', 'Maskë ushqyese');

-- 2. Mjekra & Rruajtja
INSERT INTO public.subcategories (id, category_id, name) VALUES
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000002', 'Prerje & Rregullim mjekre'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000002', 'Formësim mjekre me brisk'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000002', 'Rruajtje tradicionale me peshqir të nxehtë'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000002', 'Rruajtje koke me brisk'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000002', 'Ngjyrosje mjekre'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000002', 'Kujdes me vajra mjekre');

-- 3. Ngjyrosja e Flokëve
INSERT INTO public.subcategories (id, category_id, name) VALUES
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000003', 'Ngjyrosje e plotë'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000003', 'Ngjyrosje rrënjësh'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000003', 'Mbulim i thinjave'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000003', 'Fije (Highlights)'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000003', 'Balayage'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000003', 'Ombre'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000003', 'Toner & Shkëlqim'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000003', 'Zbardhim flokësh');

-- 4. Kujdesi për Fytyrën
INSERT INTO public.subcategories (id, category_id, name) VALUES
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000004', 'Pastrim i thellë i fytyrës'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000004', 'Trajtim me avull & pika të zeza'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000004', 'Maskë e zezë (Black Mask)'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000004', 'Hidratim & Masazh fytyre'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000004', 'Peeling fytyre');

-- 5. Vetulla & Qerpikë
INSERT INTO public.subcategories (id, category_id, name) VALUES
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000005', 'Formësim vetullash me pe/pincetë'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000005', 'Ngjyrosje vetullash'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000005', 'Laminim vetullash'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000005', 'Lash Lift & Ngjyrosje qerpikësh'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000005', 'Zgjatime qerpikësh Klasik'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000005', 'Zgjatime qerpikësh Volum');

-- 6. Thonjtë
INSERT INTO public.subcategories (id, category_id, name) VALUES
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000006', 'Manikyr klasik'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000006', 'Manikyr me gjel'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000006', 'Thonj akrilik'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000006', 'Art & Dizajn thonjsh'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000006', 'Pedikyr klasik'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000006', 'Pedikyr mjekësor / me gjel');

-- 7. Makeup
INSERT INTO public.subcategories (id, category_id, name) VALUES
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000007', 'Makeup ditor'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000007', 'Makeup mbrëmjeje'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000007', 'Makeup nusërie'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000007', 'Grim profesional për evente');

-- 8. Masazh & Spa
INSERT INTO public.subcategories (id, category_id, name) VALUES
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000008', 'Masazh relaksues'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000008', 'Masazh shpine & qafe'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000008', 'Depilim me dyllë'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000008', 'Depilim me laser');
