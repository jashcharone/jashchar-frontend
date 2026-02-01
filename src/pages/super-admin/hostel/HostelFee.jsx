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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Loader2, Building2, User, IndianRupee, DoorOpen, Save, Bed } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose
} from '@/components/ui/dialog';

const HostelFee = () => {
  const { user, currentSessionId, organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();
  const [students, setStudents] = useState([]);
  const [hostels, setHostels] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  
  const [searchFilters, setSearchFilters] = useState({
    class_id: '',
    search: ''
  });
  
  const [formData, setFormData] = useState({
    hostel_id: '',
    room_id: '',
    room_type_id: '',
    bed_number: '',
    hostel_fee: '',
    check_in_date: '',
    check_out_date: '',
    hostel_guardian_contact: ''
  });

  const branchId = selectedBranch?.id || user?.profile?.branch_id;

  const fetchInitialData = useCallback(async () => {
    if (!branchId || !branchId) return;

    // Filter hostel data by branch
    const [hostelsRes, roomsRes, roomTypesRes, classesRes] = await Promise.all([
      supabase.from('hostels').select('*').eq('branch_id', branchId).eq('branch_id', branchId),
      supabase.from('hostel_rooms').select('*, hostels(name)').eq('branch_id', branchId).eq('branch_id', branchId),
      supabase.from('hostel_room_types').select('*').eq('branch_id', branchId).eq('branch_id', branchId),
      supabase.from('classes').select('id, name').eq('branch_id', branchId).order('name')
    ]);

    setHostels(hostelsRes.data || []);
    setRooms(roomsRes.data || []);
    setRoomTypes(roomTypesRes.data || []);
    setClasses(classesRes.data || []);
  }, [branchId, branchId]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const searchStudents = async () => {
    if (!searchFilters.class_id && !searchFilters.search) {
      toast({ variant: 'destructive', title: 'Please select a class or enter search term' });
      return;
    }
    
    setLoading(true);
    
    // Use explicit FK relationship names to avoid ambiguous relationship error
    let query = supabase
      .from('student_profiles')
      .select(`
        id, full_name, admission_no, roll_number,
        classes!student_profiles_class_id_fkey(name),
        sections!student_profiles_section_id_fkey(name),
        hostel_details_id
      `)
      .eq('branch_id', branchId);

    // Note: student_profiles may not have branch_id column

    if (searchFilters.class_id) {
      query = query.eq('class_id', searchFilters.class_id);
    }

    if (searchFilters.search) {
      query = query.or(`full_name.ilike.%${searchFilters.search}%,admission_no.ilike.%${searchFilters.search}%`);
    }

    const { data: studentData, error } = await query.order('full_name');

    if (error) {
      toast({ variant: 'destructive', title: 'Error searching students', description: error.message });
      setLoading(false);
      return;
    }

    // Get hostel details for students who have hostel_details_id
    const studentIds = studentData?.map(s => s.id) || [];
    let hostelMap = {};

    if (studentIds.length > 0) {
      const { data: hostelData } = await supabase
        .from('student_hostel_details')
        .select('*')
        .in('student_id', studentIds);
      
      if (hostelData) {
        hostelData.forEach(h => {
          hostelMap[h.student_id] = h;
        });
      }
    }

    // Merge hostel details into students
    const studentsWithHostel = (studentData || []).map(s => ({
      ...s,
      hostel: hostelMap[s.id] || null
    }));

    setStudents(studentsWithHostel);
    setLoading(false);
  };

  const handleOpenDialog = (student) => {
    setSelectedStudent(student);
    
    const hostel = student.hostel;
    
    setFormData({
      hostel_id: hostel?.hostel_id || '',
      room_id: hostel?.room_id || '',
      room_type_id: hostel?.room_type_id || '',
      bed_number: hostel?.bed_number || '',
      hostel_fee: hostel?.hostel_fee || '',
      check_in_date: hostel?.check_in_date || '',
      check_out_date: hostel?.check_out_date || '',
      hostel_guardian_contact: hostel?.hostel_guardian_contact || ''
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedStudent(null);
  };

  const handleHostelChange = (hostelId) => {
    setFormData(prev => ({ 
      ...prev, 
      hostel_id: hostelId, 
      room_id: ''
    }));
  };

  const handleRoomChange = (roomId) => {
    const room = rooms.find(r => r.id === roomId);
    if (room) {
      setFormData(prev => ({
        ...prev,
        room_id: roomId,
        room_type_id: room.room_type_id || '',
        hostel_fee: room.cost_per_bed || ''
      }));
    }
  };

  const handleRoomTypeChange = (roomTypeId) => {
    const roomType = roomTypes.find(rt => rt.id === roomTypeId);
    if (roomType) {
      setFormData(prev => ({
        ...prev,
        room_type_id: roomTypeId,
        hostel_fee: roomType.cost || prev.hostel_fee
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;

    setIsSubmitting(true);

    const hostelPayload = {
      student_id: selectedStudent.id,
      branch_id: branchId,
      session_id: currentSessionId,
      organization_id: organizationId,
      hostel_id: formData.hostel_id || null,
      room_id: formData.room_id || null,
      room_type_id: formData.room_type_id || null,
      bed_number: formData.bed_number || null,
      hostel_fee: formData.hostel_fee ? parseFloat(formData.hostel_fee) : null,
      check_in_date: formData.check_in_date || null,
      check_out_date: formData.check_out_date || null,
      hostel_guardian_contact: formData.hostel_guardian_contact || null
    };

    let error;
    
    if (selectedStudent.hostel) {
      // Update existing record
      const { error: updateError } = await supabase
        .from('student_hostel_details')
        .update(hostelPayload)
        .eq('id', selectedStudent.hostel.id);
      error = updateError;
    } else {
      // Insert new record
      const { data: insertData, error: insertError } = await supabase
        .from('student_hostel_details')
        .insert(hostelPayload)
        .select()
        .single();
      
      error = insertError;
      
      // Update student_profiles with hostel_details_id
      if (!insertError && insertData) {
        await supabase
          .from('student_profiles')
          .update({ hostel_details_id: insertData.id })
          .eq('id', selectedStudent.id);
      }
    }

    if (error) {
      toast({ variant: 'destructive', title: 'Error updating hostel info', description: error.message });
    } else {
      toast({ title: 'Success!', description: 'Student hostel information updated.' });
      
      // Update local state
      setStudents(prev => prev.map(s => 
        s.id === selectedStudent.id 
          ? { ...s, hostel: { ...s.hostel, ...hostelPayload } }
          : s
      ));
      handleCloseDialog();
    }
    setIsSubmitting(false);
  };

  const getHostelName = (hostelId) => hostels.find(h => h.id === hostelId)?.name || '-';
  const getRoomName = (roomId) => rooms.find(r => r.id === roomId)?.room_number_name || '-';

  const filteredRooms = formData.hostel_id 
    ? rooms.filter(r => r.hostel_id === formData.hostel_id)
    : rooms;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building2 className="h-8 w-8 text-primary" /> Student Hostel Management
          </h1>
          <p className="text-muted-foreground mt-1">Assign hostel rooms and manage fees for students</p>
        </div>

        {/* Search Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Search Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Class</Label>
                <Select value={searchFilters.class_id || "all"} onValueChange={(v) => setSearchFilters({...searchFilters, class_id: v === "all" ? "" : v})}>
                  <SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Search by Name / Admission No</Label>
                <Input 
                  placeholder="Enter name or admission number..." 
                  value={searchFilters.search}
                  onChange={(e) => setSearchFilters({...searchFilters, search: e.target.value})}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={searchStudents} className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                  Search
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center items-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : students.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Search for students to assign hostel rooms and fees.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[50px]">#</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Admission No.</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Hostel</TableHead>
                    <TableHead>Room</TableHead>
                    <TableHead>Fee</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student, index) => (
                    <TableRow key={student.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">
                        {student.full_name}
                      </TableCell>
                      <TableCell>{student.admission_no || '-'}</TableCell>
                      <TableCell>
                        {student.classes?.name || '-'}
                        {student.sections?.name ? ` - ${student.sections.name}` : ''}
                      </TableCell>
                      <TableCell>{getHostelName(student.hostel?.hostel_id)}</TableCell>
                      <TableCell>{getRoomName(student.hostel?.room_id)}</TableCell>
                      <TableCell>
                        {student.hostel?.hostel_fee ? (
                          <span className="flex items-center gap-1">
                            <IndianRupee className="h-3 w-3" />{student.hostel.hostel_fee}
                          </span>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={student.hostel ? 'default' : 'secondary'}>
                          {student.hostel ? 'Assigned' : 'Not Assigned'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button variant="outline" size="sm" onClick={() => handleOpenDialog(student)}>
                          <DoorOpen className="h-4 w-4 mr-1" /> {student.hostel ? 'Edit' : 'Assign'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Assignment Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>
                Assign Hostel - {selectedStudent?.full_name}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                {/* Hostel & Room Selection */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Hostel</Label>
                    <Select value={formData.hostel_id} onValueChange={handleHostelChange}>
                      <SelectTrigger><SelectValue placeholder="Select Hostel" /></SelectTrigger>
                      <SelectContent>
                        {hostels.map(h => (
                          <SelectItem key={h.id} value={h.id}>{h.name} ({h.type})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Room</Label>
                    <Select value={formData.room_id} onValueChange={handleRoomChange}>
                      <SelectTrigger><SelectValue placeholder="Select Room" /></SelectTrigger>
                      <SelectContent>
                        {filteredRooms.map(r => (
                          <SelectItem key={r.id} value={r.id}>{r.room_number_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Room Type & Bed */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Room Type</Label>
                    <Select value={formData.room_type_id} onValueChange={handleRoomTypeChange}>
                      <SelectTrigger><SelectValue placeholder="Select Room Type" /></SelectTrigger>
                      <SelectContent>
                        {roomTypes.map(rt => (
                          <SelectItem key={rt.id} value={rt.id}>{rt.name} - ₹{rt.cost || 0}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Bed Number</Label>
                    <Input
                      value={formData.bed_number}
                      onChange={(e) => setFormData({...formData, bed_number: e.target.value})}
                      placeholder="e.g. B1"
                    />
                  </div>
                </div>

                {/* Fee */}
                <div className="space-y-2">
                  <Label>Hostel Fee (Monthly)</Label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      className="pl-9"
                      value={formData.hostel_fee}
                      onChange={(e) => setFormData({...formData, hostel_fee: e.target.value})}
                      placeholder="Enter monthly fee"
                    />
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Check-in Date</Label>
                    <Input
                      type="date"
                      value={formData.check_in_date}
                      onChange={(e) => setFormData({...formData, check_in_date: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Check-out Date</Label>
                    <Input
                      type="date"
                      value={formData.check_out_date}
                      onChange={(e) => setFormData({...formData, check_out_date: e.target.value})}
                    />
                  </div>
                </div>

                {/* Guardian Contact */}
                <div className="space-y-2">
                  <Label>Guardian Contact (for Hostel)</Label>
                  <Input
                    type="tel"
                    value={formData.hostel_guardian_contact}
                    onChange={(e) => setFormData({...formData, hostel_guardian_contact: e.target.value})}
                    placeholder="Enter guardian phone number"
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
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

export default HostelFee;
