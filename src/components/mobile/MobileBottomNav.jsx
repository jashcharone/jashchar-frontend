// ═══════════════════════════════════════════════════════════════════════════
// JASHCHAR ERP - MOBILE BOTTOM NAVIGATION
// WhatsApp-style bottom navigation bar for mobile app
// ═══════════════════════════════════════════════════════════════════════════

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  MessageSquare, 
  Bell, 
  User,
  LayoutDashboard,
  Menu
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { platformService } from '@/platform';

// Navigation items configuration
const getNavItems = (userRole) => {
  // Base items for all logged-in users
  const baseItems = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      path: '/dashboard',
      roles: ['all']
    },
    {
      id: 'chat',
      label: 'Chat',
      icon: MessageSquare,
      path: '/chat',
      badge: 0, // Will be dynamic
      roles: ['all']
    },
    {
      id: 'notifications',
      label: 'Alerts',
      icon: Bell,
      path: '/notifications',
      badge: 0,
      roles: ['all']
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      path: '/profile',
      roles: ['all']
    }
  ];

  // Role-specific items
  if (userRole === 'admin' || userRole === 'super_admin') {
    baseItems.splice(1, 0, {
      id: 'admin',
      label: 'Admin',
      icon: LayoutDashboard,
      path: '/admin',
      roles: ['admin', 'super_admin']
    });
  }

  return baseItems.slice(0, 5); // Max 5 items
};

export function MobileBottomNav({ 
  userRole = 'user',
  unreadMessages = 0,
  unreadNotifications = 0,
  className 
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const navItems = getNavItems(userRole);

  // Handle nav item click with haptic feedback
  const handleNavClick = async (item) => {
    // Trigger haptic feedback on native
    if (platformService.isNative) {
      try {
        await Haptics.impact({ style: ImpactStyle.Light });
      } catch (e) {
        // Haptics not available
      }
    }
    
    navigate(item.path);
  };

  // Check if current path matches nav item
  const isActive = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  // Get badge count for item
  const getBadge = (itemId) => {
    switch (itemId) {
      case 'chat':
        return unreadMessages;
      case 'notifications':
        return unreadNotifications;
      default:
        return 0;
    }
  };

  return (
    <nav 
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "bg-white dark:bg-gray-900",
        "border-t border-gray-200 dark:border-gray-800",
        "safe-area-bottom", // For iPhone notch
        className
      )}
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          const badge = getBadge(item.id);
          
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item)}
              className={cn(
                "flex flex-col items-center justify-center",
                "flex-1 h-full min-w-0",
                "transition-all duration-200",
                "active:scale-95", // Press feedback
                "focus:outline-none",
                active 
                  ? "text-primary" 
                  : "text-gray-500 dark:text-gray-400"
              )}
            >
              {/* Icon with Badge */}
              <div className="relative">
                <Icon 
                  className={cn(
                    "w-6 h-6 transition-transform",
                    active && "scale-110"
                  )} 
                  strokeWidth={active ? 2.5 : 2}
                />
                
                {/* Badge */}
                {badge > 0 && (
                  <span className={cn(
                    "absolute -top-1 -right-1",
                    "min-w-[18px] h-[18px]",
                    "flex items-center justify-center",
                    "text-[10px] font-bold text-white",
                    "bg-red-500 rounded-full",
                    "px-1"
                  )}>
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </div>
              
              {/* Label */}
              <span className={cn(
                "text-[10px] mt-1 font-medium",
                "truncate max-w-full px-1",
                active && "font-semibold"
              )}>
                {item.label}
              </span>
              
              {/* Active indicator dot */}
              {active && (
                <div className="absolute bottom-1 w-1 h-1 bg-primary rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default MobileBottomNav;
