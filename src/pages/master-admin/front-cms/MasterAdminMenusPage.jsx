import React from 'react';
import MasterAdminCmsWrapper from '@/components/front-cms/MasterAdminCmsWrapper';
import Menus from '@/pages/super-admin/front-cms/Menus';

/**
 * Master Admin Menus
 * Uses MasterAdminCmsWrapper to provide organization selection
 * Reuses Super Admin Menus component with hideDashboardLayout
 */
const MasterAdminMenusPage = () => {
  return (
    <MasterAdminCmsWrapper title="Menus" description="Manage website navigation menus">
      {(orgId) => <Menus branchId={orgId} hideDashboardLayout />}
    </MasterAdminCmsWrapper>
  );
};

export default MasterAdminMenusPage;
