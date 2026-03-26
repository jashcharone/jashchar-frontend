import { usePermissions as usePermsContext } from '@/contexts/PermissionContext';

export const usePermissions = (moduleKey) => {
  const { canView, canAdd, canEdit, canDelete, loading } = usePermsContext();

  if (!moduleKey) return { loading };

  return {
    canView: canView(moduleKey),
    canAdd: canAdd(moduleKey),
    canEdit: canEdit(moduleKey),
    canDelete: canDelete(moduleKey),
    loading
  };
};
