import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
} from "@/components/ui/alert-dialog";
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { Loader2, Pencil, Trash2, Save, X, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const examTypes = [
  "General Purpose (Pass/Fail)",
  "School Based Grading System",
  "College Based Grading System",
  "GPA Grading System",
  "Average Passing"
];

const ExamGroup = () => {
  const { user, currentSessionId, organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { roleSlug } = useParams();
  const [examGroups, setExamGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Delete Dialog State
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      exam_type: '',
      description: ''
    }
  });

  const branchId = user?.profile?.branch_id;

  useEffect(() => {
    if (branchId && selectedBranch?.id) {
      fetchExamGroups();
    }
  }, [branchId, selectedBranch?.id]);

  const fetchExamGroups = async () => {
    if (!selectedBranch?.id) return;
    setLoading(true);
    // Fetch groups and count exams - filter by session
    let query = supabase
      .from('exam_groups')
      .select(`
        *,
        exams:exams(count)
      `)
      .eq('branch_id', branchId)
      .eq('branch_id', selectedBranch.id);
    
    // Add session filter if available
    if (currentSessionId) {
      query = query.eq('session_id', currentSessionId);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      toast({ variant: 'destructive', title: 'Error fetching exam groups', description: error.message });
    } else {
      const groupsWithCount = data.map(g => ({
        ...g,
        exam_count: g.exams ? g.exams[0]?.count : 0
      }));
      setExamGroups(groupsWithCount || []);
    }
    setLoading(false);
  };

  const onSubmit = async (data) => {
    if (!selectedBranch?.id) {
      toast({ variant: 'destructive', title: 'Error', description: 'Branch not selected' });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...data,
        branch_id: selectedBranch.id,
        session_id: currentSessionId,
        organization_id: organizationId
      };

      let error;
      if (editMode && editingId) {
        const { error: updateError } = await supabase
          .from('exam_groups')
          .update(payload)
          .eq('id', editingId);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('exam_groups')
          .insert([payload]);
        error = insertError;
      }

      if (error) throw error;

      toast({ title: editMode ? 'Exam group updated successfully' : 'Exam group added successfully' });
      reset();
      setEditMode(false);
      setEditingId(null);
      fetchExamGroups();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error saving exam group', description: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (group) => {
    setEditMode(true);
    setEditingId(group.id);
    setValue('name', group.name);
    setValue('exam_type', group.exam_type);
    setValue('description', group.description);
  };

  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setIsDeleteAlertOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    
    try {
      const { error } = await supabase.from('exam_groups').delete().eq('id', deleteId);
      if (error) throw error;
      toast({ title: 'Exam group deleted successfully' });
      fetchExamGroups();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error deleting exam group', description: error.message });
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
        {/* Form Section */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="border-b">
              <CardTitle>{editMode ? 'Edit Exam Group' : 'Add Exam Group'}</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label>Name <span className="text-red-500">*</span></Label>
                  <Input {...register('name', { required: true })} placeholder="e.g. Class 1 (Pass/Fail)" className={errors.name ? "border-red-500" : ""} />
                  {errors.name && <span className="text-xs text-red-500">Name is required</span>}
                </div>

                <div className="space-y-2">
                  <Label>Exam Type <span className="text-red-500">*</span></Label>
                  <Select onValueChange={(val) => setValue('exam_type', val)} value={watch('exam_type')}>
                    <SelectTrigger className={errors.exam_type ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select Exam Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {examTypes.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <input type="hidden" {...register('exam_type', { required: true })} />
                  {errors.exam_type && <span className="text-xs text-red-500">Exam Type is required</span>}
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea {...register('description')} placeholder="Description..." />
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
              <CardTitle>Exam Group List</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>No Of Exams</TableHead>
                      <TableHead>Exam Type</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8"><Loader2 className="animate-spin mx-auto" /></TableCell>
                      </TableRow>
                    ) : examGroups.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No exam groups found</TableCell>
                      </TableRow>
                    ) : (
                      examGroups.map((group) => (
                        <TableRow key={group.id}>
                          <TableCell className="font-medium">{group.name}</TableCell>
                          <TableCell>{group.exam_count || 0}</TableCell>
                          <TableCell>{group.exam_type}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                               <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" onClick={() => navigate(`/${roleSlug || 'super-admin'}/examinations/exam-group/${group.id}/exams`)}>
                                      <Plus className="h-4 w-4 text-green-600" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Add/View Exams</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              
                              <Button variant="ghost" size="icon" onClick={() => handleEdit(group)}>
                                <Pencil className="h-4 w-4 text-blue-500" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(group.id)}>
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the exam group and all exams associated with it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default ExamGroup;
