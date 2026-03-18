import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';
import { formatDate, formatDateTime } from '@/utils/dateUtils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Loader2, ArrowLeft, Bell, AlertTriangle, Plus, Eye, CheckCircle,
  Clock, RefreshCw, Search
} from 'lucide-react';

const AlertsList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();
  const branchId = selectedBranch?.id || user?.profile?.branch_id;

  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState([]);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({ status: 'all', severity: 'all', alertType: 'all' });
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [hostels, setHostels] = useState([]);
  const [formData, setFormData] = useState({
    alert_type: 'security_breach', severity: 'medium',
    title: '', description: '', hostel_id: '', location: ''
  });

  useEffect(() => {
    if (!branchId) return;
    api.get('/hostel/list').then(r => { if (r.data?.success) setHostels(r.data.data || []); });
  }, [branchId]);

  const fetchAlerts = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    try {
      const params = { branchId, limit: 50, offset: 0 };
      if (filters.status !== 'all') params.status = filters.status;
      if (filters.severity !== 'all') params.severity = filters.severity;
      if (filters.alertType !== 'all') params.alertType = filters.alertType;

      const res = await api.get('/hostel-security/alerts', { params });
      if (res.data?.success) {
        setAlerts(res.data.data || []);
        setTotal(res.data.total || 0);
      }
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load alerts' });
    } finally {
      setLoading(false);
    }
  }, [branchId, filters]);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  const handleCreate = async () => {
    if (!formData.title || !formData.description) {
      toast({ variant: 'destructive', title: 'Error', description: 'Title and description are required' });
      return;
    }
    setCreating(true);
    try {
      const res = await api.post('/hostel-security/alerts', { ...formData, branchId });
      if (res.data?.success) {
        toast({ title: 'Success', description: 'Security alert created' });
        setShowCreate(false);
        setFormData({ alert_type: 'security_breach', severity: 'medium', title: '', description: '', hostel_id: '', location: '' });
        fetchAlerts();
      }
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to create alert' });
    } finally {
      setCreating(false);
    }
  };

  const handleAcknowledge = async (id) => {
    try {
      await api.put(`/hostel-security/alerts/${id}/acknowledge`, { branchId });
      toast({ title: 'Alert acknowledged' });
      fetchAlerts();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to acknowledge' });
    }
  };

  const handleResolve = async (id) => {
    try {
      await api.put(`/hostel-security/alerts/${id}/resolve`, { branchId, resolution_notes: 'Resolved from admin panel' });
      toast({ title: 'Alert resolved' });
      fetchAlerts();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to resolve' });
    }
  };

  const severityColor = (s) => {
    const map = { critical: 'bg-red-600 dark:bg-red-700', high: 'bg-orange-500 dark:bg-orange-600', medium: 'bg-yellow-500 dark:bg-yellow-600', low: 'bg-blue-500 dark:bg-blue-600' };
    return map[s] || 'bg-gray-500 dark:bg-gray-600';
  };

  const filteredAlerts = alerts.filter(a =>
    !search || a.title?.toLowerCase().includes(search.toLowerCase()) || a.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-5 w-5" /></Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2"><Bell className="h-6 w-6" /> Security Alerts</h1>
              <p className="text-sm text-muted-foreground">Total: {total} alerts</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchAlerts} variant="outline" size="sm"><RefreshCw className="h-4 w-4 mr-1" /> Refresh</Button>
            <Button onClick={() => setShowCreate(true)} size="sm"><Plus className="h-4 w-4 mr-1" /> New Alert</Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative w-60">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search alerts..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={filters.status} onValueChange={(v) => setFilters(p => ({ ...p, status: v }))}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="acknowledged">Acknowledged</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.severity} onValueChange={(v) => setFilters(p => ({ ...p, severity: v }))}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Severity" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severity</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.alertType} onValueChange={(v) => setFilters(p => ({ ...p, alertType: v }))}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="security_breach">Security Breach</SelectItem>
              <SelectItem value="unauthorized_entry">Unauthorized Entry</SelectItem>
              <SelectItem value="curfew_violation">Curfew Violation</SelectItem>
              <SelectItem value="fire_alarm">Fire Alarm</SelectItem>
              <SelectItem value="medical_emergency">Medical Emergency</SelectItem>
              <SelectItem value="suspicious_activity">Suspicious Activity</SelectItem>
              <SelectItem value="property_damage">Property Damage</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Alerts Table */}
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : filteredAlerts.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">No alerts found</CardContent></Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAlerts.map(a => (
                    <TableRow key={a.id}>
                      <TableCell><Badge variant="outline">{a.alert_type?.replace(/_/g, ' ')}</Badge></TableCell>
                      <TableCell><span className={`px-2 py-1 rounded text-white text-xs ${severityColor(a.severity)}`}>{a.severity}</span></TableCell>
                      <TableCell className="font-medium max-w-[200px] truncate">{a.title}</TableCell>
                      <TableCell className="text-sm">{a.location || '-'}</TableCell>
                      <TableCell><Badge variant={a.status === 'active' ? 'destructive' : a.status === 'acknowledged' ? 'warning' : 'success'}>{a.status}</Badge></TableCell>
                      <TableCell className="text-sm">{formatDateTime(a.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {a.status === 'active' && (
                            <Button size="sm" variant="outline" onClick={() => handleAcknowledge(a.id)} title="Acknowledge"><Eye className="h-3 w-3" /></Button>
                          )}
                          {a.status !== 'resolved' && (
                            <Button size="sm" variant="outline" onClick={() => handleResolve(a.id)} title="Resolve"><CheckCircle className="h-3 w-3" /></Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Create Dialog */}
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Create Security Alert</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Alert Type</Label>
                <Select value={formData.alert_type} onValueChange={(v) => setFormData(p => ({ ...p, alert_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="security_breach">Security Breach</SelectItem>
                    <SelectItem value="unauthorized_entry">Unauthorized Entry</SelectItem>
                    <SelectItem value="curfew_violation">Curfew Violation</SelectItem>
                    <SelectItem value="fire_alarm">Fire Alarm</SelectItem>
                    <SelectItem value="medical_emergency">Medical Emergency</SelectItem>
                    <SelectItem value="suspicious_activity">Suspicious Activity</SelectItem>
                    <SelectItem value="property_damage">Property Damage</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Severity</Label>
                <Select value={formData.severity} onValueChange={(v) => setFormData(p => ({ ...p, severity: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Hostel</Label>
                <Select value={formData.hostel_id} onValueChange={(v) => setFormData(p => ({ ...p, hostel_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select hostel" /></SelectTrigger>
                  <SelectContent>
                    {hostels.map(h => <SelectItem key={h.id} value={h.id}>{h.hostel_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Title *</Label><Input value={formData.title} onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))} /></div>
              <div><Label>Description *</Label><Textarea value={formData.description} onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))} rows={3} /></div>
              <div><Label>Location</Label><Input value={formData.location} onChange={(e) => setFormData(p => ({ ...p, location: e.target.value }))} placeholder="e.g., Gate 2, Block A" /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={creating}>{creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Create Alert</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default AlertsList;
