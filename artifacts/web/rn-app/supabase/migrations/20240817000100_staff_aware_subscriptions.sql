-- Staff-Aware Subscription Security Migration

-- 1. Allow Barbers/Staff to see the subscription of the shop they work in
DROP POLICY IF EXISTS "Staff can view their shop subscription" ON public.subscriptions;
CREATE POLICY "Staff can view their shop subscription" ON public.subscriptions
FOR SELECT
TO authenticated
USING (
    business_id IN (
        SELECT shop_id FROM public.barbers WHERE user_id = auth.uid()
    )
);

-- 2. Allow Barbers/Staff to see payment history of the shop they work in
DROP POLICY IF EXISTS "Staff can view their shop payments" ON public.subscription_payments;
CREATE POLICY "Staff can view their shop payments" ON public.subscription_payments
FOR SELECT
TO authenticated
USING (
    business_id IN (
        SELECT shop_id FROM public.barbers WHERE user_id = auth.uid()
    )
);

-- 3. Ensure Owner policy is also correctly set for business_id
DROP POLICY IF EXISTS "Owners can view by business_id" ON public.subscriptions;
CREATE POLICY "Owners can view by business_id" ON public.subscriptions
FOR SELECT
TO authenticated
USING (
    business_id IN (
        SELECT id FROM public.barbershops WHERE owner_id = auth.uid()
    )
);

-- 4. Enable RLS on customers table just in case
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own customer record" ON public.customers;
CREATE POLICY "Users can view their own customer record" ON public.customers FOR SELECT USING (auth.uid() = user_id OR email = auth.jwt()->>'email');
