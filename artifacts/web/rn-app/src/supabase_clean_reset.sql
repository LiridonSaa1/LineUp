-- ============================================================================
-- LINEUP 2.0 - SUPABASE CLEAN DATABASE RESET & MASTER DATA SEED SCRIPT
-- ============================================================================
-- Description:
-- Clears all test transactional records (appointments, favorites, reviews, etc.)
-- and seeds cleanly default master records for:
-- 1. Advertisements (Reklamat)
-- 2. Categories (Kategoritë e Shërbimeve)
-- 3. Subcategories (Nën-Kategoritë e Shërbimeve)
-- 4. Holidays (Festat Zyrtare)
-- ============================================================================

-- Disable triggers temporarily for smooth cleanup
SET session_replication_role = 'replica';

-- 1. CLEAR TRANSACTIONAL TEST DATA
TRUNCATE TABLE IF EXISTS appointments CASCADE;
TRUNCATE TABLE IF EXISTS favorites CASCADE;
TRUNCATE TABLE IF EXISTS reviews CASCADE;
TRUNCATE TABLE IF EXISTS notifications CASCADE;
TRUNCATE TABLE IF EXISTS user_coupons CASCADE;
TRUNCATE TABLE IF EXISTS waiting_list CASCADE;

-- Re-enable triggers
SET session_replication_role = 'DEFAULT';

-- 2. RE-SEED MASTER DATA: CATEGORIES
DELETE FROM categories;
INSERT INTO categories (id, name, slug, description, icon) VALUES
('cat_haircuts', 'Qethet & Stilizim', 'qethet-stilizim', 'Prerje moderne, klasike dhe stilim flokësh për meshkuj.', 'Scissors'),
('cat_beards', 'Mjekërr & Rrojë', 'mjekerr-rroje', 'Formësim mjekrës, rrojë me brisk dhe trajtim me peshqir të nxehtë.', 'Sparkles'),
('cat_combo', 'Pako Combo (Flokë + Mjekërr)', 'pako-combo', 'Kombinim i plotë për pamje perfekte me çmim me zbritje.', 'Crown'),
('cat_treatments', 'Trajtime Fytyre & Larje', 'trajtime-fytyre', 'Trajtime rinovuese të lëkurës, maska të zeza dhe larje me masazh.', 'Smile');

-- 3. RE-SEED MASTER DATA: SUBCATEGORIES
DELETE FROM subcategories;
INSERT INTO subcategories (id, category_id, name, description, duration_minutes, estimated_price) VALUES
('sub_fade', 'cat_haircuts', 'Prerje Fade / Skin Fade', 'Prerje me gradim me makinë dhe gërshërë.', 30, 10.00),
('sub_classic', 'cat_haircuts', 'Prerje Klasike me Gërshërë', 'Prerje tradicionale elegante me gërshërë.', 35, 8.00),
('sub_kids', 'cat_haircuts', 'Prerje për Fëmijë', 'Prerje e kujdesshme dhe miqësore për fëmijë.', 25, 7.00),
('sub_beard_trim', 'cat_beards', 'Formësim & Rregullim Mjekre', 'Rregullim gjatësie dhe linjash me brisk.', 20, 5.00),
('sub_hot_towel', 'cat_beards', 'Rrojë me Peshqir të Nxehtë', 'Rrojë me brisk tradicional dhe peshqir të avulluar.', 25, 7.00),
('sub_full_combo', 'cat_combo', 'VIP Combo (Flokë + Mjekërr + Masazh)', 'Pakoja jonë më e kompletuar.', 60, 18.00),
('sub_black_mask', 'cat_treatments', 'Maskë e Zezë & Scrub Fytyre', 'Pastrim i thellë i poreve dhe scrub me vitamina.', 20, 6.00);

-- 4. RE-SEED MASTER DATA: ADVERTISEMENTS (REKLAMAT)
DELETE FROM advertisements;
INSERT INTO advertisements (id, title, description, image_url, target_url, active, priority) VALUES
('ad_welcome', 'LineUp 2.0 — Rezervo me 1-Click', 'Zgjidh berberin tënd të preferuar dhe rezervo takimin pa pritje në radhë!', 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=1200&auto=format&fit=crop', '/search', true, 1),
('ad_pro_barber', 'Je Berber? Kaloni në LineUp Pro!', 'Menaxhoni sallonin, kalendarin dhe stafin me zero komisione.', 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=1200&auto=format&fit=crop', '/register-shop', true, 2),
('ad_discount', 'Zbritje 20% për Takimin e Parë', 'Përdor kodin LINEUP20 gjatë rezervimit për të përfituar zbritjen.', 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?q=80&w=1200&auto=format&fit=crop', '/search', true, 3),
('ad_noa_iptv', 'NOA IPTV', 'Pako Premium', 'noaiptv_banner.jpg', 'https://noaiptv.com', true, 4);

-- 5. RE-SEED MASTER DATA: HOLIDAYS (FESTAT ZYRTARE)
DELETE FROM holidays;
INSERT INTO holidays (id, name, date, is_recurring, note) VALUES
('hol_new_year_1', 'Viti i Ri (Dita 1)', '2026-01-01', true, 'Festa e Vitit të Ri'),
('hol_new_year_2', 'Viti i Ri (Dita 2)', '2026-01-02', true, 'Festa e Vitit të Ri'),
('hol_independence', 'Dita e Pavarësisë së Kosovës', '2026-02-17', true, 'Dita e Pavarësisë'),
('hol_easter', 'Pashkët Katolike', '2026-04-05', false, 'Festa e Pashkëve Katolike'),
('hol_orthodox_easter', 'Pashkët Ortodokse', '2026-04-12', false, 'Festa e Pashkëve Ortodokse'),
('hol_eid_fitr', 'Fitër Bajrami', '2026-03-20', false, 'Festë Zyrtare'),
('hol_eid_adha', 'Kurban Bajrami', '2026-05-27', false, 'Festë Zyrtare'),
('hol_may_day', 'Dita Ndërkombëtare e Punës', '2026-05-01', true, 'Dita e Punës'),
('hol_flag_day', 'Dita e Flamurit Kombëtar', '2026-11-28', true, 'Festa Kombëtare');

-- Verification Summary Output
SELECT 
  (SELECT COUNT(*) FROM categories) as total_categories,
  (SELECT COUNT(*) FROM subcategories) as total_subcategories,
  (SELECT COUNT(*) FROM advertisements) as total_advertisements,
  (SELECT COUNT(*) FROM holidays) as total_holidays,
  (SELECT COUNT(*) FROM appointments) as remaining_test_appointments,
  (SELECT COUNT(*) FROM favorites) as remaining_test_favorites,
  (SELECT COUNT(*) FROM reviews) as remaining_test_reviews;
