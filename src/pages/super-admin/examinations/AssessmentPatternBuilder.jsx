/**
 * Assessment Pattern Builder
 * Define assessment patterns (theory/practical/internal split, etc.)
 * @file jashchar-frontend/src/pages/super-admin/examinations/AssessmentPatternBuilder.jsx
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
import { Loader2, Pencil, Trash2, Save, X, ClipboardList, RefreshCw, Plus } from 'lucide-react';
import { assessmentPatternService } from '@/services/examinationService';

const AssessmentPatternBuilder = () => {
  const { toast } = useToast();
  const [patterns, setPatterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [components, setComponents] = useState([{ component_name: 'Theory', max_marks: 100, weightage: 100 }]);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      pattern_name: '',
      pattern_code: '',
      description: '',
      total_marks: 100,
      is_active: true,
    }
  });

  useEffect(() => {
    fetchPatterns();
  }, []);

  const fetchPatterns = async () => {
    setLoading(true);
    try {
      const response = await assessmentPatternService.getAll();
      if (response.success) setPatterns(response.data || []);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const addComponent = () => {
    setComponents([...components, { component_name: '', max_marks: 0, weightage: 0 }]);
  };

  const removeComponent = (index) => {
    if (components.length > 1) {
      setComponents(components.filter((_, i) => i !== index));
    }
  };

  const updateComponent = (index, field, value) => {
    const updated = [...components];
    updated[index][field] = value;
    setComponents(updated);
  };

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      const payload = {
        ...data,
        components: components,
        total_marks: components.reduce((sum, c) => sum + (Number(c.max_marks) || 0), 0)
      };
      let response;
      if (editMode && editingId) {
        response = await assessmentPatternService.update(editingId, payload);
      } else {
        response = await assessmentPatternService.create(payload);
      }
      if (response.success) {
        toast({ title: response.message || 'Assessment pattern saved successfully' });
        reset();
        setComponents([{ component_name: 'Theory', max_marks: 100, weightage: 100 }]);
        setEditMode(false);
        setEditingId(null);
        fetchPatterns();
      } else {
        throw new Error(response.error || 'Failed to save');
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (p) => {
    setEditMode(true);
    setEditingId(p.id);
    setValue('pattern_name', p.pattern_name);
    setValue('pattern_code', p.pattern_code);
    setValue('description', p.description || '');
    setValue('total_marks', p.total_marks);
    setValue('is_active', p.is_active);
    setComponents(p.components || [{ component_name: 'Theory', max_marks: 100, weightage: 100 }]);
  };

  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setIsDeleteAlertOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      const response = await assessmentPatternService.delete(deleteId);
      if (response.success) {
        toast({ title: 'Assessment pattern deleted successfully' });
        fetchPatterns();
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
    setComponents([{ component_name: 'Theory', max_marks: 100, weightage: 100 }]);
    setEditMode(false);
    setEditingId(null);
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Assessment Pattern Builder</h1>
            <p className="text-muted-foreground">Define assessment patterns with component-wise marks distribution</p>
          </div>
          <Button variant="outline" onClick={fetchPatterns} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="w-5 h-5" />
                  {editMode ? 'Edit Pattern' : 'Add Pattern'}
                </CardTitle>
                <CardDescription>Configure assessment components</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="pattern_name">Pattern Name <span className="text-destructive">*</span></Label>
                    <Input id="pattern_name" {...register('pattern_name', { required: 'Pattern name is required' })} placeholder="e.g. Theory + Practical" className={errors.pattern_name ? 'border-destructive' : ''} />
                    {errors.pattern_name && <span className="text-xs text-destructive">{errors.pattern_name.message}</span>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pattern_code">Pattern Code</Label>
                    <Input id="pattern_code" {...register('pattern_code')} placeholder="e.g. TP-80-20" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label>Components</Label>
                      <Button type="button" variant="outline" size="sm" onClick={addComponent}><Plus className="w-3 h-3 mr-1" /> Add</Button>
                    </div>
                    <div className="space-y-2">
                      {components.map((comp, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <Input
                            placeholder="Name"
                            value={comp.component_name}
                            onChange={(e) => updateComponent(idx, 'component_name', e.target.value)}
                            className="flex-1"
                          />
                          <Input
                            type="number" min="0"
                            placeholder="Marks"
                            value={comp.max_marks}
                            onChange={(e) => updateComponent(idx, 'max_marks', Number(e.target.value))}
                            className="w-20"
                          />
                          <Input
                            type="number" min="0" max="100"
                            placeholder="%"
                            value={comp.weightage}
                            onChange={(e) => updateComponent(idx, 'weightage', Number(e.target.value))}
                            className="w-16"
                          />
                          {components.length > 1 && (
                            <Button type="button" variant="ghost" size="sm" onClick={() => removeComponent(idx)}>
                              <X className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea {...register('description')} placeholder="Optional description" />
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
                <CardTitle>Assessment Patterns ({patterns.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
                ) : patterns.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <ClipboardList className="w-12 h-12 mb-4 opacity-50" /><p>No assessment patterns configured yet</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Pattern Name</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Components</TableHead>
                        <TableHead>Total Marks</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {patterns.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">{p.pattern_name}</TableCell>
                          <TableCell>{p.pattern_code}</TableCell>
                          <TableCell>
                            {(p.components || []).map((c, i) => (
                              <Badge key={i} variant="outline" className="mr-1">{c.component_name}: {c.max_marks}</Badge>
                            ))}
                          </TableCell>
                          <TableCell className="font-semibold">{p.total_marks}</TableCell>
                          <TableCell><Badge variant={p.is_active ? 'default' : 'secondary'}>{p.is_active ? 'Active' : 'Inactive'}</Badge></TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(p)}><Pencil className="w-4 h-4" /></Button>
                              <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDeleteClick(p.id)}><Trash2 className="w-4 h-4" /></Button>
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
            <AlertDialogTitle>Delete Assessment Pattern?</AlertDialogTitle>
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

export default AssessmentPatternBuilder;
