-- Migration: Subscription Schema Hardening & Performance Indexing

-- 1. Ensure all essential columns exist in public.subscriptions
ALTER TABLE public.subscriptions
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS business_id BIGINT REFERENCES public.barbershops(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS paddle_customer_id TEXT,
ADD COLUMN IF NOT EXISTS paddle_subscription_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS paddle_product_id TEXT,
ADD COLUMN IF NOT EXISTS paddle_price_id TEXT,
ADD COLUMN IF NOT EXISTS plan_id TEXT,
ADD COLUMN IF NOT EXISTS plan_name TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS amount NUMERIC(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'EUR',
ADD COLUMN IF NOT EXISTS billing_cycle TEXT DEFAULT 'month',
ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS next_billed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS card_brand TEXT,
ADD COLUMN IF NOT EXISTS card_last4 TEXT,
ADD COLUMN IF NOT EXISTS card_exp_month INT,
ADD COLUMN IF NOT EXISTS card_exp_year INT,
ADD COLUMN IF NOT EXISTS last_event_id TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Indexes for high-performance lookup on reload
CREATE INDEX IF NOT EXISTS idx_subscriptions_shop_user ON public.subscriptions(business_id, user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_subscriptions_paddle_id ON public.subscriptions(paddle_subscription_id);

-- 3. RLS Security Policies
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can view their own subscriptions"
ON public.subscriptions
FOR SELECT
TO authenticated
USING (
    auth.uid() = user_id OR
    business_id IN (SELECT id FROM public.barbershops WHERE owner_id = auth.uid()) OR
    business_id IN (SELECT shop_id FROM public.barbers WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can update their own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can update their own subscriptions"
ON public.subscriptions
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

DROP POLICY IF EXISTS "Users can insert their own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can insert their own subscriptions"
ON public.subscriptions
FOR INSERT
TO authenticated
WITH CHECK (true);
