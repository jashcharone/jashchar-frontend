/**
 * ROLE-BASED DASHBOARD ROUTER
 * ═══════════════════════════════════════════════════════════════
 * Automatically routes users to their appropriate dashboard
 * based on their role after login
 * 
 * Used by:
 * - Unified Login flow (PWA)
 * - Default "/" route redirect
 * - Dashboard navigation
 * 
 * Supports all roles:
 * - master_admin → Master Admin Dashboard
 * - super_admin, school_owner, organization_owner → School Owner Dashboard
 * - admin → Admin Dashboard
 * - staff → Staff Dashboard (or role-specific)
 * - teacher → Teacher Dashboard
 * - principal → Principal Dashboard
 * - accountant → Accountant Dashboard
 * - librarian → Librarian Dashboard
 * - receptionist → Receptionist Dashboard
 * - student → Student Dashboard
 * - parent → Parent Dashboard
 * 
 * Created: February 10, 2026
 * ═══════════════════════════════════════════════════════════════
 */

import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';

/**
 * Map roles to their dashboard routes
 */
export const ROLE_DASHBOARD_MAP = {
    // Master Admin (Platform Owner)
    master_admin: '/master-admin',
    
    // Organization/School Owners
    super_admin: '/super-admin',
    school_owner: '/super-admin',
    organization_owner: '/super-admin',
    
    // Branch Admin
    admin: '/admin',
    
    // Staff Roles
    staff: '/staff',
    teacher: '/teacher',
    principal: '/principal',
    accountant: '/accountant',
    librarian: '/librarian',
    receptionist: '/receptionist',
    
    // Student & Parent
    student: '/student',
    parent: '/parent',
    
    // Guest (limited access)
    guest: '/guest'
};

/**
 * Get dashboard route for a given role
 * @param {string} role - User role
 * @returns {string} Dashboard route path
 */
export const getDashboardRoute = (role) => {
    if (!role) return '/login';
    
    const normalizedRole = role.toLowerCase().trim();
    const route = ROLE_DASHBOARD_MAP[normalizedRole];
    
    // If role not in map, default to staff dashboard
    return route || '/staff';
};

/**
 * Role-Based Dashboard Router Component
 * 
 * Usage:
 * <Route path="/" element={<DashboardRouter />} />
 * 
 * This component checks the user's role and redirects to appropriate dashboard
 */
const DashboardRouter = () => {
    const { user, loading, isAuthenticated } = useAuth();
    
    // Show loading state while checking auth
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }
    
    // Not authenticated - redirect to login
    if (!isAuthenticated || !user) {
        return <Navigate to="/login" replace />;
    }
    
    // Get user's role
    const userRole = user.role;
    
    if (!userRole) {
        console.error('[DashboardRouter] User has no role assigned');
        return <Navigate to="/login" replace />;
    }
    
    // Get dashboard route for role
    const dashboardRoute = getDashboardRoute(userRole);
    
    console.log('[DashboardRouter] Routing user:', {
        role: userRole,
        route: dashboardRoute
    });
    
    // Redirect to role-specific dashboard
    return <Navigate to={dashboardRoute} replace />;
};

/**
 * Hook to get current user's dashboard route
 * 
 * Usage:
 * const { dashboardRoute, navigateToDashboard } = useDashboardRoute();
 */
export const useDashboardRoute = () => {
    const { user } = useAuth();
    
    const dashboardRoute = user?.role ? getDashboardRoute(user.role) : '/login';
    
    return {
        dashboardRoute,
        role: user?.role,
        isStudent: user?.role === 'student',
        isParent: user?.role === 'parent',
        isStaff: user?.role === 'staff' || user?.role === 'teacher',
        isAdmin: user?.role === 'admin' || user?.role === 'super_admin',
        isMasterAdmin: user?.role === 'master_admin'
    };
};

/**
 * Check if user has access to a specific route
 * @param {string} route - Route to check
 * @param {string} userRole - User's role
 * @returns {boolean} True if user can access route
 */
export const canAccessRoute = (route, userRole) => {
    if (!route || !userRole) return false;
    
    // Master admin can access everything
    if (userRole === 'master_admin') return true;
    
    // Check if route matches user's dashboard
    const userDashboard = getDashboardRoute(userRole);
    
    // User can access their own dashboard and its sub-routes
    return route.startsWith(userDashboard);
};

/**
 * Get all accessible routes for a role
 * @param {string} role - User role
 * @returns {string[]} Array of accessible route patterns
 */
export const getAccessibleRoutes = (role) => {
    if (!role) return [];
    
    const dashboardRoute = getDashboardRoute(role);
    
    // Master admin gets all routes
    if (role === 'master_admin') {
        return Object.values(ROLE_DASHBOARD_MAP);
    }
    
    // Others get their dashboard + common routes
    return [
        dashboardRoute,
        '/profile',
        '/settings',
        '/help',
        '/notifications'
    ];
};

export default DashboardRouter;
