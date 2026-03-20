/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * FACE ATTENDANCE DASHBOARD - Day 31
 * ─────────────────────────────────────────────────────────────────────────────
 * AI Face Attendance System - Main Analytics Dashboard
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
    RefreshCw, Calendar as CalendarIcon, Users, UserCheck, UserX, Clock,
    Shield, AlertTriangle, TrendingUp, Eye, Camera, Activity, 
    Download, Settings, ChevronRight, Zap, Brain, BarChart3
} from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { formatDate, formatDateTime } from '@/utils/dateUtils';
import { cn } from '@/lib/utils';
import faceAnalyticsApi from '@/services/faceAnalyticsApi';
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
    Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

// ═══════════════════════════════════════════════════════════════════════════════
// CHART COLORS
// ═══════════════════════════════════════════════════════════════════════════════

const COLORS = {
    present: '#22c55e',    // Green
    absent: '#ef4444',     // Red
    late: '#f59e0b',       // Yellow
    unknown: '#6b7280',    // Gray
    success: '#3b82f6',    // Blue
    spoof: '#dc2626',      // Dark Red
};

const PIE_COLORS = ['#22c55e', '#ef4444', '#f59e0b', '#6b7280'];

// ═══════════════════════════════════════════════════════════════════════════════
// STAT CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const StatCard = ({ title, value, icon: Icon, trend, trendValue, color = 'primary', loading }) => {
    const colorClasses = {
        primary: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30',
        success: 'bg-green-50 text-green-600 dark:bg-green-900/30',
        warning: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/30',
        danger: 'bg-red-50 text-red-600 dark:bg-red-900/30',
        purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30',
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-10 w-10 rounded-lg" />
                        <Skeleton className="h-8 w-20" />
                    </div>
                    <Skeleton className="h-4 w-24 mt-2" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div className={cn('p-3 rounded-lg', colorClasses[color])}>
                        <Icon className="h-6 w-6" />
                    </div>
                    <div className="text-right">
                        <p className="text-3xl font-bold">{value}</p>
                        {trend && (
                            <div className={cn(
                                'flex items-center gap-1 text-sm',
                                trend === 'up' ? 'text-green-600' : 'text-red-600'
                            )}>
                                <TrendingUp className={cn('h-3 w-3', trend === 'down' && 'rotate-180')} />
                                {trendValue}%
                            </div>
                        )}
                    </div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">{title}</p>
            </CardContent>
        </Card>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const FaceAttendanceDashboard = () => {
    const { user, currentSessionId, organizationId } = useAuth();
    const { selectedBranch } = useBranch();

    // State
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [activeTab, setActiveTab] = useState('overview');

    // Data State
    const [dailyStats, setDailyStats] = useState(null);
    const [weeklyTrends, setWeeklyTrends] = useState([]);
    const [classWiseStats, setClassWiseStats] = useState([]);
    const [performanceStats, setPerformanceStats] = useState(null);
    const [spoofStats, setSpoofStats] = useState(null);
    const [lateArrivals, setLateArrivals] = useState([]);
    const [unknownFaces, setUnknownFaces] = useState([]);

    const branchId = selectedBranch?.id;

    // ═══════════════════════════════════════════════════════════════════════════
    // DATA FETCHING
    // ═══════════════════════════════════════════════════════════════════════════

    const fetchDashboardData = useCallback(async () => {
        if (!branchId) return;

        try {
            setRefreshing(true);
            const dateStr = selectedDate.toISOString().split('T')[0];
            const params = { 
                branch_id: branchId, 
                session_id: currentSessionId,
                date: dateStr 
            };

            // Fetch all data in parallel
            const [
                dailyRes,
                weeklyRes,
                classRes,
                perfRes,
                spoofRes,
                lateRes,
                unknownRes
            ] = await Promise.all([
                faceAnalyticsApi.getDailyStats(params),
                faceAnalyticsApi.getWeeklyTrends({ ...params, days: 7 }),
                faceAnalyticsApi.getClassWiseStats(params),
                faceAnalyticsApi.getPerformanceStats({ branch_id: branchId, days: 7 }),
                faceAnalyticsApi.getSpoofStats({ branch_id: branchId, date: dateStr }),
                faceAnalyticsApi.getLateArrivals({ ...params, limit: 10 }),
                faceAnalyticsApi.getUnknownFaces({ branch_id: branchId, date: dateStr, limit: 5 })
            ]);

            if (dailyRes.success) setDailyStats(dailyRes.data);
            if (weeklyRes.success) setWeeklyTrends(weeklyRes.data);
            if (classRes.success) setClassWiseStats(classRes.data);
            if (perfRes.success) setPerformanceStats(perfRes.data);
            if (spoofRes.success) setSpoofStats(spoofRes.data);
            if (lateRes.success) setLateArrivals(lateRes.data);
            if (unknownRes.success) setUnknownFaces(unknownRes.data);

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [branchId, currentSessionId, selectedDate]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    // ═══════════════════════════════════════════════════════════════════════════
    // RENDER HELPERS
    // ═══════════════════════════════════════════════════════════════════════════

    const renderOverviewTab = () => (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard
                    title="Total Students"
                    value={dailyStats?.total_students || 0}
                    icon={Users}
                    color="primary"
                    loading={loading}
                />
                <StatCard
                    title="Present Today"
                    value={dailyStats?.students_present || 0}
                    icon={UserCheck}
                    color="success"
                    loading={loading}
                />
                <StatCard
                    title="Absent Today"
                    value={dailyStats?.students_absent || 0}
                    icon={UserX}
                    color="danger"
                    loading={loading}
                />
                <StatCard
                    title="Late Arrivals"
                    value={dailyStats?.students_late || 0}
                    icon={Clock}
                    color="warning"
                    loading={loading}
                />
                <StatCard
                    title="Attendance Rate"
                    value={`${dailyStats?.student_attendance_rate || 0}%`}
                    icon={TrendingUp}
                    color="purple"
                    loading={loading}
                />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Weekly Trends Chart */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5" />
                            Weekly Attendance Trends
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Skeleton className="h-[300px] w-full" />
                        ) : (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={weeklyTrends}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="day_name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="students_present" name="Present" fill={COLORS.present} />
                                    <Bar dataKey="students_absent" name="Absent" fill={COLORS.absent} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                {/* Attendance Pie Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Today's Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Skeleton className="h-[250px] w-full" />
                        ) : (
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie
                                        data={[
                                            { name: 'Present', value: dailyStats?.students_present || 0 },
                                            { name: 'Absent', value: dailyStats?.students_absent || 0 },
                                            { name: 'Late', value: dailyStats?.students_late || 0 },
                                        ]}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                        label={({ name, percent }) => 
                                            `${name}: ${(percent * 100).toFixed(0)}%`
                                        }
                                    >
                                        {PIE_COLORS.map((color, index) => (
                                            <Cell key={`cell-${index}`} fill={color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Recognition Stats & Security Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Face Recognition Performance */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Brain className="h-5 w-5" />
                            AI Recognition Performance
                        </CardTitle>
                        <CardDescription>Last 7 days metrics</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {loading ? (
                            <div className="space-y-4">
                                {[1, 2, 3, 4].map(i => (
                                    <Skeleton key={i} className="h-8 w-full" />
                                ))}
                            </div>
                        ) : (
                            <>
                                <div className="flex justify-between items-center">
                                    <span>Total Recognitions</span>
                                    <Badge variant="outline">
                                        {performanceStats?.total_recognitions || 0}
                                    </Badge>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span>Success Rate</span>
                                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                                        {performanceStats?.successful_rate || 0}%
                                    </Badge>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span>Avg. Confidence</span>
                                    <Badge variant="outline">
                                        {((performanceStats?.avg_confidence || 0) * 100).toFixed(1)}%
                                    </Badge>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span>Avg. Processing Time</span>
                                    <Badge variant="outline">
                                        {performanceStats?.avg_processing_time_ms || 0}ms
                                    </Badge>
                                </div>
                                <Separator />
                                <div className="flex justify-between items-center">
                                    <span>Peak Hour</span>
                                    <span className="font-medium">
                                        {performanceStats?.peak_hour || 0}:00 
                                        ({performanceStats?.peak_hour_count || 0} recognitions)
                                    </span>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Security Stats */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            Security Overview
                        </CardTitle>
                        <CardDescription>Anti-spoofing stats for today</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {loading ? (
                            <div className="space-y-4">
                                {[1, 2, 3, 4].map(i => (
                                    <Skeleton key={i} className="h-8 w-full" />
                                ))}
                            </div>
                        ) : (
                            <>
                                <div className="flex justify-between items-center">
                                    <span>Spoof Attempts</span>
                                    <Badge variant="destructive">
                                        {spoofStats?.total_attempts || 0}
                                    </Badge>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span>Blocked</span>
                                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                                        {spoofStats?.blocked || 0}
                                    </Badge>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span>Block Rate</span>
                                    <Badge variant="outline">
                                        {spoofStats?.block_rate || 0}%
                                    </Badge>
                                </div>
                                <Separator />
                                <div className="space-y-2">
                                    <p className="text-sm font-medium">Attack Types</p>
                                    {Object.entries(spoofStats?.by_type || {}).map(([type, count]) => (
                                        <div key={type} className="flex justify-between text-sm">
                                            <span className="capitalize">{type.replace('_', ' ')}</span>
                                            <span>{count}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Bottom Row - Late Arrivals & Unknown Faces */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Late Arrivals */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="h-5 w-5 text-yellow-500" />
                                Late Arrivals
                            </CardTitle>
                            <CardDescription>Students who arrived late today</CardDescription>
                        </div>
                        <Button variant="ghost" size="sm">
                            View All <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map(i => (
                                    <Skeleton key={i} className="h-12 w-full" />
                                ))}
                            </div>
                        ) : lateArrivals.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p>No late arrivals today! 🎉</p>
                            </div>
                        ) : (
                            <ScrollArea className="h-[200px]">
                                <div className="space-y-3">
                                    {lateArrivals.map((student, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                                                    <Clock className="h-4 w-4 text-yellow-600" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm">{student.student_name}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {student.class_name} {student.section_name}
                                                    </p>
                                                </div>
                                            </div>
                                            <Badge variant="outline" className="text-yellow-600">
                                                +{student.late_minutes} min
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        )}
                    </CardContent>
                </Card>

                {/* Unknown Faces */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Eye className="h-5 w-5 text-gray-500" />
                                Unknown Faces
                            </CardTitle>
                            <CardDescription>Unidentified faces detected today</CardDescription>
                        </div>
                        <Button variant="ghost" size="sm">
                            Review All <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map(i => (
                                    <Skeleton key={i} className="h-12 w-full" />
                                ))}
                            </div>
                        ) : unknownFaces.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <UserCheck className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p>All faces recognized! ✓</p>
                            </div>
                        ) : (
                            <ScrollArea className="h-[200px]">
                                <div className="space-y-3">
                                    {unknownFaces.map((face, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-gray-200 overflow-hidden">
                                                    {face.snapshot_url ? (
                                                        <img 
                                                            src={face.snapshot_url} 
                                                            alt="Unknown face" 
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <Eye className="h-5 w-5 m-2.5 text-gray-400" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-sm">
                                                        {formatDateTime(face.detected_at)}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {face.location || 'Unknown location'}
                                                    </p>
                                                </div>
                                            </div>
                                            <Button size="sm" variant="outline">
                                                Identify
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );

    const renderClassWiseTab = () => (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Class-wise Attendance</CardTitle>
                    <CardDescription>Attendance breakdown by class and section for {formatDate(selectedDate)}</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3, 4, 5].map(i => (
                                <Skeleton key={i} className="h-16 w-full" />
                            ))}
                        </div>
                    ) : classWiseStats.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No class-wise data available</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {classWiseStats.map((cls, idx) => (
                                <div key={idx} className="p-4 rounded-lg border">
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <h4 className="font-semibold">
                                                {cls.class_name} {cls.section_name && `- ${cls.section_name}`}
                                            </h4>
                                            <p className="text-sm text-muted-foreground">
                                                Total Students: {cls.total_students}
                                            </p>
                                        </div>
                                        <Badge 
                                            variant={cls.attendance_rate >= 75 ? 'success' : cls.attendance_rate >= 50 ? 'warning' : 'destructive'}
                                            className={cn(
                                                cls.attendance_rate >= 75 && 'bg-green-100 text-green-800',
                                                cls.attendance_rate >= 50 && cls.attendance_rate < 75 && 'bg-yellow-100 text-yellow-800',
                                                cls.attendance_rate < 50 && 'bg-red-100 text-red-800'
                                            )}
                                        >
                                            {cls.attendance_rate}%
                                        </Badge>
                                    </div>
                                    <Progress value={cls.attendance_rate} className="h-2 mb-3" />
                                    <div className="grid grid-cols-4 gap-4 text-sm">
                                        <div className="text-center">
                                            <p className="text-green-600 font-semibold">{cls.students_present}</p>
                                            <p className="text-muted-foreground">Present</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-red-600 font-semibold">{cls.students_absent}</p>
                                            <p className="text-muted-foreground">Absent</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-yellow-600 font-semibold">{cls.students_late}</p>
                                            <p className="text-muted-foreground">Late</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-blue-600 font-semibold">{cls.face_marked}</p>
                                            <p className="text-muted-foreground">Face Marked</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );

    // ═══════════════════════════════════════════════════════════════════════════
    // MAIN RENDER
    // ═══════════════════════════════════════════════════════════════════════════

    if (!branchId) {
        return (
            <DashboardLayout>
                <div className="p-6">
                    <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            Please select a branch to view the Face Attendance Dashboard.
                        </AlertDescription>
                    </Alert>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Brain className="h-8 w-8 text-primary" />
                        AI Face Attendance Dashboard
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Real-time analytics and insights for face-based attendance
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Date Picker */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="w-[200px] justify-start text-left font-normal">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {formatDate(selectedDate)}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={(date) => date && setSelectedDate(date)}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>

                    {/* Refresh Button */}
                    <Button 
                        variant="outline" 
                        onClick={fetchDashboardData}
                        disabled={refreshing}
                    >
                        <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
                        Refresh
                    </Button>

                    {/* Export */}
                    <Button variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full max-w-md grid-cols-3">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="class-wise">Class-wise</TabsTrigger>
                    <TabsTrigger value="cameras">Cameras</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-6">
                    {renderOverviewTab()}
                </TabsContent>

                <TabsContent value="class-wise" className="mt-6">
                    {renderClassWiseTab()}
                </TabsContent>

                <TabsContent value="cameras" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Camera className="h-5 w-5" />
                                Camera Performance
                            </CardTitle>
                            <CardDescription>Recognition stats by camera location</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-12 text-muted-foreground">
                                <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>Camera heatmap will be available in Day 32</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
            </div>
        </DashboardLayout>
    );
};

export default FaceAttendanceDashboard;
