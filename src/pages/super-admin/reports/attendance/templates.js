/**
 * Attendance Report Templates
 * 35 Pre-built templates organized by category
 */

import { getColumns, COLUMN_SETS } from './columns';

// Template Categories
export const TEMPLATE_CATEGORIES = {
  DAILY: 'Daily Attendance',
  PERIOD_SUBJECT: 'Period/Subject Wise',
  MONTHLY: 'Monthly Analysis',
  DEFAULTERS: 'Defaulters & Alerts',
  STAFF: 'Staff Attendance'
};

// All Templates
export const ATTENDANCE_TEMPLATES = [
  // ═══════════════════════════════════════════════════════════════════════════════
  // CATEGORY 1: DAILY ATTENDANCE (8 Reports)
  // ═══════════════════════════════════════════════════════════════════════════════
  {
    key: 'daily_attendance_basic',
    name: 'Daily Attendance - Basic',
    category: TEMPLATE_CATEGORIES.DAILY,
    description: 'Simple daily attendance mark list',
    columns: getColumns(['admission_number', 'full_name', 'class.name', 'section.name', 'attendance_date', 'status']),
    defaultFilters: { date: 'today' },
    defaultGroupBy: ['class.name'],
    defaultSortBy: [{ field: 'roll_number', direction: 'asc' }]
  },
  {
    key: 'daily_attendance_detailed',
    name: 'Daily Attendance - Detailed',
    category: TEMPLATE_CATEGORIES.DAILY,
    description: 'Full attendance with check-in/out times',
    columns: getColumns(['admission_number', 'full_name', 'class.name', 'section.name', 'attendance_date', 'status', 'check_in_time', 'check_out_time', 'late_minutes', 'remarks']),
    defaultFilters: { date: 'today' },
    defaultGroupBy: ['class.name'],
    defaultSortBy: [{ field: 'class.name', direction: 'asc' }]
  },
  {
    key: 'class_wise_daily',
    name: 'Class-wise Daily Register',
    category: TEMPLATE_CATEGORIES.DAILY,
    description: 'Attendance register grouped by class',
    columns: getColumns(['roll_number', 'full_name', 'gender', 'status', 'check_in_time', 'remarks']),
    defaultFilters: { date: 'today' },
    defaultGroupBy: ['class.name', 'section.name'],
    defaultSortBy: [{ field: 'roll_number', direction: 'asc' }],
    defaultFilterConfig: { class: true, section: true, date: true }
  },
  {
    key: 'absentees_today',
    name: "Today's Absentees",
    category: TEMPLATE_CATEGORIES.DAILY,
    description: 'List of students absent today',
    columns: getColumns(['admission_number', 'full_name', 'class.name', 'section.name', 'father_name', 'father_phone', 'absence_reason']),
    defaultFilters: { date: 'today', status: 'absent' },
    defaultGroupBy: ['class.name'],
    defaultSortBy: []
  },
  {
    key: 'late_arrivals_today',
    name: "Today's Late Arrivals",
    category: TEMPLATE_CATEGORIES.DAILY,
    description: 'Students who came late today',
    columns: getColumns(['admission_number', 'full_name', 'class.name', 'section.name', 'check_in_time', 'late_minutes', 'remarks']),
    defaultFilters: { date: 'today', status: 'late' },
    defaultGroupBy: ['class.name'],
    defaultSortBy: [{ field: 'late_minutes', direction: 'desc' }]
  },
  {
    key: 'half_day_list',
    name: 'Half Day Students',
    category: TEMPLATE_CATEGORIES.DAILY,
    description: 'Students with half-day attendance',
    columns: getColumns(['admission_number', 'full_name', 'class.name', 'section.name', 'attendance_date', 'check_in_time', 'check_out_time', 'remarks']),
    defaultFilters: { status: 'half_day' },
    defaultGroupBy: ['class.name'],
    defaultSortBy: []
  },
  {
    key: 'attendance_summary_day',
    name: 'Daily Summary Report',
    category: TEMPLATE_CATEGORIES.DAILY,
    description: 'Day-wise summary with present/absent counts',
    columns: getColumns(['class.name', 'section.name', 'working_days', 'days_present', 'days_absent', 'attendance_percentage']),
    defaultFilters: { date: 'today' },
    defaultGroupBy: [],
    defaultSortBy: [{ field: 'class.name', direction: 'asc' }]
  },
  {
    key: 'attendance_marked_by',
    name: 'Attendance Marked By Report',
    category: TEMPLATE_CATEGORIES.DAILY,
    description: 'Show who marked attendance for each class',
    columns: getColumns(['class.name', 'section.name', 'attendance_date', 'marked_by', 'days_present', 'days_absent']),
    defaultFilters: {},
    defaultGroupBy: ['marked_by'],
    defaultSortBy: []
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // CATEGORY 2: PERIOD/SUBJECT WISE (6 Reports)
  // ═══════════════════════════════════════════════════════════════════════════════
  {
    key: 'period_wise_attendance',
    name: 'Period-wise Attendance',
    category: TEMPLATE_CATEGORIES.PERIOD_SUBJECT,
    description: 'Attendance for each period of the day',
    columns: getColumns(['admission_number', 'full_name', 'class.name', 'period_number', 'subject.name', 'period_status']),
    defaultFilters: { date: 'today' },
    defaultGroupBy: ['period_number'],
    defaultSortBy: [{ field: 'period_number', direction: 'asc' }]
  },
  {
    key: 'subject_wise_attendance',
    name: 'Subject-wise Attendance',
    category: TEMPLATE_CATEGORIES.PERIOD_SUBJECT,
    description: 'Attendance grouped by subject',
    columns: getColumns(['admission_number', 'full_name', 'class.name', 'subject.name', 'subject.code', 'days_present', 'days_absent', 'attendance_percentage']),
    defaultFilters: {},
    defaultGroupBy: ['subject.name'],
    defaultSortBy: []
  },
  {
    key: 'teacher_wise_attendance',
    name: 'Teacher-wise Attendance Report',
    category: TEMPLATE_CATEGORIES.PERIOD_SUBJECT,
    description: 'Attendance marked by each teacher',
    columns: getColumns(['class.name', 'section.name', 'subject.name', 'teacher.name', 'attendance_date', 'days_present', 'days_absent']),
    defaultFilters: {},
    defaultGroupBy: ['teacher.name'],
    defaultSortBy: []
  },
  {
    key: 'period_absent_list',
    name: 'Period-wise Absent List',
    category: TEMPLATE_CATEGORIES.PERIOD_SUBJECT,
    description: 'Students absent in specific periods',
    columns: getColumns(['admission_number', 'full_name', 'class.name', 'period_number', 'subject.name', 'teacher.name']),
    defaultFilters: { period_status: 'absent' },
    defaultGroupBy: ['period_number'],
    defaultSortBy: []
  },
  {
    key: 'subject_attendance_summary',
    name: 'Subject Attendance Summary',
    category: TEMPLATE_CATEGORIES.PERIOD_SUBJECT,
    description: 'Overall attendance percentage per subject',
    columns: getColumns(['subject.name', 'subject.code', 'teacher.name', 'working_days', 'days_present', 'attendance_percentage']),
    defaultFilters: {},
    defaultGroupBy: [],
    defaultSortBy: [{ field: 'attendance_percentage', direction: 'asc' }]
  },
  {
    key: 'lab_attendance',
    name: 'Lab/Practical Attendance',
    category: TEMPLATE_CATEGORIES.PERIOD_SUBJECT,
    description: 'Attendance for lab and practical sessions',
    columns: getColumns(['admission_number', 'full_name', 'class.name', 'subject.name', 'attendance_date', 'period_status', 'remarks']),
    defaultFilters: { subject_type: 'practical' },
    defaultGroupBy: ['subject.name'],
    defaultSortBy: []
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // CATEGORY 3: MONTHLY ANALYSIS (7 Reports)
  // ═══════════════════════════════════════════════════════════════════════════════
  {
    key: 'monthly_attendance_summary',
    name: 'Monthly Attendance Summary',
    category: TEMPLATE_CATEGORIES.MONTHLY,
    description: 'Month-wise attendance for all students',
    columns: getColumns(['admission_number', 'full_name', 'class.name', 'section.name', 'month', 'working_days', 'days_present', 'days_absent', 'attendance_percentage']),
    defaultFilters: {},
    defaultGroupBy: ['class.name'],
    defaultSortBy: [{ field: 'attendance_percentage', direction: 'asc' }],
    defaultFilterConfig: { month: true }
  },
  {
    key: 'monthly_class_summary',
    name: 'Monthly Class-wise Summary',
    category: TEMPLATE_CATEGORIES.MONTHLY,
    description: 'Class-wise attendance percentage per month',
    columns: getColumns(['class.name', 'section.name', 'month', 'working_days', 'days_present', 'days_absent', 'attendance_percentage']),
    defaultFilters: {},
    defaultGroupBy: [],
    defaultSortBy: [{ field: 'class.name', direction: 'asc' }]
  },
  {
    key: 'below_75_percentage',
    name: 'Below 75% Attendance',
    category: TEMPLATE_CATEGORIES.MONTHLY,
    description: 'Students with attendance below 75%',
    columns: getColumns(['admission_number', 'full_name', 'class.name', 'section.name', 'working_days', 'days_present', 'attendance_percentage', 'father_phone']),
    defaultFilters: { attendance_below: 75 },
    defaultGroupBy: ['class.name'],
    defaultSortBy: [{ field: 'attendance_percentage', direction: 'asc' }]
  },
  {
    key: 'above_90_percentage',
    name: 'Above 90% Attendance',
    category: TEMPLATE_CATEGORIES.MONTHLY,
    description: 'Students with excellent attendance (>90%)',
    columns: getColumns(['admission_number', 'full_name', 'class.name', 'section.name', 'working_days', 'days_present', 'attendance_percentage']),
    defaultFilters: { attendance_above: 90 },
    defaultGroupBy: ['class.name'],
    defaultSortBy: [{ field: 'attendance_percentage', direction: 'desc' }]
  },
  {
    key: 'late_arrival_analysis',
    name: 'Late Arrival Analysis',
    category: TEMPLATE_CATEGORIES.MONTHLY,
    description: 'Monthly late arrival patterns',
    columns: getColumns(['admission_number', 'full_name', 'class.name', 'section.name', 'month', 'days_late', 'total_late', 'attendance_percentage']),
    defaultFilters: {},
    defaultGroupBy: ['class.name'],
    defaultSortBy: [{ field: 'days_late', direction: 'desc' }]
  },
  {
    key: 'yearly_attendance_report',
    name: 'Yearly Attendance Report',
    category: TEMPLATE_CATEGORIES.MONTHLY,
    description: 'Full year attendance summary',
    columns: getColumns(['admission_number', 'full_name', 'class.name', 'section.name', 'total_working_days', 'total_present', 'total_absent', 'total_late', 'overall_percentage']),
    defaultFilters: {},
    defaultGroupBy: ['class.name'],
    defaultSortBy: [{ field: 'overall_percentage', direction: 'asc' }]
  },
  {
    key: 'attendance_trend_report',
    name: 'Attendance Trend Analysis',
    category: TEMPLATE_CATEGORIES.MONTHLY,
    description: 'Month-over-month attendance trends',
    columns: getColumns(['class.name', 'month', 'year', 'working_days', 'days_present', 'attendance_percentage']),
    defaultFilters: {},
    defaultGroupBy: ['month'],
    defaultSortBy: [{ field: 'month', direction: 'asc' }]
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // CATEGORY 4: DEFAULTERS & ALERTS (6 Reports)
  // ═══════════════════════════════════════════════════════════════════════════════
  {
    key: 'consecutive_absence_alert',
    name: 'Consecutive Absence Alert',
    category: TEMPLATE_CATEGORIES.DEFAULTERS,
    description: 'Students absent for 3+ consecutive days',
    columns: getColumns(['admission_number', 'full_name', 'class.name', 'section.name', 'consecutive_absent', 'last_absent_date', 'father_name', 'father_phone', 'parent_notified']),
    defaultFilters: { consecutive_days: 3 },
    defaultGroupBy: ['class.name'],
    defaultSortBy: [{ field: 'consecutive_absent', direction: 'desc' }]
  },
  {
    key: 'chronic_absentees',
    name: 'Chronic Absentees List',
    category: TEMPLATE_CATEGORIES.DEFAULTERS,
    description: 'Students frequently absent',
    columns: getColumns(['admission_number', 'full_name', 'class.name', 'section.name', 'days_absent', 'attendance_percentage', 'father_phone', 'mother_phone']),
    defaultFilters: { attendance_below: 60 },
    defaultGroupBy: ['class.name'],
    defaultSortBy: [{ field: 'attendance_percentage', direction: 'asc' }]
  },
  {
    key: 'parent_notification_pending',
    name: 'Parent Notification Pending',
    category: TEMPLATE_CATEGORIES.DEFAULTERS,
    description: 'Absentees whose parents not yet notified',
    columns: getColumns(['admission_number', 'full_name', 'class.name', 'section.name', 'consecutive_absent', 'last_absent_date', 'father_phone', 'parent_notified']),
    defaultFilters: { parent_notified: 'No' },
    defaultGroupBy: ['class.name'],
    defaultSortBy: [{ field: 'consecutive_absent', direction: 'desc' }]
  },
  {
    key: 'late_habituals',
    name: 'Habitual Late Comers',
    category: TEMPLATE_CATEGORIES.DEFAULTERS,
    description: 'Students frequently coming late',
    columns: getColumns(['admission_number', 'full_name', 'class.name', 'section.name', 'days_late', 'total_late', 'attendance_percentage', 'father_phone']),
    defaultFilters: { late_days_above: 5 },
    defaultGroupBy: ['class.name'],
    defaultSortBy: [{ field: 'days_late', direction: 'desc' }]
  },
  {
    key: 'attendance_warning_list',
    name: 'Attendance Warning List',
    category: TEMPLATE_CATEGORIES.DEFAULTERS,
    description: 'Students at risk of falling below minimum attendance',
    columns: getColumns(['admission_number', 'full_name', 'class.name', 'section.name', 'working_days', 'days_present', 'attendance_percentage', 'father_phone']),
    defaultFilters: { attendance_between: [65, 75] },
    defaultGroupBy: ['class.name'],
    defaultSortBy: [{ field: 'attendance_percentage', direction: 'asc' }]
  },
  {
    key: 'medical_leave_report',
    name: 'Medical Leave Report',
    category: TEMPLATE_CATEGORIES.DEFAULTERS,
    description: 'Students on medical leave',
    columns: getColumns(['admission_number', 'full_name', 'class.name', 'section.name', 'attendance_date', 'leave_days', 'absence_reason', 'remarks']),
    defaultFilters: { status: 'leave', leave_type: 'medical' },
    defaultGroupBy: ['class.name'],
    defaultSortBy: []
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // CATEGORY 5: STAFF ATTENDANCE (8 Reports)
  // ═══════════════════════════════════════════════════════════════════════════════
  {
    key: 'staff_daily_attendance',
    name: 'Staff Daily Attendance',
    category: TEMPLATE_CATEGORIES.STAFF,
    description: 'Daily attendance for all staff members',
    columns: getColumns(['employee_id', 'staff_name', 'department', 'designation', 'attendance_date', 'status', 'staff_check_in', 'staff_check_out']),
    defaultFilters: { date: 'today' },
    defaultGroupBy: ['department'],
    defaultSortBy: [{ field: 'staff_name', direction: 'asc' }]
  },
  {
    key: 'staff_monthly_summary',
    name: 'Staff Monthly Summary',
    category: TEMPLATE_CATEGORIES.STAFF,
    description: 'Monthly attendance summary for staff',
    columns: getColumns(['employee_id', 'staff_name', 'department', 'designation', 'working_days', 'days_present', 'days_absent', 'days_late', 'attendance_percentage']),
    defaultFilters: {},
    defaultGroupBy: ['department'],
    defaultSortBy: [{ field: 'attendance_percentage', direction: 'asc' }],
    defaultFilterConfig: { month: true }
  },
  {
    key: 'staff_absent_today',
    name: 'Staff Absent Today',
    category: TEMPLATE_CATEGORIES.STAFF,
    description: 'Staff members absent today',
    columns: getColumns(['employee_id', 'staff_name', 'department', 'designation', 'attendance_date', 'absence_reason']),
    defaultFilters: { date: 'today', status: 'absent' },
    defaultGroupBy: ['department'],
    defaultSortBy: []
  },
  {
    key: 'staff_late_arrivals',
    name: 'Staff Late Arrivals',
    category: TEMPLATE_CATEGORIES.STAFF,
    description: 'Staff who arrived late',
    columns: getColumns(['employee_id', 'staff_name', 'department', 'designation', 'attendance_date', 'staff_check_in', 'late_minutes']),
    defaultFilters: { status: 'late' },
    defaultGroupBy: ['department'],
    defaultSortBy: [{ field: 'late_minutes', direction: 'desc' }]
  },
  {
    key: 'staff_overtime_report',
    name: 'Staff Overtime Report',
    category: TEMPLATE_CATEGORIES.STAFF,
    description: 'Overtime hours worked by staff',
    columns: getColumns(['employee_id', 'staff_name', 'department', 'designation', 'attendance_date', 'staff_check_in', 'staff_check_out', 'overtime_hours']),
    defaultFilters: { has_overtime: true },
    defaultGroupBy: ['department'],
    defaultSortBy: [{ field: 'overtime_hours', direction: 'desc' }]
  },
  {
    key: 'department_attendance',
    name: 'Department-wise Attendance',
    category: TEMPLATE_CATEGORIES.STAFF,
    description: 'Attendance summary by department',
    columns: getColumns(['department', 'working_days', 'days_present', 'days_absent', 'attendance_percentage']),
    defaultFilters: {},
    defaultGroupBy: [],
    defaultSortBy: [{ field: 'department', direction: 'asc' }]
  },
  {
    key: 'teaching_staff_attendance',
    name: 'Teaching Staff Attendance',
    category: TEMPLATE_CATEGORIES.STAFF,
    description: 'Attendance for teaching staff only',
    columns: getColumns(['employee_id', 'staff_name', 'department', 'designation', 'working_days', 'days_present', 'days_absent', 'attendance_percentage']),
    defaultFilters: { staff_type: 'teaching' },
    defaultGroupBy: ['department'],
    defaultSortBy: []
  },
  {
    key: 'non_teaching_attendance',
    name: 'Non-Teaching Staff Attendance',
    category: TEMPLATE_CATEGORIES.STAFF,
    description: 'Attendance for non-teaching staff',
    columns: getColumns(['employee_id', 'staff_name', 'department', 'designation', 'working_days', 'days_present', 'days_absent', 'attendance_percentage']),
    defaultFilters: { staff_type: 'non_teaching' },
    defaultGroupBy: ['department'],
    defaultSortBy: []
  }
];

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

// Get template by key
export const getTemplate = (key) => ATTENDANCE_TEMPLATES.find(t => t.key === key);

// Get templates by category
export const getTemplatesByCategory = (category) => 
  ATTENDANCE_TEMPLATES.filter(t => t.category === category);

// Get all categories with templates
export const getCategorizedTemplates = () => {
  const categories = {};
  ATTENDANCE_TEMPLATES.forEach(t => {
    if (!categories[t.category]) {
      categories[t.category] = [];
    }
    categories[t.category].push(t);
  });
  return categories;
};

// Get template count
export const getTemplateCount = () => ATTENDANCE_TEMPLATES.length;

export default ATTENDANCE_TEMPLATES;
