/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * FEE COLLECTION DASHBOARD
 * Day 31 Implementation - Fee Collection Phase 4 (Analytics)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Features:
 * - Real-time collection metrics
 * - Visual charts & graphs
 * - Today's collection summary
 * - Pending fees overview
 * - Quick action shortcuts
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  IndianRupee, 
  TrendingUp, 
  TrendingDown,
  Users,
  Receipt,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  ArrowRight,
  Loader2,
  BarChart3,
  PieChart,
  Wallet,
  CreditCard,
  QrCode,
  Banknote,
  Target,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from 'sonner';
import { formatDate } from '@/utils/dateUtils';
import { Link } from 'react-router-dom';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';

// Chart colors
const COLORS = ['#7C3AED', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#EC4899'];

export default function FeeCollectionDashboard() {
  const { user, currentSessionId, organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  const branchId = selectedBranch?.id;

  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState('today');
  
  // Metrics
  const [metrics, setMetrics] = useState({
    todayCollection: 0,
    monthCollection: 0,
    yearCollection: 0,
    totalPending: 0,
    overdueAmount: 0,
    transactionCount: 0,
    studentsPaid: 0,
    studentsWithDue: 0,
    collectionRate: 0
  });

  // Chart data
  const [dailyTrend, setDailyTrend] = useState([]);
  const [paymentMethodBreakdown, setPaymentMethodBreakdown] = useState([]);
  const [feeTypeBreakdown, setFeeTypeBreakdown] = useState([]);
  const [classWiseCollection, setClassWiseCollection] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);

  // Load dashboard data
  useEffect(() => {
    if (branchId && currentSessionId) {
      loadDashboardData();
    }
  }, [branchId, currentSessionId, dateRange]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadMetrics(),
        loadDailyTrend(),
        loadPaymentMethodBreakdown(),
        loadFeeTypeBreakdown(),
        loadClassWiseCollection(),
        loadRecentTransactions()
      ]);
    } catch (error) {
      console.error('Dashboard load error:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
    toast.success('Dashboard refreshed');
  };

  const loadMetrics = async () => {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
    const startOfYear = new Date(today.getFullYear(), 0, 1).toISOString();

    // Today's collection
    const { data: todayData } = await supabase
      .from('fee_transactions')
      .select('amount')
      .eq('branch_id', branchId)
      .eq('session_id', currentSessionId)
      .eq('status', 'success')
      .gte('created_at', startOfDay);

    const todayCollection = (todayData || []).reduce((sum, t) => sum + (t.amount || 0), 0);

    // Month's collection
    const { data: monthData } = await supabase
      .from('fee_transactions')
      .select('amount')
      .eq('branch_id', branchId)
      .eq('session_id', currentSessionId)
      .eq('status', 'success')
      .gte('created_at', startOfMonth);

    const monthCollection = (monthData || []).reduce((sum, t) => sum + (t.amount || 0), 0);

    // Year's collection
    const { data: yearData } = await supabase
      .from('fee_transactions')
      .select('amount')
      .eq('branch_id', branchId)
      .eq('session_id', currentSessionId)
      .eq('status', 'success')
      .gte('created_at', startOfYear);

    const yearCollection = (yearData || []).reduce((sum, t) => sum + (t.amount || 0), 0);

    // Pending & Overdue
    const { data: pendingData } = await supabase
      .from('fee_details')
      .select('balance, due_date')
      .eq('branch_id', branchId)
      .eq('session_id', currentSessionId)
      .in('status', ['pending', 'partial']);

    const totalPending = (pendingData || []).reduce((sum, f) => sum + (f.balance || 0), 0);
    const overdueAmount = (pendingData || [])
      .filter(f => new Date(f.due_date) < new Date())
      .reduce((sum, f) => sum + (f.balance || 0), 0);

    // Transaction count today
    const transactionCount = (todayData || []).length;

    // Students with payments
    const { count: studentsPaid } = await supabase
      .from('fee_transactions')
      .select('student_id', { count: 'exact', head: true })
      .eq('branch_id', branchId)
      .eq('session_id', currentSessionId)
      .eq('status', 'success');

    // Students with dues
    const { count: studentsWithDue } = await supabase
      .from('fee_details')
      .select('student_id', { count: 'exact', head: true })
      .eq('branch_id', branchId)
      .eq('session_id', currentSessionId)
      .in('status', ['pending', 'partial']);

    // Calculate collection rate
    const totalExpected = yearCollection + totalPending;
    const collectionRate = totalExpected > 0 ? (yearCollection / totalExpected) * 100 : 0;

    setMetrics({
      todayCollection,
      monthCollection,
      yearCollection,
      totalPending,
      overdueAmount,
      transactionCount,
      studentsPaid: studentsPaid || 0,
      studentsWithDue: studentsWithDue || 0,
      collectionRate: Math.round(collectionRate)
    });
  };

  const loadDailyTrend = async () => {
    // Get last 30 days collection
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data } = await supabase
      .from('fee_transactions')
      .select('amount, created_at')
      .eq('branch_id', branchId)
      .eq('session_id', currentSessionId)
      .eq('status', 'success')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true });

    // Group by date
    const grouped = {};
    (data || []).forEach(txn => {
      const date = new Date(txn.created_at).toLocaleDateString('en-IN', { 
        day: '2-digit', 
        month: 'short' 
      });
      grouped[date] = (grouped[date] || 0) + txn.amount;
    });

    const trendData = Object.entries(grouped).map(([date, amount]) => ({
      date,
      amount: Math.round(amount)
    }));

    setDailyTrend(trendData);
  };

  const loadPaymentMethodBreakdown = async () => {
    const { data } = await supabase
      .from('fee_transactions')
      .select('payment_method, amount')
      .eq('branch_id', branchId)
      .eq('session_id', currentSessionId)
      .eq('status', 'success');

    const grouped = {};
    (data || []).forEach(txn => {
      const method = txn.payment_method || 'other';
      grouped[method] = (grouped[method] || 0) + txn.amount;
    });

    const pieData = Object.entries(grouped).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value: Math.round(value)
    }));

    setPaymentMethodBreakdown(pieData);
  };

  const loadFeeTypeBreakdown = async () => {
    const { data } = await supabase
      .from('fee_details')
      .select(`
        balance,
        paid_amount,
        fee_structure:fee_structure_id(
          fee_type:fee_type_id(name)
        )
      `)
      .eq('branch_id', branchId)
      .eq('session_id', currentSessionId);

    const grouped = {};
    (data || []).forEach(fee => {
      const typeName = fee.fee_structure?.fee_type?.name || 'Other';
      if (!grouped[typeName]) {
        grouped[typeName] = { collected: 0, pending: 0 };
      }
      grouped[typeName].collected += fee.paid_amount || 0;
      grouped[typeName].pending += fee.balance || 0;
    });

    const barData = Object.entries(grouped).map(([name, values]) => ({
      name: name.length > 15 ? name.slice(0, 15) + '...' : name,
      collected: Math.round(values.collected),
      pending: Math.round(values.pending)
    }));

    setFeeTypeBreakdown(barData);
  };

  const loadClassWiseCollection = async () => {
    const { data } = await supabase
      .from('fee_details')
      .select(`
        balance,
        paid_amount,
        student:student_id(
          classes(name)
        )
      `)
      .eq('branch_id', branchId)
      .eq('session_id', currentSessionId);

    const grouped = {};
    (data || []).forEach(fee => {
      const className = fee.student?.classes?.name || 'Unknown';
      if (!grouped[className]) {
        grouped[className] = { collected: 0, pending: 0 };
      }
      grouped[className].collected += fee.paid_amount || 0;
      grouped[className].pending += fee.balance || 0;
    });

    const barData = Object.entries(grouped)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([name, values]) => ({
        name,
        collected: Math.round(values.collected),
        pending: Math.round(values.pending)
      }));

    setClassWiseCollection(barData);
  };

  const loadRecentTransactions = async () => {
    const { data } = await supabase
      .from('fee_transactions')
      .select(`
        id,
        transaction_id,
        amount,
        payment_method,
        created_at,
        student:student_id(full_name, school_code)
      `)
      .eq('branch_id', branchId)
      .eq('session_id', currentSessionId)
      .eq('status', 'success')
      .order('created_at', { ascending: false })
      .limit(10);

    setRecentTransactions(data || []);
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  // Get payment method icon
  const getPaymentIcon = (method) => {
    switch (method?.toLowerCase()) {
      case 'cash': return <Banknote className="h-4 w-4 text-green-600" />;
      case 'upi': return <QrCode className="h-4 w-4 text-purple-600" />;
      case 'card': return <CreditCard className="h-4 w-4 text-blue-600" />;
      default: return <Wallet className="h-4 w-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Fee Collection Dashboard</h1>
          <p className="text-muted-foreground">
            {selectedBranch?.name} • Academic Year 2025-26
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={refreshData} 
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Link to="/fees/collect">
            <Button className="gap-2">
              <Receipt className="h-4 w-4" />
              Collect Fee
            </Button>
          </Link>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today's Collection</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(metrics.todayCollection)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {metrics.transactionCount} transactions
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <IndianRupee className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(metrics.monthCollection)}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  vs last month
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Pending</p>
                <p className="text-2xl font-bold text-orange-600">
                  {formatCurrency(metrics.totalPending)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {metrics.studentsWithDue} students
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overdue Amount</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(metrics.overdueAmount)}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 text-red-500" />
                  Needs attention
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Collection Progress */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Collection Progress</h3>
              <p className="text-sm text-muted-foreground">
                {formatCurrency(metrics.yearCollection)} collected of {formatCurrency(metrics.yearCollection + metrics.totalPending)} expected
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold text-primary">
                {metrics.collectionRate}%
              </span>
            </div>
          </div>
          <Progress value={metrics.collectionRate} className="h-3" />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>Collected: {formatCurrency(metrics.yearCollection)}</span>
            <span>Pending: {formatCurrency(metrics.totalPending)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Daily Collection Trend
            </CardTitle>
            <CardDescription>Last 30 days collection</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyTrend}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#7C3AED" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis 
                    tickFormatter={(value) => `₹${value/1000}K`}
                    className="text-xs"
                  />
                  <Tooltip 
                    formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Collection']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#7C3AED" 
                    fillOpacity={1}
                    fill="url(#colorAmount)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Payment Method Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              Payment Methods
            </CardTitle>
            <CardDescription>Collection by payment type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPie>
                  <Pie
                    data={paymentMethodBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {paymentMethodBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => `₹${value.toLocaleString('en-IN')}`}
                  />
                </RechartsPie>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Fee Type Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Fee Type Analysis</CardTitle>
            <CardDescription>Collected vs Pending by fee type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={feeTypeBreakdown} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tickFormatter={(v) => `₹${v/1000}K`} />
                  <YAxis dataKey="name" type="category" width={100} className="text-xs" />
                  <Tooltip formatter={(value) => `₹${value.toLocaleString('en-IN')}`} />
                  <Legend />
                  <Bar dataKey="collected" fill="#10B981" name="Collected" />
                  <Bar dataKey="pending" fill="#F59E0B" name="Pending" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Class-wise Collection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Class-wise Collection</CardTitle>
            <CardDescription>Collection status by class</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={classWiseCollection}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis tickFormatter={(v) => `₹${v/1000}K`} className="text-xs" />
                  <Tooltip formatter={(value) => `₹${value.toLocaleString('en-IN')}`} />
                  <Legend />
                  <Bar dataKey="collected" fill="#7C3AED" name="Collected" />
                  <Bar dataKey="pending" fill="#EF4444" name="Pending" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Recent Transactions</CardTitle>
              <Link to="/fees/transactions">
                <Button variant="ghost" size="sm" className="gap-1">
                  View All <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTransactions.map((txn) => (
                <div 
                  key={txn.id}
                  className="flex items-center justify-between p-3 bg-accent rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getPaymentIcon(txn.payment_method)}
                    <div>
                      <p className="font-medium text-sm">{txn.student?.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {txn.student?.school_code}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">
                      +₹{txn.amount?.toLocaleString('en-IN')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(txn.created_at).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              ))}
              
              {recentTransactions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No transactions today
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link to="/fees/collect" className="block">
              <Button variant="outline" className="w-full justify-start gap-3">
                <Receipt className="h-4 w-4" />
                Collect Fee
              </Button>
            </Link>
            <Link to="/fees/bulk-collect" className="block">
              <Button variant="outline" className="w-full justify-start gap-3">
                <Users className="h-4 w-4" />
                Bulk Collection
              </Button>
            </Link>
            <Link to="/fees/upi" className="block">
              <Button variant="outline" className="w-full justify-start gap-3">
                <QrCode className="h-4 w-4" />
                UPI QR Collection
              </Button>
            </Link>
            <Link to="/fees/outstanding" className="block">
              <Button variant="outline" className="w-full justify-start gap-3">
                <AlertTriangle className="h-4 w-4" />
                Outstanding Report
              </Button>
            </Link>
            <Link to="/fees/defaulters" className="block">
              <Button variant="outline" className="w-full justify-start gap-3">
                <Clock className="h-4 w-4" />
                Defaulter List
              </Button>
            </Link>
            <Link to="/fees/daily-report" className="block">
              <Button variant="outline" className="w-full justify-start gap-3">
                <BarChart3 className="h-4 w-4" />
                Daily Report
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
