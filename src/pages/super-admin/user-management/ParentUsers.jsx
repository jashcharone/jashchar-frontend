/**
 * ═══════════════════════════════════════════════════════════════════════════════════
 * JASHCHAR ERP - PARENT USERS MANAGEMENT
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 
 * Manage parent login accounts
 * - View all parents (linked from students)
 * - Bulk create parent logins from father_phone
 * - Reset passwords
 * - Enable/Disable accounts
 * 
 * ═══════════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
    Users, KeyRound, RefreshCw, Search, 
    CheckCircle, XCircle, Phone, UserPlus,
    Lock, ChevronLeft, ChevronRight, User
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import api from '@/lib/api';

const ParentUsers = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const { toast } = useToast();
    const { organizationId } = useAuth();
    const { branches, selectedBranch } = useBranch();

    // State
    const [studentsWithParents, setStudentsWithParents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [classes, setClasses] = useState([]);
    
    // Pagination
    const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 50, totalPages: 0 });
    
    // Filters
    const [filters, setFilters] = useState({
        branch_id: searchParams.get('branch_id') || 'all',
        class_id: searchParams.get('class_id') || 'all',
        parent_has_login: searchParams.get('parent_has_login') || 'all',
        search: searchParams.get('search') || ''
    });

    // Dialogs
    const [createLoginDialog, setCreateLoginDialog] = useState(false);
    const [resetPasswordDialog, setResetPasswordDialog] = useState(false);
    const [defaultPassword, setDefaultPassword] = useState('parent123');
    const [processing, setProcessing] = useState(false);

    // Fetch classes when branch changes
    useEffect(() => {
        const fetchClasses = async () => {
            if (!filters.branch_id || filters.branch_id === 'all') {
                setClasses([]);
                return;
            }
            try {
                const response = await api.get(`/academics/classes?branchId=${filters.branch_id}`);
                if (response.data.success) {
                    setClasses(response.data.data || []);
                }
            } catch (error) {
                console.error('Failed to fetch classes:', error);
            }
        };
        fetchClasses();
    }, [filters.branch_id]);

    // Fetch students with parent info
    const fetchStudentsWithParents = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.branch_id && filters.branch_id !== 'all') params.append('branch_id', filters.branch_id);
            if (filters.class_id && filters.class_id !== 'all') params.append('class_id', filters.class_id);
            if (filters.search) params.append('search', filters.search);
            params.append('page', pagination.page);
            params.append('limit', pagination.limit);

            // Fetch students - parent login info will be derived from father_phone
            const response = await api.get(`/user-management/students?${params.toString()}`);
            if (response.data.success) {
                // Filter and transform to show parent info
                const studentsData = response.data.data.map(student => ({
                    ...student,
                    parent_phone: student.father_phone || student.mother_phone,
                    parent_name: student.father_name || student.mother_name || `Parent of ${student.first_name}`,
                    parent_has_login: false // Will need a separate query or flag
                }));
                
                setStudentsWithParents(studentsData);
                setPagination(response.data.pagination);
            }
        } catch (error) {
            console.error('Failed to fetch students:', error);
            toast({ title: 'Error', description: 'Failed to fetch data', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    }, [filters, pagination.page, pagination.limit]);

    useEffect(() => {
        fetchStudentsWithParents();
    }, [fetchStudentsWithParents]);

    // Handle select all
    const handleSelectAll = (checked) => {
        if (checked) {
            setSelectedStudents(studentsWithParents.map(s => s.id));
        } else {
            setSelectedStudents([]);
        }
    };

    // Handle individual select
    const handleSelectStudent = (studentId, checked) => {
        if (checked) {
            setSelectedStudents(prev => [...prev, studentId]);
        } else {
            setSelectedStudents(prev => prev.filter(id => id !== studentId));
        }
    };

    // Bulk create parent logins
    const handleBulkCreateParentLogins = async () => {
        const studentsWithPhone = studentsWithParents
            .filter(s => selectedStudents.includes(s.id) && s.parent_phone)
            .map(s => s.id);

        if (studentsWithPhone.length === 0) {
            toast({ 
                title: 'Info', 
                description: 'No selected students have parent phone numbers', 
                variant: 'default' 
            });
            return;
        }

        setProcessing(true);
        try {
            const response = await api.post('/user-management/parents/bulk-create-logins', {
                student_ids: studentsWithPhone,
                default_password: defaultPassword
            });

            if (response.data.success) {
                const { created, failed, skipped } = response.data.data;
                toast({
                    title: 'Success',
                    description: `Created ${created} parent logins${failed > 0 ? `, ${failed} failed` : ''}${skipped > 0 ? `, ${skipped} skipped (already exist)` : ''}`,
                    variant: created > 0 ? 'default' : 'destructive'
                });
                setCreateLoginDialog(false);
                setSelectedStudents([]);
                fetchStudentsWithParents();
            }
        } catch (error) {
            console.error('Failed to create parent logins:', error);
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setProcessing(false);
        }
    };

    const studentsWithParentPhone = studentsWithParents.filter(
        s => selectedStudents.includes(s.id) && s.parent_phone
    ).length;

    return (
        <DashboardLayout>
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Users className="h-6 w-6 text-primary" />
                        Parent Users
                    </h1>
                    <p className="text-muted-foreground">Manage parent login accounts based on student records</p>
                </div>
            </div>

            {/* Info Card */}
            <Card className="border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30">
                <CardContent className="py-4">
                    <div className="flex items-start gap-3">
                        <div className="bg-emerald-100 dark:bg-emerald-900/50 p-2 rounded-full">
                            <Phone className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <p className="font-medium text-emerald-800 dark:text-emerald-400">Parent Login = Father/Mother Phone</p>
                            <p className="text-emerald-600 dark:text-emerald-300 text-sm">
                                Parent accounts are created using the father_phone or mother_phone from student records.
                                Username will be the phone number.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <Select 
                            value={filters.branch_id} 
                            onValueChange={(v) => setFilters(prev => ({ ...prev, branch_id: v, class_id: 'all' }))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select Branch" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Branches</SelectItem>
                                {branches?.map(b => (
                                    <SelectItem key={b.id} value={b.id}>{b.branch_name || b.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select 
                            value={filters.class_id} 
                            onValueChange={(v) => setFilters(prev => ({ ...prev, class_id: v }))}
                            disabled={!filters.branch_id || filters.branch_id === 'all'}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select Class" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Classes</SelectItem>
                                {classes.map(c => (
                                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select 
                            value={filters.parent_has_login} 
                            onValueChange={(v) => setFilters(prev => ({ ...prev, parent_has_login: v }))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Parent Login Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                <SelectItem value="true">Parent Has Login</SelectItem>
                                <SelectItem value="false">Parent No Login</SelectItem>
                            </SelectContent>
                        </Select>

                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search student/parent..."
                                value={filters.search}
                                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                                className="pl-9"
                            />
                        </div>

                        <Button onClick={fetchStudentsWithParents} variant="outline">
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Actions Bar */}
            {selectedStudents.length > 0 && (
                <Card className="border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30">
                    <CardContent className="py-3">
                        <div className="flex items-center justify-between">
                            <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                                {selectedStudents.length} students selected
                                {studentsWithParentPhone > 0 && ` (${studentsWithParentPhone} with parent phone)`}
                            </span>
                            <div className="flex gap-2">
                                {studentsWithParentPhone > 0 && (
                                    <Button 
                                        size="sm" 
                                        className="bg-emerald-600 hover:bg-emerald-700"
                                        onClick={() => setCreateLoginDialog(true)}
                                    >
                                        <UserPlus className="h-4 w-4 mr-2" />
                                        Create Parent Logins ({studentsWithParentPhone})
                                    </Button>
                                )}
                                <Button 
                                    size="sm" 
                                    variant="ghost"
                                    onClick={() => setSelectedStudents([])}
                                >
                                    Clear Selection
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Students/Parents Table */}
            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-muted/50 border-b">
                                <tr>
                                    <th className="p-3 text-left">
                                        <Checkbox
                                            checked={selectedStudents.length === studentsWithParents.length && studentsWithParents.length > 0}
                                            onCheckedChange={handleSelectAll}
                                        />
                                    </th>
                                    <th className="p-3 text-left text-sm font-medium text-muted-foreground">Student</th>
                                    <th className="p-3 text-left text-sm font-medium text-muted-foreground">Class</th>
                                    <th className="p-3 text-left text-sm font-medium text-muted-foreground">Father Name</th>
                                    <th className="p-3 text-left text-sm font-medium text-muted-foreground">Father Phone</th>
                                    <th className="p-3 text-left text-sm font-medium text-muted-foreground">Mother Name</th>
                                    <th className="p-3 text-left text-sm font-medium text-muted-foreground">Mother Phone</th>
                                    <th className="p-3 text-left text-sm font-medium text-muted-foreground">Parent Login</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {loading ? (
                                    <tr>
                                        <td colSpan={8} className="p-8 text-center">
                                            <RefreshCw className="h-6 w-6 animate-spin mx-auto text-emerald-500" />
                                        </td>
                                    </tr>
                                ) : studentsWithParents.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="p-8 text-center text-muted-foreground">
                                            No students found
                                        </td>
                                    </tr>
                                ) : (
                                    studentsWithParents.map((student) => (
                                        <tr key={student.id} className="hover:bg-muted/50">
                                            <td className="p-3">
                                                <Checkbox
                                                    checked={selectedStudents.includes(student.id)}
                                                    onCheckedChange={(checked) => handleSelectStudent(student.id, checked)}
                                                />
                                            </td>
                                            <td className="p-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-muted overflow-hidden">
                                                        {student.photo_url ? (
                                                            <img src={student.photo_url} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                                                <User className="h-4 w-4" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium">{student.first_name} {student.last_name}</div>
                                                        <div className="text-xs text-muted-foreground">{student.school_code}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-3 text-sm">
                                                {student.class_name} - {student.section_name}
                                            </td>
                                            <td className="p-3 text-sm">{student.father_name || '-'}</td>
                                            <td className="p-3">
                                                {student.father_phone ? (
                                                    <div className="flex items-center gap-1">
                                                        <Phone className="h-3 w-3 text-muted-foreground" />
                                                        <code className="bg-muted px-2 py-1 rounded text-sm">
                                                            {student.father_phone}
                                                        </code>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </td>
                                            <td className="p-3 text-sm">{student.mother_name || '-'}</td>
                                            <td className="p-3">
                                                {student.mother_phone ? (
                                                    <div className="flex items-center gap-1">
                                                        <Phone className="h-3 w-3 text-muted-foreground" />
                                                        <code className="bg-muted px-2 py-1 rounded text-sm">
                                                            {student.mother_phone}
                                                        </code>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </td>
                                            <td className="p-3">
                                                {student.parent_phone ? (
                                                    student.parent_has_login ? (
                                                        <Badge className="bg-green-100 text-green-700">
                                                            <CheckCircle className="h-3 w-3 mr-1" />
                                                            Has Login
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-orange-600 border-orange-300">
                                                            <XCircle className="h-3 w-3 mr-1" />
                                                            No Login
                                                        </Badge>
                                                    )
                                                ) : (
                                                    <Badge variant="outline" className="text-gray-400 border-gray-200">
                                                        No Phone
                                                    </Badge>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between p-4 border-t">
                        <div className="text-sm text-muted-foreground">
                            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={pagination.page <= 1}
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                            >
                                <ChevronLeft className="h-4 w-4" />
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={pagination.page >= pagination.totalPages}
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                            >
                                Next
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Create Parent Login Dialog */}
            <Dialog open={createLoginDialog} onOpenChange={setCreateLoginDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <UserPlus className="h-5 w-5 text-emerald-500" />
                            Create Parent Logins
                        </DialogTitle>
                        <DialogDescription>
                            Create login accounts for {studentsWithParentPhone} parents using their phone numbers.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-lg text-sm border border-emerald-200 dark:border-emerald-800">
                            <p className="font-medium text-emerald-700 dark:text-emerald-400">How it works:</p>
                            <ul className="list-disc list-inside text-emerald-600 dark:text-emerald-300 mt-1 space-y-1">
                                <li>Username = Father phone (or Mother phone if father's not available)</li>
                                <li>Parent can login and see linked student(s)</li>
                                <li>Multiple students with same parent phone will be linked</li>
                            </ul>
                        </div>

                        <div className="space-y-2">
                            <Label>Default Password</Label>
                            <Input
                                value={defaultPassword}
                                onChange={(e) => setDefaultPassword(e.target.value)}
                                placeholder="Enter default password"
                            />
                            <p className="text-xs text-muted-foreground">
                                Parents will use this password for first login.
                            </p>
                        </div>

                        <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg text-sm border border-blue-200 dark:border-blue-800">
                            <p className="font-medium text-blue-700 dark:text-blue-400">Login Credentials:</p>
                            <p className="text-blue-600 dark:text-blue-300">Username: Parent Phone Number</p>
                            <p className="text-blue-600 dark:text-blue-300">Password: {defaultPassword}</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateLoginDialog(false)}>
                            Cancel
                        </Button>
                        <Button 
                            className="bg-emerald-600 hover:bg-emerald-700"
                            onClick={handleBulkCreateParentLogins}
                            disabled={processing}
                        >
                            {processing ? (
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <UserPlus className="h-4 w-4 mr-2" />
                            )}
                            Create {studentsWithParentPhone} Parent Logins
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
        </DashboardLayout>
    );
};

export default ParentUsers;
