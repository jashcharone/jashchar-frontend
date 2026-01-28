/**
 * Employee List V2 - Using new employees table
 * Complete HR employee management with salary, attendance, leave integration
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';
import hrApi from '@/services/hrApi';
import { Plus, Search, Eye, Edit, Trash2, Download, Filter, Users, Building, Briefcase, Phone, Mail, Calendar, IndianRupee, FileText, RefreshCw } from 'lucide-react';

const EmployeeListV2 = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { toast } = useToast();
    
    const [employees, setEmployees] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [designations, setDesignations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('active');
    const [departmentFilter, setDepartmentFilter] = useState('all');
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [showDetails, setShowDetails] = useState(false);
    
    const organizationId = user?.organization_id;
    const branchId = user?.branch_id;
    
    useEffect(() => {
        if (organizationId) {
            fetchData();
        }
    }, [organizationId, branchId, statusFilter, departmentFilter]);
    
    const fetchData = async () => {
        setLoading(true);
        try {
            const params = { organizationId };
            if (branchId) params.branchId = branchId;
            if (statusFilter !== 'all') params.status = statusFilter;
            if (departmentFilter !== 'all') params.departmentId = departmentFilter;
            
            const [empRes, deptRes, desigRes] = await Promise.all([
                hrApi.getEmployees(params),
                hrApi.getHrDepartments({ organizationId }),
                hrApi.getHrDesignations({ organizationId })
            ]);
            
            setEmployees(empRes.data?.data || []);
            setDepartments(deptRes.data?.data || []);
            setDesignations(desigRes.data?.data || []);
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to load employees', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };
    
    const filteredEmployees = employees.filter(emp => {
        const searchLower = searchTerm.toLowerCase();
        return (
            emp.emp_code?.toLowerCase().includes(searchLower) ||
            emp.first_name?.toLowerCase().includes(searchLower) ||
            emp.last_name?.toLowerCase().includes(searchLower) ||
            emp.email?.toLowerCase().includes(searchLower) ||
            emp.mobile?.includes(searchTerm)
        );
    });
    
    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this employee?')) return;
        
        try {
            await hrApi.deleteEmployee(id);
            toast({ title: 'Success', description: 'Employee deleted successfully' });
            fetchData();
        } catch (error) {
            toast({ title: 'Error', description: error.response?.data?.message || 'Failed to delete', variant: 'destructive' });
        }
    };
    
    const getStatusBadge = (status) => {
        const colors = {
            active: 'bg-green-100 text-green-800',
            resigned: 'bg-yellow-100 text-yellow-800',
            terminated: 'bg-red-100 text-red-800',
            on_notice: 'bg-orange-100 text-orange-800'
        };
        return <Badge className={colors[status] || 'bg-gray-100'}>{status?.replace('_', ' ')}</Badge>;
    };
    
    const stats = {
        total: employees.length,
        active: employees.filter(e => e.status === 'active').length,
        onLeave: employees.filter(e => e.status === 'on_leave').length,
        resigned: employees.filter(e => e.status === 'resigned').length
    };
    
    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Employee Directory</h1>
                    <p className="text-gray-500">Manage all employees in your organization</p>
                </div>
                <Button onClick={() => navigate('/super-admin/human-resource/add-employee-v2')}>
                    <Plus className="w-4 h-4 mr-2" /> Add Employee
                </Button>
            </div>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Total Employees</p>
                                <p className="text-2xl font-bold">{stats.total}</p>
                            </div>
                            <Users className="w-8 h-8 text-blue-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Active</p>
                                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                            </div>
                            <Briefcase className="w-8 h-8 text-green-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">On Leave</p>
                                <p className="text-2xl font-bold text-yellow-600">{stats.onLeave}</p>
                            </div>
                            <Calendar className="w-8 h-8 text-yellow-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Resigned</p>
                                <p className="text-2xl font-bold text-red-600">{stats.resigned}</p>
                            </div>
                            <FileText className="w-8 h-8 text-red-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>
            
            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-wrap gap-4">
                        <div className="flex-1 min-w-[200px]">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <Input
                                    placeholder="Search by name, code, email, phone..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="resigned">Resigned</SelectItem>
                                <SelectItem value="terminated">Terminated</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Department" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Departments</SelectItem>
                                {departments.map(dept => (
                                    <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button variant="outline" onClick={fetchData}>
                            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
                        </Button>
                    </div>
                </CardContent>
            </Card>
            
            {/* Employee Table */}
            <Card>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <RefreshCw className="w-6 h-6 animate-spin" />
                        </div>
                    ) : filteredEmployees.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                            <Users className="w-12 h-12 mb-4" />
                            <p>No employees found</p>
                            <Button variant="link" onClick={() => navigate('/super-admin/human-resource/add-employee-v2')}>
                                Add your first employee
                            </Button>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Employee</TableHead>
                                    <TableHead>Code</TableHead>
                                    <TableHead>Department</TableHead>
                                    <TableHead>Designation</TableHead>
                                    <TableHead>Contact</TableHead>
                                    <TableHead>Joining Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredEmployees.map((emp) => (
                                    <TableRow key={emp.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar>
                                                    <AvatarImage src={emp.photo_url} />
                                                    <AvatarFallback>
                                                        {emp.first_name?.[0]}{emp.last_name?.[0]}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium">{emp.first_name} {emp.last_name}</p>
                                                    <p className="text-sm text-gray-500">{emp.email}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{emp.emp_code}</Badge>
                                        </TableCell>
                                        <TableCell>{emp.department?.name || '-'}</TableCell>
                                        <TableCell>{emp.designation?.name || '-'}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Phone className="w-3 h-3 text-gray-400" />
                                                <span className="text-sm">{emp.mobile || '-'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {emp.joining_date ? new Date(emp.joining_date).toLocaleDateString('en-IN') : '-'}
                                        </TableCell>
                                        <TableCell>{getStatusBadge(emp.status)}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedEmployee(emp);
                                                        setShowDetails(true);
                                                    }}
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm"
                                                    onClick={() => navigate(`/super-admin/human-resource/edit-employee-v2/${emp.id}`)}
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm"
                                                    onClick={() => handleDelete(emp.id)}
                                                    className="text-red-600 hover:text-red-700"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
            
            {/* Employee Details Dialog */}
            <Dialog open={showDetails} onOpenChange={setShowDetails}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Employee Details</DialogTitle>
                    </DialogHeader>
                    {selectedEmployee && (
                        <Tabs defaultValue="basic">
                            <TabsList>
                                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                                <TabsTrigger value="employment">Employment</TabsTrigger>
                                <TabsTrigger value="bank">Bank Details</TabsTrigger>
                                <TabsTrigger value="compliance">Compliance</TabsTrigger>
                            </TabsList>
                            <TabsContent value="basic" className="space-y-4 mt-4">
                                <div className="flex items-center gap-4">
                                    <Avatar className="w-20 h-20">
                                        <AvatarImage src={selectedEmployee.photo_url} />
                                        <AvatarFallback className="text-2xl">
                                            {selectedEmployee.first_name?.[0]}{selectedEmployee.last_name?.[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h3 className="text-xl font-bold">{selectedEmployee.first_name} {selectedEmployee.last_name}</h3>
                                        <p className="text-gray-500">{selectedEmployee.emp_code}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><span className="text-gray-500">Email:</span> {selectedEmployee.email || '-'}</div>
                                    <div><span className="text-gray-500">Mobile:</span> {selectedEmployee.mobile || '-'}</div>
                                    <div><span className="text-gray-500">Gender:</span> {selectedEmployee.gender || '-'}</div>
                                    <div><span className="text-gray-500">DOB:</span> {selectedEmployee.dob ? new Date(selectedEmployee.dob).toLocaleDateString() : '-'}</div>
                                    <div><span className="text-gray-500">Blood Group:</span> {selectedEmployee.blood_group || '-'}</div>
                                    <div><span className="text-gray-500">Emergency Contact:</span> {selectedEmployee.emergency_contact || '-'}</div>
                                    <div className="col-span-2"><span className="text-gray-500">Address:</span> {selectedEmployee.current_address || '-'}</div>
                                </div>
                            </TabsContent>
                            <TabsContent value="employment" className="space-y-4 mt-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div><span className="text-gray-500">Department:</span> {selectedEmployee.department?.name || '-'}</div>
                                    <div><span className="text-gray-500">Designation:</span> {selectedEmployee.designation?.name || '-'}</div>
                                    <div><span className="text-gray-500">Employment Type:</span> {selectedEmployee.employment_type || '-'}</div>
                                    <div><span className="text-gray-500">Joining Date:</span> {selectedEmployee.joining_date ? new Date(selectedEmployee.joining_date).toLocaleDateString() : '-'}</div>
                                    <div><span className="text-gray-500">Confirmation Date:</span> {selectedEmployee.confirmation_date ? new Date(selectedEmployee.confirmation_date).toLocaleDateString() : '-'}</div>
                                    <div><span className="text-gray-500">Status:</span> {getStatusBadge(selectedEmployee.status)}</div>
                                    <div><span className="text-gray-500">Reports To:</span> {selectedEmployee.reporting_manager ? `${selectedEmployee.reporting_manager.first_name} ${selectedEmployee.reporting_manager.last_name}` : '-'}</div>
                                </div>
                            </TabsContent>
                            <TabsContent value="bank" className="space-y-4 mt-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div><span className="text-gray-500">Bank Name:</span> {selectedEmployee.bank_name || '-'}</div>
                                    <div><span className="text-gray-500">Account No:</span> {selectedEmployee.bank_account_no || '-'}</div>
                                    <div><span className="text-gray-500">IFSC Code:</span> {selectedEmployee.ifsc_code || '-'}</div>
                                </div>
                            </TabsContent>
                            <TabsContent value="compliance" className="space-y-4 mt-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div><span className="text-gray-500">PAN Number:</span> {selectedEmployee.pan_number || '-'}</div>
                                    <div><span className="text-gray-500">Aadhaar:</span> {selectedEmployee.aadhaar_number || '-'}</div>
                                    <div><span className="text-gray-500">UAN (PF):</span> {selectedEmployee.uan_number || '-'}</div>
                                    <div><span className="text-gray-500">ESI Number:</span> {selectedEmployee.esi_number || '-'}</div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default EmployeeListV2;
