/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LAB ASSISTANT DASHBOARD
 * Laboratory management and equipment tracking
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
    Beaker, FlaskConical, Calendar, Clock,
    AlertTriangle, CheckCircle2, Package, Wrench,
    ClipboardList, FileText, ChevronRight, Activity,
    Users, Settings, ShieldAlert
} from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useNavigate } from 'react-router-dom';
import WelcomeMessage from '@/components/WelcomeMessage';
import StatCard from '@/components/StatCard';

const LabAssistantDashboard = () => {
    const { user, school } = useAuth();
    const { selectedBranch } = useBranch();
    const navigate = useNavigate();
    
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState({
        scheduledLabs: 3,
        equipmentItems: 156,
        lowStockItems: 8,
        maintenanceDue: 2
    });

    const todaySchedule = [
        { time: '09:00 - 10:00', class: 'Class 10-A', subject: 'Physics', lab: 'Physics Lab 1', experiment: 'Ohm\'s Law' },
        { time: '11:00 - 12:00', class: 'Class 9-B', subject: 'Chemistry', lab: 'Chemistry Lab', experiment: 'Acid-Base Titration' },
        { time: '02:00 - 03:00', class: 'Class 11-A', subject: 'Biology', lab: 'Biology Lab', experiment: 'Microscopy' },
    ];

    const lowStockItems = [
        { name: 'Test Tubes', current: 15, minimum: 50, lab: 'Chemistry' },
        { name: 'Microscope Slides', current: 20, minimum: 100, lab: 'Biology' },
        { name: 'Resistors (100Ω)', current: 8, minimum: 30, lab: 'Physics' },
    ];

    const quickActions = [
        { label: 'Lab Schedule', icon: Calendar, path: '/super-admin/academics/class-timetable', color: 'bg-blue-500' },
        { label: 'Equipment List', icon: Package, path: '/super-admin/inventory/item-list', color: 'bg-green-500' },
        { label: 'Issue Items', icon: ClipboardList, path: '/super-admin/inventory/issue-item', color: 'bg-purple-500' },
        { label: 'Maintenance Log', icon: Wrench, path: '/super-admin/inventory', color: 'bg-orange-500' },
    ];

    const statCards = [
        { title: "Today's Labs", value: stats.scheduledLabs, icon: FlaskConical, color: 'text-blue-600' },
        { title: 'Equipment Items', value: stats.equipmentItems, icon: Package, color: 'text-green-600' },
        { title: 'Low Stock', value: stats.lowStockItems, icon: AlertTriangle, color: 'text-orange-600', changeType: 'alert' },
        { title: 'Maintenance Due', value: stats.maintenanceDue, icon: Wrench, color: 'text-red-600' },
    ];

    return (
        <DashboardLayout>
            <WelcomeMessage
                user={user?.profile?.full_name || 'Lab Assistant'}
                message="Laboratory equipment and schedule management"
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
                                onClick={() => navigate(action.path)}
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

                {/* Today's Lab Schedule */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-primary" />
                            Today's Lab Schedule
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {todaySchedule.map((item, index) => (
                                <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 rounded-full bg-primary/10">
                                            <Beaker className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-semibold">{item.experiment}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {item.class} • {item.subject} • {item.lab}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <Badge variant="outline">{item.time}</Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Low Stock Alert */}
            {stats.lowStockItems > 0 && (
                <Card className="mt-6 border-orange-500/50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-orange-600">
                            <ShieldAlert className="w-5 h-5" />
                            Low Stock Alert
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {lowStockItems.map((item, index) => (
                                <div key={index} className="p-4 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-medium">{item.name}</p>
                                            <p className="text-sm text-muted-foreground">{item.lab} Lab</p>
                                        </div>
                                        <Badge variant="destructive">{item.current}/{item.minimum}</Badge>
                                    </div>
                                    <div className="mt-2">
                                        <div className="h-2 bg-orange-200 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-orange-500 rounded-full"
                                                style={{ width: `${(item.current / item.minimum) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </DashboardLayout>
    );
};

export default LabAssistantDashboard;
