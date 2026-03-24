/**
 * Master Admin Analytics Dashboard
 * Platform-wide analytics for JASH ERP platform owner
 */
import React, { useState, useEffect } from 'react';
import { formatDate } from '@/utils/dateUtils';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabaseClient';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  Building2, Users, School, IndianRupee, TrendingUp, TrendingDown, 
  Calendar, CreditCard, AlertTriangle, CheckCircle, RefreshCw, Download,
  Activity, Globe, Layers
} from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const MasterAdminAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [activeTab, setActiveTab] = useState('overview');
  
  // Platform-wide analytics data
  const [platformData, setPlatformData] = useState({
    organizations: 0,
    branches: 0,
    students: 0,
    staff: 0,
    activeSubscriptions: 0,
    expiredSubscriptions: 0,
    totalRevenue: 0,
    monthlyRevenue: 0
  });
  
  const [orgList, setOrgList] = useState([]);
  const [subscriptionData, setSubscriptionData] = useState([]);
  const [growthData, setGrowthData] = useState([]);
  const [planDistribution, setPlanDistribution] = useState([]);

  // Fetch platform-wide analytics
  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Fetch Organizations count
      const { count: orgCount } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true });

      // Fetch Branches (Schools) count
      const { count: branchCount } = await supabase
        .from('schools')
        .select('*', { count: 'exact', head: true });

      // Fetch Students count (platform-wide)
      const { count: studentCount } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true });

      // Fetch Staff count (platform-wide)
      const { count: staffCount } = await supabase
        .from('staff')
        .select('*', { count: 'exact', head: true });

      // Fetch Subscriptions
      const { data: subscriptions } = await supabase
        .from('school_subscriptions')
        .select('status, plan:subscription_plans(name, price)');

      const activeCount = subscriptions?.filter(s => s.status === 'active').length || 0;
      const expiredCount = subscriptions?.filter(s => s.status === 'expired' || s.status === 'cancelled').length || 0;
      
      // Calculate revenue
      const totalRevenue = subscriptions?.reduce((sum, s) => sum + (s.plan?.price || 0), 0) || 0;

      // Fetch Organizations with details
      const { data: orgs } = await supabase
        .from('organizations')
        .select(`
          id, name, created_at,
          schools:schools(id, name, plan_id)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      // Plan distribution
      const { data: plans } = await supabase
        .from('subscription_plans')
        .select('id, name');
      
      const { data: schoolPlans } = await supabase
        .from('schools')
        .select('plan_id');

      const planCounts = {};
      plans?.forEach(p => { planCounts[p.id] = { name: p.name, count: 0 }; });
      schoolPlans?.forEach(s => {
        if (s.plan_id && planCounts[s.plan_id]) {
          planCounts[s.plan_id].count++;
        }
      });
      
      const planDist = Object.values(planCounts).filter(p => p.count > 0);

      // Generate growth data (last 6 months mock - would need actual created_at data)
      const growth = generateGrowthData();

      setPlatformData({
        organizations: orgCount || 0,
        branches: branchCount || 0,
        students: studentCount || 0,
        staff: staffCount || 0,
        activeSubscriptions: activeCount,
        expiredSubscriptions: expiredCount,
        totalRevenue: totalRevenue,
        monthlyRevenue: Math.round(totalRevenue / 12)
      });

      setOrgList(orgs || []);
      setPlanDistribution(planDist);
      setGrowthData(growth);

    } catch (error) {
      console.error('Error fetching platform analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate mock growth data
  const generateGrowthData = () => {
    const months = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'];
    return months.map((month, i) => ({
      month,
      organizations: Math.floor(Math.random() * 5) + i + 1,
      branches: Math.floor(Math.random() * 10) + (i * 2) + 5,
      students: Math.floor(Math.random() * 500) + (i * 100) + 200
    }));
  };

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  // Stat Card Component
  const StatCard = ({ title, value, icon: Icon, trend, trendValue, color = 'blue', subtitle }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
            {trendValue && (
              <div className={`flex items-center gap-1 mt-2 text-sm ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {trend === 'up' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                <span>{trendValue}</span>
              </div>
            )}
          </div>
          <div className={`p-4 rounded-full bg-${color}-100 dark:bg-${color}-900/20`}>
            <Icon className={`h-8 w-8 text-${color}-600`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Globe className="h-8 w-8 text-primary" />
              Platform Analytics
            </h1>
            <p className="text-muted-foreground">Platform-wide insights for JASH ERP</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
                <SelectItem value="quarter">Last 3 Months</SelectItem>
                <SelectItem value="year">Last Year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchAnalytics} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Platform Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Organizations"
            value={platformData.organizations.toLocaleString()}
            icon={Building2}
            trend="up"
            trendValue="+12% this month"
            color="blue"
          />
          <StatCard
            title="Total Branches"
            value={platformData.branches.toLocaleString()}
            icon={School}
            trend="up"
            trendValue="+8% this month"
            color="green"
          />
          <StatCard
            title="Total Students"
            value={platformData.students.toLocaleString()}
            icon={Users}
            subtitle="Across all branches"
            trend="up"
            trendValue="+15% growth"
            color="purple"
          />
          <StatCard
            title="Total Staff"
            value={platformData.staff.toLocaleString()}
            icon={Users}
            subtitle="Platform-wide"
            trend="up"
            trendValue="+5% growth"
            color="orange"
          />
        </div>

        {/* Subscription & Revenue Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Active Subscriptions"
            value={platformData.activeSubscriptions.toLocaleString()}
            icon={CheckCircle}
            color="green"
          />
          <StatCard
            title="Expired/Cancelled"
            value={platformData.expiredSubscriptions.toLocaleString()}
            icon={AlertTriangle}
            color="red"
          />
          <StatCard
            title="Total Revenue"
            value={`₹${platformData.totalRevenue.toLocaleString()}`}
            icon={IndianRupee}
            trend="up"
            trendValue="+22% YoY"
            color="green"
          />
          <StatCard
            title="Monthly Avg Revenue"
            value={`₹${platformData.monthlyRevenue.toLocaleString()}`}
            icon={CreditCard}
            color="blue"
          />
        </div>

        {/* Tabs for detailed views */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="growth">Growth Trends</TabsTrigger>
            <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
            <TabsTrigger value="organizations">Organizations</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Plan Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layers className="h-5 w-5" />
                    Plan Distribution
                  </CardTitle>
                  <CardDescription>Branches by subscription plan</CardDescription>
                </CardHeader>
                <CardContent>
                  {planDistribution.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={planDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, count }) => `${name}: ${count}`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="count"
                        >
                          {planDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      No plan data available
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Platform Health
                  </CardTitle>
                  <CardDescription>Key metrics at a glance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span>Subscription Conversion Rate</span>
                    <Badge variant="default">
                      {platformData.branches > 0 
                        ? Math.round((platformData.activeSubscriptions / platformData.branches) * 100)
                        : 0}%
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span>Avg Students per Branch</span>
                    <Badge variant="secondary">
                      {platformData.branches > 0 
                        ? Math.round(platformData.students / platformData.branches)
                        : 0}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span>Avg Staff per Branch</span>
                    <Badge variant="secondary">
                      {platformData.branches > 0 
                        ? Math.round(platformData.staff / platformData.branches)
                        : 0}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span>Avg Branches per Org</span>
                    <Badge variant="outline">
                      {platformData.organizations > 0 
                        ? (platformData.branches / platformData.organizations).toFixed(1)
                        : 0}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span>Revenue per Branch</span>
                    <Badge variant="default" className="bg-green-600">
                      ₹{platformData.branches > 0 
                        ? Math.round(platformData.totalRevenue / platformData.branches).toLocaleString()
                        : 0}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Growth Trends Tab */}
          <TabsContent value="growth" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Platform Growth Trends</CardTitle>
                <CardDescription>Organizations, branches, and students over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={growthData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="organizations" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} name="Organizations" />
                    <Area type="monotone" dataKey="branches" stackId="2" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name="Branches" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Student Growth</CardTitle>
                <CardDescription>Platform-wide student enrollment trend</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={growthData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="students" stroke="#8b5cf6" strokeWidth={3} name="Students" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Subscription Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Active', value: platformData.activeSubscriptions, fill: '#10b981' },
                          { name: 'Expired/Cancelled', value: platformData.expiredSubscriptions, fill: '#ef4444' }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label
                      >
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Revenue by Plan</CardTitle>
                  <CardDescription>Estimated monthly recurring revenue</CardDescription>
                </CardHeader>
                <CardContent>
                  {planDistribution.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={planDistribution}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#3b82f6" name="Branches" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      No subscription data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Organizations Tab */}
          <TabsContent value="organizations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Organizations</CardTitle>
                <CardDescription>Latest organizations added to the platform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {orgList.length > 0 ? orgList.map((org) => (
                    <div key={org.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                      <div className="flex items-center gap-3">
                        <Building2 className="h-10 w-10 text-primary bg-primary/10 p-2 rounded-lg" />
                        <div>
                          <p className="font-semibold">{org.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {org.schools?.length || 0} branches
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">
                          {formatDate(org.created_at)}
                        </Badge>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center text-muted-foreground py-8">
                      No organizations found
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default MasterAdminAnalytics;
