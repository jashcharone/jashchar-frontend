import { useEffect, useState } from 'react';
import { initializeSystemOnStartup } from '@/services/initializationService';
import { autoRepairAllSchoolOwnerPermissions } from '@/services/permissionAutoRepairService';
import { getSchoolOwnerProfile } from '@/services/schoolOwnerProfileService';
import { useAuth } from '@/contexts/SupabaseAuthContext';

/**
 * Hook that runs critical safety checks and repairs on login.
 * Intended for School Owners to self-heal their account setup.
 */
export const useLoginSafetyCheck = () => {
    const { user, branchId } = useAuth();
    const [status, setStatus] = useState({ checked: false, repairs: {}, errors: [] });

    useEffect(() => {
        const runChecks = async () => {
            if (!user || !branchId || status.checked) return;

            const role = user?.user_metadata?.role;
            if (role !== 'school_owner') {
                setStatus(s => ({ ...s, checked: true }));
                return;
            }

            console.log("[Safety] Running login safety checks...");
            const repairs = {};
            const errors = [];

            // 1. Global System Init (Seeding/Table Checks)
            const initResult = await initializeSystemOnStartup();
            repairs.systemInit = initResult;

            // 2. Profile Check
            const profileResult = await getSchoolOwnerProfile(user.id);
            repairs.profile = profileResult;
            if (!profileResult.success) errors.push("Profile recovery failed");

            // 3. Permission Repair
            const permResult = await autoRepairAllSchoolOwnerPermissions(branchId);
            repairs.permissions = permResult;
            if (!permResult.success) errors.push("Permission repair failed");

            setStatus({ checked: true, repairs, errors });
            console.log("[Safety] Checks complete", { repairs, errors });
        };

        runChecks();
    }, [user, branchId, status.checked]);

    return status;
};
