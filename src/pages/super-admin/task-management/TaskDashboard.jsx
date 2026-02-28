/**
 * Task Management Dashboard
 * Main dashboard with statistics, charts, and quick actions
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  ListTodo, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Calendar,
  Users,
  TrendingUp,
  ArrowRight,
  BarChart3,
  Filter,
  Bell,
  Target,
  Zap,
  ClipboardList,
  UserCheck,
  Timer,
  Activity
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { PermissionButton } from '@/components/PermissionComponents';
import { cn } from '@/lib/utils';

// Color palette for charts
const CHART_COLORS = {
  primary: '#3b82f6',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
  purple: '#8b5cf6',
  pink: '#ec4899'
};

const STATUS_COLORS = {
  pending: '#f59e0b',
  in_progress: '#3b82f6',
  under_review: '#8b5cf6',
  completed: '#22c55e',
  cancelled: '#6b7280',
  on_hold: '#ef4444'
};

const PRIORITY_COLORS = {
  low: '#22c55e',
  medium: '#f59e0b',
  high: '#ef4444',
  urgent: '#dc2626'
};

const TaskDashboard = () => {
  const { user } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { roleSlug } = useParams();
  const basePath = roleSlug || 'super-admin';
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [recentTasks, setRecentTasks] = useState([]);
  const [upcomingDue, setUpcomingDue] = useState([]);
  const [myTasks, setMyTasks] = useState([]);

  const branchId = user?.profile?.branch_id;

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);

    try {
      // Fetch stats
      const statsResponse = await api.get('/tasks/dashboard/stats', {
        params: { 
          branch_id: branchId,
          branch_id: selectedBranch?.id
        }
      });

      if (statsResponse.data.success) {
        setStats(statsResponse.data.data);
      }

      // Fetch recent tasks
      const recentResponse = await api.get('/tasks', {
        params: {
          branch_id: branchId,
          branch_id: selectedBranch?.id,
          limit: 5,
          sort_by: 'created_at',
          sort_order: 'desc'
        }
      });

      if (recentResponse.data.success) {
        setRecentTasks(recentResponse.data.tasks || []);
      }

      // Fetch my tasks
      const myTasksResponse = await api.get('/tasks/my-tasks', {
        params: { status: 'pending,in_progress' }
      });

      if (myTasksResponse.data.success) {
        setMyTasks(myTasksResponse.data.assignments || []);
      }

      // Fetch upcoming due tasks
      const upcomingResponse = await api.get('/tasks', {
        params: {
          branch_id: branchId,
          branch_id: selectedBranch?.id,
          status: 'pending,in_progress',
          due_date_start: new Date().toISOString().split('T')[0],
          due_date_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          sort_by: 'due_date',
          sort_order: 'asc',
          limit: 5
        }
      });

      if (upcomingResponse.data.success) {
        setUpcomingDue(upcomingResponse.data.tasks || []);
      }

    } catch (error) {
      console.error('Dashboard fetch error:', error);
      toast({
        variant: 'destructive',
        title: 'Error loading dashboard',
        description: error.response?.data?.message || 'Failed to load dashboard data'
      });
    } finally {
      setLoading(false);
    }
  }, [branchId, selectedBranch?.id, toast]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Get status badge variant
  const getStatusBadge = (status) => {
    const variants = {
      pending: 'warning',
      in_progress: 'default',
      under_review: 'secondary',
      completed: 'success',
      cancelled: 'outline',
      on_hold: 'destructive'
    };
    return variants[status] || 'outline';
  };

  // Get priority badge
  const getPriorityBadge = (priority) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return colors[priority?.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return 'No due date';
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Days remaining calculation
  const getDaysRemaining = (dueDate) => {
    if (!dueDate) return null;
    const diff = new Date(dueDate) - new Date();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  // Stats Cards Component
  const StatsCards = () => {
    if (!stats) return null;
    
    const cards = [
      {
        title: 'Total Tasks',
        value: stats.total_tasks || 0,
        icon: ListTodo,
        color: 'text-blue-500',
        bgColor: 'bg-blue-50'
      },
      {
        title: 'Pending',
        value: stats.status_breakdown?.pending || 0,
        icon: Clock,
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-50'
      },
      {
        title: 'In Progress',
        value: stats.status_breakdown?.in_progress || 0,
        icon: Activity,
        color: 'text-blue-500',
        bgColor: 'bg-blue-50'
      },
      {
        title: 'Completed',
        value: stats.status_breakdown?.completed || 0,
        icon: CheckCircle2,
        color: 'text-green-500',
        bgColor: 'bg-green-50'
      },
      {
        title: 'Overdue',
        value: stats.overdue_tasks || 0,
        icon: AlertTriangle,
        color: 'text-red-500',
        bgColor: 'bg-red-50'
      },
      {
        title: 'Completion Rate',
        value: `${stats.completion_rate || 0}%`,
        icon: Target,
        color: 'text-purple-500',
        bgColor: 'bg-purple-50'
      }
    ];

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {cards.map((card, idx) => (
          <Card key={idx} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{card.title}</p>
                  <p className="text-2xl font-bold">{card.value}</p>
                </div>
                <div className={cn('p-3 rounded-full', card.bgColor)}>
                  <card.icon className={cn('h-5 w-5', card.color)} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  // Status Distribution Pie Chart
  const StatusPieChart = () => {
    if (!stats?.status_breakdown) return null;

    const data = Object.entries(stats.status_breakdown).map(([key, value]) => ({
      name: key.replace('_', ' ').toUpperCase(),
      value: value,
      color: STATUS_COLORS[key]
    })).filter(d => d.value > 0);

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Task Status Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  };

  // Priority Distribution Bar Chart
  const PriorityBarChart = () => {
    if (!stats?.priority_breakdown) return null;

    const data = Object.entries(stats.priority_breakdown).map(([key, value]) => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      tasks: value,
      fill: PRIORITY_COLORS[key]
    }));

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Tasks by Priority
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="tasks" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  };

  // Recent Tasks List
  const RecentTasksList = () => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Recent Tasks
          </CardTitle>
          <CardDescription>Latest tasks created</CardDescription>
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate(`/${basePath}/task-management/tasks`)}>
          View All <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No tasks found</p>
          ) : (
            recentTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => navigate(`/${basePath}/task-management/tasks/${task.id}`)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{task.title}</span>
                    <Badge className={getPriorityBadge(task.priority?.name)}>
                      {task.priority?.name || 'Medium'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(task.due_date)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {task.assignments?.length || 0} assigned
                    </span>
                  </div>
                </div>
                <Badge variant={getStatusBadge(task.status)}>
                  {task.status?.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );

  // My Tasks List
  const MyTasksList = () => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            My Tasks
          </CardTitle>
          <CardDescription>Tasks assigned to you</CardDescription>
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate(`/${basePath}/task-management/my-tasks`)}>
          View All <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {myTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No tasks assigned to you</p>
          ) : (
            myTasks.slice(0, 5).map((assignment) => (
              <div
                key={assignment.id}
                className="p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => navigate(`/${basePath}/task-management/tasks/${assignment.task?.id}`)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{assignment.task?.title}</span>
                  <Badge className={getPriorityBadge(assignment.task?.priority?.name)}>
                    {assignment.task?.priority?.name || 'Medium'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Due: {formatDate(assignment.task?.due_date)}
                  </span>
                  <div className="flex items-center gap-2">
                    <Progress value={assignment.progress_percent || 0} className="w-20 h-2" />
                    <span className="text-sm font-medium">{assignment.progress_percent || 0}%</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );

  // Upcoming Due Tasks
  const UpcomingDueTasks = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Timer className="h-5 w-5" />
          Due This Week
        </CardTitle>
        <CardDescription>Tasks due in the next 7 days</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {upcomingDue.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No upcoming deadlines</p>
          ) : (
            upcomingDue.map((task) => {
              const daysRemaining = getDaysRemaining(task.due_date);
              return (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/${basePath}/task-management/tasks/${task.id}`)}
                >
                  <div>
                    <span className="font-medium">{task.title}</span>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(task.due_date)}
                    </p>
                  </div>
                  <Badge 
                    variant={daysRemaining <= 1 ? 'destructive' : daysRemaining <= 3 ? 'warning' : 'secondary'}
                  >
                    {daysRemaining <= 0 ? 'Due Today' : `${daysRemaining} days left`}
                  </Badge>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );

  // Quick Actions
  const QuickActions = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          <PermissionButton moduleSlug="task_management.tasks" action="add">
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => navigate(`/${basePath}/task-management/tasks/create`)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Task
            </Button>
          </PermissionButton>
          <Button 
            className="w-full justify-start" 
            variant="outline"
            onClick={() => navigate(`/${basePath}/task-management/my-tasks`)}
          >
            <UserCheck className="mr-2 h-4 w-4" />
            My Tasks
          </Button>
          <Button 
            className="w-full justify-start" 
            variant="outline"
            onClick={() => navigate(`/${basePath}/task-management/tasks?filter=overdue`)}
          >
            <AlertTriangle className="mr-2 h-4 w-4" />
            Overdue Tasks
          </Button>
          <Button 
            className="w-full justify-start" 
            variant="outline"
            onClick={() => navigate(`/${basePath}/task-management/categories`)}
          >
            <Filter className="mr-2 h-4 w-4" />
            Categories
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Task Management</h1>
            <p className="text-muted-foreground">
              Manage and track all organizational tasks
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={fetchDashboardData}>
              <Bell className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <PermissionButton moduleSlug="task_management.tasks" action="add">
              <Button onClick={() => navigate(`/${basePath}/task-management/tasks/create`)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Task
              </Button>
            </PermissionButton>
          </div>
        </div>

        {/* Stats Cards */}
        <StatsCards />

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <StatusPieChart />
          <PriorityBarChart />
        </div>

        {/* Tasks Lists Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <RecentTasksList />
          <MyTasksList />
          <div className="space-y-6">
            <UpcomingDueTasks />
            <QuickActions />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TaskDashboard;
