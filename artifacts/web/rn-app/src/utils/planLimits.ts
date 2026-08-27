import { supabase } from '@/config/supabase';
import { PADDLE_CONFIG } from '@/config/paddle';

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
    // 1. Fetch barbershop owner ID and email
    const { data: shop } = await supabase
      .from('barbershops')
      .select('id, owner_id, email, max_barbers')
      .eq('id', shopId)
      .maybeSingle();

    const ownerId = shop?.owner_id;
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
    const { count: barberCount } = await supabase
      .from('barbers')
      .select('id', { count: 'exact', head: true })
      .eq('shop_id', shopId)
      .neq('user_id', ownerId || 'no-owner'); // If no ownerId, just count all

    const currentBarberCount = barberCount || 0;

    let planId: 'solo' | 'duo' | 'team' = 'solo';
    let maxBarbers = 1; // Default for Solo plan is strictly 1 barber
    let status = 'inactive';
    let currentPeriodStart: string | undefined;
    let currentPeriodEnd: string | undefined;
    let cancelAtPeriodEnd: boolean | undefined;
    let daysRemaining: number | undefined;

    if (ownerId) {
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

      try {
        // Attempt to fetch by business_id first (new schema)
        const { data: bSub, error: bError } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('business_id', shopId)
          .maybeSingle();

        if (bError) throw bError;
        sub = bSub;
      } catch (err) {
        // Fallback: If business_id doesn't exist or query fails, try the old way (customer_id)
        let query = supabase.from('subscriptions').select('*');
        let fetchQuery = query;
        if (shopId) {
          fetchQuery = fetchQuery.or(`customer_id.eq.${ownerId},user_id.eq.${ownerId}${paddleCustomerId ? `,customer_id.eq.${paddleCustomerId}` : ''}`);
        } else {
          fetchQuery = fetchQuery.or(`customer_id.eq.${ownerId},user_id.eq.${ownerId}`);
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
