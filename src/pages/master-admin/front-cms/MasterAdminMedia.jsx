import React from 'react';
import MasterAdminCmsWrapper from '@/components/front-cms/MasterAdminCmsWrapper';
import MediaManager from '@/pages/super-admin/front-cms/MediaManager';

/**
 * Master Admin Media Manager
 * Uses MasterAdminCmsWrapper to provide organization selection
 * Reuses Super Admin MediaManager component with hideDashboardLayout
 */
const MasterAdminMedia = () => {
  return (
    <MasterAdminCmsWrapper title="Media Manager" description="Manage organization media files">
      {(orgId) => <MediaManager branchId={orgId} hideDashboardLayout />}
    </MasterAdminCmsWrapper>
  );
};

export default MasterAdminMedia;
