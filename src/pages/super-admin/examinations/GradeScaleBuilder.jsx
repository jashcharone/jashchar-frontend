/**
 * Grade Scale Builder Page
 * Build and configure grading scales (CBSE 9-Point, ICSE, GPA, etc.)
 * @file jashchar-frontend/src/pages/super-admin/examinations/GradeScaleBuilder.jsx
 * @date 2026-03-09
 */

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
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
import { 
  Loader2, Pencil, Trash2, Save, X, Plus, Award, RefreshCw, 
  Copy, Download, ChevronDown, ChevronUp 
} from 'lucide-react';
import { gradeScaleService } from '@/services/examinationService';

const GradeScaleBuilder = () => {
  const { toast } = useToast();
  const [gradeScales, setGradeScales] = useState([]);
  const [presets, setPresets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [expandedScale, setExpandedScale] = useState(null);

  const { register, control, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      scale_name: '',
      scale_type: 'letter',
      max_grade_point: 10,
      description: '',
      is_default: false,
      is_active: true,
      grades: [
        { grade: 'A1', min_percentage: 91, max_percentage: 100, grade_point: 10, description: 'Outstanding' }
      ]
    }
  });

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: 'grades'
  });

  useEffect(() => {
    fetchGradeScales();
    fetchPresets();
  }, []);

  const fetchGradeScales = async () => {
    setLoading(true);
    try {
      const response = await gradeScaleService.getAll({ include_details: true });
      if (response.success) {
        // Transform data to normalize field names
        const transformedData = (response.data || []).map(scale => {
          // Handle grades from exam_grade_details
          const grades = scale.exam_grade_details || scale.grades || [];
          // Calculate max_grade_point from grade details if not present
          const maxGradePoint = scale.max_grade_point || (grades.length > 0 ? Math.max(...grades.map(g => g.grade_point || 0)) : 10);
          return {
            ...scale,
            scale_type: scale.scale_type || scale.grading_type || 'points',
            max_grade_point: maxGradePoint,
            grades: grades
          };
        });
        setGradeScales(transformedData);
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const fetchPresets = async () => {
    try {
      const response = await gradeScaleService.getPresets();
      if (response.success && response.data) {
        // Convert object to array
        const presetsArray = Object.values(response.data);
        setPresets(presetsArray);
      }
    } catch (error) {
      console.error('Error fetching presets:', error);
    }
  };

  const onSubmit = async (data) => {
    // Validate grades
    if (!data.grades || data.grades.length === 0) {
      toast({ variant: 'destructive', title: 'Error', description: 'At least one grade is required' });
      return;
    }

    setSaving(true);
    try {
      let response;
      if (editMode && editingId) {
        response = await gradeScaleService.update(editingId, data);
      } else {
        response = await gradeScaleService.create(data);
      }

      if (response.success) {
        toast({ title: response.message || 'Grade scale saved successfully' });
        handleReset();
        fetchGradeScales();
      } else {
        throw new Error(response.error || 'Failed to save');
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (scale) => {
    setEditMode(true);
    setEditingId(scale.id);
    setValue('scale_name', scale.scale_name);
    setValue('scale_type', scale.scale_type || scale.grading_type || 'points');
    setValue('max_grade_point', scale.max_grade_point || 10);
    setValue('description', scale.description || '');
    setValue('is_default', scale.is_default);
    setValue('is_active', scale.is_active);
    
    // Load grade details
    try {
      const response = await gradeScaleService.getById(scale.id);
      if (response.success) {
        const gradeDetails = response.data.exam_grade_details || response.data.grades || [];
        if (gradeDetails.length > 0) {
          replace(gradeDetails.map(g => ({
          grade: g.grade,
          min_percentage: g.min_percentage,
          max_percentage: g.max_percentage,
          grade_point: g.grade_point,
          description: g.description || ''
        })));
        }
      }
    } catch (error) {
      console.error('Error loading grade details:', error);
    }
  };

  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setIsDeleteAlertOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      const response = await gradeScaleService.delete(deleteId);
      if (response.success) {
        toast({ title: 'Grade scale deleted successfully' });
        fetchGradeScales();
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
    replace([{ grade: '', min_percentage: 0, max_percentage: 100, grade_point: 0, description: '' }]);
    setEditMode(false);
    setEditingId(null);
  };

  const handleDuplicate = async (id) => {
    try {
      const response = await gradeScaleService.duplicate(id);
      if (response.success) {
        toast({ title: 'Grade scale duplicated successfully' });
        fetchGradeScales();
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const handleLoadPreset = (preset) => {
    setValue('scale_name', preset.scale_name);
    setValue('scale_type', preset.grading_type === 'gpa' ? 'points' : 'points');
    // Get max grade point from first detail
    const maxGradePoint = preset.details?.[0]?.grade_point || 10;
    setValue('max_grade_point', maxGradePoint);
    setValue('description', preset.description || `${preset.board_type} grading system`);
    // Map details to grades format
    const grades = preset.details?.map(d => ({
      grade: d.grade,
      min_percentage: d.min_percentage,
      max_percentage: d.max_percentage,
      grade_point: d.grade_point,
      description: d.description
    })) || [];
    replace(grades);
    toast({ title: `${preset.scale_name} preset loaded`, description: 'Review and save the grade scale' });
  };

  const addGradeRow = () => {
    append({ grade: '', min_percentage: 0, max_percentage: 100, grade_point: 0, description: '' });
  };

  const toggleExpandScale = async (scaleId) => {
    if (expandedScale === scaleId) {
      setExpandedScale(null);
      return;
    }
    
    // Load grade details for this scale
    try {
      const response = await gradeScaleService.getById(scaleId);
      if (response.success) {
        // Update the scale in the list with grades (handle both field names)
        const gradeDetails = response.data.exam_grade_details || response.data.grades || [];
        setGradeScales(scales => 
          scales.map(s => s.id === scaleId ? { ...s, grades: gradeDetails } : s)
        );
      }
      setExpandedScale(scaleId);
    } catch (error) {
      console.error('Error loading grade details:', error);
    }
  };

  const scaleTypes = [
    { value: 'letter', label: 'Letter Grade (A, B, C...)' },
    { value: 'gpa', label: 'GPA (4.0, 3.5...)' },
    { value: 'percentage', label: 'Percentage-based' },
    { value: 'points', label: 'Points (9-Point, 10-Point)' },
    { value: 'cgpa', label: 'CGPA' },
    { value: 'pass_fail', label: 'Pass/Fail' },
  ];

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Grade Scale Builder</h1>
            <p className="text-muted-foreground">Configure grading scales and grade points</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchGradeScales} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Section */}
          <div className="lg:col-span-1 space-y-4">
            {/* Presets Card */}
            {presets.length > 0 && (
              <Card>
                <CardHeader className="border-b py-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Load Preset
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="flex flex-wrap gap-2">
                    {presets.map((preset) => (
                      <Button
                        key={preset.scale_name}
                        variant="outline"
                        size="sm"
                        onClick={() => handleLoadPreset(preset)}
                      >
                        {preset.scale_name}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Main Form Card */}
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  {editMode ? 'Edit Grade Scale' : 'Add Grade Scale'}
                </CardTitle>
                <CardDescription>
                  Define grading scale and grade details
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="scale_name">Scale Name <span className="text-destructive">*</span></Label>
                    <Input
                      id="scale_name"
                      {...register('scale_name', { required: 'Scale name is required' })}
                      placeholder="e.g. CBSE 9-Point Grading"
                      className={errors.scale_name ? 'border-destructive' : ''}
                    />
                    {errors.scale_name && (
                      <span className="text-xs text-destructive">{errors.scale_name.message}</span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Scale Type</Label>
                    <Select
                      value={watch('scale_type')}
                      onValueChange={(value) => setValue('scale_type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {scaleTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max_grade_point">Max Grade Point</Label>
                    <Input
                      id="max_grade_point"
                      type="number"
                      min="1"
                      max="100"
                      step="0.5"
                      {...register('max_grade_point', { valueAsNumber: true })}
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

                  {/* Grade Details Section */}
                  <div className="space-y-3 pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <Label className="text-base font-semibold">Grade Details</Label>
                      <Button type="button" variant="outline" size="sm" onClick={addGradeRow}>
                        <Plus className="w-4 h-4 mr-1" /> Add Grade
                      </Button>
                    </div>

                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {fields.map((field, index) => (
                        <div key={field.id} className="p-3 border rounded-lg space-y-2 bg-muted/30">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-muted-foreground">Grade #{index + 1}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-destructive"
                              onClick={() => remove(index)}
                              disabled={fields.length <= 1}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              {...register(`grades.${index}.grade`)}
                              placeholder="Grade"
                              className="h-8 text-sm"
                            />
                            <Input
                              {...register(`grades.${index}.grade_point`, { valueAsNumber: true })}
                              type="number"
                              step="0.5"
                              placeholder="Points"
                              className="h-8 text-sm"
                            />
                            <Input
                              {...register(`grades.${index}.min_percentage`, { valueAsNumber: true })}
                              type="number"
                              placeholder="Min %"
                              className="h-8 text-sm"
                            />
                            <Input
                              {...register(`grades.${index}.max_percentage`, { valueAsNumber: true })}
                              type="number"
                              placeholder="Max %"
                              className="h-8 text-sm"
                            />
                          </div>
                          <Input
                            {...register(`grades.${index}.description`)}
                            placeholder="Description (e.g. Outstanding)"
                            className="h-8 text-sm"
                          />
                        </div>
                      ))}
                    </div>
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
          </div>

          {/* List Section */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="border-b">
                <CardTitle>Grade Scale List</CardTitle>
                <CardDescription>{gradeScales.length} grade scale(s) configured</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                ) : gradeScales.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Award className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No grade scales configured yet</p>
                    <p className="text-sm">Add a grade scale or load a preset</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {gradeScales.map((scale) => (
                      <div key={scale.id}>
                        {/* Scale Header Row */}
                        <div className="flex items-center justify-between p-4 hover:bg-muted/50">
                          <div 
                            className="flex-1 cursor-pointer"
                            onClick={() => toggleExpandScale(scale.id)}
                          >
                            <div className="flex items-center gap-3">
                              {expandedScale === scale.id ? (
                                <ChevronUp className="w-4 h-4 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                              )}
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{scale.scale_name}</span>
                                  {scale.is_default && (
                                    <Badge variant="default" className="bg-green-500">Default</Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="outline">{scale.scale_type}</Badge>
                                  <span className="text-sm text-muted-foreground">
                                    Max: {scale.max_grade_point} pts
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={scale.is_active ? 'default' : 'secondary'}>
                              {scale.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDuplicate(scale.id)}
                              title="Duplicate"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(scale)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteClick(scale.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Expanded Grade Details */}
                        {expandedScale === scale.id && scale.grades && (
                          <div className="px-4 pb-4 bg-muted/30">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Grade</TableHead>
                                  <TableHead>Min %</TableHead>
                                  <TableHead>Max %</TableHead>
                                  <TableHead>Points</TableHead>
                                  <TableHead>Description</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {scale.grades.map((grade, idx) => (
                                  <TableRow key={idx}>
                                    <TableCell className="font-medium">
                                      <Badge variant="outline" className="text-base">
                                        {grade.grade}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>{grade.min_percentage}%</TableCell>
                                    <TableCell>{grade.max_percentage}%</TableCell>
                                    <TableCell>{grade.grade_point}</TableCell>
                                    <TableCell className="text-muted-foreground">
                                      {grade.description || '-'}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
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
            <AlertDialogTitle>Delete Grade Scale</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this grade scale? All associated grade details will also be deleted. This action cannot be undone.
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

export default GradeScaleBuilder;
