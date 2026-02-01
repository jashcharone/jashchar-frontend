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

const StudentCategories = ({ embedded = false }) => {
  const { user, currentSessionId, organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  
  // Form States
  const [currentCategory, setCurrentCategory] = useState(null);
  const [formData, setFormData] = useState({ name: '' });
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (user?.profile?.branch_id && selectedBranch) {
      fetchCategories();
    }
  }, [user, selectedBranch]);

  const fetchCategories = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('student_categories')
      .select('*')
      .eq('branch_id', selectedBranch.id)
      .order('name');
    
    if (error) {
      toast({ variant: 'destructive', title: 'Error fetching categories', description: error.message });
    } else {
      setCategories(data || []);
    }
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!formData.name.trim()) return;
    setActionLoading(true);
    
    const { error } = await supabase
      .from('student_categories')
      .insert([{
        branch_id: selectedBranch.id,
        session_id: currentSessionId,
        organization_id: organizationId,
        name: formData.name.trim()
      }]);

    if (error) {
      toast({ variant: 'destructive', title: 'Error adding category', description: error.message });
    } else {
      toast({ title: 'Success', description: 'Category added successfully' });
      setIsAddOpen(false);
      setFormData({ name: '' });
      fetchCategories();
    }
    setActionLoading(false);
  };

  const handleEdit = async () => {
    if (!formData.name.trim() || !currentCategory) return;
    setActionLoading(true);

    const { error } = await supabase
      .from('student_categories')
      .update({ name: formData.name.trim() })
      .eq('id', currentCategory.id);

    if (error) {
      toast({ variant: 'destructive', title: 'Error updating category', description: error.message });
    } else {
      toast({ title: 'Success', description: 'Category updated successfully' });
      setIsEditOpen(false);
      setCurrentCategory(null);
      setFormData({ name: '' });
      fetchCategories();
    }
    setActionLoading(false);
  };

  const handleDelete = async () => {
    if (!currentCategory) return;
    setActionLoading(true);

    const { error } = await supabase
      .from('student_categories')
      .delete()
      .eq('id', currentCategory.id);

    if (error) {
      toast({ variant: 'destructive', title: 'Error deleting category', description: error.message });
    } else {
      toast({ title: 'Success', description: 'Category deleted successfully' });
      setIsDeleteOpen(false);
      setCurrentCategory(null);
      fetchCategories();
    }
    setActionLoading(false);
  };

  const openEdit = (category) => {
    setCurrentCategory(category);
    setFormData({ name: category.name });
    setIsEditOpen(true);
  };

  const openDelete = (category) => {
    setCurrentCategory(category);
    setIsDeleteOpen(true);
  };

  const content = (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Student Categories</h1>
          <Button onClick={() => { setFormData({ name: '' }); setIsAddOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Add Category
          </Button>
        </div>

        <div className="bg-card rounded-lg shadow p-6 border">
          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category Name</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">
                      No categories found. Add one to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  categories.map((cat) => (
                    <TableRow key={cat.id}>
                      <TableCell className="font-medium">{cat.name}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(cat)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-red-500" onClick={() => openDelete(cat)}>
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
            <DialogHeader><DialogTitle>Add Category</DialogTitle></DialogHeader>
            <div className="py-4">
              <Label>Category Name</Label>
              <Input 
                value={formData.name} 
                onChange={e => setFormData({ ...formData, name: e.target.value })} 
                placeholder="e.g. General, OBC"
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
            <DialogHeader><DialogTitle>Edit Category</DialogTitle></DialogHeader>
            <div className="py-4">
              <Label>Category Name</Label>
              <Input 
                value={formData.name} 
                onChange={e => setFormData({ ...formData, name: e.target.value })} 
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
                This action cannot be undone. This will permanently delete the category "{currentCategory?.name}".
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

export default StudentCategories;
