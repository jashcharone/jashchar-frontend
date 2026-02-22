/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * DRIVER DASHBOARD
 * Transport route and vehicle management
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
    Bus, MapPin, Users, Clock, Navigation,
    AlertTriangle, CheckCircle2, Fuel, Phone,
    Route, ChevronRight, Activity, Calendar
} from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useNavigate } from 'react-router-dom';
import WelcomeMessage from '@/components/WelcomeMessage';
import StatCard from '@/components/StatCard';

const DriverDashboard = () => {
    const { user, school } = useAuth();
    const { selectedBranch } = useBranch();
    const navigate = useNavigate();
    
    const [stats, setStats] = useState({
        assignedRoute: 'Route A - North Zone',
        totalStudents: 35,
        morningPickup: 28,
        eveningDrop: 32,
        vehicleNo: 'KA-01-AB-1234'
    });

    const routeStops = [
        { name: 'Jayanagar 4th Block', time: '07:15 AM', students: 5, status: 'completed' },
        { name: 'JP Nagar', time: '07:30 AM', students: 8, status: 'completed' },
        { name: 'BTM Layout', time: '07:45 AM', students: 6, status: 'current' },
        { name: 'HSR Layout', time: '08:00 AM', students: 9, status: 'pending' },
        { name: 'Koramangala', time: '08:15 AM', students: 7, status: 'pending' },
    ];

    const quickActions = [
        { label: 'Start Trip', icon: Navigation, path: '#', color: 'bg-green-500' },
        { label: 'Route Details', icon: Route, path: '/super-admin/transport/routes', color: 'bg-blue-500' },
        { label: 'Student List', icon: Users, path: '/super-admin/transport/assign-vehicle', color: 'bg-purple-500' },
        { label: 'Emergency Contact', icon: Phone, path: '#', color: 'bg-red-500' },
    ];

    const statCards = [
        { title: 'Total Students', value: stats.totalStudents, icon: Users, color: 'text-blue-600' },
        { title: 'Morning Pickup', value: stats.morningPickup, icon: Clock, color: 'text-green-600' },
        { title: 'Evening Drop', value: stats.eveningDrop, icon: Clock, color: 'text-orange-600' },
        { title: 'Route Stops', value: routeStops.length, icon: MapPin, color: 'text-purple-600' },
    ];

    const getStatusColor = (status) => {
        switch(status) {
            case 'completed': return 'bg-green-500';
            case 'current': return 'bg-blue-500 animate-pulse';
            case 'pending': return 'bg-gray-300 dark:bg-gray-600';
            default: return 'bg-gray-300';
        }
    };

    return (
        <DashboardLayout>
            <WelcomeMessage
                user={user?.profile?.full_name || 'Driver'}
                message="Transport route management"
            />

            {/* Vehicle Info Banner */}
            <Card className="mb-6 bg-gradient-to-r from-blue-500/10 to-blue-500/5 border-blue-500/20">
                <CardContent className="py-4">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-full bg-blue-500/20">
                                <Bus className="w-8 h-8 text-blue-500" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">{stats.assignedRoute}</h3>
                                <p className="text-muted-foreground">Vehicle: {stats.vehicleNo}</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <Badge variant="outline" className="text-green-600 border-green-600">
                                <CheckCircle2 className="w-3 h-3 mr-1" /> Vehicle Ready
                            </Badge>
                            <Badge variant="outline" className="border-blue-500 text-blue-600">
                                <Fuel className="w-3 h-3 mr-1" /> Fuel: 80%
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

                {/* Route Timeline */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Route className="w-5 h-5 text-primary" />
                            Today's Route - Morning Pickup
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="relative">
                            {routeStops.map((stop, index) => (
                                <div key={index} className="flex gap-4 pb-6 last:pb-0">
                                    {/* Timeline Line */}
                                    <div className="flex flex-col items-center">
                                        <div className={`w-4 h-4 rounded-full ${getStatusColor(stop.status)}`} />
                                        {index < routeStops.length - 1 && (
                                            <div className="w-0.5 flex-1 bg-muted mt-2" />
                                        )}
                                    </div>
                                    
                                    {/* Stop Details */}
                                    <div className="flex-1 pb-2">
                                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
                                            <div>
                                                <p className="font-semibold">{stop.name}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    <Clock className="w-3 h-3 inline mr-1" />
                                                    {stop.time}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <Badge variant={stop.status === 'current' ? 'default' : 'outline'}>
                                                    {stop.students} Students
                                                </Badge>
                                                {stop.status === 'current' && (
                                                    <p className="text-xs text-blue-500 mt-1">Current Stop</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Today's Schedule */}
            <Card className="mt-6">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-primary" />
                        Schedule Summary
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-full bg-green-500/20">
                                    <Clock className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="font-semibold text-green-700 dark:text-green-400">Morning Pickup</p>
                                    <p className="text-sm text-green-600 dark:text-green-500">6:45 AM - 8:30 AM</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-full bg-orange-500/20">
                                    <Clock className="w-5 h-5 text-orange-600" />
                                </div>
                                <div>
                                    <p className="font-semibold text-orange-700 dark:text-orange-400">Evening Drop</p>
                                    <p className="text-sm text-orange-600 dark:text-orange-500">3:30 PM - 5:30 PM</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </DashboardLayout>
    );
};

export default DriverDashboard;
