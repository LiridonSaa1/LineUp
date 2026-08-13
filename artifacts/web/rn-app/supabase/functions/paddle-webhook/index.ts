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
    const { event_type, data } = event

    console.log(`[Webhook] Processing event: ${event_type} for ${data.id}`)

    const userId = data.custom_data?.user_id
    if (!userId && event_type.startsWith('subscription.')) {
      console.warn(`[Webhook] Missing user_id in custom_data for event ${event_type}`)
    }

    if (event_type.startsWith('subscription.')) {
      const {
        id: subscription_id,
        customer_id,
        status,
        items,
        scheduled_change,
        current_billing_period,
        collection_mode,
        next_billed_at
      } = data

      const price_id = items[0]?.price?.id
      const product_id = items[0]?.price?.product_id
      const is_canceled = scheduled_change?.action === 'cancel' || status === 'canceled'

      const starts_at = current_billing_period?.starts_at
      const ends_at = current_billing_period?.ends_at

      // Get plan details (can be enhanced with a lookup table if needed)
      let plan_name = 'PRO'
      if (product_id === 'pro_01ky8dvr6p8qf70p0y717t69p5') plan_name = 'Solo'
      if (product_id === 'pro_01ky8e81zvf8wz9p7z6k1v3v4e') plan_name = 'Duo'
      if (product_id === 'pro_01ky8eapq2pvetack6ad8pnkbw') plan_name = 'Team'

      // Upsert into subscriptions table
      const { error: subError } = await supabase
        .from('subscriptions')
        .upsert({
          paddle_subscription_id: subscription_id,
          user_id: userId,
          paddle_customer_id: customer_id,
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
          cancel_at_period_end: is_canceled,
          updated_at: new Date().toISOString()
        }, { onConflict: 'paddle_subscription_id' })

      if (subError) console.error('[Webhook] Sub upsert error:', subError)

      // Sync Shop Status
      if (userId) {
        let shopStatus = 'inactive'
        if (status === 'active' || status === 'trialing') {
          shopStatus = 'active'
        } else if (status === 'past_due' || status === 'paused') {
          shopStatus = 'suspended'
        }

        const { error: shopError } = await supabase
          .from('barbershops')
          .update({ status: shopStatus })
          .eq('owner_id', userId)

        if (shopError) console.error('[Webhook] Shop status update error:', shopError)
      }
    }

    if (event_type === 'transaction.completed') {
      // Logic for initial payment or one-time transactions
      const { id: transaction_id, customer_id, items, details } = data

      if (userId) {
         await supabase
          .from('subscription_payments')
          .upsert({
            transaction_id,
            business_id: (await supabase.from('barbershops').select('id').eq('owner_id', userId).maybeSingle()).data?.id,
            subscription_id: data.subscription_id,
            amount: parseFloat(details?.totals?.total || '0') / 100,
            currency: details?.totals?.currency_code || 'EUR',
            payment_status: 'completed',
            paid_at: new Date().toISOString()
          }, { onConflict: 'transaction_id' })
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (err) {
    console.error('Webhook error:', err)
    return new Response('Internal Server Error', { status: 500 })
  }
})
