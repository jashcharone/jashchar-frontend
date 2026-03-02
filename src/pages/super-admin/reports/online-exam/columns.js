/**
 * Online Exam Report Generator - Column Definitions
 * Module 12: 30 Online Exam Reports across 3 categories
 * 
 * Categories:
 * 1. Exam Setup (10)
 * 2. Attempt & Result (12)
 * 3. Technical & Analytics (8)
 */

// ═══════════════════════════════════════════════════════════════════════════════
// COLUMN DEFINITIONS BY CATEGORY
// ═══════════════════════════════════════════════════════════════════════════════

// 📝 EXAM SETUP COLUMNS
export const SETUP_COLUMNS = [
  // Exam Info
  { key: 'exam_id', label: 'Exam ID', type: 'string', width: 100 },
  { key: 'exam_name', label: 'Exam Name', type: 'string', width: 180, sortable: true },
  { key: 'exam_code', label: 'Exam Code', type: 'string', width: 100 },
  { key: 'subject_name', label: 'Subject', type: 'string', width: 140, groupable: true },
  { key: 'class_name', label: 'Class', type: 'string', width: 80, groupable: true },
  { key: 'section_name', label: 'Section', type: 'string', width: 80, groupable: true },
  { key: 'exam_type', label: 'Exam Type', type: 'badge', width: 110, groupable: true },
  { key: 'exam_category', label: 'Category', type: 'badge', width: 100, groupable: true },
  
  // Schedule
  { key: 'exam_date', label: 'Exam Date', type: 'date', width: 100, sortable: true },
  { key: 'start_time', label: 'Start Time', type: 'time', width: 100 },
  { key: 'end_time', label: 'End Time', type: 'time', width: 100 },
  { key: 'duration', label: 'Duration', type: 'string', width: 90 },
  { key: 'duration_minutes', label: 'Duration (min)', type: 'number', width: 110 },
  { key: 'exam_status', label: 'Status', type: 'badge', width: 100, groupable: true },
  
  // Question Bank
  { key: 'chapter_name', label: 'Chapter', type: 'string', width: 150, groupable: true },
  { key: 'topic_name', label: 'Topic', type: 'string', width: 150, groupable: true },
  { key: 'total_questions', label: 'Total Questions', type: 'number', width: 130, aggregate: 'sum' },
  { key: 'questions_used', label: 'Questions Used', type: 'number', width: 130, aggregate: 'sum' },
  { key: 'questions_available', label: 'Available', type: 'number', width: 100, aggregate: 'sum' },
  
  // Question Types
  { key: 'question_type', label: 'Question Type', type: 'badge', width: 130, groupable: true },
  { key: 'mcq_count', label: 'MCQ', type: 'number', width: 70, aggregate: 'sum' },
  { key: 'fill_blank_count', label: 'Fill in Blank', type: 'number', width: 100, aggregate: 'sum' },
  { key: 'match_count', label: 'Match', type: 'number', width: 70, aggregate: 'sum' },
  { key: 'true_false_count', label: 'True/False', type: 'number', width: 90, aggregate: 'sum' },
  { key: 'short_answer_count', label: 'Short Answer', type: 'number', width: 110, aggregate: 'sum' },
  { key: 'long_answer_count', label: 'Long Answer', type: 'number', width: 110, aggregate: 'sum' },
  
  // Difficulty
  { key: 'difficulty_level', label: 'Difficulty', type: 'badge', width: 100, groupable: true },
  { key: 'easy_count', label: 'Easy', type: 'number', width: 70, aggregate: 'sum' },
  { key: 'medium_count', label: 'Medium', type: 'number', width: 80, aggregate: 'sum' },
  { key: 'hard_count', label: 'Hard', type: 'number', width: 70, aggregate: 'sum' },
  { key: 'easy_percentage', label: 'Easy %', type: 'percentage', width: 80 },
  { key: 'medium_percentage', label: 'Medium %', type: 'percentage', width: 90 },
  { key: 'hard_percentage', label: 'Hard %', type: 'percentage', width: 80 },
  
  // Configuration
  { key: 'total_marks', label: 'Total Marks', type: 'number', width: 100, aggregate: 'sum' },
  { key: 'passing_marks', label: 'Passing Marks', type: 'number', width: 110 },
  { key: 'passing_percentage', label: 'Passing %', type: 'percentage', width: 100 },
  { key: 'negative_marking', label: 'Negative Marking', type: 'boolean', width: 130 },
  { key: 'negative_marks', label: 'Negative Marks', type: 'number', width: 120 },
  { key: 'shuffle_questions', label: 'Shuffle Q', type: 'boolean', width: 100 },
  { key: 'shuffle_options', label: 'Shuffle Opt', type: 'boolean', width: 100 },
  { key: 'show_result', label: 'Show Result', type: 'badge', width: 100 },
  { key: 'allow_review', label: 'Allow Review', type: 'boolean', width: 110 },
  { key: 'max_attempts', label: 'Max Attempts', type: 'number', width: 100 },
  
  // Template
  { key: 'template_name', label: 'Template Name', type: 'string', width: 150 },
  { key: 'template_id', label: 'Template ID', type: 'string', width: 100 },
  { key: 'times_used', label: 'Times Used', type: 'number', width: 100, aggregate: 'sum' },
  
  // Registration
  { key: 'registered_count', label: 'Registered', type: 'number', width: 100, aggregate: 'sum' },
  { key: 'total_students', label: 'Total Students', type: 'number', width: 120, aggregate: 'sum' },
  
  // Stats
  { key: 'exam_count', label: 'Exams', type: 'number', width: 80, aggregate: 'sum' },
  { key: 'active_count', label: 'Active', type: 'number', width: 80, aggregate: 'sum' },
  { key: 'upcoming_count', label: 'Upcoming', type: 'number', width: 90, aggregate: 'sum' },
  { key: 'completed_count', label: 'Completed', type: 'number', width: 100, aggregate: 'sum' },
  { key: 'avg_attendance', label: 'Avg Attendance', type: 'percentage', width: 120 },
];

// 📊 ATTEMPT & RESULT COLUMNS
export const RESULT_COLUMNS = [
  // Student Info
  { key: 'student_name', label: 'Student Name', type: 'string', width: 180, sortable: true },
  { key: 'admission_no', label: 'Admission No', type: 'string', width: 110 },
  { key: 'roll_no', label: 'Roll No', type: 'string', width: 80, sortable: true },
  { key: 'class_name', label: 'Class', type: 'string', width: 80, groupable: true },
  { key: 'section_name', label: 'Section', type: 'string', width: 80, groupable: true },
  
  // Exam Info
  { key: 'exam_name', label: 'Exam Name', type: 'string', width: 150, groupable: true },
  { key: 'subject_name', label: 'Subject', type: 'string', width: 140, groupable: true },
  { key: 'exam_date', label: 'Exam Date', type: 'date', width: 100 },
  
  // Attendance
  { key: 'registered', label: 'Registered', type: 'boolean', width: 100 },
  { key: 'attempted', label: 'Attempted', type: 'boolean', width: 90 },
  { key: 'absent', label: 'Absent', type: 'boolean', width: 80 },
  { key: 'attempt_status', label: 'Attempt Status', type: 'badge', width: 120, groupable: true },
  
  // Result
  { key: 'total_questions', label: 'Questions', type: 'number', width: 100 },
  { key: 'attempted_questions', label: 'Attempted', type: 'number', width: 100 },
  { key: 'correct_answers', label: 'Correct', type: 'number', width: 90 },
  { key: 'wrong_answers', label: 'Wrong', type: 'number', width: 80 },
  { key: 'skipped_questions', label: 'Skipped', type: 'number', width: 90 },
  { key: 'marks_obtained', label: 'Marks', type: 'number', width: 80, sortable: true, aggregate: 'sum' },
  { key: 'max_marks', label: 'Max Marks', type: 'number', width: 90 },
  { key: 'negative_marks_deducted', label: 'Negative Deducted', type: 'number', width: 140 },
  { key: 'final_marks', label: 'Final Marks', type: 'number', width: 100, sortable: true },
  { key: 'percentage', label: 'Percentage', type: 'percentage', width: 100, sortable: true },
  { key: 'rank', label: 'Rank', type: 'number', width: 70, sortable: true },
  { key: 'result_status', label: 'Result', type: 'badge', width: 90, groupable: true },
  
  // Time Analysis
  { key: 'start_datetime', label: 'Started At', type: 'datetime', width: 150 },
  { key: 'end_datetime', label: 'Ended At', type: 'datetime', width: 150 },
  { key: 'time_taken', label: 'Time Taken', type: 'string', width: 100 },
  { key: 'time_taken_minutes', label: 'Time (min)', type: 'number', width: 100 },
  { key: 'avg_time_per_question', label: 'Avg Time/Q', type: 'string', width: 100 },
  { key: 'time_remaining', label: 'Time Left', type: 'string', width: 100 },
  { key: 'submitted_early', label: 'Early Submit', type: 'boolean', width: 100 },
  
  // Question-wise
  { key: 'question_no', label: 'Q No', type: 'number', width: 70 },
  { key: 'question_text', label: 'Question', type: 'string', width: 250 },
  { key: 'question_type', label: 'Type', type: 'badge', width: 100 },
  { key: 'correct_percentage', label: 'Correct %', type: 'percentage', width: 100 },
  { key: 'wrong_percentage', label: 'Wrong %', type: 'percentage', width: 100 },
  { key: 'skipped_percentage', label: 'Skipped %', type: 'percentage', width: 100 },
  { key: 'topic', label: 'Topic', type: 'string', width: 130, groupable: true },
  
  // Multiple Attempts
  { key: 'attempt_number', label: 'Attempt #', type: 'number', width: 90 },
  { key: 'attempt_1_marks', label: 'Attempt 1', type: 'number', width: 90 },
  { key: 'attempt_2_marks', label: 'Attempt 2', type: 'number', width: 90 },
  { key: 'attempt_3_marks', label: 'Attempt 3', type: 'number', width: 90 },
  { key: 'best_marks', label: 'Best Marks', type: 'number', width: 100 },
  { key: 'improvement', label: 'Improvement', type: 'number', width: 100 },
  
  // Incomplete/Re-exam
  { key: 'completion_status', label: 'Completion', type: 'badge', width: 110, groupable: true },
  { key: 'questions_done', label: 'Q Done', type: 'number', width: 80 },
  { key: 'incomplete_reason', label: 'Reason', type: 'string', width: 150, groupable: true },
  { key: 'reexam_date', label: 'Re-exam Date', type: 'date', width: 110 },
  { key: 'original_marks', label: 'Original', type: 'number', width: 90 },
  { key: 'reexam_marks', label: 'Re-exam', type: 'number', width: 90 },
  { key: 'marks_change', label: 'Change', type: 'number', width: 80 },
  
  // Comparison
  { key: 'exam_1_marks', label: 'Exam 1', type: 'number', width: 80 },
  { key: 'exam_2_marks', label: 'Exam 2', type: 'number', width: 80 },
  { key: 'exam_3_marks', label: 'Exam 3', type: 'number', width: 80 },
  { key: 'improvement_trend', label: 'Trend', type: 'badge', width: 90 },
  
  // Stats
  { key: 'student_count', label: 'Students', type: 'number', width: 90, aggregate: 'sum' },
  { key: 'pass_count', label: 'Pass', type: 'number', width: 70, aggregate: 'sum' },
  { key: 'fail_count', label: 'Fail', type: 'number', width: 70, aggregate: 'sum' },
  { key: 'pass_percentage', label: 'Pass %', type: 'percentage', width: 90 },
  { key: 'avg_marks', label: 'Avg Marks', type: 'number', width: 90 },
  { key: 'highest_marks', label: 'Highest', type: 'number', width: 90 },
  { key: 'lowest_marks', label: 'Lowest', type: 'number', width: 80 },
  { key: 'best_class', label: 'Best Class', type: 'string', width: 100 },
];

// 🔧 TECHNICAL & ANALYTICS COLUMNS
export const TECHNICAL_COLUMNS = [
  // Student Info
  { key: 'student_name', label: 'Student Name', type: 'string', width: 180, sortable: true },
  { key: 'admission_no', label: 'Admission No', type: 'string', width: 110 },
  { key: 'class_name', label: 'Class', type: 'string', width: 80, groupable: true },
  
  // Exam Info
  { key: 'exam_name', label: 'Exam Name', type: 'string', width: 150, groupable: true },
  { key: 'exam_date', label: 'Exam Date', type: 'date', width: 100 },
  
  // Device Info
  { key: 'device_type', label: 'Device Type', type: 'badge', width: 110, groupable: true },
  { key: 'device_name', label: 'Device', type: 'string', width: 150 },
  { key: 'os_name', label: 'OS', type: 'string', width: 120, groupable: true },
  { key: 'os_version', label: 'OS Version', type: 'string', width: 100 },
  { key: 'browser_name', label: 'Browser', type: 'string', width: 110, groupable: true },
  { key: 'browser_version', label: 'Browser Version', type: 'string', width: 120 },
  { key: 'screen_resolution', label: 'Resolution', type: 'string', width: 110 },
  { key: 'device_count', label: 'Count', type: 'number', width: 70, aggregate: 'sum' },
  
  // Technical Issues
  { key: 'issue_type', label: 'Issue Type', type: 'badge', width: 130, groupable: true },
  { key: 'issue_description', label: 'Issue', type: 'string', width: 200 },
  { key: 'issue_time', label: 'Issue Time', type: 'datetime', width: 150 },
  { key: 'resolution_status', label: 'Resolution', type: 'badge', width: 100, groupable: true },
  { key: 'resolution_notes', label: 'Resolution Notes', type: 'string', width: 200 },
  { key: 'resolved_by', label: 'Resolved By', type: 'string', width: 130 },
  { key: 'issue_count', label: 'Issues', type: 'number', width: 80, aggregate: 'sum' },
  
  // Proctoring
  { key: 'violation_type', label: 'Violation Type', type: 'badge', width: 140, groupable: true },
  { key: 'violation_time', label: 'Violation Time', type: 'datetime', width: 140 },
  { key: 'violation_action', label: 'Action Taken', type: 'badge', width: 120, groupable: true },
  { key: 'violation_count', label: 'Violations', type: 'number', width: 90, aggregate: 'sum' },
  { key: 'warning_given', label: 'Warning', type: 'boolean', width: 90 },
  { key: 'exam_terminated', label: 'Terminated', type: 'boolean', width: 100 },
  
  // Tab/Window Activity
  { key: 'tab_switches', label: 'Tab Switches', type: 'number', width: 110, aggregate: 'sum' },
  { key: 'window_blur_count', label: 'Window Blur', type: 'number', width: 110, aggregate: 'sum' },
  { key: 'time_away', label: 'Time Away', type: 'string', width: 100 },
  { key: 'time_away_seconds', label: 'Away (sec)', type: 'number', width: 100, aggregate: 'sum' },
  { key: 'max_away_duration', label: 'Max Away', type: 'string', width: 100 },
  
  // Copy/Paste
  { key: 'copy_attempts', label: 'Copy Attempts', type: 'number', width: 110, aggregate: 'sum' },
  { key: 'paste_attempts', label: 'Paste Attempts', type: 'number', width: 120, aggregate: 'sum' },
  { key: 'right_click_attempts', label: 'Right Clicks', type: 'number', width: 110, aggregate: 'sum' },
  { key: 'attempt_type', label: 'Attempt Type', type: 'badge', width: 110, groupable: true },
  { key: 'question_affected', label: 'Question', type: 'string', width: 100 },
  
  // IP & Location
  { key: 'ip_address', label: 'IP Address', type: 'string', width: 130 },
  { key: 'location', label: 'Location', type: 'string', width: 150, groupable: true },
  { key: 'city', label: 'City', type: 'string', width: 120, groupable: true },
  { key: 'country', label: 'Country', type: 'string', width: 100, groupable: true },
  { key: 'is_valid_location', label: 'Valid Location', type: 'boolean', width: 110 },
  { key: 'ip_flag', label: 'IP Flag', type: 'badge', width: 100, groupable: true },
  
  // Server Performance
  { key: 'max_concurrent', label: 'Max Concurrent', type: 'number', width: 120 },
  { key: 'avg_concurrent', label: 'Avg Concurrent', type: 'number', width: 120 },
  { key: 'server_response_ms', label: 'Response (ms)', type: 'number', width: 110 },
  { key: 'avg_response_time', label: 'Avg Response', type: 'number', width: 110 },
  { key: 'peak_load_time', label: 'Peak Time', type: 'datetime', width: 140 },
  { key: 'server_errors', label: 'Server Errors', type: 'number', width: 110, aggregate: 'sum' },
  
  // Bandwidth
  { key: 'avg_data_size_kb', label: 'Avg Size (KB)', type: 'number', width: 110 },
  { key: 'total_data_mb', label: 'Total (MB)', type: 'number', width: 100 },
  { key: 'peak_bandwidth', label: 'Peak BW', type: 'string', width: 100 },
  { key: 'upload_data_kb', label: 'Upload (KB)', type: 'number', width: 110 },
  { key: 'download_data_kb', label: 'Download (KB)', type: 'number', width: 120 },
];

// ═══════════════════════════════════════════════════════════════════════════════
// CONSOLIDATED COLUMNS FOR EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

export const ONLINE_EXAM_COLUMNS = [
  ...SETUP_COLUMNS,
  ...RESULT_COLUMNS.filter(c => !SETUP_COLUMNS.find(s => s.key === c.key)),
  ...TECHNICAL_COLUMNS.filter(c => 
    !SETUP_COLUMNS.find(s => s.key === c.key) && 
    !RESULT_COLUMNS.find(r => r.key === c.key)
  )
];

// ═══════════════════════════════════════════════════════════════════════════════
// COLUMN SETS FOR SPECIFIC TEMPLATES
// ═══════════════════════════════════════════════════════════════════════════════

export const COLUMN_SETS = {
  // Exam Setup (10 templates)
  online_exam_list: ['exam_name', 'subject_name', 'class_name', 'exam_date', 'duration', 'total_questions', 'total_marks', 'exam_status'],
  question_bank_summary: ['subject_name', 'chapter_name', 'total_questions', 'questions_used', 'questions_available'],
  exam_schedule_calendar: ['exam_date', 'exam_name', 'class_name', 'start_time', 'duration', 'registered_count'],
  active_exams: ['exam_name', 'class_name', 'exam_status', 'registered_count', 'attempted', 'student_count'],
  upcoming_exams: ['exam_name', 'class_name', 'exam_date', 'start_time', 'registered_count'],
  exam_configuration: ['exam_name', 'duration_minutes', 'total_questions', 'total_marks', 'negative_marking', 'negative_marks', 'shuffle_questions'],
  question_type_analysis: ['question_type', 'total_questions', 'subject_name'],
  difficulty_level_mix: ['exam_name', 'easy_count', 'medium_count', 'hard_count', 'easy_percentage', 'medium_percentage', 'hard_percentage'],
  exam_practice_tests: ['exam_type', 'exam_count', 'avg_attendance'],
  exam_template_library: ['template_name', 'subject_name', 'total_questions', 'times_used'],
  
  // Attempt & Result (12 templates)
  exam_attendance: ['exam_name', 'registered_count', 'student_count', 'absent'],
  student_result: ['student_name', 'roll_no', 'exam_name', 'marks_obtained', 'max_marks', 'percentage', 'rank'],
  class_result: ['class_name', 'student_count', 'avg_marks', 'pass_percentage'],
  subject_performance: ['subject_name', 'exam_count', 'avg_marks', 'best_class'],
  question_analysis: ['question_no', 'question_type', 'correct_percentage', 'wrong_percentage', 'skipped_percentage'],
  difficult_questions: ['question_no', 'question_text', 'correct_percentage', 'topic'],
  time_analysis: ['student_name', 'time_taken', 'time_taken_minutes', 'avg_time_per_question'],
  early_submission: ['student_name', 'duration_minutes', 'time_taken_minutes', 'marks_obtained'],
  multiple_attempts: ['student_name', 'attempt_1_marks', 'attempt_2_marks', 'attempt_3_marks', 'best_marks'],
  incomplete_exams: ['student_name', 'exam_name', 'questions_done', 'incomplete_reason'],
  reexam_list: ['student_name', 'exam_name', 'original_marks', 'reexam_marks', 'marks_change'],
  result_comparison: ['student_name', 'exam_1_marks', 'exam_2_marks', 'exam_3_marks', 'improvement_trend'],
  
  // Technical & Analytics (8 templates)
  device_usage: ['device_type', 'os_name', 'browser_name', 'device_count'],
  technical_issues: ['student_name', 'issue_type', 'exam_name', 'resolution_status'],
  proctoring_violations: ['student_name', 'violation_type', 'violation_time', 'violation_action'],
  tab_switch_report: ['student_name', 'tab_switches', 'time_away', 'time_away_seconds'],
  copy_paste_attempts: ['student_name', 'question_affected', 'attempt_type', 'copy_attempts', 'paste_attempts'],
  ip_address_log: ['student_name', 'exam_name', 'ip_address', 'location', 'is_valid_location'],
  peak_load_report: ['exam_name', 'max_concurrent', 'server_response_ms', 'peak_load_time'],
  bandwidth_usage: ['exam_name', 'avg_data_size_kb', 'total_data_mb', 'peak_bandwidth'],
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
    const allColumns = [...SETUP_COLUMNS, ...RESULT_COLUMNS, ...TECHNICAL_COLUMNS];
    return allColumns.find(c => c.key === key);
  }).filter(Boolean);
};

/**
 * Get all available columns
 */
export const getAllColumns = () => {
  return ONLINE_EXAM_COLUMNS;
};

/**
 * Get column by key
 */
export const getColumnByKey = (key) => {
  return ONLINE_EXAM_COLUMNS.find(c => c.key === key);
};

/**
 * Get columns by category
 */
export const getColumnsByCategory = (category) => {
  switch (category) {
    case 'setup':
      return SETUP_COLUMNS;
    case 'result':
      return RESULT_COLUMNS;
    case 'technical':
      return TECHNICAL_COLUMNS;
    default:
      return ONLINE_EXAM_COLUMNS;
  }
};

export default {
  ONLINE_EXAM_COLUMNS,
  SETUP_COLUMNS,
  RESULT_COLUMNS,
  TECHNICAL_COLUMNS,
  COLUMN_SETS,
  getColumnsForSet,
  getAllColumns,
  getColumnByKey,
  getColumnsByCategory
};
