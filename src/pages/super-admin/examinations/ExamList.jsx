import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { Loader2, Pencil, Trash2, Save, Link as LinkIcon, ArrowLeft, Plus, BookOpen, Calculator } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AssignExamStudentsModal from '@/components/examinations/AssignExamStudentsModal';
import AddExamSubjectsModal from '@/components/examinations/AddExamSubjectsModal';
import EnterMarksModal from '@/components/examinations/EnterMarksModal';
import LinkExamModal from '@/components/examinations/LinkExamModal';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const ExamList = () => {
    const { groupId } = useParams();
    const navigate = useNavigate();
    const { user, currentSessionId, organizationId } = useAuth();
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    
    const [group, setGroup] = useState(null);
    const [exams, setExams] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Modal states
    const [isExamModalOpen, setIsExamModalOpen] = useState(false);
    const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
    const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
    const [isMarksModalOpen, setIsMarksModalOpen] = useState(false);
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);

    const [selectedExam, setSelectedExam] = useState(null);
    const [saving, setSaving] = useState(false);

    // Delete Dialog State
    const [deleteId, setDeleteId] = useState(null);
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

    const branchId = user?.profile?.branch_id;

    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
        defaultValues: {
            name: '',
            session_id: '',
            is_publish: false,
            is_publish_result: false,
            roll_no_type: 'admit_card',
            passing_percentage: '',
            description: ''
        }
    });

    const fetchGroupDetails = useCallback(async () => {
        if (!branchId || !groupId) return;
        const { data } = await supabase.from('exam_groups').select('*').eq('id', groupId).single();
        setGroup(data);
    }, [branchId, groupId]);

    const fetchSessions = useCallback(async () => {
        if (!branchId) return;
        const { data } = await supabase.from('sessions').select('id, name').eq('branch_id', branchId).order('created_at', { ascending: false });
        setSessions(data || []);
    }, [branchId]);

    const fetchExams = useCallback(async () => {
        if (!selectedBranch?.id) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('exams')
            .select(`
                *,
                session:sessions(name),
                student_count:exam_students(count),
                subject_count:exam_subjects(count)
            `)
            .eq('exam_group_id', groupId)
            .eq('branch_id', selectedBranch.id)
            .order('created_at', { ascending: false });
        
        if (error) {
            toast({ variant: 'destructive', title: 'Error fetching exams' });
        } else {
            const examsWithCount = data.map(e => ({
                ...e,
                students_assigned: e.student_count ? e.student_count[0]?.count : 0,
                subjects_included: e.subject_count ? e.subject_count[0]?.count : 0
            }));
            setExams(examsWithCount);
        }
        setLoading(false);
    }, [groupId, toast, selectedBranch]);

    useEffect(() => {
        if (branchId && groupId && selectedBranch?.id) {
            fetchGroupDetails();
            fetchSessions();
            fetchExams();
        }
    }, [branchId, groupId, selectedBranch?.id, fetchGroupDetails, fetchSessions, fetchExams]);

    const openExamModal = (exam = null) => {
        if (exam) {
            setSelectedExam(exam);
            setValue('name', exam.name);
            setValue('session_id', exam.session_id);
            setValue('is_publish', exam.is_publish);
            setValue('is_publish_result', exam.is_publish_result);
            setValue('roll_no_type', exam.roll_no_type);
            setValue('passing_percentage', exam.passing_percentage);
            setValue('description', exam.description);
        } else {
            setSelectedExam(null);
            reset({
                name: '',
                session_id: '',
                is_publish: false,
                is_publish_result: false,
                roll_no_type: 'admit_card',
                passing_percentage: '',
                description: ''
            });
        }
        setIsExamModalOpen(true);
    };

    const openStudentModal = (exam) => {
        setSelectedExam(exam);
        setIsStudentModalOpen(true);
    };

    const openSubjectModal = (exam) => {
        setSelectedExam(exam);
        setIsSubjectModalOpen(true);
    };

    const openMarksModal = (exam) => {
        setSelectedExam(exam);
        setIsMarksModalOpen(true);
    };

    const onSubmitExam = async (data) => {
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
                organization_id: organizationId,
                exam_group_id: groupId,
                passing_percentage: data.passing_percentage ? parseFloat(data.passing_percentage) : null
            };

            let error;
            if (selectedExam) {
                const { error: updateError } = await supabase.from('exams').update(payload).eq('id', selectedExam.id);
                error = updateError;
            } else {
                const { error: insertError } = await supabase.from('exams').insert([payload]);
                error = insertError;
            }

            if (error) throw error;

            toast({ title: selectedExam ? 'Exam updated successfully' : 'Exam added successfully' });
            setIsExamModalOpen(false);
            fetchExams();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error saving exam', description: error.message });
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteClick = (id) => {
        setDeleteId(id);
        setIsDeleteAlertOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!deleteId) return;
        try {
            const { error } = await supabase.from('exams').delete().eq('id', deleteId);
            if (error) throw error;
            toast({ title: 'Exam deleted successfully' });
            fetchExams();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error deleting exam', description: error.message });
        } finally {
            setIsDeleteAlertOpen(false);
            setDeleteId(null);
        }
    };

    return (
        <DashboardLayout>
            <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" onClick={() => navigate('/school-owner/examinations/exam-group')}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Exam List</h1>
                            {group && (
                                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                    <span>Group: <strong>{group.name}</strong></span>
                                    <span>Type: <strong>{group.exam_type}</strong></span>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={() => openExamModal()}>
                            <Plus className="mr-2 h-4 w-4" /> New Exam
                        </Button>
                        <Button variant="secondary" onClick={() => setIsLinkModalOpen(true)}>
                            <LinkIcon className="mr-2 h-4 w-4" /> Link Exams
                        </Button>
                    </div>
                </div>

                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Session</TableHead>
                                    <TableHead>Subjects Included</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Publish Result</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow><TableCell colSpan={7} className="text-center py-8"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
                                ) : exams.length === 0 ? (
                                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No exams found in this group</TableCell></TableRow>
                                ) : (
                                    exams.map(exam => (
                                        <TableRow key={exam.id}>
                                            <TableCell className="font-medium">{exam.name}</TableCell>
                                            <TableCell>{exam.session?.name}</TableCell>
                                            <TableCell>{exam.subjects_included}</TableCell>
                                            <TableCell>
                                                {exam.is_publish ? <span className="text-green-600 font-bold">✓</span> : <span className="text-gray-300">✗</span>}
                                            </TableCell>
                                            <TableCell>
                                                 {exam.is_publish_result ? <span className="text-green-600 font-bold">✓</span> : <span className="text-gray-300">✗</span>}
                                            </TableCell>
                                            <TableCell className="max-w-xs truncate">{exam.description}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openSubjectModal(exam)}>
                                                                    <BookOpen className="h-3.5 w-3.5 text-indigo-500" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Exam Subjects</TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>

                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openStudentModal(exam)}>
                                                                    <LinkIcon className="h-3.5 w-3.5 text-orange-500" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Assign / View Student</TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>

                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openMarksModal(exam)}>
                                                                    <Calculator className="h-3.5 w-3.5 text-green-500" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Exam Marks</TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>

                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openExamModal(exam)}>
                                                        <Pencil className="h-3.5 w-3.5 text-blue-500" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteClick(exam.id)}>
                                                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            {/* Modals */}
            <Dialog open={isExamModalOpen} onOpenChange={setIsExamModalOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{selectedExam ? 'Edit Exam' : 'New Exam'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit(onSubmitExam)} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Exam Name <span className="text-red-500">*</span></Label>
                            <Input {...register('name', { required: true })} />
                            {errors.name && <span className="text-xs text-red-500">Required</span>}
                        </div>
                        <div className="space-y-2">
                            <Label>Session <span className="text-red-500">*</span></Label>
                            <Select onValueChange={(v) => setValue('session_id', v)} value={watch('session_id')}>
                                <SelectTrigger><SelectValue placeholder="Select Session" /></SelectTrigger>
                                <SelectContent>
                                    {sessions.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Exam Passing Percentage</Label>
                            <Input type="number" step="0.01" {...register('passing_percentage')} placeholder="e.g. 33" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center space-x-2 border p-3 rounded">
                                <Checkbox 
                                    id="publish" 
                                    checked={watch('is_publish')} 
                                    onCheckedChange={(c) => setValue('is_publish', c)} 
                                />
                                <Label htmlFor="publish" className="cursor-pointer">Publish</Label>
                            </div>
                            <div className="flex items-center space-x-2 border p-3 rounded">
                                <Checkbox 
                                    id="publish_res" 
                                    checked={watch('is_publish_result')} 
                                    onCheckedChange={(c) => setValue('is_publish_result', c)} 
                                />
                                <Label htmlFor="publish_res" className="cursor-pointer">Publish Result</Label>
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <Label>Result Roll No Format</Label>
                             <RadioGroup defaultValue="admit_card" value={watch('roll_no_type')} onValueChange={(v) => setValue('roll_no_type', v)} className="flex space-x-4">
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="admit_card" id="r1" />
                                    <Label htmlFor="r1">Admit Card Roll No</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="profile" id="r2" />
                                    <Label htmlFor="r2">Profile Roll No</Label>
                                </div>
                            </RadioGroup>
                        </div>

                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea {...register('description')} />
                        </div>

                        <DialogFooter>
                            <Button type="submit" disabled={saving}>
                                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <AssignExamStudentsModal 
                isOpen={isStudentModalOpen} 
                onClose={() => { setIsStudentModalOpen(false); fetchExams(); }} 
                exam={selectedExam}
                branchId={branchId}
            />

            <AddExamSubjectsModal 
                isOpen={isSubjectModalOpen}
                onClose={() => { setIsSubjectModalOpen(false); fetchExams(); }}
                exam={selectedExam}
                branchId={branchId}
            />

            <EnterMarksModal
                isOpen={isMarksModalOpen}
                onClose={() => setIsMarksModalOpen(false)}
                exam={selectedExam}
                branchId={branchId}
            />

            <LinkExamModal
                isOpen={isLinkModalOpen}
                onClose={() => setIsLinkModalOpen(false)}
                group={group}
                branchId={branchId}
            />

            <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the exam and all associated student data.
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

export default ExamList;
