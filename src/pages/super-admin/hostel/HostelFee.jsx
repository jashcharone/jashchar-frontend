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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from "@/components/ui/card";
import { Search, Loader2, Building2, User, IndianRupee, DoorOpen, Save, Bed, Users, ArrowLeft } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';

const HostelFee = () => {
  const navigate = useNavigate();
  const { user, currentSessionId, organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();
  const [students, setStudents] = useState([]);
  const [hostels, setHostels] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [classes, setClasses] = useState([]);
  const [assignedBeds, setAssignedBeds] = useState({}); // { roomId: ['B1', 'B2', ...] }
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
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
    billing_cycle: 'monthly',
    check_in_date: '',
    check_out_date: '',
    hostel_guardian_contact: ''
  });

  const branchId = selectedBranch?.id || user?.profile?.branch_id;

  const fetchInitialData = useCallback(async () => {
    if (!branchId) return;

    const [hostelsRes, roomsRes, roomTypesRes, classesRes] = await Promise.all([
      supabase.from('hostels').select('*').eq('branch_id', branchId),
      supabase.from('hostel_rooms').select('*, hostels(name)').eq('branch_id', branchId),
      supabase.from('hostel_room_types').select('*').eq('branch_id', branchId),
      supabase.from('classes').select('id, name').eq('branch_id', branchId).order('name')
    ]);

    setHostels(hostelsRes.data || []);
    setRooms(roomsRes.data || []);
    setRoomTypes(roomTypesRes.data || []);
    setClasses(classesRes.data || []);
  }, [branchId]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const searchStudents = async () => {
    if (!searchFilters.class_id && !searchFilters.search) {
      toast({ variant: 'destructive', title: 'Please select a class or enter search term' });
      return;
    }
    
    setLoading(true);
    
    let query = supabase
      .from('student_profiles')
      .select(`
        id, full_name, school_code, roll_number,
        classes!student_profiles_class_id_fkey(name),
        sections!student_profiles_section_id_fkey(name)
      `)
      .eq('branch_id', branchId);

    if (searchFilters.class_id) {
      query = query.eq('class_id', searchFilters.class_id);
    }

    if (searchFilters.search) {
      query = query.or(`full_name.ilike.%${searchFilters.search}%,school_code.ilike.%${searchFilters.search}%`);
    }

    const { data: studentData, error } = await query.order('full_name');

    if (error) {
      toast({ variant: 'destructive', title: 'Error searching students', description: error.message });
      setLoading(false);
      return;
    }

    setHasSearched(true);

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

    const studentsWithHostel = (studentData || []).map(s => ({
      ...s,
      hostel: hostelMap[s.id] || null
    }));

    setStudents(studentsWithHostel);
    setCurrentPage(1);
    setLoading(false);
  };

  const handleSelectStudent = async (student) => {
    setSelectedStudent(student);
    const hostel = student.hostel;
    setFormData({
      hostel_id: hostel?.hostel_id || '',
      room_id: hostel?.room_id || '',
      room_type_id: hostel?.room_type_id || '',
      bed_number: hostel?.bed_number || '',
      hostel_fee: hostel?.hostel_fee || '',
      billing_cycle: hostel?.billing_cycle || 'monthly',
      check_in_date: hostel?.check_in_date || '',
      check_out_date: hostel?.check_out_date || '',
      hostel_guardian_contact: hostel?.hostel_guardian_contact || ''
    });
    
    // Fetch assigned beds for the room if student already has hostel assignment
    if (hostel?.room_id) {
      const assigned = await fetchAssignedBeds(hostel.room_id, student.id);
      setAssignedBeds({ [hostel.room_id]: assigned });
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setSelectedStudent(null);
    setFormData({
      hostel_id: '', room_id: '', room_type_id: '', bed_number: '',
      hostel_fee: '', billing_cycle: 'monthly', check_in_date: '', check_out_date: '', hostel_guardian_contact: ''
    });
    setAssignedBeds({});
  };

  // Fetch assigned beds for a specific room
  const fetchAssignedBeds = async (roomId, excludeStudentId = null) => {
    if (!roomId) return [];
    
    let query = supabase
      .from('student_hostel_details')
      .select('bed_number')
      .eq('room_id', roomId)
      .eq('branch_id', branchId)
      .not('bed_number', 'is', null);
    
    // Exclude current student's bed when editing
    if (excludeStudentId) {
      query = query.neq('student_id', excludeStudentId);
    }
    
    const { data } = await query;
    return data?.map(d => d.bed_number) || [];
  };

  const handleHostelChange = (hostelId) => {
    setFormData(prev => ({ 
      ...prev, 
      hostel_id: hostelId, 
      room_id: '', 
      room_type_id: '', 
      bed_number: '',
      hostel_fee: ''
    }));
    setAssignedBeds({});
  };

  const handleRoomChange = async (roomId) => {
    const room = rooms.find(r => r.id === roomId);
    if (room) {
      // Get assigned beds for this room (excluding current student if editing)
      const assigned = await fetchAssignedBeds(roomId, selectedStudent?.id);
      setAssignedBeds({ [roomId]: assigned });
      
      // Note: Hostel fee now comes from Fee Structures, not from room type
      setFormData(prev => ({
        ...prev,
        room_id: roomId,
        room_type_id: room.room_type_id || '',
        bed_number: ''
      }));
    }
  };

  const handleRoomTypeChange = (roomTypeId) => {
    const roomType = roomTypes.find(rt => rt.id === roomTypeId);
    if (roomType) {
      setFormData(prev => ({
        ...prev,
        room_type_id: roomTypeId
        // Note: Hostel fee now comes from Fee Structures, not from room type cost
      }));
    }
  };

  const handleBedChange = (bedNumber) => {
    setFormData(prev => ({ ...prev, bed_number: bedNumber }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;

    // Validation
    if (!formData.hostel_id) {
      toast({ variant: 'destructive', title: 'Hostel is required', description: 'Please select a hostel' });
      return;
    }
    
    // If room is selected, bed number is required
    if (formData.room_id && !formData.bed_number) {
      toast({ variant: 'destructive', title: 'Bed Number is required', description: 'Please select a bed number for the selected room' });
      return;
    }

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
      billing_cycle: formData.billing_cycle || 'monthly',
      check_in_date: formData.check_in_date || null,
      check_out_date: formData.check_out_date || null,
      hostel_guardian_contact: formData.hostel_guardian_contact || null
    };

    let error;
    
    if (selectedStudent.hostel) {
      const { error: updateError } = await supabase
        .from('student_hostel_details')
        .update(hostelPayload)
        .eq('id', selectedStudent.hostel.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('student_hostel_details')
        .insert(hostelPayload);
      error = insertError;
    }

    if (error) {
      toast({ variant: 'destructive', title: 'Error updating hostel info', description: error.message });
    } else {
      toast({ title: 'Success!', description: 'Student hostel information updated.' });
      setStudents(prev => prev.map(s => 
        s.id === selectedStudent.id 
          ? { ...s, hostel: { ...s.hostel, ...hostelPayload } }
          : s
      ));
      handleCancelEdit();
    }
    setIsSubmitting(false);
  };

  const getHostelName = (hostelId) => hostels.find(h => h.id === hostelId)?.name || '-';
  const getRoomName = (roomId) => rooms.find(r => r.id === roomId)?.room_number_name || '-';

  // Filtered rooms based on selected hostel
  const filteredRooms = formData.hostel_id 
    ? rooms.filter(r => r.hostel_id === formData.hostel_id)
    : rooms;

  // Filtered room types - only show room types that exist in rooms of selected hostel
  const filteredRoomTypes = formData.hostel_id 
    ? roomTypes.filter(rt => 
        filteredRooms.some(r => r.room_type_id === rt.id)
      )
    : roomTypes;

  // Get available beds for selected room
  const getAvailableBeds = () => {
    if (!formData.room_id) return [];
    const room = rooms.find(r => r.id === formData.room_id);
    if (!room || !room.num_of_beds) return [];
    
    const totalBeds = room.num_of_beds;
    const assigned = assignedBeds[formData.room_id] || [];
    const allBeds = Array.from({ length: totalBeds }, (_, i) => `B${i + 1}`);
    
    // Return beds that are not assigned
    // The fetchAssignedBeds already excludes the current student's bed when editing
    return allBeds.filter(bed => !assigned.includes(bed));
  };

  const availableBeds = getAvailableBeds();
  
  // If editing and current student has a bed, include it in selection if not already there
  const bedsForSelection = formData.bed_number && !availableBeds.includes(formData.bed_number)
    ? [formData.bed_number, ...availableBeds]
    : availableBeds;

  const assignedCount = students.filter(s => s.hostel).length;

  // Pagination
  const totalPages = Math.ceil(students.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedStudents = students.slice(startIndex, startIndex + itemsPerPage);

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)} className="h-10 w-10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Hostel Fee</h1>
            <p className="text-sm text-muted-foreground">Assign hostels and manage student fees</p>
          </div>
        </div>

        {/* Stats Cards */}
        {hasSearched && students.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200">
              <CardContent className="flex items-center p-4">
                <Users className="h-10 w-10 text-blue-600 mr-4" />
                <div>
                  <p className="text-2xl font-bold text-blue-700">{students.length}</p>
                  <p className="text-sm text-blue-600">Total Students</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200">
              <CardContent className="flex items-center p-4">
                <Building2 className="h-10 w-10 text-green-600 mr-4" />
                <div>
                  <p className="text-2xl font-bold text-green-700">{assignedCount}</p>
                  <p className="text-sm text-green-600">Hostel Assigned</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200">
              <CardContent className="flex items-center p-4">
                <User className="h-10 w-10 text-purple-600 mr-4" />
                <div>
                  <p className="text-2xl font-bold text-purple-700">{students.length - assignedCount}</p>
                  <p className="text-sm text-purple-600">Not Assigned</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content: Left Form + Right List */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Side - Search + Assignment Form */}
          <Card className="lg:col-span-1">
            <CardContent className="p-6">
              {/* Search Section */}
              <h2 className="text-lg font-semibold mb-4">
                {selectedStudent ? `Assign Hostel - ${selectedStudent.full_name}` : 'Search Students'}
              </h2>

              {!selectedStudent ? (
                <div className="space-y-4">
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
                  <div className="space-y-2">
                    <Label>Search by Name / Admission No</Label>
                    <Input 
                      placeholder="Enter name or admission number..." 
                      value={searchFilters.search}
                      onChange={(e) => setSearchFilters({...searchFilters, search: e.target.value})}
                    />
                  </div>
                  <Button onClick={searchStudents} className="w-full" disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                    Search
                  </Button>
                </div>
              ) : (
                /* Assignment Form */
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Hostel *</Label>
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
                    <Label>Room *</Label>
                    <Select value={formData.room_id} onValueChange={handleRoomChange}>
                      <SelectTrigger><SelectValue placeholder="Select Room" /></SelectTrigger>
                      <SelectContent>
                        {filteredRooms.map(r => (
                          <SelectItem key={r.id} value={r.id}>{r.room_number_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Room Type</Label>
                    <Select value={formData.room_type_id} onValueChange={handleRoomTypeChange} disabled={!formData.hostel_id}>
                      <SelectTrigger><SelectValue placeholder={formData.hostel_id ? "Select Room Type" : "First select hostel"} /></SelectTrigger>
                      <SelectContent>
                        {filteredRoomTypes.map(rt => (
                          <SelectItem key={rt.id} value={rt.id}>{rt.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formData.hostel_id && filteredRoomTypes.length === 0 && (
                      <p className="text-xs text-muted-foreground">No room types available for this hostel</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Bed Number *</Label>
                    <Select value={formData.bed_number} onValueChange={handleBedChange} disabled={!formData.room_id}>
                      <SelectTrigger><SelectValue placeholder={formData.room_id ? "Select Bed" : "First select room"} /></SelectTrigger>
                      <SelectContent>
                        {bedsForSelection.map(bed => (
                          <SelectItem key={bed} value={bed}>{bed}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formData.room_id && (
                      <p className="text-xs text-muted-foreground">
                        {availableBeds.length > 0 
                          ? `${availableBeds.length} beds available`
                          : 'No beds available - room full'
                        }
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Hostel Fee (₹)</Label>
                    <Input type="number" min="0" value={formData.hostel_fee} onChange={(e) => setFormData({...formData, hostel_fee: e.target.value})} placeholder="e.g. 5000" />
                  </div>

                  <div className="space-y-2">
                    <Label>Check-in Date</Label>
                    <Input type="date" value={formData.check_in_date} onChange={(e) => setFormData({...formData, check_in_date: e.target.value})} />
                  </div>

                  <div className="space-y-2">
                    <Label>Check-out Date</Label>
                    <Input type="date" value={formData.check_out_date} onChange={(e) => setFormData({...formData, check_out_date: e.target.value})} />
                  </div>

                  <div className="space-y-2">
                    <Label>Guardian Contact</Label>
                    <Input type="tel" value={formData.hostel_guardian_contact} onChange={(e) => setFormData({...formData, hostel_guardian_contact: e.target.value})} placeholder="Phone number" />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button type="submit" disabled={isSubmitting} className="flex-1">
                      {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      Save
                    </Button>
                    <Button type="button" variant="outline" onClick={handleCancelEdit}>
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Right Side - Student List */}
          <Card className="lg:col-span-2">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Student Hostel List</h2>
              </div>

              {loading ? (
                <div className="flex justify-center items-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : students.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{hasSearched ? 'No students found matching your search.' : 'Search for students to assign hostel rooms and fees.'}</p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden max-h-[500px] overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow className="bg-muted/50">
                        <TableHead className="w-[50px]">#</TableHead>
                        <TableHead>Student Name</TableHead>
                        <TableHead>Admission No.</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Hostel</TableHead>
                        <TableHead>Room</TableHead>
                        <TableHead className="text-right">Fee</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-center">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedStudents.map((student, index) => (
                        <TableRow key={student.id} className={selectedStudent?.id === student.id ? 'bg-primary/10' : ''}>
                          <TableCell>{startIndex + index + 1}</TableCell>
                          <TableCell className="font-medium">{student.full_name}</TableCell>
                          <TableCell>{student.school_code || '-'}</TableCell>
                          <TableCell>
                            {student.classes?.name || '-'}
                            {student.sections?.name ? ` - ${student.sections.name}` : ''}
                          </TableCell>
                          <TableCell>{getHostelName(student.hostel?.hostel_id)}</TableCell>
                          <TableCell>{getRoomName(student.hostel?.room_id)}</TableCell>
                          <TableCell className="text-right">
                            {student.hostel?.hostel_fee ? `₹${student.hostel.hostel_fee}` : '-'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={student.hostel ? 'default' : 'secondary'}>
                              {student.hostel ? 'Assigned' : 'Not Assigned'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Button variant="outline" size="sm" onClick={() => handleSelectStudent(student)}>
                              <DoorOpen className="h-4 w-4 mr-1" /> {student.hostel ? 'Edit' : 'Assign'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Pagination */}
              {students.length > 0 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, students.length)} of {students.length} entries
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

export default HostelFee;
