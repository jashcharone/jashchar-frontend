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
  Edit, Trash2, Save, Loader2, X, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, ArrowLeft, Search, Shield, Phone,
  FileText, CheckCircle2, AlertTriangle, UserCog, Calendar, Bus, Download
} from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog';

const LICENSE_TYPES = [
  { value: 'LMV', label: 'LMV (Light Motor Vehicle)' },
  { value: 'HMV', label: 'HMV (Heavy Motor Vehicle)' },
  { value: 'HGMV', label: 'HGMV (Heavy Goods Motor Vehicle)' },
  { value: 'HPMV', label: 'HPMV (Heavy Passenger Motor Vehicle)' },
  { value: 'transport', label: 'Transport License' },
];

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  { value: 'on_leave', label: 'On Leave', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  { value: 'suspended', label: 'Suspended', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  { value: 'inactive', label: 'Inactive', color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400' },
];

const initialFormData = {
  full_name: '', phone: '', alternate_phone: '', email: '',
  license_number: '', license_type: '', license_expiry: '',
  date_of_birth: '', blood_group: '', address: '',
  emergency_contact_name: '', emergency_contact_phone: '',
  experience_years: '', status: 'active', note: '',
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

const DriverManagement = () => {
  const navigate = useNavigate();
  const { user, currentSessionId, organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [formData, setFormData] = useState({ ...initialFormData });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Vehicle Assignment modal state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignDriverId, setAssignDriverId] = useState(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');

  const branchId = selectedBranch?.id || user?.profile?.branch_id;

  const fetchDrivers = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('transport_drivers')
      .select('*')
      .eq('branch_id', branchId)
      .order('created_at', { ascending: false });
    if (error) {
      toast({ variant: 'destructive', title: 'Error fetching drivers', description: error.message });
    } else {
      setDrivers(data || []);
    }
    setLoading(false);
  }, [branchId, toast]);

  const fetchVehicles = useCallback(async () => {
    if (!branchId) return;
    const { data } = await supabase
      .from('transport_vehicles')
      .select('id, vehicle_number, vehicle_model')
      .eq('branch_id', branchId)
      .order('vehicle_number');
    setVehicles(data || []);
  }, [branchId]);

  const fetchAssignments = useCallback(async () => {
    if (!branchId) return;
    const { data } = await supabase
      .from('driver_vehicle_assignments')
      .select('*, transport_vehicles(vehicle_number, vehicle_model)')
      .eq('branch_id', branchId)
      .eq('is_active', true);
    setAssignments(data || []);
  }, [branchId]);

  useEffect(() => {
    fetchDrivers();
    fetchVehicles();
    fetchAssignments();
  }, [fetchDrivers, fetchVehicles, fetchAssignments]);

  // Stats
  const stats = useMemo(() => {
    const total = drivers.length;
    const active = drivers.filter(d => d.status === 'active').length;
    const onLeave = drivers.filter(d => d.status === 'on_leave').length;
    const licenseExpiring = drivers.filter(d => {
      if (!d.license_expiry) return false;
      const diff = Math.ceil((new Date(d.license_expiry) - new Date()) / (1000 * 60 * 60 * 24));
      return diff >= 0 && diff <= 30;
    }).length;
    return { total, active, onLeave, licenseExpiring };
  }, [drivers]);

  // Filtered list
  const filteredDrivers = useMemo(() => {
    let result = drivers;
    if (statusFilter !== 'all') {
      result = result.filter(d => d.status === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(d =>
        (d.full_name || '').toLowerCase().includes(q) ||
        (d.phone || '').toLowerCase().includes(q) ||
        (d.license_number || '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [drivers, statusFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredDrivers.length / itemsPerPage));
  const paginatedDrivers = filteredDrivers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => { setCurrentPage(1); }, [searchQuery, statusFilter]);

  // Get assigned vehicle for a driver
  const getAssignedVehicle = (driverId) => {
    const a = assignments.find(x => x.driver_id === driverId);
    return a?.transport_vehicles || null;
  };

  const handleEdit = (driver) => {
    setEditingDriver(driver);
    setFormData({
      full_name: driver.full_name || '',
      phone: driver.phone || '',
      alternate_phone: driver.alternate_phone || '',
      email: driver.email || '',
      license_number: driver.license_number || '',
      license_type: driver.license_type || '',
      license_expiry: driver.license_expiry || '',
      date_of_birth: driver.date_of_birth || '',
      blood_group: driver.blood_group || '',
      address: driver.address || '',
      emergency_contact_name: driver.emergency_contact_name || '',
      emergency_contact_phone: driver.emergency_contact_phone || '',
      experience_years: driver.experience_years || '',
      status: driver.status || 'active',
      note: driver.note || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    setEditingDriver(null);
    setFormData({ ...initialFormData });
  };

  const handleExportCSV = () => {
    if (filteredDrivers.length === 0) return toast({ variant: 'destructive', title: 'No data to export' });
    const headers = ['Name', 'Phone', 'Email', 'License No', 'License Type', 'License Expiry', 'Experience (yrs)', 'Vehicle', 'Status'];
    const rows = filteredDrivers.map(d => [
      d.full_name || '', d.phone || '', d.email || '', d.license_number || '', d.license_type || '',
      formatDate(d.license_expiry), d.experience_years || '', getAssignedVehicle(d.id)?.vehicle_number || 'Unassigned', d.status || ''
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'drivers.csv'; a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Exported!', description: `${filteredDrivers.length} drivers exported.` });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.full_name.trim()) {
      toast({ variant: 'destructive', title: 'Driver name is required.' });
      return;
    }
    if (!formData.phone.trim()) {
      toast({ variant: 'destructive', title: 'Phone number is required.' });
      return;
    }
    setIsSubmitting(true);

    const payload = {
      full_name: formData.full_name.trim(),
      phone: formData.phone.trim(),
      alternate_phone: formData.alternate_phone || null,
      email: formData.email || null,
      license_number: formData.license_number || null,
      license_type: formData.license_type || null,
      license_expiry: formData.license_expiry || null,
      date_of_birth: formData.date_of_birth || null,
      blood_group: formData.blood_group || null,
      address: formData.address || null,
      emergency_contact_name: formData.emergency_contact_name || null,
      emergency_contact_phone: formData.emergency_contact_phone || null,
      experience_years: formData.experience_years ? parseInt(formData.experience_years) : null,
      status: formData.status || 'active',
      note: formData.note || null,
      branch_id: branchId,
      session_id: currentSessionId,
      organization_id: organizationId,
    };

    let error;
    if (editingDriver) {
      ({ error } = await supabase.from('transport_drivers').update(payload).eq('id', editingDriver.id));
    } else {
      ({ error } = await supabase.from('transport_drivers').insert(payload));
    }

    if (error) {
      toast({ variant: 'destructive', title: `Error ${editingDriver ? 'updating' : 'creating'} driver`, description: error.message });
    } else {
      toast({ title: 'Success!', description: `Driver successfully ${editingDriver ? 'updated' : 'created'}.` });
      await fetchDrivers();
      handleCancel();
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (driverId) => {
    const { error } = await supabase.from('transport_drivers').delete().eq('id', driverId);
    if (error) {
      toast({ variant: 'destructive', title: 'Error deleting driver', description: error.message });
    } else {
      toast({ title: 'Success!', description: 'Driver deleted successfully.' });
      await fetchDrivers();
      await fetchAssignments();
    }
  };

  // Vehicle Assignment
  const handleAssignVehicle = async () => {
    if (!assignDriverId || !selectedVehicleId) return;

    // Deactivate existing assignment for this driver
    await supabase
      .from('driver_vehicle_assignments')
      .update({ is_active: false })
      .eq('driver_id', assignDriverId)
      .eq('branch_id', branchId);

    const { error } = await supabase.from('driver_vehicle_assignments').insert({
      driver_id: assignDriverId,
      vehicle_id: selectedVehicleId,
      is_active: true,
      assigned_date: new Date().toISOString().split('T')[0],
      branch_id: branchId,
      session_id: currentSessionId,
      organization_id: organizationId,
    });

    if (error) {
      toast({ variant: 'destructive', title: 'Error assigning vehicle', description: error.message });
    } else {
      toast({ title: 'Success!', description: 'Vehicle assigned to driver.' });
      await fetchAssignments();
    }
    setShowAssignModal(false);
    setAssignDriverId(null);
    setSelectedVehicleId('');
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
          <h1 className="text-2xl font-bold">🚗 Driver Management</h1>
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="mr-1 h-4 w-4" /> Export
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-card rounded-xl shadow p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30"><UserCog className="h-5 w-5 text-blue-600 dark:text-blue-400" /></div>
            <div><p className="text-xs text-muted-foreground">Total Drivers</p><p className="text-xl font-bold">{stats.total}</p></div>
          </div>
          <div className="bg-card rounded-xl shadow p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30"><CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" /></div>
            <div><p className="text-xs text-muted-foreground">Active</p><p className="text-xl font-bold text-green-600">{stats.active}</p></div>
          </div>
          <div className="bg-card rounded-xl shadow p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30"><Calendar className="h-5 w-5 text-yellow-600 dark:text-yellow-400" /></div>
            <div><p className="text-xs text-muted-foreground">On Leave</p><p className="text-xl font-bold text-yellow-600">{stats.onLeave}</p></div>
          </div>
          <div className="bg-card rounded-xl shadow p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30"><AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" /></div>
            <div><p className="text-xs text-muted-foreground">License Expiring</p><p className="text-xl font-bold text-red-600">{stats.licenseExpiring}</p></div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left - Form */}
          <div className="xl:col-span-1">
            <div className="bg-card text-card-foreground rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4">{editingDriver ? 'Edit Driver' : 'Add Driver'}</h2>
              <form onSubmit={handleSubmit} className="space-y-3">
                {/* Personal Info */}
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input id="full_name" value={formData.full_name} onChange={(e) => setFormData({...formData, full_name: e.target.value})} placeholder="Driver full name" required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone *</Label>
                    <Input id="phone" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="Mobile number" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="alternate_phone">Alt. Phone</Label>
                    <Input id="alternate_phone" value={formData.alternate_phone} onChange={(e) => setFormData({...formData, alternate_phone: e.target.value})} placeholder="Alternate" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="Email address" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="date_of_birth">Date of Birth</Label>
                    <Input id="date_of_birth" type="date" value={formData.date_of_birth} onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="blood_group">Blood Group</Label>
                    <Select value={formData.blood_group} onValueChange={(v) => setFormData({...formData, blood_group: v})}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {BLOOD_GROUPS.map(bg => <SelectItem key={bg} value={bg}>{bg}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* License Info */}
                <div className="border-t pt-3 mt-3">
                  <h4 className="font-semibold mb-3 flex items-center gap-2"><FileText className="h-4 w-4" /> License Details</h4>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="license_number">License Number</Label>
                      <Input id="license_number" value={formData.license_number} onChange={(e) => setFormData({...formData, license_number: e.target.value})} placeholder="DL-XXXXXXXXXX" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="license_type">License Type</Label>
                        <Select value={formData.license_type} onValueChange={(v) => setFormData({...formData, license_type: v})}>
                          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            {LICENSE_TYPES.map(lt => <SelectItem key={lt.value} value={lt.value}>{lt.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="license_expiry">License Expiry</Label>
                        <Input id="license_expiry" type="date" value={formData.license_expiry} onChange={(e) => setFormData({...formData, license_expiry: e.target.value})} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="experience_years">Experience (Years)</Label>
                      <Input id="experience_years" type="number" value={formData.experience_years} onChange={(e) => setFormData({...formData, experience_years: e.target.value})} placeholder="e.g. 5" />
                    </div>
                  </div>
                </div>

                {/* Emergency Contact */}
                <div className="border-t pt-3 mt-3">
                  <h4 className="font-semibold mb-3 flex items-center gap-2"><Phone className="h-4 w-4" /> Emergency Contact</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="emergency_contact_name">Name</Label>
                      <Input id="emergency_contact_name" value={formData.emergency_contact_name} onChange={(e) => setFormData({...formData, emergency_contact_name: e.target.value})} placeholder="Contact name" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emergency_contact_phone">Phone</Label>
                      <Input id="emergency_contact_phone" value={formData.emergency_contact_phone} onChange={(e) => setFormData({...formData, emergency_contact_phone: e.target.value})} placeholder="Contact phone" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea id="address" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} placeholder="Full address" rows={2} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="note">Notes</Label>
                  <Textarea id="note" value={formData.note} onChange={(e) => setFormData({...formData, note: e.target.value})} placeholder="Additional notes..." rows={2} />
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  {editingDriver ? 'Update Driver' : 'Save Driver'}
                </Button>
                {editingDriver && (
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
                  <h2 className="text-xl font-bold">Drivers List ({filteredDrivers.length})</h2>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input className="pl-8 w-[200px] h-9" placeholder="Search drivers..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
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
                  <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                ) : filteredDrivers.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <UserCog className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>{drivers.length === 0 ? 'No drivers found. Add one to get started.' : 'No drivers match your search.'}</p>
                  </div>
                ) : (
                  <>
                    <div className="border rounded-lg overflow-hidden max-h-[600px] overflow-y-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs text-foreground uppercase bg-muted/50 sticky top-0 bg-background z-10">
                          <tr>
                            <th className="px-3 py-3 w-10">#</th>
                            <th className="px-3 py-3">Driver</th>
                            <th className="px-3 py-3">Contact</th>
                            <th className="px-3 py-3">License</th>
                            <th className="px-3 py-3 text-center">Vehicle</th>
                            <th className="px-3 py-3 text-center">Status</th>
                            <th className="px-3 py-3 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedDrivers.map((driver, index) => {
                            const licExp = getExpiryBadge(driver.license_expiry);
                            const assignedVehicle = getAssignedVehicle(driver.id);
                            return (
                              <tr key={driver.id} className="border-b border-border hover:bg-muted/50">
                                <td className="px-3 py-3 text-muted-foreground">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                                <td className="px-3 py-3">
                                  <div className="font-semibold">{driver.full_name}</div>
                                  {driver.experience_years && <div className="text-xs text-muted-foreground">{driver.experience_years} yrs exp.</div>}
                                </td>
                                <td className="px-3 py-3">
                                  <div className="text-xs flex items-center gap-1"><Phone className="h-3 w-3" />{driver.phone}</div>
                                  {driver.email && <div className="text-xs text-muted-foreground truncate max-w-[150px]">{driver.email}</div>}
                                </td>
                                <td className="px-3 py-3">
                                  <div className="text-xs">{driver.license_number || '-'}</div>
                                  {driver.license_type && <div className="text-xs text-muted-foreground">{driver.license_type}</div>}
                                  {licExp && <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${licExp.class}`}>{licExp.label}</span>}
                                </td>
                                <td className="px-3 py-3 text-center">
                                  {assignedVehicle ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 text-xs font-medium">
                                      <Bus className="h-3 w-3" />{assignedVehicle.vehicle_number}
                                    </span>
                                  ) : (
                                    <Button variant="outline" size="sm" className="h-6 text-xs" onClick={() => { setAssignDriverId(driver.id); setShowAssignModal(true); }}>
                                      Assign
                                    </Button>
                                  )}
                                </td>
                                <td className="px-3 py-3 text-center">{getStatusBadge(driver.status || 'active')}</td>
                                <td className="px-3 py-3 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleEdit(driver)}>
                                      <Edit className="h-3.5 w-3.5 text-yellow-600" />
                                    </Button>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="icon" className="h-7 w-7"><Trash2 className="h-3.5 w-3.5" /></Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Delete Driver?</AlertDialogTitle>
                                          <AlertDialogDescription>This will permanently delete driver &quot;{driver.full_name}&quot;. This action cannot be undone.</AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction onClick={() => handleDelete(driver.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
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
                      <span className="text-muted-foreground">Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredDrivers.length)} of {filteredDrivers.length}</span>
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

        {/* Vehicle Assignment Modal */}
        <AlertDialog open={showAssignModal} onOpenChange={setShowAssignModal}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Assign Vehicle to Driver</AlertDialogTitle>
              <AlertDialogDescription>Select a vehicle to assign to this driver.</AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
                <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                <SelectContent>
                  {vehicles.map(v => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.vehicle_number} {v.vehicle_model ? `- ${v.vehicle_model}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => { setShowAssignModal(false); setSelectedVehicleId(''); }}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleAssignVehicle} disabled={!selectedVehicleId}>Assign</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
};

export default DriverManagement;
