/**
 * ROLE SWITCHER COMPONENT
 * ═══════════════════════════════════════════════════════════════════════════════
 * Dashboard header dropdown for switching between multiple roles
 * 
 * Features:
 * - Quick role switching without logout
 * - Visual role icons and colors
 * - Current role indicator
 * - Organization/Branch context display
 * - Linked students for parent role
 * 
 * Created: March 5, 2026
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  User, Users, GraduationCap, BookOpen, Building2, Shield,
  ChevronDown, Check, RefreshCw, Star, Briefcase
} from 'lucide-react';
import { getStoredRoles, selectRole } from '@/services/unifiedAuthV2Service';
import { useToast } from '@/components/ui/use-toast';

// Role type configuration
const ROLE_CONFIG = {
  parent: {
    icon: Users,
    label: 'ಪೋಷಕರು',
    labelEn: 'Parent',
    color: 'bg-purple-500',
    textColor: 'text-purple-600',
    bgLight: 'bg-purple-50 dark:bg-purple-950/30',
    borderColor: 'border-purple-300 dark:border-purple-700',
    dashboard: '/Parent/dashboard'
  },
  student: {
    icon: GraduationCap,
    label: 'ವಿದ್ಯಾರ್ಥಿ',
    labelEn: 'Student',
    color: 'bg-green-500',
    textColor: 'text-green-600',
    bgLight: 'bg-green-50 dark:bg-green-950/30',
    borderColor: 'border-green-300 dark:border-green-700',
    dashboard: '/Student/dashboard'
  },
  teacher: {
    icon: BookOpen,
    label: 'ಶಿಕ್ಷಕ',
    labelEn: 'Teacher',
    color: 'bg-blue-500',
    textColor: 'text-blue-600',
    bgLight: 'bg-blue-50 dark:bg-blue-950/30',
    borderColor: 'border-blue-300 dark:border-blue-700',
    dashboard: '/Teacher/dashboard'
  },
  staff: {
    icon: Briefcase,
    label: 'ಸಿಬ್ಬಂದಿ',
    labelEn: 'Staff',
    color: 'bg-orange-500',
    textColor: 'text-orange-600',
    bgLight: 'bg-orange-50 dark:bg-orange-950/30',
    borderColor: 'border-orange-300 dark:border-orange-700',
    dashboard: '/super-admin/dashboard'
  },
  admin: {
    icon: Shield,
    label: 'ಆಡ್ಮಿನ್',
    labelEn: 'Admin',
    color: 'bg-red-500',
    textColor: 'text-red-600',
    bgLight: 'bg-red-50 dark:bg-red-950/30',
    borderColor: 'border-red-300 dark:border-red-700',
    dashboard: '/Admin/dashboard'
  },
  accountant: {
    icon: Building2,
    label: 'ಲೆಕ್ಕಪರಿಶೋಧಕ',
    labelEn: 'Accountant',
    color: 'bg-teal-500',
    textColor: 'text-teal-600',
    bgLight: 'bg-teal-50 dark:bg-teal-950/30',
    borderColor: 'border-teal-300 dark:border-teal-700',
    dashboard: '/Accountant/dashboard'
  },
  principal: {
    icon: User,
    label: 'ಪ್ರಾಂಶುಪಾಲರು',
    labelEn: 'Principal',
    color: 'bg-indigo-500',
    textColor: 'text-indigo-600',
    bgLight: 'bg-indigo-50 dark:bg-indigo-950/30',
    borderColor: 'border-indigo-300 dark:border-indigo-700',
    dashboard: '/Principal/dashboard'
  }
};

// Get role config with fallback
const getRoleConfig = (roleType) => {
  const type = roleType?.toLowerCase();
  return ROLE_CONFIG[type] || {
    icon: User,
    label: roleType,
    labelEn: roleType,
    color: 'bg-gray-500',
    textColor: 'text-gray-600',
    bgLight: 'bg-gray-50 dark:bg-gray-950/30',
    borderColor: 'border-gray-300 dark:border-gray-700',
    dashboard: '/super-admin/dashboard'
  };
};

const RoleSwitcher = ({ className = '' }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [roles, setRoles] = useState([]);
  const [currentRole, setCurrentRole] = useState(null);
  const [switching, setSwitching] = useState(false);

  // Load roles from localStorage
  useEffect(() => {
    const loadRoles = () => {
      const storedRoles = getStoredRoles();
      setRoles(storedRoles);

      // Get current selected role
      const selectedRoleStr = localStorage.getItem('v2_selected_role');
      if (selectedRoleStr) {
        try {
          setCurrentRole(JSON.parse(selectedRoleStr));
        } catch (e) {
          console.error('[RoleSwitcher] Error parsing selected role:', e);
        }
      } else if (storedRoles.length > 0) {
        // Default to first role
        setCurrentRole(storedRoles[0]);
      }
    };

    loadRoles();

    // Listen for role changes
    const handleStorageChange = (e) => {
      if (e.key === 'v2_roles' || e.key === 'v2_selected_role') {
        loadRoles();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Don't render if no roles or single role
  if (!roles || roles.length <= 1) {
    return null;
  }

  const handleRoleSwitch = async (role) => {
    if (role.id === currentRole?.id) return;

    setSwitching(true);
    try {
      // Update selected role
      selectRole(role);
      setCurrentRole(role);

      // Get dashboard path for this role
      const config = getRoleConfig(role.role_type);

      toast({
        title: 'Role Switched',
        description: `ಈಗ ${config.label} (${config.labelEn}) ಆಗಿ ಕೆಲಸ ಮಾಡುತ್ತಿದ್ದೀರಿ`,
      });

      // Navigate to role's dashboard
      navigate(config.dashboard, { replace: true });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Switch Failed',
        description: error.message,
      });
    } finally {
      setSwitching(false);
    }
  };

  const currentConfig = currentRole ? getRoleConfig(currentRole.role_type) : null;
  const CurrentIcon = currentConfig?.icon || User;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={`gap-2 rounded-xl ${currentConfig?.bgLight} ${currentConfig?.borderColor} ${className}`}
          disabled={switching}
        >
          {switching ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <CurrentIcon className={`h-4 w-4 ${currentConfig?.textColor}`} />
          )}
          <span className={`text-sm font-medium ${currentConfig?.textColor}`}>
            {currentConfig?.label || 'Select Role'}
          </span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          <span>Switch Role</span>
          <Badge variant="secondary" className="ml-auto text-xs">
            {roles.length} roles
          </Badge>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {roles.map((role) => {
          const config = getRoleConfig(role.role_type);
          const RoleIcon = config.icon;
          const isActive = role.id === currentRole?.id;

          return (
            <DropdownMenuItem
              key={role.id}
              onClick={() => handleRoleSwitch(role)}
              className={`flex items-center gap-3 p-3 cursor-pointer ${
                isActive ? config.bgLight : ''
              }`}
            >
              <div className={`p-2 rounded-lg ${config.color} text-white`}>
                <RoleIcon className="h-4 w-4" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{config.label}</span>
                  {role.is_primary && (
                    <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {role.organization_name || role.branch_name || config.labelEn}
                </p>
              </div>

              {isActive && (
                <Check className={`h-4 w-4 ${config.textColor} flex-shrink-0`} />
              )}
            </DropdownMenuItem>
          );
        })}

        <DropdownMenuSeparator />
        <div className="p-2 text-xs text-muted-foreground text-center">
          ಬೇರೆ role ಆಗಿ ಕೆಲಸ ಮಾಡಲು ಕ್ಲಿಕ್ ಮಾಡಿ
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default RoleSwitcher;
