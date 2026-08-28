import { supabase } from "../config/supabase";
import { PADDLE_CONFIG } from "../config/paddle";

export interface ShopPlanDetails {
  planId: 'solo' | 'duo' | 'team';
  planName: string;
  maxBarbers: number;
  status: string;
  currentBarberCount: number;
  canAddBarber: boolean;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
  daysRemaining?: number;
}

/**
 * Checks the active subscription plan for a specific barbershop and returns the allowed barber limit.
 *
 * Rules:
 * - Solo plan: Maximum 1 barber (1 berber)
 * - Duo plan: Maximum 2 barbers (2 berberë)
 * - Team plan: Maximum employee_limit (3+ barbers, default 100)
 * - Inactive / No subscription: Defaults to Solo plan rule (1 barber max)
 */
export async function getShopPlanDetails(shopId: string | number): Promise<ShopPlanDetails> {
  try {
    const isNumeric = (str: any) => str !== null && str !== undefined && !isNaN(Number(str)) && !String(str).includes('-');
    const isUUID = (str: any) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

    // 1. Fetch barbershop owner ID and email
    let shopQuery = supabase.from('barbershops').select('id, owner_id, email, max_barbers');
    if (isNumeric(shopId)) {
      shopQuery = shopQuery.eq('id', shopId);
    } else if (isUUID(shopId)) {
      shopQuery = shopQuery.eq('owner_id', shopId);
    } else {
      shopQuery = shopQuery.eq('id', shopId);
    }

    const { data: shop } = await shopQuery.maybeSingle();

    const realShopId = shop?.id;
    const ownerId = shop?.owner_id || (isUUID(shopId) ? String(shopId) : null);
    let email = shop?.email;

    // Fallback: If shop email is missing, fetch owner email from users table
    if (!email && ownerId) {
      const { data: userData } = await supabase
        .from('users')
        .select('email')
        .eq('id', ownerId)
        .maybeSingle();
      if (userData?.email) email = userData.email;
    }

    // 2. Count current barbers in this specific barbershop (excluding the owner)
    let barberCount = 0;
    if (realShopId && isNumeric(realShopId)) {
      const { count } = await supabase
        .from('barbers')
        .select('id', { count: 'exact', head: true })
        .eq('shop_id', realShopId)
        .neq('user_id', ownerId || 'no-owner');
      barberCount = count || 0;
    }

    const currentBarberCount = barberCount || 0;

    let planId: 'solo' | 'duo' | 'team' = 'solo';
    let maxBarbers = 1; // Default for Solo plan is strictly 1 barber
    let status = 'inactive';
    let currentPeriodStart: string | undefined;
    let currentPeriodEnd: string | undefined;
    let cancelAtPeriodEnd: boolean | undefined;
    let daysRemaining: number | undefined;

    if (ownerId || realShopId) {
      // 3. Resolve Paddle Customer ID if it differs from owner UUID
      let paddleCustomerId: string | null = null;
      if (email) {
        const { data: customerData } = await supabase
          .from('customers')
          .select('customer_id')
          .eq('email', email)
          .maybeSingle();
        paddleCustomerId = customerData?.customer_id || null;
      }

      // 4. Fetch subscription (either by business_id or UUID or Paddle ID)
      let sub = null;

      if (realShopId && isNumeric(realShopId)) {
        const { data: bSub } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('business_id', realShopId)
          .maybeSingle();
        if (bSub) sub = bSub;
      }

      if (!sub && ownerId) {
        let fetchQuery = supabase.from('subscriptions').select('*');
        if (paddleCustomerId) {
          fetchQuery = fetchQuery.or(`user_id.eq.${ownerId},customer_id.eq.${ownerId},paddle_customer_id.eq.${paddleCustomerId}`);
        } else {
          fetchQuery = fetchQuery.or(`user_id.eq.${ownerId},customer_id.eq.${ownerId}`);
        }

        const { data: fallbackSub } = await fetchQuery
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        sub = fallbackSub;
      }

      if (sub) {
        const endDate = new Date(sub.current_period_end || sub.subscription_end_date);
        const now = new Date();
        const diffTime = endDate.getTime() - now.getTime();
        const daysRem = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        status = daysRem <= 0 ? 'expired' : (sub.status || 'active');
        daysRemaining = Math.max(0, daysRem);

        const pid = (sub.product_id || '').toLowerCase();
        currentPeriodStart = sub.current_period_start || sub.subscription_start_date;
        currentPeriodEnd = endDate.toISOString();
        cancelAtPeriodEnd = sub.cancel_at_period_end;

        if (pid.includes('solo') || pid === PADDLE_CONFIG.PRODUCTS.solo) {
          planId = 'solo';
          maxBarbers = 1;
        } else if (pid.includes('duo') || pid === PADDLE_CONFIG.PRODUCTS.duo) {
          planId = 'duo';
          maxBarbers = 2;
        } else if (pid.includes('team') || pid === PADDLE_CONFIG.PRODUCTS.team) {
          planId = 'team';
          maxBarbers = sub.employee_limit || 100;
        } else {
          // If custom employee_limit is set on subscription record
          if (sub.employee_limit) {
            maxBarbers = sub.employee_limit;
          } else if (shop?.max_barbers) {
            maxBarbers = shop.max_barbers;
          } else {
            maxBarbers = 1;
          }
          planId = maxBarbers === 1 ? 'solo' : maxBarbers === 2 ? 'duo' : 'team';
        }
      }
    }

    const planNames: Record<string, string> = {
      solo: 'Solo',
      duo: 'Duo',
      team: 'Team'
    };

    return {
      planId,
      planName: planNames[planId] || 'Solo',
      maxBarbers,
      status,
      currentBarberCount,
      canAddBarber: currentBarberCount < maxBarbers,
      currentPeriodStart,
      currentPeriodEnd,
      cancelAtPeriodEnd,
      daysRemaining
    };
  } catch (err) {
    console.warn('[planLimits] Error fetching shop plan details:', err);
    return {
      planId: 'solo',
      planName: 'Solo',
      maxBarbers: 1,
      status: 'inactive',
      currentBarberCount: 0,
      canAddBarber: true
    };
  }
}
