/**
 * ParentSelectedChildContext
 * ═══════════════════════════════════════════════════════════════════════════════
 * Purpose: Share selectedChild state between ParentDashboard and Sidebar
 * 
 * When parent is viewing children list (selectedChild = null):
 *   → Sidebar shows ONLY Dashboard item
 * 
 * When parent has selected a specific child (selectedChild = {...}):
 *   → Sidebar shows full parent menu (Fees, Academics, Examinations, Attendance, etc.)
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { createContext, useContext, useState } from 'react';

const ParentSelectedChildContext = createContext({
  selectedChild: null,
  setSelectedChild: () => {},
  hasSelectedChild: false,
});

export const ParentSelectedChildProvider = ({ children }) => {
  const [selectedChild, setSelectedChild] = useState(null);

  const value = {
    selectedChild,
    setSelectedChild,
    hasSelectedChild: !!selectedChild,
  };

  return (
    <ParentSelectedChildContext.Provider value={value}>
      {children}
    </ParentSelectedChildContext.Provider>
  );
};

export const useParentSelectedChild = () => {
  const context = useContext(ParentSelectedChildContext);
  return context;
};

export default ParentSelectedChildContext;
