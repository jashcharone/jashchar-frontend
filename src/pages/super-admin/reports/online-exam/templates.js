/**
 * Online Exam Report Generator - Template Definitions
 * Module 12: 30 Online Exam Report Templates across 3 categories
 * 
 * Categories:
 * 1. Exam Setup (10)
 * 2. Attempt & Result (12)
 * 3. Technical & Analytics (8)
 */

import { getColumnsForSet } from './columns';

// ═══════════════════════════════════════════════════════════════════════════════
// TEMPLATE CATEGORIES
// ═══════════════════════════════════════════════════════════════════════════════

export const ONLINE_EXAM_CATEGORIES = [
  {
    id: 'setup',
    name: 'Exam Setup',
    icon: '📝',
    description: 'Exam configurations, question banks, schedules, templates',
    count: 10
  },
  {
    id: 'result',
    name: 'Attempt & Result',
    icon: '📊',
    description: 'Student results, question analysis, time tracking, comparisons',
    count: 12
  },
  {
    id: 'technical',
    name: 'Technical & Analytics',
    icon: '🔧',
    description: 'Device usage, proctoring, IP logs, server performance',
    count: 8
  }
];

// ═══════════════════════════════════════════════════════════════════════════════
// TEMPLATE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

export const ONLINE_EXAM_TEMPLATES = [
  // ─────────────────────────────────────────────────────────────────────────────
  // CATEGORY 1: EXAM SETUP (10)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'online_exam_list',
    name: 'Online Exam List',
    description: 'Complete list of online exams with subject, class, date, duration',
    category: 'setup',
    icon: '📋',
    columns: getColumnsForSet('online_exam_list'),
    defaultFilters: {},
    defaultGroupBy: ['subject_name'],
    defaultSortBy: [{ field: 'exam_date', direction: 'desc' }],
    aggregations: ['total_questions', 'total_marks'],
    popular: true,
  },
  {
    id: 'question_bank_summary',
    name: 'Question Bank Summary',
    description: 'Subject & chapter-wise question count and usage statistics',
    category: 'setup',
    icon: '📚',
    columns: getColumnsForSet('question_bank_summary'),
    defaultFilters: {},
    defaultGroupBy: ['subject_name'],
    defaultSortBy: [{ field: 'subject_name', direction: 'asc' }],
    aggregations: ['total_questions', 'questions_used'],
    popular: true,
  },
  {
    id: 'exam_schedule_calendar',
    name: 'Exam Schedule Calendar',
    description: 'Calendar view of scheduled online exams with timings',
    category: 'setup',
    icon: '📅',
    columns: getColumnsForSet('exam_schedule_calendar'),
    defaultFilters: { month: 'current' },
    defaultGroupBy: ['exam_date'],
    defaultSortBy: [{ field: 'exam_date', direction: 'asc' }],
    aggregations: ['registered_count'],
  },
  {
    id: 'active_exams',
    name: 'Active Exams',
    description: 'Currently running exams with live attempt status',
    category: 'setup',
    icon: '▶️',
    columns: getColumnsForSet('active_exams'),
    defaultFilters: { exam_status: 'active' },
    defaultGroupBy: [],
    defaultSortBy: [{ field: 'exam_name', direction: 'asc' }],
    aggregations: ['student_count'],
    popular: true,
  },
  {
    id: 'upcoming_exams',
    name: 'Upcoming Exams',
    description: 'Scheduled exams with registration count',
    category: 'setup',
    icon: '🔜',
    columns: getColumnsForSet('upcoming_exams'),
    defaultFilters: { exam_status: 'upcoming' },
    defaultGroupBy: [],
    defaultSortBy: [{ field: 'exam_date', direction: 'asc' }],
    aggregations: ['registered_count'],
  },
  {
    id: 'exam_configuration',
    name: 'Exam Configuration',
    description: 'Exam settings - duration, questions, marks, negative marking',
    category: 'setup',
    icon: '⚙️',
    columns: getColumnsForSet('exam_configuration'),
    defaultFilters: {},
    defaultGroupBy: ['subject_name'],
    defaultSortBy: [{ field: 'exam_name', direction: 'asc' }],
    aggregations: [],
  },
  {
    id: 'question_type_analysis',
    name: 'Question Type Analysis',
    description: 'Distribution of question types (MCQ, Fill, Match, etc.)',
    category: 'setup',
    icon: '❓',
    columns: getColumnsForSet('question_type_analysis'),
    defaultFilters: {},
    defaultGroupBy: ['question_type'],
    defaultSortBy: [{ field: 'total_questions', direction: 'desc' }],
    aggregations: ['total_questions'],
  },
  {
    id: 'difficulty_level_mix',
    name: 'Difficulty Level Mix',
    description: 'Easy, medium, hard question distribution per exam',
    category: 'setup',
    icon: '📊',
    columns: getColumnsForSet('difficulty_level_mix'),
    defaultFilters: {},
    defaultGroupBy: [],
    defaultSortBy: [{ field: 'exam_name', direction: 'asc' }],
    aggregations: ['easy_count', 'medium_count', 'hard_count'],
  },
  {
    id: 'exam_practice_tests',
    name: 'Exam vs Practice Tests',
    description: 'Comparison of actual exams and practice tests',
    category: 'setup',
    icon: '📝',
    columns: getColumnsForSet('exam_practice_tests'),
    defaultFilters: {},
    defaultGroupBy: ['exam_type'],
    defaultSortBy: [{ field: 'exam_count', direction: 'desc' }],
    aggregations: ['exam_count'],
  },
  {
    id: 'exam_template_library',
    name: 'Exam Template Library',
    description: 'Reusable exam templates with usage count',
    category: 'setup',
    icon: '📑',
    columns: getColumnsForSet('exam_template_library'),
    defaultFilters: {},
    defaultGroupBy: ['subject_name'],
    defaultSortBy: [{ field: 'times_used', direction: 'desc' }],
    aggregations: ['times_used'],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // CATEGORY 2: ATTEMPT & RESULT (12)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'exam_attendance',
    name: 'Exam Attendance',
    description: 'Registered vs Attempted vs Absent for each exam',
    category: 'result',
    icon: '✅',
    columns: getColumnsForSet('exam_attendance'),
    defaultFilters: {},
    defaultGroupBy: ['exam_name'],
    defaultSortBy: [{ field: 'exam_name', direction: 'asc' }],
    aggregations: ['registered_count', 'student_count'],
    popular: true,
  },
  {
    id: 'student_result',
    name: 'Student-wise Result',
    description: 'Individual student results with marks, percentage & rank',
    category: 'result',
    icon: '📄',
    columns: getColumnsForSet('student_result'),
    defaultFilters: {},
    defaultGroupBy: ['class_name'],
    defaultSortBy: [{ field: 'rank', direction: 'asc' }],
    aggregations: ['marks_obtained'],
    popular: true,
  },
  {
    id: 'class_result',
    name: 'Class-wise Result',
    description: 'Class performance summary with average & pass percentage',
    category: 'result',
    icon: '🏫',
    columns: getColumnsForSet('class_result'),
    defaultFilters: {},
    defaultGroupBy: ['class_name'],
    defaultSortBy: [{ field: 'pass_percentage', direction: 'desc' }],
    aggregations: ['student_count'],
    popular: true,
  },
  {
    id: 'subject_performance',
    name: 'Subject-wise Performance',
    description: 'Subject performance across all online exams',
    category: 'result',
    icon: '📚',
    columns: getColumnsForSet('subject_performance'),
    defaultFilters: {},
    defaultGroupBy: ['subject_name'],
    defaultSortBy: [{ field: 'avg_marks', direction: 'desc' }],
    aggregations: ['exam_count'],
  },
  {
    id: 'question_analysis',
    name: 'Question-wise Analysis',
    description: 'Per-question correct, wrong, skipped percentage',
    category: 'result',
    icon: '❓',
    columns: getColumnsForSet('question_analysis'),
    defaultFilters: {},
    defaultGroupBy: [],
    defaultSortBy: [{ field: 'question_no', direction: 'asc' }],
    aggregations: [],
  },
  {
    id: 'difficult_questions',
    name: 'Difficult Questions',
    description: 'Questions with lowest correct percentage',
    category: 'result',
    icon: '🎯',
    columns: getColumnsForSet('difficult_questions'),
    defaultFilters: {},
    defaultGroupBy: ['topic'],
    defaultSortBy: [{ field: 'correct_percentage', direction: 'asc' }],
    aggregations: [],
  },
  {
    id: 'time_analysis',
    name: 'Time Analysis',
    description: 'Time taken per student with average per question',
    category: 'result',
    icon: '⏱️',
    columns: getColumnsForSet('time_analysis'),
    defaultFilters: {},
    defaultGroupBy: [],
    defaultSortBy: [{ field: 'time_taken_minutes', direction: 'asc' }],
    aggregations: [],
  },
  {
    id: 'early_submission',
    name: 'Early Submission',
    description: 'Students who submitted before time with marks',
    category: 'result',
    icon: '⚡',
    columns: getColumnsForSet('early_submission'),
    defaultFilters: {},
    defaultGroupBy: [],
    defaultSortBy: [{ field: 'time_taken_minutes', direction: 'asc' }],
    aggregations: [],
  },
  {
    id: 'multiple_attempts',
    name: 'Multiple Attempts',
    description: 'Compare marks across multiple attempts per student',
    category: 'result',
    icon: '🔄',
    columns: getColumnsForSet('multiple_attempts'),
    defaultFilters: {},
    defaultGroupBy: [],
    defaultSortBy: [{ field: 'best_marks', direction: 'desc' }],
    aggregations: [],
  },
  {
    id: 'incomplete_exams',
    name: 'Incomplete Exams',
    description: 'Students with incomplete exams and reasons',
    category: 'result',
    icon: '⚠️',
    columns: getColumnsForSet('incomplete_exams'),
    defaultFilters: {},
    defaultGroupBy: ['incomplete_reason'],
    defaultSortBy: [{ field: 'student_name', direction: 'asc' }],
    aggregations: [],
  },
  {
    id: 'reexam_list',
    name: 'Re-exam List',
    description: 'Students who took re-exam with marks comparison',
    category: 'result',
    icon: '📝',
    columns: getColumnsForSet('reexam_list'),
    defaultFilters: {},
    defaultGroupBy: [],
    defaultSortBy: [{ field: 'marks_change', direction: 'desc' }],
    aggregations: ['marks_change'],
  },
  {
    id: 'result_comparison',
    name: 'Result Comparison',
    description: 'Compare student results across multiple exams',
    category: 'result',
    icon: '📈',
    columns: getColumnsForSet('result_comparison'),
    defaultFilters: {},
    defaultGroupBy: [],
    defaultSortBy: [{ field: 'student_name', direction: 'asc' }],
    aggregations: [],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // CATEGORY 3: TECHNICAL & ANALYTICS (8)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'device_usage',
    name: 'Device Usage',
    description: 'Device type, OS, browser statistics for exams',
    category: 'technical',
    icon: '💻',
    columns: getColumnsForSet('device_usage'),
    defaultFilters: {},
    defaultGroupBy: ['device_type'],
    defaultSortBy: [{ field: 'device_count', direction: 'desc' }],
    aggregations: ['device_count'],
    popular: true,
  },
  {
    id: 'technical_issues',
    name: 'Technical Issues',
    description: 'Technical problems faced during exams with resolution status',
    category: 'technical',
    icon: '🔧',
    columns: getColumnsForSet('technical_issues'),
    defaultFilters: {},
    defaultGroupBy: ['issue_type'],
    defaultSortBy: [{ field: 'issue_time', direction: 'desc' }],
    aggregations: ['issue_count'],
  },
  {
    id: 'proctoring_violations',
    name: 'Proctoring Violations',
    description: 'Exam proctoring violations with student details',
    category: 'technical',
    icon: '🚫',
    columns: getColumnsForSet('proctoring_violations'),
    defaultFilters: {},
    defaultGroupBy: ['violation_type'],
    defaultSortBy: [{ field: 'violation_time', direction: 'desc' }],
    aggregations: ['violation_count'],
    popular: true,
  },
  {
    id: 'tab_switch_report',
    name: 'Tab Switch Report',
    description: 'Tab switches and time away during exam',
    category: 'technical',
    icon: '🔀',
    columns: getColumnsForSet('tab_switch_report'),
    defaultFilters: {},
    defaultGroupBy: [],
    defaultSortBy: [{ field: 'tab_switches', direction: 'desc' }],
    aggregations: ['tab_switches', 'time_away_seconds'],
  },
  {
    id: 'copy_paste_attempts',
    name: 'Copy-Paste Attempts',
    description: 'Copy/paste attempts detected during exam',
    category: 'technical',
    icon: '📋',
    columns: getColumnsForSet('copy_paste_attempts'),
    defaultFilters: {},
    defaultGroupBy: ['attempt_type'],
    defaultSortBy: [{ field: 'copy_attempts', direction: 'desc' }],
    aggregations: ['copy_attempts', 'paste_attempts'],
  },
  {
    id: 'ip_address_log',
    name: 'IP Address Log',
    description: 'Student IP addresses and location validation',
    category: 'technical',
    icon: '🌐',
    columns: getColumnsForSet('ip_address_log'),
    defaultFilters: {},
    defaultGroupBy: ['location'],
    defaultSortBy: [{ field: 'student_name', direction: 'asc' }],
    aggregations: [],
  },
  {
    id: 'peak_load_report',
    name: 'Peak Load Report',
    description: 'Server load and response time during peak usage',
    category: 'technical',
    icon: '📊',
    columns: getColumnsForSet('peak_load_report'),
    defaultFilters: {},
    defaultGroupBy: [],
    defaultSortBy: [{ field: 'max_concurrent', direction: 'desc' }],
    aggregations: [],
  },
  {
    id: 'bandwidth_usage',
    name: 'Bandwidth Usage',
    description: 'Data usage per exam with peak bandwidth',
    category: 'technical',
    icon: '📶',
    columns: getColumnsForSet('bandwidth_usage'),
    defaultFilters: {},
    defaultGroupBy: [],
    defaultSortBy: [{ field: 'total_data_mb', direction: 'desc' }],
    aggregations: [],
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get template by ID
 */
export const getTemplateById = (id) => {
  return ONLINE_EXAM_TEMPLATES.find(t => t.id === id);
};

/**
 * Get templates by category
 */
export const getTemplatesByCategory = (category) => {
  return ONLINE_EXAM_TEMPLATES.filter(t => t.category === category);
};

/**
 * Get popular templates
 */
export const getPopularTemplates = () => {
  return ONLINE_EXAM_TEMPLATES.filter(t => t.popular);
};

/**
 * Get category info
 */
export const getCategoryInfo = (categoryId) => {
  return ONLINE_EXAM_CATEGORIES.find(c => c.id === categoryId);
};

/**
 * Search templates
 */
export const searchTemplates = (query) => {
  const q = query.toLowerCase();
  return ONLINE_EXAM_TEMPLATES.filter(t => 
    t.name.toLowerCase().includes(q) ||
    t.description.toLowerCase().includes(q) ||
    t.category.toLowerCase().includes(q)
  );
};

/**
 * Get template count
 */
export const getTemplateCount = () => {
  return ONLINE_EXAM_TEMPLATES.length;
};

export default {
  ONLINE_EXAM_TEMPLATES,
  ONLINE_EXAM_CATEGORIES,
  getTemplateById,
  getTemplatesByCategory,
  getPopularTemplates,
  getCategoryInfo,
  searchTemplates,
  getTemplateCount
};
