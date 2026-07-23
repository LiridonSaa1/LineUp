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

  // In a real scenario, you would verify the signature here using Paddle's logic.
  // For now, we process the JSON payload.

  try {
    const event = JSON.parse(rawBody)
    const { event_type, data } = event

    console.log(`Processing Paddle event: ${event_type}`)

    if (event_type === 'subscription.created' || event_type === 'subscription.updated') {
      const { id: subscription_id, customer_id, status, items } = data
      const price_id = items[0]?.price?.id
      const product_id = items[0]?.price?.product_id

      // 1. Sync Customer
      const { data: customer } = await supabase
        .from('customers')
        .upsert({
          customer_id,
          email: data.customer?.email || 'unknown@email.com'
        })
        .select()
        .single()

      // 2. Sync Subscription
      await supabase
        .from('subscriptions')
        .upsert({
          subscription_id,
          customer_id,
          status,
          price_id,
          product_id,
          updated_at: new Date().toISOString()
        })

      // 3. If active/trialing, ensure the corresponding barbershop is active
      if (status === 'active' || status === 'trialing') {
         await supabase
           .from('barbershops')
           .update({ status: 'active' })
           .eq('email', data.customer?.email?.toLowerCase())
      }
    }

    if (event_type === 'transaction.completed') {
       // Handle one-time payments or initial setup if needed
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
