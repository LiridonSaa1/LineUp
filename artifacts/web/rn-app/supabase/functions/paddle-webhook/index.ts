import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const PADDLE_WEBHOOK_SECRET = Deno.env.get('PADDLE_WEBHOOK_SECRET') || ''

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  const signature = req.headers.get('paddle-signature') || ''
  const rawBody = await req.text()

  // --- SIGNATURE VERIFICATION ---
  // Paddle-Signature header format: ts=123456;h1=hash
  if (PADDLE_WEBHOOK_SECRET) {
    const parts = signature.split(';')
    const ts = parts.find(p => p.startsWith('ts='))?.split('=')[1]
    const h1 = parts.find(p => p.startsWith('h1='))?.split('=')[1]

    if (!ts || !h1) {
      return new Response('Invalid signature format', { status: 401 })
    }

    const signedPayload = `${ts}:${rawBody}`
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(PADDLE_WEBHOOK_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    const sig = await crypto.subtle.sign(
      'HMAC',
      key,
      new TextEncoder().encode(signedPayload)
    )
    const expectedH1 = Array.from(new Uint8Array(sig))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    if (h1 !== expectedH1) {
      console.error('Signature verification failed')
      return new Response('Invalid signature', { status: 401 })
    }
  }

  try {
    const event = JSON.parse(rawBody)
    const { event_type, data, event_id } = event

    console.log(`[Webhook] Received ${event_type} (${event_id}) for ${data.id}`)

    // 1. IDEMPOTENCY CHECK
    // If we've already processed this exact event, skip it.
    if (event_id) {
       const { data: existingSub } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('last_event_id', event_id)
        .maybeSingle();

       if (existingSub) {
         console.log(`[Webhook] Event ${event_id} already processed. Skipping.`);
         return new Response(JSON.stringify({ received: true, repeated: true }), { status: 200 });
       }
    }

    const userId = data.custom_data?.user_id
    const businessId = data.custom_data?.business_id

    // 2. SUBSCRIPTION EVENTS
    if (event_type.startsWith('subscription.')) {
      const {
        id: subscription_id,
        status,
        items,
        scheduled_change,
        current_billing_period,
        customer_id: paddle_customer_id,
        next_billed_at
      } = data

      const price_id = items[0]?.price?.id
      const product_id = items[0]?.price?.product_id
      const is_scheduled_to_cancel = scheduled_change?.action === 'cancel'

      const starts_at = current_billing_period?.starts_at
      const ends_at = current_billing_period?.ends_at

      // Map Plan Name
      let plan_name = 'PRO'
      if (product_id === 'pro_01ky8dvr6p8qf70p0y717t69p5') plan_name = 'Solo'
      if (product_id === 'pro_01ky8e81zvf8wz9p7z6k1v3v4e') plan_name = 'Duo'
      if (product_id === 'pro_01ky8eapq2pvetack6ad8pnkbw') plan_name = 'Team'

      // RESILIENCE: Resolve Identifiers if missing from custom_data
      let resolvedUserId = userId;
      let resolvedBusinessId = businessId;

      if (!resolvedUserId || !resolvedBusinessId) {
        const customerEmail = data.customer_email || data.customer?.email;
        if (customerEmail) {
          const { data: userData } = await supabase.from('users').select('id').eq('email', customerEmail).maybeSingle();
          if (userData) {
            resolvedUserId = resolvedUserId || userData.id;
            const { data: shopData } = await supabase.from('barbershops').select('id').eq('owner_id', userData.id).maybeSingle();
            resolvedBusinessId = resolvedBusinessId || shopData?.id;
          }
        }
      }

      // Final fallback to existing subscription link
      if (!resolvedUserId && subscription_id) {
         const { data: existing } = await supabase.from('subscriptions').select('user_id, business_id').eq('paddle_subscription_id', subscription_id).maybeSingle();
         if (existing) {
           resolvedUserId = existing.user_id;
           resolvedBusinessId = existing.business_id;
         }
      }

      // Extract payment method details safely if available
      const pm = data.payment_method || data.payments?.[0]?.payment_method || data.current_billing_period?.payment_method
      const card_brand = pm?.card?.type || (pm?.type === 'card' ? 'Visa' : pm?.type) || null
      const card_last4 = pm?.card?.last4 || null
      const card_exp_month = pm?.card?.expiry_month || null
      const card_exp_year = pm?.card?.expiry_year || null

      console.log(`[Webhook] Processing ${event_type}: User=${resolvedUserId}, Business=${resolvedBusinessId}, Status=${status}`);

      // Update Subscription
      const { error: subError } = await supabase
        .from('subscriptions')
        .upsert({
          paddle_subscription_id: subscription_id,
          user_id: resolvedUserId,
          business_id: resolvedBusinessId,
          paddle_customer_id: paddle_customer_id,
          paddle_product_id: product_id,
          paddle_price_id: price_id,
          plan_id: product_id,
          plan_name: plan_name,
          status: status,
          billing_cycle: items[0]?.price?.billing_cycle?.interval || 'month',
          amount: parseFloat(items[0]?.price?.unit_price?.amount || '0') / 100,
          currency: items[0]?.price?.unit_price?.currency_code || 'EUR',
          current_period_start: starts_at,
          current_period_end: ends_at,
          next_billed_at: next_billed_at,
          cancel_at_period_end: is_scheduled_to_cancel,
          canceled_at: status === 'canceled' ? new Date().toISOString() : null,
          card_brand: card_brand,
          card_last4: card_last4,
          card_exp_month: card_exp_month,
          card_exp_year: card_exp_year,
          last_event_id: event_id,
          updated_at: new Date().toISOString()
        }, { onConflict: 'paddle_subscription_id' })

      if (subError) console.error('[Webhook] Sub upsert error:', subError)

      // Sync Barbershop Status
      if (resolvedBusinessId) {
        let shopStatus = 'inactive'
        if (status === 'active' || status === 'trialing') {
          shopStatus = 'active'
        } else if (status === 'past_due' || status === 'paused') {
          shopStatus = 'suspended'
        } else if (status === 'canceled' || status === 'expired') {
          shopStatus = 'inactive'
        }

        await supabase
          .from('barbershops')
          .update({ status: shopStatus })
          .eq('id', resolvedBusinessId)
      }
    }

    // 3. TRANSACTION EVENTS
    if (event_type === 'transaction.completed') {
      const { id: transaction_id, status, details, items, subscription_id } = data
      const amount = parseFloat(details?.totals?.total || '0') / 100
      const currency = details?.totals?.currency_code || 'EUR'
      const planId = items[0]?.price?.product_id

      console.log(`[Webhook] Recording payment for ${transaction_id} (${amount} ${currency})`);

      await supabase
        .from('subscription_payments')
        .upsert({
          transaction_id,
          user_id: userId,
          business_id: businessId,
          subscription_id: subscription_id,
          amount: amount,
          currency: currency,
          status: 'completed',
          plan_id: planId,
          paid_at: new Date().toISOString()
        }, { onConflict: 'transaction_id' })
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (err) {
    console.error('Webhook error:', err.message)
    return new Response('Internal Server Error', { status: 500 })
  }
})
