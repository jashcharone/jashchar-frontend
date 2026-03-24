/**
 * Attendance Management V2 - Using attendance_logs table
 * Daily attendance marking and viewing
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatLongDate } from '@/utils/dateUtils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';
import hrApi from '@/services/hrApi';
import { Calendar, Clock, CheckCircle2, XCircle, AlertCircle, Users, Save } from 'lucide-react';

const AttendanceV2 = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    
    const [loading, setLoading] = useState(false);
    const [employees, setEmployees] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [attendanceData, setAttendanceData] = useState([]);
    const [attendanceMap, setAttendanceMap] = useState({});
    
    const organizationId = user?.organization_id;
    const branchId = user?.branch_id;
    
    const [filters, setFilters] = useState({
        date: new Date().toISOString().split('T')[0],
        departmentId: ''
    });
    
    const [stats, setStats] = useState({
        total: 0,
        present: 0,
        absent: 0,
        halfDay: 0,
        leave: 0,
        notMarked: 0
    });
    
    useEffect(() => {
        if (organizationId) {
            fetchDepartments();
            fetchEmployees();
        }
    }, [organizationId]);
    
    useEffect(() => {
        if (employees.length > 0) {
            fetchAttendance();
        }
    }, [filters.date, employees]);
    
    const fetchDepartments = async () => {
        try {
            const res = await hrApi.getHrDepartments({ organizationId });
            setDepartments(res.data?.data || []);
        } catch (error) {
            console.error('Error fetching departments:', error);
        }
    };
    
    const fetchEmployees = async () => {
        try {
            const res = await hrApi.getEmployees({ 
                organizationId, 
                status: 'active',
                departmentId: filters.departmentId || undefined
            });
            setEmployees(res.data?.data || []);
        } catch (error) {
            console.error('Error fetching employees:', error);
        }
    };
    
    const fetchAttendance = async () => {
        try {
            const res = await hrApi.getAttendanceLogs({ 
                organizationId,
                date: filters.date
            });
            const logs = res.data?.data || [];
            setAttendanceData(logs);
            
            // Create map for quick lookup
            const map = {};
            logs.forEach(log => {
                map[log.employee_id] = log;
            });
            setAttendanceMap(map);
            
            // Calculate stats
            const present = logs.filter(l => l.status === 'present').length;
            const absent = logs.filter(l => l.status === 'absent').length;
            const halfDay = logs.filter(l => l.status === 'half_day').length;
            const leave = logs.filter(l => l.status === 'on_leave').length;
            
            setStats({
                total: employees.length,
                present,
                absent,
                halfDay,
                leave,
                notMarked: employees.length - logs.length
            });
        } catch (error) {
            console.error('Error fetching attendance:', error);
        }
    };
    
    const handleMarkAttendance = async (employeeId, status, checkIn = null, checkOut = null) => {
        try {
            const payload = {
                organizationId,
                branchId,
                employeeId,
                date: filters.date,
                status,
                checkIn: checkIn || (status === 'present' ? '09:00:00' : null),
                checkOut: checkOut || null
            };
            
            await hrApi.markAttendance(payload);
            
            toast({ title: 'Success', description: 'Attendance marked successfully' });
            fetchAttendance();
        } catch (error) {
            toast({ 
                title: 'Error', 
                description: error.response?.data?.message || 'Failed to mark attendance', 
                variant: 'destructive' 
            });
        }
    };
    
    const handleBulkMark = async (status) => {
        setLoading(true);
        try {
            // Mark all unmarked employees
            const unmarked = employees.filter(emp => !attendanceMap[emp.id]);
            
            for (const emp of unmarked) {
                await hrApi.markAttendance({
                    organizationId,
                    branchId,
                    employeeId: emp.id,
                    date: filters.date,
                    status,
                    checkIn: status === 'present' ? '09:00:00' : null
                });
            }
            
            toast({ title: 'Success', description: `Marked ${unmarked.length} employees as ${status}` });
            fetchAttendance();
        } catch (error) {
            toast({ title: 'Error', description: 'Some attendance marking failed', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };
    
    const getStatusBadge = (status) => {
        const variants = {
            present: { color: 'bg-green-100 text-green-800', icon: CheckCircle2, label: 'Present' },
            absent: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Absent' },
            half_day: { color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle, label: 'Half Day' },
            on_leave: { color: 'bg-blue-100 text-blue-800', icon: Calendar, label: 'On Leave' },
            late: { color: 'bg-orange-100 text-orange-800', icon: Clock, label: 'Late' }
        };
        const config = variants[status] || variants.absent;
        const Icon = config.icon;
        
        return (
            <Badge className={config.color}>
                <Icon className="w-3 h-3 mr-1" />
                {config.label}
            </Badge>
        );
    };
    
    const filteredEmployees = filters.departmentId 
        ? employees.filter(e => e.department_id === filters.departmentId)
        : employees;
    
    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Daily Attendance</h1>
                    <p className="text-gray-500">Mark and manage employee attendance</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button 
                        variant="outline" 
                        onClick={() => handleBulkMark('present')}
                        disabled={loading || stats.notMarked === 0}
                    >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Mark All Present
                    </Button>
                </div>
            </div>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Total</p>
                                <p className="text-2xl font-bold">{stats.total}</p>
                            </div>
                            <Users className="w-8 h-8 text-gray-400" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Present</p>
                                <p className="text-2xl font-bold text-green-600">{stats.present}</p>
                            </div>
                            <CheckCircle2 className="w-8 h-8 text-green-400" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Absent</p>
                                <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
                            </div>
                            <XCircle className="w-8 h-8 text-red-400" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Half Day</p>
                                <p className="text-2xl font-bold text-yellow-600">{stats.halfDay}</p>
                            </div>
                            <AlertCircle className="w-8 h-8 text-yellow-400" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">On Leave</p>
                                <p className="text-2xl font-bold text-blue-600">{stats.leave}</p>
                            </div>
                            <Calendar className="w-8 h-8 text-blue-400" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Not Marked</p>
                                <p className="text-2xl font-bold text-gray-600">{stats.notMarked}</p>
                            </div>
                            <Clock className="w-8 h-8 text-gray-400" />
                        </div>
                    </CardContent>
                </Card>
            </div>
            
            {/* Filters */}
            <Card>
                <CardContent className="pt-4">
                    <div className="flex flex-wrap items-end gap-4">
                        <div className="space-y-2">
                            <Label>Date</Label>
                            <Input
                                type="date"
                                value={filters.date}
                                onChange={(e) => setFilters(prev => ({ ...prev, date: e.target.value }))}
                                className="w-48"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Department</Label>
                            <Select 
                                value={filters.departmentId} 
                                onValueChange={(v) => setFilters(prev => ({ ...prev, departmentId: v === 'all' ? '' : v }))}
                            >
                                <SelectTrigger className="w-48">
                                    <SelectValue placeholder="All Departments" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Departments</SelectItem>
                                    {departments.map(dept => (
                                        <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>
            
            {/* Attendance Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Employee Attendance - {formatLongDate(new Date(filters.date))}</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Employee</TableHead>
                                <TableHead>Department</TableHead>
                                <TableHead>Check In</TableHead>
                                <TableHead>Check Out</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredEmployees.map(emp => {
                                const log = attendanceMap[emp.id];
                                return (
                                    <TableRow key={emp.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                                    {emp.profile_photo ? (
                                                        <img src={emp.profile_photo} alt="" className="w-10 h-10 rounded-full object-cover" />
                                                    ) : (
                                                        <span className="text-sm font-medium">
                                                            {emp.first_name?.[0]}{emp.last_name?.[0]}
                                                        </span>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium">{emp.first_name} {emp.last_name}</p>
                                                    <p className="text-sm text-gray-500">{emp.emp_code}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {emp.hr_departments?.name || '-'}
                                        </TableCell>
                                        <TableCell>
                                            {log?.check_in ? new Date(`2000-01-01T${log.check_in}`).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '-'}
                                        </TableCell>
                                        <TableCell>
                                            {log?.check_out ? new Date(`2000-01-01T${log.check_out}`).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '-'}
                                        </TableCell>
                                        <TableCell>
                                            {log ? getStatusBadge(log.status) : (
                                                <Badge variant="outline">Not Marked</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    size="sm"
                                                    variant={log?.status === 'present' ? 'default' : 'outline'}
                                                    onClick={() => handleMarkAttendance(emp.id, 'present')}
                                                    className="h-8 w-8 p-0"
                                                    title="Present"
                                                >
                                                    <CheckCircle2 className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant={log?.status === 'absent' ? 'destructive' : 'outline'}
                                                    onClick={() => handleMarkAttendance(emp.id, 'absent')}
                                                    className="h-8 w-8 p-0"
                                                    title="Absent"
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant={log?.status === 'half_day' ? 'secondary' : 'outline'}
                                                    onClick={() => handleMarkAttendance(emp.id, 'half_day')}
                                                    className="h-8 w-8 p-0"
                                                    title="Half Day"
                                                >
                                                    <AlertCircle className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant={log?.status === 'on_leave' ? 'secondary' : 'outline'}
                                                    onClick={() => handleMarkAttendance(emp.id, 'on_leave')}
                                                    className="h-8 w-8 p-0"
                                                    title="On Leave"
                                                >
                                                    <Calendar className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {filteredEmployees.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                        No employees found
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};

export default AttendanceV2;
