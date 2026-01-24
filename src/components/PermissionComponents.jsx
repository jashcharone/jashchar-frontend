/**
 * Universal Permission Wrapper for ALL Pages
 * Automatically adds permission checks to Edit/Delete/Add buttons
 * 
 * Usage:
 *   import { PermissionButton } from '@/components/PermissionButton';
 *   
 *   <PermissionButton 
 *     moduleSlug="academics.sections" 
 *     action="edit"
 *     variant="ghost"
 *     onClick={() => handleEdit(item)}
 *   >
 *     <Edit className="h-4 w-4" />
 *   </PermissionButton>
 */

import React from 'react';
import { usePermissions } from '@/contexts/PermissionContext';
import { Button } from '@/components/ui/button';

export const PermissionButton = ({ 
  moduleSlug, 
  action = 'view', 
  children, 
  fallback = null,
  ...buttonProps 
}) => {
  const { canView, canAdd, canEdit, canDelete } = usePermissions();

  // Map action to permission check function
  const checkFunctions = {
    'view': canView,
    'add': canAdd,
    'edit': canEdit,
    'delete': canDelete
  };

  const checkPermission = checkFunctions[action];
  
  if (!checkPermission) {
    console.warn(`Invalid action: ${action}`);
    return fallback;
  }

  const hasPermission = checkPermission(moduleSlug);

  if (!hasPermission) {
    return fallback; // Don't render if no permission
  }

  // Avoid nested <button> issues by using asChild when wrapping a button-like element
  const shouldUseAsChild = React.isValidElement(children);

  if (shouldUseAsChild) {
    return (
      <Button asChild {...buttonProps}>
        {children}
      </Button>
    );
  }

  return (
    <Button {...buttonProps}>
      {children}
    </Button>
  );
};


/**
 * Higher-Order Component to wrap entire pages with permission check
 * 
 * Usage:
 *   export default withPermission(SectionsPage, 'academics.sections', 'view');
 */
export const withPermission = (Component, moduleSlug, action = 'view') => {
  return function PermissionWrappedComponent(props) {
    const { canView, canAdd, canEdit, canDelete, loading } = usePermissions();

    const checkFunctions = {
      'view': canView,
      'add': canAdd,
      'edit': canEdit,
      'delete': canDelete
    };

    if (loading) {
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      );
    }

    const checkPermission = checkFunctions[action];
    const hasPermission = checkPermission ? checkPermission(moduleSlug) : false;

    if (!hasPermission) {
      return (
        <div className="flex flex-col items-center justify-center h-screen">
          <h1 className="text-2xl font-bold text-destructive mb-4">Access Denied</h1>
          <p className="text-muted-foreground">
            You don't have permission to {action} {moduleSlug}
          </p>
        </div>
      );
    }

    return <Component {...props} />;
  };
};


/**
 * Permission-aware wrapper for action buttons in tables
 * 
 * Usage:
 *   <ActionButtons 
 *     moduleSlug="academics.sections"
 *     onEdit={() => handleEdit(item)}
 *     onDelete={() => handleDelete(item.id)}
 *   />
 */
export const ActionButtons = ({ 
  moduleSlug, 
  onEdit, 
  onDelete,
  editIcon = null,
  deleteIcon = null,
  className = ""
}) => {
  const { canEdit, canDelete } = usePermissions();

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {canEdit(moduleSlug) && onEdit && (
        <Button variant="ghost" size="icon" onClick={onEdit}>
          {editIcon || <Edit className="h-4 w-4 text-blue-600" />}
        </Button>
      )}
      
      {canDelete(moduleSlug) && onDelete && (
        <Button variant="ghost" size="icon" onClick={onDelete}>
          {deleteIcon || <Trash2 className="h-4 w-4 text-red-600" />}
        </Button>
      )}
    </div>
  );
};
