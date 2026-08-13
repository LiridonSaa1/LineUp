-- STORAGE BUCKETS SETUP
-- RUN THIS IN SUPABASE SQL EDITOR TO INITIALIZE STORAGE

-- 1. Create buckets if they don't exist
INSERT INTO storage.buckets (id, name, public)
VALUES
    ('barbershops', 'barbershops', true),
    ('images', 'images', true),
    ('photos', 'photos', true),
    ('public', 'public', true),
    ('uploads', 'uploads', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Enable RLS on storage.objects (usually enabled by default in Supabase)
-- 3. Set up Public Access (Allow anyone to read images)
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
USING ( bucket_id IN ('barbershops', 'images', 'photos', 'public', 'uploads') );

-- 4. Set up Authenticated Upload (Allow logged-in users to upload)
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id IN ('barbershops', 'images', 'photos', 'public', 'uploads') );

-- 5. Set up Owner Delete (Allow users to delete their own uploads)
-- Note: This assumes owner is recorded in storage.objects.owner, which Supabase does automatically for authenticated users
CREATE POLICY "Owner Delete Access"
ON storage.objects FOR DELETE
TO authenticated
USING ( auth.uid() = owner );
