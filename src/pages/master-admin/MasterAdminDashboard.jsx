import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/DashboardLayout";
import StatCard from "@/components/StatCard";
import { School, ShieldCheck, Users, Activity, IndianRupee, TrendingUp, Clock, CheckCircle } from "lucide-react";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import WelcomeMessage from "@/components/WelcomeMessage";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { supabase } from "@/lib/customSupabaseClient"; // Import Supabase client directly

const MasterAdminDashboard = () => {
  const { toast } = useToast();
  const { user, session } = useAuth();
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  // Mock data for charts (since backend returns aggregates)
  const [revenueByMonth, setRevenueByMonth] = useState([
    { name: 'Jan', revenue: 45000 },
    { name: 'Feb', revenue: 52000 },
    { name: 'Mar', revenue: 48000 },
    { name: 'Apr', revenue: 61000 },
    { name: 'May', revenue: 55000 },
    { name: 'Jun', revenue: 67000 },
  ]);

  useEffect(() => {
    const fetchStats = async () => {
        // 1. Try to load from cache first for instant display
        const cachedStats = localStorage.getItem('master_admin_stats');
        if (cachedStats) {
            try {
                setStats(JSON.parse(cachedStats));
                setLoading(false); // Show cached data immediately
            } catch (e) {
                console.warn("Invalid cached stats");
            }
        }

        try {
            // 2. Try RPC for fast fetching
            // NOTE: We are suppressing the error log here because if the RPC is missing, we just fallback.
            // The console.error was causing confusion.
            let rpcData = null;
            let rpcError = null;
            
            try {
                // Use the function name suggested by the hint
                const response = await supabase.rpc('get_master_admin_dashboard_stats');
                rpcData = response.data;
                rpcError = response.error;
                
                if (rpcData) {
                   console.log("RPC Data received:", rpcData);
                   // Map snake_case from RPC to camelCase for UI
                   rpcData = {
                       totalSchools: rpcData.total_schools || 0,
                       activeSchools: rpcData.active_schools || 0,
                       suspendedSchools: 0, // Not provided by this RPC
                       totalUsers: (rpcData.total_students || 0) + (rpcData.total_staff || 0),
                       newSchoolsToday: 0, // Not provided by this RPC
                       totalRevenue: rpcData.total_revenue || 0
                   };
                }
            } catch (e) {
                // Ignore RPC call errors completely
                rpcError = e;
            }

            if (!rpcError && rpcData) {
                setStats(rpcData);
                localStorage.setItem('master_admin_stats', JSON.stringify(rpcData));
                setLoading(false);
                return;
            }

            // 3. Fallback to manual fetching if RPC fails
            // console.warn("RPC failed, falling back to manual fetch:", rpcError); // Suppress warning to avoid user confusion
            
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const [
                { count: totalSchools },
                { count: activeSchools },
                { count: suspendedSchools },
                { count: totalUsers },
                { count: newSchoolsToday }
            ] = await Promise.all([
                supabase.from('schools').select('*', { count: 'exact', head: true }),
                supabase.from('schools').select('*', { count: 'exact', head: true }).eq('status', 'active'),
                supabase.from('schools').select('*', { count: 'exact', head: true }).eq('status', 'suspended'),
                supabase.from('profiles').select('*', { count: 'exact', head: true }),
                supabase.from('schools').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString())
            ]);

            const newStats = {
                totalSchools: totalSchools || 0,
                activeSchools: activeSchools || 0,
                suspendedSchools: suspendedSchools || 0,
                totalUsers: totalUsers || 0,
                newSchoolsToday: newSchoolsToday || 0,
                totalRevenue: 0
            };

            setStats(newStats);
            localStorage.setItem('master_admin_stats', JSON.stringify(newStats));

        } catch (err) {
            console.error(err);
            toast({ variant: "destructive", title: "Dashboard Error", description: err.message });
        } finally {
            setLoading(false);
        }
    };

    if (session) {
        fetchStats();
    }
  }, [session, toast]);

  const statCards = [
    { title: "Total Schools", value: stats.totalSchools || 0, icon: School, color: "bg-blue-500" },
    { title: "Active Schools", value: stats.activeSchools || 0, icon: CheckCircle, color: "bg-green-500" },
    { title: "Suspended Schools", value: stats.suspendedSchools || 0, icon: ShieldCheck, color: "bg-red-500" },
    { title: "Total Users", value: stats.totalUsers || 0, icon: Users, color: "bg-purple-500" },
    { title: "New Today", value: stats.newSchoolsToday || 0, icon: Clock, color: "bg-yellow-500" },
    { title: "Total Revenue", value: `₹${stats.totalRevenue || 0}`, icon: IndianRupee, color: "bg-emerald-600" },
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-100px)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading Dashboard Stats...</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <WelcomeMessage 
            user={user?.user_metadata?.full_name || 'Master Admin'} 
            message="Here's what's happening across the platform today."
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {statCards.map((stat, index) => (
            <StatCard key={index} {...stat} index={index} />
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Revenue Chart */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card p-6 rounded-xl shadow-sm border border-border"
          >
            <h3 className="text-lg font-semibold mb-4 text-foreground">Revenue Overview</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueByMonth}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" className="text-muted-foreground" />
                  <YAxis className="text-muted-foreground" />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* School Growth Chart (Mock) */}
           <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-card p-6 rounded-xl shadow-sm border border-border"
          >
            <h3 className="text-lg font-semibold mb-4 text-foreground">School Growth</h3>
            <div className="h-80 flex items-center justify-center text-muted-foreground">
                Chart Placeholder
            </div>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MasterAdminDashboard;
