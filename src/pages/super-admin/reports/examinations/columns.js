/**
 * Examination Report Generator - Column Definitions
 * Module 4: 45 Examination Reports across 4 categories
 * 
 * Categories:
 * 1. Marks & Results (15)
 * 2. Comparative Analysis (10)
 * 3. Exam Administration (12)
 * 4. Reports for Parents/Students (8)
 */

// ═══════════════════════════════════════════════════════════════════════════════
// COLUMN DEFINITIONS BY CATEGORY
// ═══════════════════════════════════════════════════════════════════════════════

// 📊 MARKS & RESULTS COLUMNS
export const MARKS_COLUMNS = [
  // Student Info
  { key: 'student_name', label: 'Student Name', type: 'string', width: 180, sortable: true },
  { key: 'admission_no', label: 'Admission No', type: 'string', width: 110 },
  { key: 'roll_no', label: 'Roll No', type: 'string', width: 80, sortable: true },
  { key: 'class_name', label: 'Class', type: 'string', width: 80, groupable: true },
  { key: 'section_name', label: 'Section', type: 'string', width: 80, groupable: true },
  { key: 'gender', label: 'Gender', type: 'badge', width: 80, groupable: true },
  { key: 'category', label: 'Category', type: 'badge', width: 100, groupable: true },
  { key: 'house', label: 'House', type: 'badge', width: 100, groupable: true },
  
  // Exam Info
  { key: 'exam_name', label: 'Exam Name', type: 'string', width: 150, groupable: true },
  { key: 'exam_type', label: 'Exam Type', type: 'badge', width: 120, groupable: true },
  { key: 'term', label: 'Term', type: 'badge', width: 80, groupable: true },
  { key: 'academic_year', label: 'Academic Year', type: 'string', width: 110 },
  
  // Subject Details
  { key: 'subject_name', label: 'Subject', type: 'string', width: 140, groupable: true },
  { key: 'subject_code', label: 'Subject Code', type: 'string', width: 100 },
  { key: 'subject_type', label: 'Subject Type', type: 'badge', width: 100, groupable: true },
  { key: 'teacher_name', label: 'Subject Teacher', type: 'string', width: 150, groupable: true },
  
  // Marks
  { key: 'max_marks', label: 'Max Marks', type: 'number', width: 100, aggregate: 'sum' },
  { key: 'obtained_marks', label: 'Obtained', type: 'number', width: 100, sortable: true, aggregate: 'sum' },
  { key: 'theory_marks', label: 'Theory', type: 'number', width: 90 },
  { key: 'practical_marks', label: 'Practical', type: 'number', width: 90 },
  { key: 'internal_marks', label: 'Internal', type: 'number', width: 90 },
  { key: 'external_marks', label: 'External', type: 'number', width: 90 },
  { key: 'weighted_marks', label: 'Weighted', type: 'number', width: 90 },
  
  // Percentage & Grade
  { key: 'percentage', label: 'Percentage', type: 'percentage', width: 100, sortable: true },
  { key: 'grade', label: 'Grade', type: 'badge', width: 80, groupable: true },
  { key: 'grade_point', label: 'GP', type: 'number', width: 60 },
  
  // Rank & Division
  { key: 'rank', label: 'Rank', type: 'number', width: 70, sortable: true },
  { key: 'class_rank', label: 'Class Rank', type: 'number', width: 90, sortable: true },
  { key: 'section_rank', label: 'Section Rank', type: 'number', width: 100, sortable: true },
  { key: 'subject_rank', label: 'Subject Rank', type: 'number', width: 100, sortable: true },
  { key: 'division', label: 'Division', type: 'badge', width: 90, groupable: true },
  
  // Pass/Fail Status
  { key: 'pass_status', label: 'Status', type: 'badge', width: 100, groupable: true },
  { key: 'pass_fail', label: 'Pass/Fail', type: 'badge', width: 90, groupable: true },
  { key: 'result', label: 'Result', type: 'badge', width: 100, groupable: true },
  { key: 'promoted', label: 'Promoted', type: 'boolean', width: 90 },
  { key: 'detained', label: 'Detained', type: 'boolean', width: 90 },
  
  // Totals
  { key: 'total_marks', label: 'Total Marks', type: 'number', width: 110, sortable: true },
  { key: 'grand_total', label: 'Grand Total', type: 'number', width: 110 },
  { key: 'out_of', label: 'Out Of', type: 'number', width: 90 },
  { key: 'cgpa', label: 'CGPA', type: 'number', width: 70, sortable: true },
  
  // Grace Marks
  { key: 'grace_marks', label: 'Grace Marks', type: 'number', width: 100 },
  { key: 'original_marks', label: 'Original Marks', type: 'number', width: 110 },
  { key: 'moderated_marks', label: 'Moderated Marks', type: 'number', width: 120 },
  { key: 'grace_reason', label: 'Grace Reason', type: 'string', width: 150 },
  
  // Failed/Compartment
  { key: 'failed_subjects', label: 'Failed Subjects', type: 'string', width: 200 },
  { key: 'failed_count', label: 'Failed Count', type: 'number', width: 100 },
  { key: 'compartment_subject', label: 'Compartment Subject', type: 'string', width: 160 },
  { key: 'reappear_subject', label: 'Reappear Subject', type: 'string', width: 150 },
  { key: 'marks_required', label: 'Marks Required', type: 'number', width: 120 },
  
  // Stats
  { key: 'student_count', label: 'Students', type: 'number', width: 90, aggregate: 'sum' },
  { key: 'pass_count', label: 'Pass Count', type: 'number', width: 100, aggregate: 'sum' },
  { key: 'fail_count', label: 'Fail Count', type: 'number', width: 90, aggregate: 'sum' },
  { key: 'pass_percentage', label: 'Pass %', type: 'percentage', width: 90 },
  { key: 'avg_marks', label: 'Avg Marks', type: 'number', width: 100 },
  { key: 'min_marks', label: 'Min Marks', type: 'number', width: 90 },
  { key: 'highest_marks', label: 'Highest', type: 'number', width: 90 },
  { key: 'lowest_marks', label: 'Lowest', type: 'number', width: 90 },
  { key: 'std_deviation', label: 'Std Dev', type: 'number', width: 80 },
];

// 📈 COMPARATIVE ANALYSIS COLUMNS
export const COMPARATIVE_COLUMNS = [
  // Student/Class Info
  { key: 'student_name', label: 'Student Name', type: 'string', width: 180, sortable: true },
  { key: 'admission_no', label: 'Admission No', type: 'string', width: 110 },
  { key: 'class_name', label: 'Class', type: 'string', width: 80, groupable: true },
  { key: 'section_name', label: 'Section', type: 'string', width: 80, groupable: true },
  
  // Term-wise Comparison
  { key: 'term_1_marks', label: 'Term 1', type: 'number', width: 90 },
  { key: 'term_1_percentage', label: 'Term 1 %', type: 'percentage', width: 90 },
  { key: 'term_2_marks', label: 'Term 2', type: 'number', width: 90 },
  { key: 'term_2_percentage', label: 'Term 2 %', type: 'percentage', width: 90 },
  { key: 'term_3_marks', label: 'Term 3', type: 'number', width: 90 },
  { key: 'term_3_percentage', label: 'Term 3 %', type: 'percentage', width: 90 },
  { key: 'average_marks', label: 'Average', type: 'number', width: 90 },
  { key: 'average_percentage', label: 'Avg %', type: 'percentage', width: 90 },
  
  // Year-on-Year
  { key: 'last_year_marks', label: 'Last Year', type: 'number', width: 100 },
  { key: 'last_year_percentage', label: 'Last Year %', type: 'percentage', width: 100 },
  { key: 'this_year_marks', label: 'This Year', type: 'number', width: 100 },
  { key: 'this_year_percentage', label: 'This Year %', type: 'percentage', width: 100 },
  
  // Change/Improvement
  { key: 'change', label: 'Change', type: 'number', width: 80 },
  { key: 'change_percentage', label: 'Change %', type: 'percentage', width: 100 },
  { key: 'improvement', label: 'Improvement', type: 'number', width: 100 },
  { key: 'improvement_status', label: 'Trend', type: 'badge', width: 100, groupable: true },
  
  // Subject Improvement
  { key: 'subject_name', label: 'Subject', type: 'string', width: 140, groupable: true },
  { key: 'previous_marks', label: 'Previous Marks', type: 'number', width: 120 },
  { key: 'current_marks', label: 'Current Marks', type: 'number', width: 110 },
  
  // Consistency
  { key: 'exam_count', label: 'Exams Taken', type: 'number', width: 100 },
  { key: 'consistency_score', label: 'Consistency', type: 'percentage', width: 100 },
  { key: 'is_consistent', label: 'Consistent?', type: 'boolean', width: 100 },
  { key: 'variance', label: 'Variance', type: 'number', width: 90 },
  
  // Teacher Performance
  { key: 'teacher_name', label: 'Teacher', type: 'string', width: 150, groupable: true },
  { key: 'subjects_taught', label: 'Subjects', type: 'number', width: 90 },
  { key: 'classes_taught', label: 'Classes', type: 'number', width: 90 },
  { key: 'avg_result', label: 'Avg Result', type: 'percentage', width: 100 },
  
  // Trend
  { key: 'trend', label: 'Trend', type: 'badge', width: 100, groupable: true },
  { key: 'exam_1_percentage', label: 'Exam 1', type: 'percentage', width: 90 },
  { key: 'exam_2_percentage', label: 'Exam 2', type: 'percentage', width: 90 },
  { key: 'exam_3_percentage', label: 'Exam 3', type: 'percentage', width: 90 },
  
  // Category-wise
  { key: 'gender', label: 'Gender', type: 'badge', width: 80, groupable: true },
  { key: 'rte_status', label: 'RTE Status', type: 'badge', width: 100, groupable: true },
  { key: 'category', label: 'Category', type: 'badge', width: 100, groupable: true },
  { key: 'house_name', label: 'House', type: 'badge', width: 100, groupable: true },
  { key: 'toppers_count', label: 'Toppers', type: 'number', width: 80, aggregate: 'sum' },
  { key: 'best_performer', label: 'Best Performer', type: 'string', width: 150 },
];

// 📋 EXAM ADMINISTRATION COLUMNS
export const ADMIN_COLUMNS = [
  // Schedule
  { key: 'date', label: 'Date', type: 'date', width: 100, sortable: true },
  { key: 'day', label: 'Day', type: 'string', width: 100 },
  { key: 'exam_name', label: 'Exam Name', type: 'string', width: 150, groupable: true },
  { key: 'subject_name', label: 'Subject', type: 'string', width: 140, groupable: true },
  { key: 'start_time', label: 'Start Time', type: 'time', width: 100 },
  { key: 'end_time', label: 'End Time', type: 'time', width: 100 },
  { key: 'duration', label: 'Duration', type: 'string', width: 90 },
  
  // Room/Seat
  { key: 'room_no', label: 'Room No', type: 'string', width: 90, groupable: true },
  { key: 'room_name', label: 'Room Name', type: 'string', width: 120, groupable: true },
  { key: 'seat_no', label: 'Seat No', type: 'string', width: 80 },
  { key: 'seat_capacity', label: 'Capacity', type: 'number', width: 90 },
  { key: 'seats_occupied', label: 'Occupied', type: 'number', width: 90 },
  
  // Student Info for seating
  { key: 'student_name', label: 'Student Name', type: 'string', width: 180, sortable: true },
  { key: 'admission_no', label: 'Admission No', type: 'string', width: 110 },
  { key: 'roll_no', label: 'Roll No', type: 'string', width: 80 },
  { key: 'class_name', label: 'Class', type: 'string', width: 80, groupable: true },
  { key: 'section_name', label: 'Section', type: 'string', width: 80, groupable: true },
  
  // Hall Ticket
  { key: 'hall_ticket_no', label: 'Hall Ticket No', type: 'string', width: 130 },
  { key: 'generated', label: 'Generated', type: 'boolean', width: 90 },
  { key: 'downloaded', label: 'Downloaded', type: 'boolean', width: 100 },
  { key: 'printed', label: 'Printed', type: 'boolean', width: 90 },
  { key: 'generation_date', label: 'Generated On', type: 'date', width: 110 },
  
  // Invigilator
  { key: 'invigilator_name', label: 'Invigilator', type: 'string', width: 150, groupable: true },
  { key: 'invigilator_duty', label: 'Duty', type: 'string', width: 100 },
  { key: 'duty_date', label: 'Duty Date', type: 'date', width: 100 },
  { key: 'duty_time', label: 'Duty Time', type: 'string', width: 100 },
  
  // Answer Sheets
  { key: 'sheets_issued', label: 'Sheets Issued', type: 'number', width: 110, aggregate: 'sum' },
  { key: 'sheets_used', label: 'Sheets Used', type: 'number', width: 100, aggregate: 'sum' },
  { key: 'sheets_spoiled', label: 'Spoiled', type: 'number', width: 90, aggregate: 'sum' },
  { key: 'sheets_returned', label: 'Returned', type: 'number', width: 100, aggregate: 'sum' },
  
  // Marks Entry Status
  { key: 'marks_entered', label: 'Entered', type: 'boolean', width: 90 },
  { key: 'marks_pending', label: 'Pending', type: 'boolean', width: 90 },
  { key: 'marks_verified', label: 'Verified', type: 'boolean', width: 90 },
  { key: 'entered_by', label: 'Entered By', type: 'string', width: 130 },
  { key: 'verified_by', label: 'Verified By', type: 'string', width: 130 },
  { key: 'entry_deadline', label: 'Deadline', type: 'date', width: 100 },
  { key: 'entered_on', label: 'Entered On', type: 'date', width: 100 },
  { key: 'delay_days', label: 'Delay Days', type: 'number', width: 100 },
  { key: 'entry_status', label: 'Entry Status', type: 'badge', width: 110, groupable: true },
  
  // Absent/UFM
  { key: 'absent_reason', label: 'Absent Reason', type: 'string', width: 150, groupable: true },
  { key: 'absent_action', label: 'Action', type: 'badge', width: 100 },
  { key: 'ufm_incident', label: 'UFM Incident', type: 'string', width: 150 },
  { key: 'ufm_action', label: 'UFM Action', type: 'badge', width: 120, groupable: true },
  
  // Re-evaluation
  { key: 'reeval_status', label: 'Re-eval Status', type: 'badge', width: 120, groupable: true },
  { key: 'original_marks_reeval', label: 'Original', type: 'number', width: 90 },
  { key: 'reviewed_marks', label: 'Reviewed', type: 'number', width: 90 },
  { key: 'marks_change', label: 'Change', type: 'number', width: 80 },
  
  // Practical
  { key: 'practical_date', label: 'Practical Date', type: 'date', width: 110 },
  { key: 'batch', label: 'Batch', type: 'string', width: 80, groupable: true },
  { key: 'examiner_name', label: 'Examiner', type: 'string', width: 140, groupable: true },
  { key: 'external_examiner', label: 'External Examiner', type: 'string', width: 150 },
];

// 👨‍👩‍👧 PARENT/STUDENT REPORT COLUMNS
export const PARENT_COLUMNS = [
  // Student Info
  { key: 'student_name', label: 'Student Name', type: 'string', width: 180, sortable: true },
  { key: 'admission_no', label: 'Admission No', type: 'string', width: 110 },
  { key: 'roll_no', label: 'Roll No', type: 'string', width: 80, sortable: true },
  { key: 'class_name', label: 'Class', type: 'string', width: 80, groupable: true },
  { key: 'section_name', label: 'Section', type: 'string', width: 80, groupable: true },
  { key: 'father_name', label: 'Father Name', type: 'string', width: 150 },
  { key: 'mother_name', label: 'Mother Name', type: 'string', width: 150 },
  { key: 'contact_no', label: 'Contact', type: 'phone', width: 120 },
  
  // Progress/Cumulative
  { key: 'exam_name', label: 'Exam', type: 'string', width: 140, groupable: true },
  { key: 'subject_name', label: 'Subject', type: 'string', width: 140, groupable: true },
  { key: 'grade', label: 'Grade', type: 'badge', width: 80 },
  { key: 'marks_obtained', label: 'Marks', type: 'number', width: 90 },
  { key: 'max_marks', label: 'Max', type: 'number', width: 70 },
  { key: 'percentage', label: 'Percentage', type: 'percentage', width: 100 },
  { key: 'overall_grade', label: 'Overall Grade', type: 'badge', width: 110 },
  { key: 'cgpa', label: 'CGPA', type: 'number', width: 70 },
  
  // Rank
  { key: 'rank', label: 'Rank', type: 'number', width: 70, sortable: true },
  { key: 'total_students', label: 'Out of Students', type: 'number', width: 120 },
  { key: 'rank_suffix', label: 'Position', type: 'string', width: 90 },
  
  // Subject Progress
  { key: 'exam_1', label: 'Exam 1', type: 'number', width: 80 },
  { key: 'exam_2', label: 'Exam 2', type: 'number', width: 80 },
  { key: 'exam_3', label: 'Exam 3', type: 'number', width: 80 },
  { key: 'exam_4', label: 'Exam 4', type: 'number', width: 80 },
  { key: 'exam_5', label: 'Exam 5', type: 'number', width: 80 },
  { key: 'trend_graph', label: 'Trend', type: 'trend', width: 120 },
  
  // Co-curricular
  { key: 'activity_name', label: 'Activity', type: 'string', width: 150, groupable: true },
  { key: 'activity_grade', label: 'Activity Grade', type: 'badge', width: 110 },
  { key: 'activity_remarks', label: 'Activity Remarks', type: 'string', width: 200 },
  
  // Behavior/Discipline
  { key: 'parameter', label: 'Parameter', type: 'string', width: 150, groupable: true },
  { key: 'behavior_grade', label: 'Behavior Grade', type: 'badge', width: 120 },
  { key: 'discipline_grade', label: 'Discipline Grade', type: 'badge', width: 120 },
  { key: 'conduct', label: 'Conduct', type: 'badge', width: 90 },
  
  // Teacher Remarks
  { key: 'teacher_name', label: 'Teacher', type: 'string', width: 140 },
  { key: 'teacher_remarks', label: 'Teacher Remarks', type: 'string', width: 250 },
  { key: 'class_teacher_remarks', label: 'Class Teacher Remarks', type: 'string', width: 250 },
  { key: 'principal_remarks', label: 'Principal Remarks', type: 'string', width: 250 },
  
  // Parent Meeting
  { key: 'meeting_date', label: 'Meeting Date', type: 'date', width: 110 },
  { key: 'discussed_points', label: 'Discussed Points', type: 'string', width: 250 },
  { key: 'action_items', label: 'Action Items', type: 'string', width: 250 },
  { key: 'next_meeting_date', label: 'Next Meeting', type: 'date', width: 110 },
  
  // Attendance
  { key: 'attendance_percentage', label: 'Attendance %', type: 'percentage', width: 110 },
  { key: 'working_days', label: 'Working Days', type: 'number', width: 110 },
  { key: 'present_days', label: 'Present Days', type: 'number', width: 100 },
  { key: 'absent_days', label: 'Absent Days', type: 'number', width: 100 },
];

// ═══════════════════════════════════════════════════════════════════════════════
// CONSOLIDATED COLUMNS FOR EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

export const EXAMINATION_COLUMNS = [
  ...MARKS_COLUMNS,
  ...COMPARATIVE_COLUMNS.filter(c => !MARKS_COLUMNS.find(m => m.key === c.key)),
  ...ADMIN_COLUMNS.filter(c => !MARKS_COLUMNS.find(m => m.key === c.key) && !COMPARATIVE_COLUMNS.find(m => m.key === c.key)),
  ...PARENT_COLUMNS.filter(c => 
    !MARKS_COLUMNS.find(m => m.key === c.key) && 
    !COMPARATIVE_COLUMNS.find(m => m.key === c.key) && 
    !ADMIN_COLUMNS.find(m => m.key === c.key)
  )
];

// ═══════════════════════════════════════════════════════════════════════════════
// COLUMN SETS FOR SPECIFIC TEMPLATES
// ═══════════════════════════════════════════════════════════════════════════════

export const COLUMN_SETS = {
  // Marks & Results (15 templates)
  student_marksheet: ['student_name', 'roll_no', 'class_name', 'subject_name', 'max_marks', 'obtained_marks', 'percentage', 'grade', 'total_marks'],
  class_result_summary: ['subject_name', 'max_marks', 'highest_marks', 'lowest_marks', 'avg_marks', 'pass_count', 'fail_count', 'pass_percentage'],
  section_comparison: ['section_name', 'average_percentage', 'pass_percentage', 'toppers_count', 'student_count'],
  subject_analysis: ['subject_name', 'student_count', 'pass_count', 'fail_count', 'avg_marks', 'highest_marks', 'lowest_marks'],
  grade_distribution: ['grade', 'student_count', 'percentage'],
  division_wise: ['division', 'student_count', 'percentage'],
  marks_range: ['subject_name', 'student_count', 'percentage'],
  topper_list: ['rank', 'student_name', 'roll_no', 'class_name', 'section_name', 'total_marks', 'percentage'],
  subject_toppers: ['subject_name', 'rank', 'student_name', 'obtained_marks', 'max_marks'],
  failed_students: ['student_name', 'roll_no', 'class_name', 'failed_subjects', 'total_marks', 'percentage'],
  compartment_list: ['student_name', 'roll_no', 'class_name', 'compartment_subject', 'obtained_marks', 'marks_required'],
  promoted_students: ['student_name', 'roll_no', 'class_name', 'percentage', 'result', 'promoted'],
  detained_students: ['student_name', 'roll_no', 'class_name', 'percentage', 'failed_subjects', 'detained'],
  grace_marks: ['student_name', 'subject_name', 'original_marks', 'grace_marks', 'moderated_marks', 'grace_reason'],
  moderation_report: ['subject_name', 'avg_marks', 'original_marks', 'moderated_marks', 'change'],
  
  // Comparative Analysis (10 templates)
  term_comparison: ['student_name', 'roll_no', 'class_name', 'term_1_percentage', 'term_2_percentage', 'term_3_percentage', 'average_percentage'],
  year_on_year: ['class_name', 'last_year_percentage', 'this_year_percentage', 'change_percentage'],
  subject_improvement: ['student_name', 'subject_name', 'previous_marks', 'current_marks', 'change', 'improvement_status'],
  consistency_report: ['student_name', 'roll_no', 'exam_count', 'avg_marks', 'variance', 'is_consistent'],
  teacher_performance: ['teacher_name', 'subject_name', 'classes_taught', 'avg_result'],
  section_trend: ['section_name', 'exam_1_percentage', 'exam_2_percentage', 'exam_3_percentage', 'trend'],
  gender_performance: ['gender', 'average_percentage', 'toppers_count', 'pass_percentage'],
  category_performance: ['category', 'average_percentage', 'pass_percentage'],
  rte_performance: ['rte_status', 'average_percentage', 'pass_percentage'],
  house_performance: ['house_name', 'average_percentage', 'best_performer'],
  
  // Exam Administration (12 templates)
  exam_schedule: ['date', 'day', 'subject_name', 'start_time', 'end_time', 'room_no', 'invigilator_name'],
  seat_arrangement: ['room_no', 'seat_no', 'student_name', 'roll_no', 'class_name', 'section_name'],
  hall_ticket_status: ['student_name', 'roll_no', 'class_name', 'hall_ticket_no', 'generated', 'downloaded', 'printed'],
  invigilator_duty: ['invigilator_name', 'date', 'start_time', 'end_time', 'room_no'],
  answer_sheet_distribution: ['subject_name', 'sheets_issued', 'sheets_used', 'sheets_spoiled', 'sheets_returned'],
  marks_entry_status: ['class_name', 'subject_name', 'marks_entered', 'marks_pending', 'marks_verified'],
  entry_deadline: ['subject_name', 'teacher_name', 'entry_deadline', 'entered_on', 'delay_days'],
  verification_pending: ['class_name', 'subject_name', 'entered_by', 'entry_status'],
  absent_in_exam: ['student_name', 'subject_name', 'absent_reason', 'absent_action'],
  unfair_means: ['student_name', 'subject_name', 'ufm_incident', 'ufm_action'],
  reevaluation_requests: ['student_name', 'subject_name', 'original_marks_reeval', 'reviewed_marks', 'marks_change'],
  practical_exam_schedule: ['subject_name', 'practical_date', 'batch', 'examiner_name', 'external_examiner'],
  
  // Parent/Student Reports (8 templates)
  progress_report: ['student_name', 'subject_name', 'grade', 'marks_obtained', 'max_marks', 'percentage', 'teacher_remarks', 'attendance_percentage'],
  cumulative_report: ['student_name', 'exam_name', 'total_marks', 'percentage', 'overall_grade', 'cgpa'],
  rank_certificate: ['student_name', 'rank', 'percentage', 'total_students', 'rank_suffix'],
  subject_progress: ['subject_name', 'exam_1', 'exam_2', 'exam_3', 'exam_4', 'exam_5', 'trend_graph'],
  cocurricular_grades: ['activity_name', 'activity_grade', 'activity_remarks'],
  behavior_grades: ['parameter', 'behavior_grade', 'discipline_grade', 'conduct'],
  teacher_remarks_report: ['subject_name', 'teacher_name', 'teacher_remarks'],
  parent_meeting: ['meeting_date', 'discussed_points', 'action_items', 'next_meeting_date'],
};

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get columns for a specific template
 */
export const getColumnsForSet = (setName) => {
  const columnKeys = COLUMN_SETS[setName] || [];
  return columnKeys.map(key => {
    // Check all column arrays for the key
    const allColumns = [...MARKS_COLUMNS, ...COMPARATIVE_COLUMNS, ...ADMIN_COLUMNS, ...PARENT_COLUMNS];
    return allColumns.find(c => c.key === key);
  }).filter(Boolean);
};

/**
 * Get all available columns
 */
export const getAllColumns = () => {
  return EXAMINATION_COLUMNS;
};

/**
 * Get column by key
 */
export const getColumnByKey = (key) => {
  return EXAMINATION_COLUMNS.find(c => c.key === key);
};

/**
 * Get columns by category
 */
export const getColumnsByCategory = (category) => {
  switch (category) {
    case 'marks':
      return MARKS_COLUMNS;
    case 'comparative':
      return COMPARATIVE_COLUMNS;
    case 'admin':
      return ADMIN_COLUMNS;
    case 'parent':
      return PARENT_COLUMNS;
    default:
      return EXAMINATION_COLUMNS;
  }
};

export default {
  EXAMINATION_COLUMNS,
  MARKS_COLUMNS,
  COMPARATIVE_COLUMNS,
  ADMIN_COLUMNS,
  PARENT_COLUMNS,
  COLUMN_SETS,
  getColumnsForSet,
  getAllColumns,
  getColumnByKey,
  getColumnsByCategory
};
