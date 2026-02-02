import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Shield, Plus, School, Users, Trash2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

// Branch-level System Roles
// NOTE: For NEW organizations, Super Admin & Admin are created at org_roles level
//       But EXISTING branches may have Super Admin/Admin in roles table - we support both
const DEFAULT_SYSTEM_ROLES = [
    'super_admin',  // Legacy support - existing branches may have this
    'admin',        // Legacy support - existing branches may have this
    'principal',
    'accountant',
    'receptionist',
    'teacher',
    'librarian',
    'parent',
    'student'
];

const RolePermission = () => {
    const { toast } = useToast();
    const navigate = useNavigate();
    const [schools, setSchools] = useState([]);
    const [selectedSchool, setSelectedSchool] = useState('');
    const [selectedSchoolData, setSelectedSchoolData] = useState(null);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [schoolsLoading, setSchoolsLoading] = useState(true);
    
    // Add New Role Dialog
    const [isAddRoleOpen, setIsAddRoleOpen] = useState(false);
    const [newRoleName, setNewRoleName] = useState('');
    const [addingRole, setAddingRole] = useState(false);

    // Fetch all schools on mount
    useEffect(() => {
        fetchSchools();
    }, []);

    // Fetch roles when school changes
    useEffect(() => {
        if (selectedSchool) {
            fetchRolesForSchool(selectedSchool);
            const school = schools.find(s => s.id === selectedSchool);
            setSelectedSchoolData(school);
        } else {
            setRoles([]);
            setSelectedSchoolData(null);
        }
    }, [selectedSchool, schools]);

    const fetchSchools = async () => {
        setSchoolsLoading(true);
        const { data, error } = await supabase
            .from('schools')
            .select('id, name, contact_email, status')
            .eq('status', 'Active')
            .order('name');

        if (error) {
            toast({ variant: 'destructive', title: 'Failed to fetch schools', description: error.message });
        } else {
            setSchools(data || []);
        }
        setSchoolsLoading(false);
    };

    const fetchRolesForSchool = async (branchId) => {
        setLoading(true);
        
        // Fetch roles for this school
        const { data, error } = await supabase
            .from('roles')
            .select('id, name, is_system_role, is_active')
            .eq('branch_id', branchId)
            .order('name');

        if (error) {
            toast({ variant: 'destructive', title: 'Failed to fetch roles', description: error.message });
            setRoles([]);
        } else {
            // If no roles exist, create default system roles
            if (!data || data.length === 0) {
                await createDefaultRolesForSchool(branchId);
            } else {
                setRoles(data);
            }
        }
        setLoading(false);
    };

    const createDefaultRolesForSchool = async (branchId) => {
        const rolesPayload = DEFAULT_SYSTEM_ROLES.map(name => ({
            branch_id: branchId,
            name: name,
            is_system_role: true,
            is_active: true,
        }));

        const { data, error } = await supabase
            .from('roles')
            .upsert(rolesPayload, { onConflict: 'branch_id, name' })
            .select();

        if (error) {
            toast({ variant: 'destructive', title: 'Failed to create default roles', description: error.message });
        } else {
            setRoles(data || []);
            toast({ title: 'Default roles created', description: 'System roles have been initialized for this school.' });
        }
    };

    const handleAddNewRole = async () => {
        if (!newRoleName.trim()) {
            toast({ variant: 'destructive', title: 'Role name required' });
            return;
        }
        if (!selectedSchool) {
            toast({ variant: 'destructive', title: 'Select a school first' });
            return;
        }

        // Convert to slug format
        const roleSlug = newRoleName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

        // Check if already exists
        const exists = roles.find(r => r.name === roleSlug);
        if (exists) {
            toast({ variant: 'destructive', title: 'Role already exists', description: `"${newRoleName}" already exists for this school.` });
            return;
        }

        setAddingRole(true);
        const { data, error } = await supabase
            .from('roles')
            .insert({
                branch_id: selectedSchool,
                name: roleSlug,
                is_system_role: false, // Custom role
                is_active: true
            })
            .select()
            .single();

        if (error) {
            toast({ variant: 'destructive', title: 'Failed to add role', description: error.message });
        } else {
            setRoles([...roles, data]);
            toast({ title: 'Role added', description: `"${newRoleName}" has been added successfully.` });
            setNewRoleName('');
            setIsAddRoleOpen(false);
        }
        setAddingRole(false);
    };

    const handleDeleteRole = async (roleId, roleName) => {
        const { error } = await supabase
            .from('roles')
            .delete()
            .eq('id', roleId);

        if (error) {
            toast({ variant: 'destructive', title: 'Failed to delete role', description: error.message });
        } else {
            setRoles(roles.filter(r => r.id !== roleId));
            toast({ title: 'Role deleted', description: `"${roleName}" has been removed.` });
        }
    };

    const formatRoleName = (name) => {
        return name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Users className="h-6 w-6" />
                            Role Permissions
                        </h1>
                        <p className="text-muted-foreground text-sm mt-1">
                            Manage roles and their permissions for each school
                        </p>
                    </div>
                </div>

                {/* School Selection Card */}
                <div className="bg-card rounded-lg border p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <School className="h-5 w-5 text-primary" />
                        <h2 className="font-semibold">Select School</h2>
                    </div>
                    
                    {schoolsLoading ? (
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading schools...
                        </div>
                    ) : (
                        <Select value={selectedSchool} onValueChange={setSelectedSchool}>
                            <SelectTrigger className="max-w-md">
                                <SelectValue placeholder="Choose a school to manage roles" />
                            </SelectTrigger>
                            <SelectContent>
                                {schools.map(school => (
                                    <SelectItem key={school.id} value={school.id}>
                                        {school.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                    
                    {selectedSchoolData && (
                        <p className="text-sm text-muted-foreground mt-2">
                            Email: {selectedSchoolData.contact_email}
                        </p>
                    )}
                </div>

                {/* Roles Table - Only show when school is selected */}
                {selectedSchool && (
                    <div className="bg-card rounded-lg border shadow-sm">
                        <div className="p-4 border-b flex justify-between items-center bg-muted/50">
                            <h3 className="font-semibold">Roles for {selectedSchoolData?.name}</h3>
                            
                            {/* Add New Role Dialog */}
                            <Dialog open={isAddRoleOpen} onOpenChange={setIsAddRoleOpen}>
                                <DialogTrigger asChild>
                                    <Button size="sm">
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add New Role
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Add New Role</DialogTitle>
                                        <DialogDescription>
                                            Create a custom role for "{selectedSchoolData?.name}". 
                                            This role will only be available for this school.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="py-4">
                                        <Label htmlFor="roleName">Role Name</Label>
                                        <Input 
                                            id="roleName"
                                            value={newRoleName}
                                            onChange={(e) => setNewRoleName(e.target.value)}
                                            placeholder="e.g., Lab Assistant, Sports Coach"
                                            className="mt-2"
                                        />
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setIsAddRoleOpen(false)}>
                                            Cancel
                                        </Button>
                                        <Button onClick={handleAddNewRole} disabled={addingRole}>
                                            {addingRole ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                            Add Role
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>

                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12">#</TableHead>
                                    <TableHead>Role Name</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">
                                            <div className="flex justify-center items-center">
                                                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                                                Loading roles...
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : roles.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                            No roles found. Default roles will be created automatically.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    roles.map((role, index) => (
                                        <TableRow key={role.id}>
                                            <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                                            <TableCell className="font-medium">
                                                {formatRoleName(role.name)}
                                            </TableCell>
                                            <TableCell>
                                                {role.is_system_role ? 
                                                    <Badge variant="secondary">System</Badge> : 
                                                    <Badge variant="outline">Custom</Badge>
                                                }
                                            </TableCell>
                                            <TableCell>
                                                {role.is_active ? 
                                                    <Badge className="bg-green-100 text-green-800">Active</Badge> : 
                                                    <Badge variant="destructive">Inactive</Badge>
                                                }
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button variant="default" size="sm" asChild>
                                                        <Link to={`/master-admin/assign-permission/${selectedSchool}/${role.id}?name=${encodeURIComponent(formatRoleName(role.name))}`}>
                                                            <Shield className="mr-2 h-4 w-4" />
                                                            Assign Permission
                                                        </Link>
                                                    </Button>
                                                    
                                                    {/* Only allow deleting custom roles */}
                                                    {!role.is_system_role && (
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>Delete Role?</AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        Are you sure you want to delete "{formatRoleName(role.name)}"? 
                                                                        This will also remove all permissions associated with this role.
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                    <AlertDialogAction 
                                                                        onClick={() => handleDeleteRole(role.id, role.name)}
                                                                        className="bg-destructive hover:bg-destructive/90"
                                                                    >
                                                                        Delete
                                                                    </AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                )}

                {/* Instructions when no school selected */}
                {!selectedSchool && !schoolsLoading && (
                    <div className="bg-muted/30 rounded-lg border-2 border-dashed p-10 text-center">
                        <School className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="font-semibold text-lg mb-2">Select a School</h3>
                        <p className="text-muted-foreground max-w-md mx-auto">
                            Choose a school from the dropdown above to view and manage roles and their permissions.
                        </p>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default RolePermission;
