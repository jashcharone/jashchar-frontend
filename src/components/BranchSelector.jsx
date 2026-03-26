import React from 'react';
import { useBranch } from '@/contexts/BranchContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, GitBranch } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

const BranchSelector = () => {
  const { branches, selectedBranch, setSelectedBranch, loading } = useBranch();
  const { user } = useAuth();
  
  // Helper to get branch display name (handles both field names)
  const getBranchName = (branch) => branch?.name || branch?.branch_name || 'Unnamed Branch';

  // Only show for school_owner or admin roles - check all possible role sources
  const rawRole = user?.role || user?.profile?.role?.name || user?.profile?.role || user?.user_metadata?.role;
  const userRole = rawRole?.toLowerCase()?.replace(/\s+/g, '_');
  const userType = user?.userType || user?.profile?.type; // 'owner' or 'staff' from AuthContext

  const canSeeBranchSelector = 
    ['super_admin', 'school_owner', 'organization_owner', 'admin'].includes(userRole) || 
    userType === 'owner';

  if (!canSeeBranchSelector) {
    return null;
  }

  if (loading) {
    return <div className="h-9 w-[180px] animate-pulse bg-muted rounded-md" />;
  }

  // Show even if no branches (for single school users)
  if (!branches || branches.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-md">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Main School</span>
      </div>
    );
  }

  // If only one branch exists (Single School), show it as a static badge instead of a dropdown
  if (branches.length === 1) {
    const singleBranch = branches[0];
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/10 rounded-md">
        <Building2 className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium text-primary">{getBranchName(singleBranch)}</span>
      </div>
    );
  }

  const handleValueChange = (value) => {
    const branch = branches.find(b => b.id === value);
    if (branch) {
      setSelectedBranch(branch);
    }
  };

  // Ensure selectedBranch is valid
  const safeSelectedBranchId = selectedBranch?.id && branches.some(b => b.id === selectedBranch.id) 
    ? selectedBranch.id 
    : '';

  return (
    <div className="flex items-center gap-2">
      <Select 
        value={safeSelectedBranchId} 
        onValueChange={handleValueChange}
        disabled={branches.length === 0}
      >
        <SelectTrigger className="w-[200px] h-9 bg-background border-primary/20 hover:border-primary/50 transition-colors">
          <div className="flex items-center gap-2 truncate">
            <GitBranch className="h-4 w-4 text-primary flex-shrink-0" />
            <SelectValue placeholder="Select Branch">
              {selectedBranch ? getBranchName(selectedBranch) : 'Select Branch'}
            </SelectValue>
          </div>
        </SelectTrigger>
        <SelectContent>
          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
            Switch Branch
          </div>
          {branches.map((branch) => (
            <SelectItem key={branch.id} value={branch.id}>
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${branch.is_active !== false ? 'bg-green-500' : 'bg-gray-400'}`} />
                <span>{getBranchName(branch)}</span>
                {(branch.is_primary || branch.is_main) && (
                  <Badge variant="secondary" className="text-[10px] px-1 py-0">Primary</Badge>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default BranchSelector;
