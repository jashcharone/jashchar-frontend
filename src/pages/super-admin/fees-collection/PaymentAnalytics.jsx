/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PAYMENT ANALYTICS
 * Day 36 Implementation - Fee Collection Phase 4 (Analytics)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Features:
 * - Payment method analytics (Cash, UPI, Card, Online)
 * - Payment patterns and trends
 * - Peak payment hours/days
 * - Transaction success/failure rates
 * - Gateway-wise analytics
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  IndianRupee, 
  Download,
  Printer,
  Loader2,
  FileSpreadsheet,
  Banknote,
  QrCode,
  CreditCard,
  Wallet,
  Smartphone,
  Globe,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Activity
} from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { formatDate, formatDateForInput } from '@/utils/dateUtils';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
  LineChart,
  Line,
  ComposedChart
} from 'recharts';

const COLORS = {
  cash: '#10B981',
  upi: '#7C3AED',
  card: '#3B82F6',
  online: '#F59E0B',
  cheque: '#EF4444',
  neft: '#EC4899'
};

const methodIcons = {
  cash: Banknote,
  upi: QrCode,
  card: CreditCard,
  online: Globe,
  cheque: Wallet,
  neft: Smartphone
};

export default function PaymentAnalytics() {
  const { user, currentSessionId, organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  const branchId = selectedBranch?.id;

  // State
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('month');
  
  // Data
  const [methodData, setMethodData] = useState([]);
  const [hourlyPattern, setHourlyPattern] = useState([]);
  const [weekdayPattern, setWeekdayPattern] = useState([]);
  const [gatewayData, setGatewayData] = useState([]);
  const [transactionStats, setTransactionStats] = useState({
    totalTransactions: 0,
    successCount: 0,
    failedCount: 0,
    pendingCount: 0,
    avgAmount: 0,
    successRate: 0
  });
  const [monthlyTrend, setMonthlyTrend] = useState([]);

  // Summary
  const [summary, setSummary] = useState({
    totalCollection: 0,
    mostUsedMethod: null,
    peakHour: null,
    peakDay: null,
    avgTransactionValue: 0
  });

  // Load data
  useEffect(() => {
    if (branchId && currentSessionId) {
      loadPaymentAnalytics();
    }
  }, [branchId, currentSessionId, dateRange]);

  const getDateFilter = () => {
    const now = new Date();
    switch (dateRange) {
      case 'week':
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return weekAgo.toISOString();
      case 'month':
        const monthAgo = new Date(now);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return monthAgo.toISOString();
      case 'quarter':
        const quarterAgo = new Date(now);
        quarterAgo.setMonth(quarterAgo.getMonth() - 3);
        return quarterAgo.toISOString();
      case 'year':
        const yearAgo = new Date(now);
        yearAgo.setFullYear(yearAgo.getFullYear() - 1);
        return yearAgo.toISOString();
      default:
        return new Date(now.getFullYear(), 0, 1).toISOString(); // Start of year
    }
  };

  const loadPaymentAnalytics = async () => {
    setLoading(true);
    try {
      const dateFilter = getDateFilter();

      // Get all transactions
      const { data: transactions } = await supabase
        .from('fee_transactions')
        .select('*')
        .eq('branch_id', branchId)
        .eq('session_id', currentSessionId)
        .gte('created_at', dateFilter);

      if (!transactions || transactions.length === 0) {
        setMethodData([]);
        setHourlyPattern([]);
        setWeekdayPattern([]);
        setSummary({
          totalCollection: 0,
          mostUsedMethod: null,
          peakHour: null,
          peakDay: null,
          avgTransactionValue: 0
        });
        setLoading(false);
        return;
      }

      // Filter successful transactions
      const successTransactions = transactions.filter(t => t.status === 'success');
      const failedTransactions = transactions.filter(t => t.status === 'failed');
      const pendingTransactions = transactions.filter(t => t.status === 'pending');

      // Transaction stats
      const totalCollection = successTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
      const avgAmount = successTransactions.length > 0 
        ? Math.round(totalCollection / successTransactions.length) 
        : 0;

      setTransactionStats({
        totalTransactions: transactions.length,
        successCount: successTransactions.length,
        failedCount: failedTransactions.length,
        pendingCount: pendingTransactions.length,
        avgAmount,
        successRate: transactions.length > 0 
          ? Math.round((successTransactions.length / transactions.length) * 100)
          : 0
      });

      // Payment Method Analysis
      const methodMap = {};
      successTransactions.forEach(txn => {
        const method = txn.payment_method || 'other';
        if (!methodMap[method]) {
          methodMap[method] = { count: 0, amount: 0, name: method };
        }
        methodMap[method].count += 1;
        methodMap[method].amount += txn.amount || 0;
      });

      const methodArray = Object.values(methodMap)
        .map(m => ({
          ...m,
          percentage: Math.round((m.amount / totalCollection) * 100)
        }))
        .sort((a, b) => b.amount - a.amount);

      setMethodData(methodArray);

      // Find most used method
      const mostUsed = methodArray.length > 0 ? methodArray[0] : null;

      // Hourly Pattern
      const hourMap = {};
      for (let i = 0; i < 24; i++) {
        hourMap[i] = { hour: `${i}:00`, count: 0, amount: 0 };
      }
      successTransactions.forEach(txn => {
        const hour = new Date(txn.created_at).getHours();
        hourMap[hour].count += 1;
        hourMap[hour].amount += txn.amount || 0;
      });
      const hourArray = Object.values(hourMap).filter(h => h.hour >= '08:00' && h.hour <= '18:00');
      setHourlyPattern(hourArray);

      // Find peak hour
      const peakHour = hourArray.reduce((max, h) => h.amount > max.amount ? h : max, hourArray[0]);

      // Weekday Pattern
      const dayMap = {};
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      dayNames.forEach(day => {
        dayMap[day] = { day, count: 0, amount: 0 };
      });
      successTransactions.forEach(txn => {
        const day = dayNames[new Date(txn.created_at).getDay()];
        dayMap[day].count += 1;
        dayMap[day].amount += txn.amount || 0;
      });
      const dayArray = Object.values(dayMap);
      setWeekdayPattern(dayArray);

      // Find peak day
      const peakDay = dayArray.reduce((max, d) => d.amount > max.amount ? d : max, dayArray[0]);

      // Gateway data (if available)
      const gatewayMap = {};
      successTransactions.forEach(txn => {
        const gateway = txn.payment_gateway || 'direct';
        if (!gatewayMap[gateway]) {
          gatewayMap[gateway] = { gateway, count: 0, amount: 0 };
        }
        gatewayMap[gateway].count += 1;
        gatewayMap[gateway].amount += txn.amount || 0;
      });
      setGatewayData(Object.values(gatewayMap));

      // Monthly trend
      const monthMap = {};
      successTransactions.forEach(txn => {
        const month = new Date(txn.created_at).toLocaleString('en-IN', { month: 'short', year: '2-digit' });
        if (!monthMap[month]) {
          monthMap[month] = { month, cash: 0, upi: 0, card: 0, online: 0, total: 0 };
        }
        monthMap[month].total += txn.amount || 0;
        const method = txn.payment_method || 'other';
        if (monthMap[month][method] !== undefined) {
          monthMap[month][method] += txn.amount || 0;
        }
      });
      setMonthlyTrend(Object.values(monthMap));

      // Set summary
      setSummary({
        totalCollection,
        mostUsedMethod: mostUsed,
        peakHour,
        peakDay,
        avgTransactionValue: avgAmount
      });

    } catch (error) {
      console.error('Analytics load error:', error);
      toast.error('Failed to load payment analytics');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const getMethodIcon = (method) => {
    const Icon = methodIcons[method?.toLowerCase()] || Wallet;
    return <Icon className="h-4 w-4" />;
  };

  const getMethodColor = (method) => {
    return COLORS[method?.toLowerCase()] || '#6B7280';
  };

  // Export to Excel
  const exportToExcel = () => {
    let csv = 'Payment Analytics Report\n';
    csv += `Period: ${dateRange} | Generated: ${formatDate(new Date())}\n\n`;
    
    csv += 'Payment Method Analysis\n';
    csv += 'Method,Transactions,Amount,Percentage\n';
    methodData.forEach(m => {
      csv += `${m.name},${m.count},${m.amount},${m.percentage}%\n`;
    });

    csv += '\nHourly Pattern\n';
    csv += 'Hour,Transactions,Amount\n';
    hourlyPattern.forEach(h => {
      csv += `${h.hour},${h.count},${h.amount}\n`;
    });

    csv += '\nWeekday Pattern\n';
    csv += 'Day,Transactions,Amount\n';
    weekdayPattern.forEach(d => {
      csv += `${d.day},${d.count},${d.amount}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payment_analytics_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Report exported successfully');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const pieChartData = methodData.map((m, idx) => ({
    name: m.name.charAt(0).toUpperCase() + m.name.slice(1),
    value: m.amount,
    color: getMethodColor(m.name)
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Payment Analytics</h1>
          <p className="text-muted-foreground">
            {selectedBranch?.name} • Payment patterns and insights
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Last 7 Days</SelectItem>
              <SelectItem value="month">Last 30 Days</SelectItem>
              <SelectItem value="quarter">Last 3 Months</SelectItem>
              <SelectItem value="year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportToExcel} className="gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <IndianRupee className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Collection</p>
                <p className="text-lg font-bold text-green-600">
                  {formatCurrency(summary.totalCollection)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Activity className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Transactions</p>
                <p className="text-lg font-bold text-blue-600">
                  {transactionStats.totalTransactions}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Success Rate</p>
                <p className="text-lg font-bold text-purple-600">
                  {transactionStats.successRate}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Avg Transaction</p>
                <p className="text-lg font-bold text-orange-600">
                  ₹{transactionStats.avgAmount.toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction Status */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500" />
                <span className="text-sm">Success: {transactionStats.successCount}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500" />
                <span className="text-sm">Failed: {transactionStats.failedCount}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-yellow-500" />
                <span className="text-sm">Pending: {transactionStats.pendingCount}</span>
              </div>
            </div>
            <Progress 
              value={transactionStats.successRate} 
              className="w-40 h-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Method Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payment Method Distribution</CardTitle>
            <CardDescription>Collection share by payment type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {pieChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={100}
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => `₹${v.toLocaleString('en-IN')}`} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Hourly Pattern */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Hourly Collection Pattern</CardTitle>
            <CardDescription>Payment activity by hour of day</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hourlyPattern}>
                  <defs>
                    <linearGradient id="colorHourly" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#7C3AED" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" fontSize={11} />
                  <YAxis tickFormatter={(v) => `₹${v/1000}K`} fontSize={11} />
                  <Tooltip formatter={(v) => `₹${v.toLocaleString('en-IN')}`} />
                  <Area 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#7C3AED" 
                    fillOpacity={1}
                    fill="url(#colorHourly)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Weekday Pattern */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Weekday Collection Pattern</CardTitle>
            <CardDescription>Payment activity by day of week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weekdayPattern}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" fontSize={11} tickFormatter={(v) => v.slice(0, 3)} />
                  <YAxis tickFormatter={(v) => `₹${v/1000}K`} fontSize={11} />
                  <Tooltip formatter={(v) => `₹${v.toLocaleString('en-IN')}`} />
                  <Bar dataKey="amount" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Trend by Payment Method */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Monthly Trend by Method</CardTitle>
            <CardDescription>Payment method usage over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" fontSize={11} />
                  <YAxis tickFormatter={(v) => `₹${v/1000}K`} fontSize={11} />
                  <Tooltip formatter={(v) => `₹${v.toLocaleString('en-IN')}`} />
                  <Legend />
                  <Bar dataKey="cash" fill={COLORS.cash} name="Cash" stackId="a" />
                  <Bar dataKey="upi" fill={COLORS.upi} name="UPI" stackId="a" />
                  <Bar dataKey="card" fill={COLORS.card} name="Card" stackId="a" />
                  <Bar dataKey="online" fill={COLORS.online} name="Online" stackId="a" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Method Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {methodData.map((method) => {
          const color = getMethodColor(method.name);
          return (
            <Card 
              key={method.name} 
              className="hover:shadow-md transition-shadow"
              style={{ borderLeftColor: color, borderLeftWidth: '4px' }}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div 
                      className="h-10 w-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${color}20` }}
                    >
                      <span style={{ color }}>{getMethodIcon(method.name)}</span>
                    </div>
                    <div>
                      <p className="font-medium capitalize">{method.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {method.count} transactions
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">{method.percentage}%</Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-semibold" style={{ color }}>
                      {formatCurrency(method.amount)}
                    </span>
                  </div>
                  <Progress 
                    value={method.percentage} 
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Insights Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                {summary.mostUsedMethod && (
                  <span style={{ color: getMethodColor(summary.mostUsedMethod.name) }}>
                    {getMethodIcon(summary.mostUsedMethod.name)}
                  </span>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Most Used Method</p>
                <p className="font-bold text-lg capitalize">
                  {summary.mostUsedMethod?.name || '-'}
                </p>
                <p className="text-xs text-green-600">
                  {summary.mostUsedMethod?.percentage || 0}% of total
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Peak Hour</p>
                <p className="font-bold text-lg">
                  {summary.peakHour?.hour || '-'}
                </p>
                <p className="text-xs text-blue-600">
                  {summary.peakHour ? formatCurrency(summary.peakHour.amount) : '-'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Peak Day</p>
                <p className="font-bold text-lg">
                  {summary.peakDay?.day || '-'}
                </p>
                <p className="text-xs text-purple-600">
                  {summary.peakDay ? formatCurrency(summary.peakDay.amount) : '-'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                <IndianRupee className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Transaction</p>
                <p className="font-bold text-lg">
                  ₹{summary.avgTransactionValue.toLocaleString('en-IN')}
                </p>
                <p className="text-xs text-orange-600">
                  per payment
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payment Method Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payment Method</TableHead>
                  <TableHead className="text-center">Transactions</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-center">Share</TableHead>
                  <TableHead className="w-[200px]">Distribution</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {methodData.map((method) => {
                  const color = getMethodColor(method.name);
                  return (
                    <TableRow key={method.name}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div 
                            className="h-8 w-8 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: `${color}20` }}
                          >
                            <span style={{ color }}>{getMethodIcon(method.name)}</span>
                          </div>
                          <span className="font-medium capitalize">{method.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{method.count}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold" style={{ color }}>
                        {formatCurrency(method.amount)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{method.percentage}%</Badge>
                      </TableCell>
                      <TableCell>
                        <Progress value={method.percentage} className="h-2" />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
