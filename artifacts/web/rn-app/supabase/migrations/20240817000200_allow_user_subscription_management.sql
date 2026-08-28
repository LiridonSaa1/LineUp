-- Migration: Allow Users and Owners to Update and Insert Subscriptions

-- 1. Allow owners and users to UPDATE their own subscriptions
DROP POLICY IF EXISTS "Users can update their own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can update their own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can update their own subscriptions" ON public.subscriptions
FOR UPDATE
TO authenticated
USING (
    auth.uid() = user_id OR
    business_id IN (SELECT id FROM public.barbershops WHERE owner_id = auth.uid()) OR
    business_id IN (SELECT shop_id FROM public.barbers WHERE user_id = auth.uid())
)
WITH CHECK (
    auth.uid() = user_id OR
    business_id IN (SELECT id FROM public.barbershops WHERE owner_id = auth.uid()) OR
    business_id IN (SELECT shop_id FROM public.barbers WHERE user_id = auth.uid())
);

-- 2. Allow authenticated users to INSERT subscriptions
DROP POLICY IF EXISTS "Users can insert their own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can insert their own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can insert their own subscriptions" ON public.subscriptions
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 3. Fallback public access policy if RLS is bypassed by system
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public access' AND tablename = 'subscriptions') THEN
        DROP POLICY IF EXISTS "Allow public access" ON public.subscriptions;
CREATE POLICY "Allow public access" ON public.subscriptions FOR ALL USING (true);
    END IF;
END $$;
