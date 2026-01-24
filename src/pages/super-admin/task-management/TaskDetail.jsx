/**
 * Task Detail Page
 * Complete task view with timeline, comments, attachments, checklist, watchers, assignments
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { 
  ArrowLeft, Edit, Trash2, UserPlus, Send, Paperclip, 
  Calendar, Clock, AlertTriangle, CheckCircle2, MessageSquare,
  FileText, Image, Video, Mic, Download, Eye, X, Plus,
  Users, Bell, MoreHorizontal, RefreshCw, Check, XCircle
} from 'lucide-react';
import { PermissionButton } from '@/components/PermissionComponents';
import { cn } from '@/lib/utils';

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
  under_review: 'bg-purple-100 text-purple-800 border-purple-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-gray-100 text-gray-800 border-gray-200',
  on_hold: 'bg-red-100 text-red-800 border-red-200'
};

const PRIORITY_COLORS = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800'
};

const UPDATE_TYPE_ICONS = {
  comment: MessageSquare,
  status_change: RefreshCw,
  progress_update: CheckCircle2,
  assignment: UserPlus,
  attachment: Paperclip,
  voice_note: Mic,
  checklist_update: Check
};

const TaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();

  // State
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updates, setUpdates] = useState([]);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');

  // Dialogs
  const [assignDialog, setAssignDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);

  // New comment/update
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Users for assignment
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');

  // Fetch task details
  const fetchTask = useCallback(async () => {
    if (!id) return;
    setLoading(true);

    try {
      const response = await api.get(`/tasks/${id}`);
      if (response.data.success) {
        setTask(response.data.data);
      }
    } catch (error) {
      console.error('Fetch task error:', error);
      toast({
        variant: 'destructive',
        title: 'Error loading task',
        description: error.response?.data?.message || 'Task not found'
      });
      navigate('/super-admin/task-management/tasks');
    } finally {
      setLoading(false);
    }
  }, [id, toast, navigate]);

  // Fetch updates/timeline
  const fetchUpdates = useCallback(async () => {
    if (!id) return;

    try {
      const response = await api.get(`/tasks/${id}/updates`);
      if (response.data.success) {
        setUpdates(response.data.data || []);
      }
    } catch (error) {
      console.error('Fetch updates error:', error);
    }
  }, [id]);

  // Fetch available users for assignment
  const fetchUsers = useCallback(async () => {
    if (!task?.branch_id) return;

    try {
      const response = await api.get('/users', {
        params: { branch_id: task.branch_id, limit: 100 }
      });
      if (response.data.success) {
        setAvailableUsers(response.data.data || []);
      }
    } catch (error) {
      console.error('Fetch users error:', error);
    }
  }, [task?.branch_id]);

  useEffect(() => {
    fetchTask();
    fetchUpdates();
  }, [fetchTask, fetchUpdates]);

  useEffect(() => {
    if (task) fetchUsers();
  }, [task, fetchUsers]);

  // Add comment/update
  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    setSubmitting(true);

    try {
      const response = await api.post(`/tasks/${id}/updates`, {
        content: newComment,
        update_type: 'comment'
      });

      if (response.data.success) {
        toast({ title: 'Comment added' });
        setNewComment('');
        fetchUpdates();
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to add comment',
        description: error.response?.data?.message
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Update task status
  const handleStatusChange = async (newStatus) => {
    try {
      const response = await api.put(`/tasks/${id}`, { status: newStatus });
      if (response.data.success) {
        toast({ title: 'Status updated' });
        fetchTask();
        fetchUpdates();
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to update status' });
    }
  };

  // Toggle checklist item
  const handleToggleChecklist = async (checklistId, isCompleted) => {
    try {
      const response = await api.put(`/tasks/${id}/checklists/${checklistId}`, {
        is_completed: !isCompleted
      });
      if (response.data.success) {
        fetchTask();
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to update checklist' });
    }
  };

  // Assign user
  const handleAssign = async () => {
    if (!selectedUser) return;
    setSubmitting(true);

    try {
      const response = await api.post(`/tasks/${id}/assign`, {
        assigned_to_user_id: selectedUser
      });

      if (response.data.success) {
        toast({ title: 'User assigned successfully' });
        setAssignDialog(false);
        setSelectedUser('');
        fetchTask();
        fetchUpdates();
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to assign user',
        description: error.response?.data?.message
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Delete task
  const handleDelete = async () => {
    try {
      const response = await api.delete(`/tasks/${id}`);
      if (response.data.success) {
        toast({ title: 'Task deleted' });
        navigate('/super-admin/task-management/tasks');
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to delete task' });
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

  const formatDateTime = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  // Check if overdue
  const isOverdue = task?.due_date && 
    task.status !== 'completed' && 
    task.status !== 'cancelled' && 
    new Date(task.due_date) < new Date();

  // Get initials
  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Calculate progress from checklist
  const checklistProgress = task?.checklists?.length > 0
    ? Math.round((task.checklists.filter(c => c.is_completed).length / task.checklists.length) * 100)
    : 0;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!task) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64">
          <h2 className="text-xl font-bold">Task not found</h2>
          <Button onClick={() => navigate('/super-admin/task-management/tasks')} className="mt-4">
            Back to Tasks
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/super-admin/task-management/tasks')}
              className="mb-2"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Tasks
            </Button>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{task.title}</h1>
              {isOverdue && (
                <Badge variant="destructive">
                  <AlertTriangle className="mr-1 h-3 w-3" /> Overdue
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground font-mono text-sm mt-1">
              {task.task_number}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Select value={task.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <PermissionButton moduleSlug="task_management.tasks" action="assign">
              <Button variant="outline" onClick={() => setAssignDialog(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Assign
              </Button>
            </PermissionButton>

            <PermissionButton moduleSlug="task_management.tasks" action="edit">
              <Button variant="outline" onClick={() => navigate(`/super-admin/task-management/tasks/${id}/edit`)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </PermissionButton>

            <PermissionButton moduleSlug="task_management.tasks" action="delete">
              <Button variant="destructive" onClick={() => setDeleteDialog(true)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </PermissionButton>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="timeline">Timeline ({updates.length})</TabsTrigger>
                <TabsTrigger value="attachments">Attachments ({task.attachments?.length || 0})</TabsTrigger>
                <TabsTrigger value="checklist">Checklist ({task.checklists?.length || 0})</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap">
                      {task.description || 'No description provided'}
                    </p>
                  </CardContent>
                </Card>

                {/* Checklist Preview */}
                {task.checklists?.length > 0 && (
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle>Checklist Progress</CardTitle>
                      <span className="text-sm font-medium">{checklistProgress}%</span>
                    </CardHeader>
                    <CardContent>
                      <Progress value={checklistProgress} className="h-2" />
                      <div className="mt-4 space-y-2">
                        {task.checklists.slice(0, 5).map((item) => (
                          <div key={item.id} className="flex items-center gap-3">
                            <Checkbox
                              checked={item.is_completed}
                              onCheckedChange={() => handleToggleChecklist(item.id, item.is_completed)}
                            />
                            <span className={cn(
                              'text-sm',
                              item.is_completed && 'line-through text-muted-foreground'
                            )}>
                              {item.title}
                            </span>
                          </div>
                        ))}
                        {task.checklists.length > 5 && (
                          <Button variant="link" size="sm" onClick={() => setActiveTab('checklist')}>
                            View all {task.checklists.length} items
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Timeline Tab */}
              <TabsContent value="timeline" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Activity Timeline</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Add Comment */}
                    <div className="flex gap-3 mb-6">
                      <Avatar>
                        <AvatarFallback>{getInitials(user?.profile?.full_name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <Textarea
                          placeholder="Add a comment or update..."
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          rows={3}
                        />
                        <div className="flex justify-end mt-2">
                          <Button 
                            onClick={handleAddComment} 
                            disabled={!newComment.trim() || submitting}
                          >
                            <Send className="mr-2 h-4 w-4" />
                            {submitting ? 'Posting...' : 'Post Update'}
                          </Button>
                        </div>
                      </div>
                    </div>

                    <Separator className="my-4" />

                    {/* Updates List */}
                    <div className="space-y-4">
                      {updates.length === 0 ? (
                        <p className="text-center text-muted-foreground py-4">
                          No updates yet. Be the first to add one!
                        </p>
                      ) : (
                        updates.map((update) => {
                          const Icon = UPDATE_TYPE_ICONS[update.update_type] || MessageSquare;
                          return (
                            <div key={update.id} className="flex gap-3">
                              <div className="relative">
                                <Avatar>
                                  <AvatarFallback>{getInitials(update.user?.full_name)}</AvatarFallback>
                                </Avatar>
                                <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5">
                                  <Icon className="h-3 w-3 text-muted-foreground" />
                                </div>
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{update.user?.full_name || 'System'}</span>
                                  <span className="text-sm text-muted-foreground">
                                    {formatDateTime(update.created_at)}
                                  </span>
                                </div>
                                {update.update_type === 'status_change' ? (
                                  <p className="text-sm mt-1">
                                    Changed status from <Badge variant="outline">{update.old_status}</Badge> to{' '}
                                    <Badge variant="outline">{update.new_status}</Badge>
                                  </p>
                                ) : update.update_type === 'progress_update' ? (
                                  <p className="text-sm mt-1">
                                    Updated progress: {update.old_progress || 0}% → {update.new_progress}%
                                  </p>
                                ) : (
                                  <p className="text-sm mt-1 whitespace-pre-wrap">{update.content}</p>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Attachments Tab */}
              <TabsContent value="attachments" className="mt-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Attachments</CardTitle>
                    <Button size="sm">
                      <Paperclip className="mr-2 h-4 w-4" />
                      Upload
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {!task.attachments || task.attachments.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        No attachments yet
                      </p>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {task.attachments.map((attachment) => (
                          <div 
                            key={attachment.id} 
                            className="border rounded-lg p-3 flex items-center gap-3 hover:bg-muted/50"
                          >
                            {attachment.file_type === 'image' ? (
                              <Image className="h-8 w-8 text-blue-500" />
                            ) : attachment.file_type === 'video' ? (
                              <Video className="h-8 w-8 text-purple-500" />
                            ) : attachment.file_type === 'voice' ? (
                              <Mic className="h-8 w-8 text-orange-500" />
                            ) : (
                              <FileText className="h-8 w-8 text-gray-500" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {attachment.original_name || attachment.file_name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {attachment.file_size ? `${(attachment.file_size / 1024).toFixed(1)} KB` : ''}
                              </p>
                            </div>
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Checklist Tab */}
              <TabsContent value="checklist" className="mt-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Checklist</CardTitle>
                      <CardDescription>
                        {task.checklists?.filter(c => c.is_completed).length || 0} of {task.checklists?.length || 0} completed
                      </CardDescription>
                    </div>
                    <Button size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Item
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <Progress value={checklistProgress} className="h-2 mb-4" />
                    
                    {!task.checklists || task.checklists.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        No checklist items yet
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {task.checklists.map((item) => (
                          <div 
                            key={item.id} 
                            className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50"
                          >
                            <Checkbox
                              checked={item.is_completed}
                              onCheckedChange={() => handleToggleChecklist(item.id, item.is_completed)}
                            />
                            <div className="flex-1">
                              <span className={cn(
                                item.is_completed && 'line-through text-muted-foreground'
                              )}>
                                {item.title}
                              </span>
                              {item.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {item.description}
                                </p>
                              )}
                            </div>
                            {item.is_required && (
                              <Badge variant="outline">Required</Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Task Info */}
            <Card>
              <CardHeader>
                <CardTitle>Task Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge className={cn('border', STATUS_COLORS[task.status])}>
                    {task.status?.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Priority</span>
                  <Badge className={PRIORITY_COLORS[task.priority?.name?.toLowerCase()]}>
                    {task.priority?.name || 'Medium'}
                  </Badge>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Category</span>
                  <span>{task.category?.name || '-'}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Due Date</span>
                  <span className={cn(isOverdue && 'text-red-600 font-medium')}>
                    {formatDate(task.due_date)}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span>{formatDate(task.created_at)}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created By</span>
                  <span>{task.creator?.full_name || '-'}</span>
                </div>
              </CardContent>
            </Card>

            {/* Assignees */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Assignees</CardTitle>
                <Button size="sm" variant="ghost" onClick={() => setAssignDialog(true)}>
                  <UserPlus className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                {!task.assignments || task.assignments.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    No one assigned yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {task.assignments.map((assignment) => (
                      <div key={assignment.id} className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {getInitials(assignment.assignee?.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {assignment.assignee?.full_name || 'Unknown'}
                          </p>
                          <div className="flex items-center gap-2">
                            <Progress value={assignment.progress_percent || 0} className="h-1.5 flex-1" />
                            <span className="text-xs text-muted-foreground">
                              {assignment.progress_percent || 0}%
                            </span>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {assignment.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Watchers */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Watchers</CardTitle>
                <Button size="sm" variant="ghost">
                  <Bell className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                {!task.watchers || task.watchers.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    No watchers yet
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {task.watchers.map((watcher) => (
                      <Avatar key={watcher.id} className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {getInitials(watcher.user?.full_name)}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Assign Dialog */}
        <Dialog open={assignDialog} onOpenChange={setAssignDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Select user to assign" />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.full_name || u.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleAssign} disabled={!selectedUser || submitting}>
                {submitting ? 'Assigning...' : 'Assign'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Task</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{task.title}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
};

export default TaskDetail;
