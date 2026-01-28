import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import SelectOrganizationType from './SelectOrganizationType';

/**
 * Wrapper component for SelectOrganizationType when used as a standalone page
 * This ensures DashboardLayout is applied when accessed via route
 */
const SelectOrganizationTypePage = () => {
  return (
    <DashboardLayout>
      <SelectOrganizationType />
    </DashboardLayout>
  );
};

export default SelectOrganizationTypePage;
