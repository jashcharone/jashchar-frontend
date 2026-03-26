import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { autoRepairSchoolOwnerPermissions } from '@/services/planModuleSyncService';

/**
 * Hook to automatically check and repair School Owner permissions on login.
 * Ensures that if a plan includes modules (like Academics), the owner ALWAYS has access.
 */
export const useSchoolOwnerPermissionCheck = () => {
  const { user, branchId } = useAuth();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const checkAndRepair = async () => {
      if (!user || !branchId || checked) return;

      const role = user?.profile?.role?.name || user?.user_metadata?.role;
      
      // Only run for School Owners
      if (role === 'school_owner') {
         try {
           // We run this optimistically. It's an upsert operation, so it's safe to run on every session init.
           // It ensures that if a new module was added to the plan backend-side, the owner gets it immediately.
           await autoRepairSchoolOwnerPermissions(branchId);
           console.log('[Safety] School Owner permissions verified and synced with Plan.');
         } catch (e) {
           console.error('[Safety] Permission auto-repair failed:', e);
         }
      }
      
      setChecked(true);
    };

    checkAndRepair();
  }, [user, branchId, checked]);

  return checked;
};
