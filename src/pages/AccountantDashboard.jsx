import React, { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
    IndianRupee, TrendingUp, TrendingDown, Receipt, Wallet, 
    CreditCard, Banknote, PiggyBank, ArrowUpRight, ArrowDownRight,
    Calendar, Clock, AlertTriangle, CheckCircle2, XCircle,
    Users, GraduationCap, FileText, Download, RefreshCw,
    ChevronRight, BarChart3, PieChart, Activity
} from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { supabase } from '@/lib/customSupabaseClient';
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay, subDays } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, PieChart as RechartPieChart, Pie, Cell, Legend
} from 'recharts';

const AccountantDashboard = () => {
    const { user, school, currentSessionId } = useAuth();
    const { selectedBranch } = useBranch();
    const navigate = useNavigate();
    const currencySymbol = school?.currency_symbol || '₹';
    
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    
    // Financial Data States
    const [todayCollection, setTodayCollection] = useState(0);
    const [monthCollection, setMonthCollection] = useState(0);
    const [totalPending, setTotalPending] = useState(0);
    const [monthIncome, setMonthIncome] = useState(0);
    const [monthExpense, setMonthExpense] = useState(0);
    const [recentPayments, setRecentPayments] = useState([]);
    const [recentExpenses, setRecentExpenses] = useState([]);
    const [overdueStudents, setOverdueStudents] = useState([]);
    const [collectionByClass, setCollectionByClass] = useState([]);
    const [dailyTrend, setDailyTrend] = useState([]);
    const [paymentModes, setPaymentModes] = useState([]);

    const branchId = selectedBranch?.id;

    // Fetch all dashboard data
    const fetchDashboardData = async () => {
        if (!branchId) return;
        
        setRefreshing(true);
        const today = new Date();
        const monthStart = startOfMonth(today);
        const monthEnd = endOfMonth(today);
        const todayStart = startOfDay(today);
        const todayEnd = endOfDay(today);

        try {
            // 1. Today's Collection
            const { data: todayFees } = await supabase
                .from('fee_payments')
                .select('amount')
                .eq('branch_id', branchId)
                .gte('payment_date', todayStart.toISOString())
                .lte('payment_date', todayEnd.toISOString());
            
            const todayTotal = (todayFees || []).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
            setTodayCollection(todayTotal);

            // 2. Monthly Collection
            const { data: monthFees } = await supabase
                .from('fee_payments')
                .select('amount')
                .eq('branch_id', branchId)
                .gte('payment_date', monthStart.toISOString())
                .lte('payment_date', monthEnd.toISOString());
            
            const monthTotal = (monthFees || []).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
            setMonthCollection(monthTotal);

            // 3. Total Pending Fees (from student_fees where status != 'paid')
            const { data: pendingFees } = await supabase
                .from('student_fees')
                .select('balance')
                .eq('branch_id', branchId)
                .gt('balance', 0);
            
            const pendingTotal = (pendingFees || []).reduce((sum, f) => sum + (parseFloat(f.balance) || 0), 0);
            setTotalPending(pendingTotal);

            // 4. Monthly Income (other income)
            const { data: incomeData } = await supabase
                .from('income')
                .select('amount')
                .eq('branch_id', branchId)
                .gte('date', monthStart.toISOString().split('T')[0])
                .lte('date', monthEnd.toISOString().split('T')[0]);
            
            const incomeTotal = (incomeData || []).reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0);
            setMonthIncome(incomeTotal + monthTotal); // Fees + Other Income

            // 5. Monthly Expenses
            const { data: expenseData } = await supabase
                .from('expenses')
                .select('amount')
                .eq('branch_id', branchId)
                .gte('date', monthStart.toISOString().split('T')[0])
                .lte('date', monthEnd.toISOString().split('T')[0]);
            
            const expenseTotal = (expenseData || []).reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
            setMonthExpense(expenseTotal);

            // 6. Recent Fee Payments (last 10)
            const { data: payments } = await supabase
                .from('fee_payments')
                .select(`
                    id, amount, payment_date, payment_mode, receipt_no,
                    student:student_id(full_name, school_code)
                `)
                .eq('branch_id', branchId)
                .order('payment_date', { ascending: false })
                .limit(8);
            
            setRecentPayments(payments || []);

            // 7. Recent Expenses (last 5)
            const { data: expenses } = await supabase
                .from('expenses')
                .select('id, name, amount, date, expense_head:expense_head_id(name)')
                .eq('branch_id', branchId)
                .order('date', { ascending: false })
                .limit(5);
            
            setRecentExpenses(expenses || []);

            // 8. Overdue Students (top 10 with highest pending)
            const { data: overdueData } = await supabase
                .from('student_fees')
                .select(`
                    id, balance, due_date,
                    student:student_id(full_name, school_code, class:class_id(name))
                `)
                .eq('branch_id', branchId)
                .gt('balance', 0)
                .lt('due_date', today.toISOString().split('T')[0])
                .order('balance', { ascending: false })
                .limit(8);
            
            setOverdueStudents(overdueData || []);

            // 9. Collection by Class
            const { data: classFees } = await supabase
                .from('fee_payments')
                .select(`
                    amount,
                    student:student_id(class:class_id(name))
                `)
                .eq('branch_id', branchId)
                .gte('payment_date', monthStart.toISOString())
                .lte('payment_date', monthEnd.toISOString());

            const classMap = {};
            (classFees || []).forEach(p => {
                const className = p.student?.class?.name || 'Unknown';
                classMap[className] = (classMap[className] || 0) + (parseFloat(p.amount) || 0);
            });
            const classData = Object.entries(classMap).map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value).slice(0, 6);
            setCollectionByClass(classData);

            // 10. Daily Trend (last 7 days)
            const last7Days = [];
            for (let i = 6; i >= 0; i--) {
                const date = subDays(today, i);
                last7Days.push({
                    date: format(date, 'dd MMM'),
                    fullDate: format(date, 'yyyy-MM-dd')
                });
            }

            const { data: trendData } = await supabase
                .from('fee_payments')
                .select('amount, payment_date')
                .eq('branch_id', branchId)
                .gte('payment_date', subDays(today, 6).toISOString())
                .lte('payment_date', todayEnd.toISOString());

            const trendMap = {};
            last7Days.forEach(d => { trendMap[d.fullDate] = 0; });
            (trendData || []).forEach(p => {
                const dateKey = format(new Date(p.payment_date), 'yyyy-MM-dd');
                if (trendMap[dateKey] !== undefined) {
                    trendMap[dateKey] += parseFloat(p.amount) || 0;
                }
            });
            const dailyData = last7Days.map(d => ({
                name: d.date,
                collection: trendMap[d.fullDate] || 0
            }));
            setDailyTrend(dailyData);

            // 11. Payment Modes Distribution
            const modeMap = {};
            (monthFees || []).forEach(p => {
                // We need payment_mode from fee_payments
            });
            
            const { data: modeData } = await supabase
                .from('fee_payments')
                .select('amount, payment_mode')
                .eq('branch_id', branchId)
                .gte('payment_date', monthStart.toISOString())
                .lte('payment_date', monthEnd.toISOString());

            const modes = {};
            (modeData || []).forEach(p => {
                const mode = p.payment_mode || 'Cash';
                modes[mode] = (modes[mode] || 0) + (parseFloat(p.amount) || 0);
            });
            const modeChartData = Object.entries(modes).map(([name, value]) => ({ name, value }));
            setPaymentModes(modeChartData);

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, [branchId]);

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount).replace('₹', currencySymbol);
    };

    // Net Balance
    const netBalance = monthIncome - monthExpense;

    // Chart Colors
    const CHART_COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];
    const PIE_COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

    // Quick Actions
    const quickActions = [
        { label: 'Collect Fees', icon: IndianRupee, path: '/Accountant/fees-collection/collect-fees', color: 'bg-green-500' },
        { label: 'Add Expense', icon: TrendingDown, path: '/Accountant/expenses/add-expense', color: 'bg-red-500' },
        { label: 'Add Income', icon: TrendingUp, path: '/Accountant/income/add-income', color: 'bg-blue-500' },
        { label: 'Search Due Fees', icon: FileText, path: '/Accountant/fees-collection/search-due-fees', color: 'bg-orange-500' },
    ];

    if (loading) {
        return (
            <DashboardLayout>
                <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                    <Skeleton className="h-24 w-full" />
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {[1,2,3,4].map(i => <Skeleton key={i} className="h-32" />)}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Skeleton className="h-80" />
                        <Skeleton className="h-80" />
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div>
                        <h1 className="text-lg sm:text-2xl font-bold text-gray-900">
                            Welcome, {user?.profile?.full_name || 'Accountant'}! 👋
                        </h1>
                        <p className="text-gray-500">
                            {format(new Date(), 'EEEE, dd MMMM yyyy')} • Financial Overview
                        </p>
                    </div>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={fetchDashboardData}
                        disabled={refreshing}
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>

                {/* Main Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {/* Today's Collection */}
                    <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0">
                        <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-green-100 text-sm">Today's Collection</p>
                                    <p className="text-2xl font-bold mt-1">{formatCurrency(todayCollection)}</p>
                                </div>
                                <div className="p-2 bg-white/20 rounded-lg">
                                    <IndianRupee className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="flex items-center mt-2 text-green-100 text-xs">
                                <Calendar className="w-3 h-3 mr-1" />
                                {format(new Date(), 'dd MMM yyyy')}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Monthly Collection */}
                    <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0">
                        <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-blue-100 text-sm">Monthly Collection</p>
                                    <p className="text-2xl font-bold mt-1">{formatCurrency(monthCollection)}</p>
                                </div>
                                <div className="p-2 bg-white/20 rounded-lg">
                                    <Wallet className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="flex items-center mt-2 text-blue-100 text-xs">
                                <Calendar className="w-3 h-3 mr-1" />
                                {format(new Date(), 'MMMM yyyy')}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Pending Fees */}
                    <Card className="bg-gradient-to-br from-orange-500 to-red-500 text-white border-0">
                        <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-orange-100 text-sm">Pending Fees</p>
                                    <p className="text-2xl font-bold mt-1">{formatCurrency(totalPending)}</p>
                                </div>
                                <div className="p-2 bg-white/20 rounded-lg">
                                    <AlertTriangle className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="flex items-center mt-2 text-orange-100 text-xs">
                                <Users className="w-3 h-3 mr-1" />
                                {overdueStudents.length} students overdue
                            </div>
                        </CardContent>
                    </Card>

                    {/* Total Income */}
                    <Card className="bg-gradient-to-br from-purple-500 to-violet-600 text-white border-0">
                        <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-purple-100 text-sm">Total Income</p>
                                    <p className="text-2xl font-bold mt-1">{formatCurrency(monthIncome)}</p>
                                </div>
                                <div className="p-2 bg-white/20 rounded-lg">
                                    <TrendingUp className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="flex items-center mt-2 text-purple-100 text-xs">
                                <ArrowUpRight className="w-3 h-3 mr-1" />
                                Fees + Other Income
                            </div>
                        </CardContent>
                    </Card>

                    {/* Net Balance */}
                    <Card className={`bg-gradient-to-br ${netBalance >= 0 ? 'from-teal-500 to-cyan-600' : 'from-red-500 to-rose-600'} text-white border-0`}>
                        <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-white/80 text-sm">Net Balance</p>
                                    <p className="text-2xl font-bold mt-1">{formatCurrency(netBalance)}</p>
                                </div>
                                <div className="p-2 bg-white/20 rounded-lg">
                                    <PiggyBank className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="flex items-center mt-2 text-white/80 text-xs">
                                <TrendingDown className="w-3 h-3 mr-1" />
                                Expenses: {formatCurrency(monthExpense)}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Actions */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Activity className="w-5 h-5 text-purple-500" />
                            Quick Actions
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {quickActions.map((action, idx) => (
                                <Button
                                    key={idx}
                                    variant="outline"
                                    className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-gray-50"
                                    onClick={() => navigate(action.path)}
                                >
                                    <div className={`p-2 rounded-lg ${action.color}`}>
                                        <action.icon className="w-5 h-5 text-white" />
                                    </div>
                                    <span className="text-sm font-medium">{action.label}</span>
                                </Button>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Daily Collection Trend */}
                    <Card className="lg:col-span-2">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-blue-500" />
                                Collection Trend (Last 7 Days)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={dailyTrend}>
                                        <defs>
                                            <linearGradient id="colorCollection" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                        <YAxis 
                                            tickFormatter={(value) => `${currencySymbol}${(value/1000).toFixed(0)}K`}
                                            tick={{ fontSize: 12 }}
                                        />
                                        <Tooltip 
                                            formatter={(value) => [formatCurrency(value), 'Collection']}
                                            contentStyle={{ borderRadius: '8px' }}
                                        />
                                        <Area 
                                            type="monotone" 
                                            dataKey="collection" 
                                            stroke="#8b5cf6" 
                                            strokeWidth={2}
                                            fill="url(#colorCollection)" 
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Payment Modes Pie Chart */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <PieChart className="w-5 h-5 text-green-500" />
                                Payment Modes
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-64">
                                {paymentModes.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RechartPieChart>
                                            <Pie
                                                data={paymentModes}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={50}
                                                outerRadius={80}
                                                paddingAngle={2}
                                                dataKey="value"
                                            >
                                                {paymentModes.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value) => formatCurrency(value)} />
                                            <Legend />
                                        </RechartPieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-gray-400">
                                        No payment data
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Collection by Class + Recent Payments */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Collection by Class */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <GraduationCap className="w-5 h-5 text-indigo-500" />
                                Collection by Class (This Month)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-64">
                                {collectionByClass.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={collectionByClass} layout="vertical">
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                            <XAxis 
                                                type="number" 
                                                tickFormatter={(value) => `${currencySymbol}${(value/1000).toFixed(0)}K`}
                                                tick={{ fontSize: 11 }}
                                            />
                                            <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
                                            <Tooltip formatter={(value) => formatCurrency(value)} />
                                            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                                {collectionByClass.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-gray-400">
                                        No collection data
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recent Fee Payments */}
                    <Card>
                        <CardHeader className="pb-2 flex flex-row items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                                Recent Fee Payments
                            </CardTitle>
                            <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => navigate('/Accountant/fees-collection/search-fees-payment')}
                            >
                                View All <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3 max-h-64 overflow-y-auto">
                                {recentPayments.length > 0 ? recentPayments.map((payment) => (
                                    <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-green-100 rounded-full">
                                                <IndianRupee className="w-4 h-4 text-green-600" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">{payment.student?.full_name || 'Unknown'}</p>
                                                <p className="text-xs text-gray-500">
                                                    {payment.student?.school_code} • {payment.receipt_no}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-green-600">{formatCurrency(payment.amount)}</p>
                                            <Badge variant="outline" className="text-xs">{payment.payment_mode || 'Cash'}</Badge>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-center py-8 text-gray-400">
                                        No recent payments
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Overdue Students + Recent Expenses */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Overdue Students */}
                    <Card className="border-red-200">
                        <CardHeader className="pb-2 flex flex-row items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2 text-red-600">
                                <AlertTriangle className="w-5 h-5" />
                                Overdue Fee Students
                            </CardTitle>
                            <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => navigate('/Accountant/fees-collection/search-due-fees')}
                            >
                                View All <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3 max-h-64 overflow-y-auto">
                                {overdueStudents.length > 0 ? overdueStudents.map((item) => (
                                    <div key={item.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-red-100 rounded-full">
                                                <XCircle className="w-4 h-4 text-red-600" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">{item.student?.full_name || 'Unknown'}</p>
                                                <p className="text-xs text-gray-500">
                                                    {item.student?.school_code} • {item.student?.class?.name || 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-red-600">{formatCurrency(item.balance)}</p>
                                            <p className="text-xs text-gray-500">Due: {item.due_date}</p>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-center py-8 text-green-500">
                                        <CheckCircle2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                        No overdue students! 🎉
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recent Expenses */}
                    <Card>
                        <CardHeader className="pb-2 flex flex-row items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <TrendingDown className="w-5 h-5 text-red-500" />
                                Recent Expenses
                            </CardTitle>
                            <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => navigate('/Accountant/expenses/expense')}
                            >
                                View All <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3 max-h-64 overflow-y-auto">
                                {recentExpenses.length > 0 ? recentExpenses.map((expense) => (
                                    <div key={expense.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-red-100 rounded-full">
                                                <Receipt className="w-4 h-4 text-red-600" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">{expense.name}</p>
                                                <p className="text-xs text-gray-500">
                                                    {expense.expense_head?.name || 'General'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-red-600">-{formatCurrency(expense.amount)}</p>
                                            <p className="text-xs text-gray-500">{expense.date}</p>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-center py-8 text-gray-400">
                                        No recent expenses
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default AccountantDashboard;
