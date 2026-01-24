import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
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
} from '@/components/ui/alert-dialog';

const FeesType = () => {
    const { user } = useAuth();
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    const [feesTypes, setFeesTypes] = useState([]);
    const [formData, setFormData] = useState({ id: null, name: '', code: '', description: '' });
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const fetchFeesTypes = async () => {
        // Use user.profile.branch_id OR user.user_metadata.branch_id
        const branchId = user?.profile?.branch_id || user?.user_metadata?.branch_id;
        
        if (!branchId || !selectedBranch) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('fee_types')
            .select('*')
            .eq('branch_id', selectedBranch.id)
            .order('name', { ascending: true });
        
        if (error) {
            toast({ variant: 'destructive', title: 'Error fetching data', description: error.message });
        } else {
            setFeesTypes(data);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchFeesTypes();
    }, [user, selectedBranch, toast]);

    const resetForm = () => {
        setFormData({ id: null, name: '', code: '', description: '' });
        setIsEditing(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        const branchId = user?.profile?.branch_id || user?.user_metadata?.branch_id;

        if (!branchId) {
             toast({ variant: 'destructive', title: 'Error', description: 'School ID not found. Please re-login.' });
             setLoading(false);
             return;
        }
        if (!selectedBranch) {
            toast({ variant: 'destructive', title: 'Error', description: 'Branch not selected.' });
            setLoading(false);
            return;
        }

        const upsertData = {
            branch_id: selectedBranch.id,
            name: formData.name,
            code: formData.code,
            description: formData.description,
        };

        if (isEditing) {
            upsertData.id = formData.id;
        }

        const { error } = await supabase.from('fee_types').upsert(upsertData);

        if (error) {
            toast({ variant: 'destructive', title: 'Error saving fee type', description: error.message });
        } else {
            toast({ title: isEditing ? 'Fee Type Updated!' : 'Fee Type Added!' });
            resetForm();
            await fetchFeesTypes();
        }
        setLoading(false);
    };

    const handleEdit = (type) => {
        setFormData({ id: type.id, name: type.name, code: type.code, description: type.description });
        setIsEditing(true);
    };

    const handleDelete = async (id) => {
        const { error } = await supabase.from('fee_types').delete().eq('id', id);
        if (error) {
            toast({ variant: 'destructive', title: 'Error deleting fee type', description: error.message });
        } else {
            toast({ title: 'Fee Type Deleted' });
            await fetchFeesTypes();
        }
    };

    return (
        <DashboardLayout>
            <h1 className="text-2xl font-bold mb-6">Fees Type</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1">
                    <div className="bg-card p-6 rounded-lg shadow">
                        <h2 className="text-lg font-semibold mb-4">{isEditing ? 'Edit Fees Type' : 'Add Fees Type'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label htmlFor="name">Name *</Label>
                                <Input id="name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
                            </div>
                            <div>
                                <Label htmlFor="code">Fees Code</Label>
                                <Input id="code" value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value})} />
                            </div>
                            <div>
                                <Label htmlFor="description">Description</Label>
                                <Textarea id="description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
                            </div>
                            <div className="flex justify-end space-x-2">
                               {isEditing && <Button type="button" variant="secondary" onClick={resetForm}>Cancel</Button>}
                                <Button type="submit" disabled={loading}>
                                    <PlusCircle className="mr-2 h-4 w-4" /> {loading ? 'Saving...' : 'Save'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
                <div className="md:col-span-2">
                     <div className="bg-card p-6 rounded-lg shadow">
                        <h2 className="text-lg font-semibold mb-4">Fees Type List</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left text-muted-foreground">
                                        <th className="pb-2">Name</th>
                                        <th className="pb-2">Fees Code</th>
                                        <th className="pb-2 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {feesTypes.map(type => (
                                        <tr key={type.id} className="border-b">
                                            <td className="py-2">{type.name}</td>
                                            <td className="py-2">{type.code}</td>
                                            <td className="py-2 text-right">
                                                <Button variant="ghost" size="icon" onClick={() => handleEdit(type)}><Edit className="h-4 w-4" /></Button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                            <AlertDialogDescription>This will permanently delete the fees type.</AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDelete(type.id)}>Delete</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
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

export default FeesType;
