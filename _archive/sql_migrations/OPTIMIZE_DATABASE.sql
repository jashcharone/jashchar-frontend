-- OPTIMIZE_DATABASE.sql
-- Adds missing indexes to Foreign Keys to improve JOIN performance

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
CREATE INDEX IF NOT EXISTS idx_student_profiles_user_id ON student_profiles(user_id);

-- 7. Staff
CREATE INDEX IF NOT EXISTS idx_staff_school_id ON staff(school_id);
CREATE INDEX IF NOT EXISTS idx_staff_user_id ON staff(user_id);

-- 8. Invoices
CREATE INDEX IF NOT EXISTS idx_invoices_school_id ON invoices(school_id);
CREATE INDEX IF NOT EXISTS idx_invoices_student_id ON invoices(student_id);

-- 9. Attendance
CREATE INDEX IF NOT EXISTS idx_attendance_school_id ON attendance(school_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);

-- 10. Classes & Sections
CREATE INDEX IF NOT EXISTS idx_classes_school_id ON classes(school_id);
CREATE INDEX IF NOT EXISTS idx_sections_class_id ON sections(class_id);

ANALYZE;
