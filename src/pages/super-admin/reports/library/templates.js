/**
 * Library Report Generator - Template Definitions
 * Module 6: 30 Library Report Templates across 3 categories
 * 
 * Categories:
 * 1. Book Management (10)
 * 2. Issue & Return (10)
 * 3. Members & Fines (10)
 */

import { getColumnsForSet } from './columns';

// ═══════════════════════════════════════════════════════════════════════════════
// TEMPLATE CATEGORIES
// ═══════════════════════════════════════════════════════════════════════════════

export const LIBRARY_CATEGORIES = [
  {
    id: 'book_mgmt',
    name: 'Book Management',
    icon: '📚',
    description: 'Book inventory, categories, authors, publishers, conditions',
    count: 10
  },
  {
    id: 'issue_return',
    name: 'Issue & Return',
    icon: '🔄',
    description: 'Daily issues, returns, overdue, reservations, renewals',
    count: 10
  },
  {
    id: 'members_fines',
    name: 'Members & Fines',
    icon: '👥',
    description: 'Member directory, fine collection, reading history, top readers',
    count: 10
  }
];

// ═══════════════════════════════════════════════════════════════════════════════
// TEMPLATE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

export const LIBRARY_TEMPLATES = [
  // ─────────────────────────────────────────────────────────────────────────────
  // CATEGORY 1: BOOK MANAGEMENT (10)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'book_inventory',
    key: 'book_inventory',
    name: 'Book Inventory',
    description: 'Complete inventory of all books with ID, title, author, category, and availability',
    category: 'Book Management',
    icon: '📖',
    columns: getColumnsForSet('book_inventory'),
    defaultFilters: {},
    defaultGroupBy: ['category'],
    defaultSortBy: [{ field: 'title', direction: 'asc' }],
    aggregations: ['total_copies', 'available_copies'],
    popular: true,
  },
  {
    id: 'category_wise_books',
    key: 'category_wise_books',
    name: 'Category-wise Books',
    description: 'Books grouped by category with total, available, and issued counts',
    category: 'Book Management',
    icon: '📂',
    columns: getColumnsForSet('category_wise'),
    defaultFilters: {},
    defaultGroupBy: ['category'],
    defaultSortBy: [{ field: 'category', direction: 'asc' }],
    aggregations: ['total_copies', 'total_value'],
    popular: true,
  },
  {
    id: 'author_wise_books',
    key: 'author_wise_books',
    name: 'Author-wise Books',
    description: 'Books listed by author with popularity and count information',
    category: 'Book Management',
    icon: '✍️',
    columns: getColumnsForSet('author_wise'),
    defaultFilters: {},
    defaultGroupBy: ['author'],
    defaultSortBy: [{ field: 'times_issued', direction: 'desc' }],
    aggregations: ['total_copies'],
  },
  {
    id: 'publisher_wise_report',
    key: 'publisher_wise_report',
    name: 'Publisher-wise Report',
    description: 'Books grouped by publisher with total value and count',
    category: 'Book Management',
    icon: '🏢',
    columns: getColumnsForSet('publisher_wise'),
    defaultFilters: {},
    defaultGroupBy: ['publisher'],
    defaultSortBy: [{ field: 'total_value', direction: 'desc' }],
    aggregations: ['total_copies', 'total_value'],
  },
  {
    id: 'new_arrivals',
    key: 'new_arrivals',
    name: 'New Arrivals',
    description: 'Recently added books with acquisition date and details',
    category: 'Book Management',
    icon: '🆕',
    columns: getColumnsForSet('new_arrivals'),
    defaultFilters: { dateRange: true },
    defaultGroupBy: [],
    defaultSortBy: [{ field: 'date_added', direction: 'desc' }],
    aggregations: ['total_copies', 'book_price'],
    popular: true,
  },
  {
    id: 'book_value_report',
    key: 'book_value_report',
    name: 'Book Value Report',
    description: 'Library asset value report by category with total value',
    category: 'Book Management',
    icon: '💰',
    columns: getColumnsForSet('book_value'),
    defaultFilters: {},
    defaultGroupBy: ['category'],
    defaultSortBy: [{ field: 'total_value', direction: 'desc' }],
    aggregations: ['total_copies', 'total_value'],
  },
  {
    id: 'damaged_lost_books',
    key: 'damaged_lost_books',
    name: 'Damaged/Lost Books',
    description: 'Books marked as damaged or lost with responsible member and fine',
    category: 'Book Management',
    icon: '⚠️',
    columns: getColumnsForSet('damaged_lost'),
    defaultFilters: { status: ['damaged', 'lost'] },
    defaultGroupBy: ['book_status'],
    defaultSortBy: [{ field: 'fine_amount', direction: 'desc' }],
    aggregations: ['fine_amount'],
  },
  {
    id: 'book_condition',
    key: 'book_condition',
    name: 'Book Condition Report',
    description: 'Physical condition assessment of all books',
    category: 'Book Management',
    icon: '📋',
    columns: getColumnsForSet('book_condition'),
    defaultFilters: {},
    defaultGroupBy: ['condition'],
    defaultSortBy: [{ field: 'condition', direction: 'asc' }],
    aggregations: [],
  },
  {
    id: 'low_stock_alert',
    key: 'low_stock_alert',
    name: 'Low Stock Alert',
    description: 'Books with available copies below threshold',
    category: 'Book Management',
    icon: '🔔',
    columns: getColumnsForSet('low_stock'),
    defaultFilters: { threshold: 2 },
    defaultGroupBy: ['category'],
    defaultSortBy: [{ field: 'available_copies', direction: 'asc' }],
    aggregations: [],
  },
  {
    id: 'book_barcode_list',
    key: 'book_barcode_list',
    name: 'Book Barcode List',
    description: 'All books with barcodes and location for inventory management',
    category: 'Book Management',
    icon: '📊',
    columns: getColumnsForSet('book_barcode'),
    defaultFilters: {},
    defaultGroupBy: ['location'],
    defaultSortBy: [{ field: 'rack_no', direction: 'asc' }],
    aggregations: [],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // CATEGORY 2: ISSUE & RETURN (10)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'daily_issue_report',
    key: 'daily_issue_report',
    name: 'Daily Issue Report',
    description: 'All books issued on a specific date with member details',
    category: 'Issue & Return',
    icon: '📤',
    columns: getColumnsForSet('daily_issue'),
    defaultFilters: { date: 'today' },
    defaultGroupBy: [],
    defaultSortBy: [{ field: 'issue_date', direction: 'desc' }],
    aggregations: ['issues_count'],
    popular: true,
  },
  {
    id: 'daily_return_report',
    key: 'daily_return_report',
    name: 'Daily Return Report',
    description: 'All books returned on a specific date with condition and fines',
    category: 'Issue & Return',
    icon: '📥',
    columns: getColumnsForSet('daily_return'),
    defaultFilters: { date: 'today' },
    defaultGroupBy: [],
    defaultSortBy: [{ field: 'return_date', direction: 'desc' }],
    aggregations: ['fine_amount'],
    popular: true,
  },
  {
    id: 'currently_issued',
    key: 'currently_issued',
    name: 'Currently Issued Books',
    description: 'All books currently issued and not yet returned',
    category: 'Issue & Return',
    icon: '📕',
    columns: getColumnsForSet('currently_issued'),
    defaultFilters: { status: 'issued' },
    defaultGroupBy: ['member_type'],
    defaultSortBy: [{ field: 'due_date', direction: 'asc' }],
    aggregations: ['current_issues'],
    popular: true,
  },
  {
    id: 'overdue_books',
    key: 'overdue_books',
    name: 'Overdue Books',
    description: 'Books past due date with days overdue and calculated fine',
    category: 'Issue & Return',
    icon: '⏰',
    columns: getColumnsForSet('overdue_books'),
    defaultFilters: { overdue: true },
    defaultGroupBy: [],
    defaultSortBy: [{ field: 'days_overdue', direction: 'desc' }],
    aggregations: ['fine_amount'],
    popular: true,
  },
  {
    id: 'member_wise_issued',
    key: 'member_wise_issued',
    name: 'Member-wise Issued Books',
    description: 'Books issued per member with count and due dates',
    category: 'Issue & Return',
    icon: '👤',
    columns: getColumnsForSet('member_issued'),
    defaultFilters: {},
    defaultGroupBy: ['member_name'],
    defaultSortBy: [{ field: 'member_name', direction: 'asc' }],
    aggregations: [],
  },
  {
    id: 'class_wise_issue_summary',
    key: 'class_wise_issue_summary',
    name: 'Class-wise Issue Summary',
    description: 'Library usage summary grouped by student class',
    category: 'Issue & Return',
    icon: '🏫',
    columns: getColumnsForSet('class_issue_summary'),
    defaultFilters: {},
    defaultGroupBy: ['member_class'],
    defaultSortBy: [{ field: 'issues_count', direction: 'desc' }],
    aggregations: ['issues_count', 'returns_count'],
  },
  {
    id: 'popular_books',
    key: 'popular_books',
    name: 'Popular Books',
    description: 'Most frequently issued books ranked by popularity',
    category: 'Issue & Return',
    icon: '🌟',
    columns: getColumnsForSet('popular_books'),
    defaultFilters: {},
    defaultGroupBy: ['category'],
    defaultSortBy: [{ field: 'times_issued', direction: 'desc' }],
    aggregations: ['times_issued'],
    popular: true,
  },
  {
    id: 'least_issued_books',
    key: 'least_issued_books',
    name: 'Least Issued Books',
    description: 'Books with lowest circulation for collection review',
    category: 'Issue & Return',
    icon: '📉',
    columns: getColumnsForSet('least_issued'),
    defaultFilters: {},
    defaultGroupBy: ['category'],
    defaultSortBy: [{ field: 'times_issued', direction: 'asc' }],
    aggregations: [],
  },
  {
    id: 'reservation_queue',
    key: 'reservation_queue',
    name: 'Reservation Queue',
    description: 'Books with pending reservations and waiting members',
    category: 'Issue & Return',
    icon: '📋',
    columns: getColumnsForSet('reservation_queue'),
    defaultFilters: { status: 'pending' },
    defaultGroupBy: [],
    defaultSortBy: [{ field: 'request_date', direction: 'asc' }],
    aggregations: ['members_waiting'],
  },
  {
    id: 'renewal_report',
    key: 'renewal_report',
    name: 'Renewal Report',
    description: 'Books renewed with original and extended due dates',
    category: 'Issue & Return',
    icon: '🔄',
    columns: getColumnsForSet('renewal_report'),
    defaultFilters: { dateRange: true },
    defaultGroupBy: [],
    defaultSortBy: [{ field: 'renewed_till', direction: 'desc' }],
    aggregations: ['renewed_times'],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // CATEGORY 3: MEMBERS & FINES (10)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'member_directory',
    key: 'member_directory',
    name: 'Member Directory',
    description: 'Complete list of library members with card details',
    category: 'Members & Fines',
    icon: '📇',
    columns: getColumnsForSet('member_directory'),
    defaultFilters: {},
    defaultGroupBy: ['member_type'],
    defaultSortBy: [{ field: 'member_name', direction: 'asc' }],
    aggregations: [],
    popular: true,
  },
  {
    id: 'active_members',
    key: 'active_members',
    name: 'Active Members',
    description: 'Members with recent library activity',
    category: 'Members & Fines',
    icon: '✅',
    columns: getColumnsForSet('active_members'),
    defaultFilters: { activity: 'recent' },
    defaultGroupBy: ['member_type'],
    defaultSortBy: [{ field: 'last_activity', direction: 'desc' }],
    aggregations: ['current_issues'],
  },
  {
    id: 'inactive_members',
    key: 'inactive_members',
    name: 'Inactive Members',
    description: 'Members with no recent library activity',
    category: 'Members & Fines',
    icon: '😴',
    columns: getColumnsForSet('inactive_members'),
    defaultFilters: { threshold: 30 },
    defaultGroupBy: ['member_type'],
    defaultSortBy: [{ field: 'days_inactive', direction: 'desc' }],
    aggregations: [],
  },
  {
    id: 'fine_collection',
    key: 'fine_collection',
    name: 'Fine Collection Report',
    description: 'Fines collected for overdue books and damages',
    category: 'Members & Fines',
    icon: '💳',
    columns: getColumnsForSet('fine_collection'),
    defaultFilters: { dateRange: true },
    defaultGroupBy: [],
    defaultSortBy: [{ field: 'payment_date', direction: 'desc' }],
    aggregations: ['fine_amount', 'fine_paid'],
    popular: true,
  },
  {
    id: 'fine_pending',
    key: 'fine_pending',
    name: 'Fine Pending Report',
    description: 'Members with outstanding fine balance',
    category: 'Members & Fines',
    icon: '⚠️',
    columns: getColumnsForSet('fine_pending'),
    defaultFilters: { pending: true },
    defaultGroupBy: ['member_type'],
    defaultSortBy: [{ field: 'fine_pending', direction: 'desc' }],
    aggregations: ['fine_amount', 'fine_pending'],
    popular: true,
  },
  {
    id: 'monthly_fine_summary',
    key: 'monthly_fine_summary',
    name: 'Monthly Fine Summary',
    description: 'Month-wise fine collection summary',
    category: 'Members & Fines',
    icon: '📊',
    columns: getColumnsForSet('monthly_fine'),
    defaultFilters: { year: 'current' },
    defaultGroupBy: ['month'],
    defaultSortBy: [{ field: 'month', direction: 'asc' }],
    aggregations: ['fine_amount', 'fine_paid', 'fine_pending'],
  },
  {
    id: 'reading_history',
    key: 'reading_history',
    name: 'Reading History',
    description: 'Member-wise reading history with categories and duration',
    category: 'Members & Fines',
    icon: '📚',
    columns: getColumnsForSet('reading_history'),
    defaultFilters: {},
    defaultGroupBy: ['member_name'],
    defaultSortBy: [{ field: 'return_date', direction: 'desc' }],
    aggregations: ['books_read'],
  },
  {
    id: 'top_readers',
    key: 'top_readers',
    name: 'Top Readers',
    description: 'Members ranked by books read in given period',
    category: 'Members & Fines',
    icon: '🏆',
    columns: getColumnsForSet('top_readers'),
    defaultFilters: { timePeriod: 'month' },
    defaultGroupBy: ['member_type'],
    defaultSortBy: [{ field: 'books_read', direction: 'desc' }],
    aggregations: ['books_read'],
    popular: true,
  },
  {
    id: 'card_expiry_report',
    key: 'card_expiry_report',
    name: 'Card Expiry Report',
    description: 'Library cards expiring within specified period',
    category: 'Members & Fines',
    icon: '🔖',
    columns: getColumnsForSet('card_expiry'),
    defaultFilters: { expiryRange: '30days' },
    defaultGroupBy: [],
    defaultSortBy: [{ field: 'card_expiry', direction: 'asc' }],
    aggregations: [],
  },
  {
    id: 'library_usage_stats',
    key: 'library_usage_stats',
    name: 'Library Usage Statistics',
    description: 'Time-wise library usage with visitors, issues, and returns',
    category: 'Members & Fines',
    icon: '📈',
    columns: getColumnsForSet('library_usage'),
    defaultFilters: { dateRange: true },
    defaultGroupBy: ['time_slot'],
    defaultSortBy: [{ field: 'time_slot', direction: 'asc' }],
    aggregations: ['visitors_count', 'issues_count', 'returns_count'],
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get template by key
 */
export const getTemplate = (key) => {
  return LIBRARY_TEMPLATES.find(t => t.key === key || t.id === key);
};

/**
 * Get templates by category
 */
export const getTemplatesByCategory = (category) => {
  return LIBRARY_TEMPLATES.filter(t => t.category === category);
};

/**
 * Get popular templates
 */
export const getPopularTemplates = () => {
  return LIBRARY_TEMPLATES.filter(t => t.popular);
};

/**
 * Get all template categories
 */
export const getCategories = () => LIBRARY_CATEGORIES;

export default LIBRARY_TEMPLATES;
