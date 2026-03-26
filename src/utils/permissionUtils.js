import { supabase } from '@/lib/customSupabaseClient';
import { SIDEBAR_TO_MODULE_MAP } from '@/lib/moduleMapping';

/**
 * Checks if a user has specific permission for a module.
 * MASTER ADMIN BYPASS: Returns true immediately.
 * 
 * @param {Object} user - The user object with profile/metadata
 * @param {Object} permissions - The permissions object { 'module_key': { can_view: true... } }
 * @param {String} module - The module key to check
 * @param {String} action - 'view', 'add', 'edit', 'delete'
 * @returns {Boolean}
 */
export const hasPermission = (user, permissions, module, action = 'view') => {
  if (!user) return false;
  
  // 1. Master Admin Bypass - The Ultimate Shield
  const role = user?.profile?.role?.name || user?.user_metadata?.role;
  if (role === 'master_admin') return true;

  // 2. If no permissions object provided (e.g. loading), deny safe
  if (!permissions) return false;

  // 3. Check specific permission
  const modulePerms = permissions[module];
  if (!modulePerms) return false; // No record = No access

  switch (action) {
    case 'view': return !!modulePerms.can_view;
    case 'add': return !!modulePerms.can_add;
    case 'edit': return !!modulePerms.can_edit;
    case 'delete': return !!modulePerms.can_delete;
    default: return false;
  }
};

/**
 * Helper to map sidebar item to module key and check view permission
 */
export const canViewSidebarItem = (user, permissions, sidebarItem) => {
  if (!user) return false;
  const role = user?.profile?.role?.name || user?.user_metadata?.role;
  if (role === 'master_admin') return true;

  // Dashboards are usually always visible to their respective roles
  if (sidebarItem.title === 'Dashboard') return true;

  const moduleKey = SIDEBAR_TO_MODULE_MAP[sidebarItem.title];
  
  // If mapped, check permission
  if (moduleKey) {
    return hasPermission(user, permissions, moduleKey, 'view');
  }

  // If not mapped, it might be a safe public item or a specific route.
  // For safety in strict mode, if unmapped, we might hide it or show it.
  // We'll default to SHOW if unmapped to avoid hiding critical things accidentally,
  // but mostly we rely on the mapping.
  return true; 
};

export const fetchUserPermissions = async (userId) => {
  if (!userId) return {};
  
  try {
    // We need the role_id first. 
    // Assuming auth context provides it, but let's fetch safely from DB to be sure.
    // We can use the user's profile to get role_id.
    
    // Optimization: We often have user object with role info in context. 
    // But here we might need a fresh fetch.
    
    // 1. Get User Profile to find Role ID
    // Try student first as it's most common, or generic query
    // Actually, permissions are linked to role_id. 
    
    // Let's try to get permissions directly if we know the role_id from context.
    // But if we only have userId, we must look up.
    
    // Fast lookup via rpc or direct query if we know the table.
    // Since we have multiple profile tables, this is tricky purely by userId without context.
    // We will assume the caller passes the role_id if possible, or we fetch from 'profiles' (legacy) 
    // or try to match.
    
    // Better approach: Context loads permissions.
    return {}; // Placeholder, actual logic in Context/Service
  } catch (e) {
    console.error("Permission fetch error", e);
    return {};
  }
};
