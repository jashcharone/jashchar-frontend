// ═══════════════════════════════════════════════════════════════════════════
// JASHCHAR ERP - WHATSAPP-STYLE MOBILE BOTTOM NAVIGATION
// Pixel-perfect WhatsApp bottom navigation with floating action + page tabs
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, Users, CreditCard, Calendar, FileText, Settings, 
  Bell, User, Menu, X, ChevronRight, LayoutDashboard,
  GraduationCap, Bus, Building, MessageSquare, BookOpen,
  IndianRupee, CheckSquare, Library, Award, Briefcase,
  LogOut, Search, BarChart3, QrCode, Newspaper
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { usePermissions } from '@/contexts/PermissionContext';

// ─── ROLE-BASED QUICK ACTIONS FOR "UPDATES" TAB ────────────────────────
const getQuickActionsForRole = (role) => {
  const adminActions = [
    { label: 'Students', icon: Users, path: '/school/student-information/student-details', color: '#4F46E5' },
    { label: 'Fees', icon: CreditCard, path: '/school/fees-collection/collect-fees', color: '#059669' },
    { label: 'Attendance', icon: Calendar, path: '/school/attendance/student-attendance', color: '#D97706' },
    { label: 'Exams', icon: FileText, path: '/school/examinations/exam-list', color: '#DC2626' },
    { label: 'Admission', icon: GraduationCap, path: '/school/student-information/student-admission', color: '#7C3AED' },
    { label: 'Transport', icon: Bus, path: '/school/transport/routes', color: '#0284C7' },
    { label: 'Library', icon: Library, path: '/school/library/book-list', color: '#B45309' },
    { label: 'Staff', icon: Briefcase, path: '/school/human-resource/staff-directory', color: '#BE185D' },
    { label: 'Reports', icon: BarChart3, path: '/admin/advanced-analytics', color: '#0D9488' },
    { label: 'Income', icon: IndianRupee, path: '/school/income/income', color: '#16A34A' },
    { label: 'Expenses', icon: IndianRupee, path: '/school/expense/expense', color: '#EA580C' },
    { label: 'Front Office', icon: Building, path: '/school/front-office/admission-enquiry', color: '#6366F1' },
  ];

  const masterAdminActions = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/master-admin/dashboard', color: '#4F46E5' },
    { label: 'Branches', icon: Building, path: '/master-admin/schools', color: '#059669' },
    { label: 'Analytics', icon: BarChart3, path: '/master-admin/advanced-analytics', color: '#D97706' },
    { label: 'Requests', icon: Users, path: '/master-admin/organization-requests', color: '#DC2626' },
    { label: 'WhatsApp', icon: MessageSquare, path: '/master-admin/whatsapp-manager', color: '#25D366' },
    { label: 'Settings', icon: Settings, path: '/master-admin/system-settings', color: '#6366F1' },
  ];

  const studentActions = [
    { label: 'Dashboard', icon: Home, path: '/Student/dashboard', color: '#4F46E5' },
    { label: 'Fees', icon: CreditCard, path: '/Student/my-fees', color: '#059669' },
    { label: 'Exams', icon: FileText, path: '/Student/exam-schedule', color: '#D97706' },
    { label: 'Attendance', icon: Calendar, path: '/Student/attendance', color: '#DC2626' },
    { label: 'Library', icon: BookOpen, path: '/Student/library', color: '#7C3AED' },
    { label: 'Profile', icon: User, path: '/Student/profile', color: '#0284C7' },
  ];

  const parentActions = [
    { label: 'Dashboard', icon: Home, path: '/Parent/dashboard', color: '#4F46E5' },
    { label: 'Fees', icon: CreditCard, path: '/Parent/fees', color: '#059669' },
    { label: 'Attendance', icon: Calendar, path: '/Parent/attendance', color: '#D97706' },
    { label: 'Exams', icon: FileText, path: '/Parent/exams', color: '#DC2626' },
    { label: 'Profile', icon: User, path: '/Parent/profile', color: '#0284C7' },
  ];

  switch (role) {
    case 'master_admin': return masterAdminActions;
    case 'student': return studentActions;
    case 'parent': return parentActions;
    default: return adminActions;
  }
};

// ─── BOTTOM NAV ITEMS ──────────────────────────────────────────────────
const getNavTabs = (role) => {
  const getDashboardPath = () => {
    switch (role) {
      case 'master_admin': return '/master-admin/dashboard';
      case 'student': return '/Student/dashboard';
      case 'parent': return '/Parent/dashboard';
      default: return '/dashboard';
    }
  };

  return [
    { id: 'home', label: 'Home', icon: Home, path: getDashboardPath() },
    { id: 'updates', label: 'Updates', icon: BarChart3 },
    { id: 'menu', label: 'Menu', icon: Menu },
    { id: 'alerts', label: 'Alerts', icon: Bell, badge: 0 },
    { id: 'profile', label: 'Profile', icon: User, path: getProfilePath(role) },
  ];
};

function getProfilePath(role) {
  switch (role) {
    case 'master_admin': return '/master-admin/profile';
    case 'student': return '/Student/profile';
    case 'parent': return '/Parent/profile';
    default: return '/super-admin/profile';
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
export function MobileBottomNav({ className }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut, school } = useAuth();
  const { detectedRole } = usePermissions();
  const role = detectedRole || user?.role || user?.profile?.role || user?.user_metadata?.role || 'super_admin';
  
  const [activeSheet, setActiveSheet] = useState(null);
  const [menuSearch, setMenuSearch] = useState('');
  const sheetRef = useRef(null);
  
  const navTabs = getNavTabs(role);
  const quickActions = getQuickActionsForRole(role);

  // Close sheet when navigating
  useEffect(() => {
    setActiveSheet(null);
  }, [location.pathname]);

  // Handle tab click
  const handleTabClick = useCallback((tab) => {
    if (tab.path) {
      navigate(tab.path);
      setActiveSheet(null);
    } else if (tab.id === 'updates' || tab.id === 'menu') {
      setActiveSheet(prev => prev === tab.id ? null : tab.id);
    }
  }, [navigate]);

  // Check active tab
  const isActive = (tab) => {
    if (tab.id === 'updates') return activeSheet === 'updates';
    if (tab.id === 'menu') return activeSheet === 'menu';
    if (!tab.path) return false;
    if (tab.path === '/dashboard' || tab.path.endsWith('/dashboard')) {
      return (location.pathname === tab.path || location.pathname === '/') && !activeSheet;
    }
    return location.pathname.startsWith(tab.path) && !activeSheet;
  };

  // ─── SIDEBAR MENU DATA ──────────────────────────────────────────────
  const [sidebarMenu, setSidebarMenu] = useState([]);
  useEffect(() => {
    import('@/config/sidebarConfig').then(({ BASE_SIDEBAR }) => {
      const menu = BASE_SIDEBAR[role] || BASE_SIDEBAR['super_admin'] || [];
      setSidebarMenu(menu);
    });
  }, [role]);

  const filteredMenu = menuSearch
    ? sidebarMenu.filter(item => {
        const titleMatch = item.title?.toLowerCase().includes(menuSearch.toLowerCase());
        const subMatch = item.submenu?.some(s => s.title?.toLowerCase().includes(menuSearch.toLowerCase()));
        return titleMatch || subMatch;
      })
    : sidebarMenu;

  return (
    <>
      {/* ═══ OVERLAY BACKDROP ═══ */}
      {activeSheet && (
        <div 
          className="fixed inset-0 bg-black/50 z-[998] backdrop-blur-sm"
          onClick={() => setActiveSheet(null)}
        />
      )}

      {/* ═══ UPDATES SHEET (Quick Actions Grid) ═══ */}
      {activeSheet === 'updates' && (
        <div 
          ref={sheetRef}
          className={cn(
            "fixed bottom-[60px] left-0 right-0 z-[999]",
            "bg-white dark:bg-[#111B21] rounded-t-3xl",
            "shadow-2xl border-t border-gray-200 dark:border-gray-700",
            "max-h-[70vh] overflow-auto"
          )}
          style={{ 
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            animation: 'slideUp 200ms ease-out'
          }}
        >
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
          </div>
          
          <div className="px-5 pb-2">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Quick Actions</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Access your most used features</p>
          </div>

          <div className="px-4 pb-6 grid grid-cols-4 gap-3">
            {quickActions.map((action, idx) => {
              const Icon = action.icon;
              return (
                <button
                  key={idx}
                  onClick={() => { navigate(action.path); setActiveSheet(null); }}
                  className={cn(
                    "flex flex-col items-center justify-center py-3 px-1 rounded-2xl",
                    "active:scale-95 transition-all duration-150",
                    "bg-gray-50 dark:bg-[#233138]",
                    "hover:bg-gray-100 dark:hover:bg-[#2A3A42]"
                  )}
                >
                  <div 
                    className="w-11 h-11 rounded-full flex items-center justify-center mb-2"
                    style={{ backgroundColor: `${action.color}15` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: action.color }} />
                  </div>
                  <span className="text-[11px] font-medium text-gray-700 dark:text-gray-300 text-center leading-tight">
                    {action.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ MENU SHEET (Full Sidebar) ═══ */}
      {activeSheet === 'menu' && (
        <div 
          className={cn(
            "fixed bottom-[60px] left-0 right-0 z-[999]",
            "bg-white dark:bg-[#111B21] rounded-t-3xl",
            "shadow-2xl border-t border-gray-200 dark:border-gray-700",
            "max-h-[75vh] flex flex-col"
          )}
          style={{ 
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            animation: 'slideUp 200ms ease-out'
          }}
        >
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
          </div>

          <div className="px-4 pb-3 pt-1">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">All Modules</h3>
              <button 
                onClick={() => { signOut(school?.slug ? `/${school.slug}` : '/'); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-red-500 bg-red-50 dark:bg-red-950/30 text-xs font-semibold"
              >
                <LogOut className="w-3.5 h-3.5" />
                Logout
              </button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search modules..."
                value={menuSearch}
                onChange={(e) => setMenuSearch(e.target.value)}
                className={cn(
                  "w-full h-10 pl-10 pr-4 rounded-xl text-sm",
                  "bg-gray-100 dark:bg-[#233138]",
                  "text-gray-900 dark:text-white",
                  "placeholder-gray-500 dark:placeholder-gray-400",
                  "border-0 outline-none focus:ring-2 focus:ring-[#00A884]/40"
                )}
              />
            </div>
          </div>

          <div className="overflow-y-auto flex-1 px-2 pb-4">
            {filteredMenu.map((item, idx) => (
              <MenuListItem 
                key={idx} 
                item={item} 
                navigate={navigate} 
                location={location}
                onClose={() => setActiveSheet(null)}
                menuSearch={menuSearch}
              />
            ))}
            {filteredMenu.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm">
                No modules found
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ BOTTOM TAB BAR (WhatsApp-style) ═══ */}
      <nav 
        className={cn(
          "fixed bottom-0 left-0 right-0 z-[1000]",
          "bg-white dark:bg-[#1F2C34]",
          "border-t border-gray-200/80 dark:border-[#233138]",
          className
        )}
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex items-stretch h-[60px]">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const active = isActive(tab);
            
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab)}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center",
                  "relative transition-colors duration-150",
                  "active:bg-gray-100 dark:active:bg-[#233138]",
                )}
              >
                {active && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-[3px] bg-[#00A884] rounded-b-full" />
                )}
                
                <div className="relative">
                  <Icon 
                    className={cn(
                      "w-[22px] h-[22px] transition-colors",
                      active 
                        ? "text-[#00A884]" 
                        : "text-gray-500 dark:text-gray-400"
                    )} 
                    strokeWidth={active ? 2.5 : 1.8}
                    fill={active && tab.id === 'home' ? 'currentColor' : 'none'}
                  />
                  
                  {tab.badge > 0 && (
                    <span className={cn(
                      "absolute -top-1.5 -right-2",
                      "min-w-[18px] h-[18px]",
                      "flex items-center justify-center",
                      "text-[10px] font-bold text-white",
                      "bg-[#25D366] rounded-full px-1"
                    )}>
                      {tab.badge > 99 ? '99+' : tab.badge}
                    </span>
                  )}
                </div>
                
                <span className={cn(
                  "text-[11px] mt-1",
                  active 
                    ? "text-[#00A884] font-semibold" 
                    : "text-gray-500 dark:text-gray-400 font-medium"
                )}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* CSS Animation */}
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </>
  );
}

// ─── MENU LIST ITEM (Accordion style) ──────────────────────────────────────
function MenuListItem({ item, navigate, location, onClose, menuSearch }) {
  const [expanded, setExpanded] = useState(false);
  const hasSubmenu = item.submenu && item.submenu.length > 0;
  const Icon = item.icon || Menu;

  useEffect(() => {
    if (menuSearch && hasSubmenu) {
      const match = item.submenu.some(s => 
        s.title?.toLowerCase().includes(menuSearch.toLowerCase())
      );
      if (match) setExpanded(true);
    }
  }, [menuSearch, hasSubmenu, item.submenu]);

  const isCurrentSection = hasSubmenu 
    ? item.submenu.some(s => location.pathname === s.path)
    : location.pathname === item.path;

  const handleClick = () => {
    if (hasSubmenu) {
      setExpanded(!expanded);
    } else if (item.path) {
      navigate(item.path);
      onClose();
    }
  };

  const visibleSubmenu = menuSearch && hasSubmenu
    ? item.submenu.filter(s => s.title?.toLowerCase().includes(menuSearch.toLowerCase()))
    : item.submenu;

  return (
    <div className="mb-0.5">
      <button
        onClick={handleClick}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-3 rounded-xl",
          "transition-all duration-150",
          isCurrentSection && !hasSubmenu
            ? "bg-[#00A884]/10 dark:bg-[#00A884]/10"
            : "hover:bg-gray-50 dark:hover:bg-[#233138] active:bg-gray-100 dark:active:bg-[#2A3A42]",
        )}
      >
        <div className={cn(
          "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0",
          isCurrentSection 
            ? "bg-[#00A884]/15 dark:bg-[#00A884]/20" 
            : "bg-gray-100 dark:bg-[#233138]"
        )}>
          <Icon className={cn(
            "w-[18px] h-[18px]",
            isCurrentSection ? "text-[#00A884]" : "text-gray-600 dark:text-gray-400"
          )} />
        </div>
        
        <span className={cn(
          "flex-1 text-left text-[14px]",
          isCurrentSection 
            ? "text-[#00A884] font-semibold" 
            : "text-gray-800 dark:text-gray-200 font-medium"
        )}>
          {item.title}
        </span>
        
        {hasSubmenu && (
          <ChevronRight className={cn(
            "w-4 h-4 text-gray-400 transition-transform duration-200",
            expanded && "rotate-90"
          )} />
        )}
      </button>

      {hasSubmenu && expanded && (
        <div className="ml-6 pl-4 border-l-2 border-gray-100 dark:border-gray-700 my-1">
          {(visibleSubmenu || []).map((sub, sIdx) => {
            if (sub.disabled) return null;
            const isSubActive = location.pathname === sub.path;
            return (
              <button
                key={sIdx}
                onClick={() => { navigate(sub.path); onClose(); }}
                className={cn(
                  "w-full text-left px-3 py-2.5 rounded-lg text-[13px]",
                  "transition-colors duration-150",
                  isSubActive 
                    ? "bg-[#00A884]/10 text-[#00A884] font-semibold" 
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#233138]"
                )}
              >
                {sub.title}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default MobileBottomNav;
