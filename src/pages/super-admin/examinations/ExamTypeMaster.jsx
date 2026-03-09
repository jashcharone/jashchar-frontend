/**
 * Exam Type Master Page
 * Define exam types (Unit Test, FA1, SA1, etc.)
 * @file jashchar-frontend/src/pages/super-admin/examinations/ExamTypeMaster.jsx
 * @date 2026-03-09
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
import { Loader2, Pencil, Trash2, Save, X, Plus, FileSpreadsheet, RefreshCw, Sparkles } from 'lucide-react';
import { examTypeService } from '@/services/examinationService';

const categories = [
  { value: 'formative', label: 'Formative Assessment (FA)', color: 'bg-blue-500' },
  { value: 'summative', label: 'Summative Assessment (SA)', color: 'bg-purple-500' },
  { value: 'practical', label: 'Practical', color: 'bg-green-500' },
  { value: 'internal', label: 'Internal Assessment', color: 'bg-yellow-500' },
  { value: 'project', label: 'Project', color: 'bg-pink-500' },
];

const quickTypes = [
  { type_name: 'Unit Test 1', type_code: 'UT1', category: 'formative', weightage: 10, max_marks: 25 },
  { type_name: 'Unit Test 2', type_code: 'UT2', category: 'formative', weightage: 10, max_marks: 25 },
  { type_name: 'FA1', type_code: 'FA1', category: 'formative', weightage: 10, max_marks: 20 },
  { type_name: 'FA2', type_code: 'FA2', category: 'formative', weightage: 10, max_marks: 20 },
  { type_name: 'SA1', type_code: 'SA1', category: 'summative', weightage: 40, max_marks: 80 },
  { type_name: 'SA2', type_code: 'SA2', category: 'summative', weightage: 40, max_marks: 80 },
  { type_name: 'Practical', type_code: 'PRAC', category: 'practical', weightage: 20, max_marks: 20 },
];

const getCategoryBadge = (category) => {
  const cat = categories.find(c => c.value === category);
  if (!cat) return <Badge variant="outline">{category}</Badge>;
  return <Badge className={`${cat.color} text-white`}>{cat.label}</Badge>;
};

const ExamTypeMaster = () => {
  const { toast } = useToast();
  const [examTypes, setExamTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      type_name: '',
      type_code: '',
      category: 'formative',
      weightage: 0,
      max_marks: 100,
      description: '',
      is_published_to_parent: true,
      display_in_report_card: true,
      is_active: true,
    }
  });

  useEffect(() => {
    fetchExamTypes();
  }, []);

  const fetchExamTypes = async () => {
    setLoading(true);
    try {
      const response = await examTypeService.getAll();
      if (response.success) {
        setExamTypes(response.data || []);
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
        response = await examTypeService.update(editingId, data);
      } else {
        response = await examTypeService.create(data);
      }

      if (response.success) {
        toast({ title: response.message || 'Exam type saved successfully' });
        reset();
        setEditMode(false);
        setEditingId(null);
        fetchExamTypes();
      } else {
        throw new Error(response.error || 'Failed to save');
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (examType) => {
    setEditMode(true);
    setEditingId(examType.id);
    setValue('type_name', examType.type_name);
    setValue('type_code', examType.type_code);
    setValue('category', examType.category);
    setValue('weightage', examType.weightage);
    setValue('max_marks', examType.max_marks);
    setValue('description', examType.description || '');
    setValue('is_published_to_parent', examType.is_published_to_parent);
    setValue('display_in_report_card', examType.display_in_report_card);
    setValue('is_active', examType.is_active);
  };

  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setIsDeleteAlertOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      const response = await examTypeService.delete(deleteId);
      if (response.success) {
        toast({ title: 'Exam type deleted successfully' });
        fetchExamTypes();
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

  const handleQuickAdd = async (type) => {
    setSaving(true);
    try {
      const response = await examTypeService.create({
        ...type,
        is_published_to_parent: true,
        display_in_report_card: true,
        is_active: true
      });
      if (response.success) {
        toast({ title: `${type.type_name} added successfully` });
        fetchExamTypes();
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleSeedDefaults = async () => {
    setSeeding(true);
    try {
      const response = await examTypeService.seedDefaults();
      if (response.success) {
        toast({ title: 'Default exam types seeded successfully', description: `Created ${response.data?.length || 0} exam type(s)` });
        fetchExamTypes();
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setSeeding(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Exam Type Master</h1>
            <p className="text-muted-foreground">Configure examination types and assessments</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleSeedDefaults} 
              disabled={seeding}
            >
              {seeding ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              Seed Defaults
            </Button>
            <Button variant="outline" onClick={fetchExamTypes} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Section */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5" />
                  {editMode ? 'Edit Exam Type' : 'Add Exam Type'}
                </CardTitle>
                <CardDescription>
                  Define exam type with weightage and settings
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="type_name">Type Name <span className="text-destructive">*</span></Label>
                    <Input
                      id="type_name"
                      {...register('type_name', { required: 'Type name is required' })}
                      placeholder="e.g. Unit Test 1, FA1"
                      className={errors.type_name ? 'border-destructive' : ''}
                    />
                    {errors.type_name && (
                      <span className="text-xs text-destructive">{errors.type_name.message}</span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type_code">Type Code</Label>
                    <Input
                      id="type_code"
                      {...register('type_code')}
                      placeholder="e.g. UT1, FA1"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Category <span className="text-destructive">*</span></Label>
                    <Select
                      value={watch('category')}
                      onValueChange={(value) => setValue('category', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="weightage">Weightage (%)</Label>
                      <Input
                        id="weightage"
                        type="number"
                        min="0"
                        max="100"
                        {...register('weightage', { valueAsNumber: true })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="max_marks">Max Marks</Label>
                      <Input
                        id="max_marks"
                        type="number"
                        min="0"
                        {...register('max_marks', { valueAsNumber: true })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      {...register('description')}
                      placeholder="Optional description..."
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="is_published_to_parent">Publish to Parents</Label>
                    <Switch
                      id="is_published_to_parent"
                      checked={watch('is_published_to_parent')}
                      onCheckedChange={(checked) => setValue('is_published_to_parent', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="display_in_report_card">Display in Report Card</Label>
                    <Switch
                      id="display_in_report_card"
                      checked={watch('display_in_report_card')}
                      onCheckedChange={(checked) => setValue('display_in_report_card', checked)}
                    />
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
                      {saving ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      {editMode ? 'Update' : 'Save'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Quick Add Section */}
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="text-sm">Quick Add Exam Types</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="flex flex-wrap gap-2">
                  {quickTypes.map((type) => (
                    <Button
                      key={type.type_code}
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickAdd(type)}
                      disabled={saving || examTypes.some(t => t.type_code === type.type_code)}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      {type.type_name}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* List Section */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="border-b">
                <CardTitle>Exam Type List</CardTitle>
                <CardDescription>{examTypes.length} exam type(s) configured</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                ) : examTypes.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No exam types configured yet</p>
                    <p className="text-sm">Add exam types or use "Seed Defaults" button</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type Name</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Weightage</TableHead>
                        <TableHead>Max Marks</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {examTypes.map((type) => (
                        <TableRow key={type.id}>
                          <TableCell className="font-medium">{type.type_name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{type.type_code}</Badge>
                          </TableCell>
                          <TableCell>
                            {getCategoryBadge(type.category)}
                          </TableCell>
                          <TableCell>{type.weightage}%</TableCell>
                          <TableCell>{type.max_marks}</TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <Badge variant={type.is_active ? 'default' : 'secondary'} className="text-xs">
                                {type.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                              {type.is_published_to_parent && (
                                <Badge variant="outline" className="text-xs">Parent View</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(type)}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteClick(type.id)}
                                className="text-destructive hover:text-destructive"
                              >
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Exam Type</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this exam type? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default ExamTypeMaster;
