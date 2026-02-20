import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Pencil, Trash2, Loader2, Save, X } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const DisableReason = () => {
  const { user, organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();
  const [reasons, setReasons] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  
  // Form States
  const [currentReason, setCurrentReason] = useState(null);
  const [formData, setFormData] = useState({ reason: '' });
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (user?.profile?.branch_id && selectedBranch) {
      fetchReasons();
    }
  }, [user, selectedBranch]);

  const fetchReasons = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('disable_reasons')
      .select('*')
      .eq('branch_id', selectedBranch.id)
      .order('reason');
    
    if (error) {
      toast({ variant: 'destructive', title: 'Error fetching reasons', description: error.message });
    } else {
      setReasons(data || []);
    }
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!formData.reason.trim()) return;
    setActionLoading(true);
    
    const { error } = await supabase
      .from('disable_reasons')
      .insert([{
        branch_id: selectedBranch.id,
        organization_id: organizationId,
        reason: formData.reason.trim()
      }]);

    if (error) {
      toast({ variant: 'destructive', title: 'Error adding reason', description: error.message });
    } else {
      toast({ title: 'Success', description: 'Reason added successfully' });
      setIsAddOpen(false);
      setFormData({ reason: '' });
      fetchReasons();
    }
    setActionLoading(false);
  };

  const handleEdit = async () => {
    if (!formData.reason.trim() || !currentReason) return;
    setActionLoading(true);

    const { error } = await supabase
      .from('disable_reasons')
      .update({ reason: formData.reason.trim() })
      .eq('id', currentReason.id);

    if (error) {
      toast({ variant: 'destructive', title: 'Error updating reason', description: error.message });
    } else {
      toast({ title: 'Success', description: 'Reason updated successfully' });
      setIsEditOpen(false);
      setCurrentReason(null);
      setFormData({ reason: '' });
      fetchReasons();
    }
    setActionLoading(false);
  };

  const handleDelete = async () => {
    if (!currentReason) return;
    setActionLoading(true);

    const { error } = await supabase
      .from('disable_reasons')
      .delete()
      .eq('id', currentReason.id);

    if (error) {
      toast({ variant: 'destructive', title: 'Error deleting reason', description: error.message });
    } else {
      toast({ title: 'Success', description: 'Reason deleted successfully' });
      setIsDeleteOpen(false);
      setCurrentReason(null);
      fetchReasons();
    }
    setActionLoading(false);
  };

  const openEdit = (reason) => {
    setCurrentReason(reason);
    setFormData({ reason: reason.reason });
    setIsEditOpen(true);
  };

  const openDelete = (reason) => {
    setCurrentReason(reason);
    setIsDeleteOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Disable Reasons</h1>
          <Button onClick={() => { setFormData({ reason: '' }); setIsAddOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Add Reason
          </Button>
        </div>

        <div className="bg-card rounded-lg shadow p-6 border">
          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reason</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reasons.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">
                      No reasons found. Add one to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  reasons.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.reason}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-red-500" onClick={() => openDelete(item)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Add Dialog */}
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Reason</DialogTitle></DialogHeader>
            <div className="py-4">
              <Label>Reason</Label>
              <Input 
                value={formData.reason} 
                onChange={e => setFormData({ ...formData, reason: e.target.value })} 
                placeholder="e.g. Transfer, Fees Default"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button onClick={handleAdd} disabled={actionLoading}>
                {actionLoading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Save'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Edit Reason</DialogTitle></DialogHeader>
            <div className="py-4">
              <Label>Reason</Label>
              <Input 
                value={formData.reason} 
                onChange={e => setFormData({ ...formData, reason: e.target.value })} 
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
              <Button onClick={handleEdit} disabled={actionLoading}>
                {actionLoading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Update'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Alert */}
        <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the reason "{currentReason?.reason}".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                {actionLoading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div>
    </DashboardLayout>
  );
};

export default DisableReason;
