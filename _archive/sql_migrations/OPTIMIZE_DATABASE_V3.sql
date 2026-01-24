-- OPTIMIZE_DATABASE_V3.sql
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
CREATE INDEX IF NOT EXISTS idx_student_profiles_school_id ON student_profiles(school_id);
CREATE INDEX IF NOT EXISTS idx_student_profiles_session_id ON student_profiles(session_id);
CREATE INDEX IF NOT EXISTS idx_student_profiles_branch_id ON student_profiles(branch_id);
-- Note: 'user_id' might not exist in student_profiles in some schemas, so we skip it to be safe.

-- 7. Employee Profiles (Was 'staff')
CREATE INDEX IF NOT EXISTS idx_employee_profiles_school_id ON employee_profiles(school_id);

-- 8. Fees Collection (Was 'invoices' or 'fee_payments')
-- Based on fees.queries.js, the table is 'fees_collection'
CREATE INDEX IF NOT EXISTS idx_fees_collection_school_id ON fees_collection(school_id);
CREATE INDEX IF NOT EXISTS idx_fees_collection_student_id ON fees_collection(student_id);
CREATE INDEX IF NOT EXISTS idx_fees_collection_session_id ON fees_collection(session_id);

-- 9. Student Attendance (Was 'attendance')
-- Based on attendance.queries.js, the table is 'student_attendance'
CREATE INDEX IF NOT EXISTS idx_student_attendance_school_id ON student_attendance(school_id);
CREATE INDEX IF NOT EXISTS idx_student_attendance_student_id ON student_attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_student_attendance_date ON student_attendance(date);

-- 10. Classes & Sections
CREATE INDEX IF NOT EXISTS idx_classes_school_id ON classes(school_id);
CREATE INDEX IF NOT EXISTS idx_sections_class_id ON sections(class_id);

ANALYZE;
