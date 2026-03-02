/**
 * Transport Report Generator - Template Definitions
 * Day 6 - 8 Day Master Plan
 * 30 pre-built templates across 3 categories
 */

import { TRANSPORT_COLUMNS, COLUMN_SETS, getColumns } from './columns';

// ═══════════════════════════════════════════════════════════════════════════════
// TEMPLATE CATEGORIES
// ═══════════════════════════════════════════════════════════════════════════════

export const TEMPLATE_CATEGORIES = [
  { key: 'route_vehicle', label: 'Route & Vehicle', icon: 'Route', color: 'blue' },
  { key: 'users_fee', label: 'Users & Fee', icon: 'Users', color: 'green' },
  { key: 'operations', label: 'Operations', icon: 'Activity', color: 'orange' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// TRANSPORT TEMPLATES - 30 Templates
// ═══════════════════════════════════════════════════════════════════════════════

export const TRANSPORT_TEMPLATES = [
  // ─────────────────────────────────────────────────────────────────────────────
  // ROUTE & VEHICLE (10 Templates)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    key: 'route_master',
    name: 'Route Master List',
    description: 'Complete list of all transport routes with details',
    category: 'route_vehicle',
    icon: 'Route',
    popular: true,
    columns: getColumns(COLUMN_SETS.route_master),
    defaultFilters: {},
    defaultGroupBy: [],
    defaultSortBy: [{ key: 'route_name', direction: 'asc' }],
    dataSource: 'routes',
  },
  {
    key: 'route_students',
    name: 'Route-wise Students',
    description: 'Students list grouped by transport route',
    category: 'route_vehicle',
    icon: 'Users',
    popular: true,
    columns: getColumns(COLUMN_SETS.route_students),
    defaultFilters: {},
    defaultGroupBy: ['route_name'],
    defaultSortBy: [{ key: 'student_name', direction: 'asc' }],
    dataSource: 'transport_users',
  },
  {
    key: 'stop_wise',
    name: 'Stop-wise Report',
    description: 'All stops with timing and student count',
    category: 'route_vehicle',
    icon: 'MapPin',
    columns: getColumns(COLUMN_SETS.stop_wise),
    defaultFilters: {},
    defaultGroupBy: ['route_name'],
    defaultSortBy: [{ key: 'stop_sequence', direction: 'asc' }],
    dataSource: 'stops',
  },
  {
    key: 'vehicle_inventory',
    name: 'Vehicle Inventory',
    description: 'Complete vehicle fleet inventory',
    category: 'route_vehicle',
    icon: 'Bus',
    popular: true,
    columns: getColumns(COLUMN_SETS.vehicle_inventory),
    defaultFilters: {},
    defaultGroupBy: [],
    defaultSortBy: [{ key: 'vehicle_number', direction: 'asc' }],
    dataSource: 'vehicles',
  },
  {
    key: 'vehicle_route_mapping',
    name: 'Vehicle-Route Mapping',
    description: 'Which vehicle is assigned to which route',
    category: 'route_vehicle',
    icon: 'Link',
    columns: getColumns(COLUMN_SETS.vehicle_route),
    defaultFilters: {},
    defaultGroupBy: [],
    defaultSortBy: [{ key: 'route_name', direction: 'asc' }],
    dataSource: 'vehicle_routes',
  },
  {
    key: 'capacity_utilization',
    name: 'Capacity Utilization',
    description: 'Vehicle capacity vs actual occupancy',
    category: 'route_vehicle',
    icon: 'PieChart',
    popular: true,
    columns: getColumns(COLUMN_SETS.capacity_utilization),
    defaultFilters: {},
    defaultGroupBy: [],
    defaultSortBy: [{ key: 'occupancy_percent', direction: 'desc' }],
    dataSource: 'capacity',
  },
  {
    key: 'distance_report',
    name: 'Distance Report',
    description: 'Route distances and fee structure',
    category: 'route_vehicle',
    icon: 'Navigation',
    columns: getColumns(COLUMN_SETS.distance_report),
    defaultFilters: {},
    defaultGroupBy: [],
    defaultSortBy: [{ key: 'total_distance', direction: 'desc' }],
    dataSource: 'routes',
  },
  {
    key: 'timing_report',
    name: 'Timing Report',
    description: 'Route and stop timing schedule',
    category: 'route_vehicle',
    icon: 'Clock',
    columns: getColumns(COLUMN_SETS.timing_report),
    defaultFilters: {},
    defaultGroupBy: ['route_name'],
    defaultSortBy: [{ key: 'pickup_time', direction: 'asc' }],
    dataSource: 'stop_timings',
  },
  {
    key: 'change_requests',
    name: 'Route Change Requests',
    description: 'Pending and processed route change requests',
    category: 'route_vehicle',
    icon: 'GitPullRequest',
    columns: getColumns(COLUMN_SETS.change_requests),
    defaultFilters: {},
    defaultGroupBy: ['request_status'],
    defaultSortBy: [{ key: 'request_date', direction: 'desc' }],
    dataSource: 'requests',
  },
  {
    key: 'unallocated_students',
    name: 'Unallocated Students',
    description: 'Students not yet assigned to any route',
    category: 'route_vehicle',
    icon: 'UserX',
    columns: getColumns(COLUMN_SETS.unallocated),
    defaultFilters: { user_status: 'unallocated' },
    defaultGroupBy: ['class_name'],
    defaultSortBy: [{ key: 'student_name', direction: 'asc' }],
    dataSource: 'unallocated',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // USERS & FEE (10 Templates)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    key: 'users_list',
    name: 'Transport Users List',
    description: 'All students using transport facility',
    category: 'users_fee',
    icon: 'Users',
    popular: true,
    columns: getColumns(COLUMN_SETS.users_list),
    defaultFilters: {},
    defaultGroupBy: [],
    defaultSortBy: [{ key: 'student_name', direction: 'asc' }],
    dataSource: 'transport_users',
  },
  {
    key: 'new_requests',
    name: 'New Transport Requests',
    description: 'New requests for transport facility',
    category: 'users_fee',
    icon: 'UserPlus',
    columns: getColumns(COLUMN_SETS.new_requests),
    defaultFilters: { request_status: 'pending' },
    defaultGroupBy: [],
    defaultSortBy: [{ key: 'request_date', direction: 'desc' }],
    dataSource: 'requests',
  },
  {
    key: 'fee_collection',
    name: 'Fee Collection Report',
    description: 'Transport fee collection status',
    category: 'users_fee',
    icon: 'IndianRupee',
    popular: true,
    columns: getColumns(COLUMN_SETS.fee_collection),
    defaultFilters: {},
    defaultGroupBy: ['class_name'],
    defaultSortBy: [{ key: 'fee_due', direction: 'desc' }],
    dataSource: 'fee_collection',
  },
  {
    key: 'route_fee',
    name: 'Route-wise Fee Summary',
    description: 'Fee collection summary by route',
    category: 'users_fee',
    icon: 'BarChart',
    columns: getColumns(COLUMN_SETS.route_fee),
    defaultFilters: {},
    defaultGroupBy: [],
    defaultSortBy: [{ key: 'collection_amount', direction: 'desc' }],
    dataSource: 'route_fee_summary',
  },
  {
    key: 'fee_defaulters',
    name: 'Fee Defaulters',
    description: 'Students with pending transport fee',
    category: 'users_fee',
    icon: 'AlertTriangle',
    popular: true,
    columns: getColumns(COLUMN_SETS.defaulters),
    defaultFilters: { payment_status: 'overdue' },
    defaultGroupBy: ['class_name'],
    defaultSortBy: [{ key: 'days_overdue', direction: 'desc' }],
    dataSource: 'defaulters',
  },
  {
    key: 'pickup_contacts',
    name: 'Pickup Contact Directory',
    description: 'Authorized pickup person details',
    category: 'users_fee',
    icon: 'Contact',
    columns: getColumns(COLUMN_SETS.pickup_contact),
    defaultFilters: {},
    defaultGroupBy: ['pickup_stop'],
    defaultSortBy: [{ key: 'student_name', direction: 'asc' }],
    dataSource: 'contacts',
  },
  {
    key: 'emergency_contacts',
    name: 'Emergency Contact List',
    description: 'Emergency contact information for transport users',
    category: 'users_fee',
    icon: 'Phone',
    columns: getColumns(COLUMN_SETS.emergency_contact),
    defaultFilters: {},
    defaultGroupBy: ['route_name'],
    defaultSortBy: [{ key: 'student_name', direction: 'asc' }],
    dataSource: 'contacts',
  },
  {
    key: 'card_status',
    name: 'Transport Card Status',
    description: 'ID card issue and expiry status',
    category: 'users_fee',
    icon: 'CreditCard',
    columns: getColumns(COLUMN_SETS.card_status),
    defaultFilters: {},
    defaultGroupBy: ['card_status'],
    defaultSortBy: [{ key: 'card_expiry_date', direction: 'asc' }],
    dataSource: 'card_status',
  },
  {
    key: 'discontinued_users',
    name: 'Discontinued Users',
    description: 'Students who discontinued transport facility',
    category: 'users_fee',
    icon: 'UserMinus',
    columns: getColumns(COLUMN_SETS.discontinued),
    defaultFilters: { user_status: 'discontinued' },
    defaultGroupBy: [],
    defaultSortBy: [{ key: 'allocation_date', direction: 'desc' }],
    dataSource: 'discontinued',
  },
  {
    key: 'transport_history',
    name: 'Transport History',
    description: 'Historical transport usage record',
    category: 'users_fee',
    icon: 'History',
    columns: getColumns(COLUMN_SETS.history),
    defaultFilters: {},
    defaultGroupBy: ['class_name'],
    defaultSortBy: [{ key: 'allocation_date', direction: 'desc' }],
    dataSource: 'history',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // OPERATIONS (10 Templates)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    key: 'trip_log',
    name: 'Daily Trip Log',
    description: 'Daily trip records for all routes',
    category: 'operations',
    icon: 'Calendar',
    popular: true,
    columns: getColumns(COLUMN_SETS.trip_log),
    defaultFilters: {},
    defaultGroupBy: ['trip_date'],
    defaultSortBy: [{ key: 'trip_date', direction: 'desc' }],
    defaultFilterConfig: { dateRange: true },
    dataSource: 'trips',
  },
  {
    key: 'driver_attendance',
    name: 'Driver Attendance',
    description: 'Driver attendance and trip completion',
    category: 'operations',
    icon: 'UserCheck',
    columns: getColumns(COLUMN_SETS.driver_attendance),
    defaultFilters: {},
    defaultGroupBy: ['driver_name'],
    defaultSortBy: [{ key: 'trip_date', direction: 'desc' }],
    defaultFilterConfig: { dateRange: true, month: true },
    dataSource: 'driver_attendance',
  },
  {
    key: 'driver_performance',
    name: 'Driver Performance Report',
    description: 'Driver performance metrics and analysis',
    category: 'operations',
    icon: 'Award',
    columns: getColumns(COLUMN_SETS.driver_performance),
    defaultFilters: {},
    defaultGroupBy: [],
    defaultSortBy: [{ key: 'on_time_trips', direction: 'desc' }],
    dataSource: 'driver_performance',
  },
  {
    key: 'maintenance_report',
    name: 'Maintenance Report',
    description: 'Vehicle maintenance records',
    category: 'operations',
    icon: 'Wrench',
    popular: true,
    columns: getColumns(COLUMN_SETS.maintenance),
    defaultFilters: {},
    defaultGroupBy: ['maintenance_type'],
    defaultSortBy: [{ key: 'maintenance_date', direction: 'desc' }],
    dataSource: 'maintenance',
  },
  {
    key: 'fuel_report',
    name: 'Fuel Consumption Report',
    description: 'Fuel consumption and expense tracking',
    category: 'operations',
    icon: 'Fuel',
    columns: getColumns(COLUMN_SETS.fuel_report),
    defaultFilters: {},
    defaultGroupBy: ['vehicle_number'],
    defaultSortBy: [{ key: 'fuel_date', direction: 'desc' }],
    defaultFilterConfig: { dateRange: true, month: true },
    dataSource: 'fuel',
  },
  {
    key: 'breakdown_report',
    name: 'Breakdown Report',
    description: 'Vehicle breakdown incidents',
    category: 'operations',
    icon: 'AlertOctagon',
    columns: getColumns(COLUMN_SETS.breakdown),
    defaultFilters: { incident_type: 'breakdown' },
    defaultGroupBy: [],
    defaultSortBy: [{ key: 'incident_date', direction: 'desc' }],
    dataSource: 'incidents',
  },
  {
    key: 'gps_tracking',
    name: 'GPS Tracking Report',
    description: 'Vehicle GPS and location tracking',
    category: 'operations',
    icon: 'MapPin',
    columns: getColumns(COLUMN_SETS.gps_report),
    defaultFilters: {},
    defaultGroupBy: [],
    defaultSortBy: [{ key: 'tracking_time', direction: 'desc' }],
    dataSource: 'gps',
  },
  {
    key: 'speed_violation',
    name: 'Speed Violation Report',
    description: 'Over-speeding incidents',
    category: 'operations',
    icon: 'Gauge',
    columns: getColumns(COLUMN_SETS.speed_violation),
    defaultFilters: {},
    defaultGroupBy: ['driver_name'],
    defaultSortBy: [{ key: 'incident_date', direction: 'desc' }],
    dataSource: 'violations',
  },
  {
    key: 'accident_report',
    name: 'Accident Report',
    description: 'Vehicle accident records',
    category: 'operations',
    icon: 'AlertTriangle',
    columns: getColumns(COLUMN_SETS.accident),
    defaultFilters: { incident_type: 'accident' },
    defaultGroupBy: ['incident_severity'],
    defaultSortBy: [{ key: 'incident_date', direction: 'desc' }],
    dataSource: 'incidents',
  },
  {
    key: 'insurance_report',
    name: 'Insurance & Compliance',
    description: 'Vehicle insurance and compliance status',
    category: 'operations',
    icon: 'Shield',
    columns: getColumns(COLUMN_SETS.insurance),
    defaultFilters: {},
    defaultGroupBy: [],
    defaultSortBy: [{ key: 'insurance_expiry', direction: 'asc' }],
    dataSource: 'insurance',
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get template by key
 */
export const getTemplate = (key) => {
  return TRANSPORT_TEMPLATES.find(t => t.key === key);
};

/**
 * Get templates by category
 */
export const getTemplatesByCategory = (category) => {
  return TRANSPORT_TEMPLATES.filter(t => t.category === category);
};

/**
 * Get popular templates
 */
export const getPopularTemplates = () => {
  return TRANSPORT_TEMPLATES.filter(t => t.popular);
};

/**
 * Search templates by name or description
 */
export const searchTemplates = (query) => {
  const q = query.toLowerCase();
  return TRANSPORT_TEMPLATES.filter(t => 
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
    count: TRANSPORT_TEMPLATES.filter(t => t.category === cat.key).length
  }));
};

export default TRANSPORT_TEMPLATES;
