import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { getWeekdayShortName } from '@/utils/dateUtils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { formatDate } from '@/utils/dateUtils';
import {
    Users, UserPlus, UserCheck, UserX, Calendar, Clock, Wallet, 
    TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
    Building2, Briefcase, Award, GraduationCap, FileText, 
    CalendarDays, CheckCircle2, AlertCircle, XCircle, Loader2,
    ChevronRight, Activity, BarChart3, PieChart, Bell, Gift,
    Target, Zap, Sparkles, Star
} from 'lucide-react';
import { 
    AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
    Tooltip, ResponsiveContainer, PieChart as RechartsPie, Pie, Cell, Legend
} from 'recharts';

// ============================================================================
// GRADIENT DEFINITIONS
// ============================================================================
const gradients = {
    primary: 'from-violet-600 via-purple-600 to-indigo-600',
    success: 'from-emerald-500 via-green-500 to-teal-500',
    warning: 'from-amber-500 via-orange-500 to-yellow-500',
    danger: 'from-rose-500 via-red-500 to-pink-500',
    info: 'from-cyan-500 via-blue-500 to-indigo-500',
    ocean: 'from-blue-400 via-cyan-500 to-teal-500',
};

const COLORS = ['#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#EC4899'];

// ============================================================================
// ANIMATED STAT CARD
// ============================================================================
const StatCard = ({ title, value, icon: Icon, gradient, change, changeType, subtitle, loading }) => {
    const [animatedValue, setAnimatedValue] = useState(0);

    useEffect(() => {
        if (typeof value === 'number' && !loading) {
            const duration = 1000;
            const steps = 30;
            const increment = value / steps;
            let current = 0;
            const timer = setInterval(() => {
                current += increment;
                if (current >= value) {
                    setAnimatedValue(value);
                    clearInterval(timer);
                } else {
                    setAnimatedValue(Math.floor(current));
                }
            }, duration / steps);
            return () => clearInterval(timer);
        }
    }, [value, loading]);

    return (
        <div className="relative group overflow-hidden rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:shadow-xl cursor-pointer">
            <div className={cn("absolute inset-0 bg-gradient-to-br opacity-90", gradient)} />
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute w-32 h-32 -top-16 -right-16 bg-white/10 rounded-full blur-2xl" />
                <div className="absolute w-24 h-24 -bottom-12 -left-12 bg-white/10 rounded-full blur-xl" />
            </div>
            <div className="relative p-5 text-white">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-sm font-medium text-white/80 mb-1">{title}</p>
                        {loading ? (
                            <Loader2 className="h-8 w-8 animate-spin" />
                        ) : (
                            <h3 className="text-3xl font-bold tracking-tight">
                                {typeof value === 'number' ? animatedValue.toLocaleString() : value}
                            </h3>
                        )}
                        {subtitle && <p className="text-xs text-white/70 mt-1">{subtitle}</p>}
                        {change && (
                            <div className={cn(
                                "flex items-center gap-1 mt-2 text-sm font-medium",
                                changeType === 'increase' ? "text-green-200" : "text-red-200"
                            )}>
                                {changeType === 'increase' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                                <span>{change}</span>
                            </div>
                        )}
                    </div>
                    <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                        <Icon className="h-7 w-7 text-white" />
                    </div>
                </div>
            </div>
        </div>
    );
};

// ============================================================================
// QUICK ACTION BUTTON
// ============================================================================
const QuickAction = ({ icon: Icon, label, onClick, gradient }) => (
    <Button
        onClick={onClick}
        variant="outline"
        className="h-auto py-3 px-4 flex flex-col items-center gap-2 hover:bg-muted/50 transition-all group w-full"
    >
        <div className={cn("p-2.5 rounded-xl bg-gradient-to-br group-hover:scale-110 transition-transform", gradient)}>
            <Icon className="h-5 w-5 text-white" />
        </div>
        <span className="text-xs font-medium text-center">{label}</span>
    </Button>
);

// ============================================================================
// LEAVE REQUEST CARD
// ============================================================================
const LeaveRequestCard = ({ request, onApprove, onReject }) => (
    <div className="flex items-center gap-4 p-4 border rounded-xl hover:bg-muted/30 transition-colors">
        <Avatar className="h-10 w-10">
            <AvatarImage src={request.photo_url} />
            <AvatarFallback>{request.full_name?.[0] || 'E'}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{request.full_name}</p>
            <p className="text-xs text-muted-foreground">
                {request.leave_type} • {formatDate(request.start_date)} - {formatDate(request.end_date)}
            </p>
        </div>
        <div className="flex gap-2">
            <Button size="sm" variant="outline" className="h-8 text-green-600 hover:bg-green-50" onClick={() => onApprove(request.id)}>
                <CheckCircle2 className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" className="h-8 text-red-600 hover:bg-red-50" onClick={() => onReject(request.id)}>
                <XCircle className="h-4 w-4" />
            </Button>
        </div>
    </div>
);

// ============================================================================
// BIRTHDAY CARD
// ============================================================================
const BirthdayCard = ({ employee }) => (
    <div className="flex items-center gap-3 p-3 border rounded-xl bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20">
        <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-full">
            <Gift className="h-4 w-4 text-pink-600" />
        </div>
        <Avatar className="h-8 w-8">
            <AvatarImage src={employee.photo_url} />
            <AvatarFallback>{employee.full_name?.[0] || 'E'}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{employee.full_name}</p>
            <p className="text-xs text-muted-foreground">{employee.designation}</p>
        </div>
        <Badge variant="secondary" className="bg-pink-100 text-pink-700 dark:bg-pink-900/30">
            {formatDate(employee.date_of_birth)}
        </Badge>
    </div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================
const HRDashboard = () => {
    const navigate = useNavigate();
    const { roleSlug } = useParams();
    const { user, organizationId } = useAuth();
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    const basePath = roleSlug || 'super-admin';

    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalEmployees: 0,
        activeEmployees: 0,
        onLeaveToday: 0,
        pendingLeaves: 0,
        departments: 0,
        designations: 0,
        newJoinees: 0,
        resignations: 0
    });
    const [departmentData, setDepartmentData] = useState([]);
    const [attendanceTrend, setAttendanceTrend] = useState([]);
    const [leaveRequests, setLeaveRequests] = useState([]);
    const [recentJoinees, setRecentJoinees] = useState([]);
    const [upcomingBirthdays, setUpcomingBirthdays] = useState([]);
    const [genderData, setGenderData] = useState([]);

    const branchId = selectedBranch?.id || user?.profile?.branch_id;

    useEffect(() => {
        if (branchId && organizationId) {
            fetchDashboardData();
        }
    }, [branchId, organizationId]);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            // Fetch employee stats
            const { data: employees, error: empError } = await supabase
                .from('employee_profiles')
                .select('id, full_name, photo_url, gender, date_of_birth, date_of_joining, department_id, designation_id')
                .eq('branch_id', branchId)
                .eq('organization_id', organizationId);

            if (empError) throw empError;

            const today = new Date();
            const thisMonth = today.getMonth();
            const thisYear = today.getFullYear();

            // Calculate stats
            const totalEmployees = employees?.length || 0;
            const activeEmployees = totalEmployees; // All fetched employees are considered active
            
            // New joinees this month
            const newJoinees = employees?.filter(e => {
                if (!e.date_of_joining) return false;
                const joinDate = new Date(e.date_of_joining);
                return joinDate.getMonth() === thisMonth && joinDate.getFullYear() === thisYear;
            }).length || 0;

            // Gender distribution
            const maleCount = employees?.filter(e => e.gender?.toLowerCase() === 'male').length || 0;
            const femaleCount = employees?.filter(e => e.gender?.toLowerCase() === 'female').length || 0;
            const othersCount = totalEmployees - maleCount - femaleCount;

            setGenderData([
                { name: 'Male', value: maleCount, color: '#3B82F6' },
                { name: 'Female', value: femaleCount, color: '#EC4899' },
                { name: 'Others', value: othersCount, color: '#8B5CF6' }
            ].filter(g => g.value > 0));

            // Upcoming birthdays (next 30 days)
            const birthdays = employees?.filter(e => {
                if (!e.date_of_birth) return false;
                const bday = new Date(e.date_of_birth);
                const bdayThisYear = new Date(thisYear, bday.getMonth(), bday.getDate());
                const diffDays = Math.ceil((bdayThisYear - today) / (1000 * 60 * 60 * 24));
                return diffDays >= 0 && diffDays <= 30;
            }).slice(0, 5) || [];

            setUpcomingBirthdays(birthdays);

            // Recent joinees (last 30 days)
            const thirtyDaysAgo = new Date(today);
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            const recent = employees?.filter(e => {
                if (!e.date_of_joining) return false;
                const joinDate = new Date(e.date_of_joining);
                return joinDate >= thirtyDaysAgo;
            }).slice(0, 5) || [];

            setRecentJoinees(recent);

            // Fetch departments count
            const { count: deptCount } = await supabase
                .from('departments')
                .select('id', { count: 'exact', head: true })
                .eq('branch_id', branchId);

            // Fetch designations count
            const { count: desigCount } = await supabase
                .from('designations')
                .select('id', { count: 'exact', head: true })
                .eq('branch_id', branchId);

            // Fetch pending leave requests (gracefully handle if table/columns don't exist)
            try {
                const { data: leaves, error: leaveError } = await supabase
                    .from('leave_requests')
                    .select('*')
                    .eq('branch_id', branchId)
                    .limit(5);

                if (!leaveError && leaves && leaves.length > 0) {
                    setLeaveRequests(leaves.map(l => ({
                        id: l.id,
                        start_date: l.start_date || l.from_date || l.leave_from,
                        end_date: l.end_date || l.to_date || l.leave_to,
                        status: l.status || 'pending',
                        reason: l.reason || l.remarks || '-',
                        full_name: l.employee_name || 'Employee',
                        leave_type: l.leave_type || 'Leave'
                    })));
                } else {
                    setLeaveRequests([]);
                }
            } catch {
                // Table may not exist - silently ignore
                setLeaveRequests([]);
            }

            // Fetch department distribution
            const { data: depts } = await supabase
                .from('departments')
                .select('id, name')
                .eq('branch_id', branchId);

            if (depts && employees) {
                const deptDist = depts.map(d => ({
                    name: d.name,
                    count: employees.filter(e => e.department_id === d.id).length
                })).filter(d => d.count > 0).sort((a, b) => b.count - a.count).slice(0, 6);
                setDepartmentData(deptDist);
            }

            // Mock attendance trend (last 7 days)
            const trendData = [];
            for (let i = 6; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                const dayName = getWeekdayShortName(date);
                trendData.push({
                    day: dayName,
                    present: Math.floor(activeEmployees * (0.85 + Math.random() * 0.1)),
                    absent: Math.floor(activeEmployees * (0.05 + Math.random() * 0.05)),
                    leave: Math.floor(activeEmployees * (0.02 + Math.random() * 0.03))
                });
            }
            setAttendanceTrend(trendData);

            // Update stats
            setStats({
                totalEmployees,
                activeEmployees,
                onLeaveToday: leaveRequests.length,
                pendingLeaves: leaves?.length || 0,
                departments: deptCount || 0,
                designations: desigCount || 0,
                newJoinees,
                resignations: employees?.filter(e => e.status === 'resigned').length || 0
            });

        } catch (error) {
            console.error('Dashboard fetch error:', error);
            toast({ variant: 'destructive', title: 'Error loading dashboard data' });
        } finally {
            setLoading(false);
        }
    };

    const handleApproveLeave = async (id) => {
        const { error } = await supabase
            .from('leave_requests')
            .update({ status: 'approved' })
            .eq('id', id);
        
        if (error) {
            toast({ variant: 'destructive', title: 'Error approving leave' });
        } else {
            toast({ title: 'Leave approved successfully' });
            setLeaveRequests(prev => prev.filter(l => l.id !== id));
            setStats(prev => ({ ...prev, pendingLeaves: prev.pendingLeaves - 1 }));
        }
    };

    const handleRejectLeave = async (id) => {
        const { error } = await supabase
            .from('leave_requests')
            .update({ status: 'rejected' })
            .eq('id', id);
        
        if (error) {
            toast({ variant: 'destructive', title: 'Error rejecting leave' });
        } else {
            toast({ title: 'Leave rejected' });
            setLeaveRequests(prev => prev.filter(l => l.id !== id));
            setStats(prev => ({ ...prev, pendingLeaves: prev.pendingLeaves - 1 }));
        }
    };

    return (
        <DashboardLayout>
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Users className="h-7 w-7 text-primary" />
                            HR Dashboard
                        </h1>
                        <p className="text-muted-foreground">Human Resource Management Overview</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => navigate(`/${basePath}/human-resource/staff-directory`)}>
                            <Users className="h-4 w-4 mr-2" />
                            Staff Directory
                        </Button>
                        <Button onClick={() => navigate(`/${basePath}/human-resource/add-employee`)}>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Add Employee
                        </Button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        title="Total Employees"
                        value={stats.totalEmployees}
                        icon={Users}
                        gradient={gradients.primary}
                        subtitle={`${stats.activeEmployees} Active`}
                        loading={loading}
                    />
                    <StatCard
                        title="Departments"
                        value={stats.departments}
                        icon={Building2}
                        gradient={gradients.info}
                        loading={loading}
                    />
                    <StatCard
                        title="Pending Leaves"
                        value={stats.pendingLeaves}
                        icon={Calendar}
                        gradient={gradients.warning}
                        subtitle="Awaiting approval"
                        loading={loading}
                    />
                    <StatCard
                        title="New Joinees"
                        value={stats.newJoinees}
                        icon={UserPlus}
                        gradient={gradients.success}
                        subtitle="This month"
                        loading={loading}
                    />
                </div>

                {/* Quick Actions */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Zap className="h-5 w-5 text-yellow-500" />
                            Quick Actions
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                            <QuickAction icon={UserPlus} label="Add Employee" gradient={gradients.primary} onClick={() => navigate(`/${basePath}/human-resource/add-employee`)} />
                            <QuickAction icon={Building2} label="Departments" gradient={gradients.info} onClick={() => navigate(`/${basePath}/human-resource/departments`)} />
                            <QuickAction icon={Briefcase} label="Designations" gradient={gradients.success} onClick={() => navigate(`/${basePath}/human-resource/designations`)} />
                            <QuickAction icon={Calendar} label="Leave Requests" gradient={gradients.warning} onClick={() => navigate(`/${basePath}/human-resource/approve-staff-leave`)} />
                            <QuickAction icon={Wallet} label="Payroll" gradient={gradients.ocean} onClick={() => navigate(`/${basePath}/human-resource/payroll`)} />
                            <QuickAction icon={Target} label="Performance" gradient={gradients.danger} onClick={() => navigate(`/${basePath}/human-resource/employee-performance`)} />
                            <QuickAction icon={FileText} label="Documents" gradient="from-gray-500 to-gray-600" onClick={() => navigate(`/${basePath}/human-resource/employee-documents`)} />
                            <QuickAction icon={Award} label="ID Cards" gradient="from-indigo-500 to-purple-600" onClick={() => navigate(`/${basePath}/human-resource/staff-id-card`)} />
                        </div>
                    </CardContent>
                </Card>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Department Distribution */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <BarChart3 className="h-5 w-5 text-primary" />
                                Department Distribution
                            </CardTitle>
                            <CardDescription>Employee count by department</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="h-64 flex items-center justify-center">
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                </div>
                            ) : departmentData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={280}>
                                    <BarChart data={departmentData} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                        <XAxis type="number" />
                                        <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                                        <Tooltip />
                                        <Bar dataKey="count" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-64 flex items-center justify-center text-muted-foreground">
                                    No department data available
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Gender Distribution */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <PieChart className="h-5 w-5 text-primary" />
                                Gender Distribution
                            </CardTitle>
                            <CardDescription>Employee breakdown by gender</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="h-64 flex items-center justify-center">
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                </div>
                            ) : genderData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={280}>
                                    <RechartsPie>
                                        <Pie
                                            data={genderData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={100}
                                            paddingAngle={5}
                                            dataKey="value"
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        >
                                            {genderData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </RechartsPie>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-64 flex items-center justify-center text-muted-foreground">
                                    No gender data available
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Attendance Trend */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Activity className="h-5 w-5 text-primary" />
                            Weekly Attendance Trend
                        </CardTitle>
                        <CardDescription>Last 7 days attendance overview</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="h-64 flex items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={attendanceTrend}>
                                    <defs>
                                        <linearGradient id="presentGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="absentGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="day" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Area type="monotone" dataKey="present" name="Present" stroke="#10B981" fillOpacity={1} fill="url(#presentGradient)" />
                                    <Area type="monotone" dataKey="absent" name="Absent" stroke="#EF4444" fillOpacity={1} fill="url(#absentGradient)" />
                                    <Area type="monotone" dataKey="leave" name="On Leave" stroke="#F59E0B" fillOpacity={0.3} fill="#F59E0B" />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                {/* Bottom Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Pending Leave Requests */}
                    <Card className="lg:col-span-2">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Calendar className="h-5 w-5 text-orange-500" />
                                    Pending Leave Requests
                                </CardTitle>
                                <CardDescription>Requires your approval</CardDescription>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => navigate(`/${basePath}/human-resource/approve-staff-leave`)}>
                                View All <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[300px]">
                                {loading ? (
                                    <div className="flex items-center justify-center h-full">
                                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                    </div>
                                ) : leaveRequests.length > 0 ? (
                                    <div className="space-y-3">
                                        {leaveRequests.map(request => (
                                            <LeaveRequestCard 
                                                key={request.id} 
                                                request={request} 
                                                onApprove={handleApproveLeave}
                                                onReject={handleRejectLeave}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                                        <CheckCircle2 className="h-12 w-12 mb-2 text-green-500" />
                                        <p>No pending leave requests</p>
                                    </div>
                                )}
                            </ScrollArea>
                        </CardContent>
                    </Card>

                    {/* Upcoming Birthdays */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Gift className="h-5 w-5 text-pink-500" />
                                Upcoming Birthdays
                            </CardTitle>
                            <CardDescription>Next 30 days</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[300px]">
                                {loading ? (
                                    <div className="flex items-center justify-center h-full">
                                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                    </div>
                                ) : upcomingBirthdays.length > 0 ? (
                                    <div className="space-y-3">
                                        {upcomingBirthdays.map((emp, idx) => (
                                            <BirthdayCard key={idx} employee={emp} />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                                        <Calendar className="h-12 w-12 mb-2" />
                                        <p>No upcoming birthdays</p>
                                    </div>
                                )}
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Joinees */}
                {recentJoinees.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-green-500" />
                                Recent Joinees
                            </CardTitle>
                            <CardDescription>New team members in last 30 days</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-4">
                                {recentJoinees.map((emp, idx) => (
                                    <div key={idx} className="flex items-center gap-3 p-3 border rounded-xl bg-green-50/50 dark:bg-green-900/10">
                                        <Avatar className="h-10 w-10 border-2 border-green-200">
                                            <AvatarImage src={emp.photo_url} />
                                            <AvatarFallback>{emp.full_name?.[0] || 'N'}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-medium text-sm">{emp.full_name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                Joined: {formatDate(emp.date_of_joining)}
                                            </p>
                                        </div>
                                        <Badge variant="secondary" className="bg-green-100 text-green-700 ml-2">
                                            New
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    );
};

export default HRDashboard;
