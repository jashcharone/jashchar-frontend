/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LATE ARRIVAL TRACKING - Day 33
 * ─────────────────────────────────────────────────────────────────────────────
 * AI Face Attendance System - Late Arrival Management & Tracking
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
    RefreshCw, Calendar as CalendarIcon, Clock, AlertTriangle, Search,
    Download, Filter, ChevronRight, User, Phone, Mail, TrendingDown,
    AlertCircle, FileText, Send, MessageSquare, BarChart3
} from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { formatDate, formatDateTime, formatTime } from '@/utils/dateUtils';
import { cn } from '@/lib/utils';
import faceAnalyticsApi from '@/services/faceAnalyticsApi';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const LATE_CATEGORIES = [
    { label: '5-15 min', min: 5, max: 15, color: '#f59e0b' },
    { label: '15-30 min', min: 15, max: 30, color: '#f97316' },
    { label: '30+ min', min: 30, max: 999, color: '#ef4444' },
];

const PIE_COLORS = ['#f59e0b', '#f97316', '#ef4444'];

// ═══════════════════════════════════════════════════════════════════════════════
// STAT CARD
// ═══════════════════════════════════════════════════════════════════════════════

const StatCard = ({ title, value, subtitle, icon: Icon, color = 'yellow', loading }) => {
    const colorClasses = {
        yellow: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/30',
        orange: 'bg-orange-50 text-orange-600 dark:bg-orange-900/30',
        red: 'bg-red-50 text-red-600 dark:bg-red-900/30',
        blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30',
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="p-5">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-4 w-20 mt-2" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
                <div className="flex items-center justify-between">
                    <div className={cn('p-3 rounded-lg', colorClasses[color])}>
                        <Icon className="h-5 w-5" />
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-bold">{value}</p>
                        {subtitle && (
                            <p className="text-xs text-muted-foreground">{subtitle}</p>
                        )}
                    </div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">{title}</p>
            </CardContent>
        </Card>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// STUDENT LATE DETAILS DIALOG
// ═══════════════════════════════════════════════════════════════════════════════

const StudentLateDetailsDialog = ({ student, open, onClose }) => {
    const [notifyLoading, setNotifyLoading] = useState(false);

    const handleNotifyParent = async () => {
        setNotifyLoading(true);
        // TODO: Implement parent notification
        await new Promise(resolve => setTimeout(resolve, 1000));
        setNotifyLoading(false);
        alert('Parent notification sent! (Demo)');
    };

    if (!student) return null;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-yellow-500" />
                        Late Arrival Details
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Student Info */}
                    <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                        <Avatar className="h-16 w-16">
                            <AvatarImage src={student.photo_url} />
                            <AvatarFallback>
                                {student.student_name?.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <h3 className="font-semibold text-lg">{student.student_name}</h3>
                            <p className="text-sm text-muted-foreground">
                                {student.admission_number}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {student.class_name} - {student.section_name}
                            </p>
                        </div>
                    </div>

                    {/* Late Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 text-center">
                            <p className="text-2xl font-bold text-yellow-600">
                                +{student.late_minutes} min
                            </p>
                            <p className="text-xs text-muted-foreground">Late By</p>
                        </div>
                        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-center">
                            <p className="text-2xl font-bold text-blue-600">
                                {formatTime(student.check_in_time)}
                            </p>
                            <p className="text-xs text-muted-foreground">Check-in Time</p>
                        </div>
                    </div>

                    {/* Late Category Badge */}
                    <div className="flex items-center justify-center">
                        <Badge 
                            variant="outline" 
                            className={cn(
                                student.late_minutes >= 30 && 'bg-red-100 text-red-800 border-red-300',
                                student.late_minutes >= 15 && student.late_minutes < 30 && 'bg-orange-100 text-orange-800 border-orange-300',
                                student.late_minutes < 15 && 'bg-yellow-100 text-yellow-800 border-yellow-300'
                            )}
                        >
                            {student.late_minutes >= 30 ? 'Severely Late' :
                             student.late_minutes >= 15 ? 'Moderately Late' : 'Slightly Late'}
                        </Badge>
                    </div>
                </div>

                <DialogFooter className="flex gap-2">
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                    <Button onClick={handleNotifyParent} disabled={notifyLoading}>
                        {notifyLoading ? (
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4 mr-2" />
                        )}
                        Notify Parent
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const LateArrivalTracking = () => {
    const { user, currentSessionId, organizationId } = useAuth();
    const { selectedBranch } = useBranch();

    // State
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [searchTerm, setSearchTerm] = useState('');
    const [classFilter, setClassFilter] = useState('all');
    const [activeTab, setActiveTab] = useState('list');

    // Data
    const [summary, setSummary] = useState(null);
    const [lateArrivals, setLateArrivals] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    const branchId = selectedBranch?.id;

    // ═══════════════════════════════════════════════════════════════════════════
    // DATA FETCH
    // ═══════════════════════════════════════════════════════════════════════════

    const fetchData = useCallback(async () => {
        if (!branchId) return;

        try {
            setRefreshing(true);
            const dateStr = selectedDate.toISOString().split('T')[0];
            const params = {
                branch_id: branchId,
                session_id: currentSessionId,
                date: dateStr
            };

            const [summaryRes, arrivalsRes] = await Promise.all([
                faceAnalyticsApi.getLateArrivalsSummary(params),
                faceAnalyticsApi.getLateArrivals({ ...params, limit: 100 })
            ]);

            if (summaryRes.success) setSummary(summaryRes.data);
            if (arrivalsRes.success) setLateArrivals(arrivalsRes.data || []);

        } catch (error) {
            console.error('Error fetching late arrival data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [branchId, currentSessionId, selectedDate]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // ═══════════════════════════════════════════════════════════════════════════
    // FILTER & SORT
    // ═══════════════════════════════════════════════════════════════════════════

    const filteredArrivals = lateArrivals.filter(student => {
        const matchesSearch = !searchTerm || 
            student.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.admission_number?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesClass = classFilter === 'all' || 
            student.class_name === classFilter;

        return matchesSearch && matchesClass;
    });

    // Get unique classes for filter
    const uniqueClasses = [...new Set(lateArrivals.map(s => s.class_name).filter(Boolean))];

    // ═══════════════════════════════════════════════════════════════════════════
    // CHART DATA
    // ═══════════════════════════════════════════════════════════════════════════

    const pieData = summary ? [
        { name: '5-15 min', value: summary.breakdown?.late_5_15_min || 0 },
        { name: '15-30 min', value: summary.breakdown?.late_15_30_min || 0 },
        { name: '30+ min', value: summary.breakdown?.late_30_plus_min || 0 },
    ] : [];

    // ═══════════════════════════════════════════════════════════════════════════
    // RENDER LIST TAB
    // ═══════════════════════════════════════════════════════════════════════════

    const renderListTab = () => (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name or admission number..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Select value={classFilter} onValueChange={setClassFilter}>
                    <SelectTrigger className="w-[180px]">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="All Classes" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Classes</SelectItem>
                        {uniqueClasses.map(cls => (
                            <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-4 space-y-4">
                            {[1, 2, 3, 4, 5].map(i => (
                                <Skeleton key={i} className="h-16 w-full" />
                            ))}
                        </div>
                    ) : filteredArrivals.length === 0 ? (
                        <div className="text-center py-12">
                            <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                            <p className="text-muted-foreground">
                                {lateArrivals.length === 0 
                                    ? "No late arrivals today! Great job! 🎉" 
                                    : "No students match your filters"}
                            </p>
                        </div>
                    ) : (
                        <ScrollArea className="h-[500px]">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Student</TableHead>
                                        <TableHead>Class</TableHead>
                                        <TableHead>Check-in Time</TableHead>
                                        <TableHead>Late By</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredArrivals.map((student, idx) => (
                                        <TableRow key={idx} className="cursor-pointer hover:bg-muted/50">
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-10 w-10">
                                                        <AvatarImage src={student.photo_url} />
                                                        <AvatarFallback>
                                                            {student.student_name?.charAt(0)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-medium">{student.student_name}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {student.admission_number}
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {student.class_name} - {student.section_name}
                                            </TableCell>
                                            <TableCell>
                                                {formatTime(student.check_in_time)}
                                            </TableCell>
                                            <TableCell>
                                                <Badge 
                                                    variant="outline"
                                                    className={cn(
                                                        student.late_minutes >= 30 && 'bg-red-100 text-red-800',
                                                        student.late_minutes >= 15 && student.late_minutes < 30 && 'bg-orange-100 text-orange-800',
                                                        student.late_minutes < 15 && 'bg-yellow-100 text-yellow-800'
                                                    )}
                                                >
                                                    +{student.late_minutes} min
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedStudent(student);
                                                        setIsDetailsOpen(true);
                                                    }}
                                                >
                                                    View <ChevronRight className="h-4 w-4 ml-1" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    )}
                </CardContent>
            </Card>
        </div>
    );

    // ═══════════════════════════════════════════════════════════════════════════
    // RENDER ANALYTICS TAB
    // ═══════════════════════════════════════════════════════════════════════════

    const renderAnalyticsTab = () => (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart - Late Categories */}
            <Card>
                <CardHeader>
                    <CardTitle>Late Arrival Distribution</CardTitle>
                    <CardDescription>Breakdown by lateness duration</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <Skeleton className="h-[250px] w-full" />
                    ) : pieData.every(d => d.value === 0) ? (
                        <div className="h-[250px] flex items-center justify-center">
                            <p className="text-muted-foreground">No late arrivals today</p>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                    label={({ name, percent }) => 
                                        percent > 0 ? `${name}: ${(percent * 100).toFixed(0)}%` : ''
                                    }
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </CardContent>
            </Card>

            {/* Summary Stats */}
            <Card>
                <CardHeader>
                    <CardTitle>Today's Summary</CardTitle>
                    <CardDescription>{formatDate(selectedDate)}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <Skeleton key={i} className="h-12 w-full" />
                            ))}
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center justify-between p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                                <div className="flex items-center gap-3">
                                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                                    <span>Total Late Students</span>
                                </div>
                                <span className="text-2xl font-bold text-yellow-600">
                                    {summary?.total_late || 0}
                                </span>
                            </div>

                            <div className="flex items-center justify-between p-4 rounded-lg bg-orange-50 dark:bg-orange-900/20">
                                <div className="flex items-center gap-3">
                                    <Clock className="h-5 w-5 text-orange-600" />
                                    <span>Average Late Time</span>
                                </div>
                                <span className="text-2xl font-bold text-orange-600">
                                    {summary?.avg_late_minutes || 0} min
                                </span>
                            </div>

                            <div className="flex items-center justify-between p-4 rounded-lg bg-red-50 dark:bg-red-900/20">
                                <div className="flex items-center gap-3">
                                    <AlertCircle className="h-5 w-5 text-red-600" />
                                    <span>Maximum Late Time</span>
                                </div>
                                <span className="text-2xl font-bold text-red-600">
                                    {summary?.max_late_minutes || 0} min
                                </span>
                            </div>

                            {/* Category Breakdown */}
                            <div className="space-y-3 pt-4 border-t">
                                <p className="text-sm font-medium">By Category</p>
                                {LATE_CATEGORIES.map((cat, idx) => (
                                    <div key={cat.label} className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                                        <span className="flex-1 text-sm">{cat.label}</span>
                                        <Badge variant="outline">
                                            {idx === 0 ? summary?.breakdown?.late_5_15_min :
                                             idx === 1 ? summary?.breakdown?.late_15_30_min :
                                             summary?.breakdown?.late_30_plus_min || 0}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </>
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
            <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription>
                    Please select a branch to view late arrival tracking.
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Clock className="h-8 w-8 text-yellow-500" />
                        Late Arrival Tracking
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Monitor and manage student late arrivals
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

                    <Button 
                        variant="outline" 
                        onClick={fetchData}
                        disabled={refreshing}
                    >
                        <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
                        Refresh
                    </Button>

                    <Button variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard
                    title="Total Late"
                    value={summary?.total_late || 0}
                    subtitle="students"
                    icon={AlertTriangle}
                    color="yellow"
                    loading={loading}
                />
                <StatCard
                    title="Late 5-15 min"
                    value={summary?.breakdown?.late_5_15_min || 0}
                    subtitle="students"
                    icon={Clock}
                    color="yellow"
                    loading={loading}
                />
                <StatCard
                    title="Late 15-30 min"
                    value={summary?.breakdown?.late_15_30_min || 0}
                    subtitle="students"
                    icon={Clock}
                    color="orange"
                    loading={loading}
                />
                <StatCard
                    title="Late 30+ min"
                    value={summary?.breakdown?.late_30_plus_min || 0}
                    subtitle="students"
                    icon={AlertCircle}
                    color="red"
                    loading={loading}
                />
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="list" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Student List
                    </TabsTrigger>
                    <TabsTrigger value="analytics" className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Analytics
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="list" className="mt-6">
                    {renderListTab()}
                </TabsContent>

                <TabsContent value="analytics" className="mt-6">
                    {renderAnalyticsTab()}
                </TabsContent>
            </Tabs>

            {/* Details Dialog */}
            <StudentLateDetailsDialog 
                student={selectedStudent}
                open={isDetailsOpen}
                onClose={() => setIsDetailsOpen(false)}
            />
        </div>
    );
};

export default LateArrivalTracking;
