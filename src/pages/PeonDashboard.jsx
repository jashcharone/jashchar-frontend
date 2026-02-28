/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PEON / OFFICE ASSISTANT DASHBOARD
 * Task assignments and general assistance
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
    ClipboardList, Clock, CheckCircle2, Bell,
    Coffee, Package, FileText, ChevronRight,
    Activity, User, MapPin, AlertCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import WelcomeMessage from '@/components/WelcomeMessage';
import StatCard from '@/components/StatCard';

const PeonDashboard = () => {
    const { user } = useAuth();
    const { selectedBranch } = useBranch();
    const navigate = useNavigate();
    const { roleSlug } = useParams();
    const basePath = roleSlug || 'super-admin';
    
    const [stats] = useState({
        pendingTasks: 5,
        completedToday: 8,
        urgentTasks: 1,
        totalAssigned: 13
    });

    const todayTasks = [
        { id: 1, task: 'Deliver files to Principal office', assignedBy: 'Admin Office', time: '09:00 AM', status: 'completed', priority: 'normal' },
        { id: 2, task: 'Collect stationery from store', assignedBy: 'Staff Room', time: '09:30 AM', status: 'completed', priority: 'normal' },
        { id: 3, task: 'Distribute notices to all classes', assignedBy: 'Admin Office', time: '10:00 AM', status: 'completed', priority: 'normal' },
        { id: 4, task: 'Arrange chairs in auditorium', assignedBy: 'Principal', time: '11:00 AM', status: 'in-progress', priority: 'urgent' },
        { id: 5, task: 'Collect attendance registers', assignedBy: 'Admin Office', time: '02:00 PM', status: 'pending', priority: 'normal' },
        { id: 6, task: 'Serve tea in meeting room', assignedBy: 'Staff Room', time: '03:00 PM', status: 'pending', priority: 'normal' },
    ];

    const quickActions = [
        { label: 'View All Tasks', icon: ClipboardList, path: `/${basePath}/task-management`, color: 'bg-blue-500' },
        { label: 'Mark Complete', icon: CheckCircle2, path: '#', color: 'bg-green-500' },
        { label: 'Notifications', icon: Bell, path: '#', color: 'bg-orange-500' },
        { label: 'Contact Admin', icon: User, path: '#', color: 'bg-purple-500' },
    ];

    const getStatusColor = (status) => {
        switch(status) {
            case 'completed': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
            case 'in-progress': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
            case 'pending': return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
            default: return 'bg-gray-100';
        }
    };

    const statCards = [
        { title: 'Pending Tasks', value: stats.pendingTasks, icon: ClipboardList, color: 'text-orange-600' },
        { title: 'Completed Today', value: stats.completedToday, icon: CheckCircle2, color: 'text-green-600' },
        { title: 'Urgent', value: stats.urgentTasks, icon: AlertCircle, color: 'text-red-600' },
        { title: 'Total Assigned', value: stats.totalAssigned, icon: FileText, color: 'text-blue-600' },
    ];

    return (
        <DashboardLayout>
            <WelcomeMessage
                user={user?.profile?.full_name || 'Office Assistant'}
                message="Daily tasks and assignments"
            />

            {/* Time Display */}
            <Card className="mb-6 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
                <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-full bg-primary/20">
                                <Clock className="w-8 h-8 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">{format(new Date(), 'EEEE')}</h3>
                                <p className="text-muted-foreground">{format(new Date(), 'MMMM d, yyyy')}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-4xl font-bold font-mono">{format(new Date(), 'HH:mm')}</p>
                            <Badge variant="outline" className="mt-1">
                                {stats.pendingTasks} tasks remaining
                            </Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {statCards.map((stat, index) => (
                    <StatCard key={index} {...stat} index={index} />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Quick Actions */}
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="w-5 h-5 text-primary" />
                            Quick Actions
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {quickActions.map((action, index) => (
                            <Button
                                key={index}
                                variant="outline"
                                className="w-full justify-start gap-3"
                                onClick={() => action.path !== '#' && navigate(action.path)}
                            >
                                <div className={`p-2 rounded-lg ${action.color}`}>
                                    <action.icon className="w-4 h-4 text-white" />
                                </div>
                                {action.label}
                                <ChevronRight className="w-4 h-4 ml-auto" />
                            </Button>
                        ))}
                    </CardContent>
                </Card>

                {/* Today's Tasks */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ClipboardList className="w-5 h-5 text-primary" />
                            Today's Tasks
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {todayTasks.map((task, index) => (
                                <div key={index} className={`p-4 rounded-lg border ${
                                    task.priority === 'urgent' ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900' :
                                    task.status === 'completed' ? 'bg-green-50/50 dark:bg-green-950/10' : 'bg-muted/30'
                                }`}>
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-3">
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                                task.status === 'completed' ? 'bg-green-500 text-white' :
                                                task.status === 'in-progress' ? 'bg-blue-500 text-white' :
                                                'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                                            }`}>
                                                {task.status === 'completed' ? '✓' : task.id}
                                            </div>
                                            <div>
                                                <p className={`font-medium ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                                                    {task.task}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    Assigned by: {task.assignedBy}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <Badge variant="outline" className={getStatusColor(task.status)}>
                                                {task.status}
                                            </Badge>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                <Clock className="w-3 h-3 inline mr-1" />{task.time}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Task Progress */}
            <Card className="mt-6">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                        Today's Progress
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex justify-between text-sm">
                            <span>Task Completion</span>
                            <span className="font-medium">
                                {stats.completedToday} / {stats.totalAssigned} ({Math.round((stats.completedToday / stats.totalAssigned) * 100)}%)
                            </span>
                        </div>
                        <div className="h-4 bg-muted rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all duration-500"
                                style={{ width: `${(stats.completedToday / stats.totalAssigned) * 100}%` }}
                            />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Started: 09:00 AM</span>
                            <span>Expected End: 05:00 PM</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Common Tasks Reference */}
            <Card className="mt-6">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Package className="w-5 h-5 text-primary" />
                        Common Task Categories
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { name: 'Document Delivery', icon: FileText, count: 4 },
                            { name: 'Refreshments', icon: Coffee, count: 2 },
                            { name: 'Supplies Collection', icon: Package, count: 3 },
                            { name: 'Notice Distribution', icon: Bell, count: 4 },
                        ].map((cat, index) => (
                            <div key={index} className="p-4 rounded-lg border text-center bg-muted/30">
                                <cat.icon className="w-8 h-8 mx-auto text-primary" />
                                <p className="font-medium mt-2 text-sm">{cat.name}</p>
                                <Badge variant="secondary" className="mt-1">{cat.count} today</Badge>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </DashboardLayout>
    );
};

export default PeonDashboard;
