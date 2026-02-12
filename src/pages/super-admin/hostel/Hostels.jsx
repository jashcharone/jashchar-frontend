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
import { Edit, Trash2, Save, Loader2, Building2, Users } from 'lucide-react';
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
  const [editingHostel, setEditingHostel] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
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
  }, [branchId, toast]);

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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingHostel(null);
    setFormData({ name: '', type: 'Boys', address: '', intake: '', description: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({ variant: 'destructive', title: 'Hostel name is required.' });
      return;
    }
    
    if (formData.intake && parseInt(formData.intake) < 0) {
      toast({ variant: 'destructive', title: 'Total capacity cannot be negative.' });
      return;
    }
    
    if (!branchId) {
      toast({ variant: 'destructive', title: 'Branch not selected. Please select a branch.' });
      return;
    }
    
    setIsSubmitting(true);

    const payload = {
      name: formData.name.trim(),
      type: formData.type,
      address: formData.address?.trim() || null,
      intake: formData.intake ? parseInt(formData.intake) : null,
      description: formData.description?.trim() || null,
      branch_id: branchId
    };

    if (organizationId) payload.organization_id = organizationId;
    if (currentSessionId) payload.session_id = currentSessionId;

    let result;
    if (editingHostel) {
      result = await supabase.from('hostels').update(payload).eq('id', editingHostel.id).select();
    } else {
      result = await supabase.from('hostels').insert(payload).select();
    }

    if (result.error) {
      toast({ variant: 'destructive', title: `Error ${editingHostel ? 'updating' : 'creating'} hostel`, description: result.error.message });
    } else {
      toast({ title: 'Success!', description: `Hostel successfully ${editingHostel ? 'updated' : 'created'}.` });
      await fetchHostels();
      setEditingHostel(null);
      setFormData({ name: '', type: 'Boys', address: '', intake: '', description: '' });
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

  // Pagination
  const totalPages = Math.ceil(hostels.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedHostels = hostels.slice(startIndex, startIndex + itemsPerPage);

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
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

        {/* Main Content: Left Form + Right List */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Side - Add/Edit Form */}
          <Card className="lg:col-span-1">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4">
                {editingHostel ? 'Edit Hostel' : 'Add Hostel'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Hostel Name *</Label>
                  <Input id="name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value.replace(/[^a-zA-Z\s\-']/g, '')})} placeholder="e.g. Boys Hostel A" />
                </div>

                <div className="space-y-2">
                  <Label>Hostel Type *</Label>
                  <Select value={formData.type} onValueChange={(v) => setFormData({...formData, type: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Boys">Boys</SelectItem>
                      <SelectItem value="Girls">Girls</SelectItem>
                      <SelectItem value="Co-ed">Co-ed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="intake">Total Capacity *</Label>
                  <Input id="intake" type="number" min="0" value={formData.intake} onChange={(e) => setFormData({...formData, intake: e.target.value})} placeholder="e.g. 100" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea id="address" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} placeholder="Hostel address" rows={2} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Additional details" rows={3} />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button type="submit" disabled={isSubmitting} className="flex-1">
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save
                  </Button>
                  {editingHostel && (
                    <Button type="button" variant="outline" onClick={handleCancelEdit}>
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Right Side - Hostel List */}
          <Card className="lg:col-span-2">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Hostel List</h2>
              </div>

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
                <div className="border rounded-lg overflow-hidden max-h-[500px] overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow className="bg-muted/50">
                        <TableHead className="w-[50px]">#</TableHead>
                        <TableHead>Hostel Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Address</TableHead>
                        <TableHead className="text-center">Capacity</TableHead>
                        <TableHead className="text-center">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedHostels.map((hostel, index) => (
                        <TableRow key={hostel.id}>
                          <TableCell>{startIndex + index + 1}</TableCell>
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
                              <Edit className="h-4 w-4 text-blue-600" />
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
                </div>
              )}

              {/* Pagination */}
              {hostels.length > 0 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, hostels.length)} of {hostels.length} entries
                  </p>
                  <div className="flex items-center gap-2">
                    <Select value={String(itemsPerPage)} onValueChange={(v) => { setItemsPerPage(Number(v)); setCurrentPage(1); }}>
                      <SelectTrigger className="w-[80px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>«</Button>
                      <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>‹</Button>
                      <span className="px-3 py-1 text-sm">Page {currentPage} of {totalPages || 1}</span>
                      <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}>›</Button>
                      <Button variant="outline" size="sm" onClick={() => setCurrentPage(totalPages)} disabled={currentPage >= totalPages}>»</Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Hostels;
