/**
 * DYNAMIC SIDEBAR HOOK v2
 * 
 * Strategy: Use STATIC sidebarConfig routes (they work!) + ADD missing modules from database
 * 
 * Problem solved:
 * - Database route_path values are WRONG (e.g., "/attendance/student" instead of "/school/attendance/student-attendance")
 * - sidebarConfig.js has CORRECT routes that work
 * - We just need to ADD modules that exist in DB but not in static config
 */

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { BASE_SIDEBAR } from '@/config/sidebarConfig';
import { ROUTES } from '@/registry/routeRegistry';
import { 
  LayoutDashboard, School, Users, CreditCard, Settings, BookOpen, 
  GraduationCap, Calendar, FileText, Bus, Building, MessageSquare, 
  Briefcase, Package, CheckSquare, Library, Layout, Video, MonitorPlay, 
  AlertTriangle, Award, IndianRupee, UserPlus, GitBranch, BarChart3, 
  Box, Download, QrCode, Globe, Newspaper, Clipboard, HeadphonesIcon,
  Truck, Home, Image, Bell, Send, Megaphone, BookOpenCheck, Wallet
} from 'lucide-react';

// Icon mapping from string to component
const ICON_MAP = {
  'LayoutDashboard': LayoutDashboard,
  'Dashboard': LayoutDashboard,
  'School': School,
  'Users': Users,
  'CreditCard': CreditCard,
  'Settings': Settings,
  'BookOpen': BookOpen,
  'GraduationCap': GraduationCap,
  'Calendar': Calendar,
  'FileText': FileText,
  'Bus': Bus,
  'Building': Building,
  'MessageSquare': MessageSquare,
  'Briefcase': Briefcase,
  'Package': Package,
  'CheckSquare': CheckSquare,
  'Library': Library,
  'Layout': Layout,
  'Video': Video,
  'MonitorPlay': MonitorPlay,
  'AlertTriangle': AlertTriangle,
  'Award': Award,
  'IndianRupee': IndianRupee,
  'UserPlus': UserPlus,
  'GitBranch': GitBranch,
  'BarChart3': BarChart3,
  'Box': Box,
  'Download': Download,
  'QrCode': QrCode,
  'Globe': Globe,
  'Newspaper': Newspaper,
  'Clipboard': Clipboard,
  'HeadphonesIcon': HeadphonesIcon,
  'Truck': Truck,
  'Home': Home,
  'Image': Image,
  'Bell': Bell,
  'Send': Send,
  'Megaphone': Megaphone,
  'BookOpenCheck': BookOpenCheck,
  'Wallet': Wallet,
  'default': Box
};

// Cache for loaded modules - v2 (2026-01-20: Reset cache due to slug fixes)
let moduleCache = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes (reduced for faster refresh)

/**
 * Get icon component from string name
 */
const getIcon = (iconName) => {
  if (!iconName) return ICON_MAP['default'];
  return ICON_MAP[iconName] || ICON_MAP['default'];
};

/**
 * ⚠️ MASTER ADMIN ONLY MODULES - These should NEVER appear in super_admin/school sidebar
 * These are platform-level modules for Jashchar ERP administrators only
 */
const MASTER_ADMIN_ONLY_SLUGS = [
  'module_registry',
  'branches',
  'organization_requests',
  'branch_management',
  'whatsapp_manager',
  'subscriptions',
  'subscription_plans',
  'subscription_invoices',
  'subscription_transactions',
  'billing_audit',
  'bulk_invoice',
  'website_management',
  'website_manager',
  'saas_website_settings',
  'login_page_settings',
  'file_type_settings',
  'enterprise_health',
  'module_health',
  'demo_automation',
  'school_owner_diagnostics',
  'branch_diagnostics',
  'master_data_settings',
  'communication_settings',
  'queries_finder',
];

/**
 * Convert slug to display name
 */
const slugToDisplayName = (slug) => {
  // Remove parent prefix if exists (e.g., "attendance.student_attendance" -> "Student Attendance")
  const parts = slug.split('.');
  const lastPart = parts[parts.length - 1];
  return lastPart
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Fetch modules from database
 */
const fetchModulesFromDB = async () => {
  const now = Date.now();
  if (moduleCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return moduleCache;
  }
  
  try {
    const { data, error } = await supabase
      .from('module_registry')
      .select('id, slug, name, display_name, icon, parent_slug, category, sort_order, is_active')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });
    
    if (error) throw error;
    
    moduleCache = data || [];
    cacheTimestamp = now;
    return moduleCache;
  } catch (error) {
    console.error('[useDynamicSidebar] Failed to fetch modules:', error);
    return null;
  }
};

/**
 * Find missing modules that are in DB but not in static sidebar
 * Returns modules that should be ADDED to sidebar
 * @param {Array} dbModules - Modules from database
 * @param {Array} staticSidebar - Static sidebar config
 * @param {string} effectiveRole - The effective role (master_admin, super_admin, etc.)
 */
const findMissingModules = (dbModules, staticSidebar, effectiveRole = 'super_admin') => {
  if (!dbModules || !staticSidebar) return { missingParents: [], missingSubsByParent: {} };
  
  // ⚠️ CRITICAL: Filter out master_admin-only modules for non-master_admin roles
  let filteredDbModules = dbModules;
  if (effectiveRole !== 'master_admin') {
    filteredDbModules = dbModules.filter(m => {
      const slug = m.slug?.toLowerCase() || '';
      const lastPart = slug.split('.').pop();
      
      // Check if module is master_admin-only
      const isMasterAdminOnly = MASTER_ADMIN_ONLY_SLUGS.some(maSlug => 
        slug === maSlug || 
        lastPart === maSlug ||
        slug.includes(maSlug)
      );
      
      if (isMasterAdminOnly) {
        console.log('[useDynamicSidebar] Filtering out master_admin module:', slug);
        return false;
      }
      return true;
    });
  }
  
  // Build set of existing slugs from static sidebar (multiple variations)
  const existingSlugs = new Set();
  const existingTitles = new Set();
  
  staticSidebar.forEach(item => {
    // Add parent slug and variations
    const parentSlug = item.title.toLowerCase().replace(/\s+/g, '_');
    existingSlugs.add(parentSlug);
    existingTitles.add(item.title.toLowerCase());
    
    // Add submenu slugs and titles
    if (item.submenu) {
      item.submenu.forEach(sub => {
        const subSlug = sub.title.toLowerCase().replace(/\s+/g, '_');
        // Add multiple formats to handle various DB slug patterns
        existingSlugs.add(`${parentSlug}.${subSlug}`);
        existingSlugs.add(`${parentSlug}.${parentSlug}.${subSlug}`); // double-prefix format
        existingSlugs.add(subSlug); // bare slug
        existingTitles.add(sub.title.toLowerCase());
      });
    }
  });
  
  // Helper to check if a module slug already exists
  const slugExists = (slug, moduleName) => {
    if (existingSlugs.has(slug)) return true;
    // Also check without parent prefix
    const parts = slug.split('.');
    const lastPart = parts[parts.length - 1];
    if (existingSlugs.has(lastPart)) return true;
    if (existingTitles.has(lastPart.replace(/_/g, ' '))) return true;
    
    // Check module name/display_name against existing titles
    if (moduleName && existingTitles.has(moduleName.toLowerCase())) return true;
    
    // Handle singular/plural variations (fee_type vs fees_type, fee_group vs fees_group)
    const singularSlug = lastPart.replace(/^fees?_/, 'fee_').replace(/^fees?$/, 'fee');
    const pluralSlug = lastPart.replace(/^fees?_/, 'fees_').replace(/^fees?$/, 'fees');
    if (existingSlugs.has(singularSlug)) return true;
    if (existingSlugs.has(pluralSlug)) return true;
    if (existingTitles.has(singularSlug.replace(/_/g, ' '))) return true;
    if (existingTitles.has(pluralSlug.replace(/_/g, ' '))) return true;
    
    return false;
  };
  
  // Find parent modules not in static config (use filtered modules)
  const missingParents = filteredDbModules.filter(m => 
    !m.parent_slug && !slugExists(m.slug, m.name || m.display_name)
  );
  
  // Group missing submodules by parent (use filtered modules)
  const missingSubsByParent = {};
  filteredDbModules.filter(m => m.parent_slug).forEach(sub => {
    const fullSlug = sub.slug;
    if (!slugExists(fullSlug, sub.name || sub.display_name)) {
      if (!missingSubsByParent[sub.parent_slug]) {
        missingSubsByParent[sub.parent_slug] = [];
      }
      missingSubsByParent[sub.parent_slug].push(sub);
    }
  });
  
  return { missingParents, missingSubsByParent };
};

/**
 * Hook to get enhanced sidebar with dynamic additions
 */
export const useDynamicSidebar = (role) => {
  const [additionalModules, setAdditionalModules] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    let isMounted = true;
    
    const loadModules = async () => {
      try {
        setLoading(true);
        const dbModules = await fetchModulesFromDB();
        
        if (!isMounted) return;
        
        if (dbModules) {
          setAdditionalModules(dbModules);
          setError(null);
        } else {
          setError('Failed to load modules');
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    loadModules();
    
    return () => { isMounted = false; };
  }, [role]);
  
  // Build final menu
  const menu = useMemo(() => {
    // Get effective role
    // master_admin stays as master_admin
    // student, parent, teacher, principal, accountant, receptionist, librarian keep their own sidebar
    // organization_owner, super_admin, admin, school_owner -> super_admin
    
    // Normalize role to handle both underscore and space formats
    const normalizedInputRole = role?.toLowerCase().replace(/\s+/g, '_') || '';
    let effectiveRole = normalizedInputRole;
    
    // ✅ Roles that have their OWN curated sidebar in sidebarConfig.js
    const rolesWithOwnSidebar = [
      'student', 'parent', 'teacher', 'principal', 'master_admin',
      'accountant', 'receptionist', 'librarian',
      'vice_principal', 'coordinator', 'class_teacher', 'subject_teacher',
      'cashier', 'lab_assistant', 'hostel_warden',
      'driver', 'sports_coach', 'security_guard',
      'maintenance_staff', 'maintenance', 'peon',
    ];
    
    // ✅ Roles that share the super_admin sidebar (school owners/admins)
    const schoolAdminRoles = ['organization_owner', 'super_admin', 'admin', 'school_owner'];
    
    if (rolesWithOwnSidebar.includes(normalizedInputRole)) {
      // Handle maintenance -> maintenance_staff alias
      effectiveRole = normalizedInputRole === 'maintenance' ? 'maintenance_staff' : normalizedInputRole;
    } else if (schoolAdminRoles.includes(normalizedInputRole)) {
      effectiveRole = 'super_admin';
    }
    
    console.log('[useDynamicSidebar] Role:', role, '-> Normalized:', normalizedInputRole, '-> Effective:', effectiveRole);
    
    // Start with static sidebar (has correct routes!)
    const staticMenu = BASE_SIDEBAR[effectiveRole] || BASE_SIDEBAR['super_admin'] || [];
    
    // ✅ Roles with their own curated sidebar: Return static sidebar only
    // They have curated modules defined in sidebarConfig.js - no dynamic additions needed
    if (rolesWithOwnSidebar.includes(effectiveRole)) {
      console.log('[useDynamicSidebar]', effectiveRole, '- using role-specific sidebar:', staticMenu.length, 'items');
      return staticMenu;
    }
    
    // If no additional modules loaded, return static
    if (!additionalModules || additionalModules.length === 0) {
      console.log('[useDynamicSidebar] Using static sidebar only');
      return staticMenu;
    }
    
    // Find what's missing (pass effectiveRole to filter out master_admin modules)
    const { missingParents, missingSubsByParent } = findMissingModules(additionalModules, staticMenu, effectiveRole);
    
    // Clone static menu to avoid mutations
    let enhancedMenu = staticMenu.map(item => ({
      ...item,
      submenu: item.submenu ? [...item.submenu] : undefined
    }));
    
    // Add missing submodules to existing parents
    enhancedMenu = enhancedMenu.map(item => {
      const parentSlug = item.title.toLowerCase().replace(/\s+/g, '_');
      const missingSubs = missingSubsByParent[parentSlug];
      
      if (missingSubs && missingSubs.length > 0 && item.submenu) {
        // Determine role prefix - All school staff use /super-admin/
        const rolePrefix = effectiveRole === 'master_admin' ? '/master-admin' : '/super-admin';
        
        // Add missing submodules
        const newSubs = missingSubs.map(sub => ({
          title: sub.display_name || sub.name || slugToDisplayName(sub.slug),
          path: `${rolePrefix}/${parentSlug.replace(/_/g, '-')}/${sub.slug.split('.').pop().replace(/_/g, '-')}`,
          slug: sub.slug
        }));
        
        return {
          ...item,
          submenu: [...item.submenu, ...newSubs]
        };
      }
      
      return item;
    });
    
    // Add missing parent modules at the end
    if (missingParents.length > 0) {
      console.log('[useDynamicSidebar] Adding missing parents:', missingParents.map(p => p.slug));
      
      missingParents.forEach(parent => {
        const children = additionalModules.filter(m => m.parent_slug === parent.slug);
        const rolePrefix = effectiveRole === 'master_admin' ? '/master-admin' : '/super-admin';
        
        if (children.length > 0) {
          enhancedMenu.push({
            title: parent.display_name || parent.name || slugToDisplayName(parent.slug),
            icon: getIcon(parent.icon),
            slug: parent.slug,
            submenu: children.map(child => ({
              title: child.display_name || child.name || slugToDisplayName(child.slug),
              path: `${rolePrefix}/${parent.slug.replace(/_/g, '-')}/${child.slug.split('.').pop().replace(/_/g, '-')}`,
              slug: child.slug
            }))
          });
        } else {
          enhancedMenu.push({
            title: parent.display_name || parent.name || slugToDisplayName(parent.slug),
            icon: getIcon(parent.icon),
            path: `${rolePrefix}/${parent.slug.replace(/_/g, '-')}`,
            slug: parent.slug
          });
        }
      });
    }
    
    // Deduplicate menu items by path to prevent React key warnings
    const deduplicatedMenu = enhancedMenu.map(item => {
      if (item.submenu) {
        const seenPaths = new Set();
        const uniqueSubmenu = item.submenu.filter(sub => {
          if (seenPaths.has(sub.path)) {
            console.log('[useDynamicSidebar] Removing duplicate submenu:', sub.path);
            return false;
          }
          seenPaths.add(sub.path);
          return true;
        });
        return { ...item, submenu: uniqueSubmenu };
      }
      return item;
    });
    
    console.log('[useDynamicSidebar] Enhanced menu items:', deduplicatedMenu.length);
    return deduplicatedMenu;
  }, [role, additionalModules]);
  
  return {
    menu,
    loading,
    error,
    isDynamic: additionalModules && additionalModules.length > 0,
    refreshCache: () => {
      moduleCache = null;
      cacheTimestamp = 0;
    }
  };
};

/**
 * Clear module cache
 */
export const clearModuleCache = () => {
  moduleCache = null;
  cacheTimestamp = 0;
};

export default useDynamicSidebar;

