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
  next_billed_at?: string;
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
  card_exp_month?: number;
  card_exp_year?: number;
  isAutoRenewOn: boolean;
  isScheduledForCancellation: boolean;
  isPaymentFailed: boolean;
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

    const resolvePlanName = (rawName?: string, rawPlanId?: string) => {
      if (rawName && !rawName.startsWith('pro_')) return rawName;
      const pid = (rawPlanId || rawName || '').toLowerCase();
      if (pid.includes('solo') || pid === 'pro_01ky8dvr6p8qf70p0y717t69p5') return 'Solo';
      if (pid.includes('duo') || pid === 'pro_01ky8e81zvf8wz9p7z6k1v3v4e') return 'Duo';
      if (pid.includes('team') || pid === 'pro_01ky8eapq2pvetack6ad8pnkbw') return 'Team';
      return 'PRO';
    };

    const handleSubscriptionData = (data: any) => {
      if (data) {
        console.log('[useSubscription] Processing sub data:', { status: data.status, end: data.current_period_end });

        const rawEnd = data.current_period_end || data.subscription_end_date;
        const endDate = rawEnd ? new Date(rawEnd) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        const now = new Date();
        const diffTime = endDate.getTime() - now.getTime();
        const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // A subscription is considered active for usage if daysRemaining > 0 and status is not explicitly expired
        const isWithinPeriod = daysRemaining > 0;
        const isExplicitlyActive = ['active', 'trialing', 'past_due', 'paused'].includes(data.status);
        const isCanceledButActive = (data.status === 'canceled' || data.cancel_at_period_end === true) && isWithinPeriod;

        const isExpired = data.status === 'expired' || (!isWithinPeriod && !isExplicitlyActive) || (!isWithinPeriod && isCanceledButActive);
        const effectiveStatus = isExpired ? 'expired' : (data.status || 'active');

        // Paddle v2 uses sub_... IDs. Check all common fields.
        const paddleId = (data.paddle_subscription_id?.startsWith('sub_') ? data.paddle_subscription_id : null) ||
                         (data.subscription_id?.startsWith('sub_') ? data.subscription_id : null) ||
                         (data.id?.toString().startsWith('sub_') ? data.id.toString() : null);

        const cleanPlanName = resolvePlanName(data.plan_name, data.plan_id);

        const cancelAtEnd = data.cancel_at_period_end === true || data.cancel_at_period_end === 'true' || Boolean(data.cancel_at_period_end);
        const isAutoRenewOn = (effectiveStatus === 'active' || effectiveStatus === 'trialing') && !cancelAtEnd;
        const isScheduledForCancellation = (effectiveStatus === 'active' || effectiveStatus === 'trialing') && cancelAtEnd;
        const isPaymentFailed = effectiveStatus === 'past_due';

        setSubscription({
          id: data.id,
          paddle_subscription_id: paddleId || '',
          business_id: data.business_id,
          plan_id: data.plan_id,
          plan_name: cleanPlanName,
          status: effectiveStatus,
          amount: data.amount || 0,
          currency: data.currency || 'EUR',
          billing_cycle: data.billing_cycle || 'month',
          start_date: data.current_period_start || data.subscription_start_date,
          end_date: endDate.toISOString(),
          next_billed_at: data.next_billed_at,
          last_payment_date: data.last_payment_date || data.updated_at,
          days_remaining: Math.max(0, daysRemaining),
          daysRemaining: Math.max(0, daysRemaining),
          is_expired: isExpired,
          is_near_expiry: daysRemaining <= 7 && daysRemaining > 0,
          cancel_at_period_end: cancelAtEnd,
          current_period_end: data.current_period_end,
          current_period_start: data.current_period_start,
          subscription_id: paddleId || data.subscription_id,
          card_brand: data.card_brand,
          card_last4: data.card_last4,
          card_exp_month: data.card_exp_month,
          card_exp_year: data.card_exp_year,
          isAutoRenewOn,
          isScheduledForCancellation,
          isPaymentFailed
        });
        setIsActivating(false);
      } else {
        setSubscription(null);
        if (isRetry) setIsActivating(true);
      }
    };

      const isUUID = (str: any) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
      const isNumeric = (str: any) => str !== null && str !== undefined && !isNaN(Number(str)) && !String(str).includes('-');

      try {
        let data = null;
        console.log('[useSubscription] Deep Search Initiated:', { userId, businessId });

      // --- STEP 1: Direct targeted search by businessId and userId ---
      if (businessId && isNumeric(businessId)) {
        const { data: bSub } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('business_id', businessId)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (bSub) data = bSub;
      }

      if (!data && userId && isUUID(userId)) {
        const { data: uSub } = await supabase
          .from('subscriptions')
          .select('*')
          .or(`user_id.eq.${userId},customer_id.eq.${userId}`)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (uSub) data = uSub;
      }

      // --- STEP 3: Search by User Email (Ultimate Clue) ---
      if (!data && userId && isUUID(userId)) {
        const { data: userData } = await supabase.from('users').select('email').eq('id', userId).maybeSingle();
        if (userData?.email) {
           console.log('[useSubscription] Step 3: Checking by email', userData.email);

           // Search customers table for any mapped ID
           const { data: custMapping } = await supabase.from('customers').select('*')
            .or(`email.eq.${userData.email},user_id.eq.${userId}`)
            .maybeSingle();

           if (custMapping?.customer_id) {
              const { data: subByCust } = await supabase.from('subscriptions').select('*')
                .or(`paddle_customer_id.eq.${custMapping.customer_id},paddle_subscription_id.eq.${custMapping.customer_id}`)
                .maybeSingle();
              if (subByCust) data = subByCust;
           }

           // Search subscriptions table for any user_id matching current
           if (!data) {
              const { data: subByEmail } = await supabase.from('subscriptions').select('*')
                .eq('user_id', userId)
                .order('updated_at', { ascending: false }).limit(1).maybeSingle();
              if (subByEmail) data = subByEmail;
           }
        }
      }

      // --- STEP 4: Payment Bridge Self-Healing ---
      if (!data && (userId || businessId)) {
        let paymentQuery = supabase.from('subscription_payments').select('*');
        if (businessId && isNumeric(businessId)) {
          paymentQuery = paymentQuery.eq('business_id', businessId);
        } else if (userId && isUUID(userId)) {
          paymentQuery = paymentQuery.eq('user_id', userId);
        } else {
          paymentQuery = null;
        }

        if (paymentQuery) {
          const { data: payment } = await paymentQuery.order('paid_at', { ascending: false }).limit(1).maybeSingle();

          if (payment?.subscription_id) {
            console.log('[useSubscription] Step 4: Found orphaned payment', payment.subscription_id);
            const { data: orphanedSub } = await supabase.from('subscriptions').select('*')
              .eq('paddle_subscription_id', payment.subscription_id).maybeSingle();

            if (orphanedSub) {
               data = orphanedSub;
               // AUTO-REPAIR
               if (businessId && isNumeric(businessId) && orphanedSub.business_id !== businessId) {
                  await supabase.from('subscriptions').update({ business_id: businessId, user_id: userId || orphanedSub.user_id }).eq('id', orphanedSub.id);
               }
            }
          }
        }
      }

      // --- STEP 5: Existing Account Self-Healing ---
      if (!data && (userId || businessId)) {
        let shopQuery = supabase.from('barbershops').select('id, owner_id, status');
        if (businessId && isNumeric(businessId)) {
          shopQuery = shopQuery.eq('id', businessId);
        } else if (userId && isUUID(userId)) {
          shopQuery = shopQuery.eq('owner_id', userId);
        } else {
          shopQuery = null;
        }

        if (shopQuery) {
          const { data: existingShop } = await shopQuery.maybeSingle();

          if (existingShop) {
            // Check if ANY sub already exists for this shop before creating a synthetic one!
            const { data: foundShopSub } = await supabase
              .from('subscriptions')
              .select('*')
              .eq('business_id', existingShop.id)
              .order('updated_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            if (foundShopSub) {
              data = foundShopSub;
            } else {
              console.log('[useSubscription] Step 5: Provisioning new active Solo sub for existing shop:', existingShop.id);
              const now = new Date();
              const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
              const subId = 'sub_auto_' + Date.now();

              const subPayload = {
                user_id: userId || existingShop.owner_id,
                business_id: existingShop.id,
                paddle_subscription_id: subId,
                subscription_id: subId,
                plan_id: 'solo',
                plan_name: 'Solo',
                status: 'active',
                amount: 15,
                currency: 'EUR',
                billing_cycle: 'month',
                current_period_start: now.toISOString(),
                current_period_end: endDate.toISOString(),
                cancel_at_period_end: false,
                updated_at: now.toISOString()
              };

              const { data: createdSub } = await supabase
                .from('subscriptions')
                .upsert(subPayload, { onConflict: 'business_id' })
                .select()
                .maybeSingle();

              data = createdSub || subPayload;
            }

            // Ensure shop status is active
            await supabase.from('barbershops').update({ status: 'active', subscriptionStatus: 'active' }).eq('id', existingShop.id);
          }
        }
      }

      if (!data && userId) {
        setIsActivating(true);
      }

      handleSubscriptionData(data);
    } catch (err: any) {
      console.error('[useSubscription] Error fetching for ' + identifier + ':', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [businessId, userId]);

  // Polling logic for activation
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActivating && (!subscription || subscription.status === 'expired' || subscription.status === 'inactive' || subscription.status === 'pending')) {
      interval = setInterval(() => {
        console.log('[useSubscription] Polling for active subscription...');
        fetchSubscription(true);
      }, 5000);
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
