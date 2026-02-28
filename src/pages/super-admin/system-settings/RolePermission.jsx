import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Shield, Loader2, Settings, Users, Building2, Pencil } from 'lucide-react';

const RolePermissionSchool = () => {
    const navigate = useNavigate();
    const { roleSlug } = useParams();
    const basePath = roleSlug || 'super-admin';
    const { toast } = useToast();
    const { user, school, currentSessionId, organizationId } = useAuth();
    const { selectedBranch, branches, loading: branchLoading } = useBranch();
    
    // Use selected branch ID for filtering roles
    const branchId = selectedBranch?.id || school?.id || user?.user_metadata?.branch_id;
    
    // State
    const [roles, setRoles] = useState([]);
    const [newRoleName, setNewRoleName] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    
    // Edit Role State
    const [editRoleId, setEditRoleId] = useState(null);
    const [editRoleName, setEditRoleName] = useState('');
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [saving, setSaving] = useState(false);

    // System roles that cannot be deleted - 21 comprehensive roles
    const SYSTEM_ROLES = [
        'Super Admin', 'Admin', 'Principal', 'Vice Principal', 'Coordinator',
        'Accountant', 'Cashier', 'Receptionist', 'Teacher', 'Class Teacher',
        'Subject Teacher', 'Librarian', 'Lab Assistant', 'Driver', 'Hostel Warden',
        'Sports Coach', 'Security Guard', 'Maintenance Staff', 'Peon', 'Student', 'Parent'
    ];

    // Fetch Roles when branch changes
    const fetchRoles = useCallback(async () => {
        if (!branchId) return;
        
        setLoading(true);
        const { data, error } = await supabase
            .from('roles')
            .select('*')
            .or(`branch_id.eq.${branchId},branch_id.is.null`)
            .order('name');
        
        if (error) {
            toast({ variant: 'destructive', title: 'Failed to fetch roles' });
        } else {
            // Filter out duplicates and School Owner role
            const uniqueRoles = [];
            const seenNames = new Set();
            
            const sortedData = (data || []).sort((a, b) => {
                if (a.is_system_default && !b.is_system_default) return -1;
                if (!a.is_system_default && b.is_system_default) return 1;
                const aIsTitle = a.name[0] === a.name[0].toUpperCase();
                const bIsTitle = b.name[0] === b.name[0].toUpperCase();
                if (aIsTitle && !bIsTitle) return -1;
                if (!aIsTitle && bIsTitle) return 1;
                return 0;
            });

            sortedData.forEach(role => {
                const lowerName = role.name.toLowerCase().replace(/_/g, ' ').trim();
                if (lowerName === 'school owner' || lowerName === 'super admin') return;
                if (!seenNames.has(lowerName)) {
                    seenNames.add(lowerName);
                    uniqueRoles.push(role);
                }
            });
            
            setRoles(uniqueRoles);
        }
        setLoading(false);
    }, [branchId, toast]);

    useEffect(() => {
        fetchRoles();
    }, [fetchRoles]);

    // Add New Role
    const handleAddRole = async () => {
        if (!newRoleName.trim()) return;
        
        const { data, error } = await supabase
            .from('roles')
            .insert([{ 
                name: newRoleName, 
                branch_id: branchId,
                description: 'Custom Role',
                is_system_role: false,
                is_active: true
            }])
            .select()
            .single();

        if (error) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } else {
            toast({ title: 'Success', description: 'Role added successfully' });
            setRoles(prev => [...prev, data]);
            setNewRoleName('');
            setIsDialogOpen(false);
        }
    };

    // Delete Role
    const handleDeleteRole = async (id) => {
        if (!confirm("Are you sure? This cannot be undone.")) return;
        const { error } = await supabase.from('roles').delete().eq('id', id);
        if (error) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } else {
            toast({ title: 'Success', description: 'Role deleted' });
            setRoles(prev => prev.filter(r => r.id !== id));
        }
    };

    // Open Edit Dialog
    const openEditDialog = (role) => {
        setEditRoleId(role.id);
        setEditRoleName(role.name);
        setIsEditDialogOpen(true);
    };

    // Update Role Name
    const handleUpdateRole = async () => {
        if (!editRoleName.trim() || !editRoleId) return;
        setSaving(true);

        const { data, error } = await supabase
            .from('roles')
            .update({ name: editRoleName, updated_at: new Date().toISOString() })
            .eq('id', editRoleId)
            .select()
            .single();

        if (error) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } else {
            toast({ title: 'Success', description: 'Role name updated successfully' });
            setRoles(prev => prev.map(r => r.id === editRoleId ? { ...r, name: editRoleName } : r));
            setIsEditDialogOpen(false);
            setEditRoleId(null);
            setEditRoleName('');
        }
        setSaving(false);
    };

    if (branchLoading) {
        return (
            <DashboardLayout>
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-2">
                            <Shield className="h-8 w-8 text-primary" />
                            Role Permissions
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Manage roles and assign module permissions for your staff
                        </p>
                    </div>
                    
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button><Plus className="mr-2 h-4 w-4" /> Add New Role</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add New Role</DialogTitle>
                            </DialogHeader>
                            <div className="py-4">
                                <Label>Role Name</Label>
                                <Input 
                                    value={newRoleName} 
                                    onChange={(e) => setNewRoleName(e.target.value)} 
                                    placeholder="e.g. Lab Assistant, HOD, Warden" 
                                />
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                                <Button onClick={handleAddRole}>Save Role</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Branch Info */}
                {selectedBranch && (
                    <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                        <CardContent className="pt-6">
                            <div className="flex items-start gap-3">
                                <Building2 className="h-5 w-5 text-blue-600 mt-0.5" />
                                <div>
                                    <p className="font-medium text-blue-900 dark:text-blue-100">
                                        Branch: {selectedBranch.branch_name || selectedBranch.name}
                                    </p>
                                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                                        Showing roles for the selected branch. Change branch from the header to view roles for other branches.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Info Card */}
                <Card className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                            <Settings className="h-5 w-5 text-amber-600 mt-0.5" />
                            <div>
                                <p className="font-medium text-amber-900 dark:text-amber-100">How Role Permissions Work</p>
                                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                                    1. Click "Assign Permission" on any role to configure which modules that role can access.<br/>
                                    2. Each module has View, Add, Edit, and Delete permissions.<br/>
                                    3. Staff members with that role will only see modules they have permission to access.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Roles Table */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Roles List
                        </CardTitle>
                        <CardDescription>
                            {roles.length} role{roles.length !== 1 ? 's' : ''} configured for this branch
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px]">#</TableHead>
                                    <TableHead>Role Name</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-8">
                                            <Loader2 className="animate-spin h-6 w-6 mx-auto" />
                                        </TableCell>
                                    </TableRow>
                                ) : roles.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                            No roles found for this branch. Click "Add New Role" to create one.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    roles.map((role, index) => {
                                        const isSystem = SYSTEM_ROLES.some(sr => 
                                            sr.toLowerCase() === role.name.toLowerCase().replace(/_/g, ' ')
                                        );
                                        return (
                                            <TableRow key={role.id}>
                                                <TableCell className="font-medium">{index + 1}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Shield className={`h-4 w-4 ${isSystem ? 'text-primary' : 'text-muted-foreground'}`} />
                                                        <span className="font-medium">{role.name.replace(/_/g, ' ')}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className={`px-2 py-1 text-xs rounded-full ${
                                                        isSystem 
                                                            ? 'bg-primary/10 text-primary' 
                                                            : 'bg-muted text-muted-foreground'
                                                    }`}>
                                                        {isSystem ? 'System' : 'Custom'}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm" 
                                                            onClick={() => navigate(`/${basePath}/system-settings/assign-permission/${role.id}`)}
                                                        >
                                                            <Settings className="mr-2 h-4 w-4" />
                                                            Assign Permission
                                                        </Button>
                                                        {!isSystem && (
                                                            <>
                                                                <Button 
                                                                    variant="ghost" 
                                                                    size="icon" 
                                                                    className="hover:bg-blue-100"
                                                                    onClick={() => openEditDialog(role)}
                                                                    title="Edit Role Name"
                                                                >
                                                                    <Pencil className="h-4 w-4 text-blue-600" />
                                                                </Button>
                                                                <Button 
                                                                    variant="ghost" 
                                                                    size="icon" 
                                                                    className="text-destructive hover:text-destructive hover:bg-destructive/10" 
                                                                    onClick={() => handleDeleteRole(role.id)}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Edit Role Dialog */}
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Pencil className="h-5 w-5" />
                                Edit Role Name
                            </DialogTitle>
                        </DialogHeader>
                        <div className="py-4">
                            <Label>Role Name</Label>
                            <Input 
                                value={editRoleName} 
                                onChange={(e) => setEditRoleName(e.target.value)} 
                                placeholder="Enter new role name"
                                className="mt-2"
                            />
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleUpdateRole} disabled={saving || !editRoleName.trim()}>
                                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Update Role
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
};

export default RolePermissionSchool;
