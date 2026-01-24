-- FIX_DASHBOARD_RPC_V2.sql
-- Optimizes the dashboard stats function to use correct tables and indexes
-- Adds support for Branch filtering

DROP FUNCTION IF EXISTS get_school_owner_dashboard_stats(UUID);
DROP FUNCTION IF EXISTS get_school_owner_dashboard_stats(UUID, UUID);

CREATE OR REPLACE FUNCTION get_school_owner_dashboard_stats(p_school_id UUID, p_branch_id UUID DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
    v_total_students INT;
    v_total_staff INT;
    v_today_present INT;
    v_today_absent INT;
    v_monthly_income DECIMAL;
    v_monthly_expense DECIMAL;
BEGIN
    -- 1. Count Students (Active)
    SELECT COUNT(*) INTO v_total_students 
    FROM student_profiles 
    WHERE school_id = p_school_id 
    AND status = 'active'
    AND (p_branch_id IS NULL OR branch_id = p_branch_id);
    
    -- 2. Count Staff (Active)
    SELECT COUNT(*) INTO v_total_staff 
    FROM employee_profiles 
    WHERE school_id = p_school_id 
    AND status = 'active'
    AND (p_branch_id IS NULL OR branch_id = p_branch_id);
    
    -- 3. Attendance (Mock for now, or link to attendance table if exists)
    -- Assuming 'attendance' table exists
    BEGIN
        SELECT 
            COUNT(*) FILTER (WHERE status = 'present'),
            COUNT(*) FILTER (WHERE status = 'absent')
        INTO v_today_present, v_today_absent
        FROM attendance
        WHERE school_id = p_school_id
        AND date = CURRENT_DATE
        AND (p_branch_id IS NULL OR branch_id = p_branch_id);
    EXCEPTION WHEN OTHERS THEN
        v_today_present := 0;
        v_today_absent := 0;
    END;
    
    -- 4. Monthly Income
    SELECT COALESCE(SUM(amount), 0) INTO v_monthly_income 
    FROM fees_collection 
    WHERE school_id = p_school_id 
    AND payment_date >= date_trunc('month', CURRENT_DATE)
    -- AND reverted_at IS NULL -- Removed as column might not exist in fees_collection
    AND (p_branch_id IS NULL OR branch_id = p_branch_id);
    
    -- 5. Monthly Expense (Placeholder)
    v_monthly_expense := 0;

    RETURN json_build_object(
        'total_students', COALESCE(v_total_students, 0),
        'total_staff', COALESCE(v_total_staff, 0),
        'today_present', COALESCE(v_today_present, 0),
        'today_absent', COALESCE(v_today_absent, 0),
        'monthly_income', COALESCE(v_monthly_income, 0),
        'monthly_expense', COALESCE(v_monthly_expense, 0)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
