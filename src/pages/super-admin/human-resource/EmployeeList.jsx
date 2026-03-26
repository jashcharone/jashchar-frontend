import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { PlusCircle, Search, List, LayoutGrid, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const EmployeeCard = ({ employee }) => {
    const navigate = useNavigate();
    const initial = (employee.full_name || '?').charAt(0).toUpperCase();

    return (
        <motion.div 
            layout
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
        >
            <Card className="transition-all hover:shadow-xl hover:-translate-y-1">
                <CardContent className="p-4 flex items-start space-x-4">
                     <div className="relative flex-shrink-0">
                        {employee.photo_url ? (
                            <img className="w-20 h-20 rounded-lg object-cover" alt={employee.full_name} src={employee.photo_url} />
                        ) : (
                            <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                                <span className="text-3xl font-bold text-primary">{initial}</span>
                            </div>
                        )}
                         <Button onClick={() => navigate(`/school-owner/human-resource/employee/${employee.id}`)} size="icon" className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-primary text-primary-foreground">
                            <Eye className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="flex-1 text-left">
                        <h3 className="font-bold text-md">{employee.full_name}</h3>
                        <p className="text-sm text-muted-foreground">ID: {employee.username}</p>
                        <p className="text-sm text-muted-foreground">{employee.phone}</p>
                        <p className="text-sm text-muted-foreground">{employee.location || 'N/A'}</p>
                        <div className="mt-2">
                            <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-primary-foreground bg-primary/80">
                                {employee.role?.name?.replace(/_/g, ' ') || 'N/A'}
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}

const EmployeeRow = ({ employee }) => {
    const navigate = useNavigate();
    return (
        <tr className="border-b hover:bg-muted">
            <td className="px-6 py-4 font-medium">{employee.full_name}</td>
            <td className="px-6 py-4">{employee.username}</td>
            <td className="px-6 py-4 capitalize">{employee.role?.name?.replace(/_/g, ' ')}</td>
            <td className="px-6 py-4">{employee.departments?.name || 'N/A'}</td>
            <td className="px-6 py-4">{employee.designations?.name || 'N/A'}</td>
            <td className="px-6 py-4">{employee.phone}</td>
            <td className="px-6 py-4 text-right">
                <Button variant="outline" size="sm" onClick={() => navigate(`/school-owner/human-resource/employee/${employee.id}`)}>
                    <Eye className="mr-2 h-4 w-4" /> View Profile
                </Button>
            </td>
        </tr>
    );
};

const EmployeeList = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    const [employeeList, setEmployeeList] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('card');
    const [filters, setFilters] = useState({ role_id: '', keyword: '' });
    const [displayedEmployees, setDisplayedEmployees] = useState([]);
    
    let branchId = selectedBranch?.id || user?.profile?.branch_id;
    if (!branchId) {
        branchId = sessionStorage.getItem('ma_target_branch_id');
    }

    const fetchAndSetData = async () => {
        if (!branchId) return;
        setLoading(true);

        const { data: rolesData, error: rolesError } = await supabase
            .from('roles')
            .select('id, name')
            .eq('branch_id', branchId);
        
        if (rolesError) {
            toast({ variant: 'destructive', title: 'Error fetching roles' });
            setLoading(false);
            return;
        }

        // Process roles: Filter restricted and deduplicate
        let fetchedRoles = rolesData || [];
        const restrictedRoles = ['student', 'parent', 'master_admin', 'school_owner'];
        
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

        let query = supabase
            .from('employee_profiles')
            .select(`
                id, full_name, first_name, last_name, username, phone, photo_url, location, staff_id,
                role:role_id (id, name),
                departments (name),
                designations (name)
            `)
            .eq('branch_id', branchId);
        
        const employeeRoleIds = (rolesData || []).map(r => r.id);
        if (employeeRoleIds.length > 0) {
          query = query.in('role_id', employeeRoleIds);
        }
            
        const { data: employeeData, error: employeeError } = await query;
        
        if (employeeError) {
            toast({ variant: 'destructive', title: 'Error fetching employees', description: employeeError.message });
        } else {
            // Process employees to ensure full_name is available
            const processedEmployees = (employeeData || []).map(emp => ({
                ...emp,
                full_name: emp.full_name || [emp.first_name, emp.last_name].filter(Boolean).join(' ') || 'Unknown',
                username: emp.username || emp.staff_id || 'N/A'
            }));
            setEmployeeList(processedEmployees);
            setDisplayedEmployees(processedEmployees);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchAndSetData();
    }, [user, toast, selectedBranch?.id]);

    const handleSearch = () => {
        let filtered = employeeList;

        if (filters.role_id) {
            filtered = filtered.filter(employee => employee.role?.id === filters.role_id);
        }

        if (filters.keyword) {
            const lowerKeyword = filters.keyword.toLowerCase();
            filtered = filtered.filter(employee => 
                (employee.full_name?.toLowerCase().includes(lowerKeyword) || 
                 employee.username?.toLowerCase().includes(lowerKeyword) ||
                 employee.role?.name?.toLowerCase().includes(lowerKeyword))
            );
        }
        
        setDisplayedEmployees(filtered);
    };

    return (
        <DashboardLayout>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold">Employee Directory</h1>
                <Button onClick={() => navigate('/school-owner/human-resource/employee/add')}>
                    <PlusCircle className="mr-2 h-5 w-5" /> Add Employee
                </Button>
            </div>
            
            <Card className="mb-6">
                <CardContent className="p-6">
                    <h2 className="text-xl font-bold mb-4">Select Criteria</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div className="flex-1">
                            <Label>Role</Label>
                            <Select onValueChange={(value) => setFilters(f => ({ ...f, role_id: value === 'all' ? '' : value }))}>
                                <SelectTrigger><SelectValue placeholder="Select Role" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Roles</SelectItem>
                                    {roles.map(r => <SelectItem key={r.id} value={r.id} className="capitalize">{r.name.replace(/_/g, ' ')}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex-1">
                            <Label>Search By Keyword</Label>
                            <Input
                                placeholder="Search by Name, ID, Role..."
                                onChange={(e) => setFilters(f => ({ ...f, keyword: e.target.value }))}
                            />
                        </div>
                        <Button onClick={handleSearch} className="w-full md:w-auto">
                            <Search className="mr-2 h-4 w-4" /> Search
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end items-center mb-4">
                <div className="flex items-center gap-2 p-1 rounded-lg bg-card border">
                    <Button variant={viewMode === 'card' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('card')}>
                        <LayoutGrid className="mr-2 h-4 w-4"/> Card View
                    </Button>
                    <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('list')}>
                        <List className="mr-2 h-4 w-4"/> List View
                    </Button>
                </div>
            </div>

            {loading ? <p>Loading employees...</p> : (
                <AnimatePresence mode="wait">
                    <motion.div
                        key={viewMode}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {viewMode === 'card' ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {displayedEmployees.map(employee => <EmployeeCard key={employee.id} employee={employee} />)}
                            </div>
                        ) : (
                            <Card>
                                <div className="overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3">Employee Name</th>
                                            <th scope="col" className="px-6 py-3">Employee ID</th>
                                            <th scope="col" className="px-6 py-3">Role</th>
                                            <th scope="col" className="px-6 py-3">Department</th>
                                            <th scope="col" className="px-6 py-3">Designation</th>
                                            <th scope="col" className="px-6 py-3">Phone</th>
                                            <th scope="col" className="px-6 py-3 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {displayedEmployees.map(employee => <EmployeeRow key={employee.id} employee={employee} />)}
                                    </tbody>
                                </table>
                                </div>
                            </Card>
                        )}
                        {displayedEmployees.length === 0 && <p className="text-center text-muted-foreground mt-8">No employees found.</p>}
                    </motion.div>
                </AnimatePresence>
            )}
        </DashboardLayout>
    );
};

export default EmployeeList;
