import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Edit, Trash2, Loader2, CheckCircle2, XCircle, Users, BookPlus, ClipboardEdit, CalendarCheck, MessageSquarePlus, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import MultiSelectDropdown from '@/components/ui/MultiSelectDropdown';
import AssignStudents from './AssignStudents';
import AddExamSubjects from './AddExamSubjects';
import EnterMarks from './EnterMarks';
import ExamAttendance from './ExamAttendance';
import TeacherRemarks from './TeacherRemarks';
import { v4 as uuidv4 } from 'uuid';

const CbseExam = () => {
    const { user, currentSessionId, organizationId } = useAuth();
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    const navigate = useNavigate();
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [selectedExam, setSelectedExam] = useState(null);
    const [currentAction, setCurrentAction] = useState(null);
    
    const [terms, setTerms] = useState([]);
    const [assessments, setAssessments] = useState([]);
    const [grades, setGrades] = useState([]);
    const [classes, setClasses] = useState([]);
    const [sections, setSections] = useState([]);
    const [templates, setTemplates] = useState([]);

    const initialFormData = { name: '', description: '', term_id: '', assessment_id: '', grade_id: '', class_id: '', section_ids: [], is_published: false, is_result_published: false, marksheet_template_id: '' };
    const [formData, setFormData] = useState(initialFormData);

    const fetchDropdownData = useCallback(async () => {
        if (!user?.profile?.branch_id && !selectedBranch?.id) return;
        const branchId = selectedBranch?.id || user.profile.branch_id;
        const [termsRes, assessmentsRes, gradesRes, classesRes, sectionsRes, templatesRes] = await Promise.all([
            supabase.from('cbse_terms').select('id, name').eq('branch_id', branchId),
            supabase.from('cbse_assessments').select('id, name').eq('branch_id', branchId),
            supabase.from('cbse_exam_grades').select('id, grade_title').eq('branch_id', branchId),
            supabase.from('classes').select('id, name').eq('branch_id', branchId),
            supabase.from('sections').select('id, name').eq('branch_id', branchId),
            supabase.from('cbse_marksheet_templates').select('id, name').eq('branch_id', branchId),
        ]);
        setTerms(termsRes.data || []);
        setAssessments(assessmentsRes.data || []);
        setGrades(gradesRes.data || []);
        setClasses(classesRes.data || []);
        setSections(sectionsRes.data || []);
        setTemplates(templatesRes.data || []);
    }, [user, selectedBranch?.id]);

    const fetchExams = useCallback(async () => {
        if (!user?.profile?.branch_id && !selectedBranch?.id) return;
        if (!currentSessionId) return;
        setLoading(true);
        const { data, error } = await supabase.from('cbse_exams').select(`*, cbse_terms(name), classes(name), cbse_assessments(name)`).eq('branch_id', selectedBranch?.id || user.profile.branch_id).eq('session_id', currentSessionId).order('created_at', { ascending: false });
        if (error) toast({ variant: 'destructive', title: 'Error fetching exams', description: error.message });
        else setExams(data);
        setLoading(false);
    }, [user, selectedBranch?.id, currentSessionId, toast]);

    useEffect(() => {
        fetchDropdownData();
        fetchExams();
    }, [fetchDropdownData, fetchExams]);

    const handleOpenForm = (exam = null) => {
        setSelectedExam(exam);
        setFormData(exam ? { ...exam, section_ids: exam.section_ids || [] } : initialFormData);
        setIsFormOpen(true);
    };
    
    const handleActionClick = (exam, action) => {
        if (action === 'rank') {
            navigate(`/school-owner/examinations/generate-rank/${exam.id}`);
            return;
        }
        const examWithDetails = {
            ...exam,
            classes: { name: exam.classes.name },
            section_names: getSectionNames(exam.section_ids)
        };
        setSelectedExam(examWithDetails);
        setCurrentAction(action);
    };

    const handleCloseAction = () => {
        setCurrentAction(null);
        setSelectedExam(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user?.profile?.branch_id) return;
        
        const { name, term_id, assessment_id, grade_id, class_id, section_ids } = formData;
        if (!name || !term_id || !assessment_id || !grade_id || !class_id || section_ids.length === 0) {
            toast({ variant: 'destructive', title: 'Validation Error', description: 'Please fill all required fields.' });
            return;
        }

        setLoading(true);
        const examData = { ...formData, branch_id: selectedBranch?.id || user.profile.branch_id, session_id: currentSessionId, organization_id: organizationId };
        const { error } = selectedExam ? await supabase.from('cbse_exams').update(examData).eq('id', selectedExam.id) : await supabase.from('cbse_exams').insert(examData);

        if (error) toast({ variant: 'destructive', title: 'Error saving exam', description: error.message });
        else {
            toast({ title: `Exam ${selectedExam ? 'updated' : 'added'} successfully!` });
            setIsFormOpen(false);
            fetchExams();
        }
        setLoading(false);
    };

    const handleDelete = async () => {
        if (!selectedExam) return;
        setLoading(true);
        const { error } = await supabase.from('cbse_exams').delete().eq('id', selectedExam.id);
        if (error) toast({ variant: 'destructive', title: 'Error deleting exam', description: error.message });
        else {
            toast({ title: 'Exam deleted successfully!' });
            setIsAlertOpen(false);
            setSelectedExam(null);
            fetchExams();
        }
        setLoading(false);
    };

    const getSectionNames = (sectionIds) => {
        if (!sectionIds || sectionIds.length === 0) return 'N/A';
        return sectionIds.map(id => sections.find(s => s.id === id)?.name).filter(Boolean);
    };

    const renderActionDialog = () => {
        if (!selectedExam || !currentAction) return null;
        
        const dialogs = {
            assign: { title: "Assign Students", component: <AssignStudents exam={selectedExam} onClose={handleCloseAction} /> },
            subjects: { title: "Add Exam Subjects", component: <AddExamSubjects exam={selectedExam} onClose={handleCloseAction} /> },
            marks: { title: "Enter Marks", component: <EnterMarks exam={selectedExam} onClose={handleCloseAction} /> },
            attendance: { title: "Exam Attendance", component: <ExamAttendance exam={selectedExam} onClose={handleCloseAction} /> },
            remarks: { title: "Teacher Remarks", component: <TeacherRemarks exam={selectedExam} onClose={handleCloseAction} /> },
        };

        const { title, component } = dialogs[currentAction] || {};
        if (!component) return null;

        return (
            <Dialog open={true} onOpenChange={handleCloseAction}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader><DialogTitle>{title} for {selectedExam.name}</DialogTitle></DialogHeader>
                    {component}
                </DialogContent>
            </Dialog>
        );
    };

    return (
        <DashboardLayout>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Exam List</CardTitle>
                    <Button onClick={() => handleOpenForm()}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Exam
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-muted">
                                <tr>
                                    {["Exam Name", "Class (Sections)", "Term", "Exam Published", "Result Published", "Action"].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{h}</th>)}
                                </tr>
                            </thead>
                            <tbody className="bg-card divide-y divide-border">
                                {loading ? (
                                    <tr><td colSpan="6" className="text-center py-4"><Loader2 className="mx-auto animate-spin" /></td></tr>
                                ) : exams.length === 0 ? (
                                    <tr><td colSpan="6" className="text-center py-4">No exams found.</td></tr>
                                ) : (
                                    exams.map((exam) => (
                                        <tr key={exam.id}>
                                            <td className="px-4 py-4 whitespace-nowrap">{exam.name}</td>
                                            <td className="px-4 py-4 whitespace-nowrap">{exam.classes?.name} ({getSectionNames(exam.section_ids).join(', ')})</td>
                                            <td className="px-4 py-4 whitespace-nowrap">{exam.cbse_terms?.name}</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-center">{exam.is_published ? <CheckCircle2 className="text-green-500" /> : <XCircle className="text-red-500" />}</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-center">{exam.is_result_published ? <CheckCircle2 className="text-green-500" /> : <XCircle className="text-red-500" />}</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <Button variant="ghost" size="icon" onClick={() => handleActionClick(exam, 'assign')} title="Assign Students"><Users className="h-4 w-4" /></Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleActionClick(exam, 'subjects')} title="Add Subjects"><BookPlus className="h-4 w-4" /></Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleActionClick(exam, 'marks')} title="Enter Marks"><ClipboardEdit className="h-4 w-4" /></Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleActionClick(exam, 'attendance')} title="Exam Attendance"><CalendarCheck className="h-4 w-4" /></Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleActionClick(exam, 'remarks')} title="Teacher Remarks"><MessageSquarePlus className="h-4 w-4" /></Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleActionClick(exam, 'rank')} title="Generate Rank"><Award className="h-4 w-4" /></Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleOpenForm(exam)} title="Edit Exam"><Edit className="h-4 w-4" /></Button>
                                                <Button variant="ghost" size="icon" onClick={() => { setSelectedExam(exam); setIsAlertOpen(true); }} title="Delete Exam"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {renderActionDialog()}

            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader><DialogTitle>{selectedExam ? 'Edit Exam' : 'Add Exam'}</DialogTitle></DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2"><Label>Exam Name *</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required /></div>
                            <div className="md:col-span-2"><Label>Description</Label><Textarea value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div>
                            <div><Label>Term *</Label><Select value={formData.term_id} onValueChange={(value) => setFormData({ ...formData, term_id: value })}><SelectTrigger><SelectValue placeholder="Select Term" /></SelectTrigger><SelectContent>{terms.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent></Select></div>
                            <div><Label>Assessment *</Label><Select value={formData.assessment_id} onValueChange={(value) => setFormData({ ...formData, assessment_id: value })}><SelectTrigger><SelectValue placeholder="Select Assessment" /></SelectTrigger><SelectContent>{assessments.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent></Select></div>
                            <div><Label>Grade *</Label><Select value={formData.grade_id} onValueChange={(value) => setFormData({ ...formData, grade_id: value })}><SelectTrigger><SelectValue placeholder="Select Grade" /></SelectTrigger><SelectContent>{grades.map(g => <SelectItem key={g.id} value={g.id}>{g.grade_title}</SelectItem>)}</SelectContent></Select></div>
                             <div><Label>Marksheet Template</Label><Select value={formData.marksheet_template_id} onValueChange={(value) => setFormData({ ...formData, marksheet_template_id: value })}><SelectTrigger><SelectValue placeholder="Select Template" /></SelectTrigger><SelectContent>{templates.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent></Select></div>
                            <div><Label>Class *</Label><Select value={formData.class_id} onValueChange={(value) => setFormData({ ...formData, class_id: value, section_ids: [] })}><SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger><SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
                            <div className="md:col-span-2"><Label>Sections *</Label><MultiSelectDropdown options={sections.map(s => ({ value: s.id, label: s.name }))} selectedValues={formData.section_ids} onChange={(selected) => setFormData({ ...formData, section_ids: selected })} placeholder="Select Sections" /></div>
                            <div className="flex items-center space-x-2"><Checkbox id="is_published" checked={formData.is_published} onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })} /><Label htmlFor="is_published">Publish Exam</Label></div>
                            <div className="flex items-center space-x-2"><Checkbox id="is_result_published" checked={formData.is_result_published} onCheckedChange={(checked) => setFormData({ ...formData, is_result_published: checked })} /><Label htmlFor="is_result_published">Publish Result</Label></div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : 'Save'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete the exam and all associated marks, subjects, and ranks.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/80" disabled={loading}>
                            {loading ? <Loader2 className="animate-spin" /> : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </DashboardLayout>
    );
};

export default CbseExam;
