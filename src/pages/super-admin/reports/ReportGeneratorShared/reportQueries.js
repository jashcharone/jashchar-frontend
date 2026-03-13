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
      ? supabase.from('student_categories').select('id, name').in('id', categoryIds)
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
  // Using nested joins - fee_payments -> student_profiles -> classes
  // Note: fee_payments doesn't have direct FK to classes or fee_heads
  let query = supabase
    .from('fee_payments')
    .select(`
      *,
      student:student_profiles(
        id, 
        school_code, 
        first_name, 
        last_name,
        class_id,
        section_id,
        class:classes(id, name),
        section:sections(id, name)
      )
    `)
    .eq('branch_id', branchId)
    .eq('session_id', sessionId);

  if (dateFrom) query = query.gte('payment_date', dateFrom);
  if (dateTo) query = query.lte('payment_date', dateTo);
  if (paymentStatus) query = query.eq('status', paymentStatus);

  const { data, error } = await query.order('payment_date', { ascending: false });
  if (error) {
    console.log('[fetchFeesData] Error:', error.message);
    return [];
  }
  
  // Map data and apply client-side class filtering
  let mappedData = (data || []).map(row => ({
    ...row,
    class_name: row.student?.class?.name || '',
    section_name: row.student?.section?.name || '',
    class_id: row.student?.class_id || null,
    section_id: row.student?.section_id || null,
    fee_head: row.note || 'Fee Payment',
    student: row.student ? {
      ...row.student,
      admission_number: row.student.school_code
    } : null
  }));
  
  // Apply class filter client-side
  if (classId) {
    mappedData = mappedData.filter(row => row.class_id === classId);
  }
  
  return mappedData;
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🚌 TRANSPORT DATA QUERIES
// ═══════════════════════════════════════════════════════════════════════════════

export const fetchTransportDataFromSupabase = async ({
  branchId, organizationId, sessionId,
  routeId, vehicleId, stopId
}) => {
  // Using correct table: student_transport_details
  let query = supabase
    .from('student_transport_details')
    .select(`
      *,
      student:student_profiles(id, school_code, first_name, last_name, class_id, class:classes(id, name)),
      route:transport_routes(id, name, description)
    `)
    .eq('branch_id', branchId)
    .eq('session_id', sessionId);

  if (routeId) query = query.eq('transport_route_id', routeId);

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) {
    console.log('[fetchTransportData] Error:', error.message);
    return [];
  }
  
  // Enrich with vehicle info if needed
  return (data || []).map(row => ({
    ...row,
    route_name: row.route?.name || '',
    vehicle_number: row.vehicle_number || '',
    driver_name: row.driver_name || '',
    driver_contact: row.driver_contact || '',
    pickup_time: row.pickup_time || '',
    drop_time: row.drop_time || '',
    transport_fee: row.transport_fee || 0,
    student: row.student ? {
      ...row.student,
      admission_number: row.student.school_code,
      class_name: row.student?.class?.name || ''
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
  // Using correct table: student_hostel_details
  let query = supabase
    .from('student_hostel_details')
    .select(`
      *,
      student:student_profiles(id, school_code, first_name, last_name, class_id, class:classes(id, name)),
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
    hostel_name: row.hostel?.name || '',
    room_number: row.room?.room_number || row.room_number || '',
    bed_number: row.bed_number || '',
    hostel_fee: row.hostel_fee || 0,
    check_in_date: row.check_in_date || '',
    check_out_date: row.check_out_date || '',
    student: row.student ? {
      ...row.student,
      admission_number: row.student.school_code,
      class_name: row.student?.class?.name || ''
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
  // Using correct table: book_issues
  let query = supabase
    .from('book_issues')
    .select(`
      *,
      member:library_members(id, member_name, member_type, member_code),
      book:books(id, book_title, author, isbn_number, book_number)
    `)
    .eq('branch_id', branchId);

  if (dateFrom) query = query.gte('issue_date', dateFrom);
  if (dateTo) query = query.lte('issue_date', dateTo);
  if (status === 'returned') query = query.eq('is_returned', true);
  if (status === 'issued') query = query.eq('is_returned', false);

  const { data, error } = await query.order('issue_date', { ascending: false });
  if (error) {
    console.log('[fetchLibraryData] Error:', error.message);
    return [];
  }
  
  return (data || []).map(row => ({
    ...row,
    book_title: row.book?.book_title || '',
    book_number: row.book?.book_number || '',
    author: row.book?.author || '',
    isbn: row.book?.isbn_number || '',
    member_name: row.member?.member_name || '',
    member_code: row.member?.member_code || '',
    member_type: row.member?.member_type || '',
    status: row.is_returned ? 'Returned' : 'Issued'
  }));
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
  // Using correct table: exam_marks (joins via exam_subjects -> exams)
  // First get exam_subjects for the branch/session
  let examSubjectsQuery = supabase
    .from('exam_subjects')
    .select(`
      id,
      exam_id,
      subject_id,
      max_marks,
      min_marks,
      date,
      exam:exams(id, name, exam_type, branch_id, session_id, class_id),
      subject:subjects(id, name)
    `);

  if (examId) examSubjectsQuery = examSubjectsQuery.eq('exam_id', examId);
  if (subjectId) examSubjectsQuery = examSubjectsQuery.eq('subject_id', subjectId);

  const { data: examSubjects, error: esError } = await examSubjectsQuery;
  if (esError) {
    console.log('[fetchExamData] ExamSubjects Error:', esError.message);
    return [];
  }

  // Filter by branch/session/class
  const filteredES = (examSubjects || []).filter(es => {
    const exam = es.exam;
    if (!exam) return false;
    if (exam.branch_id !== branchId) return false;
    if (exam.session_id !== sessionId) return false;
    if (classId && exam.class_id !== classId) return false;
    return true;
  });

  if (filteredES.length === 0) return [];

  const esIds = filteredES.map(es => es.id);

  // Get marks for these exam_subjects
  const { data: marks, error: mError } = await supabase
    .from('exam_marks')
    .select(`
      *,
      student:student_profiles(id, school_code, first_name, last_name, class:classes(id, name))
    `)
    .in('exam_subject_id', esIds);

  if (mError) {
    console.log('[fetchExamData] Marks Error:', mError.message);
    return [];
  }

  // Build lookup for exam_subjects
  const esMap = Object.fromEntries(filteredES.map(es => [es.id, es]));

  return (marks || []).map(row => {
    const es = esMap[row.exam_subject_id] || {};
    return {
      ...row,
      exam_name: es.exam?.name || '',
      exam_type: es.exam?.exam_type || '',
      subject_name: es.subject?.name || '',
      max_marks: es.max_marks || 0,
      min_marks: es.min_marks || 0,
      obtained_marks: row.marks || 0,
      is_absent: row.is_absent || false,
      percentage: es.max_marks ? ((row.marks || 0) / es.max_marks * 100).toFixed(2) : 0,
      student: row.student ? {
        ...row.student,
        admission_number: row.student.school_code,
        class_name: row.student?.class?.name || ''
      } : null
    };
  });
};

// ═══════════════════════════════════════════════════════════════════════════════
// 💰 FINANCE DATA QUERIES
// ═══════════════════════════════════════════════════════════════════════════════

export const fetchFinanceDataFromSupabase = async ({
  branchId, organizationId, sessionId,
  dateFrom, dateTo, paymentMode, classId, sectionId
}) => {
  // Use fee_payments table for finance/collection reports
  // Get class/section and additional student info through student_profiles (nested join)
  let query = supabase
    .from('fee_payments')
    .select(`
      *,
      student:student_profiles(
        id, 
        school_code, 
        first_name, 
        last_name, 
        class_id, 
        section_id,
        roll_number,
        father_name,
        father_phone,
        mother_phone,
        class:classes(id, name),
        section:sections(id, name)
      )
    `)
    .eq('branch_id', branchId)
    .eq('session_id', sessionId);

  if (dateFrom) query = query.gte('payment_date', dateFrom);
  if (dateTo) query = query.lte('payment_date', dateTo);
  if (paymentMode) query = query.eq('payment_mode', paymentMode);
  
  // Filter by class/section through student relationship if needed
  // Note: Direct filtering requires student_id join, so we filter in post-processing
  
  const { data, error } = await query.order('payment_date', { ascending: false });
  if (error) {
    console.log('[fetchFinanceData] Error:', error.message);
    return [];
  }
  
  console.log('[fetchFinanceData] Raw data count:', data?.length || 0);
  if (data?.length > 0) {
    console.log('[fetchFinanceData] Sample row:', data[0]);
    console.log('[fetchFinanceData] Keys:', Object.keys(data[0]));
  }
  
  // Map student data and apply client-side class/section filters
  // Map payment mode to specific amount fields for reports
  let mappedData = (data || []).map(row => {
    const paymentModeValue = (row.payment_mode || '').toLowerCase();
    const paymentAmount = Number(row.amount) || 0;
    
    return {
      ...row,
      // Receipt info
      receipt_no: row.receipt_number || row.id?.substring(0, 8),
      date: row.payment_date,
      
      // Student info
      student_name: row.student ? `${row.student.first_name || ''} ${row.student.last_name || ''}`.trim() : '',
      admission_number: row.student?.school_code || '',
      admission_no: row.student?.school_code || '',
      class_name: row.student?.class?.name || '',
      section_name: row.student?.section?.name || '',
      class_id: row.student?.class_id || null,
      section_id: row.student?.section_id || null,
      roll_no: row.student?.roll_number || '',
      roll_number: row.student?.roll_number || '',
      father_name: row.student?.father_name || '',
      father_phone: row.student?.father_phone || '',
      mother_phone: row.student?.mother_phone || '',
      
      // Fee/Payment info
      fee_head: row.note || 'Fee Payment',
      cashier_name: row.received_by || 'Admin',
      
      // Payment mode-specific amounts for reports
      cash_amount: paymentModeValue === 'cash' ? paymentAmount : 0,
      online_amount: (paymentModeValue === 'online' || paymentModeValue === 'upi' || paymentModeValue === 'neft') ? paymentAmount : 0,
      cheque_amount: paymentModeValue === 'cheque' ? paymentAmount : 0,
      card_amount: paymentModeValue === 'card' ? paymentAmount : 0,
      upi_amount: paymentModeValue === 'upi' ? paymentAmount : 0,
      
      // Total amounts for aggregation
      total_collection: paymentAmount,
      total_fee: paymentAmount,
      paid_amount: paymentAmount,
      balance: 0, // Would need fee_masters to calculate actual balance
      advance_amount: 0,
      
      // Payment count (1 per row for aggregation)
      payment_count: 1,
      receipt_count: 1,
      student_count: 1,
      
      // Collection stats (for single row, percentage will be aggregated)
      collection_percentage: 100,
      
      // Timestamps
      last_payment_date: row.payment_date,
      
      // Original student object
      student: row.student ? {
        ...row.student,
        admission_number: row.student.school_code
      } : null
    };
  });
  
  // Apply class/section filters client-side
  if (classId) {
    mappedData = mappedData.filter(row => row.class_id === classId);
  }
  if (sectionId) {
    mappedData = mappedData.filter(row => row.section_id === sectionId);
  }
  
  console.log('[fetchFinanceData] Mapped data count:', mappedData?.length || 0);
  if (mappedData?.length > 0) {
    console.log('[fetchFinanceData] Mapped sample:', {
      date: mappedData[0].date,
      payment_mode: mappedData[0].payment_mode,
      amount: mappedData[0].amount,
      cash_amount: mappedData[0].cash_amount,
      total_fee: mappedData[0].total_fee,
      student_name: mappedData[0].student_name,
      cashier_name: mappedData[0].cashier_name
    });
  }
  
  return mappedData;
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📋 FEE STRUCTURE DATA QUERIES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Fetch Tuition Fee Structure (Class-wise)
 * Returns fee_masters grouped by class with fee_groups and fee_types
 */
export const fetchTuitionFeeStructure = async ({
  branchId, organizationId, sessionId
}) => {
  // Get fee masters with groups and types
  const { data: feeMasters, error } = await supabase
    .from('fee_masters')
    .select(`
      *,
      fee_groups(id, name, description),
      fee_types(id, name, code)
    `)
    .eq('branch_id', branchId)
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false });

  if (error) {
    console.log('[fetchTuitionFeeStructure] Error:', error.message);
    return [];
  }

  // Get class assignments for fee groups
  const feeGroupIds = [...new Set((feeMasters || []).map(fm => fm.fee_group_id).filter(Boolean))];
  
  const { data: assignments } = await supabase
    .from('fee_group_class_assignments')
    .select(`
      fee_group_id,
      class_id,
      section_id,
      classes(id, name)
    `)
    .eq('branch_id', branchId)
    .eq('session_id', sessionId)
    .in('fee_group_id', feeGroupIds);

  // Get student counts per class
  const { data: studentCounts } = await supabase
    .from('student_profiles')
    .select('class_id')
    .eq('branch_id', branchId)
    .eq('session_id', sessionId)
    .eq('status', 'active');

  // Build class count map
  const classCountMap = {};
  (studentCounts || []).forEach(s => {
    if (s.class_id) {
      classCountMap[s.class_id] = (classCountMap[s.class_id] || 0) + 1;
    }
  });

  // Build assignment map grouped by fee_group_id
  const assignmentMap = {};
  (assignments || []).forEach(a => {
    if (!assignmentMap[a.fee_group_id]) {
      assignmentMap[a.fee_group_id] = [];
    }
    assignmentMap[a.fee_group_id].push({
      class_id: a.class_id,
      class_name: a.classes?.name || '',
      section_id: a.section_id
    });
  });

  // Map fee masters to include class info
  const result = [];
  (feeMasters || []).forEach(fm => {
    const classAssignments = assignmentMap[fm.fee_group_id] || [];
    
    if (classAssignments.length === 0) {
      // No class assignment - show as "All Classes"
      result.push({
        id: fm.id,
        class_name: 'All Classes',
        fee_group_name: fm.fee_groups?.name || '',
        fee_type_name: fm.fee_types?.name || '',
        fee_type_code: fm.fee_types?.code || '',
        amount: fm.amount || 0,
        due_date: fm.due_date,
        fine_type: fm.fine_type || 'none',
        fine_value: fm.fine_value,
        is_fine_per_day: fm.is_fine_per_day || false,
        students_assigned: 0,
        total_expected_amount: 0
      });
    } else {
      // Create row for each class assignment
      classAssignments.forEach(ca => {
        const studentCount = classCountMap[ca.class_id] || 0;
        result.push({
          id: `${fm.id}_${ca.class_id}`,
          class_name: ca.class_name,
          fee_group_name: fm.fee_groups?.name || '',
          fee_type_name: fm.fee_types?.name || '',
          fee_type_code: fm.fee_types?.code || '',
          amount: fm.amount || 0,
          due_date: fm.due_date,
          fine_type: fm.fine_type || 'none',
          fine_value: fm.fine_value,
          is_fine_per_day: fm.is_fine_per_day || false,
          students_assigned: studentCount,
          total_expected_amount: (fm.amount || 0) * studentCount
        });
      });
    }
  });

  console.log('[fetchTuitionFeeStructure] Result count:', result.length);
  return result;
};

/**
 * Fetch Exam Fee Structure
 * Returns exam fees by class and exam type from fee_masters where fee_type is exam-related
 */
export const fetchExamFeeStructure = async ({
  branchId, organizationId, sessionId
}) => {
  // Get fee types that are exam-related
  const { data: examFeeTypes } = await supabase
    .from('fee_types')
    .select('id, name, code')
    .eq('branch_id', branchId)
    .or('name.ilike.%exam%,code.ilike.%exam%');

  if (!examFeeTypes || examFeeTypes.length === 0) {
    console.log('[fetchExamFeeStructure] No exam fee types found');
    return [];
  }

  const examTypeIds = examFeeTypes.map(ft => ft.id);

  // Get fee masters for exam types
  const { data: examFees, error } = await supabase
    .from('fee_masters')
    .select(`
      *,
      fee_groups(id, name),
      fee_types(id, name, code)
    `)
    .eq('branch_id', branchId)
    .eq('session_id', sessionId)
    .in('fee_type_id', examTypeIds);

  if (error) {
    console.log('[fetchExamFeeStructure] Error:', error.message);
    return [];
  }

  // Get class assignments
  const feeGroupIds = [...new Set((examFees || []).map(fm => fm.fee_group_id).filter(Boolean))];
  
  const { data: assignments } = await supabase
    .from('fee_group_class_assignments')
    .select(`
      fee_group_id,
      class_id,
      classes(id, name)
    `)
    .eq('branch_id', branchId)
    .eq('session_id', sessionId)
    .in('fee_group_id', feeGroupIds);

  const assignmentMap = {};
  (assignments || []).forEach(a => {
    if (!assignmentMap[a.fee_group_id]) {
      assignmentMap[a.fee_group_id] = [];
    }
    assignmentMap[a.fee_group_id].push({
      class_name: a.classes?.name || 'All Classes'
    });
  });

  // Map results
  const result = [];
  (examFees || []).forEach(ef => {
    const classes = assignmentMap[ef.fee_group_id] || [{ class_name: 'All Classes' }];
    
    classes.forEach(c => {
      result.push({
        id: ef.id,
        class_name: c.class_name,
        exam_name: ef.fee_types?.name || 'Exam Fee',
        exam_type: ef.fee_groups?.name || 'General',
        exam_fee: ef.amount || 0,
        practical_fee: 0,
        registration_fee: 0,
        total_exam_fee: ef.amount || 0,
        exam_due_date: ef.due_date,
        applicable_classes: c.class_name
      });
    });
  });

  console.log('[fetchExamFeeStructure] Result count:', result.length);
  return result;
};

/**
 * Fetch Hostel Fee Structure
 * Returns hostel room-wise fee structure
 */
export const fetchHostelFeeStructure = async ({
  branchId, organizationId, sessionId
}) => {
  // Get hostels
  const { data: hostels, error: hostelError } = await supabase
    .from('hostels')
    .select('id, name, type')
    .eq('branch_id', branchId);

  if (hostelError) {
    console.log('[fetchHostelFeeStructure] Hostel Error:', hostelError.message);
    return [];
  }

  // Get room types
  const { data: roomTypes } = await supabase
    .from('hostel_room_types')
    .select('id, name, cost, billing_cycle')
    .eq('branch_id', branchId);

  // Get rooms with occupancy count
  const { data: rooms } = await supabase
    .from('hostel_rooms')
    .select(`
      id, 
      hostel_id, 
      room_number_name, 
      room_type_id, 
      num_of_beds,
      cost_per_bed
    `)
    .eq('branch_id', branchId);

  // Get student counts per room
  const { data: studentDetails } = await supabase
    .from('student_hostel_details')
    .select('room_id')
    .eq('branch_id', branchId);

  const roomOccupancyMap = {};
  (studentDetails || []).forEach(sd => {
    if (sd.room_id) {
      roomOccupancyMap[sd.room_id] = (roomOccupancyMap[sd.room_id] || 0) + 1;
    }
  });

  // Build hostel and room type maps
  const hostelMap = Object.fromEntries((hostels || []).map(h => [h.id, h]));
  const roomTypeMap = Object.fromEntries((roomTypes || []).map(rt => [rt.id, rt]));

  // Map rooms to fee structure
  const result = (rooms || []).map(room => {
    const hostel = hostelMap[room.hostel_id] || {};
    const roomType = roomTypeMap[room.room_type_id] || {};
    const occupied = roomOccupancyMap[room.id] || 0;

    return {
      id: room.id,
      hostel_name: hostel.name || 'Unknown Hostel',
      room_type: roomType.name || 'Standard',
      room_number: room.room_number_name || '',
      capacity: room.num_of_beds || 1,
      occupied: occupied,
      hostel_monthly_fee: roomType.cost || room.cost_per_bed || 0,
      hostel_quarterly_fee: (roomType.cost || 0) * 3,
      hostel_half_yearly_fee: (roomType.cost || 0) * 6,
      hostel_yearly_fee: (roomType.cost || 0) * 12,
      mess_fee: 0,
      total_hostel_fee: roomType.cost || room.cost_per_bed || 0,
      hostel_students: occupied,
      billing_cycle: roomType.billing_cycle || 'monthly'
    };
  });

  console.log('[fetchHostelFeeStructure] Result count:', result.length);
  return result;
};

/**
 * Fetch Transport Fee Structure
 * Returns route and pickup point-wise transport fee structure
 * Uses route_pickup_point_mappings junction table for route-pickup relationships
 */
export const fetchTransportFeeStructure = async ({
  branchId, organizationId, sessionId
}) => {
  // Get transport routes (fare removed - now configured in Fee Structures)
  const { data: routes, error: routeError } = await supabase
    .from('transport_routes')
    .select('id, route_title')
    .eq('branch_id', branchId);

  if (routeError) {
    console.log('[fetchTransportFeeStructure] Route Error:', routeError.message);
    return [];
  }

  // Get route-pickup mappings with pickup point details via junction table
  const { data: mappings, error: mappingError } = await supabase
    .from('route_pickup_point_mappings')
    .select(`
      id,
      route_id,
      pickup_point_id,
      distance,
      monthly_fees,
      stop_order,
      transport_pickup_points(id, name)
    `)
    .eq('branch_id', branchId);

  if (mappingError) {
    console.log('[fetchTransportFeeStructure] Mapping Error:', mappingError.message);
  }

  // Build a map of route_id -> pickup points
  const routePickupMap = {};
  (mappings || []).forEach(mapping => {
    if (!routePickupMap[mapping.route_id]) {
      routePickupMap[mapping.route_id] = [];
    }
    routePickupMap[mapping.route_id].push({
      id: mapping.pickup_point_id,
      mapping_id: mapping.id,
      name: mapping.transport_pickup_points?.name || '',
      distance: mapping.distance || '0',
      monthly_fees: mapping.monthly_fees || 0,
      stop_order: mapping.stop_order || 0
    });
  });

  // Get student counts per route/pickup
  const { data: studentDetails } = await supabase
    .from('student_transport_details')
    .select('transport_route_id, pickup_point_id')
    .eq('branch_id', branchId)
    .eq('session_id', sessionId);

  // Build student count maps
  const routeStudentMap = {};
  const pickupStudentMap = {};
  (studentDetails || []).forEach(sd => {
    if (sd.transport_route_id) {
      routeStudentMap[sd.transport_route_id] = (routeStudentMap[sd.transport_route_id] || 0) + 1;
    }
    if (sd.pickup_point_id) {
      pickupStudentMap[sd.pickup_point_id] = (pickupStudentMap[sd.pickup_point_id] || 0) + 1;
    }
  });

  // Map routes and pickup points to fee structure
  const result = [];
  (routes || []).forEach(route => {
    const pickupPoints = routePickupMap[route.id] || [];
    
    if (pickupPoints.length === 0) {
      // Route with no pickup points - no fare info available (fees now in Fee Structures)
      result.push({
        id: route.id,
        route_name: route.route_title || '',
        pickup_point: 'All Points',
        distance_km: 0,
        monthly_fee: 0,
        quarterly_fee: 0,
        half_yearly_fee: 0,
        annual_fee: 0,
        transport_students: routeStudentMap[route.id] || 0
      });
    } else {
      // Create row for each pickup point (sorted by stop_order)
      pickupPoints.sort((a, b) => a.stop_order - b.stop_order).forEach(pp => {
        const monthlyFee = parseFloat(pp.monthly_fees) || 0;
        result.push({
          id: `${route.id}_${pp.id}`,
          route_name: route.route_title || '',
          pickup_point: pp.name || '',
          distance_km: parseFloat(pp.distance) || 0,
          monthly_fee: monthlyFee,
          quarterly_fee: monthlyFee * 3,
          half_yearly_fee: monthlyFee * 6,
          annual_fee: monthlyFee * 12,
          transport_students: pickupStudentMap[pp.id] || 0
        });
      });
    }
  });

  console.log('[fetchTransportFeeStructure] Result count:', result.length);
  return result;
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
  // Using correct table: homeworks
  let query = supabase
    .from('homeworks')
    .select(`
      *,
      class:classes(id, name),
      section:sections(id, name),
      subject:subjects(id, name)
    `)
    .eq('branch_id', branchId);

  if (dateFrom) query = query.gte('homework_date', dateFrom);
  if (dateTo) query = query.lte('homework_date', dateTo);
  if (classId) query = query.eq('class_id', classId);
  if (subjectId) query = query.eq('subject_id', subjectId);

  const { data, error } = await query.order('homework_date', { ascending: false });
  if (error) {
    console.log('[fetchHomeworkData] Error:', error.message);
    return [];
  }
  
  return (data || []).map(row => ({
    ...row,
    class_name: row.class?.name || '',
    section_name: row.section?.name || '',
    subject_name: row.subject?.name || '',
    assigned_date: row.homework_date,
    due_date: row.submission_date,
    title: row.description?.substring(0, 50) || 'Homework'
  }));
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📝 HOMEWORK EVALUATION DATA QUERIES
// ═══════════════════════════════════════════════════════════════════════════════

export const fetchHomeworkEvaluationDataFromSupabase = async ({
  branchId, organizationId, sessionId,
  dateFrom, dateTo, classId, studentId
}) => {
  // Using correct table: homework_evaluations
  let query = supabase
    .from('homework_evaluations')
    .select(`
      *,
      student:student_profiles(id, school_code, first_name, last_name, class:classes(id, name)),
      homework:homeworks(id, description, subject_id, homework_date, submission_date, max_marks, subject:subjects(id, name))
    `)
    .eq('branch_id', branchId);

  if (dateFrom) query = query.gte('evaluation_date', dateFrom);
  if (dateTo) query = query.lte('evaluation_date', dateTo);
  if (studentId) query = query.eq('student_id', studentId);

  const { data, error } = await query.order('evaluation_date', { ascending: false });
  if (error) {
    console.log('[fetchHomeworkEvaluationData] Error:', error.message);
    return [];
  }
  
  return (data || []).map(row => ({
    ...row,
    homework_title: row.homework?.description?.substring(0, 50) || 'Homework',
    subject_name: row.homework?.subject?.name || '',
    homework_date: row.homework?.homework_date || '',
    submission_date: row.homework?.submission_date || '',
    max_marks: row.homework?.max_marks || 0,
    obtained_marks: row.marks || 0,
    evaluation_date: row.evaluation_date || '',
    status: row.status || 'Pending',
    student: row.student ? {
      ...row.student,
      admission_number: row.student.school_code,
      class_name: row.student?.class?.name || ''
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
  // Using correct table: student_quiz_attempts (online_exam_results doesn't exist)
  let query = supabase
    .from('student_quiz_attempts')
    .select(`
      *,
      student:student_profiles(id, school_code, first_name, last_name, class:classes(id, name)),
      quiz:online_exams(id, title, total_marks, passing_marks, time_limit)
    `)
    .eq('branch_id', branchId);

  if (examId) query = query.eq('quiz_id', examId);

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) {
    console.log('[fetchOnlineExamData] Error:', error.message);
    return [];
  }
  
  return (data || []).map(row => ({
    ...row,
    exam_title: row.quiz?.title || '',
    total_marks: row.quiz?.total_marks || row.total_questions || 0,
    passing_marks: row.quiz?.passing_marks || 0,
    time_limit: row.quiz?.time_limit || 0,
    total_questions: row.total_questions || 0,
    correct_answers: row.correct_answers || 0,
    wrong_answers: row.wrong_answers || 0,
    not_attempted: row.not_attempted || 0,
    obtained_marks: row.correct_answers || 0,
    percentage: row.total_questions ? ((row.correct_answers || 0) / row.total_questions * 100).toFixed(2) : 0,
    result: row.correct_answers >= (row.quiz?.passing_marks || 0) ? 'Pass' : 'Fail',
    student: row.student ? {
      ...row.student,
      admission_number: row.student.school_code,
      class_name: row.student?.class?.name || ''
    } : null
  }));
};
