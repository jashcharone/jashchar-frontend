/**
 * MASTER MODULE REGISTRY - CONFIGURATION
 * Used for SEEDING the database 'modules' table.
 * Runtime logic should prefer the database source of truth.
 */

export const ALL_MODULES = [
  {
    id: "dashboard",
    name: "Dashboard",
    slug: "dashboard",
    category: "core",
    default_in_plans: ["basic", "standard", "premium", "enterprise"],
    permissions: { view: true, add: false, edit: false, delete: false }
  },
  {
    id: "front_office",
    name: "Front Office",
    slug: "front_office",
    category: "administration",
    default_in_plans: ["standard", "premium", "enterprise"],
    permissions: { view: true, add: true, edit: true, delete: true }
  },
  {
    id: "student_information",
    name: "Student Information",
    slug: "student_information",
    category: "core",
    default_in_plans: ["basic", "standard", "premium", "enterprise"],
    permissions: { view: true, add: true, edit: true, delete: true }
  },
  {
    id: "fees_collection",
    name: "Fees Collection",
    slug: "fees_collection",
    category: "finance",
    default_in_plans: ["basic", "standard", "premium", "enterprise"],
    permissions: { view: true, add: true, edit: true, delete: true }
  },
  {
    id: "income",
    name: "Income",
    slug: "income",
    category: "finance",
    default_in_plans: ["standard", "premium", "enterprise"],
    permissions: { view: true, add: true, edit: true, delete: true }
  },
  {
    id: "expenses",
    name: "Expenses",
    slug: "expenses",
    category: "finance",
    default_in_plans: ["standard", "premium", "enterprise"],
    permissions: { view: true, add: true, edit: true, delete: true }
  },
  {
    id: "attendance",
    name: "Attendance",
    slug: "attendance",
    category: "academics",
    default_in_plans: ["basic", "standard", "premium", "enterprise"],
    permissions: { view: true, add: true, edit: true, delete: true }
  },
  {
    id: "examinations",
    name: "Examinations",
    slug: "examinations",
    category: "academics",
    default_in_plans: ["basic", "standard", "premium", "enterprise"],
    permissions: { view: true, add: true, edit: true, delete: true }
  },
  {
    id: "online_examinations",
    name: "Online Examinations",
    slug: "online_examinations",
    category: "academics",
    default_in_plans: ["premium", "enterprise"],
    permissions: { view: true, add: true, edit: true, delete: true }
  },
  {
    id: "academics",
    name: "Academics",
    slug: "academics",
    category: "academics",
    default_in_plans: ["basic", "standard", "premium", "enterprise"],
    permissions: { view: true, add: true, edit: true, delete: true }
  },
  {
    id: "human_resource",
    name: "Human Resource",
    slug: "human_resource",
    category: "administration",
    default_in_plans: ["standard", "premium", "enterprise"],
    permissions: { view: true, add: true, edit: true, delete: true }
  },
  {
    id: "communicate",
    name: "Communicate",
    slug: "communicate",
    category: "communication",
    default_in_plans: ["standard", "premium", "enterprise"],
    permissions: { view: true, add: true, edit: true, delete: true }
  },
  {
    id: "download_center",
    name: "Download Center",
    slug: "download_center",
    category: "content",
    default_in_plans: ["standard", "premium", "enterprise"],
    permissions: { view: true, add: true, edit: true, delete: true }
  },
  {
    id: "homework",
    name: "Homework",
    slug: "homework",
    category: "academics",
    default_in_plans: ["basic", "standard", "premium", "enterprise"],
    permissions: { view: true, add: true, edit: true, delete: true }
  },
  {
    id: "library",
    name: "Library",
    slug: "library",
    category: "facilities",
    default_in_plans: ["standard", "premium", "enterprise"],
    permissions: { view: true, add: true, edit: true, delete: true }
  },
  {
    id: "inventory",
    name: "Inventory",
    slug: "inventory",
    category: "facilities",
    default_in_plans: ["premium", "enterprise"],
    permissions: { view: true, add: true, edit: true, delete: true }
  },
  {
    id: "transport",
    name: "Transport",
    slug: "transport",
    category: "facilities",
    default_in_plans: ["standard", "premium", "enterprise"],
    permissions: { view: true, add: true, edit: true, delete: true }
  },
  {
    id: "hostel",
    name: "Hostel",
    slug: "hostel",
    category: "facilities",
    default_in_plans: ["premium", "enterprise"],
    permissions: { view: true, add: true, edit: true, delete: true }
  },
  {
    id: "certificate",
    name: "Certificate",
    slug: "certificate",
    category: "administration",
    default_in_plans: ["premium", "enterprise"],
    permissions: { view: true, add: true, edit: true, delete: true }
  },
  {
    id: "front_cms",
    name: "Front CMS",
    slug: "front_cms",
    category: "cms",
    default_in_plans: ["premium", "enterprise"],
    permissions: { view: true, add: true, edit: true, delete: true }
  },
  {
    id: "alumni",
    name: "Alumni",
    slug: "alumni",
    category: "communication",
    default_in_plans: ["premium", "enterprise"],
    permissions: { view: true, add: true, edit: true, delete: true }
  },
  {
    id: "reports",
    name: "Reports",
    slug: "reports",
    category: "analytics",
    default_in_plans: ["basic", "standard", "premium", "enterprise"],
    permissions: { view: true, add: false, edit: false, delete: false }
  },
  {
    id: "system_settings",
    name: "System Settings",
    slug: "system_settings",
    category: "core",
    default_in_plans: ["basic", "standard", "premium", "enterprise"],
    permissions: { view: true, add: true, edit: true, delete: false }
  },
  {
    id: "online_course",
    name: "Online Course",
    slug: "online_course",
    category: "academics",
    default_in_plans: ["enterprise"],
    permissions: { view: true, add: true, edit: true, delete: true }
  },
  {
    id: "gmeet_live_classes",
    name: "Gmeet Live Classes",
    slug: "gmeet_live_classes",
    category: "academics",
    default_in_plans: ["enterprise"],
    permissions: { view: true, add: true, edit: true, delete: true }
  },
  {
    id: "zoom_live_classes",
    name: "Zoom Live Classes",
    slug: "zoom_live_classes",
    category: "academics",
    default_in_plans: ["enterprise"],
    permissions: { view: true, add: true, edit: true, delete: true }
  },
  {
    id: "behaviour_records",
    name: "Behaviour Records",
    slug: "behaviour_records",
    category: "student_management",
    default_in_plans: ["standard", "premium", "enterprise"],
    permissions: { view: true, add: true, edit: true, delete: true }
  },
  {
    id: "qr_code_attendance",
    name: "QR Code Attendance",
    slug: "qr_code_attendance",
    category: "attendance",
    default_in_plans: ["premium", "enterprise"],
    permissions: { view: true, add: true, edit: true, delete: true }
  },
  {
    id: "lesson_plan",
    name: "Lesson Plan",
    slug: "lesson_plan",
    category: "academics",
    default_in_plans: ["standard", "premium", "enterprise"],
    permissions: { view: true, add: true, edit: true, delete: true }
  }
];
