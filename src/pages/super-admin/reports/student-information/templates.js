/**
 * Student Information Report Templates
 * 50 Pre-built templates organized by category
 */

import { getColumns, COLUMN_SETS } from './columns';

// Template Categories
export const TEMPLATE_CATEGORIES = {
  BASIC_DATA: 'Basic Student Data',
  STRENGTH: 'Strength Analysis',
  ADMISSION: 'Admission Reports',
  DEMOGRAPHICS: 'Demographics',
  CREDENTIALS: 'Credentials & Special'
};

// All Templates
export const STUDENT_TEMPLATES = [
  // ═══════════════════════════════════════════════════════════════
  // CATEGORY 1: BASIC STUDENT DATA (12 Reports)
  // ═══════════════════════════════════════════════════════════════
  {
    key: 'student_list_basic',
    name: 'Student List - Basic',
    category: TEMPLATE_CATEGORIES.BASIC_DATA,
    description: 'Simple list with essential student information',
    columns: [
      { key: 'admission_number', label: 'Adm. No', type: 'string' },
      { key: 'full_name', label: 'Student Name', type: 'computed', 
        render: (_, row) => `${row.first_name || ''} ${row.last_name || ''}`.trim() },
      { key: 'class.name', label: 'Class', type: 'string' },
      { key: 'section.name', label: 'Section', type: 'string' },
      { key: 'father_name', label: 'Father Name', type: 'string' },
      { key: 'phone', label: 'Phone', type: 'phone' }
    ],
    defaultFilters: { status: 'active' },
    defaultGroupBy: [],
    defaultSortBy: [{ field: 'class.name', direction: 'asc' }]
  },
  {
    key: 'student_list_complete',
    name: 'Student List - Complete',
    category: TEMPLATE_CATEGORIES.BASIC_DATA,
    description: 'Full student details including all fields',
    columns: [
      { key: 'admission_number', label: 'Adm. No', type: 'string' },
      { key: 'full_name', label: 'Name', type: 'computed' },
      { key: 'class.name', label: 'Class', type: 'string' },
      { key: 'section.name', label: 'Section', type: 'string' },
      { key: 'roll_number', label: 'Roll No', type: 'string' },
      { key: 'gender', label: 'Gender', type: 'badge' },
      { key: 'date_of_birth', label: 'DOB', type: 'date' },
      { key: 'father_name', label: 'Father', type: 'string' },
      { key: 'mother_name', label: 'Mother', type: 'string' },
      { key: 'phone', label: 'Phone', type: 'phone' },
      { key: 'address', label: 'Address', type: 'string' },
      { key: 'admission_date', label: 'Admission Date', type: 'date' },
      { key: 'status', label: 'Status', type: 'badge' }
    ],
    defaultFilters: {},
    defaultGroupBy: ['class.name'],
    defaultSortBy: [{ field: 'admission_number', direction: 'asc' }]
  },
  {
    key: 'contact_directory',
    name: 'Student Contact Directory',
    category: TEMPLATE_CATEGORIES.BASIC_DATA,
    description: 'Phone and email details of students and parents',
    columns: [
      { key: 'admission_number', label: 'Adm. No', type: 'string' },
      { key: 'full_name', label: 'Student Name', type: 'computed' },
      { key: 'class.name', label: 'Class', type: 'string' },
      { key: 'phone', label: 'Student Phone', type: 'phone' },
      { key: 'email', label: 'Email', type: 'email' },
      { key: 'father_phone', label: 'Father Phone', type: 'phone' },
      { key: 'mother_phone', label: 'Mother Phone', type: 'phone' }
    ],
    defaultFilters: { status: 'active' },
    defaultGroupBy: ['class.name'],
    defaultSortBy: []
  },
  {
    key: 'emergency_contact_list',
    name: 'Emergency Contact List',
    category: TEMPLATE_CATEGORIES.BASIC_DATA,
    description: 'Emergency contacts with blood group for safety',
    columns: [
      { key: 'admission_number', label: 'Adm. No', type: 'string' },
      { key: 'full_name', label: 'Student Name', type: 'computed' },
      { key: 'class.name', label: 'Class', type: 'string' },
      { key: 'guardian_name', label: 'Guardian', type: 'string' },
      { key: 'emergency_contact', label: 'Emergency Phone', type: 'phone' },
      { key: 'blood_group', label: 'Blood Group', type: 'badge' },
      { key: 'medical_conditions', label: 'Medical Conditions', type: 'string' }
    ],
    defaultFilters: { status: 'active' },
    defaultGroupBy: ['class.name'],
    defaultSortBy: []
  },
  {
    key: 'student_photo_gallery',
    name: 'Student Photo Gallery',
    category: TEMPLATE_CATEGORIES.BASIC_DATA,
    description: 'Student photos with basic details',
    columns: [
      { key: 'photo_url', label: 'Photo', type: 'image' },
      { key: 'admission_number', label: 'Adm. No', type: 'string' },
      { key: 'full_name', label: 'Name', type: 'computed' },
      { key: 'class.name', label: 'Class', type: 'string' },
      { key: 'section.name', label: 'Section', type: 'string' }
    ],
    defaultFilters: { status: 'active' },
    defaultGroupBy: ['class.name'],
    defaultSortBy: []
  },
  {
    key: 'student_address_list',
    name: 'Student Address List',
    category: TEMPLATE_CATEGORIES.BASIC_DATA,
    description: 'Complete address details for students',
    columns: [
      { key: 'admission_number', label: 'Adm. No', type: 'string' },
      { key: 'full_name', label: 'Name', type: 'computed' },
      { key: 'class.name', label: 'Class', type: 'string' },
      { key: 'address', label: 'Address', type: 'string' },
      { key: 'city', label: 'City', type: 'string' },
      { key: 'state', label: 'State', type: 'string' },
      { key: 'pincode', label: 'Pincode', type: 'string' }
    ],
    defaultFilters: { status: 'active' },
    defaultGroupBy: ['pincode'],
    defaultSortBy: []
  },
  {
    key: 'previous_school_data',
    name: 'Previous School Data',
    category: TEMPLATE_CATEGORIES.BASIC_DATA,
    description: 'Previous school and TC details',
    columns: [
      { key: 'admission_number', label: 'Adm. No', type: 'string' },
      { key: 'full_name', label: 'Name', type: 'computed' },
      { key: 'class.name', label: 'Class', type: 'string' },
      { key: 'previous_school', label: 'Previous School', type: 'string' },
      { key: 'previous_class', label: 'Previous Class', type: 'string' },
      { key: 'tc_number', label: 'TC No', type: 'string' }
    ],
    defaultFilters: { status: 'active' },
    defaultGroupBy: [],
    defaultSortBy: []
  },
  {
    key: 'document_status',
    name: 'Document Status Report',
    category: TEMPLATE_CATEGORIES.BASIC_DATA,
    description: 'Track document submission status',
    columns: [
      { key: 'admission_number', label: 'Adm. No', type: 'string' },
      { key: 'full_name', label: 'Name', type: 'computed' },
      { key: 'class.name', label: 'Class', type: 'string' },
      { key: 'aadhar_number', label: 'Aadhar', type: 'string' },
      { key: 'birth_certificate_no', label: 'Birth Cert', type: 'string' },
      { key: 'tc_number', label: 'TC No', type: 'string' },
      { key: 'photo_url', label: 'Photo', type: 'image' }
    ],
    defaultFilters: { status: 'active' },
    defaultGroupBy: ['class.name'],
    defaultSortBy: []
  },
  {
    key: 'student_medical_records',
    name: 'Student Medical Records',
    category: TEMPLATE_CATEGORIES.BASIC_DATA,
    description: 'Health and medical information',
    columns: [
      { key: 'admission_number', label: 'Adm. No', type: 'string' },
      { key: 'full_name', label: 'Name', type: 'computed' },
      { key: 'class.name', label: 'Class', type: 'string' },
      { key: 'blood_group', label: 'Blood Group', type: 'badge' },
      { key: 'height', label: 'Height (cm)', type: 'number' },
      { key: 'weight', label: 'Weight (kg)', type: 'number' },
      { key: 'medical_conditions', label: 'Conditions', type: 'string' },
      { key: 'allergies', label: 'Allergies', type: 'string' }
    ],
    defaultFilters: { status: 'active' },
    defaultGroupBy: ['blood_group'],
    defaultSortBy: []
  },
  {
    key: 'id_card_export',
    name: 'ID Card Data Export',
    category: TEMPLATE_CATEGORIES.BASIC_DATA,
    description: 'Data for printing student ID cards',
    columns: [
      { key: 'photo_url', label: 'Photo', type: 'image' },
      { key: 'admission_number', label: 'Adm. No', type: 'string' },
      { key: 'full_name', label: 'Name', type: 'computed' },
      { key: 'class.name', label: 'Class', type: 'string' },
      { key: 'section.name', label: 'Section', type: 'string' },
      { key: 'date_of_birth', label: 'DOB', type: 'date' },
      { key: 'blood_group', label: 'Blood', type: 'badge' },
      { key: 'father_name', label: 'Father', type: 'string' },
      { key: 'address', label: 'Address', type: 'string' },
      { key: 'phone', label: 'Phone', type: 'phone' }
    ],
    defaultFilters: { status: 'active' },
    defaultGroupBy: ['class.name'],
    defaultSortBy: []
  },
  {
    key: 'student_notes',
    name: 'Student Notes Report',
    category: TEMPLATE_CATEGORIES.BASIC_DATA,
    description: 'Special notes and remarks about students',
    columns: [
      { key: 'admission_number', label: 'Adm. No', type: 'string' },
      { key: 'full_name', label: 'Name', type: 'computed' },
      { key: 'class.name', label: 'Class', type: 'string' },
      { key: 'notes', label: 'Notes', type: 'string' }
    ],
    defaultFilters: { status: 'active' },
    defaultGroupBy: ['class.name'],
    defaultSortBy: []
  },
  {
    key: 'profile_completion',
    name: 'Profile Completion Status',
    category: TEMPLATE_CATEGORIES.BASIC_DATA,
    description: 'Track incomplete student profiles',
    columns: [
      { key: 'admission_number', label: 'Adm. No', type: 'string' },
      { key: 'full_name', label: 'Name', type: 'computed' },
      { key: 'class.name', label: 'Class', type: 'string' },
      { key: 'phone', label: 'Phone', type: 'phone' },
      { key: 'aadhar_number', label: 'Aadhar', type: 'string' },
      { key: 'photo_url', label: 'Photo', type: 'image' }
    ],
    defaultFilters: { status: 'active' },
    defaultGroupBy: ['class.name'],
    defaultSortBy: []
  },

  // ═══════════════════════════════════════════════════════════════
  // CATEGORY 2: STRENGTH ANALYSIS (10 Reports)
  // ═══════════════════════════════════════════════════════════════
  {
    key: 'class_wise_strength',
    name: 'Class-wise Strength',
    category: TEMPLATE_CATEGORIES.STRENGTH,
    description: 'Student count by class with gender breakdown',
    isStrengthReport: true,
    columns: [
      { key: 'class_name', label: 'Class', type: 'string' },
      { key: 'boys_count', label: 'Boys', type: 'number' },
      { key: 'girls_count', label: 'Girls', type: 'number' },
      { key: 'total_count', label: 'Total', type: 'number' }
    ],
    defaultFilters: { status: 'active' },
    defaultGroupBy: [],
    defaultSortBy: []
  },
  {
    key: 'section_wise_strength',
    name: 'Section-wise Strength',
    category: TEMPLATE_CATEGORIES.STRENGTH,
    description: 'Student count by class and section',
    isStrengthReport: true,
    columns: [
      { key: 'class_name', label: 'Class', type: 'string' },
      { key: 'section_name', label: 'Section', type: 'string' },
      { key: 'boys_count', label: 'Boys', type: 'number' },
      { key: 'girls_count', label: 'Girls', type: 'number' },
      { key: 'total_count', label: 'Total', type: 'number' }
    ],
    defaultFilters: { status: 'active' },
    defaultGroupBy: ['class_name'],
    defaultSortBy: []
  },
  {
    key: 'month_wise_closing',
    name: 'Month-wise Closing Strength',
    category: TEMPLATE_CATEGORIES.STRENGTH,
    description: 'Student count at end of each month (Apr-Mar)',
    isStrengthReport: true,
    columns: [
      { key: 'class_name', label: 'Class', type: 'string' },
      { key: 'apr', label: 'Apr', type: 'number' },
      { key: 'may', label: 'May', type: 'number' },
      { key: 'jun', label: 'Jun', type: 'number' },
      { key: 'jul', label: 'Jul', type: 'number' },
      { key: 'aug', label: 'Aug', type: 'number' },
      { key: 'sep', label: 'Sep', type: 'number' },
      { key: 'oct', label: 'Oct', type: 'number' },
      { key: 'nov', label: 'Nov', type: 'number' },
      { key: 'dec', label: 'Dec', type: 'number' },
      { key: 'jan', label: 'Jan', type: 'number' },
      { key: 'feb', label: 'Feb', type: 'number' },
      { key: 'mar', label: 'Mar', type: 'number' }
    ],
    defaultFilters: {},
    defaultGroupBy: [],
    defaultSortBy: []
  },
  {
    key: 'gender_ratio',
    name: 'Gender Ratio Analysis',
    category: TEMPLATE_CATEGORIES.STRENGTH,
    description: 'Male/Female ratio by class',
    isStrengthReport: true,
    columns: [
      { key: 'class_name', label: 'Class', type: 'string' },
      { key: 'boys_count', label: 'Boys', type: 'number' },
      { key: 'girls_count', label: 'Girls', type: 'number' },
      { key: 'male_percent', label: 'Male %', type: 'percentage' },
      { key: 'female_percent', label: 'Female %', type: 'percentage' },
      { key: 'ratio', label: 'Ratio (B:G)', type: 'string' }
    ],
    defaultFilters: { status: 'active' },
    defaultGroupBy: [],
    defaultSortBy: []
  },
  {
    key: 'age_wise_distribution',
    name: 'Age-wise Distribution',
    category: TEMPLATE_CATEGORIES.STRENGTH,
    description: 'Student count by age group',
    isStrengthReport: true,
    columns: [
      { key: 'age_group', label: 'Age Group', type: 'string' },
      { key: 'boys_count', label: 'Boys', type: 'number' },
      { key: 'girls_count', label: 'Girls', type: 'number' },
      { key: 'total_count', label: 'Total', type: 'number' },
      { key: 'percentage', label: '%', type: 'percentage' }
    ],
    defaultFilters: { status: 'active' },
    defaultGroupBy: [],
    defaultSortBy: []
  },
  {
    key: 'category_wise_strength',
    name: 'Category-wise Strength',
    category: TEMPLATE_CATEGORIES.STRENGTH,
    description: 'Student count by category (General, SC, ST, OBC)',
    isStrengthReport: true,
    columns: [
      { key: 'category', label: 'Category', type: 'string' },
      { key: 'boys_count', label: 'Boys', type: 'number' },
      { key: 'girls_count', label: 'Girls', type: 'number' },
      { key: 'total_count', label: 'Total', type: 'number' },
      { key: 'percentage', label: '%', type: 'percentage' }
    ],
    defaultFilters: { status: 'active' },
    defaultGroupBy: [],
    defaultSortBy: []
  },
  {
    key: 'rte_vs_non_rte',
    name: 'RTE vs Non-RTE',
    category: TEMPLATE_CATEGORIES.STRENGTH,
    description: 'RTE and Non-RTE student count',
    isStrengthReport: true,
    columns: [
      { key: 'class_name', label: 'Class', type: 'string' },
      { key: 'rte_count', label: 'RTE', type: 'number' },
      { key: 'non_rte_count', label: 'Non-RTE', type: 'number' },
      { key: 'total_count', label: 'Total', type: 'number' }
    ],
    defaultFilters: { status: 'active' },
    defaultGroupBy: [],
    defaultSortBy: []
  },
  {
    key: 'house_wise_strength',
    name: 'House-wise Strength',
    category: TEMPLATE_CATEGORIES.STRENGTH,
    description: 'Student count by house',
    isStrengthReport: true,
    columns: [
      { key: 'house', label: 'House', type: 'string' },
      { key: 'boys_count', label: 'Boys', type: 'number' },
      { key: 'girls_count', label: 'Girls', type: 'number' },
      { key: 'total_count', label: 'Total', type: 'number' }
    ],
    defaultFilters: { status: 'active' },
    defaultGroupBy: [],
    defaultSortBy: []
  },
  {
    key: 'medium_wise_strength',
    name: 'Medium-wise Strength',
    category: TEMPLATE_CATEGORIES.STRENGTH,
    description: 'Student count by medium of instruction',
    isStrengthReport: true,
    columns: [
      { key: 'medium', label: 'Medium', type: 'string' },
      { key: 'total_count', label: 'Count', type: 'number' },
      { key: 'percentage', label: '%', type: 'percentage' }
    ],
    defaultFilters: { status: 'active' },
    defaultGroupBy: [],
    defaultSortBy: []
  },
  {
    key: 'shift_wise_strength',
    name: 'Shift-wise Strength',
    category: TEMPLATE_CATEGORIES.STRENGTH,
    description: 'Student count by shift',
    isStrengthReport: true,
    columns: [
      { key: 'shift', label: 'Shift', type: 'string' },
      { key: 'total_count', label: 'Count', type: 'number' },
      { key: 'percentage', label: '%', type: 'percentage' }
    ],
    defaultFilters: { status: 'active' },
    defaultGroupBy: [],
    defaultSortBy: []
  },

  // ═══════════════════════════════════════════════════════════════
  // CATEGORY 3: ADMISSION REPORTS (10 Reports)
  // ═══════════════════════════════════════════════════════════════
  {
    key: 'new_admissions',
    name: 'New Admissions',
    category: TEMPLATE_CATEGORIES.ADMISSION,
    description: 'Students admitted within date range',
    columns: [
      { key: 'admission_number', label: 'Adm. No', type: 'string' },
      { key: 'full_name', label: 'Name', type: 'computed' },
      { key: 'class.name', label: 'Class', type: 'string' },
      { key: 'admission_date', label: 'Admission Date', type: 'date' },
      { key: 'father_name', label: 'Father', type: 'string' },
      { key: 'phone', label: 'Phone', type: 'phone' }
    ],
    defaultFilters: {},
    defaultFilterConfig: { dateRange: true },
    defaultGroupBy: ['admission_date'],
    defaultSortBy: [{ field: 'admission_date', direction: 'desc' }]
  },
  {
    key: 'vacancy_report',
    name: 'Vacancy Report',
    category: TEMPLATE_CATEGORIES.ADMISSION,
    description: 'Available seats per class/section',
    isStrengthReport: true,
    columns: [
      { key: 'class_name', label: 'Class', type: 'string' },
      { key: 'section_name', label: 'Section', type: 'string' },
      { key: 'capacity', label: 'Capacity', type: 'number' },
      { key: 'filled', label: 'Filled', type: 'number' },
      { key: 'vacant', label: 'Vacant', type: 'number' },
      { key: 'fill_percent', label: 'Fill %', type: 'percentage' }
    ],
    defaultFilters: {},
    defaultGroupBy: ['class_name'],
    defaultSortBy: []
  },
  {
    key: 'admission_trends',
    name: 'Admission Trends',
    category: TEMPLATE_CATEGORIES.ADMISSION,
    description: 'Monthly admission vs left analysis',
    isStrengthReport: true,
    columns: [
      { key: 'month', label: 'Month', type: 'string' },
      { key: 'new_count', label: 'New', type: 'number' },
      { key: 'left_count', label: 'Left', type: 'number' },
      { key: 'net_change', label: 'Net Change', type: 'number' }
    ],
    defaultFilters: {},
    defaultGroupBy: [],
    defaultSortBy: []
  },
  {
    key: 'class_transfer',
    name: 'Class Transfer Report',
    category: TEMPLATE_CATEGORIES.ADMISSION,
    description: 'Students transferred between classes',
    columns: [
      { key: 'admission_number', label: 'Adm. No', type: 'string' },
      { key: 'full_name', label: 'Name', type: 'computed' },
      { key: 'from_class', label: 'From Class', type: 'string' },
      { key: 'to_class', label: 'To Class', type: 'string' },
      { key: 'transfer_date', label: 'Transfer Date', type: 'date' }
    ],
    defaultFilters: {},
    defaultGroupBy: [],
    defaultSortBy: [{ field: 'transfer_date', direction: 'desc' }]
  },
  {
    key: 're_admission',
    name: 'Re-admission List',
    category: TEMPLATE_CATEGORIES.ADMISSION,
    description: 'Students who left and re-joined',
    columns: [
      { key: 'admission_number', label: 'Adm. No', type: 'string' },
      { key: 'full_name', label: 'Name', type: 'computed' },
      { key: 'class.name', label: 'Class', type: 'string' },
      { key: 'left_date', label: 'Left Date', type: 'date' },
      { key: 'rejoined_date', label: 'Rejoined Date', type: 'date' }
    ],
    defaultFilters: {},
    defaultGroupBy: [],
    defaultSortBy: []
  },

  // Additional admission reports
  {
    key: 'enquiry_register',
    name: 'Enquiry Register',
    category: TEMPLATE_CATEGORIES.ADMISSION,
    description: 'Track admission enquiries',
    columns: [
      { key: 'enquiry_date', label: 'Date', type: 'date' },
      { key: 'student_name', label: 'Student Name', type: 'string' },
      { key: 'phone', label: 'Phone', type: 'phone' },
      { key: 'class_enquired', label: 'Class', type: 'string' },
      { key: 'status', label: 'Status', type: 'badge' }
    ],
    defaultFilters: {},
    defaultGroupBy: ['status'],
    defaultSortBy: [{ field: 'enquiry_date', direction: 'desc' }]
  },
  {
    key: 'online_applications',
    name: 'Online Applications',
    category: TEMPLATE_CATEGORIES.ADMISSION,
    description: 'Online admission applications status',
    columns: [
      { key: 'application_no', label: 'Application No', type: 'string' },
      { key: 'applicant_name', label: 'Name', type: 'string' },
      { key: 'applied_date', label: 'Applied Date', type: 'date' },
      { key: 'class_applied', label: 'Class', type: 'string' },
      { key: 'status', label: 'Status', type: 'badge' }
    ],
    defaultFilters: {},
    defaultGroupBy: ['status'],
    defaultSortBy: [{ field: 'applied_date', direction: 'desc' }]
  },
  {
    key: 'document_verification',
    name: 'Document Verification Status',
    category: TEMPLATE_CATEGORIES.ADMISSION,
    description: 'Track document verification during admission',
    columns: [
      { key: 'admission_number', label: 'Adm. No', type: 'string' },
      { key: 'full_name', label: 'Name', type: 'computed' },
      { key: 'class.name', label: 'Class', type: 'string' },
      { key: 'documents_submitted', label: 'Submitted', type: 'number' },
      { key: 'documents_verified', label: 'Verified', type: 'number' },
      { key: 'status', label: 'Status', type: 'badge' }
    ],
    defaultFilters: {},
    defaultGroupBy: ['class.name'],
    defaultSortBy: []
  },
  {
    key: 'admission_fee_status',
    name: 'Admission Fee Status',
    category: TEMPLATE_CATEGORIES.ADMISSION,
    description: 'Fee payment status of new admissions',
    columns: [
      { key: 'admission_number', label: 'Adm. No', type: 'string' },
      { key: 'full_name', label: 'Name', type: 'computed' },
      { key: 'class.name', label: 'Class', type: 'string' },
      { key: 'admission_date', label: 'Adm. Date', type: 'date' },
      { key: 'fee_required', label: 'Fee Required', type: 'currency' },
      { key: 'fee_paid', label: 'Fee Paid', type: 'currency' },
      { key: 'balance', label: 'Balance', type: 'currency' }
    ],
    defaultFilters: {},
    defaultGroupBy: ['class.name'],
    defaultSortBy: []
  },
  {
    key: 'admission_form_status',
    name: 'Admission Form Completion',
    category: TEMPLATE_CATEGORIES.ADMISSION,
    description: 'Track admission form completion status',
    columns: [
      { key: 'admission_number', label: 'Adm. No', type: 'string' },
      { key: 'full_name', label: 'Name', type: 'computed' },
      { key: 'class.name', label: 'Class', type: 'string' },
      { key: 'completion_percent', label: 'Completion %', type: 'percentage' },
      { key: 'missing_fields', label: 'Missing Fields', type: 'string' }
    ],
    defaultFilters: {},
    defaultGroupBy: [],
    defaultSortBy: [{ field: 'completion_percent', direction: 'asc' }]
  },

  // ═══════════════════════════════════════════════════════════════
  // CATEGORY 4: DEMOGRAPHICS (10 Reports)
  // ═══════════════════════════════════════════════════════════════
  {
    key: 'birthday_month',
    name: 'Birthday Report - Month',
    category: TEMPLATE_CATEGORIES.DEMOGRAPHICS,
    description: 'Students with birthdays in selected month',
    columns: [
      { key: 'admission_number', label: 'Adm. No', type: 'string' },
      { key: 'full_name', label: 'Name', type: 'computed' },
      { key: 'date_of_birth', label: 'DOB', type: 'date' },
      { key: 'age', label: 'Age', type: 'computed' },
      { key: 'class.name', label: 'Class', type: 'string' },
      { key: 'phone', label: 'Phone', type: 'phone' }
    ],
    defaultFilters: { status: 'active' },
    defaultFilterConfig: { month: true },
    defaultGroupBy: [],
    defaultSortBy: [{ field: 'date_of_birth', direction: 'asc' }]
  },
  {
    key: 'birthday_today',
    name: 'Birthday Report - Today/Week',
    category: TEMPLATE_CATEGORIES.DEMOGRAPHICS,
    description: 'Students with birthdays today or this week',
    columns: [
      { key: 'full_name', label: 'Name', type: 'computed' },
      { key: 'date_of_birth', label: 'DOB', type: 'date' },
      { key: 'class.name', label: 'Class', type: 'string' },
      { key: 'phone', label: 'Phone', type: 'phone' }
    ],
    defaultFilters: { status: 'active' },
    defaultGroupBy: [],
    defaultSortBy: [{ field: 'date_of_birth', direction: 'asc' }]
  },
  {
    key: 'blood_group_distribution',
    name: 'Blood Group Distribution',
    category: TEMPLATE_CATEGORIES.DEMOGRAPHICS,
    description: 'Students grouped by blood type',
    isStrengthReport: true,
    columns: [
      { key: 'blood_group', label: 'Blood Group', type: 'badge' },
      { key: 'total_count', label: 'Count', type: 'number' },
      { key: 'students', label: 'Students', type: 'string' }
    ],
    defaultFilters: { status: 'active' },
    defaultGroupBy: [],
    defaultSortBy: []
  },
  {
    key: 'religion_wise',
    name: 'Religion-wise Report',
    category: TEMPLATE_CATEGORIES.DEMOGRAPHICS,
    description: 'Student count by religion',
    isStrengthReport: true,
    columns: [
      { key: 'religion', label: 'Religion', type: 'string' },
      { key: 'total_count', label: 'Count', type: 'number' },
      { key: 'percentage', label: '%', type: 'percentage' }
    ],
    defaultFilters: { status: 'active' },
    defaultGroupBy: [],
    defaultSortBy: []
  },
  {
    key: 'caste_wise',
    name: 'Caste-wise Report',
    category: TEMPLATE_CATEGORIES.DEMOGRAPHICS,
    description: 'Student count by caste',
    isStrengthReport: true,
    columns: [
      { key: 'caste', label: 'Caste', type: 'string' },
      { key: 'total_count', label: 'Count', type: 'number' },
      { key: 'percentage', label: '%', type: 'percentage' }
    ],
    defaultFilters: { status: 'active' },
    defaultGroupBy: ['religion'],
    defaultSortBy: []
  },
  {
    key: 'mother_tongue',
    name: 'Mother Tongue Report',
    category: TEMPLATE_CATEGORIES.DEMOGRAPHICS,
    description: 'Student count by mother tongue',
    isStrengthReport: true,
    columns: [
      { key: 'mother_tongue', label: 'Mother Tongue', type: 'string' },
      { key: 'total_count', label: 'Count', type: 'number' },
      { key: 'percentage', label: '%', type: 'percentage' }
    ],
    defaultFilters: { status: 'active' },
    defaultGroupBy: [],
    defaultSortBy: []
  },
  {
    key: 'nationality_report',
    name: 'Nationality Report',
    category: TEMPLATE_CATEGORIES.DEMOGRAPHICS,
    description: 'Student count by nationality',
    isStrengthReport: true,
    columns: [
      { key: 'nationality', label: 'Nationality', type: 'string' },
      { key: 'total_count', label: 'Count', type: 'number' },
      { key: 'percentage', label: '%', type: 'percentage' }
    ],
    defaultFilters: { status: 'active' },
    defaultGroupBy: [],
    defaultSortBy: []
  },
  {
    key: 'area_analysis',
    name: 'Area/Pincode Analysis',
    category: TEMPLATE_CATEGORIES.DEMOGRAPHICS,
    description: 'Students grouped by pincode/area',
    isStrengthReport: true,
    columns: [
      { key: 'pincode', label: 'Pincode', type: 'string' },
      { key: 'city', label: 'City/Area', type: 'string' },
      { key: 'total_count', label: 'Students', type: 'number' }
    ],
    defaultFilters: { status: 'active' },
    defaultGroupBy: [],
    defaultSortBy: [{ field: 'total_count', direction: 'desc' }]
  },
  {
    key: 'parent_education',
    name: 'Parent Education Level',
    category: TEMPLATE_CATEGORIES.DEMOGRAPHICS,
    description: 'Analysis of parent education background',
    isStrengthReport: true,
    columns: [
      { key: 'education_level', label: 'Education Level', type: 'string' },
      { key: 'total_count', label: 'Count', type: 'number' },
      { key: 'percentage', label: '%', type: 'percentage' }
    ],
    defaultFilters: { status: 'active' },
    defaultGroupBy: [],
    defaultSortBy: []
  },
  {
    key: 'family_income',
    name: 'Family Income Analysis',
    category: TEMPLATE_CATEGORIES.DEMOGRAPHICS,
    description: 'Students grouped by family income',
    isStrengthReport: true,
    columns: [
      { key: 'income_slab', label: 'Income Range', type: 'string' },
      { key: 'total_count', label: 'Count', type: 'number' },
      { key: 'percentage', label: '%', type: 'percentage' }
    ],
    defaultFilters: { status: 'active' },
    defaultGroupBy: [],
    defaultSortBy: []
  },

  // ═══════════════════════════════════════════════════════════════
  // CATEGORY 5: CREDENTIALS & SPECIAL (8 Reports)
  // ═══════════════════════════════════════════════════════════════
  {
    key: 'student_credentials',
    name: 'Student Login Credentials',
    category: TEMPLATE_CATEGORIES.CREDENTIALS,
    description: 'Student portal login credentials',
    columns: [
      { key: 'admission_number', label: 'Adm. No', type: 'string' },
      { key: 'full_name', label: 'Name', type: 'computed' },
      { key: 'class.name', label: 'Class', type: 'string' },
      { key: 'email', label: 'Email/Username', type: 'email' },
      { key: 'login_status', label: 'Status', type: 'badge' }
    ],
    defaultFilters: { status: 'active' },
    defaultGroupBy: ['class.name'],
    defaultSortBy: []
  },
  {
    key: 'parent_credentials',
    name: 'Parent Login Credentials',
    category: TEMPLATE_CATEGORIES.CREDENTIALS,
    description: 'Parent portal login credentials',
    columns: [
      { key: 'parent_name', label: 'Parent Name', type: 'string' },
      { key: 'parent_email', label: 'Email', type: 'email' },
      { key: 'phone', label: 'Phone', type: 'phone' },
      { key: 'children', label: 'Children', type: 'string' },
      { key: 'login_status', label: 'Status', type: 'badge' }
    ],
    defaultFilters: {},
    defaultGroupBy: ['login_status'],
    defaultSortBy: []
  },
  {
    key: 'tc_issued',
    name: 'TC Issued Report',
    category: TEMPLATE_CATEGORIES.CREDENTIALS,
    description: 'Transfer certificates issued',
    columns: [
      { key: 'admission_number', label: 'Adm. No', type: 'string' },
      { key: 'full_name', label: 'Name', type: 'computed' },
      { key: 'tc_number', label: 'TC No', type: 'string' },
      { key: 'tc_date', label: 'TC Date', type: 'date' },
      { key: 'reason', label: 'Reason', type: 'string' },
      { key: 'last_class', label: 'Last Class', type: 'string' }
    ],
    defaultFilters: { status: 'tc_issued' },
    defaultGroupBy: [],
    defaultSortBy: [{ field: 'tc_date', direction: 'desc' }]
  },
  {
    key: 'left_students',
    name: 'Left Students Report',
    category: TEMPLATE_CATEGORIES.CREDENTIALS,
    description: 'Students who have left the school',
    columns: [
      { key: 'admission_number', label: 'Adm. No', type: 'string' },
      { key: 'full_name', label: 'Name', type: 'computed' },
      { key: 'last_class', label: 'Last Class', type: 'string' },
      { key: 'left_date', label: 'Left Date', type: 'date' },
      { key: 'reason', label: 'Reason', type: 'string' }
    ],
    defaultFilters: { status: 'left' },
    defaultGroupBy: ['reason'],
    defaultSortBy: [{ field: 'left_date', direction: 'desc' }]
  },
  {
    key: 'sibling_students',
    name: 'Sibling Students',
    category: TEMPLATE_CATEGORIES.CREDENTIALS,
    description: 'Students with siblings in same school',
    columns: [
      { key: 'father_name', label: 'Father Name', type: 'string' },
      { key: 'phone', label: 'Phone', type: 'phone' },
      { key: 'siblings_count', label: 'Siblings', type: 'number' },
      { key: 'sibling_names', label: 'Sibling Names', type: 'string' },
      { key: 'sibling_classes', label: 'Classes', type: 'string' }
    ],
    defaultFilters: { status: 'active' },
    defaultGroupBy: [],
    defaultSortBy: [{ field: 'siblings_count', direction: 'desc' }]
  },
  {
    key: 'scholarship_students',
    name: 'Scholarship Students',
    category: TEMPLATE_CATEGORIES.CREDENTIALS,
    description: 'Students receiving scholarships',
    columns: [
      { key: 'admission_number', label: 'Adm. No', type: 'string' },
      { key: 'full_name', label: 'Name', type: 'computed' },
      { key: 'class.name', label: 'Class', type: 'string' },
      { key: 'scholarship_type', label: 'Scholarship Type', type: 'string' },
      { key: 'scholarship_amount', label: 'Amount', type: 'currency' }
    ],
    defaultFilters: { status: 'active' },
    defaultGroupBy: ['scholarship_type'],
    defaultSortBy: []
  },
  {
    key: 'transport_users',
    name: 'Transport Users',
    category: TEMPLATE_CATEGORIES.CREDENTIALS,
    description: 'Students using school transport',
    columns: [
      { key: 'admission_number', label: 'Adm. No', type: 'string' },
      { key: 'full_name', label: 'Name', type: 'computed' },
      { key: 'class.name', label: 'Class', type: 'string' },
      { key: 'route_name', label: 'Route', type: 'string' },
      { key: 'vehicle_number', label: 'Vehicle', type: 'string' },
      { key: 'pickup_point', label: 'Pickup Point', type: 'string' }
    ],
    defaultFilters: { status: 'active', transport_user: true },
    defaultGroupBy: ['route_name'],
    defaultSortBy: []
  },
  {
    key: 'hostel_students',
    name: 'Hostel Students',
    category: TEMPLATE_CATEGORIES.CREDENTIALS,
    description: 'Students staying in hostel',
    columns: [
      { key: 'admission_number', label: 'Adm. No', type: 'string' },
      { key: 'full_name', label: 'Name', type: 'computed' },
      { key: 'class.name', label: 'Class', type: 'string' },
      { key: 'room_number', label: 'Room', type: 'string' },
      { key: 'floor', label: 'Floor', type: 'string' },
      { key: 'mess_type', label: 'Mess Type', type: 'string' }
    ],
    defaultFilters: { status: 'active', hostel_user: true },
    defaultGroupBy: ['floor'],
    defaultSortBy: []
  }
];

// Get template by key
export const getTemplate = (key) => STUDENT_TEMPLATES.find(t => t.key === key);

// Get templates by category
export const getTemplatesByCategory = (category) => 
  STUDENT_TEMPLATES.filter(t => t.category === category);

// Get all categories with templates
export const getCategorizedTemplates = () => {
  const categories = {};
  STUDENT_TEMPLATES.forEach(t => {
    if (!categories[t.category]) {
      categories[t.category] = [];
    }
    categories[t.category].push(t);
  });
  return categories;
};

export default STUDENT_TEMPLATES;
