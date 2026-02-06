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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Edit, Trash2, Save, Loader2, DoorOpen, Building2, Bed, Users } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';

const HostelRooms = () => {
  const { user, currentSessionId, organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();
  const [rooms, setRooms] = useState([]);
  const [hostels, setHostels] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [filterHostel, setFilterHostel] = useState('all');
  const [formData, setFormData] = useState({
    room_number_name: '',
    hostel_id: '',
    room_type_id: '',
    num_of_beds: '',
    cost_per_bed: '',
    description: ''
  });

  const branchId = selectedBranch?.id || user?.profile?.branch_id;

  const fetchRooms = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    
    const { data, error } = await supabase
      .from('hostel_rooms')
      .select(`
        *,
        hostels(name, type),
        hostel_room_types(name, cost)
      `)
      .eq('branch_id', branchId)
      .order('room_number_name', { ascending: true });

    if (error) {
      toast({ variant: 'destructive', title: 'Error fetching rooms', description: error.message });
    } else {
      setRooms(data || []);
    }
    setLoading(false);
  }, [branchId, branchId, toast]);

  const fetchHostels = useCallback(async () => {
    if (!branchId) return;
    const { data } = await supabase.from('hostels').select('id, name, type').eq('branch_id', branchId);
    setHostels(data || []);
  }, [branchId]);

  const fetchRoomTypes = useCallback(async () => {
    if (!branchId) return;
    const { data } = await supabase.from('hostel_room_types').select('id, name, cost').eq('branch_id', branchId);
    setRoomTypes(data || []);
  }, [branchId]);

  useEffect(() => {
    fetchRooms();
    fetchHostels();
    fetchRoomTypes();
  }, [fetchRooms, fetchHostels, fetchRoomTypes]);

  const handleOpenDialog = (room = null) => {
    setEditingRoom(room);
    setFormData(room ? {
      room_number_name: room.room_number_name || '',
      hostel_id: room.hostel_id || '',
      room_type_id: room.room_type_id || '',
      num_of_beds: room.num_of_beds || '',
      cost_per_bed: room.cost_per_bed || '',
      description: room.description || ''
    } : {
      room_number_name: '', hostel_id: '', room_type_id: '', num_of_beds: '', cost_per_bed: '', description: ''
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingRoom(null);
  };

  const handleRoomTypeSelect = (roomTypeId) => {
    const roomType = roomTypes.find(rt => rt.id === roomTypeId);
    setFormData({
      ...formData,
      room_type_id: roomTypeId,
      cost_per_bed: roomType?.cost || formData.cost_per_bed
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // TC-48: Separate validation messages
    if (!formData.room_number_name.trim() && !formData.hostel_id) {
      toast({ variant: 'destructive', title: 'Room number and hostel are required.' });
      return;
    }
    if (!formData.room_number_name.trim()) {
      toast({ variant: 'destructive', title: 'Room number is required.' });
      return;
    }
    if (!formData.hostel_id) {
      toast({ variant: 'destructive', title: 'Hostel is required.' });
      return;
    }
    
    setIsSubmitting(true);

    const payload = {
      room_number_name: formData.room_number_name,
      hostel_id: formData.hostel_id,
      room_type_id: formData.room_type_id || null,
      num_of_beds: formData.num_of_beds ? parseInt(formData.num_of_beds) : null,
      cost_per_bed: formData.cost_per_bed ? parseFloat(formData.cost_per_bed) : null,
      description: formData.description || null,
      branch_id: branchId,
      session_id: currentSessionId,
      organization_id: organizationId
    };

    let error;
    if (editingRoom) {
      ({ error } = await supabase.from('hostel_rooms').update(payload).eq('id', editingRoom.id));
    } else {
      ({ error } = await supabase.from('hostel_rooms').insert(payload));
    }

    if (error) {
      toast({ variant: 'destructive', title: `Error ${editingRoom ? 'updating' : 'creating'} room`, description: error.message });
    } else {
      toast({ title: 'Success!', description: `Room successfully ${editingRoom ? 'updated' : 'created'}.` });
      await fetchRooms();
      handleCloseDialog();
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (roomId) => {
    const { error } = await supabase.from('hostel_rooms').delete().eq('id', roomId);
    if (error) {
      toast({ variant: 'destructive', title: 'Error deleting room', description: error.message });
    } else {
      toast({ title: 'Success!', description: 'Room deleted successfully.' });
      await fetchRooms();
    }
  };

  const filteredRooms = filterHostel === 'all' ? rooms : rooms.filter(r => r.hostel_id === filterHostel);

  const totalBeds = filteredRooms.reduce((sum, r) => sum + (r.num_of_beds || 0), 0);

  const getStatusBadge = (status, capacity, occupied) => {
    if (status === 'Maintenance') return <Badge variant="destructive">Maintenance</Badge>;
    if (occupied >= capacity) return <Badge variant="secondary">Full</Badge>;
    if (occupied > 0) return <Badge className="bg-yellow-500">Partial</Badge>;
    return <Badge variant="default">Available</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <DoorOpen className="h-8 w-8 text-primary" /> Hostel Rooms
            </h1>
            <p className="text-muted-foreground mt-1">Manage rooms across hostels</p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" /> Add Room
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200">
            <CardContent className="flex items-center p-4">
              <DoorOpen className="h-10 w-10 text-blue-600 mr-4" />
              <div>
                <p className="text-2xl font-bold text-blue-700">{filteredRooms.length}</p>
                <p className="text-sm text-blue-600">Total Rooms</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200">
            <CardContent className="flex items-center p-4">
              <Bed className="h-10 w-10 text-purple-600 mr-4" />
              <div>
                <p className="text-2xl font-bold text-purple-700">{totalBeds}</p>
                <p className="text-sm text-purple-600">Total Beds</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-4">
          <Label>Filter by Hostel:</Label>
          <Select value={filterHostel} onValueChange={setFilterHostel}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="All Hostels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Hostels</SelectItem>
              {hostels.map(h => (
                <SelectItem key={h.id} value={h.id}>{h.name} ({h.type})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center items-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredRooms.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <DoorOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No rooms found. Add one to get started.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[50px]">#</TableHead>
                    <TableHead>Room No.</TableHead>
                    <TableHead>Hostel</TableHead>
                    <TableHead>Room Type</TableHead>
                    <TableHead className="text-center">Beds</TableHead>
                    <TableHead className="text-right">Cost/Bed</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRooms.map((room, index) => (
                    <TableRow key={room.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">{room.room_number_name}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{room.hostels?.name || '-'}</span>
                          <span className="text-xs text-muted-foreground">{room.hostels?.type}</span>
                        </div>
                      </TableCell>
                      <TableCell>{room.hostel_room_types?.name || '-'}</TableCell>
                      <TableCell className="text-center">{room.num_of_beds || '-'}</TableCell>
                      <TableCell className="text-right">₹{room.cost_per_bed || '-'}</TableCell>
                      <TableCell className="text-center space-x-2">
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleOpenDialog(room)}>
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
                              <AlertDialogTitle>Delete Room?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete room "{room.room_number_name}". Students assigned to this room will be affected.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(room.id)} className="bg-destructive hover:bg-destructive/90">
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
              <DialogTitle>{editingRoom ? 'Edit Room' : 'Add New Room'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="room_number_name">Room Number/Name *</Label>
                  <Input id="room_number_name" value={formData.room_number_name} onChange={(e) => setFormData({...formData, room_number_name: e.target.value})} placeholder="e.g. A-101" required />
                </div>

                <div className="space-y-2">
                  <Label>Hostel *</Label>
                  <Select value={formData.hostel_id} onValueChange={(v) => setFormData({...formData, hostel_id: v})}>
                    <SelectTrigger><SelectValue placeholder="Select hostel" /></SelectTrigger>
                    <SelectContent>
                      {hostels.map(h => <SelectItem key={h.id} value={h.id}>{h.name} ({h.type})</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Room Type</Label>
                  <Select value={formData.room_type_id} onValueChange={handleRoomTypeSelect}>
                    <SelectTrigger><SelectValue placeholder="Select room type" /></SelectTrigger>
                    <SelectContent>
                      {roomTypes.map(rt => (
                        <SelectItem key={rt.id} value={rt.id}>
                          {rt.name} (₹{rt.cost || 0})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="num_of_beds">Number of Beds</Label>
                    <Input id="num_of_beds" type="number" min="1" value={formData.num_of_beds} onChange={(e) => setFormData({...formData, num_of_beds: e.target.value})} placeholder="e.g. 4" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cost_per_bed">Cost Per Bed (₹)</Label>
                    <Input id="cost_per_bed" type="number" min="0" value={formData.cost_per_bed} onChange={(e) => setFormData({...formData, cost_per_bed: e.target.value})} placeholder="e.g. 5000" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Additional details" rows={2} />
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

export default HostelRooms;
