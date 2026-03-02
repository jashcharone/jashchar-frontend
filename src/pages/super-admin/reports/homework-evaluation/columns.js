/**
 * Homework Evaluation Report Generator - Column Definitions
 * Day 7 - 8 Day Master Plan
 * 80+ columns for 25 templates
 */

// ═══════════════════════════════════════════════════════════════════════════════
// HOMEWORK EVALUATION COLUMNS DEFINITION
// ═══════════════════════════════════════════════════════════════════════════════

export const HOMEWORK_EVAL_COLUMNS = [
  // ─────────────────────────────────────────────────────────────────────────────
  // EVALUATION INFO
  // ─────────────────────────────────────────────────────────────────────────────
  { key: 'evaluation_id', label: 'Evaluation ID', type: 'text', group: 'Evaluation Info', sortable: true, width: 120 },
  { key: 'homework_id', label: 'Homework ID', type: 'text', group: 'Evaluation Info', sortable: true, width: 120 },
  { key: 'homework_title', label: 'Homework Title', type: 'text', group: 'Evaluation Info', sortable: true, width: 200 },
  { key: 'evaluation_status', label: 'Evaluation Status', type: 'badge', group: 'Evaluation Info', sortable: true, width: 120,
    badgeConfig: { 'Evaluated': 'green', 'Pending': 'yellow', 'Partial': 'blue', 'Not Started': 'gray' }
  },
  { key: 'is_evaluated', label: 'Is Evaluated', type: 'boolean', group: 'Evaluation Info', width: 100 },
  { key: 'evaluation_type', label: 'Evaluation Type', type: 'text', group: 'Evaluation Info', sortable: true, width: 120 },
  { key: 'grading_scale', label: 'Grading Scale', type: 'text', group: 'Evaluation Info', width: 120 },
  { key: 'rubric_used', label: 'Rubric Used', type: 'boolean', group: 'Evaluation Info', width: 100 },
  { key: 'rubric_name', label: 'Rubric Name', type: 'text', group: 'Evaluation Info', width: 150 },
  
  // ─────────────────────────────────────────────────────────────────────────────
  // HOMEWORK INFO
  // ─────────────────────────────────────────────────────────────────────────────
  { key: 'subject_name', label: 'Subject', type: 'text', group: 'Homework Info', sortable: true, filterable: true, width: 150 },
  { key: 'subject_code', label: 'Subject Code', type: 'text', group: 'Homework Info', width: 100 },
  { key: 'homework_type', label: 'Homework Type', type: 'text', group: 'Homework Info', sortable: true, width: 120 },
  { key: 'chapter_name', label: 'Chapter', type: 'text', group: 'Homework Info', width: 150 },
  { key: 'max_marks', label: 'Max Marks', type: 'number', group: 'Homework Info', sortable: true, width: 100, aggregate: 'sum' },
  { key: 'weightage', label: 'Weightage (%)', type: 'number', group: 'Homework Info', width: 100 },
  
  // ─────────────────────────────────────────────────────────────────────────────
  // CLASS INFO
  // ─────────────────────────────────────────────────────────────────────────────
  { key: 'class_id', label: 'Class ID', type: 'hidden', group: 'Class Info' },
  { key: 'class_name', label: 'Class', type: 'text', group: 'Class Info', sortable: true, filterable: true, width: 100 },
  { key: 'section_id', label: 'Section ID', type: 'hidden', group: 'Class Info' },
  { key: 'section_name', label: 'Section', type: 'text', group: 'Class Info', sortable: true, filterable: true, width: 80 },
  { key: 'class_strength', label: 'Class Strength', type: 'number', group: 'Class Info', width: 120, aggregate: 'sum' },
  
  // ─────────────────────────────────────────────────────────────────────────────
  // STUDENT INFO
  // ─────────────────────────────────────────────────────────────────────────────
  { key: 'student_id', label: 'Student ID', type: 'hidden', group: 'Student Info' },
  { key: 'student_name', label: 'Student Name', type: 'text', group: 'Student Info', sortable: true, width: 180 },
  { key: 'admission_no', label: 'Admission No', type: 'text', group: 'Student Info', sortable: true, width: 120 },
  { key: 'roll_number', label: 'Roll No', type: 'number', group: 'Student Info', sortable: true, width: 80 },
  
  // ─────────────────────────────────────────────────────────────────────────────
  // TEACHER INFO
  // ─────────────────────────────────────────────────────────────────────────────
  { key: 'teacher_id', label: 'Teacher ID', type: 'hidden', group: 'Teacher Info' },
  { key: 'teacher_name', label: 'Teacher', type: 'text', group: 'Teacher Info', sortable: true, width: 150 },
  { key: 'evaluator_name', label: 'Evaluator', type: 'text', group: 'Teacher Info', sortable: true, width: 150 },
  { key: 'evaluator_employee_code', label: 'Evaluator Code', type: 'text', group: 'Teacher Info', width: 120 },
  
  // ─────────────────────────────────────────────────────────────────────────────
  // DATES
  // ─────────────────────────────────────────────────────────────────────────────
  { key: 'assigned_date', label: 'Assigned Date', type: 'date', group: 'Dates', sortable: true, width: 120 },
  { key: 'due_date', label: 'Due Date', type: 'date', group: 'Dates', sortable: true, width: 120 },
  { key: 'submission_date', label: 'Submission Date', type: 'date', group: 'Dates', sortable: true, width: 130 },
  { key: 'evaluation_date', label: 'Evaluation Date', type: 'date', group: 'Dates', sortable: true, width: 130 },
  { key: 'evaluation_start_date', label: 'Eval Start Date', type: 'date', group: 'Dates', width: 130 },
  { key: 'evaluation_end_date', label: 'Eval End Date', type: 'date', group: 'Dates', width: 130 },
  { key: 'days_to_evaluate', label: 'Days to Evaluate', type: 'number', group: 'Dates', width: 130 },
  { key: 'evaluation_delayed_by', label: 'Delay (Days)', type: 'number', group: 'Dates', width: 110 },
  
  // ─────────────────────────────────────────────────────────────────────────────
  // MARKS & GRADES
  // ─────────────────────────────────────────────────────────────────────────────
  { key: 'marks_obtained', label: 'Marks Obtained', type: 'number', group: 'Marks & Grades', sortable: true, width: 130, aggregate: 'avg' },
  { key: 'marks_percentage', label: 'Percentage (%)', type: 'percentage', group: 'Marks & Grades', sortable: true, width: 120 },
  { key: 'grade', label: 'Grade', type: 'badge', group: 'Marks & Grades', sortable: true, width: 80,
    badgeConfig: { 'A+': 'green', 'A': 'green', 'B+': 'blue', 'B': 'blue', 'C+': 'yellow', 'C': 'yellow', 'D': 'orange', 'F': 'red' }
  },
  { key: 'grade_points', label: 'Grade Points', type: 'number', group: 'Marks & Grades', width: 120 },
  { key: 'quality_score', label: 'Quality Score', type: 'number', group: 'Marks & Grades', sortable: true, width: 120 },
  { key: 'presentation_marks', label: 'Presentation Marks', type: 'number', group: 'Marks & Grades', width: 150 },
  { key: 'accuracy_marks', label: 'Accuracy Marks', type: 'number', group: 'Marks & Grades', width: 130 },
  { key: 'completeness_marks', label: 'Completeness Marks', type: 'number', group: 'Marks & Grades', width: 160 },
  { key: 'creativity_marks', label: 'Creativity Marks', type: 'number', group: 'Marks & Grades', width: 140 },
  { key: 'effort_marks', label: 'Effort Marks', type: 'number', group: 'Marks & Grades', width: 110 },
  
  // ─────────────────────────────────────────────────────────────────────────────
  // FEEDBACK
  // ─────────────────────────────────────────────────────────────────────────────
  { key: 'feedback_comment', label: 'Feedback Comment', type: 'text', group: 'Feedback', width: 250 },
  { key: 'feedback_rating', label: 'Feedback Rating', type: 'rating', group: 'Feedback', width: 130 },
  { key: 'teacher_remarks', label: 'Teacher Remarks', type: 'text', group: 'Feedback', width: 200 },
  { key: 'improvement_areas', label: 'Improvement Areas', type: 'text', group: 'Feedback', width: 200 },
  { key: 'strengths', label: 'Strengths', type: 'text', group: 'Feedback', width: 200 },
  { key: 'parent_feedback', label: 'Parent Feedback', type: 'text', group: 'Feedback', width: 200 },
  { key: 'feedback_sent', label: 'Feedback Sent', type: 'boolean', group: 'Feedback', width: 110 },
  { key: 'feedback_sent_date', label: 'Feedback Sent Date', type: 'date', group: 'Feedback', width: 150 },
  { key: 'feedback_acknowledged', label: 'Feedback Acknowledged', type: 'boolean', group: 'Feedback', width: 170 },
  
  // ─────────────────────────────────────────────────────────────────────────────
  // STATISTICS - CLASS LEVEL
  // ─────────────────────────────────────────────────────────────────────────────
  { key: 'total_submissions', label: 'Total Submissions', type: 'number', group: 'Statistics', width: 150, aggregate: 'sum' },
  { key: 'evaluated_count', label: 'Evaluated Count', type: 'number', group: 'Statistics', width: 140, aggregate: 'sum' },
  { key: 'pending_evaluation', label: 'Pending Evaluation', type: 'number', group: 'Statistics', width: 160, aggregate: 'sum' },
  { key: 'evaluation_percentage', label: 'Evaluation %', type: 'percentage', group: 'Statistics', sortable: true, width: 120 },
  { key: 'class_average', label: 'Class Average', type: 'number', group: 'Statistics', sortable: true, width: 120, aggregate: 'avg' },
  { key: 'class_highest', label: 'Class Highest', type: 'number', group: 'Statistics', width: 120, aggregate: 'max' },
  { key: 'class_lowest', label: 'Class Lowest', type: 'number', group: 'Statistics', width: 120, aggregate: 'min' },
  { key: 'pass_count', label: 'Pass Count', type: 'number', group: 'Statistics', width: 110, aggregate: 'sum' },
  { key: 'fail_count', label: 'Fail Count', type: 'number', group: 'Statistics', width: 100, aggregate: 'sum' },
  { key: 'pass_percentage', label: 'Pass %', type: 'percentage', group: 'Statistics', sortable: true, width: 100 },
  
  // ─────────────────────────────────────────────────────────────────────────────
  // STATISTICS - STUDENT LEVEL
  // ─────────────────────────────────────────────────────────────────────────────
  { key: 'student_average', label: 'Student Average', type: 'number', group: 'Student Stats', sortable: true, width: 140, aggregate: 'avg' },
  { key: 'student_highest', label: 'Student Highest', type: 'number', group: 'Student Stats', width: 130 },
  { key: 'student_lowest', label: 'Student Lowest', type: 'number', group: 'Student Stats', width: 130 },
  { key: 'total_homework_evaluated', label: 'Total Evaluated', type: 'number', group: 'Student Stats', width: 130, aggregate: 'sum' },
  { key: 'total_marks_scored', label: 'Total Marks Scored', type: 'number', group: 'Student Stats', width: 150, aggregate: 'sum' },
  { key: 'total_max_marks', label: 'Total Max Marks', type: 'number', group: 'Student Stats', width: 140, aggregate: 'sum' },
  { key: 'overall_percentage', label: 'Overall %', type: 'percentage', group: 'Student Stats', sortable: true, width: 100 },
  { key: 'rank_in_class', label: 'Rank in Class', type: 'number', group: 'Student Stats', sortable: true, width: 110 },
  { key: 'trend', label: 'Performance Trend', type: 'badge', group: 'Student Stats', width: 150,
    badgeConfig: { 'Improving': 'green', 'Stable': 'blue', 'Declining': 'red' }
  },
  
  // ─────────────────────────────────────────────────────────────────────────────
  // GRADE DISTRIBUTION
  // ─────────────────────────────────────────────────────────────────────────────
  { key: 'grade_a_plus', label: 'A+ Count', type: 'number', group: 'Grade Distribution', width: 90, aggregate: 'sum' },
  { key: 'grade_a', label: 'A Count', type: 'number', group: 'Grade Distribution', width: 80, aggregate: 'sum' },
  { key: 'grade_b_plus', label: 'B+ Count', type: 'number', group: 'Grade Distribution', width: 90, aggregate: 'sum' },
  { key: 'grade_b', label: 'B Count', type: 'number', group: 'Grade Distribution', width: 80, aggregate: 'sum' },
  { key: 'grade_c_plus', label: 'C+ Count', type: 'number', group: 'Grade Distribution', width: 90, aggregate: 'sum' },
  { key: 'grade_c', label: 'C Count', type: 'number', group: 'Grade Distribution', width: 80, aggregate: 'sum' },
  { key: 'grade_d', label: 'D Count', type: 'number', group: 'Grade Distribution', width: 80, aggregate: 'sum' },
  { key: 'grade_f', label: 'F Count', type: 'number', group: 'Grade Distribution', width: 80, aggregate: 'sum' },
  
  // ─────────────────────────────────────────────────────────────────────────────
  // COMPARISON & ANALYSIS
  // ─────────────────────────────────────────────────────────────────────────────
  { key: 'above_average', label: 'Above Average', type: 'boolean', group: 'Analysis', width: 130 },
  { key: 'below_average', label: 'Below Average', type: 'boolean', group: 'Analysis', width: 130 },
  { key: 'deviation_from_avg', label: 'Deviation from Avg', type: 'number', group: 'Analysis', width: 160 },
  { key: 'percentile', label: 'Percentile', type: 'number', group: 'Analysis', sortable: true, width: 100 },
  { key: 'previous_score', label: 'Previous Score', type: 'number', group: 'Analysis', width: 130 },
  { key: 'score_change', label: 'Score Change', type: 'number', group: 'Analysis', width: 120 },
  { key: 'score_change_percent', label: 'Change %', type: 'percentage', group: 'Analysis', width: 100 },
  
  // ─────────────────────────────────────────────────────────────────────────────
  // COMMUNICATION
  // ─────────────────────────────────────────────────────────────────────────────
  { key: 'result_shared', label: 'Result Shared', type: 'boolean', group: 'Communication', width: 120 },
  { key: 'result_shared_date', label: 'Result Shared Date', type: 'date', group: 'Communication', width: 150 },
  { key: 'parent_notified', label: 'Parent Notified', type: 'boolean', group: 'Communication', width: 130 },
  { key: 'notification_method', label: 'Notification Method', type: 'text', group: 'Communication', width: 160 },
  { key: 'parent_viewed_result', label: 'Parent Viewed', type: 'boolean', group: 'Communication', width: 120 },
  { key: 'parent_viewed_date', label: 'Parent Viewed Date', type: 'date', group: 'Communication', width: 150 },
  { key: 'revaluation_requested', label: 'Revaluation Requested', type: 'boolean', group: 'Communication', width: 170 },
  { key: 'revaluation_status', label: 'Revaluation Status', type: 'text', group: 'Communication', width: 150 },
  
  // ─────────────────────────────────────────────────────────────────────────────
  // AUDIT
  // ─────────────────────────────────────────────────────────────────────────────
  { key: 'created_at', label: 'Created At', type: 'datetime', group: 'Audit', width: 160 },
  { key: 'updated_at', label: 'Updated At', type: 'datetime', group: 'Audit', width: 160 },
  { key: 'evaluated_by', label: 'Evaluated By', type: 'text', group: 'Audit', width: 150 },
];

// ═══════════════════════════════════════════════════════════════════════════════
// COLUMN SETS FOR TEMPLATES
// ═══════════════════════════════════════════════════════════════════════════════

export const COLUMN_SETS = {
  // Evaluation Status Templates (10)
  pending_evaluation: ['homework_id', 'homework_title', 'class_name', 'section_name', 'subject_name', 'due_date', 'submission_date', 'total_submissions', 'pending_evaluation', 'teacher_name'],
  evaluation_progress: ['homework_title', 'class_name', 'section_name', 'total_submissions', 'evaluated_count', 'pending_evaluation', 'evaluation_percentage', 'evaluator_name', 'evaluation_start_date'],
  teacher_evaluation_status: ['teacher_name', 'evaluator_employee_code', 'total_submissions', 'evaluated_count', 'pending_evaluation', 'evaluation_percentage', 'days_to_evaluate', 'evaluation_delayed_by'],
  overdue_evaluations: ['homework_title', 'class_name', 'subject_name', 'due_date', 'days_to_evaluate', 'evaluation_delayed_by', 'pending_evaluation', 'teacher_name'],
  evaluation_timeline: ['homework_title', 'assigned_date', 'due_date', 'submission_date', 'evaluation_date', 'days_to_evaluate', 'evaluation_status'],
  daily_evaluation_count: ['evaluation_date', 'evaluated_count', 'pending_evaluation', 'evaluator_name', 'class_name'],
  subject_evaluation_status: ['subject_name', 'total_submissions', 'evaluated_count', 'pending_evaluation', 'evaluation_percentage', 'class_average'],
  class_evaluation_summary: ['class_name', 'section_name', 'total_submissions', 'evaluated_count', 'pending_evaluation', 'evaluation_percentage', 'class_average'],
  evaluation_speed: ['evaluator_name', 'evaluated_count', 'days_to_evaluate', 'evaluation_delayed_by', 'evaluation_percentage'],
  batch_evaluation_status: ['homework_id', 'homework_title', 'evaluation_status', 'evaluated_count', 'pending_evaluation', 'evaluation_date'],
  
  // Grades & Analysis Templates (10)
  grade_report: ['student_name', 'admission_no', 'class_name', 'section_name', 'homework_title', 'marks_obtained', 'max_marks', 'marks_percentage', 'grade'],
  class_marks_summary: ['class_name', 'section_name', 'homework_title', 'class_average', 'class_highest', 'class_lowest', 'pass_count', 'fail_count', 'pass_percentage'],
  subject_performance: ['subject_name', 'class_name', 'class_average', 'class_highest', 'class_lowest', 'pass_percentage', 'grade_a_plus', 'grade_a', 'grade_b_plus', 'grade_f'],
  grade_distribution: ['homework_title', 'class_name', 'grade_a_plus', 'grade_a', 'grade_b_plus', 'grade_b', 'grade_c_plus', 'grade_c', 'grade_d', 'grade_f'],
  top_performers: ['student_name', 'admission_no', 'class_name', 'section_name', 'student_average', 'total_homework_evaluated', 'overall_percentage', 'rank_in_class'],
  low_performers: ['student_name', 'admission_no', 'class_name', 'section_name', 'student_average', 'fail_count', 'overall_percentage', 'trend'],
  student_progress: ['student_name', 'admission_no', 'homework_title', 'marks_obtained', 'previous_score', 'score_change', 'score_change_percent', 'trend'],
  comparative_analysis: ['student_name', 'class_name', 'student_average', 'class_average', 'deviation_from_avg', 'percentile', 'rank_in_class'],
  performance_trends: ['student_name', 'class_name', 'subject_name', 'overall_percentage', 'trend', 'student_highest', 'student_lowest'],
  marks_vs_attendance: ['student_name', 'class_name', 'overall_percentage', 'student_average', 'total_homework_evaluated', 'rank_in_class'],
  
  // Feedback & Communication Templates (5)
  feedback_report: ['student_name', 'homework_title', 'marks_obtained', 'grade', 'feedback_comment', 'improvement_areas', 'strengths', 'teacher_remarks'],
  feedback_pending: ['student_name', 'homework_title', 'evaluation_date', 'marks_obtained', 'grade', 'feedback_sent', 'feedback_acknowledged'],
  parent_notification_status: ['student_name', 'admission_no', 'homework_title', 'grade', 'parent_notified', 'notification_method', 'parent_viewed_result', 'parent_viewed_date'],
  student_progress_card: ['student_name', 'admission_no', 'class_name', 'student_average', 'total_homework_evaluated', 'overall_percentage', 'rank_in_class', 'trend', 'teacher_remarks'],
  revaluation_requests: ['student_name', 'homework_title', 'marks_obtained', 'grade', 'revaluation_requested', 'revaluation_status', 'parent_feedback'],
};

// Helper function to get column objects from column keys
export const getColumns = (columnKeys) => {
  return columnKeys.map(key => HOMEWORK_EVAL_COLUMNS.find(col => col.key === key)).filter(Boolean);
};

export default HOMEWORK_EVAL_COLUMNS;
