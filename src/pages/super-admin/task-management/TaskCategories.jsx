/**
 * Task Categories Management
 * CRUD operations for task categories
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
import { ActionButtons } from '@/components/PermissionComponents';
import { Plus, RefreshCw, Palette, Tag, FolderOpen } from 'lucide-react';

// Predefined colors
const PRESET_COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16',
  '#22C55E', '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9',
  '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF',
  '#EC4899', '#F43F5E', '#64748B', '#78716C', '#6B7280'
];

const TaskCategories = () => {
  const { toast } = useToast();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form dialog
  const [formDialog, setFormDialog] = useState({
    open: false,
    mode: 'create', // 'create' or 'edit'
    data: null
  });
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    icon: '',
    is_active: true
  });
  const [submitting, setSubmitting] = useState(false);

  // Delete dialog
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    category: null
  });
  const [deleting, setDeleting] = useState(false);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/tasks/categories');
      if (response.data.success) {
        setCategories(response.data.data || []);
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error loading categories',
        description: error.response?.data?.message
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Open create dialog
  const openCreateDialog = () => {
    setFormData({
      name: '',
      description: '',
      color: '#3B82F6',
      icon: '',
      is_active: true
    });
    setFormDialog({ open: true, mode: 'create', data: null });
  };

  // Open edit dialog
  const openEditDialog = (category) => {
    setFormData({
      name: category.name || '',
      description: category.description || '',
      color: category.color || '#3B82F6',
      icon: category.icon || '',
      is_active: category.is_active !== false
    });
    setFormDialog({ open: true, mode: 'edit', data: category });
  };

  // Handle form submit
  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast({ variant: 'destructive', title: 'Category name is required' });
      return;
    }

    setSubmitting(true);
    try {
      if (formDialog.mode === 'create') {
        const response = await api.post('/tasks/categories', formData);
        if (response.data.success) {
          toast({ title: 'Category created successfully' });
        }
      } else {
        const response = await api.put(
          `/tasks/categories/${formDialog.data.id}`,
          formData
        );
        if (response.data.success) {
          toast({ title: 'Category updated successfully' });
        }
      }
      setFormDialog({ open: false, mode: 'create', data: null });
      fetchCategories();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: `Failed to ${formDialog.mode} category`,
        description: error.response?.data?.message
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!deleteDialog.category) return;
    setDeleting(true);

    try {
      const response = await api.delete(`/tasks/categories/${deleteDialog.category.id}`);
      if (response.data.success) {
        toast({ title: 'Category deleted successfully' });
        setDeleteDialog({ open: false, category: null });
        fetchCategories();
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to delete category',
        description: error.response?.data?.message || 'Category may have tasks associated'
      });
    } finally {
      setDeleting(false);
    }
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
            <h1 className="text-3xl font-bold">Task Categories</h1>
            <p className="text-muted-foreground">Organize tasks by category</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={fetchCategories}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          </div>
        </div>

        {/* Categories Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              Categories ({categories.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {categories.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Tag className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No categories yet</h3>
                <p className="text-muted-foreground mb-4">Create your first task category</p>
                <Button onClick={openCreateDialog}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Category
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Color</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tasks</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell>
                        <div 
                          className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                          style={{ backgroundColor: category.color || '#3B82F6' }}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell className="text-muted-foreground max-w-[200px] truncate">
                        {category.description || '-'}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          category.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {category.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                      <TableCell>{category.task_count || 0}</TableCell>
                      <TableCell className="text-right">
                        <ActionButtons
                          moduleSlug="task_management.categories"
                          onEdit={() => openEditDialog(category)}
                          onDelete={() => setDeleteDialog({ open: true, category })}
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
                {formDialog.mode === 'create' ? 'Create Category' : 'Edit Category'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Category Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Academic Tasks"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this category"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-lg border-2 shadow-sm"
                    style={{ backgroundColor: formData.color }}
                  />
                  <Input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-20 h-10 p-1 cursor-pointer"
                  />
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                        formData.color === color ? 'border-gray-900 scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setFormData({ ...formData, color })}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="is_active">Active Status</Label>
                  <p className="text-sm text-muted-foreground">
                    Inactive categories won't appear in task forms
                  </p>
                </div>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting 
                  ? 'Saving...' 
                  : formDialog.mode === 'create' ? 'Create Category' : 'Save Changes'}
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
              <AlertDialogTitle>Delete Category</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{deleteDialog.category?.name}"? 
                This action cannot be undone. Tasks using this category will need to be reassigned.
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

export default TaskCategories;
