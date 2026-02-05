// 🧬 PERMISSION DNA - Revolutionary Role Permission System
// Built for 100+ years of future-proof access management
// Version 2.0 - The DNA of Digital Access Control

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase, isSupabaseReady } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getSchoolOwnerModules } from '@/services/schoolOwnerModulesLoader';
import { cn } from '@/lib/utils';

// Icons
import { 
  Loader2, Plus, Shield, Search, Save, RefreshCw,
  Building2, Users, Dna, Sparkles, Grid3X3, List,
  ChevronLeft, ChevronRight, Check, X, Info,
  Zap, Eye, Layout, Settings2, History
} from 'lucide-react';

// DNA Components
import RoleCard from './components/RoleCard';
import ModuleTree from './components/ModuleTree';
import PermissionChip from './components/PermissionChip';
import ImpactAnalysis from './components/ImpactAnalysis';
import QuickActions from './components/QuickActions';
import SidebarPreview from './components/SidebarPreview';

// System Roles
const SYSTEM_ROLES = [
  'Super Admin', 'Admin', 'Principal', 'Accountant', 'Receptionist', 
  'Teacher', 'Librarian', 'Parent', 'Student'
];

const PermissionDNA = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // ========== STATE MANAGEMENT ==========
  // Selection State
  const [schools, setSchools] = useState([]);
  const [selectedSchool, setSelectedSchool] = useState('');
  const [selectedSchoolName, setSelectedSchoolName] = useState('');
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);

  // Data State
  const [modules, setModules] = useState([]);
  const [permissions, setPermissions] = useState({});
  const [originalPermissions, setOriginalPermissions] = useState({});

  // UI State
  const [loading, setLoading] = useState(false);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('tree'); // 'tree' | 'grid'
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showImpact, setShowImpact] = useState(false);
  const [showSidebarPreview, setShowSidebarPreview] = useState(true); // Live Sidebar Preview

  // Dialog State
  const [newRoleName, setNewRoleName] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // ========== COMPUTED VALUES ==========
  const hasChanges = useMemo(() => {
    return JSON.stringify(permissions) !== JSON.stringify(originalPermissions);
  }, [permissions, originalPermissions]);

  const changedPermissions = useMemo(() => {
    const changes = [];
    Object.entries(permissions).forEach(([moduleSlug, perms]) => {
      const original = originalPermissions[moduleSlug] || {};
      ['view', 'add', 'edit', 'delete'].forEach(action => {
        if (perms[action] !== (original[action] || false)) {
          changes.push({
            module: moduleSlug.split('.').pop().replace(/_/g, ' '),
            action,
            enabled: perms[action]
          });
        }
      });
    });
    return changes;
  }, [permissions, originalPermissions]);

  const permissionCount = useMemo(() => {
    let count = 0;
    Object.values(permissions).forEach(perms => {
      count += Object.values(perms).filter(Boolean).length;
    });
    return count;
  }, [permissions]);

  // ========== DATA FETCHING ==========
  useEffect(() => {
    fetchSchools();
  }, []);

  useEffect(() => {
    if (selectedSchool) {
      fetchRoles(selectedSchool);
      fetchModules(selectedSchool);
      setSelectedRole(null);
      setPermissions({});
      setOriginalPermissions({});
      
      // Find school name
      const school = schools.find(s => s.id === selectedSchool);
      setSelectedSchoolName(school?.name || '');
    } else {
      setRoles([]);
      setModules([]);
    }
  }, [selectedSchool]);

  useEffect(() => {
    if (selectedRole && selectedSchool) {
      fetchRolePermissions(selectedRole.id);
    }
  }, [selectedRole]);

  const fetchSchools = async () => {
    if (!isSupabaseReady()) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/org/list-all', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch organizations');
      const { data: orgs } = await response.json();

      const formattedList = [];
      if (orgs) {
        orgs.forEach(org => {
          if (org.schools) {
            org.schools.forEach(school => {
              formattedList.push({
                id: school.id,
                name: `${org.name} - ${school.name}`,
                orgName: org.name,
                schoolName: school.name,
                orgId: org.id
              });
            });
          }
        });
        formattedList.sort((a, b) => a.name.localeCompare(b.name));
      }
      setSchools(formattedList);
    } catch (error) {
      console.error('Error fetching schools:', error);
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const fetchRoles = async (branchId) => {
    setLoading(true);
    try {
      const { data: customRoles, error } = await supabase
        .from('roles')
        .select('*')
        .eq('branch_id', branchId);

      if (error) throw error;

      const uniqueDbRoles = [];
      const seenDbNames = new Set();

      if (customRoles) {
        customRoles.forEach(role => {
          const normalized = role.name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
          if (!seenDbNames.has(normalized)) {
            seenDbNames.add(normalized);
            const systemRoleMatch = SYSTEM_ROLES.find(sr =>
              sr.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() === normalized
            );

            uniqueDbRoles.push({
              ...role,
              name: systemRoleMatch || role.name,
              is_system: !!systemRoleMatch || role.is_system
            });
          }
        });
      }

      // Add virtual system roles not in DB yet
      const finalRoles = [];
      SYSTEM_ROLES.forEach(name => {
        const normalizedSystemName = name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        if (!seenDbNames.has(normalizedSystemName)) {
          finalRoles.push({
            id: `sys-${normalizedSystemName}`,
            name: name,
            is_system: true,
            is_virtual: true
          });
        }
      });

      finalRoles.push(...uniqueDbRoles);
      setRoles(finalRoles);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const fetchModules = async (branchId) => {
    const allowedModules = await getSchoolOwnerModules(branchId);
    if (!allowedModules) return;

    const { data: allModules } = await supabase
      .from('module_registry')
      .select('id, slug, name, parent_slug, icon')
      .eq('is_active', true);

    const childrenMap = {};
    allModules?.forEach(m => {
      if (m.parent_slug) {
        if (!childrenMap[m.parent_slug]) childrenMap[m.parent_slug] = [];
        childrenMap[m.parent_slug].push({
          key: m.slug,
          label: m.name,
          fullSlug: `${m.parent_slug}.${m.slug}`,
          icon: m.icon
        });
      }
    });

    // ✅ LOGICAL MODULE ORDER for proper display
    const MODULE_ORDER = [
      'dashboard', 'front_office', 'student_information', 'human_resource',
      'academics', 'lesson_plan', 'examinations', 'online_examinations', 'online_course',
      'behaviour_records', 'certificate', 'fees_collection', 'income', 'expenses', 'finance',
      'attendance', 'annual_calendar', 'transport', 'hostel', 'library', 'inventory',
      'communicate', 'zoom_live', 'gmeet_live_classes', 'task_management',
      'multi_branch', 'front_cms', 'alumni', 'download_center', 'whatsapp_manager',
      'reports', 'system_settings'
    ];

    const structuredModules = [];
    const processedSlugs = new Set();

    allowedModules.forEach(m => {
      const slug = m.slug;
      if (!processedSlugs.has(slug)) {
        processedSlugs.add(slug);
        
        // Sort subModules alphabetically
        const sortedSubModules = (childrenMap[slug] || []).sort((a, b) => 
          a.label.localeCompare(b.label)
        );
        
        structuredModules.push({
          id: m.id,
          slug: slug,
          name: m.name,
          icon: m.icon,
          subModules: sortedSubModules
        });
      }
    });
    
    // ✅ Sort modules by logical order
    structuredModules.sort((a, b) => {
      const orderA = MODULE_ORDER.indexOf(a.slug);
      const orderB = MODULE_ORDER.indexOf(b.slug);
      // If not in order list, put at end alphabetically
      if (orderA === -1 && orderB === -1) return a.name.localeCompare(b.name);
      if (orderA === -1) return 1;
      if (orderB === -1) return -1;
      return orderA - orderB;
    });
    
    setModules(structuredModules);
  };

  const fetchRolePermissions = async (roleId) => {
    setLoadingPermissions(true);
    try {
      if (roleId.startsWith('sys-')) {
        setPermissions({});
        setOriginalPermissions({});
        setLoadingPermissions(false);
        return;
      }

      const { data, error } = await supabase
        .from('role_permissions')
        .select('*')
        .eq('role_id', roleId);

      if (error) throw error;

      const permMap = {};
      data.forEach(p => {
        permMap[p.module_slug] = {
          view: p.can_view,
          add: p.can_add,
          edit: p.can_edit,
          delete: p.can_delete
        };
      });
      setPermissions(permMap);
      setOriginalPermissions(permMap);
    } catch (error) {
      console.error('Error fetching permissions:', error);
    } finally {
      setLoadingPermissions(false);
    }
  };

  // ========== PERMISSION HANDLERS ==========
  const handlePermissionChange = useCallback((moduleSlug, action, checked) => {
    setPermissions(prev => {
      const currentPerms = prev[moduleSlug] || { view: false, add: false, edit: false, delete: false };
      let newPerms = { ...currentPerms, [action]: checked };

      // View is required for any other action
      if (checked && (action === 'add' || action === 'edit' || action === 'delete')) {
        newPerms.view = true;
      }
      // Unchecking View unchecks everything
      if (!checked && action === 'view') {
        newPerms.add = false;
        newPerms.edit = false;
        newPerms.delete = false;
      }

      return { ...prev, [moduleSlug]: newPerms };
    });
  }, []);

  const handleToggleAll = useCallback((module, checked) => {
    setPermissions(prev => {
      const updated = { ...prev };
      const newPerms = { view: checked, add: checked, edit: checked, delete: checked };

      updated[module.slug] = newPerms;
      if (module.subModules) {
        module.subModules.forEach(sub => {
          updated[sub.fullSlug] = { ...newPerms };
        });
      }
      return updated;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setPermissions(prev => {
      const updated = { ...prev };
      const newPerms = { view: true, add: true, edit: true, delete: true };

      modules.forEach(m => {
        updated[m.slug] = { ...newPerms };
        m.subModules?.forEach(sub => {
          updated[sub.fullSlug] = { ...newPerms };
        });
      });
      return updated;
    });
  }, [modules]);

  const handleDeselectAll = useCallback(() => {
    setPermissions({});
  }, []);

  const handleViewOnly = useCallback(() => {
    setPermissions(prev => {
      const updated = {};
      modules.forEach(m => {
        updated[m.slug] = { view: true, add: false, edit: false, delete: false };
        m.subModules?.forEach(sub => {
          updated[sub.fullSlug] = { view: true, add: false, edit: false, delete: false };
        });
      });
      return updated;
    });
  }, [modules]);

  const handleReset = useCallback(() => {
    setPermissions(originalPermissions);
  }, [originalPermissions]);

  const handleApplyTemplate = useCallback((template) => {
    const newPerms = {};
    modules.forEach(m => {
      const hasAccess = template.modules === 'all' || template.modules.includes(m.slug);
      if (hasAccess) {
        newPerms[m.slug] = { ...template.permissions };
        m.subModules?.forEach(sub => {
          newPerms[sub.fullSlug] = { ...template.permissions };
        });
      }
    });
    setPermissions(newPerms);
    toast({ 
      title: '✨ Template Applied', 
      description: `Applied "${template.key}" template successfully` 
    });
  }, [modules, toast]);

  // ========== SAVE HANDLER ==========
  const handleSave = async () => {
    if (!selectedRole || !selectedSchool) return;
    setSaving(true);

    try {
      let roleId = selectedRole.id;

      // Create Role if Virtual
      if (selectedRole.is_virtual) {
        const { data: newRole, error: createError } = await supabase
          .from('roles')
          .insert({
            branch_id: selectedSchool,
            name: selectedRole.name,
            is_system: true
          })
          .select()
          .single();

        if (createError) throw createError;
        roleId = newRole.id;

        setRoles(prev => prev.map(r => r.id === selectedRole.id ? { ...newRole, is_virtual: false } : r));
        setSelectedRole({ ...newRole, is_virtual: false });
      }

      // Prepare Permissions Data
      const upsertData = [];
      Object.entries(permissions).forEach(([slug, perms]) => {
        if (perms.view || perms.add || perms.edit || perms.delete) {
          upsertData.push({
            branch_id: selectedSchool,
            role_id: roleId,
            module_slug: slug,
            can_view: perms.view,
            can_add: perms.add,
            can_edit: perms.edit,
            can_delete: perms.delete,
            role_name: selectedRole.name
          });
        }
      });

      // Delete existing and Insert new
      await supabase.from('role_permissions')
        .delete()
        .eq('branch_id', selectedSchool)
        .eq('role_name', selectedRole.name);

      if (upsertData.length > 0) {
        const { error: insertError } = await supabase
          .from('role_permissions')
          .upsert(upsertData, {
            onConflict: 'branch_id,role_name,module_slug',
            ignoreDuplicates: false
          });
        if (insertError) throw insertError;
      }

      setOriginalPermissions(permissions);
      toast({ 
        title: '✅ Saved Successfully', 
        description: `Permissions for ${selectedRole.name} have been updated` 
      });
    } catch (error) {
      console.error('Save error:', error);
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setSaving(false);
    }
  };

  // ========== ROLE HANDLERS ==========
  const handleAddRole = async () => {
    if (!newRoleName.trim() || !selectedSchool) return;
    
    const { data, error } = await supabase
      .from('roles')
      .insert([{ name: newRoleName, branch_id: selectedSchool, is_system: false }])
      .select().single();

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } else {
      toast({ title: '✅ Role Created', description: `"${newRoleName}" added successfully` });
      setRoles(prev => [...prev, { ...data, is_system: false }]);
      setNewRoleName('');
      setIsDialogOpen(false);
    }
  };

  const handleDeleteRole = async (roleId) => {
    if (!confirm("Are you sure you want to delete this role? This action cannot be undone.")) return;

    try {
      const { error } = await supabase.rpc('force_delete_role', { p_role_id: roleId });

      if (error) {
        const { error: stdError } = await supabase
          .from('roles')
          .delete()
          .eq('id', roleId);
        if (stdError) throw stdError;
      }

      setRoles(prev => prev.filter(r => r.id !== roleId));
      if (selectedRole?.id === roleId) setSelectedRole(null);
      toast({ title: '🗑️ Role Deleted', description: 'Role has been removed' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  // ========== RENDER ==========
  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-80px)] flex flex-col bg-gradient-to-br from-background via-background to-muted/20">
        {/* ========== HEADER ========== */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-shrink-0 px-6 py-4 border-b bg-card/80 backdrop-blur-sm"
        >
          <div className="flex items-center justify-between">
            {/* Title Section */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <Dna className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Permission DNA
                </h1>
                <p className="text-sm text-muted-foreground">
                  Revolutionary Role-Based Access Control System
                </p>
              </div>
            </div>

            {/* School Selector */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-1.5">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                <Select value={selectedSchool} onValueChange={setSelectedSchool}>
                  <SelectTrigger className="w-[300px] border-0 bg-transparent focus:ring-0">
                    <SelectValue placeholder="Select Organization / School" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[400px]">
                    {schools.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Save Button */}
              {selectedRole && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <Button 
                    onClick={handleSave} 
                    disabled={saving || !hasChanges}
                    className={cn(
                      "relative overflow-hidden",
                      hasChanges 
                        ? "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700" 
                        : ""
                    )}
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    {hasChanges ? 'Save Changes' : 'Saved'}
                    {hasChanges && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full animate-pulse" />
                    )}
                  </Button>
                </motion.div>
              )}
            </div>
          </div>
        </motion.header>

        {/* ========== MAIN CONTENT ========== */}
        <div className="flex-1 flex overflow-hidden">
          {/* ========== LEFT SIDEBAR - ROLES ========== */}
          <motion.aside
            initial={{ width: 320 }}
            animate={{ width: sidebarCollapsed ? 60 : 320 }}
            transition={{ duration: 0.3 }}
            className="flex-shrink-0 border-r bg-card/50 flex flex-col"
          >
            {/* Sidebar Header */}
            <div className="p-4 border-b flex items-center justify-between">
              {!sidebarCollapsed && (
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  <h2 className="font-semibold">Roles</h2>
                  <Badge variant="secondary" className="text-xs">
                    {roles.length}
                  </Badge>
                </div>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              >
                {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </Button>
            </div>

            {/* Roles List */}
            {!sidebarCollapsed && (
              <>
                {/* Add Role Button */}
                <div className="p-4 border-b">
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full" variant="outline">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Custom Role
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New Role</DialogTitle>
                        <DialogDescription>
                          Add a custom role for this school
                        </DialogDescription>
                      </DialogHeader>
                      <div className="py-4">
                        <Label htmlFor="roleName">Role Name</Label>
                        <Input
                          id="roleName"
                          value={newRoleName}
                          onChange={e => setNewRoleName(e.target.value)}
                          placeholder="e.g., Sports Coach"
                          className="mt-2"
                        />
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleAddRole}>
                          <Plus className="w-4 h-4 mr-2" />
                          Create Role
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Roles ScrollArea */}
                <ScrollArea className="flex-1 p-4">
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : roles.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">Select a school to view roles</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {roles.map((role, index) => (
                        <motion.div
                          key={role.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <RoleCard
                            role={role}
                            isSelected={selectedRole?.id === role.id}
                            onClick={() => setSelectedRole(role)}
                            onDelete={handleDeleteRole}
                            permissionCount={
                              selectedRole?.id === role.id ? permissionCount : 0
                            }
                          />
                        </motion.div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </>
            )}
          </motion.aside>

          {/* ========== RIGHT PANEL - PERMISSIONS ========== */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {selectedRole ? (
              <>
                {/* Permission Header */}
                <div className="flex-shrink-0 p-4 border-b bg-card/50 space-y-4">
                  {/* Role Title & Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                          {selectedRole.name}
                          {selectedRole.is_virtual && (
                            <Badge variant="outline" className="text-xs bg-amber-50 text-amber-600 border-amber-200">
                              New - Not Saved
                            </Badge>
                          )}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          {permissionCount} permissions enabled across {modules.length} modules
                        </p>
                      </div>
                    </div>

                    {/* View Toggle */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center rounded-lg border bg-muted/50 p-1">
                        <Button
                          variant={viewMode === 'tree' ? 'secondary' : 'ghost'}
                          size="sm"
                          className="h-7 px-2"
                          onClick={() => setViewMode('tree')}
                        >
                          <List className="w-4 h-4" />
                        </Button>
                        <Button
                          variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                          size="sm"
                          className="h-7 px-2"
                          onClick={() => setViewMode('grid')}
                        >
                          <Grid3X3 className="w-4 h-4" />
                        </Button>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowImpact(!showImpact)}
                        className={cn(showImpact && "bg-primary/10")}
                      >
                        <Info className="w-4 h-4 mr-1" />
                        Impact
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowSidebarPreview(!showSidebarPreview)}
                        className={cn(showSidebarPreview && "bg-emerald-500/10 text-emerald-600")}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Live Preview
                      </Button>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <QuickActions
                    selectedRole={selectedRole}
                    onApplyTemplate={handleApplyTemplate}
                    onSelectAll={handleSelectAll}
                    onDeselectAll={handleDeselectAll}
                    onViewOnly={handleViewOnly}
                    onReset={handleReset}
                    hasChanges={hasChanges}
                  />

                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search modules..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="pl-10 bg-background"
                    />
                  </div>
                </div>

                {/* Permission Content */}
                <div className="flex-1 flex overflow-hidden">
                  {/* Module Tree/Grid */}
                  <ScrollArea className={cn("flex-1 p-4", showImpact && "pr-2")}>
                    {loadingPermissions ? (
                      <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
                          <p className="text-sm text-muted-foreground">Loading permissions...</p>
                        </div>
                      </div>
                    ) : (
                      <ModuleTree
                        modules={modules}
                        permissions={permissions}
                        onPermissionChange={handlePermissionChange}
                        onToggleAll={handleToggleAll}
                        searchQuery={searchQuery}
                      />
                    )}
                  </ScrollArea>

                  {/* Impact Analysis Sidebar */}
                  <AnimatePresence>
                    {showImpact && (
                      <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 300, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="border-l bg-muted/30 p-4 overflow-y-auto"
                      >
                        <ImpactAnalysis
                          roleName={selectedRole?.name}
                          userCount={0}
                          branchCount={1}
                          changedPermissions={changedPermissions}
                          isVisible={true}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* 🎯 Live Sidebar Preview */}
                  <AnimatePresence>
                    {showSidebarPreview && (
                      <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 320, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="border-l bg-card/50 overflow-hidden"
                      >
                        <SidebarPreview
                          roleName={selectedRole?.name}
                          modules={modules}
                          permissions={permissions}
                          isVisible={true}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              /* Empty State */
              <div className="flex-1 flex items-center justify-center">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center max-w-md"
                >
                  <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center">
                    <Dna className="w-12 h-12 text-purple-500" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Permission DNA System</h2>
                  <p className="text-muted-foreground mb-6">
                    {selectedSchool 
                      ? "Select a role from the sidebar to configure its permissions"
                      : "Select an organization and school to get started"
                    }
                  </p>
                  {!selectedSchool && (
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>Revolutionary access control for the next 100 years</span>
                    </div>
                  )}
                </motion.div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PermissionDNA;
