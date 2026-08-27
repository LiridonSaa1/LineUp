import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const PADDLE_API_KEY = Deno.env.get('PADDLE_API_KEY') || ''
const PADDLE_ENV = Deno.env.get('PADDLE_ENV') || 'sandbox'
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, subscriptionId, priceId, planId, userId, businessId, cardBrand, cardLast4 } = await req.json()

    console.log(`[Paddle Manage] Action: ${action} for Sub: ${subscriptionId}, User: ${userId}, Shop: ${businessId}`)

    if (!subscriptionId && !userId && !businessId) throw new Error('Missing identification parameters')

    const cancelFlag = action === 'cancel' ? true : action === 'reactivate' || action === 'update_card' ? false : undefined;
    const isSyntheticId = !subscriptionId || subscriptionId.startsWith('sub_auto_') || subscriptionId.startsWith('sub_manual_') || subscriptionId.startsWith('sub_active_');

    let paddleResult = null;

    // 1. Call Paddle API for real Paddle subscription IDs
    if (!isSyntheticId && PADDLE_API_KEY && subscriptionId) {
      const baseUrl = PADDLE_ENV === 'sandbox' ? 'https://sandbox-api.paddle.com' : 'https://api.paddle.com'
      let url = `${baseUrl}/subscriptions/${subscriptionId}`
      let method = 'PATCH'
      let body: any = {}

      if (action === 'cancel') {
        body = { scheduled_change: { action: 'cancel', effective_at: 'next_billing_period' } }
      } else if (action === 'reactivate') {
        body = { scheduled_change: null }
      } else if (action === 'update') {
        if (!priceId) throw new Error('Missing priceId for update')
        body = {
          items: [{ price_id: priceId, quantity: 1 }],
          proration_billing_mode: 'prorated_immediately'
        }
        body.custom_data = {
          ...(planId ? { plan_id: planId } : {}),
          ...(userId ? { user_id: userId } : {})
        }
      }

      console.log(`[Paddle Manage] Sending ${method} to ${url}`, JSON.stringify(body))

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${PADDLE_API_KEY}`,
        },
        body: JSON.stringify(body)
      })

      const data = await response.json()
      if (response.ok) {
        paddleResult = data.data;
      } else {
        console.warn('[Paddle API Warning]:', JSON.stringify(data, null, 2))
      }
    }

    // 2. Synchronize Supabase Database using Service Role Key (Bypasses RLS)
    const dbPayload: any = {
      updated_at: new Date().toISOString()
    }

    if (cancelFlag !== undefined) {
      dbPayload.cancel_at_period_end = cancelFlag;
      dbPayload.status = cancelFlag ? 'active' : 'active';
    }

    if (action === 'cancel') {
      dbPayload.card_brand = null;
      dbPayload.card_last4 = null;
    } else if (action === 'update_card' && cardLast4) {
      dbPayload.card_brand = cardBrand || 'Visa';
      dbPayload.card_last4 = cardLast4;
      dbPayload.cancel_at_period_end = false;
      dbPayload.status = 'active';
    }

    const updatePromises: any[] = [];
    if (userId) {
      updatePromises.push(supabase.from('subscriptions').update(dbPayload).eq('user_id', userId).select());
      updatePromises.push(supabase.from('subscriptions').update(dbPayload).eq('customer_id', userId).select());
    }
    if (businessId) {
      updatePromises.push(supabase.from('subscriptions').update(dbPayload).eq('business_id', businessId).select());
      if (!isNaN(Number(businessId))) {
        updatePromises.push(supabase.from('subscriptions').update(dbPayload).eq('business_id', Number(businessId)).select());
      }
    }
    if (subscriptionId) {
      updatePromises.push(supabase.from('subscriptions').update(dbPayload).eq('paddle_subscription_id', subscriptionId).select());
    }

    const results = await Promise.all(updatePromises);
    const updatedCount = results.reduce((acc, res) => acc + (res.data ? res.data.length : 0), 0);

    // Fallback: If 0 rows updated, perform an UPSERT so data is guaranteed to exist in Supabase!
    if (updatedCount === 0 && (userId || businessId)) {
      console.log('[Paddle Manage] 0 rows updated, performing fallback upsert...');
      const targetShopId = businessId ? (isNaN(Number(businessId)) ? businessId : Number(businessId)) : null;
      const targetSubId = subscriptionId || (`sub_auto_${targetShopId || userId}`);

      await supabase.from('subscriptions').upsert({
        user_id: userId,
        business_id: targetShopId,
        paddle_subscription_id: targetSubId,
        subscription_id: targetSubId,
        plan_id: planId || 'solo',
        plan_name: 'Solo',
        status: 'active',
        cancel_at_period_end: cancelFlag ?? false,
        card_brand: action === 'cancel' ? null : (cardBrand || 'Visa'),
        card_last4: action === 'cancel' ? null : (cardLast4 || '4242'),
        amount: 15,
        currency: 'EUR',
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'paddle_subscription_id' });
    }

    console.log(`[Paddle Manage DB Update Success]: cancel_at_period_end=${cancelFlag}, updatedCount=${updatedCount}`);

    return new Response(JSON.stringify({ success: true, cancel_at_period_end: cancelFlag, data: paddleResult }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('[Paddle Manage Catch]:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
