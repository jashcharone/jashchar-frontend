/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * TREND ANALYSIS
 * Day 38 Implementation - Fee Collection Phase 4 (Analytics)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Features:
 * - Historical collection trends
 * - Year-over-year comparison
 * - Month-wise analysis
 * - Growth rate calculation
 * - Forecasting
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
  Download,
  Printer,
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  BarChart3,
  LineChartIcon,
  PieChartIcon,
  AreaChartIcon,
  Sparkles
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { formatDate } from '@/utils/dateUtils';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

const MONTHS = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
const FULL_MONTHS = ['April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March'];

export default function TrendAnalysis() {
  const { user, currentSessionId, organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  const branchId = selectedBranch?.id;

  // State
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('monthly');
  
  // Data
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [weeklyTrend, setWeeklyTrend] = useState([]);
  const [quarterlyTrend, setQuarterlyTrend] = useState([]);
  const [yearComparison, setYearComparison] = useState([]);
  const [growthMetrics, setGrowthMetrics] = useState({
    currentMonth: 0,
    previousMonth: 0,
    monthGrowth: 0,
    currentQuarter: 0,
    previousQuarter: 0,
    quarterGrowth: 0,
    avgMonthly: 0,
    forecast: 0
  });

  // Sessions for comparison
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState('current');

  // Load data
  useEffect(() => {
    if (branchId && currentSessionId) {
      loadSessions();
      loadTrendData();
    }
  }, [branchId, currentSessionId]);

  const loadSessions = async () => {
    const { data } = await supabase
      .from('sessions')
      .select('id, name, start_date, end_date')
      .eq('branch_id', branchId)
      .order('start_date', { ascending: false })
      .limit(5);
    setSessions(data || []);
  };

  const loadTrendData = async () => {
    setLoading(true);
    try {
      // Load all transactions for current session
      const { data: transactions } = await supabase
        .from('fee_transactions')
        .select('id, amount, payment_date, payment_mode')
        .eq('branch_id', branchId)
        .eq('session_id', currentSessionId)
        .order('payment_date');

      if (transactions && transactions.length > 0) {
        // Process monthly trend
        const monthlyMap = {};
        MONTHS.forEach((month, idx) => {
          monthlyMap[month] = { month, collected: 0, transactions: 0 };
        });

        transactions.forEach(t => {
          const date = new Date(t.payment_date);
          const monthIdx = (date.getMonth() + 9) % 12; // Adjust for Apr start
          const monthKey = MONTHS[monthIdx];
          if (monthlyMap[monthKey]) {
            monthlyMap[monthKey].collected += t.amount || 0;
            monthlyMap[monthKey].transactions += 1;
          }
        });

        const monthlyData = MONTHS.map(month => ({
          ...monthlyMap[month],
          avgTransaction: monthlyMap[month].transactions > 0 
            ? Math.round(monthlyMap[month].collected / monthlyMap[month].transactions)
            : 0
        }));
        setMonthlyTrend(monthlyData);

        // Process weekly trend (last 12 weeks)
        const weeklyMap = {};
        const today = new Date();
        for (let i = 11; i >= 0; i--) {
          const weekStart = new Date(today);
          weekStart.setDate(weekStart.getDate() - (i * 7 + weekStart.getDay()));
          const weekKey = `W${12 - i}`;
          weeklyMap[weekKey] = { 
            week: weekKey, 
            collected: 0, 
            startDate: weekStart.toISOString().split('T')[0]
          };
        }

        transactions.forEach(t => {
          const txDate = new Date(t.payment_date);
          const weeksAgo = Math.floor((today - txDate) / (7 * 24 * 60 * 60 * 1000));
          if (weeksAgo >= 0 && weeksAgo < 12) {
            const weekKey = `W${12 - weeksAgo}`;
            if (weeklyMap[weekKey]) {
              weeklyMap[weekKey].collected += t.amount || 0;
            }
          }
        });

        setWeeklyTrend(Object.values(weeklyMap));

        // Process quarterly trend
        const q1 = monthlyData.slice(0, 3).reduce((sum, m) => sum + m.collected, 0);
        const q2 = monthlyData.slice(3, 6).reduce((sum, m) => sum + m.collected, 0);
        const q3 = monthlyData.slice(6, 9).reduce((sum, m) => sum + m.collected, 0);
        const q4 = monthlyData.slice(9, 12).reduce((sum, m) => sum + m.collected, 0);

        setQuarterlyTrend([
          { quarter: 'Q1', months: 'Apr-Jun', collected: q1, target: q1 * 1.1 },
          { quarter: 'Q2', months: 'Jul-Sep', collected: q2, target: q2 * 1.1 },
          { quarter: 'Q3', months: 'Oct-Dec', collected: q3, target: q3 * 1.1 },
          { quarter: 'Q4', months: 'Jan-Mar', collected: q4, target: q4 * 1.1 }
        ]);

        // Calculate growth metrics
        const totalCollected = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
        const monthsWithData = monthlyData.filter(m => m.collected > 0).length;
        const avgMonthly = monthsWithData > 0 ? totalCollected / monthsWithData : 0;

        // Get current month
        const currentMonthIdx = (new Date().getMonth() + 9) % 12;
        const currentMonthCollection = monthlyData[currentMonthIdx]?.collected || 0;
        const prevMonthCollection = monthlyData[currentMonthIdx > 0 ? currentMonthIdx - 1 : 11]?.collected || 0;
        const monthGrowth = prevMonthCollection > 0 
          ? ((currentMonthCollection - prevMonthCollection) / prevMonthCollection * 100)
          : 0;

        // Get current quarter
        const currentQtr = Math.floor(currentMonthIdx / 3);
        const qtrData = [q1, q2, q3, q4];
        const currentQtrCollection = qtrData[currentQtr];
        const prevQtrCollection = currentQtr > 0 ? qtrData[currentQtr - 1] : 0;
        const quarterGrowth = prevQtrCollection > 0 
          ? ((currentQtrCollection - prevQtrCollection) / prevQtrCollection * 100)
          : 0;

        // Forecast: average * remaining months
        const remainingMonths = 12 - monthsWithData;
        const forecast = totalCollected + (avgMonthly * remainingMonths);

        setGrowthMetrics({
          currentMonth: currentMonthCollection,
          previousMonth: prevMonthCollection,
          monthGrowth: Math.round(monthGrowth * 10) / 10,
          currentQuarter: currentQtrCollection,
          previousQuarter: prevQtrCollection,
          quarterGrowth: Math.round(quarterGrowth * 10) / 10,
          avgMonthly: Math.round(avgMonthly),
          forecast: Math.round(forecast)
        });
      }

      // Load previous session data for comparison
      await loadYearComparison();

    } catch (error) {
      console.error('Load error:', error);
      toast.error('Failed to load trend data');
    } finally {
      setLoading(false);
    }
  };

  const loadYearComparison = async () => {
    try {
      // Get last 3 sessions
      const { data: recentSessions } = await supabase
        .from('sessions')
        .select('id, name, start_date')
        .eq('branch_id', branchId)
        .order('start_date', { ascending: false })
        .limit(3);

      if (recentSessions && recentSessions.length > 0) {
        const comparisonData = [];
        
        for (const session of recentSessions) {
          const { data: transactions } = await supabase
            .from('fee_transactions')
            .select('amount, payment_date')
            .eq('branch_id', branchId)
            .eq('session_id', session.id);

          const sessionMonthly = {};
          MONTHS.forEach(m => { sessionMonthly[m] = 0; });

          (transactions || []).forEach(t => {
            const date = new Date(t.payment_date);
            const monthIdx = (date.getMonth() + 9) % 12;
            sessionMonthly[MONTHS[monthIdx]] += t.amount || 0;
          });

          comparisonData.push({
            sessionId: session.id,
            sessionName: session.name,
            data: sessionMonthly
          });
        }

        // Transform for chart
        const chartData = MONTHS.map(month => {
          const point = { month };
          comparisonData.forEach((session, idx) => {
            point[`year${idx + 1}`] = session.data[month] || 0;
            point[`year${idx + 1}Name`] = session.sessionName;
          });
          return point;
        });

        setYearComparison(chartData);
      }
    } catch (error) {
      console.error('Year comparison error:', error);
    }
  };

  const formatCurrency = (amount) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const getGrowthIndicator = (growth) => {
    if (growth > 0) {
      return (
        <div className="flex items-center text-green-600">
          <TrendingUp className="h-4 w-4 mr-1" />
          <span>+{growth}%</span>
        </div>
      );
    } else if (growth < 0) {
      return (
        <div className="flex items-center text-red-600">
          <TrendingDown className="h-4 w-4 mr-1" />
          <span>{growth}%</span>
        </div>
      );
    }
    return (
      <div className="flex items-center text-gray-500">
        <Minus className="h-4 w-4 mr-1" />
        <span>0%</span>
      </div>
    );
  };

  // Export
  const exportToExcel = () => {
    let csv = 'Trend Analysis Report\n';
    csv += `Generated: ${formatDate(new Date())}\n\n`;
    csv += 'Monthly Trend\n';
    csv += 'Month,Collection,Transactions,Avg Transaction\n';
    
    monthlyTrend.forEach(item => {
      csv += `${item.month},${item.collected},${item.transactions},${item.avgTransaction}\n`;
    });

    csv += '\nQuarterly Summary\n';
    csv += 'Quarter,Months,Collection\n';
    quarterlyTrend.forEach(item => {
      csv += `${item.quarter},${item.months},${item.collected}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trend_analysis_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Report exported successfully');
  };

  // Print
  const printReport = () => {
    window.print();
    toast.success('Print dialog opened');
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-semibold mb-2">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
              <span>{entry.name}: {formatCurrency(entry.value)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
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
          <h1 className="text-2xl font-bold">Trend Analysis</h1>
          <p className="text-muted-foreground">
            Historical collection trends and forecasting
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToExcel} className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" onClick={printReport} className="gap-2">
            <Printer className="h-4 w-4" />
            Print
          </Button>
        </div>
      </div>

      {/* Growth Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-muted-foreground">This Month</p>
                <p className="text-lg font-bold">{formatCurrency(growthMetrics.currentMonth)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  vs {formatCurrency(growthMetrics.previousMonth)} last month
                </p>
              </div>
              {getGrowthIndicator(growthMetrics.monthGrowth)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-muted-foreground">This Quarter</p>
                <p className="text-lg font-bold">{formatCurrency(growthMetrics.currentQuarter)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  vs {formatCurrency(growthMetrics.previousQuarter)} last qtr
                </p>
              </div>
              {getGrowthIndicator(growthMetrics.quarterGrowth)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Avg Monthly</p>
                <p className="text-lg font-bold">{formatCurrency(growthMetrics.avgMonthly)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Year Forecast</p>
                <p className="text-lg font-bold">{formatCurrency(growthMetrics.forecast)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="monthly" className="gap-2">
            <LineChartIcon className="h-4 w-4" />
            Monthly
          </TabsTrigger>
          <TabsTrigger value="weekly" className="gap-2">
            <AreaChartIcon className="h-4 w-4" />
            Weekly
          </TabsTrigger>
          <TabsTrigger value="quarterly" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Quarterly
          </TabsTrigger>
          <TabsTrigger value="comparison" className="gap-2">
            <PieChartIcon className="h-4 w-4" />
            YoY Comparison
          </TabsTrigger>
        </TabsList>

        {/* Monthly Trend */}
        <TabsContent value="monthly">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Monthly Collection Trend</CardTitle>
                <CardDescription>Month-wise fee collection throughout academic year</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={monthlyTrend}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.5} />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis 
                        tickFormatter={(value) => formatCurrency(value)}
                        tick={{ fontSize: 11 }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar 
                        dataKey="collected" 
                        name="Collected" 
                        fill="#3B82F6" 
                        radius={[4, 4, 0, 0]}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="avgTransaction" 
                        name="Avg Transaction" 
                        stroke="#8B5CF6" 
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Monthly Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {monthlyTrend.map(item => (
                  <div key={item.month} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{item.month}</span>
                    <div className="text-right">
                      <p className="text-sm font-bold">{formatCurrency(item.collected)}</p>
                      <p className="text-xs text-muted-foreground">{item.transactions} txns</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Weekly Trend */}
        <TabsContent value="weekly">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Weekly Collection Trend</CardTitle>
              <CardDescription>Last 12 weeks collection pattern</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyTrend}>
                    <defs>
                      <linearGradient id="colorWeekly" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.5} />
                    <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                    <YAxis 
                      tickFormatter={(value) => formatCurrency(value)}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey="collected" 
                      name="Collection"
                      stroke="#10B981" 
                      fillOpacity={1}
                      fill="url(#colorWeekly)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quarterly Trend */}
        <TabsContent value="quarterly">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Quarterly Performance</CardTitle>
                <CardDescription>Quarter-wise collection vs target</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={quarterlyTrend} barGap={8}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.5} />
                      <XAxis dataKey="quarter" tick={{ fontSize: 12 }} />
                      <YAxis 
                        tickFormatter={(value) => formatCurrency(value)}
                        tick={{ fontSize: 11 }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar 
                        dataKey="collected" 
                        name="Collected" 
                        fill="#3B82F6" 
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar 
                        dataKey="target" 
                        name="Target" 
                        fill="#CBD5E1" 
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quarter Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {quarterlyTrend.map(item => {
                  const achievement = item.target > 0 
                    ? Math.round((item.collected / item.target) * 100) 
                    : 0;
                  return (
                    <div key={item.quarter} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-bold">{item.quarter}</span>
                          <span className="text-xs text-muted-foreground ml-2">({item.months})</span>
                        </div>
                        <Badge variant={achievement >= 100 ? "default" : "outline"}>
                          {achievement}%
                        </Badge>
                      </div>
                      <Progress value={Math.min(achievement, 100)} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Collected: {formatCurrency(item.collected)}</span>
                        <span>Target: {formatCurrency(item.target)}</span>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Year Comparison */}
        <TabsContent value="comparison">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Year-over-Year Comparison</CardTitle>
              <CardDescription>Compare collection across academic sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                {yearComparison.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={yearComparison}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.5} />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis 
                        tickFormatter={(value) => formatCurrency(value)}
                        tick={{ fontSize: 11 }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="year1" 
                        name={yearComparison[0]?.year1Name || 'Current Year'}
                        stroke="#3B82F6" 
                        strokeWidth={3}
                        dot={{ r: 5 }}
                        activeDot={{ r: 7 }}
                      />
                      {yearComparison[0]?.year2 !== undefined && (
                        <Line 
                          type="monotone" 
                          dataKey="year2" 
                          name={yearComparison[0]?.year2Name || 'Previous Year'}
                          stroke="#10B981" 
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          strokeDasharray="5 5"
                        />
                      )}
                      {yearComparison[0]?.year3 !== undefined && (
                        <Line 
                          type="monotone" 
                          dataKey="year3" 
                          name={yearComparison[0]?.year3Name || '2 Years Ago'}
                          stroke="#F59E0B" 
                          strokeWidth={2}
                          dot={{ r: 3 }}
                          strokeDasharray="3 3"
                        />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    Not enough historical data for comparison
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Insights Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-500" />
            AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <h4 className="font-semibold text-blue-900">Best Month</h4>
              </div>
              <p className="text-sm text-blue-800">
                {monthlyTrend.reduce((max, m) => m.collected > max.collected ? m : max, monthlyTrend[0] || {})?.month || 'N/A'} 
                {' '}had highest collection of{' '}
                {formatCurrency(Math.max(...monthlyTrend.map(m => m.collected), 0))}
              </p>
            </div>

            <div className="p-4 rounded-lg bg-orange-50 border border-orange-200">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-orange-600" />
                <h4 className="font-semibold text-orange-900">Collection Pattern</h4>
              </div>
              <p className="text-sm text-orange-800">
                {growthMetrics.monthGrowth >= 0 
                  ? 'Collections are on positive trajectory this month'
                  : 'Collections show decline compared to last month'
                }
              </p>
            </div>

            <div className="p-4 rounded-lg bg-green-50 border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-green-600" />
                <h4 className="font-semibold text-green-900">Forecast</h4>
              </div>
              <p className="text-sm text-green-800">
                Based on current trends, projected annual collection is{' '}
                {formatCurrency(growthMetrics.forecast)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
