import { SIDEBAR_TO_MODULE_MAP } from '@/lib/moduleMapping';
import { ALL_MODULES } from '@/config/modules';

/**
 * Determines if a sidebar module should be visible to the user.
 * STRICT RULE: If master_admin -> Show ALL.
 * If other role -> Check specific 'can_view' permission for that module.
 */
export const shouldShowModuleInSidebar = (userRole, sidebarItem, permissions) => {
  // 1. Master Admin Bypass
  if (userRole === 'master_admin') {
    return true;
  }

  // 2. Always show Dashboard
  if (sidebarItem.title === 'Dashboard') {
    return true;
  }

  // 3. Map sidebar item to internal module key
  let moduleKey = SIDEBAR_TO_MODULE_MAP[sidebarItem.title];

  // If not in map, try to find by slug matching title (fallback)
  if (!moduleKey) {
      const found = ALL_MODULES.find(m => m.name === sidebarItem.title);
      if (found) moduleKey = found.slug;
  }

  // 4. If still no mapping found, it might be a public or un-restricted item.
  // If not mapped, we default to true unless strictly locked down.
  if (!moduleKey) {
    return true;
  }

  // 5. Check specific permission
  // STRICT: Must be explicitly true. Undefined or null means hidden.
  const canView = permissions?.[moduleKey]?.can_view === true;
  
  return canView;
};

/**
 * Returns granular action permissions for UI components (Buttons, Links)
 */
export const getModuleActionVisibility = (moduleKey, permissions) => {
  const perms = permissions?.[moduleKey];
  if (!perms) {
    return { canView: false, canAdd: false, canEdit: false, canDelete: false };
  }
  return {
    canView: !!perms.can_view,
    canAdd: !!perms.can_add,
    canEdit: !!perms.can_edit,
    canDelete: !!perms.can_delete
  };
};

/**
 * Backend/API enforcement helper
 */
export const enforceBackendPermission = (moduleKey, action, permissions) => {
   const perms = permissions?.[moduleKey];
   if (!perms) return false;
   
   switch (action) {
     case 'view': return !!perms.can_view;
     case 'add': return !!perms.can_add;
     case 'edit': return !!perms.can_edit;
     case 'delete': return !!perms.can_delete;
     default: return false;
   }
};
