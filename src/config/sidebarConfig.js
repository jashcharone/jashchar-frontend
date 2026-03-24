import { 
  LayoutDashboard, School, Users, CreditCard, Settings, BookOpen, GraduationCap, Calendar, FileText, Bus, Building, MessageSquare, Briefcase, LogOut, X, ChevronDown, ChevronRight, Package, CheckSquare, Library, Layout, Video, MonitorPlay, AlertTriangle, Award, Newspaper, Activity, IndianRupee, UserPlus, GitBranch, BarChart3, Bot, Box, Download, QrCode, KeyRound, Wallet, Brain, HeartPulse
} from 'lucide-react';
import { ROUTES } from '@/registry/routeRegistry';

// Toggle for Queries Finder - Change to false to hide
const SHOW_QUERIES_FINDER = true;

export const BASE_SIDEBAR = {
  master_admin: [
    { title: 'Dashboard', icon: LayoutDashboard, path: ROUTES.MASTER_ADMIN.DASHBOARD },
    { title: 'Advanced Analytics', icon: BarChart3, path: ROUTES.MASTER_ADMIN.ADVANCED_ANALYTICS },
    { title: 'Module Registry', icon: Box, path: ROUTES.MASTER_ADMIN.MODULE_REGISTRY, badge: 'NEW' },
    { title: 'Branches', icon: School, path: ROUTES.MASTER_ADMIN.SCHOOLS },
    { title: 'Organization Requests', icon: UserPlus, path: ROUTES.MASTER_ADMIN.ORGANIZATION_REQUESTS },
    { title: 'Branch Management', icon: GitBranch, path: ROUTES.MASTER_ADMIN.BRANCH_MANAGEMENT },
    { title: 'WhatsApp Manager', icon: MessageSquare, path: ROUTES.MASTER_ADMIN.WHATSAPP_MANAGER },
    { title: 'JashSync Control', icon: MessageSquare, path: ROUTES.MASTER_ADMIN.JASHSYNC_CONTROL, badge: 'NEW' },
    { title: 'AI Health Monitor', icon: HeartPulse, path: '/master-admin/ai-health', badge: 'NEW' },
    {
      title: 'Subscriptions',
      icon: CreditCard,
      submenu: [
        { title: 'Plans', path: ROUTES.MASTER_ADMIN.SUBSCRIPTION_PLANS },
        { title: 'Subscriptions', path: ROUTES.MASTER_ADMIN.SUBSCRIPTIONS },
        { title: 'Invoices', path: ROUTES.MASTER_ADMIN.SUBSCRIPTION_INVOICES },
        { title: 'Transactions', path: ROUTES.MASTER_ADMIN.SUBSCRIPTION_TRANSACTIONS },
        { title: 'Billing Audit', path: ROUTES.MASTER_ADMIN.BILLING_AUDIT },
        { title: 'Generate Bill', path: ROUTES.MASTER_ADMIN.GENERATE_BILL_NEW },
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
        { title: 'Branch Diagnostics', path: ROUTES.MASTER_ADMIN.SCHOOL_OWNER_DIAGNOSTICS },
        { title: 'Demo Automation V2', path: ROUTES.MASTER_ADMIN.DEMO_AUTOMATION_V2 },
        { title: 'Enterprise Health Monitor', path: ROUTES.MASTER_ADMIN.ENTERPRISE_HEALTH },
      ],
    },
    {
      title: 'Website Management',
      icon: Layout,
      submenu: [
        { title: 'General Settings', path: ROUTES.MASTER_ADMIN.SAAS_WEBSITE_SETTINGS },
        { title: 'Login Page Settings', path: ROUTES.MASTER_ADMIN.LOGIN_PAGE_SETTINGS },
        { title: 'File Type Settings', path: ROUTES.MASTER_ADMIN.FILE_TYPE_SETTINGS },
        { title: 'File Manager', path: ROUTES.MASTER_ADMIN.FILE_MANAGER },
      ]
    },
    {
      title: 'Front CMS',
      icon: Newspaper,
      submenu: [
        { title: 'Website Settings', path: ROUTES.MASTER_ADMIN.FRONT_CMS_SETTINGS },
        { title: 'Login Page Settings', path: ROUTES.MASTER_ADMIN.FRONT_CMS_LOGIN_SETTINGS },
        { title: 'Menus', path: ROUTES.MASTER_ADMIN.FRONT_CMS_MENUS },
        { title: 'Pages', path: ROUTES.MASTER_ADMIN.FRONT_CMS_PAGES },
        { title: 'Events', path: ROUTES.MASTER_ADMIN.FRONT_CMS_EVENTS },
        { title: 'Gallery', path: ROUTES.MASTER_ADMIN.FRONT_CMS_GALLERY },
        { title: 'News', path: ROUTES.MASTER_ADMIN.FRONT_CMS_NEWS },
        { title: 'Media Manager', path: ROUTES.MASTER_ADMIN.FRONT_CMS_MEDIA_MANAGER },
        { title: 'Achievements', path: ROUTES.MASTER_ADMIN.FRONT_CMS_ACHIEVEMENTS },
        { title: 'Banner Images', path: ROUTES.MASTER_ADMIN.FRONT_CMS_BANNERS },
      ]
    }
  ],
  super_admin: [
    { title: 'Dashboard', icon: LayoutDashboard, path: ROUTES.SUPER_ADMIN.DASHBOARD },
    { title: 'Advanced Analytics', icon: BarChart3, path: ROUTES.SUPER_ADMIN.ADVANCED_ANALYTICS },
    // Cortex AI - Add-on subscription based access (NOT module permission)
    // Always visible in sidebar, access controlled within the module
    { title: '⚡ Cortex AI', icon: Bot, path: ROUTES.SUPER_ADMIN.CORTEX_AI, badge: 'AI', badgeColor: 'purple' },
    // AI Paper Valuation - Cortex Evaluate™
    {
      title: '🧠 AI Evaluation',
      icon: Brain,
      badge: 'NEW',
      badgeColor: 'purple',
      submenu: [
        // ── Workflow ──
        { title: '── Workflow ──', path: '#ai-eval-workflow', disabled: true },
        { title: 'Dashboard', path: ROUTES.SUPER_ADMIN.AI_EVALUATION_DASHBOARD },
        { title: 'Evaluation Sessions', path: ROUTES.SUPER_ADMIN.AI_EVALUATION_SESSIONS },
        { title: 'Create Session', path: ROUTES.SUPER_ADMIN.AI_EVALUATION_CREATE },
        { title: 'Upload Papers', path: ROUTES.SUPER_ADMIN.AI_EVALUATION_UPLOAD },
        { title: 'Question Mapping', path: ROUTES.SUPER_ADMIN.AI_EVALUATION_QUESTION_MAPPING },
        // ── Review & Results ──
        { title: '── Review & Results ──', path: '#ai-eval-review', disabled: true },
        { title: 'Teacher Review', path: ROUTES.SUPER_ADMIN.AI_EVALUATION_REVIEW },
        { title: 'Final Marks', path: ROUTES.SUPER_ADMIN.AI_EVALUATION_FINAL_MARKS },
        // ── Analytics & Settings ──
        { title: '── Analytics & Settings ──', path: '#ai-eval-analytics', disabled: true },
        { title: 'Analytics', path: ROUTES.SUPER_ADMIN.AI_EVALUATION_ANALYTICS },
        { title: 'Settings', path: ROUTES.SUPER_ADMIN.AI_EVALUATION_SETTINGS },
      ]
    },
    // JashSync - Brain-Connected Messenger (Separate Module)
    { title: '💬 JashSync', icon: MessageSquare, path: ROUTES.SUPER_ADMIN.JASHSYNC, badge: 'NEW', badgeColor: 'green' },
    {
      title: 'Front Office',
      icon: Building,
      submenu: [
        // ── Enquiry & Visitors ──
        { title: '── Enquiry & Visitors ──', path: '#fo-enquiry', disabled: true },
        { title: '📋 Admission Enquiry', path: ROUTES.SUPER_ADMIN.ADMISSION_ENQUIRY },
        { title: '📖 Visitor Book', path: ROUTES.SUPER_ADMIN.VISITOR_BOOK },
        { title: '📞 Phone Call Log', path: ROUTES.SUPER_ADMIN.PHONE_CALL_LOG },
        // ── Postal & Complaints ──
        { title: '── Postal & Complaints ──', path: '#fo-postal', disabled: true },
        { title: '📤 Postal Dispatch', path: ROUTES.SUPER_ADMIN.POSTAL_DISPATCH },
        { title: '📥 Postal Receive', path: ROUTES.SUPER_ADMIN.POSTAL_RECEIVE },
        { title: '⚠️ Complain', path: ROUTES.SUPER_ADMIN.COMPLAIN },
        // ── Settings ──
        { title: '── Settings ──', path: '#fo-settings', disabled: true },
        { title: '⚙️ Setup Front Office', path: ROUTES.SUPER_ADMIN.SETUP_FRONT_OFFICE },
      ]
    },
    {
      title: 'Student Information',
      icon: Users,
      submenu: [
        // ── Dashboard ──
        { title: '📊 Dashboard', path: ROUTES.SUPER_ADMIN.STUDENT_DASHBOARD },
        // ── Admission & Enrollment ──
        { title: '── Admission & Enrollment ──', path: '#student-admission', disabled: true },
        { title: '📝 Student Admission', path: ROUTES.SUPER_ADMIN.STUDENT_ADMISSION },
        { title: '⚙️ Admission Form Settings', path: ROUTES.SUPER_ADMIN.ADMISSION_FORM_SETTINGS },
        { title: '🌐 Online Admission', path: ROUTES.SUPER_ADMIN.ONLINE_ADMISSION_LIST },
        // ── Student Records ──
        { title: '── Student Records ──', path: '#student-records', disabled: true },
        { title: '👨‍🎓 Student Details', path: ROUTES.SUPER_ADMIN.STUDENT_DETAILS },
        { title: '👥 Multi Class Student', path: ROUTES.SUPER_ADMIN.MULTI_CLASS_STUDENT },
        { title: '📤 Bulk Upload', path: ROUTES.SUPER_ADMIN.STUDENT_BULK_UPLOAD },
        // ── Identity & Documents ──
        { title: '── Identity & Documents ──', path: '#student-identity', disabled: true },
        { title: '🪪 ID Card', path: ROUTES.SUPER_ADMIN.STUDENT_ID_CARD },
        { title: '🆔 ID Card Designer', path: ROUTES.SUPER_ADMIN.STUDENT_ID_CARD_DESIGNER },
        { title: '📜 Transfer Certificate', path: ROUTES.SUPER_ADMIN.TRANSFER_CERTIFICATE },
        { title: '📋 Document Checklist', path: ROUTES.SUPER_ADMIN.DOCUMENT_CHECKLIST },
        // ── Attendance & Communication ──
        { title: '── Attendance & Communication ──', path: '#student-attendance', disabled: true },
        { title: '📅 Attendance Dashboard', path: ROUTES.SUPER_ADMIN.STUDENT_ATTENDANCE_DASHBOARD },
        { title: '📨 Communication', path: ROUTES.SUPER_ADMIN.STUDENT_COMMUNICATION },
        // ── Analytics & AI ──
        { title: '── Analytics & AI ──', path: '#student-analytics', disabled: true },
        { title: '📊 Student Analysis', path: ROUTES.SUPER_ADMIN.STUDENT_ANALYSIS },
        { title: '🧠 Advanced Analytics', path: ROUTES.SUPER_ADMIN.STUDENT_ANALYTICS_2 },
        { title: '🤖 AI Insights', path: ROUTES.SUPER_ADMIN.STUDENT_AI_INSIGHTS },
        // ── Student Status Management ──
        { title: '── Status Management ──', path: '#student-status', disabled: true },
        { title: '🚫 Disabled Students', path: ROUTES.SUPER_ADMIN.DISABLED_STUDENTS },
        { title: '❌ Disable Reason', path: ROUTES.SUPER_ADMIN.DISABLE_REASON },
        { title: '🗑️ Bulk Delete', path: ROUTES.SUPER_ADMIN.BULK_DELETE },
      ],
    },
    {
      title: 'Behaviour Records',
      icon: AlertTriangle,
      submenu: [
        // ── Incidents ──
        { title: '── Incidents ──', path: '#beh-incidents', disabled: true },
        { title: '📌 Assign Incident', path: ROUTES.SUPER_ADMIN.ASSIGN_INCIDENT },
        { title: '⚠️ Incidents', path: ROUTES.SUPER_ADMIN.INCIDENTS },
        // ── Reports & Settings ──
        { title: '── Reports & Settings ──', path: '#beh-reports', disabled: true },
        { title: '📊 Reports', path: ROUTES.SUPER_ADMIN.BEHAVIOUR_REPORTS },
        { title: '⚙️ Setting', path: ROUTES.SUPER_ADMIN.BEHAVIOUR_SETTING },
      ]
    },
    {
      title: 'Fees Collection',
      icon: CreditCard,
      submenu: [
        // 📊 Dashboard & Collection
        { title: '📊 Fee Dashboard', path: ROUTES.SUPER_ADMIN.FEE_DASHBOARD },
        { title: '💰 Collect Fees', path: ROUTES.SUPER_ADMIN.COLLECT_FEES },
        { title: '🏦 Offline Bank Payments', path: ROUTES.SUPER_ADMIN.OFFLINE_PAYMENT },
        { title: '💳 Online Payment', path: ROUTES.SUPER_ADMIN.ONLINE_PAYMENT },
        // ── Fee Setup ──
        { title: '── Fee Setup ──', path: '#fees-setup', disabled: true },
        { title: '🏗️ Fee Structures', path: ROUTES.SUPER_ADMIN.FEE_STRUCTURES },
        { title: '🧠 Smart Rules', path: ROUTES.SUPER_ADMIN.FEE_RULES },
        { title: '📝 Fees Type', path: ROUTES.SUPER_ADMIN.FEES_TYPE },
        { title: '⚡ Quick Fees', path: ROUTES.SUPER_ADMIN.QUICK_FEES },
        // ── Fee Management ──
        { title: '── Fee Management ──', path: '#fees-management', disabled: true },
        { title: '🔍 Search Fees Payment', path: ROUTES.SUPER_ADMIN.SEARCH_FEES_PAYMENT },
        { title: '⚠️ Search Due Fees', path: ROUTES.SUPER_ADMIN.SEARCH_DUE_FEES },
        { title: '🏷️ Fees Discount', path: ROUTES.SUPER_ADMIN.FEES_DISCOUNT },
        // ── Reports & Utilities ──
        { title: '── Reports & Utilities ──', path: '#fees-reports', disabled: true },
        { title: '📈 Fees Analysis', path: ROUTES.SUPER_ADMIN.FEES_ANALYSIS },
        { title: '🔄 Fees Carry Forward', path: ROUTES.SUPER_ADMIN.FEES_CARRY_FORWARD },
        { title: '📧 Fees Reminder', path: ROUTES.SUPER_ADMIN.FEES_REMINDER },
        { title: '↩️ Refund Approvals', path: ROUTES.SUPER_ADMIN.REFUND_APPROVALS },
        { title: '🧾 Receipt Templates', path: ROUTES.SUPER_ADMIN.RECEIPT_TEMPLATES },
      ],
    },
    {
      title: 'Income',
      icon: IndianRupee,
      submenu: [
         // ── Income Management ──
         { title: '── Income Management ──', path: '#income-mgmt', disabled: true },
         { title: '💰 Income', path: ROUTES.SUPER_ADMIN.INCOME },
         { title: '➕ Add Income', path: ROUTES.SUPER_ADMIN.ADD_INCOME },
         { title: '📂 Income Head', path: ROUTES.SUPER_ADMIN.INCOME_HEAD },
      ]
    },
    {
      title: 'Expenses',
      icon: IndianRupee,
      submenu: [
         // ── Expense Management ──
         { title: '── Expense Management ──', path: '#expense-mgmt', disabled: true },
         { title: '💸 Expense', path: ROUTES.SUPER_ADMIN.EXPENSE },
         { title: '➕ Add Expense', path: ROUTES.SUPER_ADMIN.ADD_EXPENSE },
         { title: '📂 Expense Head', path: ROUTES.SUPER_ADMIN.EXPENSE_HEAD },
      ]
    },
    {
      title: 'Attendance',
      icon: Calendar,
      submenu: [
        // ── Manual Attendance ──
        { title: '── Manual Attendance ──', path: '#att-manual', disabled: true },
        { title: '👨‍🎓 Student Attendance', path: ROUTES.SUPER_ADMIN.STUDENT_ATTENDANCE },
        { title: '📅 Attendance By Date', path: ROUTES.SUPER_ADMIN.ATTENDANCE_BY_DATE },
        { title: '✅ Approve Leave', path: ROUTES.SUPER_ADMIN.APPROVE_LEAVE },
        { title: '👨‍💼 Staff Attendance', path: ROUTES.SUPER_ADMIN.STAFF_ATTENDANCE },
        { title: '📊 Attendance Report', path: ROUTES.SUPER_ADMIN.ATTENDANCE_REPORT },
        // ── Smart Attendance ──
        { title: '── Smart Attendance ──', path: '#att-smart', disabled: true },
        { title: '📊 Live Dashboard', path: ROUTES.SUPER_ADMIN.LIVE_ATTENDANCE_DASHBOARD },
        { title: '📱 QR Code Generator', path: ROUTES.SUPER_ADMIN.QR_CODE_GENERATOR },
        { title: '🔌 Device Management', path: ROUTES.SUPER_ADMIN.DEVICE_MANAGEMENT },
        { title: '💳 Card Management', path: ROUTES.SUPER_ADMIN.CARD_MANAGEMENT },
        { title: '👤 Face Registration', path: ROUTES.SUPER_ADMIN.FACE_REGISTRATION },
        { title: '🤖 Live Face Attendance', path: ROUTES.SUPER_ADMIN.LIVE_FACE_ATTENDANCE },
        { title: '📹 AI Camera Management', path: ROUTES.SUPER_ADMIN.AI_CAMERA_MANAGEMENT },
        { title: '🧠 FAISS Index Management', path: ROUTES.SUPER_ADMIN.FAISS_INDEX_MANAGEMENT },
        { title: '🛡️ Spoof Alerts', path: ROUTES.SUPER_ADMIN.SPOOF_ALERTS },
        // ── Face Analytics ──
        { title: '── Face Analytics ──', path: '#att-face-analytics', disabled: true },
        { title: '📊 Face Analytics Dashboard', path: ROUTES.SUPER_ADMIN.FACE_ATTENDANCE_DASHBOARD },
        { title: '🔥 Recognition Heatmap', path: ROUTES.SUPER_ADMIN.ATTENDANCE_HEATMAP },
        { title: '⏰ Late Arrivals', path: ROUTES.SUPER_ADMIN.LATE_ARRIVAL_TRACKING },
        { title: '👁️ Unknown Faces', path: ROUTES.SUPER_ADMIN.UNKNOWN_FACE_MANAGEMENT },
        { title: '📄 Attendance Reports', path: ROUTES.SUPER_ADMIN.FACE_ATTENDANCE_REPORTS },
        // ── Settings & Tools ──
        { title: '── Settings & Tools ──', path: '#att-settings', disabled: true },
        { title: '🔔 Notification Settings', path: ROUTES.SUPER_ADMIN.ATTENDANCE_NOTIFICATION_SETTINGS },
        { title: '🧪 System Test Dashboard', path: ROUTES.SUPER_ADMIN.FACE_ATTENDANCE_TEST_DASHBOARD },
        { title: '📖 Help & Documentation', path: ROUTES.SUPER_ADMIN.FACE_ATTENDANCE_HELP },
        { title: '🎛️ Admin Settings', path: ROUTES.SUPER_ADMIN.FACE_ATTENDANCE_ADMIN_SETTINGS },
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
        // ── Foundation & Setup ──
        { title: '── Foundation & Setup ──', path: '#exam-foundation', disabled: true },
        { title: '🏫 Board Configuration', path: ROUTES.SUPER_ADMIN.BOARD_CONFIGURATION },
        { title: '📆 Term Management', path: ROUTES.SUPER_ADMIN.TERM_MANAGEMENT },
        { title: '📝 Exam Type Master', path: ROUTES.SUPER_ADMIN.EXAM_TYPE_MASTER },
        { title: '⚖️ Grade Scale Builder', path: ROUTES.SUPER_ADMIN.GRADE_SCALE_BUILDER },
        { title: '📂 Exam Group Setup', path: ROUTES.SUPER_ADMIN.EXAM_GROUP_MANAGEMENT },
        // ── Exam Planning ──
        { title: '── Exam Planning ──', path: '#exam-planning', disabled: true },
        { title: '📋 Exam Management', path: ROUTES.SUPER_ADMIN.EXAM_MANAGEMENT },
        { title: '👥 Student Assignment', path: ROUTES.SUPER_ADMIN.STUDENT_ASSIGNMENT },
        // ── Scheduling & Logistics ──
        { title: '── Scheduling & Logistics ──', path: '#exam-scheduling', disabled: true },
        { title: '🏛️ Room Management', path: ROUTES.SUPER_ADMIN.ROOM_MANAGEMENT },
        { title: '👨‍🏫 Invigilator Duty', path: ROUTES.SUPER_ADMIN.INVIGILATOR_DUTY },
        { title: '💺 Seating Arrangement', path: ROUTES.SUPER_ADMIN.SEATING_ARRANGEMENT },
        { title: '📅 Exam Calendar', path: ROUTES.SUPER_ADMIN.EXAM_CALENDAR },
        // ── Evaluation Engine ──
        { title: '── Evaluation Engine ──', path: '#exam-evaluation', disabled: true },
        { title: '✍️ Marks Entry (New)', path: ROUTES.SUPER_ADMIN.MARKS_ENTRY_NEW },
        { title: '📊 Internal Assessment', path: ROUTES.SUPER_ADMIN.INTERNAL_ASSESSMENT },
        { title: '🧪 Practical Marks', path: ROUTES.SUPER_ADMIN.PRACTICAL_MARKS },
        { title: '📤 Bulk Upload', path: ROUTES.SUPER_ADMIN.BULK_UPLOAD_MARKS },
        // ── Results & Moderation ──
        { title: '── Results & Moderation ──', path: '#exam-results', disabled: true },
        { title: '🎁 Grace Marks', path: ROUTES.SUPER_ADMIN.GRACE_MARKS },
        { title: '⚖️ Moderation Engine', path: ROUTES.SUPER_ADMIN.MODERATION_ENGINE },
        { title: '📋 Result Calculation', path: ROUTES.SUPER_ADMIN.RESULT_CALCULATION },
        { title: '🏆 Rank Generation', path: ROUTES.SUPER_ADMIN.RANK_GENERATION },
        // ── Documents & Print ──
        { title: '── Documents & Print ──', path: '#exam-documents', disabled: true },
        { title: '🪪 Admit Card Designer', path: ROUTES.SUPER_ADMIN.ADMIT_CARD_DESIGNER },
        { title: '📜 Marksheet Designer', path: ROUTES.SUPER_ADMIN.MARKSHEET_DESIGNER },
        { title: '📁 Report Card Designer', path: ROUTES.SUPER_ADMIN.REPORT_CARD_DESIGNER },
        { title: '🖨️ Bulk Document Generator', path: ROUTES.SUPER_ADMIN.BULK_DOCUMENT_GENERATOR },
        // ── Analytics & Online ──
        { title: '── Analytics & Online ──', path: '#exam-analytics', disabled: true },
        { title: '📊 Performance Dashboard', path: ROUTES.SUPER_ADMIN.PERFORMANCE_DASHBOARD },
        { title: '📚 Question Bank', path: ROUTES.SUPER_ADMIN.QUESTION_BANK },
        { title: '💻 Online Exam', path: ROUTES.SUPER_ADMIN.ONLINE_EXAM },
        // ── Advanced Configuration ──
        { title: '── Advanced Configuration ──', path: '#exam-advanced', disabled: true },
        { title: '🏅 Division Config', path: ROUTES.SUPER_ADMIN.DIVISION_CONFIG },
        { title: '⚖️ Subject Weightage', path: ROUTES.SUPER_ADMIN.SUBJECT_WEIGHTAGE },
        { title: '📐 Assessment Pattern', path: ROUTES.SUPER_ADMIN.ASSESSMENT_PATTERN },
        { title: '🔗 Exam Linking', path: ROUTES.SUPER_ADMIN.EXAM_LINKING },
        { title: '📝 Question Blueprint', path: ROUTES.SUPER_ADMIN.QUESTION_BLUEPRINT },
        // ── Verification & Revaluation ──
        { title: '── Verification & Revaluation ──', path: '#exam-verification', disabled: true },
        { title: '✅ Verification Dashboard', path: ROUTES.SUPER_ADMIN.VERIFICATION_DASHBOARD },
        { title: '📩 Revaluation Request', path: ROUTES.SUPER_ADMIN.REVALUATION_REQUEST },
        { title: '🔄 Revaluation Process', path: ROUTES.SUPER_ADMIN.REVALUATION_PROCESS },
        { title: '📦 Exam Archive', path: ROUTES.SUPER_ADMIN.EXAM_ARCHIVE },
        { title: '📋 Compliance Reports', path: ROUTES.SUPER_ADMIN.COMPLIANCE_REPORTS },
      ],
    },
    {
      title: 'Lesson Plan',
      icon: BookOpen,
      submenu: [
        // ── Homework ──
        { title: '── Homework ──', path: '#lp-homework', disabled: true },
        { title: '➕ Add Homework', path: ROUTES.SUPER_ADMIN.ADD_HOMEWORK },
        { title: '📝 Homework List', path: ROUTES.SUPER_ADMIN.HOMEWORK },
        { title: '✅ Evaluate Homework', path: ROUTES.SUPER_ADMIN.EVALUATE_HOMEWORK },
        // ── Lessons & Syllabus ──
        { title: '── Lessons & Syllabus ──', path: '#lp-lessons', disabled: true },
        { title: '📖 Manage Lessons', path: ROUTES.SUPER_ADMIN.MANAGE_LESSONS },
        { title: '📊 Syllabus Status', path: ROUTES.SUPER_ADMIN.SYLLABUS_STATUS },
      ]
    },
    {
      title: 'Academics',
      icon: GraduationCap,
      submenu: [
        // ── Dashboard ──
        { title: '📊 Dashboard', path: ROUTES.SUPER_ADMIN.ACADEMIC_DASHBOARD },
        { title: '🧠 Intelligence Hub', path: ROUTES.SUPER_ADMIN.ACADEMIC_HUB },
        // ── Setup & Structure ──
        { title: '── Setup & Structure ──', path: '#academics-setup', disabled: true },
        { title: '⚙️ Academic Setup', path: ROUTES.SUPER_ADMIN.ACADEMIC_SETUP },
        { title: '🏫 Class', path: ROUTES.SUPER_ADMIN.CLASSES },
        { title: '📋 Sections', path: ROUTES.SUPER_ADMIN.SECTIONS },
        { title: '📖 Subjects', path: ROUTES.SUPER_ADMIN.SUBJECTS },
        { title: '📁 Subject Groups', path: ROUTES.SUPER_ADMIN.SUBJECT_GROUP },
        // ── Teacher Management ──
        { title: '── Teacher Management ──', path: '#academics-teachers', disabled: true },
        { title: '👨‍🏫 Subject Teacher', path: ROUTES.SUPER_ADMIN.SUBJECT_TEACHER },
        { title: '👩‍🏫 Class Teacher', path: ROUTES.SUPER_ADMIN.CLASS_TEACHER },
        { title: '✅ Assign Class Teacher', path: ROUTES.SUPER_ADMIN.ASSIGN_CLASS_TEACHER },
        { title: '👥 Teacher Workload', path: ROUTES.SUPER_ADMIN.TEACHER_WORKLOAD },
        // ── Timetable ──
        { title: '── Timetable ──', path: '#academics-timetable', disabled: true },
        { title: '📅 Enhanced Timetable', path: ROUTES.SUPER_ADMIN.ENHANCED_TIMETABLE },
        { title: '📅 Class Timetable', path: ROUTES.SUPER_ADMIN.CLASS_TIMETABLE },
        { title: '🕒 Teachers Timetable', path: ROUTES.SUPER_ADMIN.TEACHER_TIMETABLE },
        // ── Curriculum & Teaching ──
        { title: '── Curriculum & Teaching ──', path: '#academics-curriculum', disabled: true },
        { title: '📚 Curriculum Master', path: ROUTES.SUPER_ADMIN.CURRICULUM_MASTER },
        { title: '🎯 Learning Outcomes', path: ROUTES.SUPER_ADMIN.LEARNING_OUTCOMES },
        { title: '📝 Lesson Plans', path: ROUTES.SUPER_ADMIN.LESSON_PLANS },
        { title: '📋 Syllabus Progress', path: ROUTES.SUPER_ADMIN.SYLLABUS_PROGRESS },
        { title: '📚 Study Materials', path: ROUTES.SUPER_ADMIN.STUDY_MATERIALS },
        // ── Homework & Activities ──
        { title: '── Homework & Activities ──', path: '#academics-activities', disabled: true },
        { title: '📝 Enhanced Homework', path: ROUTES.SUPER_ADMIN.ENHANCED_HOMEWORK },
        { title: '📖 Class Activities', path: ROUTES.SUPER_ADMIN.CLASS_ACTIVITIES },
        { title: '🏅 Competency Badges', path: ROUTES.SUPER_ADMIN.COMPETENCY_BADGES },
        // ── Student ──
        { title: '── Student ──', path: '#academics-student', disabled: true },
        { title: '⬆️ Promote Students', path: ROUTES.SUPER_ADMIN.PROMOTE_STUDENT },
        // ── Analytics & Reports ──
        { title: '── Analytics & Reports ──', path: '#academics-analytics', disabled: true },
        { title: '📊 Academic Analytics', path: ROUTES.SUPER_ADMIN.ACADEMIC_ANALYTICS },
        { title: '📊 Academic Analysis', path: ROUTES.SUPER_ADMIN.ACADEMIC_ANALYSIS },
        { title: '🤖 AI Insights', path: ROUTES.SUPER_ADMIN.AI_ACADEMIC_INSIGHTS },
        { title: '📊 Reports Engine', path: ROUTES.SUPER_ADMIN.REPORTS_ENGINE },
      ],
    },
     {
      title: 'Human Resource',
      icon: Briefcase,
      submenu: [
        // ── Dashboard ──
        { title: '📊 HR Dashboard', path: ROUTES.SUPER_ADMIN.HR_DASHBOARD },
        // ── Staff Management ──
        { title: '── Staff Management ──', path: '#hr-staff', disabled: true },
        { title: '👥 Staff Directory', path: ROUTES.SUPER_ADMIN.STAFF_DIRECTORY },
        { title: '➕ Add Staff', path: ROUTES.SUPER_ADMIN.ADD_EMPLOYEE },
        { title: '🏛️ Department', path: ROUTES.SUPER_ADMIN.DEPARTMENTS },
        { title: '📍 Designation', path: ROUTES.SUPER_ADMIN.DESIGNATIONS },
        { title: '⚙️ Employee Form Settings', path: ROUTES.SUPER_ADMIN.EMPLOYEE_FORM_SETTINGS },
        { title: '📊 Performance', path: ROUTES.SUPER_ADMIN.EMPLOYEE_PERFORMANCE },
        { title: '📄 Documents', path: ROUTES.SUPER_ADMIN.EMPLOYEE_DOCUMENTS },
        { title: '🪪 Staff ID Card', path: ROUTES.SUPER_ADMIN.HR_STAFF_ID_CARD },
        // ── Recruitment ──
        { title: '── Recruitment ──', path: '#hr-recruitment', disabled: true },
        { title: '📢 Job Postings', path: ROUTES.SUPER_ADMIN.HR_JOB_POSTINGS },
        { title: '📋 Applications', path: ROUTES.SUPER_ADMIN.HR_APPLICATIONS },
        { title: '🗓️ Interviews', path: ROUTES.SUPER_ADMIN.HR_INTERVIEWS },
        // ── Onboarding ──
        { title: '── Onboarding ──', path: '#hr-onboarding', disabled: true },
        { title: '✅ Checklists', path: ROUTES.SUPER_ADMIN.HR_ONBOARDING_CHECKLISTS },
        { title: '👤 Employee Onboarding', path: ROUTES.SUPER_ADMIN.HR_ONBOARDING_EMPLOYEE },
        // ── Leave Management ──
        { title: '── Leave Management ──', path: '#hr-leave', disabled: true },
        { title: '✅ Approve Leave Request', path: ROUTES.SUPER_ADMIN.APPROVE_STAFF_LEAVE },
        { title: '📝 Apply Leave', path: ROUTES.SUPER_ADMIN.STAFF_APPLY_LEAVE },
        { title: '🏷️ Leave Type', path: ROUTES.SUPER_ADMIN.STAFF_LEAVE_TYPE },
        { title: '💳 Leave Balances', path: ROUTES.SUPER_ADMIN.HR_LEAVE_BALANCES },
        { title: '📜 Leave Policies', path: ROUTES.SUPER_ADMIN.HR_LEAVE_POLICIES },
        { title: '📆 Leave Calendar', path: ROUTES.SUPER_ADMIN.HR_LEAVE_CALENDAR },
        // ── Payroll System ──
        { title: '── Payroll System ──', path: '#hr-payroll', disabled: true },
        { title: '🏗️ Salary Structure', path: ROUTES.SUPER_ADMIN.HR_SALARY_STRUCTURE },
        { title: '▶️ Payroll Run', path: ROUTES.SUPER_ADMIN.HR_PAYROLL_RUN },
        { title: '📃 Payslips', path: ROUTES.SUPER_ADMIN.HR_PAYSLIPS },
        { title: '💰 Loans Management', path: ROUTES.SUPER_ADMIN.HR_LOANS },
      ],
    },
    {
      title: 'Task Management',
      icon: CheckSquare,
      submenu: [
        // ── Tasks ──
        { title: '── Tasks ──', path: '#task-tasks', disabled: true },
        { title: '📊 Dashboard', path: ROUTES.SUPER_ADMIN.TASK_DASHBOARD },
        { title: '📋 All Tasks', path: ROUTES.SUPER_ADMIN.TASK_ALL },
        { title: '👤 My Tasks', path: ROUTES.SUPER_ADMIN.TASK_MY },
        { title: '➕ Create Task', path: ROUTES.SUPER_ADMIN.TASK_CREATE },
        // ── Configuration ──
        { title: '── Configuration ──', path: '#task-config', disabled: true },
        { title: '🏷️ Categories', path: ROUTES.SUPER_ADMIN.TASK_CATEGORIES },
        { title: '⚡ Priorities', path: ROUTES.SUPER_ADMIN.TASK_PRIORITIES },
        // ── AI & Reports ──
        { title: '── AI & Reports ──', path: '#task-ai', disabled: true },
        { title: '🧠 AI Generator', path: '/super-admin/task-management/ai-generator' },
        { title: '⚙️ Automation', path: '/super-admin/task-management/automation-rules' },
        { title: '📈 Reports', path: '/super-admin/task-management/reports' },
      ],
    },
     {
      title: 'Communicate',
      icon: MessageSquare,
      submenu: [
        // ── Messaging ──
        { title: '── Messaging ──', path: '#comm-messaging', disabled: true },
        { title: '📋 Notice Board', path: ROUTES.SUPER_ADMIN.NOTICE_BOARD },
        { title: '📧 Send Email', path: ROUTES.SUPER_ADMIN.SEND_EMAIL },
        { title: '📱 Send SMS', path: ROUTES.SUPER_ADMIN.SEND_SMS },
        { title: '💬 WhatsApp', path: ROUTES.SUPER_ADMIN.WHATSAPP },
        { title: '🔔 Push Notification', path: ROUTES.SUPER_ADMIN.PUSH_NOTIFICATION },
        // ── Logs ──
        { title: '── Logs ──', path: '#comm-logs', disabled: true },
        { title: '📂 Email / SMS Log', path: ROUTES.SUPER_ADMIN.EMAIL_SMS_LOG },
      ],
    },
    {
      title: 'Online Course',
      icon: MonitorPlay,
      submenu: [
        // ── Course & Payment ──
        { title: '── Course & Payment ──', path: '#oc-course', disabled: true },
        { title: '📺 Online Course', path: ROUTES.SUPER_ADMIN.ONLINE_COURSE },
        { title: '💳 Offline Payment', path: ROUTES.SUPER_ADMIN.OFFLINE_PAYMENT },
        // ── Reports & Settings ──
        { title: '── Reports & Settings ──', path: '#oc-reports', disabled: true },
        { title: '📊 Online Course Report', path: ROUTES.SUPER_ADMIN.ONLINE_COURSE_REPORT },
        { title: '⚙️ Setting', path: ROUTES.SUPER_ADMIN.ONLINE_COURSE_SETTING },
      ]
    },
    {
      title: 'Gmeet Live Classes',
      icon: Video,
      submenu: [
        // ── Classes & Meetings ──
        { title: '── Classes & Meetings ──', path: '#gmeet-classes', disabled: true },
        { title: '🎥 Live Classes', path: ROUTES.SUPER_ADMIN.LIVE_CLASSES },
        { title: '👥 Live Meeting', path: ROUTES.SUPER_ADMIN.LIVE_MEETING },
        // ── Reports & Settings ──
        { title: '── Reports & Settings ──', path: '#gmeet-reports', disabled: true },
        { title: '📊 Live Classes Report', path: ROUTES.SUPER_ADMIN.LIVE_CLASSES_REPORT },
        { title: '📊 Live Meeting Report', path: ROUTES.SUPER_ADMIN.LIVE_MEETING_REPORT },
        { title: '⚙️ Setting', path: ROUTES.SUPER_ADMIN.GMEET_SETTING },
      ]
    },
    {
      title: 'Library',
      icon: Library,
      submenu: [
        // ── Books ──
        { title: '── Books ──', path: '#lib-books', disabled: true },
        { title: '📚 Book List', path: ROUTES.SUPER_ADMIN.LIBRARY_BOOK_LIST },
        { title: '➕ Add Book', path: ROUTES.SUPER_ADMIN.LIBRARY_ADD_BOOK },
        { title: '📖 Books', path: ROUTES.SUPER_ADMIN.LIBRARY_BOOKS },
        // ── Issue & Members ──
        { title: '── Issue & Members ──', path: '#lib-issue', disabled: true },
        { title: '📤 Book Issued', path: ROUTES.SUPER_ADMIN.LIBRARY_BOOK_ISSUED },
        { title: '👥 Book Members', path: ROUTES.SUPER_ADMIN.LIBRARY_MEMBERS },
        { title: '🔄 Issue/Return', path: ROUTES.SUPER_ADMIN.LIBRARY_ISSUE_RETURN },
        { title: '🪪 Library Card', path: ROUTES.SUPER_ADMIN.LIBRARY_CARD },
      ],
    },
    {
      title: 'Inventory',
      icon: Package,
      submenu: [
        // ── Stock Management ──
        { title: '── Stock Management ──', path: '#inv-stock', disabled: true },
        { title: '📤 Issue Item', path: ROUTES.SUPER_ADMIN.INV_ISSUE_ITEM },
        { title: '➕ Add Item Stock', path: ROUTES.SUPER_ADMIN.INV_ADD_STOCK },
        { title: '📦 Item Stock', path: ROUTES.SUPER_ADMIN.INV_ITEM_STOCK },
        // ── Master Data ──
        { title: '── Master Data ──', path: '#inv-master', disabled: true },
        { title: '📦 Add Item', path: ROUTES.SUPER_ADMIN.INV_ADD_ITEM },
        { title: '🏷️ Item Category', path: ROUTES.SUPER_ADMIN.INV_CATEGORY },
        { title: '🏬 Item Store', path: ROUTES.SUPER_ADMIN.INV_STORE },
        { title: '💳 Item Supplier', path: ROUTES.SUPER_ADMIN.INV_SUPPLIER },
      ],
    },
    {
      title: 'Transport',
      icon: Bus,
      submenu: [
        // ── Dashboard & Setup ──
        { title: '── Dashboard & Setup ──', path: '#tr-dashboard', disabled: true },
        { title: '🚌 Dashboard', path: ROUTES.SUPER_ADMIN.TRANSPORT_DASHBOARD },
        { title: '💰 Fees Master', path: ROUTES.SUPER_ADMIN.TRANSPORT_FEES_MASTER },
        { title: '📍 Pickup Points', path: ROUTES.SUPER_ADMIN.PICKUP_POINTS },
        { title: '🚌 Routes', path: ROUTES.SUPER_ADMIN.TRANSPORT_ROUTES },
        { title: '🚗 Vehicles', path: ROUTES.SUPER_ADMIN.TRANSPORT_VEHICLES },
        { title: '👨‍✈️ Drivers', path: ROUTES.SUPER_ADMIN.TRANSPORT_DRIVERS },
        // ── Assignment & Fees ──
        { title: '── Assignment & Fees ──', path: '#tr-assignment', disabled: true },
        { title: '📝 Assign Vehicle', path: ROUTES.SUPER_ADMIN.ASSIGN_VEHICLE },
        { title: '🚏 Route Pickup Points', path: ROUTES.SUPER_ADMIN.ROUTE_PICKUP_POINT },
        { title: '💳 Student Transport Fees', path: ROUTES.SUPER_ADMIN.STUDENT_TRANSPORT_FEES },
        // ── Operations ──
        { title: '── Operations ──', path: '#tr-operations', disabled: true },
        { title: '📊 Transport Analysis', path: ROUTES.SUPER_ADMIN.TRANSPORT_ANALYSIS },
        { title: '📋 Trip Management', path: ROUTES.SUPER_ADMIN.TRANSPORT_TRIPS },
        { title: '🚌 Boarding Attendance', path: ROUTES.SUPER_ADMIN.TRANSPORT_BOARDING },
        { title: '🔧 Vehicle Maintenance', path: ROUTES.SUPER_ADMIN.TRANSPORT_MAINTENANCE },
        { title: '⛽ Fuel Management', path: ROUTES.SUPER_ADMIN.TRANSPORT_FUEL },
        { title: '⚠️ Incident Management', path: ROUTES.SUPER_ADMIN.TRANSPORT_INCIDENTS },
        // ── Tracking & Safety ──
        { title: '── Tracking & Safety ──', path: '#tr-tracking', disabled: true },
        { title: '📍 Live Tracking', path: ROUTES.SUPER_ADMIN.TRANSPORT_LIVE_TRACKING },
        { title: '🛡️ Geofencing', path: ROUTES.SUPER_ADMIN.TRANSPORT_GEOFENCING },
        { title: '🔔 Notification Settings', path: ROUTES.SUPER_ADMIN.TRANSPORT_NOTIFICATIONS },
        { title: '🆘 SOS Alerts', path: ROUTES.SUPER_ADMIN.TRANSPORT_SOS },
        { title: '📋 Vehicle Checklist', path: ROUTES.SUPER_ADMIN.TRANSPORT_CHECKLIST },
        // ── Communication & Reports ──
        { title: '── Communication & Reports ──', path: '#tr-reports', disabled: true },
        { title: '💬 Communication', path: ROUTES.SUPER_ADMIN.TRANSPORT_COMMUNICATION },
        { title: '📊 Reports', path: ROUTES.SUPER_ADMIN.TRANSPORT_REPORTS },
        { title: '🪪 ID Cards', path: ROUTES.SUPER_ADMIN.TRANSPORT_ID_CARDS },
      ],
    },
    {
      title: 'Hostel',
      icon: Building,
      submenu: [
        // ── Room & Setup ──
        { title: '── Room & Setup ──', path: '#hostel-setup', disabled: true },
        { title: '🛏️ Hostel Rooms', path: ROUTES.SUPER_ADMIN.HOSTEL_ROOMS },
        { title: '🛋 Room Type', path: ROUTES.SUPER_ADMIN.ROOM_TYPES },
        { title: '🏨 Hostel', path: ROUTES.SUPER_ADMIN.HOSTELS },
        { title: '💰 Hostel Fee', path: ROUTES.SUPER_ADMIN.HOSTEL_FEE },
        { title: '📊 Hostel Analysis', path: ROUTES.SUPER_ADMIN.HOSTEL_ANALYSIS },
        // ── Attendance ──
        { title: '── Attendance ──', path: '#hostel-attendance', disabled: true },
        { title: '📋 Attendance', path: ROUTES.SUPER_ADMIN.HOSTEL_ATTENDANCE },
        { title: '✅ Mark Attendance', path: ROUTES.SUPER_ADMIN.HOSTEL_MARK_ATTENDANCE },
        { title: '🌙 Night Roll Call', path: ROUTES.SUPER_ADMIN.HOSTEL_NIGHT_ROLL_CALL },
        { title: '📱 QR Attendance', path: ROUTES.SUPER_ADMIN.HOSTEL_QR_ATTENDANCE },
        { title: '⏰ Curfew Settings', path: ROUTES.SUPER_ADMIN.HOSTEL_CURFEW_SETTINGS },
        { title: '📊 Attendance Report', path: ROUTES.SUPER_ADMIN.HOSTEL_ATTENDANCE_REPORT },
        { title: '🚨 Curfew Violations', path: ROUTES.SUPER_ADMIN.HOSTEL_CURFEW_VIOLATIONS },
        // ── Visitor Management ──
        { title: '── Visitor Management ──', path: '#hostel-visitors', disabled: true },
        { title: '🚪 Visitor Log', path: ROUTES.SUPER_ADMIN.HOSTEL_VISITOR_MANAGEMENT },
        { title: '👤 Register Visitor', path: ROUTES.SUPER_ADMIN.HOSTEL_REGISTER_VISITOR },
        { title: '🟢 In-Premises', path: ROUTES.SUPER_ADMIN.HOSTEL_IN_PREMISES_VISITORS },
        { title: '⏳ Visitor Approvals', path: ROUTES.SUPER_ADMIN.HOSTEL_VISITOR_APPROVALS },
        { title: '🔒 Visitor Restrictions', path: ROUTES.SUPER_ADMIN.HOSTEL_VISITOR_RESTRICTIONS },
        { title: '🚫 Visitor Blacklist', path: ROUTES.SUPER_ADMIN.HOSTEL_VISITOR_BLACKLIST },
        // ── Mess Management ──
        { title: '── Mess Management ──', path: '#hostel-mess', disabled: true },
        { title: '🍽️ Mess Dashboard', path: ROUTES.SUPER_ADMIN.HOSTEL_MESS_MANAGEMENT },
        { title: '📅 Weekly Menu', path: ROUTES.SUPER_ADMIN.HOSTEL_WEEKLY_MENU },
        { title: '☕ Today Menu', path: ROUTES.SUPER_ADMIN.HOSTEL_TODAY_MENU },
        { title: '🍽 Mess Attendance', path: ROUTES.SUPER_ADMIN.HOSTEL_MESS_ATTENDANCE },
        { title: '💬 Mess Feedback', path: ROUTES.SUPER_ADMIN.HOSTEL_MESS_FEEDBACK },
        { title: '📦 Mess Inventory', path: ROUTES.SUPER_ADMIN.HOSTEL_MESS_INVENTORY },
        // ── Complaints & Assets ──
        { title: '── Complaints & Assets ──', path: '#hostel-complaints', disabled: true },
        { title: '📢 Complaints', path: ROUTES.SUPER_ADMIN.HOSTEL_COMPLAINTS },
        { title: '📊 Complaint Analytics', path: ROUTES.SUPER_ADMIN.HOSTEL_COMPLAINT_ANALYTICS },
        { title: '🏗️ Assets', path: ROUTES.SUPER_ADMIN.HOSTEL_ASSETS },
        { title: '📊 Asset Report', path: ROUTES.SUPER_ADMIN.HOSTEL_ASSET_REPORT },
        // ── Leave & Room Change ──
        { title: '── Leave & Room Change ──', path: '#hostel-leave', disabled: true },
        { title: '🏠 Leave Management', path: ROUTES.SUPER_ADMIN.HOSTEL_LEAVE },
        { title: '✅ Leave Approvals', path: ROUTES.SUPER_ADMIN.HOSTEL_LEAVE_APPROVALS },
        { title: '📋 On Leave Today', path: ROUTES.SUPER_ADMIN.HOSTEL_ON_LEAVE_TODAY },
        { title: '🔄 Room Change', path: ROUTES.SUPER_ADMIN.HOSTEL_ROOM_CHANGE },
        // ── Security & Safety ──
        { title: '── Security & Safety ──', path: '#hostel-security', disabled: true },
        { title: '🛡️ Security Dashboard', path: ROUTES.SUPER_ADMIN.HOSTEL_SECURITY_DASHBOARD },
        { title: '🚨 Security Alerts', path: ROUTES.SUPER_ADMIN.HOSTEL_ALERTS_LIST },
        { title: '🆘 SOS Alerts', path: ROUTES.SUPER_ADMIN.HOSTEL_SOS_ALERTS },
        { title: '⏰ Curfew Monitor', path: ROUTES.SUPER_ADMIN.HOSTEL_CURFEW_MONITOR },
        { title: '🔒 Girls Safety', path: ROUTES.SUPER_ADMIN.HOSTEL_GIRLS_HOSTEL_SAFETY },
        // ── AI & Analytics ──
        { title: '── AI & Analytics ──', path: '#hostel-ai', disabled: true },
        { title: '🤖 AI Insights', path: ROUTES.SUPER_ADMIN.HOSTEL_AI_INSIGHTS },
        { title: '📈 Occupancy Prediction', path: ROUTES.SUPER_ADMIN.HOSTEL_OCCUPANCY_PREDICTION },
        { title: '⚠️ Attendance Anomalies', path: ROUTES.SUPER_ADMIN.HOSTEL_ATTENDANCE_ANOMALIES },
        { title: '🔍 Complaint Analysis AI', path: ROUTES.SUPER_ADMIN.HOSTEL_COMPLAINT_ANALYSIS_AI },
        { title: '👪 Parent Portal', path: ROUTES.SUPER_ADMIN.HOSTEL_PARENT_DASHBOARD },
      ],
    },
    {
      title: 'Certificate',
      icon: Award,
      submenu: [
        // ── Student Certificates ──
        { title: '── Student Certificates ──', path: '#cert-student', disabled: true },
        { title: '🏆 Student Certificate', path: ROUTES.SUPER_ADMIN.CERT_STUDENT },
        { title: '📜 Generate Certificate', path: ROUTES.SUPER_ADMIN.CERT_GENERATE },
        { title: '🪪 Student ID Card', path: ROUTES.SUPER_ADMIN.CERT_STUDENT_ID },
        { title: '📝 Generate ID Card', path: ROUTES.SUPER_ADMIN.CERT_GENERATE_ID },
        // ── Staff ID Cards ──
        { title: '── Staff ID Cards ──', path: '#cert-staff', disabled: true },
        { title: '👨‍💼 Staff ID Card', path: ROUTES.SUPER_ADMIN.CERT_STAFF_ID },
        { title: '📝 Generate Staff ID Card', path: ROUTES.SUPER_ADMIN.CERT_GENERATE_STAFF_ID },
      ]
    },
    {
      title: 'Front CMS',
      icon: Layout,
      submenu: [
        // ── Settings ──
        { title: '── Settings ──', path: '#cms-settings', disabled: true },
        { title: '⚙️ Website Settings', path: ROUTES.SUPER_ADMIN.CMS_SETTING },
        { title: '🔐 Branch Login Settings', path: ROUTES.SUPER_ADMIN.FRONT_CMS_LOGIN_SETTINGS },
        // ── Content ──
        { title: '── Content ──', path: '#cms-content', disabled: true },
        { title: '📄 Menus', path: ROUTES.SUPER_ADMIN.MENUS },
        { title: '📃 Pages', path: ROUTES.SUPER_ADMIN.PAGES },
        { title: '🎉 Events', path: ROUTES.SUPER_ADMIN.EVENTS },
        { title: '🖼️ Gallery', path: ROUTES.SUPER_ADMIN.GALLERY },
        { title: '📰 News', path: ROUTES.SUPER_ADMIN.NEWS },
        // ── Media & Showcase ──
        { title: '── Media & Showcase ──', path: '#cms-media', disabled: true },
        { title: '💾 Media Manager', path: ROUTES.SUPER_ADMIN.MEDIA_MANAGER },
        { title: '🏆 Achievements', path: ROUTES.SUPER_ADMIN.FRONT_CMS_ACHIEVEMENTS },
        { title: '🖼️ Banner Images', path: ROUTES.SUPER_ADMIN.BANNER_IMAGES },
      ]
    },
    {
      title: 'Alumni',
      icon: GraduationCap,
      submenu: [
        // ── Alumni Management ──
        { title: '── Alumni Management ──', path: '#alumni-mgmt', disabled: true },
        { title: '👥 Alumni List', path: ROUTES.SUPER_ADMIN.ALUMNI_LIST },
        { title: '🎉 Alumni Events', path: ROUTES.SUPER_ADMIN.ALUMNI_EVENTS },
      ]
    },
    {
      title: 'QR Code Attendance',
      icon: QrCode,
      submenu: [
        // ── QR Attendance ──
        { title: '── QR Attendance ──', path: '#qr-att', disabled: true },
        { title: '⚙️ Setting', path: ROUTES.SUPER_ADMIN.QR_ATTENDANCE_SETTING },
        { title: '📷 Scan', path: ROUTES.SUPER_ADMIN.QR_ATTENDANCE_SCAN },
      ]
    },
    {
      title: 'Multi Branch',
      icon: GitBranch,
      submenu: [
        // ── Branch Management ──
        { title: '── Branch Management ──', path: '#mb-mgmt', disabled: true },
        { title: ' Branch List', path: ROUTES.SUPER_ADMIN.BRANCH_LIST },
        { title: '➕ Add Branch', path: ROUTES.SUPER_ADMIN.ADD_BRANCH },
        { title: '⚙️ Branch Settings', path: ROUTES.SUPER_ADMIN.MULTI_BRANCH_SETTINGS },
        { title: '📊 Branch Reports', path: ROUTES.SUPER_ADMIN.MULTI_BRANCH_REPORTS },
      ]
    },
    {
      title: 'Zoom Live Classes',
      icon: Video,
      submenu: [
        // ── Classes & Meetings ──
        { title: '── Classes & Meetings ──', path: '#zoom-classes', disabled: true },
        { title: '🎥 Zoom Classes', path: ROUTES.SUPER_ADMIN.ZOOM_CLASSES },
        { title: '👥 Zoom Meeting', path: ROUTES.SUPER_ADMIN.ZOOM_MEETING },
        // ── Reports & Settings ──
        { title: '── Reports & Settings ──', path: '#zoom-reports', disabled: true },
        { title: '📊 Zoom Reports', path: ROUTES.SUPER_ADMIN.ZOOM_REPORTS },
        { title: '⚙️ Zoom Settings', path: ROUTES.SUPER_ADMIN.ZOOM_SETTINGS },
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
          // ── Dashboard & Scheduling ──
          { title: '── Dashboard & Scheduling ──', path: '#rpt-dashboard', disabled: true },
          { title: '📊 Dashboard', path: ROUTES.SUPER_ADMIN.REPORTS_DASHBOARD },
          { title: '📅 Scheduled Reports', path: ROUTES.SUPER_ADMIN.REPORTS_SCHEDULES },
          { title: '📜 Report History', path: ROUTES.SUPER_ADMIN.REPORTS_HISTORY },
          // ── Module Reports ──
          { title: '── Module Reports ──', path: '#rpt-modules', disabled: true },
          { title: '👨‍🎓 Student Information', path: ROUTES.SUPER_ADMIN.REPORTS_STUDENT_INFO },
          { title: '💰 Finance', path: ROUTES.SUPER_ADMIN.REPORTS_FINANCE },
          { title: '✅ Attendance', path: ROUTES.SUPER_ADMIN.REPORTS_ATTENDANCE },
          { title: '📝 Examinations', path: ROUTES.SUPER_ADMIN.REPORTS_EXAMINATIONS },
          { title: '👥 Human Resource', path: ROUTES.SUPER_ADMIN.REPORTS_HR },
          { title: '📚 Library', path: ROUTES.SUPER_ADMIN.REPORTS_LIBRARY },
          { title: '🚌 Transport', path: ROUTES.SUPER_ADMIN.REPORTS_TRANSPORT },
          { title: '🏨 Hostel', path: ROUTES.SUPER_ADMIN.REPORTS_HOSTEL },
          { title: '💳 Fees Reports', path: ROUTES.SUPER_ADMIN.REPORTS_FEES },
          { title: '📓 Homework', path: ROUTES.SUPER_ADMIN.REPORTS_HOMEWORK },
          { title: '✅ Homework Evaluation', path: ROUTES.SUPER_ADMIN.REPORTS_HOMEWORK_EVALUATION },
          { title: '💻 Online Exam Reports', path: ROUTES.SUPER_ADMIN.REPORTS_ONLINE_EXAM },
          // ── Custom ──
          { title: '── Custom ──', path: '#rpt-custom', disabled: true },
          { title: '🛠️ Custom Builder', path: ROUTES.SUPER_ADMIN.REPORTS_CUSTOM_BUILDER },
      ]
    },
    {
      title: 'User Management',
      icon: KeyRound,
      badge: 'NEW',
      submenu: [
        // ── Overview ──
        { title: '── Overview ──', path: '#um-overview', disabled: true },
        { title: '📊 Dashboard', path: ROUTES.SUPER_ADMIN.USER_MGMT_DASHBOARD },
        { title: '👥 All Users', path: ROUTES.SUPER_ADMIN.USER_MGMT_ALL_USERS },
        // ── User Types ──
        { title: '── User Types ──', path: '#um-types', disabled: true },
        { title: '👨‍🎓 Student Users', path: ROUTES.SUPER_ADMIN.USER_MGMT_STUDENTS },
        { title: '👨‍💼 Staff Users', path: ROUTES.SUPER_ADMIN.USER_MGMT_STAFF },
        { title: '👨‍👩‍👧 Parent Users', path: ROUTES.SUPER_ADMIN.USER_MGMT_PARENTS },
        // ── Transfer ──
        { title: '── Transfer ──', path: '#um-transfer', disabled: true },
        { title: '🔄 Transfer Staff', path: ROUTES.SUPER_ADMIN.USER_MGMT_TRANSFER_STAFF },
      ]
    },
    {
      title: 'System Settings',
      icon: Settings,
      submenu: [
        // ── General ──
        { title: '── General ──', path: '#ss-general', disabled: true },
        { title: '⚙️ General Setting', path: ROUTES.SUPER_ADMIN.SETTINGS_GENERAL },
        { title: '📅 Session Setting', path: ROUTES.SUPER_ADMIN.SETTINGS_SESSION },
        { title: '🔐 Roles Permissions', path: ROUTES.SUPER_ADMIN.SETTINGS_ROLE_PERMISSION },
        { title: '🖨️ Print Header Footer', path: ROUTES.SUPER_ADMIN.SETTINGS_PRINT_HEADER },
        // ── Communication ──
        { title: '── Communication ──', path: '#ss-comm', disabled: true },
        { title: '📧 Email Setting', path: ROUTES.SUPER_ADMIN.SETTINGS_EMAIL },
        { title: '📱 SMS Setting', path: ROUTES.SUPER_ADMIN.SETTINGS_SMS },
        { title: '🔔 Notification Setting', path: ROUTES.SUPER_ADMIN.SETTINGS_NOTIFICATION },
        // ── Payment & Backup ──
        { title: '── Payment & Backup ──', path: '#ss-payment', disabled: true },
        { title: '💳 Payment Gateway', path: ROUTES.SUPER_ADMIN.SETTINGS_PAYMENT_GATEWAY },
        { title: '💾 Backup & Restore', path: ROUTES.SUPER_ADMIN.SETTINGS_BACKUP },
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
        { title: '📓 Homework', path: ROUTES.STUDENT.HOMEWORK },
        { title: '📚 Syllabus', path: ROUTES.STUDENT.SYLLABUS },
      ]
    },
    {
      title: 'Examinations',
      icon: FileText,
      submenu: [
        { title: '📅 Exam Schedule', path: ROUTES.STUDENT.EXAM_SCHEDULE },
        { title: '📊 Exam Result', path: ROUTES.STUDENT.EXAM_RESULT },
      ]
    },
    {
      title: 'Attendance',
      icon: CheckSquare,
      submenu: [
        { title: '✅ My Attendance', path: ROUTES.STUDENT.ATTENDANCE },
        { title: '📝 Apply Leave', path: ROUTES.STUDENT.APPLY_LEAVE },
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
        { title: '👨‍🎓 Student Details', path: ROUTES.PRINCIPAL.STUDENT_DETAILS },
        { title: '📝 Student Admission', path: ROUTES.PRINCIPAL.STUDENT_ADMISSION },
        { title: '🌐 Online Admission', path: ROUTES.PRINCIPAL.ONLINE_ADMISSION_LIST },
        { title: '🚫 Disabled Students', path: ROUTES.PRINCIPAL.DISABLED_STUDENTS },
      ]
    },
    {
      title: 'Human Resource',
      icon: Briefcase,
      submenu: [
        { title: '👥 Staff Directory', path: ROUTES.PRINCIPAL.STAFF_DIRECTORY },
        { title: '🏛️ Department', path: ROUTES.PRINCIPAL.DEPARTMENTS },
        { title: '📍 Designation', path: ROUTES.PRINCIPAL.DESIGNATIONS },
        { title: '📅 Leave Management', path: ROUTES.PRINCIPAL.LEAVE_MANAGEMENT },
        { title: '✅ Approve Leave Request', path: ROUTES.PRINCIPAL.APPROVE_STAFF_LEAVE },
      ]
    },
    {
      title: 'Attendance',
      icon: Calendar,
      submenu: [
        { title: '👨‍🎓 Student Attendance', path: ROUTES.PRINCIPAL.STUDENT_ATTENDANCE },
        { title: '👨‍💼 Staff Attendance', path: ROUTES.PRINCIPAL.STAFF_ATTENDANCE },
        { title: '✅ Approve Leave', path: ROUTES.PRINCIPAL.APPROVE_LEAVE },
        { title: '📊 Attendance Report', path: ROUTES.PRINCIPAL.ATTENDANCE_REPORT },
      ]
    },
    {
      title: 'Academics',
      icon: GraduationCap,
      submenu: [
        { title: '🏫 Class', path: ROUTES.PRINCIPAL.CLASSES },
        { title: '📋 Sections', path: ROUTES.PRINCIPAL.SECTIONS },
        { title: '📅 Class Timetable', path: ROUTES.PRINCIPAL.CLASS_TIMETABLE },
        { title: '👩‍🏫 Teacher Timetable', path: ROUTES.PRINCIPAL.TEACHER_TIMETABLE },
        { title: '✅ Assign Class Teacher', path: ROUTES.PRINCIPAL.ASSIGN_CLASS_TEACHER },
        { title: '👨‍🏫 Subject Teacher', path: ROUTES.PRINCIPAL.SUBJECT_TEACHER },
      ]
    },
    {
      title: 'Examinations',
      icon: FileText,
      submenu: [
        { title: '� Exam Groups', path: ROUTES.SUPER_ADMIN.EXAM_GROUP_MANAGEMENT },
        { title: '📅 Exam Calendar', path: ROUTES.SUPER_ADMIN.EXAM_CALENDAR },
        { title: '✍️ Marks Entry', path: ROUTES.SUPER_ADMIN.MARKS_ENTRY_NEW },
        { title: '📋 Results', path: ROUTES.SUPER_ADMIN.RESULT_CALCULATION },
        { title: '📁 Report Card', path: ROUTES.SUPER_ADMIN.REPORT_CARD_DESIGNER },
      ]
    },
    {
      title: 'Behaviour Records',
      icon: AlertTriangle,
      submenu: [
        { title: '📌 Assign Incident', path: ROUTES.PRINCIPAL.ASSIGN_INCIDENT },
        { title: '⚠️ Incidents', path: ROUTES.PRINCIPAL.INCIDENTS },
        { title: '📊 Reports', path: ROUTES.PRINCIPAL.BEHAVIOUR_REPORTS },
      ]
    },
    {
      title: 'Communicate',
      icon: MessageSquare,
      submenu: [
        { title: '📋 Notice Board', path: ROUTES.PRINCIPAL.NOTICE_BOARD },
        { title: '📧 Send Email', path: ROUTES.PRINCIPAL.SEND_EMAIL },
        { title: '📱 Send SMS', path: ROUTES.PRINCIPAL.SEND_SMS },
      ]
    },
    {
      title: 'Fees Collection',
      icon: CreditCard,
      submenu: [
        { title: '🔍 Search Fees Payment', path: ROUTES.PRINCIPAL.SEARCH_FEES_PAYMENT },
        { title: '📄 Search Due Fees', path: ROUTES.PRINCIPAL.SEARCH_DUE_FEES },
        { title: '🔔 Fees Reminder', path: ROUTES.PRINCIPAL.FEES_REMINDER },
      ]
    },
    {
      title: 'Reports',
      icon: BarChart3,
      submenu: [
        { title: '👨‍🎓 Student Information', path: ROUTES.PRINCIPAL.REPORT_STUDENT_INFO },
        { title: '✅ Attendance', path: ROUTES.PRINCIPAL.ATTENDANCE_REPORT },
        { title: '📝 Examinations', path: ROUTES.PRINCIPAL.GENERAL_EXAM_RESULT },
        { title: '👥 Human Resource', path: ROUTES.PRINCIPAL.REPORT_PAYROLL },
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
        { title: '📊 Fee Dashboard', path: ROUTES.ACCOUNTANT.FEE_DASHBOARD, badge: 'NEW' },
        { title: 'Offline Bank Payments', path: ROUTES.ACCOUNTANT.OFFLINE_PAYMENT },
        { title: 'Online Payment', path: ROUTES.ACCOUNTANT.ONLINE_PAYMENT },
        { title: 'Search Fees Payment', path: ROUTES.ACCOUNTANT.SEARCH_FEES_PAYMENT },
        { title: 'Search Due Fees', path: ROUTES.ACCOUNTANT.SEARCH_DUE_FEES },
        { title: '🏗️ Fee Structures', path: ROUTES.ACCOUNTANT.FEE_STRUCTURES },
        { title: '🧠 Smart Rules', path: ROUTES.ACCOUNTANT.FEE_RULES },
        { title: 'Fees Type', path: ROUTES.ACCOUNTANT.FEES_TYPE },
        { title: 'Fees Discount', path: ROUTES.ACCOUNTANT.FEES_DISCOUNT },
        { title: 'Fees Reminder', path: ROUTES.ACCOUNTANT.FEES_REMINDER },
        { title: '── Advanced Setup ──', path: '#accountant-fees-advanced-setup', disabled: true },
        { title: '📋 Fee Templates', path: ROUTES.ACCOUNTANT.FEE_TEMPLATES, badge: 'NEW' },
        { title: '👨‍👩‍👧 Sibling Groups', path: ROUTES.ACCOUNTANT.SIBLING_GROUPS, badge: 'NEW' },
        { title: '⏰ Late Fee Slabs', path: ROUTES.ACCOUNTANT.LATE_FEE_SLABS, badge: 'NEW' },
        { title: '── Discount & EMI ──', path: '#accountant-fees-discount-emi', disabled: true },
        { title: '🎫 Concession Requests', path: ROUTES.ACCOUNTANT.CONCESSION_REQUESTS, badge: 'NEW' },
        { title: '📅 Installment Plans', path: ROUTES.ACCOUNTANT.INSTALLMENT_PLANS, badge: 'NEW' },
        { title: '💳 Payment Schedule', path: ROUTES.ACCOUNTANT.PAYMENT_SCHEDULE, badge: 'NEW' },
        { title: '🗓️ Fee Calendar', path: ROUTES.ACCOUNTANT.FEE_CALENDAR, badge: 'NEW' },
      ]
    },
    {
      title: 'Income',
      icon: IndianRupee,
      submenu: [
        { title: '💰 Income', path: ROUTES.ACCOUNTANT.INCOME },
        { title: '➕ Add Income', path: ROUTES.ACCOUNTANT.ADD_INCOME },
        { title: '📂 Income Head', path: ROUTES.ACCOUNTANT.INCOME_HEAD },
      ]
    },
    {
      title: 'Expenses',
      icon: IndianRupee,
      submenu: [
        { title: '💸 Expense', path: ROUTES.ACCOUNTANT.EXPENSE },
        { title: '➕ Add Expense', path: ROUTES.ACCOUNTANT.ADD_EXPENSE },
        { title: '📂 Expense Head', path: ROUTES.ACCOUNTANT.EXPENSE_HEAD },
      ]
    },
    { title: 'Student Details', icon: Users, path: ROUTES.ACCOUNTANT.STUDENT_DETAILS },
    { title: 'Payroll', icon: Briefcase, path: ROUTES.ACCOUNTANT.EMPLOYEE_PAYROLL },
    {
      title: 'Reports',
      icon: FileText,
      submenu: [
        { title: '💰 Income Report', path: ROUTES.ACCOUNTANT.REPORT_INCOME },
        { title: '💸 Expense Report', path: ROUTES.ACCOUNTANT.REPORT_EXPENSE },
        { title: '⚖️ Income/Expense Balance', path: ROUTES.ACCOUNTANT.REPORT_INC_EXP_BALANCE },
        { title: '📅 Daily Collection', path: ROUTES.ACCOUNTANT.REPORT_DAILY_COLLECTION },
        { title: '💳 Fees Collection', path: ROUTES.ACCOUNTANT.REPORT_FEES_COLLECTION },
        { title: '📜 Fees Statement', path: ROUTES.ACCOUNTANT.REPORT_FEES_STATEMENT },
        { title: '📄 Balance Fees', path: ROUTES.ACCOUNTANT.REPORT_BALANCE_FEES },
        { title: '💰 Payroll Report', path: ROUTES.ACCOUNTANT.REPORT_PAYROLL },
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
        { title: '📝 Admission Enquiry', path: ROUTES.RECEPTIONIST.ADMISSION_ENQUIRY },
        { title: '📖 Visitor Book', path: ROUTES.RECEPTIONIST.VISITOR_BOOK },
        { title: '📞 Phone Call Log', path: ROUTES.RECEPTIONIST.PHONE_CALL_LOG },
        { title: '📤 Postal Dispatch', path: ROUTES.RECEPTIONIST.POSTAL_DISPATCH },
        { title: '📥 Postal Receive', path: ROUTES.RECEPTIONIST.POSTAL_RECEIVE },
        { title: '⚠️ Complain', path: ROUTES.RECEPTIONIST.COMPLAIN },
        { title: '⚙️ Setup Front Office', path: ROUTES.RECEPTIONIST.SETUP_FRONT_OFFICE },
      ]
    },
    {
      title: 'Student Information',
      icon: Users,
      submenu: [
        { title: '👨‍🎓 Student Details', path: ROUTES.RECEPTIONIST.STUDENT_DETAILS },
        { title: '📝 Student Admission', path: ROUTES.RECEPTIONIST.STUDENT_ADMISSION },
        { title: '🌐 Online Admission', path: ROUTES.RECEPTIONIST.ONLINE_ADMISSION_LIST },
      ]
    },
    {
      title: 'Communicate',
      icon: MessageSquare,
      submenu: [
        { title: '📋 Notice Board', path: ROUTES.RECEPTIONIST.NOTICE_BOARD },
        { title: '📱 Send SMS', path: ROUTES.RECEPTIONIST.SEND_SMS },
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
        { title: '👨‍🎓 Student Details', path: ROUTES.TEACHER.STUDENT_DETAILS },
      ]
    },
    {
      title: 'Attendance',
      icon: CheckSquare,
      submenu: [
        { title: '✅ Student Attendance', path: ROUTES.TEACHER.STUDENT_ATTENDANCE },
        { title: '📅 Attendance By Date', path: ROUTES.TEACHER.ATTENDANCE_BY_DATE },
      ]
    },
    {
      title: 'Lesson Plan',
      icon: BookOpen,
      submenu: [
        { title: '➕ Add Homework', path: ROUTES.TEACHER.ADD_HOMEWORK },
        { title: '📝 Homework List', path: ROUTES.TEACHER.HOMEWORK },
        { title: '✅ Evaluate Homework', path: ROUTES.TEACHER.EVALUATE_HOMEWORK },
        { title: '📖 Manage Lessons', path: ROUTES.TEACHER.MANAGE_LESSONS },
        { title: '📊 Syllabus Status', path: ROUTES.TEACHER.SYLLABUS_STATUS },
      ]
    },
    {
      title: 'Examinations',
      icon: GraduationCap,
      submenu: [
        { title: '📅 Exam Calendar', path: ROUTES.SUPER_ADMIN.EXAM_CALENDAR },
        { title: '✍️ Marks Entry', path: ROUTES.SUPER_ADMIN.MARKS_ENTRY_NEW },
        { title: '📋 Results', path: ROUTES.SUPER_ADMIN.RESULT_CALCULATION },
      ]
    },
    {
      title: 'Behaviour Records',
      icon: AlertTriangle,
      submenu: [
        { title: '📌 Assign Incident', path: ROUTES.TEACHER.ASSIGN_INCIDENT },
        { title: '⚠️ Incidents', path: ROUTES.TEACHER.INCIDENTS },
      ]
    },
    {
      title: 'Live Classes',
      icon: Video,
      submenu: [
        { title: '🎥 Live Classes', path: ROUTES.TEACHER.LIVE_CLASSES },
        { title: '👥 Live Meeting', path: ROUTES.TEACHER.LIVE_MEETING },
      ]
    },
    { title: 'Online Course', icon: MonitorPlay, path: ROUTES.TEACHER.ONLINE_COURSE },
    { title: 'Notice Board', icon: MessageSquare, path: ROUTES.TEACHER.NOTICE_BOARD },
    {
      title: 'Leave',
      icon: Calendar,
      submenu: [
        { title: '📝 Apply Leave', path: ROUTES.TEACHER.STAFF_APPLY_LEAVE },
        { title: '📅 Leave Management', path: ROUTES.TEACHER.LEAVE_MANAGEMENT },
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
        { title: '📚 Book List', path: ROUTES.LIBRARIAN.LIBRARY_BOOK_LIST },
        { title: '🔄 Issue/Return', path: ROUTES.LIBRARIAN.LIBRARY_ISSUE_RETURN },
        { title: '➕ Add Book', path: ROUTES.LIBRARIAN.LIBRARY_ADD_BOOK },
        { title: '📤 Book Issued', path: ROUTES.LIBRARIAN.LIBRARY_BOOK_ISSUED },
        { title: '👥 Library Members', path: ROUTES.LIBRARIAN.LIBRARY_MEMBERS },
        { title: '🪪 Library Card', path: ROUTES.LIBRARIAN.LIBRARY_CARD },
      ]
    },
    {
      title: 'Reports',
      icon: FileText,
      submenu: [
        { title: '📊 Book Issue Report', path: ROUTES.LIBRARIAN.REPORT_LIB_BOOK_ISSUE },
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
        { title: '👨‍🎓 Student Details', path: ROUTES.VICE_PRINCIPAL.STUDENT_DETAILS },
        { title: '📝 Student Admission', path: ROUTES.VICE_PRINCIPAL.STUDENT_ADMISSION },
        { title: '🚫 Disabled Students', path: ROUTES.VICE_PRINCIPAL.DISABLED_STUDENTS },
      ]
    },
    {
      title: 'Human Resource',
      icon: Briefcase,
      submenu: [
        { title: '👥 Staff Directory', path: ROUTES.VICE_PRINCIPAL.STAFF_DIRECTORY },
        { title: '🏛️ Department', path: ROUTES.VICE_PRINCIPAL.DEPARTMENTS },
        { title: '✅ Approve Leave Request', path: ROUTES.VICE_PRINCIPAL.APPROVE_STAFF_LEAVE },
      ]
    },
    {
      title: 'Attendance',
      icon: Calendar,
      submenu: [
        { title: '👨‍🎓 Student Attendance', path: ROUTES.VICE_PRINCIPAL.STUDENT_ATTENDANCE },
        { title: '👨‍💼 Staff Attendance', path: ROUTES.VICE_PRINCIPAL.STAFF_ATTENDANCE },
        { title: '✅ Approve Leave', path: ROUTES.VICE_PRINCIPAL.APPROVE_LEAVE },
        { title: '📊 Attendance Report', path: ROUTES.VICE_PRINCIPAL.ATTENDANCE_REPORT },
      ]
    },
    {
      title: 'Academics',
      icon: GraduationCap,
      submenu: [
        { title: '🏫 Class', path: ROUTES.VICE_PRINCIPAL.CLASSES },
        { title: '📋 Sections', path: ROUTES.VICE_PRINCIPAL.SECTIONS },
        { title: '📅 Class Timetable', path: ROUTES.VICE_PRINCIPAL.CLASS_TIMETABLE },
        { title: '👩‍🏫 Teacher Timetable', path: ROUTES.VICE_PRINCIPAL.TEACHER_TIMETABLE },
        { title: '✅ Assign Class Teacher', path: ROUTES.VICE_PRINCIPAL.ASSIGN_CLASS_TEACHER },
      ]
    },
    {
      title: 'Examinations',
      icon: FileText,
      submenu: [
        { title: '📚 Exam Group', path: ROUTES.SUPER_ADMIN.EXAM_GROUP_MANAGEMENT },
        { title: '📅 Exam Schedule', path: ROUTES.SUPER_ADMIN.EXAM_CALENDAR },
        { title: '📊 Exam Result', path: ROUTES.SUPER_ADMIN.RESULT_CALCULATION },
        { title: '📝 Marks Entry', path: ROUTES.SUPER_ADMIN.MARKS_ENTRY_NEW },
        { title: '👤 Report Card', path: ROUTES.SUPER_ADMIN.REPORT_CARD_DESIGNER },
      ]
    },
    {
      title: 'Behaviour Records',
      icon: AlertTriangle,
      submenu: [
        { title: '📌 Assign Incident', path: ROUTES.VICE_PRINCIPAL.ASSIGN_INCIDENT },
        { title: '⚠️ Incidents', path: ROUTES.VICE_PRINCIPAL.INCIDENTS },
        { title: '📊 Reports', path: ROUTES.VICE_PRINCIPAL.BEHAVIOUR_REPORTS },
      ]
    },
    {
      title: 'Communicate',
      icon: MessageSquare,
      submenu: [
        { title: '📋 Notice Board', path: ROUTES.VICE_PRINCIPAL.NOTICE_BOARD },
        { title: '📧 Send Email', path: ROUTES.VICE_PRINCIPAL.SEND_EMAIL },
        { title: '📱 Send SMS', path: ROUTES.VICE_PRINCIPAL.SEND_SMS },
      ]
    },
    {
      title: 'Fees (View)',
      icon: CreditCard,
      submenu: [
        { title: '🔍 Search Fees Payment', path: ROUTES.VICE_PRINCIPAL.SEARCH_FEES_PAYMENT },
        { title: '📄 Search Due Fees', path: ROUTES.VICE_PRINCIPAL.SEARCH_DUE_FEES },
      ]
    },
    {
      title: 'Reports',
      icon: BarChart3,
      submenu: [
        { title: '👨‍🎓 Student Information', path: ROUTES.VICE_PRINCIPAL.REPORT_STUDENT_INFO },
        { title: '✅ Attendance', path: ROUTES.VICE_PRINCIPAL.ATTENDANCE_REPORT },
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
        { title: '🏫 Class', path: ROUTES.COORDINATOR.CLASSES },
        { title: '📋 Sections', path: ROUTES.COORDINATOR.SECTIONS },
        { title: '📖 Subjects', path: ROUTES.COORDINATOR.SUBJECTS },
        { title: '📅 Class Timetable', path: ROUTES.COORDINATOR.CLASS_TIMETABLE },
        { title: '👩‍🏫 Teacher Timetable', path: ROUTES.COORDINATOR.TEACHER_TIMETABLE },
      ]
    },
    {
      title: 'Attendance',
      icon: Calendar,
      submenu: [
        { title: '👨‍🎓 Student Attendance', path: ROUTES.COORDINATOR.STUDENT_ATTENDANCE },
        { title: '📊 Attendance Report', path: ROUTES.COORDINATOR.ATTENDANCE_REPORT },
      ]
    },
    {
      title: 'Examinations',
      icon: FileText,
      submenu: [
        { title: '📅 Exam Schedule', path: ROUTES.SUPER_ADMIN.EXAM_CALENDAR },
        { title: '📊 Exam Result', path: ROUTES.SUPER_ADMIN.RESULT_CALCULATION },
        { title: '📝 Marks Entry', path: ROUTES.SUPER_ADMIN.MARKS_ENTRY_NEW },
        { title: '👤 Report Card', path: ROUTES.SUPER_ADMIN.REPORT_CARD_DESIGNER },
      ]
    },
    {
      title: 'Lesson Plan',
      icon: BookOpen,
      submenu: [
        { title: '➕ Add Homework', path: ROUTES.COORDINATOR.ADD_HOMEWORK },
        { title: '📝 Homework List', path: ROUTES.COORDINATOR.HOMEWORK },
        { title: '📖 Manage Lessons', path: ROUTES.COORDINATOR.MANAGE_LESSONS },
        { title: '📊 Syllabus Status', path: ROUTES.COORDINATOR.SYLLABUS_STATUS },
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
        { title: '✅ Student Attendance', path: ROUTES.CLASS_TEACHER.STUDENT_ATTENDANCE },
        { title: '📅 Attendance By Date', path: ROUTES.CLASS_TEACHER.ATTENDANCE_BY_DATE },
        { title: '✅ Approve Student Leave', path: ROUTES.CLASS_TEACHER.APPROVE_LEAVE },
        { title: '📊 Attendance Report', path: ROUTES.CLASS_TEACHER.ATTENDANCE_REPORT },
      ]
    },
    {
      title: 'Lesson Plan',
      icon: BookOpen,
      submenu: [
        { title: '➕ Add Homework', path: ROUTES.CLASS_TEACHER.ADD_HOMEWORK },
        { title: '📝 Homework List', path: ROUTES.CLASS_TEACHER.HOMEWORK },
        { title: '✅ Evaluate Homework', path: ROUTES.CLASS_TEACHER.EVALUATE_HOMEWORK },
        { title: '📖 Manage Lessons', path: ROUTES.CLASS_TEACHER.MANAGE_LESSONS },
        { title: '📊 Syllabus Status', path: ROUTES.CLASS_TEACHER.SYLLABUS_STATUS },
      ]
    },
    {
      title: 'Examinations',
      icon: GraduationCap,
      submenu: [
        { title: '📅 Exam Schedule', path: ROUTES.SUPER_ADMIN.EXAM_CALENDAR },
        { title: '📝 Marks Entry', path: ROUTES.SUPER_ADMIN.MARKS_ENTRY_NEW },
        { title: '📊 Exam Result', path: ROUTES.SUPER_ADMIN.RESULT_CALCULATION },
        { title: '👤 Report Card', path: ROUTES.SUPER_ADMIN.REPORT_CARD_DESIGNER },
      ]
    },
    {
      title: 'Behaviour Records',
      icon: AlertTriangle,
      submenu: [
        { title: '📌 Assign Incident', path: ROUTES.CLASS_TEACHER.ASSIGN_INCIDENT },
        { title: '⚠️ Incidents', path: ROUTES.CLASS_TEACHER.INCIDENTS },
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
        { title: '✅ Student Attendance', path: ROUTES.SUBJECT_TEACHER.STUDENT_ATTENDANCE },
      ]
    },
    {
      title: 'Lesson Plan',
      icon: BookOpen,
      submenu: [
        { title: '➕ Add Homework', path: ROUTES.SUBJECT_TEACHER.ADD_HOMEWORK },
        { title: '📝 Homework List', path: ROUTES.SUBJECT_TEACHER.HOMEWORK },
      ]
    },
    {
      title: 'Examinations',
      icon: GraduationCap,
      submenu: [
        { title: '📅 Exam Schedule', path: ROUTES.SUPER_ADMIN.EXAM_CALENDAR },
        { title: '📝 Marks Entry', path: ROUTES.SUPER_ADMIN.MARKS_ENTRY_NEW },
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
        { title: '👨‍🎓 Student Details', path: ROUTES.CASHIER.STUDENT_DETAILS },
        { title: '📝 Student Admission', path: ROUTES.CASHIER.STUDENT_ADMISSION },
      ]
    },
    {
      title: 'Fees Collection',
      icon: CreditCard,
      submenu: [
        { title: 'Collect Fees', path: ROUTES.CASHIER.COLLECT_FEES },
        { title: '📊 Fee Dashboard', path: ROUTES.CASHIER.FEE_DASHBOARD, badge: 'NEW' },
        { title: 'Search Fees Payment', path: ROUTES.CASHIER.SEARCH_FEES_PAYMENT },
        { title: 'Search Due Fees', path: ROUTES.CASHIER.SEARCH_DUE_FEES },
        { title: 'Offline Bank Payments', path: ROUTES.CASHIER.OFFLINE_PAYMENT },
        { title: 'Online Payment', path: ROUTES.CASHIER.ONLINE_PAYMENT },
        { title: 'Quick Fees', path: ROUTES.CASHIER.QUICK_FEES },
        { title: '💳 Payment Schedule', path: ROUTES.CASHIER.PAYMENT_SCHEDULE, badge: 'NEW' },
        { title: '🗓️ Fee Calendar', path: ROUTES.CASHIER.FEE_CALENDAR, badge: 'NEW' },
      ]
    },
    {
      title: 'Finance',
      icon: Wallet,
      submenu: [
        { title: '💰 Income', path: ROUTES.CASHIER.INCOME },
        { title: '➕ Add Income', path: ROUTES.CASHIER.ADD_INCOME },
        { title: '🔍 Search Income', path: ROUTES.CASHIER.SEARCH_INCOME },
        { title: '💸 Expense', path: ROUTES.CASHIER.EXPENSE },
        { title: '➕ Add Expense', path: ROUTES.CASHIER.ADD_EXPENSE },
        { title: '🔍 Search Expense', path: ROUTES.CASHIER.SEARCH_EXPENSE },
      ]
    },
    {
      title: 'Reports',
      icon: FileText,
      submenu: [
        { title: '📅 Daily Collection', path: ROUTES.CASHIER.REPORT_DAILY_COLLECTION },
        { title: '💳 Fees Collection', path: ROUTES.CASHIER.REPORT_FEES_COLLECTION },
        { title: '📄 Balance Fees', path: ROUTES.CASHIER.REPORT_BALANCE_FEES },
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
        { title: '📤 Issue Item', path: ROUTES.LAB_ASSISTANT.INV_ISSUE_ITEM },
        { title: '📦 Item Stock', path: ROUTES.LAB_ASSISTANT.INV_ITEM_STOCK },
        { title: '➕ Add Stock', path: ROUTES.LAB_ASSISTANT.INV_ADD_STOCK },
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
        { title: '🏨 Hostels', path: ROUTES.HOSTEL_WARDEN.HOSTELS },
        { title: '🛏️ Hostel Rooms', path: ROUTES.HOSTEL_WARDEN.HOSTEL_ROOMS },
        { title: '🛌 Room Types', path: ROUTES.HOSTEL_WARDEN.ROOM_TYPES },
        { title: '💰 Hostel Fee', path: ROUTES.HOSTEL_WARDEN.HOSTEL_FEE },
        { title: '📊 Hostel Analysis', path: ROUTES.HOSTEL_WARDEN.HOSTEL_ANALYSIS },
        { title: '📋 Attendance', path: ROUTES.HOSTEL_WARDEN.HOSTEL_ATTENDANCE },
        { title: '✅ Mark Attendance', path: ROUTES.HOSTEL_WARDEN.HOSTEL_MARK_ATTENDANCE },
        { title: '🌙 Night Roll Call', path: ROUTES.HOSTEL_WARDEN.HOSTEL_NIGHT_ROLL_CALL },
        { title: '📱 QR Attendance', path: ROUTES.HOSTEL_WARDEN.HOSTEL_QR_ATTENDANCE },
        { title: '⏰ Curfew Settings', path: ROUTES.HOSTEL_WARDEN.HOSTEL_CURFEW_SETTINGS },
        { title: '📊 Attendance Report', path: ROUTES.HOSTEL_WARDEN.HOSTEL_ATTENDANCE_REPORT },
        { title: '🚨 Curfew Violations', path: ROUTES.HOSTEL_WARDEN.HOSTEL_CURFEW_VIOLATIONS },
        { title: '🚪 Visitor Log', path: ROUTES.HOSTEL_WARDEN.HOSTEL_VISITOR_MANAGEMENT },
        { title: '👤 Register Visitor', path: ROUTES.HOSTEL_WARDEN.HOSTEL_REGISTER_VISITOR },
        { title: '🟢 In-Premises', path: ROUTES.HOSTEL_WARDEN.HOSTEL_IN_PREMISES_VISITORS },
        { title: '⏳ Visitor Approvals', path: ROUTES.HOSTEL_WARDEN.HOSTEL_VISITOR_APPROVALS },
        { title: '🔒 Visitor Restrictions', path: ROUTES.HOSTEL_WARDEN.HOSTEL_VISITOR_RESTRICTIONS },
        { title: '🚫 Visitor Blacklist', path: ROUTES.HOSTEL_WARDEN.HOSTEL_VISITOR_BLACKLIST },
        { title: '🍽️ Mess Dashboard', path: ROUTES.HOSTEL_WARDEN.HOSTEL_MESS_MANAGEMENT },
        { title: '📅 Weekly Menu', path: ROUTES.HOSTEL_WARDEN.HOSTEL_WEEKLY_MENU },
        { title: '☕ Today Menu', path: ROUTES.HOSTEL_WARDEN.HOSTEL_TODAY_MENU },
        { title: '🍽 Mess Attendance', path: ROUTES.HOSTEL_WARDEN.HOSTEL_MESS_ATTENDANCE },
        { title: '💬 Mess Feedback', path: ROUTES.HOSTEL_WARDEN.HOSTEL_MESS_FEEDBACK },
        { title: '📦 Mess Inventory', path: ROUTES.HOSTEL_WARDEN.HOSTEL_MESS_INVENTORY },
        { title: '📢 Complaints', path: ROUTES.HOSTEL_WARDEN.HOSTEL_COMPLAINTS },
        { title: '📊 Complaint Analytics', path: ROUTES.HOSTEL_WARDEN.HOSTEL_COMPLAINT_ANALYTICS },
        { title: '🏗️ Assets', path: ROUTES.HOSTEL_WARDEN.HOSTEL_ASSETS },
        { title: '📊 Asset Report', path: ROUTES.HOSTEL_WARDEN.HOSTEL_ASSET_REPORT },
        { title: '🏠 Leave Management', path: ROUTES.HOSTEL_WARDEN.HOSTEL_LEAVE },
        { title: '✅ Leave Approvals', path: ROUTES.HOSTEL_WARDEN.HOSTEL_LEAVE_APPROVALS },
        { title: '📋 On Leave Today', path: ROUTES.HOSTEL_WARDEN.HOSTEL_ON_LEAVE_TODAY },
        { title: '🔄 Room Change', path: ROUTES.HOSTEL_WARDEN.HOSTEL_ROOM_CHANGE },
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
        { title: '🚌 Routes', path: ROUTES.DRIVER.TRANSPORT_ROUTES },
        { title: '🚗 Vehicles', path: ROUTES.DRIVER.TRANSPORT_VEHICLES },
        { title: '📍 Pickup Points', path: ROUTES.DRIVER.PICKUP_POINTS },
        { title: '🚏 Route Pickup Points', path: ROUTES.DRIVER.ROUTE_PICKUP_POINT },
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
        { title: '✅ Student Attendance', path: ROUTES.SPORTS_COACH.STUDENT_ATTENDANCE },
        { title: '📊 Attendance Report', path: ROUTES.SPORTS_COACH.ATTENDANCE_REPORT },
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
        { title: '📤 Issue Item', path: ROUTES.MAINTENANCE_STAFF.INV_ISSUE_ITEM },
        { title: '📦 Item Stock', path: ROUTES.MAINTENANCE_STAFF.INV_ITEM_STOCK },
        { title: '➕ Add Stock', path: ROUTES.MAINTENANCE_STAFF.INV_ADD_STOCK },
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
        { title: '👨‍👧 Child Fees', path: ROUTES.PARENT.FEES },
        { title: '💳 Pay Online', path: ROUTES.PARENT.PAY_ONLINE },
      ]
    },
    {
      title: 'Academics',
      icon: BookOpen,
      submenu: [
        { title: '📓 Homework', path: ROUTES.PARENT.HOMEWORK },
        { title: '📅 Class Timetable', path: ROUTES.PARENT.TIMETABLE },
      ]
    },
    {
      title: 'Examinations',
      icon: FileText,
      submenu: [
        { title: '📅 Exam Schedule', path: ROUTES.PARENT.EXAM_SCHEDULE },
        { title: '📊 Exam Results', path: ROUTES.PARENT.EXAM_RESULT },
      ]
    },
    {
      title: 'Attendance',
      icon: CheckSquare,
      submenu: [
        { title: '✅ Child Attendance', path: ROUTES.PARENT.ATTENDANCE },
        { title: '🤖 AI Face Attendance', path: ROUTES.PARENT.FACE_ATTENDANCE },
        { title: '📝 Apply Leave', path: ROUTES.PARENT.APPLY_LEAVE },
      ]
    },
    { title: 'Transport', icon: Bus, path: ROUTES.PARENT.TRANSPORT },
    { title: 'Hostel', icon: Building, path: ROUTES.PARENT.HOSTEL },
    { title: 'Notice Board', icon: MessageSquare, path: ROUTES.PARENT.NOTICE_BOARD },
  ],
};

