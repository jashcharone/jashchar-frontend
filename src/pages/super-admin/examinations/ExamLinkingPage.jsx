/**
 * Exam Linking Page
 * Link exams across terms/sessions for result consolidation
 * @file jashchar-frontend/src/pages/super-admin/examinations/ExamLinkingPage.jsx
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
import { Loader2, Pencil, Trash2, Save, X, Link2, RefreshCw } from 'lucide-react';
import { examLinkingService, examService, termService } from '@/services/examinationService';

const ExamLinkingPage = () => {
  const { toast } = useToast();
  const [links, setLinks] = useState([]);
  const [exams, setExams] = useState([]);
  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      link_name: '',
      source_exam_id: '',
      target_exam_id: '',
      link_type: 'consolidation',
      weightage_source: 50,
      weightage_target: 50,
      description: '',
      is_active: true,
    }
  });

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [lRes, eRes, tRes] = await Promise.all([
        examLinkingService.getAll(),
        examService.getAll(),
        termService.getAll()
      ]);
      if (lRes.success) setLinks(lRes.data || []);
      if (eRes.success) setExams(eRes.data || []);
      if (tRes.success) setTerms(tRes.data || []);
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
        response = await examLinkingService.update(editingId, data);
      } else {
        response = await examLinkingService.create(data);
      }
      if (response.success) {
        toast({ title: response.message || 'Exam link saved successfully' });
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

  const handleEdit = (link) => {
    setEditMode(true);
    setEditingId(link.id);
    setValue('link_name', link.link_name);
    setValue('source_exam_id', link.source_exam_id);
    setValue('target_exam_id', link.target_exam_id);
    setValue('link_type', link.link_type);
    setValue('weightage_source', link.weightage_source);
    setValue('weightage_target', link.weightage_target);
    setValue('description', link.description || '');
    setValue('is_active', link.is_active);
  };

  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setIsDeleteAlertOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      const response = await examLinkingService.delete(deleteId);
      if (response.success) {
        toast({ title: 'Exam link deleted successfully' });
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

  const getExamName = (id) => exams.find(e => e.id === id)?.exam_name || id;

  const linkTypes = [
    { value: 'consolidation', label: 'Result Consolidation' },
    { value: 'prerequisite', label: 'Prerequisite' },
    { value: 'supplement', label: 'Supplementary' },
    { value: 'improvement', label: 'Improvement' },
  ];

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Exam Linking</h1>
            <p className="text-muted-foreground">Link exams across terms for result consolidation and prerequisites</p>
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
                  <Link2 className="w-5 h-5" />
                  {editMode ? 'Edit Link' : 'Create Link'}
                </CardTitle>
                <CardDescription>Link two exams together</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="link_name">Link Name <span className="text-destructive">*</span></Label>
                    <Input id="link_name" {...register('link_name', { required: 'Link name is required' })} placeholder="e.g. Term 1 + Term 2 Final" className={errors.link_name ? 'border-destructive' : ''} />
                    {errors.link_name && <span className="text-xs text-destructive">{errors.link_name.message}</span>}
                  </div>

                  <div className="space-y-2">
                    <Label>Source Exam</Label>
                    <Select value={watch('source_exam_id')} onValueChange={(val) => setValue('source_exam_id', val)}>
                      <SelectTrigger><SelectValue placeholder="Select source exam" /></SelectTrigger>
                      <SelectContent>
                        {exams.map((e) => (
                          <SelectItem key={e.id} value={e.id}>{e.exam_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Target Exam</Label>
                    <Select value={watch('target_exam_id')} onValueChange={(val) => setValue('target_exam_id', val)}>
                      <SelectTrigger><SelectValue placeholder="Select target exam" /></SelectTrigger>
                      <SelectContent>
                        {exams.map((e) => (
                          <SelectItem key={e.id} value={e.id}>{e.exam_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Link Type</Label>
                    <Select value={watch('link_type')} onValueChange={(val) => setValue('link_type', val)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {linkTypes.map((t) => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Source Weight %</Label>
                      <Input type="number" min="0" max="100" {...register('weightage_source', { valueAsNumber: true })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Target Weight %</Label>
                      <Input type="number" min="0" max="100" {...register('weightage_target', { valueAsNumber: true })} />
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
                <CardTitle>Exam Links ({links.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
                ) : links.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Link2 className="w-12 h-12 mb-4 opacity-50" /><p>No exam links configured yet</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Link Name</TableHead>
                        <TableHead>Source Exam</TableHead>
                        <TableHead>Target Exam</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Weightage</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {links.map((l) => (
                        <TableRow key={l.id}>
                          <TableCell className="font-medium">{l.link_name}</TableCell>
                          <TableCell>{getExamName(l.source_exam_id)}</TableCell>
                          <TableCell>{getExamName(l.target_exam_id)}</TableCell>
                          <TableCell><Badge variant="outline">{l.link_type}</Badge></TableCell>
                          <TableCell>{l.weightage_source}% / {l.weightage_target}%</TableCell>
                          <TableCell><Badge variant={l.is_active ? 'default' : 'secondary'}>{l.is_active ? 'Active' : 'Inactive'}</Badge></TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(l)}><Pencil className="w-4 h-4" /></Button>
                              <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDeleteClick(l.id)}><Trash2 className="w-4 h-4" /></Button>
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
            <AlertDialogTitle>Delete Exam Link?</AlertDialogTitle>
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

export default ExamLinkingPage;
