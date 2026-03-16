/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 🏨 HOSTEL WARDEN DASHBOARD - Enhanced Version
 * Live stats from backend API, real occupancy data, alerts & today summary
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
    Building, Users, Bed, UtensilsCrossed, Clock,
    AlertTriangle, CheckCircle2, DoorOpen, Key,
    ClipboardList, FileText, ChevronRight, Activity,
    UserCheck, IndianRupee, BarChart3, RefreshCw,
    Loader2, AlertCircle, ArrowUpRight, ArrowDownRight,
    TrendingUp, Home
} from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useNavigate, useParams } from 'react-router-dom';
import WelcomeMessage from '@/components/WelcomeMessage';
import StatCard from '@/components/StatCard';
import api from '@/lib/api';
import { formatDate } from '@/utils/dateUtils';

const HostelWardenDashboard = () => {
    const { user, currentSessionId } = useAuth();
    const { selectedBranch } = useBranch();
    const navigate = useNavigate();
    const { roleSlug } = useParams();
    const basePath = roleSlug || 'super-admin';
    
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState(null);
    const [occupancy, setOccupancy] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [todaySummary, setTodaySummary] = useState(null);

    const branchId = selectedBranch?.id;

    const fetchDashboardData = useCallback(async (isRefresh = false) => {
        if (!branchId) return;
        if (isRefresh) setRefreshing(true); else setLoading(true);

        try {
            const [statsRes, occupancyRes, alertsRes, todayRes] = await Promise.all([
                api.get('/hostel/dashboard/stats'),
                api.get('/hostel/dashboard/occupancy'),
                api.get('/hostel/dashboard/alerts'),
                api.get('/hostel/dashboard/today')
            ]);

            if (statsRes.data?.success) setStats(statsRes.data.data);
            if (occupancyRes.data?.success) setOccupancy(occupancyRes.data.data || []);
            if (alertsRes.data?.success) setAlerts(alertsRes.data.data || []);
            if (todayRes.data?.success) setTodaySummary(todayRes.data.data);
        } catch (error) {
            console.error('[HostelDashboard] Error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [branchId]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData, currentSessionId]);

    const quickActions = [
        { label: 'Manage Hostels', icon: Home, path: `/${basePath}/hostel/hostels`, color: 'bg-blue-500' },
        { label: 'Room Management', icon: Key, path: `/${basePath}/hostel/rooms`, color: 'bg-green-500' },
        { label: 'Student Allocation', icon: Users, path: `/${basePath}/hostel/hostel-students`, color: 'bg-purple-500' },
        { label: 'Fee Collection', icon: IndianRupee, path: `/${basePath}/hostel/fee`, color: 'bg-orange-500' },
        { label: 'Hostel Analysis', icon: BarChart3, path: `/${basePath}/hostel/analysis`, color: 'bg-cyan-500' },
    ];

    const statCards = stats ? [
        { title: 'Total Hostels', value: stats.totalHostels, icon: Building, color: 'text-blue-600' },
        { title: 'Total Beds', value: stats.totalBeds, icon: Bed, color: 'text-green-600' },
        { title: 'Allocated Students', value: stats.totalAllocated, icon: Users, color: 'text-purple-600' },
        { title: 'Available Beds', value: stats.availableBeds, icon: DoorOpen, color: 'text-orange-600' },
        { title: 'Occupancy Rate', value: `${stats.occupancyRate}%`, icon: TrendingUp, color: 'text-cyan-600' },
        { title: 'Fee Collected', value: `₹${(stats.feeCollected || 0).toLocaleString('en-IN')}`, icon: IndianRupee, color: 'text-emerald-600' },
    ] : [];

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-300';
            case 'warning': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-300';
            default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-300';
        }
    };

    const getSeverityIcon = (severity) => {
        switch (severity) {
            case 'critical': return <AlertCircle className="w-4 h-4 text-red-500" />;
            case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
            default: return <CheckCircle2 className="w-4 h-4 text-blue-500" />;
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <span className="ml-3 text-muted-foreground">Loading Hostel Dashboard...</span>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="flex items-center justify-between mb-6">
                <WelcomeMessage
                    user={user?.profile?.full_name || 'Hostel Warden'}
                    message="Hostel management and student welfare"
                />
                <Button
                    variant="outline" size="sm"
                    onClick={() => fetchDashboardData(true)}
                    disabled={refreshing}
                >
                    <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
                {statCards.map((stat, index) => (
                    <StatCard key={index} {...stat} index={index} />
                ))}
            </div>

            {/* Alerts Section */}
            {alerts.length > 0 && (
                <Card className="mb-6 border-l-4 border-l-yellow-500">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <AlertTriangle className="w-5 h-5 text-yellow-500" />
                            Alerts & Notifications ({alerts.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {alerts.map((alert, index) => (
                                <div key={index} className={`flex items-center gap-3 p-3 rounded-lg border ${getSeverityColor(alert.severity)}`}>
                                    {getSeverityIcon(alert.severity)}
                                    <span className="text-sm font-medium">{alert.message}</span>
                                    <Badge variant="outline" className="ml-auto text-xs capitalize">
                                        {alert.type?.replace(/_/g, ' ')}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

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

                {/* Hostel-wise Occupancy (Live Data) */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building className="w-5 h-5 text-primary" />
                            Hostel Occupancy Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {occupancy.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <Building className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                <p>No hostels configured yet</p>
                                <Button variant="link" onClick={() => navigate(`/${basePath}/hostel/hostels`)}>
                                    Add Hostel →
                                </Button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {occupancy.map((hostel, index) => (
                                    <div key={index} className="p-4 rounded-lg border bg-muted/30">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <p className="font-semibold">{hostel.hostelName}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {hostel.allocated}/{hostel.totalBeds} Beds
                                                    {' · '}{hostel.totalRooms} Rooms
                                                </p>
                                            </div>
                                            <Badge variant={hostel.hostelType?.toLowerCase() === 'girls' ? 'secondary' : 'default'}>
                                                {hostel.hostelType || 'Mixed'}
                                            </Badge>
                                        </div>
                                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full transition-all ${
                                                    hostel.occupancyRate >= 90 ? 'bg-red-500' :
                                                    hostel.occupancyRate >= 70 ? 'bg-yellow-500' : 'bg-green-500'
                                                }`}
                                                style={{ width: `${Math.min(hostel.occupancyRate, 100)}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between mt-1">
                                            <p className="text-xs text-muted-foreground">
                                                {hostel.available} beds available
                                            </p>
                                            <p className="text-xs font-medium">
                                                {hostel.occupancyRate}% Occupied
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Today's Summary */}
            {todaySummary && (
                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-primary" />
                            Today's Summary
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Check-ins */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 mb-2">
                                    <ArrowUpRight className="w-4 h-4 text-green-500" />
                                    <span className="font-semibold text-sm">
                                        Check-ins ({todaySummary.checkinCount})
                                    </span>
                                </div>
                                {todaySummary.checkins.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No check-ins today</p>
                                ) : (
                                    todaySummary.checkins.slice(0, 5).map((ci, i) => (
                                        <div key={i} className="flex items-center gap-2 p-2 rounded bg-green-50 dark:bg-green-950/20 text-sm">
                                            <DoorOpen className="w-3 h-3 text-green-500" />
                                            <span>{ci.hostel?.name} - {ci.room?.room_number_name}</span>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Check-outs */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 mb-2">
                                    <ArrowDownRight className="w-4 h-4 text-red-500" />
                                    <span className="font-semibold text-sm">
                                        Check-outs ({todaySummary.checkoutCount})
                                    </span>
                                </div>
                                {todaySummary.checkouts.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No check-outs today</p>
                                ) : (
                                    todaySummary.checkouts.slice(0, 5).map((co, i) => (
                                        <div key={i} className="flex items-center gap-2 p-2 rounded bg-red-50 dark:bg-red-950/20 text-sm">
                                            <DoorOpen className="w-3 h-3 text-red-500" />
                                            <span>{co.hostel?.name} - {co.room?.room_number_name}</span>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Fee Collections */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 mb-2">
                                    <IndianRupee className="w-4 h-4 text-emerald-500" />
                                    <span className="font-semibold text-sm">
                                        Fee Collections ({todaySummary.feeCount})
                                    </span>
                                </div>
                                {todaySummary.feeCollections.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No collections today</p>
                                ) : (
                                    <>
                                        {todaySummary.feeCollections.slice(0, 5).map((fee, i) => (
                                            <div key={i} className="flex items-center justify-between p-2 rounded bg-emerald-50 dark:bg-emerald-950/20 text-sm">
                                                <span>{fee.receipt_number || `#${fee.id?.slice(0, 8)}`}</span>
                                                <span className="font-semibold">₹{Number(fee.amount).toLocaleString('en-IN')}</span>
                                            </div>
                                        ))}
                                        <div className="pt-2 border-t">
                                            <p className="text-sm font-semibold text-emerald-600">
                                                Total: ₹{(todaySummary.totalFeeCollectedToday || 0).toLocaleString('en-IN')}
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </DashboardLayout>
    );
};

export default HostelWardenDashboard;
