import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Search, Grid, List, Eye, Edit, Phone, MapPin, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/registry/routeRegistry';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const StaffDirectory = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    const [viewMode, setViewMode] = useState('grid');
    const [loading, setLoading] = useState(true);
    const [employees, setEmployees] = useState([]);
    const [roles, setRoles] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [designations, setDesignations] = useState([]);
    const [filters, setFilters] = useState({
        role: 'all',
        department: 'all',
        designation: 'all',
        search: ''
    });

    // Use selectedBranch.id for proper branch switching
    const branchId = selectedBranch?.id || user?.profile?.branch_id;

    useEffect(() => {
        if (branchId) {
            fetchInitialData();
            fetchEmployees();
        }
    }, [branchId]);

    const fetchInitialData = async () => {
        // Fetch roles, departments, designations
        let rolesQuery = supabase.from('roles').select('*').eq('branch_id', branchId);
        let deptsQuery = supabase.from('departments').select('*').eq('branch_id', branchId);
        let desigsQuery = supabase.from('designations').select('*').eq('branch_id', branchId);

        if (selectedBranch?.id) {
            deptsQuery = deptsQuery.eq('branch_id', selectedBranch.id);
            desigsQuery = desigsQuery.eq('branch_id', selectedBranch.id);
        }

        const [rolesRes, deptsRes, desigsRes] = await Promise.all([
            rolesQuery,
            deptsQuery,
            desigsQuery
        ]);
        
        // Process roles: Filter restricted and deduplicate
        let fetchedRoles = rolesRes.data || [];
        const restrictedRoles = ['student', 'parent', 'master_admin', 'school_owner', 'school owner', 'super admin', 'super_admin'];
        
        // Filter restricted
        fetchedRoles = fetchedRoles.filter(r => !restrictedRoles.includes(r.name.toLowerCase()));

        // Deduplicate (prefer Title Case)
        const uniqueRolesMap = new Map();
        fetchedRoles.forEach(r => {
            const key = r.name.toLowerCase();
            if (!uniqueRolesMap.has(key)) {
                uniqueRolesMap.set(key, r);
            } else {
                // If existing is lowercase and new is Title Case, replace it
                const current = uniqueRolesMap.get(key);
                const isNewTitleCase = r.name[0] === r.name[0].toUpperCase();
                const isCurrentLowerCase = current.name[0] === current.name[0].toLowerCase();
                
                if (isNewTitleCase && isCurrentLowerCase) {
                    uniqueRolesMap.set(key, r);
                }
            }
        });

        setRoles(Array.from(uniqueRolesMap.values()));
        if (deptsRes.data) setDepartments(deptsRes.data);
        if (desigsRes.data) setDesignations(desigsRes.data);
    };

    const fetchEmployees = async () => {
        setLoading(true);
        
        let query = supabase
            .from('employee_profiles')
            .select(`
                *,
                role:roles(name),
                department:departments(name),
                designation:designations(name)
            `)
            .eq('branch_id', branchId);

        const { data, error } = await query;

        if (error) {
            console.error(error);
            toast({ variant: "destructive", title: "Error fetching employees" });
        } else {
            setEmployees(data || []);
        }
        setLoading(false);
    };

    const filteredEmployees = employees.filter(employee => {
        const matchesRole = filters.role === 'all' || employee.role_id === filters.role;
        const matchesDept = filters.department === 'all' || employee.department_id === filters.department;
        const matchesDesig = filters.designation === 'all' || employee.designation_id === filters.designation;
        const matchesSearch = !filters.search || 
            employee.full_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
            employee.employee_id?.toLowerCase().includes(filters.search.toLowerCase());
        
        return matchesRole && matchesDept && matchesDesig && matchesSearch;
    });

    const handleViewProfile = (id) => {
        navigate(ROUTES.SUPER_ADMIN.STAFF_PROFILE.replace(':employeeId', id));
    };
    
    const handleEditProfile = (id) => {
        navigate(ROUTES.SUPER_ADMIN.EDIT_EMPLOYEE.replace(':employeeId', id));
    };

    const handleAddStaff = () => {
        navigate(ROUTES.SUPER_ADMIN.ADD_EMPLOYEE);
    };

    return (
        <DashboardLayout>
            <div className="p-6 space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <h1 className="text-2xl font-bold">Staff Directory</h1>
                    <div className="flex gap-2">
                        <div className="flex bg-muted rounded-lg p-1">
                            <Button 
                                variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
                                size="sm" 
                                onClick={() => setViewMode('grid')}
                                className="h-8 px-3"
                            >
                                <Grid className="h-4 w-4 mr-2" /> Grid
                            </Button>
                            <Button 
                                variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
                                size="sm" 
                                onClick={() => setViewMode('list')}
                                className="h-8 px-3"
                            >
                                <List className="h-4 w-4 mr-2" /> List
                            </Button>
                        </div>
                        <Button onClick={handleAddStaff}>
                            <Plus className="h-4 w-4 mr-2" /> Add Staff
                        </Button>
                    </div>
                </div>

                <Card>
                    <CardContent className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Select value={filters.role} onValueChange={(v) => setFilters({...filters, role: v})}>
                            <SelectTrigger><SelectValue placeholder="Select Role" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Roles</SelectItem>
                                {roles.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select value={filters.department} onValueChange={(v) => setFilters({...filters, department: v})}>
                            <SelectTrigger><SelectValue placeholder="Select Department" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Departments</SelectItem>
                                {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select value={filters.designation} onValueChange={(v) => setFilters({...filters, designation: v})}>
                            <SelectTrigger><SelectValue placeholder="Select Designation" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Designations</SelectItem>
                                {designations.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Search by name or Employee ID..." 
                                className="pl-8"
                                value={filters.search}
                                onChange={(e) => setFilters({...filters, search: e.target.value})}
                            />
                        </div>
                    </CardContent>
                </Card>

                {loading ? (
                    <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8" /></div>
                ) : filteredEmployees.length === 0 ? (
                    <div className="text-center p-12 text-muted-foreground">No employees found matching criteria.</div>
                ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredEmployees.map(emp => (
                            <Card key={emp.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                                <CardContent className="p-0">
                                    <div className="bg-primary/10 h-24 relative">
                                        <div className="absolute -bottom-10 left-4">
                                            {emp.photo_url ? (
                                                <img src={emp.photo_url} alt={emp.full_name} className="w-20 h-20 rounded-full border-4 border-background object-cover bg-background" />
                                            ) : (
                                                <div className="w-20 h-20 rounded-full border-4 border-background bg-muted flex items-center justify-center text-2xl font-bold text-muted-foreground">
                                                    {emp.full_name?.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="pt-12 px-4 pb-4">
                                        <h3 className="font-bold text-lg truncate">{emp.full_name}</h3>
                                        <p className="text-sm text-muted-foreground mb-2">{emp.role?.name} • {emp.department?.name || 'No Dept'}</p>
                                        <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><span className="font-semibold">Employee ID:</span> {emp.employee_id || '-'}</p>
                                        <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Phone className="h-3 w-3" /> {emp.mobile || emp.phone || 'N/A'}</p>
                                        <div className="flex gap-2 mt-4">
                                            <Button variant="outline" size="sm" className="flex-1" onClick={() => handleViewProfile(emp.id)}>
                                                <Eye className="h-3 w-3 mr-1" /> View
                                            </Button>
                                            <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEditProfile(emp.id)}>
                                                <Edit className="h-3 w-3 mr-1" /> Edit
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="bg-card rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead>Employee ID</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Department</TableHead>
                                    <TableHead>Designation</TableHead>
                                    <TableHead>Mobile</TableHead>
                                    <TableHead>Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredEmployees.map(emp => (
                                    <TableRow key={emp.id}>
                                        <TableCell className="font-medium font-mono text-primary">{emp.employee_id || '-'}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {emp.photo_url ? (
                                                    <img src={emp.photo_url} alt="" className="w-8 h-8 rounded-full object-cover bg-muted" />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                                                        {emp.full_name?.charAt(0)}
                                                    </div>
                                                )}
                                                {emp.full_name}
                                            </div>
                                        </TableCell>
                                        <TableCell>{emp.role?.name}</TableCell>
                                        <TableCell>{emp.department?.name || '-'}</TableCell>
                                        <TableCell>{emp.designation?.name || '-'}</TableCell>
                                        <TableCell>{emp.mobile || emp.phone || 'N/A'}</TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <Button variant="ghost" size="icon" onClick={() => handleViewProfile(emp.id)}>
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleEditProfile(emp.id)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default StaffDirectory;
