/**
 * Task Priorities Management
 * CRUD operations for task priorities with levels
 */

import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { ActionButtons } from '@/components/PermissionComponents';
import { Plus, RefreshCw, Flag, AlertTriangle, ArrowUp, ArrowDown } from 'lucide-react';

// Predefined colors for priorities
const PRESET_COLORS = [
  { color: '#22C55E', name: 'Green (Low)' },
  { color: '#3B82F6', name: 'Blue (Normal)' },
  { color: '#F59E0B', name: 'Yellow (Medium)' },
  { color: '#F97316', name: 'Orange (High)' },
  { color: '#EF4444', name: 'Red (Urgent)' },
  { color: '#DC2626', name: 'Dark Red (Critical)' }
];

// Priority level icons
const LEVEL_ICONS = {
  1: { icon: ArrowDown, className: 'text-green-500' },
  2: { icon: ArrowDown, className: 'text-blue-500 rotate-45' },
  3: { icon: AlertTriangle, className: 'text-yellow-500' },
  4: { icon: ArrowUp, className: 'text-orange-500' },
  5: { icon: ArrowUp, className: 'text-red-500' }
};

const TaskPriorities = () => {
  const { toast } = useToast();

  const [priorities, setPriorities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form dialog
  const [formDialog, setFormDialog] = useState({
    open: false,
    mode: 'create',
    data: null
  });
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    level: 3,
    is_default: false,
    is_active: true
  });
  const [submitting, setSubmitting] = useState(false);

  // Delete dialog
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    priority: null
  });
  const [deleting, setDeleting] = useState(false);

  // Fetch priorities
  const fetchPriorities = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/tasks/priorities');
      if (response.data.success) {
        setPriorities(response.data.data || []);
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error loading priorities',
        description: error.response?.data?.message
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPriorities();
  }, [fetchPriorities]);

  // Open create dialog
  const openCreateDialog = () => {
    setFormData({
      name: '',
      description: '',
      color: '#3B82F6',
      level: 3,
      is_default: false,
      is_active: true
    });
    setFormDialog({ open: true, mode: 'create', data: null });
  };

  // Open edit dialog
  const openEditDialog = (priority) => {
    setFormData({
      name: priority.name || '',
      description: priority.description || '',
      color: priority.color || '#3B82F6',
      level: priority.level || 3,
      is_default: priority.is_default || false,
      is_active: priority.is_active !== false
    });
    setFormDialog({ open: true, mode: 'edit', data: priority });
  };

  // Handle form submit
  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast({ variant: 'destructive', title: 'Priority name is required' });
      return;
    }

    setSubmitting(true);
    try {
      if (formDialog.mode === 'create') {
        const response = await api.post('/tasks/priorities', formData);
        if (response.data.success) {
          toast({ title: 'Priority created successfully' });
        }
      } else {
        const response = await api.put(
          `/tasks/priorities/${formDialog.data.id}`,
          formData
        );
        if (response.data.success) {
          toast({ title: 'Priority updated successfully' });
        }
      }
      setFormDialog({ open: false, mode: 'create', data: null });
      fetchPriorities();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: `Failed to ${formDialog.mode} priority`,
        description: error.response?.data?.message
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!deleteDialog.priority) return;
    setDeleting(true);

    try {
      const response = await api.delete(`/tasks/priorities/${deleteDialog.priority.id}`);
      if (response.data.success) {
        toast({ title: 'Priority deleted successfully' });
        setDeleteDialog({ open: false, priority: null });
        fetchPriorities();
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to delete priority',
        description: error.response?.data?.message || 'Priority may have tasks associated'
      });
    } finally {
      setDeleting(false);
    }
  };

  // Get level icon
  const getLevelIcon = (level) => {
    const config = LEVEL_ICONS[level] || LEVEL_ICONS[3];
    const IconComponent = config.icon;
    return <IconComponent className={`h-4 w-4 ${config.className}`} />;
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
            <h1 className="text-3xl font-bold">Task Priorities</h1>
            <p className="text-muted-foreground">Define priority levels for tasks</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={fetchPriorities}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Add Priority
            </Button>
          </div>
        </div>

        {/* Priorities Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flag className="h-5 w-5" />
              Priorities ({priorities.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {priorities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Flag className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No priorities yet</h3>
                <p className="text-muted-foreground mb-4">Create priority levels for your tasks</p>
                <Button onClick={openCreateDialog}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Priority
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Color</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Default</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tasks</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {priorities
                    .sort((a, b) => (a.level || 3) - (b.level || 3))
                    .map((priority) => (
                    <TableRow key={priority.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                            style={{ backgroundColor: priority.color || '#3B82F6' }}
                          />
                          {getLevelIcon(priority.level)}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{priority.name}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2 py-1 bg-gray-100 rounded text-xs font-mono">
                          Level {priority.level || 3}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-[150px] truncate">
                        {priority.description || '-'}
                      </TableCell>
                      <TableCell>
                        {priority.is_default && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Default
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          priority.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {priority.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                      <TableCell>{priority.task_count || 0}</TableCell>
                      <TableCell className="text-right">
                        <ActionButtons
                          moduleSlug="task_management.priorities"
                          onEdit={() => openEditDialog(priority)}
                          onDelete={() => setDeleteDialog({ open: true, priority })}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Create/Edit Dialog */}
        <Dialog 
          open={formDialog.open} 
          onOpenChange={(open) => setFormDialog({ ...formDialog, open })}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {formDialog.mode === 'create' ? 'Create Priority' : 'Edit Priority'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Priority Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., High Priority"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="When to use this priority"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Color</Label>
                  <Select
                    value={formData.color}
                    onValueChange={(value) => setFormData({ ...formData, color: value })}
                  >
                    <SelectTrigger>
                      <SelectValue>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: formData.color }}
                          />
                          <span>{PRESET_COLORS.find(c => c.color === formData.color)?.name || 'Custom'}</span>
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {PRESET_COLORS.map((item) => (
                        <SelectItem key={item.color} value={item.color}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: item.color }}
                            />
                            <span>{item.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Priority Level</Label>
                  <Select
                    value={formData.level?.toString()}
                    onValueChange={(value) => setFormData({ ...formData, level: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 - Lowest</SelectItem>
                      <SelectItem value="2">2 - Low</SelectItem>
                      <SelectItem value="3">3 - Medium</SelectItem>
                      <SelectItem value="4">4 - High</SelectItem>
                      <SelectItem value="5">5 - Highest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="is_default">Set as Default</Label>
                    <p className="text-sm text-muted-foreground">
                      Auto-select this for new tasks
                    </p>
                  </div>
                  <Switch
                    id="is_default"
                    checked={formData.is_default}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="is_active">Active Status</Label>
                    <p className="text-sm text-muted-foreground">
                      Inactive priorities won't appear in forms
                    </p>
                  </div>
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting 
                  ? 'Saving...' 
                  : formDialog.mode === 'create' ? 'Create Priority' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog 
          open={deleteDialog.open} 
          onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Priority</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{deleteDialog.priority?.name}"? 
                This action cannot be undone. Tasks with this priority will need to be reassigned.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
};

export default TaskPriorities;
