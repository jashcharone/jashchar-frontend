import { supabase } from '@/lib/customSupabaseClient';
import { syncPlanModulesToSchoolOwnerPermissions } from '@/services/planModuleSyncService';
import { repairPlanModuleMappings } from '@/services/planModuleRepairService';

// ═══════════════════════════════════════════════════════════════════════════════
// ALL 40 SYSTEM ROLES in Display Order
// These are created automatically for every new branch
// ═══════════════════════════════════════════════════════════════════════════════
export const SYSTEM_ROLES_CONFIG = [
  { name: 'Super Admin', order: 1, description: 'Full system access' },
  { name: 'Admin', order: 2, description: 'Administrative access' },
  { name: 'Principal', order: 3, description: 'School principal' },
  { name: 'Vice Principal', order: 4, description: 'Vice principal' },
  { name: 'Academic Dean', order: 5, description: 'Academic head' },
  { name: 'Coordinator', order: 6, description: 'Branch coordinator' },
  { name: 'Assistant Co-Ordinator', order: 7, description: 'Assistant coordinator' },
  { name: 'Accountant', order: 8, description: 'Financial management' },
  { name: 'Cashier', order: 9, description: 'Fee collection' },
  { name: 'Receptionist', order: 10, description: 'Front desk' },
  { name: 'Teacher', order: 11, description: 'Teaching staff' },
  { name: 'Subject Teacher', order: 12, description: 'Subject specific teacher' },
  { name: 'Lecturer', order: 13, description: 'College lecturer' },
  { name: 'PET Teacher', order: 14, description: 'Physical education' },
  { name: 'Music Teacher', order: 15, description: 'Music teacher' },
  { name: 'Yoga Teacher', order: 16, description: 'Yoga instructor' },
  { name: 'Lab Assistant', order: 17, description: 'Laboratory assistant' },
  { name: 'Librarian', order: 18, description: 'Library management' },
  { name: 'Hostel Warden', order: 19, description: 'Hostel management' },
  { name: 'Transport Incharge', order: 20, description: 'Transport management' },
  { name: 'Driver', order: 21, description: 'Vehicle driver' },
  { name: 'Sports Coach', order: 22, description: 'Sports coaching' },
  { name: 'Security Guard', order: 23, description: 'Security staff' },
  { name: 'Maintenance Staff', order: 24, description: 'Maintenance worker' },
  { name: 'Electrician and Plumber', order: 25, description: 'Electrical and plumbing' },
  { name: 'Peon', order: 26, description: 'Peon/Helper' },
  { name: 'Ayah Incharge', order: 27, description: 'Ayah/Caretaker head' },
  { name: 'Store Manager', order: 28, description: 'Store management' },
  { name: 'Bookstall Incharge', order: 29, description: 'Bookstall management' },
  { name: 'Canteen Incharge', order: 30, description: 'Canteen management' },
  { name: 'CCTV Incharge', order: 31, description: 'CCTV monitoring' },
  { name: 'Website Incharge', order: 32, description: 'Website management' },
  { name: 'DTP Worker', order: 33, description: 'Desktop publishing' },
  { name: 'Document Clerk', order: 34, description: 'Documentation' },
  { name: 'Telecaller', order: 35, description: 'Telecalling' },
  { name: 'D.O PA to Admin', order: 36, description: 'PA to Admin (D.O)' },
  { name: 'PA to Admin', order: 37, description: 'Personal assistant' },
  { name: 'Typist', order: 38, description: 'Typing work' },
  { name: 'Student', order: 39, description: 'Student role' },
  { name: 'Parent', order: 40, description: 'Parent role' }
];

export const rolesService = {
  /**
   * Creates ALL 40 SYSTEM ROLES for a new branch
   * Called when creating a new school/branch
   */
  createDefaultRoles: async (branchId, planId = null) => {
    // Modules are managed via backend/database
    
    // SAFETY: Ensure the plan maps to modules correctly
    await repairPlanModuleMappings();

    const rolesPayload = SYSTEM_ROLES_CONFIG.map(role => ({
      branch_id: branchId,
      name: role.name, // Title Case names
      description: role.description,
      is_system_role: true,
      is_system: true,
      is_system_default: true,
      is_active: true,
    }));

    // Upsert roles (ignore duplicates)
    const { data, error } = await supabase
      .from('roles')
      .upsert(rolesPayload, { 
        onConflict: 'branch_id,name',
        ignoreDuplicates: true 
      })
      .select();

    if (error && error.code !== '23505') {
      console.error('Error creating roles:', error);
      throw error;
    }

    // CRITICAL: If a planId is provided, immediately sync permissions for the School Owner
    if (planId) {
        const syncRes = await syncPlanModulesToSchoolOwnerPermissions(branchId, planId);
        if (syncRes.error) {
             console.error("Role creation warning: Permission sync failed", syncRes.error);
        }
    }

    return data || [];
  }
};
