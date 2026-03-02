/**
 * Human Resource Report Generator - Template Definitions
 * Module 5: 40 HR Report Templates across 4 categories
 * 
 * Categories:
 * 1. Employee Data (12)
 * 2. Attendance & Leave (10)
 * 3. Payroll Reports (12)
 * 4. Other HR Reports (6)
 */

import { COLUMN_SETS, getColumns } from './columns';

// ═══════════════════════════════════════════════════════════════════════════════
// TEMPLATE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

export const HR_TEMPLATES = [
  // ─────────────────────────────────────────────────────────────────────────────
  // CATEGORY 1: EMPLOYEE DATA REPORTS (12)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'employee_master_list',
    name: 'Employee Master List',
    description: 'Complete list of all employees with basic details and employment status',
    category: 'employee_data',
    icon: '👥',
    columns: getColumns(COLUMN_SETS.employee_master_list),
    defaultFilters: {},
    defaultGroupBy: ['department'],
    defaultSortBy: [{ field: 'employee_name', direction: 'asc' }],
    aggregations: [],
    popular: true,
  },
  {
    id: 'contact_directory',
    name: 'Contact Directory',
    description: 'Staff contact information including phone, email and emergency contacts',
    category: 'employee_data',
    icon: '📱',
    columns: getColumns(COLUMN_SETS.contact_directory),
    defaultFilters: {},
    defaultGroupBy: ['department'],
    defaultSortBy: [{ field: 'employee_name', direction: 'asc' }],
    aggregations: [],
    popular: true,
  },
  {
    id: 'teaching_staff_list',
    name: 'Teaching Staff List',
    description: 'List of teaching staff with subject and class assignments',
    category: 'employee_data',
    icon: '👨‍🏫',
    columns: getColumns(COLUMN_SETS.teaching_staff_list),
    defaultFilters: { is_teaching_staff: true },
    defaultGroupBy: ['department'],
    defaultSortBy: [{ field: 'employee_name', direction: 'asc' }],
    aggregations: [],
    popular: true,
  },
  {
    id: 'non_teaching_staff_list',
    name: 'Non-Teaching Staff List',
    description: 'List of all non-teaching staff members',
    category: 'employee_data',
    icon: '👷',
    columns: getColumns(COLUMN_SETS.non_teaching_staff_list),
    defaultFilters: { is_teaching_staff: false },
    defaultGroupBy: ['staff_type'],
    defaultSortBy: [{ field: 'employee_name', direction: 'asc' }],
    aggregations: [],
  },
  {
    id: 'department_wise_list',
    name: 'Department-wise List',
    description: 'Employee list grouped by department',
    category: 'employee_data',
    icon: '🏢',
    columns: getColumns(COLUMN_SETS.department_wise_list),
    defaultFilters: {},
    defaultGroupBy: ['department'],
    defaultSortBy: [{ field: 'department', direction: 'asc' }, { field: 'employee_name', direction: 'asc' }],
    aggregations: [],
  },
  {
    id: 'designation_wise_report',
    name: 'Designation-wise Report',
    description: 'Employee list grouped by designation with experience and salary details',
    category: 'employee_data',
    icon: '🎯',
    columns: getColumns(COLUMN_SETS.designation_wise_report),
    defaultFilters: {},
    defaultGroupBy: ['designation'],
    defaultSortBy: [{ field: 'designation', direction: 'asc' }, { field: 'employee_name', direction: 'asc' }],
    aggregations: ['basic_salary'],
  },
  {
    id: 'qualification_report',
    name: 'Qualification Report',
    description: 'Staff qualifications, degrees and certifications',
    category: 'employee_data',
    icon: '🎓',
    columns: getColumns(COLUMN_SETS.qualification_report),
    defaultFilters: {},
    defaultGroupBy: ['highest_qualification'],
    defaultSortBy: [{ field: 'employee_name', direction: 'asc' }],
    aggregations: [],
  },
  {
    id: 'birthday_anniversary_report',
    name: 'Birthday & Anniversary Report',
    description: 'Upcoming birthdays and work anniversaries',
    category: 'employee_data',
    icon: '🎂',
    columns: getColumns(COLUMN_SETS.birthday_anniversary_report),
    defaultFilters: {},
    defaultGroupBy: ['month'],
    defaultSortBy: [{ field: 'date_of_birth', direction: 'asc' }],
    aggregations: [],
    popular: true,
  },
  {
    id: 'employee_id_card',
    name: 'Employee ID Card Data',
    description: 'Data required for generating employee ID cards',
    category: 'employee_data',
    icon: '🪪',
    columns: getColumns(COLUMN_SETS.employee_id_card),
    defaultFilters: { employment_status: 'active' },
    defaultGroupBy: ['department'],
    defaultSortBy: [{ field: 'employee_name', direction: 'asc' }],
    aggregations: [],
  },
  {
    id: 'address_list_report',
    name: 'Address List Report',
    description: 'Complete address details of all employees',
    category: 'employee_data',
    icon: '📍',
    columns: getColumns(COLUMN_SETS.address_list_report),
    defaultFilters: {},
    defaultGroupBy: ['city'],
    defaultSortBy: [{ field: 'employee_name', direction: 'asc' }],
    aggregations: [],
  },
  {
    id: 'bank_details_report',
    name: 'Bank Details Report',
    description: 'Employee bank account information for salary transfer',
    category: 'employee_data',
    icon: '🏦',
    columns: getColumns(COLUMN_SETS.bank_details_report),
    defaultFilters: {},
    defaultGroupBy: ['bank_name'],
    defaultSortBy: [{ field: 'employee_name', direction: 'asc' }],
    aggregations: [],
    popular: true,
  },
  {
    id: 'statutory_documents_report',
    name: 'Statutory Documents Report',
    description: 'Aadhaar, PAN, PF, UAN and ESI details of employees',
    category: 'employee_data',
    icon: '📋',
    columns: getColumns(COLUMN_SETS.statutory_documents_report),
    defaultFilters: {},
    defaultGroupBy: ['department'],
    defaultSortBy: [{ field: 'employee_name', direction: 'asc' }],
    aggregations: [],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // CATEGORY 2: ATTENDANCE & LEAVE REPORTS (10)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'daily_staff_attendance',
    name: 'Daily Staff Attendance',
    description: 'Daily attendance record with in/out times',
    category: 'attendance_leave',
    icon: '📅',
    columns: getColumns(COLUMN_SETS.daily_staff_attendance),
    defaultFilters: {},
    defaultGroupBy: ['department'],
    defaultSortBy: [{ field: 'attendance_date', direction: 'desc' }],
    aggregations: [],
    popular: true,
  },
  {
    id: 'monthly_attendance_summary',
    name: 'Monthly Attendance Summary',
    description: 'Monthly attendance summary with present, absent and leave days',
    category: 'attendance_leave',
    icon: '📊',
    columns: getColumns(COLUMN_SETS.monthly_attendance_summary),
    defaultFilters: {},
    defaultGroupBy: ['department'],
    defaultSortBy: [{ field: 'employee_name', direction: 'asc' }],
    aggregations: ['present_days', 'absent_days', 'half_days', 'late_days', 'working_days', 'payable_days'],
    popular: true,
  },
  {
    id: 'absentee_report',
    name: 'Absentee Report',
    description: 'List of absent employees for a given period',
    category: 'attendance_leave',
    icon: '🚫',
    columns: getColumns(COLUMN_SETS.absentee_report),
    defaultFilters: { attendance_status: 'absent' },
    defaultGroupBy: ['department'],
    defaultSortBy: [{ field: 'attendance_date', direction: 'desc' }],
    aggregations: [],
  },
  {
    id: 'late_coming_report',
    name: 'Late Coming Report',
    description: 'Employees who arrived late with frequency analysis',
    category: 'attendance_leave',
    icon: '⏰',
    columns: getColumns(COLUMN_SETS.late_coming_report),
    defaultFilters: {},
    defaultGroupBy: ['department'],
    defaultSortBy: [{ field: 'late_days', direction: 'desc' }],
    aggregations: ['late_days'],
  },
  {
    id: 'leave_balance_report',
    name: 'Leave Balance Report',
    description: 'Current leave balance for all employees by leave type',
    category: 'attendance_leave',
    icon: '⚖️',
    columns: getColumns(COLUMN_SETS.leave_balance_report),
    defaultFilters: {},
    defaultGroupBy: ['department'],
    defaultSortBy: [{ field: 'employee_name', direction: 'asc' }],
    aggregations: ['cl_balance', 'sl_balance', 'el_balance', 'total_leave_balance'],
    popular: true,
  },
  {
    id: 'leave_taken_report',
    name: 'Leave Taken Report',
    description: 'Summary of leaves taken by employees',
    category: 'attendance_leave',
    icon: '🏖️',
    columns: getColumns(COLUMN_SETS.leave_taken_report),
    defaultFilters: {},
    defaultGroupBy: ['leave_type'],
    defaultSortBy: [{ field: 'leave_from', direction: 'desc' }],
    aggregations: ['leave_days'],
  },
  {
    id: 'leave_application_status',
    name: 'Leave Application Status',
    description: 'Pending, approved and rejected leave applications',
    category: 'attendance_leave',
    icon: '📝',
    columns: getColumns(COLUMN_SETS.leave_application_status),
    defaultFilters: {},
    defaultGroupBy: ['leave_status'],
    defaultSortBy: [{ field: 'leave_application_date', direction: 'desc' }],
    aggregations: ['leave_days'],
  },
  {
    id: 'attendance_percentage_report',
    name: 'Attendance Percentage Report',
    description: 'Employee attendance percentages for performance review',
    category: 'attendance_leave',
    icon: '📈',
    columns: getColumns(COLUMN_SETS.attendance_percentage_report),
    defaultFilters: {},
    defaultGroupBy: ['department'],
    defaultSortBy: [{ field: 'attendance_percentage', direction: 'desc' }],
    aggregations: ['present_days', 'absent_days', 'working_days'],
  },
  {
    id: 'overtime_report',
    name: 'Overtime Report',
    description: 'Employee overtime hours and compensation',
    category: 'attendance_leave',
    icon: '⌛',
    columns: getColumns(COLUMN_SETS.overtime_report),
    defaultFilters: {},
    defaultGroupBy: ['department'],
    defaultSortBy: [{ field: 'overtime_hours', direction: 'desc' }],
    aggregations: ['overtime_hours', 'overtime'],
  },
  {
    id: 'biometric_attendance_log',
    name: 'Biometric Attendance Log',
    description: 'Raw biometric log data with punch in/out times',
    category: 'attendance_leave',
    icon: '👆',
    columns: getColumns(COLUMN_SETS.biometric_attendance_log),
    defaultFilters: {},
    defaultGroupBy: [],
    defaultSortBy: [{ field: 'attendance_date', direction: 'desc' }, { field: 'in_time', direction: 'asc' }],
    aggregations: [],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // CATEGORY 3: PAYROLL REPORTS (12)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'monthly_salary_register',
    name: 'Monthly Salary Register',
    description: 'Complete salary breakup with earnings and deductions',
    category: 'payroll',
    icon: '💰',
    columns: getColumns(COLUMN_SETS.monthly_salary_register),
    defaultFilters: {},
    defaultGroupBy: ['department'],
    defaultSortBy: [{ field: 'employee_name', direction: 'asc' }],
    aggregations: ['basic_salary', 'total_earnings', 'total_deductions', 'net_salary'],
    popular: true,
  },
  {
    id: 'salary_slip_summary',
    name: 'Salary Slip Summary',
    description: 'Summary view of salary slips for quick review',
    category: 'payroll',
    icon: '📃',
    columns: getColumns(COLUMN_SETS.salary_slip_summary),
    defaultFilters: {},
    defaultGroupBy: ['department'],
    defaultSortBy: [{ field: 'employee_name', direction: 'asc' }],
    aggregations: ['gross_salary', 'total_deductions', 'net_salary'],
    popular: true,
  },
  {
    id: 'pf_report',
    name: 'PF Report',
    description: 'Provident Fund contribution details for filing',
    category: 'payroll',
    icon: '🏛️',
    columns: getColumns(COLUMN_SETS.pf_report),
    defaultFilters: { pf_applicable: true },
    defaultGroupBy: [],
    defaultSortBy: [{ field: 'employee_name', direction: 'asc' }],
    aggregations: ['basic_salary', 'employee_pf', 'employer_pf', 'pf_deduction'],
    popular: true,
  },
  {
    id: 'esi_report',
    name: 'ESI Report',
    description: 'Employee State Insurance contribution details',
    category: 'payroll',
    icon: '🏥',
    columns: getColumns(COLUMN_SETS.esi_report),
    defaultFilters: { esi_applicable: true },
    defaultGroupBy: [],
    defaultSortBy: [{ field: 'employee_name', direction: 'asc' }],
    aggregations: ['gross_salary', 'employee_esi', 'employer_esi', 'esi_deduction'],
  },
  {
    id: 'professional_tax_report',
    name: 'Professional Tax Report',
    description: 'State-wise professional tax deduction report',
    category: 'payroll',
    icon: '📜',
    columns: getColumns(COLUMN_SETS.professional_tax_report),
    defaultFilters: {},
    defaultGroupBy: ['state'],
    defaultSortBy: [{ field: 'employee_name', direction: 'asc' }],
    aggregations: ['gross_salary', 'professional_tax'],
  },
  {
    id: 'tds_report',
    name: 'TDS Report',
    description: 'Income tax (TDS) deduction details for IT filing',
    category: 'payroll',
    icon: '📊',
    columns: getColumns(COLUMN_SETS.tds_report),
    defaultFilters: { tds_applicable: true },
    defaultGroupBy: [],
    defaultSortBy: [{ field: 'employee_name', direction: 'asc' }],
    aggregations: ['gross_salary', 'ctc', 'tds_deduction'],
    popular: true,
  },
  {
    id: 'bank_transfer_report',
    name: 'Bank Transfer Report',
    description: 'Salary transfer details for bank processing',
    category: 'payroll',
    icon: '💳',
    columns: getColumns(COLUMN_SETS.bank_transfer_report),
    defaultFilters: {},
    defaultGroupBy: ['bank_name'],
    defaultSortBy: [{ field: 'employee_name', direction: 'asc' }],
    aggregations: ['net_salary'],
    popular: true,
  },
  {
    id: 'loan_outstanding_report',
    name: 'Loan Outstanding Report',
    description: 'Employee loan balances and recovery schedule',
    category: 'payroll',
    icon: '🏠',
    columns: getColumns(COLUMN_SETS.loan_outstanding_report),
    defaultFilters: {},
    defaultGroupBy: ['loan_type'],
    defaultSortBy: [{ field: 'loan_balance', direction: 'desc' }],
    aggregations: ['loan_amount', 'loan_balance', 'emi_amount'],
  },
  {
    id: 'advance_payment_report',
    name: 'Advance Payment Report',
    description: 'Salary advance given and recovery status',
    category: 'payroll',
    icon: '💵',
    columns: getColumns(COLUMN_SETS.advance_payment_report),
    defaultFilters: {},
    defaultGroupBy: ['department'],
    defaultSortBy: [{ field: 'advance_balance', direction: 'desc' }],
    aggregations: ['advance_amount', 'advance_balance', 'advance_recovery'],
  },
  {
    id: 'salary_comparison_report',
    name: 'Salary Comparison Report',
    description: 'Compare current and previous salary with increments',
    category: 'payroll',
    icon: '📈',
    columns: getColumns(COLUMN_SETS.salary_comparison_report),
    defaultFilters: {},
    defaultGroupBy: ['department'],
    defaultSortBy: [{ field: 'increment_percentage', direction: 'desc' }],
    aggregations: [],
  },
  {
    id: 'department_salary_summary',
    name: 'Department-wise Salary Summary',
    description: 'Consolidated salary summary by department',
    category: 'payroll',
    icon: '🏢',
    columns: getColumns(COLUMN_SETS.department_salary_summary),
    defaultFilters: {},
    defaultGroupBy: [],
    defaultSortBy: [{ field: 'department', direction: 'asc' }],
    aggregations: ['employee_count', 'total_earnings', 'total_deductions', 'net_salary'],
  },
  {
    id: 'annual_salary_statement',
    name: 'Annual Salary Statement',
    description: 'Year-wise salary statement for income tax purposes',
    category: 'payroll',
    icon: '📅',
    columns: getColumns(COLUMN_SETS.annual_salary_statement),
    defaultFilters: {},
    defaultGroupBy: [],
    defaultSortBy: [{ field: 'employee_name', direction: 'asc' }],
    aggregations: ['ctc', 'gross_salary', 'total_earnings', 'total_deductions', 'pf_deduction', 'tds_deduction', 'net_salary'],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // CATEGORY 4: OTHER HR REPORTS (6)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'new_joinee_report',
    name: 'New Joinee Report',
    description: 'List of employees who recently joined',
    category: 'other_hr',
    icon: '🆕',
    columns: getColumns(COLUMN_SETS.new_joinee_report),
    defaultFilters: {},
    defaultGroupBy: ['department'],
    defaultSortBy: [{ field: 'joining_date', direction: 'desc' }],
    aggregations: [],
    popular: true,
  },
  {
    id: 'resignation_report',
    name: 'Resignation Report',
    description: 'Employees who resigned with exit details',
    category: 'other_hr',
    icon: '👋',
    columns: getColumns(COLUMN_SETS.resignation_report),
    defaultFilters: {},
    defaultGroupBy: ['separation_reason'],
    defaultSortBy: [{ field: 'resignation_date', direction: 'desc' }],
    aggregations: [],
  },
  {
    id: 'training_report',
    name: 'Training Report',
    description: 'Staff training and development records',
    category: 'other_hr',
    icon: '📚',
    columns: getColumns(COLUMN_SETS.training_report),
    defaultFilters: {},
    defaultGroupBy: ['training_type'],
    defaultSortBy: [{ field: 'training_from', direction: 'desc' }],
    aggregations: [],
  },
  {
    id: 'transfer_report',
    name: 'Transfer Report',
    description: 'Employee inter-branch and inter-department transfers',
    category: 'other_hr',
    icon: '🔄',
    columns: getColumns(COLUMN_SETS.transfer_report),
    defaultFilters: {},
    defaultGroupBy: ['to_branch'],
    defaultSortBy: [{ field: 'transfer_date', direction: 'desc' }],
    aggregations: [],
  },
  {
    id: 'service_certificate_data',
    name: 'Service Certificate Data',
    description: 'Data for generating service/experience certificates',
    category: 'other_hr',
    icon: '📜',
    columns: getColumns(COLUMN_SETS.service_certificate_data),
    defaultFilters: {},
    defaultGroupBy: [],
    defaultSortBy: [{ field: 'last_working_date', direction: 'desc' }],
    aggregations: [],
  },
  {
    id: 'employee_strength_analysis',
    name: 'Employee Strength Analysis',
    description: 'Headcount analysis by department and designation',
    category: 'other_hr',
    icon: '📊',
    columns: getColumns(COLUMN_SETS.employee_strength_analysis),
    defaultFilters: {},
    defaultGroupBy: ['department'],
    defaultSortBy: [{ field: 'employee_count', direction: 'desc' }],
    aggregations: ['employee_count', 'male_count', 'female_count', 'active_count'],
    popular: true,
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// CATEGORY DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

export const HR_CATEGORIES = [
  {
    id: 'employee_data',
    name: 'Employee Data',
    description: 'Employee master, contact, qualification and document reports',
    icon: '👥',
    color: 'blue',
    count: 12,
  },
  {
    id: 'attendance_leave',
    name: 'Attendance & Leave',
    description: 'Daily attendance, leave balance and attendance analysis',
    icon: '📅',
    color: 'green',
    count: 10,
  },
  {
    id: 'payroll',
    name: 'Payroll Reports',
    description: 'Salary, PF, ESI, TDS and other statutory reports',
    icon: '💰',
    color: 'orange',
    count: 12,
  },
  {
    id: 'other_hr',
    name: 'Other HR Reports',
    description: 'Joining, resignation, training and transfer reports',
    icon: '📋',
    color: 'purple',
    count: 6,
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get all templates
 * @returns {Object[]} - All HR templates
 */
export const getAllTemplates = () => HR_TEMPLATES;

/**
 * Get templates by category
 * @param {string} categoryId - Category ID
 * @returns {Object[]} - Templates in the category
 */
export const getTemplatesByCategory = (categoryId) => {
  return HR_TEMPLATES.filter(t => t.category === categoryId);
};

/**
 * Get popular templates
 * @returns {Object[]} - Popular templates
 */
export const getPopularTemplates = () => {
  return HR_TEMPLATES.filter(t => t.popular);
};

/**
 * Get template by ID
 * @param {string} templateId - Template ID
 * @returns {Object|undefined} - Template definition
 */
export const getTemplateById = (templateId) => {
  return HR_TEMPLATES.find(t => t.id === templateId);
};

/**
 * Search templates by name or description
 * @param {string} query - Search query
 * @returns {Object[]} - Matching templates
 */
export const searchTemplates = (query) => {
  const q = query.toLowerCase();
  return HR_TEMPLATES.filter(t => 
    t.name.toLowerCase().includes(q) || 
    t.description.toLowerCase().includes(q)
  );
};

/**
 * Get category by ID
 * @param {string} categoryId - Category ID
 * @returns {Object|undefined} - Category definition
 */
export const getCategoryById = (categoryId) => {
  return HR_CATEGORIES.find(c => c.id === categoryId);
};

/**
 * Get template count
 * @returns {number} - Total number of templates
 */
export const getTemplateCount = () => HR_TEMPLATES.length;

export default HR_TEMPLATES;
