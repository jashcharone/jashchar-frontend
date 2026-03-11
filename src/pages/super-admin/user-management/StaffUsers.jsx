/**
 * ═══════════════════════════════════════════════════════════════════════════════════
 * JASHCHAR ERP - STAFF USERS MANAGEMENT
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 
 * Manage staff login accounts
 * - View all staff with/without login
 * - Bulk create logins
 * - Reset passwords
 * - Enable/Disable accounts
 * 
 * ═══════════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
    Briefcase, KeyRound, RefreshCw, Search, 
    CheckCircle, XCircle, Filter, Download, Send,
    Eye, Lock, Unlock, ChevronLeft, ChevronRight, Mail, Phone
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

const StaffUsers = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const { toast } = useToast();
    const { organizationId } = useAuth();
    const { branches, selectedBranch } = useBranch();

    // State
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedStaff, setSelectedStaff] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [branchesList, setBranchesList] = useState([]);
    
    // Pagination
    const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 50, totalPages: 0 });
    
    // Filters
    const [filters, setFilters] = useState({
        branch_id: searchParams.get('branch_id') || 'all',
        department: searchParams.get('department') || 'all',
        has_login: searchParams.get('has_login') || 'all',
        search: searchParams.get('search') || ''
    });

    // Dialogs
    const [createLoginDialog, setCreateLoginDialog] = useState(false);
    const [resetPasswordDialog, setResetPasswordDialog] = useState(false);
    const [defaultPassword, setDefaultPassword] = useState('123456');
    const [processing, setProcessing] = useState(false);

    // Fetch departments from API
    const fetchDepartments = async () => {
        try {
            const response = await api.get('/user-management/departments');
            if (response.data.success) {
                setDepartments(response.data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch departments:', error);
        }
    };

    // Fetch branches from API
    const fetchBranches = async () => {
        try {
            const response = await api.get('/user-management/branches');
            if (response.data.success) {
                setBranchesList(response.data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch branches:', error);
        }
    };

    // Fetch staff
    const fetchStaff = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.branch_id && filters.branch_id !== 'all') params.append('branch_id', filters.branch_id);
            if (filters.department && filters.department !== 'all') params.append('department', filters.department);
            if (filters.has_login !== 'all') params.append('has_login', filters.has_login);
            if (filters.search) params.append('search', filters.search);
            params.append('page', pagination.page);
            params.append('limit', pagination.limit);

            const response = await api.get(`/user-management/staff?${params.toString()}`);
            if (response.data.success) {
                setStaff(response.data.data);
                setPagination(response.data.pagination);
            }
        } catch (error) {
            console.error('Failed to fetch staff:', error);
            toast({ title: 'Error', description: 'Failed to fetch staff', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    }, [filters, pagination.page, pagination.limit]);

    useEffect(() => {
        fetchStaff();
        fetchDepartments();
        fetchBranches();
    }, [fetchStaff]);

    // Handle select all
    const handleSelectAll = (checked) => {
        if (checked) {
            setSelectedStaff(staff.map(s => s.id));
        } else {
            setSelectedStaff([]);
        }
    };

    // Handle individual select
    const handleSelectStaff = (staffId, checked) => {
        if (checked) {
            setSelectedStaff(prev => [...prev, staffId]);
        } else {
            setSelectedStaff(prev => prev.filter(id => id !== staffId));
        }
    };

    // Bulk create logins
    const handleBulkCreateLogins = async () => {
        const staffWithoutLogin = staff
            .filter(s => selectedStaff.includes(s.id) && !s.has_login)
            .map(s => s.id);

        if (staffWithoutLogin.length === 0) {
            toast({ title: 'Info', description: 'All selected staff already have login', variant: 'default' });
            return;
        }

        setProcessing(true);
        try {
            const response = await api.post('/user-management/staff/bulk-create-logins', {
                staff_ids: staffWithoutLogin,
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
                setSelectedStaff([]);
                fetchStaff();
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
        const staffWithLogin = staff
            .filter(s => selectedStaff.includes(s.id) && s.has_login)
            .map(s => s.user_id);

        if (staffWithLogin.length === 0) {
            toast({ title: 'Info', description: 'None of the selected staff have login to reset', variant: 'default' });
            return;
        }

        setProcessing(true);
        try {
            const response = await api.post('/user-management/passwords/bulk-reset', {
                user_ids: staffWithLogin,
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
                setSelectedStaff([]);
            }
        } catch (error) {
            console.error('Failed to reset passwords:', error);
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setProcessing(false);
        }
    };

    const staffWithoutLogin = staff.filter(s => selectedStaff.includes(s.id) && !s.has_login).length;
    const staffWithLogin = staff.filter(s => selectedStaff.includes(s.id) && s.has_login).length;

    return (
        <DashboardLayout>
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Briefcase className="h-6 w-6 text-primary" />
                        Staff Users
                    </h1>
                    <p className="text-muted-foreground">Manage staff login accounts</p>
                </div>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <Select 
                            value={filters.branch_id} 
                            onValueChange={(v) => setFilters(prev => ({ ...prev, branch_id: v }))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select Branch" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Branches</SelectItem>
                                {branchesList.map(b => (
                                    <SelectItem key={b.id} value={b.id}>{b.branch_name || b.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select 
                            value={filters.department} 
                            onValueChange={(v) => setFilters(prev => ({ ...prev, department: v }))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select Department" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Departments</SelectItem>
                                {departments.map(d => (
                                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
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
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search..."
                                value={filters.search}
                                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                                className="pl-9"
                            />
                        </div>

                        <Button onClick={fetchStaff} variant="outline">
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Actions Bar */}
            {selectedStaff.length > 0 && (
                <Card className="border-purple-200 bg-purple-50">
                    <CardContent className="py-3">
                        <div className="flex items-center justify-between">
                            <span className="text-purple-700 font-medium">
                                {selectedStaff.length} staff selected
                                {staffWithoutLogin > 0 && ` (${staffWithoutLogin} without login)`}
                            </span>
                            <div className="flex gap-2">
                                {staffWithoutLogin > 0 && (
                                    <Button 
                                        size="sm" 
                                        className="bg-green-600 hover:bg-green-700"
                                        onClick={() => setCreateLoginDialog(true)}
                                    >
                                        <KeyRound className="h-4 w-4 mr-2" />
                                        Create Logins ({staffWithoutLogin})
                                    </Button>
                                )}
                                {staffWithLogin > 0 && (
                                    <Button 
                                        size="sm" 
                                        variant="outline"
                                        onClick={() => setResetPasswordDialog(true)}
                                    >
                                        <Lock className="h-4 w-4 mr-2" />
                                        Reset Passwords ({staffWithLogin})
                                    </Button>
                                )}
                                <Button 
                                    size="sm" 
                                    variant="ghost"
                                    onClick={() => setSelectedStaff([])}
                                >
                                    Clear Selection
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Staff Table */}
            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-muted/50 border-b">
                                <tr>
                                    <th className="p-3 text-left">
                                        <Checkbox
                                            checked={selectedStaff.length === staff.length && staff.length > 0}
                                            onCheckedChange={handleSelectAll}
                                        />
                                    </th>
                                    <th className="p-3 text-left text-sm font-medium text-muted-foreground">Photo</th>
                                    <th className="p-3 text-left text-sm font-medium text-muted-foreground">Name</th>
                                    <th className="p-3 text-left text-sm font-medium text-muted-foreground">Employee ID</th>
                                    <th className="p-3 text-left text-sm font-medium text-muted-foreground">Department</th>
                                    <th className="p-3 text-left text-sm font-medium text-muted-foreground">Designation</th>
                                    <th className="p-3 text-left text-sm font-medium text-muted-foreground">Branch</th>
                                    <th className="p-3 text-left text-sm font-medium text-muted-foreground">Login Status</th>
                                    <th className="p-3 text-left text-sm font-medium text-muted-foreground">Contact</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {loading ? (
                                    <tr>
                                        <td colSpan={9} className="p-8 text-center">
                                            <RefreshCw className="h-6 w-6 animate-spin mx-auto text-purple-500" />
                                        </td>
                                    </tr>
                                ) : staff.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="p-8 text-center text-muted-foreground">
                                            No staff found
                                        </td>
                                    </tr>
                                ) : (
                                    staff.map((member) => (
                                        <tr key={member.id} className="hover:bg-muted/50">
                                            <td className="p-3">
                                                <Checkbox
                                                    checked={selectedStaff.includes(member.id)}
                                                    onCheckedChange={(checked) => handleSelectStaff(member.id, checked)}
                                                />
                                            </td>
                                            <td className="p-3">
                                                <div className="w-10 h-10 rounded-full bg-muted overflow-hidden">
                                                    {member.photo_url ? (
                                                        <img src={member.photo_url} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                                            <Briefcase className="h-5 w-5" />
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-3">
                                                <div className="font-medium">{member.full_name}</div>
                                            </td>
                                            <td className="p-3">
                                                <code className="bg-muted px-2 py-1 rounded text-sm">
                                                    {member.staff_id || '-'}
                                                </code>
                                            </td>
                                            <td className="p-3 text-sm text-muted-foreground">{member.department_name || '-'}</td>
                                            <td className="p-3 text-sm text-muted-foreground">{member.designation_name || '-'}</td>
                                            <td className="p-3 text-sm">{member.branch_name || '-'}</td>
                                            <td className="p-3">
                                                {member.has_login ? (
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
                                            <td className="p-3">
                                                <div className="text-sm">
                                                    {member.email && (
                                                        <div className="flex items-center gap-1 text-gray-600">
                                                            <Mail className="h-3 w-3" />
                                                            {member.email}
                                                        </div>
                                                    )}
                                                    {member.phone && (
                                                        <div className="flex items-center gap-1 text-gray-600">
                                                            <Phone className="h-3 w-3" />
                                                            {member.phone}
                                                        </div>
                                                    )}
                                                </div>
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
                            Create Staff Logins
                        </DialogTitle>
                        <DialogDescription>
                            Create login accounts for {staffWithoutLogin} selected staff without login.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg text-sm border border-green-200 dark:border-green-800">
                            <p className="font-medium text-green-700 dark:text-green-400 flex items-center gap-2">
                                <CheckCircle className="h-4 w-4" />
                                Login ಎರಡೂ ರೀತಿ ಕೆಲಸ ಮಾಡುತ್ತದೆ
                            </p>
                            <div className="mt-2 space-y-1 text-green-600 dark:text-green-300">
                                <p className="flex items-center gap-2">
                                    <Phone className="h-3 w-3" /> Mobile Number ಇಂದ Login
                                </p>
                                <p className="flex items-center gap-2">
                                    <Mail className="h-3 w-3" /> Email ID ಇಂದ Login
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Default Password</Label>
                            <Input
                                value={defaultPassword}
                                onChange={(e) => setDefaultPassword(e.target.value)}
                                placeholder="Enter default password"
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                This password will be set for all new accounts.
                            </p>
                        </div>

                        <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg text-sm border border-purple-200 dark:border-purple-800">
                            <p className="font-medium text-purple-700 dark:text-purple-400">Login Credentials:</p>
                            <p className="text-purple-600 dark:text-purple-300 flex items-center gap-1">
                                <Phone className="h-3 w-3" /> Primary: Mobile Number
                            </p>
                            <p className="text-purple-600 dark:text-purple-300 flex items-center gap-1">
                                <Mail className="h-3 w-3" /> Secondary: Email Address
                            </p>
                            <p className="text-purple-600 dark:text-purple-300">Password: {defaultPassword}</p>
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
                            Create {staffWithoutLogin} Logins
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
                            Reset passwords for {staffWithLogin} selected staff with login.
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
                                All selected staff passwords will be reset to: <strong>{defaultPassword}</strong>
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
                            Reset {staffWithLogin} Passwords
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
        </DashboardLayout>
    );
};

export default StaffUsers;
