import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Users, ArrowRight, TrendingUp, TrendingDown, UserPlus, Wallet, Receipt, Contact, CalendarCheck, Clipboard, IndianRupee, Coins as HandCoins, AlertTriangle, Layout, Save, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import WelcomeMessage from '@/components/WelcomeMessage';
import { Button } from '@/components/ui/button';
import DraggableStatsGrid from '@/components/dashboard/DraggableStatsGrid';
import DraggableWidgetGrid from '@/components/dashboard/DraggableWidgetGrid';
import SubscriptionExpiryWidget from '@/components/subscription/SubscriptionExpiryWidget';
import WhatsAppUsageWidget from '@/components/dashboard/WhatsAppUsageWidget';
import { calculateBillingStatus } from '@/utils/billingStatus';

// --- Widget Components ---

const FeesChartWidget = ({ data }) => (
  <div className="h-full w-full bg-card/80 backdrop-blur-sm p-6 rounded-[32px] shadow-lg border">
    <h2 className="text-xl font-bold text-foreground mb-4">Monthly Fee Collection</h2>
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
        <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={(val) => `₹${val/1000}k`}/>
        <Tooltip 
          contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '16px' }}
          formatter={(value) => `₹${value.toLocaleString()}`}
          labelStyle={{ color: 'hsl(var(--foreground))' }}
        />
        <Bar dataKey="collected" fill="hsl(var(--primary))" name="Fees Collected" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

const QuickActionsWidget = ({ actions, navigate }) => (
  <div className="h-full w-full bg-card/80 backdrop-blur-sm p-6 rounded-[32px] shadow-lg border">
    <h2 className="text-xl font-bold text-foreground mb-4">Quick Actions</h2>
    <div className="space-y-3">
      {actions.map((action, idx) => (
        <button key={`${action.name}-${idx}`} onClick={() => navigate(action.path)} className="w-full flex items-center justify-between p-4 rounded-2xl bg-background hover:bg-muted transition-colors border border-border/50 group">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <action.icon className="h-5 w-5 text-primary" />
            </div>
            <span className="font-medium text-foreground">{action.name}</span>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
        </button>
      ))}
    </div>
  </div>
);

const SchoolOwnerDashboard = () => {
  const { user, currentSessionId, school } = useAuth();
  const { selectedBranch } = useBranch();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);

  const [statsData, setStatsData] = useState({
    total_students: 0,
    total_staff: 0,
    today_present: 0,
    today_absent: 0,
    monthly_income: 0,
    monthly_expense: 0
  });
  const [loading, setLoading] = useState(true);
  const [feesChartData, setFeesChartData] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [subscriptionPlan, setSubscriptionPlan] = useState(null);
  
  const hasPermission = (perm) => true; // Mock permission check

  const allQuickActions = [
    { name: 'Student Details', path: '/school-owner/student-information/details', icon: Users, perm: 'student_information.details' },
    { name: 'Student Admission', path: '/school-owner/student-information/admission', icon: UserPlus, perm: 'student_information.admission' },
    { name: 'Collect Fees', path: '/school-owner/fees-collection/collect-fees', icon: Wallet, perm: 'fees_collection.collect_fees' },
    { name: 'Add Income', path: '/school-owner/finance/add-income', icon: HandCoins, perm: 'finance.add_income' },
    { name: 'Add Expense', path: '/school-owner/finance/add-expense', icon: Receipt, perm: 'finance.add_expense' },
    { name: 'Staff Directory', path: '/school-owner/human-resource/employees', icon: Contact, perm: 'human_resource.employees' },
    { name: 'Student Attendance', path: '/school-owner/attendance/student-attendance', icon: CalendarCheck, perm: 'attendance.student_attendance' },
    { name: 'Notice Board', path: '/school-owner/communicate/notice-board', icon: Clipboard, perm: 'communicate.notice_board' },
  ];
  const quickActions = allQuickActions.filter(action => hasPermission(action.perm));

  // --- Stats Configuration ---
  const initialStatsConfig = [
    { id: 'students', title: 'Total Students', icon: Users, key: 'total_students', changeKey: 'today_present', changeLabel: 'present today' },
    { id: 'staff', title: 'Total Staff', icon: Contact, key: 'total_staff' },
    { id: 'income', title: 'This Month Income', icon: TrendingUp, key: 'monthly_income', prefix: '₹' },
    { id: 'expense', title: 'This Month Expense', icon: TrendingDown, key: 'monthly_expense', prefix: '₹' },
  ];

  const [statsOrder, setStatsOrder] = useState(initialStatsConfig.map(s => s.id));
  const [widgetsOrder, setWidgetsOrder] = useState(['feesChart', 'quickActions', 'whatsappUsage']);

  // Load Layout
  useEffect(() => {
    const savedStats = JSON.parse(localStorage.getItem('school-dashboard-stats-order'));
    const savedWidgets = JSON.parse(localStorage.getItem('school-dashboard-widgets-order'));
    if (savedStats) setStatsOrder(savedStats);
    if (savedWidgets) setWidgetsOrder(savedWidgets);
  }, []);

  const saveLayout = () => {
    localStorage.setItem('school-dashboard-stats-order', JSON.stringify(statsOrder));
    localStorage.setItem('school-dashboard-widgets-order', JSON.stringify(widgetsOrder));
    setIsEditing(false);
    toast({ title: "Layout Saved", description: "Your dashboard preference has been saved." });
  };

  // Fetch Data
  useEffect(() => {
    const fetchStats = async () => {
      if (statsData.total_students === 0) setLoading(true);
      if (!user?.profile?.branch_id) return;
      
      try {
        // Direct query replacement for broken RPC
        const branchId = selectedBranch?.id || user.profile.branch_id;

        // 1. Students
        let studentQuery = supabase
          .from('student_profiles')
          .select('*', { count: 'exact', head: true })
          .eq('branch_id', branchId)
          .or('is_disabled.is.null,is_disabled.eq.false');
        
        if (branchId) studentQuery = studentQuery.eq('branch_id', branchId);
        
        // 2. Staff
        let staffQuery = supabase
          .from('employee_profiles')
          .select('*', { count: 'exact', head: true })
          .eq('branch_id', branchId)
          .or('is_disabled.is.null,is_disabled.eq.false');

        if (branchId) staffQuery = staffQuery.eq('branch_id', branchId);

        // 3. Income (Month)
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
        let incomeQuery = supabase
          .from('fees_collection')
          .select('amount_paid')
          .eq('branch_id', branchId)
          .gte('payment_date', startOfMonth);

        if (branchId) incomeQuery = incomeQuery.eq('branch_id', branchId);

        // Execute in parallel
        const [studentsRes, staffRes, incomeRes] = await Promise.all([
            studentQuery,
            staffQuery,
            incomeQuery
        ]);

        const totalStudents = studentsRes.count || 0;
        const totalStaff = staffRes.count || 0;
        const monthlyIncome = incomeRes.data?.reduce((sum, item) => sum + (item.amount_paid || 0), 0) || 0;

        setStatsData({
            total_students: totalStudents,
            total_staff: totalStaff,
            today_present: 0,
            today_absent: 0,
            monthly_income: monthlyIncome,
            monthly_expense: 0
        });
        
        let feesQuery = supabase
          .from('fee_payments')
          .select('payment_date, amount')
          .eq('branch_id', user.profile.branch_id)
          .gte('payment_date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
          .is('reverted_at', null);
        
        if (currentSessionId) feesQuery = feesQuery.eq('session_id', currentSessionId);
        if (selectedBranch?.id) feesQuery = feesQuery.eq('branch_id', selectedBranch.id);
        
        const { data: feesData, error: feesError } = await feesQuery;

        if (!feesError && feesData) {
          const dailyCollection = feesData.reduce((acc, item) => {
              const day = new Date(item.payment_date).getDate();
              if(!acc[day]) acc[day] = { name: `Day ${day}`, collected: 0 };
              acc[day].collected += item.amount;
              return acc;
          }, {});
          setFeesChartData(Object.values(dailyCollection).sort((a,b) => a.name.split(' ')[1] - b.name.split(' ')[1]));
        }
      } catch (err) {
        console.error("Unexpected error fetching dashboard stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [user, currentSessionId, selectedBranch]);

  // Prepare Data for Grids
  const orderedStats = statsOrder.map(id => {
    const config = initialStatsConfig.find(s => s.id === id);
    if (!config) return null;
    const val = statsData[config.key];
    return {
      ...config,
      value: config.prefix ? `${config.prefix}${val?.toLocaleString()}` : val?.toLocaleString(),
      change: config.changeKey ? `${statsData[config.changeKey]} ${config.changeLabel}` : null
    };
  }).filter(Boolean);

  // Fetch subscription data
  useEffect(() => {
    const fetchSubscription = async () => {
      if (!school?.id) return;

      try {
        const { data: subData, error: subError } = await supabase
          .from('school_subscriptions')
          .select(`
            *,
            plan:subscription_plans(*)
          `)
          .eq('branch_id', school.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!subError && subData) {
          setSubscription(subData);
          setSubscriptionPlan(subData.plan);
        } else {
          // Try to get expired subscription with grace period
          const { data: expiredSub, error: expiredError } = await supabase
            .from('school_subscriptions')
            .select(`
              *,
              plan:subscription_plans(*)
            `)
            .eq('branch_id', school.id)
            .in('status', ['expired', 'suspended'])
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (!expiredError && expiredSub) {
            const statusObj = calculateBillingStatus(expiredSub);
            if (statusObj.isInGracePeriod || statusObj.effectiveStatus === 'active') {
              setSubscription(expiredSub);
              setSubscriptionPlan(expiredSub.plan);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching subscription:', error);
      }
    };

    if (school?.id) {
      fetchSubscription();
    }
  }, [school?.id]);

  const widgetComponents = {
    feesChart: <FeesChartWidget data={feesChartData} />,
    quickActions: <QuickActionsWidget actions={quickActions} navigate={navigate} />,
    whatsappUsage: <WhatsAppUsageWidget />,
    subscription: subscription ? (
      <SubscriptionExpiryWidget 
        subscription={subscription} 
        plan={subscriptionPlan}
      />
    ) : null
  };

  const orderedWidgets = widgetsOrder.map(id => ({
    id,
    component: widgetComponents[id]
  })).filter(w => w.component);

  // --- Render ---

  // Check for expiry blocking
  const isExpired = useMemo(() => {
    if (!subscription) return false;
    const statusObj = calculateBillingStatus(subscription);
    return statusObj.effectiveStatus === 'expired' || statusObj.effectiveStatus === 'suspended';
  }, [subscription]);

  // 7-Day Expiry Notification
  useEffect(() => {
    if (subscription) {
      const statusObj = calculateBillingStatus(subscription);
      if (statusObj.daysRemaining <= 7 && statusObj.daysRemaining > 0) {
        toast({
          variant: "destructive",
          title: "Subscription Expiring Soon",
          description: `Your subscription will expire in ${statusObj.daysRemaining} days. Please renew to avoid interruption.`,
          action: <Button variant="outline" size="sm" onClick={() => navigate('/school-owner/subscription')}>Renew</Button>,
          duration: 10000,
        });
      }
    }
  }, [subscription, toast, navigate]);

  if (isExpired) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[80vh] space-y-6 text-center p-6">
          <div className="bg-red-100 p-6 rounded-full animate-pulse">
            <AlertTriangle className="h-16 w-16 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-red-700">Subscription Expired</h1>
          <p className="text-xl text-muted-foreground max-w-md">
            Your school's subscription has expired. Access to the dashboard is restricted until the subscription is renewed.
          </p>
          <div className="bg-card p-8 rounded-xl shadow-2xl border-2 border-red-100 max-w-md w-full">
            <h3 className="font-semibold mb-2 text-lg">Action Required</h3>
            <p className="mb-6 text-muted-foreground">Please renew your subscription immediately to restore full access to your school data and operations.</p>
            <Button 
              size="lg" 
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-6 text-lg shadow-lg hover:shadow-xl transition-all"
              onClick={() => navigate('/school-owner/subscription')}
            >
              Renew Subscription Now
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!user?.profile?.branch_id) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-md shadow-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <Clipboard className="h-5 w-5 text-yellow-600" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Account Not Approved</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    Your account is not approved yet. Please wait for the administrator to approve your school registration.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Check subscription status with grace period
  const subscriptionStatus = subscription ? calculateBillingStatus(subscription) : null;
  const isSubscriptionActive = subscriptionStatus?.effectiveStatus === 'active' || 
                                subscriptionStatus?.isInGracePeriod;

  if (school && !isSubscriptionActive && subscriptionStatus?.status === 'expired') {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-md shadow-sm dark:bg-red-900/20 dark:border-red-600">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-300">Subscription Expired</h3>
                <div className="mt-2 text-sm text-red-700 dark:text-red-400">
                  <p>
                    {subscriptionStatus?.message || 'Your subscription has expired. Please contact the administrator to renew your plan.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex-1">
          <WelcomeMessage 
            user={user?.profile?.full_name || 'School Owner'}
            message="Here's an overview of your school's performance."
          />
        </div>
        <div className="flex gap-2 shrink-0">
            {isEditing ? (
                <>
                    <Button variant="outline" onClick={() => setIsEditing(false)} className="gap-2">
                        <X className="h-4 w-4" /> Cancel
                    </Button>
                    <Button onClick={saveLayout} className="gap-2">
                        <Save className="h-4 w-4" /> Save Layout
                    </Button>
                </>
            ) : (
                <Button variant="outline" onClick={() => setIsEditing(true)} className="gap-2">
                    <Layout className="h-4 w-4" /> Customize Dashboard
                </Button>
            )}
        </div>
      </div>

      <DraggableStatsGrid 
        items={orderedStats} 
        onReorder={(newItems) => setStatsOrder(newItems.map(i => i.id))} 
        isEditing={isEditing} 
      />
      
      <DraggableWidgetGrid 
        items={orderedWidgets} 
        onReorder={(newItems) => setWidgetsOrder(newItems.map(i => i.id))} 
        isEditing={isEditing} 
        columns={3} // Use 3 columns for better layout
      />
    </DashboardLayout>
  );
};

export default SchoolOwnerDashboard;
