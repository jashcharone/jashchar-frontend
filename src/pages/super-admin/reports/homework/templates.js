/**
 * Homework Report Generator - Template Definitions
 * Day 7 - 8 Day Master Plan
 * 25 pre-built templates across 3 categories
 */

import { HOMEWORK_COLUMNS, COLUMN_SETS, getColumns } from './columns';

// ═══════════════════════════════════════════════════════════════════════════════
// TEMPLATE CATEGORIES
// ═══════════════════════════════════════════════════════════════════════════════

export const TEMPLATE_CATEGORIES = [
  { key: 'assignment_tracking', label: 'Assignment Tracking', icon: 'ClipboardList', color: 'cyan' },
  { key: 'submission_tracking', label: 'Submission Tracking', icon: 'CheckSquare', color: 'green' },
  { key: 'parent_communication', label: 'Parent Communication', icon: 'MessageCircle', color: 'purple' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// HOMEWORK TEMPLATES - 25 Templates
// ═══════════════════════════════════════════════════════════════════════════════

export const HOMEWORK_TEMPLATES = [
  // ─────────────────────────────────────────────────────────────────────────────
  // ASSIGNMENT TRACKING (10 Templates)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    key: 'all_assignments',
    name: 'All Assignments',
    description: 'Complete list of all homework assignments',
    category: 'assignment_tracking',
    icon: 'ClipboardList',
    popular: true,
    columns: getColumns(COLUMN_SETS.all_assignments),
    defaultFilters: {},
    defaultGroupBy: ['subject_name'],
    defaultSortBy: [{ key: 'assigned_date', direction: 'desc' }],
    defaultFilterConfig: { dateRange: true, class: true },
    dataSource: 'homework',
  },
  {
    key: 'todays_homework',
    name: "Today's Homework",
    description: 'Homework assigned for today',
    category: 'assignment_tracking',
    icon: 'Calendar',
    popular: true,
    columns: getColumns(COLUMN_SETS.todays_homework),
    defaultFilters: { date: 'today' },
    defaultGroupBy: ['class_name'],
    defaultSortBy: [{ key: 'subject_name', direction: 'asc' }],
    dataSource: 'homework_today',
  },
  {
    key: 'pending_homework',
    name: 'Pending Homework',
    description: 'Homework with pending submissions',
    category: 'assignment_tracking',
    icon: 'Clock',
    popular: true,
    columns: getColumns(COLUMN_SETS.pending_homework),
    defaultFilters: { status: 'pending' },
    defaultGroupBy: ['class_name'],
    defaultSortBy: [{ key: 'pending_count', direction: 'desc' }],
    dataSource: 'homework_pending',
  },
  {
    key: 'overdue_homework',
    name: 'Overdue Homework',
    description: 'Homework past due date with pending submissions',
    category: 'assignment_tracking',
    icon: 'AlertTriangle',
    columns: getColumns(COLUMN_SETS.overdue_homework),
    defaultFilters: { is_overdue: true },
    defaultGroupBy: ['class_name'],
    defaultSortBy: [{ key: 'days_overdue', direction: 'desc' }],
    dataSource: 'homework_overdue',
  },
  {
    key: 'teacher_assignments',
    name: 'Teacher-wise Assignments',
    description: 'Homework statistics by teacher',
    category: 'assignment_tracking',
    icon: 'User',
    columns: getColumns(COLUMN_SETS.teacher_assignments),
    defaultFilters: {},
    defaultGroupBy: [],
    defaultSortBy: [{ key: 'homework_count', direction: 'desc' }],
    defaultFilterConfig: { dateRange: true },
    dataSource: 'homework_by_teacher',
  },
  {
    key: 'subject_summary',
    name: 'Subject-wise Summary',
    description: 'Homework summary grouped by subject',
    category: 'assignment_tracking',
    icon: 'BookOpen',
    columns: getColumns(COLUMN_SETS.subject_summary),
    defaultFilters: {},
    defaultGroupBy: [],
    defaultSortBy: [{ key: 'submission_rate', direction: 'asc' }],
    defaultFilterConfig: { class: true },
    dataSource: 'homework_by_subject',
  },
  {
    key: 'class_homework_load',
    name: 'Class-wise Homework Load',
    description: 'Homework load analysis by class',
    category: 'assignment_tracking',
    icon: 'BarChart2',
    columns: getColumns(COLUMN_SETS.class_homework_load),
    defaultFilters: {},
    defaultGroupBy: [],
    defaultSortBy: [{ key: 'homework_count', direction: 'desc' }],
    defaultFilterConfig: { dateRange: true },
    dataSource: 'homework_load',
  },
  {
    key: 'daily_homework',
    name: 'Daily Homework Count',
    description: 'Day-wise homework statistics',
    category: 'assignment_tracking',
    icon: 'CalendarDays',
    columns: getColumns(COLUMN_SETS.daily_homework),
    defaultFilters: {},
    defaultGroupBy: ['date'],
    defaultSortBy: [{ key: 'date', direction: 'desc' }],
    defaultFilterConfig: { dateRange: true },
    dataSource: 'homework_daily',
  },
  {
    key: 'homework_calendar',
    name: 'Homework Calendar',
    description: 'Calendar view of homework assignments',
    category: 'assignment_tracking',
    icon: 'Calendar',
    columns: getColumns(COLUMN_SETS.homework_calendar),
    defaultFilters: {},
    defaultGroupBy: ['date'],
    defaultSortBy: [{ key: 'date', direction: 'asc' }],
    defaultFilterConfig: { month: true, class: true },
    dataSource: 'homework_calendar',
  },
  {
    key: 'reassigned_homework',
    name: 'Re-assigned Homework',
    description: 'Homework that was re-assigned',
    category: 'assignment_tracking',
    icon: 'RefreshCw',
    columns: getColumns(COLUMN_SETS.reassigned_homework),
    defaultFilters: { is_reassigned: true },
    defaultGroupBy: ['reassign_reason'],
    defaultSortBy: [{ key: 'reassign_date', direction: 'desc' }],
    defaultFilterConfig: { dateRange: true },
    dataSource: 'homework_reassigned',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // SUBMISSION TRACKING (10 Templates)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    key: 'submission_status',
    name: 'Submission Status',
    description: 'Current submission status for all homework',
    category: 'submission_tracking',
    icon: 'CheckSquare',
    popular: true,
    columns: getColumns(COLUMN_SETS.submission_status),
    defaultFilters: {},
    defaultGroupBy: ['class_name'],
    defaultSortBy: [{ key: 'submission_rate', direction: 'asc' }],
    dataSource: 'submissions',
  },
  {
    key: 'student_submissions',
    name: 'Student-wise Submissions',
    description: 'Submission statistics by student',
    category: 'submission_tracking',
    icon: 'Users',
    popular: true,
    columns: getColumns(COLUMN_SETS.student_submissions),
    defaultFilters: {},
    defaultGroupBy: ['class_name'],
    defaultSortBy: [{ key: 'submission_percentage', direction: 'asc' }],
    defaultFilterConfig: { class: true },
    dataSource: 'student_submissions',
  },
  {
    key: 'late_submissions',
    name: 'Late Submissions',
    description: 'Homework submitted after due date',
    category: 'submission_tracking',
    icon: 'Clock',
    columns: getColumns(COLUMN_SETS.late_submissions),
    defaultFilters: { is_late: true },
    defaultGroupBy: ['class_name'],
    defaultSortBy: [{ key: 'late_by_days', direction: 'desc' }],
    defaultFilterConfig: { dateRange: true },
    dataSource: 'late_submissions',
  },
  {
    key: 'non_submitters',
    name: 'Non-Submitters List',
    description: 'Students who have not submitted homework',
    category: 'submission_tracking',
    icon: 'UserX',
    popular: true,
    columns: getColumns(COLUMN_SETS.non_submitters),
    defaultFilters: { is_submitted: false },
    defaultGroupBy: ['homework_title'],
    defaultSortBy: [{ key: 'student_name', direction: 'asc' }],
    dataSource: 'non_submitters',
  },
  {
    key: 'consistent_submitters',
    name: 'Consistent Submitters',
    description: 'Students with high submission rates',
    category: 'submission_tracking',
    icon: 'Star',
    columns: getColumns(COLUMN_SETS.consistent_submitters),
    defaultFilters: { submission_percentage_min: 90 },
    defaultGroupBy: ['class_name'],
    defaultSortBy: [{ key: 'submission_streak', direction: 'desc' }],
    defaultFilterConfig: { class: true },
    dataSource: 'consistent_submitters',
  },
  {
    key: 'poor_submission',
    name: 'Poor Submission Record',
    description: 'Students with low submission rates',
    category: 'submission_tracking',
    icon: 'AlertCircle',
    columns: getColumns(COLUMN_SETS.poor_submission),
    defaultFilters: { submission_percentage_max: 50 },
    defaultGroupBy: ['class_name'],
    defaultSortBy: [{ key: 'submission_percentage', direction: 'asc' }],
    defaultFilterConfig: { class: true },
    dataSource: 'poor_submitters',
  },
  {
    key: 'parent_not_signed',
    name: 'Parent Not Signed',
    description: 'Homework not signed by parents',
    category: 'submission_tracking',
    icon: 'FileX',
    columns: getColumns(COLUMN_SETS.parent_not_signed),
    defaultFilters: { parent_signed: false, is_submitted: true },
    defaultGroupBy: ['class_name'],
    defaultSortBy: [{ key: 'submission_date', direction: 'desc' }],
    dataSource: 'unsigned_homework',
  },
  {
    key: 'submission_type_analysis',
    name: 'Digital vs Physical Submissions',
    description: 'Analysis of submission methods',
    category: 'submission_tracking',
    icon: 'PieChart',
    columns: getColumns(COLUMN_SETS.submission_type_analysis),
    defaultFilters: {},
    defaultGroupBy: ['submission_type'],
    defaultSortBy: [{ key: 'submitted_count', direction: 'desc' }],
    defaultFilterConfig: { class: true },
    dataSource: 'submission_types',
  },
  {
    key: 'submission_time_analysis',
    name: 'Submission Time Analysis',
    description: 'When students submit homework',
    category: 'submission_tracking',
    icon: 'TrendingUp',
    columns: getColumns(COLUMN_SETS.submission_time_analysis),
    defaultFilters: {},
    defaultGroupBy: [],
    defaultSortBy: [{ key: 'on_time_rate', direction: 'asc' }],
    defaultFilterConfig: { subject: true },
    dataSource: 'submission_timing',
  },
  {
    key: 'class_submission_trend',
    name: 'Class Submission Trend',
    description: 'Weekly submission trends by class',
    category: 'submission_tracking',
    icon: 'LineChart',
    columns: getColumns(COLUMN_SETS.class_submission_trend),
    defaultFilters: {},
    defaultGroupBy: ['class_name'],
    defaultSortBy: [{ key: 'week_number', direction: 'asc' }],
    defaultFilterConfig: { month: true },
    dataSource: 'submission_trends',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // PARENT COMMUNICATION (5 Templates)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    key: 'notification_sent',
    name: 'Homework Notifications Sent',
    description: 'Notifications sent to parents',
    category: 'parent_communication',
    icon: 'Bell',
    columns: getColumns(COLUMN_SETS.notification_sent),
    defaultFilters: {},
    defaultGroupBy: ['date'],
    defaultSortBy: [{ key: 'date', direction: 'desc' }],
    defaultFilterConfig: { dateRange: true, class: true },
    dataSource: 'notifications',
  },
  {
    key: 'parent_view_status',
    name: 'Parent View Status',
    description: 'Which parents have viewed homework',
    category: 'parent_communication',
    icon: 'Eye',
    columns: getColumns(COLUMN_SETS.parent_view_status),
    defaultFilters: {},
    defaultGroupBy: ['homework_title'],
    defaultSortBy: [{ key: 'parent_viewed', direction: 'asc' }],
    defaultFilterConfig: { class: true },
    dataSource: 'parent_views',
  },
  {
    key: 'parent_acknowledge',
    name: 'Parent Acknowledgement',
    description: 'Parent acknowledgement status',
    category: 'parent_communication',
    icon: 'ThumbsUp',
    columns: getColumns(COLUMN_SETS.parent_acknowledge),
    defaultFilters: {},
    defaultGroupBy: ['class_name'],
    defaultSortBy: [{ key: 'acknowledge_date', direction: 'desc' }],
    defaultFilterConfig: { class: true },
    dataSource: 'parent_acknowledgements',
  },
  {
    key: 'student_homework_card',
    name: 'Student Homework Card',
    description: 'Individual student homework status',
    category: 'parent_communication',
    icon: 'IdCard',
    popular: true,
    columns: getColumns(COLUMN_SETS.student_homework_card),
    defaultFilters: {},
    defaultGroupBy: ['student_name'],
    defaultSortBy: [{ key: 'submission_percentage', direction: 'asc' }],
    defaultFilterConfig: { student: true },
    dataSource: 'student_cards',
  },
  {
    key: 'class_homework_summary',
    name: 'Class Homework Summary',
    description: 'Summary report for each class',
    category: 'parent_communication',
    icon: 'FileText',
    columns: getColumns(COLUMN_SETS.class_homework_summary),
    defaultFilters: {},
    defaultGroupBy: [],
    defaultSortBy: [{ key: 'submission_rate', direction: 'asc' }],
    defaultFilterConfig: { dateRange: true },
    dataSource: 'class_summary',
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get template by key
 */
export const getTemplate = (key) => {
  return HOMEWORK_TEMPLATES.find(t => t.key === key);
};

/**
 * Get templates by category
 */
export const getTemplatesByCategory = (category) => {
  return HOMEWORK_TEMPLATES.filter(t => t.category === category);
};

/**
 * Get popular templates
 */
export const getPopularTemplates = () => {
  return HOMEWORK_TEMPLATES.filter(t => t.popular);
};

/**
 * Search templates by name or description
 */
export const searchTemplates = (query) => {
  const q = query.toLowerCase();
  return HOMEWORK_TEMPLATES.filter(t => 
    t.name.toLowerCase().includes(q) || 
    t.description.toLowerCase().includes(q)
  );
};

/**
 * Get template count by category
 */
export const getTemplateCounts = () => {
  return TEMPLATE_CATEGORIES.map(cat => ({
    ...cat,
    count: HOMEWORK_TEMPLATES.filter(t => t.category === cat.key).length
  }));
};

export default HOMEWORK_TEMPLATES;
