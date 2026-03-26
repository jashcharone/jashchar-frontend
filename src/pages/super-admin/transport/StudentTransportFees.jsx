import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDate, formatDateForInput } from '@/utils/dateUtils';
import { Search, Loader2, Bus, User, Users, IndianRupee, MapPin, Save, Clock, X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowLeft, UserCheck, UserX, Calendar, Shield, Download } from 'lucide-react';
import { refreshFeeLedger, getTransportFeeTypeId, refreshInstallmentLedger, fetchBillingConfig } from '@/utils/feeLedgerService';

const StudentTransportFees = () => {
  const navigate = useNavigate();
  const { user, currentSessionId, organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();
  const [students, setStudents] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [pickupPoints, setPickupPoints] = useState([]);
  const [routePickupPoints, setRoutePickupPoints] = useState([]);
  const [classes, setClasses] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [routeVehicles, setRouteVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState('all');
  const [billingConfig, setBillingConfig] = useState(null);
  
  const [searchFilters, setSearchFilters] = useState({
    class_id: '',
    search: ''
  });
  
  const [formData, setFormData] = useState({
    transport_route_id: '',
    transport_pickup_point_id: '',
    transport_fee: '',
    annual_fee: '',
    billing_cycle: 'monthly',
    pickup_time: '',
    drop_time: '',
    vehicle_number: '',
    driver_name: '',
    driver_contact: '',
    special_instructions: '',
    pickup_type: 'both',
    seat_number: '',
    emergency_contact: '',
    parent_tracking_enabled: true,
    effective_from: '',
    effective_to: '',
    is_active: true,
    fee_override_reason: ''
  });

  const branchId = selectedBranch?.id || user?.profile?.branch_id;

  const fetchInitialData = useCallback(async () => {
    if (!branchId) return;

    const [routesRes, pickupRes, classesRes, vehiclesRes, billingCfg] = await Promise.all([
      supabase.from('transport_routes').select('*').eq('branch_id', branchId),
      supabase.from('transport_pickup_points').select('*').eq('branch_id', branchId),
      supabase.from('classes').select('id, name').eq('branch_id', branchId).order('name'),
      supabase.from('transport_vehicles').select('*').eq('branch_id', branchId),
      fetchBillingConfig('transport', branchId, currentSessionId)
    ]);

    setRoutes(routesRes.data || []);
    setPickupPoints(pickupRes.data || []);
    setClasses(classesRes.data || []);
    setVehicles(vehiclesRes.data || []);
    setBillingConfig(billingCfg);
  }, [branchId, currentSessionId]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Stats
  const stats = useMemo(() => {
    const assigned = students.filter(s => s.transport);
    const unassigned = students.filter(s => !s.transport);
    const totalFee = assigned.reduce((sum, s) => sum + (parseFloat(s.transport?.transport_fee) || 0), 0);
    const activeTransport = assigned.filter(s => s.transport?.is_active !== false);
    return { total: students.length, assigned: assigned.length, unassigned: unassigned.length, totalFee, active: activeTransport.length };
  }, [students]);

  // Filtered students
  const filteredStudents = useMemo(() => {
    if (statusFilter === 'assigned') return students.filter(s => s.transport);
    if (statusFilter === 'unassigned') return students.filter(s => !s.transport);
    return students;
  }, [students, statusFilter]);

  const searchStudents = async () => {
    if (!searchFilters.class_id && !searchFilters.search) {
      toast({ variant: 'destructive', title: 'Please select a class or enter search term' });
      return;
    }
    
    setLoading(true);
    setHasSearched(true);
    
    let query = supabase
      .from('student_profiles')
      .select(`
        id, full_name, enrollment_id, roll_number,
        class:classes!student_profiles_class_id_fkey(name),
        section:sections!student_profiles_section_id_fkey(name)
      `)
      .eq('branch_id', branchId);

    if (searchFilters.class_id) {
      query = query.eq('class_id', searchFilters.class_id);
    }

    if (searchFilters.search) {
      query = query.or(`full_name.ilike.%${searchFilters.search}%,enrollment_id.ilike.%${searchFilters.search}%`);
    }

    const { data: studentData, error } = await query.order('full_name');

    if (error) {
      toast({ variant: 'destructive', title: 'Error searching students', description: error.message });
      setLoading(false);
      return;
    }

    const studentIds = studentData?.map(s => s.id) || [];
    let transportMap = {};

    if (studentIds.length > 0) {
      const { data: transportData } = await supabase
        .from('student_transport_details')
        .select('*')
        .in('student_id', studentIds);
      
      if (transportData) {
        transportData.forEach(t => { transportMap[t.student_id] = t; });
      }
    }

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
      annual_fee: transport?.annual_fee || '',
      billing_cycle: transport?.billing_cycle || 'monthly',
      pickup_time: transport?.pickup_time || '',
      drop_time: transport?.drop_time || '',
      vehicle_number: transport?.vehicle_number || '',
      driver_name: transport?.driver_name || '',
      driver_contact: transport?.driver_contact || '',
      special_instructions: transport?.special_instructions || '',
      pickup_type: transport?.pickup_type || 'both',
      seat_number: transport?.seat_number || '',
      emergency_contact: transport?.emergency_contact || '',
      parent_tracking_enabled: transport?.parent_tracking_enabled !== false,
      effective_from: transport?.effective_from ? formatDateForInput(transport.effective_from) : '',
      effective_to: transport?.effective_to ? formatDateForInput(transport.effective_to) : '',
      is_active: transport?.is_active !== false,
      fee_override_reason: transport?.fee_override_reason || ''
    });
    
    if (transport?.transport_route_id) {
      const { data: mappings } = await supabase
        .from('route_pickup_point_mappings')
        .select('pickup_point_id, monthly_fees, pickup_time, stop_order, pickup_point:pickup_point_id(id, name)')
        .eq('route_id', transport.transport_route_id)
        .order('stop_order');
      
      if (mappings && mappings.length > 0) {
        setRoutePickupPoints(mappings.filter(m => m.pickup_point).map(m => ({
          ...m.pickup_point, monthly_fees: m.monthly_fees, pickup_time: m.pickup_time, stop_order: m.stop_order
        })));
      } else {
        setRoutePickupPoints([]);
      }
      
      const { data: assignments } = await supabase
        .from('route_vehicle_assignments')
        .select('vehicle_id, vehicle:vehicle_id(*)')
        .eq('route_id', transport.transport_route_id);
      
      setRouteVehicles(assignments?.filter(a => a.vehicle).map(a => a.vehicle) || []);
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
      annual_fee: '', billing_cycle: 'monthly', pickup_time: '', drop_time: '', vehicle_number: '',
      driver_name: '', driver_contact: '', special_instructions: '',
      pickup_type: 'both', seat_number: '', emergency_contact: '',
      parent_tracking_enabled: true, effective_from: '', effective_to: '', is_active: true,
      fee_override_reason: ''
    });
  };

  const handleRouteChange = async (routeId) => {
    setFormData(prev => ({ 
      ...prev, 
      transport_route_id: routeId, 
      transport_pickup_point_id: '',
      vehicle_number: '', driver_name: '', driver_contact: ''
    }));
    
    setRoutePickupPoints([]);
    setRouteVehicles([]);
    
    if (routeId) {
      const { data: mappings } = await supabase
        .from('route_pickup_point_mappings')
        .select('pickup_point_id, monthly_fees, pickup_time, stop_order, pickup_point:pickup_point_id(id, name)')
        .eq('route_id', routeId)
        .order('stop_order');
      
      if (mappings && mappings.length > 0) {
        setRoutePickupPoints(mappings.filter(m => m.pickup_point).map(m => ({
          ...m.pickup_point, monthly_fees: m.monthly_fees, pickup_time: m.pickup_time, stop_order: m.stop_order
        })));
      }
      
      const { data: assignments } = await supabase
        .from('route_vehicle_assignments')
        .select('vehicle_id, vehicle:vehicle_id(*)')
        .eq('route_id', routeId);
      
      if (assignments && assignments.length > 0) {
        setRouteVehicles(assignments.filter(a => a.vehicle).map(a => a.vehicle));
      }
    }
  };

  const handlePickupPointChange = async (pickupPointId) => {
    if (formData.transport_route_id && pickupPointId) {
      const { data } = await supabase
        .from('route_pickup_point_mappings')
        .select('monthly_fees, annual_fee, pickup_time')
        .eq('route_id', formData.transport_route_id)
        .eq('pickup_point_id', pickupPointId)
        .single();
      
      const annualFee = data?.annual_fee || (data?.monthly_fees ? data.monthly_fees * 12 : 0);
      const workingMonths = billingConfig?.working_months || 10;
      const monthlyCalc = workingMonths > 0 ? Math.round(annualFee / workingMonths) : 0;

      setFormData(prev => ({
        ...prev,
        transport_pickup_point_id: pickupPointId,
        annual_fee: annualFee || prev.annual_fee,
        transport_fee: monthlyCalc || data?.monthly_fees || prev.transport_fee,
        pickup_time: data?.pickup_time || prev.pickup_time
      }));
    } else {
      setFormData(prev => ({ ...prev, transport_pickup_point_id: pickupPointId }));
    }
  };

  const handleVehicleChange = (vehicleId) => {
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

  const handleExportCSV = () => {
    if (filteredStudents.length === 0) return toast({ variant: 'destructive', title: 'No data to export' });
    const headers = ['Student', 'School Code', 'Class', 'Route', 'Pickup Point', 'Type', 'Fee', 'Status'];
    const rows = filteredStudents.map(s => [
      s.full_name || '', s.enrollment_id || '', `${s.class?.name || ''} ${s.section || ''}`.trim(),
      s.transport?.route_title || '', s.transport?.pickup_point_name || '', s.transport?.pickup_type || '',
      s.transport?.transport_fee || '', s.transport ? 'Active' : 'Not Assigned'
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'student_transport_fees.csv'; a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Exported!', description: `${filteredStudents.length} records exported.` });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;

    if (!formData.transport_route_id) {
      toast({ variant: 'destructive', title: 'Route is required', description: 'Please select a transport route' });
      return;
    }

    setIsSubmitting(true);

    // Calculate final annual fee with one-way adjustment
    let finalAnnualFee = formData.annual_fee ? parseFloat(formData.annual_fee) : 0;
    if (formData.pickup_type !== 'both' && billingConfig?.one_way_percentage) {
      finalAnnualFee = Math.round(finalAnnualFee * (billingConfig.one_way_percentage / 100));
    }

    const transportPayload = {
      student_id: selectedStudent.id,
      branch_id: branchId,
      session_id: currentSessionId,
      organization_id: organizationId,
      transport_route_id: formData.transport_route_id || null,
      transport_pickup_point_id: formData.transport_pickup_point_id || null,
      transport_fee: formData.transport_fee ? parseFloat(formData.transport_fee) : null,
      annual_fee: finalAnnualFee || null,
      billing_cycle: billingConfig?.billing_mode || formData.billing_cycle || 'monthly',
      pickup_time: formData.pickup_time || null,
      drop_time: formData.drop_time || null,
      vehicle_number: formData.vehicle_number || null,
      driver_name: formData.driver_name || null,
      driver_contact: formData.driver_contact || null,
      special_instructions: formData.special_instructions || null,
      pickup_type: formData.pickup_type || 'both',
      seat_number: formData.seat_number || null,
      emergency_contact: formData.emergency_contact || null,
      parent_tracking_enabled: formData.parent_tracking_enabled,
      effective_from: formData.effective_from || null,
      effective_to: formData.effective_to || null,
      is_active: formData.is_active,
      fee_override_reason: formData.fee_override_reason || null
    };

    let error;
    
    if (selectedStudent.transport) {
      const { error: updateError } = await supabase
        .from('student_transport_details')
        .update(transportPayload)
        .eq('id', selectedStudent.transport.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('student_transport_details')
        .insert(transportPayload);
      error = insertError;
    }

    if (error) {
      toast({ variant: 'destructive', title: 'Error updating transport info', description: error.message });
    } else {
      // Auto-write to unified fee ledger if fee is set
      if (finalAnnualFee && finalAnnualFee > 0) {
        const transportFeeTypeId = await getTransportFeeTypeId(branchId, currentSessionId);
        const { data: transportRecord } = await supabase
          .from('student_transport_details')
          .select('id')
          .eq('student_id', selectedStudent.id)
          .eq('session_id', currentSessionId)
          .eq('branch_id', branchId)
          .maybeSingle();

        const ledgerResult = await refreshInstallmentLedger({
          studentId: selectedStudent.id,
          feeSource: 'transport',
          feeTypeId: transportFeeTypeId,
          annualFee: finalAnnualFee,
          sessionId: currentSessionId,
          branchId: branchId,
          organizationId: organizationId,
          sourceReferenceId: transportRecord?.id || null,
          effectiveFrom: transportPayload.effective_from || null,
        });

        if (ledgerResult.success) {
          console.log(`Transport fee ledger: ${ledgerResult.rowsCreated} installments created`);
        } else {
          console.error('Transport fee ledger error:', ledgerResult.error);
          toast({ variant: 'destructive', title: 'Transport saved, but fee ledger failed', description: ledgerResult.error });
        }
      }

      toast({ title: 'Success!', description: 'Student transport information updated.' });
      setStudents(prev => prev.map(s => 
        s.id === selectedStudent.id 
          ? { ...s, transport: { ...s.transport, ...transportPayload } }
          : s
      ));
      handleCancel();
    }
    setIsSubmitting(false);
  };

  const handleRemoveTransport = async (student) => {
    if (!student.transport) return;
    const { error } = await supabase
      .from('student_transport_details')
      .delete()
      .eq('id', student.transport.id);
    
    if (error) {
      toast({ variant: 'destructive', title: 'Error removing transport', description: error.message });
    } else {
      toast({ title: 'Success!', description: 'Transport removed for ' + student.full_name });
      setStudents(prev => prev.map(s => s.id === student.id ? { ...s, transport: null } : s));
    }
  };

  const getRouteName = (routeId) => routes.find(r => r.id === routeId)?.route_title || '-';
  const getPickupPointName = (ppId) => pickupPoints.find(p => p.id === ppId)?.name || '-';

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const paginatedStudents = filteredStudents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getPickupTypeBadge = (type) => {
    const styles = {
      both: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      pickup_only: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      drop_only: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
    };
    const labels = { both: 'Both', pickup_only: 'Pickup', drop_only: 'Drop' };
    return <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${styles[type] || styles.both}`}>{labels[type] || 'Both'}</span>;
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4 gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>

        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">?? Student Transport Fees</h1>
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="mr-1 h-4 w-4" /> Export
          </Button>
        </div>

        {/* Stats Cards */}
        {hasSearched && students.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-card rounded-xl shadow p-4 border-l-4 border-blue-500">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-blue-500" />
                <div><p className="text-xs text-muted-foreground">Total Students</p><p className="text-2xl font-bold">{stats.total}</p></div>
              </div>
            </div>
            <div className="bg-card rounded-xl shadow p-4 border-l-4 border-green-500">
              <div className="flex items-center gap-3">
                <UserCheck className="h-8 w-8 text-green-500" />
                <div><p className="text-xs text-muted-foreground">Assigned</p><p className="text-2xl font-bold">{stats.assigned}</p></div>
              </div>
            </div>
            <div className="bg-card rounded-xl shadow p-4 border-l-4 border-amber-500">
              <div className="flex items-center gap-3">
                <UserX className="h-8 w-8 text-amber-500" />
                <div><p className="text-xs text-muted-foreground">Unassigned</p><p className="text-2xl font-bold">{stats.unassigned}</p></div>
              </div>
            </div>
            <div className="bg-card rounded-xl shadow p-4 border-l-4 border-purple-500">
              <div className="flex items-center gap-3">
                <IndianRupee className="h-8 w-8 text-purple-500" />
                <div><p className="text-xs text-muted-foreground">Monthly Revenue</p><p className="text-2xl font-bold">?{stats.totalFee.toLocaleString('en-IN')}</p></div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left - Search + Form */}
          <div className="xl:col-span-1 space-y-4">
            <div className="bg-card text-card-foreground rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4">?? Search Students</h2>
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
                  <Label>Name / Enroll ID</Label>
                  <Input placeholder="Enter name or admission no..." value={searchFilters.search} onChange={(e) => setSearchFilters({...searchFilters, search: e.target.value})} onKeyDown={(e) => e.key === 'Enter' && searchStudents()} />
                </div>
                <Button onClick={searchStudents} className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                  Search
                </Button>
              </div>
            </div>

            {/* Transport Assignment Form */}
            {selectedStudent && (
              <div className="bg-card text-card-foreground rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold">?? Assign Transport</h2>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCancel}><X className="h-4 w-4" /></Button>
                </div>
                <div className="flex items-center gap-2 mb-3 p-2 bg-primary/5 rounded-lg">
                  <User className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">{selectedStudent.full_name}</p>
                    <p className="text-xs text-muted-foreground">{selectedStudent.class?.name}{selectedStudent.section?.name ? ` - ${selectedStudent.section.name}` : ''} | {selectedStudent.enrollment_id || 'N/A'}</p>
                  </div>
                </div>
                <form onSubmit={handleSubmit} className="space-y-3">
                  {/* Route & Pickup */}
                  <div className="space-y-2">
                    <Label>Route *</Label>
                    <Select value={formData.transport_route_id || 'none'} onValueChange={(v) => handleRouteChange(v === 'none' ? '' : v)}>
                      <SelectTrigger><SelectValue placeholder="Select Route" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">-- No Transport --</SelectItem>
                        {routes.map(r => <SelectItem key={r.id} value={r.id}>{r.route_title}</SelectItem>)}
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
                        {routePickupPoints.map(p => <SelectItem key={p.id} value={p.id}>{p.name} {p.monthly_fees ? `(?${p.monthly_fees})` : ''}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Pickup Type & Seat */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Pickup Type</Label>
                      <Select value={formData.pickup_type} onValueChange={(v) => setFormData({...formData, pickup_type: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="both">Both Ways</SelectItem>
                          <SelectItem value="pickup_only">Pickup Only</SelectItem>
                          <SelectItem value="drop_only">Drop Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Seat No.</Label>
                      <Input value={formData.seat_number} onChange={(e) => setFormData({...formData, seat_number: e.target.value})} placeholder="e.g. A-12" />
                    </div>
                  </div>

                  {/* Vehicle */}
                  <div className="space-y-2">
                    <Label>Assign Vehicle</Label>
                    <Select onValueChange={handleVehicleChange} disabled={!formData.transport_route_id}>
                      <SelectTrigger>
                        <SelectValue placeholder={!formData.transport_route_id ? "Select Route first" : routeVehicles.length === 0 ? "No vehicles for route" : "Select Vehicle"} />
                      </SelectTrigger>
                      <SelectContent>
                        {routeVehicles.map(v => <SelectItem key={v.id} value={v.id}>{v.vehicle_number} - {v.driver_name || 'No driver'}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Fee Section */}
                  <div className="space-y-2 p-2 bg-muted/30 rounded-lg">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">Annual Fee (?)</Label>
                        <Input type="number" value={formData.annual_fee} onChange={(e) => {
                          const annual = e.target.value;
                          const wm = billingConfig?.working_months || 10;
                          setFormData({...formData, annual_fee: annual, transport_fee: annual ? Math.round(parseFloat(annual) / wm) : ''});
                        }} placeholder="Annual" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Monthly (auto)</Label>
                        <Input type="number" value={formData.transport_fee} disabled className="bg-muted" />
                      </div>
                    </div>
                    {formData.pickup_type !== 'both' && billingConfig?.one_way_percentage && (
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        ? One-way: {billingConfig.one_way_percentage}% of annual fee = ?{Math.round((formData.annual_fee || 0) * billingConfig.one_way_percentage / 100).toLocaleString('en-IN')}
                      </p>
                    )}
                    {billingConfig && (
                      <p className="text-xs text-muted-foreground">
                        Billing: <strong className="capitalize">{(billingConfig.billing_mode || 'monthly').replace('_', ' ')}</strong>
                        {billingConfig.billing_mode === 'monthly' && ` • ${billingConfig.working_months || 10} months`}
                      </p>
                    )}
                  </div>

                  {/* Times */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Pickup</Label>
                      <Input type="time" value={formData.pickup_time} onChange={(e) => setFormData({...formData, pickup_time: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Drop</Label>
                      <Input type="time" value={formData.drop_time} onChange={(e) => setFormData({...formData, drop_time: e.target.value})} />
                    </div>
                  </div>

                  {/* Vehicle Details */}
                  <div className="grid grid-cols-3 gap-2">
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

                  {/* Effective Dates */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Effective From</Label>
                      <Input type="date" value={formData.effective_from} onChange={(e) => setFormData({...formData, effective_from: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Effective To</Label>
                      <Input type="date" value={formData.effective_to} onChange={(e) => setFormData({...formData, effective_to: e.target.value})} />
                    </div>
                  </div>

                  {/* Emergency & Tracking */}
                  <div className="space-y-1">
                    <Label className="text-xs">Emergency Contact</Label>
                    <Input value={formData.emergency_contact} onChange={(e) => setFormData({...formData, emergency_contact: e.target.value})} placeholder="Parent/Guardian phone" />
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-xs cursor-pointer">
                      <input type="checkbox" checked={formData.parent_tracking_enabled} onChange={(e) => setFormData({...formData, parent_tracking_enabled: e.target.checked})} className="rounded" />
                      <Shield className="h-3 w-3" /> Parent Tracking
                    </label>
                    <label className="flex items-center gap-2 text-xs cursor-pointer">
                      <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({...formData, is_active: e.target.checked})} className="rounded" />
                      Active
                    </label>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Special Instructions</Label>
                    <Textarea value={formData.special_instructions} onChange={(e) => setFormData({...formData, special_instructions: e.target.value})} placeholder="Any special instructions..." rows={2} />
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
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">?? Student Transport List</h2>
                  {hasSearched && (
                    <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
                      <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All ({stats.total})</SelectItem>
                        <SelectItem value="assigned">Assigned ({stats.assigned})</SelectItem>
                        <SelectItem value="unassigned">Unassigned ({stats.unassigned})</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
                {loading ? (
                  <div className="flex justify-center items-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>{hasSearched ? 'No students found matching your search.' : 'Search for students to assign transport.'}</p>
                  </div>
                ) : (
                  <>
                    <div className="border rounded-lg overflow-hidden max-h-[550px] overflow-y-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs text-foreground uppercase bg-muted/50 sticky top-0 bg-background z-10">
                          <tr>
                            <th className="px-3 py-3 w-10">#</th>
                            <th className="px-3 py-3">Student</th>
                            <th className="px-3 py-3">Class</th>
                            <th className="px-3 py-3">Route</th>
                            <th className="px-3 py-3">Pickup Point</th>
                            <th className="px-3 py-3">Type</th>
                            <th className="px-3 py-3">Fee</th>
                            <th className="px-3 py-3">Status</th>
                            <th className="px-3 py-3 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedStudents.map((student, index) => (
                            <tr key={student.id} className={`border-b border-border hover:bg-muted/50 ${selectedStudent?.id === student.id ? 'bg-primary/10' : ''}`}>
                              <td className="px-3 py-3">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                              <td className="px-3 py-3">
                                <div>
                                  <p className="font-medium">{student.full_name}</p>
                                  <p className="text-xs text-muted-foreground">{student.enrollment_id || ''}</p>
                                </div>
                              </td>
                              <td className="px-3 py-3">{student.class?.name || '-'}{student.section?.name ? ` - ${student.section.name}` : ''}</td>
                              <td className="px-3 py-3">{getRouteName(student.transport?.transport_route_id)}</td>
                              <td className="px-3 py-3">{getPickupPointName(student.transport?.transport_pickup_point_id)}</td>
                              <td className="px-3 py-3">{student.transport ? getPickupTypeBadge(student.transport.pickup_type) : '-'}</td>
                              <td className="px-3 py-3">
                                {student.transport?.annual_fee ? (
                                  <div>
                                    <span className="flex items-center gap-1 font-medium"><IndianRupee className="h-3 w-3" />{Number(student.transport.annual_fee).toLocaleString('en-IN')}</span>
                                    <span className="text-[10px] text-muted-foreground">annual</span>
                                  </div>
                                ) : student.transport?.transport_fee ? (
                                  <span className="flex items-center gap-1 font-medium"><IndianRupee className="h-3 w-3" />{student.transport.transport_fee}</span>
                                ) : '-'}
                              </td>
                              <td className="px-3 py-3">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${student.transport ? (student.transport.is_active !== false ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400') : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                                  {student.transport ? (student.transport.is_active !== false ? 'Active' : 'Inactive') : 'Not Assigned'}
                                </span>
                              </td>
                              <td className="px-3 py-3 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <Button variant="outline" size="sm" onClick={() => handleEdit(student)}>
                                    <MapPin className="h-3 w-3 mr-1" /> {student.transport ? 'Edit' : 'Assign'}
                                  </Button>
                                  {student.transport && (
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700" onClick={() => handleRemoveTransport(student)}>
                                      <X className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between mt-4 text-sm">
                      <span className="text-muted-foreground">Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredStudents.length)} of {filteredStudents.length} entries</span>
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
                        <span className="px-2">Page {currentPage} of {totalPages || 1}</span>
                        <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
                        <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(totalPages)}><ChevronsRight className="h-4 w-4" /></Button>
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
