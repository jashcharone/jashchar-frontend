/**
 * Hostel Report Generator - Column Definitions
 * Day 6 - 8 Day Master Plan
 * 130+ columns for 30 hostel report templates
 */

import { formatDate, formatDateTime, formatTime } from '@/utils/dateUtils';

// ═══════════════════════════════════════════════════════════════════════════════
// HOSTEL COLUMNS - Complete Column Library
// ═══════════════════════════════════════════════════════════════════════════════

export const HOSTEL_COLUMNS = [
  // ─────────────────────────────────────────────────────────────────────────────
  // HOSTEL/BUILDING INFORMATION
  // ─────────────────────────────────────────────────────────────────────────────
  { key: 'hostel_id', label: 'Hostel ID', type: 'text', group: 'Hostel Info', sortable: true, width: 100 },
  { key: 'hostel_name', label: 'Hostel Name', type: 'text', group: 'Hostel Info', sortable: true, width: 150 },
  { key: 'hostel_code', label: 'Hostel Code', type: 'text', group: 'Hostel Info', sortable: true, width: 100 },
  { key: 'hostel_type', label: 'Hostel Type', type: 'badge', group: 'Hostel Info', sortable: true, width: 100 },
  { key: 'hostel_gender', label: 'Gender', type: 'badge', group: 'Hostel Info', sortable: true, width: 80 },
  { key: 'building_name', label: 'Building', type: 'text', group: 'Hostel Info', sortable: true, width: 120 },
  { key: 'total_floors', label: 'Total Floors', type: 'number', group: 'Hostel Info', sortable: true, width: 90 },
  { key: 'total_rooms', label: 'Total Rooms', type: 'number', group: 'Hostel Info', sortable: true, width: 100 },
  { key: 'total_beds', label: 'Total Beds', type: 'number', group: 'Hostel Info', sortable: true, width: 90 },
  { key: 'hostel_address', label: 'Address', type: 'text', group: 'Hostel Info', width: 200 },
  { key: 'warden_name', label: 'Warden Name', type: 'text', group: 'Hostel Info', width: 130 },
  { key: 'warden_phone', label: 'Warden Phone', type: 'phone', group: 'Hostel Info', width: 120 },
  
  // ─────────────────────────────────────────────────────────────────────────────
  // FLOOR INFORMATION
  // ─────────────────────────────────────────────────────────────────────────────
  { key: 'floor_id', label: 'Floor ID', type: 'text', group: 'Floor Info', sortable: true, width: 90 },
  { key: 'floor_number', label: 'Floor Number', type: 'number', group: 'Floor Info', sortable: true, width: 100 },
  { key: 'floor_name', label: 'Floor Name', type: 'text', group: 'Floor Info', sortable: true, width: 120 },
  { key: 'floor_rooms', label: 'Floor Rooms', type: 'number', group: 'Floor Info', sortable: true, width: 100 },
  { key: 'floor_beds', label: 'Floor Beds', type: 'number', group: 'Floor Info', sortable: true, width: 90 },
  { key: 'floor_occupancy', label: 'Floor Occupancy', type: 'number', group: 'Floor Info', sortable: true, width: 120 },
  
  // ─────────────────────────────────────────────────────────────────────────────
  // ROOM INFORMATION
  // ─────────────────────────────────────────────────────────────────────────────
  { key: 'room_id', label: 'Room ID', type: 'text', group: 'Room Info', sortable: true, width: 100 },
  { key: 'room_number', label: 'Room Number', type: 'text', group: 'Room Info', sortable: true, width: 110 },
  { key: 'room_name', label: 'Room Name', type: 'text', group: 'Room Info', sortable: true, width: 120 },
  { key: 'room_type', label: 'Room Type', type: 'badge', group: 'Room Info', sortable: true, width: 100 },
  { key: 'bed_capacity', label: 'Bed Capacity', type: 'number', group: 'Room Info', sortable: true, width: 100 },
  { key: 'occupied_beds', label: 'Occupied Beds', type: 'number', group: 'Room Info', sortable: true, width: 110 },
  { key: 'vacant_beds', label: 'Vacant Beds', type: 'number', group: 'Room Info', sortable: true, width: 100 },
  { key: 'occupancy_percent', label: 'Occupancy %', type: 'percentage', group: 'Room Info', sortable: true, width: 100 },
  { key: 'room_fee', label: 'Room Fee', type: 'currency', group: 'Room Info', sortable: true, width: 100 },
  { key: 'room_status', label: 'Room Status', type: 'badge', group: 'Room Info', sortable: true, width: 100 },
  { key: 'room_condition', label: 'Condition', type: 'badge', group: 'Room Info', sortable: true, width: 100 },
  { key: 'has_ac', label: 'AC', type: 'boolean', group: 'Room Info', width: 60 },
  { key: 'has_attached_bath', label: 'Attached Bath', type: 'boolean', group: 'Room Info', width: 110 },
  { key: 'has_balcony', label: 'Balcony', type: 'boolean', group: 'Room Info', width: 80 },
  { key: 'amenities', label: 'Amenities', type: 'text', group: 'Room Info', width: 180 },
  
  // ─────────────────────────────────────────────────────────────────────────────
  // BED INFORMATION
  // ─────────────────────────────────────────────────────────────────────────────
  { key: 'bed_id', label: 'Bed ID', type: 'text', group: 'Bed Info', sortable: true, width: 90 },
  { key: 'bed_number', label: 'Bed Number', type: 'text', group: 'Bed Info', sortable: true, width: 100 },
  { key: 'bed_type', label: 'Bed Type', type: 'badge', group: 'Bed Info', sortable: true, width: 90 },
  { key: 'bed_position', label: 'Position', type: 'text', group: 'Bed Info', width: 100 },
  { key: 'bed_status', label: 'Bed Status', type: 'badge', group: 'Bed Info', sortable: true, width: 100 },
  { key: 'bed_fee', label: 'Bed Fee', type: 'currency', group: 'Bed Info', sortable: true, width: 90 },
  
  // ─────────────────────────────────────────────────────────────────────────────
  // STUDENT/RESIDENT INFORMATION
  // ─────────────────────────────────────────────────────────────────────────────
  { key: 'student_id', label: 'Student ID', type: 'text', group: 'Student Info', sortable: true, width: 100 },
  { key: 'enrollment_id', label: 'Enroll ID', type: 'text', group: 'Student Info', sortable: true, width: 120 },
  { key: 'student_name', label: 'Student Name', type: 'text', group: 'Student Info', sortable: true, width: 150 },
  { key: 'class_name', label: 'Class', type: 'text', group: 'Student Info', sortable: true, width: 80 },
  { key: 'section_name', label: 'Section', type: 'text', group: 'Student Info', sortable: true, width: 70 },
  { key: 'roll_number', label: 'Roll No', type: 'text', group: 'Student Info', sortable: true, width: 70 },
  { key: 'gender', label: 'Gender', type: 'text', group: 'Student Info', sortable: true, width: 70 },
  { key: 'date_of_birth', label: 'DOB', type: 'date', group: 'Student Info', sortable: true, width: 100, render: (v) => v ? formatDate(v) : '-' },
  { key: 'age', label: 'Age', type: 'number', group: 'Student Info', sortable: true, width: 60 },
  { key: 'blood_group', label: 'Blood Group', type: 'text', group: 'Student Info', width: 90 },
  { key: 'student_phone', label: 'Student Phone', type: 'phone', group: 'Student Info', width: 120 },
  { key: 'student_email', label: 'Email', type: 'email', group: 'Student Info', width: 180 },
  { key: 'permanent_address', label: 'Permanent Address', type: 'text', group: 'Student Info', width: 200 },
  { key: 'photo_url', label: 'Photo', type: 'image', group: 'Student Info', width: 60 },
  
  // ─────────────────────────────────────────────────────────────────────────────
  // ALLOCATION INFORMATION
  // ─────────────────────────────────────────────────────────────────────────────
  { key: 'allocation_id', label: 'Allocation ID', type: 'text', group: 'Allocation', sortable: true, width: 110 },
  { key: 'allocation_date', label: 'Allocation Date', type: 'date', group: 'Allocation', sortable: true, width: 120, render: (v) => v ? formatDate(v) : '-' },
  { key: 'check_in_date', label: 'Check-in Date', type: 'date', group: 'Allocation', sortable: true, width: 110, render: (v) => v ? formatDate(v) : '-' },
  { key: 'expected_checkout', label: 'Expected Checkout', type: 'date', group: 'Allocation', sortable: true, width: 130, render: (v) => v ? formatDate(v) : '-' },
  { key: 'actual_checkout', label: 'Actual Checkout', type: 'date', group: 'Allocation', width: 120, render: (v) => v ? formatDate(v) : '-' },
  { key: 'allocation_status', label: 'Status', type: 'badge', group: 'Allocation', sortable: true, width: 100 },
  { key: 'stay_duration', label: 'Stay Duration', type: 'text', group: 'Allocation', width: 110 },
  { key: 'days_stayed', label: 'Days Stayed', type: 'number', group: 'Allocation', sortable: true, width: 100 },
  
  // ─────────────────────────────────────────────────────────────────────────────
  // GUARDIAN/CONTACT INFORMATION
  // ─────────────────────────────────────────────────────────────────────────────
  { key: 'father_name', label: 'Father Name', type: 'text', group: 'Guardian Info', width: 150 },
  { key: 'father_phone', label: 'Father Phone', type: 'phone', group: 'Guardian Info', width: 120 },
  { key: 'father_occupation', label: 'Father Occupation', type: 'text', group: 'Guardian Info', width: 130 },
  { key: 'mother_name', label: 'Mother Name', type: 'text', group: 'Guardian Info', width: 150 },
  { key: 'mother_phone', label: 'Mother Phone', type: 'phone', group: 'Guardian Info', width: 120 },
  { key: 'guardian_name', label: 'Guardian Name', type: 'text', group: 'Guardian Info', width: 150 },
  { key: 'guardian_phone', label: 'Guardian Phone', type: 'phone', group: 'Guardian Info', width: 120 },
  { key: 'guardian_relation', label: 'Relation', type: 'text', group: 'Guardian Info', width: 100 },
  { key: 'emergency_contact', label: 'Emergency Contact', type: 'text', group: 'Guardian Info', width: 150 },
  { key: 'emergency_phone', label: 'Emergency Phone', type: 'phone', group: 'Guardian Info', width: 130 },
  { key: 'local_guardian_name', label: 'Local Guardian', type: 'text', group: 'Guardian Info', width: 140 },
  { key: 'local_guardian_phone', label: 'Local Guardian Phone', type: 'phone', group: 'Guardian Info', width: 140 },
  { key: 'local_guardian_address', label: 'Local Guardian Address', type: 'text', group: 'Guardian Info', width: 200 },
  
  // ─────────────────────────────────────────────────────────────────────────────
  // ATTENDANCE & LEAVE
  // ─────────────────────────────────────────────────────────────────────────────
  { key: 'attendance_date', label: 'Date', type: 'date', group: 'Attendance', sortable: true, width: 100, render: (v) => v ? formatDate(v) : '-' },
  { key: 'attendance_status', label: 'Attendance', type: 'badge', group: 'Attendance', sortable: true, width: 100 },
  { key: 'check_in_time', label: 'Check-in Time', type: 'time', group: 'Attendance', width: 110, render: (v) => v ? formatTime(v) : '-' },
  { key: 'check_out_time', label: 'Check-out Time', type: 'time', group: 'Attendance', width: 120, render: (v) => v ? formatTime(v) : '-' },
  { key: 'present_days', label: 'Present Days', type: 'number', group: 'Attendance', sortable: true, width: 100 },
  { key: 'absent_days', label: 'Absent Days', type: 'number', group: 'Attendance', sortable: true, width: 100 },
  { key: 'leave_days', label: 'Leave Days', type: 'number', group: 'Attendance', sortable: true, width: 90 },
  { key: 'attendance_percent', label: 'Attendance %', type: 'percentage', group: 'Attendance', sortable: true, width: 110 },
  { key: 'leave_id', label: 'Leave ID', type: 'text', group: 'Attendance', sortable: true, width: 90 },
  { key: 'leave_type', label: 'Leave Type', type: 'badge', group: 'Attendance', sortable: true, width: 100 },
  { key: 'leave_from', label: 'Leave From', type: 'date', group: 'Attendance', sortable: true, width: 100, render: (v) => v ? formatDate(v) : '-' },
  { key: 'leave_to', label: 'Leave To', type: 'date', group: 'Attendance', sortable: true, width: 100, render: (v) => v ? formatDate(v) : '-' },
  { key: 'leave_reason', label: 'Reason', type: 'text', group: 'Attendance', width: 180 },
  { key: 'leave_status', label: 'Leave Status', type: 'badge', group: 'Attendance', sortable: true, width: 100 },
  { key: 'approved_by', label: 'Approved By', type: 'text', group: 'Attendance', width: 120 },
  
  // ─────────────────────────────────────────────────────────────────────────────
  // NIGHT OUT INFORMATION
  // ─────────────────────────────────────────────────────────────────────────────
  { key: 'nightout_id', label: 'Night Out ID', type: 'text', group: 'Night Out', sortable: true, width: 100 },
  { key: 'nightout_date', label: 'Night Out Date', type: 'date', group: 'Night Out', sortable: true, width: 120, render: (v) => v ? formatDate(v) : '-' },
  { key: 'return_date', label: 'Return Date', type: 'date', group: 'Night Out', sortable: true, width: 110, render: (v) => v ? formatDate(v) : '-' },
  { key: 'nightout_reason', label: 'Reason', type: 'text', group: 'Night Out', width: 180 },
  { key: 'destination', label: 'Destination', type: 'text', group: 'Night Out', width: 150 },
  { key: 'nightout_status', label: 'Status', type: 'badge', group: 'Night Out', sortable: true, width: 100 },
  { key: 'total_nightouts', label: 'Total Night Outs', type: 'number', group: 'Night Out', sortable: true, width: 120 },
  
  // ─────────────────────────────────────────────────────────────────────────────
  // DISCIPLINE & INCIDENTS
  // ─────────────────────────────────────────────────────────────────────────────
  { key: 'incident_id', label: 'Incident ID', type: 'text', group: 'Discipline', sortable: true, width: 100 },
  { key: 'incident_date', label: 'Incident Date', type: 'date', group: 'Discipline', sortable: true, width: 110, render: (v) => v ? formatDate(v) : '-' },
  { key: 'incident_type', label: 'Incident Type', type: 'badge', group: 'Discipline', sortable: true, width: 120 },
  { key: 'incident_description', label: 'Description', type: 'text', group: 'Discipline', width: 200 },
  { key: 'severity', label: 'Severity', type: 'badge', group: 'Discipline', sortable: true, width: 90 },
  { key: 'action_taken', label: 'Action Taken', type: 'text', group: 'Discipline', width: 180 },
  { key: 'discipline_points', label: 'Points', type: 'number', group: 'Discipline', sortable: true, width: 80 },
  { key: 'total_incidents', label: 'Total Incidents', type: 'number', group: 'Discipline', sortable: true, width: 110 },
  
  // ─────────────────────────────────────────────────────────────────────────────
  // MEDICAL INFORMATION
  // ─────────────────────────────────────────────────────────────────────────────
  { key: 'medical_id', label: 'Medical ID', type: 'text', group: 'Medical', sortable: true, width: 100 },
  { key: 'medical_date', label: 'Date', type: 'date', group: 'Medical', sortable: true, width: 100, render: (v) => v ? formatDate(v) : '-' },
  { key: 'medical_condition', label: 'Condition', type: 'text', group: 'Medical', width: 150 },
  { key: 'symptoms', label: 'Symptoms', type: 'text', group: 'Medical', width: 180 },
  { key: 'treatment', label: 'Treatment', type: 'text', group: 'Medical', width: 180 },
  { key: 'doctor_name', label: 'Doctor', type: 'text', group: 'Medical', width: 130 },
  { key: 'allergies', label: 'Allergies', type: 'text', group: 'Medical', width: 150 },
  { key: 'chronic_conditions', label: 'Chronic Conditions', type: 'text', group: 'Medical', width: 160 },
  { key: 'current_medication', label: 'Current Medication', type: 'text', group: 'Medical', width: 160 },
  
  // ─────────────────────────────────────────────────────────────────────────────
  // FEE INFORMATION
  // ─────────────────────────────────────────────────────────────────────────────
  { key: 'fee_id', label: 'Fee ID', type: 'text', group: 'Fee Info', sortable: true, width: 90 },
  { key: 'hostel_fee', label: 'Hostel Fee', type: 'currency', group: 'Fee Info', sortable: true, width: 110 },
  { key: 'mess_fee', label: 'Mess Fee', type: 'currency', group: 'Fee Info', sortable: true, width: 100 },
  { key: 'total_fee', label: 'Total Fee', type: 'currency', group: 'Fee Info', sortable: true, width: 100 },
  { key: 'annual_fee', label: 'Annual Fee', type: 'currency', group: 'Fee Info', sortable: true, width: 100 },
  { key: 'monthly_fee', label: 'Monthly Fee', type: 'currency', group: 'Fee Info', sortable: true, width: 100 },
  { key: 'fee_paid', label: 'Fee Paid', type: 'currency', group: 'Fee Info', sortable: true, width: 100 },
  { key: 'fee_due', label: 'Fee Due', type: 'currency', group: 'Fee Info', sortable: true, width: 90 },
  { key: 'fee_discount', label: 'Discount', type: 'currency', group: 'Fee Info', sortable: true, width: 90 },
  { key: 'late_fee', label: 'Late Fee', type: 'currency', group: 'Fee Info', sortable: true, width: 90 },
  { key: 'last_payment_date', label: 'Last Payment', type: 'date', group: 'Fee Info', sortable: true, width: 110, render: (v) => v ? formatDate(v) : '-' },
  { key: 'payment_status', label: 'Payment Status', type: 'badge', group: 'Fee Info', sortable: true, width: 120 },
  { key: 'due_date', label: 'Due Date', type: 'date', group: 'Fee Info', sortable: true, width: 100, render: (v) => v ? formatDate(v) : '-' },
  { key: 'days_overdue', label: 'Days Overdue', type: 'number', group: 'Fee Info', sortable: true, width: 100 },
  { key: 'receipt_number', label: 'Receipt No', type: 'text', group: 'Fee Info', sortable: true, width: 110 },
  
  // ─────────────────────────────────────────────────────────────────────────────
  // MESS INFORMATION
  // ─────────────────────────────────────────────────────────────────────────────
  { key: 'mess_id', label: 'Mess ID', type: 'text', group: 'Mess Info', sortable: true, width: 90 },
  { key: 'mess_name', label: 'Mess Name', type: 'text', group: 'Mess Info', sortable: true, width: 120 },
  { key: 'mess_type', label: 'Mess Type', type: 'badge', group: 'Mess Info', sortable: true, width: 100 },
  { key: 'meal_plan', label: 'Meal Plan', type: 'text', group: 'Mess Info', width: 120 },
  { key: 'diet_preference', label: 'Diet Preference', type: 'badge', group: 'Mess Info', sortable: true, width: 120 },
  { key: 'mess_allocation_date', label: 'Mess Allocation', type: 'date', group: 'Mess Info', width: 120, render: (v) => v ? formatDate(v) : '-' },
  { key: 'mess_status', label: 'Mess Status', type: 'badge', group: 'Mess Info', sortable: true, width: 100 },
  { key: 'meal_date', label: 'Meal Date', type: 'date', group: 'Mess Info', sortable: true, width: 100, render: (v) => v ? formatDate(v) : '-' },
  { key: 'breakfast', label: 'Breakfast', type: 'boolean', group: 'Mess Info', width: 80 },
  { key: 'lunch', label: 'Lunch', type: 'boolean', group: 'Mess Info', width: 70 },
  { key: 'dinner', label: 'Dinner', type: 'boolean', group: 'Mess Info', width: 70 },
  { key: 'snacks', label: 'Snacks', type: 'boolean', group: 'Mess Info', width: 70 },
  { key: 'meals_taken', label: 'Meals Taken', type: 'number', group: 'Mess Info', sortable: true, width: 100 },
  { key: 'meals_missed', label: 'Meals Missed', type: 'number', group: 'Mess Info', sortable: true, width: 100 },
  
  // ─────────────────────────────────────────────────────────────────────────────
  // VISITOR INFORMATION
  // ─────────────────────────────────────────────────────────────────────────────
  { key: 'visitor_id', label: 'Visitor ID', type: 'text', group: 'Visitor Info', sortable: true, width: 100 },
  { key: 'visitor_name', label: 'Visitor Name', type: 'text', group: 'Visitor Info', sortable: true, width: 140 },
  { key: 'visitor_relation', label: 'Relation', type: 'text', group: 'Visitor Info', width: 100 },
  { key: 'visitor_phone', label: 'Visitor Phone', type: 'phone', group: 'Visitor Info', width: 120 },
  { key: 'visitor_address', label: 'Visitor Address', type: 'text', group: 'Visitor Info', width: 180 },
  { key: 'visit_date', label: 'Visit Date', type: 'date', group: 'Visitor Info', sortable: true, width: 100, render: (v) => v ? formatDate(v) : '-' },
  { key: 'visit_in_time', label: 'In Time', type: 'time', group: 'Visitor Info', width: 90, render: (v) => v ? formatTime(v) : '-' },
  { key: 'visit_out_time', label: 'Out Time', type: 'time', group: 'Visitor Info', width: 90, render: (v) => v ? formatTime(v) : '-' },
  { key: 'visit_purpose', label: 'Purpose', type: 'text', group: 'Visitor Info', width: 150 },
  { key: 'id_proof_type', label: 'ID Proof Type', type: 'text', group: 'Visitor Info', width: 110 },
  { key: 'id_proof_number', label: 'ID Number', type: 'text', group: 'Visitor Info', width: 120 },
  { key: 'total_visits', label: 'Total Visits', type: 'number', group: 'Visitor Info', sortable: true, width: 100 },
  
  // ─────────────────────────────────────────────────────────────────────────────
  // REQUESTS & MAINTENANCE
  // ─────────────────────────────────────────────────────────────────────────────
  { key: 'request_id', label: 'Request ID', type: 'text', group: 'Requests', sortable: true, width: 100 },
  { key: 'request_type', label: 'Request Type', type: 'badge', group: 'Requests', sortable: true, width: 120 },
  { key: 'request_date', label: 'Request Date', type: 'date', group: 'Requests', sortable: true, width: 110, render: (v) => v ? formatDate(v) : '-' },
  { key: 'request_description', label: 'Description', type: 'text', group: 'Requests', width: 200 },
  { key: 'current_room', label: 'Current Room', type: 'text', group: 'Requests', width: 110 },
  { key: 'requested_room', label: 'Requested Room', type: 'text', group: 'Requests', width: 120 },
  { key: 'request_reason', label: 'Reason', type: 'text', group: 'Requests', width: 180 },
  { key: 'request_status', label: 'Status', type: 'badge', group: 'Requests', sortable: true, width: 100 },
  { key: 'maintenance_type', label: 'Maintenance Type', type: 'badge', group: 'Requests', sortable: true, width: 130 },
  { key: 'maintenance_cost', label: 'Maintenance Cost', type: 'currency', group: 'Requests', sortable: true, width: 130 },
  { key: 'maintenance_status', label: 'Maint. Status', type: 'badge', group: 'Requests', sortable: true, width: 110 },
  
  // ─────────────────────────────────────────────────────────────────────────────
  // FEEDBACK INFORMATION
  // ─────────────────────────────────────────────────────────────────────────────
  { key: 'feedback_id', label: 'Feedback ID', type: 'text', group: 'Feedback', sortable: true, width: 100 },
  { key: 'feedback_date', label: 'Feedback Date', type: 'date', group: 'Feedback', sortable: true, width: 110, render: (v) => v ? formatDate(v) : '-' },
  { key: 'feedback_type', label: 'Type', type: 'badge', group: 'Feedback', sortable: true, width: 100 },
  { key: 'feedback_category', label: 'Category', type: 'text', group: 'Feedback', width: 120 },
  { key: 'feedback_text', label: 'Feedback', type: 'text', group: 'Feedback', width: 200 },
  { key: 'rating', label: 'Rating', type: 'number', group: 'Feedback', sortable: true, width: 80 },
  { key: 'feedback_status', label: 'Status', type: 'badge', group: 'Feedback', sortable: true, width: 100 },
  
  // ─────────────────────────────────────────────────────────────────────────────
  // STATISTICS & REVENUE
  // ─────────────────────────────────────────────────────────────────────────────
  { key: 'total_students', label: 'Total Students', type: 'number', group: 'Statistics', sortable: true, width: 110 },
  { key: 'active_residents', label: 'Active Residents', type: 'number', group: 'Statistics', sortable: true, width: 120 },
  { key: 'new_admissions', label: 'New Admissions', type: 'number', group: 'Statistics', sortable: true, width: 120 },
  { key: 'checkouts', label: 'Checkouts', type: 'number', group: 'Statistics', sortable: true, width: 90 },
  { key: 'collection_amount', label: 'Collection', type: 'currency', group: 'Statistics', sortable: true, width: 110 },
  { key: 'pending_amount', label: 'Pending', type: 'currency', group: 'Statistics', sortable: true, width: 100 },
  { key: 'total_revenue', label: 'Total Revenue', type: 'currency', group: 'Statistics', sortable: true, width: 110 },
  { key: 'expense_amount', label: 'Expenses', type: 'currency', group: 'Statistics', sortable: true, width: 100 },
  
  // ─────────────────────────────────────────────────────────────────────────────
  // AUDIT & TIMESTAMPS
  // ─────────────────────────────────────────────────────────────────────────────
  { key: 'created_at', label: 'Created At', type: 'datetime', group: 'Audit', sortable: true, width: 150, render: (v) => v ? formatDateTime(v) : '-' },
  { key: 'updated_at', label: 'Updated At', type: 'datetime', group: 'Audit', sortable: true, width: 150, render: (v) => v ? formatDateTime(v) : '-' },
  { key: 'created_by', label: 'Created By', type: 'text', group: 'Audit', width: 120 },
  { key: 'remarks', label: 'Remarks', type: 'text', group: 'Audit', width: 200 },
];

// ═══════════════════════════════════════════════════════════════════════════════
// COLUMN SETS - Pre-defined column groups for templates
// ═══════════════════════════════════════════════════════════════════════════════

export const COLUMN_SETS = {
  // Accommodation Templates
  room_inventory: ['room_number', 'room_name', 'floor_number', 'room_type', 'bed_capacity', 'occupied_beds', 'vacant_beds', 'room_fee', 'room_status', 'room_condition'],
  room_allocation: ['room_number', 'bed_number', 'student_name', 'enrollment_id', 'class_name', 'allocation_date', 'allocation_status'],
  occupancy: ['hostel_name', 'floor_number', 'room_number', 'bed_capacity', 'occupied_beds', 'vacant_beds', 'occupancy_percent'],
  floor_summary: ['hostel_name', 'floor_number', 'floor_name', 'floor_rooms', 'floor_beds', 'floor_occupancy', 'occupancy_percent'],
  vacant_beds: ['hostel_name', 'floor_number', 'room_number', 'bed_number', 'bed_type', 'room_type', 'bed_status', 'bed_fee'],
  room_type_wise: ['room_type', 'total_rooms', 'total_beds', 'occupied_beds', 'vacant_beds', 'occupancy_percent', 'room_fee'],
  change_requests: ['request_id', 'student_name', 'class_name', 'current_room', 'requested_room', 'request_reason', 'request_date', 'request_status'],
  maintenance: ['room_number', 'maintenance_type', 'request_date', 'request_description', 'maintenance_cost', 'maintenance_status'],
  room_condition: ['room_number', 'floor_number', 'room_type', 'room_condition', 'amenities', 'has_ac', 'has_attached_bath', 'remarks'],
  new_requests: ['request_id', 'student_name', 'class_name', 'permanent_address', 'father_phone', 'request_date', 'request_status'],
  
  // Student Templates
  students_list: ['student_name', 'enrollment_id', 'class_name', 'section_name', 'hostel_name', 'room_number', 'bed_number', 'allocation_date', 'allocation_status'],
  class_wise: ['class_name', 'section_name', 'student_name', 'enrollment_id', 'room_number', 'hostel_name', 'father_phone'],
  guardian_info: ['student_name', 'class_name', 'room_number', 'father_name', 'father_phone', 'mother_name', 'mother_phone', 'guardian_name', 'guardian_phone'],
  emergency_contact: ['student_name', 'class_name', 'room_number', 'emergency_contact', 'emergency_phone', 'local_guardian_name', 'local_guardian_phone'],
  attendance_report: ['attendance_date', 'student_name', 'class_name', 'room_number', 'attendance_status', 'check_in_time', 'check_out_time'],
  leave_record: ['leave_id', 'student_name', 'class_name', 'leave_type', 'leave_from', 'leave_to', 'leave_reason', 'leave_status', 'approved_by'],
  night_out: ['nightout_id', 'student_name', 'class_name', 'room_number', 'nightout_date', 'return_date', 'destination', 'nightout_reason', 'nightout_status'],
  discipline: ['incident_id', 'student_name', 'class_name', 'room_number', 'incident_date', 'incident_type', 'severity', 'action_taken'],
  medical_record: ['medical_id', 'student_name', 'class_name', 'medical_date', 'medical_condition', 'symptoms', 'treatment', 'doctor_name'],
  room_mate: ['room_number', 'student_name', 'enrollment_id', 'class_name', 'bed_number', 'father_phone'],
  
  // Fee & Mess Templates
  fee_collection: ['student_name', 'enrollment_id', 'class_name', 'room_number', 'hostel_fee', 'mess_fee', 'total_fee', 'fee_paid', 'fee_due', 'payment_status'],
  defaulters: ['student_name', 'enrollment_id', 'class_name', 'room_number', 'total_fee', 'fee_due', 'days_overdue', 'father_phone'],
  mess_allocation: ['student_name', 'class_name', 'room_number', 'mess_name', 'mess_type', 'diet_preference', 'meal_plan', 'mess_status'],
  mess_attendance: ['meal_date', 'student_name', 'class_name', 'breakfast', 'lunch', 'dinner', 'snacks', 'meals_taken'],
  feedback: ['feedback_id', 'student_name', 'feedback_date', 'feedback_type', 'feedback_category', 'rating', 'feedback_text', 'feedback_status'],
  mess_menu: ['meal_date', 'breakfast', 'lunch', 'dinner', 'snacks', 'remarks'],
  expense_report: ['request_date', 'maintenance_type', 'room_number', 'request_description', 'maintenance_cost', 'maintenance_status'],
  visitor_log: ['visit_date', 'visitor_name', 'student_name', 'visitor_relation', 'visitor_phone', 'visit_in_time', 'visit_out_time', 'visit_purpose'],
  checkout_report: ['student_name', 'enrollment_id', 'class_name', 'room_number', 'check_in_date', 'actual_checkout', 'days_stayed', 'remarks'],
  revenue_report: ['hostel_name', 'total_students', 'collection_amount', 'pending_amount', 'total_revenue', 'expense_amount'],
};

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get columns by keys
 */
export const getColumns = (keys) => {
  return keys.map(key => HOSTEL_COLUMNS.find(c => c.key === key)).filter(Boolean);
};

/**
 * Get columns by group
 */
export const getColumnsByGroup = (group) => {
  return HOSTEL_COLUMNS.filter(c => c.group === group);
};

/**
 * Get all column groups
 */
export const getColumnGroups = () => {
  const groups = [...new Set(HOSTEL_COLUMNS.map(c => c.group))];
  return groups.map(name => ({
    name,
    columns: HOSTEL_COLUMNS.filter(c => c.group === name)
  }));
};

export default HOSTEL_COLUMNS;
