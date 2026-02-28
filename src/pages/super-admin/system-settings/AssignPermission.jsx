import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Save, ArrowLeft, Loader2, Shield, Info, Building2 } from 'lucide-react';
import { getSchoolOwnerModules } from '@/services/schoolOwnerModulesLoader';
import { MODULE_CATALOG } from '@/config/moduleCatalog';
import api from '@/lib/api';

const AssignPermissionSchool = () => {
    const { roleId, roleSlug } = useParams();
    const navigate = useNavigate();
    const basePath = roleSlug || 'super-admin';
    const { toast } = useToast();
    const { user, school } = useAuth();
    const { selectedBranch, loading: branchLoading } = useBranch();
    
    // Use selected branch ID
    const branchId = selectedBranch?.id || school?.id || user?.user_metadata?.branch_id;

    // State
    const [roleData, setRoleData] = useState(null);
    const [modules, setModules] = useState([]);
    const [permissions, setPermissions] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [missingSubscription, setMissingSubscription] = useState(false);

    useEffect(() => {
        if (roleId && branchId) {
            loadData();
        }
    }, [roleId, branchId]);

    const loadData = async () => {
        setLoading(true);
        setMissingSubscription(false);

        // 1. Fetch Role Details
        const { data: role, error: roleError } = await supabase
            .from('roles')
            .select('id, name')
            .eq('id', roleId)
            .single();

        if (roleError || !role) {
            toast({ variant: 'destructive', title: 'Error', description: 'Role not found' });
            setLoading(false);
            return;
        }
        setRoleData(role);

        // 2. Load Modules from School's Subscription Plan
        const allowedModules = await getSchoolOwnerModules(branchId);

        if (!allowedModules || allowedModules.length === 0) {
            setMissingSubscription(true);
            setModules([]);
            setLoading(false);
            return;
        }

        // 3. Fetch ALL modules from module_registry (including sub-modules)
        const { data: allDbModules } = await supabase
            .from('module_registry')
            .select('id, slug, name, parent_slug')
            .eq('is_active', true);

        // Build parent -> children map from DATABASE (not hardcoded MODULE_CATALOG)
        const childrenMap = {};
        allDbModules?.forEach(m => {
            if (m.parent_slug) {
                if (!childrenMap[m.parent_slug]) childrenMap[m.parent_slug] = [];
                childrenMap[m.parent_slug].push({
                    key: m.slug,
                    label: m.name,
                    fullSlug: `${m.parent_slug}.${m.slug}`
                });
            }
        });

        // Structure modules with submodules from DATABASE
        const structuredModules = [];
        const processedSlugs = new Set();

        // ✅ FIX: Deduplicate overlapping modules
        // If 'finance' exists, skip 'income' and 'expenses' (they're submodules of finance)
        // This prevents showing same items 3 times: income, finance(with income/expense), expenses
        const hasFinance = allowedModules.some(m => m.slug === 'finance');
        const skipSlugs = hasFinance ? ['income', 'expenses'] : [];

        allowedModules.forEach(m => {
            const slug = m.slug;
            
            // Skip if this is a duplicate (income/expenses when finance exists)
            if (skipSlugs.includes(slug)) {
                return;
            }
            
            // Try MODULE_CATALOG first for nice display names, fallback to DB name
            const catalogEntry = MODULE_CATALOG[slug];
            const displayName = catalogEntry?.label || m.name;

            if (!processedSlugs.has(slug)) {
                processedSlugs.add(slug);

                structuredModules.push({
                    id: m.id,
                    slug: slug,
                    name: displayName,
                    // Use DATABASE submodules, not hardcoded catalog
                    subModules: childrenMap[slug] || []
                });
            }
        });

        setModules(structuredModules);

        // 4. Load Existing Permissions (MUST filter by branch_id for multi-tenant isolation)
        const { data: existingPerms, error: permError } = await supabase
            .from('role_permissions')
            .select('*')
            .eq('role_id', roleId)
            .eq('branch_id', branchId);  // ✅ FIX: Filter by branch for proper data isolation

        if (permError) {
            console.error('Permission fetch error:', permError);
        }

        const permMap = {};
        if (existingPerms && existingPerms.length > 0) {
            existingPerms.forEach(p => {
                permMap[p.module_slug] = {
                    view: p.can_view,
                    add: p.can_add,
                    edit: p.can_edit,
                    delete: p.can_delete
                };
            });
        }
        // ✅ STRICT MODE: No defaults applied
        // If no permissions saved in database, user sees empty checkboxes
        // They must explicitly assign permissions - matching sidebar behavior 100%

        setPermissions(permMap);
        setLoading(false);
    };

    // ⚠️ DEPRECATED: applyRoleDefaults removed for 100% strict permission logic
    // Sidebar now shows ONLY what's in role_permissions table
    // This function is kept for reference but not called
    const applyRoleDefaults = (roleName, modules, permMap) => {
        // Normalize role name for matching (handle typos like 'Casher' vs 'Cashier')
        const normalizedRoleName = roleName?.toLowerCase().replace(/_/g, ' ').trim();
        
        const roleDefaults = {
            'super admin': {
                modules: 'all',
                permissions: { view: true, add: true, edit: true, delete: true }
            },
            'admin': {
                modules: 'all',
                permissions: { view: true, add: true, edit: true, delete: true }
            },
            'principal': {
                modules: 'all',
                permissions: { view: true, add: true, edit: true, delete: false }
            },
            'vice principal': {
                modules: 'all',
                permissions: { view: true, add: true, edit: true, delete: false }
            },
            'coordinator': {
                modules: ['academics', 'examinations', 'attendance', 'homework', 'student_information', 'communicate', 'behaviour_records', 'reports'],
                permissions: { view: true, add: true, edit: true, delete: false }
            },
            'accountant': {
                modules: ['fees_collection', 'finance', 'reports', 'student_information'],
                permissions: { view: true, add: true, edit: true, delete: true }
            },
            // Cashier - Same as Accountant (for fee collection)
            'cashier': {
                modules: ['fees_collection', 'finance', 'reports', 'student_information'],
                permissions: { view: true, add: true, edit: true, delete: false }
            },
            // Handle typo 'Casher'
            'casher': {
                modules: ['fees_collection', 'finance', 'reports', 'student_information'],
                permissions: { view: true, add: true, edit: true, delete: false }
            },
            'receptionist': {
                modules: ['front_office', 'communicate', 'student_information'],
                permissions: { view: true, add: true, edit: true, delete: false }
            },
            'teacher': {
                modules: ['academics', 'examinations', 'attendance', 'homework', 
                         'communicate', 'library', 'behaviour_records', 'student_information'],
                permissions: { view: true, add: true, edit: true, delete: false }
            },
            'class teacher': {
                modules: ['academics', 'examinations', 'attendance', 'homework', 
                         'communicate', 'library', 'behaviour_records', 'student_information', 'reports'],
                permissions: { view: true, add: true, edit: true, delete: false }
            },
            'subject teacher': {
                modules: ['academics', 'examinations', 'attendance', 'homework', 'communicate'],
                permissions: { view: true, add: true, edit: true, delete: false }
            },
            'librarian': {
                modules: ['library'],
                permissions: { view: true, add: true, edit: true, delete: true }
            },
            'lab assistant': {
                modules: ['academics', 'inventory'],
                permissions: { view: true, add: true, edit: false, delete: false }
            },
            'driver': {
                modules: ['transport'],
                permissions: { view: true, add: false, edit: false, delete: false }
            },
            'hostel warden': {
                modules: ['hostel', 'student_information', 'communicate'],
                permissions: { view: true, add: true, edit: true, delete: false }
            },
            'sports coach': {
                modules: ['sports', 'student_information', 'communicate'],
                permissions: { view: true, add: true, edit: true, delete: false }
            },
            'parent': {
                modules: ['fees_collection', 'attendance', 'examinations', 'homework', 'communicate'],
                permissions: { view: true, add: false, edit: false, delete: false }
            },
            'student': {
                modules: ['fees_collection', 'attendance', 'examinations', 'homework', 
                         'library', 'communicate'],
                permissions: { view: true, add: false, edit: false, delete: false }
            }
        };

        // Use normalized name to find config (handles case and typos)
        const roleConfig = roleDefaults[normalizedRoleName];
        if (!roleConfig) return;

        modules.forEach(m => {
            const hasAccess = roleConfig.modules === 'all' || 
                             roleConfig.modules.includes(m.slug);

            if (hasAccess) {
                permMap[m.slug] = { ...roleConfig.permissions };

                if (m.subModules && m.subModules.length > 0) {
                    m.subModules.forEach(sub => {
                        const subKey = `${m.slug}.${sub.key}`;
                        permMap[subKey] = { ...roleConfig.permissions };
                    });
                }
            }
        });
    };

    const handleCheck = (moduleSlug, action, checked) => {
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
    };

    const handleToggleAll = (module, checked) => {
        setPermissions(prev => {
            const updated = { ...prev };

            updated[module.slug] = {
                view: checked,
                add: checked,
                edit: checked,
                delete: checked
            };

            if (module.subModules && module.subModules.length > 0) {
                module.subModules.forEach(sub => {
                    const subKey = `${module.slug}.${sub.key}`;
                    updated[subKey] = {
                        view: checked,
                        add: checked,
                        edit: checked,
                        delete: checked
                    };
                });
            }

            return updated;
        });
    };

    const handleSave = async () => {
        if (!roleId || !branchId || !roleData) return;
        setSaving(true);

        // Note: Backend now looks up module_id from database based on module_slug
        // No need to fetch module IDs on frontend anymore

        // Apply dependency logic
        const enhancedPermissions = { ...permissions };

        Object.keys(enhancedPermissions).forEach(slug => {
            const perms = enhancedPermissions[slug];
            if (perms.add || perms.edit || perms.delete) {
                perms.view = true;
            }
        });

        // Auto-enable parent modules
        modules.forEach(module => {
            if (module.subModules && module.subModules.length > 0) {
                const hasEnabledSubmodule = module.subModules.some(sub => {
                    const subKey = `${module.slug}.${sub.key}`;
                    return enhancedPermissions[subKey]?.view;
                });

                if (hasEnabledSubmodule) {
                    enhancedPermissions[module.slug] = {
                        view: true,
                        add: enhancedPermissions[module.slug]?.add || false,
                        edit: enhancedPermissions[module.slug]?.edit || false,
                        delete: enhancedPermissions[module.slug]?.delete || false
                    };
                }
            }
        });

        // Prepare insert data - only send module_slug, backend will lookup module_id
        const insertData = [];
        const processedSlugs = new Set();

        modules.forEach(module => {
            const perms = enhancedPermissions[module.slug] || { view: false, add: false, edit: false, delete: false };

            if (perms.view && !processedSlugs.has(module.slug)) {
                processedSlugs.add(module.slug);
                insertData.push({
                    module_slug: module.slug,
                    can_view: perms.view || false,
                    can_add: perms.add || false,
                    can_edit: perms.edit || false,
                    can_delete: perms.delete || false
                });
            }

            // Save Submodules
            if (module.subModules && module.subModules.length > 0) {
                module.subModules.forEach(sub => {
                    const subKey = `${module.slug}.${sub.key}`;
                    const subPerms = enhancedPermissions[subKey] || { view: false, add: false, edit: false, delete: false };

                    if ((subPerms.view || perms.view) && !processedSlugs.has(subKey)) {
                        processedSlugs.add(subKey);
                        insertData.push({
                            module_slug: subKey,
                            can_view: subPerms.view || perms.view || false,
                            can_add: subPerms.add || perms.add || false,
                            can_edit: subPerms.edit || perms.edit || false,
                            can_delete: subPerms.delete || perms.delete || false
                        });
                    }
                });
            }
        });

        // Use backend API to save permissions (bypasses RLS)
        if (insertData.length > 0) {
            try {
                const response = await api.post('/role-permissions/save', {
                    branch_id: branchId,
                    role_id: roleId,
                    role_name: roleData.name,
                    permissions: insertData
                });

                if (response.data.success) {
                    toast({ title: 'Success!', description: response.data.message || 'Permissions saved successfully.' });
                } else {
                    toast({ variant: 'destructive', title: 'Error', description: response.data.message });
                }
            } catch (error) {
                console.error('Permission save error:', error);
                toast({ variant: 'destructive', title: 'Error', description: error.response?.data?.message || error.message });
            }
        } else {
            toast({ title: 'Info', description: 'No permissions to save. Enable at least one module.' });
        }

        setSaving(false);
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </DashboardLayout>
        );
    }

    if (missingSubscription) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center p-10 space-y-4 text-center">
                    <div className="text-destructive text-5xl">⚠️</div>
                    <h2 className="text-2xl font-bold">No Active Subscription</h2>
                    <p className="text-muted-foreground max-w-md">
                        No subscription plan found. Please contact Master Admin to assign a plan.
                    </p>
                    <Button variant="outline" onClick={() => navigate(-1)}>Go Back</Button>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate(`/${basePath}/system-settings/role-permission`)}>
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold flex items-center gap-2">
                                <Shield className="h-6 w-6 text-primary" />
                                Assign Permissions
                            </h1>
                            <p className="text-muted-foreground">
                                Role: <span className="font-semibold text-primary">{roleData?.name?.replace(/_/g, ' ')}</span>
                            </p>
                        </div>
                    </div>
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Permissions
                    </Button>
                </div>

                {/* Info Card */}
                <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                    <CardContent className="pt-4">
                        <div className="flex items-start gap-3">
                            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                            <div>
                                <p className="text-sm text-blue-700 dark:text-blue-300">
                                    Select modules and permissions for this role. Users with this role will only see enabled modules in their sidebar.
                                </p>
                                {selectedBranch && (
                                    <p className="text-sm text-blue-600 dark:text-blue-400 mt-1 flex items-center gap-1">
                                        <Building2 className="h-4 w-4" />
                                        Branch: <strong>{selectedBranch.branch_name || selectedBranch.name}</strong>
                                    </p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Modules Grid */}
                {modules.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center text-muted-foreground">
                            No modules available. Please check your subscription plan.
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-6">
                        {modules.map(module => (
                            <Card key={module.slug}>
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Checkbox
                                                id={`all-${module.slug}`}
                                                checked={
                                                    module.subModules.length > 0
                                                        ? module.subModules.every(sub => {
                                                            const subKey = `${module.slug}.${sub.key}`;
                                                            const p = permissions[subKey];
                                                            return p?.view && p?.add && p?.edit && p?.delete;
                                                        })
                                                        : (permissions[module.slug]?.view &&
                                                           permissions[module.slug]?.add &&
                                                           permissions[module.slug]?.edit &&
                                                           permissions[module.slug]?.delete)
                                                }
                                                onCheckedChange={(c) => handleToggleAll(module, c)}
                                            />
                                            <label htmlFor={`all-${module.slug}`} className="text-lg font-semibold cursor-pointer">
                                                {module.name}
                                            </label>
                                        </div>
                                        <span className="text-xs text-muted-foreground uppercase">Enable All</span>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {module.subModules.length > 0 ? (
                                        <div className="space-y-2">
                                            {/* Header */}
                                            <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-muted-foreground px-2 pb-2 border-b">
                                                <div className="col-span-4 md:col-span-6">Submodule</div>
                                                <div className="col-span-2 md:col-span-1 text-center">View</div>
                                                <div className="col-span-2 md:col-span-1 text-center">Add</div>
                                                <div className="col-span-2 md:col-span-1 text-center">Edit</div>
                                                <div className="col-span-2 md:col-span-1 text-center">Delete</div>
                                            </div>
                                            {/* Rows */}
                                            {module.subModules.map(sub => {
                                                const subKey = `${module.slug}.${sub.key}`;
                                                const p = permissions[subKey] || {};
                                                return (
                                                    <div key={sub.key} className="grid grid-cols-12 gap-2 items-center bg-muted/30 px-2 py-2 rounded border hover:bg-muted/50 transition-colors">
                                                        <div className="col-span-4 md:col-span-6 text-sm font-medium">{sub.label}</div>
                                                        {['view', 'add', 'edit', 'delete'].map(action => (
                                                            <div key={action} className="col-span-2 md:col-span-1 flex justify-center">
                                                                <Checkbox
                                                                    checked={p[action] || false}
                                                                    onCheckedChange={(c) => handleCheck(subKey, action, c)}
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-6 p-3 bg-muted/30 rounded">
                                            <span className="text-sm text-muted-foreground">Module Permissions:</span>
                                            {['view', 'add', 'edit', 'delete'].map(action => (
                                                <div key={action} className="flex items-center gap-2">
                                                    <Checkbox
                                                        checked={permissions[module.slug]?.[action] || false}
                                                        onCheckedChange={(c) => handleCheck(module.slug, action, c)}
                                                    />
                                                    <span className="text-xs uppercase">{action}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default AssignPermissionSchool;
