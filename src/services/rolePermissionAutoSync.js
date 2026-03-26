import { supabase } from '@/lib/customSupabaseClient';
import { ALL_MODULES } from '@/config/modules';

/**
 * Automatically syncs permissions when plans change or schools are created.
 */
export const rolePermissionAutoSync = {

  /**
   * Syncs permissions for a newly added module to all existing schools that have it in their plan.
   */
  syncRolePermissionsForNewModule: async (moduleId, branchId) => {
    const module = ALL_MODULES.find(m => m.id === moduleId || m.slug === moduleId);
    if (!module) return { synced: 0 };

    try {
       // Get School Owner Role
       const { data: roles } = await supabase
         .from('roles')
         .select('id, name')
         .eq('branch_id', branchId);

       if (!roles) return { synced: 0 };

       const updates = [];
       roles.forEach(role => {
         if (role.name.toLowerCase() === 'school_owner' || role.name === 'School Owner') {
            // Owner gets Full Access
            updates.push({
                role_id: role.id,
                module: module.slug,
                can_view: true, can_add: true, can_edit: true, can_delete: true
            });
         } else if (module.permissions.view) {
            // Others get default from config
            updates.push({
                role_id: role.id,
                module: module.slug,
                can_view: module.permissions.view,
                can_add: module.permissions.add,
                can_edit: module.permissions.edit,
                can_delete: module.permissions.delete
            });
         }
       });

       if (updates.length > 0) {
           await supabase.from('permissions').upsert(updates, { onConflict: 'role_id, module' });
       }

       return { synced: updates.length };
    } catch (e) {
        console.error("Role perm sync failed:", e);
        return { synced: 0 };
    }
  },

  /**
   * Syncs ALL permissions for a new school based on its plan.
   */
  syncRolePermissionsForNewSchool: async (branchId, planId) => {
     try {
        // 1. Get modules for plan from DB mapping
        const { data: planModules } = await supabase
            .from('plan_modules')
            .select('module_key')
            .eq('plan_id', planId);
        
        if (!planModules || planModules.length === 0) return { synced: 0 };

        // 2. Get Roles
        const { data: roles } = await supabase
            .from('roles')
            .select('id, name')
            .eq('branch_id', branchId);

        if (!roles) return { synced: 0 };

        const updates = [];
        const ownerRole = roles.find(r => r.name === 'school_owner');

        // 3. Build Permissions
        planModules.forEach(pm => {
            const modKey = pm.module_key;
            const modConfig = ALL_MODULES.find(m => m.slug === modKey);
            
            // Skip if unknown module in DB but not in code (safety)
            if (!modConfig) return; 

            // Owner
            if (ownerRole) {
                updates.push({
                    role_id: ownerRole.id,
                    module: modKey,
                    can_view: true, can_add: true, can_edit: true, can_delete: true
                });
            }

            // Other Roles - Apply defaults if configured
            // (We could extend this to be more granular per role type in future)
        });

        if (updates.length > 0) {
            await supabase.from('permissions').upsert(updates, { onConflict: 'role_id, module' });
        }

        return { synced: updates.length };

     } catch (e) {
         console.error("New school perm sync failed:", e);
         return { synced: 0 };
     }
  }
};
