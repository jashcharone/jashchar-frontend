/**
 * Board Configuration Page
 * Manage examination boards (CBSE, ICSE, State Board, etc.)
 * @file jashchar-frontend/src/pages/super-admin/examinations/BoardConfiguration.jsx
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
import { Loader2, Pencil, Trash2, Save, X, Plus, Building2, Star, RefreshCw } from 'lucide-react';
import { boardConfigService } from '@/services/examinationService';

const gradingSystems = [
  { value: 'numeric', label: 'Numeric (Percentage)' },
  { value: 'letter', label: 'Letter Grades (A, B, C...)' },
  { value: 'gpa', label: 'GPA (10-Point Scale)' },
  { value: 'credit', label: 'Credit-Based (Degree)' },
];

const defaultBoards = [
  { board_name: 'CBSE', board_code: 'CBSE', grading_system: 'letter', passing_percentage: 33 },
  { board_name: 'ICSE', board_code: 'ICSE', grading_system: 'letter', passing_percentage: 35 },
  { board_name: 'State Board', board_code: 'STATE', grading_system: 'numeric', passing_percentage: 35 },
  { board_name: 'Karnataka PU', board_code: 'KPU', grading_system: 'numeric', passing_percentage: 35 },
  { board_name: 'Degree (NEP)', board_code: 'DEGREE', grading_system: 'credit', passing_percentage: 40 },
  { board_name: 'IB', board_code: 'IB', grading_system: 'gpa', passing_percentage: 40 },
  { board_name: 'Custom', board_code: 'CUSTOM', grading_system: 'numeric', passing_percentage: 33 },
];

const BoardConfiguration = () => {
  const { toast } = useToast();
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      board_name: '',
      board_code: '',
      grading_system: 'numeric',
      passing_percentage: 33,
      is_default: false,
      is_active: true,
    }
  });

  useEffect(() => {
    fetchBoards();
  }, []);

  const fetchBoards = async () => {
    setLoading(true);
    try {
      const response = await boardConfigService.getAll();
      if (response.success) {
        setBoards(response.data || []);
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
        response = await boardConfigService.update(editingId, data);
      } else {
        response = await boardConfigService.create(data);
      }

      if (response.success) {
        toast({ title: response.message || 'Board configuration saved successfully' });
        reset();
        setEditMode(false);
        setEditingId(null);
        fetchBoards();
      } else {
        throw new Error(response.error || 'Failed to save');
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (board) => {
    setEditMode(true);
    setEditingId(board.id);
    setValue('board_name', board.board_name);
    setValue('board_code', board.board_code);
    setValue('grading_system', board.grading_system);
    setValue('passing_percentage', board.passing_percentage);
    setValue('is_default', board.is_default);
    setValue('is_active', board.is_active);
  };

  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setIsDeleteAlertOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      const response = await boardConfigService.delete(deleteId);
      if (response.success) {
        toast({ title: 'Board configuration deleted successfully' });
        fetchBoards();
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

  const handleQuickAdd = async (board) => {
    setSaving(true);
    try {
      const response = await boardConfigService.create({
        ...board,
        is_active: true,
        is_default: false
      });
      if (response.success) {
        toast({ title: `${board.board_name} board added successfully` });
        fetchBoards();
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setSaving(false);
    }
  };

  const getGradingLabel = (value) => {
    const system = gradingSystems.find(s => s.value === value);
    return system ? system.label : value;
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Board Configuration</h1>
            <p className="text-muted-foreground">Configure examination boards (CBSE, ICSE, State Board, etc.)</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchBoards} disabled={loading}>
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
                  <Building2 className="w-5 h-5" />
                  {editMode ? 'Edit Board' : 'Add Board'}
                </CardTitle>
                <CardDescription>
                  Configure examination board settings
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="board_name">Board Name <span className="text-destructive">*</span></Label>
                    <Input
                      id="board_name"
                      {...register('board_name', { required: 'Board name is required' })}
                      placeholder="e.g. CBSE, ICSE, State Board"
                      className={errors.board_name ? 'border-destructive' : ''}
                    />
                    {errors.board_name && (
                      <span className="text-xs text-destructive">{errors.board_name.message}</span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="board_code">Board Code</Label>
                    <Input
                      id="board_code"
                      {...register('board_code')}
                      placeholder="e.g. CBSE, ICSE"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="grading_system">Grading System</Label>
                    <Select
                      value={watch('grading_system')}
                      onValueChange={(val) => setValue('grading_system', val)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select grading system" />
                      </SelectTrigger>
                      <SelectContent>
                        {gradingSystems.map((system) => (
                          <SelectItem key={system.value} value={system.value}>
                            {system.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="passing_percentage">Passing Percentage</Label>
                    <Input
                      id="passing_percentage"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      {...register('passing_percentage', { valueAsNumber: true })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="is_default">Set as Default</Label>
                    <Switch
                      id="is_default"
                      checked={watch('is_default')}
                      onCheckedChange={(checked) => setValue('is_default', checked)}
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
                <CardTitle className="text-sm">Quick Add Boards</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="flex flex-wrap gap-2">
                  {defaultBoards.map((board) => (
                    <Button
                      key={board.board_code}
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickAdd(board)}
                      disabled={saving || boards.some(b => b.board_code === board.board_code)}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      {board.board_name}
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
                <CardTitle>Board List</CardTitle>
                <CardDescription>{boards.length} board(s) configured</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                ) : boards.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No boards configured yet</p>
                    <p className="text-sm">Add a board using the form or quick add buttons</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Board Name</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Grading System</TableHead>
                        <TableHead>Passing %</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {boards.map((board) => (
                        <TableRow key={board.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {board.board_name}
                              {board.is_default && (
                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{board.board_code}</Badge>
                          </TableCell>
                          <TableCell>{getGradingLabel(board.grading_system)}</TableCell>
                          <TableCell>{board.passing_percentage}%</TableCell>
                          <TableCell>
                            <Badge variant={board.is_active ? 'default' : 'secondary'}>
                              {board.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(board)}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteClick(board.id)}
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
            <AlertDialogTitle>Delete Board Configuration</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this board configuration? This action cannot be undone.
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

export default BoardConfiguration;
