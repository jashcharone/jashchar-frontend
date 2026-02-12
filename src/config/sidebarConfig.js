import { 
  LayoutDashboard, School, Users, CreditCard, Settings, BookOpen, GraduationCap, Calendar, FileText, Bus, Building, MessageSquare, Briefcase, LogOut, X, ChevronDown, ChevronRight, Package, CheckSquare, Library, Layout, Video, MonitorPlay, AlertTriangle, Award, Newspaper, Activity, IndianRupee, UserPlus, GitBranch, BarChart3, Bot, Box, Download, QrCode
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
        { title: 'Banner Images', path: '/master-admin/front-cms/banners' },
      ]
    }
  ],
  super_admin: [
    { title: 'Dashboard', icon: LayoutDashboard, path: ROUTES.SUPER_ADMIN.DASHBOARD },
    { title: 'Advanced Analytics', icon: BarChart3, path: '/admin/advanced-analytics' },
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
        { title: 'Exam Group', path: ROUTES.SUPER_ADMIN.EXAM_GROUP },
        { title: 'Exam List', path: ROUTES.SUPER_ADMIN.EXAM_LIST },
        { title: 'Exam Schedule', path: ROUTES.SUPER_ADMIN.EXAM_SCHEDULE },
        { title: 'Exam Result', path: ROUTES.SUPER_ADMIN.GENERAL_EXAM_RESULT },
        { title: 'Marks Entry', path: ROUTES.SUPER_ADMIN.MARKS_ENTRY },
        { title: 'Marks Grade', path: ROUTES.SUPER_ADMIN.MARKS_GRADE },
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
        { title: 'Timetable', path: ROUTES.SUPER_ADMIN.TIMETABLE },
        { title: 'Class Timetable', path: ROUTES.SUPER_ADMIN.CLASS_TIMETABLE },
        { title: 'Teacher Timetable', path: ROUTES.SUPER_ADMIN.TEACHER_TIMETABLE },
        { title: 'Promote Students', path: ROUTES.SUPER_ADMIN.PROMOTE_STUDENT },
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
          { title: 'Student Information', path: ROUTES.SUPER_ADMIN.REPORT_STUDENT_INFO },
          { title: 'Finance', path: ROUTES.SUPER_ADMIN.REPORT_INCOME },
          { title: 'Attendance', path: ROUTES.SUPER_ADMIN.REPORT_ATTENDANCE },
          { title: 'Examinations', path: ROUTES.SUPER_ADMIN.CBSE_REPORTS },
          { title: 'Human Resource', path: ROUTES.SUPER_ADMIN.REPORT_PAYROLL },
          { title: 'Library', path: ROUTES.SUPER_ADMIN.REPORT_LIB_BOOK_ISSUE },
          { title: 'Transport', path: ROUTES.SUPER_ADMIN.REPORT_TRANSPORT },
          { title: 'Hostel', path: ROUTES.SUPER_ADMIN.REPORT_HOSTEL },
          { title: 'Homework', path: ROUTES.SUPER_ADMIN.REPORT_HOMEWORK },
          { title: 'Homework Evaluation', path: ROUTES.SUPER_ADMIN.REPORT_HOMEWORK_EVAL },
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
    { title: 'Dashboard', icon: LayoutDashboard, path: '/principal/dashboard' },
    {
      title: 'Student Information',
      icon: Users,
      submenu: [
        { title: 'Student Details', path: ROUTES.SUPER_ADMIN.STUDENT_DETAILS },
        { title: 'Student Admission', path: ROUTES.SUPER_ADMIN.STUDENT_ADMISSION },
        { title: 'Online Admission', path: ROUTES.SUPER_ADMIN.ONLINE_ADMISSION_LIST },
        { title: 'Disabled Students', path: ROUTES.SUPER_ADMIN.DISABLED_STUDENTS },
      ]
    },
    {
      title: 'Human Resource',
      icon: Briefcase,
      submenu: [
        { title: 'Staff Directory', path: ROUTES.SUPER_ADMIN.STAFF_DIRECTORY },
        { title: 'Department', path: ROUTES.SUPER_ADMIN.DEPARTMENTS },
        { title: 'Designation', path: ROUTES.SUPER_ADMIN.DESIGNATIONS },
        { title: 'Leave Management', path: ROUTES.SUPER_ADMIN.LEAVE_MANAGEMENT },
        { title: 'Approve Leave Request', path: ROUTES.SUPER_ADMIN.APPROVE_STAFF_LEAVE },
      ]
    },
    {
      title: 'Attendance',
      icon: Calendar,
      submenu: [
        { title: 'Student Attendance', path: ROUTES.SUPER_ADMIN.STUDENT_ATTENDANCE },
        { title: 'Staff Attendance', path: ROUTES.SUPER_ADMIN.STAFF_ATTENDANCE },
        { title: 'Approve Leave', path: ROUTES.SUPER_ADMIN.APPROVE_LEAVE },
        { title: 'Attendance Report', path: ROUTES.SUPER_ADMIN.ATTENDANCE_REPORT },
      ]
    },
    {
      title: 'Academics',
      icon: GraduationCap,
      submenu: [
        { title: 'Class', path: ROUTES.SUPER_ADMIN.CLASSES },
        { title: 'Sections', path: ROUTES.SUPER_ADMIN.SECTIONS },
        { title: 'Class Timetable', path: ROUTES.SUPER_ADMIN.CLASS_TIMETABLE },
        { title: 'Teacher Timetable', path: ROUTES.SUPER_ADMIN.TEACHER_TIMETABLE },
        { title: 'Assign Class Teacher', path: ROUTES.SUPER_ADMIN.ASSIGN_CLASS_TEACHER },
        { title: 'Subject Teacher', path: ROUTES.SUPER_ADMIN.SUBJECT_TEACHER },
      ]
    },
    {
      title: 'Examinations',
      icon: FileText,
      submenu: [
        { title: 'Exam Group', path: ROUTES.SUPER_ADMIN.EXAM_GROUP },
        { title: 'Exam Schedule', path: ROUTES.SUPER_ADMIN.EXAM_SCHEDULE },
        { title: 'Exam Result', path: ROUTES.SUPER_ADMIN.GENERAL_EXAM_RESULT },
        { title: 'Marks Entry', path: ROUTES.SUPER_ADMIN.MARKS_ENTRY },
        { title: 'Report Card', path: ROUTES.SUPER_ADMIN.REPORT_CARD },
      ]
    },
    {
      title: 'Behaviour Records',
      icon: AlertTriangle,
      submenu: [
        { title: 'Assign Incident', path: ROUTES.SUPER_ADMIN.ASSIGN_INCIDENT },
        { title: 'Incidents', path: ROUTES.SUPER_ADMIN.INCIDENTS },
        { title: 'Reports', path: ROUTES.SUPER_ADMIN.BEHAVIOUR_REPORTS },
      ]
    },
    {
      title: 'Communicate',
      icon: MessageSquare,
      submenu: [
        { title: 'Notice Board', path: ROUTES.SUPER_ADMIN.NOTICE_BOARD },
        { title: 'Send Email', path: ROUTES.SUPER_ADMIN.SEND_EMAIL },
        { title: 'Send SMS', path: ROUTES.SUPER_ADMIN.SEND_SMS },
      ]
    },
    {
      title: 'Reports',
      icon: BarChart3,
      submenu: [
        { title: 'Student Information', path: ROUTES.SUPER_ADMIN.REPORT_STUDENT_INFO },
        { title: 'Attendance', path: ROUTES.SUPER_ADMIN.REPORT_ATTENDANCE },
        { title: 'Examinations', path: ROUTES.SUPER_ADMIN.CBSE_REPORTS },
        { title: 'Human Resource', path: ROUTES.SUPER_ADMIN.REPORT_PAYROLL },
      ]
    },
  ],
  
  // Accountant Dashboard - Financial Management
  accountant: [
    { title: 'Dashboard', icon: LayoutDashboard, path: '/Accountant/dashboard' },
    {
      title: 'Fees Collection',
      icon: CreditCard,
      submenu: [
        { title: 'Collect Fees', path: ROUTES.SUPER_ADMIN.COLLECT_FEES },
        { title: 'Offline Bank Payments', path: ROUTES.SUPER_ADMIN.OFFLINE_PAYMENT },
        { title: 'Online Payment', path: ROUTES.SUPER_ADMIN.ONLINE_PAYMENT },
        { title: 'Search Fees Payment', path: ROUTES.SUPER_ADMIN.SEARCH_FEES_PAYMENT },
        { title: 'Search Due Fees', path: ROUTES.SUPER_ADMIN.SEARCH_DUE_FEES },
        { title: 'Fees Master', path: ROUTES.SUPER_ADMIN.FEES_MASTER },
        { title: 'Fees Group', path: ROUTES.SUPER_ADMIN.FEES_GROUP },
        { title: 'Fees Type', path: ROUTES.SUPER_ADMIN.FEES_TYPE },
        { title: 'Fees Discount', path: ROUTES.SUPER_ADMIN.FEES_DISCOUNT },
        { title: 'Fees Reminder', path: ROUTES.SUPER_ADMIN.FEES_REMINDER },
      ]
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
    { title: 'Student Details', icon: Users, path: ROUTES.SUPER_ADMIN.STUDENT_DETAILS },
    {
      title: 'Reports',
      icon: FileText,
      submenu: [
        { title: 'Income Report', path: ROUTES.SUPER_ADMIN.REPORT_INCOME },
        { title: 'Expense Report', path: ROUTES.SUPER_ADMIN.REPORT_EXPENSE },
        { title: 'Income/Expense Balance', path: ROUTES.SUPER_ADMIN.REPORT_INC_EXP_BALANCE },
        { title: 'Daily Collection', path: ROUTES.SUPER_ADMIN.REPORT_DAILY_COLLECTION },
        { title: 'Fees Collection', path: ROUTES.SUPER_ADMIN.REPORT_FEES_COLLECTION },
        { title: 'Fees Statement', path: ROUTES.SUPER_ADMIN.REPORT_FEES_STATEMENT },
        { title: 'Balance Fees', path: ROUTES.SUPER_ADMIN.REPORT_BALANCE_FEES },
        { title: 'Payroll Report', path: ROUTES.SUPER_ADMIN.REPORT_PAYROLL },
      ]
    },
  ],
  
  // Receptionist Dashboard - Front Office Management
  receptionist: [
    { title: 'Dashboard', icon: LayoutDashboard, path: '/Receptionist/dashboard' },
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
        { title: 'Student Details', path: ROUTES.SUPER_ADMIN.STUDENT_DETAILS },
        { title: 'Student Admission', path: ROUTES.SUPER_ADMIN.STUDENT_ADMISSION },
        { title: 'Online Admission', path: ROUTES.SUPER_ADMIN.ONLINE_ADMISSION_LIST },
      ]
    },
    {
      title: 'Communicate',
      icon: MessageSquare,
      submenu: [
        { title: 'Notice Board', path: ROUTES.SUPER_ADMIN.NOTICE_BOARD },
        { title: 'Send SMS', path: ROUTES.SUPER_ADMIN.SEND_SMS },
      ]
    },
  ],
  
  // Teacher Dashboard - Teaching & Class Management
  teacher: [
    { title: 'Dashboard', icon: LayoutDashboard, path: ROUTES.TEACHER.DASHBOARD },
    { title: 'My Timetable', icon: Calendar, path: ROUTES.SUPER_ADMIN.TEACHER_TIMETABLE },
    {
      title: 'Students',
      icon: Users,
      submenu: [
        { title: 'Student Details', path: ROUTES.SUPER_ADMIN.STUDENT_DETAILS },
        { title: 'Student Profile', path: ROUTES.SUPER_ADMIN.STUDENT_DETAILS },
      ]
    },
    {
      title: 'Attendance',
      icon: CheckSquare,
      submenu: [
        { title: 'Student Attendance', path: ROUTES.SUPER_ADMIN.STUDENT_ATTENDANCE },
        { title: 'Attendance By Date', path: ROUTES.SUPER_ADMIN.ATTENDANCE_BY_DATE },
      ]
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
      title: 'Examinations',
      icon: GraduationCap,
      submenu: [
        { title: 'Exam Schedule', path: ROUTES.SUPER_ADMIN.EXAM_SCHEDULE },
        { title: 'Marks Entry', path: ROUTES.SUPER_ADMIN.MARKS_ENTRY },
        { title: 'Exam Result', path: ROUTES.SUPER_ADMIN.GENERAL_EXAM_RESULT },
      ]
    },
    {
      title: 'Behaviour Records',
      icon: AlertTriangle,
      submenu: [
        { title: 'Assign Incident', path: ROUTES.SUPER_ADMIN.ASSIGN_INCIDENT },
        { title: 'Incidents', path: ROUTES.SUPER_ADMIN.INCIDENTS },
      ]
    },
    {
      title: 'Live Classes',
      icon: Video,
      submenu: [
        { title: 'Live Classes', path: ROUTES.SUPER_ADMIN.LIVE_CLASSES },
        { title: 'Live Meeting', path: ROUTES.SUPER_ADMIN.LIVE_MEETING },
      ]
    },
    { title: 'Online Course', icon: MonitorPlay, path: ROUTES.SUPER_ADMIN.ONLINE_COURSE },
    { title: 'Notice Board', icon: MessageSquare, path: ROUTES.SUPER_ADMIN.NOTICE_BOARD },
  ],
  
  // Librarian Dashboard
  librarian: [
    { title: 'Dashboard', icon: LayoutDashboard, path: '/Librarian/dashboard' },
    {
      title: 'Library',
      icon: Library,
      submenu: [
        { title: 'Book List', path: ROUTES.SUPER_ADMIN.LIBRARY_BOOK_LIST },
        { title: 'Issue/Return', path: ROUTES.SUPER_ADMIN.LIBRARY_ISSUE_RETURN },
        { title: 'Add Book', path: ROUTES.SUPER_ADMIN.LIBRARY_ADD_BOOK },
        { title: 'Book Issued', path: ROUTES.SUPER_ADMIN.LIBRARY_BOOK_ISSUED },
        { title: 'Library Members', path: ROUTES.SUPER_ADMIN.LIBRARY_MEMBERS },
        { title: 'Library Card', path: ROUTES.SUPER_ADMIN.LIBRARY_CARD },
      ]
    },
    {
      title: 'Reports',
      icon: FileText,
      submenu: [
        { title: 'Book Issue Report', path: ROUTES.SUPER_ADMIN.REPORT_LIB_BOOK_ISSUE },
      ]
    },
  ],
  
  // Parent Dashboard - Monitor Children's Progress
  parent: [
    { title: 'Dashboard', icon: LayoutDashboard, path: ROUTES.PARENT.DASHBOARD },
    { title: 'My Children', icon: Users, path: ROUTES.PARENT.DASHBOARD },
    {
      title: 'Fees',
      icon: CreditCard,
      submenu: [
        { title: 'Child Fees', path: ROUTES.STUDENT.FEES },
        { title: 'Pay Online', path: ROUTES.STUDENT.FEES },
      ]
    },
    {
      title: 'Academics',
      icon: BookOpen,
      submenu: [
        { title: 'Homework', path: ROUTES.STUDENT.HOMEWORK },
        { title: 'Class Timetable', path: ROUTES.STUDENT.TIMETABLE },
      ]
    },
    {
      title: 'Examinations',
      icon: FileText,
      submenu: [
        { title: 'Exam Schedule', path: ROUTES.STUDENT.EXAM_SCHEDULE },
        { title: 'Exam Results', path: ROUTES.STUDENT.EXAM_RESULT },
      ]
    },
    {
      title: 'Attendance',
      icon: CheckSquare,
      submenu: [
        { title: 'Child Attendance', path: ROUTES.STUDENT.ATTENDANCE },
        { title: 'Apply Leave', path: ROUTES.STUDENT.APPLY_LEAVE },
      ]
    },
    { title: 'Transport', icon: Bus, path: ROUTES.STUDENT.TRANSPORT_ROUTES },
    { title: 'Hostel', icon: Building, path: ROUTES.STUDENT.HOSTEL_ROOMS },
    { title: 'Notice Board', icon: MessageSquare, path: ROUTES.SUPER_ADMIN.NOTICE_BOARD },
  ],
};

