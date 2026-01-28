import React from 'react';
import MasterAdminCmsWrapper from '@/components/front-cms/MasterAdminCmsWrapper';
import Pages from '@/pages/super-admin/front-cms/Pages';

/**
 * Master Admin Pages
 * Uses MasterAdminCmsWrapper to provide organization selection
 * Reuses Super Admin Pages component with hideDashboardLayout
 */
const MasterAdminPages = () => {
  return (
    <MasterAdminCmsWrapper title="Pages" description="Manage website pages and content">
      {(orgId) => <Pages branchId={orgId} hideDashboardLayout />}
    </MasterAdminCmsWrapper>
  );
};

export default MasterAdminPages;
