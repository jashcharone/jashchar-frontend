/**
 * MASTER MODULE CATALOG
 * 
 * This is the Single Source of Truth for all modules in the application.
 * It maps the Sidebar Title to the Internal Slug and defines Submodules.
 * 
 * Structure:
 * key: {
 *   label: "Display Name",
 *   slug: "internal_slug", // Matches DB module_slug
 *   submodules: [
 *     { label: "Sub Item Name", slug: "sub_slug" } // Full slug will be parent.sub
 *   ]
 * }
 */

export const MODULE_CATALOG = {
  // --- CORE MODULES ---
  dashboard: {
    label: "Dashboard",
    slug: "dashboard",
    submodules: []
  },
  front_office: {
    label: "Front Office",
    slug: "front_office",
    submodules: [
      { label: "Admission Enquiry", slug: "admission_enquiry" },
      { label: "Visitor Book", slug: "visitor_book" },
      { label: "Phone Call Log", slug: "phone_call_log" },
      { label: "Postal Dispatch", slug: "postal_dispatch" },
      { label: "Postal Receive", slug: "postal_receive" },
      { label: "Complain", slug: "complain" },
      { label: "Setup Front Office", slug: "setup_front_office" }
    ]
  },
  student_information: {
    label: "Student Information",
    slug: "student_information",
    submodules: [
      { label: "Student Admission", slug: "student_admission" },
      { label: "Admission Form Settings", slug: "admission_form_settings" },
      { label: "Student Details", slug: "student_details" },
      { label: "Online Admission", slug: "online_admission" },
      // student_categories and student_house are inside Admission Form Settings tabs
      { label: "Disabled Students", slug: "disabled_students" },
      { label: "Disable Reason", slug: "disable_reason" },
      { label: "Multi Class Student", slug: "multi_class_student" },
      { label: "Bulk Delete", slug: "bulk_delete" }
    ]
  },
  fees_collection: {
    label: "Fees Collection",
    slug: "fees_collection",
    submodules: [
      { label: "Collect Fees", slug: "collect_fees" },
      { label: "Search Fees Payment", slug: "search_fees_payment" },
      { label: "Search Due Fees", slug: "search_due_fees" },
      { label: "Fees Master", slug: "fees_master" },
      { label: "Fees Group", slug: "fees_group" },
      { label: "Fees Type", slug: "fees_type" },
      { label: "Fees Discount", slug: "fees_discount" },
      { label: "Fees Carry Forward", slug: "fees_carry_forward" },
      { label: "Fees Reminder", slug: "fees_reminder" }
    ]
  },
  finance: {
    label: "Finance", // Covers Income & Expenses
    slug: "finance",
    submodules: [
      { label: "Add Income", slug: "add_income" },
      { label: "Search Income", slug: "search_income" },
      { label: "Income Head", slug: "income_head" },
      { label: "Add Expense", slug: "add_expense" },
      { label: "Search Expense", slug: "search_expense" },
      { label: "Expense Head", slug: "expense_head" }
    ]
  },
  attendance: {
    label: "Attendance",
    slug: "attendance",
    submodules: [
      { label: "Student Attendance", slug: "student_attendance" },
      { label: "Attendance By Date", slug: "attendance_by_date" },
      { label: "Approve Leave", slug: "approve_leave" }
    ]
  },
  examinations: {
    label: "Examinations",
    slug: "examinations",
    submodules: [
      // Phase 1 - Foundation
      { label: "Board Configuration", slug: "board_configuration" },
      { label: "Term Management", slug: "term_management" },
      { label: "Exam Type Master", slug: "exam_type_master" },
      { label: "Grade Scale Builder", slug: "grade_scale_builder" },
      { label: "Exam Group Setup", slug: "exam_group_management" },
      // Phase 2 - Exam Planning
      { label: "Exam Management", slug: "exam_management" },
      { label: "Student Assignment", slug: "student_assignment" },
      // Phase 3 - Scheduling
      { label: "Room Management", slug: "room_management" },
      { label: "Invigilator Duty", slug: "invigilator_duty" },
      { label: "Seating Arrangement", slug: "seating_arrangement" },
      { label: "Exam Calendar", slug: "exam_calendar" },
      // Phase 4 - Evaluation
      { label: "Marks Entry", slug: "marks_entry_new" },
      { label: "Internal Assessment", slug: "internal_assessment" },
      { label: "Practical Marks", slug: "practical_marks" },
      { label: "Bulk Upload Marks", slug: "bulk_upload_marks" },
      // Phase 5 - Results
      { label: "Grace Marks", slug: "grace_marks" },
      { label: "Moderation Engine", slug: "moderation_engine" },
      { label: "Result Calculation", slug: "result_calculation" },
      { label: "Rank Generation", slug: "rank_generation" },
      // Phase 6 - Documents
      { label: "Admit Card Designer", slug: "admit_card_designer" },
      { label: "Marksheet Designer", slug: "marksheet_designer" },
      { label: "Report Card Designer", slug: "report_card_designer" },
      { label: "Bulk Document Generator", slug: "bulk_document_generator" },
      // Phase 7 - Analytics
      { label: "Performance Dashboard", slug: "performance_dashboard" },
      { label: "Question Bank", slug: "question_bank" },
      { label: "Online Exam", slug: "online_exam" }
    ]
  },
  online_examinations: {
    label: "Online Examinations",
    slug: "online_examinations",
    submodules: [
      { label: "Online Exam", slug: "online_exam" },
      { label: "Question Bank", slug: "question_bank" }
    ]
  },
  academics: {
    label: "Academics",
    slug: "academics",
    submodules: [
      { label: "Class Timetable", slug: "class_timetable" },
      { label: "Teachers Timetable", slug: "teachers_timetable" },
      { label: "Assign Class Teacher", slug: "assign_class_teacher" },
      { label: "Promote Students", slug: "promote_students" },
      { label: "Subject Group", slug: "subject_group" },
      { label: "Subjects", slug: "subjects" },
      { label: "Class", slug: "class" },
      { label: "Sections", slug: "sections" }
    ]
  },
  human_resource: {
    label: "Human Resource",
    slug: "human_resource",
    submodules: [
      { label: "Staff Directory", slug: "staff_directory" },
      { label: "Staff Attendance", slug: "staff_attendance" },
      { label: "Payroll", slug: "payroll" },
      { label: "Approve Leave Request", slug: "approve_leave_request" },
      { label: "Apply Leave", slug: "apply_leave" },
      { label: "Leave Type", slug: "leave_type" },
      { label: "Teachers Rating", slug: "teachers_rating" },
      { label: "Department", slug: "department" },
      { label: "Designation", slug: "designation" }
    ]
  },
  communicate: {
    label: "Communicate",
    slug: "communicate",
    submodules: [
      { label: "Notice Board", slug: "notice_board" },
      { label: "Send Email", slug: "send_email" },
      { label: "Send SMS", slug: "send_sms" },
      { label: "Email / SMS Log", slug: "email_sms_log" }
    ]
  },
  online_course: {
    label: "Online Course",
    slug: "online_course",
    submodules: [
      { label: "Online Course", slug: "course_list" },
      { label: "Offline Payment", slug: "offline_payment" },
      { label: "Report", slug: "report" },
      { label: "Setting", slug: "setting" }
    ]
  },
  gmeet_live_classes: {
    label: "Gmeet Live Classes",
    slug: "gmeet_live_classes",
    submodules: [
      { label: "Live Class", slug: "live_class" },
      { label: "Live Meeting", slug: "live_meeting" },
      { label: "Live Class Report", slug: "live_class_report" },
      { label: "Live Meeting Report", slug: "live_meeting_report" },
      { label: "Setting", slug: "setting" }
    ]
  },
  zoom_live: {
    label: "Zoom Live Classes",
    slug: "zoom_live",
    submodules: [
      { label: "Live Class", slug: "live_class" },
      { label: "Live Meeting", slug: "live_meeting" },
      { label: "Live Class Report", slug: "live_class_report" },
      { label: "Live Meeting Report", slug: "live_meeting_report" },
      { label: "Setting", slug: "setting" }
    ]
  },
  library: {
    label: "Library",
    slug: "library",
    submodules: [
      { label: "Book List", slug: "book_list" },
      { label: "Issue Return", slug: "issue_return" },
      { label: "Add Student", slug: "add_student" },
      { label: "Add Staff", slug: "add_staff" }
    ]
  },
  inventory: {
    label: "Inventory",
    slug: "inventory",
    submodules: [
      { label: "Issue Item", slug: "issue_item" },
      { label: "Add Item Stock", slug: "add_item_stock" },
      { label: "Add Item", slug: "add_item" },
      { label: "Item Category", slug: "item_category" },
      { label: "Item Store", slug: "item_store" },
      { label: "Item Supplier", slug: "item_supplier" }
    ]
  },
  transport: {
    label: "Transport",
    slug: "transport",
    submodules: [
      { label: "Routes", slug: "routes" },
      { label: "Vehicles", slug: "vehicles" },
      { label: "Pickup Points", slug: "pickup_points" },
      { label: "Route Pickup Points", slug: "route_pickup_point" },
      { label: "Assign Vehicle", slug: "assign_vehicle" },
      { label: "Student Transport Fees", slug: "student_transport_fees" },
      { label: "Transport Fee", slug: "transport_fee" },
      { label: "Transport Fees Master", slug: "transport_fees_master" }
    ]
  },
  hostel: {
    label: "Hostel",
    slug: "hostel",
    submodules: [
      { label: "Hostels", slug: "hostels" },
      { label: "Hostel Rooms", slug: "hostel_rooms" },
      { label: "Room Type", slug: "room_type" },
      { label: "Hostel Fee", slug: "hostel_fee" }
    ]
  },
  certificate: {
    label: "Certificate",
    slug: "certificate",
    submodules: [
      { label: "Student Certificate", slug: "student_certificate" },
      { label: "Generate Certificate", slug: "generate_certificate" },
      { label: "Student ID Card", slug: "student_id_card" },
      { label: "Generate ID Card", slug: "generate_id_card" },
      { label: "Staff ID Card", slug: "staff_id_card" },
      { label: "Generate Staff ID Card", slug: "generate_staff_id_card" }
    ]
  },
  front_cms: {
    label: "Front CMS",
    slug: "front_cms",
    submodules: [
      { label: "Website Settings", slug: "website_settings" },
      { label: "School Login Settings", slug: "login_settings" },
      { label: "Menus", slug: "menus" },
      { label: "Pages", slug: "pages" },
      { label: "Events", slug: "events" },
      { label: "Gallery", slug: "gallery" },
      { label: "News", slug: "news" },
      { label: "Media Manager", slug: "media_manager" },
      { label: "Banner Images", slug: "banner_images" }
    ]
  },
  reports: {
    label: "Reports",
    slug: "reports",
    submodules: [
      { label: "Student Information", slug: "student_information" },
      { label: "Finance Report", slug: "finance_report" },  // ? Changed from 'finance' to avoid duplicate
      { label: "Attendance", slug: "attendance" },
      { label: "Examinations", slug: "examinations" },
      { label: "Human Resource", slug: "human_resource" },
      { label: "Library", slug: "library" },
      { label: "Transport", slug: "transport" },
      { label: "Hostel", slug: "hostel" },
      { label: "Homework", slug: "homework" },
      { label: "Homework Evaluation", slug: "homework_evaluation" }
    ]
  },
  system_settings: {
    label: "System Settings",
    slug: "system_settings",
    submodules: [
      { label: "General Setting", slug: "general" },
      { label: "Session Setting", slug: "session" },
      { label: "Upgrade to Organization", slug: "upgrade_to_org" },
      { label: "Roles Permissions", slug: "roles_permissions" },
      { label: "Student Profile Update", slug: "student_profile_update" },
      { label: "Print Header Footer", slug: "print_header_footer" },
      { label: "Online Admission Setting", slug: "online_admission_setting" },
      { label: "Notification Settings", slug: "notification_settings" },
      { label: "Email Settings", slug: "email_settings" },
      { label: "SMS Settings", slug: "sms_settings" },
      { label: "Payment Gateway", slug: "payment_gateway" },
      { label: "Backup", slug: "backup" }
    ]
  },
  
  // --- NEW / EXTRA MODULES ---
  qr_code_attendance: {
    label: "QR Code Attendance",
    slug: "qr_code_attendance",
    submodules: [
      { label: "Generate QR", slug: "generate_qr" },
      { label: "Scan QR", slug: "scan_qr" },
      { label: "QR Reports", slug: "qr_reports" }
    ]
  },
  behaviour_records: {
    label: "Behaviour Records",
    slug: "behaviour_records",
    submodules: [
      { label: "Assign Incident", slug: "assign_incident" },
      { label: "Incidents", slug: "incidents" },
      { label: "Reports", slug: "reports" },
      { label: "Setting", slug: "setting" }
    ]
  },
  multi_branch: {
    label: "Multi Branch",
    slug: "multi_branch",
    submodules: [
      { label: "Overview", slug: "overview" },
      { label: "Add Branch", slug: "add_branch" },
      { label: "Branch List", slug: "branch_list" },
      { label: "Settings", slug: "settings" }
    ]
  },
  annual_calendar: {
    label: "Annual Calendar",
    slug: "annual_calendar",
    submodules: [
      { label: "Calendar View", slug: "calendar_view" },
      { label: "Holiday Types", slug: "holiday_types" }
    ]
  },
  download_center: {
    label: "Download Center",
    slug: "download_center",
    submodules: [
      { label: "Content Type", slug: "content_type" },
      { label: "Content Share", slug: "content_share" },
      { label: "Shared Content List", slug: "shared_content_list" }
    ]
  },
  student_cv: {
    label: "Student CV",
    slug: "student_cv",
    submodules: [
      { label: "Build CV", slug: "build_cv" },
      { label: "Download CV", slug: "download_cv" },
      { label: "CV Templates", slug: "cv_templates" }
    ]
  },
  alumni: {
    label: "Alumni",
    slug: "alumni",
    submodules: [
      { label: "Manage Alumni", slug: "manage_alumni" },
      { label: "Alumni Events", slug: "alumni_events" },
      { label: "Alumni Gallery", slug: "alumni_gallery" }
    ]
  },
  system_utilities: {
    label: "System Utilities",
    slug: "system_utilities",
    submodules: [
      { label: "Backup Restore", slug: "backup_restore" },
      { label: "Languages", slug: "languages" },
      { label: "Currency", slug: "currency" },
      { label: "Users", slug: "users" },
      { label: "Modules", slug: "modules" },
      { label: "Custom Fields", slug: "custom_fields" },
      { label: "Captcha Setting", slug: "captcha_setting" },
      { label: "System Fields", slug: "system_fields" },
      { label: "File Types", slug: "file_types" },
      { label: "Sidebar Menu", slug: "sidebar_menu" },
      { label: "System Update", slug: "system_update" }
    ]
  },
  lesson_planning_adv: {
    label: "Lesson Planning",
    slug: "lesson_planning_adv",
    submodules: [
      { label: "Manage Lesson Plan", slug: "manage_lesson_plan" },
      { label: "Manage Syllabus Status", slug: "manage_syllabus_status" },
      { label: "Lesson", slug: "lesson" },
      { label: "Topic", slug: "topic" }
    ]
  },
  advanced_reports: {
    label: "Audit & Logs",
    slug: "advanced_reports",
    submodules: [
      { label: "User Log", slug: "user_log" },
      { label: "Audit Trail", slug: "audit_trail" },
      { label: "Login Credentials", slug: "login_credentials" }
    ]
  },

  // --- MASTER ADMIN MODULES ---
  master_system_settings: {
    label: "Master System Settings",
    slug: "master_system_settings",
    submodules: [
      { label: "Role Permission", slug: "role_permission" },
      { label: "Queries Finder", slug: "queries_finder" },
      { label: "Communication Settings", slug: "communication_settings" },
      { label: "Email Settings", slug: "email_settings" },
      { label: "Payment Settings", slug: "payment_settings" },
      { label: "Session Settings", slug: "session_settings" },
      { label: "Master Data Settings", slug: "master_data_settings" },
      { label: "Export / Import", slug: "export_import" },
      { label: "Module Health", slug: "module_health" },
      { label: "Branch Diagnostics", slug: "branch_diagnostics" },
      { label: "Demo Automation", slug: "demo_automation" },
      { label: "Enterprise Health Monitor", slug: "enterprise_health" }
    ]
  },
  module_registry: {
    label: "Module Registry",
    slug: "module_registry",
    submodules: [
      { label: "All Modules", slug: "all_modules" },
      { label: "Sync Center", slug: "sync_center" },
      { label: "Version History", slug: "version_history" },
      { label: "Audit Logs", slug: "audit_logs" }
    ]
  },
  website_management: {
    label: "Website Management",
    slug: "website_management",
    submodules: [
      { label: "General Settings", slug: "general_settings" },
      { label: "Login Page Settings", slug: "login_page_settings" },
      { label: "File Manager", slug: "file_manager" }
    ]
  },
  subscriptions: {
    label: "Subscriptions",
    slug: "subscriptions",
    submodules: [
      { label: "Subscription Plans", slug: "plans" },
      { label: "Subscriptions", slug: "subscriptions" },
      { label: "Invoices", slug: "invoices" },
      { label: "Transactions", slug: "transactions" },
      { label: "Billing Audit", slug: "billing_audit" },
      { label: "Generate Bill", slug: "generate_bill" },
      { label: "Bulk Invoice", slug: "bulk_invoice" }
    ]
  },
  whatsapp_manager: {
    label: "WhatsApp Manager",
    slug: "whatsapp_manager",
    submodules: [
      { label: "Settings", slug: "settings" },
      { label: "Message Templates", slug: "templates" },
      { label: "Contacts", slug: "contacts" },
      { label: "Campaigns", slug: "campaigns" }
    ]
  },
  branch_management: {
    label: "Branch Management",
    slug: "branch_management",
    submodules: [
      { label: "Create Branch", slug: "create_branch" },
      { label: "Branch List", slug: "branch_list" },
      { label: "Branch Settings", slug: "branch_settings" }
    ]
  },
  branches: {
    label: "Branches",
    slug: "branches",
    submodules: []
  },
  branch_requests: {
    label: "Branch Requests",
    slug: "branch_requests",
    submodules: []
  }
};

// Helper to get flat list of all permissions
export const getAllPermissions = () => {
  const perms = [];
  Object.values(MODULE_CATALOG).forEach(module => {
    // Add Parent
    perms.push({
      slug: module.slug,
      name: module.label,
      is_parent: true
    });
    
    // Add Children
    module.submodules.forEach(sub => {
      perms.push({
        slug: `${module.slug}.${sub.slug}`,
        name: `${module.label} - ${sub.label}`,
        parent_slug: module.slug,
        is_parent: false
      });
    });
  });
  return perms;
};
