import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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

const StudentHouse = ({ embedded = false }) => {
  const { user, currentSessionId, organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();
  const [houses, setHouses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  
  // Form States
  const [currentHouse, setCurrentHouse] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (user?.profile?.branch_id && selectedBranch) {
      fetchHouses();
    }
  }, [user, selectedBranch]);

  const fetchHouses = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('student_houses')
      .select('*')
      .eq('branch_id', selectedBranch.id)
      .order('name');
    
    if (error) {
      toast({ variant: 'destructive', title: 'Error fetching houses', description: error.message });
    } else {
      setHouses(data || []);
    }
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!formData.name.trim()) return;
    setActionLoading(true);
    
    const { error } = await supabase
      .from('student_houses')
      .insert([{
        branch_id: selectedBranch.id,
        organization_id: organizationId,
        name: formData.name.trim(),
        description: formData.description
      }]);

    if (error) {
      toast({ variant: 'destructive', title: 'Error adding house', description: error.message });
    } else {
      toast({ title: 'Success', description: 'House added successfully' });
      setIsAddOpen(false);
      setFormData({ name: '', description: '' });
      fetchHouses();
    }
    setActionLoading(false);
  };

  const handleEdit = async () => {
    if (!formData.name.trim() || !currentHouse) return;
    setActionLoading(true);

    const { error } = await supabase
      .from('student_houses')
      .update({ 
        name: formData.name.trim(),
        description: formData.description
      })
      .eq('id', currentHouse.id);

    if (error) {
      toast({ variant: 'destructive', title: 'Error updating house', description: error.message });
    } else {
      toast({ title: 'Success', description: 'House updated successfully' });
      setIsEditOpen(false);
      setCurrentHouse(null);
      setFormData({ name: '', description: '' });
      fetchHouses();
    }
    setActionLoading(false);
  };

  const handleDelete = async () => {
    if (!currentHouse) return;
    setActionLoading(true);

    const { error } = await supabase
      .from('student_houses')
      .delete()
      .eq('id', currentHouse.id);

    if (error) {
      toast({ variant: 'destructive', title: 'Error deleting house', description: error.message });
    } else {
      toast({ title: 'Success', description: 'House deleted successfully' });
      setIsDeleteOpen(false);
      setCurrentHouse(null);
      fetchHouses();
    }
    setActionLoading(false);
  };

  const openEdit = (house) => {
    setCurrentHouse(house);
    setFormData({ name: house.name, description: house.description || '' });
    setIsEditOpen(true);
  };

  const openDelete = (house) => {
    setCurrentHouse(house);
    setIsDeleteOpen(true);
  };

  const content = (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Student Houses</h1>
          <Button onClick={() => { setFormData({ name: '', description: '' }); setIsAddOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Add House
          </Button>
        </div>

        <div className="bg-card rounded-lg shadow p-6 border">
          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>House Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {houses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                      No houses found. Add one to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  houses.map((house) => (
                    <TableRow key={house.id}>
                      <TableCell className="font-medium">{house.name}</TableCell>
                      <TableCell>{house.description}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(house)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-red-500" onClick={() => openDelete(house)}>
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
            <DialogHeader><DialogTitle>Add House</DialogTitle></DialogHeader>
            <div className="py-4 space-y-4">
              <div>
                <Label>House Name</Label>
                <Input 
                  value={formData.name} 
                  onChange={e => setFormData({ ...formData, name: e.target.value })} 
                  placeholder="e.g. Red House"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea 
                  value={formData.description} 
                  onChange={e => setFormData({ ...formData, description: e.target.value })} 
                  placeholder="Optional description"
                />
              </div>
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
            <DialogHeader><DialogTitle>Edit House</DialogTitle></DialogHeader>
            <div className="py-4 space-y-4">
              <div>
                <Label>House Name</Label>
                <Input 
                  value={formData.name} 
                  onChange={e => setFormData({ ...formData, name: e.target.value })} 
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea 
                  value={formData.description} 
                  onChange={e => setFormData({ ...formData, description: e.target.value })} 
                />
              </div>
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
                This action cannot be undone. This will permanently delete the house "{currentHouse?.name}".
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
  );

  return embedded ? content : (
    <DashboardLayout>
      {content}
    </DashboardLayout>
  );
};

export default StudentHouse;
