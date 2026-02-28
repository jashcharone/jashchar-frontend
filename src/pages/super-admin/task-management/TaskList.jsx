/**
 * Task List Page
 * Complete list with filters, search, pagination, and bulk actions
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { 
  Plus, Search, Filter, MoreHorizontal, Edit, Trash2, Eye, 
  UserPlus, Calendar, Clock, AlertTriangle, CheckCircle2,
  ChevronLeft, ChevronRight, Download, RefreshCw, X, ListFilter
} from 'lucide-react';
import { PermissionButton, ActionButtons } from '@/components/PermissionComponents';
import { cn } from '@/lib/utils';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'on_hold', label: 'On Hold' }
];

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
  urgent: 'bg-red-100 text-red-800',
  critical: 'bg-red-200 text-red-900'
};

const TaskList = () => {
  const { user } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { roleSlug } = useParams();
  const basePath = roleSlug || 'super-admin';

  // State
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  // Filters
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    status: searchParams.get('status') || 'all',
    priority_id: searchParams.get('priority') || 'all',
    category_id: searchParams.get('category') || 'all',
    due_date_start: searchParams.get('due_start') || '',
    due_date_end: searchParams.get('due_end') || '',
    created_by_me: searchParams.get('my_created') === 'true'
  });

  // Bulk selection
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Delete dialog
  const [deleteDialog, setDeleteDialog] = useState({ open: false, taskId: null, taskTitle: '' });

  const branchId = user?.profile?.branch_id;

  // Fetch categories and priorities
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [catRes, priRes] = await Promise.all([
          api.get('/tasks/categories', { params: { branch_id: branchId } }),
          api.get('/tasks/priorities', { params: { branch_id: branchId } })
        ]);

        if (catRes.data.success) setCategories(catRes.data.data || []);
        if (priRes.data.success) setPriorities(priRes.data.data || []);
      } catch (error) {
        console.error('Fetch metadata error:', error);
      }
    };

    if (branchId) fetchMetadata();
  }, [branchId]);

  // Fetch tasks
  const fetchTasks = useCallback(async (page = 1) => {
    if (!branchId) return;
    setLoading(true);

    try {
      const params = {
        branch_id: branchId,
        branch_id: selectedBranch?.id,
        page,
        limit: pagination.limit,
        sort_by: 'created_at',
        sort_order: 'desc'
      };

      // Apply filters
      if (filters.search) params.search = filters.search;
      if (filters.status && filters.status !== 'all') params.status = filters.status;
      if (filters.priority_id && filters.priority_id !== 'all') params.priority_id = filters.priority_id;
      if (filters.category_id && filters.category_id !== 'all') params.category_id = filters.category_id;
      if (filters.due_date_start) params.due_date_start = filters.due_date_start;
      if (filters.due_date_end) params.due_date_end = filters.due_date_end;
      if (filters.created_by_me) params.created_by = user?.id;

      const response = await api.get('/tasks', { params });

      if (response.data.success) {
        setTasks(response.data.tasks || []);
        setPagination(prev => ({
          ...prev,
          page: response.data.pagination?.page || 1,
          total: response.data.pagination?.total || 0,
          totalPages: response.data.pagination?.total_pages || 1
        }));
      }
    } catch (error) {
      console.error('Fetch tasks error:', error);
      toast({
        variant: 'destructive',
        title: 'Error loading tasks',
        description: error.response?.data?.message || 'Failed to load tasks'
      });
    } finally {
      setLoading(false);
    }
  }, [branchId, selectedBranch?.id, filters, pagination.limit, user?.id, toast]);

  useEffect(() => {
    fetchTasks(pagination.page);
  }, [fetchTasks, pagination.page]);

  // Handle filter change
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
    
    // Update URL params
    const newParams = new URLSearchParams(searchParams);
    if (value && value !== 'all') {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      priority_id: 'all',
      category_id: 'all',
      due_date_start: '',
      due_date_end: '',
      created_by_me: false
    });
    setSearchParams({});
  };

  // Handle task selection
  const handleSelectTask = (taskId, checked) => {
    if (checked) {
      setSelectedTasks(prev => [...prev, taskId]);
    } else {
      setSelectedTasks(prev => prev.filter(id => id !== taskId));
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedTasks(tasks.map(t => t.id));
    } else {
      setSelectedTasks([]);
    }
  };

  // Delete task
  const handleDelete = async () => {
    if (!deleteDialog.taskId) return;

    try {
      const response = await api.delete(`/tasks/${deleteDialog.taskId}`);
      if (response.data.success) {
        toast({ title: 'Task deleted successfully' });
        fetchTasks(pagination.page);
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error deleting task',
        description: error.response?.data?.message || 'Failed to delete task'
      });
    } finally {
      setDeleteDialog({ open: false, taskId: null, taskTitle: '' });
    }
  };

  // Bulk actions
  const handleBulkAction = async (action) => {
    if (selectedTasks.length === 0) return;

    try {
      // For now, just show notification
      toast({
        title: `Bulk ${action}`,
        description: `${selectedTasks.length} tasks selected for ${action}`
      });
      // TODO: Implement bulk API calls
      setSelectedTasks([]);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Bulk action failed' });
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
    if (!dueDate || status === 'completed' || status === 'cancelled') return false;
    return new Date(dueDate) < new Date();
  };

  // Get assignee count
  const getAssigneeCount = (task) => {
    return task.assignments?.length || 0;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">All Tasks</h1>
            <p className="text-muted-foreground">
              {pagination.total} total tasks
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => fetchTasks(pagination.page)}>
              <RefreshCw className="mr-2 h-4 w-4" />
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

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
              {/* Search */}
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tasks..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <Select
                value={filters.status}
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Priority Filter */}
              <Select
                value={filters.priority_id}
                onValueChange={(value) => handleFilterChange('priority_id', value)}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  {priorities.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Category Filter */}
              <Select
                value={filters.category_id}
                onValueChange={(value) => handleFilterChange('category_id', value)}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Due Date Range */}
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={filters.due_date_start}
                  onChange={(e) => handleFilterChange('due_date_start', e.target.value)}
                  className="w-[140px]"
                  placeholder="Due From"
                />
                <span className="text-muted-foreground">to</span>
                <Input
                  type="date"
                  value={filters.due_date_end}
                  onChange={(e) => handleFilterChange('due_date_end', e.target.value)}
                  className="w-[140px]"
                  placeholder="Due To"
                />
              </div>

              {/* Clear Filters */}
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="mr-1 h-4 w-4" />
                Clear
              </Button>
            </div>

            {/* Active Filters Display */}
            {(filters.status !== 'all' || filters.priority_id !== 'all' || filters.category_id !== 'all' || filters.search) && (
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
                <span className="text-sm text-muted-foreground">Active filters:</span>
                {filters.status !== 'all' && (
                  <Badge variant="secondary">
                    Status: {filters.status.replace('_', ' ')}
                    <X className="ml-1 h-3 w-3 cursor-pointer" onClick={() => handleFilterChange('status', 'all')} />
                  </Badge>
                )}
                {filters.priority_id !== 'all' && (
                  <Badge variant="secondary">
                    Priority: {priorities.find(p => p.id === filters.priority_id)?.name || 'Custom'}
                    <X className="ml-1 h-3 w-3 cursor-pointer" onClick={() => handleFilterChange('priority_id', 'all')} />
                  </Badge>
                )}
                {filters.category_id !== 'all' && (
                  <Badge variant="secondary">
                    Category: {categories.find(c => c.id === filters.category_id)?.name || 'Custom'}
                    <X className="ml-1 h-3 w-3 cursor-pointer" onClick={() => handleFilterChange('category_id', 'all')} />
                  </Badge>
                )}
                {filters.search && (
                  <Badge variant="secondary">
                    Search: "{filters.search}"
                    <X className="ml-1 h-3 w-3 cursor-pointer" onClick={() => handleFilterChange('search', '')} />
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bulk Actions Bar */}
        {selectedTasks.length > 0 && (
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="py-3 flex items-center justify-between">
              <span className="text-sm font-medium">
                {selectedTasks.length} task(s) selected
              </span>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => handleBulkAction('complete')}>
                  <CheckCircle2 className="mr-1 h-4 w-4" /> Mark Complete
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkAction('assign')}>
                  <UserPlus className="mr-1 h-4 w-4" /> Assign
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleBulkAction('delete')}>
                  <Trash2 className="mr-1 h-4 w-4" /> Delete
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setSelectedTasks([])}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tasks Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : tasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <ListFilter className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No tasks found</h3>
                <p className="text-muted-foreground mb-4">
                  {Object.values(filters).some(v => v && v !== 'all') 
                    ? 'Try adjusting your filters' 
                    : 'Create your first task to get started'}
                </p>
                <PermissionButton moduleSlug="task_management.tasks" action="add">
                  <Button onClick={() => navigate(`/${basePath}/task-management/tasks/create`)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Task
                  </Button>
                </PermissionButton>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedTasks.length === tasks.length}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Task</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Assignees</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map((task) => (
                    <TableRow 
                      key={task.id}
                      className={cn(
                        'cursor-pointer hover:bg-muted/50',
                        isOverdue(task.due_date, task.status) && 'bg-red-50'
                      )}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedTasks.includes(task.id)}
                          onCheckedChange={(checked) => handleSelectTask(task.id, checked)}
                        />
                      </TableCell>
                      <TableCell 
                        className="font-medium"
                        onClick={() => navigate(`/${basePath}/task-management/tasks/${task.id}`)}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground font-mono">
                              {task.task_number}
                            </span>
                            {isOverdue(task.due_date, task.status) && (
                              <Badge variant="destructive" className="text-xs">Overdue</Badge>
                            )}
                          </div>
                          <p className="font-medium line-clamp-1">{task.title}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn('border', STATUS_COLORS[task.status])}>
                          {task.status?.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={PRIORITY_COLORS[task.priority?.name?.toLowerCase()]}>
                          {task.priority?.name || 'Medium'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{task.category?.name || '-'}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <UserPlus className="h-4 w-4 text-muted-foreground" />
                          <span>{getAssigneeCount(task)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className={cn(
                            'text-sm',
                            isOverdue(task.due_date, task.status) && 'text-red-600 font-medium'
                          )}>
                            {formatDate(task.due_date)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(task.created_at)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/${basePath}/task-management/tasks/${task.id}`)}>
                              <Eye className="mr-2 h-4 w-4" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/${basePath}/task-management/tasks/${task.id}/edit`)}>
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/${basePath}/task-management/tasks/${task.id}?tab=assign`)}>
                              <UserPlus className="mr-2 h-4 w-4" /> Assign
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => setDeleteDialog({ 
                                open: true, 
                                taskId: task.id, 
                                taskTitle: task.title 
                              })}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} tasks
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === 1}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === pagination.totalPages}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog(prev => ({ ...prev, open }))}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Task</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{deleteDialog.taskTitle}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
};

export default TaskList;
