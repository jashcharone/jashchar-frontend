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
import {
  Edit, Trash2, Save, Loader2, Route, X, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, ArrowLeft, Search, MapPin, Clock,
  CheckCircle2, AlertTriangle, Bus, Download
} from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog';

const ROUTE_TYPES = [
  { value: 'morning_pickup', label: 'Morning Pickup' },
  { value: 'afternoon_drop', label: 'Afternoon Drop' },
  { value: 'both', label: 'Both (Pickup & Drop)' },
  { value: 'special', label: 'Special/Event' },
];

const STATUS_OPTS = [
  { value: 'active', label: 'Active', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  { value: 'inactive', label: 'Inactive', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
];

const initialFormData = {
  route_title: '', start_point: '', end_point: '',
  distance_km: '', estimated_time_minutes: '', route_type: 'both',
  is_active: true, note: '',
};

const TransportRoutes = () => {
  const navigate = useNavigate();
  const { user, currentSessionId, organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();
  const [routes, setRoutes] = useState([]);
  const [stopCounts, setStopCounts] = useState({});
  const [vehicleCounts, setVehicleCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);
  const [formData, setFormData] = useState({ ...initialFormData });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const branchId = selectedBranch?.id || user?.profile?.branch_id;

  const fetchRoutes = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('transport_routes')
      .select('*')
      .eq('branch_id', branchId)
      .order('created_at', { ascending: false });

    if (error) {
      toast({ variant: 'destructive', title: 'Error fetching routes', description: error.message });
    } else {
      setRoutes(data || []);
      // Fetch stop counts per route
      if (data?.length) {
        const routeIds = data.map(r => r.id);
        const { data: mappings } = await supabase
          .from('route_pickup_point_mappings')
          .select('route_id')
          .in('route_id', routeIds);
        if (mappings) {
          const counts = {};
          mappings.forEach(m => { counts[m.route_id] = (counts[m.route_id] || 0) + 1; });
          setStopCounts(counts);
        }
        // Fetch assigned vehicle counts per route
        const { data: assignments } = await supabase
          .from('route_vehicle_assignments')
          .select('route_id')
          .in('route_id', routeIds);
        if (assignments) {
          const vCounts = {};
          assignments.forEach(a => { vCounts[a.route_id] = (vCounts[a.route_id] || 0) + 1; });
          setVehicleCounts(vCounts);
        }
      }
    }
    setLoading(false);
  }, [branchId, toast]);

  useEffect(() => { fetchRoutes(); }, [fetchRoutes]);

  // Stats
  const stats = useMemo(() => {
    const total = routes.length;
    const active = routes.filter(r => r.is_active !== false).length;
    const inactive = total - active;
    const totalDistance = routes.reduce((sum, r) => sum + (parseFloat(r.distance_km) || 0), 0);
    return { total, active, inactive, totalDistance };
  }, [routes]);

  // Filtered routes
  const filteredRoutes = useMemo(() => {
    let result = routes;
    if (statusFilter === 'active') result = result.filter(r => r.is_active !== false);
    if (statusFilter === 'inactive') result = result.filter(r => r.is_active === false);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(r =>
        (r.route_title || '').toLowerCase().includes(q) ||
        (r.start_point || '').toLowerCase().includes(q) ||
        (r.end_point || '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [routes, statusFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredRoutes.length / itemsPerPage));
  const paginatedRoutes = filteredRoutes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => { setCurrentPage(1); }, [searchQuery, statusFilter]);

  const handleEdit = (route) => {
    setEditingRoute(route);
    setFormData({
      route_title: route.route_title || '',
      start_point: route.start_point || '',
      end_point: route.end_point || '',
      distance_km: route.distance_km || '',
      estimated_time_minutes: route.estimated_time_minutes || '',
      route_type: route.route_type || 'both',
      is_active: route.is_active !== false,
      note: route.note || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    setEditingRoute(null);
    setFormData({ ...initialFormData });
  };

  const handleExportCSV = () => {
    if (filteredRoutes.length === 0) return toast({ variant: 'destructive', title: 'No data to export' });
    const headers = ['Route', 'Start', 'End', 'Type', 'Distance (km)', 'Time (min)', 'Stops', 'Vehicles', 'Active'];
    const rows = filteredRoutes.map(r => [
      r.route_title || '', r.start_point || '', r.end_point || '', r.route_type || '',
      r.distance_km || '', r.estimated_time_minutes || '', stopCounts[r.id] || 0, vehicleCounts[r.id] || 0, r.is_active ? 'Yes' : 'No'
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'routes.csv'; a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Exported!', description: `${filteredRoutes.length} routes exported.` });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.route_title.trim()) {
      toast({ variant: 'destructive', title: 'Route title is required.' });
      return;
    }
    setIsSubmitting(true);

    // Duplicate check
    const normalizedTitle = formData.route_title.trim().toLowerCase();
    const existingRoute = routes.find(r =>
      r.route_title?.toLowerCase() === normalizedTitle && r.id !== editingRoute?.id
    );
    if (existingRoute) {
      toast({ variant: 'destructive', title: 'Duplicate Route!', description: `"${formData.route_title.trim()}" already exists.` });
      setIsSubmitting(false);
      return;
    }

    const payload = {
      route_title: formData.route_title.trim(),
      start_point: formData.start_point || null,
      end_point: formData.end_point || null,
      distance_km: formData.distance_km ? parseFloat(formData.distance_km) : null,
      estimated_time_minutes: formData.estimated_time_minutes ? parseInt(formData.estimated_time_minutes) : null,
      route_type: formData.route_type || null,
      is_active: formData.is_active,
      note: formData.note || null,
      branch_id: branchId,
      session_id: currentSessionId,
      organization_id: organizationId,
    };

    let error;
    if (editingRoute) {
      ({ error } = await supabase.from('transport_routes').update(payload).eq('id', editingRoute.id));
    } else {
      ({ error } = await supabase.from('transport_routes').insert(payload));
    }

    if (error) {
      toast({ variant: 'destructive', title: `Error ${editingRoute ? 'updating' : 'creating'} route`, description: error.message });
    } else {
      toast({ title: 'Success!', description: `Route successfully ${editingRoute ? 'updated' : 'created'}.` });
      await fetchRoutes();
      handleCancel();
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (routeId) => {
    const { error } = await supabase.from('transport_routes').delete().eq('id', routeId);
    if (error) {
      toast({ variant: 'destructive', title: 'Error deleting route', description: error.message });
    } else {
      toast({ title: 'Success!', description: 'Route deleted successfully.' });
      await fetchRoutes();
    }
  };

  const getRouteTypeLabel = (type) => ROUTE_TYPES.find(t => t.value === type)?.label || type || '-';

  return (
    <DashboardLayout>
      <div className="p-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4 gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>

        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">🛣️ Transport Routes</h1>
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="mr-1 h-4 w-4" /> Export
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-card rounded-xl shadow p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30"><Route className="h-5 w-5 text-blue-600 dark:text-blue-400" /></div>
            <div><p className="text-xs text-muted-foreground">Total Routes</p><p className="text-xl font-bold">{stats.total}</p></div>
          </div>
          <div className="bg-card rounded-xl shadow p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30"><CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" /></div>
            <div><p className="text-xs text-muted-foreground">Active</p><p className="text-xl font-bold text-green-600">{stats.active}</p></div>
          </div>
          <div className="bg-card rounded-xl shadow p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30"><AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" /></div>
            <div><p className="text-xs text-muted-foreground">Inactive</p><p className="text-xl font-bold text-red-600">{stats.inactive}</p></div>
          </div>
          <div className="bg-card rounded-xl shadow p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30"><MapPin className="h-5 w-5 text-purple-600 dark:text-purple-400" /></div>
            <div><p className="text-xs text-muted-foreground">Total Distance</p><p className="text-xl font-bold text-purple-600">{stats.totalDistance.toFixed(1)} km</p></div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left - Form */}
          <div className="xl:col-span-1">
            <div className="bg-card text-card-foreground rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4">{editingRoute ? 'Edit Route' : 'Add Route'}</h2>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="route_title">Route Title *</Label>
                  <Input id="route_title" value={formData.route_title} onChange={(e) => setFormData({...formData, route_title: e.target.value})} placeholder="e.g. Route A - City Center" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="route_type">Route Type</Label>
                  <Select value={formData.route_type} onValueChange={(v) => setFormData({...formData, route_type: v})}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      {ROUTE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="start_point">Start Location</Label>
                    <Input id="start_point" value={formData.start_point} onChange={(e) => setFormData({...formData, start_point: e.target.value})} placeholder="e.g. School Gate" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_point">End Location</Label>
                    <Input id="end_point" value={formData.end_point} onChange={(e) => setFormData({...formData, end_point: e.target.value})} placeholder="e.g. Bus Stand" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="distance_km">Distance (km)</Label>
                    <Input id="distance_km" type="number" step="0.1" value={formData.distance_km} onChange={(e) => setFormData({...formData, distance_km: e.target.value})} placeholder="e.g. 15.5" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estimated_time_minutes">Est. Time (min)</Label>
                    <Input id="estimated_time_minutes" type="number" value={formData.estimated_time_minutes} onChange={(e) => setFormData({...formData, estimated_time_minutes: e.target.value})} placeholder="e.g. 45" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="is_active">Status</Label>
                  <Select value={formData.is_active ? 'active' : 'inactive'} onValueChange={(v) => setFormData({...formData, is_active: v === 'active'})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="note">Notes</Label>
                  <Textarea id="note" value={formData.note} onChange={(e) => setFormData({...formData, note: e.target.value})} placeholder="Route details..." rows={2} />
                </div>
                <p className="text-xs text-muted-foreground">Route fee is configured in Fee Structures page</p>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  {editingRoute ? 'Update Route' : 'Save Route'}
                </Button>
                {editingRoute && (
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
                  <h2 className="text-xl font-bold">Routes List ({filteredRoutes.length})</h2>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input className="pl-8 w-[200px] h-9" placeholder="Search routes..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[120px] h-9"><SelectValue placeholder="Status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {loading ? (
                  <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                ) : filteredRoutes.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <Route className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>{routes.length === 0 ? 'No routes found. Add one to get started.' : 'No routes match your search.'}</p>
                  </div>
                ) : (
                  <>
                    <div className="border rounded-lg overflow-hidden max-h-[600px] overflow-y-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs text-foreground uppercase bg-muted/50 sticky top-0 bg-background z-10">
                          <tr>
                            <th className="px-3 py-3 w-10">#</th>
                            <th className="px-3 py-3">Route</th>
                            <th className="px-3 py-3">Type</th>
                            <th className="px-3 py-3 text-center">Distance</th>
                            <th className="px-3 py-3 text-center">Time</th>
                            <th className="px-3 py-3 text-center">Stops</th>
                            <th className="px-3 py-3 text-center">Vehicles</th>
                            <th className="px-3 py-3 text-center">Status</th>
                            <th className="px-3 py-3 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedRoutes.map((route, index) => (
                            <tr key={route.id} className="border-b border-border hover:bg-muted/50">
                              <td className="px-3 py-3 text-muted-foreground">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                              <td className="px-3 py-3">
                                <div className="font-semibold">{route.route_title}</div>
                                {(route.start_point || route.end_point) && (
                                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {route.start_point || '?'} → {route.end_point || '?'}
                                  </div>
                                )}
                              </td>
                              <td className="px-3 py-3 text-xs">{getRouteTypeLabel(route.route_type)}</td>
                              <td className="px-3 py-3 text-center text-xs">{route.distance_km ? `${route.distance_km} km` : '-'}</td>
                              <td className="px-3 py-3 text-center text-xs">
                                {route.estimated_time_minutes ? (
                                  <span className="flex items-center justify-center gap-1"><Clock className="h-3 w-3" />{route.estimated_time_minutes} min</span>
                                ) : '-'}
                              </td>
                              <td className="px-3 py-3 text-center">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 text-xs font-medium">
                                  <MapPin className="h-3 w-3" />{stopCounts[route.id] || 0}
                                </span>
                              </td>
                              <td className="px-3 py-3 text-center">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400 text-xs font-medium">
                                  <Bus className="h-3 w-3" />{vehicleCounts[route.id] || 0}
                                </span>
                              </td>
                              <td className="px-3 py-3 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${route.is_active !== false ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                                  {route.is_active !== false ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="px-3 py-3 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleEdit(route)}>
                                    <Edit className="h-3.5 w-3.5 text-yellow-600" />
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="destructive" size="icon" className="h-7 w-7"><Trash2 className="h-3.5 w-3.5" /></Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Route?</AlertDialogTitle>
                                        <AlertDialogDescription>This will permanently delete route &quot;{route.route_title}&quot;. This action cannot be undone.</AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDelete(route.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
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
                      <span className="text-muted-foreground">Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredRoutes.length)} of {filteredRoutes.length}</span>
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

export default TransportRoutes;
