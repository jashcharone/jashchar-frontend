/**
 * My Tasks Page
 * Personal task view showing tasks assigned to current user
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose
} from '@/components/ui/dialog';
import { 
  Clock, Calendar, CheckCircle2, AlertTriangle, RefreshCw,
  Eye, MessageSquare, Send, Check, XCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  accepted: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800'
};

const PRIORITY_COLORS = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800'
};

const MyTasks = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { roleSlug } = useParams();
  const basePath = roleSlug || 'super-admin';

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active');

  // Update progress dialog
  const [updateDialog, setUpdateDialog] = useState({
    open: false,
    assignment: null
  });
  const [progressValue, setProgressValue] = useState(0);
  const [updateNote, setUpdateNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch my assignments
  const fetchMyTasks = useCallback(async () => {
    setLoading(true);

    try {
      const response = await api.get('/tasks/my-tasks');
      if (response.data.success) {
        setAssignments(response.data.data || []);
      }
    } catch (error) {
      console.error('Fetch my tasks error:', error);
      toast({
        variant: 'destructive',
        title: 'Error loading tasks',
        description: error.response?.data?.message
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchMyTasks();
  }, [fetchMyTasks]);

  // Filter assignments by tab
  const filteredAssignments = assignments.filter(a => {
    if (activeTab === 'active') {
      return ['pending', 'accepted', 'in_progress'].includes(a.status);
    } else if (activeTab === 'completed') {
      return a.status === 'completed';
    } else if (activeTab === 'overdue') {
      return a.task?.due_date && 
             new Date(a.task.due_date) < new Date() && 
             a.status !== 'completed';
    }
    return true;
  });

  // Open update dialog
  const openUpdateDialog = (assignment) => {
    setUpdateDialog({ open: true, assignment });
    setProgressValue(assignment.progress_percent || 0);
    setUpdateNote('');
  };

  // Submit progress update
  const handleUpdateProgress = async () => {
    if (!updateDialog.assignment) return;
    setSubmitting(true);

    try {
      const response = await api.put(
        `/tasks/${updateDialog.assignment.task_id}/assignments/${updateDialog.assignment.id}`,
        {
          progress_percent: progressValue,
          status: progressValue === 100 ? 'completed' : 'in_progress',
          notes: updateNote || null
        }
      );

      if (response.data.success) {
        toast({ title: 'Progress updated successfully' });
        setUpdateDialog({ open: false, assignment: null });
        fetchMyTasks();
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to update progress',
        description: error.response?.data?.message
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Accept/Reject task
  const handleAcceptReject = async (assignment, action) => {
    try {
      const response = await api.put(
        `/tasks/${assignment.task_id}/assignments/${assignment.id}`,
        {
          status: action === 'accept' ? 'accepted' : 'rejected'
        }
      );

      if (response.data.success) {
        toast({ title: action === 'accept' ? 'Task accepted' : 'Task rejected' });
        fetchMyTasks();
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Action failed' });
    }
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Check if overdue
  const isOverdue = (dueDate, status) => {
    if (!dueDate || status === 'completed') return false;
    return new Date(dueDate) < new Date();
  };

  // Get days remaining
  const getDaysRemaining = (dueDate) => {
    if (!dueDate) return null;
    const diff = Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  // Stats
  const stats = {
    total: assignments.length,
    active: assignments.filter(a => ['pending', 'accepted', 'in_progress'].includes(a.status)).length,
    completed: assignments.filter(a => a.status === 'completed').length,
    overdue: assignments.filter(a => isOverdue(a.task?.due_date, a.status)).length
  };

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Tasks</h1>
            <p className="text-muted-foreground">Tasks assigned to you</p>
          </div>
          <Button variant="outline" onClick={fetchMyTasks}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-sm text-muted-foreground">Total Tasks</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-600">{stats.active}</div>
              <p className="text-sm text-muted-foreground">Active</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
              <p className="text-sm text-muted-foreground">Completed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
              <p className="text-sm text-muted-foreground">Overdue</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="active">
              Active ({stats.active})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({stats.completed})
            </TabsTrigger>
            <TabsTrigger value="overdue">
              Overdue ({stats.overdue})
            </TabsTrigger>
            <TabsTrigger value="all">
              All ({stats.total})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {filteredAssignments.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckCircle2 className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No tasks here</h3>
                  <p className="text-muted-foreground">
                    {activeTab === 'completed' 
                      ? 'Complete some tasks to see them here'
                      : activeTab === 'overdue'
                      ? 'Great! No overdue tasks'
                      : 'No tasks assigned to you yet'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredAssignments.map((assignment) => {
                  const task = assignment.task;
                  const daysRemaining = getDaysRemaining(task?.due_date);
                  const overdue = isOverdue(task?.due_date, assignment.status);

                  return (
                    <Card 
                      key={assignment.id}
                      className={cn(
                        'hover:shadow-md transition-shadow',
                        overdue && 'border-red-200 bg-red-50/50'
                      )}
                    >
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row md:items-center gap-4">
                          {/* Task Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-mono text-muted-foreground">
                                {task?.task_number}
                              </span>
                              {overdue && (
                                <Badge variant="destructive" className="text-xs">
                                  <AlertTriangle className="mr-1 h-3 w-3" />
                                  Overdue
                                </Badge>
                              )}
                            </div>
                            <h3 
                              className="font-semibold cursor-pointer hover:text-primary"
                              onClick={() => navigate(`/${basePath}/task-management/tasks/${task?.id}`)}
                            >
                              {task?.title}
                            </h3>
                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Due: {formatDate(task?.due_date)}
                              </span>
                              {daysRemaining !== null && (
                                <span className={cn(
                                  'flex items-center gap-1',
                                  daysRemaining <= 0 ? 'text-red-600' :
                                  daysRemaining <= 3 ? 'text-orange-600' :
                                  'text-green-600'
                                )}>
                                  <Clock className="h-3 w-3" />
                                  {daysRemaining <= 0 
                                    ? `${Math.abs(daysRemaining)} days overdue`
                                    : `${daysRemaining} days left`}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Priority & Status */}
                          <div className="flex items-center gap-2">
                            <Badge className={PRIORITY_COLORS[task?.priority?.name?.toLowerCase()]}>
                              {task?.priority?.name || 'Medium'}
                            </Badge>
                            <Badge className={STATUS_COLORS[assignment.status]}>
                              {assignment.status?.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </div>

                          {/* Progress */}
                          <div className="w-32">
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span className="text-muted-foreground">Progress</span>
                              <span className="font-medium">{assignment.progress_percent || 0}%</span>
                            </div>
                            <Progress value={assignment.progress_percent || 0} className="h-2" />
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            {assignment.status === 'pending' && (
                              <>
                                <Button 
                                  size="sm" 
                                  onClick={() => handleAcceptReject(assignment, 'accept')}
                                >
                                  <Check className="mr-1 h-4 w-4" /> Accept
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleAcceptReject(assignment, 'reject')}
                                >
                                  <XCircle className="mr-1 h-4 w-4" /> Reject
                                </Button>
                              </>
                            )}
                            {['accepted', 'in_progress'].includes(assignment.status) && (
                              <Button 
                                size="sm"
                                onClick={() => openUpdateDialog(assignment)}
                              >
                                Update Progress
                              </Button>
                            )}
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => navigate(`/${basePath}/task-management/tasks/${task?.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Update Progress Dialog */}
        <Dialog open={updateDialog.open} onOpenChange={(open) => setUpdateDialog({ open, assignment: null })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Progress</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div>
                <h4 className="font-medium mb-2">{updateDialog.assignment?.task?.title}</h4>
                <p className="text-sm text-muted-foreground">
                  {updateDialog.assignment?.task?.description?.substring(0, 100)}...
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Progress</span>
                  <span className="text-2xl font-bold">{progressValue}%</span>
                </div>
                <Slider
                  value={[progressValue]}
                  onValueChange={(value) => setProgressValue(value[0])}
                  max={100}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Update Note (optional)</label>
                <Textarea
                  placeholder="Add a note about your progress..."
                  value={updateNote}
                  onChange={(e) => setUpdateNote(e.target.value)}
                  rows={3}
                />
              </div>

              {progressValue === 100 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-800 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Setting to 100% will mark this task as completed
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleUpdateProgress} disabled={submitting}>
                {submitting ? 'Updating...' : 'Update Progress'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default MyTasks;
