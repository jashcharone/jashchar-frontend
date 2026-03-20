// 🧬 Permission DNA - Real Sidebar Preview Component
// Shows EXACT real-time preview of how sidebar will appear for the selected role
// Uses actual sidebarConfig.js structure for 100% accuracy

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, School, Users, CreditCard, Settings, BookOpen, 
  GraduationCap, Calendar, FileText, Bus, Building, MessageSquare, 
  Briefcase, Package, CheckSquare, Library, Layout, Video, MonitorPlay, 
  AlertTriangle, Award, Newspaper, IndianRupee, UserPlus, GitBranch, 
  BarChart3, Bot, Box, Download, QrCode, Eye, EyeOff, ChevronRight,
  ChevronDown, Lock, Monitor, Smartphone, CheckCircle, XCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

// ============================================
// SIDEBAR MODULE MAPPING - LOGICAL ORDER
// ============================================
const SIDEBAR_MODULES = [
  // 1. Dashboard & Front Desk
  { 
    slug: 'front_office', 
    title: 'Front Office', 
    icon: Building,
    color: 'text-blue-400',
    subItems: ['Admission Enquiry', 'Visitor Book', 'Phone Call Log', 'Postal Dispatch', 'Postal Receive', 'Complain', 'Setup Front Office']
  },
  { 
    slug: 'student_information', 
    title: 'Student Information', 
    icon: Users,
    color: 'text-emerald-400',
    subItems: ['Student Admission', 'Student Details', 'Online Admission', 'Bulk Upload', 'ID Card', 'Disabled Students']
  },
  { 
    slug: 'human_resource', 
    title: 'Human Resource', 
    icon: Briefcase,
    color: 'text-teal-400',
    subItems: ['Staff Directory', 'Add Staff', 'Department', 'Designation', 'Payroll', 'Leave Management', 'Apply Leave', 'Leave Type']
  },
  
  // 2. Academics & Learning
  { 
    slug: 'academics', 
    title: 'Academics', 
    icon: GraduationCap,
    color: 'text-violet-400',
    subItems: ['Class', 'Sections', 'Subjects', 'Subject Groups', 'Subject Teacher', 'Class Teacher', 'Timetable', 'Promote Students']
  },
  { 
    slug: 'lesson_plan', 
    title: 'Lesson Plan', 
    icon: BookOpen,
    color: 'text-pink-400',
    subItems: ['Add Homework', 'Homework List', 'Evaluate Homework', 'Manage Lessons', 'Syllabus Status']
  },
  { 
    slug: 'examinations', 
    altSlugs: ['examination', 'exam'],
    title: 'Examinations', 
    icon: FileText,
    color: 'text-indigo-400',
    subItems: ['Exam Group', 'Exam List', 'Exam Schedule', 'Exam Result', 'Marks Entry', 'Marks Grade', 'Admit Card', 'Marksheet']
  },
  { 
    slug: 'online_course', 
    title: 'Online Course', 
    icon: MonitorPlay,
    color: 'text-red-400',
    subItems: ['Online Course', 'Offline Payment', 'Report', 'Setting']
  },
  { 
    slug: 'behaviour_records', 
    title: 'Behaviour Records', 
    icon: AlertTriangle,
    color: 'text-orange-400',
    subItems: ['Assign Incident', 'Incidents', 'Reports', 'Setting']
  },
  { 
    slug: 'certificate', 
    title: 'Certificate', 
    icon: Award,
    color: 'text-yellow-400',
    subItems: ['Student Certificate', 'Generate Certificate', 'Student ID Card', 'Generate ID Card', 'Staff ID Card']
  },
  
  // 3. Finance
  { 
    slug: 'fees_collection', 
    altSlugs: ['fee_collection', 'fees'],
    title: 'Fees Collection', 
    icon: CreditCard,
    color: 'text-amber-400',
    subItems: ['Collect Fees', 'Offline Bank Payments', 'Online Payment', 'Search Fees Payment', 'Search Due Fees', 'Fees Master', 'Quick Fees', 'Fees Group', 'Fees Type', 'Fees Discount']
  },
  { 
    slug: 'income', 
    altSlugs: ['finance'],
    title: 'Income', 
    icon: IndianRupee,
    color: 'text-green-400',
    subItems: ['Income', 'Add Income', 'Income Head']
  },
  { 
    slug: 'expenses', 
    title: 'Expenses', 
    icon: IndianRupee,
    color: 'text-rose-400',
    subItems: ['Expense', 'Add Expense', 'Expense Head']
  },
  
  // 4. Operations
  { 
    slug: 'attendance', 
    title: 'Attendance', 
    icon: Calendar,
    color: 'text-cyan-400',
    subItems: ['Student Attendance', 'Attendance By Date', 'Approve Leave', 'Staff Attendance', 'Attendance Report', 'Live Dashboard', 'QR Code Generator']
  },
  { 
    slug: 'transport', 
    title: 'Transport', 
    icon: Bus,
    color: 'text-emerald-400',
    subItems: ['Fees Master', 'Pickup Points', 'Routes', 'Vehicles', 'Assign Vehicle', 'Route Pickup Points', 'Student Transport Fees']
  },
  { 
    slug: 'hostel', 
    title: 'Hostel', 
    icon: Building,
    color: 'text-indigo-400',
    subItems: ['Hostel Rooms', 'Room Type', 'Hostel', 'Hostel Fee']
  },
  { 
    slug: 'library', 
    title: 'Library', 
    icon: Library,
    color: 'text-amber-400',
    subItems: ['Book List', 'Add Book', 'Books', 'Book Issued', 'Book Members', 'Issue/Return', 'Library Card']
  },
  { 
    slug: 'inventory', 
    title: 'Inventory', 
    icon: Package,
    color: 'text-orange-400',
    subItems: ['Issue Item', 'Add Item Stock', 'Item Stock', 'Add Item', 'Item Category', 'Item Store', 'Item Supplier']
  },
  
  // 5. Communication
  { 
    slug: 'communicate', 
    title: 'Communicate', 
    icon: MessageSquare,
    color: 'text-sky-400',
    subItems: ['Notice Board', 'Send Email', 'Send SMS', 'WhatsApp', 'Push Notification', 'Email/SMS Log']
  },
  { 
    slug: 'gmeet_live_classes', 
    title: 'Gmeet Live Classes', 
    icon: Video,
    color: 'text-blue-400',
    subItems: ['Live Classes', 'Live Meeting', 'Live Classes Report', 'Meeting Report', 'Setting']
  },
  { 
    slug: 'task_management', 
    title: 'Task Management', 
    icon: CheckSquare,
    color: 'text-lime-400',
    subItems: ['Dashboard', 'All Tasks', 'My Tasks', 'Create Task', 'Categories', 'Priorities']
  },
  
  // 6. Others
  { 
    slug: 'multi_branch', 
    title: 'Multi Branch', 
    icon: GitBranch,
    color: 'text-cyan-400',
    subItems: ['Branch Overview', 'Branch List', 'Add Branch', 'Branch Settings', 'Branch Reports']
  },
  { 
    slug: 'front_cms', 
    title: 'Front CMS', 
    icon: Layout,
    color: 'text-pink-400',
    subItems: ['Website Settings', 'Menus', 'Pages', 'Events', 'Gallery', 'News', 'Media Manager', 'Banner Images']
  },
  { 
    slug: 'alumni', 
    title: 'Alumni', 
    icon: GraduationCap,
    color: 'text-purple-400',
    subItems: ['Alumni List', 'Alumni Events']
  },
  { 
    slug: 'download_center', 
    title: 'Download Center', 
    icon: Download,
    color: 'text-blue-400',
    subItems: []
  },
  { 
    slug: 'reports', 
    title: 'Reports', 
    icon: FileText,
    color: 'text-slate-400',
    subItems: ['Student Information', 'Finance', 'Attendance', 'Examinations', 'Human Resource', 'Library', 'Transport', 'Hostel', 'Homework']
  },
  { 
    slug: 'system_settings', 
    title: 'System Settings', 
    icon: Settings,
    color: 'text-gray-400',
    subItems: ['General Setting', 'Session Setting', 'Roles Permissions', 'Email Setting', 'SMS Setting', 'Payment Gateway', 'Backup & Restore']
  },
];

// ============================================
// SIMPLE & ACCURATE PERMISSION MATCHING
// ============================================
// Permission keys come in these formats from role_permissions table:
// 1. "fees_collection" - parent module direct
// 2. "fees_collection.collect_fees" - parent.submodule format
// 3. "human_resource.human_resource.apply_leave" - nested format
//
// We check: If ANY permission key STARTS WITH or EQUALS the sidebar module slug,
// that module should be visible.

const hasModuleAccess = (permissions, moduleSlug, altSlugs = []) => {
  // Collect all slugs to check
  const slugsToCheck = [moduleSlug, ...altSlugs];
  
  for (const slug of slugsToCheck) {
    // Direct check - permissions[slug]?.view
    if (permissions[slug]?.view) {
      return { hasAccess: true, matchedSlug: slug };
    }
    
    // Check if any permission key starts with "slug." (has sub-module access)
    const hasSubModuleAccess = Object.entries(permissions).some(([key, perms]) => {
      return perms?.view && (
        key === slug || 
        key.startsWith(`${slug}.`) ||
        key.startsWith(`${slug}_`)
      );
    });
    
    if (hasSubModuleAccess) {
      return { hasAccess: true, matchedSlug: slug };
    }
  }
  
  return { hasAccess: false, matchedSlug: null };
};

// Get visible sub-items for a module
const getVisibleSubItems = (permissions, matchedSlug, defaultSubItems = []) => {
  if (!matchedSlug) return defaultSubItems;
  
  const visibleSubs = [];
  
  Object.entries(permissions).forEach(([key, perms]) => {
    if (perms?.view && key.startsWith(`${matchedSlug}.`)) {
      // Extract sub-module name: "fees_collection.collect_fees" -> "collect_fees"
      const parts = key.split('.');
      if (parts.length >= 2) {
        // Convert slug to readable name: "collect_fees" -> "Collect Fees"
        const subName = parts.slice(1).join('.')
          .replace(/_/g, ' ')
          .replace(/-/g, ' ')
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        if (!visibleSubs.includes(subName)) {
          visibleSubs.push(subName);
        }
      }
    }
  });
  
  return visibleSubs.length > 0 ? visibleSubs : defaultSubItems;
};

const SidebarPreview = ({ 
  roleName = 'User',
  modules = [],
  permissions = {},
  isVisible = true,
}) => {
  const [expandedMenus, setExpandedMenus] = useState(new Set([
    'fees_collection', 'human_resource', 'income', 'expenses', 'transport', 'hostel', 'reports', 'inventory'
  ]));

  // Calculate which modules are visible based on VIEW permission
  const visibleModules = useMemo(() => {
    const visible = [];
    
    // Simple, direct approach - check each sidebar module against permissions
    SIDEBAR_MODULES.forEach(sidebarModule => {
      const { hasAccess, matchedSlug } = hasModuleAccess(
        permissions, 
        sidebarModule.slug, 
        sidebarModule.altSlugs || []
      );
      
      // Check if user has access to this module
      if (hasAccess) {
        // Get visible sub-items
        const visibleSubItems = getVisibleSubItems(
          permissions, 
          matchedSlug, 
          sidebarModule.subItems.slice(0, 5)
        );
        
        visible.push({
          ...sidebarModule,
          visibleSubItems,
          subItemCount: visibleSubItems.length
        });
      }
    });

    return visible;
  }, [permissions]);

  // Stats
  const stats = useMemo(() => {
    return {
      total: SIDEBAR_MODULES.length,
      visible: visibleModules.length,
      hidden: SIDEBAR_MODULES.length - visibleModules.length
    };
  }, [visibleModules]);

  const toggleMenu = (slug) => {
    setExpandedMenus(prev => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }
      return next;
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.3 }}
          className="h-full flex flex-col"
        >
          {/* Header */}
          <div className="flex-shrink-0 p-3 border-b bg-gradient-to-r from-emerald-500/10 to-teal-500/10">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-500" />
                <h3 className="font-semibold text-sm">Live Sidebar Preview</h3>
              </div>
              <Badge className="text-[10px] bg-primary/20 text-primary border-0">
                {roleName}
              </Badge>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5 text-emerald-600">
                <CheckCircle className="w-3 h-3" />
                <span><b>{stats.visible}</b>/{stats.total} modules</span>
              </div>
              <div className="flex items-center gap-1.5 text-rose-500">
                <XCircle className="w-3 h-3" />
                <span><b>{stats.hidden}</b> hidden</span>
              </div>
            </div>
          </div>

          {/* Preview Container - Fake Dark Sidebar */}
          <div className="flex-1 overflow-hidden">
            <div className={cn(
              "h-full flex flex-col",
              "bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950"
            )}>
              {/* Fake Sidebar Header */}
              <div className="flex-shrink-0 p-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
                    <span className="text-white text-xs font-bold">J</span>
                  </div>
                  <div>
                    <div className="text-white text-xs font-semibold">Jashchar ERP</div>
                    <div className="text-slate-500 text-[10px]">{roleName} View</div>
                  </div>
                </div>
              </div>

              {/* Sidebar Menu Scroll Area */}
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-0.5">
                  {/* Dashboard - Always visible */}
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/20 text-primary">
                    <LayoutDashboard className="w-4 h-4" />
                    <span className="text-xs font-medium">Dashboard</span>
                  </div>

                  {/* Visible Modules */}
                  {visibleModules.length > 0 ? (
                    visibleModules.map((module, index) => {
                      const IconComponent = module.icon;
                      const isExpanded = expandedMenus.has(module.slug);
                      const hasSubItems = module.subItemCount > 0;

                      return (
                        <motion.div
                          key={module.slug}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.03 }}
                        >
                          {/* Main Menu Item */}
                          <div 
                            onClick={() => hasSubItems && toggleMenu(module.slug)}
                            className={cn(
                              "flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer",
                              "hover:bg-slate-800/50 transition-colors group"
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <IconComponent className={cn("w-4 h-4", module.color)} />
                              <span className="text-slate-200 text-xs">{module.title}</span>
                            </div>
                            {hasSubItems && (
                              <div className="flex items-center gap-1">
                                <span className="text-[9px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">
                                  {module.subItemCount}
                                </span>
                                {isExpanded ? (
                                  <ChevronDown className="w-3 h-3 text-slate-500" />
                                ) : (
                                  <ChevronRight className="w-3 h-3 text-slate-500" />
                                )}
                              </div>
                            )}
                          </div>

                          {/* Sub Items */}
                          <AnimatePresence>
                            {isExpanded && hasSubItems && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="ml-3 pl-3 border-l border-slate-800 space-y-0.5 py-1">
                                  {module.visibleSubItems.map((subItem, subIdx) => (
                                    <div 
                                      key={subIdx}
                                      className="flex items-center gap-2 px-2 py-1.5 text-slate-400 hover:text-slate-200 cursor-pointer rounded hover:bg-slate-800/30 transition-colors"
                                    >
                                      <div className="w-1 h-1 rounded-full bg-slate-600" />
                                      <span className="text-[10px]">{subItem}</span>
                                    </div>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })
                  ) : (
                    <div className="text-center py-6 text-slate-500">
                      <EyeOff className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-xs">No modules visible</p>
                      <p className="text-[10px] mt-1 text-slate-600">Enable View permission</p>
                    </div>
                  )}

                  {/* Hidden Modules Indicator */}
                  {stats.hidden > 0 && (
                    <div className="mt-3 mx-1 p-2 rounded-lg bg-slate-800/30 border border-dashed border-slate-700">
                      <div className="flex items-center gap-2 text-slate-500 text-[10px]">
                        <Lock className="w-3 h-3" />
                        <span>{stats.hidden} modules hidden from {roleName}</span>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Bottom User */}
              <div className="flex-shrink-0 p-2 border-t border-slate-800">
                <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-slate-800/50">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                    <span className="text-white text-[10px] font-bold">
                      {roleName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="text-slate-200 text-[10px] font-medium">{roleName}</div>
                    <div className="text-slate-500 text-[8px]">{roleName.toLowerCase()}@school.edu</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 p-2 border-t bg-muted/30 text-center">
            <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
              <Eye className="w-3 h-3" />
              Live updates as you change permissions
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SidebarPreview;
