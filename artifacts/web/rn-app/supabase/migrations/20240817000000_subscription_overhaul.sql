-- Subscription Overhaul Migration

-- 1. Enhance subscriptions table
ALTER TABLE public.subscriptions
ADD COLUMN IF NOT EXISTS next_billed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_event_id TEXT;

-- 2. Enhance subscription_payments table
ALTER TABLE public.subscription_payments
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS plan_id TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completed';

-- 3. Add index for idempotency check
CREATE INDEX IF NOT EXISTS idx_subscriptions_last_event ON public.subscriptions(last_event_id);

-- 4. Ensure RLS is strict
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public access" ON public.subscriptions;

DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can view their own subscriptions" ON public.subscriptions
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.subscriptions;
CREATE POLICY "Admins can view all subscriptions" ON public.subscriptions
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND (role = 'super_admin' OR role = 'admin')
    )
);
