/**
 * ═══════════════════════════════════════════════════════════════════════════════════
 * JASHCHAR ERP - USER MANAGEMENT DASHBOARD
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 
 * Central dashboard for User Management module
 * Shows statistics for Students, Parents, and Staff users
 * 
 * ═══════════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Users, GraduationCap, Briefcase, UserPlus, 
    Activity, Shield, Key, FileText, 
    CheckCircle, XCircle, Clock, RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';

const UserManagementDashboard = () => {
    const navigate = useNavigate();
    const { organizationId } = useAuth();
    const { branches, selectedBranch } = useBranch();
    
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedBranchFilter, setSelectedBranchFilter] = useState('all');

    useEffect(() => {
        fetchStats();
    }, [selectedBranchFilter]);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const params = selectedBranchFilter !== 'all' ? `?branch_id=${selectedBranchFilter}` : '';
            const response = await api.get(`/user-management/dashboard${params}`);
            if (response.data.success) {
                setStats(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const StatCard = ({ title, icon: Icon, value, subValue, color, onClick }) => (
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={onClick}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
                <Icon className={`h-5 w-5 ${color}`} />
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold">{value}</div>
                {subValue && <p className="text-xs text-gray-500 mt-1">{subValue}</p>}
            </CardContent>
        </Card>
    );

    const QuickActionCard = ({ title, description, icon: Icon, color, onClick }) => (
        <Card className="cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02]" onClick={onClick}>
            <CardContent className="flex items-center gap-4 p-4">
                <div className={`p-3 rounded-lg ${color}`}>
                    <Icon className="h-6 w-6 text-white" />
                </div>
                <div>
                    <h3 className="font-semibold">{title}</h3>
                    <p className="text-sm text-gray-500">{description}</p>
                </div>
            </CardContent>
        </Card>
    );

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-96">
                    <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">User Management</h1>
                    <p className="text-gray-500">Manage logins for Students, Parents, and Staff</p>
                </div>
                <div className="flex gap-3">
                    <Select value={selectedBranchFilter} onValueChange={setSelectedBranchFilter}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Select Branch" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Branches</SelectItem>
                            {branches?.map(branch => (
                                <SelectItem key={branch.id} value={branch.id}>
                                    {branch.branch_name || branch.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={fetchStats}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* User Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total Students"
                    icon={GraduationCap}
                    value={stats?.students?.total || 0}
                    subValue={`${stats?.students?.withLogin || 0} with login, ${stats?.students?.withoutLogin || 0} without`}
                    color="text-blue-500"
                    onClick={() => navigate('/super-admin/user-management/student-users')}
                />
                <StatCard
                    title="Total Parents"
                    icon={UserPlus}
                    value={stats?.parents?.total || 0}
                    subValue={`${stats?.parents?.withLogin || 0} with login, ${stats?.parents?.withoutLogin || 0} without`}
                    color="text-green-500"
                    onClick={() => navigate('/super-admin/user-management/parent-users')}
                />
                <StatCard
                    title="Total Staff"
                    icon={Briefcase}
                    value={stats?.staff?.total || 0}
                    subValue={`${stats?.staff?.withLogin || 0} with login, ${stats?.staff?.withoutLogin || 0} without`}
                    color="text-purple-500"
                    onClick={() => navigate('/super-admin/user-management/staff-users')}
                />
                <StatCard
                    title="Active Sessions"
                    icon={Activity}
                    value={stats?.sessions?.active || 0}
                    subValue="Currently online"
                    color="text-orange-500"
                    onClick={() => navigate('/super-admin/user-management/active-sessions')}
                />
            </div>

            {/* Login Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            Today's Logins
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{stats?.logins?.today || 0}</div>
                        <p className="text-xs text-gray-500">Successful logins today</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-red-500" />
                            Failed Logins
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{stats?.logins?.failedToday || 0}</div>
                        <p className="text-xs text-gray-500">Failed attempts today</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Clock className="h-4 w-4 text-blue-500" />
                            Pending Activations
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">
                            {(stats?.students?.withoutLogin || 0) + (stats?.staff?.withoutLogin || 0)}
                        </div>
                        <p className="text-xs text-gray-500">Users without login</p>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <div>
                <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <QuickActionCard
                        title="Student Users"
                        description="Manage student login accounts"
                        icon={GraduationCap}
                        color="bg-blue-500"
                        onClick={() => navigate('/super-admin/user-management/student-users')}
                    />
                    <QuickActionCard
                        title="Parent Users"
                        description="Manage parent login accounts"
                        icon={UserPlus}
                        color="bg-green-500"
                        onClick={() => navigate('/super-admin/user-management/parent-users')}
                    />
                    <QuickActionCard
                        title="Staff Users"
                        description="Manage staff login accounts"
                        icon={Briefcase}
                        color="bg-purple-500"
                        onClick={() => navigate('/super-admin/user-management/staff-users')}
                    />
                    <QuickActionCard
                        title="All Users"
                        description="View all users in one place"
                        icon={Users}
                        color="bg-gray-700"
                        onClick={() => navigate('/super-admin/user-management/all-users')}
                    />
                    <QuickActionCard
                        title="Login Logs"
                        description="View login history"
                        icon={FileText}
                        color="bg-orange-500"
                        onClick={() => navigate('/super-admin/user-management/login-logs')}
                    />
                    <QuickActionCard
                        title="Security Settings"
                        description="Configure security policies"
                        icon={Shield}
                        color="bg-red-500"
                        onClick={() => navigate('/super-admin/user-management/security-settings')}
                    />
                </div>
            </div>

            {/* Users Without Login Summary */}
            {((stats?.students?.withoutLogin || 0) > 0 || (stats?.staff?.withoutLogin || 0) > 0) && (
                <Card className="border-yellow-200 bg-yellow-50">
                    <CardHeader>
                        <CardTitle className="text-yellow-800 flex items-center gap-2">
                            <Clock className="h-5 w-5" />
                            Action Required: Users Without Login
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-4">
                            {stats?.students?.withoutLogin > 0 && (
                                <Button 
                                    variant="outline" 
                                    className="border-yellow-500 text-yellow-700 hover:bg-yellow-100"
                                    onClick={() => navigate('/super-admin/user-management/student-users?has_login=false')}
                                >
                                    <GraduationCap className="h-4 w-4 mr-2" />
                                    {stats.students.withoutLogin} Students need login
                                </Button>
                            )}
                            {stats?.staff?.withoutLogin > 0 && (
                                <Button 
                                    variant="outline"
                                    className="border-yellow-500 text-yellow-700 hover:bg-yellow-100"
                                    onClick={() => navigate('/super-admin/user-management/staff-users?has_login=false')}
                                >
                                    <Briefcase className="h-4 w-4 mr-2" />
                                    {stats.staff.withoutLogin} Staff need login
                                </Button>
                            )}
                            {stats?.parents?.withoutLogin > 0 && (
                                <Button 
                                    variant="outline"
                                    className="border-yellow-500 text-yellow-700 hover:bg-yellow-100"
                                    onClick={() => navigate('/super-admin/user-management/parent-users?has_login=false')}
                                >
                                    <UserPlus className="h-4 w-4 mr-2" />
                                    {stats.parents.withoutLogin} Parents need login
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
        </DashboardLayout>
    );
};

export default UserManagementDashboard;
