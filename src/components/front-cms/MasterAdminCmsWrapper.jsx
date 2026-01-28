import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';
import { Loader2, Building2, Globe } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';

/**
 * ============================================================================
 * MASTER ADMIN CMS WRAPPER
 * ============================================================================
 * This wrapper provides Organization selection for Master Admin Front CMS pages.
 * It passes the selected organization ID to child components.
 * 
 * Usage:
 *   <MasterAdminCmsWrapper>
 *     {(orgId) => <Menus branchId={orgId} />}
 *   </MasterAdminCmsWrapper>
 * ============================================================================
 */
const MasterAdminCmsWrapper = ({ children, title, description }) => {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState(searchParams.get('org_id') || '');
  const [loadingOrgs, setLoadingOrgs] = useState(true);

  // Initialize from URL params or sessionStorage
  useEffect(() => {
    const orgId = searchParams.get('org_id') || sessionStorage.getItem('ma_target_org_id') || '';
    if (orgId) {
      setSelectedOrgId(orgId);
      sessionStorage.setItem('ma_target_org_id', orgId);
    }
  }, [searchParams]);

  // Handler for organization change
  const handleOrgChange = (newOrgId) => {
    setSelectedOrgId(newOrgId);
    sessionStorage.setItem('ma_target_org_id', newOrgId);
    setSearchParams({ org_id: newOrgId });
  };

  // Fetch Organizations
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const response = await api.get('/organization-management/organizations');
        const orgsData = Array.isArray(response.data) 
          ? response.data 
          : (response.data?.data || response.data?.organizations || []);
        
        const activeOrgs = orgsData.filter(org => 
          ['Active', 'active', 'ACTIVE'].includes(org.status)
        );
        
        setOrganizations(activeOrgs);
        
        // Auto-select first org if none selected
        if (!selectedOrgId && activeOrgs.length > 0) {
          const firstOrgId = activeOrgs[0].id;
          setSelectedOrgId(firstOrgId);
          sessionStorage.setItem('ma_target_org_id', firstOrgId);
        }
      } catch (error) {
        console.error('[MasterAdminCmsWrapper] Error:', error);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to load organizations' });
      } finally {
        setLoadingOrgs(false);
      }
    };
    fetchOrganizations();
  }, [toast]);

  const selectedOrg = organizations.find(o => o.id === selectedOrgId);

  if (loadingOrgs) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="animate-spin h-8 w-8" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header with Organization Selector */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {title || 'Front CMS Manager'}
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              {description || 'Manage public website content for organizations'}
            </p>
          </div>
          
          {/* Organization Selector */}
          <div className="w-72">
            <Select value={selectedOrgId} onValueChange={handleOrgChange}>
              <SelectTrigger className="bg-white dark:bg-slate-800">
                <Building2 className="h-4 w-4 mr-2 text-blue-500" />
                <SelectValue placeholder="Select Organization" />
              </SelectTrigger>
              <SelectContent>
                {organizations.map(org => (
                  <SelectItem key={org.id} value={org.id}>
                    <div className="flex items-center gap-2">
                      <Globe className="h-3 w-3 text-green-500" />
                      {org.org_name || org.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Info Banner */}
        {selectedOrg && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-blue-500" />
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-100">
                  Managing: {selectedOrg.org_name || selectedOrg.name}
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Content applies to entire organization and all its branches
                </p>
              </div>
            </div>
          </div>
        )}

        {/* No Selection Message */}
        {!selectedOrgId && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-6 text-center">
            <Building2 className="h-12 w-12 mx-auto text-amber-500 mb-3" />
            <h3 className="text-lg font-medium text-amber-900 dark:text-amber-100">
              Select an Organization
            </h3>
            <p className="text-amber-700 dark:text-amber-300 mt-1">
              Choose an organization from the dropdown above to manage its content
            </p>
          </div>
        )}
        
        {/* Render children with orgId */}
        {selectedOrgId && children(selectedOrgId)}
      </div>
    </DashboardLayout>
  );
};

export default MasterAdminCmsWrapper;
