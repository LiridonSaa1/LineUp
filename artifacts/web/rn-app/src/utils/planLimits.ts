import { supabase } from '@/config/supabase';
import { PADDLE_CONFIG } from '@/config/paddle';

export interface ShopPlanDetails {
  planId: 'solo' | 'duo' | 'team';
  planName: string;
  maxBarbers: number;
  status: string;
  currentBarberCount: number;
  canAddBarber: boolean;
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
    // 1. Fetch barbershop owner ID
    const { data: shop } = await supabase
      .from('barbershops')
      .select('id, owner_id, max_barbers')
      .eq('id', shopId)
      .maybeSingle();

    const ownerId = shop?.owner_id;

    // 2. Count current barbers in this specific barbershop
    const { count: barberCount } = await supabase
      .from('barbers')
      .select('id', { count: 'exact', head: true })
      .eq('shop_id', shopId);

    const currentBarberCount = barberCount || 0;

    let planId: 'solo' | 'duo' | 'team' = 'solo';
    let maxBarbers = 1; // Default for Solo plan is strictly 1 barber
    let status = 'inactive';

    if (ownerId) {
      // 3. Fetch active subscription for the barbershop owner
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('product_id, employee_limit, status')
        .eq('customer_id', ownerId)
        .maybeSingle();

      if (sub) {
        status = sub.status || 'active';
        const pid = (sub.product_id || '').toLowerCase();

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
      canAddBarber: currentBarberCount < maxBarbers
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
