import React, { Suspense } from 'react';
import { 
  GitBranch, Video, CalendarDays, Download, FileText, 
  GraduationCap, Settings2, FileBarChart, ShieldAlert,
  Users, Globe, LayoutTemplate, CreditCard, KeyRound
} from 'lucide-react';
import PlaceholderModule from '@/components/common/PlaceholderModule';
import { ROUTES } from '@/registry/routeRegistry';
import LoadingFallback from '@/components/LoadingFallback';
import { Navigate } from 'react-router-dom';

// --- LAZY LOAD HELPER ---
const lazyLoad = (importFunc) => {
  const LazyComponent = React.lazy(importFunc);
  return (props) => (
    <Suspense fallback={<LoadingFallback />}>
      <LazyComponent {...props} />
    </Suspense>
  );
};

// --- LAZY LOADED COMPONENTS ---
const MySubscriptionPlan = lazyLoad(() => import('@/pages/super-admin/subscription/MySubscriptionPlan'));
const Menus = lazyLoad(() => import('@/pages/super-admin/front-cms/Menus'));
const MenuItems = lazyLoad(() => import('@/pages/super-admin/front-cms/MenuItems'));
const Pages = lazyLoad(() => import('@/pages/super-admin/front-cms/Pages'));
const AddEditPage = lazyLoad(() => import('@/pages/super-admin/front-cms/AddEditPage'));
const Events = lazyLoad(() => import('@/pages/super-admin/front-cms/Events'));
const AddEditEvent = lazyLoad(() => import('@/pages/super-admin/front-cms/AddEditEvent'));
const Gallery = lazyLoad(() => import('@/pages/super-admin/front-cms/Gallery'));
const AddEditGallery = lazyLoad(() => import('@/pages/super-admin/front-cms/AddEditGallery'));
const News = lazyLoad(() => import('@/pages/super-admin/front-cms/News'));
const AddEditNews = lazyLoad(() => import('@/pages/super-admin/front-cms/AddEditNews'));
const MediaManager = lazyLoad(() => import('@/pages/super-admin/front-cms/MediaManager'));
const BannerImages = lazyLoad(() => import('@/pages/super-admin/front-cms/BannerImages'));
const FrontCMSSetting = lazyLoad(() => import('@/pages/super-admin/front-cms/FrontCMSSetting'));
const FrontCmsSchoolOwner = lazyLoad(() => import('@/pages/super-admin/front-cms/FrontCmsSchoolOwner'));
const SchoolSelector = lazyLoad(() => import('@/pages/master-admin/front-cms/SchoolSelector'));

// --- MULTI BRANCH COMPONENTS ---
const AddBranch = lazyLoad(() => import('@/pages/super-admin/multi-branch/AddBranch'));
const BranchList = lazyLoad(() => import('@/pages/super-admin/multi-branch/BranchList'));
const BranchSettings = lazyLoad(() => import('@/pages/super-admin/multi-branch/BranchSettings'));
const BranchReport = lazyLoad(() => import('@/pages/super-admin/multi-branch/BranchReport'));
const ZoomLiveClasses = lazyLoad(() => import('@/pages/super-admin/ZoomLiveClasses'));
const AlumniList = lazyLoad(() => import('@/pages/super-admin/alumni/AlumniList'));
const AlumniEvents = lazyLoad(() => import('@/pages/super-admin/alumni/AlumniEvents'));

// --- USER MANAGEMENT COMPONENTS ---
const UserManagementDashboard = lazyLoad(() => import('@/pages/super-admin/user-management/Dashboard'));
const StudentUsers = lazyLoad(() => import('@/pages/super-admin/user-management/StudentUsers'));
const StaffUsers = lazyLoad(() => import('@/pages/super-admin/user-management/StaffUsers'));
const ParentUsers = lazyLoad(() => import('@/pages/super-admin/user-management/ParentUsers'));
const AllUsers = lazyLoad(() => import('@/pages/super-admin/user-management/AllUsers'));

// --- HELPER TO GENERATE MODULE CONFIG ---
const createModule = (key, role, title, icon, path, submenu = []) => ({
  key,
  role,
  route: { 
    path, 
    element: <PlaceholderModule title={title} moduleName={key} /> 
  },
  sidebar: { 
    title, 
    icon, 
    path,
    submenu: submenu.length > 0 ? submenu : undefined
  }
});

/**
 * NEW MODULE REGISTRY
 * Implements 300+ Modules via Append-Only Pattern
 */
export const NEW_MODULES = [
  // --- FRONT CMS - MASTER ADMIN ---
  { 
    key: 'front_cms', 
    role: 'master_admin', 
    ignoreSubmenuRoutes: true, // Prevent auto-generation of placeholder routes
    route: { path: '/master-admin/front-cms', element: <SchoolSelector /> }, 
    sidebar: { 
      title: 'Front CMS', 
      icon: LayoutTemplate, 
      path: '/master-admin/front-cms', 
      submenu: [
        { title: 'Select School', path: '/master-admin/front-cms' },
        { title: 'Website Settings', path: '/master-admin/front-cms/website-settings' },
        { title: 'School Login Settings', path: ROUTES.MASTER_ADMIN.MASTER_SCHOOL_LOGIN_SETTINGS },
        { title: 'Menus', path: '/master-admin/front-cms/menus' },
        { title: 'Pages', path: '/master-admin/front-cms/pages' },
        { title: 'Events', path: '/master-admin/front-cms/events' },
        { title: 'Gallery', path: '/master-admin/front-cms/gallery' },
        { title: 'News', path: '/master-admin/front-cms/news' },
        { title: 'Media Manager', path: '/master-admin/front-cms/media' },
        { title: 'Banners', path: '/master-admin/front-cms/banners' }
      ] 
    } 
  },
  { key: 'front_cms', role: 'master_admin', route: { path: '/master-admin/front-cms/website-settings', element: <FrontCMSSetting /> } },
  { key: 'front_cms', role: 'master_admin', route: { path: '/master-admin/front-cms/menus', element: <Menus /> } },
  { key: 'front_cms', role: 'master_admin', route: { path: '/master-admin/front-cms/pages', element: <Pages /> } },
  { key: 'front_cms', role: 'master_admin', route: { path: '/master-admin/front-cms/pages/add', element: <AddEditPage /> } },
  { key: 'front_cms', role: 'master_admin', route: { path: '/master-admin/front-cms/pages/edit/:pageId', element: <AddEditPage /> } },
  { key: 'front_cms', role: 'master_admin', route: { path: '/master-admin/front-cms/events', element: <Events /> } },
  { key: 'front_cms', role: 'master_admin', route: { path: '/master-admin/front-cms/events/add', element: <AddEditEvent /> } },
  { key: 'front_cms', role: 'master_admin', route: { path: '/master-admin/front-cms/events/edit/:eventId', element: <AddEditEvent /> } },
  { key: 'front_cms', role: 'master_admin', route: { path: '/master-admin/front-cms/gallery', element: <Gallery /> } },
  { key: 'front_cms', role: 'master_admin', route: { path: '/master-admin/front-cms/gallery/add', element: <AddEditGallery /> } },
  { key: 'front_cms', role: 'master_admin', route: { path: '/master-admin/front-cms/gallery/edit/:galleryId', element: <AddEditGallery /> } },
  { key: 'front_cms', role: 'master_admin', route: { path: '/master-admin/front-cms/news', element: <News /> } },
  { key: 'front_cms', role: 'master_admin', route: { path: '/master-admin/front-cms/news/add', element: <AddEditNews /> } },
  { key: 'front_cms', role: 'master_admin', route: { path: '/master-admin/front-cms/news/edit/:newsId', element: <AddEditNews /> } },
  { key: 'front_cms', role: 'master_admin', route: { path: '/master-admin/front-cms/media', element: <MediaManager /> } },
  { key: 'front_cms', role: 'master_admin', route: { path: '/master-admin/front-cms/banners', element: <BannerImages /> } },

  // --- FRONT CMS - SCHOOL OWNER (Super Admin) ---
  // Sidebar menu configuration
  { 
    key: 'front_cms', 
    role: 'super_admin',
    ignoreSubmenuRoutes: true,
    route: { path: '/super-admin/front-cms', element: <FrontCmsSchoolOwner /> },
    sidebar: { 
      title: 'Front CMS', 
      icon: LayoutTemplate, 
      path: '/super-admin/front-cms/website-settings',
      submenu: [
        { title: 'Website Settings', path: '/super-admin/front-cms/website-settings' },
        { title: 'Menus', path: '/super-admin/front-cms/menus' },
        { title: 'Pages', path: '/super-admin/front-cms/pages' },
        { title: 'Gallery', path: '/super-admin/front-cms/gallery' },
        { title: 'News', path: '/super-admin/front-cms/news' },
        { title: 'Media Manager', path: '/super-admin/front-cms/media' },
        { title: 'Banner Images', path: '/super-admin/front-cms/banners' }
      ] 
    } 
  },
  // Main Front CMS routes using tab-based navigation
  { 
    key: 'front_cms', 
    role: 'super_admin', 
    route: { path: '/super-admin/front-cms/:tab', element: <FrontCmsSchoolOwner /> } 
  },
  // Legacy redirects
  { key: 'front_cms', role: 'super_admin', route: { path: '/super-admin/front-cms/media-manager', element: <Navigate to="/super-admin/front-cms/media" replace /> } },
  { key: 'front_cms', role: 'super_admin', route: { path: '/super-admin/front-cms/banner-images', element: <Navigate to="/super-admin/front-cms/banners" replace /> } },
  // Default route - redirect to website-settings
  { 
    key: 'website_settings', 
    role: 'super_admin', 
    route: { path: '/super-admin/front-cms', element: <FrontCmsSchoolOwner /> } 
  },
  // Standalone pages that need their own routes (Add/Edit pages)
  { key: 'front_cms.pages', role: 'super_admin', route: { path: '/super-admin/front-cms/pages/add', element: <AddEditPage /> } },
  { key: 'front_cms.pages', role: 'super_admin', route: { path: '/super-admin/front-cms/pages/edit/:pageId', element: <AddEditPage /> } },
  { key: 'front_cms.menus', role: 'super_admin', route: { path: '/super-admin/front-cms/menus/items/:menuId', element: <MenuItems /> } },
  
  // Redirect school-owner routes to super-admin
  { key: 'front_cms', role: 'super_admin', route: { path: '/school-owner/front-cms/*', element: <Navigate to="/super-admin/front-cms" replace /> } },

  // --- 1. MULTI BRANCH ---
  { 
    key: 'multi_branch', 
    role: 'super_admin', 
    route: { path: '/super-admin/multi-branch', element: <BranchList /> }, 
    ignoreSubmenuRoutes: true,
    sidebar: { 
      title: 'Multi Branch', 
      icon: GitBranch, 
      path: '/super-admin/multi-branch',
      submenu: [
        { title: 'Add Branch', path: '/super-admin/multi-branch/add' },
        { title: 'Branch List', path: '/super-admin/multi-branch/overview' },
        { title: 'Branch Settings', path: '/super-admin/multi-branch/settings' },
        { title: 'Branch Report', path: '/super-admin/multi-branch/report' }
      ]
    } 
  },
  { key: 'multi_branch', role: 'super_admin', route: { path: '/super-admin/multi-branch/add', element: <AddBranch /> } },
  { key: 'multi_branch', role: 'super_admin', route: { path: '/super-admin/multi-branch/overview', element: <BranchList /> } },
  { key: 'multi_branch', role: 'super_admin', route: { path: '/super-admin/multi-branch/settings', element: <BranchSettings /> } },
  { key: 'multi_branch', role: 'super_admin', route: { path: '/super-admin/multi-branch/report', element: <BranchReport /> } },

  // --- 2. ZOOM LIVE CLASSES ---
  { 
    key: 'zoom_live', 
    role: 'super_admin', 
    route: { path: '/school-owner/zoom', element: <ZoomLiveClasses /> }, 
    ignoreSubmenuRoutes: true,
    sidebar: { 
      title: 'Zoom Live Classes', 
      icon: Video, 
      path: '/school-owner/zoom',
      submenu: [
        { title: 'Live Classes', path: '/school-owner/zoom/classes' },
        { title: 'Live Meeting', path: '/school-owner/zoom/meetings' },
        { title: 'Classes Report', path: '/school-owner/zoom/classes-report' },
        { title: 'Meeting Report', path: '/school-owner/zoom/meeting-report' },
        { title: 'Zoom Setting', path: '/school-owner/zoom/setting' }
      ]
    } 
  },
  { key: 'zoom_live', role: 'super_admin', route: { path: '/school-owner/zoom/classes', element: <ZoomLiveClasses /> } },
  { key: 'zoom_live', role: 'super_admin', route: { path: '/school-owner/zoom/meetings', element: <PlaceholderModule title="Live Meeting" moduleName="zoom_live.meetings" /> } },
  { key: 'zoom_live', role: 'super_admin', route: { path: '/school-owner/zoom/classes-report', element: <PlaceholderModule title="Classes Report" moduleName="zoom_live.classes_report" /> } },
  { key: 'zoom_live', role: 'super_admin', route: { path: '/school-owner/zoom/meeting-report', element: <PlaceholderModule title="Meeting Report" moduleName="zoom_live.meeting_report" /> } },
  { key: 'zoom_live', role: 'super_admin', route: { path: '/school-owner/zoom/setting', element: <PlaceholderModule title="Zoom Setting" moduleName="zoom_live.setting" /> } },

  // --- 3. ANNUAL CALENDAR ---
  createModule('annual_calendar', 'super_admin', 'Annual Calendar', CalendarDays, '/school-owner/calendar', [
    { title: 'Calendar View', path: '/school-owner/calendar/view' },
    { title: 'Holiday Types', path: '/school-owner/calendar/holiday-types' }
  ]),

  // --- 4. DOWNLOAD CENTER ---
  createModule('download_center', 'super_admin', 'Download Center', Download, '/school-owner/download-center', [
    { title: 'Content Type', path: '/school-owner/download/content-type' },
    { title: 'Share List', path: '/school-owner/download/share-list' },
    { title: 'Upload Content', path: '/school-owner/download/upload' },
    { title: 'Video Tutorials', path: '/school-owner/download/videos' }
  ]),

  // --- 5. STUDENT CV ---
  createModule('student_cv', 'super_admin', 'Student CV', FileText, '/school-owner/student-cv', [
    { title: 'Build CV', path: '/school-owner/cv/build' },
    { title: 'Download CV', path: '/school-owner/cv/download' },
    { title: 'CV Templates', path: '/school-owner/cv/templates' }
  ]),

  // --- 6. ALUMNI ---
  { 
    key: 'alumni', 
    role: 'super_admin', 
    route: { path: '/school-owner/alumni', element: <AlumniList /> }, 
    ignoreSubmenuRoutes: true,
    sidebar: { 
      title: 'Alumni', 
      icon: GraduationCap, 
      path: '/school-owner/alumni',
      submenu: [
        { title: 'Manage Alumni', path: '/school-owner/alumni/manage' },
        { title: 'Alumni Events', path: '/school-owner/alumni/alumni-events' },
        { title: 'Gallery', path: '/school-owner/alumni/gallery' }
      ]
    } 
  },
  { key: 'alumni', role: 'super_admin', route: { path: '/school-owner/alumni/manage', element: <AlumniList /> } },
  { key: 'alumni', role: 'super_admin', route: { path: '/school-owner/alumni/alumni-events', element: <AlumniEvents /> } },
  { key: 'alumni', role: 'super_admin', route: { path: '/school-owner/alumni/gallery', element: <PlaceholderModule title="Gallery" moduleName="alumni.gallery" /> } },

  // --- 7. SYSTEM UTILITIES (Expanding System Settings) ---
  createModule('system_utilities', 'super_admin', 'System Utilities', Settings2, '/school-owner/system-utils', [
    { title: 'Backup Restore', path: '/school-owner/system/backup' },
    { title: 'Languages', path: '/school-owner/system/languages' },
    { title: 'Currency', path: '/school-owner/system/currency' },
    { title: 'Users', path: '/school-owner/system/users' },
    { title: 'Modules', path: '/school-owner/system/modules' },
    { title: 'Custom Fields', path: '/school-owner/system/custom-fields' },
    { title: 'Captcha Setting', path: '/school-owner/system/captcha' },
    { title: 'System Fields', path: '/school-owner/system/fields' },
    { title: 'File Types', path: '/school-owner/system/file-types' },
    { title: 'Sidebar Menu', path: '/school-owner/system/sidebar-menu' },
    { title: 'System Update', path: '/school-owner/system/update' }
  ]),

  // --- 8. ADVANCED REPORTS (Expanding Reports) ---
  createModule('advanced_reports', 'super_admin', 'Audit & Logs', FileBarChart, '/school-owner/reports/advanced', [
    { title: 'User Log', path: '/school-owner/reports/user-log' },
    { title: 'Audit Trail', path: '/school-owner/reports/audit-trail' },
    { title: 'Login Credentials', path: '/school-owner/communicate/login-credentials' } // Moved from communicate logic
  ]),

  // --- 9. LESSON PLANNING (Expanded) ---
  createModule('lesson_planning_adv', 'super_admin', 'Lesson Planning', FileText, '/school-owner/lesson-planning', [
    { title: 'Copy Old Lessons', path: '/school-owner/lesson/copy' },
    { title: 'Manage Syllabus', path: '/school-owner/lesson/syllabus' },
    { title: 'Manage Lesson Plan', path: '/school-owner/lesson/manage' },
    { title: 'Topic Overview', path: '/school-owner/lesson/topics' }
  ]),
  
  // --- 10. ONLINE EXAM (Expanded) ---
  createModule('online_exam_adv', 'super_admin', 'Online Exam Pro', Globe, '/school-owner/online-exam-pro', [
    { title: 'Question Bank', path: '/school-owner/online-exam/question-bank' },
    { title: 'Online Exam', path: '/school-owner/online-exam/create' },
    { title: 'Exam Report', path: '/school-owner/online-exam/report' }
  ]),

  // --- 11. SUBSCRIPTION PLAN (Core Feature - Always Visible) ---
  {
    key: 'subscription_plan_core', // Changed key to avoid conflict with permission system
    role: 'super_admin',
    route: { path: ROUTES.SUPER_ADMIN.MY_SUBSCRIPTION, element: <MySubscriptionPlan /> },
    sidebar: { title: 'My Subscription', icon: CreditCard, path: ROUTES.SUPER_ADMIN.MY_SUBSCRIPTION }
  },

  // --- 12. USER MANAGEMENT MODULE ---
  { 
    key: 'user_management', 
    role: 'super_admin', 
    route: { path: '/super-admin/user-management', element: <UserManagementDashboard /> }, 
    ignoreSubmenuRoutes: true,
    sidebar: { 
      title: 'User Management', 
      icon: KeyRound, 
      path: '/super-admin/user-management',
      submenu: [
        { title: 'Dashboard', path: '/super-admin/user-management/dashboard' },
        { title: 'All Users', path: '/super-admin/user-management/all-users' },
        { title: 'Student Users', path: '/super-admin/user-management/students' },
        { title: 'Staff Users', path: '/super-admin/user-management/staff' },
        { title: 'Parent Users', path: '/super-admin/user-management/parents' }
      ]
    } 
  },
  { key: 'user_management', role: 'super_admin', route: { path: '/super-admin/user-management/dashboard', element: <UserManagementDashboard /> } },
  { key: 'user_management', role: 'super_admin', route: { path: '/super-admin/user-management/all-users', element: <AllUsers /> } },
  { key: 'user_management', role: 'super_admin', route: { path: '/super-admin/user-management/students', element: <StudentUsers /> } },
  { key: 'user_management', role: 'super_admin', route: { path: '/super-admin/user-management/staff', element: <StaffUsers /> } },
  { key: 'user_management', role: 'super_admin', route: { path: '/super-admin/user-management/parents', element: <ParentUsers /> } },

  // === CORE MODULES (MUST MATCH DATABASE MODULE SLUGS) ===
  // These are the primary modules that come with subscription plans
  // Module slugs MUST match database: academics, human_resource, system_settings
  
  // NOTE: These are commented out to prevent duplication with sidebarConfig.js (BASE_SIDEBAR)
  // The BASE_SIDEBAR already contains the correct routes and structure for these core modules.
  
  /*
  // --- ACADEMICS MODULE ---
  {
    key: 'academics',
    role: 'super_admin',
    route: { path: '/school-owner/academics', element: <PlaceholderModule title="Academics" moduleName="academics" /> },
    sidebar: {
      title: 'Academics',
      icon: GraduationCap,
      path: '/school-owner/academics',
      submenu: [
        { title: 'Classes', path: '/school-owner/academics/classes' },
        { title: 'Sections', path: '/school-owner/academics/sections' },
        { title: 'Subjects', path: '/school-owner/academics/subjects' },
        { title: 'Class Teacher', path: '/school-owner/academics/class-teacher' },
        { title: 'Assign Subject', path: '/school-owner/academics/assign-subject' },
        { title: 'Promote Student', path: '/school-owner/academics/promote-student' },
        { title: 'Class Timetable', path: '/school-owner/academics/class-timetable' },
        { title: 'Teacher Timetable', path: '/school-owner/academics/teacher-timetable' },
        { title: 'Assign Class Teacher', path: '/school-owner/academics/assign-class-teacher' }
      ]
    }
  },

  // --- HUMAN RESOURCE MODULE ---
  {
    key: 'human_resource',
    role: 'super_admin',
    route: { path: '/school-owner/human-resource', element: <PlaceholderModule title="Human Resource" moduleName="human_resource" /> },
    sidebar: {
      title: 'Human Resource',
      icon: Users,
      path: '/school-owner/human-resource',
      submenu: [
        { title: 'Staff Directory', path: '/school-owner/human-resource/staff' },
        { title: 'Staff Attendance', path: '/school-owner/human-resource/attendance' },
        { title: 'Payroll', path: '/school-owner/human-resource/payroll' },
        { title: 'Leave Management', path: '/school-owner/human-resource/leave' },
        { title: 'Departments', path: '/school-owner/human-resource/departments' },
        { title: 'Designations', path: '/school-owner/human-resource/designations' }
      ]
    }
  },

  // --- SYSTEM SETTINGS MODULE ---
  {
    key: 'system_settings',
    role: 'super_admin',
    route: { path: '/school-owner/system-settings', element: <PlaceholderModule title="System Settings" moduleName="system_settings" /> },
    sidebar: {
      title: 'System Settings',
      icon: Settings2,
      path: '/school-owner/system-settings',
      submenu: [
        { title: 'General Settings', path: '/school-owner/system-settings/general' },
        { title: 'Session Settings', path: '/school-owner/system-settings/session' },
        { title: 'Payment Settings', path: '/school-owner/system-settings/payment' },
        { title: 'Notification Settings', path: '/school-owner/system-settings/notification' },
        { title: 'Backup & Restore', path: '/school-owner/system-settings/backup' }
      ]
    }
  }
  */
];
