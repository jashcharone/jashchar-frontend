/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * MAINTENANCE STAFF DASHBOARD
 * Infrastructure maintenance and repair management
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
    Wrench, ClipboardList, Clock, AlertTriangle,
    CheckCircle2, Hammer, Lightbulb, Droplets,
    Wind, Plug, ChevronRight, Activity, MapPin
} from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useNavigate, useParams } from 'react-router-dom';
import WelcomeMessage from '@/components/WelcomeMessage';
import StatCard from '@/components/StatCard';

const MaintenanceStaffDashboard = () => {
    const { user } = useAuth();
    const { selectedBranch } = useBranch();
    const navigate = useNavigate();
    const { roleSlug } = useParams();
    const basePath = roleSlug || 'super-admin';
    
    const [stats] = useState({
        pendingTasks: 8,
        completedToday: 5,
        highPriority: 2,
        scheduledMaintenance: 3
    });

    const pendingTasks = [
        { id: 'M001', task: 'AC Repair - Principal Office', location: 'Admin Block', priority: 'high', reported: '2 hours ago', category: 'HVAC' },
        { id: 'M002', task: 'Broken Window - Class 8A', location: 'Block A', priority: 'medium', reported: '4 hours ago', category: 'Carpentry' },
        { id: 'M003', task: 'Water Leakage - Girls Washroom', location: 'Block B', priority: 'high', reported: '1 hour ago', category: 'Plumbing' },
        { id: 'M004', task: 'Light Replacement - Lab', location: 'Science Block', priority: 'low', reported: 'Yesterday', category: 'Electrical' },
        { id: 'M005', task: 'Door Lock Issue - Staff Room', location: 'Admin Block', priority: 'medium', reported: '5 hours ago', category: 'Carpentry' },
    ];

    const completedTasks = [
        { task: 'Fan Repair - Class 10B', completedAt: '10:30 AM' },
        { task: 'Desk Repair - Library', completedAt: '09:15 AM' },
        { task: 'Paint Touch-up - Corridor', completedAt: '08:00 AM' },
    ];

    const quickActions = [
        { label: 'View All Tasks', icon: ClipboardList, path: `/${basePath}/task-management`, color: 'bg-blue-500' },
        { label: 'Report Issue', icon: AlertTriangle, path: '#', color: 'bg-orange-500' },
        { label: 'Inventory', icon: Wrench, path: `/${basePath}/inventory/item-list`, color: 'bg-green-500' },
        { label: 'Schedule', icon: Clock, path: `/${basePath}/task-management`, color: 'bg-purple-500' },
    ];

    const getCategoryIcon = (category) => {
        switch(category) {
            case 'Plumbing': return Droplets;
            case 'Electrical': return Plug;
            case 'HVAC': return Wind;
            case 'Carpentry': return Hammer;
            default: return Wrench;
        }
    };

    const getPriorityColor = (priority) => {
        switch(priority) {
            case 'high': return 'destructive';
            case 'medium': return 'default';
            case 'low': return 'secondary';
            default: return 'outline';
        }
    };

    const statCards = [
        { title: 'Pending Tasks', value: stats.pendingTasks, icon: ClipboardList, color: 'text-orange-600' },
        { title: 'Completed Today', value: stats.completedToday, icon: CheckCircle2, color: 'text-green-600' },
        { title: 'High Priority', value: stats.highPriority, icon: AlertTriangle, color: 'text-red-600' },
        { title: 'Scheduled', value: stats.scheduledMaintenance, icon: Clock, color: 'text-blue-600' },
    ];

    return (
        <DashboardLayout>
            <WelcomeMessage
                user={user?.profile?.full_name || 'Maintenance Staff'}
                message="Infrastructure and facility maintenance"
            />

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

                {/* Pending Tasks */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ClipboardList className="w-5 h-5 text-primary" />
                            Pending Tasks
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {pendingTasks.map((task, index) => {
                                const CategoryIcon = getCategoryIcon(task.category);
                                return (
                                    <div key={index} className={`p-4 rounded-lg border ${
                                        task.priority === 'high' ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900' : 'bg-muted/50'
                                    }`}>
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start gap-3">
                                                <div className={`p-2 rounded-full ${
                                                    task.priority === 'high' ? 'bg-red-100 dark:bg-red-900/50' : 'bg-primary/10'
                                                }`}>
                                                    <CategoryIcon className={`w-4 h-4 ${
                                                        task.priority === 'high' ? 'text-red-600' : 'text-primary'
                                                    }`} />
                                                </div>
                                                <div>
                                                    <p className="font-medium">{task.task}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        <MapPin className="w-3 h-3 inline mr-1" />
                                                        {task.location}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        <Clock className="w-3 h-3 inline mr-1" />
                                                        Reported {task.reported}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <Badge variant={getPriorityColor(task.priority)}>
                                                    {task.priority.toUpperCase()}
                                                </Badge>
                                                <p className="text-xs text-muted-foreground mt-1">#{task.id}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Completed Today */}
            <Card className="mt-6">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-600">
                        <CheckCircle2 className="w-5 h-5" />
                        Completed Today
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {completedTasks.map((task, index) => (
                            <div key={index} className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
                                <div className="flex items-center gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                                    <div>
                                        <p className="font-medium">{task.task}</p>
                                        <p className="text-sm text-green-600">Completed at {task.completedAt}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Maintenance Categories Stats */}
            <Card className="mt-6">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Wrench className="w-5 h-5 text-primary" />
                        Category Breakdown
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { name: 'Electrical', count: 3, icon: Plug, color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30' },
                            { name: 'Plumbing', count: 2, icon: Droplets, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' },
                            { name: 'HVAC', count: 1, icon: Wind, color: 'text-cyan-600 bg-cyan-100 dark:bg-cyan-900/30' },
                            { name: 'Carpentry', count: 2, icon: Hammer, color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30' },
                        ].map((cat, index) => (
                            <div key={index} className="p-4 rounded-lg border text-center">
                                <div className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center ${cat.color.split(' ').slice(1).join(' ')}`}>
                                    <cat.icon className={`w-6 h-6 ${cat.color.split(' ')[0]}`} />
                                </div>
                                <p className="font-medium mt-2">{cat.name}</p>
                                <p className="text-2xl font-bold">{cat.count}</p>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </DashboardLayout>
    );
};

export default MaintenanceStaffDashboard;
