import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { 
    Loader2, Shield, Plus, Trash2, Edit, Save, X, ChevronDown, ChevronRight, 
    AlertCircle, Building, Briefcase 
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { motion, AnimatePresence } from 'framer-motion';
import { planModuleService } from '@/services/planModuleService'; // New Service
import { schoolModuleMap } from '@/lib/schoolModules';

const RolePermissionMaster = () => {
    const { toast } = useToast();
    
    // Master State - Now works with Organizations
    const [organizations, setOrganizations] = useState([]);
    const [selectedOrganizationId, setSelectedOrganizationId] = useState(null);
    const [primaryBranchId, setPrimaryBranchId] = useState(null);
    const [organizationPlanId, setOrganizationPlanId] = useState(null);
    
    // Role & Permission State
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeView, setActiveView] = useState('list'); // 'list', 'add', 'edit', 'permission'
    const [selectedRole, setSelectedRole] = useState(null);
    const [formData, setFormData] = useState({ name: '', description: '', is_active: true });
    const [permissions, setPermissions] = useState({});
    const [availableModules, setAvailableModules] = useState([]);
    const [openModules, setOpenModules] = useState({});
    const [permLoading, setPermLoading] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [roleToDelete, setRoleToDelete] = useState(null);

    // 1. Fetch Organizations on Mount
    useEffect(() => {
        const fetchOrganizations = async () => {
            setLoading(true);
            // Fetch both name and org_name columns (handle legacy schema)
            const { data, error } = await supabase
                .from('organizations')
                .select('id, name, org_name, code, org_code, plan_id')
                .order('created_at', { ascending: false }); // Order by created_at instead of name (name might be null)
            
            if (error) {
                toast({ variant: 'destructive', title: 'Error fetching organizations', description: error.message });
                console.error('Error fetching organizations:', error);
            } else {
                // Normalize data: use name if available, fallback to org_name
                const normalizedOrgs = (data || []).map(org => ({
                    id: org.id,
                    name: org.name || org.org_name || 'Unnamed Organization',
                    code: org.code || org.org_code || '',
                    plan_id: org.plan_id
                }));
                setOrganizations(normalizedOrgs);
                console.log('[RolePermissionMaster] Fetched organizations:', normalizedOrgs.length, normalizedOrgs);
            }
            setLoading(false);
        };
        fetchOrganizations();
    }, [toast]);

    // 2. Fetch Primary Branch and Roles when Organization is Selected
    useEffect(() => {
        const fetchOrganizationData = async () => {
            if (!selectedOrganizationId) {
                setRoles([]);
                setPrimaryBranchId(null);
                setOrganizationPlanId(null);
                return;
            }
            setLoading(true);
            
            try {
                // Get organization details (including plan_id) - handle both name and org_name
                const { data: orgData, error: orgError } = await supabase
                    .from('organizations')
                    .select('id, name, org_name, plan_id')
                    .eq('id', selectedOrganizationId)
                    .single();

                if (orgError) throw orgError;
                
                // Normalize organization name (handle both name and org_name)
                const orgName = orgData.name || orgData.org_name || 'Unnamed Organization';
                console.log('[RolePermissionMaster] Selected organization:', orgName, 'Plan ID:', orgData.plan_id);
                
                setOrganizationPlanId(orgData.plan_id);

                // Get primary branch (is_primary = true)
                const { data: branchData, error: branchError } = await supabase
                    .from('schools')
                    .select('id')
                    .eq('organization_id', selectedOrganizationId)
                    .eq('is_primary', true)
                    .maybeSingle();

                if (branchError) throw branchError;

                if (!branchData) {
                    toast({ variant: 'destructive', title: 'Error', description: 'Primary branch not found for this organization' });
                    setLoading(false);
                    return;
                }

                setPrimaryBranchId(branchData.id);

                // Fetch system roles from primary branch (STRICT NAMES)
                const { data: rolesData, error: rolesError } = await supabase
                    .from('roles')
                    .select('*')
                    .eq('branch_id', branchData.id)
                    .in('name', ['School Owner', 'Admin', 'Principal', 'Staff'])
                    .order('name');

                if (rolesError) throw rolesError;
                
                setRoles(rolesData || []);

            } catch (error) {
                console.error('Error fetching organization data:', error);
                toast({ variant: 'destructive', title: 'Failed to fetch organization data', description: error.message });
            } finally {
                setLoading(false);
            }
        };
        fetchOrganizationData();
    }, [selectedOrganizationId, toast]);

    const fetchPermissionsAndModules = async (roleId) => {
        if (!selectedOrganizationId || !organizationPlanId) {
            toast({ variant: 'destructive', title: 'Error', description: 'Organization or plan not selected' });
            return;
        }
        setPermLoading(true);
        
        try {
            // 3. Fetch Modules from Organization's Subscription Plan
            // CRITICAL: Only show modules enabled in the selected subscription plan
            let modulesList = [];
            if (organizationPlanId) {
                // Use planModuleService to get dynamic module list from table
                const modules = await planModuleService.getModulesForPlan(organizationPlanId);
                modulesList = modules || [];
                
                if (modulesList.length === 0) {
                    toast({ variant: 'destructive', title: 'Warning', description: 'No modules found for this subscription plan' });
                }
            } else {
                toast({ variant: 'destructive', title: 'Error', description: 'Organization does not have a subscription plan assigned' });
                setPermLoading(false);
                return;
            }
            
            setAvailableModules(modulesList);
            
            // Open all modules by default
            const initialOpenState = {};
            modulesList.forEach(m => initialOpenState[m.slug] = true);
            setOpenModules(initialOpenState);

            // 4. Fetch Existing Permissions for this role
            const { data: permData, error: permError } = await supabase
                .from('permissions')
                .select('*')
                .eq('role_id', roleId);

            if (permError) throw permError;

            const perms = {};
            
            // Map existing permissions
            permData.forEach(p => {
                perms[p.module] = {
                    can_view: p.can_view,
                    can_add: p.can_add,
                    can_edit: p.can_edit,
                    can_delete: p.can_delete
                };
            });

            // Ensure all available modules and sub-modules have an entry
            modulesList.forEach(mod => {
                // Check if this module has sub-modules in schoolModuleMap
                const mappedModule = schoolModuleMap[mod.slug.replace(/-/g, '_')];
                
                if (mappedModule && mappedModule.subModules) {
                    Object.keys(mappedModule.subModules).forEach(subKey => {
                        const fullKey = `${mod.slug}.${subKey}`;
                        if (!perms[fullKey]) {
                            perms[fullKey] = { can_view: false, can_add: false, can_edit: false, can_delete: false };
                        }
                    });
                } else {
                    // Fallback for modules without sub-modules
                    if (!perms[mod.slug]) {
                        perms[mod.slug] = { can_view: false, can_add: false, can_edit: false, can_delete: false };
                    }
                }
            });

            setPermissions(perms);

        } catch (error) {
            console.error("Error fetching permissions:", error);
            toast({ variant: 'destructive', title: 'Failed to fetch permissions' });
        } finally {
            setPermLoading(false);
        }
    };

    // --- UI Actions ---

    const handleOrganizationSelect = (value) => {
        setSelectedOrganizationId(value);
        setActiveView('list');
        setSelectedRole(null);
    };

    const handleAddClick = () => {
        setFormData({ name: '', description: '', is_active: true });
        setActiveView('add');
        setSelectedRole(null);
    };

    const handleEditClick = (role) => {
        setFormData({ 
            name: role.name,
            description: role.description || '',
            is_active: role.is_active !== false 
        });
        setSelectedRole(role);
        setActiveView('edit');
    };

    const handleAssignPermissionClick = (role) => {
        setSelectedRole(role);
        setActiveView('permission');
        fetchPermissionsAndModules(role.id);
    };

    const handleCancel = () => {
        setActiveView('list');
        setSelectedRole(null);
    };

    const refetchRoles = async () => {
        if (!primaryBranchId) return;
        const { data } = await supabase
            .from('roles')
            .select('*')
            .eq('branch_id', primaryBranchId)
            .in('name', ['ORGANIZATION_OWNER', 'ORGANIZATION_ADMIN', 'BRANCH_PRINCIPAL', 'STAFF'])
            .order('name');
        if(data) setRoles(data);
    };

    // --- DB Operations ---

    const handleSaveRole = async () => {
        if (!primaryBranchId) {
             toast({ variant: 'destructive', title: 'No organization/branch selected' });
             return;
        }
        if (!formData.name.trim()) {
            toast({ variant: 'destructive', title: 'Validation Error', description: 'Role name is required.' });
            return;
        }

        setLoading(true);
        
        if (activeView === 'add') {
            const { error } = await supabase.from('roles').insert([{
                name: formData.name.trim(),
                description: formData.description,
                branch_id: primaryBranchId,
                is_system_role: false,
                is_active: formData.is_active
            }]);

            if (error) {
                toast({ variant: 'destructive', title: 'Error creating role', description: error.message });
            } else {
                toast({ title: 'Success', description: 'Role created successfully.' });
                refetchRoles();
                handleCancel();
            }
        } else if (activeView === 'edit' && selectedRole) {
            const { error } = await supabase.from('roles').update({
                name: formData.name.trim(),
                description: formData.description,
                is_active: formData.is_active
            }).eq('id', selectedRole.id);

            if (error) {
                toast({ variant: 'destructive', title: 'Error updating role', description: error.message });
            } else {
                toast({ title: 'Success', description: 'Role updated successfully.' });
                refetchRoles();
                handleCancel();
            }
        }
        setLoading(false);
    };

    const handleDeleteConfirm = async () => {
        if (!roleToDelete) return;
        
        const { error } = await supabase.from('roles').delete().eq('id', roleToDelete.id);

        if (error) {
            toast({ variant: 'destructive', title: 'Error deleting role', description: error.message });
        } else {
            toast({ title: 'Success', description: 'Role deleted successfully.' });
            refetchRoles();
        }
        setDeleteDialogOpen(false);
        setRoleToDelete(null);
    };

    const handleSavePermissions = async () => {
        if (!selectedRole) return;
        
        // CRITICAL: Only ORGANIZATION_OWNER can be assigned permissions initially
        if (selectedRole.name !== 'ORGANIZATION_OWNER') {
            toast({ 
                variant: 'destructive', 
                title: 'Permission Denied', 
                description: 'Only ORGANIZATION_OWNER role can be assigned permissions initially. Other roles must remain disabled.' 
            });
            return;
        }
        
        setLoading(true);
        
        const upsertData = Object.keys(permissions).map(permKey => ({
            role_id: selectedRole.id,
            module: permKey, // Slug
            ...permissions[permKey]
        }));
        
        if (upsertData.length > 0) {
            const { error } = await supabase.from('permissions').upsert(upsertData, { onConflict: 'role_id, module' });
            if (error) {
                toast({ variant: 'destructive', title: 'Failed to save permissions', description: error.message });
            } else {
                toast({ title: 'Success!', description: 'Permissions updated successfully for ORGANIZATION_OWNER.' });
                handleCancel();
            }
        } else {
            toast({ title: 'No changes', description: 'No permissions to update.' });
            handleCancel();
        }
        setLoading(false);
    };

    // --- Permission Checkbox Logic ---

    const toggleModule = (moduleSlug) => {
        setOpenModules(prev => ({ ...prev, [moduleSlug]: !prev[moduleSlug] }));
    };

    const handlePermissionChange = (moduleSlug, action, value) => {
        setPermissions(prev => {
            const newPerms = { ...prev };
            const currentPerm = { ...newPerms[moduleSlug] };
            currentPerm[action] = value;
            // Auto-enable View if any other action is enabled
            if (action !== 'can_view' && value) currentPerm.can_view = true;
            // Auto-disable actions if View is disabled
            if (action === 'can_view' && !value) {
                currentPerm.can_add = false;
                currentPerm.can_edit = false;
                currentPerm.can_delete = false;
            }
            newPerms[moduleSlug] = currentPerm;
            return newPerms;
        });
    };

    const handleEnableAll = (moduleSlug, checked) => {
        setPermissions(prev => {
            const newPerms = { ...prev };
            newPerms[moduleSlug] = {
                can_view: checked,
                can_add: checked,
                can_edit: checked,
                can_delete: checked
            };
            return newPerms;
        });
    };

    const handleMainEnableAll = (moduleSlug, subModules, checked) => {
        setPermissions(prev => {
            const newPerms = { ...prev };
            Object.keys(subModules).forEach(subKey => {
                const fullKey = `${moduleSlug}.${subKey}`;
                newPerms[fullKey] = {
                    can_view: checked,
                    can_add: checked,
                    can_edit: checked,
                    can_delete: checked
                };
            });
            return newPerms;
        });
    };
    
    // Group modules by category for display
    const groupedModules = availableModules.reduce((acc, mod) => {
        const cat = mod.category || 'Other';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(mod);
        return acc;
    }, {});

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Role & Permissions</h1>
                        <p className="text-sm text-muted-foreground mt-1">Manage roles for specific schools.</p>
                    </div>
                    {/* Add Button disabled - System roles are created during approval */}
                    {selectedOrganizationId && activeView === 'list' && (
                        <Button onClick={handleAddClick} className="shadow-sm" disabled title="System roles are created automatically during approval">
                            <Plus className="mr-2 h-4 w-4" /> Add New Role (Disabled)
                        </Button>
                    )}
                </div>

                {/* School Selection Card */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border shadow-sm">
                    <div className="max-w-md">
                        <Label className="mb-2 block text-base font-semibold">Select Organization to Manage Roles</Label>
                        <Select value={selectedOrganizationId} onValueChange={handleOrganizationSelect}>
                            <SelectTrigger className="h-11">
                                <SelectValue placeholder="Choose an organization..." />
                            </SelectTrigger>
                            <SelectContent>
                                {organizations.length === 0 ? (
                                    <SelectItem value="no-orgs" disabled>No organizations found</SelectItem>
                                ) : (
                                    organizations.map(org => (
                                        <SelectItem key={org.id} value={org.id}>
                                            {org.name || 'Unnamed Organization'} {org.plan_id ? '(Plan: ' + org.plan_id.substring(0, 8) + '...)' : '(No Plan)'}
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {!selectedOrganizationId && (
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground bg-muted/10 rounded-xl border border-dashed">
                        <Building className="h-12 w-12 mb-4 opacity-50" />
                        <p className="text-lg">Please select an organization above to view its roles.</p>
                    </div>
                )}

                {/* LIST VIEW */}
                {selectedOrganizationId && activeView === 'list' && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        className="bg-white dark:bg-gray-800 rounded-xl border shadow-sm overflow-hidden"
                    >
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50 dark:bg-gray-900/50">
                                    <TableHead className="w-[250px]">Role Name</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-32 text-center">
                                            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                                        </TableCell>
                                    </TableRow>
                                ) : roles.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                                            No system roles found for this organization. System roles should be created during approval.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    roles.map((role) => {
                                        // CRITICAL: Only School Owner can be assigned permissions initially
                                        const canAssignPermissions = role.name === 'School Owner';
                                        
                                        return (
                                            <TableRow key={role.id} className="group hover:bg-gray-50">
                                                <TableCell className="font-medium text-base capitalize">
                                                    {role.name.replace(/_/g, ' ')}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground max-w-[200px] truncate">
                                                    {role.description || '-'}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary">System Role</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {role.is_active !== false ? 
                                                        <Badge className="bg-green-600 hover:bg-green-700">Active</Badge> : 
                                                        <Badge variant="destructive">Inactive</Badge>
                                                    }
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end items-center gap-2">
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm" 
                                                            onClick={() => handleAssignPermissionClick(role)} 
                                                            className="h-8"
                                                            disabled={!canAssignPermissions}
                                                            title={!canAssignPermissions ? 'Only School Owner can be assigned permissions initially' : 'Assign Permissions'}
                                                        >
                                                            <Shield className="mr-2 h-3.5 w-3.5 text-purple-500" />
                                                            Permissions
                                                        </Button>
                                                        {!canAssignPermissions && (
                                                            <Badge variant="outline" className="text-xs">
                                                                Disabled
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </motion.div>
                )}

                {/* ADD / EDIT ROLE VIEW - DISABLED FOR SYSTEM ROLES */}
                {selectedOrganizationId && (activeView === 'add' || activeView === 'edit') && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }} 
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-2xl mx-auto"
                    >
                        <div className="bg-white dark:bg-gray-800 rounded-xl border shadow-sm p-6 md:p-8">
                            <div className="flex items-center justify-between mb-6 border-b pb-4">
                                <h2 className="text-xl font-bold flex items-center">
                                    {activeView === 'add' ? <Plus className="mr-2 h-5 w-5 text-primary" /> : <Edit className="mr-2 h-5 w-5 text-primary" />}
                                    {activeView === 'add' ? 'Create New Role' : 'Edit Role'}
                                </h2>
                                <Button variant="ghost" size="sm" onClick={handleCancel}><X className="h-4 w-4" /></Button>
                            </div>
                            
                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <Label htmlFor="roleName">Role Name <span className="text-red-500">*</span></Label>
                                    <Input 
                                        id="roleName" 
                                        placeholder="e.g. Assistant Teacher" 
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="roleDesc">Description</Label>
                                    <Textarea 
                                        id="roleDesc" 
                                        placeholder="Describe this role..." 
                                        value={formData.description}
                                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                                        rows={3}
                                    />
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Switch 
                                        id="roleStatus" 
                                        checked={formData.is_active}
                                        onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
                                    />
                                    <Label htmlFor="roleStatus">Active Status</Label>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-8 pt-4 border-t">
                                <Button variant="outline" onClick={handleCancel}>Cancel</Button>
                                <Button onClick={handleSaveRole} disabled={loading}>
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {activeView === 'add' ? 'Create Role' : 'Update Role'}
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* PERMISSIONS VIEW - DYNAMIC MATRIX */}
                {selectedOrganizationId && activeView === 'permission' && selectedRole && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.98 }} 
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-4"
                    >
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-gray-800 p-4 rounded-xl border shadow-sm mb-4">
                             <div>
                                <h2 className="text-xl font-bold flex items-center">
                                    <Briefcase className="mr-2 h-5 w-5 text-purple-600" />
                                    Assign Permissions: <span className="text-primary ml-2 capitalize">{selectedRole.name.replace(/_/g, ' ')}</span>
                                </h2>
                                <p className="text-sm text-muted-foreground mt-1 ml-7">
                                    Configure access for modules enabled in this organization's subscription plan.
                                    {selectedRole.name !== 'School Owner' && (
                                        <span className="block text-amber-600 mt-1">
                                             ï¸ Only School Owner can be assigned permissions initially.
                                        </span>
                                    )}
                                </p>
                             </div>
                             <div className="flex gap-2 mt-4 md:mt-0">
                                 <Button variant="outline" onClick={handleCancel}>Cancel</Button>
                                 <Button onClick={handleSavePermissions} disabled={loading || permLoading}>
                                     {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                     Save Permissions
                                 </Button>
                             </div>
                        </div>

                        {permLoading ? (
                            <div className="flex justify-center items-center h-64 bg-white dark:bg-gray-800 rounded-xl border shadow-sm">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[800px] text-sm text-left">
                                        <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-900/50 border-b">
                                            <tr>
                                                <th className="px-6 py-4 w-1/3 font-medium">Module</th>
                                                <th className="px-6 py-4 text-center w-24 font-medium">View</th>
                                                <th className="px-6 py-4 text-center w-24 font-medium">Add</th>
                                                <th className="px-6 py-4 text-center w-24 font-medium">Edit</th>
                                                <th className="px-6 py-4 text-center w-24 font-medium">Delete</th>
                                                <th className="px-6 py-4 text-center w-24 font-medium">Enable All</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                            {Object.keys(groupedModules).length > 0 ? Object.entries(groupedModules).map(([category, mods]) => (
                                                <React.Fragment key={category}>
                                                    {/* Category Header */}
                                                    <tr className="bg-muted/20">
                                                        <td colSpan={6} className="px-6 py-2 font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                                                            {category.replace(/_/g, ' ')}
                                                        </td>
                                                    </tr>
                                                    {/* Modules in Category */}
                                                    {mods.map(mod => {
                                                        const mappedModule = schoolModuleMap[mod.slug.replace(/-/g, '_')];
                                                        const hasSubModules = mappedModule && mappedModule.subModules;
                                                        const isModuleOpen = openModules[mod.slug];

                                                        return (
                                                            <React.Fragment key={mod.slug}>
                                                                {/* Main Module Row */}
                                                                <tr className="hover:bg-gray-50 bg-gray-50/50">
                                                                    <td className="px-6 py-3 font-medium flex items-center gap-2">
                                                                        {hasSubModules && (
                                                                            <button onClick={() => toggleModule(mod.slug)} className="p-1 hover:bg-gray-200 rounded">
                                                                                {isModuleOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                                                            </button>
                                                                        )}
                                                                        {mod.name}
                                                                    </td>
                                                                    <td colSpan={4}></td>
                                                                    <td className="px-6 py-3 text-center">
                                                                        {hasSubModules && (
                                                                            <div className="flex justify-center">
                                                                                <Checkbox 
                                                                                    onCheckedChange={(c) => handleMainEnableAll(mod.slug, mappedModule.subModules, c)} 
                                                                                />
                                                                            </div>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                                
                                                                {/* Sub Modules */}
                                                                {hasSubModules && isModuleOpen && Object.entries(mappedModule.subModules).map(([subKey, subName]) => {
                                                                    const fullKey = `${mod.slug}.${subKey}`;
                                                                    const isViewChecked = permissions[fullKey]?.can_view || false;
                                                                    const isAllChecked = isViewChecked && permissions[fullKey]?.can_add && permissions[fullKey]?.can_edit && permissions[fullKey]?.can_delete;
                                                                    
                                                                    return (
                                                                        <tr key={fullKey} className="hover:bg-gray-50">
                                                                            <td className="px-6 py-3 pl-12 text-sm text-gray-600">{subName}</td>
                                                                            <td className="px-6 py-3 text-center">
                                                                                <div className="flex justify-center">
                                                                                    <Checkbox 
                                                                                        checked={isViewChecked} 
                                                                                        onCheckedChange={(c) => handlePermissionChange(fullKey, 'can_view', c)} 
                                                                                    />
                                                                                </div>
                                                                            </td>
                                                                            <td className="px-6 py-3 text-center">
                                                                                <div className="flex justify-center">
                                                                                    <Checkbox 
                                                                                        checked={permissions[fullKey]?.can_add || false} 
                                                                                        onCheckedChange={(c) => handlePermissionChange(fullKey, 'can_add', c)} 
                                                                                        disabled={!isViewChecked} 
                                                                                    />
                                                                                </div>
                                                                            </td>
                                                                            <td className="px-6 py-3 text-center">
                                                                                <div className="flex justify-center">
                                                                                    <Checkbox 
                                                                                        checked={permissions[fullKey]?.can_edit || false} 
                                                                                        onCheckedChange={(c) => handlePermissionChange(fullKey, 'can_edit', c)} 
                                                                                        disabled={!isViewChecked} 
                                                                                    />
                                                                                </div>
                                                                            </td>
                                                                            <td className="px-6 py-3 text-center">
                                                                                <div className="flex justify-center">
                                                                                    <Checkbox 
                                                                                        checked={permissions[fullKey]?.can_delete || false} 
                                                                                        onCheckedChange={(c) => handlePermissionChange(fullKey, 'can_delete', c)} 
                                                                                        disabled={!isViewChecked} 
                                                                                    />
                                                                                </div>
                                                                            </td>
                                                                            <td className="px-6 py-3 text-center">
                                                                                <div className="flex justify-center">
                                                                                    <Checkbox 
                                                                                        checked={isAllChecked || false} 
                                                                                        onCheckedChange={(c) => handleEnableAll(fullKey, c)} 
                                                                                    />
                                                                                </div>
                                                                            </td>
                                                                        </tr>
                                                                    );
                                                                })}

                                                                {/* Fallback for modules without sub-modules */}
                                                                {!hasSubModules && (() => {
                                                                    const isViewChecked = permissions[mod.slug]?.can_view || false;
                                                                    const isAllChecked = isViewChecked && permissions[mod.slug]?.can_add && permissions[mod.slug]?.can_edit && permissions[mod.slug]?.can_delete;
                                                                    return (
                                                                        <tr className="hover:bg-gray-50">
                                                                            <td className="px-6 py-3 pl-12 text-sm text-gray-600">{mod.name} (Main)</td>
                                                                            <td className="px-6 py-3 text-center">
                                                                                <div className="flex justify-center">
                                                                                    <Checkbox 
                                                                                        checked={isViewChecked} 
                                                                                        onCheckedChange={(c) => handlePermissionChange(mod.slug, 'can_view', c)} 
                                                                                    />
                                                                                </div>
                                                                            </td>
                                                                            <td className="px-6 py-3 text-center">
                                                                                <div className="flex justify-center">
                                                                                    <Checkbox 
                                                                                        checked={permissions[mod.slug]?.can_add || false} 
                                                                                        onCheckedChange={(c) => handlePermissionChange(mod.slug, 'can_add', c)} 
                                                                                        disabled={!isViewChecked} 
                                                                                    />
                                                                                </div>
                                                                            </td>
                                                                            <td className="px-6 py-3 text-center">
                                                                                <div className="flex justify-center">
                                                                                    <Checkbox 
                                                                                        checked={permissions[mod.slug]?.can_edit || false} 
                                                                                        onCheckedChange={(c) => handlePermissionChange(mod.slug, 'can_edit', c)} 
                                                                                        disabled={!isViewChecked} 
                                                                                    />
                                                                                </div>
                                                                            </td>
                                                                            <td className="px-6 py-3 text-center">
                                                                                <div className="flex justify-center">
                                                                                    <Checkbox 
                                                                                        checked={permissions[mod.slug]?.can_delete || false} 
                                                                                        onCheckedChange={(c) => handlePermissionChange(mod.slug, 'can_delete', c)} 
                                                                                        disabled={!isViewChecked} 
                                                                                    />
                                                                                </div>
                                                                            </td>
                                                                            <td className="px-6 py-3 text-center">
                                                                                <div className="flex justify-center">
                                                                                    <Checkbox 
                                                                                        checked={isAllChecked || false} 
                                                                                        onCheckedChange={(c) => handleEnableAll(mod.slug, c)} 
                                                                                    />
                                                                                </div>
                                                                            </td>
                                                                        </tr>
                                                                    );
                                                                })()}
                                                            </React.Fragment>
                                                        );
                                                    })}
                                                </React.Fragment>
                                            )) : (
                                                <tr>
                                                    <td colSpan="6" className="text-center py-16 text-muted-foreground">
                                                        <div className="flex flex-col items-center">
                                                            <AlertCircle className="h-8 w-8 mb-2 opacity-50" />
                                                            <p>No modules enabled in this school's plan.</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </div>

            {/* Delete Confirmation */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Role?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the role <span className="font-semibold text-foreground">{roleToDelete?.name}</span> and remove all associated permissions. This cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setRoleToDelete(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete Role
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </DashboardLayout>
    );
};

export default RolePermissionMaster;
