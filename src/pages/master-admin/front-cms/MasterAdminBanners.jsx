import React from 'react';
import MasterAdminCmsWrapper from '@/components/front-cms/MasterAdminCmsWrapper';
import BannerImages from '@/pages/super-admin/front-cms/BannerImages';

/**
 * Master Admin Banners
 * Uses MasterAdminCmsWrapper to provide organization selection
 * Reuses Super Admin BannerImages component with hideDashboardLayout
 */
const MasterAdminBanners = () => {
  return (
    <MasterAdminCmsWrapper title="Banner Images" description="Manage homepage banner images">
      {(orgId) => <BannerImages branchId={orgId} hideDashboardLayout />}
    </MasterAdminCmsWrapper>
  );
};

export default MasterAdminBanners;
