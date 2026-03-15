/**
 * Term Management Page
 * Manage academic terms/semesters
 * @file jashchar-frontend/src/pages/super-admin/examinations/TermManagement.jsx
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
import { Loader2, Pencil, Trash2, Save, X, Plus, Calendar, CheckCircle, RefreshCw } from 'lucide-react';
import { termService } from '@/services/examinationService';
import { formatDate, formatDateForInput } from '@/utils/dateUtils';
import DatePicker from '@/components/ui/DatePicker';

const quickTerms = [
  { term_name: 'Term 1', term_code: 'T1', sequence_order: 1 },
  { term_name: 'Term 2', term_code: 'T2', sequence_order: 2 },
  { term_name: 'Semester 1', term_code: 'SEM1', sequence_order: 1 },
  { term_name: 'Semester 2', term_code: 'SEM2', sequence_order: 2 },
  { term_name: 'First Term', term_code: 'F1', sequence_order: 1 },
  { term_name: 'Mid Term', term_code: 'MID', sequence_order: 2 },
  { term_name: 'Final Term', term_code: 'FINAL', sequence_order: 3 },
];

const TermManagement = () => {
  const { toast } = useToast();
  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      term_name: '',
      term_code: '',
      start_date: '',
      end_date: '',
      sequence_order: 1,
      description: '',
      is_current: false,
      is_active: true,
    }
  });

  useEffect(() => {
    fetchTerms();
  }, []);

  const fetchTerms = async () => {
    setLoading(true);
    try {
      const response = await termService.getAll();
      if (response.success) {
        setTerms(response.data || []);
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    // Validate dates
    if (data.start_date && data.end_date && new Date(data.end_date) < new Date(data.start_date)) {
      toast({ variant: 'destructive', title: 'Error', description: 'End date must be after start date' });
      return;
    }

    setSaving(true);
    try {
      let response;
      if (editMode && editingId) {
        response = await termService.update(editingId, data);
      } else {
        response = await termService.create(data);
      }

      if (response.success) {
        toast({ title: response.message || 'Term saved successfully' });
        reset();
        setEditMode(false);
        setEditingId(null);
        fetchTerms();
      } else {
        throw new Error(response.error || 'Failed to save');
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (term) => {
    setEditMode(true);
    setEditingId(term.id);
    setValue('term_name', term.term_name);
    setValue('term_code', term.term_code);
    setValue('start_date', term.start_date ? formatDateForInput(term.start_date) : '');
    setValue('end_date', term.end_date ? formatDateForInput(term.end_date) : '');
    setValue('sequence_order', term.sequence_order);
    setValue('description', term.description || '');
    setValue('is_current', term.is_current);
    setValue('is_active', term.is_active);
  };

  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setIsDeleteAlertOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      const response = await termService.delete(deleteId);
      if (response.success) {
        toast({ title: 'Term deleted successfully' });
        fetchTerms();
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

  const handleQuickAdd = async (term) => {
    setSaving(true);
    try {
      const response = await termService.create({
        ...term,
        is_active: true,
        is_current: false
      });
      if (response.success) {
        toast({ title: `${term.term_name} added successfully` });
        fetchTerms();
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleSetCurrent = async (term) => {
    try {
      const response = await termService.update(term.id, { is_current: true });
      if (response.success) {
        toast({ title: `${term.term_name} set as current term` });
        fetchTerms();
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Term Management</h1>
            <p className="text-muted-foreground">Manage academic terms and semesters</p>
          </div>
          <Button variant="outline" onClick={fetchTerms} disabled={loading}>
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
                  <Calendar className="w-5 h-5" />
                  {editMode ? 'Edit Term' : 'Add Term'}
                </CardTitle>
                <CardDescription>
                  Configure academic term/semester
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="term_name">Term Name <span className="text-destructive">*</span></Label>
                    <Input
                      id="term_name"
                      {...register('term_name', { required: 'Term name is required' })}
                      placeholder="e.g. Term 1, Semester 1"
                      className={errors.term_name ? 'border-destructive' : ''}
                    />
                    {errors.term_name && (
                      <span className="text-xs text-destructive">{errors.term_name.message}</span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="term_code">Term Code</Label>
                    <Input
                      id="term_code"
                      {...register('term_code')}
                      placeholder="e.g. T1, SEM1"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <DatePicker
                        id="start_date"
                        label="Start Date"
                        value={watch('start_date')}
                        onChange={(date) => setValue('start_date', date)}
                      />
                    </div>
                    <div className="space-y-2">
                      <DatePicker
                        id="end_date"
                        label="End Date"
                        value={watch('end_date')}
                        onChange={(date) => setValue('end_date', date)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sequence_order">Sequence Order</Label>
                    <Input
                      id="sequence_order"
                      type="number"
                      min="1"
                      {...register('sequence_order', { valueAsNumber: true })}
                    />
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
                    <Label htmlFor="is_current">Current Term</Label>
                    <Switch
                      id="is_current"
                      checked={watch('is_current')}
                      onCheckedChange={(checked) => setValue('is_current', checked)}
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
                <CardTitle className="text-sm">Quick Add Terms</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="flex flex-wrap gap-2">
                  {quickTerms.map((term) => (
                    <Button
                      key={term.term_code}
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickAdd(term)}
                      disabled={saving || terms.some(t => t.term_code === term.term_code)}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      {term.term_name}
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
                <CardTitle>Term List</CardTitle>
                <CardDescription>{terms.length} term(s) configured</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                ) : terms.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No terms configured yet</p>
                    <p className="text-sm">Add a term using the form or quick add buttons</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>Term Name</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {terms.map((term) => (
                        <TableRow key={term.id}>
                          <TableCell>{term.sequence_order}</TableCell>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {term.term_name}
                              {term.is_current && (
                                <Badge variant="default" className="bg-green-500">Current</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{term.term_code}</Badge>
                          </TableCell>
                          <TableCell>
                            {term.start_date && term.end_date ? (
                              <span className="text-sm">
                                {formatDate(term.start_date)} - {formatDate(term.end_date)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">Not set</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={term.is_active ? 'default' : 'secondary'}>
                              {term.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {!term.is_current && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleSetCurrent(term)}
                                  title="Set as current term"
                                >
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(term)}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteClick(term.id)}
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
            <AlertDialogTitle>Delete Term</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this term? This action cannot be undone.
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

export default TermManagement;
