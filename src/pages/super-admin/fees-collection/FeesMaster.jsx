import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash, UserPlus, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import DatePicker from '@/components/ui/DatePicker';
import { useNavigate } from 'react-router-dom';

const FeesMaster = () => {
    const { user, school, currentSessionId, organizationId } = useAuth();
    const { selectedBranch } = useBranch();
    const currencySymbol = school?.currency_symbol || '₹';
    const { toast } = useToast();
    const navigate = useNavigate();
    const [feeMasters, setFeeMasters] = useState([]);
    const [feeGroups, setFeeGroups] = useState([]);
    const [feeTypes, setFeeTypes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingMaster, setEditingMaster] = useState(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    
    const [formData, setFormData] = useState({
        fee_group_id: '',
        fee_type_id: '',
        due_date: null,
        amount: '',
        fine_type: 'none',
        fine_value: '',
        is_fine_per_day: false,
    });

    const branchId = user?.profile?.branch_id;

    const fetchFeeMasters = useCallback(async () => {
        if (!branchId || !selectedBranch) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('fee_masters')
            .select(`*, fee_groups(name), fee_types(name)`)
            .eq('branch_id', selectedBranch.id)
            .order('created_at', { ascending: false });

        if (error) {
            toast({ variant: 'destructive', title: 'Error fetching fee masters', description: error.message });
        } else {
            setFeeMasters(data);
        }
        setLoading(false);
    }, [branchId, selectedBranch, toast]);

    const fetchDropdowns = useCallback(async () => {
        if (!branchId || !selectedBranch) return;
        const [groupsRes, typesRes] = await Promise.all([
            supabase.from('fee_groups').select('id, name').eq('branch_id', selectedBranch.id),
            supabase.from('fee_types').select('id, name').eq('branch_id', selectedBranch.id)
        ]);
        if (groupsRes.error) toast({ variant: 'destructive', title: 'Error fetching fee groups' });
        else setFeeGroups(groupsRes.data);
        if (typesRes.error) toast({ variant: 'destructive', title: 'Error fetching fee types' });
        else setFeeTypes(typesRes.data);
    }, [branchId, selectedBranch, toast]);

    useEffect(() => {
        fetchFeeMasters();
        fetchDropdowns();
    }, [fetchFeeMasters, fetchDropdowns]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleDateChange = (date) => {
        setFormData(prev => ({ ...prev, due_date: date }));
    };

    const resetForm = () => {
        setFormData({ fee_group_id: '', fee_type_id: '', due_date: null, amount: '', fine_type: 'none', fine_value: '', is_fine_per_day: false });
        setEditingMaster(null);
    };

    const openAddDialog = () => {
        resetForm();
        setIsDialogOpen(true);
    };

    const openEditDialog = (master) => {
        setEditingMaster(master);
        setFormData({
            fee_group_id: master.fee_group_id,
            fee_type_id: master.fee_type_id,
            due_date: master.due_date,
            amount: master.amount,
            fine_type: master.fine_type,
            fine_value: master.fine_value || '',
            is_fine_per_day: master.is_fine_per_day || false,
        });
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        if (!selectedBranch) {
            toast({ variant: 'destructive', title: 'Error', description: 'Branch not selected.' });
            setIsSubmitting(false);
            return;
        }

        const dataToSubmit = {
            ...formData,
            branch_id: selectedBranch.id,
            session_id: currentSessionId,
            organization_id: organizationId,
            amount: parseFloat(formData.amount),
            fine_value: formData.fine_value ? parseFloat(formData.fine_value) : null,
        };

        let error;
        if (editingMaster) {
            ({ error } = await supabase.from('fee_masters').update(dataToSubmit).eq('id', editingMaster.id));
        } else {
            ({ error } = await supabase.from('fee_masters').insert([dataToSubmit]));
        }

        if (error) {
            toast({ variant: 'destructive', title: 'Error saving fee master', description: error.message });
        } else {
            toast({ title: 'Success!', description: `Fee master ${editingMaster ? 'updated' : 'added'}.` });
            setIsDialogOpen(false);
            fetchFeeMasters();
        }
        setIsSubmitting(false);
    };

    const handleDelete = async (masterId) => {
        if (!window.confirm('Are you sure you want to delete this fee master?')) return;
        
        // Check for dependencies before deleting
        const { data: allocations, error: allocError } = await supabase.from('student_fee_allocations').select('id').eq('fee_master_id', masterId).limit(1);
        if (allocError) {
             toast({ variant: 'destructive', title: 'Error checking dependencies', description: allocError.message });
             return;
        }
        if (allocations.length > 0) {
            toast({ variant: 'destructive', title: 'Cannot Delete', description: 'This fee master is already assigned to students.' });
            return;
        }

        const { error } = await supabase.from('fee_masters').delete().eq('id', masterId);
        if (error) {
            toast({ variant: 'destructive', title: 'Error deleting fee master', description: error.message });
        } else {
            toast({ title: 'Success!', description: 'Fee master deleted.' });
            fetchFeeMasters();
        }
    };
    
    return (
        <DashboardLayout>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Fees Master</h1>
                <Button onClick={openAddDialog}><Plus className="mr-2 h-4 w-4" /> Add Fees Master</Button>
            </div>
            
            <div className="bg-card p-6 rounded-lg shadow-sm">
                <h2 className="text-xl font-bold mb-4">Fees Master List</h2>
                {loading ? <p>Loading...</p> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted">
                                <tr>
                                    <th className="p-3">Fees Group</th>
                                    <th className="p-3">Fees Type</th>
                                    <th className="p-3">Due Date</th>
                                    <th className="p-3">Amount</th>
                                    <th className="p-3">Fine Type</th>
                                    <th className="p-3">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {feeMasters.map(master => (
                                    <tr key={master.id} className="border-b">
                                        <td className="p-3">{master.fee_groups.name}</td>
                                        <td className="p-3">{master.fee_types.name}</td>
                                        <td className="p-3">{master.due_date}</td>
                                        <td className="p-3">{currencySymbol}{master.amount}</td>
                                        <td className="p-3 capitalize">{master.fine_type.replace('_', ' ')}</td>
                                        <td className="p-3 flex space-x-1">
                                            <Button variant="ghost" size="sm" onClick={() => navigate(`/super-admin/fees-collection/master/${master.id}/assign`)}>
                                                <UserPlus className="h-4 w-4 mr-2" /> Assign/View
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => openEditDialog(master)}><Edit className="h-4 w-4" /></Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(master.id)}><Trash className="h-4 w-4 text-destructive" /></Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingMaster ? 'Edit' : 'Add'} Fees Master</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        <div>
                            <Label htmlFor="fee_group_id" required>Fees Group</Label>
                            <Select value={formData.fee_group_id} onValueChange={(v) => setFormData(p=>({...p, fee_group_id: v}))} required>
                                <SelectTrigger><SelectValue placeholder="Select Group" /></SelectTrigger>
                                <SelectContent>{feeGroups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="fee_type_id" required>Fees Type</Label>
                             <Select value={formData.fee_type_id} onValueChange={(v) => setFormData(p=>({...p, fee_type_id: v}))} required>
                                <SelectTrigger><SelectValue placeholder="Select Type" /></SelectTrigger>
                                <SelectContent>{feeTypes.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <DatePicker label="Due Date" value={formData.due_date} onChange={handleDateChange} required />
                        <div><Label htmlFor="amount" required>Amount</Label><Input id="amount" name="amount" type="number" value={formData.amount} onChange={handleInputChange} required /></div>
                        <div>
                            <Label>Fine Type</Label>
                            <Select value={formData.fine_type} onValueChange={(v) => setFormData(p=>({...p, fine_type: v}))}>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
                                    <SelectItem value="percentage">Percentage</SelectItem>
                                    <SelectItem value="fix_amount">Fix Amount</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                         {formData.fine_type !== 'none' && <>
                            <div><Label htmlFor="fine_value">Fine Value</Label><Input id="fine_value" name="fine_value" type="number" value={formData.fine_value} onChange={handleInputChange}/></div>
                            <div className="flex items-center space-x-2"><Input type="checkbox" id="is_fine_per_day" name="is_fine_per_day" checked={formData.is_fine_per_day} onChange={handleInputChange} className="w-4 h-4"/><Label htmlFor="is_fine_per_day">Per Day Fine</Label></div>
                        </>}
                        <DialogFooter>
                            <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="animate-spin" /> : 'Save'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
};

export default FeesMaster;
