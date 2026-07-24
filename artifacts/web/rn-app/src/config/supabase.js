"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabase = void 0;
var supabase_js_1 = require("@supabase/supabase-js");
var SUPABASE_URL = 'https://cnlhqxegzphtlvtgijuj.supabase.co';
var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNubGhxeGVnenBodGx2dGdpanVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0MTA2NDAsImV4cCI6MjA5Nzk4NjY0MH0.AiT2pha9udGDx7og-e7f9XJyHZUJJClIEj43YEyy-Pc';
exports.supabase = (0, supabase_js_1.createClient)(SUPABASE_URL, SUPABASE_ANON_KEY);
