-- OPTIMIZE_DATABASE_V5.sql
-- Ultra-Safe version: Checks for Table AND Column existence before creating indexes.
-- This guarantees the script will run without errors, skipping any missing columns.

-- 1. Schools
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'schools' AND column_name = 'owner_user_id') THEN
        CREATE INDEX IF NOT EXISTS idx_schools_owner_user_id ON schools(owner_user_id);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'schools' AND column_name = 'plan_id') THEN
        CREATE INDEX IF NOT EXISTS idx_schools_plan_id ON schools(plan_id);
    END IF;
END $$;

-- 2. Roles
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'roles' AND column_name = 'school_id') THEN
        CREATE INDEX IF NOT EXISTS idx_roles_school_id ON roles(school_id);
    END IF;
END $$;

-- 3. School Users
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'school_users' AND column_name = 'school_id') THEN
        CREATE INDEX IF NOT EXISTS idx_school_users_school_id ON school_users(school_id);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'school_users' AND column_name = 'user_id') THEN
        CREATE INDEX IF NOT EXISTS idx_school_users_user_id ON school_users(user_id);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'school_users' AND column_name = 'role_id') THEN
        CREATE INDEX IF NOT EXISTS idx_school_users_role_id ON school_users(role_id);
    END IF;
END $$;

-- 4. Role Permissions
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'role_permissions' AND column_name = 'role_id') THEN
        CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'role_permissions' AND column_name = 'module_id') THEN
        CREATE INDEX IF NOT EXISTS idx_role_permissions_module_id ON role_permissions(module_id);
    END IF;
END $$;

-- 5. Plan Modules
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'plan_modules' AND column_name = 'plan_id') THEN
        CREATE INDEX IF NOT EXISTS idx_plan_modules_plan_id ON plan_modules(plan_id);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'plan_modules' AND column_name = 'module_id') THEN
        CREATE INDEX IF NOT EXISTS idx_plan_modules_module_id ON plan_modules(module_id);
    END IF;
END $$;

-- 6. Student Profiles
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'student_profiles' AND column_name = 'school_id') THEN
        CREATE INDEX IF NOT EXISTS idx_student_profiles_school_id ON student_profiles(school_id);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'student_profiles' AND column_name = 'session_id') THEN
        CREATE INDEX IF NOT EXISTS idx_student_profiles_session_id ON student_profiles(session_id);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'student_profiles' AND column_name = 'branch_id') THEN
        CREATE INDEX IF NOT EXISTS idx_student_profiles_branch_id ON student_profiles(branch_id);
    END IF;
END $$;

-- 7. Employee Profiles
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employee_profiles' AND column_name = 'school_id') THEN
        CREATE INDEX IF NOT EXISTS idx_employee_profiles_school_id ON employee_profiles(school_id);
    END IF;
END $$;

-- 8. Fees Collection
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fees_collection' AND column_name = 'school_id') THEN
        CREATE INDEX IF NOT EXISTS idx_fees_collection_school_id ON fees_collection(school_id);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fees_collection' AND column_name = 'student_id') THEN
        CREATE INDEX IF NOT EXISTS idx_fees_collection_student_id ON fees_collection(student_id);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fees_collection' AND column_name = 'session_id') THEN
        CREATE INDEX IF NOT EXISTS idx_fees_collection_session_id ON fees_collection(session_id);
    END IF;
END $$;

-- 9. Student Attendance
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'student_attendance' AND column_name = 'school_id') THEN
        CREATE INDEX IF NOT EXISTS idx_student_attendance_school_id ON student_attendance(school_id);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'student_attendance' AND column_name = 'student_id') THEN
        CREATE INDEX IF NOT EXISTS idx_student_attendance_student_id ON student_attendance(student_id);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'student_attendance' AND column_name = 'date') THEN
        CREATE INDEX IF NOT EXISTS idx_student_attendance_date ON student_attendance(date);
    END IF;
END $$;

-- 10. Classes & Sections (The problematic ones)
DO $$ BEGIN
    -- Classes
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'classes' AND column_name = 'school_id') THEN
        CREATE INDEX IF NOT EXISTS idx_classes_school_id ON classes(school_id);
    END IF;
    
    -- Sections
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sections' AND column_name = 'class_id') THEN
        CREATE INDEX IF NOT EXISTS idx_sections_class_id ON sections(class_id);
    END IF;
END $$;

ANALYZE;
