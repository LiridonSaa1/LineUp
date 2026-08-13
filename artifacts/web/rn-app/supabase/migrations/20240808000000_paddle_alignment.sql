-- Align subscriptions table with Paddle v2 data requirements

ALTER TABLE public.subscriptions
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS paddle_customer_id TEXT,
ADD COLUMN IF NOT EXISTS paddle_subscription_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS paddle_product_id TEXT,
ADD COLUMN IF NOT EXISTS paddle_price_id TEXT,
ADD COLUMN IF NOT EXISTS plan_id TEXT,
ADD COLUMN IF NOT EXISTS plan_name TEXT,
ADD COLUMN IF NOT EXISTS billing_cycle TEXT,
ADD COLUMN IF NOT EXISTS amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'EUR',
ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT false;

-- Add index for faster lookup by user
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
-- Add index for webhook lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_paddle_id ON public.subscriptions(paddle_subscription_id);

-- If customer_id was used for users previously, we keep it as an alias or migration
-- In this project, customer_id in subscriptions was REFERENCES public.users(id)
-- We'll migrate data if needed.
UPDATE public.subscriptions SET user_id = customer_id WHERE user_id IS NULL AND customer_id IS NOT NULL;
