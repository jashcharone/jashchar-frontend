/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SECURITY GUARD DASHBOARD
 * Campus security, entry/exit, and visitor management
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
    Shield, Users, DoorOpen, Clock, AlertTriangle,
    Bell, UserCheck, Car, Eye, ChevronRight,
    Activity, Phone, LogIn, LogOut
} from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import WelcomeMessage from '@/components/WelcomeMessage';
import StatCard from '@/components/StatCard';

const SecurityGuardDashboard = () => {
    const { user, school } = useAuth();
    const { selectedBranch } = useBranch();
    const navigate = useNavigate();
    
    const [stats] = useState({
        visitorsToday: 12,
        vehiclesIn: 45,
        lateArrivals: 8,
        alerts: 0
    });

    const recentVisitors = [
        { name: 'Rajesh Kumar', purpose: 'Parent Meeting', time: '10:30 AM', status: 'inside', badge: 'V001' },
        { name: 'Delivery - Amazon', purpose: 'Package Delivery', time: '10:15 AM', status: 'exited', badge: 'D012' },
        { name: 'Priya Sharma', purpose: 'Admission Enquiry', time: '09:45 AM', status: 'inside', badge: 'V002' },
        { name: 'Vendor - Stationary', purpose: 'Stock Delivery', time: '09:00 AM', status: 'exited', badge: 'D011' },
    ];

    const lateArrivals = [
        { name: 'Amit Patel', class: 'Class 10-A', time: '09:15 AM', reason: 'Traffic' },
        { name: 'Sneha Reddy', class: 'Class 9-B', time: '09:22 AM', reason: 'Medical' },
        { name: 'Rahul Verma', class: 'Class 8-C', time: '09:30 AM', reason: 'Not specified' },
    ];

    const quickActions = [
        { label: 'Register Visitor', icon: UserCheck, path: '/super-admin/front-office/visitor-book', color: 'bg-blue-500' },
        { label: 'Gate Pass', icon: DoorOpen, path: '/super-admin/front-office/gate-pass', color: 'bg-green-500' },
        { label: 'Emergency Alert', icon: AlertTriangle, path: '#', color: 'bg-red-500' },
        { label: 'Contact Admin', icon: Phone, path: '#', color: 'bg-purple-500' },
    ];

    const gateStatus = [
        { gate: 'Main Gate', status: 'open', vehicles: 25, visitors: 8 },
        { gate: 'Back Gate', status: 'closed', vehicles: 0, visitors: 0 },
        { gate: 'Service Gate', status: 'open', vehicles: 12, visitors: 2 },
    ];

    const statCards = [
        { title: 'Visitors Today', value: stats.visitorsToday, icon: Users, color: 'text-blue-600' },
        { title: 'Vehicles Inside', value: stats.vehiclesIn, icon: Car, color: 'text-green-600' },
        { title: 'Late Arrivals', value: stats.lateArrivals, icon: Clock, color: 'text-orange-600' },
        { title: 'Active Alerts', value: stats.alerts, icon: Bell, color: stats.alerts > 0 ? 'text-red-600' : 'text-green-600' },
    ];

    return (
        <DashboardLayout>
            <WelcomeMessage
                user={user?.profile?.full_name || 'Security'}
                message="Campus security and access control"
            />

            {/* Current Time Display */}
            <Card className="mb-6 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
                <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-full bg-primary/20">
                                <Shield className="w-8 h-8 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">Security Duty</h3>
                                <p className="text-muted-foreground">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-3xl font-bold font-mono">{format(new Date(), 'HH:mm')}</p>
                            <Badge variant="outline" className="text-green-600 border-green-600">
                                <Eye className="w-3 h-3 mr-1" /> On Duty
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

                {/* Recent Visitors */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-primary" />
                            Recent Visitors
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {recentVisitors.map((visitor, index) => (
                                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-full ${visitor.status === 'inside' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
                                            {visitor.status === 'inside' ? (
                                                <LogIn className="w-4 h-4 text-green-600" />
                                            ) : (
                                                <LogOut className="w-4 h-4 text-gray-500" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-medium">{visitor.name}</p>
                                            <p className="text-sm text-muted-foreground">{visitor.purpose}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <Badge variant={visitor.status === 'inside' ? 'default' : 'outline'}>
                                            {visitor.badge}
                                        </Badge>
                                        <p className="text-xs text-muted-foreground mt-1">{visitor.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Gate Status */}
            <Card className="mt-6">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <DoorOpen className="w-5 h-5 text-primary" />
                        Gate Status
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {gateStatus.map((gate, index) => (
                            <div key={index} className={`p-4 rounded-lg border ${
                                gate.status === 'open' ? 'bg-green-50 dark:bg-green-950/20 border-green-500' : 'bg-red-50 dark:bg-red-950/20 border-red-500'
                            }`}>
                                <div className="flex justify-between items-center mb-3">
                                    <span className="font-semibold">{gate.gate}</span>
                                    <Badge variant={gate.status === 'open' ? 'default' : 'destructive'}>
                                        {gate.status.toUpperCase()}
                                    </Badge>
                                </div>
                                <div className="flex gap-4 text-sm">
                                    <span className="flex items-center gap-1">
                                        <Car className="w-4 h-4" /> {gate.vehicles} vehicles
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Users className="w-4 h-4" /> {gate.visitors} visitors
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Late Arrivals */}
            {lateArrivals.length > 0 && (
                <Card className="mt-6 border-orange-500/50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-orange-600">
                            <Clock className="w-5 h-5" />
                            Late Arrivals Today
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {lateArrivals.map((student, index) => (
                                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900">
                                    <div>
                                        <p className="font-medium">{student.name}</p>
                                        <p className="text-sm text-muted-foreground">{student.class}</p>
                                    </div>
                                    <div className="text-right">
                                        <Badge variant="outline" className="border-orange-500 text-orange-600">{student.time}</Badge>
                                        <p className="text-xs text-muted-foreground mt-1">{student.reason}</p>
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

export default SecurityGuardDashboard;
