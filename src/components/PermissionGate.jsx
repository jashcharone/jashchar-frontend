import React from 'react';
import { usePermissions } from '@/contexts/PermissionContext';

/**
 * A wrapper component to conditionally render content based on permissions.
 * 
 * Usage:
 * <PermissionGate module="student_information" action="add">
 *   <Button>Add Student</Button>
 * </PermissionGate>
 * 
 * @param {string} module - The module slug (e.g., 'student_information', 'fees_collection')
 * @param {string} action - The action to check ('view', 'add', 'edit', 'delete')
 * @param {ReactNode} children - The content to render if allowed
 * @param {ReactNode} fallback - Optional content to render if denied (default: null)
 */
const PermissionGate = ({ module, action, children, fallback = null }) => {
    const { canView, canAdd, canEdit, canDelete } = usePermissions();
    
    let allowed = false;
    
    switch (action) {
        case 'view':
            allowed = canView(module);
            break;
        case 'add':
            allowed = canAdd(module);
            break;
        case 'edit':
            allowed = canEdit(module);
            break;
        case 'delete':
            allowed = canDelete(module);
            break;
        default:
            allowed = false;
    }
    
    if (allowed) {
        return <>{children}</>;
    }
    
    return <>{fallback}</>;
};

export default PermissionGate;
