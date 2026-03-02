/**
 * Examination Report Generator - Template Definitions
 * Module 4: 45 Examination Report Templates across 4 categories
 * 
 * Categories:
 * 1. Marks & Results (15)
 * 2. Comparative Analysis (10)
 * 3. Exam Administration (12)
 * 4. Reports for Parents/Students (8)
 */

import { getColumnsForSet } from './columns';

// ═══════════════════════════════════════════════════════════════════════════════
// TEMPLATE CATEGORIES
// ═══════════════════════════════════════════════════════════════════════════════

export const EXAMINATION_CATEGORIES = [
  {
    id: 'marks',
    name: 'Marks & Results',
    icon: '📊',
    description: 'Student marksheets, grade distribution, pass/fail analysis',
    count: 15
  },
  {
    id: 'comparative',
    name: 'Comparative Analysis',
    icon: '📈',
    description: 'Term comparison, year-on-year, teacher performance analysis',
    count: 10
  },
  {
    id: 'admin',
    name: 'Exam Administration',
    icon: '📋',
    description: 'Schedules, seating, hall tickets, marks entry status',
    count: 12
  },
  {
    id: 'parent',
    name: 'Parent/Student Reports',
    icon: '👨‍👩‍👧',
    description: 'Progress reports, rank certificates, teacher remarks',
    count: 8
  }
];

// ═══════════════════════════════════════════════════════════════════════════════
// TEMPLATE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

export const EXAMINATION_TEMPLATES = [
  // ─────────────────────────────────────────────────────────────────────────────
  // CATEGORY 1: MARKS & RESULTS (15)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'student_marksheet',
    name: 'Student Marksheet',
    description: 'Complete marksheet with subject-wise marks, grades, total & percentage',
    category: 'marks',
    icon: '📄',
    columns: getColumnsForSet('student_marksheet'),
    defaultFilters: { exam: 'current' },
    defaultGroupBy: ['student_name'],
    defaultSortBy: [{ field: 'roll_no', direction: 'asc' }],
    aggregations: ['max_marks', 'obtained_marks'],
    popular: true,
  },
  {
    id: 'class_result_summary',
    name: 'Class Result Summary',
    description: 'Subject-wise max, min, average marks with pass/fail percentage',
    category: 'marks',
    icon: '📊',
    columns: getColumnsForSet('class_result_summary'),
    defaultFilters: {},
    defaultGroupBy: ['subject_name'],
    defaultSortBy: [{ field: 'subject_name', direction: 'asc' }],
    aggregations: ['pass_count', 'fail_count'],
    popular: true,
  },
  {
    id: 'section_comparison',
    name: 'Section Comparison',
    description: 'Compare performance across sections - average, toppers, pass %',
    category: 'marks',
    icon: '🏆',
    columns: getColumnsForSet('section_comparison'),
    defaultFilters: {},
    defaultGroupBy: ['section_name'],
    defaultSortBy: [{ field: 'average_percentage', direction: 'desc' }],
    aggregations: ['student_count', 'toppers_count'],
    popular: true,
  },
  {
    id: 'subject_analysis',
    name: 'Subject-wise Analysis',
    description: 'Detailed subject analysis with pass/fail counts and averages',
    category: 'marks',
    icon: '📚',
    columns: getColumnsForSet('subject_analysis'),
    defaultFilters: {},
    defaultGroupBy: ['subject_name'],
    defaultSortBy: [{ field: 'avg_marks', direction: 'desc' }],
    aggregations: ['student_count', 'pass_count', 'fail_count'],
  },
  {
    id: 'grade_distribution',
    name: 'Grade Distribution',
    description: 'Distribution of grades (A+, A, B+, B, etc.) with count & percentage',
    category: 'marks',
    icon: '🎯',
    columns: getColumnsForSet('grade_distribution'),
    defaultFilters: {},
    defaultGroupBy: ['grade'],
    defaultSortBy: [{ field: 'grade', direction: 'asc' }],
    aggregations: ['student_count'],
  },
  {
    id: 'division_wise',
    name: 'Division-wise Result',
    description: 'Students grouped by division (First, Second, Third, Failed)',
    category: 'marks',
    icon: '🏅',
    columns: getColumnsForSet('division_wise'),
    defaultFilters: {},
    defaultGroupBy: ['division'],
    defaultSortBy: [{ field: 'division', direction: 'asc' }],
    aggregations: ['student_count'],
  },
  {
    id: 'marks_range_analysis',
    name: 'Marks Range Analysis',
    description: 'Students in marks ranges - 0-35, 35-50, 50-60, 60-75, 75-90, 90-100',
    category: 'marks',
    icon: '📉',
    columns: getColumnsForSet('marks_range'),
    defaultFilters: {},
    defaultGroupBy: [],
    defaultSortBy: [{ field: 'student_count', direction: 'desc' }],
    aggregations: ['student_count'],
  },
  {
    id: 'topper_list',
    name: 'Topper List',
    description: 'Top performing students ranked by total marks & percentage',
    category: 'marks',
    icon: '🥇',
    columns: getColumnsForSet('topper_list'),
    defaultFilters: { limit: 10 },
    defaultGroupBy: [],
    defaultSortBy: [{ field: 'rank', direction: 'asc' }],
    aggregations: [],
    popular: true,
  },
  {
    id: 'subject_toppers',
    name: 'Subject Toppers',
    description: 'Top 3 students for each subject with marks',
    category: 'marks',
    icon: '🌟',
    columns: getColumnsForSet('subject_toppers'),
    defaultFilters: {},
    defaultGroupBy: ['subject_name'],
    defaultSortBy: [{ field: 'subject_name', direction: 'asc' }, { field: 'rank', direction: 'asc' }],
    aggregations: [],
  },
  {
    id: 'failed_students',
    name: 'Failed Students List',
    description: 'Students who failed with their failed subjects list',
    category: 'marks',
    icon: '⚠️',
    columns: getColumnsForSet('failed_students'),
    defaultFilters: {},
    defaultGroupBy: ['class_name'],
    defaultSortBy: [{ field: 'class_name', direction: 'asc' }],
    aggregations: [],
  },
  {
    id: 'compartment_list',
    name: 'Compartment/Reappear',
    description: 'Students with compartment in subjects with marks required to pass',
    category: 'marks',
    icon: '📝',
    columns: getColumnsForSet('compartment_list'),
    defaultFilters: {},
    defaultGroupBy: ['compartment_subject'],
    defaultSortBy: [{ field: 'compartment_subject', direction: 'asc' }],
    aggregations: [],
  },
  {
    id: 'promoted_students',
    name: 'Promoted Students',
    description: 'List of students promoted to next class',
    category: 'marks',
    icon: '✅',
    columns: getColumnsForSet('promoted_students'),
    defaultFilters: {},
    defaultGroupBy: ['class_name'],
    defaultSortBy: [{ field: 'percentage', direction: 'desc' }],
    aggregations: [],
  },
  {
    id: 'detained_students',
    name: 'Detained Students',
    description: 'Students detained with reason and percentage',
    category: 'marks',
    icon: '🛑',
    columns: getColumnsForSet('detained_students'),
    defaultFilters: {},
    defaultGroupBy: ['class_name'],
    defaultSortBy: [{ field: 'class_name', direction: 'asc' }],
    aggregations: [],
  },
  {
    id: 'grace_marks_report',
    name: 'Grace Marks Given',
    description: 'Students given grace marks with original, grace & final marks',
    category: 'marks',
    icon: '🎁',
    columns: getColumnsForSet('grace_marks'),
    defaultFilters: {},
    defaultGroupBy: ['subject_name'],
    defaultSortBy: [{ field: 'subject_name', direction: 'asc' }],
    aggregations: ['grace_marks'],
  },
  {
    id: 'moderation_report',
    name: 'Marks Moderation Report',
    description: 'Subject-wise moderation analysis with original and moderated averages',
    category: 'marks',
    icon: '⚖️',
    columns: getColumnsForSet('moderation_report'),
    defaultFilters: {},
    defaultGroupBy: [],
    defaultSortBy: [{ field: 'subject_name', direction: 'asc' }],
    aggregations: ['change'],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // CATEGORY 2: COMPARATIVE ANALYSIS (10)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'term_comparison',
    name: 'Term Comparison',
    description: 'Compare student performance across Term 1, 2, 3 with average',
    category: 'comparative',
    icon: '📊',
    columns: getColumnsForSet('term_comparison'),
    defaultFilters: {},
    defaultGroupBy: ['class_name'],
    defaultSortBy: [{ field: 'average_percentage', direction: 'desc' }],
    aggregations: [],
    popular: true,
  },
  {
    id: 'year_on_year',
    name: 'Year-on-Year Performance',
    description: 'Compare class performance with last academic year',
    category: 'comparative',
    icon: '📈',
    columns: getColumnsForSet('year_on_year'),
    defaultFilters: {},
    defaultGroupBy: ['class_name'],
    defaultSortBy: [{ field: 'change_percentage', direction: 'desc' }],
    aggregations: [],
    popular: true,
  },
  {
    id: 'subject_improvement',
    name: 'Subject Improvement',
    description: 'Track student improvement in specific subjects',
    category: 'comparative',
    icon: '📈',
    columns: getColumnsForSet('subject_improvement'),
    defaultFilters: {},
    defaultGroupBy: ['student_name'],
    defaultSortBy: [{ field: 'change', direction: 'desc' }],
    aggregations: ['change'],
  },
  {
    id: 'consistency_report',
    name: 'Consistency Report',
    description: 'Identify consistently performing students across exams',
    category: 'comparative',
    icon: '📋',
    columns: getColumnsForSet('consistency_report'),
    defaultFilters: {},
    defaultGroupBy: ['class_name'],
    defaultSortBy: [{ field: 'variance', direction: 'asc' }],
    aggregations: [],
  },
  {
    id: 'teacher_performance',
    name: 'Teacher Performance',
    description: 'Evaluate teacher effectiveness based on student results',
    category: 'comparative',
    icon: '👨‍🏫',
    columns: getColumnsForSet('teacher_performance'),
    defaultFilters: {},
    defaultGroupBy: ['teacher_name'],
    defaultSortBy: [{ field: 'avg_result', direction: 'desc' }],
    aggregations: [],
    popular: true,
  },
  {
    id: 'section_trend',
    name: 'Section Performance Trend',
    description: 'Section-wise performance trend across examinations',
    category: 'comparative',
    icon: '📊',
    columns: getColumnsForSet('section_trend'),
    defaultFilters: {},
    defaultGroupBy: ['section_name'],
    defaultSortBy: [{ field: 'section_name', direction: 'asc' }],
    aggregations: [],
  },
  {
    id: 'gender_performance',
    name: 'Gender-wise Performance',
    description: 'Compare performance between male and female students',
    category: 'comparative',
    icon: '👫',
    columns: getColumnsForSet('gender_performance'),
    defaultFilters: {},
    defaultGroupBy: ['gender'],
    defaultSortBy: [{ field: 'average_percentage', direction: 'desc' }],
    aggregations: ['toppers_count'],
  },
  {
    id: 'category_performance',
    name: 'Category-wise Performance',
    description: 'Performance analysis by student category (General, OBC, SC, ST)',
    category: 'comparative',
    icon: '📊',
    columns: getColumnsForSet('category_performance'),
    defaultFilters: {},
    defaultGroupBy: ['category'],
    defaultSortBy: [{ field: 'average_percentage', direction: 'desc' }],
    aggregations: [],
  },
  {
    id: 'rte_performance',
    name: 'RTE Student Performance',
    description: 'RTE students performance compared with non-RTE',
    category: 'comparative',
    icon: '📚',
    columns: getColumnsForSet('rte_performance'),
    defaultFilters: {},
    defaultGroupBy: ['rte_status'],
    defaultSortBy: [{ field: 'average_percentage', direction: 'desc' }],
    aggregations: [],
  },
  {
    id: 'house_performance',
    name: 'House-wise Performance',
    description: 'Performance comparison across school houses',
    category: 'comparative',
    icon: '🏠',
    columns: getColumnsForSet('house_performance'),
    defaultFilters: {},
    defaultGroupBy: ['house_name'],
    defaultSortBy: [{ field: 'average_percentage', direction: 'desc' }],
    aggregations: [],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // CATEGORY 3: EXAM ADMINISTRATION (12)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'exam_schedule',
    name: 'Exam Schedule',
    description: 'Complete exam timetable with subjects, timings, rooms & invigilators',
    category: 'admin',
    icon: '📅',
    columns: getColumnsForSet('exam_schedule'),
    defaultFilters: {},
    defaultGroupBy: ['date'],
    defaultSortBy: [{ field: 'date', direction: 'asc' }, { field: 'start_time', direction: 'asc' }],
    aggregations: [],
    popular: true,
  },
  {
    id: 'seat_arrangement',
    name: 'Seat Arrangement',
    description: 'Room-wise seat allocation for students',
    category: 'admin',
    icon: '🪑',
    columns: getColumnsForSet('seat_arrangement'),
    defaultFilters: {},
    defaultGroupBy: ['room_no'],
    defaultSortBy: [{ field: 'room_no', direction: 'asc' }, { field: 'seat_no', direction: 'asc' }],
    aggregations: [],
  },
  {
    id: 'hall_ticket_status',
    name: 'Hall Ticket Status',
    description: 'Track hall ticket generation, download & print status',
    category: 'admin',
    icon: '🎫',
    columns: getColumnsForSet('hall_ticket_status'),
    defaultFilters: {},
    defaultGroupBy: ['class_name'],
    defaultSortBy: [{ field: 'class_name', direction: 'asc' }],
    aggregations: [],
    popular: true,
  },
  {
    id: 'invigilator_duty',
    name: 'Invigilator Duty Chart',
    description: 'Teacher-wise invigilator duty assignments',
    category: 'admin',
    icon: '👨‍🏫',
    columns: getColumnsForSet('invigilator_duty'),
    defaultFilters: {},
    defaultGroupBy: ['invigilator_name'],
    defaultSortBy: [{ field: 'date', direction: 'asc' }],
    aggregations: [],
  },
  {
    id: 'answer_sheet_distribution',
    name: 'Answer Sheet Distribution',
    description: 'Subject-wise answer sheet issue, usage & spoilage report',
    category: 'admin',
    icon: '📝',
    columns: getColumnsForSet('answer_sheet_distribution'),
    defaultFilters: {},
    defaultGroupBy: ['subject_name'],
    defaultSortBy: [{ field: 'subject_name', direction: 'asc' }],
    aggregations: ['sheets_issued', 'sheets_used', 'sheets_spoiled'],
  },
  {
    id: 'marks_entry_status',
    name: 'Marks Entry Status',
    description: 'Track marks entry progress - entered, pending, verified',
    category: 'admin',
    icon: '✍️',
    columns: getColumnsForSet('marks_entry_status'),
    defaultFilters: {},
    defaultGroupBy: ['class_name'],
    defaultSortBy: [{ field: 'class_name', direction: 'asc' }],
    aggregations: [],
    popular: true,
  },
  {
    id: 'entry_deadline',
    name: 'Entry vs Deadline',
    description: 'Compare marks entry date with deadline, track delays',
    category: 'admin',
    icon: '⏰',
    columns: getColumnsForSet('entry_deadline'),
    defaultFilters: {},
    defaultGroupBy: ['subject_name'],
    defaultSortBy: [{ field: 'delay_days', direction: 'desc' }],
    aggregations: ['delay_days'],
  },
  {
    id: 'verification_pending',
    name: 'Verification Pending',
    description: 'List entries awaiting verification',
    category: 'admin',
    icon: '🔍',
    columns: getColumnsForSet('verification_pending'),
    defaultFilters: { entry_status: 'pending_verification' },
    defaultGroupBy: ['class_name'],
    defaultSortBy: [{ field: 'class_name', direction: 'asc' }],
    aggregations: [],
  },
  {
    id: 'absent_in_exam',
    name: 'Absent in Exam',
    description: 'Students absent in exams with reasons and actions',
    category: 'admin',
    icon: '❌',
    columns: getColumnsForSet('absent_in_exam'),
    defaultFilters: {},
    defaultGroupBy: ['subject_name'],
    defaultSortBy: [{ field: 'subject_name', direction: 'asc' }],
    aggregations: [],
  },
  {
    id: 'unfair_means',
    name: 'Unfair Means Cases',
    description: 'UFM incidents with student details and actions taken',
    category: 'admin',
    icon: '🚫',
    columns: getColumnsForSet('unfair_means'),
    defaultFilters: {},
    defaultGroupBy: ['ufm_action'],
    defaultSortBy: [{ field: 'ufm_action', direction: 'asc' }],
    aggregations: [],
  },
  {
    id: 'reevaluation_requests',
    name: 'Re-evaluation Requests',
    description: 'Re-evaluation applications with original, reviewed marks & change',
    category: 'admin',
    icon: '🔄',
    columns: getColumnsForSet('reevaluation_requests'),
    defaultFilters: {},
    defaultGroupBy: ['subject_name'],
    defaultSortBy: [{ field: 'subject_name', direction: 'asc' }],
    aggregations: ['marks_change'],
  },
  {
    id: 'practical_exam_schedule',
    name: 'Practical Exam Schedule',
    description: 'Practical exam timetable with batches and examiners',
    category: 'admin',
    icon: '🔬',
    columns: getColumnsForSet('practical_exam_schedule'),
    defaultFilters: {},
    defaultGroupBy: ['subject_name'],
    defaultSortBy: [{ field: 'practical_date', direction: 'asc' }],
    aggregations: [],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // CATEGORY 4: PARENT/STUDENT REPORTS (8)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'progress_report',
    name: 'Progress Report Card',
    description: 'Complete progress report with subjects, grades, remarks & attendance',
    category: 'parent',
    icon: '📋',
    columns: getColumnsForSet('progress_report'),
    defaultFilters: {},
    defaultGroupBy: ['student_name'],
    defaultSortBy: [{ field: 'subject_name', direction: 'asc' }],
    aggregations: [],
    popular: true,
  },
  {
    id: 'cumulative_report',
    name: 'Cumulative Report',
    description: 'All exams combined with overall grade and CGPA',
    category: 'parent',
    icon: '📊',
    columns: getColumnsForSet('cumulative_report'),
    defaultFilters: {},
    defaultGroupBy: ['student_name'],
    defaultSortBy: [{ field: 'exam_name', direction: 'asc' }],
    aggregations: [],
    popular: true,
  },
  {
    id: 'rank_certificate',
    name: 'Rank Certificate Data',
    description: 'Rank, percentage & total students for certification',
    category: 'parent',
    icon: '🏆',
    columns: getColumnsForSet('rank_certificate'),
    defaultFilters: {},
    defaultGroupBy: [],
    defaultSortBy: [{ field: 'rank', direction: 'asc' }],
    aggregations: [],
  },
  {
    id: 'subject_progress',
    name: 'Subject-wise Progress',
    description: 'Subject performance across all exams with trend visualization',
    category: 'parent',
    icon: '📈',
    columns: getColumnsForSet('subject_progress'),
    defaultFilters: {},
    defaultGroupBy: ['subject_name'],
    defaultSortBy: [{ field: 'subject_name', direction: 'asc' }],
    aggregations: [],
  },
  {
    id: 'cocurricular_grades',
    name: 'Co-curricular Grades',
    description: 'Activity grades with teacher remarks',
    category: 'parent',
    icon: '🎨',
    columns: getColumnsForSet('cocurricular_grades'),
    defaultFilters: {},
    defaultGroupBy: ['activity_name'],
    defaultSortBy: [{ field: 'activity_name', direction: 'asc' }],
    aggregations: [],
  },
  {
    id: 'behavior_grades',
    name: 'Behavior/Discipline Grade',
    description: 'Behavioral and discipline assessment grades',
    category: 'parent',
    icon: '⭐',
    columns: getColumnsForSet('behavior_grades'),
    defaultFilters: {},
    defaultGroupBy: ['parameter'],
    defaultSortBy: [{ field: 'parameter', direction: 'asc' }],
    aggregations: [],
  },
  {
    id: 'teacher_remarks_report',
    name: 'Teacher Remarks Report',
    description: 'Subject teacher remarks for student',
    category: 'parent',
    icon: '💬',
    columns: getColumnsForSet('teacher_remarks_report'),
    defaultFilters: {},
    defaultGroupBy: ['subject_name'],
    defaultSortBy: [{ field: 'subject_name', direction: 'asc' }],
    aggregations: [],
  },
  {
    id: 'parent_meeting',
    name: 'Parent Meeting Report',
    description: 'Parent-teacher meeting discussion points and action items',
    category: 'parent',
    icon: '🤝',
    columns: getColumnsForSet('parent_meeting'),
    defaultFilters: {},
    defaultGroupBy: [],
    defaultSortBy: [{ field: 'meeting_date', direction: 'desc' }],
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
  return EXAMINATION_TEMPLATES.find(t => t.id === id);
};

/**
 * Get templates by category
 */
export const getTemplatesByCategory = (category) => {
  return EXAMINATION_TEMPLATES.filter(t => t.category === category);
};

/**
 * Get popular templates
 */
export const getPopularTemplates = () => {
  return EXAMINATION_TEMPLATES.filter(t => t.popular);
};

/**
 * Get category info
 */
export const getCategoryInfo = (categoryId) => {
  return EXAMINATION_CATEGORIES.find(c => c.id === categoryId);
};

/**
 * Search templates
 */
export const searchTemplates = (query) => {
  const q = query.toLowerCase();
  return EXAMINATION_TEMPLATES.filter(t => 
    t.name.toLowerCase().includes(q) ||
    t.description.toLowerCase().includes(q) ||
    t.category.toLowerCase().includes(q)
  );
};

/**
 * Get template count
 */
export const getTemplateCount = () => {
  return EXAMINATION_TEMPLATES.length;
};

export default {
  EXAMINATION_TEMPLATES,
  EXAMINATION_CATEGORIES,
  getTemplateById,
  getTemplatesByCategory,
  getPopularTemplates,
  getCategoryInfo,
  searchTemplates,
  getTemplateCount
};
