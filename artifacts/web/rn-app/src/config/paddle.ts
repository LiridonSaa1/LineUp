import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from "./supabase";

// Configuration for Paddle Billing (v2)
export const PADDLE_CONFIG = {
  CLIENT_TOKEN: process.env.EXPO_PUBLIC_PADDLE_CLIENT_TOKEN || 'test_1d2d981b0be56b45f26cb550561',
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
  planId: string;
  amount: number;
  userId?: string;
  customerName?: string;
  priceId?: string; // Optional override
  businessId?: string;
}

/**
 * Creates a transaction via Supabase Edge Function
 * Using raw fetch to ensure we can capture the actual error body from Paddle/Server
 */
export async function createPaddleTransaction({ email, planId, amount, userId, customerName, priceId, businessId }: CreateTransactionParams) {
  const cleanEmail = (email || '').trim().toLowerCase();
  const effectiveUserId = userId || (cleanEmail ? `reg_${cleanEmail.replace(/[^a-z0-9]/g, '_')}` : `user_${Date.now()}`);

  console.log(`[Paddle] Requesting transaction for ${cleanEmail} (${planId}) with userId: ${effectiveUserId}...`);

  try {
    // Use provided priceId or fallback to config
    const finalPriceId = priceId || PADDLE_CONFIG.PRICES[planId as keyof typeof PADDLE_CONFIG.PRICES];

    const response = await fetch(`${SUPABASE_URL}/functions/v1/create-paddle-transaction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        email: cleanEmail,
        planId,
        amount,
        userId: effectiveUserId,
        customerName,
        priceId: finalPriceId,
        businessId: businessId ? String(businessId) : undefined
      })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('[Paddle] Edge Function Failed:', result);
      // result.error is set by our Edge Function's catch block
      throw new Error(result.error || result.message || `Server error: ${response.status}`);
    }

    return result;
  } catch (error: any) {
    console.error('[Paddle] Request failed:', error.message);
    throw error;
  }
}

/**
 * Placeholder for list transactions if needed on frontend
 */
export async function listPaddleTransactions() {
  return [];
}

export interface PaddleTransaction {
  id: string;
  status: string;
  customer_id: string;
  address_id: string;
  business_id: string | null;
  custom_data: any;
}
