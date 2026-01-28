import React from 'react';
import MasterAdminCmsWrapper from '@/components/front-cms/MasterAdminCmsWrapper';
import Events from '@/pages/super-admin/front-cms/Events';

/**
 * Master Admin Events
 * Uses MasterAdminCmsWrapper to provide organization selection
 * Reuses Super Admin Events component with hideDashboardLayout
 */
const MasterAdminEvents = () => {
  return (
    <MasterAdminCmsWrapper title="Events" description="Manage organization events">
      {(orgId) => <Events branchId={orgId} hideDashboardLayout />}
    </MasterAdminCmsWrapper>
  );
};

export default MasterAdminEvents;
