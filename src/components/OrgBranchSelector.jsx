/**
 * Organization/Branch Selector Component
 * Allows users to switch between their organizations and branches
 */

import React, { useState, useEffect } from 'react';
import { Building2, GitBranch, ChevronDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import api from '@/lib/api';

export const OrgBranchSelector = ({ compact = false, className = '' }) => {
  const { user } = useAuth();
  const { selectedBranch, setSelectedBranch, branches, loading: branchLoading } = useBranch();
  
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [orgBranches, setOrgBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch user's organizations
  useEffect(() => {
    const fetchOrganizations = async () => {
      if (!user) return;
      
      try {
        const response = await api.get('/org/my-organizations');
        if (response.data?.success) {
          setOrganizations(response.data.data || []);
          
          // Auto-select first org or restore from localStorage
          const savedOrgId = localStorage.getItem('selectedOrganizationId');
          const orgs = response.data.data || [];
          
          if (orgs.length > 0) {
            const saved = savedOrgId ? orgs.find(o => o.organization_id === savedOrgId) : null;
            setSelectedOrg(saved || orgs[0]);
          }
        }
      } catch (error) {
        console.error('Failed to fetch organizations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizations();
  }, [user]);

  // Fetch branches when org changes
  useEffect(() => {
    const fetchBranches = async () => {
      if (!selectedOrg?.organization_id) {
        setOrgBranches([]);
        return;
      }

      try {
        const response = await api.get(`/org/${selectedOrg.organization_id}/branches`);
        if (response.data?.success) {
          setOrgBranches(response.data.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch branches:', error);
        // Fall back to branches from BranchContext
        setOrgBranches(branches || []);
      }
    };

    fetchBranches();
  }, [selectedOrg, branches]);

  // Handle organization change
  const handleOrgChange = (org) => {
    setSelectedOrg(org);
    localStorage.setItem('selectedOrganizationId', org.organization_id);
    
    // Reset branch selection when org changes
    const orgBranchList = orgBranches.filter(b => b.organization_id === org.organization_id);
    if (orgBranchList.length > 0) {
      const primaryBranch = orgBranchList.find(b => b.is_primary) || orgBranchList[0];
      handleBranchChange(primaryBranch);
    }
  };

  // Handle branch change
  const handleBranchChange = (branch) => {
    setSelectedBranch(branch);
    localStorage.setItem('selectedBranchId', branch.id);
    
    // Dispatch event for other components to react
    window.dispatchEvent(new CustomEvent('branchChanged', { detail: { branch, org: selectedOrg } }));
  };

  // Single org, single branch - minimal UI
  if (organizations.length <= 1 && orgBranches.length <= 1) {
    if (compact) return null;
    
    return (
      <div className={`flex items-center gap-2 text-sm text-muted-foreground ${className}`}>
        {selectedOrg && (
          <span className="flex items-center gap-1">
            <Building2 className="h-4 w-4" />
            {selectedOrg.organization_name}
          </span>
        )}
        {selectedBranch && orgBranches.length > 0 && (
          <>
            <span>/</span>
            <span className="flex items-center gap-1">
              <GitBranch className="h-4 w-4" />
              {selectedBranch.name || selectedBranch.branch_name}
            </span>
          </>
        )}
      </div>
    );
  }

  // Multiple orgs or branches - show dropdowns
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Organization Selector */}
      {organizations.length > 1 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size={compact ? 'sm' : 'default'} className="gap-2">
              <Building2 className="h-4 w-4" />
              <span className="max-w-[120px] truncate">
                {selectedOrg?.organization_name || 'Select Organization'}
              </span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[220px]">
            <DropdownMenuLabel>Organizations</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {organizations.map((org) => (
              <DropdownMenuItem
                key={org.organization_id}
                onClick={() => handleOrgChange(org)}
                className="flex items-center justify-between cursor-pointer"
              >
                <div className="flex flex-col">
                  <span>{org.organization_name}</span>
                  <span className="text-xs text-muted-foreground">{org.organization_code}</span>
                </div>
                {selectedOrg?.organization_id === org.organization_id && (
                  <Check className="h-4 w-4 text-primary" />
                )}
                {org.is_owner && (
                  <Badge variant="secondary" className="ml-2 text-xs">Owner</Badge>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Branch Selector */}
      {orgBranches.length > 1 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size={compact ? 'sm' : 'default'} className="gap-2">
              <GitBranch className="h-4 w-4" />
              <span className="max-w-[150px] truncate">
                {selectedBranch?.name || selectedBranch?.branch_name || 'Select Branch'}
              </span>
              {selectedBranch?.sequence && (
                <Badge variant="outline" className="ml-1 text-xs">
                  {selectedBranch.is_primary ? 'Main' : `#${selectedBranch.sequence}`}
                </Badge>
              )}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[240px]">
            <DropdownMenuLabel>Branches</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {orgBranches.map((branch) => (
              <DropdownMenuItem
                key={branch.id}
                onClick={() => handleBranchChange(branch)}
                className="flex items-center justify-between cursor-pointer"
              >
                <div className="flex flex-col">
                  <span className="flex items-center gap-2">
                    {branch.name || branch.branch_name}
                    {branch.is_primary && (
                      <Badge variant="secondary" className="text-xs">Primary</Badge>
                    )}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Branch-{branch.sequence} • {branch.branch_code}
                  </span>
                </div>
                {selectedBranch?.id === branch.id && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Loading state */}
      {(loading || branchLoading) && (
        <div className="animate-pulse flex items-center gap-2">
          <div className="h-9 w-32 bg-muted rounded" />
        </div>
      )}
    </div>
  );
};

/**
 * Compact version for headers/sidebars
 */
export const OrgBranchBadge = ({ className = '' }) => {
  const { selectedBranch } = useBranch();
  
  if (!selectedBranch) return null;

  return (
    <div className={`flex items-center gap-1 text-xs text-muted-foreground ${className}`}>
      <GitBranch className="h-3 w-3" />
      <span className="truncate max-w-[100px]">
        {selectedBranch.name || selectedBranch.branch_name}
      </span>
      {selectedBranch.sequence && (
        <span className="opacity-60">#{selectedBranch.sequence}</span>
      )}
    </div>
  );
};

/**
 * Hook to get current org/branch context for API calls
 */
export const useOrgBranchContext = () => {
  const { selectedBranch } = useBranch();
  
  const getOrgId = () => localStorage.getItem('selectedOrganizationId');
  const getBranchId = () => selectedBranch?.id || localStorage.getItem('selectedBranchId');
  
  // Headers to include in API requests
  const getContextHeaders = () => ({
    'X-Organization-Id': getOrgId(),
    'X-Branch-Id': getBranchId(),
  });

  return {
    organizationId: getOrgId(),
    branchId: getBranchId(),
    getContextHeaders,
    selectedBranch,
  };
};

export default OrgBranchSelector;
