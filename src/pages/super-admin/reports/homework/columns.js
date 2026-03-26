/**
 * Homework Report Generator - Column Definitions
 * Day 7 - 8 Day Master Plan
 * 80+ columns for 25 homework report templates
 */

import { formatDate, formatDateTime, formatTime } from '@/utils/dateUtils';

// ═══════════════════════════════════════════════════════════════════════════════
// HOMEWORK COLUMNS - Complete Column Library
// ═══════════════════════════════════════════════════════════════════════════════

export const HOMEWORK_COLUMNS = [
  // ─────────────────────────────────────────────────────────────────────────────
  // ASSIGNMENT INFORMATION
  // ─────────────────────────────────────────────────────────────────────────────
  { key: 'homework_id', label: 'HW ID', type: 'text', group: 'Assignment Info', sortable: true, width: 90 },
  { key: 'homework_title', label: 'Title', type: 'text', group: 'Assignment Info', sortable: true, width: 200 },
  { key: 'homework_description', label: 'Description', type: 'text', group: 'Assignment Info', width: 250 },
  { key: 'homework_type', label: 'Type', type: 'badge', group: 'Assignment Info', sortable: true, width: 100 },
  { key: 'homework_category', label: 'Category', type: 'badge', group: 'Assignment Info', sortable: true, width: 110 },
  { key: 'priority', label: 'Priority', type: 'badge', group: 'Assignment Info', sortable: true, width: 80 },
  { key: 'difficulty_level', label: 'Difficulty', type: 'badge', group: 'Assignment Info', sortable: true, width: 90 },
  { key: 'estimated_time', label: 'Est. Time (min)', type: 'number', group: 'Assignment Info', sortable: true, width: 110 },
  { key: 'max_marks', label: 'Max Marks', type: 'number', group: 'Assignment Info', sortable: true, width: 90 },
  { key: 'homework_status', label: 'Status', type: 'badge', group: 'Assignment Info', sortable: true, width: 100 },
  { key: 'attachment_count', label: 'Attachments', type: 'number', group: 'Assignment Info', width: 100 },
  { key: 'has_attachment', label: 'Has Attachment', type: 'boolean', group: 'Assignment Info', width: 110 },
  
  // ─────────────────────────────────────────────────────────────────────────────
  // CLASS & SUBJECT INFORMATION
  // ─────────────────────────────────────────────────────────────────────────────
  { key: 'class_id', label: 'Class ID', type: 'text', group: 'Class Info', sortable: true, width: 80 },
  { key: 'class_name', label: 'Class', type: 'text', group: 'Class Info', sortable: true, width: 80 },
  { key: 'section_id', label: 'Section ID', type: 'text', group: 'Class Info', sortable: true, width: 80 },
  { key: 'section_name', label: 'Section', type: 'text', group: 'Class Info', sortable: true, width: 70 },
  { key: 'subject_id', label: 'Subject ID', type: 'text', group: 'Class Info', sortable: true, width: 90 },
  { key: 'subject_name', label: 'Subject', type: 'text', group: 'Class Info', sortable: true, width: 120 },
  { key: 'subject_code', label: 'Subject Code', type: 'text', group: 'Class Info', sortable: true, width: 100 },
  { key: 'subject_group', label: 'Subject Group', type: 'text', group: 'Class Info', sortable: true, width: 120 },
  { key: 'chapter_name', label: 'Chapter', type: 'text', group: 'Class Info', width: 150 },
  { key: 'topic_name', label: 'Topic', type: 'text', group: 'Class Info', width: 150 },
  
  // ─────────────────────────────────────────────────────────────────────────────
  // DATE INFORMATION
  // ─────────────────────────────────────────────────────────────────────────────
  { key: 'assigned_date', label: 'Assigned Date', type: 'date', group: 'Dates', sortable: true, width: 110, render: (v) => v ? formatDate(v) : '-' },
  { key: 'due_date', label: 'Due Date', type: 'date', group: 'Dates', sortable: true, width: 100, render: (v) => v ? formatDate(v) : '-' },
  { key: 'submission_deadline', label: 'Deadline', type: 'datetime', group: 'Dates', sortable: true, width: 140, render: (v) => v ? formatDateTime(v) : '-' },
  { key: 'days_given', label: 'Days Given', type: 'number', group: 'Dates', sortable: true, width: 90 },
  { key: 'days_remaining', label: 'Days Remaining', type: 'number', group: 'Dates', sortable: true, width: 110 },
  { key: 'days_overdue', label: 'Days Overdue', type: 'number', group: 'Dates', sortable: true, width: 100 },
  { key: 'is_overdue', label: 'Overdue', type: 'boolean', group: 'Dates', sortable: true, width: 80 },
  
  // ─────────────────────────────────────────────────────────────────────────────
  // TEACHER INFORMATION
  // ─────────────────────────────────────────────────────────────────────────────
  { key: 'teacher_id', label: 'Teacher ID', type: 'text', group: 'Teacher Info', sortable: true, width: 90 },
  { key: 'teacher_name', label: 'Teacher Name', type: 'text', group: 'Teacher Info', sortable: true, width: 150 },
  { key: 'teacher_phone', label: 'Teacher Phone', type: 'phone', group: 'Teacher Info', width: 120 },
  { key: 'teacher_email', label: 'Teacher Email', type: 'email', group: 'Teacher Info', width: 180 },
  { key: 'assigned_by', label: 'Assigned By', type: 'text', group: 'Teacher Info', width: 130 },
  
  // ─────────────────────────────────────────────────────────────────────────────
  // STUDENT INFORMATION
  // ─────────────────────────────────────────────────────────────────────────────
  { key: 'student_id', label: 'Student ID', type: 'text', group: 'Student Info', sortable: true, width: 100 },
  { key: 'enrollment_id', label: 'Enroll ID', type: 'text', group: 'Student Info', sortable: true, width: 120 },
  { key: 'student_name', label: 'Student Name', type: 'text', group: 'Student Info', sortable: true, width: 150 },
  { key: 'roll_number', label: 'Roll No', type: 'text', group: 'Student Info', sortable: true, width: 70 },
  { key: 'gender', label: 'Gender', type: 'text', group: 'Student Info', sortable: true, width: 70 },
  { key: 'student_phone', label: 'Student Phone', type: 'phone', group: 'Student Info', width: 120 },
  { key: 'father_name', label: 'Father Name', type: 'text', group: 'Student Info', width: 150 },
  { key: 'father_phone', label: 'Father Phone', type: 'phone', group: 'Student Info', width: 120 },
  { key: 'mother_phone', label: 'Mother Phone', type: 'phone', group: 'Student Info', width: 120 },
  
  // ─────────────────────────────────────────────────────────────────────────────
  // SUBMISSION INFORMATION
  // ─────────────────────────────────────────────────────────────────────────────
  { key: 'submission_id', label: 'Submission ID', type: 'text', group: 'Submission', sortable: true, width: 110 },
  { key: 'submission_date', label: 'Submission Date', type: 'date', group: 'Submission', sortable: true, width: 120, render: (v) => v ? formatDate(v) : '-' },
  { key: 'submission_time', label: 'Submission Time', type: 'time', group: 'Submission', width: 110, render: (v) => v ? formatTime(v) : '-' },
  { key: 'submission_status', label: 'Submission Status', type: 'badge', group: 'Submission', sortable: true, width: 130 },
  { key: 'is_submitted', label: 'Submitted', type: 'boolean', group: 'Submission', sortable: true, width: 90 },
  { key: 'is_late', label: 'Late', type: 'boolean', group: 'Submission', sortable: true, width: 60 },
  { key: 'late_by_days', label: 'Late By (Days)', type: 'number', group: 'Submission', sortable: true, width: 100 },
  { key: 'submission_type', label: 'Submission Type', type: 'badge', group: 'Submission', sortable: true, width: 120 },
  { key: 'file_uploaded', label: 'File Uploaded', type: 'boolean', group: 'Submission', width: 100 },
  { key: 'file_name', label: 'File Name', type: 'text', group: 'Submission', width: 150 },
  { key: 'submission_remarks', label: 'Remarks', type: 'text', group: 'Submission', width: 180 },
  
  // ─────────────────────────────────────────────────────────────────────────────
  // SUBMISSION STATISTICS
  // ─────────────────────────────────────────────────────────────────────────────
  { key: 'total_students', label: 'Total Students', type: 'number', group: 'Statistics', sortable: true, width: 110 },
  { key: 'submitted_count', label: 'Submitted', type: 'number', group: 'Statistics', sortable: true, width: 90 },
  { key: 'pending_count', label: 'Pending', type: 'number', group: 'Statistics', sortable: true, width: 80 },
  { key: 'late_count', label: 'Late Submissions', type: 'number', group: 'Statistics', sortable: true, width: 120 },
  { key: 'on_time_count', label: 'On Time', type: 'number', group: 'Statistics', sortable: true, width: 80 },
  { key: 'submission_rate', label: 'Submission Rate', type: 'percentage', group: 'Statistics', sortable: true, width: 120 },
  { key: 'on_time_rate', label: 'On Time Rate', type: 'percentage', group: 'Statistics', sortable: true, width: 110 },
  { key: 'late_rate', label: 'Late Rate', type: 'percentage', group: 'Statistics', sortable: true, width: 90 },
  { key: 'avg_submission_delay', label: 'Avg Delay (hrs)', type: 'number', group: 'Statistics', sortable: true, width: 110 },
  
  // ─────────────────────────────────────────────────────────────────────────────
  // PARENT COMMUNICATION
  // ─────────────────────────────────────────────────────────────────────────────
  { key: 'notification_sent', label: 'Notification Sent', type: 'boolean', group: 'Communication', width: 130 },
  { key: 'notification_date', label: 'Notification Date', type: 'date', group: 'Communication', width: 130, render: (v) => v ? formatDate(v) : '-' },
  { key: 'notification_type', label: 'Notification Type', type: 'badge', group: 'Communication', width: 130 },
  { key: 'parent_viewed', label: 'Parent Viewed', type: 'boolean', group: 'Communication', sortable: true, width: 110 },
  { key: 'parent_view_date', label: 'View Date', type: 'date', group: 'Communication', width: 100, render: (v) => v ? formatDate(v) : '-' },
  { key: 'parent_acknowledged', label: 'Acknowledged', type: 'boolean', group: 'Communication', sortable: true, width: 110 },
  { key: 'acknowledge_date', label: 'Acknowledge Date', type: 'date', group: 'Communication', width: 130, render: (v) => v ? formatDate(v) : '-' },
  { key: 'parent_signed', label: 'Parent Signed', type: 'boolean', group: 'Communication', sortable: true, width: 110 },
  { key: 'sms_sent', label: 'SMS Sent', type: 'boolean', group: 'Communication', width: 80 },
  { key: 'app_notification', label: 'App Notification', type: 'boolean', group: 'Communication', width: 120 },
  
  // ─────────────────────────────────────────────────────────────────────────────
  // STUDENT PERFORMANCE
  // ─────────────────────────────────────────────────────────────────────────────
  { key: 'total_homework', label: 'Total Homework', type: 'number', group: 'Performance', sortable: true, width: 120 },
  { key: 'homework_submitted', label: 'HW Submitted', type: 'number', group: 'Performance', sortable: true, width: 110 },
  { key: 'homework_pending', label: 'HW Pending', type: 'number', group: 'Performance', sortable: true, width: 100 },
  { key: 'submission_percentage', label: 'Submission %', type: 'percentage', group: 'Performance', sortable: true, width: 110 },
  { key: 'submission_streak', label: 'Streak Days', type: 'number', group: 'Performance', sortable: true, width: 100 },
  { key: 'last_submission', label: 'Last Submission', type: 'date', group: 'Performance', sortable: true, width: 120, render: (v) => v ? formatDate(v) : '-' },
  { key: 'performance_grade', label: 'Performance', type: 'badge', group: 'Performance', sortable: true, width: 110 },
  
  // ─────────────────────────────────────────────────────────────────────────────
  // DAILY/WEEKLY STATS
  // ─────────────────────────────────────────────────────────────────────────────
  { key: 'date', label: 'Date', type: 'date', group: 'Daily Stats', sortable: true, width: 100, render: (v) => v ? formatDate(v) : '-' },
  { key: 'day_name', label: 'Day', type: 'text', group: 'Daily Stats', sortable: true, width: 90 },
  { key: 'week_number', label: 'Week', type: 'number', group: 'Daily Stats', sortable: true, width: 70 },
  { key: 'month_name', label: 'Month', type: 'text', group: 'Daily Stats', sortable: true, width: 90 },
  { key: 'homework_count', label: 'HW Count', type: 'number', group: 'Daily Stats', sortable: true, width: 90 },
  { key: 'subjects_count', label: 'Subjects', type: 'number', group: 'Daily Stats', sortable: true, width: 80 },
  { key: 'avg_per_day', label: 'Avg Per Day', type: 'number', group: 'Daily Stats', sortable: true, width: 100 },
  
  // ─────────────────────────────────────────────────────────────────────────────
  // RE-ASSIGNMENT INFO
  // ─────────────────────────────────────────────────────────────────────────────
  { key: 'is_reassigned', label: 'Re-assigned', type: 'boolean', group: 'Re-assignment', sortable: true, width: 100 },
  { key: 'original_due_date', label: 'Original Due', type: 'date', group: 'Re-assignment', width: 110, render: (v) => v ? formatDate(v) : '-' },
  { key: 'reassign_date', label: 'Reassign Date', type: 'date', group: 'Re-assignment', width: 110, render: (v) => v ? formatDate(v) : '-' },
  { key: 'reassign_reason', label: 'Reassign Reason', type: 'text', group: 'Re-assignment', width: 150 },
  { key: 'reassigned_by', label: 'Reassigned By', type: 'text', group: 'Re-assignment', width: 120 },
  
  // ─────────────────────────────────────────────────────────────────────────────
  // AUDIT & TIMESTAMPS
  // ─────────────────────────────────────────────────────────────────────────────
  { key: 'created_at', label: 'Created At', type: 'datetime', group: 'Audit', sortable: true, width: 150, render: (v) => v ? formatDateTime(v) : '-' },
  { key: 'updated_at', label: 'Updated At', type: 'datetime', group: 'Audit', sortable: true, width: 150, render: (v) => v ? formatDateTime(v) : '-' },
  { key: 'created_by', label: 'Created By', type: 'text', group: 'Audit', width: 120 },
  { key: 'remarks', label: 'Remarks', type: 'text', group: 'Audit', width: 200 },
];

// ═══════════════════════════════════════════════════════════════════════════════
// COLUMN SETS - Pre-defined column groups for templates
// ═══════════════════════════════════════════════════════════════════════════════

export const COLUMN_SETS = {
  // Assignment Tracking Templates
  all_assignments: ['homework_id', 'homework_title', 'subject_name', 'class_name', 'section_name', 'teacher_name', 'assigned_date', 'due_date', 'homework_status'],
  todays_homework: ['subject_name', 'homework_title', 'class_name', 'section_name', 'due_date', 'teacher_name', 'estimated_time'],
  pending_homework: ['homework_title', 'class_name', 'section_name', 'subject_name', 'due_date', 'total_students', 'submitted_count', 'pending_count'],
  overdue_homework: ['homework_title', 'class_name', 'subject_name', 'due_date', 'days_overdue', 'pending_count', 'submission_rate'],
  teacher_assignments: ['teacher_name', 'subject_name', 'homework_count', 'submitted_count', 'submission_rate', 'avg_submission_delay'],
  subject_summary: ['subject_name', 'homework_count', 'submitted_count', 'pending_count', 'submission_rate'],
  class_homework_load: ['class_name', 'section_name', 'subjects_count', 'homework_count', 'avg_per_day'],
  daily_homework: ['date', 'day_name', 'class_name', 'subjects_count', 'homework_count'],
  homework_calendar: ['date', 'class_name', 'subject_name', 'homework_title', 'due_date'],
  reassigned_homework: ['homework_title', 'class_name', 'original_due_date', 'due_date', 'reassign_reason', 'reassigned_by'],
  
  // Submission Tracking Templates
  submission_status: ['homework_title', 'class_name', 'total_students', 'submitted_count', 'pending_count', 'submission_rate'],
  student_submissions: ['student_name', 'enrollment_id', 'class_name', 'total_homework', 'homework_submitted', 'homework_pending', 'submission_percentage'],
  late_submissions: ['student_name', 'enrollment_id', 'homework_title', 'due_date', 'submission_date', 'late_by_days'],
  non_submitters: ['homework_title', 'class_name', 'student_name', 'enrollment_id', 'due_date', 'father_phone'],
  consistent_submitters: ['student_name', 'enrollment_id', 'class_name', 'submission_percentage', 'submission_streak'],
  poor_submission: ['student_name', 'enrollment_id', 'class_name', 'submission_percentage', 'last_submission', 'father_phone'],
  parent_not_signed: ['student_name', 'homework_title', 'submission_date', 'parent_signed', 'father_phone'],
  submission_type_analysis: ['homework_title', 'submission_type', 'submitted_count', 'submission_rate'],
  submission_time_analysis: ['homework_title', 'on_time_count', 'late_count', 'on_time_rate', 'avg_submission_delay'],
  class_submission_trend: ['class_name', 'section_name', 'week_number', 'submission_rate', 'late_rate'],
  
  // Parent Communication Templates
  notification_sent: ['date', 'class_name', 'homework_count', 'notification_type', 'sms_sent', 'app_notification'],
  parent_view_status: ['homework_title', 'class_name', 'total_students', 'parent_viewed', 'parent_view_date'],
  parent_acknowledge: ['homework_title', 'class_name', 'student_name', 'parent_acknowledged', 'acknowledge_date'],
  student_homework_card: ['student_name', 'enrollment_id', 'subject_name', 'homework_submitted', 'homework_pending', 'submission_percentage'],
  class_homework_summary: ['class_name', 'section_name', 'homework_count', 'submission_rate', 'on_time_rate'],
};

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get columns by keys
 */
export const getColumns = (keys) => {
  return keys.map(key => HOMEWORK_COLUMNS.find(c => c.key === key)).filter(Boolean);
};

/**
 * Get columns by group
 */
export const getColumnsByGroup = (group) => {
  return HOMEWORK_COLUMNS.filter(c => c.group === group);
};

/**
 * Get all column groups
 */
export const getColumnGroups = () => {
  const groups = [...new Set(HOMEWORK_COLUMNS.map(c => c.group))];
  return groups.map(name => ({
    name,
    columns: HOMEWORK_COLUMNS.filter(c => c.group === name)
  }));
};

export default HOMEWORK_COLUMNS;
