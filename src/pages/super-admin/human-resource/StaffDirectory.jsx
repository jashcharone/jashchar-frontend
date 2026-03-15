import React, { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
    Loader2, Search, Grid, List, Eye, Edit, Phone, MapPin, Plus, 
    Download, FileSpreadsheet, FileText, Users, UserCheck, UserX, 
    Clock, Building2, Briefcase, Mail, CalendarDays, MoreVertical,
    UserCog, Filter, X, Columns
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { ROUTES } from '@/registry/routeRegistry';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDate } from '@/utils/dateUtils';

const StaffDirectory = () => {
    const navigate = useNavigate();
    const { roleSlug } = useParams();
    const { user } = useAuth();
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    
    // Dynamic base path for navigation
    const basePath = roleSlug || 'super-admin';
    const [viewMode, setViewMode] = useState('grid');
    const [loading, setLoading] = useState(true);
    const [employees, setEmployees] = useState([]);
    const [roles, setRoles] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [designations, setDesignations] = useState([]);
    const [showFilters, setShowFilters] = useState(true);
    const [disableDialogOpen, setDisableDialogOpen] = useState(false);
    const [employeeToDisable, setEmployeeToDisable] = useState(null);
    
    // Column visibility state
    const [visibleColumns, setVisibleColumns] = useState({
        staffId: true,
        name: true,
        role: true,
        department: true,
        designation: true,
        mobile: true,
        email: false,
        joiningDate: false,
        status: true,
        action: true
    });
    
    const [filters, setFilters] = useState({
        role: 'all',
        department: 'all',
        designation: 'all',
        status: 'all',
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

    // Enhanced filtering
    const filteredEmployees = useMemo(() => {
        return employees.filter(employee => {
            const matchesRole = filters.role === 'all' || employee.role_id === filters.role;
            const matchesDept = filters.department === 'all' || employee.department_id === filters.department;
            const matchesDesig = filters.designation === 'all' || employee.designation_id === filters.designation;
            
            // Status filter
            const employeeStatus = employee.is_active === false ? 'inactive' : 
                                   employee.on_leave ? 'on_leave' : 'active';
            const matchesStatus = filters.status === 'all' || employeeStatus === filters.status;
            
            // Enhanced search - search in name, staff_id, phone, email, department, designation
            const searchLower = filters.search.toLowerCase();
            const matchesSearch = !filters.search || 
                employee.full_name?.toLowerCase().includes(searchLower) ||
                employee.staff_id?.toLowerCase().includes(searchLower) ||
                employee.mobile?.toLowerCase().includes(searchLower) ||
                employee.phone?.toLowerCase().includes(searchLower) ||
                employee.email?.toLowerCase().includes(searchLower) ||
                employee.department?.name?.toLowerCase().includes(searchLower) ||
                employee.designation?.name?.toLowerCase().includes(searchLower);
            
            return matchesRole && matchesDept && matchesDesig && matchesStatus && matchesSearch;
        });
    }, [employees, filters]);

    // Stats calculation
    const stats = useMemo(() => {
        const total = employees.length;
        const active = employees.filter(e => e.is_active !== false && !e.on_leave).length;
        const inactive = employees.filter(e => e.is_active === false).length;
        const onLeave = employees.filter(e => e.on_leave).length;
        const deptCount = new Set(employees.filter(e => e.department_id).map(e => e.department_id)).size;
        
        return { total, active, inactive, onLeave, deptCount };
    }, [employees]);

    const handleViewProfile = (id) => {
        navigate(`/${basePath}/human-resource/staff-profile/${id}`);
    };
    
    const handleEditProfile = (id) => {
        navigate(`/${basePath}/human-resource/edit-employee/${id}`);
    };

    const handleAddStaff = () => {
        navigate(`/${basePath}/human-resource/add-employee`);
    };

    const handleDisableEmployee = async () => {
        if (!employeeToDisable) return;
        
        try {
            const { error } = await supabase
                .from('employee_profiles')
                .update({ is_active: false, updated_at: new Date().toISOString() })
                .eq('id', employeeToDisable.id);
            
            if (error) throw error;
            
            toast({ title: "Employee disabled successfully" });
            fetchEmployees();
        } catch (error) {
            toast({ variant: "destructive", title: "Error disabling employee", description: error.message });
        } finally {
            setDisableDialogOpen(false);
            setEmployeeToDisable(null);
        }
    };

    const handleEnableEmployee = async (emp) => {
        try {
            const { error } = await supabase
                .from('employee_profiles')
                .update({ is_active: true, updated_at: new Date().toISOString() })
                .eq('id', emp.id);
            
            if (error) throw error;
            
            toast({ title: "Employee enabled successfully" });
            fetchEmployees();
        } catch (error) {
            toast({ variant: "destructive", title: "Error enabling employee", description: error.message });
        }
    };

    // Export to Excel/CSV
    const exportToExcel = () => {
        const headers = ['Staff ID', 'Name', 'Role', 'Department', 'Designation', 'Mobile', 'Email', 'Join Date', 'Status'];
        const rows = filteredEmployees.map(emp => [
            emp.staff_id || '-',
            emp.full_name,
            emp.role?.name || '-',
            emp.department?.name || '-',
            emp.designation?.name || '-',
            emp.mobile || emp.phone || '-',
            emp.email || '-',
            emp.date_of_joining ? formatDate(emp.date_of_joining) : '-',
            emp.is_active === false ? 'Inactive' : emp.on_leave ? 'On Leave' : 'Active'
        ]);
        
        const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `staff_directory_${new Date().toISOString().split('T')[0]}.csv`);
        link.click();
        
        toast({ title: "Export successful", description: "Staff directory exported to CSV" });
    };

    // Clear all filters
    const clearFilters = () => {
        setFilters({
            role: 'all',
            department: 'all',
            designation: 'all',
            status: 'all',
            search: ''
        });
    };

    const hasActiveFilters = filters.role !== 'all' || filters.department !== 'all' || 
                            filters.designation !== 'all' || filters.status !== 'all' || 
                            filters.search !== '';

    // Get status badge
    const getStatusBadge = (emp) => {
        if (emp.is_active === false) {
            return <Badge variant="destructive" className="text-xs">Inactive</Badge>;
        }
        if (emp.on_leave) {
            return <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">On Leave</Badge>;
        }
        return <Badge variant="default" className="text-xs bg-green-100 text-green-800">Active</Badge>;
    };

    return (
        <DashboardLayout>
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold">Staff Directory</h1>
                        <p className="text-muted-foreground">Manage and view all staff members</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {/* Export Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline">
                                    <Download className="h-4 w-4 mr-2" /> Export
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem onClick={exportToExcel}>
                                    <FileSpreadsheet className="h-4 w-4 mr-2" /> Export to CSV/Excel
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* View Toggle */}
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

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                        <CardContent className="pt-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500 rounded-lg">
                                    <Users className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-blue-700">{stats.total}</p>
                                    <p className="text-xs text-blue-600">Total Staff</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                        <CardContent className="pt-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-500 rounded-lg">
                                    <UserCheck className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-green-700">{stats.active}</p>
                                    <p className="text-xs text-green-600">Active</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
                        <CardContent className="pt-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-yellow-500 rounded-lg">
                                    <Clock className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-yellow-700">{stats.onLeave}</p>
                                    <p className="text-xs text-yellow-600">On Leave</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                        <CardContent className="pt-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-500 rounded-lg">
                                    <UserX className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-red-700">{stats.inactive}</p>
                                    <p className="text-xs text-red-600">Inactive</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                        <CardContent className="pt-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-500 rounded-lg">
                                    <Building2 className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-purple-700">{stats.deptCount}</p>
                                    <p className="text-xs text-purple-600">Departments</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Filter className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">Filters</span>
                                {hasActiveFilters && (
                                    <Badge variant="secondary" className="ml-2">
                                        {Object.values(filters).filter(v => v !== 'all' && v !== '').length} active
                                    </Badge>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                {hasActiveFilters && (
                                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                                        <X className="h-4 w-4 mr-1" /> Clear
                                    </Button>
                                )}
                                {viewMode === 'list' && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" size="sm">
                                                <Columns className="h-4 w-4 mr-2" /> Columns
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-48">
                                            <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuCheckboxItem
                                                checked={visibleColumns.staffId}
                                                onCheckedChange={(v) => setVisibleColumns({...visibleColumns, staffId: v})}
                                            >
                                                Staff ID
                                            </DropdownMenuCheckboxItem>
                                            <DropdownMenuCheckboxItem
                                                checked={visibleColumns.name}
                                                onCheckedChange={(v) => setVisibleColumns({...visibleColumns, name: v})}
                                            >
                                                Name
                                            </DropdownMenuCheckboxItem>
                                            <DropdownMenuCheckboxItem
                                                checked={visibleColumns.role}
                                                onCheckedChange={(v) => setVisibleColumns({...visibleColumns, role: v})}
                                            >
                                                Role
                                            </DropdownMenuCheckboxItem>
                                            <DropdownMenuCheckboxItem
                                                checked={visibleColumns.department}
                                                onCheckedChange={(v) => setVisibleColumns({...visibleColumns, department: v})}
                                            >
                                                Department
                                            </DropdownMenuCheckboxItem>
                                            <DropdownMenuCheckboxItem
                                                checked={visibleColumns.designation}
                                                onCheckedChange={(v) => setVisibleColumns({...visibleColumns, designation: v})}
                                            >
                                                Designation
                                            </DropdownMenuCheckboxItem>
                                            <DropdownMenuCheckboxItem
                                                checked={visibleColumns.mobile}
                                                onCheckedChange={(v) => setVisibleColumns({...visibleColumns, mobile: v})}
                                            >
                                                Mobile
                                            </DropdownMenuCheckboxItem>
                                            <DropdownMenuCheckboxItem
                                                checked={visibleColumns.email}
                                                onCheckedChange={(v) => setVisibleColumns({...visibleColumns, email: v})}
                                            >
                                                Email
                                            </DropdownMenuCheckboxItem>
                                            <DropdownMenuCheckboxItem
                                                checked={visibleColumns.joiningDate}
                                                onCheckedChange={(v) => setVisibleColumns({...visibleColumns, joiningDate: v})}
                                            >
                                                Joining Date
                                            </DropdownMenuCheckboxItem>
                                            <DropdownMenuCheckboxItem
                                                checked={visibleColumns.status}
                                                onCheckedChange={(v) => setVisibleColumns({...visibleColumns, status: v})}
                                            >
                                                Status
                                            </DropdownMenuCheckboxItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
                            <Select value={filters.status} onValueChange={(v) => setFilters({...filters, status: v})}>
                                <SelectTrigger><SelectValue placeholder="Select Status" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                    <SelectItem value="on_leave">On Leave</SelectItem>
                                </SelectContent>
                            </Select>
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    placeholder="Search name, ID, phone, email..." 
                                    className="pl-8"
                                    value={filters.search}
                                    onChange={(e) => setFilters({...filters, search: e.target.value})}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Results count */}
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        Showing {filteredEmployees.length} of {employees.length} employees
                    </p>
                </div>

                {loading ? (
                    <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8" /></div>
                ) : filteredEmployees.length === 0 ? (
                    <Card>
                        <CardContent className="p-12 text-center">
                            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold">No employees found</h3>
                            <p className="text-muted-foreground mb-4">Try adjusting your filters or add a new employee</p>
                            <Button onClick={handleAddStaff}>
                                <Plus className="h-4 w-4 mr-2" /> Add Staff
                            </Button>
                        </CardContent>
                    </Card>
                ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredEmployees.map(emp => (
                            <Card key={emp.id} className="overflow-hidden hover:shadow-lg transition-shadow group">
                                <CardContent className="p-0">
                                    <div className="bg-gradient-to-br from-primary/10 to-primary/5 h-24 relative">
                                        <div className="absolute top-2 right-2">
                                            {getStatusBadge(emp)}
                                        </div>
                                        <div className="absolute -bottom-10 left-4">
                                            {emp.photo_url ? (
                                                <img src={emp.photo_url} alt={emp.full_name} className="w-20 h-20 rounded-full border-4 border-background object-cover bg-background" />
                                            ) : (
                                                <div className="w-20 h-20 rounded-full border-4 border-background bg-muted flex items-center justify-center text-2xl font-bold text-muted-foreground">
                                                    {emp.full_name?.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                        <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="secondary" size="icon" className="h-8 w-8">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    <DropdownMenuItem onClick={() => handleViewProfile(emp.id)}>
                                                        <Eye className="h-4 w-4 mr-2" /> View Profile
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleEditProfile(emp.id)}>
                                                        <Edit className="h-4 w-4 mr-2" /> Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    {emp.is_active === false ? (
                                                        <DropdownMenuItem onClick={() => handleEnableEmployee(emp)} className="text-green-600">
                                                            <UserCheck className="h-4 w-4 mr-2" /> Enable
                                                        </DropdownMenuItem>
                                                    ) : (
                                                        <DropdownMenuItem 
                                                            onClick={() => {
                                                                setEmployeeToDisable(emp);
                                                                setDisableDialogOpen(true);
                                                            }} 
                                                            className="text-destructive"
                                                        >
                                                            <UserX className="h-4 w-4 mr-2" /> Disable
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                    <div className="pt-12 px-4 pb-4">
                                        <h3 className="font-bold text-lg truncate">{emp.full_name}</h3>
                                        <p className="text-sm text-muted-foreground mb-2">{emp.role?.name} • {emp.department?.name || 'No Dept'}</p>
                                        <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                            <Briefcase className="h-3 w-3" /> {emp.designation?.name || 'Not assigned'}
                                        </p>
                                        <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                            <span className="font-semibold">ID:</span> {emp.staff_id || '-'}
                                        </p>
                                        <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                            <Phone className="h-3 w-3" /> {emp.mobile || emp.phone || 'N/A'}
                                        </p>
                                        {emp.email && (
                                            <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1 truncate">
                                                <Mail className="h-3 w-3" /> {emp.email}
                                            </p>
                                        )}
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
                                    {visibleColumns.staffId && <TableHead>Employee ID</TableHead>}
                                    {visibleColumns.name && <TableHead>Name</TableHead>}
                                    {visibleColumns.role && <TableHead>Role</TableHead>}
                                    {visibleColumns.department && <TableHead>Department</TableHead>}
                                    {visibleColumns.designation && <TableHead>Designation</TableHead>}
                                    {visibleColumns.mobile && <TableHead>Mobile</TableHead>}
                                    {visibleColumns.email && <TableHead>Email</TableHead>}
                                    {visibleColumns.joiningDate && <TableHead>Joining Date</TableHead>}
                                    {visibleColumns.status && <TableHead>Status</TableHead>}
                                    {visibleColumns.action && <TableHead>Actions</TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredEmployees.map(emp => (
                                    <TableRow key={emp.id} className="hover:bg-muted/50">
                                        {visibleColumns.staffId && (
                                            <TableCell className="font-medium font-mono text-primary">{emp.staff_id || '-'}</TableCell>
                                        )}
                                        {visibleColumns.name && (
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {emp.photo_url ? (
                                                        <img src={emp.photo_url} alt="" className="w-8 h-8 rounded-full object-cover bg-muted" />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                                                            {emp.full_name?.charAt(0)}
                                                        </div>
                                                    )}
                                                    <span className="font-medium">{emp.full_name}</span>
                                                </div>
                                            </TableCell>
                                        )}
                                        {visibleColumns.role && <TableCell>{emp.role?.name || '-'}</TableCell>}
                                        {visibleColumns.department && <TableCell>{emp.department?.name || '-'}</TableCell>}
                                        {visibleColumns.designation && <TableCell>{emp.designation?.name || '-'}</TableCell>}
                                        {visibleColumns.mobile && <TableCell>{emp.mobile || emp.phone || 'N/A'}</TableCell>}
                                        {visibleColumns.email && <TableCell className="max-w-[150px] truncate">{emp.email || '-'}</TableCell>}
                                        {visibleColumns.joiningDate && (
                                            <TableCell>{emp.date_of_joining ? formatDate(emp.date_of_joining) : '-'}</TableCell>
                                        )}
                                        {visibleColumns.status && <TableCell>{getStatusBadge(emp)}</TableCell>}
                                        {visibleColumns.action && (
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handleViewProfile(emp.id)}>
                                                            <Eye className="h-4 w-4 mr-2" /> View Profile
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleEditProfile(emp.id)}>
                                                            <Edit className="h-4 w-4 mr-2" /> Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        {emp.is_active === false ? (
                                                            <DropdownMenuItem onClick={() => handleEnableEmployee(emp)} className="text-green-600">
                                                                <UserCheck className="h-4 w-4 mr-2" /> Enable
                                                            </DropdownMenuItem>
                                                        ) : (
                                                            <DropdownMenuItem 
                                                                onClick={() => {
                                                                    setEmployeeToDisable(emp);
                                                                    setDisableDialogOpen(true);
                                                                }} 
                                                                className="text-destructive"
                                                            >
                                                                <UserX className="h-4 w-4 mr-2" /> Disable
                                                            </DropdownMenuItem>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>

            {/* Disable Confirmation Dialog */}
            <Dialog open={disableDialogOpen} onOpenChange={setDisableDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Disable Employee</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to disable <strong>{employeeToDisable?.full_name}</strong>? 
                            They will no longer be able to log in to the system.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDisableDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDisableEmployee}>
                            Disable Employee
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
                )}
            </div>
        </DashboardLayout>
    );
};

export default StaffDirectory;
