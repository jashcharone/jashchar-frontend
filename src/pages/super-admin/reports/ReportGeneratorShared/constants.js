// Report Generator Constants
// Shared constants for the unified report system

// Module definitions with colors and icons
export const REPORT_MODULES = {
  'student-information': {
    key: 'student-information',
    name: 'Student Information',
    icon: 'Users',
    color: 'blue',
    bgGradient: 'from-blue-500 to-blue-600',
    apiBase: '/api/reports/student-information'
  },
  'finance': {
    key: 'finance',
    name: 'Finance',
    icon: 'DollarSign',
    color: 'green',
    bgGradient: 'from-green-500 to-green-600',
    apiBase: '/api/reports/finance'
  },
  'attendance': {
    key: 'attendance',
    name: 'Attendance',
    icon: 'Calendar',
    color: 'purple',
    bgGradient: 'from-purple-500 to-purple-600',
    apiBase: '/api/reports/attendance'
  },
  'examinations': {
    key: 'examinations',
    name: 'Examinations',
    icon: 'FileText',
    color: 'orange',
    bgGradient: 'from-orange-500 to-orange-600',
    apiBase: '/api/reports/examinations'
  },
  'human-resource': {
    key: 'human-resource',
    name: 'Human Resource',
    icon: 'Briefcase',
    color: 'cyan',
    bgGradient: 'from-cyan-500 to-cyan-600',
    apiBase: '/api/reports/hr'
  },
  'library': {
    key: 'library',
    name: 'Library',
    icon: 'BookOpen',
    color: 'amber',
    bgGradient: 'from-amber-500 to-amber-600',
    apiBase: '/api/reports/library'
  },
  'transport': {
    key: 'transport',
    name: 'Transport',
    icon: 'Bus',
    color: 'indigo',
    bgGradient: 'from-indigo-500 to-indigo-600',
    apiBase: '/api/reports/transport'
  },
  'hostel': {
    key: 'hostel',
    name: 'Hostel',
    icon: 'Home',
    color: 'pink',
    bgGradient: 'from-pink-500 to-pink-600',
    apiBase: '/api/reports/hostel'
  },
  'homework': {
    key: 'homework',
    name: 'Homework',
    icon: 'Edit3',
    color: 'teal',
    bgGradient: 'from-teal-500 to-teal-600',
    apiBase: '/api/reports/homework'
  },
  'homework-evaluation': {
    key: 'homework-evaluation',
    name: 'Homework Evaluation',
    icon: 'CheckSquare',
    color: 'emerald',
    bgGradient: 'from-emerald-500 to-emerald-600',
    apiBase: '/api/reports/hw-evaluation'
  },
  'fees-reports': {
    key: 'fees-reports',
    name: 'Fees Reports',
    icon: 'CreditCard',
    color: 'orange',
    bgGradient: 'from-orange-500 to-orange-600',
    apiBase: '/api/reports/fees'
  },
  'fees': {
    key: 'fees',
    name: 'Fees Reports',
    icon: 'CreditCard',
    color: 'orange',
    bgGradient: 'from-orange-500 to-orange-600',
    apiBase: '/api/reports/fees'
  },
  'online-exam': {
    key: 'online-exam',
    name: 'Online Exam Reports',
    icon: 'Monitor',
    color: 'rose',
    bgGradient: 'from-rose-500 to-rose-600',
    apiBase: '/api/reports/online-exam'
  }
};

// Color schemes for tables
export const TABLE_COLORS = {
  blue: {
    headerBg: 'bg-blue-500',
    headerText: 'text-white',
    rowHover: 'hover:bg-blue-50',
    stripeBg: 'bg-blue-50/50',
    subTotalBg: 'bg-blue-100',
    subTotalText: 'text-blue-700 font-semibold',
    grandTotalBg: 'bg-blue-600',
    grandTotalText: 'text-white font-bold',
    border: 'border-blue-200'
  },
  green: {
    headerBg: 'bg-green-500',
    headerText: 'text-white',
    rowHover: 'hover:bg-green-50',
    stripeBg: 'bg-green-50/50',
    subTotalBg: 'bg-green-100',
    subTotalText: 'text-green-700 font-semibold',
    grandTotalBg: 'bg-green-600',
    grandTotalText: 'text-white font-bold',
    border: 'border-green-200'
  },
  purple: {
    headerBg: 'bg-purple-500',
    headerText: 'text-white',
    rowHover: 'hover:bg-purple-50',
    stripeBg: 'bg-purple-50/50',
    subTotalBg: 'bg-purple-100',
    subTotalText: 'text-purple-700 font-semibold',
    grandTotalBg: 'bg-purple-600',
    grandTotalText: 'text-white font-bold',
    border: 'border-purple-200'
  },
  orange: {
    headerBg: 'bg-orange-500',
    headerText: 'text-white',
    rowHover: 'hover:bg-orange-50',
    stripeBg: 'bg-orange-50/50',
    subTotalBg: 'bg-orange-100',
    subTotalText: 'text-orange-700 font-semibold',
    grandTotalBg: 'bg-orange-600',
    grandTotalText: 'text-white font-bold',
    border: 'border-orange-200'
  },
  cyan: {
    headerBg: 'bg-cyan-500',
    headerText: 'text-white',
    rowHover: 'hover:bg-cyan-50',
    stripeBg: 'bg-cyan-50/50',
    subTotalBg: 'bg-cyan-100',
    subTotalText: 'text-cyan-700 font-semibold',
    grandTotalBg: 'bg-cyan-600',
    grandTotalText: 'text-white font-bold',
    border: 'border-cyan-200'
  },
  amber: {
    headerBg: 'bg-amber-500',
    headerText: 'text-white',
    rowHover: 'hover:bg-amber-50',
    stripeBg: 'bg-amber-50/50',
    subTotalBg: 'bg-amber-100',
    subTotalText: 'text-amber-700 font-semibold',
    grandTotalBg: 'bg-amber-600',
    grandTotalText: 'text-white font-bold',
    border: 'border-amber-200'
  },
  indigo: {
    headerBg: 'bg-indigo-500',
    headerText: 'text-white',
    rowHover: 'hover:bg-indigo-50',
    stripeBg: 'bg-indigo-50/50',
    subTotalBg: 'bg-indigo-100',
    subTotalText: 'text-indigo-700 font-semibold',
    grandTotalBg: 'bg-indigo-600',
    grandTotalText: 'text-white font-bold',
    border: 'border-indigo-200'
  },
  pink: {
    headerBg: 'bg-pink-500',
    headerText: 'text-white',
    rowHover: 'hover:bg-pink-50',
    stripeBg: 'bg-pink-50/50',
    subTotalBg: 'bg-pink-100',
    subTotalText: 'text-pink-700 font-semibold',
    grandTotalBg: 'bg-pink-600',
    grandTotalText: 'text-white font-bold',
    border: 'border-pink-200'
  },
  teal: {
    headerBg: 'bg-teal-500',
    headerText: 'text-white',
    rowHover: 'hover:bg-teal-50',
    stripeBg: 'bg-teal-50/50',
    subTotalBg: 'bg-teal-100',
    subTotalText: 'text-teal-700 font-semibold',
    grandTotalBg: 'bg-teal-600',
    grandTotalText: 'text-white font-bold',
    border: 'border-teal-200'
  },
  emerald: {
    headerBg: 'bg-emerald-500',
    headerText: 'text-white',
    rowHover: 'hover:bg-emerald-50',
    stripeBg: 'bg-emerald-50/50',
    subTotalBg: 'bg-emerald-100',
    subTotalText: 'text-emerald-700 font-semibold',
    grandTotalBg: 'bg-emerald-600',
    grandTotalText: 'text-white font-bold',
    border: 'border-emerald-200'
  },
  lime: {
    headerBg: 'bg-lime-500',
    headerText: 'text-white',
    rowHover: 'hover:bg-lime-50',
    stripeBg: 'bg-lime-50/50',
    subTotalBg: 'bg-lime-100',
    subTotalText: 'text-lime-700 font-semibold',
    grandTotalBg: 'bg-lime-600',
    grandTotalText: 'text-white font-bold',
    border: 'border-lime-200'
  },
  rose: {
    headerBg: 'bg-rose-500',
    headerText: 'text-white',
    rowHover: 'hover:bg-rose-50',
    stripeBg: 'bg-rose-50/50',
    subTotalBg: 'bg-rose-100',
    subTotalText: 'text-rose-700 font-semibold',
    grandTotalBg: 'bg-rose-600',
    grandTotalText: 'text-white font-bold',
    border: 'border-rose-200'
  }
};

// Export formats
export const EXPORT_FORMATS = {
  excel: { key: 'excel', label: 'Excel', icon: 'Sheet', extension: '.xlsx' },
  pdf: { key: 'pdf', label: 'PDF', icon: 'FileText', extension: '.pdf' },
  csv: { key: 'csv', label: 'CSV', icon: 'FileText', extension: '.csv' },
  print: { key: 'print', label: 'Print', icon: 'Printer' },
  email: { key: 'email', label: 'Email', icon: 'Mail' },
  share: { key: 'share', label: 'Share Link', icon: 'Share2' }
};

// Filter types
export const FILTER_TYPES = {
  select: 'select',
  multiSelect: 'multi-select',
  text: 'text',
  number: 'number',
  numberRange: 'number-range',
  date: 'date',
  dateRange: 'date-range',
  boolean: 'boolean'
};

// Column types
export const COLUMN_TYPES = {
  string: 'string',
  number: 'number',
  currency: 'currency',
  percentage: 'percentage',
  date: 'date',
  datetime: 'datetime',
  time: 'time',
  boolean: 'boolean',
  phone: 'phone',
  email: 'email',
  image: 'image',
  badge: 'badge',
  computed: 'computed'
};

// Schedule frequency options
export const SCHEDULE_FREQUENCIES = {
  daily: { key: 'daily', label: 'Daily', description: 'Runs every day at specified time' },
  weekly: { key: 'weekly', label: 'Weekly', description: 'Runs on selected days every week' },
  monthly: { key: 'monthly', label: 'Monthly', description: 'Runs on selected date every month' }
};

// Days of week
export const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday', short: 'Sun' },
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' }
];

// Common student statuses
export const STUDENT_STATUSES = [
  { value: 'active', label: 'Active', color: 'green' },
  { value: 'inactive', label: 'Inactive', color: 'gray' },
  { value: 'left', label: 'Left', color: 'red' },
  { value: 'tc_issued', label: 'TC Issued', color: 'orange' }
];

// Blood groups
export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// Genders
export const GENDERS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' }
];

// Payment modes
export const PAYMENT_MODES = [
  { value: 'cash', label: 'Cash' },
  { value: 'online', label: 'Online' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'dd', label: 'Demand Draft' },
  { value: 'upi', label: 'UPI' },
  { value: 'card', label: 'Card' }
];

// Academic months (Indian academic year: April to March)
export const ACADEMIC_MONTHS = [
  { value: 4, label: 'April', short: 'Apr' },
  { value: 5, label: 'May', short: 'May' },
  { value: 6, label: 'June', short: 'Jun' },
  { value: 7, label: 'July', short: 'Jul' },
  { value: 8, label: 'August', short: 'Aug' },
  { value: 9, label: 'September', short: 'Sep' },
  { value: 10, label: 'October', short: 'Oct' },
  { value: 11, label: 'November', short: 'Nov' },
  { value: 12, label: 'December', short: 'Dec' },
  { value: 1, label: 'January', short: 'Jan' },
  { value: 2, label: 'February', short: 'Feb' },
  { value: 3, label: 'March', short: 'Mar' }
];

// Default pagination
export const DEFAULT_PAGE_SIZE = 50;
export const PAGE_SIZE_OPTIONS = [25, 50, 100, 250, 500];

// Empty state messages
export const EMPTY_MESSAGES = {
  noData: 'No data available for the selected filters',
  noTemplates: 'No templates available in this category',
  noColumns: 'Please select at least one column to display',
  loading: 'Loading report data...',
  error: 'Error loading report. Please try again.'
};
