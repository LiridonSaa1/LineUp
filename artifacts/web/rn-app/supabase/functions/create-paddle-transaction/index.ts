import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const PADDLE_API_KEY = Deno.env.get('PADDLE_API_KEY') || ''
const PADDLE_ENV = Deno.env.get('PADDLE_ENV') || 'sandbox'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, planId, amount, userId, customerName, priceId } = await req.json()

    console.log(`[Paddle] Received request:`, { email, planId, userId, priceId })

    if (!email || !userId) {
      console.error('[Paddle] Missing required fields:', { email, userId })
      throw new Error('Email and User ID are required')
    }

    if (!PADDLE_API_KEY) {
      console.error('[Paddle] PADDLE_API_KEY is not set in environment variables')
      throw new Error('Paddle API configuration error')
    }

    const baseUrl = PADDLE_ENV === 'sandbox' ? 'https://sandbox-api.paddle.com' : 'https://api.paddle.com'

    console.log(`[Paddle] Creating transaction at ${baseUrl} for user ${userId} (${email})`)

    const body = {
      items: [
        {
          quantity: 1,
          price_id: priceId
        }
      ],
      customer_email: email,
      custom_data: {
        user_id: userId,
        plan_id: planId,
        source: 'Mobile App'
      }
    }

    console.log(`[Paddle] Request Body:`, JSON.stringify(body))

    const response = await fetch(`${baseUrl}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PADDLE_API_KEY}`,
      },
      body: JSON.stringify(body)
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('[Paddle API Error Details]:', JSON.stringify(data, null, 2))
      throw new Error(data.error?.detail || `Paddle API error: ${response.status} ${response.statusText}`)
    }

    console.log(`[Paddle] Transaction created successfully: ${data.data?.id}`)

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
