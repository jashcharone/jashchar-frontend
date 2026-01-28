import React from 'react';
import MasterAdminCmsWrapper from '@/components/front-cms/MasterAdminCmsWrapper';
import Gallery from '@/pages/super-admin/front-cms/Gallery';

/**
 * Master Admin Gallery
 * Uses MasterAdminCmsWrapper to provide organization selection
 * Reuses Super Admin Gallery component with hideDashboardLayout
 */
const MasterAdminGallery = () => {
  return (
    <MasterAdminCmsWrapper title="Gallery" description="Manage organization photo gallery">
      {(orgId) => <Gallery branchId={orgId} hideDashboardLayout />}
    </MasterAdminCmsWrapper>
  );
};

export default MasterAdminGallery;
