import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Edit, Trash2, Save, Loader2, Bed, ArrowLeft } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const RoomTypes = () => {
  const navigate = useNavigate();
  const { user, currentSessionId, organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingRoomType, setEditingRoomType] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [formData, setFormData] = useState({
    name: '',
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
      description: roomType.description || ''
    } : {
      name: '', description: ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingRoomType(null);
    setFormData({ name: '', description: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({ variant: 'destructive', title: 'Room type name is required.' });
      return;
    }
    
    if (!branchId) {
      toast({ variant: 'destructive', title: 'Branch not selected. Please select a branch.' });
      return;
    }
    
    setIsSubmitting(true);

    const payload = {
      name: formData.name.trim(),
      description: formData.description?.trim() || null,
      branch_id: branchId
    };

    if (organizationId) payload.organization_id = organizationId;
    if (currentSessionId) payload.session_id = currentSessionId;

    let result;
    if (editingRoomType) {
      result = await supabase.from('hostel_room_types').update(payload).eq('id', editingRoomType.id).select();
    } else {
      result = await supabase.from('hostel_room_types').insert(payload).select();
    }

    if (result.error) {
      toast({ variant: 'destructive', title: `Error ${editingRoomType ? 'updating' : 'creating'} room type`, description: result.error.message });
    } else {
      toast({ title: 'Success!', description: `Room type successfully ${editingRoomType ? 'updated' : 'created'}.` });
      await fetchRoomTypes();
      setEditingRoomType(null);
      setFormData({ name: '', description: '' });
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

  // Pagination
  const totalPages = Math.ceil(roomTypes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRoomTypes = roomTypes.slice(startIndex, startIndex + itemsPerPage);

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)} className="h-10 w-10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Room Types</h1>
            <p className="text-sm text-muted-foreground">Manage hostel room types (fees are configured in Fee Structures)</p>
          </div>
        </div>

        {/* Stats Card */}
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800 max-w-xs">
          <CardContent className="flex items-center p-4">
            <Bed className="h-10 w-10 text-blue-600 mr-4" />
            <div>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{roomTypes.length}</p>
              <p className="text-sm text-blue-600 dark:text-blue-400">Total Room Types</p>
            </div>
          </CardContent>
        </Card>

        {/* Main Content: Left Form + Right List */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Side - Add/Edit Form */}
          <Card className="lg:col-span-1">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4">
                {editingRoomType ? 'Edit Room Type' : 'Add Room Type'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Room Type Name *</Label>
                  <Input id="name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value.replace(/[^a-zA-Z\s\-']/g, '')})} placeholder="e.g. Single Occupancy AC" />
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
                  {editingRoomType && (
                    <Button type="button" variant="outline" onClick={handleCancelEdit}>
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Right Side - Room Type List */}
          <Card className="lg:col-span-2">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Room Type List</h2>
              </div>

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
                <div className="border rounded-lg overflow-hidden max-h-[500px] overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow className="bg-muted/50">
                        <TableHead className="w-[50px]">#</TableHead>
                        <TableHead>Room Type</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-center">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedRoomTypes.map((roomType, index) => (
                        <TableRow key={roomType.id}>
                          <TableCell>{startIndex + index + 1}</TableCell>
                          <TableCell className="font-medium">{roomType.name}</TableCell>
                          <TableCell className="max-w-[300px] truncate">{roomType.description || '-'}</TableCell>
                          <TableCell className="text-center space-x-2">
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleOpenDialog(roomType)}>
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
                </div>
              )}

              {/* Pagination */}
              {roomTypes.length > 0 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, roomTypes.length)} of {roomTypes.length} entries
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

export default RoomTypes;
