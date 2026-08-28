-- Migration: Strict Subscriptions RLS Security Lockdown & Expiry Hardening

-- 1. Enable Row Level Security on public.subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- 2. Drop all insecure user-level write policies
DROP POLICY IF EXISTS "Users can update their own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can insert their own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Allow user update subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Allow user insert subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can modify their subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Allow insert subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Allow update subscription" ON public.subscriptions;

-- 3. Read-Only Policy: Authenticated users can ONLY SELECT their own subscription data
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can view their own subscriptions" ON public.subscriptions
FOR SELECT
TO authenticated
USING (
    auth.uid() = user_id OR
    business_id IN (SELECT id FROM public.barbershops WHERE owner_id = auth.uid()) OR
    business_id IN (SELECT shop_id FROM public.barbers WHERE user_id = auth.uid())
);

-- 4. Admins can view all subscriptions
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.subscriptions;
CREATE POLICY "Admins can view all subscriptions" ON public.subscriptions
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND (role = 'super_admin' OR role = 'admin')
    )
);
