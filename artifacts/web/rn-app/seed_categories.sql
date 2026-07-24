-- 1. Krijo tabelën e kategorive kryesore (Categories)
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    icon TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Krijo tabelën e nënkategorive (Subcategories)
CREATE TABLE IF NOT EXISTS public.subcategories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Ndrysho tabelën e barbershops për të mbështetur nënkategoritë
ALTER TABLE public.barbershops
ADD COLUMN IF NOT EXISTS subcategories TEXT[] DEFAULT '{}';

-- 4. Fshij të dhënat e vjetra
TRUNCATE TABLE public.subcategories CASCADE;
TRUNCATE TABLE public.categories CASCADE;

-- 5. Fut Kategoritë dhe Nënkategoritë në SHQIP

-- Flokë & Stilim
WITH cat_hair AS (
    INSERT INTO public.categories (name, icon) VALUES ('Flokë & Stilim', '💇') RETURNING id
)
INSERT INTO public.subcategories (category_id, name)
SELECT id, unnest(ARRAY['Prerje Flokësh', 'Stilim Flokësh', 'Larje Flokësh', 'Tharje / Fenixh', 'Ngjyrosje Flokësh', 'Fije & Balayage', 'Trajtim Flokësh', 'Trajtim me Keratinë', 'Zgjatime Flokësh', 'Drejtim Flokësh', 'Ondulim / Perm'])
FROM cat_hair;

-- Mjekër & Estetikë
WITH cat_beard AS (
    INSERT INTO public.categories (name, icon) VALUES ('Mjekër & Estetikë', '🧔') RETURNING id
)
INSERT INTO public.subcategories (category_id, name)
SELECT id, unnest(ARRAY['Shkurtim Mjekrre', 'Formësim Mjekrre', 'Rrojë me Peshqir të Nxehtë', 'Shkurtim Mustaqesh', 'Estetikë Fytyre'])
FROM cat_beard;

-- Thonjtë
WITH cat_nails AS (
    INSERT INTO public.categories (name, icon) VALUES ('Thonjtë', '💅') RETURNING id
)
INSERT INTO public.subcategories (category_id, name)
SELECT id, unnest(ARRAY['Manikyr', 'Pedikyr', 'Thonj me Xhel', 'Thonj Akrilik', 'Art në Thonj', 'Riparim Thoi'])
FROM cat_nails;

-- Grim & Bukuri
WITH cat_makeup AS (
    INSERT INTO public.categories (name, icon) VALUES ('Grim & Bukuri', '💄') RETURNING id
)
INSERT INTO public.subcategories (category_id, name)
SELECT id, unnest(ARRAY['Grim', 'Grim për Nuse', 'Formësim Vetullash', 'Ngjyrosje Vetullash', 'Zgjatime Qerpikësh', 'Lash Lift', 'Laminim Vetullash'])
FROM cat_makeup;

-- Kujdesi i Lëkurës
WITH cat_skin AS (
    INSERT INTO public.categories (name, icon) VALUES ('Kujdesi i Lëkurës', '🧖') RETURNING id
)
INSERT INTO public.subcategories (category_id, name)
SELECT id, unnest(ARRAY['Trajtim Fytyre', 'Pastrim i Thellë', 'Trajtim Hidratues', 'Trajtim Anti-Rrudhë', 'Trajtim Kundër Akneve', 'Konsultë për Lëkurën'])
FROM cat_skin;

-- Spa & Relaks
WITH cat_spa AS (
    INSERT INTO public.categories (name, icon) VALUES ('Spa & Relaks', '🧴') RETURNING id
)
INSERT INTO public.subcategories (category_id, name)
SELECT id, unnest(ARRAY['Masazh', 'Masazh Koke', 'Masazh Relaksues', 'Scrub Trupi', 'Trajtim Spa'])
FROM cat_spa;

-- Depilim
WITH cat_removal AS (
    INSERT INTO public.categories (name, icon) VALUES ('Depilim', '🪒') RETURNING id
)
INSERT INTO public.subcategories (category_id, name)
SELECT id, unnest(ARRAY['Depilim me Dyllë', 'Heqje me Pe', 'Depilim me Sheqer'])
FROM cat_removal;

-- Raste të Veçanta
WITH cat_special AS (
    INSERT INTO public.categories (name, icon) VALUES ('Raste të Veçanta', '👰') RETURNING id
)
INSERT INTO public.subcategories (category_id, name)
SELECT id, unnest(ARRAY['Paketa e Nuses', 'Paketa e Dhëndrit', 'Stilim për Event', 'Stilim për Mbrëmje'])
FROM cat_special;

-- RLS (Row Level Security)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read access on categories' AND tablename = 'categories') THEN
        CREATE POLICY "Allow public read access on categories" ON public.categories FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read access on subcategories' AND tablename = 'subcategories') THEN
        CREATE POLICY "Allow public read access on subcategories" ON public.subcategories FOR SELECT USING (true);
    END IF;
END $$;
