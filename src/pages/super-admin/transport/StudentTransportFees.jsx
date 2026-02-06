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
import { Search, Loader2, Bus, User, IndianRupee, MapPin, Save, Clock } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose
} from '@/components/ui/dialog';

const StudentTransportFees = () => {
  const { user, currentSessionId, organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();
  const [students, setStudents] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [pickupPoints, setPickupPoints] = useState([]);
  const [classes, setClasses] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [routeVehicles, setRouteVehicles] = useState([]); // Vehicles assigned to selected route
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  
  const [searchFilters, setSearchFilters] = useState({
    class_id: '',
    search: ''
  });
  
  // Columns from student_transport_details:
  // id, student_id, branch_id, transport_route_id, transport_pickup_point_id, 
  // transport_fee, pickup_time, drop_time, vehicle_number, driver_name, driver_contact, special_instructions
  const [formData, setFormData] = useState({
    transport_route_id: '',
    transport_pickup_point_id: '',
    transport_fee: '',
    pickup_time: '',
    drop_time: '',
    vehicle_number: '',
    driver_name: '',
    driver_contact: '',
    special_instructions: ''
  });

  const branchId = selectedBranch?.id || user?.profile?.branch_id;

  const fetchInitialData = useCallback(async () => {
    if (!branchId) return;

    let routesQuery = supabase.from('transport_routes').select('*').eq('branch_id', branchId);
    let pickupQuery = supabase.from('transport_pickup_points').select('*').eq('branch_id', branchId);
    let classesQuery = supabase.from('classes').select('id, name').eq('branch_id', branchId).order('name');
    let vehiclesQuery = supabase.from('transport_vehicles').select('*').eq('branch_id', branchId);

    if (branchId) {
      routesQuery = routesQuery.eq('branch_id', branchId);
      pickupQuery = pickupQuery.eq('branch_id', branchId);
      classesQuery = classesQuery.eq('branch_id', branchId);
      vehiclesQuery = vehiclesQuery.eq('branch_id', branchId);
    }

    const [routesRes, pickupRes, classesRes, vehiclesRes] = await Promise.all([
      routesQuery, pickupQuery, classesQuery, vehiclesQuery
    ]);

    setRoutes(routesRes.data || []);
    setPickupPoints(pickupRes.data || []);
    setClasses(classesRes.data || []);
    setVehicles(vehiclesRes.data || []);
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
    setHasSearched(true);
    
    // Query students - transport data is in separate table linked by student_id
    let query = supabase
      .from('student_profiles')
      .select(`
        id, full_name, school_code, roll_number,
        class:classes!student_profiles_class_id_fkey(name),
        section:sections!student_profiles_section_id_fkey(name)
      `)
      .eq('branch_id', branchId);

    if (branchId) {
      query = query.eq('branch_id', branchId);
    }

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

    // Get transport details for students (linked by student_id in student_transport_details)
    const studentIds = studentData?.map(s => s.id) || [];
    let transportMap = {};

    if (studentIds.length > 0) {
      const { data: transportData } = await supabase
        .from('student_transport_details')
        .select('*')
        .in('student_id', studentIds);
      
      if (transportData) {
        transportData.forEach(t => {
          transportMap[t.student_id] = t;
        });
      }
    }

    // Merge transport details into students
    const studentsWithTransport = (studentData || []).map(s => ({
      ...s,
      transport: transportMap[s.id] || null
    }));

    setStudents(studentsWithTransport);
    setLoading(false);
  };

  const handleOpenDialog = async (student) => {
    setSelectedStudent(student);
    
    const transport = student.transport;
    
    setFormData({
      transport_route_id: transport?.transport_route_id || '',
      transport_pickup_point_id: transport?.transport_pickup_point_id || '',
      transport_fee: transport?.transport_fee || '',
      pickup_time: transport?.pickup_time || '',
      drop_time: transport?.drop_time || '',
      vehicle_number: transport?.vehicle_number || '',
      driver_name: transport?.driver_name || '',
      driver_contact: transport?.driver_contact || '',
      special_instructions: transport?.special_instructions || ''
    });
    
    // Load vehicles assigned to existing route if present
    if (transport?.transport_route_id) {
      const { data: assignments, error } = await supabase
        .from('route_vehicle_assignments')
        .select('vehicle_id, vehicle:vehicle_id(*)')
        .eq('route_id', transport.transport_route_id);
      
      console.log('Route vehicles query:', transport.transport_route_id, assignments, error);
      
      if (assignments && assignments.length > 0) {
        const assignedVehicles = assignments
          .filter(a => a.vehicle)
          .map(a => a.vehicle);
        setRouteVehicles(assignedVehicles);
      } else {
        setRouteVehicles([]);
      }
    } else {
      setRouteVehicles([]);
    }
    
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedStudent(null);
  };

  const handleRouteChange = async (routeId) => {
    // When route changes, try to get fee from route
    const route = routes.find(r => r.id === routeId);
    setFormData(prev => ({ 
      ...prev, 
      transport_route_id: routeId, 
      transport_pickup_point_id: '',
      transport_fee: route?.fare || prev.transport_fee,
      // Clear vehicle fields when route changes
      vehicle_number: '',
      driver_name: '',
      driver_contact: ''
    }));
    
    // Fetch vehicles assigned to this route
    if (routeId) {
      const { data: assignments, error } = await supabase
        .from('route_vehicle_assignments')
        .select('vehicle_id, vehicle:vehicle_id(*)')
        .eq('route_id', routeId);
      
      console.log('Route change - vehicles:', routeId, assignments, error);
      
      if (assignments && assignments.length > 0) {
        const assignedVehicles = assignments
          .filter(a => a.vehicle)
          .map(a => a.vehicle);
        setRouteVehicles(assignedVehicles);
      } else {
        setRouteVehicles([]);
      }
    } else {
      setRouteVehicles([]);
    }
  };

  const handlePickupPointChange = async (pickupPointId) => {
    // Try to get fee from route_pickup_point_mappings
    if (formData.transport_route_id && pickupPointId) {
      const { data } = await supabase
        .from('route_pickup_point_mappings')
        .select('monthly_fees, pickup_time')
        .eq('route_id', formData.transport_route_id)
        .eq('pickup_point_id', pickupPointId)
        .single();
      
      setFormData(prev => ({
        ...prev,
        transport_pickup_point_id: pickupPointId,
        transport_fee: data?.monthly_fees || prev.transport_fee,
        pickup_time: data?.pickup_time || prev.pickup_time
      }));
    } else {
      setFormData(prev => ({ ...prev, transport_pickup_point_id: pickupPointId }));
    }
  };

  const handleVehicleChange = (vehicleId) => {
    // First check in route-specific vehicles, then fallback to all vehicles
    const vehicle = routeVehicles.find(v => v.id === vehicleId) || vehicles.find(v => v.id === vehicleId);
    if (vehicle) {
      setFormData(prev => ({
        ...prev,
        vehicle_number: vehicle.vehicle_number,
        driver_name: vehicle.driver_name,
        driver_contact: vehicle.driver_contact
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;

    setIsSubmitting(true);

    const transportPayload = {
      student_id: selectedStudent.id,
      branch_id: branchId,
      session_id: currentSessionId,
      // Note: organization_id not in student_transport_details schema
      transport_route_id: formData.transport_route_id || null,
      transport_pickup_point_id: formData.transport_pickup_point_id || null,
      transport_fee: formData.transport_fee ? parseFloat(formData.transport_fee) : null,
      pickup_time: formData.pickup_time || null,
      drop_time: formData.drop_time || null,
      vehicle_number: formData.vehicle_number || null,
      driver_name: formData.driver_name || null,
      driver_contact: formData.driver_contact || null,
      special_instructions: formData.special_instructions || null
    };

    let error;
    
    if (selectedStudent.transport) {
      // Update existing record
      const { error: updateError } = await supabase
        .from('student_transport_details')
        .update(transportPayload)
        .eq('id', selectedStudent.transport.id);
      error = updateError;
    } else {
      // Insert new record
      const { error: insertError } = await supabase
        .from('student_transport_details')
        .insert(transportPayload);
      
      error = insertError;
      // Note: No need to update student_profiles - relationship is via student_id in student_transport_details
    }

    if (error) {
      toast({ variant: 'destructive', title: 'Error updating transport info', description: error.message });
    } else {
      toast({ title: 'Success!', description: 'Student transport information updated.' });
      
      // Update local state
      setStudents(prev => prev.map(s => 
        s.id === selectedStudent.id 
          ? { ...s, transport: { ...s.transport, ...transportPayload } }
          : s
      ));
      handleCloseDialog();
    }
    setIsSubmitting(false);
  };

  const getRouteName = (routeId) => routes.find(r => r.id === routeId)?.route_title || '-';
  const getPickupPointName = (ppId) => pickupPoints.find(p => p.id === ppId)?.name || '-';

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bus className="h-8 w-8 text-primary" /> Student Transport Management
          </h1>
          <p className="text-muted-foreground mt-1">Assign transport routes and manage fees for students</p>
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
                <Select value={searchFilters.class_id || 'all'} onValueChange={(v) => setSearchFilters({...searchFilters, class_id: v === 'all' ? '' : v})}>
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
                <p>{hasSearched ? 'No students found matching your search criteria.' : 'Search for students to assign transport routes and fees.'}</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[50px]">#</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Admission No.</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Pickup Point</TableHead>
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
                      <TableCell>{student.school_code || '-'}</TableCell>
                      <TableCell>
                        {student.class?.name || '-'}
                        {student.section?.name ? ` - ${student.section.name}` : ''}
                      </TableCell>
                      <TableCell>{getRouteName(student.transport?.transport_route_id)}</TableCell>
                      <TableCell>{getPickupPointName(student.transport?.transport_pickup_point_id)}</TableCell>
                      <TableCell>
                        {student.transport?.transport_fee ? (
                          <span className="flex items-center gap-1">
                            <IndianRupee className="h-3 w-3" />{student.transport.transport_fee}
                          </span>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={student.transport ? 'default' : 'secondary'}>
                          {student.transport ? 'Assigned' : 'Not Assigned'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button variant="outline" size="sm" onClick={() => handleOpenDialog(student)}>
                          <MapPin className="h-4 w-4 mr-1" /> {student.transport ? 'Edit' : 'Assign'}
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
                Assign Transport - {selectedStudent?.full_name}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                {/* Route Selection */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Route</Label>
                    <Select value={formData.transport_route_id || 'none'} onValueChange={(v) => handleRouteChange(v === 'none' ? '' : v)}>
                      <SelectTrigger><SelectValue placeholder="Select Route" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">-- No Transport --</SelectItem>
                        {routes.map(r => <SelectItem key={r.id} value={r.id}>{r.route_title} (₹{r.fare})</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Pickup Point</Label>
                    <Select value={formData.transport_pickup_point_id} onValueChange={handlePickupPointChange} disabled={!formData.transport_route_id}>
                      <SelectTrigger><SelectValue placeholder="Select Pickup Point" /></SelectTrigger>
                      <SelectContent>
                        {pickupPoints.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Vehicle Selection - Only show vehicles assigned to selected route */}
                <div className="space-y-2">
                  <Label>Assign Vehicle (Optional)</Label>
                  <Select onValueChange={handleVehicleChange} disabled={!formData.transport_route_id}>
                    <SelectTrigger>
                      <SelectValue placeholder={!formData.transport_route_id ? "Select Route first" : routeVehicles.length === 0 ? "No vehicles assigned to this route" : "Select Vehicle"} />
                    </SelectTrigger>
                    <SelectContent>
                      {routeVehicles.length > 0 ? (
                        routeVehicles.map(v => <SelectItem key={v.id} value={v.id}>{v.vehicle_number} - {v.driver_name}</SelectItem>)
                      ) : (
                        <div className="px-2 py-2 text-sm text-muted-foreground">No vehicles assigned to this route</div>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Fee and Time */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Monthly Fee (₹)</Label>
                    <Input 
                      type="number" 
                      value={formData.transport_fee} 
                      onChange={(e) => setFormData({...formData, transport_fee: e.target.value})}
                      placeholder="Fee amount"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Pickup Time</Label>
                    <Input 
                      type="time" 
                      value={formData.pickup_time} 
                      onChange={(e) => setFormData({...formData, pickup_time: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Drop Time</Label>
                    <Input 
                      type="time" 
                      value={formData.drop_time} 
                      onChange={(e) => setFormData({...formData, drop_time: e.target.value})}
                    />
                  </div>
                </div>

                {/* Driver Details */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Vehicle Number</Label>
                    <Input 
                      value={formData.vehicle_number} 
                      onChange={(e) => setFormData({...formData, vehicle_number: e.target.value})}
                      placeholder="KA-01-AB-1234"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Driver Name</Label>
                    <Input 
                      value={formData.driver_name} 
                      onChange={(e) => setFormData({...formData, driver_name: e.target.value})}
                      placeholder="Driver name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Driver Contact</Label>
                    <Input 
                      value={formData.driver_contact} 
                      onChange={(e) => setFormData({...formData, driver_contact: e.target.value})}
                      placeholder="9876543210"
                    />
                  </div>
                </div>

                {/* Special Instructions */}
                <div className="space-y-2">
                  <Label>Special Instructions</Label>
                  <Input 
                    value={formData.special_instructions} 
                    onChange={(e) => setFormData({...formData, special_instructions: e.target.value})}
                    placeholder="Any special pickup/drop instructions..."
                  />
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

export default StudentTransportFees;
