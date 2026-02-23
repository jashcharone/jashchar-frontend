/**
 * ParentChildContext
 * 
 * Provides selected child state across all parent pages.
 * Fetches children from API and persists selected child in localStorage.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/supabaseClient';

const ParentChildContext = createContext(null);

export const ParentChildProvider = ({ children: reactChildren }) => {
  const { user, school } = useAuth();
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchChildren = useCallback(async () => {
    if (!user) return;
    
    // Only fetch for parent role
    const userRole = (user.user_metadata?.role || user.profile?.role || '').toLowerCase().replace(/\s+/g, '_');
    if (userRole !== 'parent') {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);

      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;
      const branchId = user.user_metadata?.branch_id || school?.id;

      const response = await fetch('/api/students/parent/children', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'x-branch-id': branchId
        }
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();
      const childrenData = result.children || [];
      setChildren(childrenData);

      // Restore previously selected child from localStorage
      const savedChildId = localStorage.getItem('parent_selected_child_id');
      const savedChild = childrenData.find(c => c.id === savedChildId);
      
      if (savedChild) {
        setSelectedChild(savedChild);
      } else if (childrenData.length > 0) {
        setSelectedChild(childrenData[0]);
        localStorage.setItem('parent_selected_child_id', childrenData[0].id);
      }
    } catch (err) {
      console.error('[ParentChildContext] Error fetching children:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, school]);

  useEffect(() => {
    fetchChildren();
  }, [fetchChildren]);

  const selectChild = useCallback((child) => {
    setSelectedChild(child);
    if (child?.id) {
      localStorage.setItem('parent_selected_child_id', child.id);
    }
  }, []);

  return (
    <ParentChildContext.Provider value={{
      children,
      selectedChild,
      selectChild,
      loading,
      error,
      refreshChildren: fetchChildren
    }}>
      {reactChildren}
    </ParentChildContext.Provider>
  );
};

export const useParentChild = () => {
  const context = useContext(ParentChildContext);
  if (!context) {
    throw new Error('useParentChild must be used within a ParentChildProvider');
  }
  return context;
};

export default ParentChildContext;
