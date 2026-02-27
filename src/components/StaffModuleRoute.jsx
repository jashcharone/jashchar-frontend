/**
 * JASHCHAR ERP - Staff Module Route Guard
 * ════════════════════════════════════════
 * Validates that the `:roleSlug` in the URL matches the logged-in user's role.
 * Used for dynamic role-prefixed routes like /:roleSlug/academics/classes
 * 
 * This enables ALL 20 staff roles to access module pages with their own URL prefix
 * (e.g., /teacher/academics/classes, /accountant/fees-collection/collect-fees)
 * instead of everyone using /super-admin/ prefix.
 */

import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { ROLE_TO_SLUG, SLUG_TO_ROLES, getDashboardPath } from '@/config/roleConfig';
import ProtectedRoute from '@/components/ProtectedRoute';

const StaffModuleRoute = ({ children, requiredModule }) => {
  const { user } = useAuth();
  const { roleSlug } = useParams();

  // Not authenticated → login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Normalize role to lowercase for consistent lookup (DB may have 'Cashier' vs 'cashier')
  const userRole = (user.role || '').toLowerCase().replace(/\s+/g, '_');
  const expectedSlug = ROLE_TO_SLUG[userRole];

  // Validate: URL's roleSlug must match the user's expected slug
  if (!expectedSlug || roleSlug !== expectedSlug) {
    // Redirect to user's own dashboard
    const dashboardPath = getDashboardPath(userRole);
    return <Navigate to={dashboardPath} replace />;
  }

  // Get all roles that can use this slug (for allowedRoles in ProtectedRoute)
  const allowedRoles = SLUG_TO_ROLES[roleSlug] || [userRole];

  // Render with ProtectedRoute for module permission check
  if (requiredModule) {
    return (
      <ProtectedRoute allowedRoles={allowedRoles} requiredModule={requiredModule}>
        {children}
      </ProtectedRoute>
    );
  }

  // No module check needed (profile, etc.)
  return (
    <ProtectedRoute allowedRoles={allowedRoles}>
      {children}
    </ProtectedRoute>
  );
};

export default StaffModuleRoute;
