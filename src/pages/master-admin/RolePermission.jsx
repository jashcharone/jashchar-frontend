import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase, isSupabaseReady } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Plus, Shield, Trash2, AlertTriangle, School, Users, Lock, Save, Check, Copy } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getSchoolOwnerModules } from '@/services/schoolOwnerModulesLoader';

const SYSTEM_ROLES = [
    'Super Admin', 'Admin', 'Principal', 'Accountant', 'Receptionist', 'Teacher', 'Librarian', 'Parent', 'Student'
];

// Default Permission Templates
const ROLE_TEMPLATES = {
    'Super Admin': {
        modules: 'all',
        permissions: { view: true, add: true, edit: true, delete: true }
    },
    'Admin': {
        modules: 'all',
        permissions: { view: true, add: true, edit: true, delete: true }
    },
    'Principal': {
        modules: 'all',
        permissions: { view: true, add: true, edit: true, delete: true }
    },
    'Teacher': {
        modules: ['academics', 'homework', 'examination', 'lesson_plan', 'student_information', 'communicate', 'download_center'],
        permissions: { view: true, add: true, edit: true, delete: false }
    },
    'Accountant': {
        modules: ['fees_collection', 'income', 'expenses', 'student_information'],
        permissions: { view: true, add: true, edit: true, delete: false }
    },
    'Librarian': {
        modules: ['library', 'student_information'],
        permissions: { view: true, add: true, edit: true, delete: true }
    },
    'Receptionist': {
        modules: ['front_office', 'student_information', 'communicate'],
        permissions: { view: true, add: true, edit: true, delete: false }
    },
    'Parent': {
        modules: ['student_information', 'fees_collection', 'homework', 'examination', 'communicate'],
        permissions: { view: true, add: false, edit: false, delete: false }
    },
    'Student': {
        modules: ['student_information', 'homework', 'examination', 'lesson_plan', 'download_center', 'communicate'],
        permissions: { view: true, add: false, edit: false, delete: false }
    }
};

const RolePermission = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    
    // Selection State
    const [schools, setSchools] = useState([]);
    const [selectedSchool, setSelectedSchool] = useState('');
    const [roles, setRoles] = useState([]);
    const [selectedRole, setSelectedRole] = useState(null);
    
    // Data State
    const [modules, setModules] = useState([]);
    const [permissions, setPermissions] = useState({});
    
    // UI State
    const [loading, setLoading] = useState(false);
    const [loadingPermissions, setLoadingPermissions] = useState(false);
    const [saving, setSaving] = useState(false);
    const [newRoleName, setNewRoleName] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [errorState, setErrorState] = useState(null);

    // Initial Load
    useEffect(() => {
        fetchSchools();
    }, []);

    // Fetch Roles when School Changes
    useEffect(() => {
        if (selectedSchool) {
            fetchRoles(selectedSchool);
            fetchModules(selectedSchool);
            setSelectedRole(null);
            setPermissions({});
        } else {
            setRoles([]);
            setModules([]);
        }
    }, [selectedSchool]);

    // Fetch Permissions when Role Changes
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

            // Use relative URL - Vercel rewrites /api/* to Railway backend
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
                                schoolName: school.name
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

            // Ensure all System Roles are listed, even if not in DB yet (virtual)
            const finalRoles = [];
            SYSTEM_ROLES.forEach(name => {
                const normalizedSystemName = name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
                if (!seenDbNames.has(normalizedSystemName)) {
                    finalRoles.push({
                        id: `sys-${normalizedSystemName}`, // Virtual ID
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

        // Fetch ALL modules from module_registry (including sub-modules)
        const { data: allModules } = await supabase
            .from('module_registry')
            .select('id, slug, name, parent_slug')
            .eq('is_active', true);

        // Build parent -> children map from DATABASE (not hardcoded catalog)
        const childrenMap = {};
        allModules?.forEach(m => {
            if (m.parent_slug) {
                if (!childrenMap[m.parent_slug]) childrenMap[m.parent_slug] = [];
                childrenMap[m.parent_slug].push({
                    key: m.slug,
                    label: m.name,
                    fullSlug: `${m.parent_slug}.${m.slug}`
                });
            }
        });

        const structuredModules = [];
        const processedSlugs = new Set();

        allowedModules.forEach(m => {
            const slug = m.slug;
            
            if (!processedSlugs.has(slug)) {
                processedSlugs.add(slug);
                structuredModules.push({
                    id: m.id,
                    slug: slug,
                    name: m.name,
                    // Sub-modules from DATABASE instead of hardcoded MODULE_CATALOG
                    subModules: childrenMap[slug] || []
                });
            }
        });
        setModules(structuredModules);
    };

    const fetchRolePermissions = async (roleId) => {
        setLoadingPermissions(true);
        try {
            // If virtual role, it has no permissions yet
            if (roleId.startsWith('sys-')) {
                setPermissions({});
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
        } catch (error) {
            console.error('Error fetching permissions:', error);
        } finally {
            setLoadingPermissions(false);
        }
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

            return { ...prev, [moduleSlug]: newPerms };
        });
    };

    const handleToggleAll = (module, checked) => {
        setPermissions(prev => {
            const updated = { ...prev };
            const newPerms = { view: checked, add: checked, edit: checked, delete: checked };
            
            updated[module.slug] = newPerms;
            if (module.subModules) {
                module.subModules.forEach(sub => {
                    updated[sub.fullSlug] = newPerms;
                });
            }
            return updated;
        });
    };

    const applyTemplate = () => {
        if (!selectedRole) return;
        
        // Find template case-insensitively
        const roleName = selectedRole.name;
        const templateKey = Object.keys(ROLE_TEMPLATES).find(key => 
            key.toLowerCase() === roleName.toLowerCase()
        );
        
        const template = templateKey ? ROLE_TEMPLATES[templateKey] : null;

        if (!template) {
            toast({ title: 'No Template', description: `No default template found for role: ${roleName}` });
            return;
        }

        const newPerms = {};
        modules.forEach(m => {
            const hasAccess = template.modules === 'all' || template.modules.includes(m.slug);
            if (hasAccess) {
                newPerms[m.slug] = { ...template.permissions };
                if (m.subModules) {
                    m.subModules.forEach(sub => {
                        newPerms[sub.fullSlug] = { ...template.permissions };
                    });
                }
            }
        });
        setPermissions(newPerms);
        toast({ title: 'Template Applied', description: `Applied default permissions for ${selectedRole.name}` });
    };

    const handleSave = async () => {
        if (!selectedRole || !selectedSchool) return;
        setSaving(true);

        try {
            let roleId = selectedRole.id;

            // 1. Create Role if Virtual
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
                
                // Update local state to reflect real role
                setRoles(prev => prev.map(r => r.id === selectedRole.id ? { ...newRole, is_virtual: false } : r));
                setSelectedRole({ ...newRole, is_virtual: false });
            }

            // 2. Prepare Permissions Data - use module_slug only (no module_id FK to avoid constraint issues)
            const upsertData = [];
            Object.entries(permissions).forEach(([slug, perms]) => {
                if (perms.view || perms.add || perms.edit || perms.delete) {
                    upsertData.push({
                        branch_id: selectedSchool,
                        role_id: roleId,
                        module_slug: slug,
                        // Note: module_id removed - FK references deprecated modules table
                        can_view: perms.view,
                        can_add: perms.add,
                        can_edit: perms.edit,
                        can_delete: perms.delete,
                        role_name: selectedRole.name
                    });
                }
            });

            // 3. Delete existing and Insert new (Transaction-like)
            // Delete by branch_id + role_name to avoid duplicates
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

            toast({ title: 'Success', description: 'Permissions saved successfully' });
        } catch (error) {
            console.error('Save error:', error);
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setSaving(false);
        }
    };

    const handleAddRole = async () => {
        if (!newRoleName.trim() || !selectedSchool) return;
        const { data, error } = await supabase
            .from('roles')
            .insert([{ name: newRoleName, branch_id: selectedSchool, is_system: false }])
            .select().single();

        if (error) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } else {
            toast({ title: 'Success', description: 'Role added successfully' });
            setRoles(prev => [...prev, { ...data, is_system: false }]);
            setNewRoleName('');
            setIsDialogOpen(false);
        }
    };

    const handleDeleteRole = async (roleId, e) => {
        e.stopPropagation(); // Prevent selecting the role when clicking delete
        if (!confirm("Are you sure you want to delete this role? This action cannot be undone.")) return;
        
        try {
            // Updated to use force_delete_role RPC to handle FK constraints
            const { error } = await supabase.rpc('force_delete_role', { p_role_id: roleId });
            
            if (error) {
                 // Try standard delete if RPC fails (fallback)
                 console.warn("RPC delete failed, trying standard:", error);
                 const { error: stdError } = await supabase
                    .from('roles')
                    .delete()
                    .eq('id', roleId);
                 if (stdError) throw stdError;
            }
            
            setRoles(prev => prev.filter(r => r.id !== roleId));
            if (selectedRole?.id === roleId) setSelectedRole(null);
            toast({ title: 'Success', description: 'Role deleted successfully' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        }
    };

    return (
        <DashboardLayout>
            <div className="h-[calc(100vh-100px)] flex flex-col gap-4 max-w-[1600px] mx-auto p-4">
                {/* Header */}
                <div className="flex justify-between items-center bg-card p-4 rounded-lg shadow-sm border text-card-foreground">
                    <div>
                        <h1 className="text-2xl font-bold">Role & Permissions Manager</h1>
                        <p className="text-sm text-muted-foreground">Configure access levels for school staff.</p>
                    </div>
                    <div className="w-[400px]">
                        <Select value={selectedSchool} onValueChange={setSelectedSchool}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Organization / School" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[400px]">
                                {schools.map(s => (
                                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Main Content - Split View */}
                <div className="flex-1 flex gap-4 overflow-hidden">
                    {/* Left Sidebar: Roles */}
                    <Card className="w-1/4 flex flex-col">
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-lg">Roles</CardTitle>
                                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button size="sm" variant="outline"><Plus className="h-4 w-4" /></Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader><DialogTitle>Add Role</DialogTitle></DialogHeader>
                                        <Input value={newRoleName} onChange={e => setNewRoleName(e.target.value)} placeholder="Role Name" />
                                        <DialogFooter><Button onClick={handleAddRole}>Create</Button></DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </CardHeader>
                        <Separator />
                        <CardContent className="flex-1 overflow-y-auto p-2 space-y-1">
                            {loading ? (
                                <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>
                            ) : roles.length === 0 ? (
                                <div className="text-center text-muted-foreground p-4">No roles found</div>
                            ) : (
                                roles.map(role => (
                                    <div 
                                        key={role.id}
                                        onClick={() => setSelectedRole(role)}
                                        className={`p-3 rounded-md cursor-pointer flex items-center justify-between transition-colors group ${selectedRole?.id === role.id ? 'bg-primary/10 border-primary/20 border' : 'hover:bg-accent hover:text-accent-foreground'}`}
                                    >
                                        <div className="flex items-center gap-2">
                                            {role.is_system ? <Lock className="h-4 w-4 text-blue-500" /> : <Users className="h-4 w-4 text-emerald-500" />}
                                            <span className="font-medium text-sm">{role.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {role.is_virtual && <Badge variant="outline" className="text-[10px]">New</Badge>}
                                            {!role.is_system && !role.is_virtual && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                                                    onClick={(e) => handleDeleteRole(role.id, e)}
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>

                    {/* Right Panel: Permissions Matrix */}
                    <Card className="flex-1 flex flex-col">
                        {selectedRole ? (
                            <>
                                <CardHeader className="pb-2 border-b">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <CardTitle>Permissions: {selectedRole.name}</CardTitle>
                                            <CardDescription>Manage module access for this role.</CardDescription>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm" onClick={applyTemplate}>
                                                <Copy className="mr-2 h-4 w-4" /> Apply Default Template
                                            </Button>
                                            <Button onClick={handleSave} disabled={saving}>
                                                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                                Save Changes
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-1 overflow-y-auto p-0">
                                    {loadingPermissions ? (
                                        <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                                    ) : (
                                        <Table>
                                            <TableHeader className="sticky top-0 bg-card z-10">
                                                <TableRow>
                                                    <TableHead className="w-[40%]">Module</TableHead>
                                                    <TableHead className="text-center">View</TableHead>
                                                    <TableHead className="text-center">Add</TableHead>
                                                    <TableHead className="text-center">Edit</TableHead>
                                                    <TableHead className="text-center">Delete</TableHead>
                                                    <TableHead className="text-center">All</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {modules.map(module => (
                                                    <React.Fragment key={module.slug}>
                                                        {/* Main Module Row */}
                                                        <TableRow className="bg-muted/30 font-medium">
                                                            <TableCell>{module.name}</TableCell>
                                                            {['view', 'add', 'edit', 'delete'].map(action => (
                                                                <TableCell key={action} className="text-center">
                                                                    <Checkbox 
                                                                        checked={permissions[module.slug]?.[action] || false}
                                                                        onCheckedChange={(checked) => handleCheck(module.slug, action, checked)}
                                                                    />
                                                                </TableCell>
                                                            ))}
                                                            <TableCell className="text-center">
                                                                <Checkbox 
                                                                    checked={['view', 'add', 'edit', 'delete'].every(a => permissions[module.slug]?.[a])}
                                                                    onCheckedChange={(checked) => handleToggleAll(module, checked)}
                                                                />
                                                            </TableCell>
                                                        </TableRow>
                                                        {/* Submodules */}
                                                        {module.subModules?.map(sub => (
                                                            <TableRow key={sub.fullSlug} className="hover:bg-muted/50">
                                                                <TableCell className="pl-8 text-sm text-muted-foreground flex items-center gap-2">
                                                                    <div className="w-1 h-1 bg-muted-foreground/50 rounded-full" />
                                                                    {sub.label}
                                                                </TableCell>
                                                                {['view', 'add', 'edit', 'delete'].map(action => (
                                                                    <TableCell key={action} className="text-center">
                                                                        <Checkbox 
                                                                            checked={permissions[sub.fullSlug]?.[action] || false}
                                                                            onCheckedChange={(checked) => handleCheck(sub.fullSlug, action, checked)}
                                                                        />
                                                                    </TableCell>
                                                                ))}
                                                                <TableCell className="text-center">
                                                                    {/* Submodule toggle all logic could be added here if needed */}
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </React.Fragment>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    )}
                                </CardContent>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                                <Users className="h-16 w-16 mb-4 opacity-20" />
                                <p>Select a role from the left sidebar to view permissions.</p>
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default RolePermission;
