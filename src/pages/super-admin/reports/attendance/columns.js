/**
 * Attendance Report Columns Configuration
 * All possible columns for attendance reports
 */

import { formatDate, formatTime } from '@/utils/dateUtils';

// ═══════════════════════════════════════════════════════════════════════════════
// ATTENDANCE COLUMNS - 60+ Fields
// ═══════════════════════════════════════════════════════════════════════════════

export const ATTENDANCE_COLUMNS = [
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // STUDENT INFO
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    key: 'enrollment_id',
    label: 'Enroll ID',
    type: 'string',
    category: 'Student Info',
    sortable: true,
    filterable: true,
    width: 100
  },
  {
    key: 'full_name',
    label: 'Student Name',
    type: 'computed',
    category: 'Student Info',
    sortable: true,
    render: (_, row) => `${row.first_name || ''} ${row.last_name || ''}`.trim()
  },
  {
    key: 'roll_number',
    label: 'Roll No',
    type: 'string',
    category: 'Student Info',
    sortable: true,
    width: 80
  },
  {
    key: 'class.name',
    label: 'Class',
    type: 'string',
    category: 'Student Info',
    sortable: true,
    filterable: true
  },
  {
    key: 'section.name',
    label: 'Section',
    type: 'string',
    category: 'Student Info',
    sortable: true,
    filterable: true
  },
  {
    key: 'gender',
    label: 'Gender',
    type: 'badge',
    category: 'Student Info',
    filterable: true,
    badgeColors: {
      'Male': 'bg-blue-100 text-blue-700',
      'Female': 'bg-pink-100 text-pink-700'
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // DAILY ATTENDANCE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    key: 'attendance_date',
    label: 'Date',
    type: 'date',
    category: 'Daily Attendance',
    sortable: true,
    filterable: true,
    render: (v) => formatDate(v)
  },
  {
    key: 'status',
    label: 'Status',
    type: 'badge',
    category: 'Daily Attendance',
    sortable: true,
    filterable: true,
    badgeColors: {
      'present': 'bg-green-100 text-green-700',
      'absent': 'bg-red-100 text-red-700',
      'late': 'bg-yellow-100 text-yellow-700',
      'half_day': 'bg-orange-100 text-orange-700',
      'leave': 'bg-purple-100 text-purple-700',
      'holiday': 'bg-gray-100 text-gray-700'
    }
  },
  {
    key: 'check_in_time',
    label: 'Check In',
    type: 'time',
    category: 'Daily Attendance',
    sortable: true,
    render: (v) => v ? formatTime(v) : '-'
  },
  {
    key: 'check_out_time',
    label: 'Check Out',
    type: 'time',
    category: 'Daily Attendance',
    sortable: true,
    render: (v) => v ? formatTime(v) : '-'
  },
  {
    key: 'late_minutes',
    label: 'Late (mins)',
    type: 'number',
    category: 'Daily Attendance',
    sortable: true,
    render: (v) => v > 0 ? `${v} min` : '-'
  },
  {
    key: 'remarks',
    label: 'Remarks',
    type: 'string',
    category: 'Daily Attendance'
  },
  {
    key: 'marked_by',
    label: 'Marked By',
    type: 'string',
    category: 'Daily Attendance'
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PERIOD/SUBJECT ATTENDANCE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    key: 'period_number',
    label: 'Period',
    type: 'number',
    category: 'Period Attendance',
    sortable: true,
    filterable: true
  },
  {
    key: 'subject.name',
    label: 'Subject',
    type: 'string',
    category: 'Period Attendance',
    sortable: true,
    filterable: true
  },
  {
    key: 'subject.code',
    label: 'Subject Code',
    type: 'string',
    category: 'Period Attendance'
  },
  {
    key: 'teacher.name',
    label: 'Teacher',
    type: 'string',
    category: 'Period Attendance',
    sortable: true
  },
  {
    key: 'period_status',
    label: 'Period Status',
    type: 'badge',
    category: 'Period Attendance',
    badgeColors: {
      'present': 'bg-green-100 text-green-700',
      'absent': 'bg-red-100 text-red-700',
      'excused': 'bg-blue-100 text-blue-700'
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // MONTHLY SUMMARY
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    key: 'month',
    label: 'Month',
    type: 'string',
    category: 'Monthly Summary',
    sortable: true,
    filterable: true
  },
  {
    key: 'year',
    label: 'Year',
    type: 'number',
    category: 'Monthly Summary',
    filterable: true
  },
  {
    key: 'working_days',
    label: 'Working Days',
    type: 'number',
    category: 'Monthly Summary',
    sortable: true
  },
  {
    key: 'days_present',
    label: 'Days Present',
    type: 'number',
    category: 'Monthly Summary',
    sortable: true
  },
  {
    key: 'days_absent',
    label: 'Days Absent',
    type: 'number',
    category: 'Monthly Summary',
    sortable: true
  },
  {
    key: 'days_late',
    label: 'Days Late',
    type: 'number',
    category: 'Monthly Summary',
    sortable: true
  },
  {
    key: 'half_days',
    label: 'Half Days',
    type: 'number',
    category: 'Monthly Summary',
    sortable: true
  },
  {
    key: 'leave_days',
    label: 'Leave Days',
    type: 'number',
    category: 'Monthly Summary',
    sortable: true
  },
  {
    key: 'attendance_percentage',
    label: 'Attendance %',
    type: 'percentage',
    category: 'Monthly Summary',
    sortable: true,
    render: (v) => `${(v || 0).toFixed(1)}%`
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // YEARLY SUMMARY
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    key: 'total_working_days',
    label: 'Total Working Days',
    type: 'number',
    category: 'Yearly Summary',
    sortable: true
  },
  {
    key: 'total_present',
    label: 'Total Present',
    type: 'number',
    category: 'Yearly Summary',
    sortable: true
  },
  {
    key: 'total_absent',
    label: 'Total Absent',
    type: 'number',
    category: 'Yearly Summary',
    sortable: true
  },
  {
    key: 'total_late',
    label: 'Total Late',
    type: 'number',
    category: 'Yearly Summary',
    sortable: true
  },
  {
    key: 'overall_percentage',
    label: 'Overall %',
    type: 'percentage',
    category: 'Yearly Summary',
    sortable: true,
    render: (v) => `${(v || 0).toFixed(1)}%`
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // DEFAULTER INFO
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    key: 'consecutive_absent',
    label: 'Consecutive Absents',
    type: 'number',
    category: 'Defaulter Info',
    sortable: true
  },
  {
    key: 'last_absent_date',
    label: 'Last Absent Date',
    type: 'date',
    category: 'Defaulter Info',
    sortable: true,
    render: (v) => formatDate(v)
  },
  {
    key: 'absence_reason',
    label: 'Absence Reason',
    type: 'string',
    category: 'Defaulter Info'
  },
  {
    key: 'parent_notified',
    label: 'Parent Notified',
    type: 'badge',
    category: 'Defaulter Info',
    badgeColors: {
      'Yes': 'bg-green-100 text-green-700',
      'No': 'bg-red-100 text-red-700'
    }
  },
  {
    key: 'notification_date',
    label: 'Notification Date',
    type: 'date',
    category: 'Defaulter Info',
    render: (v) => formatDate(v)
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // STAFF ATTENDANCE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    key: 'employee_id',
    label: 'Employee ID',
    type: 'string',
    category: 'Staff Attendance',
    sortable: true
  },
  {
    key: 'staff_name',
    label: 'Staff Name',
    type: 'string',
    category: 'Staff Attendance',
    sortable: true
  },
  {
    key: 'department',
    label: 'Department',
    type: 'string',
    category: 'Staff Attendance',
    sortable: true,
    filterable: true
  },
  {
    key: 'designation',
    label: 'Designation',
    type: 'string',
    category: 'Staff Attendance',
    sortable: true
  },
  {
    key: 'shift',
    label: 'Shift',
    type: 'string',
    category: 'Staff Attendance',
    filterable: true
  },
  {
    key: 'staff_check_in',
    label: 'Check In',
    type: 'time',
    category: 'Staff Attendance',
    render: (v) => v ? formatTime(v) : '-'
  },
  {
    key: 'staff_check_out',
    label: 'Check Out',
    type: 'time',
    category: 'Staff Attendance',
    render: (v) => v ? formatTime(v) : '-'
  },
  {
    key: 'overtime_hours',
    label: 'Overtime (hrs)',
    type: 'number',
    category: 'Staff Attendance',
    sortable: true,
    render: (v) => v > 0 ? `${v} hrs` : '-'
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // CONTACT INFO (for notifications)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    key: 'father_name',
    label: 'Father Name',
    type: 'string',
    category: 'Contact Info'
  },
  {
    key: 'father_phone',
    label: 'Father Phone',
    type: 'phone',
    category: 'Contact Info'
  },
  {
    key: 'mother_phone',
    label: 'Mother Phone',
    type: 'phone',
    category: 'Contact Info'
  }
];

// ═══════════════════════════════════════════════════════════════════════════════
// COLUMN SETS - Pre-defined column groups
// ═══════════════════════════════════════════════════════════════════════════════

export const COLUMN_SETS = {
  // Basic daily attendance view
  daily_basic: [
    'enrollment_id', 'full_name', 'class.name', 'section.name', 
    'attendance_date', 'status', 'remarks'
  ],
  
  // Daily with time tracking
  daily_detailed: [
    'enrollment_id', 'full_name', 'class.name', 'section.name',
    'attendance_date', 'status', 'check_in_time', 'check_out_time', 
    'late_minutes', 'remarks', 'marked_by'
  ],
  
  // Period-wise attendance
  period_wise: [
    'enrollment_id', 'full_name', 'class.name', 'section.name',
    'attendance_date', 'period_number', 'subject.name', 'teacher.name', 'period_status'
  ],
  
  // Monthly summary
  monthly_summary: [
    'enrollment_id', 'full_name', 'class.name', 'section.name',
    'month', 'working_days', 'days_present', 'days_absent', 
    'days_late', 'attendance_percentage'
  ],
  
  // Defaulters list
  defaulters: [
    'enrollment_id', 'full_name', 'class.name', 'section.name',
    'consecutive_absent', 'last_absent_date', 'absence_reason',
    'father_phone', 'parent_notified'
  ],
  
  // Staff daily
  staff_daily: [
    'employee_id', 'staff_name', 'department', 'designation',
    'attendance_date', 'status', 'staff_check_in', 'staff_check_out', 'overtime_hours'
  ],
  
  // Staff monthly
  staff_monthly: [
    'employee_id', 'staff_name', 'department', 'designation',
    'month', 'working_days', 'days_present', 'days_absent', 
    'days_late', 'attendance_percentage'
  ]
};

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

// Get column definition by key
export const getColumn = (key) => ATTENDANCE_COLUMNS.find(c => c.key === key);

// Get columns array from keys
export const getColumns = (keys) => 
  keys.map(key => ATTENDANCE_COLUMNS.find(c => c.key === key)).filter(Boolean);

// Get columns by category
export const getColumnsByCategory = (category) => 
  ATTENDANCE_COLUMNS.filter(c => c.category === category);

// Get all categories
export const getCategories = () => 
  [...new Set(ATTENDANCE_COLUMNS.map(c => c.category))];

// Get column set by name
export const getColumnSet = (setName) => 
  COLUMN_SETS[setName] ? getColumns(COLUMN_SETS[setName]) : [];

export default ATTENDANCE_COLUMNS;
