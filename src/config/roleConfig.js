/**
 * JASHCHAR ERP - Central Role Configuration
 * ═══════════════════════════════════════════
 * Maps all 20 system roles to their URL slugs, dashboard paths, and display names.
 * This is the SINGLE SOURCE OF TRUTH for role-to-URL mapping across the entire app.
 * 
 * 20 SYSTEM ROLES:
 * ─────────────────
 * 1.  super_admin (School Owner)     - Full access
 * 2.  admin                          - Near-full access
 * 3.  principal                      - School head
 * 4.  vice_principal                 - Deputy head
 * 5.  coordinator                    - Academic coordination
 * 6.  teacher                        - Teaching staff
 * 7.  class_teacher                  - Class administration
 * 8.  subject_teacher                - Subject-specific
 * 9.  accountant                     - Financial management
 * 10. cashier                        - Fee collection
 * 11. receptionist                   - Front office
 * 12. librarian                      - Library management
 * 13. lab_assistant                  - Lab management
 * 14. hostel_warden                  - Hostel management
 * 15. driver                         - Transport
 * 16. sports_coach                   - Sports & activities
 * 17. security_guard                 - Gate security
 * 18. maintenance_staff / maintenance - Facility maintenance
 * 19. peon                           - Support staff
 * 20. student                        - Student portal
 * + parent                           - Parent portal
 */

// ═══════════════════════════════════════════════════════════════════
// ROLE → URL SLUG MAPPING
// Used by StaffModuleRoute to validate URL prefix matches user's role
// ═══════════════════════════════════════════════════════════════════
export const ROLE_TO_SLUG = {
  'super_admin': 'super-admin',
  'school_owner': 'super-admin',
  'organization_owner': 'super-admin',
  'admin': 'super-admin',
  'principal': 'principal',
  'vice_principal': 'vice-principal',
  'coordinator': 'coordinator',
  'teacher': 'teacher',
  'class_teacher': 'class-teacher',
  'subject_teacher': 'subject-teacher',
  'accountant': 'accountant',
  'cashier': 'cashier',
  'receptionist': 'receptionist',
  'librarian': 'librarian',
  'lab_assistant': 'lab-assistant',
  'hostel_warden': 'hostel-warden',
  'driver': 'driver',
  'sports_coach': 'sports-coach',
  'security_guard': 'security',
  'maintenance_staff': 'maintenance',
  'maintenance': 'maintenance',
  'peon': 'peon',
};

// Reverse mapping: URL slug → role name(s) for validation
export const SLUG_TO_ROLES = {
  'super-admin': ['super_admin', 'school_owner', 'organization_owner', 'admin'],
  'principal': ['principal'],
  'vice-principal': ['vice_principal'],
  'coordinator': ['coordinator'],
  'teacher': ['teacher'],
  'class-teacher': ['class_teacher'],
  'subject-teacher': ['subject_teacher'],
  'accountant': ['accountant'],
  'cashier': ['cashier'],
  'receptionist': ['receptionist'],
  'librarian': ['librarian'],
  'lab-assistant': ['lab_assistant'],
  'hostel-warden': ['hostel_warden'],
  'driver': ['driver'],
  'sports-coach': ['sports_coach'],
  'security': ['security_guard'],
  'maintenance': ['maintenance_staff', 'maintenance'],
  'peon': ['peon'],
};

// ═══════════════════════════════════════════════════════════════════
// ROLE → DASHBOARD PATH MAPPING
// Each role's specific dashboard URL
// ═══════════════════════════════════════════════════════════════════
export const ROLE_TO_DASHBOARD = {
  'super_admin': '/super-admin/dashboard',
  'school_owner': '/super-admin/dashboard',
  'organization_owner': '/super-admin/dashboard',
  'admin': '/Admin/dashboard',
  'master_admin': '/master-admin/dashboard',
  'principal': '/Principal/dashboard',
  'vice_principal': '/VicePrincipal/dashboard',
  'coordinator': '/Coordinator/dashboard',
  'teacher': '/Teacher/dashboard',
  'class_teacher': '/ClassTeacher/dashboard',
  'subject_teacher': '/SubjectTeacher/dashboard',
  'accountant': '/Accountant/dashboard',
  'cashier': '/Cashier/dashboard',
  'receptionist': '/Receptionist/dashboard',
  'librarian': '/Librarian/dashboard',
  'lab_assistant': '/LabAssistant/dashboard',
  'hostel_warden': '/HostelWarden/dashboard',
  'driver': '/Driver/dashboard',
  'sports_coach': '/SportsCoach/dashboard',
  'security_guard': '/SecurityGuard/dashboard',
  'maintenance_staff': '/MaintenanceStaff/dashboard',
  'maintenance': '/MaintenanceStaff/dashboard',
  'peon': '/Peon/dashboard',
  'student': '/Student/dashboard',
  'parent': '/Parent/dashboard',
};

// ═══════════════════════════════════════════════════════════════════
// ALL STAFF ROLES - Used for allowedRoles in shared module routes
// ═══════════════════════════════════════════════════════════════════
export const ALL_STAFF_ROLES = [
  'super_admin', 'admin', 'school_owner', 'organization_owner',
  'principal', 'vice_principal', 'coordinator',
  'teacher', 'class_teacher', 'subject_teacher',
  'accountant', 'cashier', 'receptionist',
  'librarian', 'lab_assistant',
  'hostel_warden', 'driver', 'sports_coach',
  'security_guard', 'maintenance_staff', 'maintenance', 'peon',
];

// ═══════════════════════════════════════════════════════════════════
// VALID ROLE SLUGS - For validating URL prefixes
// ═══════════════════════════════════════════════════════════════════
export const VALID_ROLE_SLUGS = Object.keys(SLUG_TO_ROLES);

// ═══════════════════════════════════════════════════════════════════
// HELPER: Get role slug from role name
// ═══════════════════════════════════════════════════════════════════
export const getRoleSlug = (roleName) => {
  return ROLE_TO_SLUG[roleName] || null;
};

// ═══════════════════════════════════════════════════════════════════
// HELPER: Get dashboard path for a role
// ═══════════════════════════════════════════════════════════════════
export const getDashboardPath = (roleName) => {
  return ROLE_TO_DASHBOARD[roleName] || '/login';
};

// ═══════════════════════════════════════════════════════════════════
// HELPER: Check if a URL slug is valid for a given role
// ═══════════════════════════════════════════════════════════════════
export const isValidSlugForRole = (slug, roleName) => {
  const expectedSlug = ROLE_TO_SLUG[roleName];
  return expectedSlug === slug;
};
