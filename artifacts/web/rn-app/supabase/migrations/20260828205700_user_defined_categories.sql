-- Migration: User-Defined Albanian Categories and Subcategories with Gender Targeting

TRUNCATE TABLE public.subcategories CASCADE;
DELETE FROM public.categories;

-- 1. Insert 8 Main Categories
INSERT INTO public.categories (id, name, icon, target_audience) VALUES
('c1000000-0000-0000-0000-000000000001', 'Flokët', 'Scissors', 'both'),
('c1000000-0000-0000-0000-000000000002', 'Mjekra & Rruajtja', 'User', 'men'),
('c1000000-0000-0000-0000-000000000003', 'Ngjyrosja e Flokëve', 'Palette', 'both'),
('c1000000-0000-0000-0000-000000000004', 'Paketa Speciale', 'Sparkles', 'both'),
('c1000000-0000-0000-0000-000000000005', 'Vetulla & Qerpikë', 'Eye', 'both'),
('c1000000-0000-0000-0000-000000000006', 'Thonjtë', 'Hand', 'both'),
('c1000000-0000-0000-0000-000000000007', 'Makeup', 'Smile', 'women'),
('c1000000-0000-0000-0000-000000000008', 'Depilim & Kujdes Trupi', 'Zap', 'both');

-- 2. Insert Subcategories
-- 1. Flokët
INSERT INTO public.subcategories (id, category_id, name) VALUES
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000001', 'Prerje flokësh'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000001', 'Skin Fade'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000001', 'Buzz Cut'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000001', 'Prerje për fëmijë'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000001', 'Prerje me makinë'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000001', 'Larje flokësh'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000001', 'Larje dhe stilim'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000001', 'Stilim flokësh'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000001', 'Frizurë për event'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000001', 'Frizurë për nuse'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000001', 'Frizurë për fejesë'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000001', 'Trajtim për flokë');

-- 2. Mjekra & Rruajtja
INSERT INTO public.subcategories (id, category_id, name) VALUES
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000002', 'Rregullim mjekre'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000002', 'Formësim mjekre'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000002', 'Rruajtje me brisk'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000002', 'Rruajtje tradicionale me peshqir të nxehtë'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000002', 'Rruajtje koke'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000002', 'Prerje me makinë'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000002', 'Ngjyrosje mjekre');

-- 3. Ngjyrosja e Flokëve
INSERT INTO public.subcategories (id, category_id, name) VALUES
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000003', 'Ngjyrosje flokësh'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000003', 'Ngjyrosje rrënjësh'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000003', 'Mbulim i thinjave'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000003', 'Fije'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000003', 'Balayage'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000003', 'Ombre'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000003', 'Zbardhim flokësh'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000003', 'Toner');

-- 4. Paketa Speciale
INSERT INTO public.subcategories (id, category_id, name) VALUES
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000004', 'Paketa për Nuse'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000004', 'Paketa për Dhëndër'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000004', 'Paketa për Fejesë'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000004', 'Paketa për Event'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000004', 'Paketa për Dasmë'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000004', 'Paketa Çift'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000004', 'Paketa për Shoqëruese të Nuses'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000004', 'Paketa Familjare');

-- 5. Vetulla & Qerpikë
INSERT INTO public.subcategories (id, category_id, name) VALUES
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000005', 'Rregullim vetullash'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000005', 'Rregullim vetullash me pe'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000005', 'Ngjyrosje vetullash'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000005', 'Laminim vetullash'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000005', 'Lash Lift'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000005', 'Ngjyrosje qerpikësh');

-- 6. Thonjtë
INSERT INTO public.subcategories (id, category_id, name) VALUES
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000006', 'Manikyr klasik'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000006', 'Manikyr me xhel'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000006', 'Zgjatje thonjsh'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000006', 'Përforcim thonjsh'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000006', 'Heqje xheli'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000006', 'Dizajn thonjsh'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000006', 'Pedikyr klasik'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000006', 'Pedikyr me xhel'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000006', 'Kujdes për thonjtë');

-- 7. Makeup
INSERT INTO public.subcategories (id, category_id, name) VALUES
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000007', 'Makeup ditor'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000007', 'Makeup mbrëmjeje'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000007', 'Makeup për event'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000007', 'Makeup për fejesë'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000007', 'Makeup për nuse'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000007', 'Makeup për fotografi');

-- 8. Depilim & Kujdes Trupi
INSERT INTO public.subcategories (id, category_id, name) VALUES
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000008', 'Depilim me dyllë – fytyrë'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000008', 'Depilim me dyllë – trup'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000008', 'Depilim me laser'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000008', 'Depilim vetullash'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000008', 'Depilim buze'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000008', 'Depilim këmbësh'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000008', 'Depilim duarsh'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000008', 'Depilim shpine');
