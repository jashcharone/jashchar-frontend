-- ============================================
-- VERIFY ALL COLUMNS IN school_requests TABLE
-- ============================================
-- Run this to see all columns in school_requests table

SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'school_requests'
ORDER BY ordinal_position;

-- Expected columns:
-- - id
-- - created_at
-- - school_name
-- - contact_number
-- - contact_email
-- - address
-- - pincode
-- - city
-- - state
-- - board
-- - owner_name
-- - owner_email
-- - owner_mobile ✅ (NEW)
-- - owner_user_id ✅ (NEW)
-- - slug ✅ (NEW)
-- - registration_type ✅ (NEW)
-- - status
-- - notes

