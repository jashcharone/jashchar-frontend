import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { PlusCircle, Edit, Trash2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const CbseTerm = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [terms, setTerms] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [selectedTerm, setSelectedTerm] = useState(null);
    const [formData, setFormData] = useState({ name: '', code: '', description: '' });

    const fetchTerms = useCallback(async () => {
        if (!user?.profile?.branch_id) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('cbse_terms')
            .select('*')
            .eq('branch_id', user.profile.branch_id)
            .order('name', { ascending: true });
        
        if (error) {
            toast({ variant: 'destructive', title: 'Error fetching terms', description: error.message });
        } else {
            setTerms(data);
        }
        setLoading(false);
    }, [user, toast]);

    useEffect(() => {
        fetchTerms();
    }, [fetchTerms]);

    const handleOpenDialog = (term = null) => {
        setSelectedTerm(term);
        setFormData(term ? { name: term.name, code: term.code, description: term.description } : { name: '', code: '', description: '' });
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setSelectedTerm(null);
        setFormData({ name: '', code: '', description: '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user?.profile?.branch_id) return;
        setLoading(true);

        const termData = {
            ...formData,
            branch_id: user.profile.branch_id,
        };

        let error;
        if (selectedTerm) {
            ({ error } = await supabase.from('cbse_terms').update(termData).eq('id', selectedTerm.id));
        } else {
            ({ error } = await supabase.from('cbse_terms').insert(termData));
        }

        if (error) {
            toast({ variant: 'destructive', title: 'Error saving term', description: error.message });
        } else {
            toast({ title: `Term ${selectedTerm ? 'updated' : 'added'} successfully!` });
            handleCloseDialog();
            fetchTerms();
        }
        setLoading(false);
    };

    const handleDelete = async () => {
        if (!selectedTerm) return;
        setLoading(true);
        const { error } = await supabase.from('cbse_terms').delete().eq('id', selectedTerm.id);
        if (error) {
            toast({ variant: 'destructive', title: 'Error deleting term', description: error.message });
        } else {
            toast({ title: 'Term deleted successfully!' });
            setIsAlertOpen(false);
            setSelectedTerm(null);
            fetchTerms();
        }
        setLoading(false);
    };

    return (
        <DashboardLayout>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Term List</CardTitle>
                    <Button onClick={() => handleOpenDialog()}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Term
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {loading ? (
                                    <tr><td colSpan="4" className="text-center py-4"><Loader2 className="mx-auto animate-spin" /></td></tr>
                                ) : terms.length === 0 ? (
                                    <tr><td colSpan="4" className="text-center py-4">No terms found.</td></tr>
                                ) : (
                                    terms.map((term) => (
                                        <tr key={term.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">{term.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{term.code}</td>
                                            <td className="px-6 py-4">{term.description}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(term)}><Edit className="h-4 w-4" /></Button>
                                                <Button variant="ghost" size="icon" onClick={() => { setSelectedTerm(term); setIsAlertOpen(true); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{selectedTerm ? 'Edit Term' : 'Add Term'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="name">Name *</Label>
                            <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                        </div>
                        <div>
                            <Label htmlFor="code">Code</Label>
                            <Input id="code" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} />
                        </div>
                        <div>
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={handleCloseDialog}>Cancel</Button>
                            <Button type="submit" disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : 'Save'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>This action cannot be undone. This will permanently delete the term.</AlertDialogDescription>
                    </AlertDialogHeader>
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

export default CbseTerm;
