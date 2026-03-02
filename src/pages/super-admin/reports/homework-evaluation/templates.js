/**
 * Homework Evaluation Report Generator - Template Definitions
 * Day 7 - 8 Day Master Plan
 * 25 pre-built templates across 3 categories
 */

import { HOMEWORK_EVAL_COLUMNS, COLUMN_SETS, getColumns } from './columns';

// ═══════════════════════════════════════════════════════════════════════════════
// TEMPLATE CATEGORIES
// ═══════════════════════════════════════════════════════════════════════════════

export const TEMPLATE_CATEGORIES = [
  { key: 'evaluation_status', label: 'Evaluation Status', icon: 'ClipboardCheck', color: 'emerald' },
  { key: 'grades_analysis', label: 'Grades & Analysis', icon: 'BarChart3', color: 'violet' },
  { key: 'feedback_communication', label: 'Feedback & Communication', icon: 'MessageSquare', color: 'amber' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// HOMEWORK EVALUATION TEMPLATES - 25 Templates
// ═══════════════════════════════════════════════════════════════════════════════

export const HOMEWORK_EVAL_TEMPLATES = [
  // ─────────────────────────────────────────────────────────────────────────────
  // EVALUATION STATUS (10 Templates)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    key: 'pending_evaluation',
    name: 'Pending Evaluation',
    description: 'Homework submissions awaiting evaluation',
    category: 'evaluation_status',
    icon: 'Clock',
    popular: true,
    columns: getColumns(COLUMN_SETS.pending_evaluation),
    defaultFilters: { evaluation_status: 'Pending' },
    defaultGroupBy: ['class_name'],
    defaultSortBy: [{ key: 'submission_date', direction: 'asc' }],
    defaultFilterConfig: { dateRange: true, class: true, subject: true },
    dataSource: 'pending_evaluation',
  },
  {
    key: 'evaluation_progress',
    name: 'Evaluation Progress',
    description: 'Track evaluation progress across classes',
    category: 'evaluation_status',
    icon: 'TrendingUp',
    popular: true,
    columns: getColumns(COLUMN_SETS.evaluation_progress),
    defaultFilters: {},
    defaultGroupBy: ['evaluator_name'],
    defaultSortBy: [{ key: 'evaluation_percentage', direction: 'asc' }],
    defaultFilterConfig: { dateRange: true },
    dataSource: 'evaluation_progress',
  },
  {
    key: 'teacher_evaluation_status',
    name: 'Teacher-wise Evaluation Status',
    description: 'Evaluation statistics by teacher',
    category: 'evaluation_status',
    icon: 'User',
    columns: getColumns(COLUMN_SETS.teacher_evaluation_status),
    defaultFilters: {},
    defaultGroupBy: [],
    defaultSortBy: [{ key: 'pending_evaluation', direction: 'desc' }],
    defaultFilterConfig: { teacher: true },
    dataSource: 'teacher_eval_status',
  },
  {
    key: 'overdue_evaluations',
    name: 'Overdue Evaluations',
    description: 'Evaluations past expected completion date',
    category: 'evaluation_status',
    icon: 'AlertTriangle',
    popular: true,
    columns: getColumns(COLUMN_SETS.overdue_evaluations),
    defaultFilters: { evaluation_delayed_by_min: 1 },
    defaultGroupBy: ['teacher_name'],
    defaultSortBy: [{ key: 'evaluation_delayed_by', direction: 'desc' }],
    dataSource: 'overdue_evaluations',
  },
  {
    key: 'evaluation_timeline',
    name: 'Evaluation Timeline',
    description: 'Timeline from assignment to evaluation',
    category: 'evaluation_status',
    icon: 'Calendar',
    columns: getColumns(COLUMN_SETS.evaluation_timeline),
    defaultFilters: {},
    defaultGroupBy: ['homework_title'],
    defaultSortBy: [{ key: 'evaluation_date', direction: 'desc' }],
    defaultFilterConfig: { dateRange: true },
    dataSource: 'eval_timeline',
  },
  {
    key: 'daily_evaluation_count',
    name: 'Daily Evaluation Count',
    description: 'Day-wise evaluation statistics',
    category: 'evaluation_status',
    icon: 'CalendarDays',
    columns: getColumns(COLUMN_SETS.daily_evaluation_count),
    defaultFilters: {},
    defaultGroupBy: ['evaluation_date'],
    defaultSortBy: [{ key: 'evaluation_date', direction: 'desc' }],
    defaultFilterConfig: { dateRange: true },
    dataSource: 'daily_eval',
  },
  {
    key: 'subject_evaluation_status',
    name: 'Subject-wise Evaluation Status',
    description: 'Evaluation status grouped by subject',
    category: 'evaluation_status',
    icon: 'BookOpen',
    columns: getColumns(COLUMN_SETS.subject_evaluation_status),
    defaultFilters: {},
    defaultGroupBy: [],
    defaultSortBy: [{ key: 'evaluation_percentage', direction: 'asc' }],
    defaultFilterConfig: { class: true },
    dataSource: 'subject_eval_status',
  },
  {
    key: 'class_evaluation_summary',
    name: 'Class-wise Evaluation Summary',
    description: 'Evaluation summary by class',
    category: 'evaluation_status',
    icon: 'Users',
    columns: getColumns(COLUMN_SETS.class_evaluation_summary),
    defaultFilters: {},
    defaultGroupBy: [],
    defaultSortBy: [{ key: 'evaluation_percentage', direction: 'asc' }],
    defaultFilterConfig: { dateRange: true },
    dataSource: 'class_eval_summary',
  },
  {
    key: 'evaluation_speed',
    name: 'Evaluation Speed Report',
    description: 'How quickly teachers complete evaluations',
    category: 'evaluation_status',
    icon: 'Zap',
    columns: getColumns(COLUMN_SETS.evaluation_speed),
    defaultFilters: {},
    defaultGroupBy: [],
    defaultSortBy: [{ key: 'days_to_evaluate', direction: 'desc' }],
    defaultFilterConfig: { teacher: true },
    dataSource: 'eval_speed',
  },
  {
    key: 'batch_evaluation_status',
    name: 'Batch Evaluation Status',
    description: 'Status of batch evaluations',
    category: 'evaluation_status',
    icon: 'Layers',
    columns: getColumns(COLUMN_SETS.batch_evaluation_status),
    defaultFilters: {},
    defaultGroupBy: ['evaluation_status'],
    defaultSortBy: [{ key: 'homework_id', direction: 'desc' }],
    dataSource: 'batch_eval',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // GRADES & ANALYSIS (10 Templates)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    key: 'grade_report',
    name: 'Grade Report',
    description: 'Student grades for homework',
    category: 'grades_analysis',
    icon: 'FileText',
    popular: true,
    columns: getColumns(COLUMN_SETS.grade_report),
    defaultFilters: {},
    defaultGroupBy: ['class_name'],
    defaultSortBy: [{ key: 'marks_percentage', direction: 'desc' }],
    defaultFilterConfig: { class: true, subject: true, student: true },
    dataSource: 'grades',
  },
  {
    key: 'class_marks_summary',
    name: 'Class Marks Summary',
    description: 'Marks summary by class',
    category: 'grades_analysis',
    icon: 'BarChart3',
    popular: true,
    columns: getColumns(COLUMN_SETS.class_marks_summary),
    defaultFilters: {},
    defaultGroupBy: ['class_name'],
    defaultSortBy: [{ key: 'class_average', direction: 'desc' }],
    defaultFilterConfig: { class: true },
    dataSource: 'class_marks',
  },
  {
    key: 'subject_performance',
    name: 'Subject Performance Analysis',
    description: 'Performance analysis by subject',
    category: 'grades_analysis',
    icon: 'BookOpen',
    columns: getColumns(COLUMN_SETS.subject_performance),
    defaultFilters: {},
    defaultGroupBy: [],
    defaultSortBy: [{ key: 'class_average', direction: 'desc' }],
    defaultFilterConfig: { subject: true },
    dataSource: 'subject_performance',
  },
  {
    key: 'grade_distribution',
    name: 'Grade Distribution',
    description: 'Distribution of grades across homework',
    category: 'grades_analysis',
    icon: 'PieChart',
    columns: getColumns(COLUMN_SETS.grade_distribution),
    defaultFilters: {},
    defaultGroupBy: ['homework_title'],
    defaultSortBy: [{ key: 'homework_title', direction: 'asc' }],
    defaultFilterConfig: { class: true },
    dataSource: 'grade_distribution',
  },
  {
    key: 'top_performers',
    name: 'Top Performers',
    description: 'Students with highest performance',
    category: 'grades_analysis',
    icon: 'Award',
    popular: true,
    columns: getColumns(COLUMN_SETS.top_performers),
    defaultFilters: { overall_percentage_min: 80 },
    defaultGroupBy: ['class_name'],
    defaultSortBy: [{ key: 'student_average', direction: 'desc' }],
    defaultFilterConfig: { class: true },
    dataSource: 'top_performers',
  },
  {
    key: 'low_performers',
    name: 'Low Performers',
    description: 'Students needing improvement',
    category: 'grades_analysis',
    icon: 'AlertCircle',
    columns: getColumns(COLUMN_SETS.low_performers),
    defaultFilters: { overall_percentage_max: 50 },
    defaultGroupBy: ['class_name'],
    defaultSortBy: [{ key: 'student_average', direction: 'asc' }],
    defaultFilterConfig: { class: true },
    dataSource: 'low_performers',
  },
  {
    key: 'student_progress',
    name: 'Student Progress Report',
    description: 'Track student progress over time',
    category: 'grades_analysis',
    icon: 'TrendingUp',
    columns: getColumns(COLUMN_SETS.student_progress),
    defaultFilters: {},
    defaultGroupBy: ['student_name'],
    defaultSortBy: [{ key: 'score_change_percent', direction: 'desc' }],
    defaultFilterConfig: { student: true },
    dataSource: 'student_progress',
  },
  {
    key: 'comparative_analysis',
    name: 'Comparative Analysis',
    description: 'Compare student vs class performance',
    category: 'grades_analysis',
    icon: 'Scale',
    columns: getColumns(COLUMN_SETS.comparative_analysis),
    defaultFilters: {},
    defaultGroupBy: ['class_name'],
    defaultSortBy: [{ key: 'percentile', direction: 'desc' }],
    defaultFilterConfig: { class: true },
    dataSource: 'comparative',
  },
  {
    key: 'performance_trends',
    name: 'Performance Trends',
    description: 'Track performance trends',
    category: 'grades_analysis',
    icon: 'LineChart',
    columns: getColumns(COLUMN_SETS.performance_trends),
    defaultFilters: {},
    defaultGroupBy: ['trend'],
    defaultSortBy: [{ key: 'overall_percentage', direction: 'desc' }],
    defaultFilterConfig: { month: true },
    dataSource: 'performance_trends',
  },
  {
    key: 'marks_vs_attendance',
    name: 'Marks vs Homework Completion',
    description: 'Correlation between completion and marks',
    category: 'grades_analysis',
    icon: 'GitCompare',
    columns: getColumns(COLUMN_SETS.marks_vs_attendance),
    defaultFilters: {},
    defaultGroupBy: ['class_name'],
    defaultSortBy: [{ key: 'overall_percentage', direction: 'desc' }],
    defaultFilterConfig: { class: true },
    dataSource: 'marks_completion',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // FEEDBACK & COMMUNICATION (5 Templates)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    key: 'feedback_report',
    name: 'Feedback Report',
    description: 'All feedback provided to students',
    category: 'feedback_communication',
    icon: 'MessageSquare',
    popular: true,
    columns: getColumns(COLUMN_SETS.feedback_report),
    defaultFilters: {},
    defaultGroupBy: ['homework_title'],
    defaultSortBy: [{ key: 'student_name', direction: 'asc' }],
    defaultFilterConfig: { class: true },
    dataSource: 'feedback',
  },
  {
    key: 'feedback_pending',
    name: 'Pending Feedback',
    description: 'Evaluated homework without feedback',
    category: 'feedback_communication',
    icon: 'Clock',
    columns: getColumns(COLUMN_SETS.feedback_pending),
    defaultFilters: { feedback_sent: false, is_evaluated: true },
    defaultGroupBy: ['homework_title'],
    defaultSortBy: [{ key: 'evaluation_date', direction: 'asc' }],
    dataSource: 'feedback_pending',
  },
  {
    key: 'parent_notification_status',
    name: 'Parent Notification Status',
    description: 'Track parent notifications for results',
    category: 'feedback_communication',
    icon: 'Bell',
    columns: getColumns(COLUMN_SETS.parent_notification_status),
    defaultFilters: {},
    defaultGroupBy: ['homework_title'],
    defaultSortBy: [{ key: 'parent_viewed_result', direction: 'asc' }],
    defaultFilterConfig: { class: true },
    dataSource: 'parent_notifications',
  },
  {
    key: 'student_progress_card',
    name: 'Student Progress Card',
    description: 'Individual student progress summary',
    category: 'feedback_communication',
    icon: 'IdCard',
    popular: true,
    columns: getColumns(COLUMN_SETS.student_progress_card),
    defaultFilters: {},
    defaultGroupBy: ['class_name'],
    defaultSortBy: [{ key: 'overall_percentage', direction: 'desc' }],
    defaultFilterConfig: { student: true },
    dataSource: 'progress_card',
  },
  {
    key: 'revaluation_requests',
    name: 'Revaluation Requests',
    description: 'Track revaluation requests',
    category: 'feedback_communication',
    icon: 'RefreshCw',
    columns: getColumns(COLUMN_SETS.revaluation_requests),
    defaultFilters: { revaluation_requested: true },
    defaultGroupBy: ['revaluation_status'],
    defaultSortBy: [{ key: 'student_name', direction: 'asc' }],
    dataSource: 'revaluation',
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get template by key
 */
export const getTemplate = (key) => {
  return HOMEWORK_EVAL_TEMPLATES.find(t => t.key === key);
};

/**
 * Get templates by category
 */
export const getTemplatesByCategory = (category) => {
  return HOMEWORK_EVAL_TEMPLATES.filter(t => t.category === category);
};

/**
 * Get popular templates
 */
export const getPopularTemplates = () => {
  return HOMEWORK_EVAL_TEMPLATES.filter(t => t.popular);
};

/**
 * Search templates by name or description
 */
export const searchTemplates = (query) => {
  const q = query.toLowerCase();
  return HOMEWORK_EVAL_TEMPLATES.filter(t => 
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
    count: HOMEWORK_EVAL_TEMPLATES.filter(t => t.category === cat.key).length
  }));
};

export default HOMEWORK_EVAL_TEMPLATES;
