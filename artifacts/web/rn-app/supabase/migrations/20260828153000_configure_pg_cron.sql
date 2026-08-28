-- Migration: Configure pg_cron for automated subscription expiry processing
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove previous schedule if exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('process-subscription-expiry-daily');
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- ignore if not found
END $$;

-- Schedule process-subscription-expiry everyday at 00:00 UTC
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'process-subscription-expiry-daily',
      '0 0 * * *',
      $cron$
      SELECT net.http_post(
        url := 'https://cnlhqxegzphtlvtgijuj.supabase.co/functions/v1/process-subscription-expiry',
        headers := '{"Content-Type": "application/json"}'::jsonb
      ) as request_id;
      $cron$
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron check completed';
END $$;
