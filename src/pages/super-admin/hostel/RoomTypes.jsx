import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Edit, Trash2, Save, Loader2, Bed, IndianRupee, Users } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';

const RoomTypes = () => {
  const { user, currentSessionId, organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRoomType, setEditingRoomType] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    cost: '',
    description: ''
  });

  const branchId = selectedBranch?.id || user?.profile?.branch_id;

  const fetchRoomTypes = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    
    const { data, error } = await supabase
      .from('hostel_room_types')
      .select('*')
      .eq('branch_id', branchId)
      .order('created_at', { ascending: false });

    if (error) {
      toast({ variant: 'destructive', title: 'Error fetching room types', description: error.message });
    } else {
      setRoomTypes(data || []);
    }
    setLoading(false);
  }, [branchId, toast]);

  useEffect(() => {
    fetchRoomTypes();
  }, [fetchRoomTypes]);

  const handleOpenDialog = (roomType = null) => {
    setEditingRoomType(roomType);
    setFormData(roomType ? {
      name: roomType.name || '',
      cost: roomType.cost || '',
      description: roomType.description || ''
    } : {
      name: '', cost: '', description: ''
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingRoomType(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({ variant: 'destructive', title: 'Room type name is required.' });
      return;
    }
    setIsSubmitting(true);

    const payload = {
      name: formData.name,
      cost: formData.cost ? parseFloat(formData.cost) : null,
      description: formData.description || null,
      branch_id: branchId,
      session_id: currentSessionId,
      organization_id: organizationId
    };

    let error;
    if (editingRoomType) {
      ({ error } = await supabase.from('hostel_room_types').update(payload).eq('id', editingRoomType.id));
    } else {
      ({ error } = await supabase.from('hostel_room_types').insert(payload));
    }

    if (error) {
      toast({ variant: 'destructive', title: `Error ${editingRoomType ? 'updating' : 'creating'} room type`, description: error.message });
    } else {
      toast({ title: 'Success!', description: `Room type successfully ${editingRoomType ? 'updated' : 'created'}.` });
      await fetchRoomTypes();
      handleCloseDialog();
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (roomTypeId) => {
    const { error } = await supabase.from('hostel_room_types').delete().eq('id', roomTypeId);
    if (error) {
      toast({ variant: 'destructive', title: 'Error deleting room type', description: error.message });
    } else {
      toast({ title: 'Success!', description: 'Room type deleted successfully.' });
      await fetchRoomTypes();
    }
  };

  const formatCurrency = (amount) => {
    return amount ? `₹${parseFloat(amount).toLocaleString('en-IN')}` : '-';
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Bed className="h-8 w-8 text-primary" /> Room Types
            </h1>
            <p className="text-muted-foreground mt-1">Configure room types with pricing and amenities</p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" /> Add Room Type
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
            <CardContent className="flex items-center p-4">
              <Bed className="h-10 w-10 text-blue-600 mr-4" />
              <div>
                <p className="text-2xl font-bold text-blue-700">{roomTypes.length}</p>
                <p className="text-sm text-blue-600">Total Room Types</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
            <CardContent className="flex items-center p-4">
              <IndianRupee className="h-10 w-10 text-green-600 mr-4" />
              <div>
                <p className="text-2xl font-bold text-green-700">
                  {roomTypes.length > 0 ? formatCurrency(Math.min(...roomTypes.filter(r => r.cost).map(r => r.cost))) : '₹0'}
                </p>
                <p className="text-sm text-green-600">Lowest Cost</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
            <CardContent className="flex items-center p-4">
              <IndianRupee className="h-10 w-10 text-purple-600 mr-4" />
              <div>
                <p className="text-2xl font-bold text-purple-700">
                  {roomTypes.length > 0 ? formatCurrency(Math.max(...roomTypes.filter(r => r.cost).map(r => r.cost))) : '₹0'}
                </p>
                <p className="text-sm text-purple-600">Highest Cost</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center items-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : roomTypes.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Bed className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No room types found. Add one to get started.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[50px]">#</TableHead>
                    <TableHead>Room Type</TableHead>
                    <TableHead className="text-right">Cost (₹)</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roomTypes.map((roomType, index) => (
                    <TableRow key={roomType.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">{roomType.name}</TableCell>
                      <TableCell className="text-right font-semibold text-green-600">
                        {formatCurrency(roomType.cost)}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">{roomType.description || '-'}</TableCell>
                      <TableCell className="text-center space-x-2">
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleOpenDialog(roomType)}>
                          <Edit className="h-4 w-4 text-yellow-600" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="icon" className="h-8 w-8">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Room Type?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete "{roomType.name}". Rooms using this type may be affected.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(roomType.id)} className="bg-destructive hover:bg-destructive/90">
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingRoomType ? 'Edit Room Type' : 'Add New Room Type'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Room Type Name *</Label>
                  {/* TC-28 FIX: Only allow letters, spaces, and basic punctuation for room type names */}
                  <Input id="name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value.replace(/[^a-zA-Z\s\-']/g, '')})} placeholder="e.g. Single Sharing, Double Sharing, Dormitory" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cost">Cost (₹)</Label>
                  <Input id="cost" type="number" min="0" step="0.01" value={formData.cost} onChange={(e) => setFormData({...formData, cost: e.target.value})} placeholder="e.g. 5000" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Additional details about this room type" rows={2} />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="secondary" onClick={handleCloseDialog}>Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default RoomTypes;
