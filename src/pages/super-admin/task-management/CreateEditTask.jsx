/**
 * Create/Edit Task Page
 * Full form with all fields - title, description, priority, category, due date, assignees, checklist
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
// Checkbox removed - using native input to avoid Radix UI ref issues
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { 
  ArrowLeft, Save, Loader2, Calendar as CalendarIcon, Plus, X, 
  Trash2, GripVertical, AlertCircle, Users, Building2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const CreateEditTask = () => {
  const { id, roleSlug } = useParams();
  const navigate = useNavigate();
  const basePath = roleSlug || 'super-admin';
  const { user } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();

  const isEditing = !!id;

  // State
  const [loading, setLoading] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);

  // Form data
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    priority_id: '',
    task_type: 'general',
    status: 'pending',
    due_date: null,
    due_time: '',
    start_date: null,
    assignment_scope: 'individual',
    branch_scope: 'current', // 'current', 'all', 'selected'
    selected_branches: [],
    assigned_users: []
  });

  // Checklist items
  const [checklist, setChecklist] = useState([]);
  const [newChecklistItem, setNewChecklistItem] = useState('');

  // Validation errors
  const [errors, setErrors] = useState({});

  const branchId = user?.profile?.branch_id;

  // Fetch metadata (categories, priorities, users)
  useEffect(() => {
    const fetchMetadata = async () => {
      if (!branchId) return;

      try {
        const [catRes, priRes, usersRes, branchRes] = await Promise.all([
          api.get('/tasks/categories', { params: { branch_id: branchId } }),
          api.get('/tasks/priorities', { params: { branch_id: branchId } }),
          api.get('/tasks/assignable-users', { params: { branch_id: branchId } }),
          api.get('/branches', { params: { branch_id: branchId } })
        ]);

        if (catRes.data.success) setCategories(catRes.data.categories || catRes.data.data || []);
        if (priRes.data.success) setPriorities(priRes.data.priorities || priRes.data.data || []);
        
        const staffList = usersRes.data.users || usersRes.data.data || [];
        setUsers(staffList);
        setFilteredUsers(staffList);
        
        if (branchRes.data.success) {
          setBranches(branchRes.data.branches || branchRes.data.data || []);
        }

        // Set default priority (Medium)
        if (priRes.data.success && priRes.data.data?.length > 0 && !isEditing) {
          const mediumPriority = priRes.data.data.find(p => p.name?.toLowerCase() === 'medium');
          if (mediumPriority) {
            setFormData(prev => ({ ...prev, priority_id: mediumPriority.id }));
          }
        }
      } catch (error) {
        console.error('Fetch metadata error:', error);
      }
    };

    fetchMetadata();
  }, [branchId, isEditing]);

  // Fetch task data if editing
  useEffect(() => {
    const fetchTask = async () => {
      if (!isEditing || !id) return;
      setLoading(true);

      try {
        const response = await api.get(`/tasks/${id}`);
        if (response.data.success) {
          const task = response.data.data;
          setFormData({
            title: task.title || '',
            description: task.description || '',
            category_id: task.category_id || '',
            priority_id: task.priority_id || '',
            task_type: task.task_type || 'general',
            status: task.status || 'pending',
            due_date: task.due_date ? new Date(task.due_date) : null,
            due_time: task.due_time || '',
            start_date: task.start_date ? new Date(task.start_date) : null,
            assignment_scope: task.assignment_scope || 'individual',
            assigned_users: task.assignments?.map(a => a.assigned_to_user_id).filter(Boolean) || []
          });
          setChecklist(task.checklists || []);
        }
      } catch (error) {
        console.error('Fetch task error:', error);
        toast({
          variant: 'destructive',
          title: 'Error loading task',
          description: 'Task not found or you don\'t have access'
        });
        navigate(`/${basePath}/task-management/tasks`);
      } finally {
        setLoading(false);
      }
    };

    fetchTask();
  }, [id, isEditing, toast, navigate]);

  // Filter users by selected branches
  useEffect(() => {
    if (formData.branch_scope === 'all') {
      setFilteredUsers(users);
    } else if (formData.branch_scope === 'selected' && formData.selected_branches.length > 0) {
      setFilteredUsers(users.filter(u => formData.selected_branches.includes(u.branch_id)));
    } else if (formData.branch_scope === 'current' && selectedBranch?.id) {
      setFilteredUsers(users.filter(u => u.branch_id === selectedBranch.id));
    } else {
      setFilteredUsers(users);
    }
  }, [formData.branch_scope, formData.selected_branches, selectedBranch?.id, users]);

  // Handle form change
  const handleChange = (field, value) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      // Clear assigned users when branch scope changes
      if (field === 'branch_scope') {
        newData.assigned_users = [];
      }
      return newData;
    });
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  // Handle branch toggle for multi-select
  const handleBranchToggle = (branchId) => {
    setFormData(prev => ({
      ...prev,
      selected_branches: prev.selected_branches.includes(branchId)
        ? prev.selected_branches.filter(id => id !== branchId)
        : [...prev.selected_branches, branchId],
      assigned_users: [] // Clear assigned users when branches change
    }));
  };

  // Add checklist item
  const handleAddChecklistItem = () => {
    if (!newChecklistItem.trim()) return;
    
    setChecklist(prev => [
      ...prev,
      {
        id: `new-${Date.now()}`,
        title: newChecklistItem.trim(),
        is_completed: false,
        is_required: false,
        sort_order: prev.length
      }
    ]);
    setNewChecklistItem('');
  };

  // Remove checklist item
  const handleRemoveChecklistItem = (itemId) => {
    setChecklist(prev => prev.filter(item => item.id !== itemId));
  };

  // Toggle checklist required
  const handleToggleRequired = (itemId) => {
    setChecklist(prev => prev.map(item => 
      item.id === itemId ? { ...item, is_required: !item.is_required } : item
    ));
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Task title is required';
    }

    if (!formData.priority_id) {
      newErrors.priority_id = 'Priority is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({ variant: 'destructive', title: 'Please fix the errors' });
      return;
    }

    setSubmitting(true);

    try {
      // Determine branch_ids based on scope
      let branchIds = [];
      if (formData.branch_scope === 'all') {
        branchIds = branches.map(b => b.id);
      } else if (formData.branch_scope === 'selected') {
        branchIds = formData.selected_branches;
      } else {
        branchIds = selectedBranch?.id ? [selectedBranch.id] : [];
      }

      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        category_id: formData.category_id || null,
        priority_id: formData.priority_id,
        task_type: formData.task_type,
        status: formData.status,
        due_date: formData.due_date ? format(formData.due_date, 'yyyy-MM-dd') : null,
        due_time: formData.due_time || null,
        start_date: formData.start_date ? format(formData.start_date, 'yyyy-MM-dd') : null,
        assignment_scope: formData.assignment_scope,
        branch_id: branchId,
        branch_scope: formData.branch_scope,
        branch_ids: branchIds,
        branch_id: formData.branch_scope === 'current' ? (selectedBranch?.id || null) : null,
        organization_id: user?.profile?.organization_id || null,
        // Checklist items for creation
        checklist_items: checklist.map((item, index) => ({
          title: item.title,
          is_required: item.is_required,
          sort_order: index
        })),
        // Assignees
        assigned_users: formData.assigned_users
      };

      let response;
      if (isEditing) {
        response = await api.put(`/tasks/${id}`, payload);
      } else {
        response = await api.post('/tasks', payload);
      }

      if (response.data.success) {
        toast({ 
          title: isEditing ? 'Task updated successfully' : 'Task created successfully' 
        });
        navigate(`/${basePath}/task-management/tasks/${response.data.data?.id || id}`);
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast({
        variant: 'destructive',
        title: isEditing ? 'Failed to update task' : 'Failed to create task',
        description: error.response?.data?.message || 'Please try again'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle user selection for assignment
  const handleUserToggle = (userId) => {
    setFormData(prev => ({
      ...prev,
      assigned_users: prev.assigned_users.includes(userId)
        ? prev.assigned_users.filter(id => id !== userId)
        : [...prev.assigned_users, userId]
    }));
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
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(`/${basePath}/task-management/tasks`)}
            className="mb-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tasks
          </Button>
          <h1 className="text-3xl font-bold">
            {isEditing ? 'Edit Task' : 'Create New Task'}
          </h1>
          <p className="text-muted-foreground">
            {isEditing ? 'Update task details' : 'Fill in the details to create a new task'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Task Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">
                  Task Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="Enter task title..."
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  className={cn(errors.title && 'border-destructive')}
                />
                {errors.title && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.title}
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the task in detail..."
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  rows={4}
                />
              </div>

              {/* Category & Priority Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) => handleChange('category_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: cat.color || '#6B7280' }} 
                            />
                            {cat.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">
                    Priority <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.priority_id}
                    onValueChange={(value) => handleChange('priority_id', value)}
                  >
                    <SelectTrigger className={cn(errors.priority_id && 'border-destructive')}>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {priorities.map((pri) => (
                        <SelectItem key={pri.id} value={pri.id}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: pri.color || '#3B82F6' }} 
                            />
                            {pri.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.priority_id && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.priority_id}
                    </p>
                  )}
                </div>
              </div>

              {/* Task Type */}
              <div className="space-y-2">
                <Label htmlFor="task_type">Task Type</Label>
                <Select
                  value={formData.task_type}
                  onValueChange={(value) => handleChange('task_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="academic">Academic</SelectItem>
                    <SelectItem value="administrative">Administrative</SelectItem>
                    <SelectItem value="compliance">Compliance</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="report">Report</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Dates */}
          <Card>
            <CardHeader>
              <CardTitle>Schedule</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Start Date */}
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.start_date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.start_date ? format(formData.start_date, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.start_date}
                        onSelect={(date) => handleChange('start_date', date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Due Date */}
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.due_date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.due_date ? format(formData.due_date, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.due_date}
                        onSelect={(date) => handleChange('due_date', date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Due Time */}
                <div className="space-y-2">
                  <Label htmlFor="due_time">Due Time</Label>
                  <Input
                    id="due_time"
                    type="time"
                    value={formData.due_time}
                    onChange={(e) => handleChange('due_time', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Checklist */}
          <Card>
            <CardHeader>
              <CardTitle>Checklist</CardTitle>
              <CardDescription>Add sub-tasks or items to complete</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add new item */}
              <div className="flex gap-2">
                <Input
                  placeholder="Add checklist item..."
                  value={newChecklistItem}
                  onChange={(e) => setNewChecklistItem(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddChecklistItem())}
                />
                <Button type="button" onClick={handleAddChecklistItem}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Checklist items */}
              {checklist.length > 0 && (
                <div className="space-y-2">
                  {checklist.map((item, index) => (
                    <div 
                      key={item.id} 
                      className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30"
                    >
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                      <span className="flex-1">{item.title}</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`required-${item.id}`}
                          checked={item.is_required}
                          onChange={() => handleToggleRequired(item.id)}
                          className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <Label 
                          htmlFor={`required-${item.id}`} 
                          className="text-xs text-muted-foreground cursor-pointer"
                        >
                          Required
                        </Label>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveChecklistItem(item.id)}
                      >
                        <X className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Branch Selection - For Super Admin */}
          {branches.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Branch Assignment
                </CardTitle>
                <CardDescription>
                  Choose which branches this task applies to
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Branch Scope Selection */}
                <div className="space-y-3">
                  <div 
                    className={cn(
                      "flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors",
                      formData.branch_scope === 'current' 
                        ? "border-primary bg-primary/5" 
                        : "hover:bg-muted/50"
                    )}
                    onClick={() => handleChange('branch_scope', 'current')}
                  >
                    <input 
                      type="radio" 
                      checked={formData.branch_scope === 'current'} 
                      onChange={() => handleChange('branch_scope', 'current')}
                      className="w-4 h-4"
                    />
                    <div>
                      <p className="font-medium">Current Branch Only</p>
                      <p className="text-sm text-muted-foreground">
                        Task will be assigned to {selectedBranch?.name || 'current branch'} only
                      </p>
                    </div>
                  </div>

                  <div 
                    className={cn(
                      "flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors",
                      formData.branch_scope === 'all' 
                        ? "border-primary bg-primary/5" 
                        : "hover:bg-muted/50"
                    )}
                    onClick={() => handleChange('branch_scope', 'all')}
                  >
                    <input 
                      type="radio" 
                      checked={formData.branch_scope === 'all'} 
                      onChange={() => handleChange('branch_scope', 'all')}
                      className="w-4 h-4"
                    />
                    <div>
                      <p className="font-medium">All Branches</p>
                      <p className="text-sm text-muted-foreground">
                        Task will be visible and assignable to all {branches.length} branches
                      </p>
                    </div>
                  </div>

                  <div 
                    className={cn(
                      "flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors",
                      formData.branch_scope === 'selected' 
                        ? "border-primary bg-primary/5" 
                        : "hover:bg-muted/50"
                    )}
                    onClick={() => handleChange('branch_scope', 'selected')}
                  >
                    <input 
                      type="radio" 
                      checked={formData.branch_scope === 'selected'} 
                      onChange={() => handleChange('branch_scope', 'selected')}
                      className="w-4 h-4"
                    />
                    <div>
                      <p className="font-medium">Select Specific Branches</p>
                      <p className="text-sm text-muted-foreground">
                        Choose which branches to assign this task to
                      </p>
                    </div>
                  </div>
                </div>

                {/* Branch Multi-Select (shown when 'selected' is chosen) */}
                {formData.branch_scope === 'selected' && (
                  <div className="mt-4 p-4 border rounded-lg bg-muted/30">
                    <p className="text-sm font-medium mb-3">Select Branches:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {branches.map((branch) => (
                        <label
                          key={branch.id}
                          htmlFor={`branch-${branch.id}`}
                          className={cn(
                            "flex items-center gap-2 p-2 rounded border cursor-pointer",
                            formData.selected_branches.includes(branch.id)
                              ? "border-primary bg-primary/10"
                              : "hover:bg-muted"
                          )}
                        >
                          <input
                            type="checkbox"
                            id={`branch-${branch.id}`}
                            checked={formData.selected_branches.includes(branch.id)}
                            onChange={() => handleBranchToggle(branch.id)}
                            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <span>{branch.name}</span>
                        </label>
                      ))}
                    </div>
                    {formData.selected_branches.length > 0 && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {formData.selected_branches.length} branch(es) selected
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Assignments */}
          <Card>
            <CardHeader>
              <CardTitle>Assign To</CardTitle>
              <CardDescription>
                Select users to assign this task
                {formData.branch_scope !== 'current' && (
                  <span className="text-primary ml-1">
                    (Showing users from {formData.branch_scope === 'all' ? 'all branches' : 'selected branches'})
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredUsers.map((u) => (
                  <label
                    key={u.id}
                    htmlFor={`user-${u.id}`}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                      formData.assigned_users.includes(u.id) 
                        ? "border-primary bg-primary/5" 
                        : "hover:bg-muted/50"
                    )}
                  >
                    <input
                      type="checkbox"
                      id={`user-${u.id}`}
                      checked={formData.assigned_users.includes(u.id)}
                      onChange={() => handleUserToggle(u.id)}
                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {u.full_name || u.email}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {u.role?.name || 'User'}
                      </p>
                    </div>
                  </label>
                ))}
              </div>

              {formData.assigned_users.length > 0 && (
                <div className="mt-4 flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {formData.assigned_users.length} user(s) selected
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/${basePath}/task-management/tasks`)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {isEditing ? 'Update Task' : 'Create Task'}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default CreateEditTask;
