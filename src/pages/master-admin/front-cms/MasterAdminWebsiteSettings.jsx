import React from 'react';
import MasterAdminCmsWrapper from '@/components/front-cms/MasterAdminCmsWrapper';
import FrontCMSSetting from '@/pages/super-admin/front-cms/FrontCMSSetting';

/**
 * Master Admin Website Settings
 * Uses MasterAdminCmsWrapper to provide organization selection
 * Reuses Super Admin FrontCMSSetting component with hideDashboardLayout
 */
const MasterAdminWebsiteSettings = () => {
  return (
    <MasterAdminCmsWrapper title="Website Settings" description="Configure organization website settings">
      {(orgId) => <FrontCMSSetting branchId={orgId} hideDashboardLayout />}
    </MasterAdminCmsWrapper>
  );
};

export default MasterAdminWebsiteSettings;
