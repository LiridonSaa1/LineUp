import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/config/supabase';

export interface SubscriptionData {
  id: string;
  paddle_subscription_id: string;
  business_id: string;
  plan_id: string;
  plan_name: string;
  status: 'active' | 'expired' | 'trialing' | 'past_due' | 'canceled' | 'paused' | string;
  amount: number;
  currency: string;
  billing_cycle: string;
  start_date: string;
  end_date: string;
  last_payment_date: string;
  days_remaining: number;
  daysRemaining: number; // CamelCase alias for ProfileScreen
  is_expired: boolean;
  is_near_expiry: boolean;
  cancel_at_period_end?: boolean;
  current_period_end?: string;
  current_period_start?: string;
  subscription_id?: string;
  card_brand?: string;
  card_last4?: string;
}

export const useSubscription = (businessId: string | null, userId?: string | null) => {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isActivating, setIsActivating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = useCallback(async (isRetry = false) => {
    // We can fetch by userId (preferred for new users) or businessId
    const identifier = userId || businessId;
    if (!identifier) {
      setLoading(false);
      return;
    }

    const handleSubscriptionData = (data: any) => {
      if (data) {
        const endDate = new Date(data.current_period_end || data.subscription_end_date);
        const now = new Date();
        const diffTime = endDate.getTime() - now.getTime();
        const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const isExpired = daysRemaining <= 0 || data.status === 'expired' || data.status === 'canceled';

        setSubscription({
          id: data.id,
          paddle_subscription_id: data.paddle_subscription_id,
          business_id: data.business_id,
          plan_id: data.plan_id,
          plan_name: data.plan_name || 'PRO',
          status: isExpired && data.status === 'active' ? 'expired' : data.status,
          amount: data.amount || 0,
          currency: data.currency || 'EUR',
          billing_cycle: data.billing_cycle || 'month',
          start_date: data.current_period_start || data.subscription_start_date,
          end_date: endDate.toISOString(),
          last_payment_date: data.last_payment_date || data.updated_at,
          days_remaining: Math.max(0, daysRemaining),
          daysRemaining: Math.max(0, daysRemaining),
          is_expired: isExpired,
          is_near_expiry: daysRemaining <= 7 && daysRemaining > 0,
          cancel_at_period_end: data.cancel_at_period_end,
          current_period_end: data.current_period_end,
          current_period_start: data.current_period_start,
          subscription_id: data.subscription_id || data.paddle_subscription_id,
          card_brand: data.card_brand,
          card_last4: data.card_last4
        });
        setIsActivating(false);
      } else {
        setSubscription(null);
        if (isRetry) setIsActivating(true);
      }
    };

    const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

    try {
      let data = null;
      let fetchError = null;

      // 1. Try by userId (UUID) against user_id or customer_id
      if (userId && isUUID(userId)) {
        const res = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', userId)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (res.error && (res.error.message.includes('user_id') || res.error.message.includes('column'))) {
          // Fallback to legacy customer_id if user_id column doesn't exist
          const legacyRes = await supabase
            .from('subscriptions')
            .select('*')
            .eq('customer_id', userId)
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          data = legacyRes.data;
          fetchError = legacyRes.error;
        } else {
          data = res.data;
          fetchError = res.error;
        }
      }

      // 2. If no data found yet and we have a businessId, try by business_id (BigInt)
      // Only try this if businessId looks like a number to avoid "invalid input syntax for type bigint"
      if (!data && businessId && !isNaN(Number(businessId)) && !isUUID(String(businessId))) {
        const res = await supabase
          .from('subscriptions')
          .select('*')
          .eq('business_id', businessId)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (res.data || (res.error && !res.error.message.includes('business_id'))) {
          data = res.data;
          fetchError = res.error;
        }
      }

      if (fetchError) throw fetchError;
      handleSubscriptionData(data);
    } catch (err: any) {
      console.error('[useSubscription] Error:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [businessId, userId]);

  // Polling logic for activation
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActivating && !subscription) {
      interval = setInterval(() => {
        console.log('[useSubscription] Polling for subscription...');
        fetchSubscription(true);
      }, 3000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActivating, subscription, fetchSubscription]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  return {
    subscription,
    loading,
    isActivating,
    setIsActivating, // Allow manual trigger of activating state
    error,
    refresh: fetchSubscription
  };
};
