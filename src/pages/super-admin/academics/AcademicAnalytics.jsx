// ═══════════════════════════════════════════════════════════════════════════════
// 📊 ACADEMIC ANALYTICS ENGINE - Day 16-17 of Academic Intelligence
// ═══════════════════════════════════════════════════════════════════════════════
// Comprehensive performance analytics with visualizations
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BarChart3, TrendingUp, TrendingDown, Users, GraduationCap, BookOpen,
    AlertTriangle, Bell, Award, Calendar, Clock, Target, ChevronRight,
    Search, Filter, RefreshCw, Download, Eye, ArrowUp, ArrowDown, Minus,
    Building, UserCheck, AlertCircle, CheckCircle2, XCircle, Activity,
    PieChart, LineChart, BarChart, School, Layers, BookMarked
} from 'lucide-react';
import {
    Card, CardContent, CardDescription, CardHeader, CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
    AreaChart, Area, BarChart as RechartsBarChart, Bar, LineChart as RechartsLineChart,
    Line, PieChart as RechartsPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { apiGet, apiPost, apiPatch } from '@/utils/apiClient';
import { formatDate, formatDateTime } from '@/utils/dateUtils';
import { toast } from 'sonner';

const COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e'];
const RISK_COLORS = {
    low: '#22c55e',
    medium: '#eab308',
    high: '#f97316',
    critical: '#ef4444'
};

export default function AcademicAnalytics() {
    const { user, currentSessionId, organizationId } = useAuth();
    const { selectedBranch } = useBranch();
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Data states
    const [overview, setOverview] = useState(null);
    const [alerts, setAlerts] = useState([]);
    const [atRiskStudents, setAtRiskStudents] = useState([]);
    const [classComparison, setClassComparison] = useState([]);
    const [attendanceTrends, setAttendanceTrends] = useState([]);
    const [subjectAnalytics, setSubjectAnalytics] = useState([]);
    const [benchmarks, setBenchmarks] = useState([]);

    // Filters
    const [selectedClass, setSelectedClass] = useState('');
    const [dateRange, setDateRange] = useState('30');
    const [riskFilter, setRiskFilter] = useState('all');

    // Dialogs
    const [studentDetailDialog, setStudentDetailDialog] = useState({ open: false, student: null });
    const [alertDetailDialog, setAlertDetailDialog] = useState({ open: false, alert: null });

    // Fetch data
    useEffect(() => {
        if (selectedBranch?.id) {
            loadAllData();
        }
    }, [selectedBranch, currentSessionId]);

    const loadAllData = async () => {
        setLoading(true);
        try {
            await Promise.all([
                loadOverview(),
                loadAlerts(),
                loadAtRiskStudents(),
                loadClassComparison(),
                loadAttendanceTrends(),
                loadSubjectAnalytics(),
                loadBenchmarks()
            ]);
        } catch (error) {
            console.error('Error loading analytics data:', error);
            toast.error('Failed to load analytics data');
        } finally {
            setLoading(false);
        }
    };

    const loadOverview = async () => {
        const response = await apiGet(`/api/academic-analytics/overview?branch_id=${selectedBranch.id}`);
        if (response.success) setOverview(response.data);
    };

    const loadAlerts = async () => {
        const response = await apiGet(`/api/academic-analytics/alerts?branch_id=${selectedBranch.id}&limit=20`);
        if (response.success) setAlerts(response.data);
    };

    const loadAtRiskStudents = async () => {
        let url = `/api/academic-analytics/students/at-risk/list?branch_id=${selectedBranch.id}`;
        if (riskFilter !== 'all') url += `&risk_level=${riskFilter}`;
        const response = await apiGet(url);
        if (response.success) setAtRiskStudents(response.data);
    };

    const loadClassComparison = async () => {
        const response = await apiGet(`/api/academic-analytics/classes/comparison?branch_id=${selectedBranch.id}`);
        if (response.success) setClassComparison(response.data);
    };

    const loadAttendanceTrends = async () => {
        let url = `/api/academic-analytics/attendance/trends?branch_id=${selectedBranch.id}&days=${dateRange}`;
        if (selectedClass) url += `&class_id=${selectedClass}`;
        const response = await apiGet(url);
        if (response.success) setAttendanceTrends(response.data);
    };

    const loadSubjectAnalytics = async () => {
        const response = await apiGet(`/api/academic-analytics/subjects?branch_id=${selectedBranch.id}`);
        if (response.success) setSubjectAnalytics(response.data);
    };

    const loadBenchmarks = async () => {
        const response = await apiGet(`/api/academic-analytics/benchmarks?branch_id=${selectedBranch.id}`);
        if (response.success) setBenchmarks(response.data);
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadAllData();
        setRefreshing(false);
        toast.success('Data refreshed');
    };

    const handleAcknowledgeAlert = async (alertId) => {
        try {
            const response = await apiPatch(`/api/academic-analytics/alerts/${alertId}/acknowledge?branch_id=${selectedBranch.id}`);
            if (response.success) {
                setAlerts(prev => prev.filter(a => a.id !== alertId));
                toast.success('Alert acknowledged');
            }
        } catch (error) {
            toast.error('Failed to acknowledge alert');
        }
    };

    const handleResolveAlert = async (alertId, notes) => {
        try {
            const response = await apiPatch(`/api/academic-analytics/alerts/${alertId}/resolve?branch_id=${selectedBranch.id}`, {
                resolution_notes: notes
            });
            if (response.success) {
                setAlerts(prev => prev.filter(a => a.id !== alertId));
                setAlertDetailDialog({ open: false, alert: null });
                toast.success('Alert resolved');
            }
        } catch (error) {
            toast.error('Failed to resolve alert');
        }
    };

    // ═══════════════════════════════════════════════════════════════════════════════
    // OVERVIEW TAB
    // ═══════════════════════════════════════════════════════════════════════════════

    const OverviewTab = () => (
        <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {loading ? (
                    Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-28" />)
                ) : (
                    <>
                        <StatCard
                            title="Total Students"
                            value={overview?.totalStudents || 0}
                            icon={<Users className="h-5 w-5" />}
                            color="blue"
                        />
                        <StatCard
                            title="Total Teachers"
                            value={overview?.totalTeachers || 0}
                            icon={<GraduationCap className="h-5 w-5" />}
                            color="purple"
                        />
                        <StatCard
                            title="Today's Attendance"
                            value={`${overview?.attendanceToday || 0}%`}
                            icon={<UserCheck className="h-5 w-5" />}
                            color="green"
                            trend={overview?.attendanceToday >= 85 ? 'up' : 'down'}
                        />
                        <StatCard
                            title="Active Alerts"
                            value={overview?.activeAlerts || 0}
                            icon={<AlertTriangle className="h-5 w-5" />}
                            color={overview?.activeAlerts > 5 ? 'red' : 'yellow'}
                        />
                        <StatCard
                            title="Badges Awarded"
                            value={overview?.badgesAwarded || 0}
                            icon={<Award className="h-5 w-5" />}
                            color="pink"
                        />
                    </>
                )}
            </div>

            {/* Quick Insights Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <BookOpen className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Weekly Homework</p>
                                <p className="text-2xl font-bold">{overview?.weeklyHomework || 0}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-purple-500">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <Activity className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Weekly Activities</p>
                                <p className="text-2xl font-bold">{overview?.weeklyActivities || 0}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-green-500">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <Building className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Total Classes</p>
                                <p className="text-2xl font-bold">{overview?.totalClasses || 0}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Attendance Trend Chart */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <LineChart className="h-5 w-5 text-blue-500" />
                            Attendance Trend
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Skeleton className="h-64" />
                        ) : (
                            <ResponsiveContainer width="100%" height={250}>
                                <AreaChart data={attendanceTrends.slice(-14)}>
                                    <defs>
                                        <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis 
                                        dataKey="date" 
                                        tick={{ fontSize: 11 }}
                                        tickFormatter={(val) => val?.slice(5)}
                                    />
                                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                                    <Tooltip 
                                        formatter={(value) => [`${value}%`, 'Attendance']}
                                        labelFormatter={(label) => formatDate(label)}
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="percentage" 
                                        stroke="#6366f1" 
                                        fill="url(#attendanceGradient)"
                                        strokeWidth={2}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                {/* Class Comparison Chart */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <BarChart className="h-5 w-5 text-purple-500" />
                            Class Comparison
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Skeleton className="h-64" />
                        ) : (
                            <ResponsiveContainer width="100%" height={250}>
                                <RechartsBarChart data={classComparison.slice(0, 8)}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                    <YAxis tick={{ fontSize: 11 }} />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="studentCount" name="Students" fill="#6366f1" radius={[4,4,0,0]} />
                                    <Bar dataKey="attendanceRate" name="Attendance %" fill="#22c55e" radius={[4,4,0,0]} />
                                </RechartsBarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Alerts Section */}
            <Card>
                <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Bell className="h-5 w-5 text-yellow-500" />
                            Active Alerts
                        </CardTitle>
                        <Badge variant="outline">{alerts.length} alerts</Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    {alerts.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-500" />
                            <p>No active alerts! Everything looks good.</p>
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {alerts.slice(0, 5).map((alert) => (
                                <AlertItem 
                                    key={alert.id} 
                                    alert={alert} 
                                    onAcknowledge={() => handleAcknowledgeAlert(alert.id)}
                                    onView={() => setAlertDetailDialog({ open: true, alert })}
                                />
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );

    // ═══════════════════════════════════════════════════════════════════════════════
    // AT-RISK STUDENTS TAB
    // ═══════════════════════════════════════════════════════════════════════════════

    const AtRiskTab = () => (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex gap-4 flex-wrap">
                <Select value={riskFilter} onValueChange={(val) => { setRiskFilter(val); loadAtRiskStudents(); }}>
                    <SelectTrigger className="w-40">
                        <SelectValue placeholder="Risk Level" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Levels</SelectItem>
                        <SelectItem value="critical">🔴 Critical</SelectItem>
                        <SelectItem value="high">🟠 High</SelectItem>
                        <SelectItem value="medium">🟡 Medium</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Risk Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['critical', 'high', 'medium', 'low'].map((level) => {
                    const count = atRiskStudents.filter(s => s.risk_level === level).length;
                    return (
                        <Card key={level} className={`border-l-4`} style={{ borderLeftColor: RISK_COLORS[level] }}>
                            <CardContent className="p-4">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-sm text-gray-500 capitalize">{level} Risk</p>
                                        <p className="text-2xl font-bold">{count}</p>
                                    </div>
                                    <div 
                                        className="w-3 h-3 rounded-full" 
                                        style={{ backgroundColor: RISK_COLORS[level] }}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* At-Risk Students List */}
            <Card>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-4 space-y-3">
                            {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-16" />)}
                        </div>
                    ) : atRiskStudents.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-green-500" />
                            <p className="text-lg font-medium">Excellent! No at-risk students detected.</p>
                            <p className="text-sm">All students are performing within acceptable parameters.</p>
                        </div>
                    ) : (
                        <div className="divide-y max-h-[500px] overflow-y-auto">
                            {atRiskStudents.map((item) => (
                                <RiskStudentRow 
                                    key={item.id} 
                                    item={item}
                                    onView={() => setStudentDetailDialog({ open: true, student: item })}
                                />
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );

    // ═══════════════════════════════════════════════════════════════════════════════
    // CLASSES TAB
    // ═══════════════════════════════════════════════════════════════════════════════

    const ClassesTab = () => (
        <div className="space-y-6">
            {/* Class Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? (
                    Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-40" />)
                ) : (
                    classComparison.map((cls) => (
                        <ClassCard key={cls.id} classData={cls} />
                    ))
                )}
            </div>

            {/* Class Performance Chart */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Class Performance Overview</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <RechartsBarChart data={classComparison}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="studentCount" name="Total Students" fill="#6366f1" />
                            <Bar dataKey="passRate" name="Pass Rate %" fill="#22c55e" />
                        </RechartsBarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );

    // ═══════════════════════════════════════════════════════════════════════════════
    // SUBJECTS TAB
    // ═══════════════════════════════════════════════════════════════════════════════

    const SubjectsTab = () => (
        <div className="space-y-6">
            {/* Subject Performance */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? (
                    Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-32" />)
                ) : subjectAnalytics.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-gray-500">
                        <BookMarked className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                        <p>No subject analytics data available yet.</p>
                        <p className="text-sm">Data will appear after performance metrics are calculated.</p>
                    </div>
                ) : (
                    subjectAnalytics.map((subject, idx) => (
                        <SubjectCard key={subject.id || idx} subject={subject} />
                    ))
                )}
            </div>

            {/* Subject Comparison Chart */}
            {subjectAnalytics.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Subject Average Scores</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <RechartsBarChart data={subjectAnalytics.slice(0, 10)} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" domain={[0, 100]} />
                                <YAxis dataKey="subject.name" type="category" width={100} />
                                <Tooltip formatter={(val) => [`${val}%`, 'Average Score']} />
                                <Bar dataKey="average_score" fill="#8b5cf6" radius={[0,4,4,0]}>
                                    {subjectAnalytics.map((_, idx) => (
                                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                                    ))}
                                </Bar>
                            </RechartsBarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}
        </div>
    );

    // ═══════════════════════════════════════════════════════════════════════════════
    // ATTENDANCE TAB
    // ═══════════════════════════════════════════════════════════════════════════════

    const AttendanceTab = () => (
        <div className="space-y-6">
            {/* Date Range Filter */}
            <div className="flex gap-4 flex-wrap">
                <Select value={dateRange} onValueChange={(val) => { setDateRange(val); loadAttendanceTrends(); }}>
                    <SelectTrigger className="w-40">
                        <SelectValue placeholder="Date Range" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="7">Last 7 Days</SelectItem>
                        <SelectItem value="14">Last 14 Days</SelectItem>
                        <SelectItem value="30">Last 30 Days</SelectItem>
                        <SelectItem value="60">Last 60 Days</SelectItem>
                        <SelectItem value="90">Last 90 Days</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Attendance Stats Summary */}
            {attendanceTrends.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard
                        title="Average Attendance"
                        value={`${Math.round(attendanceTrends.reduce((sum, t) => sum + t.percentage, 0) / attendanceTrends.length)}%`}
                        icon={<UserCheck className="h-5 w-5" />}
                        color="green"
                    />
                    <StatCard
                        title="Total Records"
                        value={attendanceTrends.reduce((sum, t) => sum + t.total, 0)}
                        icon={<Users className="h-5 w-5" />}
                        color="blue"
                    />
                    <StatCard
                        title="Total Present"
                        value={attendanceTrends.reduce((sum, t) => sum + t.present, 0)}
                        icon={<CheckCircle2 className="h-5 w-5" />}
                        color="green"
                    />
                    <StatCard
                        title="Total Absent"
                        value={attendanceTrends.reduce((sum, t) => sum + t.absent, 0)}
                        icon={<XCircle className="h-5 w-5" />}
                        color="red"
                    />
                </div>
            )}

            {/* Attendance Trend Chart */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Activity className="h-5 w-5 text-blue-500" />
                        Daily Attendance Trend
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <Skeleton className="h-80" />
                    ) : attendanceTrends.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                            <p>No attendance data for the selected period.</p>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={350}>
                            <RechartsLineChart data={attendanceTrends}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis 
                                    dataKey="date" 
                                    tickFormatter={(val) => val?.slice(5)}
                                    tick={{ fontSize: 11 }}
                                />
                                <YAxis />
                                <Tooltip 
                                    labelFormatter={(label) => formatDate(label)}
                                    formatter={(value, name) => {
                                        const labels = { present: 'Present', absent: 'Absent', late: 'Late', percentage: 'Rate' };
                                        return [name === 'percentage' ? `${value}%` : value, labels[name] || name];
                                    }}
                                />
                                <Legend />
                                <Line type="monotone" dataKey="present" name="Present" stroke="#22c55e" strokeWidth={2} dot={false} />
                                <Line type="monotone" dataKey="absent" name="Absent" stroke="#ef4444" strokeWidth={2} dot={false} />
                                <Line type="monotone" dataKey="late" name="Late" stroke="#eab308" strokeWidth={2} dot={false} />
                            </RechartsLineChart>
                        </ResponsiveContainer>
                    )}
                </CardContent>
            </Card>

            {/* Attendance Distribution Pie */}
            {attendanceTrends.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Attendance Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <RechartsPieChart>
                                <Pie
                                    data={[
                                        { name: 'Present', value: attendanceTrends.reduce((sum, t) => sum + t.present, 0), fill: '#22c55e' },
                                        { name: 'Absent', value: attendanceTrends.reduce((sum, t) => sum + t.absent, 0), fill: '#ef4444' },
                                        { name: 'Late', value: attendanceTrends.reduce((sum, t) => sum + t.late, 0), fill: '#eab308' }
                                    ]}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={3}
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </RechartsPieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}
        </div>
    );

    // ═══════════════════════════════════════════════════════════════════════════════
    // REPORTS TAB
    // ═══════════════════════════════════════════════════════════════════════════════

    const ReportsTab = () => {
        const [generating, setGenerating] = useState(false);
        const [reports, setReports] = useState([]);

        useEffect(() => {
            loadReports();
        }, []);

        const loadReports = async () => {
            const response = await apiGet(`/api/academic-analytics/reports?branch_id=${selectedBranch.id}`);
            if (response.success) setReports(response.data);
        };

        const handleGenerateReport = async (type) => {
            setGenerating(true);
            try {
                const response = await apiPost(`/api/academic-analytics/reports/generate?branch_id=${selectedBranch.id}`, {
                    report_type: type,
                    report_name: `${type.replace('_', ' ')} Report - ${formatDate(new Date())}`,
                    period_type: 'monthly'
                });
                if (response.success) {
                    toast.success('Report generated successfully');
                    loadReports();
                }
            } catch (error) {
                toast.error('Failed to generate report');
            } finally {
                setGenerating(false);
            }
        };

        return (
            <div className="space-y-6">
                {/* Generate Report */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Generate New Report</CardTitle>
                        <CardDescription>Create comprehensive performance reports</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-4 flex-wrap">
                            <Button 
                                onClick={() => handleGenerateReport('school_overview')}
                                disabled={generating}
                            >
                                <Building className="mr-2 h-4 w-4" />
                                School Overview
                            </Button>
                            <Button 
                                variant="outline"
                                onClick={() => handleGenerateReport('class_performance')}
                                disabled={generating}
                            >
                                <Layers className="mr-2 h-4 w-4" />
                                Class Performance
                            </Button>
                            <Button 
                                variant="outline"
                                onClick={() => handleGenerateReport('student_progress')}
                                disabled={generating}
                            >
                                <Users className="mr-2 h-4 w-4" />
                                Student Progress
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Previous Reports */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Previous Reports</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {reports.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <BarChart3 className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                                <p>No reports generated yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {reports.map((report) => (
                                    <div key={report.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div>
                                            <p className="font-medium">{report.report_name}</p>
                                            <p className="text-sm text-gray-500">
                                                {report.report_type} • Generated {formatDateTime(report.generated_at)}
                                            </p>
                                        </div>
                                        <Button variant="ghost" size="sm">
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        );
    };

    // ═══════════════════════════════════════════════════════════════════════════════
    // MAIN RENDER
    // ═══════════════════════════════════════════════════════════════════════════════

    return (
        <div className="min-h-screen bg-gray-50/50 p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <BarChart3 className="h-7 w-7 text-indigo-600" />
                        Academic Analytics Engine
                    </h1>
                    <p className="text-gray-500">Comprehensive performance intelligence and insights</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="grid grid-cols-3 md:grid-cols-6 gap-2 h-auto p-1">
                    <TabsTrigger value="overview" className="flex items-center gap-1 py-2">
                        <PieChart className="h-4 w-4" />
                        <span className="hidden md:inline">Overview</span>
                    </TabsTrigger>
                    <TabsTrigger value="at-risk" className="flex items-center gap-1 py-2">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="hidden md:inline">At-Risk</span>
                    </TabsTrigger>
                    <TabsTrigger value="classes" className="flex items-center gap-1 py-2">
                        <School className="h-4 w-4" />
                        <span className="hidden md:inline">Classes</span>
                    </TabsTrigger>
                    <TabsTrigger value="subjects" className="flex items-center gap-1 py-2">
                        <BookMarked className="h-4 w-4" />
                        <span className="hidden md:inline">Subjects</span>
                    </TabsTrigger>
                    <TabsTrigger value="attendance" className="flex items-center gap-1 py-2">
                        <UserCheck className="h-4 w-4" />
                        <span className="hidden md:inline">Attendance</span>
                    </TabsTrigger>
                    <TabsTrigger value="reports" className="flex items-center gap-1 py-2">
                        <BarChart className="h-4 w-4" />
                        <span className="hidden md:inline">Reports</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview"><OverviewTab /></TabsContent>
                <TabsContent value="at-risk"><AtRiskTab /></TabsContent>
                <TabsContent value="classes"><ClassesTab /></TabsContent>
                <TabsContent value="subjects"><SubjectsTab /></TabsContent>
                <TabsContent value="attendance"><AttendanceTab /></TabsContent>
                <TabsContent value="reports"><ReportsTab /></TabsContent>
            </Tabs>

            {/* Alert Detail Dialog */}
            <Dialog open={alertDetailDialog.open} onOpenChange={(open) => setAlertDetailDialog({ open, alert: null })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Alert Details</DialogTitle>
                    </DialogHeader>
                    {alertDetailDialog.alert && (
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="h-6 w-6 text-yellow-500 mt-1" />
                                <div>
                                    <p className="font-medium">{alertDetailDialog.alert.alert_type}</p>
                                    <p className="text-sm text-gray-500">{alertDetailDialog.alert.message}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-500">Severity</p>
                                    <Badge variant={alertDetailDialog.alert.severity === 'critical' ? 'destructive' : 'warning'}>
                                        {alertDetailDialog.alert.severity}
                                    </Badge>
                                </div>
                                <div>
                                    <p className="text-gray-500">Detected</p>
                                    <p>{formatDateTime(alertDetailDialog.alert.detected_at)}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button 
                                    variant="outline" 
                                    className="flex-1"
                                    onClick={() => handleAcknowledgeAlert(alertDetailDialog.alert.id)}
                                >
                                    Acknowledge
                                </Button>
                                <Button 
                                    className="flex-1"
                                    onClick={() => handleResolveAlert(alertDetailDialog.alert.id, 'Resolved via dashboard')}
                                >
                                    Resolve
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function StatCard({ title, value, icon, color, trend }) {
    const colorClasses = {
        blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
        purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
        green: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
        red: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
        yellow: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
        pink: 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400'
    };

    return (
        <Card>
            <CardContent className="p-4">
                <div className="flex items-center justify-between">
                    <div className={`p-2 rounded-lg ${colorClasses[color] || colorClasses.blue}`}>
                        {icon}
                    </div>
                    {trend && (
                        <div className={`flex items-center text-sm ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                            {trend === 'up' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                        </div>
                    )}
                </div>
                <p className="text-2xl font-bold mt-3">{value}</p>
                <p className="text-sm text-gray-500">{title}</p>
            </CardContent>
        </Card>
    );
}

function AlertItem({ alert, onAcknowledge, onView }) {
    const severityColors = {
        info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        warning: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
        high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
        critical: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    };

    return (
        <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
        >
            <div className="flex items-center gap-3">
                <AlertTriangle className={`h-5 w-5 ${alert.severity === 'critical' ? 'text-red-500' : alert.severity === 'high' ? 'text-orange-500' : 'text-yellow-500'}`} />
                <div>
                    <p className="font-medium text-sm">{alert.alert_type}</p>
                    <p className="text-xs text-gray-500 line-clamp-1">{alert.message}</p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <Badge className={severityColors[alert.severity]}>{alert.severity}</Badge>
                <Button variant="ghost" size="sm" onClick={onView}>
                    <Eye className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={onAcknowledge}>
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                </Button>
            </div>
        </motion.div>
    );
}

function RiskStudentRow({ item, onView }) {
    const student = item.student || {};
    
    return (
        <div className="flex items-center justify-between p-4 hover:bg-gray-50 transition cursor-pointer" onClick={onView}>
            <div className="flex items-center gap-4">
                <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: RISK_COLORS[item.risk_level] }}
                />
                <div>
                    <p className="font-medium">{student.first_name} {student.last_name}</p>
                    <p className="text-sm text-gray-500">
                        {student.admission_number} • {student.class?.name} {student.section?.name}
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-6 text-sm">
                <div className="text-center">
                    <p className="text-gray-500">Attendance</p>
                    <p className={`font-bold ${item.attendance_percentage < 75 ? 'text-red-500' : 'text-green-500'}`}>
                        {Math.round(item.attendance_percentage || 0)}%
                    </p>
                </div>
                <div className="text-center">
                    <p className="text-gray-500">Homework</p>
                    <p className={`font-bold ${item.homework_completion_rate < 70 ? 'text-red-500' : 'text-green-500'}`}>
                        {Math.round(item.homework_completion_rate || 0)}%
                    </p>
                </div>
                <Badge 
                    className="capitalize"
                    style={{ backgroundColor: RISK_COLORS[item.risk_level], color: 'white' }}
                >
                    {item.risk_level}
                </Badge>
                <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
        </div>
    );
}

function ClassCard({ classData }) {
    return (
        <Card className="hover:shadow-lg transition cursor-pointer">
            <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                        <School className="h-5 w-5 text-indigo-600" />
                    </div>
                    <Badge variant="outline">{classData.studentCount || 0} students</Badge>
                </div>
                <h3 className="font-semibold text-lg">{classData.name}</h3>
                <div className="mt-3 space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Attendance Rate</span>
                        <span className={`font-medium ${(classData.attendanceRate || 0) >= 85 ? 'text-green-500' : 'text-yellow-500'}`}>
                            {classData.attendanceRate || 0}%
                        </span>
                    </div>
                    <Progress value={classData.attendanceRate || 0} className="h-2" />
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Pass Rate</span>
                        <span className="font-medium">{classData.passRate || 0}%</span>
                    </div>
                    <Progress value={classData.passRate || 0} className="h-2" />
                </div>
            </CardContent>
        </Card>
    );
}

function SubjectCard({ subject }) {
    return (
        <Card className="hover:shadow-lg transition">
            <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                        <BookOpen className="h-5 w-5 text-purple-600" />
                    </div>
                </div>
                <h3 className="font-semibold">{subject.subject?.name || 'Subject'}</h3>
                <p className="text-sm text-gray-500">{subject.class?.name || ''}</p>
                <div className="mt-3">
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-500">Average Score</span>
                        <span className="font-medium">{Math.round(subject.average_score || 0)}%</span>
                    </div>
                    <Progress value={subject.average_score || 0} className="h-2" />
                </div>
                <div className="mt-2 flex justify-between text-xs text-gray-500">
                    <span>Students: {subject.total_students || 0}</span>
                    <span>Pass Rate: {Math.round(subject.pass_rate || 0)}%</span>
                </div>
            </CardContent>
        </Card>
    );
}
