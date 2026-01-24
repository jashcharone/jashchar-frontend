-- ============================================
-- QUICK FIX - Run this in Supabase SQL Editor
-- ============================================
-- This will add ALL missing columns at once
-- ============================================

-- Add all missing columns
ALTER TABLE public.school_requests 
ADD COLUMN IF NOT EXISTS owner_mobile TEXT,
ADD COLUMN IF NOT EXISTS owner_user_id UUID,
ADD COLUMN IF NOT EXISTS slug TEXT,
ADD COLUMN IF NOT EXISTS registration_type TEXT DEFAULT 'single_school';

-- Refresh schema cache
NOTIFY pgrst, 'reload config';

-- Verify
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'school_requests' 
AND column_name IN ('owner_mobile', 'owner_user_id', 'slug', 'registration_type')
ORDER BY column_name;

