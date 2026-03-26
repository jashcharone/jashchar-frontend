/**
 * TEMPLATE: Copy this file when creating new module pages
 * This includes all permission checks pre-configured
 * 
 * STEPS TO USE:
 * 1. Copy this file
 * 2. Rename to YourModuleName.jsx
 * 3. Replace MODULE_SLUG with actual slug (e.g., 'academics.subjects', 'fees.fee_types')
 * 4. Update component name, state, API calls
 * 5. That's it! Permission checks are auto-included
 */

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { usePermissions } from '@/contexts/PermissionContext'; // ? Step 1: Import hook
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Edit, Trash2, Save, Loader2 } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

//  ️ CHANGE THIS: Replace with your module slug
const MODULE_SLUG = 'module_name.submodule_name'; // Example: 'academics.subjects', 'fees.fee_types'

const YourModulePage = () => {
    const { toast } = useToast();
    const { user, school } = useAuth();
    const { canView, canAdd, canEdit, canDelete } = usePermissions(); // ? Step 2: Get permission functions
    
    const [items, setItems] = useState([]);
    const [itemName, setItemName] = useState('');
    const [editingItem, setEditingItem] = useState(null);
    const [editedName, setEditedName] = useState('');
    const [loading, setLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);

    // Fetch data
    const fetchData = async () => {
        if (!user?.profile?.branch_id) return;
        setIsFetching(true);
        
        const { data, error } = await supabase
            .from('your_table_name') //  ️ Change table name
            .select('*')
            .eq('branch_id', user.profile.branch_id)
            .order('name', { ascending: true });
        
        if (error) {
            toast({ variant: 'destructive', title: 'Failed to fetch data' });
        } else {
            setItems(data);
        }
        setIsFetching(false);
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    // Create item
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!itemName.trim()) return;
        
        setLoading(true);
        const { error } = await supabase
            .from('your_table_name')
            .insert({ name: itemName, branch_id: user.profile.branch_id });
        
        if (error) {
            toast({ variant: 'destructive', title: 'Failed to add item', description: error.message });
        } else {
            toast({ title: 'Success', description: 'Item added successfully' });
            setItemName('');
            await fetchData();
        }
        setLoading(false);
    };

    // Edit item
    const handleEdit = async () => {
        if (!editedName.trim() || !editingItem) return;
        
        setLoading(true);
        const { error } = await supabase
            .from('your_table_name')
            .update({ name: editedName })
            .eq('id', editingItem.id);
        
        if (error) {
            toast({ variant: 'destructive', title: 'Failed to update item' });
        } else {
            toast({ title: 'Success', description: 'Item updated successfully' });
            setEditingItem(null);
            document.getElementById('edit-dialog-close')?.click();
            await fetchData();
        }
        setLoading(false);
    };

    // Delete item
    const handleDelete = async (id) => {
        const { error } = await supabase
            .from('your_table_name')
            .delete()
            .eq('id', id);
        
        if (error) {
            toast({ variant: 'destructive', title: 'Failed to delete item' });
        } else {
            toast({ title: 'Success', description: 'Item deleted successfully' });
            await fetchData();
        }
    };

    return (
        <DashboardLayout>
            <h1 className="text-3xl font-bold mb-6">Your Module Name</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Add Form - Only show if user has 'add' permission */}
                {canAdd(MODULE_SLUG) && (
                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle>Add New Item</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <Label htmlFor="item-name">Item Name *</Label>
                                    <Input
                                        id="item-name"
                                        placeholder="Enter name"
                                        value={itemName}
                                        onChange={(e) => setItemName(e.target.value)}
                                    />
                                </div>
                                <Button type="submit" disabled={loading} className="w-full">
                                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                    Save
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
                )}

                {/* List */}
                <div className={canAdd(MODULE_SLUG) ? "lg:col-span-2" : "lg:col-span-3"}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Item List</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="px-6 py-3 text-left">Name</th>
                                            <th className="px-6 py-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {isFetching ? (
                                            <tr><td colSpan="2" className="p-4 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></td></tr>
                                        ) : items.length === 0 ? (
                                            <tr><td colSpan="2" className="p-4 text-center text-muted-foreground">No items found</td></tr>
                                        ) : items.map(item => (
                                            <tr key={item.id} className="border-b hover:bg-muted/30">
                                                <td className="px-6 py-4 font-medium">{item.name}</td>
                                                <td className="px-6 py-4 text-right space-x-1">
                                                    
                                                    {/* ? Edit Button - Only show if user has 'edit' permission */}
                                                    {canEdit(MODULE_SLUG) && (
                                                    <Dialog onOpenChange={(isOpen) => !isOpen && setEditingItem(null)}>
                                                        <DialogTrigger asChild>
                                                            <Button variant="ghost" size="icon" onClick={() => { setEditingItem(item); setEditedName(item.name); }}>
                                                                <Edit className="h-4 w-4 text-blue-600" />
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent>
                                                            <DialogHeader>
                                                                <DialogTitle>Edit Item</DialogTitle>
                                                            </DialogHeader>
                                                            <div className="space-y-4 py-4">
                                                                <Label htmlFor="edit-name">Item Name *</Label>
                                                                <Input id="edit-name" value={editedName} onChange={(e) => setEditedName(e.target.value)} />
                                                            </div>
                                                            <DialogFooter>
                                                                <DialogClose asChild><Button id="edit-dialog-close" variant="outline">Cancel</Button></DialogClose>
                                                                <Button onClick={handleEdit} disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}</Button>
                                                            </DialogFooter>
                                                        </DialogContent>
                                                    </Dialog>
                                                    )}
                                                    
                                                    {/* ? Delete Button - Only show if user has 'delete' permission */}
                                                    {canDelete(MODULE_SLUG) && (
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-red-600" /></Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Delete Item?</AlertDialogTitle>
                                                                <AlertDialogDescription>This will permanently delete this item.</AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handleDelete(item.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
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
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default YourModulePage;
