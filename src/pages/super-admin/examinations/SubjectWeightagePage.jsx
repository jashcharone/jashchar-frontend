/**
 * Subject Weightage Page
 * Configure weightage/marks distribution for subjects in exams
 * @file jashchar-frontend/src/pages/super-admin/examinations/SubjectWeightagePage.jsx
 * @date 2026-03-14
 */

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Loader2, Pencil, Trash2, Save, X, Scale, RefreshCw } from 'lucide-react';
import { subjectWeightageService, examGroupService } from '@/services/examinationService';

const SubjectWeightagePage = () => {
  const { toast } = useToast();
  const [weightages, setWeightages] = useState([]);
  const [examGroups, setExamGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      exam_group_id: '',
      subject_name: '',
      theory_marks: 100,
      practical_marks: 0,
      internal_marks: 0,
      total_marks: 100,
      weightage_percentage: 100,
      credit_hours: 0,
      is_optional: false,
      is_active: true,
    }
  });

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [wRes, gRes] = await Promise.all([
        subjectWeightageService.getAll(),
        examGroupService.getAll()
      ]);
      if (wRes.success) setWeightages(wRes.data || []);
      if (gRes.success) setExamGroups(gRes.data || []);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      data.total_marks = (data.theory_marks || 0) + (data.practical_marks || 0) + (data.internal_marks || 0);
      let response;
      if (editMode && editingId) {
        response = await subjectWeightageService.update(editingId, data);
      } else {
        response = await subjectWeightageService.create(data);
      }
      if (response.success) {
        toast({ title: response.message || 'Subject weightage saved successfully' });
        reset();
        setEditMode(false);
        setEditingId(null);
        fetchAll();
      } else {
        throw new Error(response.error || 'Failed to save');
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (w) => {
    setEditMode(true);
    setEditingId(w.id);
    setValue('exam_group_id', w.exam_group_id);
    setValue('subject_name', w.subject_name);
    setValue('theory_marks', w.theory_marks);
    setValue('practical_marks', w.practical_marks);
    setValue('internal_marks', w.internal_marks);
    setValue('total_marks', w.total_marks);
    setValue('weightage_percentage', w.weightage_percentage);
    setValue('credit_hours', w.credit_hours);
    setValue('is_optional', w.is_optional);
    setValue('is_active', w.is_active);
  };

  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setIsDeleteAlertOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      const response = await subjectWeightageService.delete(deleteId);
      if (response.success) {
        toast({ title: 'Subject weightage deleted successfully' });
        fetchAll();
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
            <h1 className="text-2xl font-bold text-foreground">Subject Weightage</h1>
            <p className="text-muted-foreground">Configure marks distribution for subjects (Theory, Practical, Internal)</p>
          </div>
          <Button variant="outline" onClick={fetchAll} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2">
                  <Scale className="w-5 h-5" />
                  {editMode ? 'Edit Weightage' : 'Add Weightage'}
                </CardTitle>
                <CardDescription>Set marks distribution per subject</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Exam Group</Label>
                    <Select value={watch('exam_group_id')} onValueChange={(val) => setValue('exam_group_id', val)}>
                      <SelectTrigger><SelectValue placeholder="Select exam group" /></SelectTrigger>
                      <SelectContent>
                        {examGroups.map((g) => (
                          <SelectItem key={g.id} value={g.id}>{g.group_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject_name">Subject Name <span className="text-destructive">*</span></Label>
                    <Input id="subject_name" {...register('subject_name', { required: 'Subject name is required' })} placeholder="e.g. Mathematics" className={errors.subject_name ? 'border-destructive' : ''} />
                    {errors.subject_name && <span className="text-xs text-destructive">{errors.subject_name.message}</span>}
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label>Theory</Label>
                      <Input type="number" min="0" {...register('theory_marks', { valueAsNumber: true })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Practical</Label>
                      <Input type="number" min="0" {...register('practical_marks', { valueAsNumber: true })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Internal</Label>
                      <Input type="number" min="0" {...register('internal_marks', { valueAsNumber: true })} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Weightage %</Label>
                      <Input type="number" min="0" max="100" step="0.01" {...register('weightage_percentage', { valueAsNumber: true })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Credit Hours</Label>
                      <Input type="number" min="0" {...register('credit_hours', { valueAsNumber: true })} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Optional Subject</Label>
                    <Switch checked={watch('is_optional')} onCheckedChange={(v) => setValue('is_optional', v)} />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Active</Label>
                    <Switch checked={watch('is_active')} onCheckedChange={(v) => setValue('is_active', v)} />
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    {editMode && <Button type="button" variant="outline" onClick={handleReset}><X className="w-4 h-4 mr-2" /> Cancel</Button>}
                    <Button type="submit" disabled={saving}>
                      {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                      {editMode ? 'Update' : 'Save'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="border-b">
                <CardTitle>Subject Weightage List ({weightages.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
                ) : weightages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Scale className="w-12 h-12 mb-4 opacity-50" /><p>No subject weightages configured yet</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Subject</TableHead>
                        <TableHead>Theory</TableHead>
                        <TableHead>Practical</TableHead>
                        <TableHead>Internal</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Weight %</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {weightages.map((w) => (
                        <TableRow key={w.id}>
                          <TableCell className="font-medium">{w.subject_name} {w.is_optional && <Badge variant="outline" className="ml-1">Optional</Badge>}</TableCell>
                          <TableCell>{w.theory_marks}</TableCell>
                          <TableCell>{w.practical_marks}</TableCell>
                          <TableCell>{w.internal_marks}</TableCell>
                          <TableCell className="font-semibold">{w.total_marks}</TableCell>
                          <TableCell>{w.weightage_percentage}%</TableCell>
                          <TableCell><Badge variant={w.is_active ? 'default' : 'secondary'}>{w.is_active ? 'Active' : 'Inactive'}</Badge></TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(w)}><Pencil className="w-4 h-4" /></Button>
                              <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDeleteClick(w.id)}><Trash2 className="w-4 h-4" /></Button>
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
            <AlertDialogTitle>Delete Subject Weightage?</AlertDialogTitle>
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

export default SubjectWeightagePage;
