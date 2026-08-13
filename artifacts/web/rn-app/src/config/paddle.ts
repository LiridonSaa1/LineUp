import { supabase } from "./supabase";

// Configuration for Paddle Billing (v2)
export const PADDLE_CONFIG = {
  CLIENT_TOKEN: process.env.EXPO_PUBLIC_PADDLE_CLIENT_TOKEN || '',
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
  userId: string;
  customerName?: string;
}

/**
 * Creates a transaction via Supabase Edge Function to keep API Key secure
 */
export async function createPaddleTransaction({ email, planId, amount, userId, customerName }: CreateTransactionParams) {
  console.log(`[Paddle] Requesting transaction for ${email} (${planId})...`);

  try {
    const { data, error } = await supabase.functions.invoke('create-paddle-transaction', {
      body: {
        email,
        planId,
        amount,
        userId,
        customerName,
        priceId: PADDLE_CONFIG.PRICES[planId]
      }
    });

    if (error) {
      console.error('[Paddle] Edge Function Error:', error);
      throw new Error(error.message || 'Gabim gjatë krijimit të transaksionit');
    }

    return data;
  } catch (error: any) {
    console.error('[Paddle] Request failed:', error.message);
    throw error;
  }
}

/**
 * Fetches completed transactions from Paddle API
 */
export async function listPaddleTransactions() {
  const isSandbox = PADDLE_CONFIG.ENVIRONMENT === 'sandbox';
  const baseUrl = isSandbox ? 'https://sandbox-api.paddle.com' : 'https://api.paddle.com';

  try {
    const response = await fetch(`${baseUrl}/transactions?status=completed&per_page=50`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PADDLE_CONFIG.API_KEY}`,
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.detail || 'Gabim gjatë marrjes së transaksioneve');
    }

    return data.data as PaddleTransaction[];
  } catch (error: any) {
    console.error('[Paddle] Failed to fetch transactions:', error.message);
    return [];
  }
}
