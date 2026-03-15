/**
 * Division Configuration Page
 * Configure exam divisions (First Division, Second Division, Distinction, etc.)
 * @file jashchar-frontend/src/pages/super-admin/examinations/DivisionConfigPage.jsx
 * @date 2026-03-14
 */

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Pencil, Trash2, Save, X, Plus, Layers, RefreshCw } from 'lucide-react';
import { divisionService } from '@/services/examinationService';

const DivisionConfigPage = () => {
  const { toast } = useToast();
  const [divisions, setDivisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      division_name: '',
      division_code: '',
      min_percentage: 0,
      max_percentage: 100,
      grade_point: 0,
      display_order: 1,
      description: '',
      is_active: true,
    }
  });

  useEffect(() => {
    fetchDivisions();
  }, []);

  const fetchDivisions = async () => {
    setLoading(true);
    try {
      const response = await divisionService.getAll();
      if (response.success) {
        setDivisions(response.data || []);
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      let response;
      if (editMode && editingId) {
        response = await divisionService.update(editingId, data);
      } else {
        response = await divisionService.create(data);
      }

      if (response.success) {
        toast({ title: response.message || 'Division saved successfully' });
        reset();
        setEditMode(false);
        setEditingId(null);
        fetchDivisions();
      } else {
        throw new Error(response.error || 'Failed to save');
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (division) => {
    setEditMode(true);
    setEditingId(division.id);
    setValue('division_name', division.division_name);
    setValue('division_code', division.division_code);
    setValue('min_percentage', division.min_percentage);
    setValue('max_percentage', division.max_percentage);
    setValue('grade_point', division.grade_point);
    setValue('display_order', division.display_order);
    setValue('description', division.description || '');
    setValue('is_active', division.is_active);
  };

  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setIsDeleteAlertOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      const response = await divisionService.delete(deleteId);
      if (response.success) {
        toast({ title: 'Division deleted successfully' });
        fetchDivisions();
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setIsDeleteAlertOpen(false);
      setDeleteId(null);
    }
  };

  const handleReset = () => {
    reset();
    setEditMode(false);
    setEditingId(null);
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Division Configuration</h1>
            <p className="text-muted-foreground">Configure exam divisions (First Class, Second Class, Distinction, etc.)</p>
          </div>
          <Button variant="outline" onClick={fetchDivisions} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Section */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2">
                  <Layers className="w-5 h-5" />
                  {editMode ? 'Edit Division' : 'Add Division'}
                </CardTitle>
                <CardDescription>Configure division/class ranges</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="division_name">Division Name <span className="text-destructive">*</span></Label>
                    <Input
                      id="division_name"
                      {...register('division_name', { required: 'Division name is required' })}
                      placeholder="e.g. First Division, Distinction"
                      className={errors.division_name ? 'border-destructive' : ''}
                    />
                    {errors.division_name && (
                      <span className="text-xs text-destructive">{errors.division_name.message}</span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="division_code">Division Code</Label>
                    <Input id="division_code" {...register('division_code')} placeholder="e.g. FIRST, DIST" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="min_percentage">Min %</Label>
                      <Input id="min_percentage" type="number" min="0" max="100" step="0.01" {...register('min_percentage', { valueAsNumber: true })} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="max_percentage">Max %</Label>
                      <Input id="max_percentage" type="number" min="0" max="100" step="0.01" {...register('max_percentage', { valueAsNumber: true })} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="grade_point">Grade Point</Label>
                      <Input id="grade_point" type="number" min="0" step="0.1" {...register('grade_point', { valueAsNumber: true })} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="display_order">Display Order</Label>
                      <Input id="display_order" type="number" min="1" {...register('display_order', { valueAsNumber: true })} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" {...register('description')} placeholder="Optional description" />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="is_active">Active</Label>
                    <Switch
                      id="is_active"
                      checked={watch('is_active')}
                      onCheckedChange={(checked) => setValue('is_active', checked)}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    {editMode && (
                      <Button type="button" variant="outline" onClick={handleReset}>
                        <X className="w-4 h-4 mr-2" /> Cancel
                      </Button>
                    )}
                    <Button type="submit" disabled={saving}>
                      {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                      {editMode ? 'Update' : 'Save'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* List Section */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="border-b">
                <CardTitle>Division List ({divisions.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                ) : divisions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Layers className="w-12 h-12 mb-4 opacity-50" />
                    <p>No divisions configured yet</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Division</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Range (%)</TableHead>
                        <TableHead>Grade Pt</TableHead>
                        <TableHead>Order</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {divisions.map((d) => (
                        <TableRow key={d.id}>
                          <TableCell className="font-medium">{d.division_name}</TableCell>
                          <TableCell>{d.division_code}</TableCell>
                          <TableCell>{d.min_percentage}% - {d.max_percentage}%</TableCell>
                          <TableCell>{d.grade_point}</TableCell>
                          <TableCell>{d.display_order}</TableCell>
                          <TableCell>
                            <Badge variant={d.is_active ? 'default' : 'secondary'}>
                              {d.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(d)}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDeleteClick(d.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Division?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default DivisionConfigPage;
