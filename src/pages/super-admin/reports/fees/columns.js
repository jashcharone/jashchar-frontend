/**
 * Fees Report Generator - Column Definitions
 * Module 11: 40 Fee Report Templates
 * 
 * Categories:
 * 1. Student Fee Reports (15)
 * 2. Collection Analysis (15)
 * 3. Special Fee Reports (10)
 */

// ═══════════════════════════════════════════════════════════════════════════════
// ALL AVAILABLE COLUMNS FOR FEES MODULE
// ═══════════════════════════════════════════════════════════════════════════════

export const FEES_COLUMNS = [
  // ─────────────────────────────────────────────────────────────────────────────
  // STUDENT INFORMATION
  // ─────────────────────────────────────────────────────────────────────────────
  { key: 'admission_number', label: 'Admission No', type: 'text', sortable: true, groupable: false, width: '120px' },
  { key: 'student_name', label: 'Student Name', type: 'text', sortable: true, groupable: false, width: '180px' },
  { key: 'class_name', label: 'Class', type: 'text', sortable: true, groupable: true, width: '80px' },
  { key: 'section_name', label: 'Section', type: 'text', sortable: true, groupable: true, width: '80px' },
  { key: 'roll_number', label: 'Roll No', type: 'text', sortable: true, groupable: false, width: '70px' },
  { key: 'father_name', label: 'Father Name', type: 'text', sortable: true, groupable: false, width: '160px' },
  { key: 'mother_name', label: 'Mother Name', type: 'text', sortable: true, groupable: false, width: '160px' },
  { key: 'phone', label: 'Phone', type: 'phone', sortable: false, groupable: false, width: '120px' },
  { key: 'email', label: 'Email', type: 'email', sortable: false, groupable: false, width: '180px' },
  { key: 'address', label: 'Address', type: 'text', sortable: false, groupable: false, width: '250px' },
  { key: 'category', label: 'Category', type: 'text', sortable: true, groupable: true, width: '100px' },
  { key: 'admission_date', label: 'Admission Date', type: 'date', sortable: true, groupable: false, width: '120px' },
  { key: 'status', label: 'Status', type: 'badge', sortable: true, groupable: true, width: '100px' },

  // ─────────────────────────────────────────────────────────────────────────────
  // FEE STRUCTURE
  // ─────────────────────────────────────────────────────────────────────────────
  { key: 'fee_structure_name', label: 'Fee Structure', type: 'text', sortable: true, groupable: true, width: '160px' },
  { key: 'fee_head', label: 'Fee Head', type: 'text', sortable: true, groupable: true, width: '140px' },
  { key: 'fee_type', label: 'Fee Type', type: 'badge', sortable: true, groupable: true, width: '120px' },
  { key: 'frequency', label: 'Frequency', type: 'text', sortable: true, groupable: true, width: '100px' },
  { key: 'installment_no', label: 'Installment', type: 'number', sortable: true, groupable: true, width: '100px' },
  { key: 'due_month', label: 'Due Month', type: 'text', sortable: true, groupable: true, width: '100px' },

  // ─────────────────────────────────────────────────────────────────────────────
  // FEE AMOUNTS
  // ─────────────────────────────────────────────────────────────────────────────
  { key: 'total_fee', label: 'Total Fee', type: 'currency', sortable: true, groupable: false, width: '120px', aggregate: 'sum' },
  { key: 'annual_fee', label: 'Annual Fee', type: 'currency', sortable: true, groupable: false, width: '120px', aggregate: 'sum' },
  { key: 'monthly_fee', label: 'Monthly Fee', type: 'currency', sortable: true, groupable: false, width: '120px', aggregate: 'sum' },
  { key: 'quarterly_fee', label: 'Quarterly Fee', type: 'currency', sortable: true, groupable: false, width: '120px', aggregate: 'sum' },
  { key: 'term_fee', label: 'Term Fee', type: 'currency', sortable: true, groupable: false, width: '120px', aggregate: 'sum' },
  { key: 'one_time_fee', label: 'One-time Fee', type: 'currency', sortable: true, groupable: false, width: '120px', aggregate: 'sum' },
  { key: 'admission_fee', label: 'Admission Fee', type: 'currency', sortable: true, groupable: false, width: '120px', aggregate: 'sum' },
  { key: 'tuition_fee', label: 'Tuition Fee', type: 'currency', sortable: true, groupable: false, width: '120px', aggregate: 'sum' },

  // ─────────────────────────────────────────────────────────────────────────────
  // PAYMENT STATUS
  // ─────────────────────────────────────────────────────────────────────────────
  { key: 'paid_amount', label: 'Paid Amount', type: 'currency', sortable: true, groupable: false, width: '120px', aggregate: 'sum' },
  { key: 'due_amount', label: 'Due Amount', type: 'currency', sortable: true, groupable: false, width: '120px', aggregate: 'sum' },
  { key: 'balance', label: 'Balance', type: 'currency', sortable: true, groupable: false, width: '120px', aggregate: 'sum' },
  { key: 'advance_paid', label: 'Advance Paid', type: 'currency', sortable: true, groupable: false, width: '120px', aggregate: 'sum' },
  { key: 'payment_percentage', label: 'Payment %', type: 'percentage', sortable: true, groupable: false, width: '100px' },
  { key: 'payment_status', label: 'Payment Status', type: 'badge', sortable: true, groupable: true, width: '130px' },

  // ─────────────────────────────────────────────────────────────────────────────
  // DISCOUNTS & CONCESSIONS
  // ─────────────────────────────────────────────────────────────────────────────
  { key: 'discount_amount', label: 'Discount', type: 'currency', sortable: true, groupable: false, width: '110px', aggregate: 'sum' },
  { key: 'discount_type', label: 'Discount Type', type: 'text', sortable: true, groupable: true, width: '120px' },
  { key: 'discount_percentage', label: 'Discount %', type: 'percentage', sortable: true, groupable: false, width: '100px' },
  { key: 'concession_amount', label: 'Concession', type: 'currency', sortable: true, groupable: false, width: '110px', aggregate: 'sum' },
  { key: 'scholarship_amount', label: 'Scholarship', type: 'currency', sortable: true, groupable: false, width: '110px', aggregate: 'sum' },
  { key: 'net_payable', label: 'Net Payable', type: 'currency', sortable: true, groupable: false, width: '120px', aggregate: 'sum' },

  // ─────────────────────────────────────────────────────────────────────────────
  // DUE DATES & PENALTIES
  // ─────────────────────────────────────────────────────────────────────────────
  { key: 'due_date', label: 'Due Date', type: 'date', sortable: true, groupable: false, width: '110px' },
  { key: 'overdue_days', label: 'Overdue Days', type: 'number', sortable: true, groupable: false, width: '110px' },
  { key: 'late_fee', label: 'Late Fee', type: 'currency', sortable: true, groupable: false, width: '100px', aggregate: 'sum' },
  { key: 'fine_amount', label: 'Fine', type: 'currency', sortable: true, groupable: false, width: '100px', aggregate: 'sum' },
  { key: 'penalty_amount', label: 'Penalty', type: 'currency', sortable: true, groupable: false, width: '100px', aggregate: 'sum' },

  // ─────────────────────────────────────────────────────────────────────────────
  // COLLECTION DETAILS
  // ─────────────────────────────────────────────────────────────────────────────
  { key: 'receipt_no', label: 'Receipt No', type: 'text', sortable: true, groupable: false, width: '120px' },
  { key: 'receipt_date', label: 'Receipt Date', type: 'date', sortable: true, groupable: true, width: '120px' },
  { key: 'collection_date', label: 'Collection Date', type: 'date', sortable: true, groupable: true, width: '130px' },
  { key: 'payment_mode', label: 'Payment Mode', type: 'badge', sortable: true, groupable: true, width: '120px' },
  { key: 'transaction_id', label: 'Transaction ID', type: 'text', sortable: false, groupable: false, width: '160px' },
  { key: 'bank_name', label: 'Bank Name', type: 'text', sortable: true, groupable: true, width: '130px' },
  { key: 'cheque_no', label: 'Cheque No', type: 'text', sortable: false, groupable: false, width: '120px' },
  { key: 'cheque_date', label: 'Cheque Date', type: 'date', sortable: true, groupable: false, width: '120px' },
  { key: 'collected_by', label: 'Collected By', type: 'text', sortable: true, groupable: true, width: '140px' },

  // ─────────────────────────────────────────────────────────────────────────────
  // ANALYSIS COLUMNS
  // ─────────────────────────────────────────────────────────────────────────────
  { key: 'month', label: 'Month', type: 'text', sortable: true, groupable: true, width: '100px' },
  { key: 'academic_year', label: 'Academic Year', type: 'text', sortable: true, groupable: true, width: '120px' },
  { key: 'session_name', label: 'Session', type: 'text', sortable: true, groupable: true, width: '120px' },
  { key: 'expected_collection', label: 'Expected', type: 'currency', sortable: true, groupable: false, width: '120px', aggregate: 'sum' },
  { key: 'actual_collection', label: 'Actual', type: 'currency', sortable: true, groupable: false, width: '120px', aggregate: 'sum' },
  { key: 'variance', label: 'Variance', type: 'currency', sortable: true, groupable: false, width: '110px' },
  { key: 'variance_percentage', label: 'Variance %', type: 'percentage', sortable: true, groupable: false, width: '100px' },
  { key: 'collection_rate', label: 'Collection Rate', type: 'percentage', sortable: true, groupable: false, width: '120px' },
  { key: 'student_count', label: 'Student Count', type: 'number', sortable: true, groupable: false, width: '120px', aggregate: 'sum' },
  { key: 'defaulter_count', label: 'Defaulter Count', type: 'number', sortable: true, groupable: false, width: '130px', aggregate: 'sum' },

  // ─────────────────────────────────────────────────────────────────────────────
  // SPECIAL FEES
  // ─────────────────────────────────────────────────────────────────────────────
  { key: 'transport_fee', label: 'Transport Fee', type: 'currency', sortable: true, groupable: false, width: '120px', aggregate: 'sum' },
  { key: 'hostel_fee', label: 'Hostel Fee', type: 'currency', sortable: true, groupable: false, width: '110px', aggregate: 'sum' },
  { key: 'mess_fee', label: 'Mess Fee', type: 'currency', sortable: true, groupable: false, width: '100px', aggregate: 'sum' },
  { key: 'library_fee', label: 'Library Fee', type: 'currency', sortable: true, groupable: false, width: '110px', aggregate: 'sum' },
  { key: 'lab_fee', label: 'Lab Fee', type: 'currency', sortable: true, groupable: false, width: '100px', aggregate: 'sum' },
  { key: 'exam_fee', label: 'Exam Fee', type: 'currency', sortable: true, groupable: false, width: '100px', aggregate: 'sum' },
  { key: 'sports_fee', label: 'Sports Fee', type: 'currency', sortable: true, groupable: false, width: '110px', aggregate: 'sum' },
  { key: 'activity_fee', label: 'Activity Fee', type: 'currency', sortable: true, groupable: false, width: '110px', aggregate: 'sum' },
  { key: 'computer_fee', label: 'Computer Fee', type: 'currency', sortable: true, groupable: false, width: '120px', aggregate: 'sum' },
  { key: 'development_fee', label: 'Development Fee', type: 'currency', sortable: true, groupable: false, width: '130px', aggregate: 'sum' },

  // ─────────────────────────────────────────────────────────────────────────────
  // ROUTE & TRANSPORT
  // ─────────────────────────────────────────────────────────────────────────────
  { key: 'route_name', label: 'Route Name', type: 'text', sortable: true, groupable: true, width: '140px' },
  { key: 'stop_name', label: 'Stop Name', type: 'text', sortable: true, groupable: true, width: '140px' },
  { key: 'vehicle_no', label: 'Vehicle No', type: 'text', sortable: true, groupable: true, width: '110px' },
  { key: 'km_distance', label: 'Distance (KM)', type: 'number', sortable: true, groupable: false, width: '120px' },
  { key: 'transport_type', label: 'Transport Type', type: 'text', sortable: true, groupable: true, width: '130px' },

  // ─────────────────────────────────────────────────────────────────────────────
  // HOSTEL DETAILS
  // ─────────────────────────────────────────────────────────────────────────────
  { key: 'hostel_name', label: 'Hostel Name', type: 'text', sortable: true, groupable: true, width: '140px' },
  { key: 'room_no', label: 'Room No', type: 'text', sortable: true, groupable: true, width: '100px' },
  { key: 'room_type', label: 'Room Type', type: 'text', sortable: true, groupable: true, width: '120px' },
  { key: 'bed_no', label: 'Bed No', type: 'text', sortable: true, groupable: false, width: '80px' },
  { key: 'mess_type', label: 'Mess Type', type: 'text', sortable: true, groupable: true, width: '110px' },

  // ─────────────────────────────────────────────────────────────────────────────
  // REFUND & ADJUSTMENTS
  // ─────────────────────────────────────────────────────────────────────────────
  { key: 'refund_amount', label: 'Refund Amount', type: 'currency', sortable: true, groupable: false, width: '130px', aggregate: 'sum' },
  { key: 'refund_date', label: 'Refund Date', type: 'date', sortable: true, groupable: false, width: '120px' },
  { key: 'refund_reason', label: 'Refund Reason', type: 'text', sortable: true, groupable: true, width: '150px' },
  { key: 'adjustment_amount', label: 'Adjustment', type: 'currency', sortable: true, groupable: false, width: '120px', aggregate: 'sum' },
  { key: 'adjustment_reason', label: 'Adjustment Reason', type: 'text', sortable: true, groupable: true, width: '150px' },

  // ─────────────────────────────────────────────────────────────────────────────
  // REMARKS & NOTES
  // ─────────────────────────────────────────────────────────────────────────────
  { key: 'remarks', label: 'Remarks', type: 'text', sortable: false, groupable: false, width: '200px' },
  { key: 'notes', label: 'Notes', type: 'text', sortable: false, groupable: false, width: '200px' },
  { key: 'last_updated', label: 'Last Updated', type: 'datetime', sortable: true, groupable: false, width: '160px' },
  { key: 'updated_by', label: 'Updated By', type: 'text', sortable: true, groupable: true, width: '140px' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// COLUMN SETS FOR DIFFERENT REPORT TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export const COLUMN_SETS = {
  // ─────────────────────────────────────────────────────────────────────────────
  // STUDENT FEE REPORTS (15)
  // ─────────────────────────────────────────────────────────────────────────────
  
  // 1. Student Fee Ledger
  student_fee_ledger: [
    'admission_number', 'student_name', 'class_name', 'section_name',
    'fee_head', 'total_fee', 'paid_amount', 'due_amount', 'payment_status'
  ],

  // 2. Fee Structure Allocation
  fee_structure_allocation: [
    'admission_number', 'student_name', 'class_name', 'section_name',
    'fee_structure_name', 'annual_fee', 'discount_amount', 'net_payable'
  ],

  // 3. Individual Fee Statement
  individual_fee_statement: [
    'receipt_no', 'receipt_date', 'fee_head', 'paid_amount',
    'payment_mode', 'balance', 'collected_by'
  ],

  // 4. Fee Dues Summary
  fee_dues_summary: [
    'admission_number', 'student_name', 'class_name', 'section_name',
    'father_name', 'phone', 'total_fee', 'paid_amount', 'due_amount', 'overdue_days'
  ],

  // 5. Student-wise Fee Report
  student_wise_fee: [
    'admission_number', 'student_name', 'class_name', 'father_name',
    'phone', 'total_fee', 'paid_amount', 'due_amount'
  ],

  // 6. Installment-wise Status
  installment_status: [
    'admission_number', 'student_name', 'class_name', 'installment_no',
    'due_month', 'due_date', 'paid_amount', 'due_amount', 'late_fee', 'payment_status'
  ],

  // 7. Fee Head-wise Breakup
  fee_head_breakup: [
    'admission_number', 'student_name', 'class_name', 'tuition_fee',
    'transport_fee', 'library_fee', 'lab_fee', 'exam_fee', 'total_fee'
  ],

  // 8. Payment History
  payment_history: [
    'admission_number', 'student_name', 'receipt_no', 'receipt_date',
    'fee_head', 'paid_amount', 'payment_mode', 'transaction_id', 'collected_by'
  ],

  // 9. Pending Fee Alerts
  pending_fee_alerts: [
    'admission_number', 'student_name', 'class_name', 'father_name',
    'phone', 'due_amount', 'overdue_days', 'due_date', 'payment_status'
  ],

  // 10. Fee Waiver List
  fee_waiver_list: [
    'admission_number', 'student_name', 'class_name', 'category',
    'total_fee', 'discount_amount', 'discount_type', 'net_payable', 'remarks'
  ],

  // 11. Category-wise Fees
  category_wise_fees: [
    'category', 'student_count', 'total_fee', 'discount_amount',
    'paid_amount', 'due_amount', 'collection_rate'
  ],

  // 12. New Admission Fees
  new_admission_fees: [
    'admission_number', 'student_name', 'class_name', 'admission_date',
    'admission_fee', 'one_time_fee', 'total_fee', 'paid_amount', 'due_amount'
  ],

  // 13. Sibling Fee Summary
  sibling_fee_summary: [
    'admission_number', 'student_name', 'class_name', 'father_name',
    'total_fee', 'discount_amount', 'discount_percentage', 'net_payable', 'paid_amount'
  ],

  // 14. TC Issued Fee Closure
  tc_fee_closure: [
    'admission_number', 'student_name', 'class_name', 'total_fee',
    'paid_amount', 'refund_amount', 'balance', 'status', 'remarks'
  ],

  // 15. Fee Revision Impact
  fee_revision_impact: [
    'class_name', 'fee_head', 'old_fee', 'new_fee', 'difference',
    'student_count', 'total_impact', 'effective_date'
  ],

  // ─────────────────────────────────────────────────────────────────────────────
  // COLLECTION ANALYSIS (15)
  // ─────────────────────────────────────────────────────────────────────────────

  // 1. Daily Collection Report
  daily_collection: [
    'receipt_no', 'receipt_date', 'admission_number', 'student_name',
    'class_name', 'fee_head', 'paid_amount', 'payment_mode', 'collected_by'
  ],

  // 2. Monthly Collection Summary
  monthly_collection_summary: [
    'month', 'expected_collection', 'actual_collection', 'variance',
    'variance_percentage', 'collection_rate', 'defaulter_count'
  ],

  // 3. Class-wise Collection
  class_wise_collection: [
    'class_name', 'student_count', 'total_fee', 'paid_amount',
    'due_amount', 'collection_rate', 'defaulter_count'
  ],

  // 4. Payment Mode Analysis
  payment_mode_analysis: [
    'payment_mode', 'transaction_count', 'total_amount',
    'average_amount', 'percentage_share'
  ],

  // 5. Collector-wise Report
  collector_wise: [
    'collected_by', 'receipt_count', 'total_collection',
    'cash_collection', 'online_collection', 'cheque_collection'
  ],

  // 6. Fee Head Collection
  fee_head_collection: [
    'fee_head', 'expected_amount', 'collected_amount',
    'pending_amount', 'collection_rate'
  ],

  // 7. Quarter-wise Summary
  quarter_wise_summary: [
    'quarter', 'expected_collection', 'actual_collection',
    'variance', 'collection_rate', 'year_comparison'
  ],

  // 8. Trend Analysis
  trend_analysis: [
    'month', 'current_year_collection', 'previous_year_collection',
    'growth_amount', 'growth_percentage'
  ],

  // 9. Target vs Achievement
  target_vs_achievement: [
    'month', 'target_amount', 'achieved_amount',
    'gap', 'achievement_percentage', 'cumulative_achievement'
  ],

  // 10. Peak Collection Days
  peak_collection_days: [
    'collection_date', 'day_name', 'receipt_count',
    'total_collection', 'average_per_receipt'
  ],

  // 11. Online Payment Report
  online_payments: [
    'transaction_id', 'receipt_date', 'admission_number', 'student_name',
    'paid_amount', 'payment_gateway', 'bank_name', 'status'
  ],

  // 12. Cheque Status Report
  cheque_status: [
    'cheque_no', 'cheque_date', 'bank_name', 'admission_number',
    'student_name', 'amount', 'deposit_date', 'status', 'bounce_charges'
  ],

  // 13. Receipt Register
  receipt_register: [
    'receipt_no', 'receipt_date', 'admission_number', 'student_name',
    'class_name', 'paid_amount', 'payment_mode', 'collected_by', 'remarks'
  ],

  // 14. Cancelled Receipt Report
  cancelled_receipts: [
    'receipt_no', 'original_date', 'admission_number', 'student_name',
    'original_amount', 'cancel_date', 'cancel_reason', 'cancelled_by'
  ],

  // 15. Collection Comparison
  collection_comparison: [
    'comparison_period', 'period_1_collection', 'period_2_collection',
    'difference', 'growth_percentage', 'remarks'
  ],

  // ─────────────────────────────────────────────────────────────────────────────
  // SPECIAL FEE REPORTS (10)
  // ─────────────────────────────────────────────────────────────────────────────

  // 1. Transport Fee Report
  transport_fee: [
    'admission_number', 'student_name', 'class_name', 'route_name',
    'stop_name', 'km_distance', 'transport_fee', 'paid_amount', 'due_amount'
  ],

  // 2. Hostel Fee Report
  hostel_fee: [
    'admission_number', 'student_name', 'class_name', 'hostel_name',
    'room_no', 'room_type', 'hostel_fee', 'mess_fee', 'paid_amount', 'due_amount'
  ],

  // 3. Library Fine Report
  library_fine: [
    'admission_number', 'student_name', 'class_name', 'book_title',
    'issue_date', 'due_date', 'return_date', 'overdue_days', 'fine_amount', 'payment_status'
  ],

  // 4. Lab Fee Collection
  lab_fee_collection: [
    'class_name', 'lab_type', 'student_count', 'fee_per_student',
    'total_fee', 'collected_amount', 'pending_amount'
  ],

  // 5. Exam Fee Status
  exam_fee_status: [
    'admission_number', 'student_name', 'class_name', 'exam_name',
    'exam_fee', 'late_fee', 'total_amount', 'paid_amount', 'payment_status'
  ],

  // 6. Activity Fee Report
  activity_fee: [
    'admission_number', 'student_name', 'class_name', 'activity_name',
    'activity_fee', 'registration_date', 'paid_amount', 'payment_status'
  ],

  // 7. Sports Fee Collection
  sports_fee: [
    'admission_number', 'student_name', 'class_name', 'sport_name',
    'sports_fee', 'equipment_fee', 'total_amount', 'paid_amount'
  ],

  // 8. Development Fund Report
  development_fund: [
    'class_name', 'student_count', 'development_fee', 'total_expected',
    'collected_amount', 'pending_amount', 'collection_rate'
  ],

  // 9. Late Fee Collection
  late_fee_collection: [
    'admission_number', 'student_name', 'class_name', 'original_due_date',
    'payment_date', 'overdue_days', 'late_fee', 'paid_amount', 'payment_status'
  ],

  // 10. Refund Report
  refund_report: [
    'admission_number', 'student_name', 'class_name', 'original_paid',
    'refund_amount', 'refund_date', 'refund_reason', 'refund_mode', 'processed_by'
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

// Get columns by keys
export const getColumns = (keys) => {
  return keys.map(key => FEES_COLUMNS.find(c => c.key === key)).filter(Boolean);
};

// Get column set with full column objects
export const getColumnSetFull = (setName) => {
  const keys = COLUMN_SETS[setName];
  if (!keys) return [];
  return getColumns(keys);
};

// Get all groupable columns
export const getGroupableColumns = () => {
  return FEES_COLUMNS.filter(c => c.groupable);
};

// Get all sortable columns
export const getSortableColumns = () => {
  return FEES_COLUMNS.filter(c => c.sortable);
};

// Get aggregatable columns (for totals/summaries)
export const getAggregatableColumns = () => {
  return FEES_COLUMNS.filter(c => c.aggregate);
};

export default {
  FEES_COLUMNS,
  COLUMN_SETS,
  getColumns,
  getColumnSetFull,
  getGroupableColumns,
  getSortableColumns,
  getAggregatableColumns,
};
