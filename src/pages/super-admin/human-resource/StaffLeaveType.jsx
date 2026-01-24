import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Trash2, Edit, Plus } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";

const StaffLeaveType = () => {
    const { toast } = useToast();
    const { user } = useAuth();
    const { selectedBranch } = useBranch();
    const [leaveTypes, setLeaveTypes] = useState([]);
    const [typeName, setTypeName] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    let branchId = user?.profile?.branch_id;
    if (!branchId) {
        branchId = sessionStorage.getItem('ma_target_branch_id');
    }

    const fetchLeaveTypes = async () => {
        if (!branchId || !selectedBranch?.id) return;
        setIsFetching(true);
        const { data, error } = await supabase
            .from('leave_types')
            .select('*')
            .eq('branch_id', selectedBranch.id)
            .order('name');
        
        if (error) {
            console.error(error);
            toast({ variant: "destructive", title: "Error fetching leave types" });
        } else {
            setLeaveTypes(data || []);
        }
        setIsFetching(false);
    };

    useEffect(() => {
        if (branchId && selectedBranch?.id) {
            fetchLeaveTypes();
        }
    }, [branchId, selectedBranch?.id]);

    const handleSubmit = async () => {
        if (!typeName.trim()) {
            toast({ variant: "destructive", title: "Name is required" });
            return;
        }
        if (!selectedBranch?.id) {
            toast({ variant: "destructive", title: "Branch not selected" });
            return;
        }
        setLoading(true);
        
        const payload = {
            name: typeName,
            branch_id: selectedBranch.id
        };

        let error;
        if (editingId) {
            const { error: updateError } = await supabase
                .from('leave_types')
                .update(payload)
                .eq('id', editingId);
            error = updateError;
        } else {
            const { error: insertError } = await supabase
                .from('leave_types')
                .insert(payload);
            error = insertError;
        }

        setLoading(false);

        if (error) {
            toast({ variant: "destructive", title: "Error saving leave type", description: error.message });
        } else {
            toast({ title: "Success", description: "Leave type saved successfully" });
            setTypeName('');
            setEditingId(null);
            setIsModalOpen(false);
            fetchLeaveTypes();
        }
    };

    const handleDelete = async (typeId) => {
        if (!window.confirm("Are you sure you want to delete this leave type?")) return;
        
        const { error } = await supabase
            .from('leave_types')
            .delete()
            .eq('id', typeId);

        if (error) {
            toast({ variant: "destructive", title: "Error deleting leave type" });
        } else {
            toast({ title: "Deleted successfully" });
            fetchLeaveTypes();
        }
    };
    
    const handleEdit = (type) => {
        setTypeName(type.name);
        setEditingId(type.id);
        setIsModalOpen(true);
    };

    const openAddModal = () => {
        setTypeName('');
        setEditingId(null);
        setIsModalOpen(true);
    };

    return (
        <DashboardLayout>
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">Leave Types</h1>
                    <Button onClick={openAddModal}><Plus className="mr-2 h-4 w-4" /> Add Leave Type</Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Leave Type List</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isFetching ? (
                            <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>
                        ) : leaveTypes.length === 0 ? (
                            <div className="text-center p-4 text-muted-foreground">No leave types found.</div>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {leaveTypes.map((type) => (
                                    <div key={type.id} className="flex items-center justify-between p-4 border rounded-lg shadow-sm bg-card">
                                        <span className="font-medium">{type.name}</span>
                                        <div className="flex gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => handleEdit(type)}>
                                                <Edit className="h-4 w-4 text-blue-500" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(type.id)}>
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingId ? 'Edit Leave Type' : 'Add Leave Type'}</DialogTitle>
                        </DialogHeader>
                        <div className="py-4">
                            <Label>Leave Type Name</Label>
                            <Input 
                                value={typeName} 
                                onChange={(e) => setTypeName(e.target.value)} 
                                placeholder="Enter leave type name"
                            />
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                            <Button onClick={handleSubmit} disabled={loading}>
                                {loading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Save'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
};

export default StaffLeaveType;
