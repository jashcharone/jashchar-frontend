/**
 * Advanced Analytics Dashboard
 * Comprehensive school analytics with charts and insights
 */
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import api from '@/lib/api';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  Users, IndianRupee, TrendingUp, TrendingDown, Calendar, GraduationCap,
  AlertTriangle, CheckCircle, Lightbulb, RefreshCw, Download, Filter
} from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const AdvancedAnalytics = () => {
  const { school } = useAuth();
  const currencySymbol = school?.currency_symbol || '₹';
  
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [activeTab, setActiveTab] = useState('overview');
  
  // Analytics data states
  const [overview, setOverview] = useState(null);
  const [attendanceData, setAttendanceData] = useState([]);
  const [feeData, setFeeData] = useState({ dailyData: [], methodData: [], typeData: [], totalCollection: 0 });
  const [performanceData, setPerformanceData] = useState({ subjectData: [], gradeData: [] });
  const [demographicsData, setDemographicsData] = useState({});
  const [trendsData, setTrendsData] = useState([]);
  const [aiInsights, setAiInsights] = useState({ insights: [], metrics: {} });

  // Fetch all analytics data
  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [
        overviewRes,
        attendanceRes,
        feeRes,
        performanceRes,
        demographicsRes,
        trendsRes,
        insightsRes
      ] = await Promise.all([
        api.get('/analytics/overview'),
        api.get(`/analytics/attendance?period=${period}`),
        api.get(`/analytics/fees?period=${period}`),
        api.get('/analytics/performance'),
        api.get('/analytics/demographics'),
        api.get('/analytics/trends'),
        api.get('/analytics/ai-insights')
      ]);

      if (overviewRes.data.success) setOverview(overviewRes.data.data);
      if (attendanceRes.data.success) setAttendanceData(attendanceRes.data.data);
      if (feeRes.data.success) setFeeData(feeRes.data.data);
      if (performanceRes.data.success) setPerformanceData(performanceRes.data.data);
      if (demographicsRes.data.success) setDemographicsData(demographicsRes.data.data);
      if (trendsRes.data.success) setTrendsData(trendsRes.data.data);
      if (insightsRes.data.success) setAiInsights(insightsRes.data.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  // Stat Card Component
  const StatCard = ({ title, value, icon: Icon, trend, trendValue, color = 'primary' }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {trendValue && (
              <div className={`flex items-center gap-1 mt-2 text-sm ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {trend === 'up' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                <span>{trendValue}</span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-full bg-${color}/10`}>
            <Icon className={`h-6 w-6 text-${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // AI Insight Card Component
  const InsightCard = ({ insight }) => {
    const iconMap = {
      AlertTriangle: AlertTriangle,
      CheckCircle: CheckCircle,
      Lightbulb: Lightbulb,
      IndianRupee: IndianRupee,
      Users: Users
    };
    const Icon = iconMap[insight.icon] || Lightbulb;
    
    const bgColors = {
      warning: 'bg-yellow-50 border-yellow-200',
      success: 'bg-green-50 border-green-200',
      info: 'bg-blue-50 border-blue-200',
      tip: 'bg-purple-50 border-purple-200'
    };
    
    const iconColors = {
      warning: 'text-yellow-600',
      success: 'text-green-600',
      info: 'text-blue-600',
      tip: 'text-purple-600'
    };

    return (
      <Card className={`${bgColors[insight.type]} border`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Icon className={`h-5 w-5 mt-0.5 ${iconColors[insight.type]}`} />
            <div>
              <h4 className="font-semibold text-sm">{insight.title}</h4>
              <p className="text-sm text-muted-foreground mt-1">{insight.description}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">📊 Advanced Analytics</h1>
            <p className="text-muted-foreground">Comprehensive insights for your school</p>
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

        {/* Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Students"
            value={overview?.totalStudents?.toLocaleString() || '0'}
            icon={Users}
            trend="up"
            trendValue="+5.2%"
          />
          <StatCard
            title="Total Staff"
            value={overview?.totalStaff?.toLocaleString() || '0'}
            icon={GraduationCap}
            trend="up"
            trendValue="+2.1%"
          />
          <StatCard
            title="Fee Collection"
            value={`${currencySymbol}${(overview?.totalFees || 0).toLocaleString()}`}
            icon={IndianRupee}
            trend="up"
            trendValue="+15%"
          />
          <StatCard
            title="Attendance Rate"
            value={`${overview?.attendanceRate || 0}%`}
            icon={Calendar}
            trend={overview?.attendanceRate >= 90 ? 'up' : 'down'}
            trendValue={overview?.attendanceRate >= 90 ? 'Good' : 'Needs Attention'}
          />
        </div>

        {/* AI Insights Section */}
        {aiInsights.insights.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                AI-Powered Insights
              </CardTitle>
              <CardDescription>Smart recommendations based on your data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {aiInsights.insights.map((insight, index) => (
                  <InsightCard key={index} insight={insight} />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs for Different Analytics */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="fees">Fees</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="demographics">Demographics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Monthly Trends */}
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Trends</CardTitle>
                  <CardDescription>Admissions & Fee Collection over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trendsData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip />
                        <Legend />
                        <Area
                          yAxisId="left"
                          type="monotone"
                          dataKey="admissions"
                          stroke="#3b82f6"
                          fill="#3b82f6"
                          fillOpacity={0.3}
                          name="Admissions"
                        />
                        <Area
                          yAxisId="right"
                          type="monotone"
                          dataKey="feeCollection"
                          stroke="#10b981"
                          fill="#10b981"
                          fillOpacity={0.3}
                          name="Fee Collection"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Gender Distribution Pie */}
              <Card>
                <CardHeader>
                  <CardTitle>Gender Distribution</CardTitle>
                  <CardDescription>Student gender breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={demographicsData.genderDistribution || []}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                          nameKey="name"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {(demographicsData.genderDistribution || []).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Attendance Tab */}
          <TabsContent value="attendance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Attendance Trends</CardTitle>
                <CardDescription>Daily attendance breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={attendanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="present" fill="#10b981" name="Present" stackId="a" />
                      <Bar dataKey="absent" fill="#ef4444" name="Absent" stackId="a" />
                      <Bar dataKey="late" fill="#f59e0b" name="Late" stackId="a" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Attendance Rate Line Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Attendance Rate Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={attendanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="rate"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ fill: '#3b82f6' }}
                        name="Attendance %"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Fees Tab */}
          <TabsContent value="fees" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Daily Fee Collection</CardTitle>
                  <CardDescription>Total: {currencySymbol}{feeData.totalCollection?.toLocaleString()}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={feeData.dailyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`${currencySymbol}${value.toLocaleString()}`, 'Amount']} />
                        <Area
                          type="monotone"
                          dataKey="amount"
                          stroke="#10b981"
                          fill="#10b981"
                          fillOpacity={0.3}
                          name="Collection"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Payment Methods</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={feeData.methodData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="amount"
                          nameKey="method"
                          label
                        >
                          {(feeData.methodData || []).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `${currencySymbol}${value.toLocaleString()}`} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Fee Type Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Fee Type Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={feeData.typeData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="type" type="category" width={100} />
                      <Tooltip formatter={(value) => `${currencySymbol}${value.toLocaleString()}`} />
                      <Bar dataKey="amount" fill="#3b82f6" name="Amount" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Subject-wise Performance</CardTitle>
                  <CardDescription>Average scores by subject</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={performanceData.subjectData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" domain={[0, 100]} />
                        <YAxis dataKey="subject" type="category" width={100} />
                        <Tooltip />
                        <Bar dataKey="average" fill="#8b5cf6" name="Average %" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Grade Distribution</CardTitle>
                  <CardDescription>Student grade breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={performanceData.gradeData}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          dataKey="count"
                          nameKey="grade"
                          label={({ grade, percent }) => `${grade}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {(performanceData.gradeData || []).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Demographics Tab */}
          <TabsContent value="demographics" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Class-wise Student Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={demographicsData.classDistribution || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#3b82f6" name="Students" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Blood Group Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={demographicsData.bloodGroupDistribution || []}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          dataKey="value"
                          nameKey="name"
                          label
                        >
                          {(demographicsData.bloodGroupDistribution || []).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AdvancedAnalytics;
