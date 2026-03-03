import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import SmartInsights from '@/components/dashboard/SmartInsights';
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
  Circle, Hexagon, Triangle, Square, Gem, Crown, Flame, Heart,
  Building2, MapPin
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
const AnimatedStatCard = ({ title, value, icon: Icon, gradient, change, changeType, delay = 0, subtitle, splitStats }) => {
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
            {/* Split Stats Display - Active/Inactive Pills */}
            {splitStats && (
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/30 backdrop-blur-sm border border-green-300/30">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                  <span className="text-xs font-semibold text-green-100">{splitStats.active} Active</span>
                </div>
                {splitStats.inactive > 0 && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/30 backdrop-blur-sm border border-red-300/30">
                    <div className="w-2 h-2 rounded-full bg-red-400"></div>
                    <span className="text-xs font-semibold text-red-100">{splitStats.inactive} Inactive</span>
                  </div>
                )}
              </div>
            )}
            {subtitle && !splitStats && (
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
// ============================================================================
// TOP STATS BAR COMPONENT (Like in screenshot)
// ============================================================================
const topStatsColorMap = {
  red: { text: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30' },
  orange: { text: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/30' },
  yellow: { text: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/30' },
  purple: { text: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/30' },
  blue: { text: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  green: { text: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30' },
};

const TopStatsBadge = ({ icon: Icon, label, value, total, color = 'blue', bgColor }) => {
  const colorStyles = topStatsColorMap[color] || topStatsColorMap.blue;
  const textColor = colorStyles.text;
  const backgroundColor = bgColor || colorStyles.bg;
  
  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${backgroundColor} border`}>
      {Icon && <Icon className={`h-4 w-4 ${textColor}`} />}
      <span className="text-sm font-medium">{label}</span>
      <Badge variant="secondary" className="ml-auto">{value}/{total}</Badge>
    </div>
  );
};

// ============================================================================
// OVERVIEW CARD COMPONENT (Fees Overview, Library Overview, etc.)
// ============================================================================
const OverviewCard = ({ title, items, icon: Icon, gradient }) => (
  <Card className="overflow-hidden">
    <CardHeader className={`py-3 bg-gradient-to-r ${gradient} text-white`}>
      <CardTitle className="text-sm font-medium flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4" />}
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="p-4 space-y-2">
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center justify-between text-sm">
          <span className={`font-medium ${item.color || 'text-foreground'}`}>
            {item.count} {item.label}
          </span>
          <span className="text-muted-foreground">{item.percentage}</span>
        </div>
      ))}
    </CardContent>
  </Card>
);

// ============================================================================
// STAFF COUNT CARD
// ============================================================================
const colorClasses = {
  green: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  red: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  indigo: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
  cyan: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400',
  amber: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  pink: 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400',
  violet: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
};

const StaffCountCard = ({ icon: Icon, label, count, value, bgColor, color = 'blue' }) => {
  const displayValue = value !== undefined ? value : count;
  const bgClass = bgColor || colorClasses[color] || 'bg-muted';
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 flex items-center gap-3">
        {Icon && (
          <div className={`p-2 rounded-lg ${bgClass}`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
        <div className={Icon ? '' : 'w-full text-center'}>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold">{displayValue}</p>
        </div>
      </CardContent>
    </Card>
  );
};

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
    inactive_students: 0,
    total_staff: 0,
    inactive_staff: 0,
    today_present: 0,
    today_absent: 0,
    monthly_income: 0,
    monthly_expense: 0,
    attendance_rate: 0,
    fee_collection_rate: 0
  });
  const [loading, setLoading] = useState(true);
  const [feesChartData, setFeesChartData] = useState([]);
  const [sessionFeesData, setSessionFeesData] = useState([]);
  const [incomeData, setIncomeData] = useState([]);
  const [expenseData, setExpenseData] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // New state for enhanced dashboard
  const [topStats, setTopStats] = useState({
    feesAwaiting: { value: 0, total: 0 },
    staffLeave: { value: 0, total: 0 },
    studentLeave: { value: 0, total: 0 },
    convertedLeads: { value: 0, total: 0 },
    staffPresent: { value: 0, total: 0 },
    studentPresent: { value: 0, total: 0 }
  });
  
  const [overviewData, setOverviewData] = useState({
    fees: { unpaid: 0, partial: 0, paid: 0, total: 0 },
    enquiry: { active: 0, won: 0, passive: 0, lost: 0, dead: 0 },
    library: { dueReturn: 0, returned: 0, issued: 0, available: 0, total: 0 },
    attendance: { present: 0, late: 0, absent: 0, halfDay: 0, total: 0 }
  });
  
  const [staffCounts, setStaffCounts] = useState({
    admin: 0, teacher: 0, accountant: 0, librarian: 0, receptionist: 0, superAdmin: 0
  });

  // Real-time clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Data - Enhanced for all dashboard sections
  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.profile?.branch_id || !currentSessionId) {
        setLoading(false);
        return;
      }
      
      try {
        const branchId = selectedBranch?.id || user.profile.branch_id;
        const today = new Date().toISOString().split('T')[0];
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

        // Parallel queries for all data
        const [
          studentsRes,
          inactiveStudentsRes,
          staffRes,
          inactiveStaffRes,
          incomeRes, 
          transportIncomeRes,
          hostelIncomeRes,
          expenseRes,
          feesAllocRes,
          feesPaidRes,
          enquiryRes,
          booksRes,
          bookIssuesRes,
          attendanceRes,
          staffAttendanceRes,
          leaveRequestsRes
        ] = await Promise.all([
          // Students count (session-wise for accurate count) - Active students only
          supabase.from('student_profiles').select('*', { count: 'exact', head: true })
            .eq('branch_id', branchId)
            .eq('session_id', currentSessionId)
            .or('is_disabled.is.null,is_disabled.eq.false'),
          // Inactive/Disabled students count
          supabase.from('student_profiles').select('*', { count: 'exact', head: true })
            .eq('branch_id', branchId)
            .eq('session_id', currentSessionId)
            .eq('is_disabled', true),
          // Staff count with role info - Active only
          supabase.from('employee_profiles').select('id, role_id, roles(name)')
            .eq('branch_id', branchId).or('is_disabled.is.null,is_disabled.eq.false'),
          // Inactive/Disabled staff count
          supabase.from('employee_profiles').select('*', { count: 'exact', head: true })
            .eq('branch_id', branchId).eq('is_disabled', true),
          // Monthly income - Academic fees (session-wise)
          supabase.from('fee_payments').select('amount')
            .eq('branch_id', branchId).eq('session_id', currentSessionId).gte('payment_date', startOfMonth).is('reverted_at', null),
          // Monthly income - Transport fees (session-wise)
          supabase.from('transport_fee_payments').select('amount')
            .eq('branch_id', branchId).eq('session_id', currentSessionId).gte('payment_date', startOfMonth).is('reverted_at', null),
          // Monthly income - Hostel fees (session-wise)
          supabase.from('hostel_fee_payments').select('amount')
            .eq('branch_id', branchId).eq('session_id', currentSessionId).gte('payment_date', startOfMonth).is('reverted_at', null),
          // Monthly expense (session-wise)
          supabase.from('expenses').select('amount')
            .eq('branch_id', branchId).eq('session_id', currentSessionId).gte('date', startOfMonth),
          // Fee allocations (total fees assigned - session-wise)
          supabase.from('student_fee_allocations').select('id, student_id', { count: 'exact' })
            .eq('branch_id', branchId).eq('session_id', currentSessionId),
          // Fee payments (paid - session-wise)
          supabase.from('fee_payments').select('student_id, amount')
            .eq('branch_id', branchId).eq('session_id', currentSessionId).is('reverted_at', null),
          // Enquiries
          supabase.from('admission_enquiries').select('id, status').eq('branch_id', branchId),
          // Library books - just count, don't rely on specific columns
          supabase.from('books').select('id', { count: 'exact' })
            .eq('branch_id', branchId),
          // Book issues - just count issued books
          supabase.from('book_issues').select('id, due_date, return_date')
            .eq('branch_id', branchId).is('return_date', null),
          // Today's student attendance (session-wise)
          supabase.from('student_attendance').select('id, status')
            .eq('branch_id', branchId).eq('session_id', currentSessionId).eq('date', today),
          // Today's staff attendance (session-wise)
          supabase.from('staff_attendance').select('id, status')
            .eq('branch_id', branchId).eq('session_id', currentSessionId).eq('attendance_date', today),
          // Leave requests - use staff_id (not employee_id)
          supabase.from('leave_requests').select('id, leave_type_id, status, staff_id')
            .eq('branch_id', branchId).eq('status', 'approved')
        ]);

        const totalStudents = studentsRes.count || 0;
        const inactiveStudents = inactiveStudentsRes.count || 0;
        const totalStaff = staffRes.data?.length || 0;
        const inactiveStaff = inactiveStaffRes.count || 0;
        // Monthly income = Academic + Transport + Hostel fees
        const academicIncome = incomeRes.data?.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0) || 0;
        const transportIncome = transportIncomeRes.data?.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0) || 0;
        const hostelIncome = hostelIncomeRes.data?.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0) || 0;
        const monthlyIncome = academicIncome + transportIncome + hostelIncome;
        const monthlyExpense = expenseRes.data?.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0) || 0;

        // Calculate staff by role
        const staffByRole = { admin: 0, teacher: 0, accountant: 0, librarian: 0, receptionist: 0, superAdmin: 0 };
        staffRes.data?.forEach(emp => {
          const roleName = emp.roles?.name?.toLowerCase() || '';
          if (roleName.includes('admin') && !roleName.includes('super')) staffByRole.admin++;
          else if (roleName.includes('super')) staffByRole.superAdmin++;
          else if (roleName.includes('teacher')) staffByRole.teacher++;
          else if (roleName.includes('accountant')) staffByRole.accountant++;
          else if (roleName.includes('librarian')) staffByRole.librarian++;
          else if (roleName.includes('receptionist')) staffByRole.receptionist++;
        });
        setStaffCounts(staffByRole);

        // Calculate fees overview
        const totalAllocations = feesAllocRes.count || 0;
        const paidStudents = new Set(feesPaidRes.data?.map(p => p.student_id) || []).size;
        const unpaidCount = Math.max(0, totalAllocations - paidStudents);
        setOverviewData(prev => ({
          ...prev,
          fees: { unpaid: unpaidCount, partial: 0, paid: paidStudents, total: totalAllocations }
        }));

        // Calculate enquiry overview
        const enquiries = enquiryRes.data || [];
        const enquiryStats = { active: 0, won: 0, passive: 0, lost: 0, dead: 0 };
        enquiries.forEach(e => {
          const status = e.status?.toLowerCase() || 'active';
          if (status === 'active' || status === 'new') enquiryStats.active++;
          else if (status === 'won' || status === 'converted') enquiryStats.won++;
          else if (status === 'passive' || status === 'followup') enquiryStats.passive++;
          else if (status === 'lost') enquiryStats.lost++;
          else if (status === 'dead') enquiryStats.dead++;
        });
        setOverviewData(prev => ({ ...prev, enquiry: enquiryStats }));

        // Calculate library overview - simplified since we don't have quantity columns
        const totalBooks = booksRes.count || 0;
        const issuedBooks = bookIssuesRes.data?.length || 0; // Books currently issued (not returned)
        const availableBooks = Math.max(0, totalBooks - issuedBooks);
        const dueForReturn = bookIssuesRes.data?.filter(i => new Date(i.due_date) < new Date()).length || 0;
        setOverviewData(prev => ({
          ...prev,
          library: { dueReturn: dueForReturn, returned: 0, issued: issuedBooks, available: availableBooks, total: totalBooks }
        }));

        // Calculate attendance
        const todayAttendance = attendanceRes.data || [];
        const presentCount = todayAttendance.filter(a => a.status === 'present').length;
        const lateCount = todayAttendance.filter(a => a.status === 'late').length;
        const absentCount = todayAttendance.filter(a => a.status === 'absent').length;
        const halfDayCount = todayAttendance.filter(a => a.status === 'half_day').length;
        setOverviewData(prev => ({
          ...prev,
          attendance: { present: presentCount, late: lateCount, absent: absentCount, halfDay: halfDayCount, total: totalStudents }
        }));

        // Staff attendance
        const staffAttendance = staffAttendanceRes.data || [];
        const staffPresentCount = staffAttendance.filter(a => a.status === 'present').length;

        // Leave requests - all approved leaves are staff leaves in leave_requests table
        const staffLeaves = leaveRequestsRes.data?.length || 0;
        const studentLeaves = 0; // Student leaves would be in a different table if any

        // Set top stats
        setTopStats({
          feesAwaiting: { value: unpaidCount, total: totalAllocations },
          staffLeave: { value: staffLeaves, total: 10 },
          studentLeave: { value: studentLeaves, total: 6 },
          convertedLeads: { value: enquiryStats.won, total: enquiries.length },
          staffPresent: { value: staffPresentCount, total: totalStaff },
          studentPresent: { value: presentCount, total: totalStudents }
        });

        setStatsData({
          total_students: totalStudents,
          inactive_students: inactiveStudents,
          total_staff: totalStaff,
          inactive_staff: inactiveStaff,
          today_present: presentCount,
          today_absent: absentCount,
          monthly_income: monthlyIncome,
          monthly_expense: monthlyExpense,
          attendance_rate: totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0,
          fee_collection_rate: totalAllocations > 0 ? Math.round((paidStudents / totalAllocations) * 100) : 0
        });

        // Fetch fee payments for daily chart (session-wise) - Academic + Transport + Hostel
        const [
          { data: feesData },
          { data: transportFeesData },
          { data: hostelFeesData }
        ] = await Promise.all([
          supabase.from('fee_payments').select('payment_date, amount')
            .eq('branch_id', branchId).eq('session_id', currentSessionId).gte('payment_date', startOfMonth).is('reverted_at', null),
          supabase.from('transport_fee_payments').select('payment_date, amount')
            .eq('branch_id', branchId).eq('session_id', currentSessionId).gte('payment_date', startOfMonth).is('reverted_at', null),
          supabase.from('hostel_fee_payments').select('payment_date, amount')
            .eq('branch_id', branchId).eq('session_id', currentSessionId).gte('payment_date', startOfMonth).is('reverted_at', null)
        ]);

        // Combine all fee payments for daily chart
        const allFeesData = [
          ...(feesData || []),
          ...(transportFeesData || []),
          ...(hostelFeesData || [])
        ];

        if (allFeesData.length > 0) {
          const dailyCollection = allFeesData.reduce((acc, item) => {
            const day = new Date(item.payment_date).getDate();
            if (!acc[day]) acc[day] = { day: `${day}`, amount: 0 };
            acc[day].amount += parseFloat(item.amount) || 0;
            return acc;
          }, {});
          
          const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
          const chartData = [];
          for (let i = 1; i <= Math.min(daysInMonth, new Date().getDate()); i++) {
            chartData.push({
              day: `${i}`.padStart(2, '0'),
              amount: dailyCollection[i]?.amount || 0
            });
          }
          setFeesChartData(chartData);
        }

        // Fetch session-wise fees (monthly) - Academic + Transport + Hostel
        const [
          { data: sessionFeesRaw },
          { data: sessionTransportFeesRaw },
          { data: sessionHostelFeesRaw }
        ] = await Promise.all([
          supabase.from('fee_payments').select('payment_date, amount')
            .eq('branch_id', branchId).eq('session_id', currentSessionId).is('reverted_at', null),
          supabase.from('transport_fee_payments').select('payment_date, amount')
            .eq('branch_id', branchId).eq('session_id', currentSessionId).is('reverted_at', null),
          supabase.from('hostel_fee_payments').select('payment_date, amount')
            .eq('branch_id', branchId).eq('session_id', currentSessionId).is('reverted_at', null)
        ]);

        // Combine all session fees
        const allSessionFeesRaw = [
          ...(sessionFeesRaw || []),
          ...(sessionTransportFeesRaw || []),
          ...(sessionHostelFeesRaw || [])
        ];

        if (allSessionFeesRaw.length > 0) {
          const monthlyData = {};
          const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
          months.forEach(m => { monthlyData[m] = { month: m, collection: 0, expense: 0 }; });
          
          allSessionFeesRaw.forEach(item => {
            const monthIdx = new Date(item.payment_date).getMonth();
            const monthName = months[(monthIdx + 9) % 12]; // Adjust for Apr start
            if (monthlyData[monthName]) {
              monthlyData[monthName].collection += parseFloat(item.amount) || 0;
            }
          });
          
          setSessionFeesData(Object.values(monthlyData));
        }

        // Fetch income by category for pie chart (session-wise)
        const { data: incomeCategories } = await supabase
          .from('income')
          .select('income_head_id, amount, income_heads(name)')
          .eq('branch_id', branchId)
          .eq('session_id', currentSessionId)
          .gte('date', startOfMonth);

        if (incomeCategories) {
          const categoryData = {};
          incomeCategories.forEach(item => {
            const category = item.income_heads?.name || 'Miscellaneous';
            if (!categoryData[category]) categoryData[category] = 0;
            categoryData[category] += parseFloat(item.amount) || 0;
          });
          
          const pieColors = ['#10B981', '#F97316', '#8B5CF6', '#6B7280', '#3B82F6'];
          setIncomeData(Object.entries(categoryData).map(([name, value], idx) => ({
            name, value, color: pieColors[idx % pieColors.length]
          })));
        }

        // Fetch expense by category for pie chart (session-wise)
        const { data: expenseCategories } = await supabase
          .from('expenses')
          .select('expense_head_id, amount, expense_heads(name)')
          .eq('branch_id', branchId)
          .eq('session_id', currentSessionId)
          .gte('date', startOfMonth);

        if (expenseCategories) {
          const categoryData = {};
          expenseCategories.forEach(item => {
            const category = item.expense_heads?.name || 'Miscellaneous';
            if (!categoryData[category]) categoryData[category] = 0;
            categoryData[category] += parseFloat(item.amount) || 0;
          });
          
          const pieColors = ['#8B5CF6', '#3B82F6', '#10B981', '#6B7280'];
          setExpenseData(Object.entries(categoryData).map(([name, value], idx) => ({
            name, value, color: pieColors[idx % pieColors.length]
          })));
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
  const { roleSlug } = useParams();
  const basePath = roleSlug || 'super-admin';
  
  const quickActions = [
    { name: 'Student Details', path: `/${basePath}/student-information/details`, icon: Users, gradient: gradients.primary, description: 'View all students' },
    { name: 'New Admission', path: `/${basePath}/student-information/admission`, icon: UserPlus, gradient: gradients.success, description: 'Add new student' },
    { name: 'Collect Fees', path: `/${basePath}/fees-collection/collect-fees`, icon: Wallet, gradient: gradients.warning, description: 'Fee collection' },
    { name: 'Add Income', path: `/${basePath}/finance/add-income`, icon: TrendingUp, gradient: gradients.info, description: 'Record income' },
    { name: 'Add Expense', path: `/${basePath}/finance/add-expense`, icon: Receipt, gradient: gradients.danger, description: 'Record expense' },
    { name: 'Staff Directory', path: `/${basePath}/human-resource/employees`, icon: Contact, gradient: gradients.cosmic, description: 'Manage staff' },
    { name: 'Attendance', path: `/${basePath}/attendance/student-attendance`, icon: CalendarCheck, gradient: gradients.aurora, description: 'Mark attendance' },
    { name: 'Notice Board', path: `/${basePath}/communicate/notice-board`, icon: Clipboard, gradient: gradients.sunset, description: 'Announcements' },
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
      <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-500">
        {/* ================================================================ */}
        {/* WELCOME HEADER WITH ANIMATED GRADIENT */}
        {/* ================================================================ */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-4 sm:p-8 text-white shadow-2xl">
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
              {/* Organization & Branch Info */}
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20">
                  <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-yellow-300" />
                  <span className="text-xs sm:text-sm font-medium text-white/90 truncate max-w-[120px] sm:max-w-none">{school?.name || 'Organization'}</span>
                </div>
                <div className="text-white/50 hidden sm:block">•</div>
                <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20">
                  <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-300" />
                  <span className="text-xs sm:text-sm font-medium text-white/90 truncate max-w-[100px] sm:max-w-none">{selectedBranch?.name || 'Branch'}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3 mb-2">
                <span className="text-4xl animate-bounce">👋</span>
                <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                  <Zap className="h-3 w-3 mr-1" />
                  Super Admin
                </Badge>
              </div>
              <h1 className="text-xl sm:text-3xl md:text-4xl font-bold mb-2">
                Welcome back, {user?.profile?.full_name || 'Admin'}!
              </h1>
              <p className="text-white/80 text-sm sm:text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-300" />
                {(() => {
                  const hour = new Date().getHours();
                  const motivationalQuotes = [
                    "Your dedication shapes tomorrow's leaders! 🌟",
                    "Every student's success starts with your effort! 💪",
                    "Making education better, one day at a time! 📚",
                    "You're building futures, keep inspiring! ✨",
                    "Great things happen with great educators like you! 🎯"
                  ];
                  const greetings = {
                    morning: "Good Morning! Start your day with positive energy! ☀️",
                    afternoon: "Good Afternoon! Keep up the amazing work! 🌤️",
                    evening: "Good Evening! Another productive day ahead! 🌅"
                  };
                  if (hour < 12) return greetings.morning;
                  if (hour < 17) return greetings.afternoon;
                  return greetings.evening;
                })()}
              </p>
            </div>
            
            <div className="flex flex-col items-end gap-1 sm:gap-2">
              <div className="text-2xl sm:text-4xl font-bold font-mono tracking-wider">
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
        {/* TOP STATS BAR - Quick Overview Badges */}
        {/* ================================================================ */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <TopStatsBadge 
            label="Fees Awaiting Payment" 
            value={topStats.feesAwaiting.value} 
            total={topStats.feesAwaiting.total}
            color="red"
          />
          <TopStatsBadge 
            label="Staff Approved Leave" 
            value={topStats.staffLeave.value} 
            total={topStats.staffLeave.total}
            color="orange"
          />
          <TopStatsBadge 
            label="Student Approved Leave" 
            value={topStats.studentLeave.value} 
            total={topStats.studentLeave.total}
            color="yellow"
          />
          <TopStatsBadge 
            label="Converted Leads" 
            value={topStats.convertedLeads.value} 
            total={topStats.convertedLeads.total}
            color="purple"
          />
          <TopStatsBadge 
            label="Staff Present Today" 
            value={topStats.staffPresent.value} 
            total={topStats.staffPresent.total}
            color="blue"
          />
          <TopStatsBadge 
            label="Student Present Today" 
            value={topStats.studentPresent.value} 
            total={topStats.studentPresent.total}
            color="green"
          />
        </div>

        {/* ================================================================ */}
        {/* SMART INSIGHTS - AI-POWERED ACTIONABLE INSIGHTS */}
        {/* ================================================================ */}
        <SmartInsights />

        {/* ================================================================ */}
        {/* STATS CARDS WITH ANIMATIONS */}
        {/* ================================================================ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <AnimatedStatCard
            title="Total Students"
            value={statsData.total_students + statsData.inactive_students}
            icon={GraduationCap}
            gradient={gradients.primary}
            splitStats={{ active: statsData.total_students, inactive: statsData.inactive_students }}
            change={`${statsData.today_present} present today`}
            changeType="increase"
            delay={100}
          />
          <AnimatedStatCard
            title="Total Staff"
            value={statsData.total_staff + statsData.inactive_staff}
            icon={Users}
            gradient={gradients.success}
            splitStats={{ active: statsData.total_staff, inactive: statsData.inactive_staff }}
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
        {/* CHARTS ROW 1: Fees Collection & Expenses Bar Chart + Pie Charts */}
        {/* ================================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Fee Collection Chart - 2 columns */}
          <div className="lg:col-span-2">
            <FuturisticChartCard 
              title={`Fees Collection & Expenses For ${new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' })}`}
              subtitle="Daily collection trend"
              gradient="primary"
              icon={BarChart3}
            >
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={feesChartData}>
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
                  <Bar dataKey="amount" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </FuturisticChartCard>
          </div>

          {/* Income Pie Chart */}
          <FuturisticChartCard 
            title={`Income - ${new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' })}`}
            subtitle="By category"
            gradient="success"
            icon={PieChart}
          >
            <div className="flex flex-col items-center gap-4 py-2">
              <ResponsiveContainer width="100%" height={180}>
                <RechartsPie>
                  <Pie
                    data={incomeData.length > 0 ? incomeData : [{ name: 'No Data', value: 1, color: '#6B7280' }]}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {(incomeData.length > 0 ? incomeData : [{ color: '#6B7280' }]).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`₹${value.toLocaleString()}`, '']}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                  />
                </RechartsPie>
              </ResponsiveContainer>
              <div className="w-full grid grid-cols-2 gap-2 text-xs">
                {incomeData.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="truncate text-muted-foreground">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </FuturisticChartCard>
        </div>

        {/* ================================================================ */}
        {/* CHARTS ROW 2: Session Fees Line Chart + Expense Pie Chart */}
        {/* ================================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Session Fees Line Chart - 2 columns */}
          <div className="lg:col-span-2">
            <FuturisticChartCard 
              title={`Fees Collection & Expenses For Session ${new Date().getFullYear() - 1}-${new Date().getFullYear().toString().slice(-2)}`}
              subtitle="Monthly trend (April - March)"
              gradient="cosmic"
              icon={TrendingUp}
            >
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={sessionFeesData}>
                  <defs>
                    <linearGradient id="colorCollection" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F97316" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#F97316" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(val) => `₹${val/1000}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px' }}
                    formatter={(value, name) => [`₹${value.toLocaleString()}`, name === 'collection' ? 'Collection' : 'Expense']}
                  />
                  <Area type="monotone" dataKey="collection" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorCollection)" />
                  <Area type="monotone" dataKey="expense" stroke="#F97316" strokeWidth={2} fillOpacity={1} fill="url(#colorExpense)" />
                </AreaChart>
              </ResponsiveContainer>
            </FuturisticChartCard>
          </div>

          {/* Expense Pie Chart */}
          <FuturisticChartCard 
            title={`Expense - ${new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' })}`}
            subtitle="By category"
            gradient="warning"
            icon={PieChart}
          >
            <div className="flex flex-col items-center gap-4 py-2">
              <ResponsiveContainer width="100%" height={180}>
                <RechartsPie>
                  <Pie
                    data={expenseData.length > 0 ? expenseData : [{ name: 'No Data', value: 1, color: '#6B7280' }]}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {(expenseData.length > 0 ? expenseData : [{ color: '#6B7280' }]).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`₹${value.toLocaleString()}`, '']}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                  />
                </RechartsPie>
              </ResponsiveContainer>
              <div className="w-full grid grid-cols-2 gap-2 text-xs">
                {expenseData.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="truncate text-muted-foreground">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </FuturisticChartCard>
        </div>

        {/* ================================================================ */}
        {/* OVERVIEW CARDS - Fees, Enquiry, Library, Attendance */}
        {/* ================================================================ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <OverviewCard 
            title="Fees Overview"
            items={[
              { label: 'UNPAID', value: overviewData.fees.unpaid, percent: overviewData.fees.total > 0 ? ((overviewData.fees.unpaid / overviewData.fees.total) * 100).toFixed(2) : 0, color: 'red' },
              { label: 'PARTIAL', value: overviewData.fees.partial, percent: overviewData.fees.total > 0 ? ((overviewData.fees.partial / overviewData.fees.total) * 100).toFixed(2) : 0, color: 'yellow' },
              { label: 'PAID', value: overviewData.fees.paid, percent: overviewData.fees.total > 0 ? ((overviewData.fees.paid / overviewData.fees.total) * 100).toFixed(2) : 0, color: 'green' },
            ]}
          />
          <OverviewCard 
            title="Enquiry Overview"
            items={[
              { label: 'ACTIVE', value: overviewData.enquiry.active, percent: 0, color: 'blue' },
              { label: 'WON', value: overviewData.enquiry.won, percent: 0, color: 'green' },
              { label: 'PASSIVE', value: overviewData.enquiry.passive, percent: 0, color: 'yellow' },
              { label: 'LOST', value: overviewData.enquiry.lost, percent: 0, color: 'red' },
            ]}
          />
          <OverviewCard 
            title="Library Overview"
            items={[
              { label: 'DUE FOR RETURN', value: overviewData.library.dueReturn, color: 'orange' },
              { label: 'ISSUED', value: overviewData.library.issued, suffix: ` OUT OF ${overviewData.library.total}`, color: 'blue' },
              { label: 'AVAILABLE', value: overviewData.library.available, suffix: ` OUT OF ${overviewData.library.total}`, color: 'green' },
            ]}
          />
          <OverviewCard 
            title="Student Today Attendance"
            items={[
              { label: 'PRESENT', value: overviewData.attendance.present, percent: overviewData.attendance.total > 0 ? ((overviewData.attendance.present / overviewData.attendance.total) * 100).toFixed(2) : 0, color: 'green' },
              { label: 'LATE', value: overviewData.attendance.late, percent: overviewData.attendance.total > 0 ? ((overviewData.attendance.late / overviewData.attendance.total) * 100).toFixed(2) : 0, color: 'yellow' },
              { label: 'ABSENT', value: overviewData.attendance.absent, color: 'red' },
              { label: 'HALF DAY', value: overviewData.attendance.halfDay, percent: 0, color: 'orange' },
            ]}
          />
        </div>

        {/* ================================================================ */}
        {/* BOTTOM STATS ROW - Monthly Stats + Staff Counts */}
        {/* ================================================================ */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-10 gap-3">
          <StaffCountCard label="Monthly Fees Collection" value={`₹${statsData.monthly_income.toLocaleString()}`} color="green" />
          <StaffCountCard label="Monthly Expenses" value={`₹${statsData.monthly_expense.toLocaleString()}`} color="red" />
          <StaffCountCard label="Student" value={statsData.total_students} color="blue" />
          <StaffCountCard label="Student Head Count" value={statsData.total_students} color="purple" />
          <StaffCountCard label="Admin" value={staffCounts.admin} color="indigo" />
          <StaffCountCard label="Teacher" value={staffCounts.teacher} color="cyan" />
          <StaffCountCard label="Accountant" value={staffCounts.accountant} color="amber" />
          <StaffCountCard label="Librarian" value={staffCounts.librarian} color="emerald" />
          <StaffCountCard label="Receptionist" value={staffCounts.receptionist} color="pink" />
          <StaffCountCard label="Super Admin" value={staffCounts.superAdmin} color="violet" />
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
