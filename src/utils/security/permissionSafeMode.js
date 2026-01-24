/**
 * PERMISSION SAFE MODE
 * Enforces "Append-Only" logic for Roles and Permissions.
 */

export const validatePermissionMerge = (existingPermissions, newPermissions) => {
    const violations = [];
    
    // 1. Check for deletions
    Object.keys(existingPermissions).forEach(role => {
        if (!newPermissions[role]) {
            violations.push(`CRITICAL: Role '${role}' missing in new configuration.`);
        } else {
            // Check for permission reduction
            const oldPerms = existingPermissions[role];
            const newPerms = newPermissions[role];
            
            // Assuming array of permission strings
            if (Array.isArray(oldPerms) && Array.isArray(newPerms)) {
                const missing = oldPerms.filter(p => !newPerms.includes(p));
                if (missing.length > 0) {
                    violations.push(`CRITICAL: Permissions revoked for '${role}': ${missing.join(', ')}`);
                }
            }
        }
    });

    if (violations.length > 0) {
        throw new Error(`PERMISSION SAFE MODE VIOLATION:\n${violations.join('\n')}`);
    }

    return true;
};

export const safeMergePermissions = (base, extension) => {
    const merged = JSON.parse(JSON.stringify(base)); // Deep copy
    
    Object.keys(extension).forEach(role => {
        if (!merged[role]) {
            merged[role] = extension[role]; // New role
        } else {
            // Merge permissions array unique
            const combined = new Set([...merged[role], ...extension[role]]);
            merged[role] = Array.from(combined);
        }
    });
    
    return merged;
};
