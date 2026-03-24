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
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import {
  Loader2, Save, X, Edit, Trash2, ArrowLeft, Wrench, Plus, Calendar, IndianRupee,
  AlertTriangle, CheckCircle, Clock, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Bus, Download
} from 'lucide-react';

const VehicleMaintenance = () => {
  const navigate = useNavigate();
  const { user, currentSessionId, organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();
  const branchId = selectedBranch?.id || user?.profile?.branch_id;

  const [records, setRecords] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [filterVehicle, setFilterVehicle] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [formData, setFormData] = useState({
    vehicle_id: '',
    maintenance_type: 'routine',
    description: '',
    scheduled_date: '',
    completed_date: '',
    cost: '',
    vendor_name: '',
    vendor_contact: '',
    odometer_reading: '',
    parts_replaced: '',
    next_maintenance_date: '',
    status: 'scheduled',
    notes: ''
  });

  const fetchData = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);

    const [maintenanceRes, vehiclesRes] = await Promise.all([
      supabase.from('transport_vehicle_maintenance').select(`
        *, vehicle:vehicle_id(vehicle_number, vehicle_type)
      `).eq('branch_id', branchId).order('scheduled_date', { ascending: false }),
      supabase.from('transport_vehicles').select('id, vehicle_number, vehicle_type').eq('branch_id', branchId)
    ]);

    setRecords(maintenanceRes.data || []);
    setVehicles(vehiclesRes.data || []);
    setLoading(false);
  }, [branchId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Stats
  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const upcoming = records.filter(r => r.status === 'scheduled' || r.status === 'in_progress').length;
    const overdue = records.filter(r => r.status === 'scheduled' && r.scheduled_date < today).length;
    const completed = records.filter(r => r.status === 'completed').length;
    const totalCost = records.filter(r => r.status === 'completed').reduce((sum, r) => sum + (parseFloat(r.cost) || 0), 0);
    return { upcoming, overdue, completed, totalCost };
  }, [records]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    let filtered = records;
    const today = new Date().toISOString().split('T')[0];

    if (activeTab === 'upcoming') filtered = filtered.filter(r => r.status === 'scheduled' || r.status === 'in_progress');
    else if (activeTab === 'history') filtered = filtered.filter(r => r.status === 'completed' || r.status === 'cancelled');
    else if (activeTab === 'overdue') filtered = filtered.filter(r => r.status === 'scheduled' && r.scheduled_date < today);

    if (filterVehicle !== 'all') filtered = filtered.filter(r => r.vehicle_id === filterVehicle);

    return filtered;
  }, [records, activeTab, filterVehicle]);

  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const paginatedRecords = filteredRecords.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const resetForm = () => {
    setFormData({
      vehicle_id: '', maintenance_type: 'routine', description: '', scheduled_date: '',
      completed_date: '', cost: '', vendor_name: '', vendor_contact: '', odometer_reading: '',
      parts_replaced: '', next_maintenance_date: '', status: 'scheduled', notes: ''
    });
    setEditingRecord(null);
    setShowForm(false);
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    setFormData({
      vehicle_id: record.vehicle_id || '',
      maintenance_type: record.maintenance_type || 'routine',
      description: record.description || '',
      scheduled_date: record.scheduled_date || '',
      completed_date: record.completed_date || '',
      cost: record.cost || '',
      vendor_name: record.vendor_name || '',
      vendor_contact: record.vendor_contact || '',
      odometer_reading: record.odometer_reading || '',
      parts_replaced: record.parts_replaced || '',
      next_maintenance_date: record.next_maintenance_date || '',
      status: record.status || 'scheduled',
      notes: record.notes || ''
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExportCSV = () => {
    if (filteredRecords.length === 0) return toast({ variant: 'destructive', title: 'No data to export' });
    const headers = ['Vehicle', 'Type', 'Description', 'Scheduled', 'Completed', 'Cost', 'Vendor', 'Status'];
    const rows = filteredRecords.map(r => [
      r.vehicle?.vehicle_number || '', r.maintenance_type || '', r.description || '',
      formatDate(r.scheduled_date), formatDate(r.completed_date), r.cost || '', r.vendor_name || '', r.status || ''
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'maintenance.csv'; a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Exported!', description: `${filteredRecords.length} records exported.` });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.vehicle_id || !formData.scheduled_date) {
      toast({ variant: 'destructive', title: 'Vehicle and Scheduled Date are required' });
      return;
    }

    setIsSubmitting(true);

    const payload = {
      vehicle_id: formData.vehicle_id,
      maintenance_type: formData.maintenance_type,
      description: formData.description || null,
      scheduled_date: formData.scheduled_date,
      completed_date: formData.completed_date || null,
      cost: formData.cost ? parseFloat(formData.cost) : null,
      vendor_name: formData.vendor_name || null,
      vendor_contact: formData.vendor_contact || null,
      odometer_reading: formData.odometer_reading ? parseInt(formData.odometer_reading) : null,
      parts_replaced: formData.parts_replaced || null,
      next_maintenance_date: formData.next_maintenance_date || null,
      status: formData.status,
      notes: formData.notes || null,
      branch_id: branchId,
      session_id: currentSessionId,
      organization_id: organizationId
    };

    let error;
    if (editingRecord) {
      ({ error } = await supabase.from('transport_vehicle_maintenance').update(payload).eq('id', editingRecord.id));
    } else {
      ({ error } = await supabase.from('transport_vehicle_maintenance').insert(payload));
    }

    if (error) {
      toast({ variant: 'destructive', title: `Error ${editingRecord ? 'updating' : 'creating'} record`, description: error.message });
    } else {
      toast({ title: 'Success!', description: `Maintenance record ${editingRecord ? 'updated' : 'created'}.` });
      await fetchData();
      resetForm();
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from('transport_vehicle_maintenance').delete().eq('id', id);
    if (error) {
      toast({ variant: 'destructive', title: 'Error deleting record', description: error.message });
    } else {
      toast({ title: 'Success!', description: 'Record deleted.' });
      await fetchData();
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      in_progress: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    };
    const labels = { scheduled: 'Scheduled', in_progress: 'In Progress', completed: 'Completed', cancelled: 'Cancelled' };
    return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.scheduled}`}>{labels[status] || status}</span>;
  };

  const getTypeBadge = (type) => {
    const styles = {
      routine: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400', repair: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-400',
      emergency: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400', inspection: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-400',
      tire: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400', oil_change: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-400'
    };
    return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${styles[type] || styles.routine}`}>{type?.replace('_', ' ')}</span>;
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4 gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">🔧 Vehicle Maintenance</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="mr-1 h-4 w-4" /> Export
            </Button>
            <Button onClick={() => { resetForm(); setShowForm(true); }}>
              <Plus className="mr-2 h-4 w-4" /> New Record
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-card rounded-xl shadow p-4 border-l-4 border-blue-500">
            <p className="text-xs text-muted-foreground">Upcoming</p>
            <p className="text-2xl font-bold">{stats.upcoming}</p>
          </div>
          <div className="bg-card rounded-xl shadow p-4 border-l-4 border-red-500">
            <p className="text-xs text-muted-foreground">Overdue</p>
            <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
          </div>
          <div className="bg-card rounded-xl shadow p-4 border-l-4 border-green-500">
            <p className="text-xs text-muted-foreground">Completed</p>
            <p className="text-2xl font-bold">{stats.completed}</p>
          </div>
          <div className="bg-card rounded-xl shadow p-4 border-l-4 border-emerald-500">
            <p className="text-xs text-muted-foreground">Total Cost</p>
            <p className="text-2xl font-bold flex items-center">
              <IndianRupee className="h-4 w-4" />{stats.totalCost.toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left - Form */}
          {showForm && (
            <div className="xl:col-span-1">
              <div className="bg-card text-card-foreground rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold">{editingRecord ? 'Edit Record' : 'New Maintenance'}</h2>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={resetForm}><X className="h-4 w-4" /></Button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="space-y-2">
                    <Label>Vehicle *</Label>
                    <Select value={formData.vehicle_id} onValueChange={(v) => setFormData({...formData, vehicle_id: v})}>
                      <SelectTrigger><SelectValue placeholder="Select Vehicle" /></SelectTrigger>
                      <SelectContent>
                        {vehicles.map(v => <SelectItem key={v.id} value={v.id}>{v.vehicle_number} ({v.vehicle_type || 'Bus'})</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Type</Label>
                      <Select value={formData.maintenance_type} onValueChange={(v) => setFormData({...formData, maintenance_type: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="routine">Routine</SelectItem>
                          <SelectItem value="repair">Repair</SelectItem>
                          <SelectItem value="emergency">Emergency</SelectItem>
                          <SelectItem value="inspection">Inspection</SelectItem>
                          <SelectItem value="tire">Tire</SelectItem>
                          <SelectItem value="oil_change">Oil Change</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Status</Label>
                      <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="scheduled">Scheduled</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Description</Label>
                    <Textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="What needs to be done..." rows={2} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Scheduled Date *</Label>
                      <Input type="date" value={formData.scheduled_date} onChange={(e) => setFormData({...formData, scheduled_date: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Completed Date</Label>
                      <Input type="date" value={formData.completed_date} onChange={(e) => setFormData({...formData, completed_date: e.target.value})} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Cost (₹)</Label>
                      <Input type="number" value={formData.cost} onChange={(e) => setFormData({...formData, cost: e.target.value})} placeholder="0" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Odometer</Label>
                      <Input type="number" value={formData.odometer_reading} onChange={(e) => setFormData({...formData, odometer_reading: e.target.value})} placeholder="km" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Vendor Name</Label>
                      <Input value={formData.vendor_name} onChange={(e) => setFormData({...formData, vendor_name: e.target.value})} placeholder="Garage name" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Vendor Contact</Label>
                      <Input value={formData.vendor_contact} onChange={(e) => setFormData({...formData, vendor_contact: e.target.value})} placeholder="Phone" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Parts Replaced</Label>
                    <Input value={formData.parts_replaced} onChange={(e) => setFormData({...formData, parts_replaced: e.target.value})} placeholder="e.g., Brake pads, Oil filter" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Next Maintenance Date</Label>
                    <Input type="date" value={formData.next_maintenance_date} onChange={(e) => setFormData({...formData, next_maintenance_date: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Notes</Label>
                    <Textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} rows={2} placeholder="Additional notes..." />
                  </div>
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    {editingRecord ? 'Update Record' : 'Add Record'}
                  </Button>
                </form>
              </div>
            </div>
          )}

          {/* Right - Records Table */}
          <div className={showForm ? 'xl:col-span-2' : 'xl:col-span-3'}>
            <div className="bg-card text-card-foreground rounded-xl shadow-lg">
              <div className="p-6">
                {/* Tabs + Filter */}
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Button variant={activeTab === 'upcoming' ? 'default' : 'outline'} size="sm" onClick={() => { setActiveTab('upcoming'); setCurrentPage(1); }}>
                      <Clock className="mr-1 h-3 w-3" /> Upcoming
                    </Button>
                    <Button variant={activeTab === 'overdue' ? 'default' : 'outline'} size="sm" onClick={() => { setActiveTab('overdue'); setCurrentPage(1); }}>
                      <AlertTriangle className="mr-1 h-3 w-3" /> Overdue
                    </Button>
                    <Button variant={activeTab === 'history' ? 'default' : 'outline'} size="sm" onClick={() => { setActiveTab('history'); setCurrentPage(1); }}>
                      <CheckCircle className="mr-1 h-3 w-3" /> History
                    </Button>
                    <Button variant={activeTab === 'all' ? 'default' : 'outline'} size="sm" onClick={() => { setActiveTab('all'); setCurrentPage(1); }}>
                      All
                    </Button>
                  </div>
                  <Select value={filterVehicle} onValueChange={(v) => { setFilterVehicle(v); setCurrentPage(1); }}>
                    <SelectTrigger className="w-[180px] h-8"><SelectValue placeholder="All Vehicles" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Vehicles</SelectItem>
                      {vehicles.map(v => <SelectItem key={v.id} value={v.id}>{v.vehicle_number}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {loading ? (
                  <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                ) : filteredRecords.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <Wrench className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No maintenance records found.</p>
                  </div>
                ) : (
                  <>
                    <div className="border rounded-lg overflow-hidden max-h-[550px] overflow-y-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs text-foreground uppercase bg-muted/50 sticky top-0 bg-background z-10">
                          <tr>
                            <th className="px-3 py-3 w-10">#</th>
                            <th className="px-3 py-3">Vehicle</th>
                            <th className="px-3 py-3">Type</th>
                            <th className="px-3 py-3">Description</th>
                            <th className="px-3 py-3">Scheduled</th>
                            <th className="px-3 py-3">Cost (₹)</th>
                            <th className="px-3 py-3">Vendor</th>
                            <th className="px-3 py-3">Status</th>
                            <th className="px-3 py-3 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedRecords.map((record, idx) => (
                            <tr key={record.id} className="border-b border-border hover:bg-muted/50">
                              <td className="px-3 py-3">{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                              <td className="px-3 py-3">
                                <span className="font-medium">{record.vehicle?.vehicle_number || '-'}</span>
                                <br /><span className="text-xs text-muted-foreground">{record.vehicle?.vehicle_type || ''}</span>
                              </td>
                              <td className="px-3 py-3">{getTypeBadge(record.maintenance_type)}</td>
                              <td className="px-3 py-3 max-w-[200px] truncate">{record.description || '-'}</td>
                              <td className="px-3 py-3 text-xs">
                                {formatDate(record.scheduled_date)}
                                {record.completed_date && <><br /><span className="text-green-600">Done: {formatDate(record.completed_date)}</span></>}
                              </td>
                              <td className="px-3 py-3 font-medium">{record.cost ? `₹${parseFloat(record.cost).toLocaleString('en-IN')}` : '-'}</td>
                              <td className="px-3 py-3 text-xs">{record.vendor_name || '-'}</td>
                              <td className="px-3 py-3">{getStatusBadge(record.status)}</td>
                              <td className="px-3 py-3 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleEdit(record)}>
                                    <Edit className="h-3 w-3 text-yellow-600" />
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="destructive" size="icon" className="h-7 w-7"><Trash2 className="h-3 w-3" /></Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Record?</AlertDialogTitle>
                                        <AlertDialogDescription>This will permanently delete this maintenance record.</AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDelete(record.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between mt-4 text-sm">
                      <span className="text-muted-foreground">Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredRecords.length)} of {filteredRecords.length}</span>
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

export default VehicleMaintenance;
