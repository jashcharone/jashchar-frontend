import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { usePermissions } from '@/contexts/PermissionContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Save, Edit, Trash2, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const Subjects = () => {
    const { toast } = useToast();
    const { user } = useAuth();
    const { canEdit, canDelete } = usePermissions();
    const { selectedBranch } = useBranch();
    const [subjects, setSubjects] = useState([]);
    const [formData, setFormData] = useState({ name: '', code: '', type: 'Theory' });
    const [isEditing, setIsEditing] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);

    // BRANCH FIX: Always use selectedBranch.id from BranchContext
    const branchId = selectedBranch?.id;

    const fetchSubjects = async () => {
        if (!branchId) {
            if (user) setIsFetching(false);
            return;
        }
        setIsFetching(true);
        try {
            // BRANCH FIX: Use ONLY selectedBranch.id
            const response = await api.get('/academics/subjects', {
                params: { branchId }
            });
            setSubjects(response.data || []);
        } catch (error) {
            const message = error?.response?.data?.message || 'Failed to fetch subjects';
            toast({ variant: 'destructive', title: message });
        } finally {
            setIsFetching(false);
        }
    };

    useEffect(() => {
        fetchSubjects();
    }, [user, selectedBranch]);

    const resetForm = () => {
        setFormData({ name: '', code: '', type: 'Theory' });
        setIsEditing(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            toast({ variant: 'destructive', title: 'Subject name cannot be empty.' });
            return;
        }

        // Check for duplicates
        const normalizedName = formData.name.trim().toLowerCase();
        const duplicate = subjects.find(s => 
            s.name.toLowerCase() === normalizedName && 
            s.id !== isEditing
        );

        if (duplicate) {
            toast({ variant: 'destructive', title: 'Duplicate Subject', description: 'A subject with this name already exists.' });
            return;
        }

        setLoading(true);
        
        const payload = {
            name: formData.name,
            code: formData.code,
            type: formData.type,
        };

        if (!isEditing) {
            // Add new subject - BRANCH FIX: Use ONLY selectedBranch.id
            payload.branch_id = branchId;
        }

        try {
            if (isEditing) {
                // Update existing subject - BRANCH FIX: Use ONLY selectedBranch.id
                const updatePayload = {
                    ...payload,
                    branch_id: branchId
                };
                await api.put(`/academics/subjects/${isEditing}`, updatePayload, {
                    params: { branchId }
                });
                toast({ title: 'Subject Updated!' });
            } else {
                // Create new subject
                const response = await api.post('/academics/subjects', payload);
                if (response.status === 201) {
                    toast({ title: 'Subject Added!' });
                }
            }
            resetForm();
            await fetchSubjects();
        } catch (error) {
            const message = error?.response?.data?.message || error?.response?.data?.error || error?.message || 'Error saving subject';
            toast({ variant: 'destructive', title: 'Error saving subject', description: message });
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (subject) => {
        setIsEditing(subject.id);
        setFormData({ name: subject.name, code: subject.code || '', type: subject.type || 'Theory' });
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/academics/subjects/${id}`, {
                params: { branchId: selectedBranch?.id }
            });
            toast({ title: 'Subject Deleted' });
            await fetchSubjects();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error deleting subject', description: error.response?.data?.error || error.message });
        }
    };

    return (
        <DashboardLayout>
            <h1 className="text-3xl font-bold mb-6">Subjects</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <div className="bg-card p-6 rounded-xl shadow-lg border">
                        <h2 className="text-xl font-bold mb-4">{isEditing ? 'Edit Subject' : 'Add Subject'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label htmlFor="subject-name">Subject Name *</Label>
                                <Input id="subject-name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="e.g., Mathematics" />
                            </div>
                            <div>
                                <Label>Subject Type *</Label>
                                <RadioGroup value={formData.type} onValueChange={(v) => setFormData({...formData, type: v})} className="flex items-center gap-4 mt-2">
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="Theory" id="type-theory" /><Label htmlFor="type-theory">Theory</Label></div>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="Practical" id="type-practical" /><Label htmlFor="type-practical">Practical</Label></div>
                                </RadioGroup>
                            </div>
                            <div>
                                <Label htmlFor="subject-code">Subject Code</Label>
                                <Input id="subject-code" value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value})} placeholder="e.g., MATH101" />
                            </div>
                            <div className="flex justify-end space-x-2">
                                {isEditing && <Button type="button" variant="ghost" onClick={resetForm}>Cancel</Button>}
                                <Button type="submit" disabled={loading}>
                                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                    Save
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
                <div className="lg:col-span-2">
                    <div className="bg-card p-6 rounded-xl shadow-lg border">
                        <h2 className="text-xl font-bold mb-4">Subject List</h2>
                         <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs uppercase bg-muted/50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3">Subject Name</th>
                                        <th scope="col" className="px-6 py-3">Subject Code</th>
                                        <th scope="col" className="px-6 py-3">Subject Type</th>
                                        <th scope="col" className="px-6 py-3 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isFetching ? (
                                        <tr><td colSpan="4" className="p-4 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></td></tr>
                                    ) : subjects.length === 0 ? (
                                        <tr><td colSpan="4" className="p-4 text-center text-muted-foreground">No subjects found</td></tr>
                                    ) : subjects.map(subject => (
                                        <tr key={subject.id} className="border-b hover:bg-muted/50">
                                            <td className="px-6 py-4 font-medium">{subject.name}</td>
                                            <td className="px-6 py-4">{subject.code}</td>
                                            <td className="px-6 py-4 capitalize">{subject.type}</td>
                                            <td className="px-6 py-4 text-right space-x-1">
                                                {canEdit('academics.subjects') && (
                                                <Button variant="ghost" size="icon" onClick={() => handleEdit(subject)}><Edit className="h-4 w-4 text-blue-600" /></Button>
                                                )}
                                                {canDelete('academics.subjects') && (
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-red-600" /></Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Delete Subject?</AlertDialogTitle>
                                                            <AlertDialogDescription>This action cannot be undone. It may affect subject groups and timetables.</AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDelete(subject.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                         </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Subjects;
