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
  'Income': 'finance',
  'Expenses': 'finance',
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
  "Teachers Timetable": "teachers_timetable", // Fixed from teacher_timetable
  "Teacher Timetable": "teachers_timetable", // Fixed from teacher_timetable
  "Subject Group": "subject_groups", // Match DB slug
  "Subject Groups": "subject_groups", // Match DB slug
  "General Settings": "general_setting",
  "Promote Students": "promote_students",
  
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
  "My Tasks": "my_tasks"
};

export const DEFAULT_MODULES = Object.keys(MODULE_CATALOG);
