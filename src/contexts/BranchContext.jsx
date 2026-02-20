import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from './SupabaseAuthContext';
import { branchService } from '@/services/branchService';

const BranchContext = createContext();

export const useBranch = () => useContext(BranchContext);

export const BranchProvider = ({ children }) => {
  const { user, school: authSchool } = useAuth();
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // ✅ FIX: Track if data is already loaded for this user/school combo
  const loadedForRef = useRef({ userId: null, schoolId: null });

  // ✅ FIX: Use primitive IDs in dependency array instead of objects
  const userId = user?.id;
  const schoolId = authSchool?.id;

  // ✅ Update document title when selected branch changes
  useEffect(() => {
    if (selectedBranch?.branch_name) {
      document.title = selectedBranch.branch_name;
    }
  }, [selectedBranch]);

  useEffect(() => {
    // Skip if no user or school
    if (!userId || !schoolId) {
      setBranches([]);
      setSelectedBranch(null);
      setSchool(null);
      setLoading(false);
      loadedForRef.current = { userId: null, schoolId: null };
      return;
    }
    
    // ✅ FIX: Skip refetch if already loaded for same user/school
    if (loadedForRef.current.userId === userId && loadedForRef.current.schoolId === schoolId) {
      return;
    }
    
    loadBranchData();
  }, [userId, schoolId]);

  const loadBranchData = async () => {
    setLoading(true);
    try {
      setSchool(authSchool);
      let availableBranches = [];

      // 1. Check if user is the owner of the school
      if (authSchool.owner_user_id === user.id) {
        // Owner sees all branches
        availableBranches = await branchService.getBranches(authSchool.id);
      } else {
        // 2. Staff/Student sees assigned branches
        // Pass branchId instead of userId, as service expects branchId now
        availableBranches = await branchService.getMyBranches(authSchool.id);
      }

      setBranches(availableBranches);

      // Restore selection or default to primary branch
      const savedBranchId = localStorage.getItem('selectedBranchId');
      
      // CRITICAL FIX: Only use saved branch if it's in the user's available branches
      // This prevents cross-user branch access when localStorage is shared
      const found = savedBranchId && savedBranchId !== 'all' 
        ? availableBranches.find(b => b.id === savedBranchId) 
        : null;
      
      if (found) {
        setSelectedBranch(found);
        console.log('[BranchContext] Restored saved branch:', found.branch_name || found.id);
      } else if (availableBranches.length > 0) {
        // Clear invalid saved branch
        if (savedBranchId && savedBranchId !== 'all') {
          console.log('[BranchContext] Saved branch not in available list, clearing. Saved:', savedBranchId);
          localStorage.removeItem('selectedBranchId');
        }
        // Prefer Primary/Main Branch if available (check both is_primary and is_main fields)
        const primaryBranch = availableBranches.find(b => b.is_primary === true || b.is_main === true);
        const defaultBranch = primaryBranch || availableBranches[0];
        
        setSelectedBranch(defaultBranch);
        localStorage.setItem('selectedBranchId', defaultBranch.id);
        console.log('[BranchContext] Using default branch:', defaultBranch.branch_name || defaultBranch.id);
      } else {
        // No branches available
        setSelectedBranch(null);
      }

      // Auto-select if only one branch exists (Single School Mode)
      if (availableBranches.length === 1) {
          const single = availableBranches[0];
          if (selectedBranch?.id !== single.id) {
              setSelectedBranch(single);
              localStorage.setItem('selectedBranchId', single.id);
          }
      }
      
      // ✅ FIX: Mark as loaded for this user/school combo
      loadedForRef.current = { userId, schoolId };

    } catch (error) {
      console.error("Failed to load branch data", error);
    } finally {
      setLoading(false);
    }
  };

  const setSelectedBranchWrapper = (branch) => {
      if (branch === null) {
          // Should not happen in new logic unless no branches exist
          setSelectedBranch(null);
          localStorage.removeItem('selectedBranchId');
      } else {
          setSelectedBranch(branch);
          localStorage.setItem('selectedBranchId', branch.id);
      }
  };

  // ✅ FIX: Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({ 
    branches, 
    selectedBranch, 
    school, 
    setSelectedBranch: setSelectedBranchWrapper, 
    loading 
  }), [branches, selectedBranch, school, loading]);

  return (
    <BranchContext.Provider value={contextValue}>
      {children}
    </BranchContext.Provider>
  );
};
