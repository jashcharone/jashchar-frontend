/**
 * Hostel Report Generator - Template Definitions
 * Day 6 - 8 Day Master Plan
 * 30 pre-built templates across 3 categories
 */

import { HOSTEL_COLUMNS, COLUMN_SETS, getColumns } from './columns';

// ═══════════════════════════════════════════════════════════════════════════════
// TEMPLATE CATEGORIES
// ═══════════════════════════════════════════════════════════════════════════════

export const TEMPLATE_CATEGORIES = [
  { key: 'accommodation', label: 'Accommodation', icon: 'Building', color: 'purple' },
  { key: 'students', label: 'Students', icon: 'Users', color: 'blue' },
  { key: 'fee_mess', label: 'Fee & Mess', icon: 'IndianRupee', color: 'green' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// HOSTEL TEMPLATES - 30 Templates
// ═══════════════════════════════════════════════════════════════════════════════

export const HOSTEL_TEMPLATES = [
  // ─────────────────────────────────────────────────────────────────────────────
  // ACCOMMODATION (10 Templates)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    key: 'room_inventory',
    name: 'Room Inventory',
    description: 'Complete inventory of all hostel rooms',
    category: 'accommodation',
    icon: 'DoorOpen',
    popular: true,
    columns: getColumns(COLUMN_SETS.room_inventory),
    defaultFilters: {},
    defaultGroupBy: ['floor_number'],
    defaultSortBy: [{ key: 'room_number', direction: 'asc' }],
    dataSource: 'rooms',
  },
  {
    key: 'room_allocation',
    name: 'Room Allocation Report',
    description: 'Current room and bed allocation status',
    category: 'accommodation',
    icon: 'BedDouble',
    popular: true,
    columns: getColumns(COLUMN_SETS.room_allocation),
    defaultFilters: {},
    defaultGroupBy: ['room_number'],
    defaultSortBy: [{ key: 'room_number', direction: 'asc' }],
    dataSource: 'allocations',
  },
  {
    key: 'occupancy_report',
    name: 'Occupancy Report',
    description: 'Room-wise occupancy status and percentage',
    category: 'accommodation',
    icon: 'PieChart',
    popular: true,
    columns: getColumns(COLUMN_SETS.occupancy),
    defaultFilters: {},
    defaultGroupBy: ['hostel_name'],
    defaultSortBy: [{ key: 'occupancy_percent', direction: 'desc' }],
    dataSource: 'occupancy',
  },
  {
    key: 'floor_summary',
    name: 'Floor-wise Summary',
    description: 'Summary of rooms and beds by floor',
    category: 'accommodation',
    icon: 'Layers',
    columns: getColumns(COLUMN_SETS.floor_summary),
    defaultFilters: {},
    defaultGroupBy: ['hostel_name'],
    defaultSortBy: [{ key: 'floor_number', direction: 'asc' }],
    dataSource: 'floors',
  },
  {
    key: 'vacant_beds',
    name: 'Vacant Beds Report',
    description: 'List of all available/vacant beds',
    category: 'accommodation',
    icon: 'BedSingle',
    columns: getColumns(COLUMN_SETS.vacant_beds),
    defaultFilters: { bed_status: 'vacant' },
    defaultGroupBy: ['floor_number'],
    defaultSortBy: [{ key: 'room_number', direction: 'asc' }],
    dataSource: 'vacant_beds',
  },
  {
    key: 'room_type_wise',
    name: 'Room Type-wise Report',
    description: 'Summary by room types (Single, Double, etc.)',
    category: 'accommodation',
    icon: 'LayoutGrid',
    columns: getColumns(COLUMN_SETS.room_type_wise),
    defaultFilters: {},
    defaultGroupBy: [],
    defaultSortBy: [{ key: 'room_type', direction: 'asc' }],
    dataSource: 'room_types',
  },
  {
    key: 'room_change_requests',
    name: 'Room Change Requests',
    description: 'Pending and processed room change requests',
    category: 'accommodation',
    icon: 'RefreshCcw',
    columns: getColumns(COLUMN_SETS.change_requests),
    defaultFilters: {},
    defaultGroupBy: ['request_status'],
    defaultSortBy: [{ key: 'request_date', direction: 'desc' }],
    dataSource: 'requests',
  },
  {
    key: 'maintenance_report',
    name: 'Room Maintenance Report',
    description: 'Room maintenance and repair records',
    category: 'accommodation',
    icon: 'Wrench',
    columns: getColumns(COLUMN_SETS.maintenance),
    defaultFilters: {},
    defaultGroupBy: ['maintenance_type'],
    defaultSortBy: [{ key: 'request_date', direction: 'desc' }],
    dataSource: 'maintenance',
  },
  {
    key: 'room_condition',
    name: 'Room Condition Report',
    description: 'Room condition and amenities status',
    category: 'accommodation',
    icon: 'ClipboardCheck',
    columns: getColumns(COLUMN_SETS.room_condition),
    defaultFilters: {},
    defaultGroupBy: ['room_condition'],
    defaultSortBy: [{ key: 'room_number', direction: 'asc' }],
    dataSource: 'rooms',
  },
  {
    key: 'new_admission_requests',
    name: 'New Admission Requests',
    description: 'Pending hostel admission requests',
    category: 'accommodation',
    icon: 'UserPlus',
    columns: getColumns(COLUMN_SETS.new_requests),
    defaultFilters: { request_status: 'pending' },
    defaultGroupBy: [],
    defaultSortBy: [{ key: 'request_date', direction: 'desc' }],
    dataSource: 'admission_requests',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // STUDENTS (10 Templates)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    key: 'students_list',
    name: 'Hostel Students List',
    description: 'Complete list of all hostel residents',
    category: 'students',
    icon: 'Users',
    popular: true,
    columns: getColumns(COLUMN_SETS.students_list),
    defaultFilters: {},
    defaultGroupBy: [],
    defaultSortBy: [{ key: 'student_name', direction: 'asc' }],
    dataSource: 'students',
  },
  {
    key: 'class_wise',
    name: 'Class-wise Students',
    description: 'Hostel students grouped by class',
    category: 'students',
    icon: 'GraduationCap',
    columns: getColumns(COLUMN_SETS.class_wise),
    defaultFilters: {},
    defaultGroupBy: ['class_name'],
    defaultSortBy: [{ key: 'student_name', direction: 'asc' }],
    dataSource: 'students',
  },
  {
    key: 'guardian_info',
    name: 'Guardian Information',
    description: 'Parent and guardian contact details',
    category: 'students',
    icon: 'Contact',
    columns: getColumns(COLUMN_SETS.guardian_info),
    defaultFilters: {},
    defaultGroupBy: ['class_name'],
    defaultSortBy: [{ key: 'student_name', direction: 'asc' }],
    dataSource: 'guardians',
  },
  {
    key: 'emergency_contact',
    name: 'Emergency Contact List',
    description: 'Emergency contact information for all students',
    category: 'students',
    icon: 'Phone',
    columns: getColumns(COLUMN_SETS.emergency_contact),
    defaultFilters: {},
    defaultGroupBy: [],
    defaultSortBy: [{ key: 'student_name', direction: 'asc' }],
    dataSource: 'contacts',
  },
  {
    key: 'attendance_report',
    name: 'Attendance Report',
    description: 'Daily hostel attendance records',
    category: 'students',
    icon: 'CalendarCheck',
    popular: true,
    columns: getColumns(COLUMN_SETS.attendance_report),
    defaultFilters: {},
    defaultGroupBy: ['attendance_date'],
    defaultSortBy: [{ key: 'attendance_date', direction: 'desc' }],
    defaultFilterConfig: { dateRange: true },
    dataSource: 'attendance',
  },
  {
    key: 'leave_record',
    name: 'Leave Record Report',
    description: 'Student leave applications and status',
    category: 'students',
    icon: 'CalendarX',
    columns: getColumns(COLUMN_SETS.leave_record),
    defaultFilters: {},
    defaultGroupBy: ['leave_status'],
    defaultSortBy: [{ key: 'leave_from', direction: 'desc' }],
    defaultFilterConfig: { dateRange: true },
    dataSource: 'leaves',
  },
  {
    key: 'night_out_report',
    name: 'Night Out Report',
    description: 'Student night out permissions and records',
    category: 'students',
    icon: 'Moon',
    columns: getColumns(COLUMN_SETS.night_out),
    defaultFilters: {},
    defaultGroupBy: ['nightout_status'],
    defaultSortBy: [{ key: 'nightout_date', direction: 'desc' }],
    defaultFilterConfig: { dateRange: true, month: true },
    dataSource: 'night_out',
  },
  {
    key: 'discipline_report',
    name: 'Discipline Report',
    description: 'Disciplinary incidents and actions',
    category: 'students',
    icon: 'AlertCircle',
    columns: getColumns(COLUMN_SETS.discipline),
    defaultFilters: {},
    defaultGroupBy: ['incident_type'],
    defaultSortBy: [{ key: 'incident_date', direction: 'desc' }],
    dataSource: 'discipline',
  },
  {
    key: 'medical_report',
    name: 'Medical Record Report',
    description: 'Student medical history and records',
    category: 'students',
    icon: 'HeartPulse',
    columns: getColumns(COLUMN_SETS.medical_record),
    defaultFilters: {},
    defaultGroupBy: [],
    defaultSortBy: [{ key: 'medical_date', direction: 'desc' }],
    dataSource: 'medical',
  },
  {
    key: 'room_mate_report',
    name: 'Room Mate Report',
    description: 'Room-wise student allocation',
    category: 'students',
    icon: 'UsersRound',
    popular: true,
    columns: getColumns(COLUMN_SETS.room_mate),
    defaultFilters: {},
    defaultGroupBy: ['room_number'],
    defaultSortBy: [{ key: 'room_number', direction: 'asc' }],
    dataSource: 'allocations',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // FEE & MESS (10 Templates)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    key: 'fee_collection',
    name: 'Fee Collection Report',
    description: 'Hostel and mess fee collection status',
    category: 'fee_mess',
    icon: 'IndianRupee',
    popular: true,
    columns: getColumns(COLUMN_SETS.fee_collection),
    defaultFilters: {},
    defaultGroupBy: ['class_name'],
    defaultSortBy: [{ key: 'fee_due', direction: 'desc' }],
    dataSource: 'fee_collection',
  },
  {
    key: 'fee_defaulters',
    name: 'Fee Defaulters',
    description: 'Students with pending hostel fees',
    category: 'fee_mess',
    icon: 'AlertTriangle',
    popular: true,
    columns: getColumns(COLUMN_SETS.defaulters),
    defaultFilters: { payment_status: 'overdue' },
    defaultGroupBy: ['class_name'],
    defaultSortBy: [{ key: 'days_overdue', direction: 'desc' }],
    dataSource: 'defaulters',
  },
  {
    key: 'mess_allocation',
    name: 'Mess Allocation Report',
    description: 'Student mess allocation and preferences',
    category: 'fee_mess',
    icon: 'UtensilsCrossed',
    columns: getColumns(COLUMN_SETS.mess_allocation),
    defaultFilters: {},
    defaultGroupBy: ['mess_type'],
    defaultSortBy: [{ key: 'student_name', direction: 'asc' }],
    dataSource: 'mess_allocation',
  },
  {
    key: 'mess_attendance',
    name: 'Mess Attendance Report',
    description: 'Daily meal attendance records',
    category: 'fee_mess',
    icon: 'ClipboardList',
    columns: getColumns(COLUMN_SETS.mess_attendance),
    defaultFilters: {},
    defaultGroupBy: ['meal_date'],
    defaultSortBy: [{ key: 'meal_date', direction: 'desc' }],
    defaultFilterConfig: { dateRange: true, month: true },
    dataSource: 'mess_attendance',
  },
  {
    key: 'feedback_report',
    name: 'Feedback Report',
    description: 'Student feedback on hostel and mess',
    category: 'fee_mess',
    icon: 'MessageSquare',
    columns: getColumns(COLUMN_SETS.feedback),
    defaultFilters: {},
    defaultGroupBy: ['feedback_type'],
    defaultSortBy: [{ key: 'feedback_date', direction: 'desc' }],
    dataSource: 'feedback',
  },
  {
    key: 'mess_menu',
    name: 'Mess Menu Report',
    description: 'Weekly/monthly mess menu',
    category: 'fee_mess',
    icon: 'Menu',
    columns: getColumns(COLUMN_SETS.mess_menu),
    defaultFilters: {},
    defaultGroupBy: [],
    defaultSortBy: [{ key: 'meal_date', direction: 'asc' }],
    defaultFilterConfig: { dateRange: true },
    dataSource: 'mess_menu',
  },
  {
    key: 'expense_report',
    name: 'Expense Report',
    description: 'Hostel maintenance and operational expenses',
    category: 'fee_mess',
    icon: 'Receipt',
    columns: getColumns(COLUMN_SETS.expense_report),
    defaultFilters: {},
    defaultGroupBy: ['maintenance_type'],
    defaultSortBy: [{ key: 'request_date', direction: 'desc' }],
    defaultFilterConfig: { dateRange: true, month: true },
    dataSource: 'expenses',
  },
  {
    key: 'visitor_log',
    name: 'Visitor Log Report',
    description: 'Record of all hostel visitors',
    category: 'fee_mess',
    icon: 'UserCheck',
    columns: getColumns(COLUMN_SETS.visitor_log),
    defaultFilters: {},
    defaultGroupBy: ['visit_date'],
    defaultSortBy: [{ key: 'visit_date', direction: 'desc' }],
    defaultFilterConfig: { dateRange: true },
    dataSource: 'visitors',
  },
  {
    key: 'checkout_report',
    name: 'Check-out Report',
    description: 'Students who have checked out of hostel',
    category: 'fee_mess',
    icon: 'LogOut',
    columns: getColumns(COLUMN_SETS.checkout_report),
    defaultFilters: {},
    defaultGroupBy: [],
    defaultSortBy: [{ key: 'actual_checkout', direction: 'desc' }],
    dataSource: 'checkouts',
  },
  {
    key: 'revenue_report',
    name: 'Revenue Report',
    description: 'Hostel revenue and financial summary',
    category: 'fee_mess',
    icon: 'TrendingUp',
    popular: true,
    columns: getColumns(COLUMN_SETS.revenue_report),
    defaultFilters: {},
    defaultGroupBy: [],
    defaultSortBy: [{ key: 'total_revenue', direction: 'desc' }],
    dataSource: 'revenue',
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get template by key
 */
export const getTemplate = (key) => {
  return HOSTEL_TEMPLATES.find(t => t.key === key);
};

/**
 * Get templates by category
 */
export const getTemplatesByCategory = (category) => {
  return HOSTEL_TEMPLATES.filter(t => t.category === category);
};

/**
 * Get popular templates
 */
export const getPopularTemplates = () => {
  return HOSTEL_TEMPLATES.filter(t => t.popular);
};

/**
 * Search templates by name or description
 */
export const searchTemplates = (query) => {
  const q = query.toLowerCase();
  return HOSTEL_TEMPLATES.filter(t => 
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
    count: HOSTEL_TEMPLATES.filter(t => t.category === cat.key).length
  }));
};

export default HOSTEL_TEMPLATES;
