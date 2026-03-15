/**
 * Question Blueprint Page
 * Define question paper blueprints with chapter/topic wise marks distribution
 * @file jashchar-frontend/src/pages/super-admin/examinations/QuestionBlueprintPage.jsx
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
import { Loader2, Pencil, Trash2, Save, X, FileText, RefreshCw, Plus } from 'lucide-react';
import { questionBlueprintService } from '@/services/examinationService';

const QuestionBlueprintPage = () => {
  const { toast } = useToast();
  const [blueprints, setBlueprints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [sections, setSections] = useState([
    { section_name: 'Section A', question_type: 'MCQ', num_questions: 10, marks_per_question: 1, total_marks: 10 }
  ]);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      blueprint_name: '',
      subject_name: '',
      total_marks: 100,
      duration_minutes: 180,
      description: '',
      is_active: true,
    }
  });

  useEffect(() => {
    fetchBlueprints();
  }, []);

  const fetchBlueprints = async () => {
    setLoading(true);
    try {
      const response = await questionBlueprintService.getAll();
      if (response.success) setBlueprints(response.data || []);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const addSection = () => {
    setSections([...sections, { section_name: '', question_type: '', num_questions: 0, marks_per_question: 0, total_marks: 0 }]);
  };

  const removeSection = (index) => {
    if (sections.length > 1) setSections(sections.filter((_, i) => i !== index));
  };

  const updateSection = (index, field, value) => {
    const updated = [...sections];
    updated[index][field] = value;
    if (field === 'num_questions' || field === 'marks_per_question') {
      updated[index].total_marks = (Number(updated[index].num_questions) || 0) * (Number(updated[index].marks_per_question) || 0);
    }
    setSections(updated);
  };

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      const payload = {
        ...data,
        sections: sections,
        total_marks: sections.reduce((sum, s) => sum + (Number(s.total_marks) || 0), 0)
      };
      let response;
      if (editMode && editingId) {
        response = await questionBlueprintService.update(editingId, payload);
      } else {
        response = await questionBlueprintService.create(payload);
      }
      if (response.success) {
        toast({ title: response.message || 'Question blueprint saved successfully' });
        reset();
        setSections([{ section_name: 'Section A', question_type: 'MCQ', num_questions: 10, marks_per_question: 1, total_marks: 10 }]);
        setEditMode(false);
        setEditingId(null);
        fetchBlueprints();
      } else {
        throw new Error(response.error || 'Failed to save');
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (bp) => {
    setEditMode(true);
    setEditingId(bp.id);
    setValue('blueprint_name', bp.blueprint_name);
    setValue('subject_name', bp.subject_name);
    setValue('total_marks', bp.total_marks);
    setValue('duration_minutes', bp.duration_minutes);
    setValue('description', bp.description || '');
    setValue('is_active', bp.is_active);
    setSections(bp.sections || [{ section_name: 'Section A', question_type: 'MCQ', num_questions: 10, marks_per_question: 1, total_marks: 10 }]);
  };

  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setIsDeleteAlertOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      const response = await questionBlueprintService.delete(deleteId);
      if (response.success) {
        toast({ title: 'Question blueprint deleted successfully' });
        fetchBlueprints();
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
    setSections([{ section_name: 'Section A', question_type: 'MCQ', num_questions: 10, marks_per_question: 1, total_marks: 10 }]);
    setEditMode(false);
    setEditingId(null);
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Question Blueprint</h1>
            <p className="text-muted-foreground">Define question paper blueprints with section-wise distribution</p>
          </div>
          <Button variant="outline" onClick={fetchBlueprints} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  {editMode ? 'Edit Blueprint' : 'Add Blueprint'}
                </CardTitle>
                <CardDescription>Configure question paper structure</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="blueprint_name">Blueprint Name <span className="text-destructive">*</span></Label>
                    <Input id="blueprint_name" {...register('blueprint_name', { required: 'Blueprint name is required' })} placeholder="e.g. Class 10 Maths Blueprint" className={errors.blueprint_name ? 'border-destructive' : ''} />
                    {errors.blueprint_name && <span className="text-xs text-destructive">{errors.blueprint_name.message}</span>}
                  </div>

                  <div className="space-y-2">
                    <Label>Subject</Label>
                    <Input {...register('subject_name')} placeholder="e.g. Mathematics" />
                  </div>

                  <div className="space-y-2">
                    <Label>Duration (minutes)</Label>
                    <Input type="number" min="0" {...register('duration_minutes', { valueAsNumber: true })} />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label>Sections</Label>
                      <Button type="button" variant="outline" size="sm" onClick={addSection}><Plus className="w-3 h-3 mr-1" /> Add</Button>
                    </div>
                    <div className="space-y-3">
                      {sections.map((sec, idx) => (
                        <div key={idx} className="border rounded-md p-3 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Section {idx + 1}</span>
                            {sections.length > 1 && <Button type="button" variant="ghost" size="sm" onClick={() => removeSection(idx)}><X className="w-3 h-3" /></Button>}
                          </div>
                          <Input placeholder="Section Name" value={sec.section_name} onChange={(e) => updateSection(idx, 'section_name', e.target.value)} />
                          <Input placeholder="Question Type (MCQ, Short, Long)" value={sec.question_type} onChange={(e) => updateSection(idx, 'question_type', e.target.value)} />
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <Label className="text-xs">Questions</Label>
                              <Input type="number" min="0" value={sec.num_questions} onChange={(e) => updateSection(idx, 'num_questions', Number(e.target.value))} />
                            </div>
                            <div>
                              <Label className="text-xs">Marks Each</Label>
                              <Input type="number" min="0" value={sec.marks_per_question} onChange={(e) => updateSection(idx, 'marks_per_question', Number(e.target.value))} />
                            </div>
                            <div>
                              <Label className="text-xs">Total</Label>
                              <Input type="number" value={sec.total_marks} readOnly className="bg-muted" />
                            </div>
                          </div>
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
                <CardTitle>Question Blueprints ({blueprints.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
                ) : blueprints.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <FileText className="w-12 h-12 mb-4 opacity-50" /><p>No question blueprints configured yet</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Blueprint Name</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Total Marks</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Sections</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {blueprints.map((bp) => (
                        <TableRow key={bp.id}>
                          <TableCell className="font-medium">{bp.blueprint_name}</TableCell>
                          <TableCell>{bp.subject_name}</TableCell>
                          <TableCell className="font-semibold">{bp.total_marks}</TableCell>
                          <TableCell>{bp.duration_minutes} min</TableCell>
                          <TableCell>{(bp.sections || []).length} sections</TableCell>
                          <TableCell><Badge variant={bp.is_active ? 'default' : 'secondary'}>{bp.is_active ? 'Active' : 'Inactive'}</Badge></TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(bp)}><Pencil className="w-4 h-4" /></Button>
                              <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDeleteClick(bp.id)}><Trash2 className="w-4 h-4" /></Button>
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
            <AlertDialogTitle>Delete Question Blueprint?</AlertDialogTitle>
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

export default QuestionBlueprintPage;
