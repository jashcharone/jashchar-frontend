/**
 * 📊 REPORT GENERATOR QUERIES (Direct Supabase)
 * ═══════════════════════════════════════════════════════════════════════════════
 * Direct Supabase queries for all report modules
 * Used in production where no backend server is available (static hosting)
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { supabase } from '@/lib/customSupabaseClient';

// ═══════════════════════════════════════════════════════════════════════════════
// 👨‍🎓 STUDENT DATA QUERIES
// ═══════════════════════════════════════════════════════════════════════════════

export const fetchStudentsFromSupabase = async ({ 
  branchId, organizationId, sessionId, 
  status, gender, classId, sectionId, categoryId, search 
}) => {
  // Step 1: Fetch students
  let query = supabase
    .from('student_profiles')
    .select('*')
    .eq('branch_id', branchId)
    .eq('session_id', sessionId);

  // Apply filters
  if (status && status !== 'all') query = query.ilike('status', status);
  if (gender && gender !== 'all') query = query.ilike('gender', gender);
  if (classId) query = query.eq('class_id', classId);
  if (sectionId) query = query.eq('section_id', sectionId);
  if (categoryId) query = query.eq('category_id', categoryId);
  if (search) {
    query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,school_code.ilike.%${search}%`);
  }

  const { data: students, error } = await query.order('first_name');
  if (error) throw error;
  if (!students || students.length === 0) return [];

  // Step 2: Get unique IDs for lookups
  const classIds = [...new Set(students.map(s => s.class_id).filter(Boolean))];
  const sectionIds = [...new Set(students.map(s => s.section_id).filter(Boolean))];
  const categoryIds = [...new Set(students.map(s => s.category_id).filter(Boolean))];

  // Step 3: Fetch related data in parallel
  const [classesRes, sectionsRes, categoriesRes] = await Promise.all([
    classIds.length > 0 
      ? supabase.from('classes').select('id, name').in('id', classIds)
      : { data: [] },
    sectionIds.length > 0
      ? supabase.from('sections').select('id, name').in('id', sectionIds)
      : { data: [] },
    categoryIds.length > 0
      ? supabase.from('categories').select('id, name').in('id', categoryIds)
      : { data: [] }
  ]);

  // Step 4: Build lookup maps
  const classMap = Object.fromEntries((classesRes.data || []).map(c => [c.id, c]));
  const sectionMap = Object.fromEntries((sectionsRes.data || []).map(s => [s.id, s]));
  const categoryMap = Object.fromEntries((categoriesRes.data || []).map(c => [c.id, c]));

  // Step 5: Enrich students with related data
  return students.map(s => ({
    ...s,
    admission_number: s.school_code || s.admission_no || null,
    class: classMap[s.class_id] || null,
    section: sectionMap[s.section_id] || null,
    category: categoryMap[s.category_id] || null
  }));
};

// ═══════════════════════════════════════════════════════════════════════════════
// 💳 FEES DATA QUERIES
// ═══════════════════════════════════════════════════════════════════════════════

export const fetchFeesDataFromSupabase = async ({
  branchId, organizationId, sessionId,
  dateFrom, dateTo, classId, feeHeadId, paymentStatus
}) => {
  // Using embedded selects for related data
  let query = supabase
    .from('fee_payments')
    .select(`
      *,
      student:student_profiles(id, school_code, first_name, last_name),
      class:classes(id, name),
      fee_head:fee_heads(id, name)
    `)
    .eq('branch_id', branchId)
    .eq('session_id', sessionId);

  if (dateFrom) query = query.gte('payment_date', dateFrom);
  if (dateTo) query = query.lte('payment_date', dateTo);
  if (classId) query = query.eq('class_id', classId);
  if (feeHeadId) query = query.eq('fee_head_id', feeHeadId);
  if (paymentStatus) query = query.eq('status', paymentStatus);

  const { data, error } = await query.order('payment_date', { ascending: false });
  if (error) throw error;
  
  // Map school_code to admission_number
  return (data || []).map(row => ({
    ...row,
    student: row.student ? {
      ...row.student,
      admission_number: row.student.school_code
    } : null
  }));
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🚌 TRANSPORT DATA QUERIES
// ═══════════════════════════════════════════════════════════════════════════════

export const fetchTransportDataFromSupabase = async ({
  branchId, organizationId, sessionId,
  routeId, vehicleId, stopId
}) => {
  let query = supabase
    .from('transport_allocations')
    .select(`
      *,
      student:student_profiles(id, school_code, first_name, last_name, class_id),
      route:transport_routes(id, name, description),
      vehicle:vehicles(id, vehicle_number, driver_name),
      stop:transport_stops(id, name, time)
    `)
    .eq('branch_id', branchId)
    .eq('session_id', sessionId);

  if (routeId) query = query.eq('route_id', routeId);
  if (vehicleId) query = query.eq('vehicle_id', vehicleId);
  if (stopId) query = query.eq('stop_id', stopId);

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) {
    console.log('[fetchTransportData] Error:', error.message);
    return [];
  }
  
  return (data || []).map(row => ({
    ...row,
    student: row.student ? {
      ...row.student,
      admission_number: row.student.school_code
    } : null
  }));
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🏠 HOSTEL DATA QUERIES
// ═══════════════════════════════════════════════════════════════════════════════

export const fetchHostelDataFromSupabase = async ({
  branchId, organizationId, sessionId,
  hostelId, roomId
}) => {
  let query = supabase
    .from('hostel_allocations')
    .select(`
      *,
      student:student_profiles(id, school_code, first_name, last_name, class_id),
      hostel:hostels(id, name, type),
      room:hostel_rooms(id, room_number, capacity, floor)
    `)
    .eq('branch_id', branchId)
    .eq('session_id', sessionId);

  if (hostelId) query = query.eq('hostel_id', hostelId);
  if (roomId) query = query.eq('room_id', roomId);

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) {
    console.log('[fetchHostelData] Error:', error.message);
    return [];
  }
  
  return (data || []).map(row => ({
    ...row,
    student: row.student ? {
      ...row.student,
      admission_number: row.student.school_code
    } : null
  }));
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📚 LIBRARY DATA QUERIES
// ═══════════════════════════════════════════════════════════════════════════════

export const fetchLibraryDataFromSupabase = async ({
  branchId, organizationId, sessionId,
  dateFrom, dateTo, categoryId, status
}) => {
  let query = supabase
    .from('book_issuances')
    .select(`
      *,
      member:library_members(id, member_name, member_type, member_code),
      book:books(id, title, author, isbn, accession_number)
    `)
    .eq('branch_id', branchId)
    .eq('session_id', sessionId);

  if (dateFrom) query = query.gte('issue_date', dateFrom);
  if (dateTo) query = query.lte('issue_date', dateTo);
  if (status) query = query.eq('status', status);

  const { data, error } = await query.order('issue_date', { ascending: false });
  if (error) {
    console.log('[fetchLibraryData] Error:', error.message);
    return [];
  }
  
  return data || [];
};

// ═══════════════════════════════════════════════════════════════════════════════
// 👨‍💼 HR DATA QUERIES
// ═══════════════════════════════════════════════════════════════════════════════

export const fetchHRDataFromSupabase = async ({
  branchId, organizationId, sessionId,
  departmentId, designationId, status, employeeType
}) => {
  let query = supabase
    .from('employee_profiles')
    .select('*')
    .eq('branch_id', branchId);

  if (departmentId) query = query.eq('department_id', departmentId);
  if (designationId) query = query.eq('designation_id', designationId);
  if (status) query = query.ilike('status', status);
  if (employeeType) query = query.eq('employee_type', employeeType);

  const { data: employees, error } = await query.order('first_name');
  if (error) {
    console.log('[fetchHRData] Error:', error.message);
    return [];
  }
  if (!employees || employees.length === 0) return [];

  // Fetch departments and designations
  const deptIds = [...new Set(employees.map(e => e.department_id).filter(Boolean))];
  const desigIds = [...new Set(employees.map(e => e.designation_id).filter(Boolean))];

  const [deptsRes, desigsRes] = await Promise.all([
    deptIds.length > 0 
      ? supabase.from('departments').select('id, name').in('id', deptIds)
      : { data: [] },
    desigIds.length > 0
      ? supabase.from('designations').select('id, name').in('id', desigIds)
      : { data: [] }
  ]);

  const deptMap = Object.fromEntries((deptsRes.data || []).map(d => [d.id, d]));
  const desigMap = Object.fromEntries((desigsRes.data || []).map(d => [d.id, d]));

  return employees.map(e => ({
    ...e,
    department: deptMap[e.department_id] || null,
    designation: desigMap[e.designation_id] || null
  }));
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📝 EXAMINATION DATA QUERIES
// ═══════════════════════════════════════════════════════════════════════════════

export const fetchExamDataFromSupabase = async ({
  branchId, organizationId, sessionId,
  examId, classId, subjectId
}) => {
  let query = supabase
    .from('exam_results')
    .select(`
      *,
      student:student_profiles(id, school_code, first_name, last_name),
      exam:exams(id, name, exam_type),
      subject:subjects(id, name)
    `)
    .eq('branch_id', branchId)
    .eq('session_id', sessionId);

  if (examId) query = query.eq('exam_id', examId);
  if (classId) query = query.eq('class_id', classId);
  if (subjectId) query = query.eq('subject_id', subjectId);

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) {
    console.log('[fetchExamData] Error:', error.message);
    return [];
  }
  
  return (data || []).map(row => ({
    ...row,
    student: row.student ? {
      ...row.student,
      admission_number: row.student.school_code
    } : null
  }));
};

// ═══════════════════════════════════════════════════════════════════════════════
// 💰 FINANCE DATA QUERIES
// ═══════════════════════════════════════════════════════════════════════════════

export const fetchFinanceDataFromSupabase = async ({
  branchId, organizationId, sessionId,
  dateFrom, dateTo, paymentMode, voucherType
}) => {
  let query = supabase
    .from('finance_transactions')
    .select('*')
    .eq('branch_id', branchId)
    .eq('session_id', sessionId);

  if (dateFrom) query = query.gte('transaction_date', dateFrom);
  if (dateTo) query = query.lte('transaction_date', dateTo);
  if (paymentMode) query = query.eq('payment_mode', paymentMode);
  if (voucherType) query = query.eq('voucher_type', voucherType);

  const { data, error } = await query.order('transaction_date', { ascending: false });
  if (error) {
    console.log('[fetchFinanceData] Table may not exist:', error.message);
    return [];
  }
  
  return data || [];
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📅 ATTENDANCE DATA QUERIES
// ═══════════════════════════════════════════════════════════════════════════════

export const fetchAttendanceDataFromSupabase = async ({
  branchId, organizationId, sessionId,
  dateFrom, dateTo, classId, sectionId, status
}) => {
  let query = supabase
    .from('student_attendance')
    .select(`
      *,
      student:student_profiles(id, school_code, first_name, last_name, class_id)
    `)
    .eq('branch_id', branchId)
    .eq('session_id', sessionId);

  if (dateFrom) query = query.gte('date', dateFrom);
  if (dateTo) query = query.lte('date', dateTo);
  if (classId) query = query.eq('class_id', classId);
  if (sectionId) query = query.eq('section_id', sectionId);
  if (status) query = query.eq('status', status);

  const { data, error } = await query.order('date', { ascending: false });
  if (error) {
    console.log('[fetchAttendanceData] Error:', error.message);
    return [];
  }
  
  return (data || []).map(row => ({
    ...row,
    student: row.student ? {
      ...row.student,
      admission_number: row.student.school_code
    } : null
  }));
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📝 HOMEWORK DATA QUERIES
// ═══════════════════════════════════════════════════════════════════════════════

export const fetchHomeworkDataFromSupabase = async ({
  branchId, organizationId, sessionId,
  dateFrom, dateTo, classId, subjectId, status
}) => {
  let query = supabase
    .from('homework_assignments')
    .select(`
      *,
      class:classes(id, name),
      subject:subjects(id, name)
    `)
    .eq('branch_id', branchId)
    .eq('session_id', sessionId);

  if (dateFrom) query = query.gte('assigned_date', dateFrom);
  if (dateTo) query = query.lte('assigned_date', dateTo);
  if (classId) query = query.eq('class_id', classId);
  if (subjectId) query = query.eq('subject_id', subjectId);
  if (status) query = query.eq('status', status);

  const { data, error } = await query.order('assigned_date', { ascending: false });
  if (error) {
    console.log('[fetchHomeworkData] Error:', error.message);
    return [];
  }
  
  return data || [];
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📝 HOMEWORK EVALUATION DATA QUERIES
// ═══════════════════════════════════════════════════════════════════════════════

export const fetchHomeworkEvaluationDataFromSupabase = async ({
  branchId, organizationId, sessionId,
  dateFrom, dateTo, classId, studentId
}) => {
  let query = supabase
    .from('homework_submissions')
    .select(`
      *,
      student:student_profiles(id, school_code, first_name, last_name),
      homework:homework_assignments(id, title, subject_id)
    `)
    .eq('branch_id', branchId)
    .eq('session_id', sessionId);

  if (dateFrom) query = query.gte('submitted_date', dateFrom);
  if (dateTo) query = query.lte('submitted_date', dateTo);
  if (classId) query = query.eq('class_id', classId);
  if (studentId) query = query.eq('student_id', studentId);

  const { data, error } = await query.order('submitted_date', { ascending: false });
  if (error) {
    console.log('[fetchHomeworkEvaluationData] Error:', error.message);
    return [];
  }
  
  return (data || []).map(row => ({
    ...row,
    student: row.student ? {
      ...row.student,
      admission_number: row.student.school_code
    } : null
  }));
};

// ═══════════════════════════════════════════════════════════════════════════════
// 💻 ONLINE EXAM DATA QUERIES
// ═══════════════════════════════════════════════════════════════════════════════

export const fetchOnlineExamDataFromSupabase = async ({
  branchId, organizationId, sessionId,
  examId, classId, status
}) => {
  let query = supabase
    .from('online_exam_results')
    .select(`
      *,
      student:student_profiles(id, school_code, first_name, last_name),
      exam:online_exams(id, title, total_marks)
    `)
    .eq('branch_id', branchId)
    .eq('session_id', sessionId);

  if (examId) query = query.eq('exam_id', examId);
  if (classId) query = query.eq('class_id', classId);
  if (status) query = query.eq('status', status);

  const { data, error } = await query.order('completed_at', { ascending: false });
  if (error) {
    console.log('[fetchOnlineExamData] Error:', error.message);
    return [];
  }
  
  return (data || []).map(row => ({
    ...row,
    student: row.student ? {
      ...row.student,
      admission_number: row.student.school_code
    } : null
  }));
};
