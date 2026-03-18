import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  IndianRupee, Users, Loader2, TrendingUp, TrendingDown, Calendar,
  RefreshCw, AlertCircle, CheckCircle2, Clock, CreditCard, Wallet,
  PieChart, ArrowUpRight, ArrowDownRight, GraduationCap, AlertTriangle,
  Banknote, Receipt, UserCheck, UserX, Building2, CalendarDays,
  Target, Zap, Eye, ChevronRight, LayoutDashboard, Activity,
  CircleDollarSign, Timer, Bell, Users2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate, formatDateTime } from '@/utils/dateUtils';

// ═══════════════════════════════════════════════════════════════════════════════
// FEE DASHBOARD - World-Class Fee Management Dashboard
// Real-time stats, at-a-glance insights, executive summary
// Designed for 500+ schools, built to last 100+ years
// ═══════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────────

const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatCompactCurrency = (amount) => {
  if (!amount && amount !== 0) return '₹0';
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount.toLocaleString('en-IN')}`;
};

// ─────────────────────────────────────────────────────────────────────────────────
// STAT CARD COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────────

const BigStatCard = ({ title, value, subtitle, icon: Icon, color, bgColor, trend, trendLabel, onClick }) => (
  <Card 
    className={cn(
      "relative overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer border-l-4",
      `border-l-${color}`
    )}
    onClick={onClick}
  >
    <CardContent className="p-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          <p className={cn("text-3xl font-bold", `text-${color}`)}>{value}</p>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        <div className={cn("p-4 rounded-2xl", `bg-${color}/10`)}>
          <Icon className={cn("h-8 w-8", `text-${color}`)} />
        </div>
      </div>
      {trend !== undefined && trend !== null && (
        <div className="mt-4 flex items-center gap-2 text-sm">
          {trend >= 0 ? (
            <div className="flex items-center gap-1 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-full">
              <TrendingUp className="h-4 w-4" />
              <span className="font-semibold">+{Math.abs(trend).toFixed(1)}%</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-2 py-1 rounded-full">
              <TrendingDown className="h-4 w-4" />
              <span className="font-semibold">-{Math.abs(trend).toFixed(1)}%</span>
            </div>
          )}
          {trendLabel && <span className="text-muted-foreground">{trendLabel}</span>}
        </div>
      )}
    </CardContent>
  </Card>
);

const SmallStatCard = ({ title, value, icon: Icon, color = 'primary' }) => (
  <div className="flex items-center gap-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
    <div className={cn("p-3 rounded-xl", `bg-${color}/10`)}>
      <Icon className={cn("h-5 w-5", `text-${color}`)} />
    </div>
    <div>
      <p className="text-xs font-medium text-muted-foreground uppercase">{title}</p>
      <p className="text-lg font-bold">{value}</p>
    </div>
  </div>
);

const ProgressCard = ({ title, current, total, color = 'primary' }) => {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">{title}</span>
        <span className="text-sm text-muted-foreground">{percentage}%</span>
      </div>
      <Progress value={percentage} className={cn("h-2", `bg-${color}/20`)} />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{formatCompactCurrency(current)}</span>
        <span>{formatCompactCurrency(total)}</span>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────────
// QUICK ACTION CARD
// ─────────────────────────────────────────────────────────────────────────────────

const QuickActionCard = ({ title, description, icon: Icon, color, onClick }) => (
  <Card 
    className="cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-[1.02]"
    onClick={onClick}
  >
    <CardContent className="p-4">
      <div className="flex items-center gap-4">
        <div className={cn("p-3 rounded-xl", `bg-${color}/10`)}>
          <Icon className={cn("h-6 w-6", `text-${color}`)} />
        </div>
        <div className="flex-1">
          <p className="font-semibold">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
      </div>
    </CardContent>
  </Card>
);

// ─────────────────────────────────────────────────────────────────────────────────
// ALERT CARD
// ─────────────────────────────────────────────────────────────────────────────────

const AlertCard = ({ type, title, count, onClick }) => {
  const configs = {
    danger: { bg: 'bg-red-50 dark:bg-red-900/30', border: 'border-red-200 dark:border-red-800', text: 'text-red-700 dark:text-red-400', icon: AlertTriangle },
    warning: { bg: 'bg-amber-50 dark:bg-amber-900/30', border: 'border-amber-200 dark:border-amber-800', text: 'text-amber-700 dark:text-amber-400', icon: AlertCircle },
    info: { bg: 'bg-blue-50 dark:bg-blue-900/30', border: 'border-blue-200 dark:border-blue-800', text: 'text-blue-700 dark:text-blue-400', icon: Bell },
    success: { bg: 'bg-green-50 dark:bg-green-900/30', border: 'border-green-200 dark:border-green-800', text: 'text-green-700 dark:text-green-400', icon: CheckCircle2 },
  };
  const config = configs[type] || configs.info;
  const IconComp = config.icon;
  
  return (
    <div 
      className={cn(
        "flex items-center justify-between p-4 rounded-lg border cursor-pointer hover:shadow-sm transition-all",
        config.bg, config.border
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <IconComp className={cn("h-5 w-5", config.text)} />
        <span className={cn("font-medium", config.text)}>{title}</span>
      </div>
      <Badge variant="secondary" className={config.text}>{count}</Badge>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────────

const FeeDashboard = () => {
  const { user, currentSessionId, organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();
  
  const branchId = selectedBranch?.id || user?.profile?.branch_id || user?.user_metadata?.branch_id;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(currentSessionId);

  // Dashboard Data
  const [overview, setOverview] = useState({
    totalAllocated: 0,
    totalCollected: 0,
    totalDue: 0,
    totalDiscount: 0,
    totalRefund: 0,
    collectionRate: 0,
    totalStudents: 0,
    fullyPaid: 0,
    partialPaid: 0,
    unpaid: 0,
    totalPayments: 0,
  });
  const [todayStats, setTodayStats] = useState({
    collectedToday: 0,
    paymentsToday: 0,
    studentsToday: 0,
  });
  const [weekStats, setWeekStats] = useState({
    collectedThisWeek: 0,
    collectedLastWeek: 0,
    weekTrend: 0,
  });
  const [monthStats, setMonthStats] = useState({
    collectedThisMonth: 0,
    collectedLastMonth: 0,
    monthTrend: 0,
  });
  const [alerts, setAlerts] = useState({
    overdueCount: 0,
    dueThisWeek: 0,
    pendingRefunds: 0,
    siblingGroups: 0,
  });
  const [topDefaulters, setTopDefaulters] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);
  const [classWiseStats, setClassWiseStats] = useState([]);
  const [paymentModes, setPaymentModes] = useState([]);

  // ─────────────────────────────────────────────────────────────────────────────
  // FETCH SESSIONS
  // ─────────────────────────────────────────────────────────────────────────────

  const fetchSessions = useCallback(async () => {
    if (!branchId) return;
    const { data } = await supabase.from('sessions')
      .select('id, name, is_active')
      .eq('branch_id', branchId)
      .order('name', { ascending: false });
    setSessions(data || []);
  }, [branchId]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);
  useEffect(() => { if (currentSessionId) setSelectedSessionId(currentSessionId); }, [currentSessionId]);

  // ─────────────────────────────────────────────────────────────────────────────
  // FETCH DASHBOARD DATA
  // ─────────────────────────────────────────────────────────────────────────────

  const fetchDashboardData = useCallback(async () => {
    if (!branchId || !selectedSessionId) return;
    
    try {
      // 1. Get all students for session
      const { data: students } = await supabase
        .from('student_profiles')
        .select('id, full_name, school_code, class_id')
        .eq('branch_id', branchId)
        .eq('session_id', selectedSessionId)
        .eq('status', 'active');
      
      const studentIds = students?.map(s => s.id) || [];
      const totalStudents = studentIds.length;

      if (studentIds.length === 0) {
        setOverview(prev => ({ ...prev, totalStudents: 0 }));
        setLoading(false);
        return;
      }

      // HYBRID: Check for NEW architecture first (student_fee_ledger)
      const { data: ledgerCheck } = await supabase
        .from('student_fee_ledger')
        .select('id')
        .eq('branch_id', branchId)
        .eq('session_id', selectedSessionId)
        .limit(1);
      
      const usesNewArchitecture = ledgerCheck && ledgerCheck.length > 0;

      let totalAllocated = 0, totalPaid = 0, totalDue = 0;
      let fullyPaid = 0, partialPaid = 0, unpaid = 0;
      let allPayments = [];
      
      if (usesNewArchitecture) {
        // NEW ARCHITECTURE: Use student_fee_ledger
        const batchSize = 100;
        let allLedgerEntries = [];
        for (let i = 0; i < studentIds.length; i += batchSize) {
          const batch = studentIds.slice(i, i + batchSize);
          const { data } = await supabase
            .from('student_fee_ledger')
            .select('student_id, net_amount, paid_amount, discount_amount')
            .in('student_id', batch)
            .eq('branch_id', branchId)
            .eq('session_id', selectedSessionId);
          if (data) allLedgerEntries.push(...data);
        }
        
        // Get payments for count
        for (let i = 0; i < studentIds.length; i += batchSize) {
          const batch = studentIds.slice(i, i + batchSize);
          const { data } = await supabase
            .from('fee_payments')
            .select('id, student_id, amount, payment_date, payment_mode, created_at')
            .in('student_id', batch)
            .eq('branch_id', branchId)
            .eq('session_id', selectedSessionId);
          if (data) allPayments.push(...data);
        }
        
        totalAllocated = allLedgerEntries.reduce((sum, l) => sum + Number(l.net_amount || 0), 0);
        totalPaid = allLedgerEntries.reduce((sum, l) => sum + Number(l.paid_amount || 0) + Number(l.discount_amount || 0), 0);
        totalDue = Math.max(0, totalAllocated - totalPaid);
        
        // Count payment status per student
        const studentPaymentStatus = {};
        allLedgerEntries.forEach(l => {
          if (!studentPaymentStatus[l.student_id]) {
            studentPaymentStatus[l.student_id] = { allocated: 0, paid: 0 };
          }
          studentPaymentStatus[l.student_id].allocated += Number(l.net_amount || 0);
          studentPaymentStatus[l.student_id].paid += Number(l.paid_amount || 0) + Number(l.discount_amount || 0);
        });
        
        Object.values(studentPaymentStatus).forEach(s => {
          if (s.paid >= s.allocated && s.allocated > 0) fullyPaid++;
          else if (s.paid > 0) partialPaid++;
          else if (s.allocated > 0) unpaid++;
        });
      } else {
        // OLD ARCHITECTURE: Use student_fee_allocations
        let allAllocations = [];
        const batchSize = 100;
        for (let i = 0; i < studentIds.length; i += batchSize) {
          const batch = studentIds.slice(i, i + batchSize);
          const { data } = await supabase
            .from('student_fee_allocations')
            .select('id, student_id, amount, paid, balance, due_date')
            .in('student_id', batch)
            .eq('branch_id', branchId)
            .eq('session_id', selectedSessionId);
          if (data) allAllocations.push(...data);
        }

        for (let i = 0; i < studentIds.length; i += batchSize) {
          const batch = studentIds.slice(i, i + batchSize);
          const { data } = await supabase
            .from('fee_payments')
            .select('id, student_id, amount, payment_date, payment_mode, created_at')
            .in('student_id', batch)
            .eq('branch_id', branchId)
            .eq('session_id', selectedSessionId);
          if (data) allPayments.push(...data);
        }

        totalAllocated = allAllocations.reduce((sum, a) => sum + (a.amount || 0), 0);
        totalPaid = allAllocations.reduce((sum, a) => sum + (a.paid || 0), 0);
        totalDue = allAllocations.reduce((sum, a) => sum + (a.balance || 0), 0);

        const studentPaymentStatus = {};
        allAllocations.forEach(a => {
          if (!studentPaymentStatus[a.student_id]) {
            studentPaymentStatus[a.student_id] = { allocated: 0, paid: 0 };
          }
          studentPaymentStatus[a.student_id].allocated += a.amount || 0;
          studentPaymentStatus[a.student_id].paid += a.paid || 0;
        });

        Object.values(studentPaymentStatus).forEach(s => {
          if (s.paid >= s.allocated && s.allocated > 0) fullyPaid++;
          else if (s.paid > 0) partialPaid++;
          else if (s.allocated > 0) unpaid++;
        });
      }

      const collectionRate = totalAllocated > 0 ? (totalPaid / totalAllocated) * 100 : 0;

      setOverview({
        totalAllocated,
        totalCollected: totalPaid,
        totalDue,
        totalDiscount: 0, // Will be calculated from discounts table
        totalRefund: 0,
        collectionRate,
        totalStudents,
        fullyPaid,
        partialPaid,
        unpaid,
        totalPayments: allPayments.length,
      });

      // 5. Calculate today's stats
      const today = new Date().toISOString().split('T')[0];
      const todayPayments = allPayments.filter(p => p.payment_date?.startsWith(today));
      setTodayStats({
        collectedToday: todayPayments.reduce((sum, p) => sum + (p.amount || 0), 0),
        paymentsToday: todayPayments.length,
        studentsToday: new Set(todayPayments.map(p => p.student_id)).size,
      });

      // 6. Calculate week stats
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      const lastWeekStart = new Date(weekStart);
      lastWeekStart.setDate(lastWeekStart.getDate() - 7);

      const thisWeekPayments = allPayments.filter(p => new Date(p.payment_date) >= weekStart);
      const lastWeekPayments = allPayments.filter(p => {
        const d = new Date(p.payment_date);
        return d >= lastWeekStart && d < weekStart;
      });

      const collectedThisWeek = thisWeekPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const collectedLastWeek = lastWeekPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const weekTrend = collectedLastWeek > 0 ? ((collectedThisWeek - collectedLastWeek) / collectedLastWeek) * 100 : 0;

      setWeekStats({ collectedThisWeek, collectedLastWeek, weekTrend });

      // 7. Calculate month stats
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      const thisMonthPayments = allPayments.filter(p => new Date(p.payment_date) >= monthStart);
      const lastMonthPayments = allPayments.filter(p => {
        const d = new Date(p.payment_date);
        return d >= lastMonthStart && d < monthStart;
      });

      const collectedThisMonth = thisMonthPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const collectedLastMonth = lastMonthPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const monthTrend = collectedLastMonth > 0 ? ((collectedThisMonth - collectedLastMonth) / collectedLastMonth) * 100 : 0;

      setMonthStats({ collectedThisMonth, collectedLastMonth, monthTrend });

      // 8. Calculate alerts
      const overdueAllocations = allAllocations.filter(a => 
        a.balance > 0 && new Date(a.due_date) < new Date()
      );
      const dueThisWeekAllocs = allAllocations.filter(a => {
        if (a.balance <= 0) return false;
        const due = new Date(a.due_date);
        return due >= now && due <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      });

      setAlerts({
        overdueCount: new Set(overdueAllocations.map(a => a.student_id)).size,
        dueThisWeek: new Set(dueThisWeekAllocs.map(a => a.student_id)).size,
        pendingRefunds: 0, // Will be from refunds table
        siblingGroups: 0, // Will be from sibling_groups table
      });

      // 9. Top defaulters
      const studentDues = {};
      allAllocations.forEach(a => {
        if (a.balance > 0) {
          if (!studentDues[a.student_id]) studentDues[a.student_id] = 0;
          studentDues[a.student_id] += a.balance;
        }
      });
      const defaulterList = Object.entries(studentDues)
        .map(([id, due]) => {
          const student = students.find(s => s.id === id);
          return { id, name: student?.full_name, code: student?.school_code, due };
        })
        .sort((a, b) => b.due - a.due)
        .slice(0, 10);
      setTopDefaulters(defaulterList);

      // 10. Recent payments
      const recentPmts = allPayments
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 10)
        .map(p => {
          const student = students.find(s => s.id === p.student_id);
          return {
            id: p.id,
            studentName: student?.full_name,
            studentCode: student?.school_code,
            amount: p.amount,
            mode: p.payment_mode,
            date: p.payment_date,
          };
        });
      setRecentPayments(recentPmts);

      // 11. Payment mode distribution
      const modeMap = {};
      allPayments.forEach(p => {
        const mode = p.payment_mode || 'Unknown';
        if (!modeMap[mode]) modeMap[mode] = { count: 0, amount: 0 };
        modeMap[mode].count++;
        modeMap[mode].amount += p.amount || 0;
      });
      setPaymentModes(Object.entries(modeMap).map(([mode, data]) => ({
        mode, count: data.count, amount: data.amount
      })));

    } catch (error) {
      console.error('Dashboard fetch error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load dashboard data'
      });
    }
    setLoading(false);
    setRefreshing(false);
  }, [branchId, selectedSessionId, toast]);

  useEffect(() => {
    setLoading(true);
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // NAVIGATION HANDLERS
  // ─────────────────────────────────────────────────────────────────────────────

  const navigateTo = (path) => {
    window.location.href = path;
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-lg">Loading Fee Dashboard...</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* HEADER */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <LayoutDashboard className="h-8 w-8 text-primary" />
              Fee Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Real-time fee collection overview and insights
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedSessionId} onValueChange={setSelectedSessionId}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select Session" />
              </SelectTrigger>
              <SelectContent>
                {sessions.map(s => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} {s.is_active && '(Active)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* OVERVIEW STATS - BIG CARDS */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <BigStatCard
            title="Total Allocated"
            value={formatCompactCurrency(overview.totalAllocated)}
            subtitle={`${overview.totalStudents} students`}
            icon={Target}
            color="blue-600"
          />
          <BigStatCard
            title="Total Collected"
            value={formatCompactCurrency(overview.totalCollected)}
            subtitle={`${overview.totalPayments} payments`}
            icon={CircleDollarSign}
            color="green-600"
            trend={monthStats.monthTrend}
            trendLabel="vs last month"
          />
          <BigStatCard
            title="Total Due"
            value={formatCompactCurrency(overview.totalDue)}
            subtitle={`${overview.unpaid + overview.partialPaid} students pending`}
            icon={Clock}
            color="amber-600"
          />
          <BigStatCard
            title="Collection Rate"
            value={`${overview.collectionRate.toFixed(1)}%`}
            subtitle={`${overview.fullyPaid} fully paid`}
            icon={TrendingUp}
            color="purple-600"
          />
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* TODAY'S COLLECTION HIGHLIGHT */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-green-600 rounded-2xl">
                  <Banknote className="h-10 w-10 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-green-700 dark:text-green-400 uppercase tracking-wider">Today&apos;s Collection</p>
                  <p className="text-4xl font-bold text-green-800 dark:text-green-300">{formatCurrency(todayStats.collectedToday)}</p>
                </div>
              </div>
              <div className="flex gap-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-700 dark:text-green-400">{todayStats.paymentsToday}</p>
                  <p className="text-sm text-green-600 dark:text-green-400">Payments</p>
                </div>
                <Separator orientation="vertical" className="h-14" />
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-700 dark:text-green-400">{todayStats.studentsToday}</p>
                  <p className="text-sm text-green-600 dark:text-green-400">Students</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* MAIN CONTENT GRID */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* ─────────────────────────────────────────────────────────────────────── */}
          {/* LEFT COLUMN - COLLECTION PROGRESS & ALERTS */}
          {/* ─────────────────────────────────────────────────────────────────────── */}
          <div className="space-y-6">
            {/* Collection Progress */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Collection Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ProgressCard 
                  title="Overall Collection" 
                  current={overview.totalCollected} 
                  total={overview.totalAllocated}
                  color="green-600"
                />
                <Separator />
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-lg">
                    <UserCheck className="h-5 w-5 text-green-600 dark:text-green-400 mx-auto mb-1" />
                    <p className="text-lg font-bold text-green-700 dark:text-green-400">{overview.fullyPaid}</p>
                    <p className="text-xs text-green-600 dark:text-green-400">Fully Paid</p>
                  </div>
                  <div className="p-3 bg-amber-50 dark:bg-amber-900/30 rounded-lg">
                    <Timer className="h-5 w-5 text-amber-600 dark:text-amber-400 mx-auto mb-1" />
                    <p className="text-lg font-bold text-amber-700 dark:text-amber-400">{overview.partialPaid}</p>
                    <p className="text-xs text-amber-600 dark:text-amber-400">Partial</p>
                  </div>
                  <div className="p-3 bg-red-50 dark:bg-red-900/30 rounded-lg">
                    <UserX className="h-5 w-5 text-red-600 dark:text-red-400 mx-auto mb-1" />
                    <p className="text-lg font-bold text-red-700 dark:text-red-400">{overview.unpaid}</p>
                    <p className="text-xs text-red-600 dark:text-red-400">Unpaid</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Alerts & Notifications */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  Alerts & Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <AlertCard 
                  type="danger" 
                  title="Overdue Payments" 
                  count={alerts.overdueCount}
                  onClick={() => navigateTo('/fees/search-due-fees')}
                />
                <AlertCard 
                  type="warning" 
                  title="Due This Week" 
                  count={alerts.dueThisWeek}
                  onClick={() => navigateTo('/fees/search-due-fees')}
                />
                <AlertCard 
                  type="info" 
                  title="Pending Refunds" 
                  count={alerts.pendingRefunds}
                  onClick={() => navigateTo('/fees/refund-approvals')}
                />
                <AlertCard 
                  type="success" 
                  title="Sibling Groups" 
                  count={alerts.siblingGroups}
                  onClick={() => navigateTo('/fees/sibling-groups')}
                />
              </CardContent>
            </Card>

            {/* Week/Month Comparison */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-primary" />
                  Period Comparison
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">This Week</p>
                    <p className="text-xl font-bold">{formatCompactCurrency(weekStats.collectedThisWeek)}</p>
                  </div>
                  <Badge variant={weekStats.weekTrend >= 0 ? 'default' : 'destructive'}>
                    {weekStats.weekTrend >= 0 ? '+' : ''}{weekStats.weekTrend.toFixed(1)}%
                  </Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">This Month</p>
                    <p className="text-xl font-bold">{formatCompactCurrency(monthStats.collectedThisMonth)}</p>
                  </div>
                  <Badge variant={monthStats.monthTrend >= 0 ? 'default' : 'destructive'}>
                    {monthStats.monthTrend >= 0 ? '+' : ''}{monthStats.monthTrend.toFixed(1)}%
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ─────────────────────────────────────────────────────────────────────── */}
          {/* MIDDLE COLUMN - RECENT PAYMENTS & PAYMENT MODES */}
          {/* ─────────────────────────────────────────────────────────────────────── */}
          <div className="space-y-6">
            {/* Recent Payments */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-primary" />
                  Recent Payments
                </CardTitle>
                <CardDescription>Latest fee payments received</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[320px]">
                  <div className="space-y-3">
                    {recentPayments.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No payments today</p>
                    ) : (
                      recentPayments.map((payment, idx) => (
                        <div key={payment.id || idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                              <IndianRupee className="h-4 w-4 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{payment.studentName}</p>
                              <p className="text-xs text-muted-foreground">{payment.studentCode}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-600 dark:text-green-400">{formatCurrency(payment.amount)}</p>
                            <p className="text-xs text-muted-foreground">{payment.mode}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
              <CardFooter className="pt-0">
                <Button variant="ghost" className="w-full" onClick={() => navigateTo('/fees/search-fees-payment')}>
                  View All Payments <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </CardFooter>
            </Card>

            {/* Payment Mode Distribution */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-primary" />
                  Payment Modes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {paymentModes.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">No data available</p>
                  ) : (
                    paymentModes.map((pm, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          {pm.mode === 'Cash' && <Wallet className="h-5 w-5 text-green-600 dark:text-green-400" />}
                          {pm.mode === 'Online' && <CreditCard className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
                          {pm.mode === 'UPI' && <Zap className="h-5 w-5 text-purple-600 dark:text-purple-400" />}
                          {!['Cash', 'Online', 'UPI'].includes(pm.mode) && <Banknote className="h-5 w-5 text-gray-600 dark:text-gray-400" />}
                          <span className="font-medium">{pm.mode}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatCompactCurrency(pm.amount)}</p>
                          <p className="text-xs text-muted-foreground">{pm.count} payments</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ─────────────────────────────────────────────────────────────────────── */}
          {/* RIGHT COLUMN - TOP DEFAULTERS & QUICK ACTIONS */}
          {/* ─────────────────────────────────────────────────────────────────────── */}
          <div className="space-y-6">
            {/* Top Defaulters */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Top Defaulters
                </CardTitle>
                <CardDescription>Students with highest pending dues</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[280px]">
                  <div className="space-y-3">
                    {topDefaulters.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No defaulters found</p>
                    ) : (
                      topDefaulters.map((student, idx) => (
                        <div key={student.id || idx} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-bold text-red-600">{idx + 1}</span>
                            </div>
                            <div>
                              <p className="font-medium text-sm">{student.name}</p>
                              <p className="text-xs text-muted-foreground">{student.code}</p>
                            </div>
                          </div>
                          <p className="font-bold text-red-600">{formatCurrency(student.due)}</p>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
              <CardFooter className="pt-0">
                <Button variant="ghost" className="w-full text-red-600" onClick={() => navigateTo('/fees/search-due-fees')}>
                  View All Defaulters <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </CardFooter>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <QuickActionCard
                  title="Collect Fees"
                  description="Accept student payments"
                  icon={IndianRupee}
                  color="green-600"
                  onClick={() => navigateTo('/fees/collect-fees')}
                />
                <QuickActionCard
                  title="Quick Fees"
                  description="Student search & pay"
                  icon={Zap}
                  color="blue-600"
                  onClick={() => navigateTo('/fees/quick-fees')}
                />
                <QuickActionCard
                  title="Fee Analysis"
                  description="Detailed reports"
                  icon={PieChart}
                  color="purple-600"
                  onClick={() => navigateTo('/fees/analysis')}
                />
                <QuickActionCard
                  title="Send Reminders"
                  description="SMS/Email notifications"
                  icon={Bell}
                  color="amber-600"
                  onClick={() => navigateTo('/fees/reminder')}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default FeeDashboard;
