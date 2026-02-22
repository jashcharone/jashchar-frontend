/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * CASHIER DASHBOARD
 * Fee collection and receipt management
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
    IndianRupee, Receipt, CreditCard, Banknote, 
    Users, Clock, CheckCircle2, Calculator,
    FileText, Printer, ChevronRight, Activity,
    TrendingUp, Wallet, ArrowUpRight
} from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useNavigate } from 'react-router-dom';
import { format, startOfDay, endOfDay } from 'date-fns';
import WelcomeMessage from '@/components/WelcomeMessage';
import StatCard from '@/components/StatCard';

const CashierDashboard = () => {
    const { user, school, currentSessionId } = useAuth();
    const { selectedBranch } = useBranch();
    const navigate = useNavigate();
    const currencySymbol = school?.currency_symbol || '₹';
    
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        todayCollection: 0,
        todayReceipts: 0,
        pendingQueue: 0,
        cashInHand: 0
    });
    const [recentPayments, setRecentPayments] = useState([]);

    const branchId = selectedBranch?.id;

    useEffect(() => {
        if (branchId) {
            fetchDashboardData();
        }
    }, [branchId, currentSessionId]);

    const fetchDashboardData = async () => {
        setLoading(true);
        const today = new Date();
        const todayStart = startOfDay(today);
        const todayEnd = endOfDay(today);

        try {
            // Today's collection
            const { data: todayFees } = await supabase
                .from('fee_payments')
                .select('id, amount, payment_mode, created_at, students(first_name, last_name)')
                .eq('branch_id', branchId)
                .gte('payment_date', todayStart.toISOString())
                .lte('payment_date', todayEnd.toISOString())
                .order('created_at', { ascending: false })
                .limit(10);

            const todayTotal = (todayFees || []).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
            
            // Cash collection
            const cashTotal = (todayFees || [])
                .filter(p => p.payment_mode === 'cash')
                .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

            setStats({
                todayCollection: todayTotal,
                todayReceipts: todayFees?.length || 0,
                pendingQueue: 5,
                cashInHand: cashTotal
            });

            setRecentPayments(todayFees || []);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount).replace('₹', currencySymbol);
    };

    const quickActions = [
        { label: 'Collect Fees', icon: IndianRupee, path: '/super-admin/fees-collection/collect-fees', color: 'bg-green-500' },
        { label: 'Print Receipt', icon: Printer, path: '/super-admin/fees-collection/search-fee-payment', color: 'bg-blue-500' },
        { label: 'Due List', icon: FileText, path: '/super-admin/fees-collection/search-fees-due', color: 'bg-orange-500' },
        { label: 'Fee Reports', icon: Calculator, path: '/super-admin/reports/fees-collection-report', color: 'bg-purple-500' },
    ];

    const paymentMethods = [
        { method: 'Cash', icon: Banknote, amount: stats.cashInHand, color: 'text-green-600' },
        { method: 'Card', icon: CreditCard, amount: stats.todayCollection - stats.cashInHand, color: 'text-blue-600' },
    ];

    const statCards = [
        { title: "Today's Collection", value: formatCurrency(stats.todayCollection), icon: IndianRupee, color: 'text-green-600' },
        { title: 'Receipts Issued', value: stats.todayReceipts, icon: Receipt, color: 'text-blue-600' },
        { title: 'Pending Queue', value: stats.pendingQueue, icon: Users, color: 'text-orange-600' },
        { title: 'Cash in Hand', value: formatCurrency(stats.cashInHand), icon: Wallet, color: 'text-emerald-600' },
    ];

    return (
        <DashboardLayout>
            <WelcomeMessage
                user={user?.profile?.full_name || 'Cashier'}
                message="Fee collection and receipt management"
            />

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {loading ? (
                    [...Array(4)].map((_, i) => (
                        <Card key={i}>
                            <CardContent className="p-6">
                                <Skeleton className="h-4 w-24 mb-2" />
                                <Skeleton className="h-8 w-20" />
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    statCards.map((stat, index) => (
                        <StatCard key={index} {...stat} index={index} />
                    ))
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Quick Actions */}
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="w-5 h-5 text-primary" />
                            Quick Actions
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {quickActions.map((action, index) => (
                            <Button
                                key={index}
                                variant="outline"
                                className="w-full justify-start gap-3"
                                onClick={() => navigate(action.path)}
                            >
                                <div className={`p-2 rounded-lg ${action.color}`}>
                                    <action.icon className="w-4 h-4 text-white" />
                                </div>
                                {action.label}
                                <ChevronRight className="w-4 h-4 ml-auto" />
                            </Button>
                        ))}
                    </CardContent>
                </Card>

                {/* Recent Payments */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Receipt className="w-5 h-5 text-primary" />
                            Recent Payments
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="space-y-3">
                                {[...Array(5)].map((_, i) => (
                                    <Skeleton key={i} className="h-12 w-full" />
                                ))}
                            </div>
                        ) : recentPayments.length > 0 ? (
                            <div className="space-y-3">
                                {recentPayments.slice(0, 6).map((payment, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                                            </div>
                                            <div>
                                                <p className="font-medium">
                                                    {payment.students?.first_name} {payment.students?.last_name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {format(new Date(payment.created_at), 'hh:mm a')} • {payment.payment_mode}
                                                </p>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="text-green-600 border-green-600">
                                            {formatCurrency(payment.amount)}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <Receipt className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p>No payments received today</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Collection by Payment Method */}
            <Card className="mt-6">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Wallet className="w-5 h-5 text-primary" />
                        Collection by Payment Method
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {paymentMethods.map((pm, index) => (
                            <div key={index} className="p-4 rounded-lg border bg-muted/30 flex items-center gap-4">
                                <div className={`p-3 rounded-full bg-muted`}>
                                    <pm.icon className={`w-6 h-6 ${pm.color}`} />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">{pm.method}</p>
                                    <p className={`text-xl font-bold ${pm.color}`}>{formatCurrency(pm.amount)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </DashboardLayout>
    );
};

export default CashierDashboard;
