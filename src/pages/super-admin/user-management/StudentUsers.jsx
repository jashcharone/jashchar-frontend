/**
 * ═══════════════════════════════════════════════════════════════════════════════════
 * JASHCHAR ERP - STUDENT USERS MANAGEMENT
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 
 * Manage student login accounts
 * - View all students with/without login
 * - Bulk create logins
 * - Reset passwords
 * - Enable/Disable accounts
 * 
 * ═══════════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
    GraduationCap, KeyRound, RefreshCw, Search, 
    CheckCircle, XCircle, Filter, Download, Send,
    Eye, Lock, Unlock, ChevronLeft, ChevronRight
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
import { supabase } from '@/lib/supabaseClient';

const StudentUsers = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const { toast } = useToast();
    const { organizationId } = useAuth();
    const { branches, selectedBranch } = useBranch();

    // State
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [classes, setClasses] = useState([]);
    const [sections, setSections] = useState([]);
    
    // Pagination
    const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 50, totalPages: 0 });
    
    // Filters
    const [filters, setFilters] = useState({
        branch_id: searchParams.get('branch_id') || 'all',
        class_id: searchParams.get('class_id') || 'all',
        section_id: searchParams.get('section_id') || 'all',
        has_login: searchParams.get('has_login') || 'all',
        search: searchParams.get('search') || ''
    });

    // Dialogs
    const [createLoginDialog, setCreateLoginDialog] = useState(false);
    const [resetPasswordDialog, setResetPasswordDialog] = useState(false);
    const [defaultPassword, setDefaultPassword] = useState('123456');
    const [processing, setProcessing] = useState(false);

    // Fetch students
    const fetchStudents = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.branch_id && filters.branch_id !== 'all') params.append('branch_id', filters.branch_id);
            if (filters.class_id && filters.class_id !== 'all') params.append('class_id', filters.class_id);
            if (filters.section_id && filters.section_id !== 'all') params.append('section_id', filters.section_id);
            if (filters.has_login !== 'all') params.append('has_login', filters.has_login);
            if (filters.search) params.append('search', filters.search);
            params.append('page', pagination.page);
            params.append('limit', pagination.limit);

            const response = await api.get(`/user-management/students?${params.toString()}`);
            if (response.data.success) {
                setStudents(response.data.data);
                setPagination(response.data.pagination);
            }
        } catch (error) {
            console.error('Failed to fetch students:', error);
            toast({ title: 'Error', description: 'Failed to fetch students', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    }, [filters, pagination.page, pagination.limit]);

    // Fetch classes
    const fetchClasses = async (branchId) => {
        if (!branchId) return;
        try {
            const { data } = await supabase
                .from('classes')
                .select('id, name')
                .eq('branch_id', branchId)
                .order('sort_order');
            setClasses(data || []);
        } catch (error) {
            console.error('Failed to fetch classes:', error);
        }
    };

    // Fetch sections
    const fetchSections = async (classId) => {
        if (!classId) return;
        try {
            const { data } = await supabase
                .from('sections')
                .select('id, name')
                .eq('class_id', classId)
                .order('name');
            setSections(data || []);
        } catch (error) {
            console.error('Failed to fetch sections:', error);
        }
    };

    useEffect(() => {
        fetchStudents();
    }, [fetchStudents]);

    useEffect(() => {
        if (filters.branch_id && filters.branch_id !== 'all') {
            fetchClasses(filters.branch_id);
        } else {
            setClasses([]);
        }
    }, [filters.branch_id]);

    useEffect(() => {
        if (filters.class_id && filters.class_id !== 'all') {
            fetchSections(filters.class_id);
        } else {
            setSections([]);
        }
    }, [filters.class_id]);

    // Handle select all
    const handleSelectAll = (checked) => {
        if (checked) {
            setSelectedStudents(students.map(s => s.id));
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

    // Bulk create logins
    const handleBulkCreateLogins = async () => {
        const studentsWithoutLogin = students
            .filter(s => selectedStudents.includes(s.id) && !s.has_login)
            .map(s => s.id);

        if (studentsWithoutLogin.length === 0) {
            toast({ title: 'Info', description: 'All selected students already have login', variant: 'default' });
            return;
        }

        setProcessing(true);
        try {
            const response = await api.post('/user-management/students/bulk-create-logins', {
                student_ids: studentsWithoutLogin,
                default_password: defaultPassword
            });

            if (response.data.success) {
                const { created, failed } = response.data.data;
                toast({
                    title: 'Success',
                    description: `Created ${created} logins${failed > 0 ? `, ${failed} failed` : ''}`,
                    variant: created > 0 ? 'default' : 'destructive'
                });
                setCreateLoginDialog(false);
                setSelectedStudents([]);
                fetchStudents();
            }
        } catch (error) {
            console.error('Failed to create logins:', error);
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setProcessing(false);
        }
    };

    // Bulk reset passwords
    const handleBulkResetPasswords = async () => {
        const studentsWithLogin = students
            .filter(s => selectedStudents.includes(s.id) && s.has_login)
            .map(s => s.user_id);

        if (studentsWithLogin.length === 0) {
            toast({ title: 'Info', description: 'None of the selected students have login to reset', variant: 'default' });
            return;
        }

        setProcessing(true);
        try {
            const response = await api.post('/user-management/passwords/bulk-reset', {
                user_ids: studentsWithLogin,
                new_password: defaultPassword
            });

            if (response.data.success) {
                const { reset, failed } = response.data.data;
                toast({
                    title: 'Success',
                    description: `Reset ${reset} passwords${failed > 0 ? `, ${failed} failed` : ''}`,
                    variant: reset > 0 ? 'default' : 'destructive'
                });
                setResetPasswordDialog(false);
                setSelectedStudents([]);
            }
        } catch (error) {
            console.error('Failed to reset passwords:', error);
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setProcessing(false);
        }
    };

    const studentsWithoutLogin = students.filter(s => selectedStudents.includes(s.id) && !s.has_login).length;
    const studentsWithLogin = students.filter(s => selectedStudents.includes(s.id) && s.has_login).length;

    return (
        <DashboardLayout>
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <GraduationCap className="h-6 w-6 text-primary" />
                        Student Users
                    </h1>
                    <p className="text-muted-foreground">Manage student login accounts</p>
                </div>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                        <Select 
                            value={filters.branch_id} 
                            onValueChange={(v) => setFilters(prev => ({ ...prev, branch_id: v, class_id: 'all', section_id: 'all' }))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select Branch" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Branches</SelectItem>
                                {branches?.map(b => (
                                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select 
                            value={filters.class_id} 
                            onValueChange={(v) => setFilters(prev => ({ ...prev, class_id: v, section_id: 'all' }))}
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
                            value={filters.section_id} 
                            onValueChange={(v) => setFilters(prev => ({ ...prev, section_id: v }))}
                            disabled={!filters.class_id || filters.class_id === 'all'}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select Section" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Sections</SelectItem>
                                {sections.map(s => (
                                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select 
                            value={filters.has_login} 
                            onValueChange={(v) => setFilters(prev => ({ ...prev, has_login: v }))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Login Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                <SelectItem value="true">With Login</SelectItem>
                                <SelectItem value="false">Without Login</SelectItem>
                            </SelectContent>
                        </Select>

                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search..."
                                value={filters.search}
                                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                                className="pl-9"
                            />
                        </div>

                        <Button onClick={fetchStudents} variant="outline">
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Actions Bar */}
            {selectedStudents.length > 0 && (
                <Card className="border-blue-200 bg-blue-50">
                    <CardContent className="py-3">
                        <div className="flex items-center justify-between">
                            <span className="text-blue-700 font-medium">
                                {selectedStudents.length} students selected
                                {studentsWithoutLogin > 0 && ` (${studentsWithoutLogin} without login)`}
                            </span>
                            <div className="flex gap-2">
                                {studentsWithoutLogin > 0 && (
                                    <Button 
                                        size="sm" 
                                        className="bg-green-600 hover:bg-green-700"
                                        onClick={() => setCreateLoginDialog(true)}
                                    >
                                        <KeyRound className="h-4 w-4 mr-2" />
                                        Create Logins ({studentsWithoutLogin})
                                    </Button>
                                )}
                                {studentsWithLogin > 0 && (
                                    <Button 
                                        size="sm" 
                                        variant="outline"
                                        onClick={() => setResetPasswordDialog(true)}
                                    >
                                        <Lock className="h-4 w-4 mr-2" />
                                        Reset Passwords ({studentsWithLogin})
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

            {/* Students Table */}
            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-muted/50 border-b">
                                <tr>
                                    <th className="p-3 text-left">
                                        <Checkbox
                                            checked={selectedStudents.length === students.length && students.length > 0}
                                            onCheckedChange={handleSelectAll}
                                        />
                                    </th>
                                    <th className="p-3 text-left text-sm font-medium text-muted-foreground">Photo</th>
                                    <th className="p-3 text-left text-sm font-medium text-muted-foreground">Name</th>
                                    <th className="p-3 text-left text-sm font-medium text-muted-foreground">Admission No</th>
                                    <th className="p-3 text-left text-sm font-medium text-muted-foreground">Class</th>
                                    <th className="p-3 text-left text-sm font-medium text-muted-foreground">Branch</th>
                                    <th className="p-3 text-left text-sm font-medium text-muted-foreground">Login Status</th>
                                    <th className="p-3 text-left text-sm font-medium text-muted-foreground">Parent Phone</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {loading ? (
                                    <tr>
                                        <td colSpan={8} className="p-8 text-center">
                                            <RefreshCw className="h-6 w-6 animate-spin mx-auto text-blue-500" />
                                        </td>
                                    </tr>
                                ) : students.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="p-8 text-center text-muted-foreground">
                                            No students found
                                        </td>
                                    </tr>
                                ) : (
                                    students.map((student) => (
                                        <tr key={student.id} className="hover:bg-muted/50">
                                            <td className="p-3">
                                                <Checkbox
                                                    checked={selectedStudents.includes(student.id)}
                                                    onCheckedChange={(checked) => handleSelectStudent(student.id, checked)}
                                                />
                                            </td>
                                            <td className="p-3">
                                                <div className="w-10 h-10 rounded-full bg-muted overflow-hidden">
                                                    {student.photo_url ? (
                                                        <img src={student.photo_url} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                                            <GraduationCap className="h-5 w-5" />
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-3">
                                                <div className="font-medium">{student.full_name}</div>
                                                <div className="text-sm text-muted-foreground">{student.phone || student.email || '-'}</div>
                                            </td>
                                            <td className="p-3">
                                                <code className="bg-muted px-2 py-1 rounded text-sm">
                                                    {student.school_code || '-'}
                                                </code>
                                            </td>
                                            <td className="p-3">
                                                {student.class_name} - {student.section_name}
                                            </td>
                                            <td className="p-3 text-sm">{student.branch_name}</td>
                                            <td className="p-3">
                                                {student.has_login ? (
                                                    <Badge className="bg-green-100 text-green-700">
                                                        <CheckCircle className="h-3 w-3 mr-1" />
                                                        Has Login
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-orange-600 border-orange-300">
                                                        <XCircle className="h-3 w-3 mr-1" />
                                                        No Login
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="p-3 text-sm">
                                                {student.father_phone || '-'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between p-4 border-t">
                        <div className="text-sm text-gray-500">
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

            {/* Create Login Dialog */}
            <Dialog open={createLoginDialog} onOpenChange={setCreateLoginDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <KeyRound className="h-5 w-5 text-green-500" />
                            Create Student Logins
                        </DialogTitle>
                        <DialogDescription>
                            Create login accounts for {studentsWithoutLogin} selected students without login.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Default Password</Label>
                            <Input
                                value={defaultPassword}
                                onChange={(e) => setDefaultPassword(e.target.value)}
                                placeholder="Enter default password"
                            />
                            <p className="text-xs text-gray-500">
                                This password will be set for all new accounts. Students can change it after login.
                            </p>
                        </div>
                        <div className="bg-blue-50 p-3 rounded-lg text-sm">
                            <p className="font-medium text-blue-700">Login Credentials:</p>
                            <p className="text-blue-600">Username: Admission Number (e.g., SSVK-2026-00001)</p>
                            <p className="text-blue-600">Password: {defaultPassword}</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateLoginDialog(false)}>
                            Cancel
                        </Button>
                        <Button 
                            className="bg-green-600 hover:bg-green-700"
                            onClick={handleBulkCreateLogins}
                            disabled={processing}
                        >
                            {processing ? (
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <KeyRound className="h-4 w-4 mr-2" />
                            )}
                            Create {studentsWithoutLogin} Logins
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reset Password Dialog */}
            <Dialog open={resetPasswordDialog} onOpenChange={setResetPasswordDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Lock className="h-5 w-5 text-orange-500" />
                            Reset Passwords
                        </DialogTitle>
                        <DialogDescription>
                            Reset passwords for {studentsWithLogin} selected students with login.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>New Password</Label>
                            <Input
                                value={defaultPassword}
                                onChange={(e) => setDefaultPassword(e.target.value)}
                                placeholder="Enter new password"
                            />
                        </div>
                        <div className="bg-orange-50 p-3 rounded-lg text-sm">
                            <p className="text-orange-700">
                                All selected students' passwords will be reset to: <strong>{defaultPassword}</strong>
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setResetPasswordDialog(false)}>
                            Cancel
                        </Button>
                        <Button 
                            className="bg-orange-600 hover:bg-orange-700"
                            onClick={handleBulkResetPasswords}
                            disabled={processing}
                        >
                            {processing ? (
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <Lock className="h-4 w-4 mr-2" />
                            )}
                            Reset {studentsWithLogin} Passwords
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
        </DashboardLayout>
    );
};

export default StudentUsers;
