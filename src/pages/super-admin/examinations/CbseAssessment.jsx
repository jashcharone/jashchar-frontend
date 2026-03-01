import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { PlusCircle, Edit, Trash2, Loader2, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { v4 as uuidv4 } from 'uuid';

const CbseAssessment = () => {
    const { user, currentSessionId, organizationId } = useAuth();
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    const branchId = selectedBranch?.id || user?.profile?.branch_id;
    const [assessments, setAssessments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [selectedAssessment, setSelectedAssessment] = useState(null);
    const [formData, setFormData] = useState({ name: '', description: '', types: [{ id: uuidv4(), name: '', code: '', maximum_marks: '', pass_percentage: '', description: '' }] });
    
    const fetchAssessments = useCallback(async () => {
        if (!branchId) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('cbse_assessments')
            .select('*, cbse_assessment_types(*)')
            .eq('branch_id', branchId)
            .order('name', { ascending: true });
        
        if (error) {
            toast({ variant: 'destructive', title: 'Error fetching assessments', description: error.message });
        } else {
            setAssessments(data);
        }
        setLoading(false);
    }, [user, branchId, toast]);

    useEffect(() => {
        fetchAssessments();
    }, [fetchAssessments]);

    const handleOpenDialog = (assessment = null) => {
        setSelectedAssessment(assessment);
        if (assessment) {
            setFormData({
                name: assessment.name,
                description: assessment.description,
                types: assessment.cbse_assessment_types.length > 0 ? assessment.cbse_assessment_types : [{ id: uuidv4(), name: '', code: '', maximum_marks: '', pass_percentage: '', description: '' }]
            });
        } else {
            setFormData({ name: '', description: '', types: [{ id: uuidv4(), name: '', code: '', maximum_marks: '', pass_percentage: '', description: '' }] });
        }
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setSelectedAssessment(null);
        setFormData({ name: '', description: '', types: [{ id: uuidv4(), name: '', code: '', maximum_marks: '', pass_percentage: '', description: '' }] });
    };

    const handleTypeChange = (index, field, value) => {
        const newTypes = [...formData.types];
        newTypes[index][field] = value;
        setFormData({ ...formData, types: newTypes });
    };

    const addType = () => {
        setFormData(prev => ({
            ...prev,
            types: [...prev.types, { id: uuidv4(), name: '', code: '', maximum_marks: '', pass_percentage: '', description: '' }]
        }));
    };

    const removeType = (index) => {
        const newTypes = formData.types.filter((_, i) => i !== index);
        setFormData({ ...formData, types: newTypes });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!branchId) return;

        const { name, description, types } = formData;
        if (!name || types.some(t => !t.name || !t.maximum_marks || !t.pass_percentage)) {
            toast({ variant: 'destructive', title: 'Validation Error', description: 'Please fill all required fields for the assessment and its types.' });
            return;
        }

        setLoading(true);
        try {
            let assessmentId;
            if (selectedAssessment) {
                assessmentId = selectedAssessment.id;
                // Update Assessment
                const { error: assessmentError } = await supabase.from('cbse_assessments').update({ name, description }).eq('id', assessmentId);
                if (assessmentError) throw assessmentError;

                const existingTypeIdsInDb = selectedAssessment.cbse_assessment_types.map(t => t.id);
                const currentTypeIdsInForm = types.map(t => t.id);
                const typesToDelete = existingTypeIdsInDb.filter(id => !currentTypeIdsInForm.includes(id));

                if (typesToDelete.length > 0) {
                    const { error: deleteError } = await supabase.from('cbse_assessment_types').delete().in('id', typesToDelete);
                    if (deleteError) throw deleteError;
                }

                const typesToUpdate = types.filter(t => existingTypeIdsInDb.includes(t.id));
                const typesToInsert = types.filter(t => !existingTypeIdsInDb.includes(t.id));
                
                if (typesToUpdate.length > 0) {
                    const updates = typesToUpdate.map(t => supabase.from('cbse_assessment_types').update(t).eq('id', t.id));
                    const results = await Promise.all(updates);
                    const updateError = results.find(res => res.error);
                    if (updateError) throw updateError.error;
                }

                if (typesToInsert.length > 0) {
                     const recordsToInsert = typesToInsert.map(t => ({...t, assessment_id: assessmentId, branch_id: branchId, session_id: currentSessionId, organization_id: organizationId}));
                    const { error: insertError } = await supabase.from('cbse_assessment_types').insert(recordsToInsert);
                    if (insertError) throw insertError;
                }

            } else {
                // Create new Assessment
                const { data: assessmentData, error: assessmentError } = await supabase.from('cbse_assessments').insert({ name, description, branch_id: branchId, session_id: currentSessionId, organization_id: organizationId }).select().single();
                if (assessmentError) throw assessmentError;
                assessmentId = assessmentData.id;

                const typesToInsert = types.map(t => ({
                    ...t,
                    assessment_id: assessmentId,
                    branch_id: branchId,
                    session_id: currentSessionId,
                    organization_id: organizationId,
                }));
                
                const { error: typesError } = await supabase.from('cbse_assessment_types').insert(typesToInsert);
                if (typesError) throw typesError;
            }
            toast({ title: `Assessment ${selectedAssessment ? 'updated' : 'added'} successfully!` });
            handleCloseDialog();
            fetchAssessments();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error saving assessment', description: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedAssessment) return;
        setLoading(true);
        const { error } = await supabase.from('cbse_assessments').delete().eq('id', selectedAssessment.id);
        if (error) {
            toast({ variant: 'destructive', title: 'Error deleting assessment', description: error.message });
        } else {
            toast({ title: 'Assessment deleted successfully!' });
            setIsAlertOpen(false);
            setSelectedAssessment(null);
            fetchAssessments();
        }
        setLoading(false);
    };

    return (
        <DashboardLayout>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Assessment List</CardTitle>
                    <Button onClick={() => handleOpenDialog()}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Assessment
                    </Button>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center"><Loader2 className="animate-spin" /></div>
                    ) : assessments.length === 0 ? (
                        <p className="text-center">No assessments found.</p>
                    ) : (
                        <div className="space-y-4">
                            {assessments.map(assessment => (
                                <Card key={assessment.id}>
                                    <CardHeader className="flex flex-row items-start justify-between">
                                        <div>
                                            <h3 className="font-semibold">{assessment.name}</h3>
                                            <p className="text-sm text-muted-foreground">{assessment.description}</p>
                                        </div>
                                        <div>
                                            <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(assessment)}><Edit className="h-4 w-4" /></Button>
                                            <Button variant="ghost" size="icon" onClick={() => { setSelectedAssessment(assessment); setIsAlertOpen(true); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead><tr>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Type Name</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Code</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Max Marks</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Pass %</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Description</th>
                                            </tr></thead>
                                            <tbody>
                                                {assessment.cbse_assessment_types.map(type => (
                                                    <tr key={type.id}>
                                                        <td className="px-4 py-2">{type.name}</td>
                                                        <td className="px-4 py-2">{type.code}</td>
                                                        <td className="px-4 py-2">{type.maximum_marks}</td>
                                                        <td className="px-4 py-2">{type.pass_percentage}</td>
                                                        <td className="px-4 py-2">{type.description}</td>
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
                    <DialogHeader><DialogTitle>{selectedAssessment ? 'Edit Assessment' : 'Add Assessment'}</DialogTitle></DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><Label htmlFor="name">Assessment Name *</Label><Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required /></div>
                            <div><Label htmlFor="description">Description</Label><Input id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div>
                        </div>
                        <hr />
                        <h3 className="font-semibold">Assessment Types</h3>
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                        {formData.types.map((type, index) => (
                            <div key={type.id} className="grid grid-cols-12 gap-2 items-end p-2 border rounded-md">
                                <div className="col-span-12 md:col-span-2"><Label>Type Name *</Label><Input value={type.name} onChange={e => handleTypeChange(index, 'name', e.target.value)} required /></div>
                                <div className="col-span-6 md:col-span-1"><Label>Code</Label><Input value={type.code || ''} onChange={e => handleTypeChange(index, 'code', e.target.value)} /></div>
                                <div className="col-span-6 md:col-span-2"><Label>Max Marks *</Label><Input type="number" value={type.maximum_marks} onChange={e => handleTypeChange(index, 'maximum_marks', e.target.value)} required /></div>
                                <div className="col-span-6 md:col-span-2"><Label>Pass % *</Label><Input type="number" value={type.pass_percentage} onChange={e => handleTypeChange(index, 'pass_percentage', e.target.value)} required /></div>
                                <div className="col-span-12 md:col-span-4"><Label>Description</Label><Input value={type.description || ''} onChange={e => handleTypeChange(index, 'description', e.target.value)} /></div>
                                <div className="col-span-12 md:col-span-1 flex justify-end">
                                    {formData.types.length > 1 && <Button type="button" variant="destructive" size="icon" onClick={() => removeType(index)}><X className="h-4 w-4" /></Button>}
                                </div>
                            </div>
                        ))}
                        </div>
                        <Button type="button" variant="outline" onClick={addType} className="mt-2">Add More</Button>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={handleCloseDialog}>Cancel</Button>
                            <Button type="submit" disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : 'Save'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the assessment and all its associated types.</AlertDialogDescription></AlertDialogHeader>
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

export default CbseAssessment;
