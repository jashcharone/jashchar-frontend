import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import StatCard from '@/components/StatCard';
import { supabase } from '@/lib/customSupabaseClient';
import { School, Activity, Users, UserCheck, IndianRupee } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import WelcomeMessage from '@/components/WelcomeMessage';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { getMonthShortName } from '@/utils/dateUtils';

const MasterAdminDashboard = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    total_schools: 0,
    active_schools: 0,
    total_revenue: 0,
    monthly_revenue: 0,
    total_students: 0,
    total_staff: 0,
  });
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_master_admin_dashboard_stats');
      if (error) {
        toast({ variant: 'destructive', title: 'Failed to load dashboard stats.' });
      } else {
        setStats(data);
      }
      
      const { data: transactionData, error: transactionError } = await supabase
        .from('subscription_invoices')
        .select('generated_date, total_amount')
        .eq('payment_status', 'paid')
        .order('generated_date', { ascending: true });

      if (transactionError) {
        toast({ variant: 'destructive', title: 'Failed to load transaction data.' });
      } else {
        const monthlyData = transactionData.reduce((acc, { generated_date, total_amount }) => {
            const month = getMonthShortName(generated_date) + ' ' + new Date(generated_date).getFullYear().toString().slice(-2);
            if (!acc[month]) {
                acc[month] = { name: month, revenue: 0 };
            }
            acc[month].revenue += total_amount;
            return acc;
        }, {});
        setChartData(Object.values(monthlyData));
      }

      setLoading(false);
    };

    fetchStats();
  }, [toast]);
  
  const statCards = [
    { title: 'Total Schools', value: stats.total_schools.toLocaleString(), icon: School },
    { title: 'Active Schools', value: stats.active_schools.toLocaleString(), icon: UserCheck },
    { title: 'Total Students', value: stats.total_students.toLocaleString(), icon: Users },
    { title: 'Total Staff', value: stats.total_staff.toLocaleString(), icon: 'User' }, //Using string as User is a common component name.
    { title: 'This Month Revenue', value: `?${stats.monthly_revenue.toLocaleString()}`, icon: Activity, changeType: 'increase' },
    { title: 'Total Revenue', value: `?${stats.total_revenue.toLocaleString()}`, icon: IndianRupee },
  ];

  return (
    <DashboardLayout>
      <WelcomeMessage 
        user={user?.profile?.full_name || 'Master Admin'}
        message="Here is the overview of the entire platform."
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <StatCard key={index} {...stat} index={index} />
        ))}
      </div>

      <div className="bg-card p-6 rounded-xl shadow-lg border">
        <h2 className="text-xl font-bold text-foreground mb-4">Monthly Revenue</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
            <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={(value) => `?${value/1000}k`} />
            <Tooltip
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} 
                formatter={(value) => `?${value.toLocaleString()}`}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
            />
            <Legend />
            <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} activeDot={{ r: 8 }} dot={{r: 4}}/>
          </LineChart>
        </ResponsiveContainer>
      </div>
    </DashboardLayout>
  );
};

export default MasterAdminDashboard;
