import { supabase } from '@/lib/customSupabaseClient';
import { autoRepairSchoolOwnerPermissions } from '@/services/planModuleSyncService';

export const rolePermissionService = {
  /**
   * Fetch all permissions for a specific role.
   * Includes a safety check for School Owners to ensure plan sync.
   */
  getRolePermissions: async (roleId) => {
    const { data, error } = await supabase
      .from('permissions')
      .select('*')
      .eq('role_id', roleId);
    
    if (error) throw error;
    
    const permObject = {};
    data.forEach(p => {
      permObject[p.module] = p;
    });
    return permObject;
  },

  /**
   * Get permissions with an auto-repair step for critical roles.
   */
  getRolePermissionsWithPlanSync: async (roleId, branchId, roleName) => {
     if (roleName === 'school_owner') {
         await autoRepairSchoolOwnerPermissions(branchId);
     }
     return rolePermissionService.getRolePermissions(roleId);
  },

  /**
   * Update or Insert permission for a role and module
   */
  updateRolePermission: async (roleId, moduleKey, perms) => {
    const payload = {
      role_id: roleId,
      module: moduleKey,
      can_view: perms.view,
      can_add: perms.add,
      can_edit: perms.edit,
      can_delete: perms.delete,
      updated_at: new Date()
    };

    const { data, error } = await supabase
      .from('permissions')
      .upsert(payload, { onConflict: 'role_id, module' })
      .select();

    if (error) throw error;
    return data;
  },

  /**
   * Initialize default permissions for a role based on its type and active plan modules
   * UPDATED: Uses role_permissions table (branch_id, role_name, module_slug)
   */
  assignDefaultPermissions: async (roleId, roleName, activeModuleKeys, branchId) => {
    if (!branchId) {
        console.error("assignDefaultPermissions: branchId is missing");
        return;
    }

    const defaults = getDefaultsForRoleType(roleName);
    const permissionsToInsert = [];

    activeModuleKeys.forEach(modKey => {
      const roleDefaults = defaults[modKey] || defaults['*'] || { view: false, add: false, edit: false, delete: false };
      
      let perm = {
          branch_id: branchId,
          role_name: roleName,
          module_slug: modKey,
          can_view: false,
          can_add: false,
          can_edit: false,
          can_delete: false
      };

      if (roleName === 'School Owner' || roleName === 'school_owner') {
        perm.can_view = true;
        perm.can_add = true;
        perm.can_edit = true;
        perm.can_delete = true;
      } else {
        if (roleDefaults.view) {
           perm.can_view = roleDefaults.view;
           perm.can_add = roleDefaults.add;
           perm.can_edit = roleDefaults.edit;
           perm.can_delete = roleDefaults.delete;
        }
      }

      if (perm.can_view || roleName === 'School Owner' || roleName === 'school_owner') {
        permissionsToInsert.push(perm);
      }
    });

    if (permissionsToInsert.length > 0) {
      const { error } = await supabase.from('role_permissions').upsert(permissionsToInsert, { onConflict: 'branch_id, role_name, module_slug' });
      if (error) console.error("Error seeding permissions:", error);
    }
  }
};

// Helper for default policies
const getDefaultsForRoleType = (roleName) => {
  const r = roleName.toLowerCase().replace(/_/g, ' ');
  
  // Default policy: View Only unless specified
  const viewOnly = { view: true, add: false, edit: false, delete: false };
  const viewAdd = { view: true, add: true, edit: false, delete: false };
  const viewAddEdit = { view: true, add: true, edit: true, delete: false };
  
  switch(r) {
    case 'accountant':
      return {
        'fees_collection': viewAdd,
        'finance': viewAdd,
        'student_information': viewOnly,
        'human_resource': viewOnly,
        '*': { view: false, add: false, edit: false, delete: false }
      };
    case 'librarian':
      return {
        'library': viewAddEdit,
        '*': { view: false, add: false, edit: false, delete: false }
      };
    case 'teacher':
    case 'subject teacher':
      return {
        'academics': viewOnly,
        'student_information': viewOnly,
        'attendance': viewAdd,
        'examinations': viewAdd,
        'homework': viewAdd,
        '*': { view: false, add: false, edit: false, delete: false }
      };
    case 'class teacher':
      return {
        'academics': viewOnly,
        'student_information': viewOnly,
        'attendance': viewAddEdit,
        'examinations': viewAdd,
        'behaviour_records': viewAdd,
        'homework': viewAddEdit,
        'communicate': viewOnly,
        '*': { view: false, add: false, edit: false, delete: false }
      };
    case 'receptionist':
      return {
        'front_office': viewAddEdit,
        'student_information': viewOnly,
        '*': { view: false, add: false, edit: false, delete: false }
      };
    case 'principal':
      // Principal = School Head, needs full access to all modules
      return {
        'student_information': viewAddEdit,
        'human_resource': viewAddEdit,
        'attendance': viewAddEdit,
        'academics': viewAddEdit,
        'examinations': viewAddEdit,
        'behaviour_records': viewAddEdit,
        'communicate': viewAddEdit,
        'fees_collection': viewOnly,
        'library': viewOnly,
        'transport': viewOnly,
        'hostel': viewOnly,
        'front_office': viewOnly,
        'homework': viewAddEdit,
        'task_management': viewAddEdit,
        '*': viewOnly
      };
    case 'vice principal':
      // VP = Deputy Head, nearly same as principal
      return {
        'student_information': viewAddEdit,
        'human_resource': viewAddEdit,
        'attendance': viewAddEdit,
        'academics': viewAddEdit,
        'examinations': viewAddEdit,
        'behaviour_records': viewAddEdit,
        'communicate': viewAddEdit,
        'fees_collection': viewOnly,
        'library': viewOnly,
        'transport': viewOnly,
        'hostel': viewOnly,
        'front_office': viewOnly,
        'homework': viewAddEdit,
        '*': viewOnly
      };
    case 'coordinator':
      return {
        'academics': viewAddEdit,
        'student_information': viewOnly,
        'attendance': viewAdd,
        'examinations': viewAdd,
        'homework': viewAddEdit,
        'communicate': viewOnly,
        '*': { view: false, add: false, edit: false, delete: false }
      };
    case 'cashier':
      return {
        'fees_collection': viewAdd,
        '*': { view: false, add: false, edit: false, delete: false }
      };
    case 'lab assistant':
      return {
        'inventory': viewAdd,
        'communicate': viewOnly,
        '*': { view: false, add: false, edit: false, delete: false }
      };
    case 'hostel warden':
      return {
        'hostel': viewAddEdit,
        'student_information': viewOnly,
        'communicate': viewOnly,
        '*': { view: false, add: false, edit: false, delete: false }
      };
    case 'driver':
      return {
        'transport': viewOnly,
        'communicate': viewOnly,
        '*': { view: false, add: false, edit: false, delete: false }
      };
    case 'sports coach':
      return {
        'student_information': viewOnly,
        'attendance': viewOnly,
        'communicate': viewOnly,
        '*': { view: false, add: false, edit: false, delete: false }
      };
    case 'security guard':
      return {
        'front_office': viewOnly,
        'communicate': viewOnly,
        '*': { view: false, add: false, edit: false, delete: false }
      };
    case 'maintenance staff':
    case 'maintenance':
      return {
        'inventory': viewAdd,
        'communicate': viewOnly,
        '*': { view: false, add: false, edit: false, delete: false }
      };
    case 'peon':
      return {
        'communicate': viewOnly,
        '*': { view: false, add: false, edit: false, delete: false }
      };
    case 'admin':
      // Admin usually has more access but maybe not delete
      return {
        '*': viewAddEdit
      };
    case 'parent':
    case 'student':
      return {
        '*': viewOnly
      };
    default:
      return { '*': viewOnly };
  }
};
