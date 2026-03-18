import { MODULE_CATALOG } from '@/config/moduleCatalog';

// Generate Mapping from Catalog
const generatedMap = {};
Object.values(MODULE_CATALOG).forEach(mod => {
  generatedMap[mod.label] = mod.slug;
});

// Manual Overrides / Legacy Support
const overrides = {
  'Dashboard': 'dashboard',
  'Schools': 'schools',
  'Articles': 'articles',
  'Subscriptions': 'subscriptions',
  'Income': 'income',
  'Expenses': 'expenses',
  'Finance': 'finance',
  'Lesson Plan': 'lesson_planning_adv',
  'Website Manager': 'front_cms', // Mapped to front_cms main module
  'Audit & Logs': 'advanced_reports', // FIXED: Mapped to advanced_reports
  'Online Exam Pro': 'online_examinations', // Mapped to online_examinations
  'Front CMS': 'front_cms' // Explicit mapping for Front CMS
};

export const SIDEBAR_TO_MODULE_MAP = {
  ...generatedMap,
  ...overrides
};

export const SUBMODULE_OVERRIDES = {
  "School Login Settings": "login_settings",
  "Website Settings": "website_settings", 
  "Media Manager": "media_manager",
  "Banner Images": "banner_images",
  "Classes": "class",
  "Teachers Timetable": "teacher_timetable", // DB key is teacher_timetable (singular)
  "Teacher Timetable": "teacher_timetable", // DB key is teacher_timetable (singular)
  "Subject Group": "subject_groups", // Match DB slug
  "Subject Groups": "subject_groups", // Match DB slug
  "General Settings": "general_setting",
  "General Setting": "general_setting",
  "Attendance Config": "attendance_config", // 🆕 Branch Attendance Configuration
  "Session Setting": "session_setting",
  "Roles Permissions": "roles_permissions",
  "Print Header Footer": "print_header_footer",
  "Email Setting": "email_setting",
  "SMS Setting": "sms_setting", 
  "Notification Setting": "notification_setting",
  "Payment Gateway": "payment_gateway",
  "Backup & Restore": "backup_restore",
  "Promote Students": "promote_students",
  
  // --- STUDENT INFORMATION FIXES ---
  "Promotion": "student_promotion",
  "ID Card": "student_id_card",
  "Student ID Card": "student_id_card",
  "Student Promotion": "student_promotion",
  
  // --- INCOME MODULE FIXES ---
  "Income": "income",
  "Add Income": "add_income",
  "Income Head": "income_head",
  
  // --- EXPENSES MODULE FIXES ---
  "Expense": "expense",
  "Add Expense": "add_expense",
  "Expense Head": "expense_head",
  
  // --- FEES COLLECTION FIXES ---
  "Fees Group": "fees_group",
  "Fees Type": "fees_type", 
  "Fees Discount": "fees_discount",
  "Fees Reminder": "fees_reminder",
  "Search Fees Payment": "search_fees_payment",
  "Offline Bank Payments": "offline_bank_payment",
  "Quick Fees": "quick_fees",
  
  // --- NEW FIXES FOR SIDEBAR VISIBILITY ---
  "Live Classes": "live_class", // Zoom/Gmeet mismatch
  "Live Meeting": "live_meeting",
  "Live Class Report": "live_class_report",
  "Live Meeting Report": "live_meeting_report",
  
  // Lesson Planning
  "Manage Syllabus": "manage_syllabus_status", // Closest match
  "Copy Old Lessons": "manage_lesson_plan", // Fallback to main permission
  "Topic Overview": "topic",
  
  // Audit & Logs (advanced_reports)
  "User Log": "user_log", 
  "Audit Trail": "audit_trail",
  "Login Credentials": "login_credentials",

  // Download Center
  "Video Tutorials": "video_tutorials",
  "Share List": "share_list", // Check if exists
  
  // Library
  "Book List": "book_list",
  "Issue Return": "issue_return",
  
  // Transport - must match DB slugs (underscore format)
  "Routes": "routes",
  "Vehicles": "vehicles",
  "Pickup Points": "pickup_points",
  "Route Pickup Points": "route_pickup_point",
  "Assign Vehicle": "assign_vehicle",
  "Student Transport Fees": "student_transport_fees",
  "Transport Fee Master": "transport_fees_master",
  
  // Task Management
  "All Tasks": "tasks",
  "Create Task": "tasks",
  "My Tasks": "my_tasks",
  
  // Attendance Advanced Submodules (emoji titles → DB slugs)
  "📊 Live Dashboard": "live_dashboard",
  "📱 QR Code Generator": "qr_code_generator",
  "🔌 Device Management": "device_management",
  "💳 Card Management": "card_management",
  "👤 Face Registration": "face_registration",
  "🤖 Live Face Attendance": "face_registration", // Maps to face_registration
  "📹 AI Camera Management": "face_registration", // AI Face Attendance cameras
  "🧠 FAISS Index Management": "face_registration", // AI Face index management
  "⌚ Wearable Devices": "wearable_devices",
  "⚙️ Attendance Rules": "attendance_rules",
  "📍 Geo-Fence Setup": "geo_fence_setup",
  "📈 Analytics": "analytics" // DB slug is attendance.analytics
};

export const DEFAULT_MODULES = Object.keys(MODULE_CATALOG);
