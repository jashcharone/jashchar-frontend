/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SMART STUDENT ATTENDANCE ANALYTICS
 * ─────────────────────────────────────────────────────────────────────────────
 * Analytics dashboard for Student smart attendance
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { sortClasses, sortSections } from '@/utils/classOrderUtils';
import { formatDate } from '@/utils/dateUtils';
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

import {
    BarChart3, Users, GraduationCap, TrendingUp, TrendingDown,
    CheckCircle2, XCircle, Clock, Calendar, RefreshCw, Loader2,
    ScanFace, QrCode, CreditCard, Percent
} from 'lucide-react';

const COLORS = {
    present: '#22c55e',
    absent: '#ef4444',
    late: '#f59e0b',
    face: '#3b82f6',
    qr: '#8b5cf6',
    card: '#06b6d4'
};

const SmartStudentAnalytics = () => {
    const { user, currentSessionId, organizationId } = useAuth();
    const { selectedBranch } = useBranch();
    const { toast } = useToast();

    const branchId = selectedBranch?.id || user?.profile?.branch_id;

    const [loading, setLoading] = useState(false);
    const [classes, setClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState('all');
    const [dateRange, setDateRange] = useState('week');

    const [stats, setStats] = useState({
        totalStudents: 0,
        avgAttendance: 0,
        faceRecognitions: 0,
        qrScans: 0,
        cardSwipes: 0,
        trend: 0
    });

    const [weeklyData, setWeeklyData] = useState([]);
    const [methodBreakdown, setMethodBreakdown] = useState([]);
    const [classWiseData, setClassWiseData] = useState([]);

    // Load classes
    useEffect(() => {
        if (branchId) {
            fetchClasses();
        }
    }, [branchId]);

    const fetchClasses = async () => {
        try {
            const { data, error } = await supabase
                .from('classes')
                .select('id, name')
                .eq('branch_id', branchId);
            if (error) throw error;
            setClasses(sortClasses(data || []));
        } catch (err) {
            console.error('Error fetching classes:', err);
        }
    };

    // Fetch analytics data
    const fetchAnalytics = useCallback(async () => {
        if (!branchId) return;
        setLoading(true);

        try {
            // Calculate date range
            const endDate = new Date();
            let startDate = new Date();
            if (dateRange === 'week') startDate.setDate(endDate.getDate() - 7);
            else if (dateRange === 'month') startDate.setDate(endDate.getDate() - 30);
            else if (dateRange === 'year') startDate.setDate(endDate.getDate() - 365);

            // Fetch student count
            let studentQuery = supabase
                .from('student_profiles')
                .select('id', { count: 'exact' })
                .eq('branch_id', branchId)
                .or('status.eq.active,status.is.null');

            if (selectedClass !== 'all') {
                studentQuery = studentQuery.eq('class_id', selectedClass);
            }

            const { count: studentCount } = await studentQuery;

            // Fetch attendance records
            let attendanceQuery = supabase
                .from('student_attendance')
                .select('*')
                .eq('branch_id', branchId)
                .gte('date', startDate.toISOString().split('T')[0])
                .lte('date', endDate.toISOString().split('T')[0]);

            if (selectedClass !== 'all') {
                attendanceQuery = attendanceQuery.eq('class_id', selectedClass);
            }

            const { data: attendanceData, error: attendanceError } = await attendanceQuery;
            if (attendanceError) throw attendanceError;

            // Calculate stats
            const presentCount = attendanceData?.filter(a => a.status === 'present').length || 0;
            const totalRecords = attendanceData?.length || 1;

            const faceCount = attendanceData?.filter(a => a.marked_by === 'ai_face_recognition').length || 0;
            const qrCount = attendanceData?.filter(a => a.marked_by === 'qr_code').length || 0;
            const cardCount = attendanceData?.filter(a => a.marked_by === 'rfid_card').length || 0;

            setStats({
                totalStudents: studentCount || 0,
                avgAttendance: Math.round((presentCount / totalRecords) * 100),
                faceRecognitions: faceCount,
                qrScans: qrCount,
                cardSwipes: cardCount,
                trend: 5 // Placeholder - would calculate from historical data
            });

            // Weekly data for chart
            const weekData = [];
            for (let i = 6; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];
                const dayData = attendanceData?.filter(a => a.date === dateStr) || [];
                const present = dayData.filter(r => r.status === 'present').length;
                const total = dayData.length || 1;

                weekData.push({
                    day: date.toLocaleDateString('en-US', { weekday: 'short' }),
                    present: present,
                    absent: total - present,
                    attendance: Math.round((present / total) * 100)
                });
            }
            setWeeklyData(weekData);

            // Method breakdown
            setMethodBreakdown([
                { name: 'Face Recognition', value: faceCount, color: COLORS.face },
                { name: 'QR Code', value: qrCount, color: COLORS.qr },
                { name: 'Card Swipe', value: cardCount, color: COLORS.card },
                { name: 'Manual', value: totalRecords - faceCount - qrCount - cardCount, color: '#9ca3af' }
            ]);

        } catch (err) {
            console.error('Error fetching analytics:', err);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to load analytics'
            });
        } finally {
            setLoading(false);
        }
    }, [branchId, selectedClass, dateRange]);

    useEffect(() => {
        fetchAnalytics();
    }, [fetchAnalytics]);

    return (
        <DashboardLayout>
            <div className="p-4 md:p-6 space-y-4">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <BarChart3 className="h-7 w-7 text-blue-600" />
                            Student Smart Attendance Analytics
                        </h1>
                        <p className="text-muted-foreground">AI-powered attendance insights and trends</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Select value={selectedClass} onValueChange={setSelectedClass}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="All Classes" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Classes</SelectItem>
                                {classes.map(c => (
                                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={dateRange} onValueChange={setDateRange}>
                            <SelectTrigger className="w-[150px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="week">Last 7 Days</SelectItem>
                                <SelectItem value="month">Last 30 Days</SelectItem>
                                <SelectItem value="year">Last Year</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button variant="outline" onClick={fetchAnalytics}>
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                ) : (
                    <>
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Total Students</p>
                                            <p className="text-2xl font-bold">{stats.totalStudents}</p>
                                        </div>
                                        <GraduationCap className="h-8 w-8 text-blue-500" />
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Avg Attendance</p>
                                            <p className="text-2xl font-bold">{stats.avgAttendance}%</p>
                                        </div>
                                        <Percent className="h-8 w-8 text-green-500" />
                                    </div>
                                    <div className="mt-2 flex items-center gap-1">
                                        {stats.trend >= 0 ? (
                                            <TrendingUp className="h-4 w-4 text-green-500" />
                                        ) : (
                                            <TrendingDown className="h-4 w-4 text-red-500" />
                                        )}
                                        <span className={`text-xs ${stats.trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                            {stats.trend >= 0 ? '+' : ''}{stats.trend}%
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Face Recognitions</p>
                                            <p className="text-2xl font-bold">{stats.faceRecognitions}</p>
                                        </div>
                                        <ScanFace className="h-8 w-8 text-purple-500" />
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-muted-foreground">QR Scans</p>
                                            <p className="text-2xl font-bold">{stats.qrScans}</p>
                                        </div>
                                        <QrCode className="h-8 w-8 text-indigo-500" />
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Card Swipes</p>
                                            <p className="text-2xl font-bold">{stats.cardSwipes}</p>
                                        </div>
                                        <CreditCard className="h-8 w-8 text-cyan-500" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Charts */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {/* Weekly Trend */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Weekly Attendance Trend</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={weeklyData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="day" />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <Bar dataKey="present" name="Present" fill={COLORS.present} />
                                            <Bar dataKey="absent" name="Absent" fill={COLORS.absent} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            {/* Method Breakdown */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Attendance Method Breakdown</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <PieChart>
                                            <Pie
                                                data={methodBreakdown}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={100}
                                                dataKey="value"
                                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                            >
                                                {methodBreakdown.map((entry, index) => (
                                                    <Cell key={index} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </div>
                    </>
                )}
            </div>
        </DashboardLayout>
    );
};

export default SmartStudentAnalytics;
