import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';
import { formatDateTime } from '@/utils/dateUtils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  Loader2, ArrowLeft, AlertTriangle, Phone, Shield, RefreshCw, Plus, MapPin
} from 'lucide-react';

const SOSAlerts = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();
  const branchId = selectedBranch?.id || user?.profile?.branch_id;

  const [loading, setLoading] = useState(true);
  const [sosAlerts, setSOSAlerts] = useState([]);
  const [filter, setFilter] = useState('all');
  const [showTrigger, setShowTrigger] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [respondDialog, setRespondDialog] = useState({ open: false, sosId: null });
  const [responseNotes, setResponseNotes] = useState('');
  const [students, setStudents] = useState([]);
  const [hostels, setHostels] = useState([]);
  const [triggerForm, setTriggerForm] = useState({
    student_id: '', hostel_id: '', sos_type: 'emergency', location: '', description: ''
  });

  useEffect(() => {
    if (!branchId) return;
    Promise.all([
      api.get('/hostel/list'),
      api.get('/students', { params: { branchId, limit: 500 } })
    ]).then(([h, s]) => {
      if (h.data?.success) setHostels(h.data.data || []);
      if (s.data?.data) setStudents(s.data.data || []);
    });
  }, [branchId]);

  const fetchSOS = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    try {
      const params = { branchId };
      if (filter !== 'all') params.status = filter;

      const res = await api.get('/hostel-security/sos', { params });
      if (res.data?.success) setSOSAlerts(res.data.data || []);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load SOS alerts' });
    } finally {
      setLoading(false);
    }
  }, [branchId, filter]);

  useEffect(() => { fetchSOS(); }, [fetchSOS]);

  const handleTrigger = async () => {
    if (!triggerForm.student_id || !triggerForm.description) {
      toast({ variant: 'destructive', title: 'Error', description: 'Student and description required' });
      return;
    }
    setTriggering(true);
    try {
      const res = await api.post('/hostel-security/sos', { ...triggerForm, branchId });
      if (res.data?.success) {
        toast({ title: 'SOS Triggered', description: 'Emergency responders notified!' });
        setShowTrigger(false);
        setTriggerForm({ student_id: '', hostel_id: '', sos_type: 'emergency', location: '', description: '' });
        fetchSOS();
      }
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to trigger SOS' });
    } finally {
      setTriggering(false);
    }
  };

  const handleRespond = async () => {
    try {
      await api.put(`/hostel-security/sos/${respondDialog.sosId}/respond`, { branchId, response_notes: responseNotes });
      toast({ title: 'Responded to SOS' });
      setRespondDialog({ open: false, sosId: null });
      setResponseNotes('');
      fetchSOS();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to respond' });
    }
  };

  const handleResolve = async (id) => {
    try {
      await api.put(`/hostel-security/sos/${id}/resolve`, { branchId, resolution_notes: 'Resolved by admin' });
      toast({ title: 'SOS Resolved' });
      fetchSOS();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to resolve' });
    }
  };

  const statusColor = (s) => {
    const map = { triggered: 'destructive', responding: 'warning', resolved: 'success' };
    return map[s] || 'secondary';
  };

  const activeCount = sosAlerts.filter(s => s.status !== 'resolved').length;

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-5 w-5" /></Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" /> SOS Alerts
                {activeCount > 0 && <Badge variant="destructive" className="ml-2 animate-pulse">{activeCount} Active</Badge>}
              </h1>
              <p className="text-sm text-muted-foreground">Emergency SOS alert management</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchSOS} variant="outline" size="sm"><RefreshCw className="h-4 w-4 mr-1" /> Refresh</Button>
            <Button onClick={() => setShowTrigger(true)} variant="destructive" size="sm"><Plus className="h-4 w-4 mr-1" /> Trigger SOS</Button>
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-2">
          {['all', 'triggered', 'responding', 'resolved'].map(f => (
            <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Button>
          ))}
        </div>

        {/* SOS Cards */}
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : sosAlerts.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">No SOS alerts found</CardContent></Card>
        ) : (
          <div className="space-y-3">
            {sosAlerts.map(sos => (
              <Card key={sos.id} className={sos.status === 'triggered' ? 'border-red-500 bg-red-50 dark:bg-red-950' : sos.status === 'responding' ? 'border-yellow-500' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={statusColor(sos.status)}>{sos.status}</Badge>
                        <Badge variant="outline">{sos.sos_type}</Badge>
                        {sos.status === 'triggered' && <AlertTriangle className="h-4 w-4 text-red-500 animate-pulse" />}
                      </div>
                      <p className="font-semibold">{sos.student_profiles?.full_name || 'Unknown Student'}</p>
                      <p className="text-sm text-muted-foreground mt-1">{sos.description}</p>
                      {sos.location && (
                        <p className="text-sm flex items-center gap-1 mt-1"><MapPin className="h-3 w-3" /> {sos.location}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">{formatDateTime(sos.triggered_at)}</p>
                      {sos.response_notes && <p className="text-sm mt-1 text-blue-600 dark:text-blue-400">Response: {sos.response_notes}</p>}
                    </div>
                    <div className="flex flex-col gap-2">
                      {sos.status === 'triggered' && (
                        <Button size="sm" variant="destructive" onClick={() => setRespondDialog({ open: true, sosId: sos.id })}>
                          <Phone className="h-3 w-3 mr-1" /> Respond
                        </Button>
                      )}
                      {sos.status !== 'resolved' && (
                        <Button size="sm" variant="outline" onClick={() => handleResolve(sos.id)}>
                          <Shield className="h-3 w-3 mr-1" /> Resolve
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Trigger SOS Dialog */}
        <Dialog open={showTrigger} onOpenChange={setShowTrigger}>
          <DialogContent>
            <DialogHeader><DialogTitle className="text-red-600 dark:text-red-400">🆘 Trigger SOS Alert</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Student *</Label>
                <Select value={triggerForm.student_id} onValueChange={(v) => setTriggerForm(p => ({ ...p, student_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                  <SelectContent>{students.map(s => <SelectItem key={s.id} value={s.id}>{s.full_name} ({s.enrollment_id})</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Hostel</Label>
                <Select value={triggerForm.hostel_id} onValueChange={(v) => setTriggerForm(p => ({ ...p, hostel_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select hostel" /></SelectTrigger>
                  <SelectContent>{hostels.map(h => <SelectItem key={h.id} value={h.id}>{h.hostel_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>SOS Type</Label>
                <Select value={triggerForm.sos_type} onValueChange={(v) => setTriggerForm(p => ({ ...p, sos_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="emergency">Emergency</SelectItem>
                    <SelectItem value="medical">Medical</SelectItem>
                    <SelectItem value="fire">Fire</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="harassment">Harassment</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Location</Label><Input value={triggerForm.location} onChange={(e) => setTriggerForm(p => ({ ...p, location: e.target.value }))} /></div>
              <div><Label>Description *</Label><Textarea value={triggerForm.description} onChange={(e) => setTriggerForm(p => ({ ...p, description: e.target.value }))} rows={3} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowTrigger(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleTrigger} disabled={triggering}>{triggering && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Trigger SOS</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Respond Dialog */}
        <Dialog open={respondDialog.open} onOpenChange={(o) => setRespondDialog({ open: o, sosId: respondDialog.sosId })}>
          <DialogContent>
            <DialogHeader><DialogTitle>Respond to SOS</DialogTitle></DialogHeader>
            <div><Label>Response Notes</Label><Textarea value={responseNotes} onChange={(e) => setResponseNotes(e.target.value)} rows={3} placeholder="Describe response actions taken..." /></div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRespondDialog({ open: false, sosId: null })}>Cancel</Button>
              <Button onClick={handleRespond}>Submit Response</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default SOSAlerts;
