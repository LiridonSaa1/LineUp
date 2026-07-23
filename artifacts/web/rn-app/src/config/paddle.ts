// Configuration and API client for Paddle Billing (v2)
export const PADDLE_CONFIG = {
  API_KEY: process.env.EXPO_PUBLIC_PADDLE_API_KEY || '',
  CLIENT_TOKEN: process.env.EXPO_PUBLIC_PADDLE_CLIENT_TOKEN || '',
  WEBHOOK_SECRET: process.env.EXPO_PUBLIC_PADDLE_WEBHOOK_SECRET || '',
  ENVIRONMENT: (process.env.EXPO_PUBLIC_PADDLE_ENV as 'sandbox' | 'live') || 'sandbox',
  PRICES: {
    solo: 'pri_01ky8dvrqajpvkqtcde7ge9fgb',
    duo: 'pri_01ky8e821v11dc6f2nf9jnq5v8',
    team: 'pri_01ky8eh6v1h2snktvp7v6k8yx0',
  },
  PRODUCTS: {
    solo: 'pro_01ky8dvr6p8qf70p0y717t69p5',
    duo: 'pro_01ky8e81zvf8wz9p7z6k1v3v4e',
    team: 'pro_01ky8eapq2pvetack6ad8pnkbw'
  }
};

export interface CreateTransactionParams {
  email: string;
  planId: 'solo' | 'duo' | 'team';
  amount: number;
  customerName?: string;
}

/**
 * Executes a real transaction request to Paddle Sandbox API
 */
export async function createPaddleTransaction({ email, planId, amount, customerName }: CreateTransactionParams) {
  const isSandbox = PADDLE_CONFIG.ENVIRONMENT === 'sandbox';
  const baseUrl = isSandbox ? 'https://sandbox-api.paddle.com' : 'https://api.paddle.com';
  
  console.log(`[Paddle] Creating transaction for ${email} (${planId} - ${amount}€)...`);

  // Për planin Team përdorim inline price që të mbështesim kalkulimin tonë (+5€)
  // Për Solo/Duo përdorim direkt Price ID
  const item = planId === 'team' ? {
    quantity: 1,
    price: {
      description: `Abonimi TEAM (${amount}€/muaj)`,
      name: `Plani TEAM`,
      unit_price: {
        amount: String(Math.round(amount * 100)),
        currency_code: 'EUR'
      },
      product_id: PADDLE_CONFIG.PRODUCTS.team,
      tax_mode: 'internal' // Kjo e bën çmimin fiks (përfshirë taksën)
    }
  } : {
    quantity: 1,
    price_id: PADDLE_CONFIG.PRICES[planId]
  };

  try {
    const response = await fetch(`${baseUrl}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PADDLE_CONFIG.API_KEY}`,
      },
      body: JSON.stringify({
        items: [item],
        customer_email: email,
        custom_data: {
          plan: planId,
          source: 'Mobile App',
          final_amount: amount
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[Paddle] API Error:', JSON.stringify(data, null, 2));
      throw new Error(data.error?.detail || 'Gabim nga Paddle API');
    }

    return data;
  } catch (error: any) {
    console.error('[Paddle] request failed:', error.message);
    throw error;
  }
}
