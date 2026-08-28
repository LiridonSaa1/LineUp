-- Enhanced Subscription System Migration

-- 1. Modify subscriptions table
ALTER TABLE public.subscriptions
ADD COLUMN IF NOT EXISTS business_id BIGINT REFERENCES public.barbershops(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMP WITH TIME ZONE DEFAULT now();

-- 2. Create subscription_payments table
CREATE TABLE IF NOT EXISTS public.subscription_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id BIGINT REFERENCES public.barbershops(id) ON DELETE CASCADE,
    subscription_id TEXT, -- Link to Paddle subscription ID
    payment_provider TEXT DEFAULT 'paddle',
    transaction_id TEXT UNIQUE,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'EUR',
    payment_status TEXT, -- 'completed', 'failed', 'refunded'
    paid_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Create subscription_notifications (optional but recommended for tracking)
CREATE TABLE IF NOT EXISTS public.subscription_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id BIGINT REFERENCES public.barbershops(id) ON DELETE CASCADE,
    type TEXT, -- '7_days_before', '3_days_before', 'expired', etc.
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Set up RLS for subscription_payments
ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can view their own payments" ON public.subscription_payments;
DROP POLICY IF EXISTS "Owners can view their own payments" ON public.subscription_payments;
CREATE POLICY "Owners can view their own payments" ON public.subscription_payments
FOR SELECT
USING (
    business_id IN (
        SELECT id FROM public.barbershops WHERE owner_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Admins can view all payments" ON public.subscription_payments;
DROP POLICY IF EXISTS "Admins can view all payments" ON public.subscription_payments;
CREATE POLICY "Admins can view all payments" ON public.subscription_payments
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND (role = 'super_admin' OR role = 'admin')
    )
);

-- 5. Update existing subscriptions to link business_id if missing
-- This is a best-effort mapping based on customer_id (user_id)
UPDATE public.subscriptions s
SET business_id = b.id
FROM public.barbershops b
WHERE s.customer_id = b.owner_id AND s.business_id IS NULL;
