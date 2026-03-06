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
import { Search, Loader2, Bus, User, IndianRupee, MapPin, Save, Clock, X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowLeft } from 'lucide-react';

const StudentTransportFees = () => {
  const navigate = useNavigate();
  const { user, currentSessionId, organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();
  const [students, setStudents] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [pickupPoints, setPickupPoints] = useState([]);
  const [routePickupPoints, setRoutePickupPoints] = useState([]); // Pickup points for selected route
  const [classes, setClasses] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [routeVehicles, setRouteVehicles] = useState([]); // Vehicles assigned to selected route
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
  
  // Columns from student_transport_details:
  // id, student_id, branch_id, transport_route_id, transport_pickup_point_id, 
  // transport_fee, pickup_time, drop_time, vehicle_number, driver_name, driver_contact, special_instructions
  const [formData, setFormData] = useState({
    transport_route_id: '',
    transport_pickup_point_id: '',
    transport_fee: '',
    billing_cycle: 'monthly',
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

    const [routesRes, pickupRes, classesRes, vehiclesRes] = await Promise.all([
      routesQuery, pickupQuery, classesQuery, vehiclesQuery
    ]);

    setRoutes(routesRes.data || []);
    setPickupPoints(pickupRes.data || []);
    setClasses(classesRes.data || []);
    setVehicles(vehiclesRes.data || []);
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
    setCurrentPage(1);
    setLoading(false);
  };

  const handleEdit = async (student) => {
    setSelectedStudent(student);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    const transport = student.transport;
    
    setFormData({
      transport_route_id: transport?.transport_route_id || '',
      transport_pickup_point_id: transport?.transport_pickup_point_id || '',
      transport_fee: transport?.transport_fee || '',
      billing_cycle: transport?.billing_cycle || 'monthly',
      pickup_time: transport?.pickup_time || '',
      drop_time: transport?.drop_time || '',
      vehicle_number: transport?.vehicle_number || '',
      driver_name: transport?.driver_name || '',
      driver_contact: transport?.driver_contact || '',
      special_instructions: transport?.special_instructions || ''
    });
    
    // Load pickup points and vehicles assigned to existing route if present
    if (transport?.transport_route_id) {
      // Fetch pickup points for the route
      const { data: mappings } = await supabase
        .from('route_pickup_point_mappings')
        .select('pickup_point_id, monthly_fees, pickup_time, stop_order, pickup_point:pickup_point_id(id, name)')
        .eq('route_id', transport.transport_route_id)
        .order('stop_order');
      
      if (mappings && mappings.length > 0) {
        setRoutePickupPoints(mappings.filter(m => m.pickup_point).map(m => ({
          ...m.pickup_point,
          monthly_fees: m.monthly_fees,
          pickup_time: m.pickup_time,
          stop_order: m.stop_order
        })));
      } else {
        setRoutePickupPoints([]);
      }
      
      // Fetch vehicles for the route
      const { data: assignments } = await supabase
        .from('route_vehicle_assignments')
        .select('vehicle_id, vehicle:vehicle_id(*)')
        .eq('route_id', transport.transport_route_id);
      
      if (assignments && assignments.length > 0) {
        setRouteVehicles(assignments.filter(a => a.vehicle).map(a => a.vehicle));
      } else {
        setRouteVehicles([]);
      }
    } else {
      setRoutePickupPoints([]);
      setRouteVehicles([]);
    }
  };

  const handleCancel = () => {
    setSelectedStudent(null);
    setRoutePickupPoints([]);
    setRouteVehicles([]);
    setFormData({
      transport_route_id: '', transport_pickup_point_id: '', transport_fee: '',
      billing_cycle: 'monthly', pickup_time: '', drop_time: '', vehicle_number: '',
      driver_name: '', driver_contact: '', special_instructions: ''
    });
  };

  const handleRouteChange = async (routeId) => {
    // When route changes, try to get fee from route
    const route = routes.find(r => r.id === routeId);
    setFormData(prev => ({ 
      ...prev, 
      transport_route_id: routeId, 
      transport_pickup_point_id: '',
      transport_fee: route?.fare || prev.transport_fee,
      billing_cycle: route?.billing_cycle || 'monthly',
      // Clear vehicle fields when route changes
      vehicle_number: '',
      driver_name: '',
      driver_contact: ''
    }));
    
    // Reset route-specific data
    setRoutePickupPoints([]);
    setRouteVehicles([]);
    
    if (routeId) {
      // Fetch pickup points mapped to this route
      const { data: mappings, error: mappingsError } = await supabase
        .from('route_pickup_point_mappings')
        .select('pickup_point_id, monthly_fees, pickup_time, stop_order, pickup_point:pickup_point_id(id, name)')
        .eq('route_id', routeId)
        .order('stop_order');
      
      console.log('Route change - pickup points:', routeId, mappings);
      
      if (mappings && mappings.length > 0) {
        // Extract pickup point details with fee info
        setRoutePickupPoints(mappings.filter(m => m.pickup_point).map(m => ({
          ...m.pickup_point,
          monthly_fees: m.monthly_fees,
          pickup_time: m.pickup_time,
          stop_order: m.stop_order
        })));
      }
      
      // Fetch vehicles assigned to this route
      const { data: assignments, error } = await supabase
        .from('route_vehicle_assignments')
        .select('vehicle_id, vehicle:vehicle_id(*)')
        .eq('route_id', routeId);
      
      console.log('Route change - vehicles:', routeId, assignments);
      
      if (assignments && assignments.length > 0) {
        setRouteVehicles(assignments.filter(a => a.vehicle).map(a => a.vehicle));
      }
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

    // Validation
    if (!formData.transport_route_id) {
      toast({ variant: 'destructive', title: 'Route is required', description: 'Please select a transport route' });
      return;
    }
    
    // If route is selected, pickup point is recommended
    if (formData.transport_route_id && !formData.transport_pickup_point_id) {
      toast({ variant: 'destructive', title: 'Pickup Point is required', description: 'Please select a pickup point for the selected route' });
      return;
    }

    setIsSubmitting(true);

    const transportPayload = {
      student_id: selectedStudent.id,
      branch_id: branchId,
      session_id: currentSessionId,
      // Note: organization_id not in student_transport_details schema
      transport_route_id: formData.transport_route_id || null,
      transport_pickup_point_id: formData.transport_pickup_point_id || null,
      transport_fee: formData.transport_fee ? parseFloat(formData.transport_fee) : null,
      billing_cycle: formData.billing_cycle || 'monthly',
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
      handleCancel();
    }
    setIsSubmitting(false);
  };

  const getRouteName = (routeId) => routes.find(r => r.id === routeId)?.route_title || '-';
  const getPickupPointName = (ppId) => pickupPoints.find(p => p.id === ppId)?.name || '-';

  // Pagination
  const totalPages = Math.ceil(students.length / itemsPerPage);
  const paginatedStudents = students.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Back Button */}
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4 gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left - Search + Form */}
          <div className="xl:col-span-1 space-y-4">
            {/* Search Filters */}
            <div className="bg-card text-card-foreground rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4">Search Students</h2>
              <div className="space-y-3">
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
                <div className="space-y-2">
                  <Label>Name / Admission No</Label>
                  <Input placeholder="Enter name or admission no..." value={searchFilters.search} onChange={(e) => setSearchFilters({...searchFilters, search: e.target.value})} />
                </div>
                <Button onClick={searchStudents} className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                  Search
                </Button>
              </div>
            </div>

            {/* Transport Assignment Form - shown when student is selected */}
            {selectedStudent && (
              <div className="bg-card text-card-foreground rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold">Assign Transport</h2>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCancel}><X className="h-4 w-4" /></Button>
                </div>
                <p className="text-sm text-muted-foreground mb-3"><User className="inline h-3 w-3 mr-1" />{selectedStudent.full_name}</p>
                <form onSubmit={handleSubmit} className="space-y-3">
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
                      <SelectTrigger>
                        <SelectValue placeholder={!formData.transport_route_id ? "Select Route first" : routePickupPoints.length === 0 ? "No pickup points for route" : "Select Pickup Point"} />
                      </SelectTrigger>
                      <SelectContent>
                        {routePickupPoints.length > 0 ? (
                          routePickupPoints.map(p => <SelectItem key={p.id} value={p.id}>{p.name} {p.monthly_fees ? `(₹${p.monthly_fees})` : ''}</SelectItem>)
                        ) : (
                          <div className="px-2 py-2 text-sm text-muted-foreground">No pickup points mapped to this route</div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Assign Vehicle</Label>
                    <Select onValueChange={handleVehicleChange} disabled={!formData.transport_route_id}>
                      <SelectTrigger>
                        <SelectValue placeholder={!formData.transport_route_id ? "Select Route first" : routeVehicles.length === 0 ? "No vehicles for route" : "Select Vehicle"} />
                      </SelectTrigger>
                      <SelectContent>
                        {routeVehicles.length > 0 ? (
                          routeVehicles.map(v => <SelectItem key={v.id} value={v.id}>{v.vehicle_number} - {v.driver_name}</SelectItem>)
                        ) : (
                          <div className="px-2 py-2 text-sm text-muted-foreground">No vehicles assigned to route</div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Fee (₹)</Label>
                      <Input type="number" value={formData.transport_fee} onChange={(e) => setFormData({...formData, transport_fee: e.target.value})} placeholder="Fee" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Pickup</Label>
                      <Input type="time" value={formData.pickup_time} onChange={(e) => setFormData({...formData, pickup_time: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Drop</Label>
                      <Input type="time" value={formData.drop_time} onChange={(e) => setFormData({...formData, drop_time: e.target.value})} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Vehicle No.</Label>
                      <Input value={formData.vehicle_number} onChange={(e) => setFormData({...formData, vehicle_number: e.target.value})} placeholder="KA-01-XX" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Driver</Label>
                      <Input value={formData.driver_name} onChange={(e) => setFormData({...formData, driver_name: e.target.value})} placeholder="Name" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Contact</Label>
                      <Input value={formData.driver_contact} onChange={(e) => setFormData({...formData, driver_contact: e.target.value})} placeholder="Phone" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Special Instructions</Label>
                    <Input value={formData.special_instructions} onChange={(e) => setFormData({...formData, special_instructions: e.target.value})} placeholder="Any special instructions..." />
                  </div>
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save
                  </Button>
                  <Button type="button" variant="outline" className="w-full" onClick={handleCancel}>
                    <X className="mr-2 h-4 w-4" /> Cancel
                  </Button>
                </form>
              </div>
            )}
          </div>

          {/* Right - Student List */}
          <div className="xl:col-span-2">
            <div className="bg-card text-card-foreground rounded-xl shadow-lg">
              <div className="p-6">
                <h2 className="text-xl font-bold mb-4">Student Transport List</h2>
                {loading ? (
                  <div className="flex justify-center items-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : students.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>{hasSearched ? 'No students found matching your search.' : 'Search for students to assign transport.'}</p>
                  </div>
                ) : (
                  <>
                    <div className="border rounded-lg overflow-hidden max-h-[500px] overflow-y-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs text-foreground uppercase bg-muted/50 sticky top-0 bg-background z-10">
                          <tr>
                            <th className="px-3 py-3 w-10">#</th>
                            <th className="px-3 py-3">Student</th>
                            <th className="px-3 py-3">Class</th>
                            <th className="px-3 py-3">Route</th>
                            <th className="px-3 py-3">Pickup Point</th>
                            <th className="px-3 py-3">Fee</th>
                            <th className="px-3 py-3">Status</th>
                            <th className="px-3 py-3 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedStudents.map((student, index) => (
                            <tr key={student.id} className={`border-b border-border hover:bg-muted/50 ${selectedStudent?.id === student.id ? 'bg-primary/10' : ''}`}>
                              <td className="px-3 py-3">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                              <td className="px-3 py-3 font-medium">{student.full_name}</td>
                              <td className="px-3 py-3">{student.class?.name || '-'}{student.section?.name ? ` - ${student.section.name}` : ''}</td>
                              <td className="px-3 py-3">{getRouteName(student.transport?.transport_route_id)}</td>
                              <td className="px-3 py-3">{getPickupPointName(student.transport?.transport_pickup_point_id)}</td>
                              <td className="px-3 py-3">
                                {student.transport?.transport_fee ? (
                                  <span className="flex items-center gap-1"><IndianRupee className="h-3 w-3" />{student.transport.transport_fee}</span>
                                ) : '-'}
                              </td>
                              <td className="px-3 py-3">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${student.transport ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
                                  {student.transport ? 'Assigned' : 'Not Assigned'}
                                </span>
                              </td>
                              <td className="px-3 py-3 text-center">
                                <Button variant="outline" size="sm" onClick={() => handleEdit(student)}>
                                  <MapPin className="h-4 w-4 mr-1" /> {student.transport ? 'Edit' : 'Assign'}
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between mt-4 text-sm">
                      <span className="text-muted-foreground">Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, students.length)} of {students.length} entries</span>
                      <div className="flex items-center gap-2">
                        <Select value={String(itemsPerPage)} onValueChange={(v) => { setItemsPerPage(Number(v)); setCurrentPage(1); }}>
                          <SelectTrigger className="w-[70px] h-8"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="25">25</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage === 1} onClick={() => setCurrentPage(1)}><ChevronsLeft className="h-4 w-4" /></Button>
                        <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                        <span className="px-2">Page {currentPage} of {totalPages}</span>
                        <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
                        <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage === totalPages} onClick={() => setCurrentPage(totalPages)}><ChevronsRight className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentTransportFees;
