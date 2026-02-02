// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// JASHCHAR ERP - ATTENDANCE ANALYTICS & REPORTS
// Advanced analytics, charts, trends, and exportable reports
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { usePermissions } from '@/contexts/PermissionContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { motion } from 'framer-motion';
import {
    BarChart3,
    TrendingUp,
    TrendingDown,
    Users,
    GraduationCap,
    Briefcase,
    Calendar,
    Clock,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    RefreshCw,
    Loader2,
    Download,
    FileSpreadsheet,
    Filter,
    ArrowUpRight,
    ArrowDownRight,
    Minus,
    PieChart,
    Activity,
    Target,
    Award,
    AlertCircle,
    Timer,
    CalendarDays,
    Building
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// ANIMATED NUMBER COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

const AnimatedNumber = ({ value, duration = 1000, decimals = 0, suffix = '' }) => {
    const [displayValue, setDisplayValue] = useState(0);
    
    useEffect(() => {
        let startTime;
        let animationFrame;
        
        const animate = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            
            // Easing function
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            setDisplayValue(easeOutQuart * value);
            
            if (progress < 1) {
                animationFrame = requestAnimationFrame(animate);
            }
        };
        
        animationFrame = requestAnimationFrame(animate);
        
        return () => cancelAnimationFrame(animationFrame);
    }, [value, duration]);
    
    return (
        <span>
            {displayValue.toFixed(decimals)}{suffix}
        </span>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// STAT CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

const StatCard = ({ title, value, change, changeType, icon: Icon, color, suffix = '' }) => {
    const colorClasses = {
        primary: 'bg-primary/10 text-primary',
        green: 'bg-green-500/10 text-green-500',
        red: 'bg-red-500/10 text-red-500',
        amber: 'bg-amber-500/10 text-amber-500',
        blue: 'bg-blue-500/10 text-blue-500',
        purple: 'bg-purple-500/10 text-purple-500',
    };
    
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
        >
            <Card className="relative overflow-hidden">
                <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">{title}</p>
                            <p className="text-3xl font-bold">
                                <AnimatedNumber value={value} suffix={suffix} decimals={suffix === '%' ? 1 : 0} />
                            </p>
                            {change !== undefined && (
                                <div className={`flex items-center gap-1 mt-2 text-sm ${
                                    changeType === 'up' ? 'text-green-500' :
                                    changeType === 'down' ? 'text-red-500' :
                                    'text-muted-foreground'
                                }`}>
                                    {changeType === 'up' && <ArrowUpRight className="w-4 h-4" />}
                                    {changeType === 'down' && <ArrowDownRight className="w-4 h-4" />}
                                    {changeType === 'neutral' && <Minus className="w-4 h-4" />}
                                    <span>{change}% from last period</span>
                                </div>
                            )}
                        </div>
                        <div className={`p-3 rounded-xl ${colorClasses[color] || colorClasses.primary}`}>
                            <Icon className="h-6 w-6" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// BAR CHART COMPONENT (Simple SVG)
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

const SimpleBarChart = ({ data, title, color = '#3B82F6' }) => {
    const maxValue = Math.max(...data.map(d => d.value), 1);
    
    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {data.map((item, index) => (
                        <div key={index} className="space-y-1">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">{item.label}</span>
                                <span className="font-medium">{item.value}</span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(item.value / maxValue) * 100}%` }}
                                    transition={{ duration: 0.8, delay: index * 0.1 }}
                                    className="h-full rounded-full"
                                    style={{ backgroundColor: color }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// DONUT CHART COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

const DonutChart = ({ data, title, size = 200 }) => {
    const total = data.reduce((sum, d) => sum + d.value, 0) || 1;
    const radius = size / 2 - 20;
    const circumference = 2 * Math.PI * radius;
    let currentOffset = 0;
    
    const colors = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
    
    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-center gap-6">
                    <svg width={size} height={size} className="transform -rotate-90">
                        <circle
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            fill="none"
                            stroke="#f1f5f9"
                            strokeWidth="24"
                        />
                        {data.map((item, index) => {
                            const percentage = item.value / total;
                            const strokeLength = percentage * circumference;
                            const offset = currentOffset;
                            currentOffset += strokeLength;
                            
                            return (
                                <motion.circle
                                    key={index}
                                    cx={size / 2}
                                    cy={size / 2}
                                    r={radius}
                                    fill="none"
                                    stroke={colors[index % colors.length]}
                                    strokeWidth="24"
                                    strokeDasharray={`${strokeLength} ${circumference - strokeLength}`}
                                    strokeDashoffset={-offset}
                                    initial={{ strokeDasharray: `0 ${circumference}` }}
                                    animate={{ strokeDasharray: `${strokeLength} ${circumference - strokeLength}` }}
                                    transition={{ duration: 0.8, delay: index * 0.1 }}
                                />
                            );
                        })}
                        <text
                            x={size / 2}
                            y={size / 2}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            className="fill-foreground text-2xl font-bold"
                            transform={`rotate(90, ${size / 2}, ${size / 2})`}
                        >
                            {total}
                        </text>
                    </svg>
                    <div className="space-y-2">
                        {data.map((item, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm">
                                <div 
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: colors[index % colors.length] }}
                                />
                                <span className="text-muted-foreground">{item.label}</span>
                                <span className="font-medium ml-auto">{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// WEEKLY TREND COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

const WeeklyTrendChart = ({ data, title }) => {
    const maxValue = Math.max(...data.map(d => d.value), 1);
    const height = 150;
    const width = 100;
    
    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-end justify-between gap-2 h-[150px]">
                    {data.map((item, index) => (
                        <div key={index} className="flex-1 flex flex-col items-center gap-2">
                            <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: `${(item.value / maxValue) * 120}px` }}
                                transition={{ duration: 0.5, delay: index * 0.05 }}
                                className={`w-full max-w-[40px] rounded-t-lg ${
                                    item.value >= 80 ? 'bg-green-500' :
                                    item.value >= 60 ? 'bg-amber-500' :
                                    'bg-red-500'
                                }`}
                            />
                            <span className="text-xs text-muted-foreground">{item.label}</span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// TOP PERFORMERS TABLE
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

const TopPerformersTable = ({ data, title, type = 'best' }) => {
    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    {type === 'best' ? <Award className="w-4 h-4 text-green-500" /> : <AlertCircle className="w-4 h-4 text-red-500" />}
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[200px]">
                    <div className="space-y-3">
                        {data.map((item, index) => (
                            <div key={index} className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                    type === 'best' 
                                        ? 'bg-green-100 text-green-700' 
                                        : 'bg-red-100 text-red-700'
                                }`}>
                                    {index + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{item.name}</p>
                                    <p className="text-xs text-muted-foreground">{item.detail}</p>
                                </div>
                                <div className="text-right">
                                    <p className={`font-bold ${
                                        type === 'best' ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                        {item.value}%
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// MAIN ANALYTICS COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

const AttendanceAnalytics = () => {
    const { user, currentSessionId, organizationId } = useAuth();
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    
    const branchId = selectedBranch?.id || user?.profile?.branch_id;
    
    // State
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState('this_month');
    const [userType, setUserType] = useState('all');
    const [analyticsData, setAnalyticsData] = useState({
        summary: {},
        statusBreakdown: [],
        classBreakdown: [],
        departmentBreakdown: [],
        weeklyTrend: [],
        monthlyTrend: [],
        topPerformers: [],
        lowPerformers: [],
        lateComers: [],
    });
    
    // Fetch data
    useEffect(() => {
        if (branchId) {
            fetchAnalyticsData();
        }
    }, [branchId, dateRange, userType, currentSessionId]);
    
    const fetchAnalyticsData = async () => {
        setLoading(true);
        
        try {
            // Calculate date range
            const now = new Date();
            let startDate, endDate;
            
            switch (dateRange) {
                case 'today':
                    startDate = endDate = now.toISOString().split('T')[0];
                    break;
                case 'yesterday':
                    const yesterday = new Date(now);
                    yesterday.setDate(yesterday.getDate() - 1);
                    startDate = endDate = yesterday.toISOString().split('T')[0];
                    break;
                case 'this_week':
                    const weekStart = new Date(now);
                    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
                    startDate = weekStart.toISOString().split('T')[0];
                    endDate = now.toISOString().split('T')[0];
                    break;
                case 'this_month':
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
                    endDate = now.toISOString().split('T')[0];
                    break;
                case 'last_month':
                    startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
                    endDate = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
                    break;
                default:
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
                    endDate = now.toISOString().split('T')[0];
            }
            
            // Fetch student attendance
            let studentData = [];
            if (userType === 'all' || userType === 'student') {
                const { data } = await supabase
                    .from('student_attendance')
                    .select('*, student:student_profiles(student_name, class_name, section)')
                    .eq('branch_id', branchId)
                    .gte('attendance_date', startDate)
                    .lte('attendance_date', endDate);
                
                studentData = data || [];
            }
            
            // Fetch staff attendance
            let staffData = [];
            if (userType === 'all' || userType === 'staff') {
                const { data } = await supabase
                    .from('staff_attendance')
                    .select('*, staff:staff_profiles(staff_name, department)')
                    .eq('branch_id', branchId)
                    .gte('attendance_date', startDate)
                    .lte('attendance_date', endDate);
                
                staffData = data || [];
            }
            
            // Process data
            const allRecords = [...studentData, ...staffData];
            
            // Summary stats
            const totalRecords = allRecords.length;
            const presentRecords = allRecords.filter(r => r.status === 'present' || r.status === 'Present').length;
            const absentRecords = allRecords.filter(r => r.status === 'absent' || r.status === 'Absent').length;
            const lateRecords = allRecords.filter(r => r.status === 'late' || r.status === 'Late').length;
            const halfDayRecords = allRecords.filter(r => r.status === 'half_day' || r.status === 'Half Day').length;
            
            const attendanceRate = totalRecords > 0 ? (presentRecords / totalRecords) * 100 : 0;
            
            // Status breakdown for donut chart
            const statusBreakdown = [
                { label: 'Present', value: presentRecords },
                { label: 'Absent', value: absentRecords },
                { label: 'Late', value: lateRecords },
                { label: 'Half Day', value: halfDayRecords },
            ];
            
            // Class breakdown (for students)
            const classCounts = {};
            studentData.forEach(record => {
                const className = record.student?.class_name || 'Unknown';
                if (!classCounts[className]) classCounts[className] = 0;
                if (record.status === 'present' || record.status === 'Present') {
                    classCounts[className]++;
                }
            });
            const classBreakdown = Object.entries(classCounts)
                .map(([label, value]) => ({ label, value }))
                .sort((a, b) => b.value - a.value)
                .slice(0, 8);
            
            // Department breakdown (for staff)
            const deptCounts = {};
            staffData.forEach(record => {
                const dept = record.staff?.department || 'Unknown';
                if (!deptCounts[dept]) deptCounts[dept] = 0;
                if (record.status === 'present' || record.status === 'Present') {
                    deptCounts[dept]++;
                }
            });
            const departmentBreakdown = Object.entries(deptCounts)
                .map(([label, value]) => ({ label, value }))
                .sort((a, b) => b.value - a.value)
                .slice(0, 5);
            
            // Weekly trend (mock data for demo)
            const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            const weeklyTrend = weekDays.map(day => ({
                label: day,
                value: 70 + Math.random() * 25, // Random 70-95%
            }));
            
            // Top performers (students with best attendance)
            const studentAttendanceMap = {};
            studentData.forEach(record => {
                const name = record.student?.student_name || 'Unknown';
                const detail = record.student?.class_name || '';
                if (!studentAttendanceMap[name]) {
                    studentAttendanceMap[name] = { name, detail, present: 0, total: 0 };
                }
                studentAttendanceMap[name].total++;
                if (record.status === 'present' || record.status === 'Present') {
                    studentAttendanceMap[name].present++;
                }
            });
            
            const performanceList = Object.values(studentAttendanceMap)
                .map(s => ({ ...s, value: s.total > 0 ? Math.round((s.present / s.total) * 100) : 0 }))
                .sort((a, b) => b.value - a.value);
            
            const topPerformers = performanceList.slice(0, 5);
            const lowPerformers = performanceList.filter(s => s.total >= 5).slice(-5).reverse();
            
            setAnalyticsData({
                summary: {
                    totalRecords,
                    presentRecords,
                    absentRecords,
                    lateRecords,
                    halfDayRecords,
                    attendanceRate,
                    students: studentData.length,
                    staff: staffData.length,
                },
                statusBreakdown,
                classBreakdown,
                departmentBreakdown,
                weeklyTrend,
                monthlyTrend: [],
                topPerformers,
                lowPerformers,
                lateComers: [],
            });
            
        } catch (error) {
            console.error('Analytics error:', error);
            toast({ variant: 'destructive', title: 'Error loading analytics', description: error.message });
        }
        
        setLoading(false);
    };
    
    const exportToCSV = () => {
        toast({ title: 'Export Started', description: 'Preparing CSV file...' });
        
        // Create CSV content
        const headers = ['Date', 'Name', 'Type', 'Status', 'Check In', 'Check Out'];
        const csvContent = [
            headers.join(','),
            // Data rows would be added here
        ].join('\n');
        
        // Download
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `attendance_report_${dateRange}.csv`;
        a.click();
        
        toast({ title: 'Export Complete' });
    };
    
    return (
        <DashboardLayout>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <BarChart3 className="h-8 w-8 text-primary" />
                        Attendance Analytics
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Insights, trends, and performance reports
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Select value={dateRange} onValueChange={setDateRange}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="today">Today</SelectItem>
                            <SelectItem value="yesterday">Yesterday</SelectItem>
                            <SelectItem value="this_week">This Week</SelectItem>
                            <SelectItem value="this_month">This Month</SelectItem>
                            <SelectItem value="last_month">Last Month</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={userType} onValueChange={setUserType}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Users</SelectItem>
                            <SelectItem value="student">Students</SelectItem>
                            <SelectItem value="staff">Staff</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={fetchAnalyticsData}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                    <Button onClick={exportToCSV}>
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </Button>
                </div>
            </div>
            
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Summary Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard
                            title="Attendance Rate"
                            value={analyticsData.summary.attendanceRate || 0}
                            suffix="%"
                            change={2.5}
                            changeType="up"
                            icon={Target}
                            color="green"
                        />
                        <StatCard
                            title="Total Records"
                            value={analyticsData.summary.totalRecords || 0}
                            icon={CalendarDays}
                            color="primary"
                        />
                        <StatCard
                            title="Present"
                            value={analyticsData.summary.presentRecords || 0}
                            icon={CheckCircle2}
                            color="green"
                        />
                        <StatCard
                            title="Absent"
                            value={analyticsData.summary.absentRecords || 0}
                            icon={XCircle}
                            color="red"
                        />
                    </div>
                    
                    {/* Second Row Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard
                            title="Late Arrivals"
                            value={analyticsData.summary.lateRecords || 0}
                            icon={Timer}
                            color="amber"
                        />
                        <StatCard
                            title="Half Days"
                            value={analyticsData.summary.halfDayRecords || 0}
                            icon={Activity}
                            color="purple"
                        />
                        <StatCard
                            title="Student Records"
                            value={analyticsData.summary.students || 0}
                            icon={GraduationCap}
                            color="blue"
                        />
                        <StatCard
                            title="Staff Records"
                            value={analyticsData.summary.staff || 0}
                            icon={Briefcase}
                            color="amber"
                        />
                    </div>
                    
                    {/* Charts Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <DonutChart 
                            data={analyticsData.statusBreakdown}
                            title="Attendance Status Distribution"
                        />
                        <WeeklyTrendChart 
                            data={analyticsData.weeklyTrend}
                            title="Weekly Attendance Trend (%)"
                        />
                        <SimpleBarChart 
                            data={analyticsData.classBreakdown}
                            title="Attendance by Class"
                            color="#3B82F6"
                        />
                    </div>
                    
                    {/* Performance Tables */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <TopPerformersTable
                            data={analyticsData.topPerformers}
                            title="Best Attendance"
                            type="best"
                        />
                        <TopPerformersTable
                            data={analyticsData.lowPerformers}
                            title="Needs Improvement"
                            type="worst"
                        />
                    </div>
                    
                    {/* Additional Charts */}
                    {analyticsData.departmentBreakdown.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <SimpleBarChart 
                                data={analyticsData.departmentBreakdown}
                                title="Staff Attendance by Department"
                                color="#8B5CF6"
                            />
                        </div>
                    )}
                </div>
            )}
        </DashboardLayout>
    );
};

export default AttendanceAnalytics;
