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
import { formatDate } from '@/utils/dateUtils';
import {
  Edit, Trash2, Save, Loader2, Bus, X, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, ArrowLeft, Search, Fuel, Shield,
  FileText, AlertTriangle, CheckCircle2, Clock, Wrench, CircleDot, Download
} from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog';

const VEHICLE_TYPES = [
  { value: 'bus', label: 'Bus' },
  { value: 'mini_bus', label: 'Mini Bus' },
  { value: 'van', label: 'Van' },
  { value: 'auto', label: 'Auto Rickshaw' },
  { value: 'car', label: 'Car' },
  { value: 'tempo', label: 'Tempo Traveller' },
];

const FUEL_TYPES = [
  { value: 'diesel', label: 'Diesel' },
  { value: 'petrol', label: 'Petrol' },
  { value: 'cng', label: 'CNG' },
  { value: 'electric', label: 'Electric' },
  { value: 'hybrid', label: 'Hybrid' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  { value: 'maintenance', label: 'In Maintenance', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  { value: 'inactive', label: 'Inactive', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
];

const initialFormData = {
  vehicle_number: '', registration_number: '', chassis_number: '', vehicle_model: '',
  year_made: '', driver_name: '', driver_license: '', driver_contact: '',
  max_seating_capacity: '', note: '', vehicle_type: '', fuel_type: '',
  gps_device_id: '', insurance_expiry: '', permit_expiry: '', fitness_expiry: '',
  status: 'active', is_active: true,
};

// Expiry badge helper
const getExpiryBadge = (dateStr) => {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(dateStr);
  const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { label: 'Expired', class: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' };
  if (diffDays <= 30) return { label: `${diffDays}d left`, class: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' };
  return { label: 'Valid', class: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' };
};

const TransportVehicles = () => {
  const navigate = useNavigate();
  const { user, currentSessionId, organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [formData, setFormData] = useState({ ...initialFormData });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const branchId = selectedBranch?.id || user?.profile?.branch_id;

  const fetchVehicles = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('transport_vehicles')
      .select('*')
      .eq('branch_id', branchId)
      .order('created_at', { ascending: false });

    if (error) {
      toast({ variant: 'destructive', title: 'Error fetching vehicles', description: error.message });
    } else {
      setVehicles(data || []);
    }
    setLoading(false);
  }, [branchId, toast]);

  useEffect(() => { fetchVehicles(); }, [fetchVehicles]);

  // Stats
  const stats = useMemo(() => {
    const total = vehicles.length;
    const active = vehicles.filter(v => v.status === 'active' || (!v.status && v.is_active !== false)).length;
    const maintenance = vehicles.filter(v => v.status === 'maintenance').length;
    const inactive = vehicles.filter(v => v.status === 'inactive' || v.is_active === false).length;
    const totalCapacity = vehicles.reduce((sum, v) => sum + (v.max_seating_capacity || 0), 0);
    return { total, active, maintenance, inactive, totalCapacity };
  }, [vehicles]);

  // Filtered vehicles
  const filteredVehicles = useMemo(() => {
    let result = vehicles;
    if (statusFilter !== 'all') {
      result = result.filter(v => v.status === statusFilter || (statusFilter === 'active' && !v.status && v.is_active !== false));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(v =>
        (v.vehicle_number || '').toLowerCase().includes(q) ||
        (v.vehicle_model || '').toLowerCase().includes(q) ||
        (v.driver_name || '').toLowerCase().includes(q) ||
        (v.registration_number || '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [vehicles, statusFilter, searchQuery]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredVehicles.length / itemsPerPage));
  const paginatedVehicles = filteredVehicles.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => { setCurrentPage(1); }, [searchQuery, statusFilter]);

  const handleEdit = (vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      vehicle_number: vehicle.vehicle_number || '',
      registration_number: vehicle.registration_number || '',
      chassis_number: vehicle.chassis_number || '',
      vehicle_model: vehicle.vehicle_model || '',
      year_made: vehicle.year_made || '',
      driver_name: vehicle.driver_name || '',
      driver_license: vehicle.driver_license || '',
      driver_contact: vehicle.driver_contact || '',
      max_seating_capacity: vehicle.max_seating_capacity || '',
      note: vehicle.note || '',
      vehicle_type: vehicle.vehicle_type || '',
      fuel_type: vehicle.fuel_type || '',
      gps_device_id: vehicle.gps_device_id || '',
      insurance_expiry: vehicle.insurance_expiry || '',
      permit_expiry: vehicle.permit_expiry || '',
      fitness_expiry: vehicle.fitness_expiry || '',
      status: vehicle.status || 'active',
      is_active: vehicle.is_active !== false,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    setEditingVehicle(null);
    setFormData({ ...initialFormData });
  };

  const handleExportCSV = () => {
    if (filteredVehicles.length === 0) return toast({ variant: 'destructive', title: 'No data to export' });
    const headers = ['Vehicle No', 'Model', 'Type', 'Fuel', 'Capacity', 'Driver', 'Status', 'Insurance Exp', 'Permit Exp', 'Fitness Exp'];
    const rows = filteredVehicles.map(v => [
      v.vehicle_number || '', v.vehicle_model || '', v.vehicle_type || '', v.fuel_type || '',
      v.max_seating_capacity || '', v.driver_name || '', v.status || '',
      formatDate(v.insurance_expiry), formatDate(v.permit_expiry), formatDate(v.fitness_expiry)
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'vehicles.csv'; a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Exported!', description: `${filteredVehicles.length} vehicles exported.` });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.vehicle_number.trim()) {
      toast({ variant: 'destructive', title: 'Vehicle number is required.' });
      return;
    }
    setIsSubmitting(true);

    const payload = {
      vehicle_number: formData.vehicle_number.trim(),
      registration_number: formData.registration_number || null,
      chassis_number: formData.chassis_number || null,
      vehicle_model: formData.vehicle_model || null,
      year_made: formData.year_made || null,
      driver_name: formData.driver_name || null,
      driver_license: formData.driver_license || null,
      driver_contact: formData.driver_contact || null,
      max_seating_capacity: formData.max_seating_capacity ? parseInt(formData.max_seating_capacity) : null,
      note: formData.note || null,
      vehicle_type: formData.vehicle_type || null,
      fuel_type: formData.fuel_type || null,
      gps_device_id: formData.gps_device_id || null,
      insurance_expiry: formData.insurance_expiry || null,
      permit_expiry: formData.permit_expiry || null,
      fitness_expiry: formData.fitness_expiry || null,
      status: formData.status || 'active',
      is_active: formData.status !== 'inactive',
      branch_id: branchId,
      session_id: currentSessionId,
      organization_id: organizationId,
    };

    let error;
    if (editingVehicle) {
      ({ error } = await supabase.from('transport_vehicles').update(payload).eq('id', editingVehicle.id));
    } else {
      ({ error } = await supabase.from('transport_vehicles').insert(payload));
    }

    if (error) {
      toast({ variant: 'destructive', title: `Error ${editingVehicle ? 'updating' : 'creating'} vehicle`, description: error.message });
    } else {
      toast({ title: 'Success!', description: `Vehicle successfully ${editingVehicle ? 'updated' : 'created'}.` });
      await fetchVehicles();
      handleCancel();
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (vehicleId) => {
    const { error } = await supabase.from('transport_vehicles').delete().eq('id', vehicleId);
    if (error) {
      toast({ variant: 'destructive', title: 'Error deleting vehicle', description: error.message });
    } else {
      toast({ title: 'Success!', description: 'Vehicle deleted successfully.' });
      await fetchVehicles();
    }
  };

  const getStatusBadge = (status) => {
    const opt = STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0];
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${opt.color}`}>{opt.label}</span>;
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4 gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>

        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">🚌 Transport Vehicles</h1>
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="mr-1 h-4 w-4" /> Export
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-card rounded-xl shadow p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30"><Bus className="h-5 w-5 text-blue-600 dark:text-blue-400" /></div>
            <div><p className="text-xs text-muted-foreground">Total Vehicles</p><p className="text-xl font-bold">{stats.total}</p></div>
          </div>
          <div className="bg-card rounded-xl shadow p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30"><CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" /></div>
            <div><p className="text-xs text-muted-foreground">Active</p><p className="text-xl font-bold text-green-600">{stats.active}</p></div>
          </div>
          <div className="bg-card rounded-xl shadow p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30"><Wrench className="h-5 w-5 text-yellow-600 dark:text-yellow-400" /></div>
            <div><p className="text-xs text-muted-foreground">Maintenance</p><p className="text-xl font-bold text-yellow-600">{stats.maintenance}</p></div>
          </div>
          <div className="bg-card rounded-xl shadow p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30"><AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" /></div>
            <div><p className="text-xs text-muted-foreground">Inactive</p><p className="text-xl font-bold text-red-600">{stats.inactive}</p></div>
          </div>
          <div className="bg-card rounded-xl shadow p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30"><CircleDot className="h-5 w-5 text-purple-600 dark:text-purple-400" /></div>
            <div><p className="text-xs text-muted-foreground">Total Capacity</p><p className="text-xl font-bold text-purple-600">{stats.totalCapacity}</p></div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left - Add/Edit Form */}
          <div className="xl:col-span-1">
            <div className="bg-card text-card-foreground rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4">{editingVehicle ? 'Edit Vehicle' : 'Add Vehicle'}</h2>
              <form onSubmit={handleSubmit} className="space-y-3">
                {/* Basic Info */}
                <div className="space-y-2">
                  <Label htmlFor="vehicle_number">Vehicle Number *</Label>
                  <Input id="vehicle_number" value={formData.vehicle_number} onChange={(e) => setFormData({...formData, vehicle_number: e.target.value.toUpperCase()})} placeholder="e.g. KA01AB1234" required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="vehicle_type">Vehicle Type</Label>
                    <Select value={formData.vehicle_type} onValueChange={(v) => setFormData({...formData, vehicle_type: v})}>
                      <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                      <SelectContent>
                        {VEHICLE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fuel_type">Fuel Type</Label>
                    <Select value={formData.fuel_type} onValueChange={(v) => setFormData({...formData, fuel_type: v})}>
                      <SelectTrigger><SelectValue placeholder="Select fuel" /></SelectTrigger>
                      <SelectContent>
                        {FUEL_TYPES.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vehicle_model">Vehicle Model</Label>
                  <Input id="vehicle_model" value={formData.vehicle_model} onChange={(e) => setFormData({...formData, vehicle_model: e.target.value})} placeholder="e.g. Tata Starbus" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="registration_number">Reg. Number</Label>
                    <Input id="registration_number" value={formData.registration_number} onChange={(e) => setFormData({...formData, registration_number: e.target.value})} placeholder="Reg No." />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="chassis_number">Chassis No.</Label>
                    <Input id="chassis_number" value={formData.chassis_number} onChange={(e) => setFormData({...formData, chassis_number: e.target.value})} placeholder="Chassis No." />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="year_made">Year Made</Label>
                    <Input id="year_made" value={formData.year_made} onChange={(e) => setFormData({...formData, year_made: e.target.value})} placeholder="e.g. 2020" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max_seating_capacity">Capacity</Label>
                    <Input id="max_seating_capacity" type="number" value={formData.max_seating_capacity} onChange={(e) => setFormData({...formData, max_seating_capacity: e.target.value})} placeholder="e.g. 40" />
                  </div>
                </div>

                {/* GPS & Status */}
                <div className="border-t pt-3 mt-3">
                  <h4 className="font-semibold mb-3 flex items-center gap-2"><CircleDot className="h-4 w-4" /> GPS & Status</h4>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="gps_device_id">GPS Device ID</Label>
                      <Input id="gps_device_id" value={formData.gps_device_id} onChange={(e) => setFormData({...formData, gps_device_id: e.target.value})} placeholder="GPS tracker ID" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                        <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Document Expiry */}
                <div className="border-t pt-3 mt-3">
                  <h4 className="font-semibold mb-3 flex items-center gap-2"><FileText className="h-4 w-4" /> Document Expiry Dates</h4>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="insurance_expiry">Insurance Expiry</Label>
                      <Input id="insurance_expiry" type="date" value={formData.insurance_expiry} onChange={(e) => setFormData({...formData, insurance_expiry: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="permit_expiry">Permit Expiry</Label>
                      <Input id="permit_expiry" type="date" value={formData.permit_expiry} onChange={(e) => setFormData({...formData, permit_expiry: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fitness_expiry">Fitness Expiry</Label>
                      <Input id="fitness_expiry" type="date" value={formData.fitness_expiry} onChange={(e) => setFormData({...formData, fitness_expiry: e.target.value})} />
                    </div>
                  </div>
                </div>

                {/* Driver Info (legacy fields) */}
                <div className="border-t pt-3 mt-3">
                  <h4 className="font-semibold mb-3 flex items-center gap-2"><Shield className="h-4 w-4" /> Driver Info (Quick)</h4>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="driver_name">Driver Name</Label>
                      <Input id="driver_name" value={formData.driver_name} onChange={(e) => setFormData({...formData, driver_name: e.target.value})} placeholder="Driver full name" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="driver_contact">Contact</Label>
                        <Input id="driver_contact" value={formData.driver_contact} onChange={(e) => setFormData({...formData, driver_contact: e.target.value})} placeholder="Mobile" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="driver_license">License</Label>
                        <Input id="driver_license" value={formData.driver_license} onChange={(e) => setFormData({...formData, driver_license: e.target.value})} placeholder="DL No." />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="note">Notes</Label>
                  <Textarea id="note" value={formData.note} onChange={(e) => setFormData({...formData, note: e.target.value})} placeholder="Any additional notes..." rows={2} />
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  {editingVehicle ? 'Update Vehicle' : 'Save Vehicle'}
                </Button>
                {editingVehicle && (
                  <Button type="button" variant="outline" className="w-full" onClick={handleCancel}>
                    <X className="mr-2 h-4 w-4" /> Cancel
                  </Button>
                )}
              </form>
            </div>
          </div>

          {/* Right - List */}
          <div className="xl:col-span-2">
            <div className="bg-card text-card-foreground rounded-xl shadow-lg">
              <div className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <h2 className="text-xl font-bold">Vehicles List ({filteredVehicles.length})</h2>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input className="pl-8 w-[200px] h-9" placeholder="Search vehicles..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[130px] h-9"><SelectValue placeholder="Status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        {STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {loading ? (
                  <div className="flex justify-center items-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : filteredVehicles.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <Bus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>{vehicles.length === 0 ? 'No vehicles found. Add one to get started.' : 'No vehicles match your search.'}</p>
                  </div>
                ) : (
                  <>
                    <div className="border rounded-lg overflow-hidden max-h-[600px] overflow-y-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs text-foreground uppercase bg-muted/50 sticky top-0 bg-background z-10">
                          <tr>
                            <th className="px-3 py-3 w-10">#</th>
                            <th className="px-3 py-3">Vehicle</th>
                            <th className="px-3 py-3">Type</th>
                            <th className="px-3 py-3 text-center">Capacity</th>
                            <th className="px-3 py-3">Driver</th>
                            <th className="px-3 py-3 text-center">Status</th>
                            <th className="px-3 py-3 text-center">Docs</th>
                            <th className="px-3 py-3 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedVehicles.map((vehicle, index) => {
                            const insExp = getExpiryBadge(vehicle.insurance_expiry);
                            const perExp = getExpiryBadge(vehicle.permit_expiry);
                            const fitExp = getExpiryBadge(vehicle.fitness_expiry);
                            const typeLabel = VEHICLE_TYPES.find(t => t.value === vehicle.vehicle_type)?.label || vehicle.vehicle_type || '-';
                            const fuelLabel = FUEL_TYPES.find(f => f.value === vehicle.fuel_type)?.label;
                            return (
                              <tr key={vehicle.id} className="border-b border-border hover:bg-muted/50">
                                <td className="px-3 py-3 text-muted-foreground">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                                <td className="px-3 py-3">
                                  <div className="font-semibold">{vehicle.vehicle_number}</div>
                                  <div className="text-xs text-muted-foreground">{vehicle.vehicle_model || ''}</div>
                                </td>
                                <td className="px-3 py-3">
                                  <div className="text-xs">{typeLabel}</div>
                                  {fuelLabel && (
                                    <div className="text-xs text-muted-foreground flex items-center gap-1"><Fuel className="h-3 w-3" />{fuelLabel}</div>
                                  )}
                                </td>
                                <td className="px-3 py-3 text-center font-medium">{vehicle.max_seating_capacity || '-'}</td>
                                <td className="px-3 py-3">
                                  <div className="text-xs">{vehicle.driver_name || '-'}</div>
                                  {vehicle.driver_contact && <div className="text-xs text-muted-foreground">{vehicle.driver_contact}</div>}
                                </td>
                                <td className="px-3 py-3 text-center">{getStatusBadge(vehicle.status || 'active')}</td>
                                <td className="px-3 py-3">
                                  <div className="flex flex-col gap-0.5 items-center">
                                    {insExp && <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${insExp.class}`} title={`Insurance: ${formatDate(vehicle.insurance_expiry)}`}>Ins: {insExp.label}</span>}
                                    {perExp && <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${perExp.class}`} title={`Permit: ${formatDate(vehicle.permit_expiry)}`}>Per: {perExp.label}</span>}
                                    {fitExp && <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${fitExp.class}`} title={`Fitness: ${formatDate(vehicle.fitness_expiry)}`}>Fit: {fitExp.label}</span>}
                                    {!insExp && !perExp && !fitExp && <span className="text-xs text-muted-foreground">-</span>}
                                  </div>
                                </td>
                                <td className="px-3 py-3 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleEdit(vehicle)}>
                                      <Edit className="h-3.5 w-3.5 text-yellow-600" />
                                    </Button>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="icon" className="h-7 w-7"><Trash2 className="h-3.5 w-3.5" /></Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Delete Vehicle?</AlertDialogTitle>
                                          <AlertDialogDescription>This will permanently delete vehicle &quot;{vehicle.vehicle_number}&quot;. This action cannot be undone.</AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction onClick={() => handleDelete(vehicle.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between mt-4 text-sm">
                      <span className="text-muted-foreground">Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredVehicles.length)} of {filteredVehicles.length} entries</span>
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

export default TransportVehicles;
