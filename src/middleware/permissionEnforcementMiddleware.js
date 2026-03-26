import { enforceBackendPermission } from '@/utils/permissionVisibilityHelper';

/**
 * Mock middleware for enforcement in client-side code (to be used in API wrappers).
 * In a real Node.js environment, this would be Express/Connect middleware.
 */
export const permissionEnforcementMiddleware = async (moduleId, action, userRole, permissions) => {
  // 1. Master Admin Bypass
  if (userRole === 'master_admin') {
    return true;
  }

  // 2. Check Granular Permissions
  const isAllowed = enforceBackendPermission(moduleId, action, permissions);

  if (!isAllowed) {
    console.warn(`[Access Denied] User ${userRole} blocked from ${action} on ${moduleId}`);
    return false; // Callers should handle this false as a 403/Error
  }

  return true;
};
