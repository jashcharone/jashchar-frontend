-- OPTIMIZE_DATABASE_V4.sql
-- Safe version: Checks if columns exist before creating indexes
-- This prevents "column does not exist" errors if your schema is slightly different

-- 1. Schools
CREATE INDEX IF NOT EXISTS idx_schools_owner_user_id ON schools(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_schools_plan_id ON schools(plan_id);

-- 2. Roles
CREATE INDEX IF NOT EXISTS idx_roles_school_id ON roles(school_id);

-- 3. School Users
CREATE INDEX IF NOT EXISTS idx_school_users_school_id ON school_users(school_id);
CREATE INDEX IF NOT EXISTS idx_school_users_user_id ON school_users(user_id);
CREATE INDEX IF NOT EXISTS idx_school_users_role_id ON school_users(role_id);

-- 4. Role Permissions
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_module_id ON role_permissions(module_id);

-- 5. Plan Modules
CREATE INDEX IF NOT EXISTS idx_plan_modules_plan_id ON plan_modules(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_modules_module_id ON plan_modules(module_id);

-- 6. Student Profiles (Safe Mode)
CREATE INDEX IF NOT EXISTS idx_student_profiles_school_id ON student_profiles(school_id);

DO $$
BEGIN
    -- Check for session_id
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'student_profiles' AND column_name = 'session_id') THEN
        CREATE INDEX IF NOT EXISTS idx_student_profiles_session_id ON student_profiles(session_id);
    END IF;
    
    -- Check for branch_id
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'student_profiles' AND column_name = 'branch_id') THEN
        CREATE INDEX IF NOT EXISTS idx_student_profiles_branch_id ON student_profiles(branch_id);
    END IF;
END $$;

-- 7. Employee Profiles
CREATE INDEX IF NOT EXISTS idx_employee_profiles_school_id ON employee_profiles(school_id);

-- 8. Fees Collection (Safe Mode)
CREATE INDEX IF NOT EXISTS idx_fees_collection_school_id ON fees_collection(school_id);
CREATE INDEX IF NOT EXISTS idx_fees_collection_student_id ON fees_collection(student_id);

DO $$
BEGIN
    -- Check for session_id in fees_collection
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fees_collection' AND column_name = 'session_id') THEN
        CREATE INDEX IF NOT EXISTS idx_fees_collection_session_id ON fees_collection(session_id);
    END IF;
END $$;

-- 9. Student Attendance (Safe Mode)
CREATE INDEX IF NOT EXISTS idx_student_attendance_school_id ON student_attendance(school_id);
CREATE INDEX IF NOT EXISTS idx_student_attendance_student_id ON student_attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_student_attendance_date ON student_attendance(date);

-- 10. Classes & Sections
CREATE INDEX IF NOT EXISTS idx_classes_school_id ON classes(school_id);
CREATE INDEX IF NOT EXISTS idx_sections_class_id ON sections(class_id);

ANALYZE;
