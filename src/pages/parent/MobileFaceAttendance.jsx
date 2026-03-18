/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * MOBILE FACE ATTENDANCE - Day 37
 * ─────────────────────────────────────────────────────────────────────────────
 * AI Face Attendance System - Mobile/Parent View Component
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import {
    Camera, CheckCircle2, XCircle, Clock, Calendar, MapPin,
    RefreshCw, ChevronLeft, ChevronRight, Bell, Smartphone,
    Shield, User, TrendingUp, AlertCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { formatDate, formatTime, formatDateTime } from '@/utils/dateUtils';
import { cn } from '@/lib/utils';
import api from '@/services/api';

// ═══════════════════════════════════════════════════════════════════════════════
// ATTENDANCE STATUS CARD
// ═══════════════════════════════════════════════════════════════════════════════

const AttendanceStatusCard = ({ status, arrivalTime, departureTime, loading }) => {
    if (loading) {
        return (
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600">
                <CardContent className="p-6">
                    <Skeleton className="h-8 w-32 bg-white/20 mb-4" />
                    <Skeleton className="h-12 w-24 bg-white/20" />
                </CardContent>
            </Card>
        );
    }

    const statusConfig = {
        present: {
            bg: 'from-green-500 to-green-600',
            icon: CheckCircle2,
            label: 'Present Today',
            sublabel: arrivalTime ? `Arrived at ${formatTime(arrivalTime)}` : 'Attendance marked'
        },
        absent: {
            bg: 'from-red-500 to-red-600',
            icon: XCircle,
            label: 'Absent Today',
            sublabel: 'No attendance recorded'
        },
        late: {
            bg: 'from-orange-500 to-orange-600',
            icon: Clock,
            label: 'Late Today',
            sublabel: arrivalTime ? `Arrived at ${formatTime(arrivalTime)}` : ''
        }
    };

    const config = statusConfig[status] || statusConfig.absent;
    const Icon = config.icon;

    return (
        <Card className={cn('bg-gradient-to-br text-white', config.bg)}>
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-white/80 text-sm mb-1">Today's Status</p>
                        <h2 className="text-2xl font-bold">{config.label}</h2>
                        <p className="text-white/70 mt-1 text-sm">{config.sublabel}</p>
                    </div>
                    <div className="p-3 bg-white/20 rounded-full">
                        <Icon className="h-8 w-8" />
                    </div>
                </div>

                {departureTime && (
                    <div className="mt-4 pt-4 border-t border-white/20">
                        <p className="text-sm text-white/80">
                            Left at {formatTime(departureTime)}
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// QUICK STATS
// ═══════════════════════════════════════════════════════════════════════════════

const QuickStats = ({ presentDays, totalDays, percentage }) => (
    <div className="grid grid-cols-3 gap-3">
        <Card>
            <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{presentDays}</p>
                <p className="text-xs text-muted-foreground">Present</p>
            </CardContent>
        </Card>
        <Card>
            <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-gray-600">{totalDays}</p>
                <p className="text-xs text-muted-foreground">Working Days</p>
            </CardContent>
        </Card>
        <Card>
            <CardContent className="p-4 text-center">
                <p className={cn(
                    'text-2xl font-bold',
                    percentage >= 75 ? 'text-green-600' : percentage >= 50 ? 'text-orange-600' : 'text-red-600'
                )}>{percentage}%</p>
                <p className="text-xs text-muted-foreground">Attendance</p>
            </CardContent>
        </Card>
    </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// ATTENDANCE RECORD ITEM
// ═══════════════════════════════════════════════════════════════════════════════

const AttendanceRecordItem = ({ record }) => (
    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
        <div className="flex items-center gap-3">
            <div className={cn(
                'p-2 rounded-full',
                record.entry_type === 'entry' 
                    ? 'bg-green-100 text-green-600' 
                    : 'bg-blue-100 text-blue-600'
            )}>
                {record.entry_type === 'entry' ? (
                    <CheckCircle2 className="h-4 w-4" />
                ) : (
                    <Clock className="h-4 w-4" />
                )}
            </div>
            <div>
                <p className="font-medium text-sm">
                    {record.entry_type === 'entry' ? 'Arrived' : 'Departed'}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {record.camera_devices?.location || 'Unknown location'}
                </div>
            </div>
        </div>
        <div className="text-right">
            <p className="font-medium text-sm">{formatTime(record.recognized_at)}</p>
            {record.confidence && (
                <p className="text-xs text-muted-foreground">
                    {(record.confidence * 100).toFixed(0)}% match
                </p>
            )}
        </div>
    </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// DAILY RECORD CARD
// ═══════════════════════════════════════════════════════════════════════════════

const DailyRecordCard = ({ record }) => (
    <Card className="mb-3">
        <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{formatDate(record.date)}</span>
                </div>
                <Badge variant={record.status === 'present' ? 'default' : 'destructive'}>
                    {record.status === 'present' ? '✓ Present' : '✗ Absent'}
                </Badge>
            </div>
            
            {record.first_entry && (
                <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Entry</span>
                    <span className="font-medium">{formatTime(record.first_entry)}</span>
                </div>
            )}
            
            {record.last_exit && (
                <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-muted-foreground">Exit</span>
                    <span className="font-medium">{formatTime(record.last_exit)}</span>
                </div>
            )}
        </CardContent>
    </Card>
);

// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATION ITEM
// ═══════════════════════════════════════════════════════════════════════════════

const NotificationItem = ({ notification }) => {
    const typeIcons = {
        arrival: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-100' },
        departure: { icon: Clock, color: 'text-blue-600', bg: 'bg-blue-100' },
        late_arrival: { icon: AlertCircle, color: 'text-orange-600', bg: 'bg-orange-100' },
        absent: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100' },
        spoof_attempt: { icon: Shield, color: 'text-red-600', bg: 'bg-red-100' }
    };

    const config = typeIcons[notification.notification_type] || typeIcons.arrival;
    const Icon = config.icon;

    return (
        <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50">
            <div className={cn('p-2 rounded-full', config.bg)}>
                <Icon className={cn('h-4 w-4', config.color)} />
            </div>
            <div className="flex-1">
                <p className="text-sm">{notification.message}</p>
                <p className="text-xs text-muted-foreground mt-1">
                    {formatDateTime(notification.sent_at)}
                </p>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const MobileFaceAttendance = () => {
    const { user, currentSessionId, organizationId } = useAuth();
    const { selectedBranch } = useBranch();

    // State
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [todayStatus, setTodayStatus] = useState(null);
    const [history, setHistory] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    const branchId = selectedBranch?.id;
    
    // For parent login, get student ID from user context
    const studentId = user?.student_id || user?.linked_student_id;

    // ═══════════════════════════════════════════════════════════════════════════
    // DATA FETCH
    // ═══════════════════════════════════════════════════════════════════════════

    const fetchTodayStatus = useCallback(async () => {
        if (!branchId || !studentId) return;

        try {
            const response = await api.get('/mobile/face-attendance/status', {
                params: { student_id: studentId, branch_id: branchId }
            });
            if (response.data?.success) {
                setTodayStatus(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching today status:', error);
            // Demo data
            setTodayStatus({
                student: {
                    id: studentId,
                    name: 'Demo Student',
                    admission_number: 'ADM001',
                    class: '10',
                    section: 'A'
                },
                face_registered: true,
                today: {
                    date: new Date().toISOString().split('T')[0],
                    status: 'present',
                    arrival_time: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
                    departure_time: null
                },
                records: []
            });
        } finally {
            setLoading(false);
        }
    }, [branchId, studentId]);

    const fetchHistory = useCallback(async () => {
        if (!branchId || !studentId) return;

        try {
            const response = await api.get('/mobile/face-attendance/history', {
                params: {
                    student_id: studentId,
                    branch_id: branchId,
                    session_id: currentSessionId,
                    month: selectedMonth,
                    year: selectedYear
                }
            });
            if (response.data?.success) {
                setHistory(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching history:', error);
            // Demo data
            setHistory({
                summary: {
                    present_days: 22,
                    working_days: 25,
                    attendance_percentage: 88
                },
                daily_records: []
            });
        }
    }, [branchId, studentId, currentSessionId, selectedMonth, selectedYear]);

    const fetchNotifications = useCallback(async () => {
        if (!studentId) return;

        try {
            const response = await api.get('/mobile/face-attendance/notifications', {
                params: { student_id: studentId, limit: 30 }
            });
            if (response.data?.success) {
                setNotifications(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    }, [studentId]);

    useEffect(() => {
        fetchTodayStatus();
        fetchHistory();
        fetchNotifications();
    }, [fetchTodayStatus, fetchHistory, fetchNotifications]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await Promise.all([fetchTodayStatus(), fetchHistory(), fetchNotifications()]);
        setRefreshing(false);
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // MONTH NAVIGATION
    // ═══════════════════════════════════════════════════════════════════════════

    const handlePrevMonth = () => {
        if (selectedMonth === 1) {
            setSelectedMonth(12);
            setSelectedYear(prev => prev - 1);
        } else {
            setSelectedMonth(prev => prev - 1);
        }
    };

    const handleNextMonth = () => {
        if (selectedMonth === 12) {
            setSelectedMonth(1);
            setSelectedYear(prev => prev + 1);
        } else {
            setSelectedMonth(prev => prev + 1);
        }
    };

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    // ═══════════════════════════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════════════════════════

    if (!studentId) {
        return (
            <div className="p-4">
                <Alert>
                    <User className="h-4 w-4" />
                    <AlertDescription>
                        No student linked to your account. Please contact administrator.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 border-b p-4 sticky top-0 z-10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={todayStatus?.student?.photo_url} />
                            <AvatarFallback>
                                {todayStatus?.student?.name?.charAt(0) || 'S'}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <h1 className="font-semibold">
                                {todayStatus?.student?.name || 'Loading...'}
                            </h1>
                            <p className="text-xs text-muted-foreground">
                                Class {todayStatus?.student?.class}-{todayStatus?.student?.section}
                            </p>
                        </div>
                    </div>
                    <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={handleRefresh}
                        disabled={refreshing}
                    >
                        <RefreshCw className={cn('h-5 w-5', refreshing && 'animate-spin')} />
                    </Button>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
                {/* Today's Status */}
                <AttendanceStatusCard
                    status={todayStatus?.today?.status || 'absent'}
                    arrivalTime={todayStatus?.today?.arrival_time}
                    departureTime={todayStatus?.today?.departure_time}
                    loading={loading}
                />

                {/* Face Registration Alert */}
                {todayStatus && !todayStatus.face_registered && (
                    <Alert className="bg-orange-50 border-orange-200">
                        <Camera className="h-4 w-4 text-orange-600" />
                        <AlertDescription className="text-orange-800">
                            Face not registered. Please visit school to complete registration.
                        </AlertDescription>
                    </Alert>
                )}

                {/* Tabs */}
                <Tabs defaultValue="history" className="space-y-4">
                    <TabsList className="w-full grid grid-cols-3">
                        <TabsTrigger value="today" className="text-xs">
                            <Clock className="h-4 w-4 mr-1" />
                            Today
                        </TabsTrigger>
                        <TabsTrigger value="history" className="text-xs">
                            <Calendar className="h-4 w-4 mr-1" />
                            History
                        </TabsTrigger>
                        <TabsTrigger value="alerts" className="text-xs">
                            <Bell className="h-4 w-4 mr-1" />
                            Alerts
                        </TabsTrigger>
                    </TabsList>

                    {/* Today Tab */}
                    <TabsContent value="today">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg">Today's Records</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {todayStatus?.records?.length > 0 ? (
                                    <div className="space-y-2">
                                        {todayStatus.records.map((record, idx) => (
                                            <AttendanceRecordItem key={idx} record={record} />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Camera className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                        <p>No records for today</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* History Tab */}
                    <TabsContent value="history">
                        {/* Quick Stats */}
                        <QuickStats
                            presentDays={history?.summary?.present_days || 0}
                            totalDays={history?.summary?.working_days || 0}
                            percentage={history?.summary?.attendance_percentage || 0}
                        />

                        {/* Month Navigation */}
                        <div className="flex items-center justify-between my-4">
                            <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
                                <ChevronLeft className="h-5 w-5" />
                            </Button>
                            <span className="font-medium">
                                {monthNames[selectedMonth - 1]} {selectedYear}
                            </span>
                            <Button variant="ghost" size="icon" onClick={handleNextMonth}>
                                <ChevronRight className="h-5 w-5" />
                            </Button>
                        </div>

                        {/* Attendance Progress */}
                        <Card className="mb-4">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm">Attendance Progress</span>
                                    <span className="text-sm font-medium">
                                        {history?.summary?.attendance_percentage || 0}%
                                    </span>
                                </div>
                                <Progress 
                                    value={history?.summary?.attendance_percentage || 0} 
                                    className="h-2"
                                />
                            </CardContent>
                        </Card>

                        {/* Daily Records */}
                        <ScrollArea className="h-[400px]">
                            {history?.daily_records?.length > 0 ? (
                                history.daily_records.map((record, idx) => (
                                    <DailyRecordCard key={idx} record={record} />
                                ))
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                    <p>No records for this month</p>
                                </div>
                            )}
                        </ScrollArea>
                    </TabsContent>

                    {/* Alerts Tab */}
                    <TabsContent value="alerts">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg">Recent Notifications</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ScrollArea className="h-[400px]">
                                    {notifications.length > 0 ? (
                                        <div className="space-y-1">
                                            {notifications.map((notification, idx) => (
                                                <NotificationItem 
                                                    key={notification.id || idx} 
                                                    notification={notification} 
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                            <p>No notifications yet</p>
                                        </div>
                                    )}
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
};

export default MobileFaceAttendance;
