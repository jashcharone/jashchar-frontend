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
import { formatDate, getMonthShortName } from '@/utils/dateUtils';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import {
  Loader2, Save, X, Edit, Trash2, ArrowLeft, Fuel, Plus, IndianRupee, TrendingUp,
  Gauge, Calendar, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Bus, BarChart3, Search, Download
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

const FuelManagement = () => {
  const navigate = useNavigate();
  const { user, currentSessionId, organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();
  const branchId = selectedBranch?.id || user?.profile?.branch_id;

  const [logs, setLogs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingLog, setEditingLog] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState('logs');
  const [filterVehicle, setFilterVehicle] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    vehicle_id: '',
    fuel_date: new Date().toISOString().split('T')[0],
    fuel_type: 'diesel',
    quantity_liters: '',
    cost_per_liter: '',
    total_cost: '',
    odometer_reading: '',
    fuel_station: '',
    filled_by: '',
    notes: ''
  });

  const fetchData = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);

    const [logsRes, vehiclesRes] = await Promise.all([
      supabase.from('transport_fuel_logs').select(`
        *, vehicle:vehicle_id(vehicle_number, vehicle_type)
      `).eq('branch_id', branchId).order('fuel_date', { ascending: false }),
      supabase.from('transport_vehicles').select('id, vehicle_number, vehicle_type').eq('branch_id', branchId)
    ]);

    setLogs(logsRes.data || []);
    setVehicles(vehiclesRes.data || []);
    setLoading(false);
  }, [branchId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-calculate total cost
  useEffect(() => {
    const qty = parseFloat(formData.quantity_liters) || 0;
    const rate = parseFloat(formData.cost_per_liter) || 0;
    if (qty > 0 && rate > 0) {
      setFormData(prev => ({ ...prev, total_cost: (qty * rate).toFixed(2) }));
    }
  }, [formData.quantity_liters, formData.cost_per_liter]);

  // Stats
  const stats = useMemo(() => {
    const totalCost = logs.reduce((sum, l) => sum + (parseFloat(l.total_cost) || 0), 0);
    const totalLiters = logs.reduce((sum, l) => sum + (parseFloat(l.quantity_liters) || 0), 0);
    const avgCostPerLiter = totalLiters > 0 ? (totalCost / totalLiters).toFixed(2) : 0;

    // Efficiency: calculate km/l for logs with odometer readings
    const sortedByVehicle = {};
    logs.forEach(l => {
      if (!sortedByVehicle[l.vehicle_id]) sortedByVehicle[l.vehicle_id] = [];
      sortedByVehicle[l.vehicle_id].push(l);
    });

    let totalKm = 0;
    let totalLitersForEff = 0;
    Object.values(sortedByVehicle).forEach(vehicleLogs => {
      const sorted = vehicleLogs.filter(l => l.odometer_reading).sort((a, b) => new Date(a.fuel_date) - new Date(b.fuel_date));
      for (let i = 1; i < sorted.length; i++) {
        const km = (sorted[i].odometer_reading || 0) - (sorted[i - 1].odometer_reading || 0);
        if (km > 0) {
          totalKm += km;
          totalLitersForEff += parseFloat(sorted[i].quantity_liters) || 0;
        }
      }
    });
    const avgEfficiency = totalLitersForEff > 0 ? (totalKm / totalLitersForEff).toFixed(1) : '-';

    return { totalCost, totalLiters: totalLiters.toFixed(1), avgCostPerLiter, avgEfficiency, totalEntries: logs.length };
  }, [logs]);

  // Monthly chart data
  const monthlyChartData = useMemo(() => {
    const monthMap = {};
    logs.forEach(l => {
      const month = l.fuel_date?.substring(0, 7); // YYYY-MM
      if (!monthMap[month]) monthMap[month] = { month, cost: 0, liters: 0 };
      monthMap[month].cost += parseFloat(l.total_cost) || 0;
      monthMap[month].liters += parseFloat(l.quantity_liters) || 0;
    });
    return Object.values(monthMap)
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6)
      .map(d => ({
        ...d,
        month: getMonthShortName(d.month + '-01') + ' ' + new Date(d.month + '-01').getFullYear().toString().slice(-2),
        cost: Math.round(d.cost),
        liters: Math.round(d.liters)
      }));
  }, [logs]);

  // Vehicle-wise chart data
  const vehicleChartData = useMemo(() => {
    const vMap = {};
    logs.forEach(l => {
      const vNum = l.vehicle?.vehicle_number || 'Unknown';
      if (!vMap[vNum]) vMap[vNum] = { vehicle: vNum, cost: 0, liters: 0 };
      vMap[vNum].cost += parseFloat(l.total_cost) || 0;
      vMap[vNum].liters += parseFloat(l.quantity_liters) || 0;
    });
    return Object.values(vMap).sort((a, b) => b.cost - a.cost).slice(0, 10).map(d => ({ ...d, cost: Math.round(d.cost) }));
  }, [logs]);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    let result = filterVehicle === 'all' ? logs : logs.filter(l => l.vehicle_id === filterVehicle);
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(l =>
        (l.vehicle?.vehicle_number || '').toLowerCase().includes(term) ||
        (l.fuel_type || '').toLowerCase().includes(term) ||
        (l.fuel_station || '').toLowerCase().includes(term) ||
        (l.filled_by || '').toLowerCase().includes(term)
      );
    }
    return result;
  }, [logs, filterVehicle, searchTerm]);

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const resetForm = () => {
    setFormData({
      vehicle_id: '', fuel_date: new Date().toISOString().split('T')[0], fuel_type: 'diesel',
      quantity_liters: '', cost_per_liter: '', total_cost: '', odometer_reading: '',
      fuel_station: '', filled_by: '', notes: ''
    });
    setEditingLog(null);
    setShowForm(false);
  };

  const handleEdit = (log) => {
    setEditingLog(log);
    setFormData({
      vehicle_id: log.vehicle_id || '',
      fuel_date: log.fuel_date || '',
      fuel_type: log.fuel_type || 'diesel',
      quantity_liters: log.quantity_liters || '',
      cost_per_liter: log.cost_per_liter || '',
      total_cost: log.total_cost || '',
      odometer_reading: log.odometer_reading || '',
      fuel_station: log.fuel_station || '',
      filled_by: log.filled_by || '',
      notes: log.notes || ''
    });
    setShowForm(true);
    setActiveTab('logs');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExportCSV = () => {
    if (filteredLogs.length === 0) return toast({ variant: 'destructive', title: 'No data to export' });
    const headers = ['Date', 'Vehicle', 'Fuel Type', 'Liters', 'Cost/Liter', 'Total Cost', 'Odometer', 'Station', 'Filled By'];
    const rows = filteredLogs.map(l => [
      formatDate(l.fuel_date), l.vehicle?.vehicle_number || '', l.fuel_type || '', l.quantity_liters || '',
      l.cost_per_liter || '', l.total_cost || '', l.odometer_reading || '', l.fuel_station || '', l.filled_by || ''
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'fuel_logs.csv'; a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Exported!', description: `${filteredLogs.length} fuel logs exported.` });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.vehicle_id || !formData.fuel_date || !formData.quantity_liters) {
      toast({ variant: 'destructive', title: 'Vehicle, Date and Quantity are required' });
      return;
    }

    setIsSubmitting(true);

    const payload = {
      vehicle_id: formData.vehicle_id,
      fuel_date: formData.fuel_date,
      fuel_type: formData.fuel_type,
      quantity_liters: parseFloat(formData.quantity_liters),
      cost_per_liter: formData.cost_per_liter ? parseFloat(formData.cost_per_liter) : null,
      total_cost: formData.total_cost ? parseFloat(formData.total_cost) : null,
      odometer_reading: formData.odometer_reading ? parseInt(formData.odometer_reading) : null,
      fuel_station: formData.fuel_station || null,
      filled_by: formData.filled_by || null,
      notes: formData.notes || null,
      branch_id: branchId,
      session_id: currentSessionId,
      organization_id: organizationId
    };

    let error;
    if (editingLog) {
      ({ error } = await supabase.from('transport_fuel_logs').update(payload).eq('id', editingLog.id));
    } else {
      ({ error } = await supabase.from('transport_fuel_logs').insert(payload));
    }

    if (error) {
      toast({ variant: 'destructive', title: `Error ${editingLog ? 'updating' : 'adding'} fuel log`, description: error.message });
    } else {
      toast({ title: 'Success!', description: `Fuel log ${editingLog ? 'updated' : 'added'}.` });
      await fetchData();
      resetForm();
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from('transport_fuel_logs').delete().eq('id', id);
    if (error) {
      toast({ variant: 'destructive', title: 'Error deleting', description: error.message });
    } else {
      toast({ title: 'Deleted', description: 'Fuel log removed.' });
      await fetchData();
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4 gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">⛽ Fuel Management</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="mr-1 h-4 w-4" /> Export
            </Button>
            <Button onClick={() => { resetForm(); setShowForm(true); setActiveTab('logs'); }}>
              <Plus className="mr-2 h-4 w-4" /> Add Fuel Log
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-card rounded-xl shadow p-4 border-l-4 border-blue-500">
            <p className="text-xs text-muted-foreground">Total Entries</p>
            <p className="text-2xl font-bold">{stats.totalEntries}</p>
          </div>
          <div className="bg-card rounded-xl shadow p-4 border-l-4 border-green-500">
            <p className="text-xs text-muted-foreground">Total Liters</p>
            <p className="text-2xl font-bold">{stats.totalLiters}</p>
          </div>
          <div className="bg-card rounded-xl shadow p-4 border-l-4 border-emerald-500">
            <p className="text-xs text-muted-foreground">Total Cost</p>
            <p className="text-2xl font-bold flex items-center"><IndianRupee className="h-4 w-4" />{Math.round(stats.totalCost).toLocaleString('en-IN')}</p>
          </div>
          <div className="bg-card rounded-xl shadow p-4 border-l-4 border-orange-500">
            <p className="text-xs text-muted-foreground">Avg Cost/Liter</p>
            <p className="text-2xl font-bold">₹{stats.avgCostPerLiter}</p>
          </div>
          <div className="bg-card rounded-xl shadow p-4 border-l-4 border-purple-500">
            <p className="text-xs text-muted-foreground">Avg Efficiency</p>
            <p className="text-2xl font-bold">{stats.avgEfficiency} km/l</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-4">
          <Button variant={activeTab === 'logs' ? 'default' : 'outline'} size="sm" onClick={() => setActiveTab('logs')}>
            <Fuel className="mr-1 h-3 w-3" /> Fuel Logs
          </Button>
          <Button variant={activeTab === 'charts' ? 'default' : 'outline'} size="sm" onClick={() => setActiveTab('charts')}>
            <BarChart3 className="mr-1 h-3 w-3" /> Reports
          </Button>
        </div>

        {activeTab === 'charts' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Monthly Cost Chart */}
            <div className="bg-card rounded-xl shadow-lg p-6">
              <h3 className="text-sm font-semibold mb-4">📊 Monthly Fuel Cost</h3>
              {monthlyChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={monthlyChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v) => `₹${v.toLocaleString('en-IN')}`} />
                    <Bar dataKey="cost" fill="#3b82f6" name="Cost (₹)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="text-center text-muted-foreground py-8">No data available</p>}
            </div>

            {/* Vehicle-wise Cost Chart */}
            <div className="bg-card rounded-xl shadow-lg p-6">
              <h3 className="text-sm font-semibold mb-4">🚗 Vehicle-wise Fuel Cost</h3>
              {vehicleChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={vehicleChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="vehicle" tick={{ fontSize: 10 }} width={80} />
                    <Tooltip formatter={(v) => `₹${v.toLocaleString('en-IN')}`} />
                    <Bar dataKey="cost" fill="#10b981" name="Cost (₹)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="text-center text-muted-foreground py-8">No data available</p>}
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Left - Form */}
            {showForm && (
              <div className="xl:col-span-1">
                <div className="bg-card text-card-foreground rounded-xl shadow-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold">{editingLog ? 'Edit Fuel Log' : 'Add Fuel Log'}</h2>
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
                        <Label className="text-xs">Date *</Label>
                        <Input type="date" value={formData.fuel_date} onChange={(e) => setFormData({...formData, fuel_date: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Fuel Type</Label>
                        <Select value={formData.fuel_type} onValueChange={(v) => setFormData({...formData, fuel_type: v})}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="diesel">Diesel</SelectItem>
                            <SelectItem value="petrol">Petrol</SelectItem>
                            <SelectItem value="cng">CNG</SelectItem>
                            <SelectItem value="electric">Electric</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Liters *</Label>
                        <Input type="number" step="0.01" value={formData.quantity_liters} onChange={(e) => setFormData({...formData, quantity_liters: e.target.value})} placeholder="0.00" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">₹/Liter</Label>
                        <Input type="number" step="0.01" value={formData.cost_per_liter} onChange={(e) => setFormData({...formData, cost_per_liter: e.target.value})} placeholder="0.00" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Total ₹</Label>
                        <Input type="number" step="0.01" value={formData.total_cost} onChange={(e) => setFormData({...formData, total_cost: e.target.value})} placeholder="Auto" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Odometer (km)</Label>
                      <Input type="number" value={formData.odometer_reading} onChange={(e) => setFormData({...formData, odometer_reading: e.target.value})} placeholder="Current km reading" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Fuel Station</Label>
                        <Input value={formData.fuel_station} onChange={(e) => setFormData({...formData, fuel_station: e.target.value})} placeholder="Station name" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Filled By</Label>
                        <Input value={formData.filled_by} onChange={(e) => setFormData({...formData, filled_by: e.target.value})} placeholder="Driver/staff name" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Notes</Label>
                      <Textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} rows={2} placeholder="Additional notes..." />
                    </div>
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      {editingLog ? 'Update Log' : 'Add Fuel Log'}
                    </Button>
                  </form>
                </div>
              </div>
            )}

            {/* Right - Table */}
            <div className={showForm ? 'xl:col-span-2' : 'xl:col-span-3'}>
              <div className="bg-card text-card-foreground rounded-xl shadow-lg">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
                    <h3 className="font-semibold">Fuel Logs</h3>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input className="pl-9 w-[200px] h-8" placeholder="Search logs..." value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }} />
                      </div>
                      <Select value={filterVehicle} onValueChange={(v) => { setFilterVehicle(v); setCurrentPage(1); }}>
                        <SelectTrigger className="w-[180px] h-8"><SelectValue placeholder="All Vehicles" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Vehicles</SelectItem>
                          {vehicles.map(v => <SelectItem key={v.id} value={v.id}>{v.vehicle_number}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {loading ? (
                    <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                  ) : filteredLogs.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">
                      <Fuel className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No fuel logs found. Add one to get started.</p>
                    </div>
                  ) : (
                    <>
                      <div className="border rounded-lg overflow-hidden max-h-[550px] overflow-y-auto">
                        <table className="w-full text-sm text-left">
                          <thead className="text-xs text-foreground uppercase bg-muted/50 sticky top-0 bg-background z-10">
                            <tr>
                              <th className="px-3 py-3 w-10">#</th>
                              <th className="px-3 py-3">Date</th>
                              <th className="px-3 py-3">Vehicle</th>
                              <th className="px-3 py-3">Type</th>
                              <th className="px-3 py-3">Liters</th>
                              <th className="px-3 py-3">₹/L</th>
                              <th className="px-3 py-3">Total ₹</th>
                              <th className="px-3 py-3">Odometer</th>
                              <th className="px-3 py-3">Station</th>
                              <th className="px-3 py-3 text-center">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {paginatedLogs.map((log, idx) => (
                              <tr key={log.id} className="border-b border-border hover:bg-muted/50">
                                <td className="px-3 py-3">{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                                <td className="px-3 py-3 font-medium">{formatDate(log.fuel_date)}</td>
                                <td className="px-3 py-3">{log.vehicle?.vehicle_number || '-'}</td>
                                <td className="px-3 py-3">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                    log.fuel_type === 'diesel' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                                    log.fuel_type === 'petrol' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                                    log.fuel_type === 'cng' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                                  }`}>{log.fuel_type}</span>
                                </td>
                                <td className="px-3 py-3">{log.quantity_liters || '-'}</td>
                                <td className="px-3 py-3">₹{log.cost_per_liter || '-'}</td>
                                <td className="px-3 py-3 font-medium">₹{parseFloat(log.total_cost || 0).toLocaleString('en-IN')}</td>
                                <td className="px-3 py-3 text-xs">{log.odometer_reading ? `${log.odometer_reading.toLocaleString()} km` : '-'}</td>
                                <td className="px-3 py-3 text-xs">{log.fuel_station || '-'}</td>
                                <td className="px-3 py-3 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleEdit(log)}>
                                      <Edit className="h-3 w-3 text-yellow-600" />
                                    </Button>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="icon" className="h-7 w-7"><Trash2 className="h-3 w-3" /></Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Delete Fuel Log?</AlertDialogTitle>
                                          <AlertDialogDescription>This will permanently delete this fuel log entry.</AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction onClick={() => handleDelete(log.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
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
                        <span className="text-muted-foreground">Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredLogs.length)} of {filteredLogs.length}</span>
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
        )}
      </div>
    </DashboardLayout>
  );
};

export default FuelManagement;
