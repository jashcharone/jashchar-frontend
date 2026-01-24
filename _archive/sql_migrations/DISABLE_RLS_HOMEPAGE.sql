-- NUCLEAR OPTION: Disable RLS for Public Tables
-- Run this in Supabase SQL Editor
-- These tables contain only public website content, so RLS is not needed

-- Completely disable RLS on public-facing tables
ALTER TABLE saas_website_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename IN ('saas_website_settings', 'subscription_plans');

-- Should show rowsecurity = false for both tables
