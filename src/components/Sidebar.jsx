import React, { useState, useMemo, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, School, Users, CreditCard, Settings, BookOpen, GraduationCap, Calendar, FileText, Bus, Building, MessageSquare, Briefcase, LogOut, X, ChevronDown, ChevronRight, ChevronLeft, Package, CheckSquare, Library, Layout, Video, MonitorPlay, AlertTriangle, Award, Newspaper, Activity, IndianRupee, UserPlus, Menu, Search, Pin, PinOff, MoreHorizontal, Circle, Disc, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/SupabaseAuthContext';
// ScrollArea removed due to Radix UI infinite loop bug
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/registry/routeRegistry';
import { NEW_MODULES } from '@/modules/moduleRegistry.append.jsx';
import { mergeAppendOnly } from '@/utils/appendOnlyMerge';
import { STAGING_CONFIG } from '@/config/stagingModeConfig';
import { usePermissions } from '@/contexts/PermissionContext';
import { SIDEBAR_TO_MODULE_MAP, SUBMODULE_OVERRIDES } from '@/lib/moduleMapping'; 
import { BASE_SIDEBAR } from '@/config/sidebarConfig';
import { SIDEBAR_ORDER } from '@/config/sidebarOrder';
import { useTheme } from '@/contexts/ThemeContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useDynamicSidebar } from '@/hooks/useDynamicSidebar';
import { useBranchAttendanceModules, PATH_TO_ATTENDANCE_MODULE } from '@/hooks/useBranchAttendanceModules';

// --- CONFIGURATION ---
const SIDEBAR_WIDTH_EXPANDED = "w-[270px]";
const SIDEBAR_WIDTH_COLLAPSED = "w-[80px]";
const MOBILE_DRAWER_WIDTH = "w-[300px]";

const Sidebar = ({ role, isSidebarOpen, isMobile, toggleSidebar, closeSidebar, onHoverChange }) => {
  const { settings } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, user, school } = useAuth();
  const { canView, canAdd, canEdit, canDelete } = usePermissions();
  
  // ✅ DYNAMIC SIDEBAR - Load modules from database
  const { menu: dynamicMenu, loading: dynamicLoading, error: dynamicError, isDynamic } = useDynamicSidebar(role);
  
  // ✅ BRANCH ATTENDANCE MODULES - Filter attendance based on master admin config
  const { isPathEnabled, hasConfig: hasAttendanceConfig } = useBranchAttendanceModules();
  
  // Local state
  const [isHovered, setIsHovered] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [hoveredItem, setHoveredItem] = useState(null);
  const hoverTimeoutRef = React.useRef(null);
  const scrollAreaRef = React.useRef(null);

  // Effective Expanded State
  const isExpanded = isMobile ? isSidebarOpen : (isSidebarOpen || isHovered);

  // Restore scroll position from sessionStorage on mount
  useEffect(() => {
    const savedScroll = sessionStorage.getItem('sidebarScrollPos');
    if (savedScroll && scrollAreaRef.current) {
      // Native scroll div - set scrollTop directly
      requestAnimationFrame(() => {
        if (scrollAreaRef.current) {
          scrollAreaRef.current.scrollTop = parseInt(savedScroll, 10);
        }
      });
    }
  }, []);

  // Reset hover when pinned
  useEffect(() => {
    if (isSidebarOpen) {
      setIsHovered(false);
      if (onHoverChange) onHoverChange(false);
    }
  }, [isSidebarOpen, onHoverChange]);

  const handleMouseEnter = () => {
    if (!isMobile && !isSidebarOpen) {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      setIsHovered(true);
      if (onHoverChange) onHoverChange(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile && !isSidebarOpen) {
      hoverTimeoutRef.current = setTimeout(() => {
        setIsHovered(false);
        if (onHoverChange) onHoverChange(false);
      }, 300);
    }
  };

  // --- LOGIC: Handle Submenu Click ---
  const handleSubmenuClick = (title, e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isExpanded && !isMobile) {
      toggleSidebar(); 
      setTimeout(() => {
        setOpenSubmenus(prev => ({ ...prev, [title]: true }));
      }, 50);
      return;
    }

    setOpenSubmenus(prev => ({ ...prev, [title]: !prev[title] }));
  };

  // --- MENU DATA PREPARATION ---
  const currentMenu = useMemo(() => {
    // ✅ Normalize role to handle both space and underscore formats
    const normalizedRole = role?.toLowerCase().replace(/\s+/g, '_') || '';
    
    // ✅ USE DYNAMIC MENU (includes static + any missing DB modules)
    // The hook already handles merging and uses correct static routes
    let menuItems = dynamicMenu && dynamicMenu.length > 0 ? dynamicMenu : [];
    
    // Fallback to pure static if dynamic failed
    if (menuItems.length === 0) {
      const effectiveRole = (normalizedRole === 'organization_owner' || normalizedRole === 'super_admin' || normalizedRole === 'admin') ? 'super_admin' : normalizedRole;
      menuItems = BASE_SIDEBAR[effectiveRole] || BASE_SIDEBAR['super_admin'] || [];
    }
    
    // For master_admin, return all modules without filtering (platform-level)
    if (normalizedRole === 'master_admin') {
      return menuItems;
    }
    
    // For super_admin / school owner roles, apply ONLY attendance module filtering
    // They have full access to all modules, but attendance submenu respects branch config
    const isSchoolAdminRole = ['super_admin', 'organization_owner', 'admin', 'school_owner'].includes(normalizedRole);
    if (isSchoolAdminRole) {
      if (!hasAttendanceConfig) return menuItems;
      
      return menuItems.map(item => {
        const isAttendanceModule = item.title?.toLowerCase().includes('attendance') || 
          (item.submenu && item.submenu.some(s => PATH_TO_ATTENDANCE_MODULE[s.path]));
        
        if (!isAttendanceModule || !item.submenu) return item;
        
        const filteredSubmenu = item.submenu.filter(sub => {
          if (sub.disabled) return false; // Remove separators like "── Advanced ──"
          return isPathEnabled(sub.path);
        });
        
        if (filteredSubmenu.length === 0) return null;
        return { ...item, submenu: filteredSubmenu };
      }).filter(Boolean);
    }
    
    // For other roles, apply permission filtering
    return menuItems.filter(item => {
      // Dashboard always visible for all roles
      if (item.title === 'Dashboard') return true;
      
      const moduleSlug = item.slug || SIDEBAR_TO_MODULE_MAP[item.title] || item.title.toLowerCase().replace(/\s+/g, '_');
      
      // Strict check: Hide System Settings if permission denied
      if ((moduleSlug === 'system_settings' || item.title === 'System Settings') && !canView('system_settings')) {
        return false;
      }
      
      // ✅ FIX: Finance module → Income/Expenses mapping
      // If user has 'finance' permission, also grant access to 'income' and 'expenses' menus
      // This prevents duplicates: Assign Permission shows Finance, Sidebar shows Income/Expenses
      let hasAccess = canView(moduleSlug);
      if (!hasAccess && (moduleSlug === 'income' || moduleSlug === 'expenses')) {
        hasAccess = canView('finance');
      }
      
      // Check if this is an attendance module
      const isAttendanceModule = moduleSlug === 'attendance' || item.title?.toLowerCase().includes('attendance');
      
      if (item.submenu && item.submenu.length > 0) {
        const visibleSubmenu = item.submenu.filter(sub => {
          // Skip disabled items (separators like "── Advanced ──")
          if (sub.disabled) return false;
          
          // ✅ ATTENDANCE MODULE FILTERING - Check if path is enabled by Master Admin
          if (isAttendanceModule && hasAttendanceConfig) {
            const pathEnabled = isPathEnabled(sub.path);
            if (!pathEnabled) {
              return false;
            }
          }
          
          const subSlug = sub.slug || SUBMODULE_OVERRIDES[sub.title] || sub.title.toLowerCase().replace(/\s+/g, '_');
          
          // Try multiple permission key formats:
          // 1. parent.child (e.g., academics.class)
          // 2. parent.parent.child (e.g., academics.academics.class) - DB format
          const fullSubKey = `${moduleSlug}.${subSlug}`;
          const doublePrefix = `${moduleSlug}.${moduleSlug}.${subSlug}`;
          
          if (canView(fullSubKey)) return true;
          if (canView(doublePrefix)) return true;
          if (moduleSlug === 'front_cms' && canView('front_cms')) return true;
          
          // ✅ Show all children if parent module has permission (for simple modules)
          if ((moduleSlug === 'income' || moduleSlug === 'expenses') && canView(moduleSlug)) return true;
          
          // ⚠️ REMOVED FALLBACK: Previously showed all children if parent had access
          // Now STRICT: Each submodule must have explicit permission
          // This ensures Permission DNA page controls exactly which sub-modules appear
          return false;
        });
        
        if (visibleSubmenu.length > 0) {
          item.submenu = visibleSubmenu;
          return true;
        }
        
        // If no visible submenu but parent has access, show parent without submenu
        if (hasAccess) {
          item.submenu = [];
          return true;
        }
        return false;
      }
      
      return hasAccess;
    });
  }, [role, canView, dynamicMenu, isPathEnabled, hasAttendanceConfig]);

  const filteredMenu = useMemo(() => {
    if (!searchTerm) return currentMenu;
    const term = searchTerm.toLowerCase();
    
    return currentMenu
      .map(item => {
        const parentMatches = item.title.toLowerCase().includes(term);
        
        // Filter submenus to only show matching items
        const matchingSubmenus = item.submenu 
          ? item.submenu.filter(sub => sub.title.toLowerCase().includes(term))
          : [];
        
        // Include item if parent title matches OR has matching submenus
        if (parentMatches) {
          // Parent matches - show all submenus
          return item;
        } else if (matchingSubmenus.length > 0) {
          // Only submenus match - show parent with filtered submenus
          return { ...item, submenu: matchingSubmenus };
        }
        
        return null;
      })
      .filter(Boolean);
  }, [currentMenu, searchTerm]);

  // Auto-expand parents when searching or when child is active
  useEffect(() => {
    if (searchTerm) {
      // When searching, auto-expand all parents that have matching submenus
      const term = searchTerm.toLowerCase();
      const parentsToExpand = {};
      
      currentMenu.forEach(item => {
        if (item.submenu) {
          const hasMatchingSubmenu = item.submenu.some(sub => 
            sub.title.toLowerCase().includes(term)
          );
          if (hasMatchingSubmenu) {
            parentsToExpand[item.title] = true;
          }
        }
      });
      
      if (Object.keys(parentsToExpand).length > 0) {
        setOpenSubmenus(prev => ({ ...prev, ...parentsToExpand }));
      }
    }
  }, [searchTerm, currentMenu]);

  // Auto-expand parent if child is active - and keep it expanded
  useEffect(() => {
    const activeParent = currentMenu.find(item => 
      item.submenu && item.submenu.some(sub => 
        sub.path === location.pathname || 
        (sub.path && sub.path !== '/' && location.pathname.startsWith(sub.path + '/'))
      )
    );
    if (activeParent) {
      setOpenSubmenus(prev => ({ ...prev, [activeParent.title]: true }));
    }
  }, [location.pathname, currentMenu]);

  // --- RENDER ITEM ---
  const MenuItem = ({ item, depth = 0 }) => {
    // Check if path matches (exact or starts with for nested routes like /edit/:id)
    const isActive = location.pathname === item.path || 
      (item.path && item.path !== '/' && location.pathname.startsWith(item.path + '/'));
    const isParentActive = item.submenu && item.submenu.some(sub => 
      sub.path === location.pathname || 
      (sub.path && sub.path !== '/' && location.pathname.startsWith(sub.path + '/'))
    );
    const hasSubmenu = item.submenu && item.submenu.length > 0;
    const isOpen = openSubmenus[item.title];
    const Icon = item.icon || LayoutDashboard;
    const isItemHovered = hoveredItem === item.title;

    // --- STYLING: "Thor" Style ---
    const activeGradient = `linear-gradient(90deg, ${settings.colors.sidebarPrimary}20, ${settings.colors.sidebarPrimary}05)`;
    const activeText = settings.colors.sidebarPrimary;

    // Check if any child is active (for parent styling)
    const isChildActive = item.submenu && item.submenu.some(sub => 
      sub.path === location.pathname || 
      (sub.path && sub.path !== '/' && location.pathname.startsWith(sub.path + '/'))
    );
    const isActuallyActive = isActive || isChildActive;

    const itemStyle = {
      color: isActuallyActive
        ? activeText
        : (isItemHovered ? settings.colors.sidebarForeground : settings.colors.sidebarMutedForeground),
      background: (isActuallyActive && depth === 0) 
        ? activeGradient
        : (isItemHovered ? settings.colors.sidebarAccent : 'transparent'),
    };

    // Container Classes
    const containerClasses = cn(
      "relative flex items-center gap-3 px-4 py-3 my-1 cursor-pointer transition-all duration-300 select-none group",
      "rounded-2xl mx-3", 
      depth > 0 && "pl-[52px] py-2", 
    );

    const content = (
      <>
        {/* Icon (Only for top level) */}
        {depth === 0 && (
          <div className={cn(
            "flex items-center justify-center transition-all duration-300 shrink-0 z-10",
            isExpanded ? "h-6 w-6" : "h-6 w-6 mx-auto"
          )}>
            <Icon 
              size={22} 
              strokeWidth={isActuallyActive ? 2.5 : 2}
              className={cn("transition-transform duration-300", isItemHovered && "scale-110")}
            />
          </div>
        )}

        {/* Dot for Submenu Items */}
        {depth > 0 && (
          <div className="absolute left-[26px] top-1/2 -translate-y-1/2 -translate-x-1/2 flex items-center justify-center w-4 h-4 z-10">
             <div 
                className={cn("rounded-full transition-all duration-300", isActive ? "w-2.5 h-2.5 shadow-sm" : "w-1.5 h-1.5 opacity-50")}
                style={{ backgroundColor: isActive ? settings.colors.sidebarPrimary : settings.colors.sidebarMutedForeground }}
             />
          </div>
        )}

        {/* Label */}
        <span className={cn(
          "font-medium text-[14px] whitespace-nowrap transition-all duration-300 origin-left flex-1 truncate z-10",
          !isExpanded && !isMobile && depth === 0 ? "opacity-0 w-0 overflow-hidden" : "opacity-100 w-auto"
        )}>
          {item.title}
        </span>

        {/* Submenu Arrow */}
        {hasSubmenu && isExpanded && (
          <ChevronRight 
            size={16} 
            className={cn("transition-transform duration-300 opacity-50", isOpen && "rotate-90")} 
          />
        )}

        {/* Active Glow/Indicator for Top Level */}
        {depth === 0 && isActuallyActive && (
          <div 
            className="absolute left-0 top-0 bottom-0 w-1 rounded-full my-2 ml-1"
            style={{ backgroundColor: settings.colors.sidebarPrimary }}
          />
        )}
      </>
    );

    // --- RENDER LOGIC ---
    if (hasSubmenu) {
      return (
        <div className="relative">
          <div 
            className={containerClasses}
            style={itemStyle}
            onClick={(e) => handleSubmenuClick(item.title, e)}
            onMouseEnter={() => setHoveredItem(item.title)}
            onMouseLeave={() => setHoveredItem(null)}
          >
            {content}
          </div>
          
          {/* Submenu Container */}
          {isOpen && isExpanded && (
            <div className="overflow-hidden relative">
               {/* Tree Guide Line */}
               <div 
                  className="absolute left-[26px] top-0 bottom-3 w-[2px] opacity-10 rounded-full"
                  style={{ backgroundColor: settings.colors.sidebarForeground }}
                />
              
              {item.submenu.map((sub, idx) => (
                <MenuItem key={sub.path || `${item.title}-${sub.title}-${idx}`} item={sub} depth={depth + 1} />
              ))}
            </div>
          )}
        </div>
      );
    }

    // Save scroll position before navigation
    const saveScrollPosition = () => {
      if (scrollAreaRef.current) {
        // Native scroll div - get scrollTop directly
        sessionStorage.setItem('sidebarScrollPos', scrollAreaRef.current.scrollTop.toString());
      }
    };

    return (
      <Link 
        to={item.path} 
        className={containerClasses}
        style={itemStyle}
        tabIndex={-1}
        onClick={(e) => {
          // Save scroll position before navigation
          saveScrollPosition();
          // Blur to prevent scroll to focused element
          e.currentTarget.blur();
          // Prevent default scroll behavior
          e.stopPropagation();
          // Only close sidebar on mobile for top-level items, not submenu items
          if (isMobile && depth === 0 && closeSidebar) {
            closeSidebar();
          }
          // For submenu items (depth > 0), keep sidebar open and don't scroll
        }}
        onMouseEnter={() => setHoveredItem(item.title)}
        onMouseLeave={() => setHoveredItem(null)}
      >
        {content}
      </Link>
    );
  };

  // --- MAIN LAYOUT ---
  return (
    <>
      {/* Mobile Backdrop */}
      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={toggleSidebar}
        />
      )}

      <aside
        className={cn(
          "fixed top-3 bottom-3 left-3 z-50 shadow-2xl transition-all duration-300 ease-out flex flex-col",
          "border",
          isMobile 
            ? (isSidebarOpen ? "translate-x-0" : "-translate-x-[110%]") 
            : (isExpanded ? SIDEBAR_WIDTH_EXPANDED : SIDEBAR_WIDTH_COLLAPSED),
          isMobile && MOBILE_DRAWER_WIDTH
        )}
        style={{
          borderRadius: `${settings.sidebarRadius ?? 32}px`,
          background: settings.colors.sidebarBackground,
          borderColor: settings.colors.sidebarBorder,
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* FLOATING TOGGLE BUTTON (Desktop Only) */}
        {!isMobile && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              // If we are closing (unpinning), clear hover state immediately to prevent auto-expansion
              if (isSidebarOpen) setIsHovered(false);
              toggleSidebar();
            }}
            className={cn(
              "absolute -right-4 top-24 z-50 h-8 w-8 rounded-full flex items-center justify-center shadow-lg border-2 transition-all duration-200 hover:scale-110",
              "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300"
            )}
            style={{ 
              borderColor: settings.colors.sidebarBorder,
            }}
          >
            {isSidebarOpen ? <ChevronLeft size={16} strokeWidth={3} /> : <ChevronRight size={16} strokeWidth={3} />}
          </button>
        )}

        {/* 1. HEADER */}
        <div 
          className="h-24 flex items-center px-6 shrink-0 relative"
          onMouseEnter={handleMouseEnter}
        >
          <div className="flex items-center gap-4 overflow-hidden w-full">
            {/* Logo Icon */}
            <div 
              className="h-12 w-12 rounded-2xl flex items-center justify-center shadow-lg shrink-0 transition-transform hover:scale-105 overflow-hidden"
              style={{ 
                background: (settings.sidebarLogo || settings.colors.sidebarLogo) ? 'transparent' : `linear-gradient(135deg, ${settings.colors.sidebarPrimary}, ${settings.colors.sidebarPrimary}dd)`,
                color: settings.colors.sidebarPrimaryForeground 
              }}
            >
              {(settings.sidebarLogo || settings.colors.sidebarLogo) ? (
                <img src={settings.sidebarLogo || settings.colors.sidebarLogo} alt="Logo" className="h-full w-full object-contain" />
              ) : (
                <Zap className="h-7 w-7 fill-current" />
              )}
            </div>
            
            {/* Logo Text */}
            <div className={cn(
              "flex flex-col transition-all duration-300 overflow-hidden whitespace-nowrap",
              !isExpanded && !isMobile ? "opacity-0 w-0 translate-x-[-10px]" : "opacity-100 w-auto translate-x-0"
            )}>
              <span 
                className="font-bold text-xl tracking-tight leading-none"
                style={{ color: settings.colors.sidebarForeground }}
              >
                {settings.sidebarTitle || settings.colors.sidebarTitle || 'Thor'}
              </span>
              <span 
                className="text-[10px] uppercase tracking-wider font-bold mt-1 opacity-60"
                style={{ color: settings.colors.sidebarForeground }}
              >
                {settings.sidebarSubtitle || settings.colors.sidebarSubtitle || 'Dashboard'}
              </span>
            </div>
          </div>

          {/* Mobile Close */}
          {isMobile && (
            <Button variant="ghost" size="icon" onClick={toggleSidebar} className="ml-auto">
              <X className="h-5 w-5" style={{ color: settings.colors.sidebarForeground }} />
            </Button>
          )}
        </div>

        {/* 2. SEARCH (Only when expanded) */}
        {isExpanded && (
          <div className="px-5 pb-4 shrink-0 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="relative group">
              <Search 
                className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors" 
                style={{ color: settings.colors.sidebarMutedForeground }}
              />
              <input 
                type="text" 
                placeholder="Search..." 
                className="w-full rounded-2xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 transition-all border-none shadow-inner bg-black/5 dark:bg-white/5"
                style={{
                  color: settings.colors.sidebarForeground,
                  '--tw-ring-color': settings.colors.sidebarPrimary
                }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* 3. MENU ITEMS - Using native scroll to avoid Radix UI ref issues */}
        <div 
          ref={scrollAreaRef} 
          className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent"
          onMouseEnter={handleMouseEnter}
          style={{ overflowAnchor: 'none' }}
        >
          <div className="space-y-1 px-2 pb-20 pt-2" style={{ overflowAnchor: 'none' }}>
            {filteredMenu.map((item, idx) => (
              <div key={item.title || idx} onMouseEnter={handleMouseEnter}>
                <MenuItem item={item} />
              </div>
            ))}
          </div>
        </div>

        {/* 4. FOOTER */}
        <div 
          className="p-5 shrink-0 flex items-center gap-2"
          onMouseEnter={handleMouseEnter}
        >
          {/* User Profile */}
          <div className={cn(
            "flex items-center gap-3 p-2 rounded-2xl flex-1 transition-all cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 overflow-hidden border border-transparent hover:border-white/10",
            !isExpanded && !isMobile ? "justify-center" : "bg-black/5 dark:bg-white/5"
          )}>
            <div 
              className="h-10 w-10 rounded-full flex items-center justify-center font-bold shadow-sm shrink-0 text-sm border-2 overflow-hidden"
              style={{ 
                backgroundColor: settings.colors.sidebarPrimary, 
                color: settings.colors.sidebarPrimaryForeground,
                borderColor: settings.colors.sidebarBackground
              }}
            >
              {(user?.user_metadata?.avatar_url || user?.profile?.photo_url || user?.profile?.photo) ? (
                <img 
                  src={user?.user_metadata?.avatar_url || user?.profile?.photo_url || user?.profile?.photo} 
                  alt="User" 
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-lg">{user?.email?.[0]?.toUpperCase() || 'U'}</span>
              )}
            </div>
            
            {isExpanded && (
              <div className="flex flex-col overflow-hidden flex-1 min-w-0">
                <span 
                  className="text-sm font-bold truncate"
                  style={{ color: settings.colors.sidebarForeground }}
                >
                  {user?.user_metadata?.full_name || user?.user_metadata?.first_name || user?.profile?.full_name || user?.profile?.first_name || (user?.email?.includes('@parent.jashchar.local') ? 'Parent' : user?.email?.split('@')[0])}
                </span>
                <span 
                  className="text-[10px] truncate opacity-60 font-medium"
                  style={{ color: settings.colors.sidebarForeground }}
                >
                  {role.replace('_', ' ').toUpperCase()}
                </span>
              </div>
            )}

            {/* Logout Button */}
            {isExpanded && (
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/20"
                      onClick={() => {
                        // Redirect to school homepage after logout (if school has a slug)
                        const redirectPath = school?.slug ? `/${school.slug}` : '/';
                        signOut(redirectPath);
                      }}
                    >
                      <LogOut size={16} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Logout</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
