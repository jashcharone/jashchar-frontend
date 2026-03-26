import { mergeObjectsSafe } from '@/utils/appendOnlyMerge';

/**
 * PERMISSION SAFE MODE
 * Ensures permissions can only be expanded, never restricted or deleted for existing roles.
 */

export const mergePermissions = (existingPermissions, newPermissions) => {
  return mergeObjectsSafe(existingPermissions, newPermissions, 'Permissions');
};

export const validatePermissionIntegrity = (original, current) => {
  // Check if any key from original is missing in current
  const originalKeys = Object.keys(original);
  const missingKeys = originalKeys.filter(key => !current.hasOwnProperty(key));
  
  if (missingKeys.length > 0) {
    console.error('[Permission Shield] CRITICAL: Permissions dropped!', missingKeys);
    return false;
  }
  return true;
};
