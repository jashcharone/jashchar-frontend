import React from 'react';
import MasterAdminCmsWrapper from '@/components/front-cms/MasterAdminCmsWrapper';
import News from '@/pages/super-admin/front-cms/News';

/**
 * Master Admin News
 * Uses MasterAdminCmsWrapper to provide organization selection
 * Reuses Super Admin News component with hideDashboardLayout
 */
const MasterAdminNews = () => {
  return (
    <MasterAdminCmsWrapper title="News" description="Manage organization news articles">
      {(orgId) => <News branchId={orgId} hideDashboardLayout />}
    </MasterAdminCmsWrapper>
  );
};

export default MasterAdminNews;
