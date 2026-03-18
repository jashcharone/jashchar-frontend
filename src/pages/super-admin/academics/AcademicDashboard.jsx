import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { formatDate, formatTime } from '@/utils/dateUtils';
import { motion } from 'framer-motion';
import {
  GraduationCap, Users, BookOpen, Clock, Calendar, 
  TrendingUp, AlertCircle, CheckCircle2, School, 
  BookMarked, UserCheck, BarChart3, PieChart,
  ArrowRight, Loader2, RefreshCw, Target
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RechartsPie, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

const StatCard = ({ title, value, icon: Icon, color, subtitle, trend }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="text-3xl font-bold tracking-tight">{value}</h3>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
            {trend && (
              <div className="flex items-center gap-1 text-xs">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span className="text-green-600">{trend}</span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-xl ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

const AcademicDashboard = () => {
  const { toast } = useToast();
  const { user, currentSessionId } = useAuth();
  const { selectedBranch } = useBranch();
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardStats = async () => {
    const branchId = selectedBranch?.id;
    if (!branchId) {
      setLoading(false);
      return;
    }

    try {
      setRefreshing(true);
      const response = await api.get(`/academics/dashboard-stats?branchId=${branchId}&sessionId=${currentSessionId}`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching academic stats:', error);
      toast({
        title: 'Error',
        description: 'Failed to load academic dashboard',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, [selectedBranch?.id, currentSessionId]);

  // Prepare class-wise strength data for chart
  const classStrengthData = stats?.classWiseStrength 
    ? Object.entries(stats.classWiseStrength).map(([name, count]) => ({ name, count }))
    : [];

  // Subject distribution (mock for now - will be enhanced)
  const subjectDistribution = stats?.subjects?.slice(0, 6).map((s, i) => ({
    name: s.name?.substring(0, 10) || `Subject ${i + 1}`,
    value: Math.floor(Math.random() * 30) + 10
  })) || [];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6 p-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-80" />
            <Skeleton className="h-80" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <GraduationCap className="h-8 w-8 text-primary" />
              Academic Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Overview of academic structure and today's schedule
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={fetchDashboardStats}
            disabled={refreshing}
            className="gap-2"
          >
            {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Classes"
            value={stats?.totalClasses || 0}
            icon={School}
            color="bg-blue-500"
            subtitle="Active classes"
          />
          <StatCard
            title="Total Sections"
            value={stats?.totalSections || 0}
            icon={BookMarked}
            color="bg-green-500"
            subtitle="Across all classes"
          />
          <StatCard
            title="Total Subjects"
            value={stats?.totalSubjects || 0}
            icon={BookOpen}
            color="bg-purple-500"
            subtitle="Unique subjects"
          />
          <StatCard
            title="Total Students"
            value={stats?.totalStudents || 0}
            icon={Users}
            color="bg-orange-500"
            subtitle="Active enrollment"
          />
        </div>

        {/* Second Row Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Teachers Assigned"
            value={stats?.totalTeachers || 0}
            icon={UserCheck}
            color="bg-cyan-500"
            subtitle="Active staff"
          />
          <StatCard
            title="Today's Periods"
            value={stats?.todayPeriodsCount || 0}
            icon={Clock}
            color="bg-pink-500"
            subtitle={`${stats?.dayOfWeek || 'Today'}`}
          />
          <StatCard
            title="Pending Homework"
            value={stats?.homeworkPending || 0}
            icon={AlertCircle}
            color="bg-amber-500"
            subtitle="Last 7 days"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Class-wise Student Strength */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Class-wise Student Strength
              </CardTitle>
              <CardDescription>Students enrolled per class</CardDescription>
            </CardHeader>
            <CardContent>
              {classStrengthData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={classStrengthData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" fontSize={12} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No class data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Subject Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-primary" />
                Subject Distribution
              </CardTitle>
              <CardDescription>Subject coverage across classes</CardDescription>
            </CardHeader>
            <CardContent>
              {subjectDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPie>
                    <Pie
                      data={subjectDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label={({ name }) => name}
                    >
                      {subjectDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </RechartsPie>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No subject data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Today's Schedule ({stats?.dayOfWeek})
            </CardTitle>
            <CardDescription>
              {stats?.todayPeriodsCount || 0} periods scheduled for today
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.todayPeriods?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stats.todayPeriods.slice(0, 9).map((period, index) => (
                  <motion.div
                    key={period.id || index}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline">Period {index + 1}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {period.start_time} - {period.end_time}
                      </span>
                    </div>
                    <p className="font-medium">Subject ID: {period.subject_id?.substring(0, 8) || 'N/A'}</p>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No periods scheduled for today</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Homework */}
        {stats?.recentHomework?.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Recent Homework
              </CardTitle>
              <CardDescription>Last 7 days homework assignments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.recentHomework.map((hw, index) => (
                  <div 
                    key={hw.id || index}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{hw.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Due: {formatDate(hw.due_date)}
                      </p>
                    </div>
                    <Badge variant="secondary">Pending</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
                <a href="/super-admin/academics/classes">
                  <School className="h-5 w-5" />
                  <span>Manage Classes</span>
                </a>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
                <a href="/super-admin/academics/subjects">
                  <BookOpen className="h-5 w-5" />
                  <span>Manage Subjects</span>
                </a>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
                <a href="/super-admin/academics/class-timetable">
                  <Calendar className="h-5 w-5" />
                  <span>Class Timetable</span>
                </a>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
                <a href="/super-admin/academics/promote-student">
                  <TrendingUp className="h-5 w-5" />
                  <span>Promote Students</span>
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AcademicDashboard;
