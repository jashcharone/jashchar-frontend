// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// JASHCHAR ERP - FUTURISTIC LIVE ATTENDANCE DASHBOARD
// Real-time attendance monitoring with animations
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    UserCheck,
    UserX,
    Clock,
    TrendingUp,
    Activity,
    Bell,
    RefreshCw,
    Wifi,
    WifiOff,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Timer,
    Zap,
    Sparkles,
    GraduationCap,
    Briefcase,
    MapPin,
    ScanFace,
    QrCode,
    CreditCard,
    Fingerprint,
    BarChart3,
    Calendar,
    School,
    ArrowUpRight,
    ArrowDownRight,
    Eye,
    Volume2
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// ANIMATED COUNTER COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

const AnimatedCounter = ({ value, duration = 1000, className = '' }) => {
    const [displayValue, setDisplayValue] = useState(0);
    
    useEffect(() => {
        let startTime;
        const startValue = displayValue;
        const diff = value - startValue;
        
        const animate = (currentTime) => {
            if (!startTime) startTime = currentTime;
            const progress = Math.min((currentTime - startTime) / duration, 1);
            const easeProgress = 1 - Math.pow(1 - progress, 3); // Ease out cubic
            setDisplayValue(Math.floor(startValue + diff * easeProgress));
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }, [value, duration]);
    
    return <span className={className}>{displayValue.toLocaleString()}</span>;
};

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// LIVE PULSE INDICATOR
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

const PulseIndicator = ({ isLive, className = '' }) => (
    <div className={`flex items-center gap-2 ${className}`}>
        <div className="relative">
            <div className={`w-3 h-3 rounded-full ${isLive ? 'bg-green-500' : 'bg-red-500'}`}>
                {isLive && (
                    <div className="absolute inset-0 rounded-full bg-green-500 animate-ping" />
                )}
            </div>
        </div>
        <span className={`text-sm font-medium ${isLive ? 'text-green-600' : 'text-red-600'}`}>
            {isLive ? 'LIVE' : 'OFFLINE'}
        </span>
    </div>
);

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// STAT CARD WITH GRADIENT
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

const GlassStatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    trend, 
    trendValue, 
    color = 'blue',
    subtitle,
    onClick,
    className = ''
}) => {
    const gradients = {
        blue: 'from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30',
        green: 'from-emerald-500/20 to-green-500/20 hover:from-emerald-500/30 hover:to-green-500/30',
        red: 'from-red-500/20 to-rose-500/20 hover:from-red-500/30 hover:to-rose-500/30',
        yellow: 'from-yellow-500/20 to-amber-500/20 hover:from-yellow-500/30 hover:to-amber-500/30',
        purple: 'from-purple-500/20 to-violet-500/20 hover:from-purple-500/30 hover:to-violet-500/30',
        orange: 'from-orange-500/20 to-amber-500/20 hover:from-orange-500/30 hover:to-amber-500/30',
    };
    
    const iconColors = {
        blue: 'text-blue-500',
        green: 'text-emerald-500',
        red: 'text-red-500',
        yellow: 'text-yellow-500',
        purple: 'text-purple-500',
        orange: 'text-orange-500',
    };
    
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            whileHover={{ scale: 1.02 }}
            onClick={onClick}
            className={`cursor-pointer ${className}`}
        >
            <Card className={`bg-gradient-to-br ${gradients[color]} backdrop-blur-xl border-white/20 shadow-xl transition-all duration-300`}>
                <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">{title}</p>
                            <div className="flex items-baseline gap-2">
                                <AnimatedCounter 
                                    value={value} 
                                    className="text-4xl font-bold tracking-tight"
                                />
                                {trend && (
                                    <Badge variant={trend === 'up' ? 'default' : 'destructive'} className="text-xs">
                                        {trend === 'up' ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                                        {trendValue}%
                                    </Badge>
                                )}
                            </div>
                            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
                        </div>
                        <div className={`p-3 rounded-2xl bg-background/50 ${iconColors[color]}`}>
                            <Icon className="h-8 w-8" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// CIRCULAR PROGRESS RING
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

const CircularProgress = ({ value, size = 120, strokeWidth = 10, color = '#3B82F6', label, sublabel }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (value / 100) * circumference;
    
    return (
        <div className="relative inline-flex items-center justify-center">
            <svg width={size} height={size} className="transform -rotate-90">
                {/* Background circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    className="text-muted-foreground/20"
                />
                {/* Progress circle */}
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
                <span className="text-2xl font-bold">{value}%</span>
                {label && <span className="text-xs text-muted-foreground">{label}</span>}
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// LIVE EVENT FEED ITEM
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

const LiveEventItem = ({ event, isNew }) => {
    const statusConfig = {
        present: { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10' },
        late: { icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
        absent: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
        check_in: { icon: UserCheck, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        check_out: { icon: UserX, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    };
    
    const sourceConfig = {
        manual: { icon: Users, label: 'Manual' },
        qr_code: { icon: QrCode, label: 'QR Code' },
        rfid: { icon: CreditCard, label: 'RFID' },
        biometric: { icon: Fingerprint, label: 'Biometric' },
        face: { icon: ScanFace, label: 'Face' },
    };
    
    const config = statusConfig[event.status] || statusConfig.present;
    const sourceInfo = sourceConfig[event.source_type] || sourceConfig.manual;
    const Icon = config.icon;
    const SourceIcon = sourceInfo.icon;
    
    return (
        <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className={`flex items-center gap-4 p-4 rounded-xl ${config.bg} ${isNew ? 'ring-2 ring-primary animate-pulse' : ''} transition-all duration-300`}
        >
            <Avatar className="h-12 w-12 border-2 border-background">
                <AvatarImage src={event.photo_url} alt={event.person_name} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/50 text-primary-foreground">
                    {event.person_name?.charAt(0) || '?'}
                </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <p className="font-semibold truncate">{event.person_name}</p>
                    <Badge variant="outline" className="text-xs">
                        {event.person_type === 'student' ? <GraduationCap className="w-3 h-3 mr-1" /> : <Briefcase className="w-3 h-3 mr-1" />}
                        {event.person_type}
                    </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <SourceIcon className="w-3 h-3" />
                    <span>{sourceInfo.label}</span>
                    <span>•</span>
                    <span>{event.class_name || event.department_name || '-'}</span>
                </div>
            </div>
            <div className="flex flex-col items-end gap-1">
                <div className={`flex items-center gap-1 ${config.color}`}>
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium capitalize">{event.status?.replace('_', ' ')}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                    {format(new Date(event.event_time), 'HH:mm:ss')}
                </span>
            </div>
        </motion.div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// CLASS-WISE BREAKDOWN CARD
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

const ClassBreakdownCard = ({ data }) => {
    return (
        <Card className="bg-gradient-to-br from-background to-muted/20 border-white/10">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Class-wise Attendance
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[300px] pr-4">
                    <div className="space-y-4">
                        {data?.map((item, index) => (
                            <motion.div
                                key={item.class_id || index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="space-y-2"
                            >
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-medium">{item.class_name} - {item.section_name}</span>
                                    <span className="text-muted-foreground">
                                        {item.present}/{item.total} ({item.percentage}%)
                                    </span>
                                </div>
                                <div className="relative h-2 rounded-full bg-muted overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${item.percentage}%` }}
                                        transition={{ duration: 0.8, delay: index * 0.05 }}
                                        className={`absolute h-full rounded-full ${
                                            item.percentage >= 90 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                                            item.percentage >= 75 ? 'bg-gradient-to-r from-blue-500 to-cyan-500' :
                                            item.percentage >= 50 ? 'bg-gradient-to-r from-yellow-500 to-amber-500' :
                                            'bg-gradient-to-r from-red-500 to-rose-500'
                                        }`}
                                    />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// SOURCE TYPE BREAKDOWN
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

const SourceTypeCard = ({ data }) => {
    const sources = [
        { key: 'manual', label: 'Manual', icon: Users, color: '#6366F1' },
        { key: 'qr_code', label: 'QR Code', icon: QrCode, color: '#8B5CF6' },
        { key: 'rfid', label: 'RFID', icon: CreditCard, color: '#EC4899' },
        { key: 'biometric', label: 'Biometric', icon: Fingerprint, color: '#F59E0B' },
        { key: 'face', label: 'Face AI', icon: ScanFace, color: '#10B981' },
    ];
    
    return (
        <Card className="bg-gradient-to-br from-background to-muted/20 border-white/10">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    Attendance Source
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-4">
                    {sources.map((source) => {
                        const count = data?.[source.key] || 0;
                        const total = Object.values(data || {}).reduce((a, b) => a + b, 0) || 1;
                        const percentage = Math.round((count / total) * 100);
                        const Icon = source.icon;
                        
                        return (
                            <motion.div
                                key={source.key}
                                whileHover={{ scale: 1.05 }}
                                className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                            >
                                <div 
                                    className="p-2 rounded-lg"
                                    style={{ backgroundColor: `${source.color}20` }}
                                >
                                    <Icon className="w-5 h-5" style={{ color: source.color }} />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">{source.label}</p>
                                    <p className="text-xs text-muted-foreground">{count} ({percentage}%)</p>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// MAIN LIVE DASHBOARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

const LiveAttendanceDashboard = () => {
    const { user, currentSessionId, organizationId } = useAuth();
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    
    const [isLive, setIsLive] = useState(true);
    const [loading, setLoading] = useState(true);
    const [lastRefresh, setLastRefresh] = useState(new Date());
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [viewType, setViewType] = useState('all'); // 'all', 'students', 'staff'
    
    const branchId = selectedBranch?.id || user?.profile?.branch_id;
    
    // Stats state
    const [stats, setStats] = useState({
        totalStudents: 0,
        presentStudents: 0,
        absentStudents: 0,
        lateStudents: 0,
        totalStaff: 0,
        presentStaff: 0,
        absentStaff: 0,
        lateStaff: 0,
    });
    
    const [recentEvents, setRecentEvents] = useState([]);
    const [classBreakdown, setClassBreakdown] = useState([]);
    const [sourceBreakdown, setSourceBreakdown] = useState({});
    
    // Audio for new attendance (optional)
    const audioRef = useRef(null);
    const [soundEnabled, setSoundEnabled] = useState(false);
    
    // Fetch attendance data
    const fetchData = useCallback(async () => {
        if (!branchId) return;
        
        try {
            const today = format(new Date(), 'yyyy-MM-dd');
            
            // Fetch student counts
            const { data: studentData, error: studentError } = await supabase
                .from('student_profiles')
                .select('id', { count: 'exact' })
                .eq('branch_id', branchId)
                .or('status.eq.active,status.is.null');
            
            // Fetch student attendance for today
            const { data: studentAttendance } = await supabase
                .from('student_attendance')
                .select('status')
                .eq('branch_id', branchId)
                .eq('date', today);
            
            // Fetch staff counts
            const { data: staffData, error: staffError } = await supabase
                .from('employee_profiles')
                .select('id', { count: 'exact' })
                .eq('branch_id', branchId)
                .eq('is_active', true);
            
            // Fetch staff attendance for today
            const { data: staffAttendance } = await supabase
                .from('staff_attendance')
                .select('status')
                .eq('branch_id', branchId)
                .eq('attendance_date', today);
            
            // Calculate stats
            const totalStudents = studentData?.length || 0;
            const presentStudents = studentAttendance?.filter(a => a.status === 'present' || a.status === 'late').length || 0;
            const lateStudents = studentAttendance?.filter(a => a.status === 'late').length || 0;
            const absentStudents = studentAttendance?.filter(a => a.status === 'absent').length || 0;
            
            const totalStaff = staffData?.length || 0;
            const presentStaff = staffAttendance?.filter(a => a.status?.toLowerCase() === 'present' || a.status?.toLowerCase() === 'late').length || 0;
            const lateStaff = staffAttendance?.filter(a => a.status?.toLowerCase() === 'late').length || 0;
            const absentStaff = staffAttendance?.filter(a => a.status?.toLowerCase() === 'absent').length || 0;
            
            setStats({
                totalStudents,
                presentStudents,
                absentStudents: totalStudents - presentStudents,
                lateStudents,
                totalStaff,
                presentStaff,
                absentStaff: totalStaff - presentStaff,
                lateStaff,
            });
            
            // Fetch class breakdown
            const { data: classData } = await supabase
                .from('student_attendance')
                .select(`
                    class_id,
                    section_id,
                    status,
                    classes:class_id(name),
                    sections:section_id(name)
                `)
                .eq('branch_id', branchId)
                .eq('date', today);
            
            // Process class breakdown
            const breakdown = {};
            classData?.forEach(record => {
                const key = `${record.class_id}-${record.section_id}`;
                if (!breakdown[key]) {
                    breakdown[key] = {
                        class_id: record.class_id,
                        section_id: record.section_id,
                        class_name: record.classes?.name || 'Unknown',
                        section_name: record.sections?.name || '',
                        total: 0,
                        present: 0,
                    };
                }
                breakdown[key].total++;
                if (record.status === 'present' || record.status === 'late') {
                    breakdown[key].present++;
                }
            });
            
            const breakdownArray = Object.values(breakdown).map(item => ({
                ...item,
                percentage: item.total > 0 ? Math.round((item.present / item.total) * 100) : 0
            })).sort((a, b) => b.percentage - a.percentage);
            
            setClassBreakdown(breakdownArray);
            
            // Mock source breakdown (in real app, this would come from attendance_logs_unified)
            setSourceBreakdown({
                manual: presentStudents + presentStaff,
                qr_code: Math.floor(Math.random() * 20),
                rfid: Math.floor(Math.random() * 15),
                biometric: Math.floor(Math.random() * 10),
                face: Math.floor(Math.random() * 5),
            });
            
            setLoading(false);
            setLastRefresh(new Date());
            setIsLive(true);
            
        } catch (error) {
            console.error('Error fetching attendance data:', error);
            toast({ variant: 'destructive', title: 'Error fetching data', description: error.message });
            setIsLive(false);
        }
    }, [branchId, toast]);
    
    // Initial fetch and auto-refresh
    useEffect(() => {
        fetchData();
        
        if (autoRefresh) {
            const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
            return () => clearInterval(interval);
        }
    }, [fetchData, autoRefresh]);
    
    // Calculate percentages
    const studentAttendancePercentage = stats.totalStudents > 0 
        ? Math.round((stats.presentStudents / stats.totalStudents) * 100) 
        : 0;
    const staffAttendancePercentage = stats.totalStaff > 0 
        ? Math.round((stats.presentStaff / stats.totalStaff) * 100) 
        : 0;
    const overallPercentage = (stats.totalStudents + stats.totalStaff) > 0
        ? Math.round(((stats.presentStudents + stats.presentStaff) / (stats.totalStudents + stats.totalStaff)) * 100)
        : 0;
    
    return (
        <DashboardLayout>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Activity className="h-8 w-8 text-primary animate-pulse" />
                        Live Attendance Dashboard
                    </h1>
                    <p className="text-muted-foreground flex items-center gap-2 mt-1">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(), 'EEEE, MMMM d, yyyy')}
                        <span className="mx-2">•</span>
                        <School className="w-4 h-4" />
                        {selectedBranch?.name || 'All Branches'}
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <PulseIndicator isLive={isLive} />
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSoundEnabled(!soundEnabled)}
                        className={soundEnabled ? 'text-primary' : 'text-muted-foreground'}
                    >
                        <Volume2 className="w-4 h-4" />
                    </Button>
                    <Select value={viewType} onValueChange={setViewType}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="View" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="students">Students</SelectItem>
                            <SelectItem value="staff">Staff</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button onClick={fetchData} variant="outline" size="sm">
                        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </div>
            
            {/* Overall Progress Ring */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex justify-center mb-8"
            >
                <Card className="bg-gradient-to-br from-primary/10 via-background to-primary/5 border-primary/20 p-8">
                    <div className="flex items-center justify-center gap-12">
                        <CircularProgress 
                            value={studentAttendancePercentage} 
                            size={140} 
                            strokeWidth={12}
                            color="#3B82F6"
                            label="Students"
                        />
                        <div className="text-center">
                            <Sparkles className="w-8 h-8 text-primary mx-auto mb-2 animate-pulse" />
                            <p className="text-6xl font-bold bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">
                                {overallPercentage}%
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">Overall Attendance</p>
                            <p className="text-xs text-muted-foreground">
                                Last updated: {format(lastRefresh, 'HH:mm:ss')}
                            </p>
                        </div>
                        <CircularProgress 
                            value={staffAttendancePercentage} 
                            size={140} 
                            strokeWidth={12}
                            color="#10B981"
                            label="Staff"
                        />
                    </div>
                </Card>
            </motion.div>
            
            {/* Main Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <GlassStatCard
                    title="Total Students"
                    value={stats.totalStudents}
                    icon={GraduationCap}
                    color="blue"
                    subtitle="Enrolled this session"
                />
                <GlassStatCard
                    title="Present Students"
                    value={stats.presentStudents}
                    icon={UserCheck}
                    color="green"
                    trend={stats.presentStudents > stats.totalStudents * 0.8 ? 'up' : 'down'}
                    trendValue={studentAttendancePercentage}
                />
                <GlassStatCard
                    title="Late Students"
                    value={stats.lateStudents}
                    icon={Clock}
                    color="yellow"
                    subtitle="Arrived after 9:00 AM"
                />
                <GlassStatCard
                    title="Absent Students"
                    value={stats.absentStudents}
                    icon={UserX}
                    color="red"
                    subtitle="Not marked present"
                />
            </div>
            
            {/* Staff Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <GlassStatCard
                    title="Total Staff"
                    value={stats.totalStaff}
                    icon={Briefcase}
                    color="purple"
                    subtitle="Active employees"
                />
                <GlassStatCard
                    title="Present Staff"
                    value={stats.presentStaff}
                    icon={UserCheck}
                    color="green"
                    trend={stats.presentStaff > stats.totalStaff * 0.9 ? 'up' : 'down'}
                    trendValue={staffAttendancePercentage}
                />
                <GlassStatCard
                    title="Late Staff"
                    value={stats.lateStaff}
                    icon={Timer}
                    color="orange"
                    subtitle="Arrived late today"
                />
                <GlassStatCard
                    title="Absent Staff"
                    value={stats.absentStaff}
                    icon={UserX}
                    color="red"
                    subtitle="On leave or absent"
                />
            </div>
            
            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <ClassBreakdownCard data={classBreakdown} />
                <SourceTypeCard data={sourceBreakdown} />
            </div>
            
            {/* Live Event Feed */}
            <Card className="bg-gradient-to-br from-background to-muted/20 border-white/10">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5 text-primary animate-bounce" />
                        Live Attendance Feed
                        <Badge variant="outline" className="ml-2">
                            <Activity className="w-3 h-3 mr-1" />
                            Real-time
                        </Badge>
                    </CardTitle>
                    <CardDescription>
                        Recent attendance events as they happen
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {recentEvents.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No recent events</p>
                            <p className="text-sm">Attendance events will appear here in real-time</p>
                        </div>
                    ) : (
                        <ScrollArea className="h-[400px]">
                            <AnimatePresence>
                                <div className="space-y-3">
                                    {recentEvents.map((event, index) => (
                                        <LiveEventItem 
                                            key={event.id} 
                                            event={event} 
                                            isNew={index === 0}
                                        />
                                    ))}
                                </div>
                            </AnimatePresence>
                        </ScrollArea>
                    )}
                </CardContent>
            </Card>
            
            {/* Audio element for notifications */}
            <audio ref={audioRef} src="/sounds/notification.mp3" preload="auto" />
        </DashboardLayout>
    );
};

export default LiveAttendanceDashboard;
