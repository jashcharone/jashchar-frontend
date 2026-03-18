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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Loader2, ArrowLeft, Clock, ShieldAlert, Users, AlertTriangle, RefreshCw, Eye
} from 'lucide-react';

const CurfewMonitor = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();
  const branchId = selectedBranch?.id || user?.profile?.branch_id;

  const [loading, setLoading] = useState(true);
  const [hostels, setHostels] = useState([]);
  const [selectedHostel, setSelectedHostel] = useState('all');
  const [curfewAlerts, setCurfewAlerts] = useState([]);

  useEffect(() => {
    if (!branchId) return;
    api.get('/hostel/list').then(r => { if (r.data?.success) setHostels(r.data.data || []); });
  }, [branchId]);

  const fetchCurfewData = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    try {
      const params = { branchId, alertType: 'curfew_violation', limit: 100 };
      if (selectedHostel !== 'all') params.hostelId = selectedHostel;

      const res = await api.get('/hostel-security/alerts', { params });
      if (res.data?.success) setCurfewAlerts(res.data.data || []);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load curfew data' });
    } finally {
      setLoading(false);
    }
  }, [branchId, selectedHostel]);

  useEffect(() => { fetchCurfewData(); }, [fetchCurfewData]);

  const activeViolations = curfewAlerts.filter(a => a.status === 'active');
  const acknowledgedViolations = curfewAlerts.filter(a => a.status === 'acknowledged');

  const handleAcknowledge = async (id) => {
    try {
      await api.put(`/hostel-security/alerts/${id}/acknowledge`, { branchId });
      toast({ title: 'Violation acknowledged' });
      fetchCurfewData();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed' });
    }
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-5 w-5" /></Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2"><Clock className="h-6 w-6 text-purple-600 dark:text-purple-400" /> Curfew Monitor</h1>
              <p className="text-sm text-muted-foreground">Real-time curfew compliance monitoring</p>
            </div>
          </div>
          <Button onClick={fetchCurfewData} variant="outline" size="sm"><RefreshCw className="h-4 w-4 mr-1" /> Refresh</Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className={activeViolations.length > 0 ? 'border-red-500' : ''}>
            <CardContent className="p-4 text-center">
              <AlertTriangle className="h-8 w-8 mx-auto text-red-500 mb-2" />
              <p className="text-3xl font-bold text-red-600 dark:text-red-400">{activeViolations.length}</p>
              <p className="text-sm text-muted-foreground">Active Violations</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Eye className="h-8 w-8 mx-auto text-yellow-500 mb-2" />
              <p className="text-3xl font-bold">{acknowledgedViolations.length}</p>
              <p className="text-sm text-muted-foreground">Acknowledged</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="h-8 w-8 mx-auto text-blue-500 mb-2" />
              <p className="text-3xl font-bold">{curfewAlerts.length}</p>
              <p className="text-sm text-muted-foreground">Total Violations</p>
            </CardContent>
          </Card>
        </div>

        {/* Filter by Hostel */}
        <Select value={selectedHostel} onValueChange={setSelectedHostel}>
          <SelectTrigger className="w-60"><SelectValue placeholder="Filter by hostel" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Hostels</SelectItem>
            {hostels.map(h => <SelectItem key={h.id} value={h.id}>{h.hostel_name}</SelectItem>)}
          </SelectContent>
        </Select>

        {/* Violations Table */}
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : curfewAlerts.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <ShieldAlert className="h-16 w-16 mx-auto text-green-500 mb-4" />
              <p className="text-lg font-semibold text-green-600 dark:text-green-400">No Curfew Violations!</p>
              <p className="text-muted-foreground">All students are compliant with curfew timings</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader><CardTitle>Curfew Violations</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Severity</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Hostel</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {curfewAlerts.map(v => (
                    <TableRow key={v.id} className={v.status === 'active' ? 'bg-red-50 dark:bg-red-950' : ''}>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-white text-xs ${v.severity === 'critical' ? 'bg-red-600 dark:bg-red-700' : v.severity === 'high' ? 'bg-orange-500 dark:bg-orange-600' : 'bg-yellow-500 dark:bg-yellow-600'}`}>
                          {v.severity}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">{v.title}</TableCell>
                      <TableCell>{v.hostels?.hostel_name || '-'}</TableCell>
                      <TableCell>{v.location || '-'}</TableCell>
                      <TableCell><Badge variant={v.status === 'active' ? 'destructive' : v.status === 'acknowledged' ? 'warning' : 'success'}>{v.status}</Badge></TableCell>
                      <TableCell className="text-sm">{formatDateTime(v.created_at)}</TableCell>
                      <TableCell>
                        {v.status === 'active' && (
                          <Button size="sm" variant="outline" onClick={() => handleAcknowledge(v.id)}>Acknowledge</Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CurfewMonitor;
