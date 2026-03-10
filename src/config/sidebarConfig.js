import { 
  LayoutDashboard, School, Users, CreditCard, Settings, BookOpen, GraduationCap, Calendar, FileText, Bus, Building, MessageSquare, Briefcase, LogOut, X, ChevronDown, ChevronRight, Package, CheckSquare, Library, Layout, Video, MonitorPlay, AlertTriangle, Award, Newspaper, Activity, IndianRupee, UserPlus, GitBranch, BarChart3, Bot, Box, Download, QrCode, KeyRound, Wallet
} from 'lucide-react';
import { ROUTES } from '@/registry/routeRegistry';

// Toggle for Queries Finder - Change to false to hide
const SHOW_QUERIES_FINDER = true;

export const BASE_SIDEBAR = {
  master_admin: [
    { title: 'Dashboard', icon: LayoutDashboard, path: ROUTES.MASTER_ADMIN.DASHBOARD },
    { title: 'Advanced Analytics', icon: BarChart3, path: '/master-admin/advanced-analytics' },
    { title: 'Module Registry', icon: Box, path: '/master-admin/module-registry', badge: 'NEW' },
    { title: 'Branches', icon: School, path: ROUTES.MASTER_ADMIN.SCHOOLS },
    { title: 'Organization Requests', icon: UserPlus, path: ROUTES.MASTER_ADMIN.ORGANIZATION_REQUESTS },
    { title: 'Branch Management', icon: GitBranch, path: '/master-admin/branch-management' },
    { title: 'WhatsApp Manager', icon: MessageSquare, path: ROUTES.MASTER_ADMIN.WHATSAPP_MANAGER },
    { title: 'JashSync Control', icon: MessageSquare, path: ROUTES.MASTER_ADMIN.JASHSYNC_CONTROL, badge: 'NEW' },
    {
      title: 'Subscriptions',
      icon: CreditCard,
      submenu: [
        { title: 'Plans', path: ROUTES.MASTER_ADMIN.SUBSCRIPTION_PLANS },
        { title: 'Subscriptions', path: ROUTES.MASTER_ADMIN.SUBSCRIPTIONS },
        { title: 'Invoices', path: ROUTES.MASTER_ADMIN.SUBSCRIPTION_INVOICES },
        { title: 'Transactions', path: ROUTES.MASTER_ADMIN.SUBSCRIPTION_TRANSACTIONS },
        { title: 'Billing Audit', path: ROUTES.MASTER_ADMIN.BILLING_AUDIT },
        { title: 'Generate Bill', path: '/master-admin/subscriptions/bill/new' },
        { title: 'Bulk Invoice', path: ROUTES.MASTER_ADMIN.BULK_INVOICE },
      ],
    },
    {
      title: 'System Settings',
      icon: Settings,
      submenu: [
        ...(SHOW_QUERIES_FINDER ? [{ title: 'Queries Finder', path: ROUTES.MASTER_ADMIN.QUERIES_FINDER }] : []),
        // { title: 'Custom Domain', path: '/master-admin/custom-domain' },
        { title: 'Role Permission', path: ROUTES.MASTER_ADMIN.ROLE_PERMISSION },
        { title: 'Communication Settings', path: ROUTES.MASTER_ADMIN.COMMUNICATION_SETTINGS },
        { title: 'Email Settings', path: ROUTES.MASTER_ADMIN.EMAIL_SETTINGS },
        { title: 'Payment Settings', path: ROUTES.MASTER_ADMIN.PAYMENT_SETTINGS },
        { title: 'Session Settings', path: ROUTES.MASTER_ADMIN.SESSION_SETTING },
        { title: 'Branch Attendance Config', path: ROUTES.MASTER_ADMIN.BRANCH_ATTENDANCE_CONFIG },
        { title: 'Master Data Settings', path: ROUTES.MASTER_ADMIN.MASTER_DATA_SETTINGS },
        { title: 'Export / Import', path: ROUTES.MASTER_ADMIN.EXPORT_IMPORT },
        { title: 'Module Health', path: ROUTES.MASTER_ADMIN.MODULE_HEALTH },
        { title: 'Branch Diagnostics', path: '/master-admin/school-owner-diagnostics' },
        { title: 'Demo Automation V2', path: '/master-admin/demo-automation-v2' },
        { title: 'Enterprise Health Monitor', path: ROUTES.MASTER_ADMIN.ENTERPRISE_HEALTH },
      ],
    },
    {
      title: 'Website Management',
      icon: Layout,
      submenu: [
        { title: 'General Settings', path: ROUTES.MASTER_ADMIN.SAAS_WEBSITE_SETTINGS },
        { title: 'Login Page Settings', path: ROUTES.MASTER_ADMIN.LOGIN_PAGE_SETTINGS },
        { title: 'File Type Settings', path: '/master-admin/system-settings/file-type' },
        { title: 'File Manager', path: ROUTES.MASTER_ADMIN.FILE_MANAGER },
      ]
    },
    {
      title: 'Front CMS',
      icon: Newspaper,
      submenu: [
        { title: 'Website Settings', path: '/master-admin/front-cms/settings' },
        { title: 'Login Page Settings', path: '/master-admin/front-cms/login-settings' },
        { title: 'Menus', path: '/master-admin/front-cms/menus' },
        { title: 'Pages', path: '/master-admin/front-cms/pages' },
        { title: 'Events', path: '/master-admin/front-cms/events' },
        { title: 'Gallery', path: '/master-admin/front-cms/gallery' },
        { title: 'News', path: '/master-admin/front-cms/news' },
        { title: 'Media Manager', path: '/master-admin/front-cms/media-manager' },
        { title: 'Achievements', path: '/master-admin/front-cms/achievements' },
        { title: 'Banner Images', path: '/master-admin/front-cms/banners' },
      ]
    }
  ],
  super_admin: [
    { title: 'Dashboard', icon: LayoutDashboard, path: ROUTES.SUPER_ADMIN.DASHBOARD },
    { title: 'Advanced Analytics', icon: BarChart3, path: ROUTES.SUPER_ADMIN.ADVANCED_ANALYTICS },
    // Cortex AI - Add-on subscription based access (NOT module permission)
    // Always visible in sidebar, access controlled within the module
    { title: '⚡ Cortex AI', icon: Bot, path: '/super-admin/cortex-ai', badge: 'AI', badgeColor: 'purple' },
    // JashSync - Brain-Connected Messenger (Separate Module)
    { title: '💬 JashSync', icon: MessageSquare, path: ROUTES.SUPER_ADMIN.JASHSYNC, badge: 'NEW', badgeColor: 'green' },
    {
      title: 'Front Office',
      icon: Building,
      submenu: [
        { title: 'Admission Enquiry', path: ROUTES.SUPER_ADMIN.ADMISSION_ENQUIRY },
        { title: 'Visitor Book', path: ROUTES.SUPER_ADMIN.VISITOR_BOOK },
        { title: 'Phone Call Log', path: ROUTES.SUPER_ADMIN.PHONE_CALL_LOG },
        { title: 'Postal Dispatch', path: ROUTES.SUPER_ADMIN.POSTAL_DISPATCH },
        { title: 'Postal Receive', path: ROUTES.SUPER_ADMIN.POSTAL_RECEIVE },
        { title: 'Complain', path: ROUTES.SUPER_ADMIN.COMPLAIN },
        { title: 'Setup Front Office', path: ROUTES.SUPER_ADMIN.SETUP_FRONT_OFFICE },
      ]
    },
    {
      title: 'Student Information',
      icon: Users,
      submenu: [
        { title: 'Student Admission', path: ROUTES.SUPER_ADMIN.STUDENT_ADMISSION },
        { title: 'Admission Form Settings', path: '/super-admin/student-information/admission-form-settings' },
        { title: 'Student Details', path: ROUTES.SUPER_ADMIN.STUDENT_DETAILS },
        { title: 'Online Admission', path: ROUTES.SUPER_ADMIN.ONLINE_ADMISSION_LIST },
        { title: 'Bulk Upload', path: ROUTES.SUPER_ADMIN.STUDENT_BULK_UPLOAD },
        { title: 'ID Card', path: ROUTES.SUPER_ADMIN.STUDENT_ID_CARD },
        { title: 'Disabled Students', path: ROUTES.SUPER_ADMIN.DISABLED_STUDENTS },
        { title: 'Disable Reason', path: ROUTES.SUPER_ADMIN.DISABLE_REASON },
        { title: 'Multi Class Student', path: ROUTES.SUPER_ADMIN.MULTI_CLASS_STUDENT },
        { title: 'Bulk Delete', path: ROUTES.SUPER_ADMIN.BULK_DELETE },
        { title: 'Student Analysis', path: ROUTES.SUPER_ADMIN.STUDENT_ANALYSIS },
      ],
    },
    {
      title: 'Behaviour Records',
      icon: AlertTriangle,
      submenu: [
        { title: 'Assign Incident', path: ROUTES.SUPER_ADMIN.ASSIGN_INCIDENT },
        { title: 'Incidents', path: ROUTES.SUPER_ADMIN.INCIDENTS },
        { title: 'Reports', path: ROUTES.SUPER_ADMIN.BEHAVIOUR_REPORTS },
        { title: 'Setting', path: ROUTES.SUPER_ADMIN.BEHAVIOUR_SETTING },
      ]
    },
    {
      title: 'Fees Collection',
      icon: CreditCard,
      submenu: [
        { title: 'Collect Fees', path: ROUTES.SUPER_ADMIN.COLLECT_FEES },
        { title: '📊 Fee Dashboard', path: '/super-admin/fees-collection/fee-dashboard', badge: 'NEW' },
        { title: 'Offline Bank Payments', path: ROUTES.SUPER_ADMIN.OFFLINE_PAYMENT },
        { title: 'Online Payment', path: ROUTES.SUPER_ADMIN.ONLINE_PAYMENT },
        { title: 'Search Fees Payment', path: ROUTES.SUPER_ADMIN.SEARCH_FEES_PAYMENT },
        { title: 'Search Due Fees', path: ROUTES.SUPER_ADMIN.SEARCH_DUE_FEES },
        { title: 'Fees Master', path: ROUTES.SUPER_ADMIN.FEES_MASTER },
        { title: 'Quick Fees', path: ROUTES.SUPER_ADMIN.QUICK_FEES },
        { title: 'Fees Group', path: ROUTES.SUPER_ADMIN.FEES_GROUP },
        { title: 'Fees Type', path: ROUTES.SUPER_ADMIN.FEES_TYPE },
        { title: 'Fees Discount', path: ROUTES.SUPER_ADMIN.FEES_DISCOUNT },
        { title: 'Fees Carry Forward', path: ROUTES.SUPER_ADMIN.FEES_CARRY_FORWARD },
        { title: 'Fees Reminder', path: ROUTES.SUPER_ADMIN.FEES_REMINDER },
        { title: 'Fees Analysis', path: ROUTES.SUPER_ADMIN.FEES_ANALYSIS },
        { title: 'Refund Approvals', path: ROUTES.SUPER_ADMIN.REFUND_APPROVALS },
        { title: '── Advanced Setup ──', path: '#', disabled: true },
        { title: '📋 Fee Templates', path: '/super-admin/fees-collection/fee-templates', badge: 'NEW' },
        { title: '👨‍👩‍👧 Sibling Groups', path: '/super-admin/fees-collection/sibling-groups', badge: 'NEW' },
        { title: '⏰ Late Fee Slabs', path: '/super-admin/fees-collection/late-fee-slabs', badge: 'NEW' },
        { title: '── Discount & EMI ──', path: '#', disabled: true },
        { title: '🎫 Concession Requests', path: '/super-admin/fees-collection/concession-requests', badge: 'NEW' },
        { title: '📅 Installment Plans', path: '/super-admin/fees-collection/installment-plans', badge: 'NEW' },
        { title: '💳 Payment Schedule', path: '/super-admin/fees-collection/payment-schedule', badge: 'NEW' },
        { title: '🗓️ Fee Calendar', path: '/super-admin/fees-collection/fee-calendar', badge: 'NEW' },
      ],
    },
    {
      title: 'Income',
      icon: IndianRupee,
      submenu: [
         { title: 'Income', path: ROUTES.SUPER_ADMIN.INCOME },
         { title: 'Add Income', path: ROUTES.SUPER_ADMIN.ADD_INCOME },
         { title: 'Income Head', path: ROUTES.SUPER_ADMIN.INCOME_HEAD },
      ]
    },
    {
      title: 'Expenses',
      icon: IndianRupee,
      submenu: [
         { title: 'Expense', path: ROUTES.SUPER_ADMIN.EXPENSE },
         { title: 'Add Expense', path: ROUTES.SUPER_ADMIN.ADD_EXPENSE },
         { title: 'Expense Head', path: ROUTES.SUPER_ADMIN.EXPENSE_HEAD },
      ]
    },
    {
      title: 'Attendance',
      icon: Calendar,
      submenu: [
        { title: 'Student Attendance', path: ROUTES.SUPER_ADMIN.STUDENT_ATTENDANCE },
        { title: 'Attendance By Date', path: ROUTES.SUPER_ADMIN.ATTENDANCE_BY_DATE },
        { title: 'Approve Leave', path: ROUTES.SUPER_ADMIN.APPROVE_LEAVE },
        { title: 'Staff Attendance', path: ROUTES.SUPER_ADMIN.STAFF_ATTENDANCE },
        { title: 'Attendance Report', path: ROUTES.SUPER_ADMIN.ATTENDANCE_REPORT },
        { title: '── Advanced ──', path: '#', disabled: true },
        { title: '📊 Live Dashboard', path: ROUTES.SUPER_ADMIN.LIVE_ATTENDANCE_DASHBOARD },
        { title: '📱 QR Code Generator', path: ROUTES.SUPER_ADMIN.QR_CODE_GENERATOR },
        { title: '🔌 Device Management', path: ROUTES.SUPER_ADMIN.DEVICE_MANAGEMENT },
        { title: '💳 Card Management', path: ROUTES.SUPER_ADMIN.CARD_MANAGEMENT },
        { title: '👤 Face Registration', path: ROUTES.SUPER_ADMIN.FACE_REGISTRATION },
        { title: '🤖 Live Face Attendance', path: ROUTES.SUPER_ADMIN.LIVE_FACE_ATTENDANCE },
        { title: '⌚ Wearable Devices', path: ROUTES.SUPER_ADMIN.WEARABLE_DEVICES },
        { title: '⚙️ Attendance Rules', path: ROUTES.SUPER_ADMIN.ATTENDANCE_RULES },
        { title: '📍 Geo-Fence Setup', path: ROUTES.SUPER_ADMIN.GEO_FENCE_SETUP },
        { title: '📈 Analytics', path: ROUTES.SUPER_ADMIN.ATTENDANCE_ANALYTICS },
      ],
    },
    {
      title: 'Examinations',
      icon: FileText,
      submenu: [
        { title: 'Board Configuration', path: ROUTES.SUPER_ADMIN.BOARD_CONFIGURATION },
        { title: 'Term Management', path: ROUTES.SUPER_ADMIN.TERM_MANAGEMENT },
        { title: 'Exam Type Master', path: ROUTES.SUPER_ADMIN.EXAM_TYPE_MASTER },
        { title: 'Grade Scale Builder', path: ROUTES.SUPER_ADMIN.GRADE_SCALE_BUILDER },
        { title: 'Exam Group Setup', path: ROUTES.SUPER_ADMIN.EXAM_GROUP_MANAGEMENT },
        { title: '---', path: '#', divider: true },
        { title: 'Exam Group', path: ROUTES.SUPER_ADMIN.EXAM_GROUP },
        { title: 'Exam List', path: ROUTES.SUPER_ADMIN.EXAM_LIST },
        { title: 'Exam Schedule', path: ROUTES.SUPER_ADMIN.EXAM_SCHEDULE },
        { title: 'Exam Result', path: ROUTES.SUPER_ADMIN.GENERAL_EXAM_RESULT },
        { title: 'Marks Entry', path: ROUTES.SUPER_ADMIN.MARKS_ENTRY },
        { title: 'Marks Grade', path: ROUTES.SUPER_ADMIN.MARKS_GRADE },
        { title: 'Marks Division', path: ROUTES.SUPER_ADMIN.MARKS_DIVISION },
        { title: 'Admit Card', path: ROUTES.SUPER_ADMIN.PRINT_ADMIT_CARD },
        { title: 'Marksheet', path: ROUTES.SUPER_ADMIN.PRINT_MARKSHEET },
        { title: 'Report Card', path: ROUTES.SUPER_ADMIN.REPORT_CARD },
        { title: 'Design Admit Card', path: ROUTES.SUPER_ADMIN.DESIGN_ADMIT_CARD },
        { title: 'Design Marksheet', path: ROUTES.SUPER_ADMIN.DESIGN_MARKSHEET },
      ],
    },
    {
      title: 'Online Examinations',
      icon: CheckSquare,
      submenu: [
        { title: 'CBSE Exam', path: ROUTES.SUPER_ADMIN.CBSE_EXAM },
        { title: 'CBSE Term', path: ROUTES.SUPER_ADMIN.CBSE_TERM },
        { title: 'CBSE Assessment', path: ROUTES.SUPER_ADMIN.CBSE_ASSESSMENT },
        { title: 'CBSE Observation', path: ROUTES.SUPER_ADMIN.CBSE_OBSERVATION },
        { title: 'Observation Param', path: ROUTES.SUPER_ADMIN.CBSE_OBSERVATION_PARAM },
        { title: 'CBSE Exam Grade', path: ROUTES.SUPER_ADMIN.CBSE_EXAM_GRADE },
        { title: 'CBSE Settings', path: ROUTES.SUPER_ADMIN.CBSE_SETTINGS },
        { title: 'CBSE Reports', path: ROUTES.SUPER_ADMIN.CBSE_REPORTS },
      ],
    },
    {
      title: 'Lesson Plan',
      icon: BookOpen,
      submenu: [
        { title: 'Add Homework', path: ROUTES.SUPER_ADMIN.ADD_HOMEWORK },
        { title: 'Homework List', path: ROUTES.SUPER_ADMIN.HOMEWORK },
        { title: 'Evaluate Homework', path: ROUTES.SUPER_ADMIN.EVALUATE_HOMEWORK },
        { title: 'Manage Lessons', path: ROUTES.SUPER_ADMIN.MANAGE_LESSONS },
        { title: 'Syllabus Status', path: ROUTES.SUPER_ADMIN.SYLLABUS_STATUS },
      ]
    },
    {
      title: 'Academics',
      icon: GraduationCap,
      submenu: [
        { title: 'Class', path: ROUTES.SUPER_ADMIN.CLASSES },
        { title: 'Sections', path: ROUTES.SUPER_ADMIN.SECTIONS },
        { title: 'Subjects', path: ROUTES.SUPER_ADMIN.SUBJECTS },
        { title: 'Subject Groups', path: ROUTES.SUPER_ADMIN.SUBJECT_GROUP },
        { title: 'Subject Teacher', path: ROUTES.SUPER_ADMIN.SUBJECT_TEACHER },
        { title: 'Class Teacher', path: ROUTES.SUPER_ADMIN.CLASS_TEACHER },
        { title: 'Assign Class Teacher', path: ROUTES.SUPER_ADMIN.ASSIGN_CLASS_TEACHER },
        { title: 'Class Timetable', path: ROUTES.SUPER_ADMIN.CLASS_TIMETABLE },
        { title: 'Teachers Timetable', path: ROUTES.SUPER_ADMIN.TEACHER_TIMETABLE },
        { title: 'Promote Students', path: ROUTES.SUPER_ADMIN.PROMOTE_STUDENT },
        { title: 'Academic Analysis', path: ROUTES.SUPER_ADMIN.ACADEMIC_ANALYSIS },
      ],
    },
     {
      title: 'Human Resource',
      icon: Briefcase,
      submenu: [
        { title: 'Staff Directory', path: ROUTES.SUPER_ADMIN.STAFF_DIRECTORY },
        { title: 'Add Staff', path: ROUTES.SUPER_ADMIN.ADD_EMPLOYEE },
        { title: 'Department', path: ROUTES.SUPER_ADMIN.DEPARTMENTS },
        { title: 'Designation', path: ROUTES.SUPER_ADMIN.DESIGNATIONS },
        { title: 'Payroll', path: ROUTES.SUPER_ADMIN.EMPLOYEE_PAYROLL },
        { title: 'Leave Management', path: ROUTES.SUPER_ADMIN.LEAVE_MANAGEMENT },
        { title: 'Approve Leave Request', path: ROUTES.SUPER_ADMIN.APPROVE_STAFF_LEAVE },
        { title: 'Apply Leave', path: ROUTES.SUPER_ADMIN.STAFF_APPLY_LEAVE },
        { title: 'Leave Type', path: ROUTES.SUPER_ADMIN.STAFF_LEAVE_TYPE },
        { title: 'Employee Form Settings', path: ROUTES.SUPER_ADMIN.EMPLOYEE_FORM_SETTINGS },
        { title: 'Performance', path: ROUTES.SUPER_ADMIN.EMPLOYEE_PERFORMANCE },
        { title: 'Documents', path: ROUTES.SUPER_ADMIN.EMPLOYEE_DOCUMENTS },
        { title: 'Staff ID Card', path: ROUTES.SUPER_ADMIN.HR_STAFF_ID_CARD },
      ],
    },
    {
      title: 'Task Management',
      icon: CheckSquare,
      submenu: [
        { title: 'Dashboard', path: '/super-admin/task-management/dashboard' },
        { title: 'All Tasks', path: '/super-admin/task-management/tasks' },
        { title: 'My Tasks', path: '/super-admin/task-management/my-tasks' },
        { title: 'Create Task', path: '/super-admin/task-management/tasks/create' },
        { title: 'Categories', path: '/super-admin/task-management/categories' },
        { title: 'Priorities', path: '/super-admin/task-management/priorities' },
      ],
    },
     {
      title: 'Communicate',
      icon: MessageSquare,
      submenu: [
        { title: 'Notice Board', path: ROUTES.SUPER_ADMIN.NOTICE_BOARD },
        { title: 'Send Email', path: ROUTES.SUPER_ADMIN.SEND_EMAIL },
        { title: 'Send SMS', path: ROUTES.SUPER_ADMIN.SEND_SMS },
        { title: 'WhatsApp', path: ROUTES.SUPER_ADMIN.WHATSAPP },
        { title: 'Push Notification', path: ROUTES.SUPER_ADMIN.PUSH_NOTIFICATION },
        { title: 'Email / SMS Log', path: ROUTES.SUPER_ADMIN.EMAIL_SMS_LOG },
      ],
    },
    {
      title: 'Online Course',
      icon: MonitorPlay,
      submenu: [
        { title: 'Online Course', path: ROUTES.SUPER_ADMIN.ONLINE_COURSE },
        { title: 'Offline Payment', path: ROUTES.SUPER_ADMIN.OFFLINE_PAYMENT },
        { title: 'Online Course Report', path: ROUTES.SUPER_ADMIN.ONLINE_COURSE_REPORT },
        { title: 'Setting', path: ROUTES.SUPER_ADMIN.ONLINE_COURSE_SETTING },
      ]
    },
    {
      title: 'Gmeet Live Classes',
      icon: Video,
      submenu: [
        { title: 'Live Classes', path: ROUTES.SUPER_ADMIN.LIVE_CLASSES },
        { title: 'Live Meeting', path: ROUTES.SUPER_ADMIN.LIVE_MEETING },
        { title: 'Live Classes Report', path: ROUTES.SUPER_ADMIN.LIVE_CLASSES_REPORT },
        { title: 'Live Meeting Report', path: ROUTES.SUPER_ADMIN.LIVE_MEETING_REPORT },
        { title: 'Setting', path: ROUTES.SUPER_ADMIN.GMEET_SETTING },
      ]
    },
    {
      title: 'Library',
      icon: Library,
      submenu: [
        { title: 'Book List', path: ROUTES.SUPER_ADMIN.LIBRARY_BOOK_LIST },
        { title: 'Add Book', path: ROUTES.SUPER_ADMIN.LIBRARY_ADD_BOOK },
        { title: 'Books', path: ROUTES.SUPER_ADMIN.LIBRARY_BOOKS },
        { title: 'Book Issued', path: ROUTES.SUPER_ADMIN.LIBRARY_BOOK_ISSUED },
        { title: 'Book Members', path: ROUTES.SUPER_ADMIN.LIBRARY_MEMBERS },
        { title: 'Issue/Return', path: ROUTES.SUPER_ADMIN.LIBRARY_ISSUE_RETURN },
        { title: 'Library Card', path: ROUTES.SUPER_ADMIN.LIBRARY_CARD },
      ],
    },
    {
      title: 'Inventory',
      icon: Package,
      submenu: [
        { title: 'Issue Item', path: ROUTES.SUPER_ADMIN.INV_ISSUE_ITEM },
        { title: 'Add Item Stock', path: ROUTES.SUPER_ADMIN.INV_ADD_STOCK },
        { title: 'Item Stock', path: ROUTES.SUPER_ADMIN.INV_ITEM_STOCK },
        { title: 'Add Item', path: ROUTES.SUPER_ADMIN.INV_ADD_ITEM },
        { title: 'Item Category', path: ROUTES.SUPER_ADMIN.INV_CATEGORY },
        { title: 'Item Store', path: ROUTES.SUPER_ADMIN.INV_STORE },
        { title: 'Item Supplier', path: ROUTES.SUPER_ADMIN.INV_SUPPLIER },
      ],
    },
    {
      title: 'Transport',
      icon: Bus,
      submenu: [
        { title: 'Fees Master', path: ROUTES.SUPER_ADMIN.TRANSPORT_FEES_MASTER },
        { title: 'Pickup Points', path: ROUTES.SUPER_ADMIN.PICKUP_POINTS },
        { title: 'Routes', path: ROUTES.SUPER_ADMIN.TRANSPORT_ROUTES },
        { title: 'Vehicles', path: ROUTES.SUPER_ADMIN.TRANSPORT_VEHICLES },
        { title: 'Assign Vehicle', path: ROUTES.SUPER_ADMIN.ASSIGN_VEHICLE },
        { title: 'Route Pickup Points', path: ROUTES.SUPER_ADMIN.ROUTE_PICKUP_POINT },
        { title: 'Student Transport Fees', path: ROUTES.SUPER_ADMIN.STUDENT_TRANSPORT_FEES },
        { title: 'Transport Analysis', path: ROUTES.SUPER_ADMIN.TRANSPORT_ANALYSIS },
      ],
    },
    {
      title: 'Hostel',
      icon: Building,
      submenu: [
        { title: 'Hostel Rooms', path: ROUTES.SUPER_ADMIN.HOSTEL_ROOMS },
        { title: 'Room Type', path: ROUTES.SUPER_ADMIN.ROOM_TYPES },
        { title: 'Hostel', path: ROUTES.SUPER_ADMIN.HOSTELS },
        { title: 'Hostel Fee', path: ROUTES.SUPER_ADMIN.HOSTEL_FEE },
        { title: 'Hostel Analysis', path: ROUTES.SUPER_ADMIN.HOSTEL_ANALYSIS },
      ],
    },
    {
      title: 'Certificate',
      icon: Award,
      submenu: [
        { title: 'Student Certificate', path: ROUTES.SUPER_ADMIN.CERT_STUDENT },
        { title: 'Generate Certificate', path: ROUTES.SUPER_ADMIN.CERT_GENERATE },
        { title: 'Student ID Card', path: ROUTES.SUPER_ADMIN.CERT_STUDENT_ID },
        { title: 'Generate ID Card', path: ROUTES.SUPER_ADMIN.CERT_GENERATE_ID },
        { title: 'Staff ID Card', path: ROUTES.SUPER_ADMIN.CERT_STAFF_ID },
        { title: 'Generate Staff ID Card', path: ROUTES.SUPER_ADMIN.CERT_GENERATE_STAFF_ID },
      ]
    },
    {
      title: 'Front CMS',
      icon: Layout,
      submenu: [
        { title: 'Website Settings', path: ROUTES.SUPER_ADMIN.CMS_SETTING },
        { title: 'Branch Login Settings', path: '/super-admin/front-cms/login-settings' },
        { title: 'Menus', path: ROUTES.SUPER_ADMIN.MENUS },
        { title: 'Pages', path: ROUTES.SUPER_ADMIN.PAGES },
        { title: 'Events', path: ROUTES.SUPER_ADMIN.EVENTS },
        { title: 'Gallery', path: ROUTES.SUPER_ADMIN.GALLERY },
        { title: 'News', path: ROUTES.SUPER_ADMIN.NEWS },
        { title: 'Media Manager', path: ROUTES.SUPER_ADMIN.MEDIA_MANAGER },
        { title: 'Achievements', path: '/super-admin/front-cms/achievements' },
        { title: 'Banner Images', path: ROUTES.SUPER_ADMIN.BANNER_IMAGES },
      ]
    },
    {
      title: 'Alumni',
      icon: GraduationCap,
      submenu: [
        { title: 'Alumni List', path: ROUTES.SUPER_ADMIN.ALUMNI_LIST },
        { title: 'Alumni Events', path: ROUTES.SUPER_ADMIN.ALUMNI_EVENTS },
      ]
    },
    {
      title: 'QR Code Attendance',
      icon: QrCode,
      submenu: [
        { title: 'Setting', path: ROUTES.SUPER_ADMIN.QR_ATTENDANCE_SETTING },
        { title: 'Scan', path: ROUTES.SUPER_ADMIN.QR_ATTENDANCE_SCAN },
      ]
    },
    {
      title: 'Multi Branch',
      icon: GitBranch,
      submenu: [
        { title: 'Branch Overview', path: ROUTES.SUPER_ADMIN.MULTI_BRANCH_OVERVIEW },
        { title: 'Branch List', path: ROUTES.SUPER_ADMIN.BRANCH_LIST },
        { title: 'Add Branch', path: ROUTES.SUPER_ADMIN.ADD_BRANCH },
        { title: 'Branch Settings', path: '/super-admin/multi-branch/settings' },
        { title: 'Branch Reports', path: '/super-admin/multi-branch/reports' },
      ]
    },
    {
      title: 'Zoom Live Classes',
      icon: Video,
      submenu: [
        { title: 'Zoom Classes', path: ROUTES.SUPER_ADMIN.ZOOM_CLASSES },
        { title: 'Zoom Meeting', path: ROUTES.SUPER_ADMIN.ZOOM_MEETING },
        { title: 'Zoom Reports', path: ROUTES.SUPER_ADMIN.ZOOM_REPORTS },
        { title: 'Zoom Settings', path: ROUTES.SUPER_ADMIN.ZOOM_SETTINGS },
      ]
    },
    {
      title: 'Download Center',
      icon: Download,
      path: ROUTES.SUPER_ADMIN.DOWNLOAD_CENTER,
    },
     {
      title: 'Reports',
      icon: FileText,
      submenu: [
          { title: 'Dashboard', path: '/super-admin/reports/dashboard' },
          { title: 'Scheduled Reports', path: '/super-admin/reports/schedules' },
          { title: 'Report History', path: '/super-admin/reports/history' },
          { title: 'Student Information', path: '/super-admin/reports/student-information' },
          { title: 'Finance', path: '/super-admin/reports/finance' },
          { title: 'Attendance', path: '/super-admin/reports/attendance' },
          { title: 'Examinations', path: '/super-admin/reports/examinations' },
          { title: 'Human Resource', path: '/super-admin/reports/hr' },
          { title: 'Library', path: '/super-admin/reports/library' },
          { title: 'Transport', path: '/super-admin/reports/transport' },
          { title: 'Hostel', path: '/super-admin/reports/hostel' },
          { title: 'Fees Reports', path: '/super-admin/reports/fees' },
          { title: 'Homework', path: '/super-admin/reports/homework' },
          { title: 'Homework Evaluation', path: '/super-admin/reports/homework-evaluation' },
          { title: 'Online Exam Reports', path: '/super-admin/reports/online-exam' },
          { title: 'Custom Builder', path: '/super-admin/reports/custom-builder' },
      ]
    },
    {
      title: 'User Management',
      icon: KeyRound,
      badge: 'NEW',
      submenu: [
        { title: 'Dashboard', path: '/super-admin/user-management/dashboard' },
        { title: 'All Users', path: '/super-admin/user-management/all-users' },
        { title: 'Student Users', path: '/super-admin/user-management/students' },
        { title: 'Staff Users', path: '/super-admin/user-management/staff' },
        { title: 'Parent Users', path: '/super-admin/user-management/parents' },
        { title: 'Transfer Staff', path: '/super-admin/user-management/transfer-staff' },
      ]
    },
    {
      title: 'System Settings',
      icon: Settings,
      submenu: [
        { title: 'General Setting', path: ROUTES.SUPER_ADMIN.SETTINGS_GENERAL },
        { title: 'Session Setting', path: ROUTES.SUPER_ADMIN.SETTINGS_SESSION },
        { title: 'Roles Permissions', path: ROUTES.SUPER_ADMIN.SETTINGS_ROLE_PERMISSION },
        { title: 'Print Header Footer', path: ROUTES.SUPER_ADMIN.SETTINGS_PRINT_HEADER },
        { title: 'Email Setting', path: ROUTES.SUPER_ADMIN.SETTINGS_EMAIL },
        { title: 'SMS Setting', path: ROUTES.SUPER_ADMIN.SETTINGS_SMS },
        { title: 'Notification Setting', path: ROUTES.SUPER_ADMIN.SETTINGS_NOTIFICATION },
        { title: 'Payment Gateway', path: ROUTES.SUPER_ADMIN.SETTINGS_PAYMENT_GATEWAY },
        { title: 'Backup & Restore', path: ROUTES.SUPER_ADMIN.SETTINGS_BACKUP },
      ],
    },
  ],
  // Student Dashboard - Complete Student Portal
  student: [
    { title: 'Dashboard', icon: LayoutDashboard, path: ROUTES.STUDENT.DASHBOARD },
    { title: 'My Profile', icon: Users, path: ROUTES.STUDENT.PROFILE },
    {
      title: 'Fees',
      icon: CreditCard,
      submenu: [
        { title: 'My Fees', path: ROUTES.STUDENT.FEES },
        { title: 'Payment History', path: ROUTES.STUDENT.FEES },
      ]
    },
    { title: 'Class Timetable', icon: Calendar, path: ROUTES.STUDENT.TIMETABLE },
    {
      title: 'Academics',
      icon: BookOpen,
      submenu: [
        { title: 'Homework', path: ROUTES.STUDENT.HOMEWORK },
        { title: 'Syllabus', path: '/Student/syllabus' },
      ]
    },
    {
      title: 'Examinations',
      icon: FileText,
      submenu: [
        { title: 'Exam Schedule', path: ROUTES.STUDENT.EXAM_SCHEDULE },
        { title: 'Exam Result', path: ROUTES.STUDENT.EXAM_RESULT },
      ]
    },
    {
      title: 'Attendance',
      icon: CheckSquare,
      submenu: [
        { title: 'My Attendance', path: ROUTES.STUDENT.ATTENDANCE },
        { title: 'Apply Leave', path: ROUTES.STUDENT.APPLY_LEAVE },
      ]
    },
    { title: 'Library', icon: Library, path: ROUTES.STUDENT.LIBRARY },
    { title: 'Transport', icon: Bus, path: ROUTES.STUDENT.TRANSPORT_ROUTES },
    { title: 'Hostel', icon: Building, path: ROUTES.STUDENT.HOSTEL_ROOMS },
    { title: 'Notice Board', icon: MessageSquare, path: ROUTES.SUPER_ADMIN.NOTICE_BOARD },
  ],
  // Admin uses same sidebar as super_admin
  admin: null, // Will fallback to super_admin in Sidebar.jsx
  
  // Principal Dashboard - School Head with full overview
  principal: [
    { title: 'Dashboard', icon: LayoutDashboard, path: ROUTES.PRINCIPAL.DASHBOARD },
    {
      title: 'Student Information',
      icon: Users,
      submenu: [
        { title: 'Student Details', path: ROUTES.PRINCIPAL.STUDENT_DETAILS },
        { title: 'Student Admission', path: ROUTES.PRINCIPAL.STUDENT_ADMISSION },
        { title: 'Online Admission', path: ROUTES.PRINCIPAL.ONLINE_ADMISSION_LIST },
        { title: 'Disabled Students', path: ROUTES.PRINCIPAL.DISABLED_STUDENTS },
      ]
    },
    {
      title: 'Human Resource',
      icon: Briefcase,
      submenu: [
        { title: 'Staff Directory', path: ROUTES.PRINCIPAL.STAFF_DIRECTORY },
        { title: 'Department', path: ROUTES.PRINCIPAL.DEPARTMENTS },
        { title: 'Designation', path: ROUTES.PRINCIPAL.DESIGNATIONS },
        { title: 'Leave Management', path: ROUTES.PRINCIPAL.LEAVE_MANAGEMENT },
        { title: 'Approve Leave Request', path: ROUTES.PRINCIPAL.APPROVE_STAFF_LEAVE },
      ]
    },
    {
      title: 'Attendance',
      icon: Calendar,
      submenu: [
        { title: 'Student Attendance', path: ROUTES.PRINCIPAL.STUDENT_ATTENDANCE },
        { title: 'Staff Attendance', path: ROUTES.PRINCIPAL.STAFF_ATTENDANCE },
        { title: 'Approve Leave', path: ROUTES.PRINCIPAL.APPROVE_LEAVE },
        { title: 'Attendance Report', path: ROUTES.PRINCIPAL.ATTENDANCE_REPORT },
      ]
    },
    {
      title: 'Academics',
      icon: GraduationCap,
      submenu: [
        { title: 'Class', path: ROUTES.PRINCIPAL.CLASSES },
        { title: 'Sections', path: ROUTES.PRINCIPAL.SECTIONS },
        { title: 'Class Timetable', path: ROUTES.PRINCIPAL.CLASS_TIMETABLE },
        { title: 'Teacher Timetable', path: ROUTES.PRINCIPAL.TEACHER_TIMETABLE },
        { title: 'Assign Class Teacher', path: ROUTES.PRINCIPAL.ASSIGN_CLASS_TEACHER },
        { title: 'Subject Teacher', path: ROUTES.PRINCIPAL.SUBJECT_TEACHER },
      ]
    },
    {
      title: 'Examinations',
      icon: FileText,
      submenu: [
        { title: 'Exam Group', path: ROUTES.PRINCIPAL.EXAM_GROUP },
        { title: 'Exam Schedule', path: ROUTES.PRINCIPAL.EXAM_SCHEDULE },
        { title: 'Exam Result', path: ROUTES.PRINCIPAL.GENERAL_EXAM_RESULT },
        { title: 'Marks Entry', path: ROUTES.PRINCIPAL.MARKS_ENTRY },
        { title: 'Report Card', path: ROUTES.PRINCIPAL.REPORT_CARD },
      ]
    },
    {
      title: 'Behaviour Records',
      icon: AlertTriangle,
      submenu: [
        { title: 'Assign Incident', path: ROUTES.PRINCIPAL.ASSIGN_INCIDENT },
        { title: 'Incidents', path: ROUTES.PRINCIPAL.INCIDENTS },
        { title: 'Reports', path: ROUTES.PRINCIPAL.BEHAVIOUR_REPORTS },
      ]
    },
    {
      title: 'Communicate',
      icon: MessageSquare,
      submenu: [
        { title: 'Notice Board', path: ROUTES.PRINCIPAL.NOTICE_BOARD },
        { title: 'Send Email', path: ROUTES.PRINCIPAL.SEND_EMAIL },
        { title: 'Send SMS', path: ROUTES.PRINCIPAL.SEND_SMS },
      ]
    },
    {
      title: 'Fees Collection',
      icon: CreditCard,
      submenu: [
        { title: 'Search Fees Payment', path: ROUTES.PRINCIPAL.SEARCH_FEES_PAYMENT },
        { title: 'Search Due Fees', path: ROUTES.PRINCIPAL.SEARCH_DUE_FEES },
        { title: 'Fees Reminder', path: ROUTES.PRINCIPAL.FEES_REMINDER },
      ]
    },
    {
      title: 'Reports',
      icon: BarChart3,
      submenu: [
        { title: 'Student Information', path: ROUTES.PRINCIPAL.REPORT_STUDENT_INFO },
        { title: 'Attendance', path: ROUTES.PRINCIPAL.ATTENDANCE_REPORT },
        { title: 'Examinations', path: ROUTES.PRINCIPAL.CBSE_REPORTS },
        { title: 'Human Resource', path: ROUTES.PRINCIPAL.REPORT_PAYROLL },
      ]
    },
  ],
  
  // Accountant Dashboard - Financial Management
  accountant: [
    { title: 'Dashboard', icon: LayoutDashboard, path: ROUTES.ACCOUNTANT.DASHBOARD },
    {
      title: 'Fees Collection',
      icon: CreditCard,
      submenu: [
        { title: 'Collect Fees', path: ROUTES.ACCOUNTANT.COLLECT_FEES },
        { title: '📊 Fee Dashboard', path: '/accountant/fees-collection/fee-dashboard', badge: 'NEW' },
        { title: 'Offline Bank Payments', path: ROUTES.ACCOUNTANT.OFFLINE_PAYMENT },
        { title: 'Online Payment', path: ROUTES.ACCOUNTANT.ONLINE_PAYMENT },
        { title: 'Search Fees Payment', path: ROUTES.ACCOUNTANT.SEARCH_FEES_PAYMENT },
        { title: 'Search Due Fees', path: ROUTES.ACCOUNTANT.SEARCH_DUE_FEES },
        { title: 'Fees Master', path: ROUTES.ACCOUNTANT.FEES_MASTER },
        { title: 'Fees Group', path: ROUTES.ACCOUNTANT.FEES_GROUP },
        { title: 'Fees Type', path: ROUTES.ACCOUNTANT.FEES_TYPE },
        { title: 'Fees Discount', path: ROUTES.ACCOUNTANT.FEES_DISCOUNT },
        { title: 'Fees Reminder', path: ROUTES.ACCOUNTANT.FEES_REMINDER },
        { title: '── Advanced Setup ──', path: '#', disabled: true },
        { title: '📋 Fee Templates', path: '/accountant/fees-collection/fee-templates', badge: 'NEW' },
        { title: '👨‍👩‍👧 Sibling Groups', path: '/accountant/fees-collection/sibling-groups', badge: 'NEW' },
        { title: '⏰ Late Fee Slabs', path: '/accountant/fees-collection/late-fee-slabs', badge: 'NEW' },
        { title: '── Discount & EMI ──', path: '#', disabled: true },
        { title: '🎫 Concession Requests', path: '/accountant/fees-collection/concession-requests', badge: 'NEW' },
        { title: '📅 Installment Plans', path: '/accountant/fees-collection/installment-plans', badge: 'NEW' },
        { title: '💳 Payment Schedule', path: '/accountant/fees-collection/payment-schedule', badge: 'NEW' },
        { title: '🗓️ Fee Calendar', path: '/accountant/fees-collection/fee-calendar', badge: 'NEW' },
      ]
    },
    {
      title: 'Income',
      icon: IndianRupee,
      submenu: [
        { title: 'Income', path: ROUTES.ACCOUNTANT.INCOME },
        { title: 'Add Income', path: ROUTES.ACCOUNTANT.ADD_INCOME },
        { title: 'Income Head', path: ROUTES.ACCOUNTANT.INCOME_HEAD },
      ]
    },
    {
      title: 'Expenses',
      icon: IndianRupee,
      submenu: [
        { title: 'Expense', path: ROUTES.ACCOUNTANT.EXPENSE },
        { title: 'Add Expense', path: ROUTES.ACCOUNTANT.ADD_EXPENSE },
        { title: 'Expense Head', path: ROUTES.ACCOUNTANT.EXPENSE_HEAD },
      ]
    },
    { title: 'Student Details', icon: Users, path: ROUTES.ACCOUNTANT.STUDENT_DETAILS },
    { title: 'Payroll', icon: Briefcase, path: ROUTES.ACCOUNTANT.EMPLOYEE_PAYROLL },
    {
      title: 'Reports',
      icon: FileText,
      submenu: [
        { title: 'Income Report', path: ROUTES.ACCOUNTANT.REPORT_INCOME },
        { title: 'Expense Report', path: ROUTES.ACCOUNTANT.REPORT_EXPENSE },
        { title: 'Income/Expense Balance', path: ROUTES.ACCOUNTANT.REPORT_INC_EXP_BALANCE },
        { title: 'Daily Collection', path: ROUTES.ACCOUNTANT.REPORT_DAILY_COLLECTION },
        { title: 'Fees Collection', path: ROUTES.ACCOUNTANT.REPORT_FEES_COLLECTION },
        { title: 'Fees Statement', path: ROUTES.ACCOUNTANT.REPORT_FEES_STATEMENT },
        { title: 'Balance Fees', path: ROUTES.ACCOUNTANT.REPORT_BALANCE_FEES },
        { title: 'Payroll Report', path: ROUTES.ACCOUNTANT.REPORT_PAYROLL },
      ]
    },
  ],
  
  // Receptionist Dashboard - Front Office Management
  receptionist: [
    { title: 'Dashboard', icon: LayoutDashboard, path: ROUTES.RECEPTIONIST.DASHBOARD },
    {
      title: 'Front Office',
      icon: Building,
      submenu: [
        { title: 'Admission Enquiry', path: ROUTES.RECEPTIONIST.ADMISSION_ENQUIRY },
        { title: 'Visitor Book', path: ROUTES.RECEPTIONIST.VISITOR_BOOK },
        { title: 'Phone Call Log', path: ROUTES.RECEPTIONIST.PHONE_CALL_LOG },
        { title: 'Postal Dispatch', path: ROUTES.RECEPTIONIST.POSTAL_DISPATCH },
        { title: 'Postal Receive', path: ROUTES.RECEPTIONIST.POSTAL_RECEIVE },
        { title: 'Complain', path: ROUTES.RECEPTIONIST.COMPLAIN },
        { title: 'Setup Front Office', path: ROUTES.RECEPTIONIST.SETUP_FRONT_OFFICE },
      ]
    },
    {
      title: 'Student Information',
      icon: Users,
      submenu: [
        { title: 'Student Details', path: ROUTES.RECEPTIONIST.STUDENT_DETAILS },
        { title: 'Student Admission', path: ROUTES.RECEPTIONIST.STUDENT_ADMISSION },
        { title: 'Online Admission', path: ROUTES.RECEPTIONIST.ONLINE_ADMISSION_LIST },
      ]
    },
    {
      title: 'Communicate',
      icon: MessageSquare,
      submenu: [
        { title: 'Notice Board', path: ROUTES.RECEPTIONIST.NOTICE_BOARD },
        { title: 'Send SMS', path: ROUTES.RECEPTIONIST.SEND_SMS },
      ]
    },
  ],
  
  // Teacher Dashboard - Teaching & Class Management
  teacher: [
    { title: 'Dashboard', icon: LayoutDashboard, path: ROUTES.TEACHER.DASHBOARD },
    { title: 'My Timetable', icon: Calendar, path: ROUTES.TEACHER.TEACHER_TIMETABLE },
    {
      title: 'Students',
      icon: Users,
      submenu: [
        { title: 'Student Details', path: ROUTES.TEACHER.STUDENT_DETAILS },
      ]
    },
    {
      title: 'Attendance',
      icon: CheckSquare,
      submenu: [
        { title: 'Student Attendance', path: ROUTES.TEACHER.STUDENT_ATTENDANCE },
        { title: 'Attendance By Date', path: ROUTES.TEACHER.ATTENDANCE_BY_DATE },
      ]
    },
    {
      title: 'Lesson Plan',
      icon: BookOpen,
      submenu: [
        { title: 'Add Homework', path: ROUTES.TEACHER.ADD_HOMEWORK },
        { title: 'Homework List', path: ROUTES.TEACHER.HOMEWORK },
        { title: 'Evaluate Homework', path: ROUTES.TEACHER.EVALUATE_HOMEWORK },
        { title: 'Manage Lessons', path: ROUTES.TEACHER.MANAGE_LESSONS },
        { title: 'Syllabus Status', path: ROUTES.TEACHER.SYLLABUS_STATUS },
      ]
    },
    {
      title: 'Examinations',
      icon: GraduationCap,
      submenu: [
        { title: 'Exam Schedule', path: ROUTES.TEACHER.EXAM_SCHEDULE },
        { title: 'Marks Entry', path: ROUTES.TEACHER.MARKS_ENTRY },
        { title: 'Exam Result', path: ROUTES.TEACHER.GENERAL_EXAM_RESULT },
      ]
    },
    {
      title: 'Behaviour Records',
      icon: AlertTriangle,
      submenu: [
        { title: 'Assign Incident', path: ROUTES.TEACHER.ASSIGN_INCIDENT },
        { title: 'Incidents', path: ROUTES.TEACHER.INCIDENTS },
      ]
    },
    {
      title: 'Live Classes',
      icon: Video,
      submenu: [
        { title: 'Live Classes', path: ROUTES.TEACHER.LIVE_CLASSES },
        { title: 'Live Meeting', path: ROUTES.TEACHER.LIVE_MEETING },
      ]
    },
    { title: 'Online Course', icon: MonitorPlay, path: ROUTES.TEACHER.ONLINE_COURSE },
    { title: 'Notice Board', icon: MessageSquare, path: ROUTES.TEACHER.NOTICE_BOARD },
    {
      title: 'Leave',
      icon: Calendar,
      submenu: [
        { title: 'Apply Leave', path: ROUTES.TEACHER.STAFF_APPLY_LEAVE },
        { title: 'Leave Management', path: ROUTES.TEACHER.LEAVE_MANAGEMENT },
      ]
    },
    // JashSync - Brain-Connected Messenger
    { title: '💬 JashSync', icon: MessageSquare, path: ROUTES.SUPER_ADMIN.JASHSYNC, badge: 'NEW', badgeColor: 'green' },
    { title: 'My Profile', icon: Users, path: ROUTES.TEACHER.PROFILE },
  ],
  
  // Librarian Dashboard
  librarian: [
    { title: 'Dashboard', icon: LayoutDashboard, path: ROUTES.LIBRARIAN.DASHBOARD },
    {
      title: 'Library',
      icon: Library,
      submenu: [
        { title: 'Book List', path: ROUTES.LIBRARIAN.LIBRARY_BOOK_LIST },
        { title: 'Issue/Return', path: ROUTES.LIBRARIAN.LIBRARY_ISSUE_RETURN },
        { title: 'Add Book', path: ROUTES.LIBRARIAN.LIBRARY_ADD_BOOK },
        { title: 'Book Issued', path: ROUTES.LIBRARIAN.LIBRARY_BOOK_ISSUED },
        { title: 'Library Members', path: ROUTES.LIBRARIAN.LIBRARY_MEMBERS },
        { title: 'Library Card', path: ROUTES.LIBRARIAN.LIBRARY_CARD },
      ]
    },
    {
      title: 'Reports',
      icon: FileText,
      submenu: [
        { title: 'Book Issue Report', path: ROUTES.LIBRARIAN.REPORT_LIB_BOOK_ISSUE },
      ]
    },
  ],
  
  // ═══════════════════════════════════════════════════════════════════
  // VICE PRINCIPAL - Deputy Head with oversight
  // ═══════════════════════════════════════════════════════════════════
  vice_principal: [
    { title: 'Dashboard', icon: LayoutDashboard, path: ROUTES.VICE_PRINCIPAL.DASHBOARD },
    {
      title: 'Student Information',
      icon: Users,
      submenu: [
        { title: 'Student Details', path: ROUTES.VICE_PRINCIPAL.STUDENT_DETAILS },
        { title: 'Student Admission', path: ROUTES.VICE_PRINCIPAL.STUDENT_ADMISSION },
        { title: 'Disabled Students', path: ROUTES.VICE_PRINCIPAL.DISABLED_STUDENTS },
      ]
    },
    {
      title: 'Human Resource',
      icon: Briefcase,
      submenu: [
        { title: 'Staff Directory', path: ROUTES.VICE_PRINCIPAL.STAFF_DIRECTORY },
        { title: 'Department', path: ROUTES.VICE_PRINCIPAL.DEPARTMENTS },
        { title: 'Approve Leave Request', path: ROUTES.VICE_PRINCIPAL.APPROVE_STAFF_LEAVE },
      ]
    },
    {
      title: 'Attendance',
      icon: Calendar,
      submenu: [
        { title: 'Student Attendance', path: ROUTES.VICE_PRINCIPAL.STUDENT_ATTENDANCE },
        { title: 'Staff Attendance', path: ROUTES.VICE_PRINCIPAL.STAFF_ATTENDANCE },
        { title: 'Approve Leave', path: ROUTES.VICE_PRINCIPAL.APPROVE_LEAVE },
        { title: 'Attendance Report', path: ROUTES.VICE_PRINCIPAL.ATTENDANCE_REPORT },
      ]
    },
    {
      title: 'Academics',
      icon: GraduationCap,
      submenu: [
        { title: 'Class', path: ROUTES.VICE_PRINCIPAL.CLASSES },
        { title: 'Sections', path: ROUTES.VICE_PRINCIPAL.SECTIONS },
        { title: 'Class Timetable', path: ROUTES.VICE_PRINCIPAL.CLASS_TIMETABLE },
        { title: 'Teacher Timetable', path: ROUTES.VICE_PRINCIPAL.TEACHER_TIMETABLE },
        { title: 'Assign Class Teacher', path: ROUTES.VICE_PRINCIPAL.ASSIGN_CLASS_TEACHER },
      ]
    },
    {
      title: 'Examinations',
      icon: FileText,
      submenu: [
        { title: 'Exam Group', path: ROUTES.VICE_PRINCIPAL.EXAM_GROUP },
        { title: 'Exam Schedule', path: ROUTES.VICE_PRINCIPAL.EXAM_SCHEDULE },
        { title: 'Exam Result', path: ROUTES.VICE_PRINCIPAL.GENERAL_EXAM_RESULT },
        { title: 'Marks Entry', path: ROUTES.VICE_PRINCIPAL.MARKS_ENTRY },
        { title: 'Report Card', path: ROUTES.VICE_PRINCIPAL.REPORT_CARD },
      ]
    },
    {
      title: 'Behaviour Records',
      icon: AlertTriangle,
      submenu: [
        { title: 'Assign Incident', path: ROUTES.VICE_PRINCIPAL.ASSIGN_INCIDENT },
        { title: 'Incidents', path: ROUTES.VICE_PRINCIPAL.INCIDENTS },
        { title: 'Reports', path: ROUTES.VICE_PRINCIPAL.BEHAVIOUR_REPORTS },
      ]
    },
    {
      title: 'Communicate',
      icon: MessageSquare,
      submenu: [
        { title: 'Notice Board', path: ROUTES.VICE_PRINCIPAL.NOTICE_BOARD },
        { title: 'Send Email', path: ROUTES.VICE_PRINCIPAL.SEND_EMAIL },
        { title: 'Send SMS', path: ROUTES.VICE_PRINCIPAL.SEND_SMS },
      ]
    },
    {
      title: 'Fees (View)',
      icon: CreditCard,
      submenu: [
        { title: 'Search Fees Payment', path: ROUTES.VICE_PRINCIPAL.SEARCH_FEES_PAYMENT },
        { title: 'Search Due Fees', path: ROUTES.VICE_PRINCIPAL.SEARCH_DUE_FEES },
      ]
    },
    {
      title: 'Reports',
      icon: BarChart3,
      submenu: [
        { title: 'Student Information', path: ROUTES.VICE_PRINCIPAL.REPORT_STUDENT_INFO },
        { title: 'Attendance', path: ROUTES.VICE_PRINCIPAL.ATTENDANCE_REPORT },
      ]
    },
  ],

  // ═══════════════════════════════════════════════════════════════════
  // COORDINATOR - Academic Coordination
  // ═══════════════════════════════════════════════════════════════════
  coordinator: [
    { title: 'Dashboard', icon: LayoutDashboard, path: ROUTES.COORDINATOR.DASHBOARD },
    { title: 'Student Details', icon: Users, path: ROUTES.COORDINATOR.STUDENT_DETAILS },
    {
      title: 'Academics',
      icon: GraduationCap,
      submenu: [
        { title: 'Class', path: ROUTES.COORDINATOR.CLASSES },
        { title: 'Sections', path: ROUTES.COORDINATOR.SECTIONS },
        { title: 'Subjects', path: ROUTES.COORDINATOR.SUBJECTS },
        { title: 'Class Timetable', path: ROUTES.COORDINATOR.CLASS_TIMETABLE },
        { title: 'Teacher Timetable', path: ROUTES.COORDINATOR.TEACHER_TIMETABLE },
      ]
    },
    {
      title: 'Attendance',
      icon: Calendar,
      submenu: [
        { title: 'Student Attendance', path: ROUTES.COORDINATOR.STUDENT_ATTENDANCE },
        { title: 'Attendance Report', path: ROUTES.COORDINATOR.ATTENDANCE_REPORT },
      ]
    },
    {
      title: 'Examinations',
      icon: FileText,
      submenu: [
        { title: 'Exam Schedule', path: ROUTES.COORDINATOR.EXAM_SCHEDULE },
        { title: 'Exam Result', path: ROUTES.COORDINATOR.GENERAL_EXAM_RESULT },
        { title: 'Marks Entry', path: ROUTES.COORDINATOR.MARKS_ENTRY },
        { title: 'Report Card', path: ROUTES.COORDINATOR.REPORT_CARD },
      ]
    },
    {
      title: 'Lesson Plan',
      icon: BookOpen,
      submenu: [
        { title: 'Add Homework', path: ROUTES.COORDINATOR.ADD_HOMEWORK },
        { title: 'Homework List', path: ROUTES.COORDINATOR.HOMEWORK },
        { title: 'Manage Lessons', path: ROUTES.COORDINATOR.MANAGE_LESSONS },
        { title: 'Syllabus Status', path: ROUTES.COORDINATOR.SYLLABUS_STATUS },
      ]
    },
    { title: 'Notice Board', icon: MessageSquare, path: ROUTES.COORDINATOR.NOTICE_BOARD },
  ],

  // ═══════════════════════════════════════════════════════════════════
  // CLASS TEACHER - Teacher + Class Administration  
  // ═══════════════════════════════════════════════════════════════════
  class_teacher: [
    { title: 'Dashboard', icon: LayoutDashboard, path: ROUTES.CLASS_TEACHER.DASHBOARD },
    { title: 'My Timetable', icon: Calendar, path: ROUTES.CLASS_TEACHER.TEACHER_TIMETABLE },
    { title: 'Student Details', icon: Users, path: ROUTES.CLASS_TEACHER.STUDENT_DETAILS },
    {
      title: 'Attendance',
      icon: CheckSquare,
      submenu: [
        { title: 'Student Attendance', path: ROUTES.CLASS_TEACHER.STUDENT_ATTENDANCE },
        { title: 'Attendance By Date', path: ROUTES.CLASS_TEACHER.ATTENDANCE_BY_DATE },
        { title: 'Approve Student Leave', path: ROUTES.CLASS_TEACHER.APPROVE_LEAVE },
        { title: 'Attendance Report', path: ROUTES.CLASS_TEACHER.ATTENDANCE_REPORT },
      ]
    },
    {
      title: 'Lesson Plan',
      icon: BookOpen,
      submenu: [
        { title: 'Add Homework', path: ROUTES.CLASS_TEACHER.ADD_HOMEWORK },
        { title: 'Homework List', path: ROUTES.CLASS_TEACHER.HOMEWORK },
        { title: 'Evaluate Homework', path: ROUTES.CLASS_TEACHER.EVALUATE_HOMEWORK },
        { title: 'Manage Lessons', path: ROUTES.CLASS_TEACHER.MANAGE_LESSONS },
        { title: 'Syllabus Status', path: ROUTES.CLASS_TEACHER.SYLLABUS_STATUS },
      ]
    },
    {
      title: 'Examinations',
      icon: GraduationCap,
      submenu: [
        { title: 'Exam Schedule', path: ROUTES.CLASS_TEACHER.EXAM_SCHEDULE },
        { title: 'Marks Entry', path: ROUTES.CLASS_TEACHER.MARKS_ENTRY },
        { title: 'Exam Result', path: ROUTES.CLASS_TEACHER.GENERAL_EXAM_RESULT },
        { title: 'Report Card', path: ROUTES.CLASS_TEACHER.REPORT_CARD },
      ]
    },
    {
      title: 'Behaviour Records',
      icon: AlertTriangle,
      submenu: [
        { title: 'Assign Incident', path: ROUTES.CLASS_TEACHER.ASSIGN_INCIDENT },
        { title: 'Incidents', path: ROUTES.CLASS_TEACHER.INCIDENTS },
      ]
    },
    { title: 'Notice Board', icon: MessageSquare, path: ROUTES.CLASS_TEACHER.NOTICE_BOARD },
    { title: 'Apply Leave', icon: Calendar, path: ROUTES.CLASS_TEACHER.STAFF_APPLY_LEAVE },
  ],

  // ═══════════════════════════════════════════════════════════════════
  // SUBJECT TEACHER - Subject-Specific Teaching
  // ═══════════════════════════════════════════════════════════════════
  subject_teacher: [
    { title: 'Dashboard', icon: LayoutDashboard, path: ROUTES.SUBJECT_TEACHER.DASHBOARD },
    { title: 'My Timetable', icon: Calendar, path: ROUTES.SUBJECT_TEACHER.TEACHER_TIMETABLE },
    { title: 'Student Details', icon: Users, path: ROUTES.SUBJECT_TEACHER.STUDENT_DETAILS },
    {
      title: 'Attendance',
      icon: CheckSquare,
      submenu: [
        { title: 'Student Attendance', path: ROUTES.SUBJECT_TEACHER.STUDENT_ATTENDANCE },
      ]
    },
    {
      title: 'Lesson Plan',
      icon: BookOpen,
      submenu: [
        { title: 'Add Homework', path: ROUTES.SUBJECT_TEACHER.ADD_HOMEWORK },
        { title: 'Homework List', path: ROUTES.SUBJECT_TEACHER.HOMEWORK },
      ]
    },
    {
      title: 'Examinations',
      icon: GraduationCap,
      submenu: [
        { title: 'Exam Schedule', path: ROUTES.SUBJECT_TEACHER.EXAM_SCHEDULE },
        { title: 'Marks Entry', path: ROUTES.SUBJECT_TEACHER.MARKS_ENTRY },
      ]
    },
    { title: 'Notice Board', icon: MessageSquare, path: ROUTES.SUBJECT_TEACHER.NOTICE_BOARD },
    { title: 'Apply Leave', icon: Calendar, path: ROUTES.SUBJECT_TEACHER.STAFF_APPLY_LEAVE },
  ],

  // ═══════════════════════════════════════════════════════════════════
  // CASHIER - Fee Collection, Finance & Student View
  // ═══════════════════════════════════════════════════════════════════
  cashier: [
    { title: 'Dashboard', icon: LayoutDashboard, path: ROUTES.CASHIER.DASHBOARD },
    {
      title: 'Student Information',
      icon: Users,
      submenu: [
        { title: 'Student Details', path: ROUTES.CASHIER.STUDENT_DETAILS },
        { title: 'Student Admission', path: ROUTES.CASHIER.STUDENT_ADMISSION },
      ]
    },
    {
      title: 'Fees Collection',
      icon: CreditCard,
      submenu: [
        { title: 'Collect Fees', path: ROUTES.CASHIER.COLLECT_FEES },
        { title: '📊 Fee Dashboard', path: '/cashier/fees-collection/fee-dashboard', badge: 'NEW' },
        { title: 'Search Fees Payment', path: ROUTES.CASHIER.SEARCH_FEES_PAYMENT },
        { title: 'Search Due Fees', path: ROUTES.CASHIER.SEARCH_DUE_FEES },
        { title: 'Offline Bank Payments', path: ROUTES.CASHIER.OFFLINE_PAYMENT },
        { title: 'Online Payment', path: ROUTES.CASHIER.ONLINE_PAYMENT },
        { title: 'Quick Fees', path: ROUTES.CASHIER.QUICK_FEES },
        { title: '💳 Payment Schedule', path: '/cashier/fees-collection/payment-schedule', badge: 'NEW' },
        { title: '🗓️ Fee Calendar', path: '/cashier/fees-collection/fee-calendar', badge: 'NEW' },
      ]
    },
    {
      title: 'Finance',
      icon: Wallet,
      submenu: [
        { title: 'Income', path: ROUTES.CASHIER.INCOME },
        { title: 'Add Income', path: ROUTES.CASHIER.ADD_INCOME },
        { title: 'Search Income', path: ROUTES.CASHIER.SEARCH_INCOME },
        { title: 'Expense', path: ROUTES.CASHIER.EXPENSE },
        { title: 'Add Expense', path: ROUTES.CASHIER.ADD_EXPENSE },
        { title: 'Search Expense', path: ROUTES.CASHIER.SEARCH_EXPENSE },
      ]
    },
    {
      title: 'Reports',
      icon: FileText,
      submenu: [
        { title: 'Daily Collection', path: ROUTES.CASHIER.REPORT_DAILY_COLLECTION },
        { title: 'Fees Collection', path: ROUTES.CASHIER.REPORT_FEES_COLLECTION },
        { title: 'Balance Fees', path: ROUTES.CASHIER.REPORT_BALANCE_FEES },
      ]
    },
  ],

  // ═══════════════════════════════════════════════════════════════════
  // LAB ASSISTANT - Lab & Inventory Management
  // ═══════════════════════════════════════════════════════════════════
  lab_assistant: [
    { title: 'Dashboard', icon: LayoutDashboard, path: ROUTES.LAB_ASSISTANT.DASHBOARD },
    {
      title: 'Inventory',
      icon: Package,
      submenu: [
        { title: 'Issue Item', path: ROUTES.LAB_ASSISTANT.INV_ISSUE_ITEM },
        { title: 'Item Stock', path: ROUTES.LAB_ASSISTANT.INV_ITEM_STOCK },
        { title: 'Add Stock', path: ROUTES.LAB_ASSISTANT.INV_ADD_STOCK },
      ]
    },
    { title: 'Notice Board', icon: MessageSquare, path: ROUTES.LAB_ASSISTANT.NOTICE_BOARD },
  ],

  // ═══════════════════════════════════════════════════════════════════
  // HOSTEL WARDEN - Hostel Management
  // ═══════════════════════════════════════════════════════════════════
  hostel_warden: [
    { title: 'Dashboard', icon: LayoutDashboard, path: ROUTES.HOSTEL_WARDEN.DASHBOARD },
    {
      title: 'Hostel',
      icon: Building,
      submenu: [
        { title: 'Hostels', path: ROUTES.HOSTEL_WARDEN.HOSTELS },
        { title: 'Hostel Rooms', path: ROUTES.HOSTEL_WARDEN.HOSTEL_ROOMS },
        { title: 'Room Types', path: ROUTES.HOSTEL_WARDEN.ROOM_TYPES },
        { title: 'Hostel Fee', path: ROUTES.HOSTEL_WARDEN.HOSTEL_FEE },
        { title: 'Hostel Analysis', path: ROUTES.HOSTEL_WARDEN.HOSTEL_ANALYSIS },
      ]
    },
    { title: 'Student Details', icon: Users, path: ROUTES.HOSTEL_WARDEN.STUDENT_DETAILS },
    { title: 'Notice Board', icon: MessageSquare, path: ROUTES.HOSTEL_WARDEN.NOTICE_BOARD },
  ],

  // ═══════════════════════════════════════════════════════════════════
  // DRIVER - Transport Management
  // ═══════════════════════════════════════════════════════════════════
  driver: [
    { title: 'Dashboard', icon: LayoutDashboard, path: ROUTES.DRIVER.DASHBOARD },
    {
      title: 'Transport',
      icon: Bus,
      submenu: [
        { title: 'Routes', path: ROUTES.DRIVER.TRANSPORT_ROUTES },
        { title: 'Vehicles', path: ROUTES.DRIVER.TRANSPORT_VEHICLES },
        { title: 'Pickup Points', path: ROUTES.DRIVER.PICKUP_POINTS },
        { title: 'Route Pickup Points', path: ROUTES.DRIVER.ROUTE_PICKUP_POINT },
      ]
    },
    { title: 'Notice Board', icon: MessageSquare, path: ROUTES.DRIVER.NOTICE_BOARD },
  ],

  // ═══════════════════════════════════════════════════════════════════
  // SPORTS COACH - Sports & Activities
  // ═══════════════════════════════════════════════════════════════════
  sports_coach: [
    { title: 'Dashboard', icon: LayoutDashboard, path: ROUTES.SPORTS_COACH.DASHBOARD },
    { title: 'Student Details', icon: Users, path: ROUTES.SPORTS_COACH.STUDENT_DETAILS },
    {
      title: 'Attendance',
      icon: CheckSquare,
      submenu: [
        { title: 'Student Attendance', path: ROUTES.SPORTS_COACH.STUDENT_ATTENDANCE },
        { title: 'Attendance Report', path: ROUTES.SPORTS_COACH.ATTENDANCE_REPORT },
      ]
    },
    { title: 'Notice Board', icon: MessageSquare, path: ROUTES.SPORTS_COACH.NOTICE_BOARD },
  ],

  // ═══════════════════════════════════════════════════════════════════
  // SECURITY GUARD - Gate Security
  // ═══════════════════════════════════════════════════════════════════
  security_guard: [
    { title: 'Dashboard', icon: LayoutDashboard, path: ROUTES.SECURITY_GUARD.DASHBOARD },
    { title: 'Visitor Book', icon: Building, path: ROUTES.SECURITY_GUARD.VISITOR_BOOK },
    { title: 'Notice Board', icon: MessageSquare, path: ROUTES.SECURITY_GUARD.NOTICE_BOARD },
  ],

  // ═══════════════════════════════════════════════════════════════════
  // MAINTENANCE STAFF - Facility Maintenance
  // ═══════════════════════════════════════════════════════════════════
  maintenance_staff: [
    { title: 'Dashboard', icon: LayoutDashboard, path: ROUTES.MAINTENANCE_STAFF.DASHBOARD },
    {
      title: 'Inventory',
      icon: Package,
      submenu: [
        { title: 'Issue Item', path: ROUTES.MAINTENANCE_STAFF.INV_ISSUE_ITEM },
        { title: 'Item Stock', path: ROUTES.MAINTENANCE_STAFF.INV_ITEM_STOCK },
        { title: 'Add Stock', path: ROUTES.MAINTENANCE_STAFF.INV_ADD_STOCK },
      ]
    },
    { title: 'Notice Board', icon: MessageSquare, path: ROUTES.MAINTENANCE_STAFF.NOTICE_BOARD },
  ],
  // Alias for maintenance role name variant
  maintenance: null, // Falls back to maintenance_staff via useDynamicSidebar

  // ═══════════════════════════════════════════════════════════════════
  // PEON - Minimal Access Support Staff
  // ═══════════════════════════════════════════════════════════════════
  peon: [
    { title: 'Dashboard', icon: LayoutDashboard, path: ROUTES.PEON.DASHBOARD },
    { title: 'Notice Board', icon: MessageSquare, path: ROUTES.PEON.NOTICE_BOARD },
  ],

  // Parent Dashboard - Monitor Children's Progress
  parent: [
    { title: 'Dashboard', icon: LayoutDashboard, path: ROUTES.PARENT.DASHBOARD },
    { title: 'My Children', icon: Users, path: ROUTES.PARENT.DASHBOARD },
    {
      title: 'Fees',
      icon: CreditCard,
      submenu: [
        { title: 'Child Fees', path: ROUTES.PARENT.FEES },
        { title: 'Pay Online', path: ROUTES.PARENT.PAY_ONLINE },
      ]
    },
    {
      title: 'Academics',
      icon: BookOpen,
      submenu: [
        { title: 'Homework', path: ROUTES.PARENT.HOMEWORK },
        { title: 'Class Timetable', path: ROUTES.PARENT.TIMETABLE },
      ]
    },
    {
      title: 'Examinations',
      icon: FileText,
      submenu: [
        { title: 'Exam Schedule', path: ROUTES.PARENT.EXAM_SCHEDULE },
        { title: 'Exam Results', path: ROUTES.PARENT.EXAM_RESULT },
      ]
    },
    {
      title: 'Attendance',
      icon: CheckSquare,
      submenu: [
        { title: 'Child Attendance', path: ROUTES.PARENT.ATTENDANCE },
        { title: 'Apply Leave', path: ROUTES.PARENT.APPLY_LEAVE },
      ]
    },
    { title: 'Transport', icon: Bus, path: ROUTES.PARENT.TRANSPORT },
    { title: 'Hostel', icon: Building, path: ROUTES.PARENT.HOSTEL },
    { title: 'Notice Board', icon: MessageSquare, path: ROUTES.PARENT.NOTICE_BOARD },
  ],
};

