import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Loader2, Pencil, Trash2 } from 'lucide-react';

const MarksDivision = () => {
    const { user, currentSessionId, organizationId } = useAuth();
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    const branchId = selectedBranch?.id || user?.profile?.branch_id;

    const [divisions, setDivisions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [deleteId, setDeleteId] = useState(null);
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

    const [formData, setFormData] = useState({
        division_name: '',
        percentage_from: '',
        percentage_upto: ''
    });

    const fetchDivisions = useCallback(async () => {
        if (!branchId) return;
        setLoading(true);
        
        let query = supabase
            .from('marks_divisions')
            .select('*')
            .eq('branch_id', branchId)
            .order('percentage_from', { ascending: false });

        if (currentSessionId) {
            query = query.eq('session_id', currentSessionId);
        }

        const { data, error } = await query;

        if (error) {
            toast({ variant: 'destructive', title: 'Error fetching divisions', description: error.message });
        } else {
            setDivisions(data || []);
        }
        setLoading(false);
    }, [branchId, currentSessionId, toast]);

    useEffect(() => {
        fetchDivisions();
    }, [fetchDivisions]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleBlur = (e) => {
        const { name, value } = e.target;
        if (name === 'percentage_from' || name === 'percentage_upto') {
            const numValue = parseFloat(value);
            if (!isNaN(numValue)) {
                setFormData(prev => ({ ...prev, [name]: numValue.toFixed(2) }));
            }
        }
    };

    const resetForm = () => {
        setFormData({
            division_name: '',
            percentage_from: '',
            percentage_upto: ''
        });
        setEditingId(null);
    };

    const handleEdit = (division) => {
        setEditingId(division.id);
        setFormData({
            division_name: division.division_name,
            percentage_from: parseFloat(division.percentage_from).toFixed(2),
            percentage_upto: parseFloat(division.percentage_upto).toFixed(2)
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.division_name || formData.percentage_from === '' || formData.percentage_upto === '') {
            toast({ variant: 'destructive', title: 'Validation Error', description: 'Please fill all required fields.' });
            return;
        }

        const percentFrom = parseFloat(formData.percentage_from);
        const percentUpto = parseFloat(formData.percentage_upto);

        if (isNaN(percentFrom) || isNaN(percentUpto)) {
            toast({ variant: 'destructive', title: 'Validation Error', description: 'Please enter valid percentage values.' });
            return;
        }

        if (percentFrom <= percentUpto) {
            toast({ variant: 'destructive', title: 'Validation Error', description: 'Percent From must be greater than Percent Upto.' });
            return;
        }

        if (percentFrom > 100 || percentUpto < 0) {
            toast({ variant: 'destructive', title: 'Validation Error', description: 'Percentage values must be between 0 and 100.' });
            return;
        }

        setSaving(true);

        const payload = {
            division_name: formData.division_name.trim(),
            percentage_from: percentFrom,
            percentage_upto: percentUpto,
            branch_id: branchId,
            session_id: currentSessionId,
            organization_id: organizationId
        };

        try {
            let error;
            if (editingId) {
                ({ error } = await supabase
                    .from('marks_divisions')
                    .update(payload)
                    .eq('id', editingId));
            } else {
                ({ error } = await supabase
                    .from('marks_divisions')
                    .insert([payload]));
            }

            if (error) throw error;

            toast({ title: editingId ? 'Division updated successfully!' : 'Division added successfully!' });
            resetForm();
            fetchDivisions();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error saving division', description: error.message });
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
            const { error } = await supabase
                .from('marks_divisions')
                .delete()
                .eq('id', deleteId);

            if (error) throw error;

            toast({ title: 'Division deleted successfully!' });
            fetchDivisions();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error deleting division', description: error.message });
        } finally {
            setIsDeleteAlertOpen(false);
            setDeleteId(null);
        }
    };

    return (
        <DashboardLayout>
            <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Side - Add/Edit Form */}
                    <Card>
                        <CardHeader>
                            <CardTitle>{editingId ? 'Edit Marks Division' : 'Add Marks Division'}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <Label htmlFor="division_name">Division Name <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="division_name"
                                        name="division_name"
                                        value={formData.division_name}
                                        onChange={handleInputChange}
                                        placeholder="e.g., First, Second, Third"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="percentage_from">Percent From <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="percentage_from"
                                        name="percentage_from"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max="100"
                                        value={formData.percentage_from}
                                        onChange={handleInputChange}
                                        onBlur={handleBlur}
                                        placeholder="e.g., 100.00"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="percentage_upto">Percent Upto <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="percentage_upto"
                                        name="percentage_upto"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max="100"
                                        value={formData.percentage_upto}
                                        onChange={handleInputChange}
                                        onBlur={handleBlur}
                                        placeholder="e.g., 60.00"
                                    />
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <Button type="submit" disabled={saving}>
                                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Save
                                    </Button>
                                    {editingId && (
                                        <Button type="button" variant="outline" onClick={resetForm}>
                                            Cancel
                                        </Button>
                                    )}
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Right Side - Division List */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Division List</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            ) : divisions.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">No divisions found. Add your first division.</p>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Division Name</TableHead>
                                            <TableHead>Percentage From</TableHead>
                                            <TableHead>Percentage Upto</TableHead>
                                            <TableHead className="text-right">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {divisions.map((division) => (
                                            <TableRow key={division.id}>
                                                <TableCell className="text-blue-600">{division.division_name}</TableCell>
                                                <TableCell>{parseFloat(division.percentage_from).toFixed(2)}</TableCell>
                                                <TableCell>{parseFloat(division.percentage_upto).toFixed(2)}</TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <Button
                                                            variant="default"
                                                            size="icon"
                                                            className="h-8 w-8 bg-indigo-500 hover:bg-indigo-600"
                                                            onClick={() => handleEdit(division)}
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="default"
                                                            size="icon"
                                                            className="h-8 w-8 bg-indigo-500 hover:bg-indigo-600"
                                                            onClick={() => handleDeleteClick(division.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete this division.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </DashboardLayout>
    );
};

export default MarksDivision;
