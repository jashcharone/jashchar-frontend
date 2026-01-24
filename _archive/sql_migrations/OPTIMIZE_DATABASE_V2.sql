-- OPTIMIZE_DATABASE_V2.sql
-- Corrected table names and columns based on codebase analysis

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

-- 6. Student Profiles (Critical for Student Lists)
-- Note: If 'user_id' does not exist, check if it is named 'profile_id' or similar.
-- Based on controller code, it should be 'user_id'.
CREATE INDEX IF NOT EXISTS idx_student_profiles_school_id ON student_profiles(school_id);
CREATE INDEX IF NOT EXISTS idx_student_profiles_session_id ON student_profiles(session_id);
CREATE INDEX IF NOT EXISTS idx_student_profiles_branch_id ON student_profiles(branch_id);
-- CREATE INDEX IF NOT EXISTS idx_student_profiles_user_id ON student_profiles(user_id); -- Commented out to be safe if column is missing

-- 7. Employee Profiles (Was 'staff')
CREATE INDEX IF NOT EXISTS idx_employee_profiles_school_id ON employee_profiles(school_id);
-- CREATE INDEX IF NOT EXISTS idx_employee_profiles_user_id ON employee_profiles(user_id); -- Commented out to be safe

-- 8. Invoices (Used in Dashboard)
CREATE INDEX IF NOT EXISTS idx_invoices_school_id ON invoices(school_id);
-- CREATE INDEX IF NOT EXISTS idx_invoices_student_id ON invoices(student_id);

-- 9. Student Attendance (Was 'attendance')
CREATE INDEX IF NOT EXISTS idx_student_attendance_school_id ON student_attendance(school_id);
CREATE INDEX IF NOT EXISTS idx_student_attendance_student_id ON student_attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_student_attendance_date ON student_attendance(date);

-- 10. Fees Collection (New)
CREATE INDEX IF NOT EXISTS idx_fees_collection_school_id ON fees_collection(school_id);
CREATE INDEX IF NOT EXISTS idx_fees_collection_student_id ON fees_collection(student_id);

-- 11. Classes & Sections
CREATE INDEX IF NOT EXISTS idx_classes_school_id ON classes(school_id);
CREATE INDEX IF NOT EXISTS idx_sections_class_id ON sections(class_id);

ANALYZE;
