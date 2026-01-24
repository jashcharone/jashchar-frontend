-- ============================================
-- RUN THIS IN SUPABASE SQL EDITOR
-- ============================================
-- Steps:
-- 1. Go to Supabase Dashboard
-- 2. Click on "SQL Editor" in the left menu
-- 3. Click "New Query"
-- 4. Copy and paste ALL the SQL below
-- 5. Click "Run" or press Ctrl+Enter
-- 6. Wait 10-30 seconds for schema cache to refresh
-- ============================================

-- Add owner_mobile column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'school_requests' 
        AND column_name = 'owner_mobile'
    ) THEN
        ALTER TABLE public.school_requests ADD COLUMN owner_mobile TEXT;
        RAISE NOTICE 'Added owner_mobile column';
    ELSE
        RAISE NOTICE 'owner_mobile column already exists';
    END IF;
END $$;

-- Add owner_user_id column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'school_requests' 
        AND column_name = 'owner_user_id'
    ) THEN
        ALTER TABLE public.school_requests ADD COLUMN owner_user_id UUID;
        RAISE NOTICE 'Added owner_user_id column';
    ELSE
        RAISE NOTICE 'owner_user_id column already exists';
    END IF;
END $$;

-- Add slug column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'school_requests' 
        AND column_name = 'slug'
    ) THEN
        ALTER TABLE public.school_requests ADD COLUMN slug TEXT;
        RAISE NOTICE 'Added slug column';
    ELSE
        RAISE NOTICE 'slug column already exists';
    END IF;
END $$;

-- Add registration_type column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'school_requests' 
        AND column_name = 'registration_type'
    ) THEN
        ALTER TABLE public.school_requests ADD COLUMN registration_type TEXT DEFAULT 'single_school';
        RAISE NOTICE 'Added registration_type column';
    ELSE
        RAISE NOTICE 'registration_type column already exists';
    END IF;
END $$;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload config';

-- Verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'school_requests' 
AND column_name IN ('owner_mobile', 'owner_user_id', 'slug', 'registration_type')
ORDER BY column_name;

