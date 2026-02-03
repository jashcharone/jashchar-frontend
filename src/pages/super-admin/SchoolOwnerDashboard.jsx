import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { supabase } from '@/lib/customSupabaseClient';
import { 
  Users, ArrowRight, TrendingUp, TrendingDown, UserPlus, Wallet, Receipt, 
  Contact, CalendarCheck, Clipboard, GraduationCap, BookOpen, Bell, 
  Clock, Activity, Zap, Star, Award, Target, Rocket, Sparkles,
  BarChart3, PieChart, LineChart, ArrowUpRight, ArrowDownRight,
  Calendar, FileText, Settings, ChevronRight, Play, Pause,
  Globe, Shield, Database, Cpu, Wifi, Battery, Signal,
  Sun, Moon, Cloud, Droplets, Wind, AlertTriangle, CheckCircle2,
  Circle, Hexagon, Triangle, Square, Gem, Crown, Flame, Heart
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPie, Pie, Cell, RadialBarChart, RadialBar } from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

// ============================================================================
// ANIMATED GRADIENT BACKGROUNDS
// ============================================================================
const gradients = {
  primary: 'from-violet-600 via-purple-600 to-indigo-600',
  success: 'from-emerald-500 via-green-500 to-teal-500',
  warning: 'from-amber-500 via-orange-500 to-yellow-500',
  danger: 'from-rose-500 via-red-500 to-pink-500',
  info: 'from-cyan-500 via-blue-500 to-indigo-500',
  cosmic: 'from-purple-600 via-pink-500 to-orange-400',
  aurora: 'from-green-400 via-cyan-500 to-blue-600',
  sunset: 'from-orange-500 via-rose-500 to-purple-600',
  ocean: 'from-blue-400 via-cyan-500 to-teal-500',
  forest: 'from-emerald-600 via-green-500 to-lime-400',
  fire: 'from-yellow-400 via-orange-500 to-red-600',
  ice: 'from-blue-200 via-cyan-300 to-teal-400',
  royal: 'from-indigo-600 via-purple-600 to-pink-500',
  neon: 'from-green-400 via-cyan-400 to-blue-500',
};

// ============================================================================
// ANIMATED STAT CARD COMPONENT
// ============================================================================
const AnimatedStatCard = ({ title, value, icon: Icon, gradient, change, changeType, delay = 0, subtitle }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [animatedValue, setAnimatedValue] = useState(0);
  
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (isVisible && typeof value === 'number') {
      const duration = 1500;
      const steps = 60;
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
    } else {
      setAnimatedValue(value);
    }
  }, [isVisible, value]);

  return (
    <div 
      className={cn(
        "relative group overflow-hidden rounded-3xl transition-all duration-700 transform cursor-pointer",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0",
        "hover:scale-[1.02] hover:shadow-2xl"
      )}
    >
      {/* Animated Background Glow */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br opacity-90 transition-opacity duration-500 group-hover:opacity-100",
        gradient
      )} />
      
      {/* Floating Particles Effect */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-32 h-32 -top-16 -right-16 bg-white/10 rounded-full blur-2xl animate-pulse" />
        <div className="absolute w-24 h-24 -bottom-12 -left-12 bg-white/10 rounded-full blur-xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute w-16 h-16 top-1/2 right-1/4 bg-white/5 rounded-full blur-lg animate-bounce" style={{ animationDelay: '0.5s' }} />
      </div>
      
      {/* Shimmer Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      
      <div className="relative p-6 text-white">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-white/80 mb-1">{title}</p>
            <h3 className="text-4xl font-bold tracking-tight mb-2">
              {typeof animatedValue === 'number' ? animatedValue.toLocaleString() : animatedValue}
            </h3>
            {subtitle && (
              <p className="text-xs text-white/70">{subtitle}</p>
            )}
            {change && (
              <div className={cn(
                "flex items-center gap-1 mt-2 text-sm font-medium",
                changeType === 'increase' ? "text-green-200" : "text-red-200"
              )}>
                {changeType === 'increase' ? (
                  <ArrowUpRight className="h-4 w-4" />
                ) : (
                  <ArrowDownRight className="h-4 w-4" />
                )}
                <span>{change}</span>
              </div>
            )}
          </div>
          <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
            <Icon className="h-8 w-8 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// FUTURISTIC CHART CARD
// ============================================================================
const FuturisticChartCard = ({ title, subtitle, children, gradient = 'primary', icon: Icon }) => (
  <Card className="relative overflow-hidden border-0 shadow-2xl bg-card/80 backdrop-blur-xl rounded-3xl">
    {/* Animated Border Gradient */}
    <div className="absolute inset-0 rounded-3xl p-[1px] bg-gradient-to-br from-violet-500/50 via-purple-500/30 to-pink-500/50 -z-10" />
    
    {/* Header Glow */}
    <div className={cn("absolute top-0 left-0 right-0 h-1 bg-gradient-to-r", gradients[gradient])} />
    
    <CardHeader className="pb-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className={cn("p-2 rounded-xl bg-gradient-to-br", gradients[gradient])}>
              <Icon className="h-5 w-5 text-white" />
            </div>
          )}
          <div>
            <CardTitle className="text-lg font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              {title}
            </CardTitle>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>
        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
          <Activity className="h-3 w-3 mr-1" />
          Live
        </Badge>
      </div>
    </CardHeader>
    <CardContent className="pt-4">
      {children}
    </CardContent>
  </Card>
);

// ============================================================================
// QUICK ACTION CARD WITH HOVER EFFECTS
// ============================================================================
const QuickActionCard = ({ name, path, icon: Icon, gradient, description, onClick }) => (
  <button
    type="button"
    onClick={(e) => {
      e.preventDefault();
      e.stopPropagation();
      if (onClick) onClick();
    }}
    className="group relative w-full overflow-hidden rounded-2xl bg-card border border-border/50 p-4 text-left transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 cursor-pointer"
  >
    {/* Hover Background Gradient */}
    <div className={cn(
      "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-300",
      gradient
    )} />
    
    <div className="relative flex items-center gap-4">
      <div className={cn(
        "p-3 rounded-xl bg-gradient-to-br transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6",
        gradient
      )}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
          {name}
        </h4>
        {description && (
          <p className="text-xs text-muted-foreground truncate">{description}</p>
        )}
      </div>
      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
    </div>
  </button>
);

// ============================================================================
// ANIMATED PROGRESS RING
// ============================================================================
const ProgressRing = ({ value, max, label, size = 120 }) => {
  const [animatedValue, setAnimatedValue] = useState(0);
  const percentage = (animatedValue / max) * 100;
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedValue(value), 300);
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={45}
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-muted/20"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={45}
            fill="none"
            stroke="url(#progressGradient)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />
          <defs>
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8B5CF6" />
              <stop offset="50%" stopColor="#EC4899" />
              <stop offset="100%" stopColor="#F97316" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold">{Math.round(percentage)}%</span>
        </div>
      </div>
      <span className="mt-2 text-sm font-medium text-muted-foreground">{label}</span>
    </div>
  );
};

// ============================================================================
// LIVE ACTIVITY FEED
// ============================================================================
const ActivityFeed = ({ activities }) => (
  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
    {activities.map((activity, idx) => (
      <div 
        key={idx}
        className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors animate-in slide-in-from-left"
        style={{ animationDelay: `${idx * 100}ms` }}
      >
        <div className={cn(
          "p-2 rounded-lg bg-gradient-to-br shrink-0",
          activity.gradient || gradients.primary
        )}>
          <activity.icon className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{activity.title}</p>
          <p className="text-xs text-muted-foreground">{activity.time}</p>
        </div>
        {activity.badge && (
          <Badge variant="secondary" className="shrink-0 animate-pulse">
            {activity.badge}
          </Badge>
        )}
      </div>
    ))}
  </div>
);

// ============================================================================
// MAIN DASHBOARD COMPONENT
// ============================================================================
const SchoolOwnerDashboard = () => {
  const { user, currentSessionId, school } = useAuth();
  const { selectedBranch } = useBranch();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [statsData, setStatsData] = useState({
    total_students: 0,
    total_staff: 0,
    today_present: 0,
    today_absent: 0,
    monthly_income: 0,
    monthly_expense: 0,
    attendance_rate: 0,
    fee_collection_rate: 0
  });
  const [loading, setLoading] = useState(true);
  const [feesChartData, setFeesChartData] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Real-time clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Data
  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.profile?.branch_id) {
        setLoading(false);
        return;
      }
      
      try {
        const branchId = selectedBranch?.id || user.profile.branch_id;
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

        // Parallel queries
        const [studentsRes, staffRes, incomeRes] = await Promise.all([
          supabase
            .from('student_profiles')
            .select('*', { count: 'exact', head: true })
            .eq('branch_id', branchId)
            .or('is_disabled.is.null,is_disabled.eq.false'),
          supabase
            .from('employee_profiles')
            .select('*', { count: 'exact', head: true })
            .eq('branch_id', branchId)
            .or('is_disabled.is.null,is_disabled.eq.false'),
          supabase
            .from('fee_payments')
            .select('amount')
            .eq('branch_id', branchId)
            .gte('payment_date', startOfMonth)
            .is('reverted_at', null)
        ]);

        const totalStudents = studentsRes.count || 0;
        const totalStaff = staffRes.count || 0;
        const monthlyIncome = incomeRes.data?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;

        setStatsData({
          total_students: totalStudents,
          total_staff: totalStaff,
          today_present: Math.floor(totalStudents * 0.92), // Mock 92% attendance
          today_absent: Math.floor(totalStudents * 0.08),
          monthly_income: monthlyIncome,
          monthly_expense: Math.floor(monthlyIncome * 0.3), // Mock expense
          attendance_rate: 92,
          fee_collection_rate: 78
        });

        // Fetch fee payments for chart
        const { data: feesData } = await supabase
          .from('fee_payments')
          .select('payment_date, amount')
          .eq('branch_id', branchId)
          .gte('payment_date', startOfMonth)
          .is('reverted_at', null);

        if (feesData) {
          const dailyCollection = feesData.reduce((acc, item) => {
            const day = new Date(item.payment_date).getDate();
            if (!acc[day]) acc[day] = { day: `${day}`, amount: 0 };
            acc[day].amount += item.amount;
            return acc;
          }, {});
          
          // Fill in missing days
          const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
          const chartData = [];
          for (let i = 1; i <= Math.min(daysInMonth, new Date().getDate()); i++) {
            chartData.push({
              day: `${i}`,
              amount: dailyCollection[i]?.amount || 0
            });
          }
          setFeesChartData(chartData);
        }
      } catch (err) {
        console.error("Error fetching dashboard stats:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, [user, currentSessionId, selectedBranch]);

  // Quick Actions Configuration
  const quickActions = [
    { name: 'Student Details', path: '/super-admin/student-information/details', icon: Users, gradient: gradients.primary, description: 'View all students' },
    { name: 'New Admission', path: '/super-admin/student-information/admission', icon: UserPlus, gradient: gradients.success, description: 'Add new student' },
    { name: 'Collect Fees', path: '/super-admin/fees-collection/collect-fees', icon: Wallet, gradient: gradients.warning, description: 'Fee collection' },
    { name: 'Add Income', path: '/super-admin/finance/add-income', icon: TrendingUp, gradient: gradients.info, description: 'Record income' },
    { name: 'Add Expense', path: '/super-admin/finance/add-expense', icon: Receipt, gradient: gradients.danger, description: 'Record expense' },
    { name: 'Staff Directory', path: '/super-admin/human-resource/employees', icon: Contact, gradient: gradients.cosmic, description: 'Manage staff' },
    { name: 'Attendance', path: '/super-admin/attendance/student-attendance', icon: CalendarCheck, gradient: gradients.aurora, description: 'Mark attendance' },
    { name: 'Notice Board', path: '/super-admin/communicate/notice-board', icon: Clipboard, gradient: gradients.sunset, description: 'Announcements' },
  ];

  // Recent Activity Mock Data
  const recentActivities = [
    { title: 'New admission: Rahul Kumar', time: '2 minutes ago', icon: UserPlus, gradient: gradients.success, badge: 'New' },
    { title: 'Fee collected: ₹15,000', time: '15 minutes ago', icon: Wallet, gradient: gradients.warning },
    { title: 'Staff attendance marked', time: '1 hour ago', icon: CalendarCheck, gradient: gradients.info },
    { title: 'Exam schedule updated', time: '2 hours ago', icon: FileText, gradient: gradients.cosmic },
    { title: 'New notice published', time: '3 hours ago', icon: Bell, gradient: gradients.aurora },
  ];

  // Pie chart data for student distribution
  const studentDistribution = [
    { name: 'Primary', value: 35, color: '#8B5CF6' },
    { name: 'Middle', value: 30, color: '#EC4899' },
    { name: 'High', value: 25, color: '#F97316' },
    { name: 'Senior', value: 10, color: '#10B981' },
  ];

  // Not approved state
  if (!user?.profile?.branch_id) {
    return (
      <DashboardLayout>
        <div className="min-h-[80vh] flex items-center justify-center p-6">
          <Card className="max-w-md w-full overflow-hidden border-0 shadow-2xl rounded-3xl">
            <div className="h-2 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500" />
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center animate-pulse">
                <Clock className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Pending Approval</h2>
              <p className="text-muted-foreground">
                Your account is awaiting administrator approval. You'll be notified once approved.
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-in fade-in duration-500">
        {/* ================================================================ */}
        {/* WELCOME HEADER WITH ANIMATED GRADIENT */}
        {/* ================================================================ */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-8 text-white shadow-2xl">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute w-96 h-96 -top-48 -right-48 bg-white/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute w-72 h-72 -bottom-36 -left-36 bg-white/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <Sparkles className="w-64 h-64 text-white/5 animate-spin" style={{ animationDuration: '20s' }} />
            </div>
          </div>
          
          <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-4xl animate-bounce">👋</span>
                <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                  <Zap className="h-3 w-3 mr-1" />
                  Super Admin
                </Badge>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                Welcome back, {user?.profile?.full_name?.split(' ')[0] || 'Admin'}!
              </h1>
              <p className="text-white/80 text-lg">
                Here's what's happening at your institution today
              </p>
            </div>
            
            <div className="flex flex-col items-end gap-2">
              <div className="text-4xl font-bold font-mono tracking-wider">
                {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="text-white/70 text-sm">
                {currentTime.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
              <Badge variant="outline" className="bg-green-500/20 text-green-200 border-green-400/30 mt-2">
                <Circle className="h-2 w-2 mr-1 fill-green-400 text-green-400 animate-pulse" />
                System Online
              </Badge>
            </div>
          </div>
        </div>

        {/* ================================================================ */}
        {/* STATS CARDS WITH ANIMATIONS */}
        {/* ================================================================ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <AnimatedStatCard
            title="Total Students"
            value={statsData.total_students}
            icon={GraduationCap}
            gradient={gradients.primary}
            change={`${statsData.today_present} present today`}
            changeType="increase"
            delay={100}
          />
          <AnimatedStatCard
            title="Total Staff"
            value={statsData.total_staff}
            icon={Users}
            gradient={gradients.success}
            subtitle="Active employees"
            delay={200}
          />
          <AnimatedStatCard
            title="This Month Income"
            value={`₹${statsData.monthly_income.toLocaleString()}`}
            icon={TrendingUp}
            gradient={gradients.info}
            change="+12% from last month"
            changeType="increase"
            delay={300}
          />
          <AnimatedStatCard
            title="This Month Expense"
            value={`₹${statsData.monthly_expense.toLocaleString()}`}
            icon={TrendingDown}
            gradient={gradients.warning}
            change="-5% from last month"
            changeType="decrease"
            delay={400}
          />
        </div>

        {/* ================================================================ */}
        {/* MAIN CONTENT GRID */}
        {/* ================================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Fee Collection Chart - 2 columns */}
          <div className="lg:col-span-2">
            <FuturisticChartCard 
              title="Fee Collection Analytics" 
              subtitle="Daily collection trend this month"
              gradient="primary"
              icon={BarChart3}
            >
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={feesChartData}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(val) => `₹${val/1000}k`} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))', 
                      borderRadius: '12px',
                      boxShadow: '0 10px 40px -10px rgba(0,0,0,0.3)'
                    }}
                    formatter={(value) => [`₹${value.toLocaleString()}`, 'Collected']}
                    labelFormatter={(label) => `Day ${label}`}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#8B5CF6" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorAmount)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </FuturisticChartCard>
          </div>

          {/* Progress Metrics */}
          <FuturisticChartCard 
            title="Performance Metrics" 
            subtitle="Key indicators"
            gradient="success"
            icon={Target}
          >
            <div className="flex flex-col items-center gap-6 py-4">
              <ProgressRing 
                value={statsData.attendance_rate} 
                max={100} 
                label="Attendance Rate" 
              />
              <div className="w-full space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Fee Collection</span>
                    <span className="font-semibold">{statsData.fee_collection_rate}%</span>
                  </div>
                  <div className="h-3 bg-muted/30 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-1000"
                      style={{ width: `${statsData.fee_collection_rate}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Academic Progress</span>
                    <span className="font-semibold">85%</span>
                  </div>
                  <div className="h-3 bg-muted/30 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all duration-1000"
                      style={{ width: '85%' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </FuturisticChartCard>
        </div>

        {/* ================================================================ */}
        {/* QUICK ACTIONS & ACTIVITY FEED */}
        {/* ================================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions - 2 columns */}
          <div className="lg:col-span-2">
            <FuturisticChartCard 
              title="Quick Actions" 
              subtitle="Frequently used features"
              gradient="cosmic"
              icon={Zap}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {quickActions.map((action, idx) => (
                  <QuickActionCard
                    key={action.name}
                    {...action}
                    onClick={() => navigate(action.path)}
                  />
                ))}
              </div>
            </FuturisticChartCard>
          </div>

          {/* Activity Feed */}
          <FuturisticChartCard 
            title="Recent Activity" 
            subtitle="Latest updates"
            gradient="aurora"
            icon={Activity}
          >
            <ActivityFeed activities={recentActivities} />
          </FuturisticChartCard>
        </div>

        {/* ================================================================ */}
        {/* STUDENT DISTRIBUTION & SYSTEM STATUS */}
        {/* ================================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Student Distribution */}
          <FuturisticChartCard 
            title="Student Distribution" 
            subtitle="By grade level"
            gradient="sunset"
            icon={PieChart}
          >
            <div className="flex items-center justify-center gap-8 flex-wrap">
              <ResponsiveContainer width={200} height={200}>
                <RechartsPie>
                  <Pie
                    data={studentDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {studentDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                </RechartsPie>
              </ResponsiveContainer>
              <div className="space-y-3">
                {studentDistribution.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <div>
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.value}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </FuturisticChartCard>

          {/* System Status */}
          <FuturisticChartCard 
            title="System Status" 
            subtitle="Infrastructure health"
            gradient="neon"
            icon={Cpu}
          >
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Database', status: 'Healthy', icon: Database, color: 'text-green-500' },
                { label: 'API Server', status: 'Online', icon: Globe, color: 'text-green-500' },
                { label: 'Storage', status: '68% Used', icon: Battery, color: 'text-yellow-500' },
                { label: 'Network', status: 'Excellent', icon: Wifi, color: 'text-green-500' },
              ].map((item, idx) => (
                <div 
                  key={idx}
                  className="flex items-center gap-3 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="p-2 rounded-lg bg-muted">
                    <item.icon className={cn("h-5 w-5", item.color)} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className={cn("text-xs", item.color)}>{item.status}</p>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Uptime Bar */}
            <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  System Uptime
                </span>
                <span className="text-sm font-bold text-green-500">99.9%</span>
              </div>
              <div className="h-2 bg-green-500/20 rounded-full overflow-hidden">
                <div className="h-full w-[99.9%] bg-gradient-to-r from-green-500 to-emerald-500 rounded-full" />
              </div>
            </div>
          </FuturisticChartCard>
        </div>

        {/* ================================================================ */}
        {/* FOOTER BRANDING */}
        {/* ================================================================ */}
        <div className="text-center py-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 text-muted-foreground text-sm">
            <Sparkles className="h-4 w-4 text-primary animate-pulse" />
            <span>Powered by</span>
            <span className="font-bold bg-gradient-to-r from-violet-500 to-pink-500 bg-clip-text text-transparent">
              Jashchar ERP
            </span>
            <span>• Built for the next 100 years</span>
            <Rocket className="h-4 w-4 text-primary animate-bounce" />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SchoolOwnerDashboard;
