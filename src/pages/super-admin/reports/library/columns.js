/**
 * Library Report Generator - Column Definitions
 * Module 6: All columns used in 30 Library Report Templates
 * 
 * Column Categories:
 * 1. Book Management Columns
 * 2. Issue & Return Columns
 * 3. Members & Fines Columns
 */

// ═══════════════════════════════════════════════════════════════════════════════
// MASTER COLUMN DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

export const LIBRARY_COLUMNS = [
  // ─────────────────────────────────────────────────────────────────────────────
  // BOOK INFORMATION COLUMNS
  // ─────────────────────────────────────────────────────────────────────────────
  { key: 'book_id', label: 'Book ID', type: 'string', width: 100, groupable: true },
  { key: 'barcode', label: 'Barcode', type: 'string', width: 120 },
  { key: 'accession_no', label: 'Accession No', type: 'string', width: 120 },
  { key: 'title', label: 'Title', type: 'string', width: 250, groupable: true },
  { key: 'author', label: 'Author', type: 'string', width: 180, groupable: true },
  { key: 'co_author', label: 'Co-Author', type: 'string', width: 150 },
  { key: 'publisher', label: 'Publisher', type: 'string', width: 180, groupable: true },
  { key: 'isbn', label: 'ISBN', type: 'string', width: 140 },
  { key: 'edition', label: 'Edition', type: 'string', width: 100 },
  { key: 'year_published', label: 'Year Published', type: 'number', width: 120 },
  { key: 'category', label: 'Category', type: 'badge', width: 140, groupable: true },
  { key: 'sub_category', label: 'Sub-Category', type: 'string', width: 130 },
  { key: 'language', label: 'Language', type: 'string', width: 100, groupable: true },
  { key: 'total_copies', label: 'Total Copies', type: 'number', width: 100 },
  { key: 'available_copies', label: 'Available', type: 'number', width: 90 },
  { key: 'issued_copies', label: 'Issued', type: 'number', width: 80 },
  { key: 'lost_copies', label: 'Lost', type: 'number', width: 70 },
  { key: 'damaged_copies', label: 'Damaged', type: 'number', width: 80 },
  { key: 'book_price', label: 'Price', type: 'currency', width: 100 },
  { key: 'total_value', label: 'Total Value', type: 'currency', width: 120 },
  { key: 'rack_no', label: 'Rack No', type: 'string', width: 90 },
  { key: 'shelf_no', label: 'Shelf No', type: 'string', width: 90 },
  { key: 'location', label: 'Location', type: 'string', width: 120, groupable: true },
  { key: 'condition', label: 'Condition', type: 'badge', width: 100, groupable: true },
  { key: 'date_added', label: 'Date Added', type: 'date', width: 120 },
  { key: 'last_issued', label: 'Last Issued', type: 'date', width: 120 },
  { key: 'times_issued', label: 'Times Issued', type: 'number', width: 100 },
  { key: 'book_status', label: 'Status', type: 'badge', width: 100, groupable: true },
  { key: 'subject', label: 'Subject', type: 'string', width: 140, groupable: true },
  { key: 'pages', label: 'Pages', type: 'number', width: 80 },
  { key: 'description', label: 'Description', type: 'string', width: 250 },
  
  // ─────────────────────────────────────────────────────────────────────────────
  // MEMBER INFORMATION COLUMNS
  // ─────────────────────────────────────────────────────────────────────────────
  { key: 'member_id', label: 'Member ID', type: 'string', width: 100, groupable: true },
  { key: 'member_name', label: 'Member Name', type: 'string', width: 180 },
  { key: 'member_type', label: 'Member Type', type: 'badge', width: 120, groupable: true },
  { key: 'card_no', label: 'Card No', type: 'string', width: 120 },
  { key: 'card_status', label: 'Card Status', type: 'badge', width: 100, groupable: true },
  { key: 'card_expiry', label: 'Card Expiry', type: 'date', width: 120 },
  { key: 'member_class', label: 'Class', type: 'string', width: 100, groupable: true },
  { key: 'member_section', label: 'Section', type: 'string', width: 80, groupable: true },
  { key: 'member_department', label: 'Department', type: 'string', width: 140, groupable: true },
  { key: 'member_phone', label: 'Phone', type: 'phone', width: 120 },
  { key: 'member_email', label: 'Email', type: 'string', width: 180 },
  { key: 'current_issues', label: 'Current Issues', type: 'number', width: 110 },
  { key: 'max_books_allowed', label: 'Max Books', type: 'number', width: 100 },
  { key: 'books_read', label: 'Books Read', type: 'number', width: 100 },
  { key: 'last_activity', label: 'Last Activity', type: 'date', width: 120 },
  { key: 'days_inactive', label: 'Days Inactive', type: 'number', width: 110 },
  { key: 'membership_date', label: 'Member Since', type: 'date', width: 120 },
  { key: 'reading_categories', label: 'Preferred Categories', type: 'string', width: 180 },
  { key: 'avg_reading_days', label: 'Avg Reading Days', type: 'number', width: 130 },
  
  // ─────────────────────────────────────────────────────────────────────────────
  // ISSUE & RETURN COLUMNS
  // ─────────────────────────────────────────────────────────────────────────────
  { key: 'issue_id', label: 'Issue ID', type: 'string', width: 100 },
  { key: 'issue_date', label: 'Issue Date', type: 'date', width: 120 },
  { key: 'due_date', label: 'Due Date', type: 'date', width: 120 },
  { key: 'return_date', label: 'Return Date', type: 'date', width: 120 },
  { key: 'return_condition', label: 'Return Condition', type: 'badge', width: 130 },
  { key: 'days_overdue', label: 'Days Overdue', type: 'number', width: 110 },
  { key: 'renewed_times', label: 'Renewed', type: 'number', width: 90 },
  { key: 'renewed_till', label: 'Renewed Till', type: 'date', width: 120 },
  { key: 'original_due', label: 'Original Due', type: 'date', width: 120 },
  { key: 'issue_status', label: 'Issue Status', type: 'badge', width: 110, groupable: true },
  { key: 'issued_by', label: 'Issued By', type: 'string', width: 140 },
  { key: 'returned_to', label: 'Returned To', type: 'string', width: 140 },
  
  // ─────────────────────────────────────────────────────────────────────────────
  // FINE COLUMNS
  // ─────────────────────────────────────────────────────────────────────────────
  { key: 'fine_amount', label: 'Fine Amount', type: 'currency', width: 110 },
  { key: 'fine_paid', label: 'Fine Paid', type: 'currency', width: 100 },
  { key: 'fine_pending', label: 'Fine Pending', type: 'currency', width: 110 },
  { key: 'fine_date', label: 'Fine Date', type: 'date', width: 100 },
  { key: 'fine_reason', label: 'Fine Reason', type: 'badge', width: 120, groupable: true },
  { key: 'fine_per_day', label: 'Fine/Day', type: 'currency', width: 90 },
  { key: 'payment_date', label: 'Payment Date', type: 'date', width: 110 },
  { key: 'payment_mode', label: 'Payment Mode', type: 'badge', width: 110, groupable: true },
  { key: 'receipt_no', label: 'Receipt No', type: 'string', width: 110 },
  
  // ─────────────────────────────────────────────────────────────────────────────
  // RESERVATION COLUMNS
  // ─────────────────────────────────────────────────────────────────────────────
  { key: 'reservation_id', label: 'Reservation ID', type: 'string', width: 120 },
  { key: 'request_date', label: 'Request Date', type: 'date', width: 120 },
  { key: 'queue_position', label: 'Queue Position', type: 'number', width: 110 },
  { key: 'expected_date', label: 'Expected Date', type: 'date', width: 120 },
  { key: 'reservation_status', label: 'Status', type: 'badge', width: 100, groupable: true },
  { key: 'members_waiting', label: 'Members Waiting', type: 'number', width: 130 },
  
  // ─────────────────────────────────────────────────────────────────────────────
  // STATISTICS COLUMNS
  // ─────────────────────────────────────────────────────────────────────────────
  { key: 'time_slot', label: 'Time Slot', type: 'string', width: 100, groupable: true },
  { key: 'visitors_count', label: 'Visitors', type: 'number', width: 90 },
  { key: 'issues_count', label: 'Issues', type: 'number', width: 80 },
  { key: 'returns_count', label: 'Returns', type: 'number', width: 80 },
  { key: 'month', label: 'Month', type: 'string', width: 100, groupable: true },
  { key: 'year', label: 'Year', type: 'number', width: 80, groupable: true },
  { key: 'total_fine_collected', label: 'Total Fine', type: 'currency', width: 120 },
  { key: 'rank', label: 'Rank', type: 'number', width: 70 },
  { key: 'percentage', label: '%', type: 'percentage', width: 80 },
];

// ═══════════════════════════════════════════════════════════════════════════════
// COLUMN SETS FOR TEMPLATES
// ═══════════════════════════════════════════════════════════════════════════════

export const COLUMN_SETS = {
  // Book Management
  book_inventory: ['book_id', 'barcode', 'title', 'author', 'category', 'total_copies', 'available_copies', 'issued_copies', 'location', 'book_status'],
  category_wise: ['category', 'total_copies', 'available_copies', 'issued_copies', 'total_value'],
  author_wise: ['author', 'title', 'category', 'times_issued', 'total_copies'],
  publisher_wise: ['publisher', 'title', 'total_copies', 'book_price', 'total_value'],
  new_arrivals: ['book_id', 'title', 'author', 'category', 'date_added', 'total_copies', 'book_price'],
  book_value: ['category', 'title', 'author', 'total_copies', 'book_price', 'total_value'],
  damaged_lost: ['book_id', 'title', 'book_status', 'member_name', 'fine_amount', 'condition'],
  book_condition: ['book_id', 'title', 'condition', 'last_issued', 'location'],
  low_stock: ['book_id', 'title', 'category', 'available_copies', 'total_copies', 'times_issued'],
  book_barcode: ['barcode', 'accession_no', 'title', 'author', 'location', 'rack_no', 'shelf_no'],
  
  // Issue & Return
  daily_issue: ['issue_id', 'book_id', 'title', 'member_name', 'member_type', 'issue_date', 'due_date', 'issued_by'],
  daily_return: ['issue_id', 'book_id', 'title', 'member_name', 'return_date', 'return_condition', 'days_overdue', 'fine_amount'],
  currently_issued: ['book_id', 'title', 'member_name', 'member_type', 'issue_date', 'due_date', 'days_overdue'],
  overdue_books: ['book_id', 'title', 'member_name', 'member_phone', 'due_date', 'days_overdue', 'fine_amount'],
  member_issued: ['member_id', 'member_name', 'title', 'issue_date', 'due_date', 'issue_status'],
  class_issue_summary: ['member_class', 'member_section', 'issues_count', 'returns_count', 'current_issues'],
  popular_books: ['book_id', 'title', 'author', 'category', 'times_issued', 'book_status'],
  least_issued: ['book_id', 'title', 'author', 'category', 'times_issued', 'last_issued'],
  reservation_queue: ['book_id', 'title', 'member_name', 'request_date', 'queue_position', 'reservation_status'],
  renewal_report: ['book_id', 'title', 'member_name', 'original_due', 'renewed_till', 'renewed_times'],
  
  // Members & Fines
  member_directory: ['member_id', 'member_name', 'member_type', 'member_class', 'card_no', 'card_status', 'card_expiry'],
  active_members: ['member_id', 'member_name', 'member_type', 'current_issues', 'last_activity', 'books_read'],
  inactive_members: ['member_id', 'member_name', 'member_type', 'last_activity', 'days_inactive'],
  fine_collection: ['member_name', 'title', 'days_overdue', 'fine_amount', 'fine_paid', 'payment_date', 'receipt_no'],
  fine_pending: ['member_id', 'member_name', 'member_type', 'fine_amount', 'fine_paid', 'fine_pending'],
  monthly_fine: ['month', 'fine_amount', 'fine_paid', 'fine_pending', 'issues_count'],
  reading_history: ['member_name', 'title', 'category', 'issue_date', 'return_date', 'avg_reading_days'],
  top_readers: ['rank', 'member_name', 'member_type', 'books_read', 'reading_categories'],
  card_expiry: ['member_id', 'member_name', 'card_no', 'card_expiry', 'card_status'],
  library_usage: ['time_slot', 'visitors_count', 'issues_count', 'returns_count', 'percentage'],
};

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get columns for a specific column set
 */
export const getColumnsForSet = (setName) => {
  const columnKeys = COLUMN_SETS[setName] || [];
  return columnKeys.map(key => LIBRARY_COLUMNS.find(col => col.key === key)).filter(Boolean);
};

/**
 * Get column by key
 */
export const getColumn = (key) => {
  return LIBRARY_COLUMNS.find(col => col.key === key);
};

/**
 * Get all columns
 */
export const getAllColumns = () => LIBRARY_COLUMNS;

/**
 * Get groupable columns
 */
export const getGroupableColumns = () => {
  return LIBRARY_COLUMNS.filter(col => col.groupable);
};

export default LIBRARY_COLUMNS;
