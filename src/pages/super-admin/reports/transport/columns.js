/**
 * Transport Report Generator - Column Definitions
 * Day 6 - 8 Day Master Plan
 * 120+ columns for 30 transport report templates
 */

import { formatDate, formatDateTime, formatTime } from '@/utils/dateUtils';

// ═══════════════════════════════════════════════════════════════════════════════
// TRANSPORT COLUMNS - Complete Column Library
// ═══════════════════════════════════════════════════════════════════════════════

export const TRANSPORT_COLUMNS = [
  // ─────────────────────────────────────────────────────────────────────────────
  // ROUTE INFORMATION
  // ─────────────────────────────────────────────────────────────────────────────
  { key: 'route_id', label: 'Route ID', type: 'text', group: 'Route Info', sortable: true, width: 100 },
  { key: 'route_name', label: 'Route Name', type: 'text', group: 'Route Info', sortable: true, width: 180 },
  { key: 'route_code', label: 'Route Code', type: 'text', group: 'Route Info', sortable: true, width: 100 },
  { key: 'route_number', label: 'Route Number', type: 'text', group: 'Route Info', sortable: true, width: 100 },
  { key: 'route_type', label: 'Route Type', type: 'badge', group: 'Route Info', sortable: true, width: 100 },
  { key: 'route_description', label: 'Description', type: 'text', group: 'Route Info', width: 200 },
  { key: 'start_point', label: 'Start Point', type: 'text', group: 'Route Info', sortable: true, width: 150 },
  { key: 'end_point', label: 'End Point', type: 'text', group: 'Route Info', sortable: true, width: 150 },
  { key: 'total_distance', label: 'Total Distance (km)', type: 'number', group: 'Route Info', sortable: true, width: 120 },
  { key: 'total_stops', label: 'Total Stops', type: 'number', group: 'Route Info', sortable: true, width: 100 },
  { key: 'estimated_time', label: 'Est. Time (min)', type: 'number', group: 'Route Info', sortable: true, width: 110 },
  { key: 'route_status', label: 'Route Status', type: 'badge', group: 'Route Info', sortable: true, width: 100 },
  { key: 'route_fee', label: 'Route Fee', type: 'currency', group: 'Route Info', sortable: true, width: 100 },
  
  // ─────────────────────────────────────────────────────────────────────────────
  // STOP INFORMATION
  // ─────────────────────────────────────────────────────────────────────────────
  { key: 'stop_id', label: 'Stop ID', type: 'text', group: 'Stop Info', sortable: true, width: 100 },
  { key: 'stop_name', label: 'Stop Name', type: 'text', group: 'Stop Info', sortable: true, width: 150 },
  { key: 'stop_sequence', label: 'Stop Sequence', type: 'number', group: 'Stop Info', sortable: true, width: 100 },
  { key: 'stop_address', label: 'Stop Address', type: 'text', group: 'Stop Info', width: 200 },
  { key: 'stop_landmark', label: 'Landmark', type: 'text', group: 'Stop Info', width: 150 },
  { key: 'pickup_time', label: 'Pickup Time', type: 'time', group: 'Stop Info', sortable: true, width: 100, render: (v) => v ? formatTime(v) : '-' },
  { key: 'drop_time', label: 'Drop Time', type: 'time', group: 'Stop Info', sortable: true, width: 100, render: (v) => v ? formatTime(v) : '-' },
  { key: 'distance_from_school', label: 'Distance (km)', type: 'number', group: 'Stop Info', sortable: true, width: 100 },
  { key: 'stop_fee', label: 'Stop Fee', type: 'currency', group: 'Stop Info', sortable: true, width: 100 },
  { key: 'students_at_stop', label: 'Students', type: 'number', group: 'Stop Info', sortable: true, width: 80 },
  
  // ─────────────────────────────────────────────────────────────────────────────
  // VEHICLE INFORMATION
  // ─────────────────────────────────────────────────────────────────────────────
  { key: 'vehicle_id', label: 'Vehicle ID', type: 'text', group: 'Vehicle Info', sortable: true, width: 100 },
  { key: 'vehicle_number', label: 'Vehicle Number', type: 'text', group: 'Vehicle Info', sortable: true, width: 130 },
  { key: 'vehicle_name', label: 'Vehicle Name', type: 'text', group: 'Vehicle Info', sortable: true, width: 150 },
  { key: 'vehicle_type', label: 'Vehicle Type', type: 'badge', group: 'Vehicle Info', sortable: true, width: 100 },
  { key: 'vehicle_model', label: 'Model', type: 'text', group: 'Vehicle Info', width: 120 },
  { key: 'vehicle_make', label: 'Make', type: 'text', group: 'Vehicle Info', width: 100 },
  { key: 'manufacturing_year', label: 'Year', type: 'number', group: 'Vehicle Info', sortable: true, width: 80 },
  { key: 'seating_capacity', label: 'Seating Capacity', type: 'number', group: 'Vehicle Info', sortable: true, width: 120 },
  { key: 'current_occupancy', label: 'Current Occupancy', type: 'number', group: 'Vehicle Info', sortable: true, width: 130 },
  { key: 'available_seats', label: 'Available Seats', type: 'number', group: 'Vehicle Info', sortable: true, width: 110 },
  { key: 'occupancy_percent', label: 'Occupancy %', type: 'percentage', group: 'Vehicle Info', sortable: true, width: 100 },
  { key: 'vehicle_status', label: 'Vehicle Status', type: 'badge', group: 'Vehicle Info', sortable: true, width: 110 },
  { key: 'fuel_type', label: 'Fuel Type', type: 'text', group: 'Vehicle Info', sortable: true, width: 90 },
  { key: 'mileage', label: 'Mileage (km/l)', type: 'number', group: 'Vehicle Info', sortable: true, width: 100 },
  { key: 'chassis_number', label: 'Chassis Number', type: 'text', group: 'Vehicle Info', width: 150 },
  { key: 'engine_number', label: 'Engine Number', type: 'text', group: 'Vehicle Info', width: 150 },
  { key: 'gps_enabled', label: 'GPS Enabled', type: 'boolean', group: 'Vehicle Info', width: 100 },
  { key: 'gps_device_id', label: 'GPS Device ID', type: 'text', group: 'Vehicle Info', width: 120 },
  
  // ─────────────────────────────────────────────────────────────────────────────
  // DRIVER / STAFF INFORMATION
  // ─────────────────────────────────────────────────────────────────────────────
  { key: 'driver_id', label: 'Driver ID', type: 'text', group: 'Driver Info', sortable: true, width: 100 },
  { key: 'driver_name', label: 'Driver Name', type: 'text', group: 'Driver Info', sortable: true, width: 150 },
  { key: 'driver_phone', label: 'Driver Phone', type: 'phone', group: 'Driver Info', width: 120 },
  { key: 'driver_license', label: 'License Number', type: 'text', group: 'Driver Info', width: 130 },
  { key: 'license_expiry', label: 'License Expiry', type: 'date', group: 'Driver Info', sortable: true, width: 110, render: (v) => v ? formatDate(v) : '-' },
  { key: 'driver_experience', label: 'Experience (yrs)', type: 'number', group: 'Driver Info', sortable: true, width: 110 },
  { key: 'driver_address', label: 'Driver Address', type: 'text', group: 'Driver Info', width: 200 },
  { key: 'attendant_name', label: 'Attendant Name', type: 'text', group: 'Driver Info', sortable: true, width: 150 },
  { key: 'attendant_phone', label: 'Attendant Phone', type: 'phone', group: 'Driver Info', width: 120 },
  
  // ─────────────────────────────────────────────────────────────────────────────
  // TRANSPORT USER (STUDENT) INFORMATION
  // ─────────────────────────────────────────────────────────────────────────────
  { key: 'student_id', label: 'Student ID', type: 'text', group: 'User Info', sortable: true, width: 100 },
  { key: 'enrollment_id', label: 'Enroll ID', type: 'text', group: 'User Info', sortable: true, width: 120 },
  { key: 'student_name', label: 'Student Name', type: 'text', group: 'User Info', sortable: true, width: 150 },
  { key: 'class_name', label: 'Class', type: 'text', group: 'User Info', sortable: true, width: 80 },
  { key: 'section_name', label: 'Section', type: 'text', group: 'User Info', sortable: true, width: 70 },
  { key: 'roll_number', label: 'Roll No', type: 'text', group: 'User Info', sortable: true, width: 70 },
  { key: 'gender', label: 'Gender', type: 'text', group: 'User Info', sortable: true, width: 70 },
  { key: 'student_phone', label: 'Student Phone', type: 'phone', group: 'User Info', width: 120 },
  { key: 'student_address', label: 'Address', type: 'text', group: 'User Info', width: 200 },
  { key: 'pickup_stop', label: 'Pickup Stop', type: 'text', group: 'User Info', sortable: true, width: 150 },
  { key: 'drop_stop', label: 'Drop Stop', type: 'text', group: 'User Info', sortable: true, width: 150 },
  { key: 'transport_type', label: 'Transport Type', type: 'badge', group: 'User Info', sortable: true, width: 120 },
  { key: 'allocation_date', label: 'Allocation Date', type: 'date', group: 'User Info', sortable: true, width: 120, render: (v) => v ? formatDate(v) : '-' },
  { key: 'user_status', label: 'User Status', type: 'badge', group: 'User Info', sortable: true, width: 100 },
  
  // ─────────────────────────────────────────────────────────────────────────────
  // CONTACT INFORMATION
  // ─────────────────────────────────────────────────────────────────────────────
  { key: 'father_name', label: 'Father Name', type: 'text', group: 'Contact Info', width: 150 },
  { key: 'father_phone', label: 'Father Phone', type: 'phone', group: 'Contact Info', width: 120 },
  { key: 'mother_name', label: 'Mother Name', type: 'text', group: 'Contact Info', width: 150 },
  { key: 'mother_phone', label: 'Mother Phone', type: 'phone', group: 'Contact Info', width: 120 },
  { key: 'guardian_name', label: 'Guardian Name', type: 'text', group: 'Contact Info', width: 150 },
  { key: 'guardian_phone', label: 'Guardian Phone', type: 'phone', group: 'Contact Info', width: 120 },
  { key: 'emergency_contact', label: 'Emergency Contact', type: 'text', group: 'Contact Info', width: 150 },
  { key: 'emergency_phone', label: 'Emergency Phone', type: 'phone', group: 'Contact Info', width: 120 },
  { key: 'pickup_person', label: 'Pickup Person', type: 'text', group: 'Contact Info', width: 150 },
  { key: 'pickup_person_phone', label: 'Pickup Person Phone', type: 'phone', group: 'Contact Info', width: 140 },
  
  // ─────────────────────────────────────────────────────────────────────────────
  // FEE INFORMATION
  // ─────────────────────────────────────────────────────────────────────────────
  { key: 'transport_fee', label: 'Transport Fee', type: 'currency', group: 'Fee Info', sortable: true, width: 120 },
  { key: 'annual_fee', label: 'Annual Fee', type: 'currency', group: 'Fee Info', sortable: true, width: 110 },
  { key: 'monthly_fee', label: 'Monthly Fee', type: 'currency', group: 'Fee Info', sortable: true, width: 110 },
  { key: 'fee_paid', label: 'Fee Paid', type: 'currency', group: 'Fee Info', sortable: true, width: 100 },
  { key: 'fee_due', label: 'Fee Due', type: 'currency', group: 'Fee Info', sortable: true, width: 100 },
  { key: 'fee_discount', label: 'Discount', type: 'currency', group: 'Fee Info', sortable: true, width: 100 },
  { key: 'last_payment_date', label: 'Last Payment', type: 'date', group: 'Fee Info', sortable: true, width: 110, render: (v) => v ? formatDate(v) : '-' },
  { key: 'payment_status', label: 'Payment Status', type: 'badge', group: 'Fee Info', sortable: true, width: 120 },
  { key: 'due_date', label: 'Due Date', type: 'date', group: 'Fee Info', sortable: true, width: 100, render: (v) => v ? formatDate(v) : '-' },
  { key: 'days_overdue', label: 'Days Overdue', type: 'number', group: 'Fee Info', sortable: true, width: 100 },
  
  // ─────────────────────────────────────────────────────────────────────────────
  // TRIP & OPERATIONS
  // ─────────────────────────────────────────────────────────────────────────────
  { key: 'trip_id', label: 'Trip ID', type: 'text', group: 'Trip Info', sortable: true, width: 100 },
  { key: 'trip_date', label: 'Trip Date', type: 'date', group: 'Trip Info', sortable: true, width: 110, render: (v) => v ? formatDate(v) : '-' },
  { key: 'trip_type', label: 'Trip Type', type: 'badge', group: 'Trip Info', sortable: true, width: 100 },
  { key: 'departure_time', label: 'Departure Time', type: 'time', group: 'Trip Info', sortable: true, width: 120, render: (v) => v ? formatTime(v) : '-' },
  { key: 'arrival_time', label: 'Arrival Time', type: 'time', group: 'Trip Info', sortable: true, width: 110, render: (v) => v ? formatTime(v) : '-' },
  { key: 'actual_departure', label: 'Actual Departure', type: 'time', group: 'Trip Info', width: 120, render: (v) => v ? formatTime(v) : '-' },
  { key: 'actual_arrival', label: 'Actual Arrival', type: 'time', group: 'Trip Info', width: 110, render: (v) => v ? formatTime(v) : '-' },
  { key: 'delay_minutes', label: 'Delay (min)', type: 'number', group: 'Trip Info', sortable: true, width: 100 },
  { key: 'trip_status', label: 'Trip Status', type: 'badge', group: 'Trip Info', sortable: true, width: 100 },
  { key: 'odometer_start', label: 'Odometer Start', type: 'number', group: 'Trip Info', width: 110 },
  { key: 'odometer_end', label: 'Odometer End', type: 'number', group: 'Trip Info', width: 110 },
  { key: 'distance_covered', label: 'Distance Covered', type: 'number', group: 'Trip Info', sortable: true, width: 120 },
  { key: 'students_boarded', label: 'Students Boarded', type: 'number', group: 'Trip Info', sortable: true, width: 120 },
  
  // ─────────────────────────────────────────────────────────────────────────────
  // MAINTENANCE & INSURANCE
  // ─────────────────────────────────────────────────────────────────────────────
  { key: 'maintenance_id', label: 'Maintenance ID', type: 'text', group: 'Maintenance', sortable: true, width: 120 },
  { key: 'maintenance_type', label: 'Maintenance Type', type: 'badge', group: 'Maintenance', sortable: true, width: 130 },
  { key: 'maintenance_date', label: 'Maintenance Date', type: 'date', group: 'Maintenance', sortable: true, width: 130, render: (v) => v ? formatDate(v) : '-' },
  { key: 'maintenance_cost', label: 'Maintenance Cost', type: 'currency', group: 'Maintenance', sortable: true, width: 130 },
  { key: 'maintenance_status', label: 'Status', type: 'badge', group: 'Maintenance', sortable: true, width: 100 },
  { key: 'next_service_date', label: 'Next Service', type: 'date', group: 'Maintenance', sortable: true, width: 110, render: (v) => v ? formatDate(v) : '-' },
  { key: 'insurance_number', label: 'Insurance Number', type: 'text', group: 'Maintenance', width: 140 },
  { key: 'insurance_expiry', label: 'Insurance Expiry', type: 'date', group: 'Maintenance', sortable: true, width: 120, render: (v) => v ? formatDate(v) : '-' },
  { key: 'insurance_company', label: 'Insurance Company', type: 'text', group: 'Maintenance', width: 150 },
  { key: 'fitness_expiry', label: 'Fitness Expiry', type: 'date', group: 'Maintenance', sortable: true, width: 110, render: (v) => v ? formatDate(v) : '-' },
  { key: 'pollution_expiry', label: 'Pollution Expiry', type: 'date', group: 'Maintenance', sortable: true, width: 120, render: (v) => v ? formatDate(v) : '-' },
  { key: 'permit_expiry', label: 'Permit Expiry', type: 'date', group: 'Maintenance', sortable: true, width: 110, render: (v) => v ? formatDate(v) : '-' },
  
  // ─────────────────────────────────────────────────────────────────────────────
  // FUEL & EXPENSES
  // ─────────────────────────────────────────────────────────────────────────────
  { key: 'fuel_date', label: 'Fuel Date', type: 'date', group: 'Fuel Info', sortable: true, width: 100, render: (v) => v ? formatDate(v) : '-' },
  { key: 'fuel_quantity', label: 'Quantity (L)', type: 'number', group: 'Fuel Info', sortable: true, width: 100 },
  { key: 'fuel_cost', label: 'Fuel Cost', type: 'currency', group: 'Fuel Info', sortable: true, width: 100 },
  { key: 'price_per_liter', label: 'Price/Liter', type: 'currency', group: 'Fuel Info', sortable: true, width: 100 },
  { key: 'filling_station', label: 'Filling Station', type: 'text', group: 'Fuel Info', width: 150 },
  { key: 'monthly_fuel_cost', label: 'Monthly Fuel Cost', type: 'currency', group: 'Fuel Info', sortable: true, width: 130 },
  { key: 'total_expense', label: 'Total Expense', type: 'currency', group: 'Fuel Info', sortable: true, width: 120 },
  
  // ─────────────────────────────────────────────────────────────────────────────
  // INCIDENTS & SAFETY
  // ─────────────────────────────────────────────────────────────────────────────
  { key: 'incident_id', label: 'Incident ID', type: 'text', group: 'Incidents', sortable: true, width: 100 },
  { key: 'incident_type', label: 'Incident Type', type: 'badge', group: 'Incidents', sortable: true, width: 120 },
  { key: 'incident_date', label: 'Incident Date', type: 'date', group: 'Incidents', sortable: true, width: 110, render: (v) => v ? formatDate(v) : '-' },
  { key: 'incident_description', label: 'Description', type: 'text', group: 'Incidents', width: 200 },
  { key: 'incident_location', label: 'Location', type: 'text', group: 'Incidents', width: 150 },
  { key: 'incident_severity', label: 'Severity', type: 'badge', group: 'Incidents', sortable: true, width: 100 },
  { key: 'incident_status', label: 'Status', type: 'badge', group: 'Incidents', sortable: true, width: 100 },
  { key: 'resolution', label: 'Resolution', type: 'text', group: 'Incidents', width: 200 },
  { key: 'claim_amount', label: 'Claim Amount', type: 'currency', group: 'Incidents', sortable: true, width: 110 },
  
  // ─────────────────────────────────────────────────────────────────────────────
  // GPS & TRACKING
  // ─────────────────────────────────────────────────────────────────────────────
  { key: 'gps_latitude', label: 'Latitude', type: 'number', group: 'GPS Info', width: 100 },
  { key: 'gps_longitude', label: 'Longitude', type: 'number', group: 'GPS Info', width: 100 },
  { key: 'last_location', label: 'Last Location', type: 'text', group: 'GPS Info', width: 180 },
  { key: 'current_speed', label: 'Current Speed', type: 'number', group: 'GPS Info', sortable: true, width: 110 },
  { key: 'max_speed', label: 'Max Speed', type: 'number', group: 'GPS Info', sortable: true, width: 100 },
  { key: 'avg_speed', label: 'Avg Speed', type: 'number', group: 'GPS Info', sortable: true, width: 100 },
  { key: 'speed_violations', label: 'Speed Violations', type: 'number', group: 'GPS Info', sortable: true, width: 130 },
  { key: 'tracking_time', label: 'Tracking Time', type: 'datetime', group: 'GPS Info', width: 140, render: (v) => v ? formatDateTime(v) : '-' },
  
  // ─────────────────────────────────────────────────────────────────────────────
  // REQUEST & CHANGES
  // ─────────────────────────────────────────────────────────────────────────────
  { key: 'request_id', label: 'Request ID', type: 'text', group: 'Requests', sortable: true, width: 100 },
  { key: 'request_type', label: 'Request Type', type: 'badge', group: 'Requests', sortable: true, width: 120 },
  { key: 'request_date', label: 'Request Date', type: 'date', group: 'Requests', sortable: true, width: 110, render: (v) => v ? formatDate(v) : '-' },
  { key: 'current_route', label: 'Current Route', type: 'text', group: 'Requests', width: 150 },
  { key: 'requested_route', label: 'Requested Route', type: 'text', group: 'Requests', width: 150 },
  { key: 'request_reason', label: 'Reason', type: 'text', group: 'Requests', width: 200 },
  { key: 'request_status', label: 'Request Status', type: 'badge', group: 'Requests', sortable: true, width: 120 },
  { key: 'approved_by', label: 'Approved By', type: 'text', group: 'Requests', width: 130 },
  { key: 'approval_date', label: 'Approval Date', type: 'date', group: 'Requests', width: 110, render: (v) => v ? formatDate(v) : '-' },
  
  // ─────────────────────────────────────────────────────────────────────────────
  // CARD & ID
  // ─────────────────────────────────────────────────────────────────────────────
  { key: 'card_number', label: 'Card Number', type: 'text', group: 'Card Info', sortable: true, width: 120 },
  { key: 'card_issue_date', label: 'Card Issue Date', type: 'date', group: 'Card Info', width: 120, render: (v) => v ? formatDate(v) : '-' },
  { key: 'card_expiry_date', label: 'Card Expiry', type: 'date', group: 'Card Info', sortable: true, width: 110, render: (v) => v ? formatDate(v) : '-' },
  { key: 'card_status', label: 'Card Status', type: 'badge', group: 'Card Info', sortable: true, width: 100 },
  
  // ─────────────────────────────────────────────────────────────────────────────
  // STATISTICS & ANALYTICS
  // ─────────────────────────────────────────────────────────────────────────────
  { key: 'total_students', label: 'Total Students', type: 'number', group: 'Statistics', sortable: true, width: 110 },
  { key: 'active_users', label: 'Active Users', type: 'number', group: 'Statistics', sortable: true, width: 100 },
  { key: 'total_trips', label: 'Total Trips', type: 'number', group: 'Statistics', sortable: true, width: 100 },
  { key: 'on_time_trips', label: 'On-Time Trips', type: 'number', group: 'Statistics', sortable: true, width: 110 },
  { key: 'delayed_trips', label: 'Delayed Trips', type: 'number', group: 'Statistics', sortable: true, width: 110 },
  { key: 'attendance_rate', label: 'Attendance Rate', type: 'percentage', group: 'Statistics', sortable: true, width: 120 },
  { key: 'collection_amount', label: 'Collection Amount', type: 'currency', group: 'Statistics', sortable: true, width: 130 },
  { key: 'pending_amount', label: 'Pending Amount', type: 'currency', group: 'Statistics', sortable: true, width: 120 },
  
  // ─────────────────────────────────────────────────────────────────────────────
  // AUDIT & TIMESTAMPS
  // ─────────────────────────────────────────────────────────────────────────────
  { key: 'created_at', label: 'Created At', type: 'datetime', group: 'Audit', sortable: true, width: 150, render: (v) => v ? formatDateTime(v) : '-' },
  { key: 'updated_at', label: 'Updated At', type: 'datetime', group: 'Audit', sortable: true, width: 150, render: (v) => v ? formatDateTime(v) : '-' },
  { key: 'created_by', label: 'Created By', type: 'text', group: 'Audit', width: 130 },
  { key: 'remarks', label: 'Remarks', type: 'text', group: 'Audit', width: 200 },
];

// ═══════════════════════════════════════════════════════════════════════════════
// COLUMN SETS - Pre-defined column groups for templates
// ═══════════════════════════════════════════════════════════════════════════════

export const COLUMN_SETS = {
  // Route & Vehicle Templates
  route_master: ['route_id', 'route_name', 'route_code', 'start_point', 'end_point', 'total_distance', 'total_stops', 'estimated_time', 'route_fee', 'route_status'],
  route_students: ['route_name', 'student_name', 'enrollment_id', 'class_name', 'section_name', 'pickup_stop', 'drop_stop', 'father_phone'],
  stop_wise: ['route_name', 'stop_name', 'stop_sequence', 'pickup_time', 'drop_time', 'distance_from_school', 'stop_fee', 'students_at_stop'],
  vehicle_inventory: ['vehicle_number', 'vehicle_name', 'vehicle_type', 'vehicle_model', 'seating_capacity', 'fuel_type', 'vehicle_status', 'gps_enabled', 'driver_name'],
  vehicle_route: ['vehicle_number', 'vehicle_type', 'route_name', 'driver_name', 'driver_phone', 'seating_capacity', 'current_occupancy', 'occupancy_percent'],
  capacity_utilization: ['route_name', 'vehicle_number', 'seating_capacity', 'current_occupancy', 'available_seats', 'occupancy_percent', 'total_students'],
  distance_report: ['route_name', 'start_point', 'end_point', 'total_distance', 'total_stops', 'estimated_time', 'route_fee'],
  timing_report: ['route_name', 'stop_name', 'stop_sequence', 'pickup_time', 'drop_time', 'estimated_time'],
  change_requests: ['request_id', 'student_name', 'class_name', 'current_route', 'requested_route', 'request_reason', 'request_date', 'request_status', 'approved_by'],
  unallocated: ['student_name', 'enrollment_id', 'class_name', 'section_name', 'student_address', 'father_phone', 'request_date'],
  
  // Users & Fee Templates
  users_list: ['student_name', 'enrollment_id', 'class_name', 'section_name', 'route_name', 'pickup_stop', 'transport_type', 'user_status', 'allocation_date'],
  new_requests: ['request_id', 'student_name', 'class_name', 'student_address', 'father_phone', 'request_date', 'request_status'],
  fee_collection: ['student_name', 'enrollment_id', 'class_name', 'route_name', 'transport_fee', 'fee_paid', 'fee_due', 'last_payment_date', 'payment_status'],
  route_fee: ['route_name', 'total_students', 'transport_fee', 'collection_amount', 'pending_amount'],
  defaulters: ['student_name', 'enrollment_id', 'class_name', 'route_name', 'transport_fee', 'fee_due', 'days_overdue', 'father_phone'],
  pickup_contact: ['student_name', 'class_name', 'pickup_stop', 'pickup_person', 'pickup_person_phone', 'father_phone', 'mother_phone'],
  emergency_contact: ['student_name', 'class_name', 'route_name', 'emergency_contact', 'emergency_phone', 'father_phone', 'student_address'],
  card_status: ['student_name', 'enrollment_id', 'class_name', 'card_number', 'card_issue_date', 'card_expiry_date', 'card_status'],
  discontinued: ['student_name', 'enrollment_id', 'class_name', 'route_name', 'allocation_date', 'user_status', 'remarks'],
  history: ['student_name', 'enrollment_id', 'class_name', 'route_name', 'transport_type', 'allocation_date', 'user_status'],
  
  // Operations Templates
  trip_log: ['trip_date', 'route_name', 'vehicle_number', 'driver_name', 'trip_type', 'departure_time', 'arrival_time', 'students_boarded', 'trip_status'],
  driver_attendance: ['trip_date', 'driver_name', 'vehicle_number', 'route_name', 'departure_time', 'arrival_time', 'trip_status'],
  driver_performance: ['driver_name', 'total_trips', 'on_time_trips', 'delayed_trips', 'attendance_rate', 'speed_violations'],
  maintenance: ['vehicle_number', 'maintenance_type', 'maintenance_date', 'maintenance_cost', 'maintenance_status', 'next_service_date'],
  fuel_report: ['fuel_date', 'vehicle_number', 'driver_name', 'fuel_quantity', 'fuel_cost', 'price_per_liter', 'filling_station'],
  breakdown: ['incident_date', 'vehicle_number', 'route_name', 'incident_type', 'incident_description', 'incident_location', 'resolution', 'incident_status'],
  gps_report: ['vehicle_number', 'route_name', 'last_location', 'current_speed', 'max_speed', 'avg_speed', 'tracking_time'],
  speed_violation: ['vehicle_number', 'driver_name', 'route_name', 'incident_date', 'current_speed', 'max_speed', 'incident_location'],
  accident: ['incident_date', 'vehicle_number', 'driver_name', 'incident_type', 'incident_severity', 'incident_description', 'claim_amount', 'incident_status'],
  insurance: ['vehicle_number', 'insurance_number', 'insurance_company', 'insurance_expiry', 'fitness_expiry', 'pollution_expiry', 'permit_expiry'],
};

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get columns by keys
 */
export const getColumns = (keys) => {
  return keys.map(key => TRANSPORT_COLUMNS.find(c => c.key === key)).filter(Boolean);
};

/**
 * Get columns by group
 */
export const getColumnsByGroup = (group) => {
  return TRANSPORT_COLUMNS.filter(c => c.group === group);
};

/**
 * Get all column groups
 */
export const getColumnGroups = () => {
  const groups = [...new Set(TRANSPORT_COLUMNS.map(c => c.group))];
  return groups.map(name => ({
    name,
    columns: TRANSPORT_COLUMNS.filter(c => c.group === name)
  }));
};

export default TRANSPORT_COLUMNS;
