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

const CbseObservation = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [observations, setObservations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [selectedObservation, setSelectedObservation] = useState(null);
    const [formData, setFormData] = useState({ name: '', description: '' });

    const fetchObservations = useCallback(async () => {
        if (!user?.profile?.branch_id) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('cbse_observations')
            .select('*')
            .eq('branch_id', user.profile.branch_id)
            .order('name', { ascending: true });
        
        if (error) {
            toast({ variant: 'destructive', title: 'Error fetching observations', description: error.message });
        } else {
            setObservations(data);
        }
        setLoading(false);
    }, [user, toast]);

    useEffect(() => {
        fetchObservations();
    }, [fetchObservations]);

    const handleOpenDialog = (obs = null) => {
        setSelectedObservation(obs);
        setFormData(obs ? { name: obs.name, description: obs.description } : { name: '', description: '' });
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setSelectedObservation(null);
        setFormData({ name: '', description: '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user?.profile?.branch_id || !formData.name) return;
        setLoading(true);

        const obsData = {
            ...formData,
            branch_id: user.profile.branch_id,
        };

        let error;
        if (selectedObservation) {
            ({ error } = await supabase.from('cbse_observations').update(obsData).eq('id', selectedObservation.id));
        } else {
            ({ error } = await supabase.from('cbse_observations').insert(obsData));
        }

        if (error) {
            toast({ variant: 'destructive', title: 'Error saving observation', description: error.message });
        } else {
            toast({ title: `Observation ${selectedObservation ? 'updated' : 'added'} successfully!` });
            handleCloseDialog();
            fetchObservations();
        }
        setLoading(false);
    };

    const handleDelete = async () => {
        if (!selectedObservation) return;
        setLoading(true);
        const { error } = await supabase.from('cbse_observations').delete().eq('id', selectedObservation.id);
        if (error) {
            toast({ variant: 'destructive', title: 'Error deleting observation', description: error.message });
        } else {
            toast({ title: 'Observation deleted successfully!' });
            setIsAlertOpen(false);
            setSelectedObservation(null);
            fetchObservations();
        }
        setLoading(false);
    };

    return (
        <DashboardLayout>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Observation List</CardTitle>
                    <Button onClick={() => handleOpenDialog()}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Observation
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {loading ? (
                                    <tr><td colSpan="3" className="text-center py-4"><Loader2 className="mx-auto animate-spin" /></td></tr>
                                ) : observations.length === 0 ? (
                                    <tr><td colSpan="3" className="text-center py-4">No observations found.</td></tr>
                                ) : (
                                    observations.map((obs) => (
                                        <tr key={obs.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">{obs.name}</td>
                                            <td className="px-6 py-4">{obs.description}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(obs)}><Edit className="h-4 w-4" /></Button>
                                                <Button variant="ghost" size="icon" onClick={() => { setSelectedObservation(obs); setIsAlertOpen(true); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
                        <DialogTitle>{selectedObservation ? 'Edit Observation' : 'Add Observation'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="name">Observation Name *</Label>
                            <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
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
                        <AlertDialogDescription>This action cannot be undone. This will permanently delete the observation.</AlertDialogDescription>
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

export default CbseObservation;
