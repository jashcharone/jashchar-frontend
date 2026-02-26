import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { PlusCircle, Edit, Trash2, Loader2, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { v4 as uuidv4 } from 'uuid';

const CbseExamGrade = () => {
    const { user } = useAuth();
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    const branchId = selectedBranch?.id || user?.profile?.branch_id;
    const [examGrades, setExamGrades] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [selectedGrade, setSelectedGrade] = useState(null);
    const [formData, setFormData] = useState({ grade_title: '', description: '', details: [{ key: uuidv4(), grade: '', maximum_percentage: '', minimum_percentage: '', remark: '' }] });

    const fetchExamGrades = useCallback(async () => {
        if (!branchId) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('cbse_exam_grades')
            .select('*, cbse_grade_details(*)')
            .eq('branch_id', branchId)
            .order('grade_title', { ascending: true });
        
        if (error) {
            toast({ variant: 'destructive', title: 'Error fetching exam grades', description: error.message });
        } else {
            setExamGrades(data);
        }
        setLoading(false);
    }, [user, branchId, toast]);

    useEffect(() => {
        fetchExamGrades();
    }, [fetchExamGrades]);

    const handleOpenDialog = (grade = null) => {
        setSelectedGrade(grade);
        if (grade) {
            setFormData({
                grade_title: grade.grade_title,
                description: grade.description,
                details: grade.cbse_grade_details.map(d => ({ ...d, key: d.id })) || [{ key: uuidv4(), grade: '', maximum_percentage: '', minimum_percentage: '', remark: '' }]
            });
        } else {
            setFormData({ grade_title: '', description: '', details: [{ key: uuidv4(), grade: '', maximum_percentage: '', minimum_percentage: '', remark: '' }] });
        }
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setSelectedGrade(null);
        setFormData({ grade_title: '', description: '', details: [{ key: uuidv4(), grade: '', maximum_percentage: '', minimum_percentage: '', remark: '' }] });
    };

    const handleDetailChange = (index, field, value) => {
        const newDetails = [...formData.details];
        newDetails[index][field] = value;
        setFormData({ ...formData, details: newDetails });
    };

    const addDetail = () => {
        setFormData(prev => ({
            ...prev,
            details: [...prev.details, { key: uuidv4(), grade: '', maximum_percentage: '', minimum_percentage: '', remark: '' }]
        }));
    };

    const removeDetail = (index) => {
        const newDetails = formData.details.filter((_, i) => i !== index);
        setFormData({ ...formData, details: newDetails });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!branchId) return;

        const { grade_title, description, details } = formData;
        if (!grade_title || details.some(d => !d.grade || !d.maximum_percentage || !d.minimum_percentage)) {
            toast({ variant: 'destructive', title: 'Validation Error', description: 'Please fill all required fields for the grade title and its details.' });
            return;
        }

        setLoading(true);
        try {
            if (selectedGrade) {
                // Update Grade
                const { error: gradeError } = await supabase.from('cbse_exam_grades').update({ grade_title, description }).eq('id', selectedGrade.id);
                if (gradeError) throw gradeError;

                const existingDetailIds = selectedGrade.cbse_grade_details.map(d => d.id);
                const updatedDetailIds = details.map(d => d.id).filter(Boolean);
                const detailsToDelete = existingDetailIds.filter(id => !updatedDetailIds.includes(id));
                
                const detailsToUpsert = details.map(d => {
                    const { key, ...rest } = d;
                    return { ...rest, exam_grade_id: selectedGrade.id, branch_id: branchId };
                });

                if (detailsToDelete.length > 0) {
                    const { error: deleteError } = await supabase.from('cbse_grade_details').delete().in('id', detailsToDelete);
                    if (deleteError) throw deleteError;
                }
                const { error: upsertError } = await supabase.from('cbse_grade_details').upsert(detailsToUpsert, { onConflict: 'id' });
                if (upsertError) throw upsertError;

            } else {
                // Create new Grade
                const { data: gradeData, error: gradeError } = await supabase.from('cbse_exam_grades').insert({ grade_title, description, branch_id: branchId }).select().single();
                if (gradeError) throw gradeError;

                const detailsToInsert = details.map(d => {
                    const { key, ...rest } = d;
                    return { ...rest, exam_grade_id: gradeData.id, branch_id: branchId };
                });
                const { error: detailsError } = await supabase.from('cbse_grade_details').insert(detailsToInsert);
                if (detailsError) throw detailsError;
            }
            toast({ title: `Grade ${selectedGrade ? 'updated' : 'added'} successfully!` });
            handleCloseDialog();
            fetchExamGrades();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error saving grade', description: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedGrade) return;
        setLoading(true);
        const { error } = await supabase.from('cbse_exam_grades').delete().eq('id', selectedGrade.id);
        if (error) {
            toast({ variant: 'destructive', title: 'Error deleting grade', description: error.message });
        } else {
            toast({ title: 'Grade deleted successfully!' });
            setIsAlertOpen(false);
            setSelectedGrade(null);
            fetchExamGrades();
        }
        setLoading(false);
    };

    return (
        <DashboardLayout>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Exam Grade List</CardTitle>
                    <Button onClick={() => handleOpenDialog()}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Grade
                    </Button>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center"><Loader2 className="animate-spin" /></div>
                    ) : examGrades.length === 0 ? (
                        <p className="text-center">No exam grades found.</p>
                    ) : (
                        <div className="space-y-4">
                            {examGrades.map(grade => (
                                <Card key={grade.id}>
                                    <CardHeader className="flex flex-row items-start justify-between">
                                        <div>
                                            <h3 className="font-semibold">{grade.grade_title}</h3>
                                            <p className="text-sm text-muted-foreground">{grade.description}</p>
                                        </div>
                                        <div>
                                            <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(grade)}><Edit className="h-4 w-4" /></Button>
                                            <Button variant="ghost" size="icon" onClick={() => { setSelectedGrade(grade); setIsAlertOpen(true); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead><tr>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Grade</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Max %</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Min %</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Remark</th>
                                            </tr></thead>
                                            <tbody>
                                                {grade.cbse_grade_details.map(detail => (
                                                    <tr key={detail.id}>
                                                        <td className="px-4 py-2">{detail.grade}</td>
                                                        <td className="px-4 py-2">{detail.maximum_percentage}</td>
                                                        <td className="px-4 py-2">{detail.minimum_percentage}</td>
                                                        <td className="px-4 py-2">{detail.remark}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader><DialogTitle>{selectedGrade ? 'Edit Grade' : 'Add Grade'}</DialogTitle></DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><Label htmlFor="grade_title">Grade Title *</Label><Input id="grade_title" value={formData.grade_title} onChange={(e) => setFormData({ ...formData, grade_title: e.target.value })} required /></div>
                            <div><Label htmlFor="description">Description</Label><Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div>
                        </div>
                        <hr />
                        <h3 className="font-semibold">Grade Details</h3>
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                        {formData.details.map((detail, index) => (
                            <div key={detail.key} className="grid grid-cols-12 gap-2 items-end p-2 border rounded-md">
                                <div className="col-span-6 md:col-span-2"><Label>Grade *</Label><Input value={detail.grade} onChange={e => handleDetailChange(index, 'grade', e.target.value)} required /></div>
                                <div className="col-span-6 md:col-span-3"><Label>Max % *</Label><Input type="number" value={detail.maximum_percentage} onChange={e => handleDetailChange(index, 'maximum_percentage', e.target.value)} required /></div>
                                <div className="col-span-6 md:col-span-3"><Label>Min % *</Label><Input type="number" value={detail.minimum_percentage} onChange={e => handleDetailChange(index, 'minimum_percentage', e.target.value)} required /></div>
                                <div className="col-span-12 md:col-span-3"><Label>Remark</Label><Input value={detail.remark} onChange={e => handleDetailChange(index, 'remark', e.target.value)} /></div>
                                <div className="col-span-12 md:col-span-1 flex justify-end">
                                    {formData.details.length > 1 && <Button type="button" variant="destructive" size="icon" onClick={() => removeDetail(index)}><X className="h-4 w-4" /></Button>}
                                </div>
                            </div>
                        ))}
                        </div>
                        <Button type="button" variant="outline" onClick={addDetail} className="mt-2">Add More</Button>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={handleCloseDialog}>Cancel</Button>
                            <Button type="submit" disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : 'Save'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the grade and all its details.</AlertDialogDescription></AlertDialogHeader>
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

export default CbseExamGrade;
