import React from 'react';
import { useSearchParams } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import UnifiedFrontCmsEditor from '@/components/front-cms/UnifiedFrontCmsEditor';

const FrontCmsSchoolOwner = () => {
  const { school, user } = useAuth();
  const { selectedBranch } = useBranch();
  const [searchParams] = useSearchParams();
  const querySchoolId = searchParams.get('branch_id');
  const branchId = querySchoolId || school?.id || selectedBranch?.id || user?.profile?.branch_id;

  console.log('FrontCmsSchoolOwner: SchoolId:', branchId);

  return (
    <DashboardLayout>
      <UnifiedFrontCmsEditor 
        branchId={branchId} 
        role="super_admin"
        basePath="/super-admin/front-cms"
      />
    </DashboardLayout>
  );
};

export default FrontCmsSchoolOwner;
