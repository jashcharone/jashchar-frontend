CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_role_id UUID;
  v_school_id UUID;
  v_role_name TEXT;
BEGIN
  -- Extract school_id and role name from metadata
  v_school_id := (new.raw_user_meta_data->>'school_id')::UUID;
  v_role_name := new.raw_user_meta_data->>'role';

  -- Find the role_id based on the role name and school_id
  SELECT id INTO v_role_id
  FROM public.roles
  WHERE name = v_role_name AND school_id = v_school_id
  LIMIT 1;

  -- If role_id is not found, raise an error. This is a safeguard.
  IF v_role_id IS NULL AND v_role_name != 'master_admin' THEN
    RAISE EXCEPTION 'Role ''%'' not found for school %', v_role_name, v_school_id;
  END IF;
  
  IF v_role_name = 'master_admin' THEN
      SELECT id INTO v_role_id FROM public.roles WHERE name = 'master_admin' LIMIT 1;
  END IF;

  -- Insert into appropriate table based on role
  IF v_role_name = 'master_admin' THEN
      INSERT INTO public.master_admin_profiles (id, full_name, email, username, role_id, photo_url)
      VALUES (new.id, new.raw_user_meta_data->>'full_name', new.email, new.raw_user_meta_data->>'username', v_role_id, new.raw_user_meta_data->>'photo_url');
      
  ELSIF v_role_name = 'school_owner' THEN
      INSERT INTO public.school_owner_profiles (id, school_id, full_name, email, username, role_id, photo_url)
      VALUES (new.id, v_school_id, new.raw_user_meta_data->>'full_name', new.email, new.raw_user_meta_data->>'username', v_role_id, new.raw_user_meta_data->>'photo_url');
      
  ELSIF v_role_name = 'student' THEN
      INSERT INTO public.student_profiles (
        id, school_id, full_name, email, username, role_id, photo_url,
        school_code, admission_date, class_id, section_id, category_id, house_id, roll_number, caste, religion, blood_group, aadhar_no,
        height, weight, is_rte_student, documents_received,
        gender, dob, phone, present_address, permanent_address, city, state,
        father_name, father_occupation, father_phone,
        mother_name, mother_occupation, mother_phone,
        guardian_name, guardian_email, guardian_phone, guardian_relation, guardian_occupation, guardian_address,
        send_sms_preference, send_whatsapp_preference,
        transport_details_id, hostel_details_id
      )
      VALUES (
        new.id, v_school_id, new.raw_user_meta_data->>'full_name', new.email, new.raw_user_meta_data->>'username', v_role_id, new.raw_user_meta_data->>'photo_url',
        new.raw_user_meta_data->>'school_code', (NULLIF(new.raw_user_meta_data->>'admission_date', ''))::DATE, (NULLIF(new.raw_user_meta_data->>'class_id', ''))::UUID, (NULLIF(new.raw_user_meta_data->>'section_id', ''))::UUID, (NULLIF(new.raw_user_meta_data->>'category_id', ''))::UUID, (NULLIF(new.raw_user_meta_data->>'house_id', ''))::UUID, new.raw_user_meta_data->>'roll_number', new.raw_user_meta_data->>'caste', new.raw_user_meta_data->>'religion', new.raw_user_meta_data->>'blood_group', new.raw_user_meta_data->>'aadhar_no',
        new.raw_user_meta_data->>'height', new.raw_user_meta_data->>'weight', (new.raw_user_meta_data->>'is_rte_student')::BOOLEAN, (new.raw_user_meta_data->>'documents_received')::JSONB,
        new.raw_user_meta_data->>'gender', (NULLIF(new.raw_user_meta_data->>'dob', ''))::DATE, new.raw_user_meta_data->>'phone', new.raw_user_meta_data->>'present_address', new.raw_user_meta_data->>'permanent_address', new.raw_user_meta_data->>'city', new.raw_user_meta_data->>'state',
        new.raw_user_meta_data->>'father_name', new.raw_user_meta_data->>'father_occupation', new.raw_user_meta_data->>'father_phone',
        new.raw_user_meta_data->>'mother_name', new.raw_user_meta_data->>'mother_occupation', new.raw_user_meta_data->>'mother_phone',
        new.raw_user_meta_data->>'guardian_name', new.raw_user_meta_data->>'guardian_email', new.raw_user_meta_data->>'guardian_phone', new.raw_user_meta_data->>'guardian_relation', new.raw_user_meta_data->>'guardian_occupation', new.raw_user_meta_data->>'guardian_address',
        (new.raw_user_meta_data->>'send_sms_preference')::BOOLEAN, (new.raw_user_meta_data->>'send_whatsapp_preference')::BOOLEAN,
        (NULLIF(new.raw_user_meta_data->>'transport_details_id', ''))::UUID, (NULLIF(new.raw_user_meta_data->>'hostel_details_id', ''))::UUID
      );
      
  ELSIF v_role_name = 'parent' THEN
      INSERT INTO public.parent_profiles (id, school_id, full_name, email, username, role_id, photo_url, phone, address)
      VALUES (new.id, v_school_id, new.raw_user_meta_data->>'full_name', new.email, new.raw_user_meta_data->>'username', v_role_id, new.raw_user_meta_data->>'photo_url', new.raw_user_meta_data->>'phone', new.raw_user_meta_data->>'present_address');
      
  ELSE
      -- Assume Employee for other roles
      INSERT INTO public.employee_profiles (
        id, school_id, full_name, email, username, role_id, photo_url,
        designation_id, department_id, date_of_joining, emergency_contact_number, marital_status,
        qualification, work_experience, note, pan_number, epf_no, basic_salary, contract_type,
        work_shift, location, medical_leave, casual_leave, maternity_leave, bank_account_title,
        bank_account_number, bank_name, ifsc_code, bank_branch_name,
        phone, current_address, permanent_address
      )
      VALUES (
        new.id, v_school_id, new.raw_user_meta_data->>'full_name', new.email, new.raw_user_meta_data->>'username', v_role_id, new.raw_user_meta_data->>'photo_url',
        (NULLIF(new.raw_user_meta_data->>'designation_id', ''))::UUID, (NULLIF(new.raw_user_meta_data->>'department_id', ''))::UUID, (NULLIF(new.raw_user_meta_data->>'date_of_joining', ''))::DATE, new.raw_user_meta_data->>'emergency_contact_number', new.raw_user_meta_data->>'marital_status',
        new.raw_user_meta_data->>'qualification', new.raw_user_meta_data->>'work_experience', new.raw_user_meta_data->>'note', new.raw_user_meta_data->>'pan_number', new.raw_user_meta_data->>'epf_no', (NULLIF(new.raw_user_meta_data->>'basic_salary', ''))::NUMERIC, new.raw_user_meta_data->>'contract_type',
        new.raw_user_meta_data->>'work_shift', new.raw_user_meta_data->>'location', (NULLIF(new.raw_user_meta_data->>'medical_leave', ''))::INTEGER, (NULLIF(new.raw_user_meta_data->>'casual_leave', ''))::INTEGER, (NULLIF(new.raw_user_meta_data->>'maternity_leave', ''))::INTEGER, new.raw_user_meta_data->>'bank_account_title',
        new.raw_user_meta_data->>'bank_account_number', new.raw_user_meta_data->>'bank_name', new.raw_user_meta_data->>'ifsc_code', new.raw_user_meta_data->>'bank_branch_name',
        new.raw_user_meta_data->>'phone', new.raw_user_meta_data->>'present_address', new.raw_user_meta_data->>'permanent_address'
      );
  END IF;

  RETURN new;
END;
$function$