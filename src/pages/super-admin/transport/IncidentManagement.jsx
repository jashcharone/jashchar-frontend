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
import { formatDate, formatDateTime } from '@/utils/dateUtils';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import {
  Loader2, Save, X, Edit, Trash2, ArrowLeft, AlertTriangle, Plus, Eye,
  Clock, CheckCircle, XCircle, Shield, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Bus, Search, Download
} from 'lucide-react';

const INCIDENT_TYPES = [
  { value: 'accident', label: 'Accident', icon: '💥' },
  { value: 'breakdown', label: 'Breakdown', icon: '🔧' },
  { value: 'delay', label: 'Delay', icon: '⏰' },
  { value: 'student_issue', label: 'Student Issue', icon: '🎓' },
  { value: 'route_deviation', label: 'Route Deviation', icon: '🗺️' },
  { value: 'medical_emergency', label: 'Medical Emergency', icon: '🏥' },
  { value: 'traffic', label: 'Traffic', icon: '🚦' },
  { value: 'weather', label: 'Weather', icon: '🌧️' },
  { value: 'other', label: 'Other', icon: '📋' }
];

const SEVERITY_LEVELS = [
  { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', icon: '🟢' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', icon: '🟡' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400', icon: '🟠' },
  { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', icon: '🔴' }
];

const STATUS_FLOW = [
  { value: 'reported', label: 'Reported', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', icon: '📝' },
  { value: 'investigating', label: 'Investigating', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', icon: '🔍' },
  { value: 'resolved', label: 'Resolved', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', icon: '✅' },
  { value: 'closed', label: 'Closed', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400', icon: '📦' }
];

const IncidentManagement = () => {
  const navigate = useNavigate();
  const { user, currentSessionId, organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();
  const branchId = selectedBranch?.id || user?.profile?.branch_id;

  const [incidents, setIncidents] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingIncident, setEditingIncident] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [activeTab, setActiveTab] = useState('open');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    vehicle_id: '', driver_id: '', trip_id: '',
    incident_type: 'delay', severity: 'low', status: 'reported',
    incident_date: new Date().toISOString().split('T')[0],
    incident_time: new Date().toTimeString().split(' ')[0].substring(0, 5),
    location: '', description: '', action_taken: '', resolution: '',
    reported_by: user?.profile?.name || '', notes: ''
  });

  const fetchData = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);

    const [incidentsRes, vehiclesRes, driversRes] = await Promise.all([
      supabase.from('transport_incidents').select(`
        *, vehicle:vehicle_id(vehicle_number, vehicle_type), driver:driver_id(driver_name, phone)
      `).eq('branch_id', branchId).order('incident_date', { ascending: false }),
      supabase.from('transport_vehicles').select('id, vehicle_number, vehicle_type').eq('branch_id', branchId),
      supabase.from('transport_drivers').select('id, driver_name, phone').eq('branch_id', branchId).eq('is_active', true)
    ]);

    setIncidents(incidentsRes.data || []);
    setVehicles(vehiclesRes.data || []);
    setDrivers(driversRes.data || []);
    setLoading(false);
  }, [branchId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Stats
  const stats = useMemo(() => {
    const open = incidents.filter(i => i.status === 'reported').length;
    const investigating = incidents.filter(i => i.status === 'investigating').length;
    const resolved = incidents.filter(i => i.status === 'resolved').length;
    const closed = incidents.filter(i => i.status === 'closed').length;
    const critical = incidents.filter(i => i.severity === 'critical' && i.status !== 'closed' && i.status !== 'resolved').length;
    return { open, investigating, resolved, closed, critical, total: incidents.length };
  }, [incidents]);

  // Filtered
  const filteredIncidents = useMemo(() => {
    let result;
    if (activeTab === 'open') result = incidents.filter(i => i.status === 'reported' || i.status === 'investigating');
    else if (activeTab === 'resolved') result = incidents.filter(i => i.status === 'resolved');
    else if (activeTab === 'closed') result = incidents.filter(i => i.status === 'closed');
    else result = [...incidents];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(i =>
        (i.incident_type || '').toLowerCase().includes(term) ||
        (i.severity || '').toLowerCase().includes(term) ||
        (i.location || '').toLowerCase().includes(term) ||
        (i.description || '').toLowerCase().includes(term) ||
        (i.vehicle?.vehicle_number || '').toLowerCase().includes(term) ||
        (i.driver?.driver_name || '').toLowerCase().includes(term)
      );
    }
    return result;
  }, [incidents, activeTab, searchTerm]);

  const totalPages = Math.ceil(filteredIncidents.length / itemsPerPage);
  const paginatedIncidents = filteredIncidents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const resetForm = () => {
    setFormData({
      vehicle_id: '', driver_id: '', trip_id: '',
      incident_type: 'delay', severity: 'low', status: 'reported',
      incident_date: new Date().toISOString().split('T')[0],
      incident_time: new Date().toTimeString().split(' ')[0].substring(0, 5),
      location: '', description: '', action_taken: '', resolution: '',
      reported_by: user?.profile?.name || '', notes: ''
    });
    setEditingIncident(null);
    setShowForm(false);
  };

  const handleEdit = (incident) => {
    setEditingIncident(incident);
    setSelectedIncident(null);
    setFormData({
      vehicle_id: incident.vehicle_id || '',
      driver_id: incident.driver_id || '',
      trip_id: incident.trip_id || '',
      incident_type: incident.incident_type || 'delay',
      severity: incident.severity || 'low',
      status: incident.status || 'reported',
      incident_date: incident.incident_date || '',
      incident_time: incident.incident_time || '',
      location: incident.location || '',
      description: incident.description || '',
      action_taken: incident.action_taken || '',
      resolution: incident.resolution || '',
      reported_by: incident.reported_by || '',
      notes: incident.notes || ''
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExportCSV = () => {
    if (filteredIncidents.length === 0) return toast({ variant: 'destructive', title: 'No data to export' });
    const headers = ['Date', 'Type', 'Severity', 'Vehicle', 'Driver', 'Location', 'Description', 'Status'];
    const rows = filteredIncidents.map(i => [
      formatDate(i.incident_date), i.incident_type || '', i.severity || '', i.vehicle?.vehicle_number || '',
      i.driver?.driver_name || '', i.location || '', i.description || '', i.status || ''
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'incidents.csv'; a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Exported!', description: `${filteredIncidents.length} incidents exported.` });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.incident_type || !formData.incident_date || !formData.description) {
      toast({ variant: 'destructive', title: 'Type, Date and Description are required' });
      return;
    }

    setIsSubmitting(true);

    const payload = {
      vehicle_id: formData.vehicle_id || null,
      driver_id: formData.driver_id || null,
      trip_id: formData.trip_id || null,
      incident_type: formData.incident_type,
      severity: formData.severity,
      status: formData.status,
      incident_date: formData.incident_date,
      incident_time: formData.incident_time || null,
      location: formData.location || null,
      description: formData.description,
      action_taken: formData.action_taken || null,
      resolution: formData.resolution || null,
      reported_by: formData.reported_by || null,
      notes: formData.notes || null,
      branch_id: branchId,
      session_id: currentSessionId,
      organization_id: organizationId
    };

    let error;
    if (editingIncident) {
      ({ error } = await supabase.from('transport_incidents').update(payload).eq('id', editingIncident.id));
    } else {
      ({ error } = await supabase.from('transport_incidents').insert(payload));
    }

    if (error) {
      toast({ variant: 'destructive', title: `Error ${editingIncident ? 'updating' : 'reporting'} incident`, description: error.message });
    } else {
      toast({ title: 'Success!', description: `Incident ${editingIncident ? 'updated' : 'reported'}.` });
      await fetchData();
      resetForm();
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from('transport_incidents').delete().eq('id', id);
    if (error) {
      toast({ variant: 'destructive', title: 'Error deleting', description: error.message });
    } else {
      toast({ title: 'Deleted', description: 'Incident removed.' });
      if (selectedIncident?.id === id) setSelectedIncident(null);
      await fetchData();
    }
  };

  const getBadge = (value, list) => {
    const item = list.find(l => l.value === value);
    if (!item) return <span className="text-xs">{value}</span>;
    return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${item.color || ''}`}>{item.icon} {item.label}</span>;
  };

  const getTypeLabel = (type) => {
    const t = INCIDENT_TYPES.find(i => i.value === type);
    return t ? `${t.icon} ${t.label}` : type;
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4 gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">⚠️ Incident Management</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="mr-1 h-4 w-4" /> Export
            </Button>
            <Button onClick={() => { resetForm(); setShowForm(true); setSelectedIncident(null); }}>
              <Plus className="mr-2 h-4 w-4" /> Report Incident
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <div className="bg-card rounded-xl shadow p-4 border-l-4 border-blue-500">
            <p className="text-xs text-muted-foreground">Open</p>
            <p className="text-2xl font-bold">{stats.open}</p>
          </div>
          <div className="bg-card rounded-xl shadow p-4 border-l-4 border-yellow-500">
            <p className="text-xs text-muted-foreground">Investigating</p>
            <p className="text-2xl font-bold">{stats.investigating}</p>
          </div>
          <div className="bg-card rounded-xl shadow p-4 border-l-4 border-green-500">
            <p className="text-xs text-muted-foreground">Resolved</p>
            <p className="text-2xl font-bold">{stats.resolved}</p>
          </div>
          <div className="bg-card rounded-xl shadow p-4 border-l-4 border-gray-400">
            <p className="text-xs text-muted-foreground">Closed</p>
            <p className="text-2xl font-bold">{stats.closed}</p>
          </div>
          <div className="bg-card rounded-xl shadow p-4 border-l-4 border-red-500">
            <p className="text-xs text-muted-foreground">🔴 Critical</p>
            <p className="text-2xl font-bold text-red-600">{stats.critical}</p>
          </div>
          <div className="bg-card rounded-xl shadow p-4 border-l-4 border-indigo-500">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left - Form or Detail */}
          {(showForm || selectedIncident) && (
            <div className="xl:col-span-1">
              {showForm ? (
                <div className="bg-card text-card-foreground rounded-xl shadow-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold">{editingIncident ? 'Edit Incident' : 'Report Incident'}</h2>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={resetForm}><X className="h-4 w-4" /></Button>
                  </div>
                  <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Type *</Label>
                        <Select value={formData.incident_type} onValueChange={(v) => setFormData({...formData, incident_type: v})}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {INCIDENT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.icon} {t.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Severity</Label>
                        <Select value={formData.severity} onValueChange={(v) => setFormData({...formData, severity: v})}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {SEVERITY_LEVELS.map(s => <SelectItem key={s.value} value={s.value}>{s.icon} {s.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Date *</Label>
                        <Input type="date" value={formData.incident_date} onChange={(e) => setFormData({...formData, incident_date: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Time</Label>
                        <Input type="time" value={formData.incident_time} onChange={(e) => setFormData({...formData, incident_time: e.target.value})} />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Vehicle</Label>
                      <Select value={formData.vehicle_id || 'none'} onValueChange={(v) => setFormData({...formData, vehicle_id: v === 'none' ? '' : v})}>
                        <SelectTrigger><SelectValue placeholder="Select Vehicle" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">-- None --</SelectItem>
                          {vehicles.map(v => <SelectItem key={v.id} value={v.id}>{v.vehicle_number}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Driver</Label>
                      <Select value={formData.driver_id || 'none'} onValueChange={(v) => setFormData({...formData, driver_id: v === 'none' ? '' : v})}>
                        <SelectTrigger><SelectValue placeholder="Select Driver" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">-- None --</SelectItem>
                          {drivers.map(d => <SelectItem key={d.id} value={d.id}>{d.driver_name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Location</Label>
                      <Input value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} placeholder="Where did it happen?" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Description *</Label>
                      <Textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={3} placeholder="What happened?" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Action Taken</Label>
                      <Textarea value={formData.action_taken} onChange={(e) => setFormData({...formData, action_taken: e.target.value})} rows={2} placeholder="What was done?" />
                    </div>
                    {editingIncident && (
                      <>
                        <div className="space-y-1">
                          <Label className="text-xs">Status</Label>
                          <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {STATUS_FLOW.map(s => <SelectItem key={s.value} value={s.value}>{s.icon} {s.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Resolution</Label>
                          <Textarea value={formData.resolution} onChange={(e) => setFormData({...formData, resolution: e.target.value})} rows={2} placeholder="How was it resolved?" />
                        </div>
                      </>
                    )}
                    <div className="space-y-1">
                      <Label className="text-xs">Reported By</Label>
                      <Input value={formData.reported_by} onChange={(e) => setFormData({...formData, reported_by: e.target.value})} placeholder="Name" />
                    </div>
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      {editingIncident ? 'Update Incident' : 'Report Incident'}
                    </Button>
                  </form>
                </div>
              ) : selectedIncident && (
                <div className="bg-card text-card-foreground rounded-xl shadow-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold">Incident Detail</h2>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelectedIncident(null)}><X className="h-4 w-4" /></Button>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getBadge(selectedIncident.severity, SEVERITY_LEVELS)}
                      {getBadge(selectedIncident.status, STATUS_FLOW)}
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Type</p>
                      <p className="font-medium">{getTypeLabel(selectedIncident.incident_type)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Date & Time</p>
                      <p className="font-medium">{formatDate(selectedIncident.incident_date)} {selectedIncident.incident_time || ''}</p>
                    </div>
                    {selectedIncident.vehicle && (
                      <div>
                        <p className="text-xs text-muted-foreground">Vehicle</p>
                        <p className="font-medium">{selectedIncident.vehicle.vehicle_number}</p>
                      </div>
                    )}
                    {selectedIncident.driver && (
                      <div>
                        <p className="text-xs text-muted-foreground">Driver</p>
                        <p className="font-medium">{selectedIncident.driver.driver_name} ({selectedIncident.driver.phone})</p>
                      </div>
                    )}
                    {selectedIncident.location && (
                      <div>
                        <p className="text-xs text-muted-foreground">Location</p>
                        <p>{selectedIncident.location}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-muted-foreground">Description</p>
                      <p className="text-sm">{selectedIncident.description}</p>
                    </div>
                    {selectedIncident.action_taken && (
                      <div>
                        <p className="text-xs text-muted-foreground">Action Taken</p>
                        <p className="text-sm">{selectedIncident.action_taken}</p>
                      </div>
                    )}
                    {selectedIncident.resolution && (
                      <div>
                        <p className="text-xs text-muted-foreground">Resolution</p>
                        <p className="text-sm text-green-600">{selectedIncident.resolution}</p>
                      </div>
                    )}
                    {selectedIncident.reported_by && (
                      <div>
                        <p className="text-xs text-muted-foreground">Reported By</p>
                        <p className="text-sm">{selectedIncident.reported_by}</p>
                      </div>
                    )}
                    <div className="pt-2 flex gap-2">
                      <Button size="sm" onClick={() => handleEdit(selectedIncident)}>
                        <Edit className="mr-1 h-3 w-3" /> Edit
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Right - Table */}
          <div className={(showForm || selectedIncident) ? 'xl:col-span-2' : 'xl:col-span-3'}>
            <div className="bg-card text-card-foreground rounded-xl shadow-lg">
              <div className="p-6">
                {/* Tabs + Search */}
                <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button variant={activeTab === 'open' ? 'default' : 'outline'} size="sm" onClick={() => { setActiveTab('open'); setCurrentPage(1); }}>
                      <AlertTriangle className="mr-1 h-3 w-3" /> Open ({stats.open + stats.investigating})
                    </Button>
                    <Button variant={activeTab === 'resolved' ? 'default' : 'outline'} size="sm" onClick={() => { setActiveTab('resolved'); setCurrentPage(1); }}>
                      <CheckCircle className="mr-1 h-3 w-3" /> Resolved ({stats.resolved})
                    </Button>
                    <Button variant={activeTab === 'closed' ? 'default' : 'outline'} size="sm" onClick={() => { setActiveTab('closed'); setCurrentPage(1); }}>
                      <Shield className="mr-1 h-3 w-3" /> Closed ({stats.closed})
                    </Button>
                    <Button variant={activeTab === 'all' ? 'default' : 'outline'} size="sm" onClick={() => { setActiveTab('all'); setCurrentPage(1); }}>
                      All ({stats.total})
                    </Button>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input className="pl-9 w-[200px] h-8" placeholder="Search incidents..." value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }} />
                  </div>
                </div>

                {loading ? (
                  <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                ) : filteredIncidents.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No incidents found.</p>
                  </div>
                ) : (
                  <>
                    <div className="border rounded-lg overflow-hidden max-h-[550px] overflow-y-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs text-foreground uppercase bg-muted/50 sticky top-0 bg-background z-10">
                          <tr>
                            <th className="px-3 py-3 w-10">#</th>
                            <th className="px-3 py-3">Date</th>
                            <th className="px-3 py-3">Type</th>
                            <th className="px-3 py-3">Severity</th>
                            <th className="px-3 py-3">Vehicle</th>
                            <th className="px-3 py-3">Driver</th>
                            <th className="px-3 py-3">Location</th>
                            <th className="px-3 py-3">Status</th>
                            <th className="px-3 py-3 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedIncidents.map((incident, idx) => (
                            <tr key={incident.id} className={`border-b border-border hover:bg-muted/50 cursor-pointer ${
                              incident.severity === 'critical' ? 'bg-red-50/50 dark:bg-red-900/5' : ''
                            }`} onClick={() => { setSelectedIncident(incident); setShowForm(false); }}>
                              <td className="px-3 py-3">{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                              <td className="px-3 py-3 font-medium">{formatDate(incident.incident_date)}</td>
                              <td className="px-3 py-3 text-xs">{getTypeLabel(incident.incident_type)}</td>
                              <td className="px-3 py-3">{getBadge(incident.severity, SEVERITY_LEVELS)}</td>
                              <td className="px-3 py-3">{incident.vehicle?.vehicle_number || '-'}</td>
                              <td className="px-3 py-3">{incident.driver?.driver_name || '-'}</td>
                              <td className="px-3 py-3 text-xs max-w-[120px] truncate">{incident.location || '-'}</td>
                              <td className="px-3 py-3">{getBadge(incident.status, STATUS_FLOW)}</td>
                              <td className="px-3 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-center gap-1">
                                  <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => { setSelectedIncident(incident); setShowForm(false); }}>
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                  <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleEdit(incident)}>
                                    <Edit className="h-3 w-3 text-yellow-600" />
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="destructive" size="icon" className="h-7 w-7"><Trash2 className="h-3 w-3" /></Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Incident?</AlertDialogTitle>
                                        <AlertDialogDescription>This will permanently delete this incident report.</AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDelete(incident.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
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
                      <span className="text-muted-foreground">Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredIncidents.length)} of {filteredIncidents.length}</span>
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

export default IncidentManagement;
