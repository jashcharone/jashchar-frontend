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
  Loader2, Save, X, Edit, Trash2, ArrowLeft, Bus, Route, Clock, Calendar,
  Play, Square, CheckCircle, XCircle, Users, MapPin, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Plus, Download
} from 'lucide-react';

const TripManagement = () => {
  const navigate = useNavigate();
  const { user, currentSessionId, organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();
  const branchId = selectedBranch?.id || user?.profile?.branch_id;

  const [trips, setTrips] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingTrip, setEditingTrip] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState('today');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [formData, setFormData] = useState({
    vehicle_id: '',
    route_id: '',
    driver_id: '',
    trip_date: new Date().toISOString().split('T')[0],
    trip_type: 'morning_pickup',
    scheduled_start_time: '',
    scheduled_end_time: '',
    notes: ''
  });

  const fetchData = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);

    const [tripsRes, routesRes, vehiclesRes, driversRes] = await Promise.all([
      supabase.from('transport_trips').select(`
        *,
        vehicle:vehicle_id(vehicle_number, vehicle_type),
        route:route_id(route_title),
        driver:driver_id(driver_name, phone)
      `).eq('branch_id', branchId).eq('session_id', currentSessionId).order('trip_date', { ascending: false }).order('scheduled_start_time'),
      supabase.from('transport_routes').select('id, route_title').eq('branch_id', branchId),
      supabase.from('transport_vehicles').select('id, vehicle_number, vehicle_type, capacity').eq('branch_id', branchId).eq('status', 'active'),
      supabase.from('transport_drivers').select('id, driver_name, phone').eq('branch_id', branchId).eq('is_active', true)
    ]);

    setTrips(tripsRes.data || []);
    setRoutes(routesRes.data || []);
    setVehicles(vehiclesRes.data || []);
    setDrivers(driversRes.data || []);
    setLoading(false);
  }, [branchId, currentSessionId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Stats
  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayTrips = trips.filter(t => t.trip_date === today);
    const scheduled = todayTrips.filter(t => t.status === 'scheduled').length;
    const inProgress = todayTrips.filter(t => t.status === 'in_progress').length;
    const completed = todayTrips.filter(t => t.status === 'completed').length;
    const cancelled = todayTrips.filter(t => t.status === 'cancelled').length;
    return { total: todayTrips.length, scheduled, inProgress, completed, cancelled };
  }, [trips]);

  // Filtered trips by tab
  const filteredTrips = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    if (activeTab === 'today') return trips.filter(t => t.trip_date === today);
    if (activeTab === 'scheduled') return trips.filter(t => t.status === 'scheduled');
    if (activeTab === 'history') return trips.filter(t => t.trip_date < today || t.status === 'completed' || t.status === 'cancelled');
    return trips;
  }, [trips, activeTab]);

  // Separate morning and evening
  const morningTrips = useMemo(() => filteredTrips.filter(t => t.trip_type === 'morning_pickup'), [filteredTrips]);
  const eveningTrips = useMemo(() => filteredTrips.filter(t => t.trip_type === 'afternoon_drop' || t.trip_type === 'evening_drop'), [filteredTrips]);
  const otherTrips = useMemo(() => filteredTrips.filter(t => !['morning_pickup', 'afternoon_drop', 'evening_drop'].includes(t.trip_type)), [filteredTrips]);

  const totalPages = Math.ceil(filteredTrips.length / itemsPerPage);
  const paginatedTrips = filteredTrips.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const resetForm = () => {
    setFormData({
      vehicle_id: '', route_id: '', driver_id: '',
      trip_date: new Date().toISOString().split('T')[0],
      trip_type: 'morning_pickup', scheduled_start_time: '', scheduled_end_time: '', notes: ''
    });
    setEditingTrip(null);
    setShowForm(false);
  };

  const handleEdit = (trip) => {
    setEditingTrip(trip);
    setFormData({
      vehicle_id: trip.vehicle_id || '',
      route_id: trip.route_id || '',
      driver_id: trip.driver_id || '',
      trip_date: trip.trip_date || '',
      trip_type: trip.trip_type || 'morning_pickup',
      scheduled_start_time: trip.scheduled_start_time || '',
      scheduled_end_time: trip.scheduled_end_time || '',
      notes: trip.notes || ''
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExportCSV = () => {
    if (filteredTrips.length === 0) return toast({ variant: 'destructive', title: 'No data to export' });
    const headers = ['Date', 'Type', 'Route', 'Vehicle', 'Driver', 'Start Time', 'End Time', 'Status'];
    const rows = filteredTrips.map(t => [
      formatDate(t.trip_date), t.trip_type || '', t.route?.route_title || '', t.vehicle?.vehicle_number || '',
      t.driver?.driver_name || '', t.scheduled_start_time || '', t.scheduled_end_time || '', t.status || ''
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'trips.csv'; a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Exported!', description: `${filteredTrips.length} trips exported.` });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.vehicle_id || !formData.route_id || !formData.trip_date) {
      toast({ variant: 'destructive', title: 'Vehicle, Route and Date are required' });
      return;
    }

    setIsSubmitting(true);

    const payload = {
      vehicle_id: formData.vehicle_id,
      route_id: formData.route_id,
      driver_id: formData.driver_id || null,
      trip_date: formData.trip_date,
      trip_type: formData.trip_type,
      scheduled_start_time: formData.scheduled_start_time || null,
      scheduled_end_time: formData.scheduled_end_time || null,
      notes: formData.notes || null,
      branch_id: branchId,
      session_id: currentSessionId,
      organization_id: organizationId
    };

    let error;
    if (editingTrip) {
      ({ error } = await supabase.from('transport_trips').update(payload).eq('id', editingTrip.id));
    } else {
      payload.status = 'scheduled';
      ({ error } = await supabase.from('transport_trips').insert(payload));
    }

    if (error) {
      toast({ variant: 'destructive', title: `Error ${editingTrip ? 'updating' : 'creating'} trip`, description: error.message });
    } else {
      toast({ title: 'Success!', description: `Trip ${editingTrip ? 'updated' : 'created'} successfully.` });
      await fetchData();
      resetForm();
    }
    setIsSubmitting(false);
  };

  const updateTripStatus = async (tripId, newStatus) => {
    const updateData = { status: newStatus };
    if (newStatus === 'in_progress') updateData.actual_start_time = new Date().toISOString();
    if (newStatus === 'completed') updateData.actual_end_time = new Date().toISOString();

    const { error } = await supabase.from('transport_trips').update(updateData).eq('id', tripId);
    if (error) {
      toast({ variant: 'destructive', title: 'Error updating trip status', description: error.message });
    } else {
      toast({ title: 'Success!', description: `Trip ${newStatus === 'in_progress' ? 'started' : newStatus}.` });
      await fetchData();
    }
  };

  const handleDelete = async (tripId) => {
    const { error } = await supabase.from('transport_trips').delete().eq('id', tripId);
    if (error) {
      toast({ variant: 'destructive', title: 'Error deleting trip', description: error.message });
    } else {
      toast({ title: 'Success!', description: 'Trip deleted successfully.' });
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
    const icons = { scheduled: '⏳', in_progress: '🟡', completed: '✅', cancelled: '❌' };
    const labels = { scheduled: 'Scheduled', in_progress: 'In Progress', completed: 'Completed', cancelled: 'Cancelled' };
    return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.scheduled}`}>{icons[status]} {labels[status] || status}</span>;
  };

  const getTripTypeBadge = (type) => {
    const styles = {
      morning_pickup: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      afternoon_drop: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
      evening_drop: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      special: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400'
    };
    const labels = { morning_pickup: '🌅 Morning', afternoon_drop: '🌇 Afternoon', evening_drop: '🌙 Evening', special: '⭐ Special' };
    return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${styles[type] || styles.special}`}>{labels[type] || type}</span>;
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4 gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">📋 Trip Management</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="mr-1 h-4 w-4" /> Export
            </Button>
            <Button onClick={() => { resetForm(); setShowForm(true); }}>
              <Plus className="mr-2 h-4 w-4" /> New Trip
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-card rounded-xl shadow p-4 border-l-4 border-blue-500">
            <p className="text-xs text-muted-foreground">Today's Trips</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-card rounded-xl shadow p-4 border-l-4 border-sky-500">
            <p className="text-xs text-muted-foreground">Scheduled</p>
            <p className="text-2xl font-bold">{stats.scheduled}</p>
          </div>
          <div className="bg-card rounded-xl shadow p-4 border-l-4 border-yellow-500">
            <p className="text-xs text-muted-foreground">In Progress</p>
            <p className="text-2xl font-bold">{stats.inProgress}</p>
          </div>
          <div className="bg-card rounded-xl shadow p-4 border-l-4 border-green-500">
            <p className="text-xs text-muted-foreground">Completed</p>
            <p className="text-2xl font-bold">{stats.completed}</p>
          </div>
          <div className="bg-card rounded-xl shadow p-4 border-l-4 border-red-500">
            <p className="text-xs text-muted-foreground">Cancelled</p>
            <p className="text-2xl font-bold">{stats.cancelled}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left - Form */}
          {showForm && (
            <div className="xl:col-span-1">
              <div className="bg-card text-card-foreground rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold">{editingTrip ? 'Edit Trip' : 'Schedule New Trip'}</h2>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={resetForm}><X className="h-4 w-4" /></Button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="space-y-2">
                    <Label>Route *</Label>
                    <Select value={formData.route_id} onValueChange={(v) => setFormData({...formData, route_id: v})}>
                      <SelectTrigger><SelectValue placeholder="Select Route" /></SelectTrigger>
                      <SelectContent>
                        {routes.map(r => <SelectItem key={r.id} value={r.id}>{r.route_title}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Vehicle *</Label>
                    <Select value={formData.vehicle_id} onValueChange={(v) => setFormData({...formData, vehicle_id: v})}>
                      <SelectTrigger><SelectValue placeholder="Select Vehicle" /></SelectTrigger>
                      <SelectContent>
                        {vehicles.map(v => <SelectItem key={v.id} value={v.id}>{v.vehicle_number} ({v.vehicle_type || 'Bus'})</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Driver</Label>
                    <Select value={formData.driver_id || 'none'} onValueChange={(v) => setFormData({...formData, driver_id: v === 'none' ? '' : v})}>
                      <SelectTrigger><SelectValue placeholder="Select Driver" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">-- No Driver --</SelectItem>
                        {drivers.map(d => <SelectItem key={d.id} value={d.id}>{d.driver_name} ({d.phone})</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Trip Date *</Label>
                      <Input type="date" value={formData.trip_date} onChange={(e) => setFormData({...formData, trip_date: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Trip Type</Label>
                      <Select value={formData.trip_type} onValueChange={(v) => setFormData({...formData, trip_type: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="morning_pickup">Morning Pickup</SelectItem>
                          <SelectItem value="afternoon_drop">Afternoon Drop</SelectItem>
                          <SelectItem value="evening_drop">Evening Drop</SelectItem>
                          <SelectItem value="special">Special Trip</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Start Time</Label>
                      <Input type="time" value={formData.scheduled_start_time} onChange={(e) => setFormData({...formData, scheduled_start_time: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">End Time</Label>
                      <Input type="time" value={formData.scheduled_end_time} onChange={(e) => setFormData({...formData, scheduled_end_time: e.target.value})} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Notes</Label>
                    <Textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} placeholder="Trip notes..." rows={2} />
                  </div>
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    {editingTrip ? 'Update Trip' : 'Schedule Trip'}
                  </Button>
                </form>
              </div>
            </div>
          )}

          {/* Right - Trip List */}
          <div className={showForm ? 'xl:col-span-2' : 'xl:col-span-3'}>
            <div className="bg-card text-card-foreground rounded-xl shadow-lg">
              <div className="p-6">
                {/* Tabs */}
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <Button variant={activeTab === 'today' ? 'default' : 'outline'} size="sm" onClick={() => { setActiveTab('today'); setCurrentPage(1); }}>
                    <Calendar className="mr-1 h-3 w-3" /> Today
                  </Button>
                  <Button variant={activeTab === 'scheduled' ? 'default' : 'outline'} size="sm" onClick={() => { setActiveTab('scheduled'); setCurrentPage(1); }}>
                    <Clock className="mr-1 h-3 w-3" /> Scheduled
                  </Button>
                  <Button variant={activeTab === 'history' ? 'default' : 'outline'} size="sm" onClick={() => { setActiveTab('history'); setCurrentPage(1); }}>
                    <CheckCircle className="mr-1 h-3 w-3" /> History
                  </Button>
                  <Button variant={activeTab === 'all' ? 'default' : 'outline'} size="sm" onClick={() => { setActiveTab('all'); setCurrentPage(1); }}>
                    All
                  </Button>
                </div>

                {loading ? (
                  <div className="flex justify-center items-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : filteredTrips.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <Bus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No trips found. Schedule one to get started.</p>
                  </div>
                ) : (
                  <>
                    {/* Trip Cards for Today view */}
                    {activeTab === 'today' && (
                      <div className="space-y-6">
                        {morningTrips.length > 0 && (
                          <div>
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-2">🌅 Morning Pickup Trips</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {morningTrips.map(trip => (
                                <TripCard key={trip.id} trip={trip} onEdit={handleEdit} onStatusChange={updateTripStatus} onDelete={handleDelete} getStatusBadge={getStatusBadge} getTripTypeBadge={getTripTypeBadge} />
                              ))}
                            </div>
                          </div>
                        )}
                        {eveningTrips.length > 0 && (
                          <div>
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-2">🌇 Drop Trips</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {eveningTrips.map(trip => (
                                <TripCard key={trip.id} trip={trip} onEdit={handleEdit} onStatusChange={updateTripStatus} onDelete={handleDelete} getStatusBadge={getStatusBadge} getTripTypeBadge={getTripTypeBadge} />
                              ))}
                            </div>
                          </div>
                        )}
                        {otherTrips.length > 0 && (
                          <div>
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-2">⭐ Special Trips</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {otherTrips.map(trip => (
                                <TripCard key={trip.id} trip={trip} onEdit={handleEdit} onStatusChange={updateTripStatus} onDelete={handleDelete} getStatusBadge={getStatusBadge} getTripTypeBadge={getTripTypeBadge} />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Table view for other tabs */}
                    {activeTab !== 'today' && (
                      <>
                        <div className="border rounded-lg overflow-hidden max-h-[550px] overflow-y-auto">
                          <table className="w-full text-sm text-left">
                            <thead className="text-xs text-foreground uppercase bg-muted/50 sticky top-0 bg-background z-10">
                              <tr>
                                <th className="px-3 py-3 w-10">#</th>
                                <th className="px-3 py-3">Date</th>
                                <th className="px-3 py-3">Type</th>
                                <th className="px-3 py-3">Route</th>
                                <th className="px-3 py-3">Vehicle</th>
                                <th className="px-3 py-3">Driver</th>
                                <th className="px-3 py-3">Time</th>
                                <th className="px-3 py-3">Status</th>
                                <th className="px-3 py-3 text-center">Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {paginatedTrips.map((trip, idx) => (
                                <tr key={trip.id} className="border-b border-border hover:bg-muted/50">
                                  <td className="px-3 py-3">{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                                  <td className="px-3 py-3 font-medium">{formatDate(trip.trip_date)}</td>
                                  <td className="px-3 py-3">{getTripTypeBadge(trip.trip_type)}</td>
                                  <td className="px-3 py-3">{trip.route?.route_title || '-'}</td>
                                  <td className="px-3 py-3">{trip.vehicle?.vehicle_number || '-'}</td>
                                  <td className="px-3 py-3">{trip.driver?.driver_name || '-'}</td>
                                  <td className="px-3 py-3 text-xs">{trip.scheduled_start_time || '-'} → {trip.scheduled_end_time || '-'}</td>
                                  <td className="px-3 py-3">{getStatusBadge(trip.status)}</td>
                                  <td className="px-3 py-3 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                      {trip.status === 'scheduled' && (
                                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateTripStatus(trip.id, 'in_progress')} title="Start Trip">
                                          <Play className="h-3 w-3 text-green-600" />
                                        </Button>
                                      )}
                                      {trip.status === 'in_progress' && (
                                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateTripStatus(trip.id, 'completed')} title="Complete Trip">
                                          <CheckCircle className="h-3 w-3 text-green-600" />
                                        </Button>
                                      )}
                                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleEdit(trip)}>
                                        <Edit className="h-3 w-3 text-yellow-600" />
                                      </Button>
                                      {trip.status === 'scheduled' && (
                                        <AlertDialog>
                                          <AlertDialogTrigger asChild>
                                            <Button variant="destructive" size="icon" className="h-7 w-7"><Trash2 className="h-3 w-3" /></Button>
                                          </AlertDialogTrigger>
                                          <AlertDialogContent>
                                            <AlertDialogHeader>
                                              <AlertDialogTitle>Delete Trip?</AlertDialogTitle>
                                              <AlertDialogDescription>This will permanently delete this scheduled trip.</AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                                              <AlertDialogAction onClick={() => handleDelete(trip.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                            </AlertDialogFooter>
                                          </AlertDialogContent>
                                        </AlertDialog>
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
                          <span className="text-muted-foreground">Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredTrips.length)} of {filteredTrips.length}</span>
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

// Trip Card Component
const TripCard = ({ trip, onEdit, onStatusChange, onDelete, getStatusBadge, getTripTypeBadge }) => {
  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {getTripTypeBadge(trip.trip_type)}
          {getStatusBadge(trip.status)}
        </div>
        <div className="flex items-center gap-1">
          {trip.status === 'scheduled' && (
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => onStatusChange(trip.id, 'in_progress')} title="Start">
              <Play className="h-3 w-3 text-green-600" />
            </Button>
          )}
          {trip.status === 'in_progress' && (
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => onStatusChange(trip.id, 'completed')} title="Complete">
              <CheckCircle className="h-3 w-3 text-green-600" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(trip)}>
            <Edit className="h-3 w-3" />
          </Button>
        </div>
      </div>
      <div className="space-y-1 text-sm">
        <div className="flex items-center gap-2">
          <Route className="h-3 w-3 text-muted-foreground" />
          <span className="font-medium">{trip.route?.route_title || 'N/A'}</span>
        </div>
        <div className="flex items-center gap-2">
          <Bus className="h-3 w-3 text-muted-foreground" />
          <span>{trip.vehicle?.vehicle_number || 'N/A'}</span>
        </div>
        {trip.driver && (
          <div className="flex items-center gap-2">
            <Users className="h-3 w-3 text-muted-foreground" />
            <span>{trip.driver.driver_name} ({trip.driver.phone})</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Clock className="h-3 w-3 text-muted-foreground" />
          <span>{trip.scheduled_start_time || '--:--'} → {trip.scheduled_end_time || '--:--'}</span>
        </div>
        {trip.total_students > 0 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            Students: {trip.boarded_students || 0}/{trip.total_students}
          </div>
        )}
      </div>
      {trip.notes && <p className="text-xs text-muted-foreground mt-2 italic">{trip.notes}</p>}
    </div>
  );
};

export default TripManagement;
