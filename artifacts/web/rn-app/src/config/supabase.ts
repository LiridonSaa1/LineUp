import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cnlhqxegzphtlvtgijuj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNubGhxeGVnenBodGx2dGdpanVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0MTA2NDAsImV4cCI6MjA5Nzk4NjY0MH0.AiT2pha9udGDx7og-e7f9XJyHZUJJClIEj43YEyy-Pc';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
