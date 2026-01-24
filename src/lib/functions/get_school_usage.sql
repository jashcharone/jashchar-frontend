CREATE OR REPLACE FUNCTION public.get_school_usage(p_school_id uuid)
 RETURNS TABLE(active_students bigint, active_staff bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT COUNT(*) FROM public.student_profiles WHERE school_id = p_school_id AND status = 'active') AS active_students,
        (SELECT COUNT(*) FROM public.profiles WHERE school_id = p_school_id AND status = 'active') AS active_staff;
END;
$function$