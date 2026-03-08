/**
 * Finance Report Generator - Column Definitions
 * Module 2: 40 Finance Reports across 4 categories
 * 
 * Categories:
 * 1. Collection Reports (15)
 * 2. Outstanding Reports (10)
 * 3. Concession & Scholarship (8)
 * 4. Financial Analysis (7)
 */

// ═══════════════════════════════════════════════════════════════════════════════
// COLUMN DEFINITIONS BY CATEGORY
// ═══════════════════════════════════════════════════════════════════════════════

// 💰 COLLECTION COLUMNS
export const COLLECTION_COLUMNS = [
  // Basic Info
  { key: 'date', label: 'Date', type: 'date', width: 100, sortable: true },
  { key: 'receipt_no', label: 'Receipt No', type: 'string', width: 100 },
  { key: 'student_name', label: 'Student Name', type: 'string', width: 180, sortable: true },
  { key: 'admission_no', label: 'Admission No', type: 'string', width: 100 },
  { key: 'class_name', label: 'Class', type: 'string', width: 80, groupable: true },
  { key: 'section_name', label: 'Section', type: 'string', width: 80, groupable: true },
  
  // Payment Details
  { key: 'fee_head', label: 'Fee Head', type: 'string', width: 150, groupable: true },
  { key: 'amount', label: 'Amount', type: 'currency', width: 120, sortable: true, aggregate: 'sum' },
  { key: 'cash_amount', label: 'Cash', type: 'currency', width: 100, aggregate: 'sum' },
  { key: 'online_amount', label: 'Online', type: 'currency', width: 100, aggregate: 'sum' },
  { key: 'cheque_amount', label: 'Cheque', type: 'currency', width: 100, aggregate: 'sum' },
  { key: 'card_amount', label: 'Card', type: 'currency', width: 100, aggregate: 'sum' },
  { key: 'upi_amount', label: 'UPI', type: 'currency', width: 100, aggregate: 'sum' },
  { key: 'total_collection', label: 'Total Collection', type: 'currency', width: 130, sortable: true, aggregate: 'sum' },
  
  // Payment Mode
  { key: 'payment_mode', label: 'Payment Mode', type: 'badge', width: 120, groupable: true },
  { key: 'transaction_id', label: 'Transaction ID', type: 'string', width: 150 },
  { key: 'bank_name', label: 'Bank', type: 'string', width: 120, groupable: true },
  { key: 'cheque_no', label: 'Cheque No', type: 'string', width: 120 },
  { key: 'cheque_date', label: 'Cheque Date', type: 'date', width: 100 },
  { key: 'cheque_status', label: 'Cheque Status', type: 'badge', width: 110 },
  { key: 'payment_gateway', label: 'Gateway', type: 'string', width: 100, groupable: true },
  
  // Receipt Info
  { key: 'receipt_status', label: 'Receipt Status', type: 'badge', width: 120 },
  { key: 'cancel_reason', label: 'Cancel Reason', type: 'string', width: 150 },
  { key: 'cancelled_by', label: 'Cancelled By', type: 'string', width: 120 },
  { key: 'cancelled_date', label: 'Cancelled Date', type: 'date', width: 110 },
  
  // Cashier/User Info
  { key: 'cashier_name', label: 'Cashier', type: 'string', width: 130, groupable: true },
  { key: 'collected_by', label: 'Collected By', type: 'string', width: 130 },
  { key: 'collection_hour', label: 'Hour', type: 'string', width: 80, groupable: true },
  { key: 'collection_shift', label: 'Shift', type: 'string', width: 80, groupable: true },
  
  // Partial/Advance
  { key: 'total_fee', label: 'Total Fee', type: 'currency', width: 110, aggregate: 'sum' },
  { key: 'paid_amount', label: 'Paid Amount', type: 'currency', width: 110, aggregate: 'sum' },
  { key: 'balance', label: 'Balance', type: 'currency', width: 110, aggregate: 'sum' },
  { key: 'last_payment_date', label: 'Last Payment', type: 'date', width: 110 },
  { key: 'advance_amount', label: 'Advance', type: 'currency', width: 100, aggregate: 'sum' },
  { key: 'advance_for_month', label: 'For Month', type: 'string', width: 100 },
  
  // Late Fee
  { key: 'original_due', label: 'Original Due', type: 'currency', width: 110 },
  { key: 'late_fee', label: 'Late Fee', type: 'currency', width: 100, aggregate: 'sum' },
  { key: 'late_days', label: 'Late Days', type: 'number', width: 90 },
  
  // Summary Stats
  { key: 'payment_count', label: 'Payments', type: 'number', width: 90, aggregate: 'sum' },
  { key: 'receipt_count', label: 'Receipts', type: 'number', width: 90, aggregate: 'sum' },
  { key: 'student_count', label: 'Students', type: 'number', width: 90, aggregate: 'sum' },
  { key: 'collection_percentage', label: 'Collection %', type: 'percentage', width: 100 },
];

// 📊 OUTSTANDING COLUMNS
export const OUTSTANDING_COLUMNS = [
  // Student Info
  { key: 'student_name', label: 'Student Name', type: 'string', width: 180, sortable: true },
  { key: 'admission_no', label: 'Admission No', type: 'string', width: 100 },
  { key: 'class_name', label: 'Class', type: 'string', width: 80, groupable: true },
  { key: 'section_name', label: 'Section', type: 'string', width: 80, groupable: true },
  { key: 'roll_no', label: 'Roll No', type: 'string', width: 80 },
  
  // Contact
  { key: 'father_name', label: 'Father Name', type: 'string', width: 150 },
  { key: 'father_phone', label: 'Father Phone', type: 'phone', width: 120 },
  { key: 'mother_phone', label: 'Mother Phone', type: 'phone', width: 120 },
  
  // Outstanding Details
  { key: 'total_fee', label: 'Total Fee', type: 'currency', width: 120, sortable: true, aggregate: 'sum' },
  { key: 'paid_amount', label: 'Paid', type: 'currency', width: 110, aggregate: 'sum' },
  { key: 'due_amount', label: 'Due Amount', type: 'currency', width: 120, sortable: true, aggregate: 'sum' },
  { key: 'due_date', label: 'Due Date', type: 'date', width: 100 },
  { key: 'overdue_days', label: 'Overdue Days', type: 'number', width: 100, sortable: true },
  { key: 'overdue_category', label: 'Overdue Category', type: 'badge', width: 130 },
  
  // Month-wise
  { key: 'opening_balance', label: 'Opening', type: 'currency', width: 100, aggregate: 'sum' },
  { key: 'fee_added', label: 'Added', type: 'currency', width: 100, aggregate: 'sum' },
  { key: 'collected', label: 'Collected', type: 'currency', width: 100, aggregate: 'sum' },
  { key: 'closing_balance', label: 'Closing', type: 'currency', width: 100, aggregate: 'sum' },
  
  // Follow-up
  { key: 'last_contact_date', label: 'Last Contact', type: 'date', width: 110 },
  { key: 'last_contact_by', label: 'Contacted By', type: 'string', width: 120 },
  { key: 'promise_date', label: 'Promise Date', type: 'date', width: 110 },
  { key: 'follow_up_status', label: 'Follow-up Status', type: 'badge', width: 120, groupable: true },
  { key: 'contact_notes', label: 'Notes', type: 'string', width: 200 },
  
  // Category
  { key: 'student_category', label: 'Category', type: 'badge', width: 100, groupable: true },
  { key: 'rte_status', label: 'RTE Status', type: 'badge', width: 100 },
  { key: 'rte_amount', label: 'RTE Amount', type: 'currency', width: 110 },
  { key: 'govt_pending', label: 'Govt Pending', type: 'currency', width: 110 },
  
  // New Students
  { key: 'admission_date', label: 'Admission Date', type: 'date', width: 110 },
  { key: 'is_new_student', label: 'New Student', type: 'boolean', width: 100 },
  
  // Stats
  { key: 'defaulter_count', label: 'Defaulters', type: 'number', width: 90, aggregate: 'sum' },
  { key: 'avg_due', label: 'Avg Due', type: 'currency', width: 100 },
  { key: 'high_defaulter', label: 'High Defaulter', type: 'boolean', width: 110 },
];

// 🎓 CONCESSION & SCHOLARSHIP COLUMNS
export const CONCESSION_COLUMNS = [
  // Student Info
  { key: 'student_name', label: 'Student Name', type: 'string', width: 180, sortable: true },
  { key: 'admission_no', label: 'Admission No', type: 'string', width: 100 },
  { key: 'class_name', label: 'Class', type: 'string', width: 80, groupable: true },
  { key: 'section_name', label: 'Section', type: 'string', width: 80 },
  
  // Concession Details
  { key: 'concession_type', label: 'Concession Type', type: 'badge', width: 140, groupable: true },
  { key: 'concession_name', label: 'Concession Name', type: 'string', width: 150 },
  { key: 'concession_amount', label: 'Amount', type: 'currency', width: 120, sortable: true, aggregate: 'sum' },
  { key: 'concession_percentage', label: 'Percentage', type: 'percentage', width: 100 },
  { key: 'fee_head', label: 'Fee Head', type: 'string', width: 120, groupable: true },
  
  // Scholarship
  { key: 'scholarship_name', label: 'Scholarship', type: 'string', width: 150, groupable: true },
  { key: 'scholarship_amount', label: 'Scholarship Amt', type: 'currency', width: 120, aggregate: 'sum' },
  { key: 'scholarship_status', label: 'Status', type: 'badge', width: 100, groupable: true },
  { key: 'disbursement_date', label: 'Disbursed Date', type: 'date', width: 110 },
  
  // Waiver
  { key: 'waiver_reason', label: 'Waiver Reason', type: 'string', width: 150, groupable: true },
  { key: 'waiver_amount', label: 'Waiver Amount', type: 'currency', width: 110, aggregate: 'sum' },
  { key: 'approved_by', label: 'Approved By', type: 'string', width: 120 },
  { key: 'approval_date', label: 'Approval Date', type: 'date', width: 100 },
  
  // Staff Ward
  { key: 'staff_name', label: 'Staff Name', type: 'string', width: 150 },
  { key: 'staff_department', label: 'Department', type: 'string', width: 120 },
  { key: 'ward_name', label: 'Ward Name', type: 'string', width: 150 },
  
  // Sibling
  { key: 'father_name', label: 'Father Name', type: 'string', width: 150 },
  { key: 'sibling_count', label: 'Siblings', type: 'number', width: 80 },
  { key: 'sibling_names', label: 'Sibling Names', type: 'string', width: 200 },
  { key: 'sibling_discount', label: 'Discount', type: 'currency', width: 100, aggregate: 'sum' },
  
  // Merit/Sports
  { key: 'marks_percentage', label: 'Marks %', type: 'percentage', width: 90 },
  { key: 'sport_name', label: 'Sport', type: 'string', width: 100, groupable: true },
  { key: 'achievement', label: 'Achievement', type: 'string', width: 150 },
  
  // EWS/BPL
  { key: 'economic_category', label: 'Category', type: 'badge', width: 100, groupable: true },
  { key: 'document_verified', label: 'Doc Verified', type: 'boolean', width: 100 },
  { key: 'document_type', label: 'Document Type', type: 'string', width: 120 },
];

// 📈 FINANCIAL ANALYSIS COLUMNS
export const ANALYSIS_COLUMNS = [
  // Period
  { key: 'month', label: 'Month', type: 'string', width: 100, groupable: true },
  { key: 'year', label: 'Year', type: 'string', width: 80, groupable: true },
  { key: 'quarter', label: 'Quarter', type: 'string', width: 80, groupable: true },
  { key: 'date', label: 'Date', type: 'date', width: 100 },
  
  // Projections
  { key: 'expected_amount', label: 'Expected', type: 'currency', width: 120, aggregate: 'sum' },
  { key: 'collected_amount', label: 'Collected', type: 'currency', width: 120, aggregate: 'sum' },
  { key: 'variance', label: 'Variance', type: 'currency', width: 110 },
  { key: 'variance_percentage', label: 'Variance %', type: 'percentage', width: 100 },
  
  // Year-on-Year
  { key: 'fee_head', label: 'Fee Head', type: 'string', width: 150, groupable: true },
  { key: 'last_year_amount', label: 'Last Year', type: 'currency', width: 120, aggregate: 'sum' },
  { key: 'this_year_amount', label: 'This Year', type: 'currency', width: 120, aggregate: 'sum' },
  { key: 'growth_amount', label: 'Growth', type: 'currency', width: 100 },
  { key: 'growth_percentage', label: 'Growth %', type: 'percentage', width: 100 },
  
  // Fee Structure
  { key: 'class_name', label: 'Class', type: 'string', width: 80, groupable: true },
  { key: 'fee_amount', label: 'Fee Amount', type: 'currency', width: 110 },
  { key: 'students_count', label: 'Students', type: 'number', width: 90, aggregate: 'sum' },
  { key: 'total_expected', label: 'Total Expected', type: 'currency', width: 120, aggregate: 'sum' },
  
  // Refund
  { key: 'student_name', label: 'Student Name', type: 'string', width: 180 },
  { key: 'refund_amount', label: 'Refund Amount', type: 'currency', width: 120, aggregate: 'sum' },
  { key: 'refund_reason', label: 'Reason', type: 'string', width: 150, groupable: true },
  { key: 'refund_date', label: 'Refund Date', type: 'date', width: 100 },
  { key: 'refund_status', label: 'Status', type: 'badge', width: 100 },
  
  // Journal
  { key: 'particulars', label: 'Particulars', type: 'string', width: 200 },
  { key: 'debit', label: 'Debit', type: 'currency', width: 100, aggregate: 'sum' },
  { key: 'credit', label: 'Credit', type: 'currency', width: 100, aggregate: 'sum' },
  { key: 'entry_type', label: 'Entry Type', type: 'badge', width: 100, groupable: true },
  
  // Bank Reconciliation
  { key: 'book_balance', label: 'Book Balance', type: 'currency', width: 120 },
  { key: 'bank_balance', label: 'Bank Balance', type: 'currency', width: 120 },
  { key: 'difference', label: 'Difference', type: 'currency', width: 100 },
  { key: 'reconciled', label: 'Reconciled', type: 'boolean', width: 90 },
  
  // GST
  { key: 'invoice_no', label: 'Invoice No', type: 'string', width: 120 },
  { key: 'taxable_amount', label: 'Taxable', type: 'currency', width: 100, aggregate: 'sum' },
  { key: 'cgst', label: 'CGST', type: 'currency', width: 80, aggregate: 'sum' },
  { key: 'sgst', label: 'SGST', type: 'currency', width: 80, aggregate: 'sum' },
  { key: 'igst', label: 'IGST', type: 'currency', width: 80, aggregate: 'sum' },
  { key: 'total_gst', label: 'Total GST', type: 'currency', width: 100, aggregate: 'sum' },
];

// 📋 FEE STRUCTURE COLUMNS
export const FEE_STRUCTURE_COLUMNS = [
  // Tuition Fee (Class-wise)
  { key: 'class_name', label: 'Class', type: 'string', width: 100, groupable: true, sortable: true },
  { key: 'fee_group_name', label: 'Fee Group', type: 'string', width: 150, groupable: true },
  { key: 'fee_type_name', label: 'Fee Type', type: 'string', width: 150, groupable: true },
  { key: 'fee_type_code', label: 'Code', type: 'string', width: 80 },
  { key: 'amount', label: 'Amount', type: 'currency', width: 120, sortable: true, aggregate: 'sum' },
  { key: 'due_date', label: 'Due Date', type: 'date', width: 100 },
  { key: 'fine_type', label: 'Fine Type', type: 'badge', width: 100 },
  { key: 'fine_value', label: 'Fine Value', type: 'currency', width: 100 },
  { key: 'is_fine_per_day', label: 'Per Day', type: 'boolean', width: 80 },
  { key: 'students_assigned', label: 'Students', type: 'number', width: 90, aggregate: 'sum' },
  { key: 'total_expected_amount', label: 'Total Expected', type: 'currency', width: 130, aggregate: 'sum' },
  
  // Transport Fee Structure
  { key: 'route_name', label: 'Route', type: 'string', width: 150, groupable: true },
  { key: 'vehicle_no', label: 'Vehicle No', type: 'string', width: 100 },
  { key: 'pickup_point', label: 'Pickup Point', type: 'string', width: 150, groupable: true },
  { key: 'distance_km', label: 'Distance (KM)', type: 'number', width: 100, sortable: true },
  { key: 'monthly_fee', label: 'Monthly Fee', type: 'currency', width: 120, aggregate: 'sum' },
  { key: 'quarterly_fee', label: 'Quarterly Fee', type: 'currency', width: 120 },
  { key: 'half_yearly_fee', label: 'Half Yearly Fee', type: 'currency', width: 130 },
  { key: 'annual_fee', label: 'Annual Fee', type: 'currency', width: 120 },
  { key: 'transport_students', label: 'Students', type: 'number', width: 90, aggregate: 'sum' },
  { key: 'month', label: 'Month', type: 'string', width: 100, groupable: true },
  { key: 'transport_due_date', label: 'Due Date', type: 'date', width: 100 },
  { key: 'transport_fine_type', label: 'Fine Type', type: 'badge', width: 100 },
  { key: 'transport_fine_value', label: 'Fine Value', type: 'currency', width: 100 },
  
  // Hostel Fee Structure
  { key: 'hostel_name', label: 'Hostel', type: 'string', width: 150, groupable: true },
  { key: 'room_type', label: 'Room Type', type: 'string', width: 120, groupable: true },
  { key: 'room_number', label: 'Room No', type: 'string', width: 80 },
  { key: 'capacity', label: 'Capacity', type: 'number', width: 80 },
  { key: 'occupied', label: 'Occupied', type: 'number', width: 80 },
  { key: 'hostel_monthly_fee', label: 'Monthly Fee', type: 'currency', width: 120, aggregate: 'sum' },
  { key: 'hostel_quarterly_fee', label: 'Quarterly Fee', type: 'currency', width: 120 },
  { key: 'hostel_half_yearly_fee', label: 'Half Yearly Fee', type: 'currency', width: 130 },
  { key: 'hostel_yearly_fee', label: 'Annual Fee', type: 'currency', width: 120 },
  { key: 'mess_fee', label: 'Mess Fee', type: 'currency', width: 100 },
  { key: 'total_hostel_fee', label: 'Total Fee', type: 'currency', width: 120, aggregate: 'sum' },
  { key: 'hostel_students', label: 'Students', type: 'number', width: 90, aggregate: 'sum' },
  
  // Exam Fee Structure
  { key: 'exam_name', label: 'Exam Name', type: 'string', width: 180, groupable: true },
  { key: 'exam_type', label: 'Exam Type', type: 'badge', width: 120, groupable: true },
  { key: 'exam_fee', label: 'Exam Fee', type: 'currency', width: 120, aggregate: 'sum' },
  { key: 'practical_fee', label: 'Practical Fee', type: 'currency', width: 120 },
  { key: 'registration_fee', label: 'Registration Fee', type: 'currency', width: 130 },
  { key: 'total_exam_fee', label: 'Total Fee', type: 'currency', width: 120, aggregate: 'sum' },
  { key: 'applicable_classes', label: 'Applicable Classes', type: 'string', width: 150 },
  { key: 'exam_due_date', label: 'Due Date', type: 'date', width: 100 },
];

// ═══════════════════════════════════════════════════════════════════════════════
// COLUMN SETS (Pre-configured for specific reports)
// ═══════════════════════════════════════════════════════════════════════════════

export const COLUMN_SETS = {
  // Collection Reports
  daily_collection: ['date', 'cash_amount', 'online_amount', 'cheque_amount', 'card_amount', 'upi_amount', 'total_collection', 'payment_count'],
  monthly_collection: ['month', 'fee_head', 'total_collection', 'payment_count', 'student_count'],
  class_wise_collection: ['class_name', 'total_fee', 'paid_amount', 'balance', 'collection_percentage', 'student_count'],
  section_wise_collection: ['class_name', 'section_name', 'total_fee', 'paid_amount', 'balance', 'collection_percentage'],
  fee_head_collection: ['fee_head', 'total_fee', 'paid_amount', 'collection_percentage'],
  payment_mode: ['payment_mode', 'amount', 'payment_count', 'collection_percentage'],
  cashier_wise: ['cashier_name', 'receipt_count', 'total_collection'],
  hour_wise_collection: ['collection_hour', 'payment_count', 'total_collection'],
  receipt_register: ['receipt_no', 'date', 'student_name', 'class_name', 'amount', 'payment_mode', 'cashier_name'],
  cancelled_receipts: ['receipt_no', 'date', 'student_name', 'amount', 'cancel_reason', 'cancelled_by', 'cancelled_date'],
  cheque_collection: ['cheque_no', 'bank_name', 'student_name', 'amount', 'cheque_date', 'cheque_status'],
  online_payments: ['transaction_id', 'date', 'student_name', 'amount', 'payment_gateway', 'receipt_status'],
  partial_payments: ['student_name', 'class_name', 'total_fee', 'paid_amount', 'balance', 'last_payment_date'],
  advance_fee: ['student_name', 'class_name', 'advance_amount', 'advance_for_month'],
  late_fee: ['student_name', 'class_name', 'original_due', 'late_fee', 'late_days', 'paid_amount'],
  
  // Outstanding Reports
  fee_defaulters: ['student_name', 'class_name', 'due_amount', 'overdue_days', 'father_phone'],
  balance_statement: ['student_name', 'class_name', 'total_fee', 'paid_amount', 'due_amount'],
  overdue_fee: ['student_name', 'class_name', 'due_date', 'overdue_days', 'due_amount', 'overdue_category'],
  month_outstanding: ['month', 'opening_balance', 'fee_added', 'collected', 'closing_balance'],
  class_outstanding: ['class_name', 'student_count', 'total_fee', 'due_amount', 'avg_due'],
  follow_up: ['student_name', 'father_phone', 'last_contact_date', 'promise_date', 'follow_up_status', 'due_amount'],
  high_defaulters: ['student_name', 'class_name', 'due_amount', 'overdue_days', 'father_phone', 'contact_notes'],
  category_defaulters: ['student_category', 'defaulter_count', 'total_fee', 'due_amount'],
  rte_pending: ['student_name', 'class_name', 'rte_amount', 'govt_pending'],
  new_student_pending: ['student_name', 'class_name', 'admission_date', 'total_fee', 'due_amount'],
  
  // Concession Reports
  concession_report: ['student_name', 'class_name', 'concession_type', 'fee_head', 'concession_amount'],
  scholarship: ['student_name', 'class_name', 'scholarship_name', 'scholarship_amount', 'scholarship_status'],
  fee_waiver: ['student_name', 'class_name', 'waiver_reason', 'waiver_amount', 'approved_by'],
  staff_ward: ['staff_name', 'ward_name', 'class_name', 'fee_head', 'concession_amount'],
  sibling_discount: ['father_name', 'sibling_names', 'sibling_count', 'sibling_discount'],
  merit_scholarship: ['student_name', 'class_name', 'marks_percentage', 'scholarship_amount'],
  sports_quota: ['student_name', 'sport_name', 'achievement', 'concession_amount'],
  ews_bpl: ['student_name', 'class_name', 'economic_category', 'document_type', 'concession_amount'],
  
  // Analysis Reports
  revenue_projection: ['month', 'expected_amount', 'collected_amount', 'variance', 'variance_percentage'],
  year_comparison: ['fee_head', 'last_year_amount', 'this_year_amount', 'growth_amount', 'growth_percentage'],
  fee_structure: ['class_name', 'fee_head', 'fee_amount', 'students_count', 'total_expected'],
  refund_report: ['student_name', 'refund_amount', 'refund_reason', 'refund_date', 'refund_status'],
  journal_entries: ['date', 'particulars', 'debit', 'credit', 'entry_type'],
  bank_reconciliation: ['date', 'book_balance', 'bank_balance', 'difference', 'reconciled'],
  gst_report: ['invoice_no', 'student_name', 'taxable_amount', 'cgst', 'sgst', 'total_gst'],
  
  // Fee Structure Reports (NEW)
  tuition_fee_classwise: ['class_name', 'fee_group_name', 'fee_type_name', 'fee_type_code', 'amount', 'due_date', 'fine_type', 'fine_value', 'students_assigned', 'total_expected_amount'],
  exam_fee_structure: ['class_name', 'exam_name', 'exam_type', 'exam_fee', 'practical_fee', 'registration_fee', 'total_exam_fee', 'exam_due_date'],
  hostel_fee_structure: ['hostel_name', 'room_type', 'room_number', 'capacity', 'occupied', 'hostel_monthly_fee', 'mess_fee', 'total_hostel_fee', 'hostel_students'],
  transport_fee_structure: ['route_name', 'pickup_point', 'distance_km', 'monthly_fee', 'quarterly_fee', 'annual_fee', 'transport_students'],
  transport_fee_monthly: ['month', 'transport_due_date', 'transport_fine_type', 'transport_fine_value'],
};

// ═══════════════════════════════════════════════════════════════════════════════
// ALL COLUMNS - Combined for column selector
// ═══════════════════════════════════════════════════════════════════════════════

export const ALL_FINANCE_COLUMNS = [
  // Merge all unique columns
  ...COLLECTION_COLUMNS,
  ...OUTSTANDING_COLUMNS.filter(col => 
    !COLLECTION_COLUMNS.find(c => c.key === col.key)
  ),
  ...CONCESSION_COLUMNS.filter(col => 
    !COLLECTION_COLUMNS.find(c => c.key === col.key) &&
    !OUTSTANDING_COLUMNS.find(c => c.key === col.key)
  ),
  ...ANALYSIS_COLUMNS.filter(col => 
    !COLLECTION_COLUMNS.find(c => c.key === col.key) &&
    !OUTSTANDING_COLUMNS.find(c => c.key === col.key) &&
    !CONCESSION_COLUMNS.find(c => c.key === col.key)
  ),
  ...FEE_STRUCTURE_COLUMNS.filter(col =>
    !COLLECTION_COLUMNS.find(c => c.key === col.key) &&
    !OUTSTANDING_COLUMNS.find(c => c.key === col.key) &&
    !CONCESSION_COLUMNS.find(c => c.key === col.key) &&
    !ANALYSIS_COLUMNS.find(c => c.key === col.key)
  ),
];

// Alias for convenience
export const FINANCE_COLUMNS = ALL_FINANCE_COLUMNS;

// Get columns for a specific set
export const getColumnsForSet = (setName) => {
  const columnKeys = COLUMN_SETS[setName] || [];
  return columnKeys.map(key => 
    ALL_FINANCE_COLUMNS.find(col => col.key === key)
  ).filter(Boolean);
};

export default {
  COLLECTION_COLUMNS,
  OUTSTANDING_COLUMNS,
  CONCESSION_COLUMNS,
  ANALYSIS_COLUMNS,
  FEE_STRUCTURE_COLUMNS,
  COLUMN_SETS,
  ALL_FINANCE_COLUMNS,
  FINANCE_COLUMNS,
  getColumnsForSet,
};
