import React from 'react';
import MasterAdminCmsWrapper from '@/components/front-cms/MasterAdminCmsWrapper';
import Menus from '@/pages/super-admin/front-cms/Menus';

/**
 * Master Admin - Menus Page
 * Uses the same Menus component as Super Admin, wrapped with Organization selector
 */
const MasterAdminMenus = () => {
  return (
    <MasterAdminCmsWrapper title="Menus" description="Manage website navigation menus">
      {(orgId) => <Menus branchId={orgId} hideDashboardLayout />}
    </MasterAdminCmsWrapper>
  );
};

export default MasterAdminMenus;
