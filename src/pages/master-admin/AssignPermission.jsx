import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase, isSupabaseReady } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Save, ArrowLeft } from 'lucide-react';
import { getSchoolOwnerModules } from '@/services/schoolOwnerModulesLoader';
import { MODULE_CATALOG } from '@/config/moduleCatalog';

const AssignPermission = () => {
    const { branchId, roleId } = useParams();
    const [searchParams] = useSearchParams();
    const roleName = searchParams.get('name');
    const navigate = useNavigate();
    const { toast } = useToast();

    const [modules, setModules] = useState([]);
    const [permissions, setPermissions] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [missingSubscription, setMissingSubscription] = useState(false);

    useEffect(() => {
        loadData();
    }, [branchId, roleId]);

    const loadData = async () => {
        if (!isSupabaseReady()) {
            toast({
                variant: 'destructive',
                title: 'Configuration Error',
                description: 'Supabase URL is missing. Please check your environment variables.'
            });
            setLoading(false);
            return;
        }

        setLoading(true);
        setMissingSubscription(false);
        
        // 1. Load Modules - Only show modules that are enabled in school's subscription plan
        const allowedModules = await getSchoolOwnerModules(branchId); // Only plan-enabled modules
        
        if (!allowedModules || allowedModules.length === 0) {
            setMissingSubscription(true);
            setModules([]);
            setLoading(false);
            return;
        }
        
        // 2. Structure modules using MODULE_CATALOG (Single Source of Truth)
        const structuredModules = [];
        const processedSlugs = new Set();

        allowedModules.forEach(m => {
            // Normalize slug (handle aliases if any, though DB should be clean now)
            const slug = m.slug;
            
            // Check if this module exists in our Catalog
            const catalogEntry = MODULE_CATALOG[slug];
            
            if (catalogEntry && !processedSlugs.has(slug)) {
                processedSlugs.add(slug);
                
                structuredModules.push({
                    id: m.id, // Keep DB ID if needed
                    slug: slug,
                    name: catalogEntry.label,
                    subModules: catalogEntry.submodules.map(sub => ({
                        key: sub.slug, // This is just the sub-part (e.g. "class_timetable")
                        label: sub.label,
                        fullSlug: `${slug}.${sub.slug}` // Full slug for permission check
                    }))
                });
            } else if (!catalogEntry) {
                console.warn(`Module ${slug} found in plan but not in Catalog. Skipping.`);
            }
        });
        
        setModules(structuredModules);

        // 3. Load Existing Permissions for this Role & School
        // Note: roleId is directly passed from URL as UUID
        // Use roleId directly for fetching permissions instead of querying by roleName
        // This avoids issues with name format mismatches (e.g., 'super_admin' vs 'Super Admin')
        
        console.log('[AssignPermission] Using roleId from URL:', roleId, 'branchId:', branchId, 'roleName (display only):', roleName);
        
        // Fetch existing permissions using role_id directly from URL params
        let existingPerms = [];
        const { data, error: permError } = await supabase
            .from('role_permissions')
            .select('*')
            .eq('role_id', roleId);
        existingPerms = data || [];
        console.log('[AssignPermission] Perms by role_id - COUNT:', existingPerms.length, 'modules:', existingPerms.map(p => p.module_slug).slice(0, 5).join(', '), permError ? 'ERROR: ' + permError.message : '');

        const permMap = {};
        if (existingPerms && existingPerms.length > 0) {
            existingPerms.forEach(p => {
                permMap[`${p.module_slug}`] = {
                    view: p.can_view,
                    add: p.can_add,
                    edit: p.can_edit,
                    delete: p.can_delete
                };
            });
        } else {
            // Apply Defaults if no existing permissions
            // This applies for all roles including School Owner
            applyRoleDefaults(roleName, structuredModules, permMap);
        }
        
        setPermissions(permMap);
        setLoading(false);
    };

    const applyRoleDefaults = (role, modules, permMap) => {
        // Comprehensive default permissions for each role
        const roleDefaults = {
            'School Owner': {
                // Full access to everything
                modules: 'all',
                permissions: { view: true, add: true, edit: true, delete: true }
            },
            'Admin': {
                // Almost full access except some system settings
                modules: ['front_office', 'student_information', 'fees_collection', 'finance', 
                         'attendance', 'examinations', 'academics', 'human_resource', 
                         'communicate', 'library', 'inventory', 'transport', 'hostel', 
                         'certificate', 'reports', 'front_cms'],
                permissions: { view: true, add: true, edit: true, delete: true }
            },
            'Principal': {
                // View all, manage academics and staff
                modules: ['front_office', 'student_information', 'fees_collection', 'finance',
                         'attendance', 'examinations', 'academics', 'human_resource',
                         'communicate', 'library', 'reports', 'front_cms'],
                permissions: { view: true, add: true, edit: true, delete: false }
            },
            'Accountant': {
                // Full access to finance-related modules only
                modules: ['fees_collection', 'finance', 'reports'],
                permissions: { view: true, add: true, edit: true, delete: true }
            },
            'Receptionist': {
                // Front office and communication
                modules: ['front_office', 'communicate', 'student_information'],
                permissions: { view: true, add: true, edit: true, delete: false }
            },
            'Teacher': {
                // Academic-related access
                modules: ['academics', 'examinations', 'attendance', 'homework', 
                         'communicate', 'library', 'behaviour_records'],
                permissions: { view: true, add: true, edit: true, delete: false }
            },
            'Librarian': {
                // Library management only
                modules: ['library'],
                permissions: { view: true, add: true, edit: true, delete: true }
            },
            'Parent': {
                // View only for child-related info
                modules: ['fees_collection', 'attendance', 'examinations', 'homework', 'communicate'],
                permissions: { view: true, add: false, edit: false, delete: false }
            },
            'Student': {
                // View only for own info
                modules: ['fees_collection', 'attendance', 'examinations', 'homework', 
                         'library', 'communicate'],
                permissions: { view: true, add: false, edit: false, delete: false }
            }
        };

        const roleConfig = roleDefaults[role];
        if (!roleConfig) return;

        modules.forEach(m => {
            // Check if role has access to this module
            const hasAccess = roleConfig.modules === 'all' || 
                             roleConfig.modules.includes(m.slug);
            
            if (hasAccess) {
                // Set module permissions
                permMap[m.slug] = { ...roleConfig.permissions };
                
                // Also set submodule permissions
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

            // Logic: View is required for any other action
            if (checked && (action === 'add' || action === 'edit' || action === 'delete')) {
                newPerms.view = true;
            }

            // Logic: Unchecking View unchecks everything
            if (!checked && action === 'view') {
                newPerms.add = false;
                newPerms.edit = false;
                newPerms.delete = false;
            }

            return {
                ...prev,
                [moduleSlug]: newPerms
            };
        });
    };

    const handleToggleAll = (module, checked) => {
        setPermissions(prev => {
            const updated = { ...prev };
            
            // Set main module permissions
            updated[module.slug] = {
                view: checked,
                add: checked,
                edit: checked,
                delete: checked
            };
            
            // Set all submodule permissions
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
        setSaving(true);
        
        // Step 0: Use roleId directly from URL params (already a valid UUID)
        // We need to fetch the actual role name from DB for role_name column
        const { data: roleData, error: roleError } = await supabase
            .from('roles')
            .select('id, name')
            .eq('id', roleId)
            .single();
        
        if (roleError || !roleData) {
            toast({ variant: 'destructive', title: 'Error', description: 'Role not found. Please create the role first.' });
            setSaving(false);
            return;
        }
        
        const actualRoleId = roleData.id;
        const actualRoleName = roleData.name; // Use the actual name from DB (e.g., 'super_admin')
        
        // Step 0.5: Fetch all module IDs from module_registry for slug -> module_id mapping
        const { data: allModules } = await supabase
            .from('module_registry')
            .select('id, slug')
            .eq('is_active', true);
        
        const moduleIdMap = {};
        if (allModules) {
            allModules.forEach(m => { moduleIdMap[m.slug] = m.id; });
        }
        
        // Step 1: Apply sub-module dependency logic
        // If Add/Edit/Delete enabled † can_view must be true
        const enhancedPermissions = { ...permissions };
        
        Object.keys(enhancedPermissions).forEach(slug => {
            const perms = enhancedPermissions[slug];
            
            // If any action (add/edit/delete) is enabled, ensure view is enabled
            if (perms.add || perms.edit || perms.delete) {
                perms.view = true;
            }
        });
        
        // Step 2: Auto-enable parent modules if any submodule is enabled
        modules.forEach(module => {
            if (module.subModules && module.subModules.length > 0) {
                // Check if any submodule has view enabled
                const hasEnabledSubmodule = module.subModules.some(sub => {
                    const subKey = `${module.slug}.${sub.key}`;
                    return enhancedPermissions[subKey]?.view;
                });
                
                // If yes, ensure parent module has view enabled
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
        
        // Step 3: Delete existing permissions for this role to avoid duplicates
        // Delete by role_id which is the most reliable identifier
        const { error: deleteError } = await supabase
            .from('role_permissions')
            .delete()
            .eq('role_id', actualRoleId);
        
        if (deleteError) {
            console.error('Delete error:', deleteError);
            toast({ variant: 'destructive', title: 'Error clearing old permissions', description: deleteError.message });
            setSaving(false);
            return;
        }
        
        // Step 4: Prepare insert data with role_id and module_id
        const insertData = [];
        const processedInsertSlugs = new Set();
        
        modules.forEach(module => {
            const perms = enhancedPermissions[module.slug] || { view: false, add: false, edit: false, delete: false };
            const moduleId = moduleIdMap[module.slug] || module.id;
            
            // Only insert if at least view is true (or we want to track explicit denies)
            // For sidebar logic to work, we need to insert entries with view=true
            if (perms.view && moduleId && !processedInsertSlugs.has(module.slug)) {
                processedInsertSlugs.add(module.slug);
                insertData.push({
                    role_id: actualRoleId,
                    module_id: moduleId,
                    branch_id: branchId,
                    role_name: actualRoleName, // Use the actual name from DB
                    module_slug: module.slug,
                    can_view: perms.view || false,
                    can_add: perms.add || false,
                    can_edit: perms.edit || false,
                    can_delete: perms.delete || false
                });
            }

            // Save Submodules - needed for granular sidebar visibility
            if (module.subModules && module.subModules.length > 0) {
                module.subModules.forEach(sub => {
                    const subKey = `${module.slug}.${sub.key}`;
                    const subPerms = enhancedPermissions[subKey] || { view: false, add: false, edit: false, delete: false };
                    const subModuleId = moduleIdMap[subKey];
                    
                    // If submodule has view permission, save it
                    // Also save if parent module view is enabled (inherit parent permission)
                    if ((subPerms.view || perms.view) && subModuleId && !processedInsertSlugs.has(subKey)) {
                        processedInsertSlugs.add(subKey);
                        insertData.push({
                            role_id: actualRoleId,
                            module_id: subModuleId,
                            branch_id: branchId,
                            role_name: actualRoleName, // Use the actual name from DB
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

        // Step 5: Insert new permissions (delete + insert approach avoids constraint issues)
        const { error } = await supabase
            .from('role_permissions')
            .insert(insertData);

        if (error) {
            console.error('Permission save error:', error);
            toast({ variant: 'destructive', title: 'Error saving permissions', description: error.message });
        } else {
            toast({ title: 'Success', description: 'Permissions updated successfully. Changes will reflect on next login/refresh.' });
        }
        setSaving(false);
    };

    const handleFixSubscription = async () => {
        setSaving(true);
        try {
            // Fetch a valid plan dynamically instead of hardcoding
            const { data: plan, error: planError } = await supabase
                .from('subscription_plans')
                .select('id')
                .limit(1)
                .single();

            if (planError || !plan) {
                throw new Error('No subscription plans found in the system. Please create a plan first.');
            }
            
            const { error } = await supabase
                .from('school_subscriptions')
                .insert({
                    branch_id: branchId,
                    plan_id: plan.id,
                    status: 'active',
                    start_date: new Date().toISOString(),
                    auto_renew: true,
                    billing_type: 'Prepaid',
                    total_amount: 0
                });

            if (error) throw error;

            toast({ title: 'Success', description: 'Default subscription initialized. Reloading...' });
            setTimeout(() => loadData(), 1000);
        } catch (err) {
            console.error(err);
            toast({ variant: 'destructive', title: 'Fix Failed', description: err.message });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <DashboardLayout><div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div></DashboardLayout>;

    if (missingSubscription) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center p-10 space-y-4 text-center">
                    <div className="text-destructive text-5xl"> ï¸</div>
                    <h2 className="text-2xl font-bold">No Active Subscription Found</h2>
                    <p className="text-muted-foreground max-w-md">
                        This school does not have an active subscription plan, so no modules can be loaded.
                        This usually happens if the school creation process was interrupted.
                    </p>
                    <Button onClick={handleFixSubscription} disabled={saving}>
                        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Initialize Default Subscription
                    </Button>
                    <Button variant="outline" onClick={() => navigate(-1)}>Go Back</Button>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center gap-4 mb-6">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/master-admin/role-permission')}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">Assign Permissions</h1>
                        <p className="text-muted-foreground">Role: <span className="font-semibold text-primary">{roleName}</span></p>
                    </div>
                </div>

                <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
                    <div className="p-4 bg-muted/50 border-b flex justify-between items-center">
                        <h3 className="font-semibold">Module Permissions</h3>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Save Permissions
                        </Button>
                    </div>
                    
                    <div className="p-6 space-y-8">
                        {modules.map(module => (
                            <div key={module.id} className="border rounded-lg p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <Checkbox 
                                            id={`all-${module.slug}`}
                                            checked={
                                                // Check if all submodules are enabled
                                                module.subModules.length > 0 
                                                ? module.subModules.every(sub => {
                                                    const subKey = `${module.slug}.${sub.key}`;
                                                    return permissions[subKey]?.view && 
                                                           permissions[subKey]?.add && 
                                                           permissions[subKey]?.edit && 
                                                           permissions[subKey]?.delete;
                                                })
                                                : (permissions[module.slug]?.view && 
                                                   permissions[module.slug]?.add && 
                                                   permissions[module.slug]?.edit && 
                                                   permissions[module.slug]?.delete)
                                            }
                                            onCheckedChange={(c) => handleToggleAll(module, c)}
                                        />
                                        <label htmlFor={`all-${module.slug}`} className="text-lg font-semibold cursor-pointer select-none">
                                            {module.name}
                                        </label>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        Enable All
                                    </div>
                                </div>

                                {module.subModules.length > 0 && (
                                    <div className="ml-8 mt-4 space-y-2">
                                        <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-muted-foreground mb-2 px-2">
                                            <div className="col-span-6">Submodule</div>
                                            <div className="col-span-1 text-center">View</div>
                                            <div className="col-span-1 text-center">Add</div>
                                            <div className="col-span-1 text-center">Edit</div>
                                            <div className="col-span-1 text-center">Delete</div>
                                        </div>
                                        {module.subModules.map(sub => {
                                            const subKey = `${module.slug}.${sub.key}`;
                                            return (
                                                <div key={sub.key} className="grid grid-cols-12 gap-2 items-center bg-muted/30 px-2 py-2 rounded border hover:bg-muted/50 transition-colors">
                                                    <div className="col-span-6 text-sm">{sub.label}</div>
                                                    {['view', 'add', 'edit', 'delete'].map(action => (
                                                        <div key={action} className="col-span-1 flex justify-center">
                                                            <Checkbox 
                                                                id={`${subKey}-${action}`}
                                                                checked={permissions[subKey]?.[action] || false}
                                                                onCheckedChange={(c) => handleCheck(subKey, action, c)}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default AssignPermission;
