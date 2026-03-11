/**
 * ═══════════════════════════════════════════════════════════════════════════════════
 * JASHCHAR ERP - ALL USERS (UNIFIED VIEW)
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 
 * Combined view of all users:
 * - Students with login
 * - Staff with login
 * - Parents with login
 * - Super Admins
 * 
 * Features:
 * - Filter by user type
 * - View login activity
 * - Enable/Disable accounts
 * - Export users
 * 
 * ═══════════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
    Users, RefreshCw, Search, 
    CheckCircle, XCircle, Shield, GraduationCap, Briefcase,
    UserCircle, ChevronLeft, ChevronRight, Clock, Lock, Unlock,
    Download, Eye
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import api from '@/lib/api';

const AllUsers = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const { toast } = useToast();
    const { organizationId } = useAuth();
    const { branches, selectedBranch } = useBranch();

    // State
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState(null);
    
    // Pagination
    const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 50, totalPages: 0 });
    
    // Filters
    const [filters, setFilters] = useState({
        branch_id: searchParams.get('branch_id') || 'all',
        user_type: searchParams.get('user_type') || 'all',
        status: searchParams.get('status') || 'all',
        search: searchParams.get('search') || ''
    });

    // Dialogs
    const [detailDialog, setDetailDialog] = useState(false);
    const [toggleStatusDialog, setToggleStatusDialog] = useState(false);
    const [processing, setProcessing] = useState(false);

    // Fetch users
    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.branch_id && filters.branch_id !== 'all') params.append('branch_id', filters.branch_id);
            if (filters.user_type !== 'all') params.append('user_type', filters.user_type);
            if (filters.status !== 'all') params.append('status', filters.status);
            if (filters.search) params.append('search', filters.search);
            params.append('page', pagination.page);
            params.append('limit', pagination.limit);

            const response = await api.get(`/user-management/users?${params.toString()}`);
            if (response.data.success) {
                setUsers(response.data.data);
                setPagination(response.data.pagination);
            }
        } catch (error) {
            console.error('Failed to fetch users:', error);
            toast({ title: 'Error', description: 'Failed to fetch users', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    }, [filters, pagination.page, pagination.limit]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // Get user type icon
    const getUserTypeIcon = (type) => {
        switch (type) {
            case 'student': return <GraduationCap className="h-4 w-4" />;
            case 'staff': return <Briefcase className="h-4 w-4" />;
            case 'parent': return <Users className="h-4 w-4" />;
            case 'super_admin': return <Shield className="h-4 w-4" />;
            default: return <UserCircle className="h-4 w-4" />;
        }
    };

    // Get user type badge color
    const getUserTypeBadgeClass = (type) => {
        switch (type) {
            case 'student': return 'bg-blue-100 text-blue-700';
            case 'staff': return 'bg-purple-100 text-purple-700';
            case 'parent': return 'bg-emerald-100 text-emerald-700';
            case 'super_admin': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    // Toggle user status
    const handleToggleStatus = async () => {
        if (!selectedUser) return;

        setProcessing(true);
        try {
            // For staff, use user_id (auth user id); for others use profile id
            const targetId = selectedUser.user_id || selectedUser.id;
            const response = await api.patch(`/user-management/users/${targetId}/status`, {
                status: selectedUser.is_active ? 'disabled' : 'enabled',
                user_type: selectedUser.user_type,
                profile_id: selectedUser.id
            });

            if (response.data.success) {
                toast({
                    title: 'Success',
                    description: `User ${selectedUser.is_active ? 'disabled' : 'enabled'} successfully`,
                });
                setToggleStatusDialog(false);
                setSelectedUser(null);
                fetchUsers();
            }
        } catch (error) {
            console.error('Failed to toggle status:', error);
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setProcessing(false);
        }
    };

    // Format last login
    const formatLastLogin = (dateStr) => {
        if (!dateStr) return 'Never';
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now - date;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        
        if (days === 0) return 'Today';
        if (days === 1) return 'Yesterday';
        if (days < 7) return `${days} days ago`;
        if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
        return date.toLocaleDateString();
    };

    return (
        <DashboardLayout>
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Users className="h-6 w-6 text-primary" />
                        All Users
                    </h1>
                    <p className="text-muted-foreground">Unified view of all system users</p>
                </div>
                <Button variant="outline" onClick={() => {}}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                </Button>
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
                                {branches?.map(b => (
                                    <SelectItem key={b.id} value={b.id}>{b.branch_name || b.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select 
                            value={filters.user_type} 
                            onValueChange={(v) => setFilters(prev => ({ ...prev, user_type: v }))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="User Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="student">Students</SelectItem>
                                <SelectItem value="staff">Staff</SelectItem>
                                <SelectItem value="parent">Parents</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select 
                            value={filters.status} 
                            onValueChange={(v) => setFilters(prev => ({ ...prev, status: v }))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="disabled">Disabled</SelectItem>
                            </SelectContent>
                        </Select>

                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search name, email..."
                                value={filters.search}
                                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                                className="pl-9"
                            />
                        </div>

                        <Button onClick={fetchUsers} variant="outline">
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Users Table */}
            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-muted/50 border-b">
                                <tr>
                                    <th className="p-3 text-left text-sm font-medium text-muted-foreground">User</th>
                                    <th className="p-3 text-left text-sm font-medium text-muted-foreground">Type</th>
                                    <th className="p-3 text-left text-sm font-medium text-muted-foreground">Email / Username</th>
                                    <th className="p-3 text-left text-sm font-medium text-muted-foreground">Branch</th>
                                    <th className="p-3 text-left text-sm font-medium text-muted-foreground">Last Login</th>
                                    <th className="p-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                                    <th className="p-3 text-left text-sm font-medium text-muted-foreground">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center">
                                            <RefreshCw className="h-6 w-6 animate-spin mx-auto text-indigo-500" />
                                        </td>
                                    </tr>
                                ) : users.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-muted-foreground">
                                            No users found
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((user) => (
                                        <tr key={user.id} className="hover:bg-muted/50">
                                            <td className="p-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-10 h-10 rounded-full bg-muted overflow-hidden flex items-center justify-center">
                                                        {user.photo_url ? (
                                                            <img src={user.photo_url} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="text-muted-foreground">
                                                                {getUserTypeIcon(user.user_type)}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium">{user.full_name || user.email}</div>
                                                        {user.staff_id && (
                                                            <div className="text-xs text-muted-foreground">{user.staff_id}</div>
                                                        )}
                                                        {user.school_code && (
                                                            <div className="text-xs text-muted-foreground">{user.school_code}</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-3">
                                                <Badge className={`${getUserTypeBadgeClass(user.user_type)} flex items-center gap-1 w-fit`}>
                                                    {getUserTypeIcon(user.user_type)}
                                                    {user.user_type?.replace('_', ' ').toUpperCase()}
                                                </Badge>
                                            </td>
                                            <td className="p-3">
                                                <code className="bg-muted px-2 py-1 rounded text-sm">
                                                    {user.email || user.username || user.phone || '-'}
                                                </code>
                                            </td>
                                            <td className="p-3 text-sm text-muted-foreground">{user.branch_name || branches?.find(b => b.id === user.branch_id)?.branch_name || '-'}</td>
                                            <td className="p-3">
                                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                    <Clock className="h-3 w-3" />
                                                    {formatLastLogin(user.last_login_at)}
                                                </div>
                                            </td>
                                            <td className="p-3">
                                                {user.is_active ? (
                                                    <Badge className="bg-green-100 text-green-700">
                                                        <CheckCircle className="h-3 w-3 mr-1" />
                                                        Active
                                                    </Badge>
                                                ) : (
                                                    <Badge className="bg-red-100 text-red-700">
                                                        <XCircle className="h-3 w-3 mr-1" />
                                                        Disabled
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="p-3">
                                                <div className="flex gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() => {
                                                            setSelectedUser(user);
                                                            setDetailDialog(true);
                                                        }}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className={`h-8 w-8 ${user.is_active ? 'text-red-500 hover:text-red-600' : 'text-green-500 hover:text-green-600'}`}
                                                        onClick={() => {
                                                            setSelectedUser(user);
                                                            setToggleStatusDialog(true);
                                                        }}
                                                    >
                                                        {user.is_active ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between p-4 border-t border-border">
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

            {/* User Detail Dialog */}
            <Dialog open={detailDialog} onOpenChange={setDetailDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Eye className="h-5 w-5 text-indigo-500" />
                            User Details
                        </DialogTitle>
                    </DialogHeader>
                    {selectedUser && (
                        <div className="space-y-4 py-4">
                            <div className="flex items-center gap-3">
                                <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                                    {selectedUser.photo_url ? (
                                        <img src={selectedUser.photo_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-gray-400">
                                            {getUserTypeIcon(selectedUser.user_type)}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg">{selectedUser.full_name || selectedUser.email}</h3>
                                    <Badge className={getUserTypeBadgeClass(selectedUser.user_type)}>
                                        {selectedUser.user_type?.replace('_', ' ').toUpperCase()}
                                    </Badge>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-gray-500">Email</span>
                                    <p className="font-medium">{selectedUser.email || '-'}</p>
                                </div>
                                <div>
                                    <span className="text-gray-500">Phone</span>
                                    <p className="font-medium">{selectedUser.phone || '-'}</p>
                                </div>
                                <div>
                                    <span className="text-gray-500">Branch</span>
                                    <p className="font-medium">{selectedUser.branch_name || 'All'}</p>
                                </div>
                                <div>
                                    <span className="text-gray-500">Status</span>
                                    <p className={`font-medium ${selectedUser.is_active ? 'text-green-600' : 'text-red-600'}`}>
                                        {selectedUser.is_active ? 'Active' : 'Disabled'}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-gray-500">Last Login</span>
                                    <p className="font-medium">{formatLastLogin(selectedUser.last_login_at)}</p>
                                </div>
                                <div>
                                    <span className="text-gray-500">Created</span>
                                    <p className="font-medium">
                                        {selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString() : '-'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDetailDialog(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Toggle Status Dialog */}
            <Dialog open={toggleStatusDialog} onOpenChange={setToggleStatusDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {selectedUser?.is_active ? (
                                <Lock className="h-5 w-5 text-red-500" />
                            ) : (
                                <Unlock className="h-5 w-5 text-green-500" />
                            )}
                            {selectedUser?.is_active ? 'Disable User' : 'Enable User'}
                        </DialogTitle>
                        <DialogDescription>
                            {selectedUser?.is_active 
                                ? `Are you sure you want to disable ${selectedUser?.full_name || selectedUser?.email}? They will not be able to login.`
                                : `Are you sure you want to enable ${selectedUser?.full_name || selectedUser?.email}? They will be able to login again.`
                            }
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setToggleStatusDialog(false)}>
                            Cancel
                        </Button>
                        <Button 
                            className={selectedUser?.is_active ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
                            onClick={handleToggleStatus}
                            disabled={processing}
                        >
                            {processing ? (
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            ) : selectedUser?.is_active ? (
                                <Lock className="h-4 w-4 mr-2" />
                            ) : (
                                <Unlock className="h-4 w-4 mr-2" />
                            )}
                            {selectedUser?.is_active ? 'Disable' : 'Enable'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
        </DashboardLayout>
    );
};

export default AllUsers;
