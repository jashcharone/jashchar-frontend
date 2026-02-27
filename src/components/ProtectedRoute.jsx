import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { usePermissions } from '@/contexts/PermissionContext';
import { ROUTES } from '@/registry/routeRegistry';

const ProtectedRoute = ({ children, allowedRoles, requiredModule }) => {
  const { user, loading: authLoading } = useAuth();
  const { canView, loading: permLoading, detectedRole } = usePermissions();

  if (authLoading || permLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading Access Rights...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // ✅ Priority: detectedRole (from PermissionContext) > profile.role > user_metadata.role
  let userRole = detectedRole || user.user_metadata?.role;

  if (!userRole && user.profile?.role) {
    if (typeof user.profile.role === 'object' && user.profile.role.name) {
      userRole = user.profile.role.name.toLowerCase();
    } else if (typeof user.profile.role === 'string' && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.profile.role)) {
      userRole = user.profile.role.toLowerCase();
    }
  }
  
  // Normalize role name
  if (userRole) {
    userRole = userRole.toLowerCase().replace(/ /g, '_');
  }

  // 1. Role Check
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    let dashboardPath = '/login';
    // Each role has their own dashboard URL
    if (userRole === 'master_admin') dashboardPath = ROUTES.MASTER_ADMIN.DASHBOARD;
    else if (userRole === 'super_admin' || userRole === 'school_owner' || userRole === 'organization_owner') dashboardPath = ROUTES.SUPER_ADMIN.DASHBOARD;
    else if (userRole === 'admin') dashboardPath = ROUTES.ADMIN.DASHBOARD; // /Admin/dashboard
    else if (userRole === 'principal') dashboardPath = ROUTES.PRINCIPAL.DASHBOARD; // /Principal/dashboard
    else if (userRole === 'accountant') dashboardPath = ROUTES.ACCOUNTANT.DASHBOARD; // /Accountant/dashboard
    else if (userRole === 'cashier') dashboardPath = ROUTES.CASHIER?.DASHBOARD || '/Cashier/dashboard';
    else if (userRole === 'receptionist') dashboardPath = ROUTES.RECEPTIONIST.DASHBOARD; // /Receptionist/dashboard
    else if (userRole === 'librarian') dashboardPath = ROUTES.LIBRARIAN.DASHBOARD; // /Librarian/dashboard
    else if (userRole === 'teacher') dashboardPath = ROUTES.TEACHER.DASHBOARD; // /Teacher/dashboard
    else if (userRole === 'parent') dashboardPath = ROUTES.PARENT?.DASHBOARD || '/Parent/dashboard';
    else if (userRole === 'student') dashboardPath = ROUTES.STUDENT?.DASHBOARD || '/Student/dashboard';
    else if (userRole) dashboardPath = '/super-admin/dashboard'; // Fallback for school staff
    
    return <Navigate to={dashboardPath} replace />;
  }

  // 2. Module Permission Check
  if (requiredModule) {
    // Master Admin and Super Admin bypass permission checks - they have full access
    const bypassRoles = ['master_admin', 'super_admin', 'school_owner', 'organization_owner'];
    if (!bypassRoles.includes(userRole) && !canView(requiredModule)) {
      // User has role but not specific module permission
      return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background p-4">
          <div className="text-center max-w-md">
            <h1 className="text-4xl font-bold text-red-500 mb-4">Access Denied</h1>
            <p className="text-lg text-muted-foreground mb-6">
              You do not have permission to access the <strong>{requiredModule.replace(/_/g, ' ')}</strong> module.
            </p>
            <button 
              onClick={() => window.history.back()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
            >
              Go Back
            </button>
          </div>
        </div>
      );
    }
  }

  return children;
};

export default ProtectedRoute;
