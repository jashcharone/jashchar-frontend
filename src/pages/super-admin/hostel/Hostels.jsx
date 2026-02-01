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
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Edit, Trash2, Save, Loader2, Building2, Users } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';

const Hostels = () => {
  const { user, currentSessionId, organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingHostel, setEditingHostel] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'Boys',
    address: '',
    intake: '',
    description: ''
  });

  const branchId = selectedBranch?.id || user?.profile?.branch_id;

  const fetchHostels = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    
    const { data, error } = await supabase
      .from('hostels')
      .select('*')
      .eq('branch_id', branchId)
      .order('created_at', { ascending: false });

    if (error) {
      toast({ variant: 'destructive', title: 'Error fetching hostels', description: error.message });
    } else {
      setHostels(data || []);
    }
    setLoading(false);
  }, [branchId, branchId, toast]);

  useEffect(() => {
    fetchHostels();
  }, [fetchHostels]);

  const handleOpenDialog = (hostel = null) => {
    setEditingHostel(hostel);
    setFormData(hostel ? {
      name: hostel.name || '',
      type: hostel.type || 'Boys',
      address: hostel.address || '',
      intake: hostel.intake || '',
      description: hostel.description || ''
    } : {
      name: '', type: 'Boys', address: '', intake: '', description: ''
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingHostel(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({ variant: 'destructive', title: 'Hostel name is required.' });
      return;
    }
    setIsSubmitting(true);

    const payload = {
      name: formData.name,
      type: formData.type,
      address: formData.address || null,
      intake: formData.intake ? parseInt(formData.intake) : null,
      description: formData.description || null,
      branch_id: branchId,
      session_id: currentSessionId,
      organization_id: organizationId
    };

    let error;
    if (editingHostel) {
      ({ error } = await supabase.from('hostels').update(payload).eq('id', editingHostel.id));
    } else {
      ({ error } = await supabase.from('hostels').insert(payload));
    }

    if (error) {
      toast({ variant: 'destructive', title: `Error ${editingHostel ? 'updating' : 'creating'} hostel`, description: error.message });
    } else {
      toast({ title: 'Success!', description: `Hostel successfully ${editingHostel ? 'updated' : 'created'}.` });
      await fetchHostels();
      handleCloseDialog();
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (hostelId) => {
    const { error } = await supabase.from('hostels').delete().eq('id', hostelId);
    if (error) {
      toast({ variant: 'destructive', title: 'Error deleting hostel', description: error.message });
    } else {
      toast({ title: 'Success!', description: 'Hostel deleted successfully.' });
      await fetchHostels();
    }
  };

  const totalIntake = hostels.reduce((sum, h) => sum + (h.intake || 0), 0);

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Building2 className="h-8 w-8 text-primary" /> Hostels
            </h1>
            <p className="text-muted-foreground mt-1">Manage hostels</p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" /> Add Hostel
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
            <CardContent className="flex items-center p-4">
              <Building2 className="h-10 w-10 text-blue-600 mr-4" />
              <div>
                <p className="text-2xl font-bold text-blue-700">{hostels.length}</p>
                <p className="text-sm text-blue-600">Total Hostels</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
            <CardContent className="flex items-center p-4">
              <Users className="h-10 w-10 text-green-600 mr-4" />
              <div>
                <p className="text-2xl font-bold text-green-700">{totalIntake}</p>
                <p className="text-sm text-green-600">Total Capacity</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
            <CardContent className="flex items-center p-4">
              <Building2 className="h-10 w-10 text-purple-600 mr-4" />
              <div>
                <p className="text-2xl font-bold text-purple-700">
                  {hostels.filter(h => h.type === 'Boys').length} / {hostels.filter(h => h.type === 'Girls').length}
                </p>
                <p className="text-sm text-purple-600">Boys / Girls Hostels</p>
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
            ) : hostels.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hostels found. Add one to get started.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[50px]">#</TableHead>
                    <TableHead>Hostel Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead className="text-center">Capacity</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hostels.map((hostel, index) => (
                    <TableRow key={hostel.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">{hostel.name}</TableCell>
                      <TableCell>
                        <Badge variant={hostel.type === 'Boys' ? 'default' : hostel.type === 'Girls' ? 'secondary' : 'outline'}>
                          {hostel.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">{hostel.address || '-'}</TableCell>
                      <TableCell className="text-center">{hostel.intake || '-'}</TableCell>
                      <TableCell className="text-center space-x-2">
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleOpenDialog(hostel)}>
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
                              <AlertDialogTitle>Delete Hostel?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete "{hostel.name}" and all associated rooms. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(hostel.id)} className="bg-destructive hover:bg-destructive/90">
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
              <DialogTitle>{editingHostel ? 'Edit Hostel' : 'Add New Hostel'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Hostel Name *</Label>
                    <Input id="name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="e.g. Boys Hostel A" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Hostel Type</Label>
                    <Select value={formData.type} onValueChange={(v) => setFormData({...formData, type: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Boys">Boys</SelectItem>
                        <SelectItem value="Girls">Girls</SelectItem>
                        <SelectItem value="Co-ed">Co-ed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="intake">Total Capacity (Intake)</Label>
                  <Input id="intake" type="number" value={formData.intake} onChange={(e) => setFormData({...formData, intake: e.target.value})} placeholder="e.g. 100" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea id="address" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} placeholder="Hostel address" rows={2} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Additional details about the hostel" rows={2} />
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

export default Hostels;
