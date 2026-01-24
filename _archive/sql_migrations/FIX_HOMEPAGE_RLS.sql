-- COMPLETE RLS FIX for Homepage
-- Run this in Supabase SQL Editor

-- First, DROP existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow public read access to website settings" ON saas_website_settings;
DROP POLICY IF EXISTS "Allow authenticated read access to website settings" ON saas_website_settings;
DROP POLICY IF EXISTS "Allow public to view website plans" ON subscription_plans;
DROP POLICY IF EXISTS "Allow authenticated to view website plans" ON subscription_plans;

-- Enable RLS
ALTER TABLE saas_website_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- Create NEW policies with PERMISSIVE mode (allows both anon and authenticated)
CREATE POLICY "Public can read website settings"
ON saas_website_settings
AS PERMISSIVE
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Public can read visible plans"
ON subscription_plans
AS PERMISSIVE
FOR SELECT
TO anon, authenticated
USING (show_on_website = true);

-- Verify policies were created
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename IN ('saas_website_settings', 'subscription_plans')
ORDER BY tablename, policyname;
