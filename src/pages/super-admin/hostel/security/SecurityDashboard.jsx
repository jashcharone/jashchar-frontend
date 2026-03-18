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
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Loader2, ArrowLeft, ShieldAlert, AlertTriangle, Shield, Bell,
  RefreshCw, Eye, CheckCircle, Clock
} from 'lucide-react';

const SecurityDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();
  const branchId = selectedBranch?.id || user?.profile?.branch_id;

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [activeSOSAlerts, setActiveSOSAlerts] = useState([]);

  const fetchDashboardData = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    try {
      const [statsRes, alertsRes, sosRes] = await Promise.all([
        api.get('/hostel-security/alerts/stats', { params: { branchId } }),
        api.get('/hostel-security/alerts', { params: { branchId, limit: 5 } }),
        api.get('/hostel-security/sos/active', { params: { branchId } })
      ]);
      if (statsRes.data?.success) setStats(statsRes.data.data || {});
      if (alertsRes.data?.success) setRecentAlerts(alertsRes.data.data || []);
      if (sosRes.data?.success) setActiveSOSAlerts(sosRes.data.data || []);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load security data' });
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  const severityColor = (s) => {
    const map = { critical: 'bg-red-600 dark:bg-red-700', high: 'bg-orange-500 dark:bg-orange-600', medium: 'bg-yellow-500 dark:bg-yellow-600', low: 'bg-blue-500 dark:bg-blue-600' };
    return map[s] || 'bg-gray-500 dark:bg-gray-600';
  };

  const statusBadge = (s) => {
    const map = { active: 'destructive', acknowledged: 'warning', resolved: 'success' };
    return <Badge variant={map[s] || 'secondary'}>{s}</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-5 w-5" /></Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2"><ShieldAlert className="h-6 w-6 text-red-600 dark:text-red-400" /> Security Dashboard</h1>
              <p className="text-sm text-muted-foreground">Real-time security monitoring & alerts</p>
            </div>
          </div>
          <Button onClick={fetchDashboardData} variant="outline" size="sm"><RefreshCw className="h-4 w-4 mr-2" /> Refresh</Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : (
          <>
            {/* Active SOS Banner */}
            {activeSOSAlerts.length > 0 && (
              <Card className="border-red-500 bg-red-50 dark:bg-red-950">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold text-lg mb-2">
                    <AlertTriangle className="h-6 w-6 animate-pulse" /> {activeSOSAlerts.length} ACTIVE SOS ALERT(S)!
                  </div>
                  {activeSOSAlerts.map(sos => (
                    <div key={sos.id} className="flex items-center justify-between bg-white dark:bg-gray-900 p-3 rounded mb-2">
                      <div>
                        <p className="font-semibold">{sos.student_profiles?.full_name || 'Unknown'}</p>
                        <p className="text-sm text-muted-foreground">{sos.sos_type} - {sos.location || 'Unknown location'}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="destructive" onClick={() => navigate(`/super-admin/hostel/sos-alerts`)}>Respond</Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card><CardContent className="p-4 text-center">
                <AlertTriangle className="h-8 w-8 mx-auto text-red-500 mb-2" />
                <p className="text-2xl font-bold">{stats.active || 0}</p>
                <p className="text-sm text-muted-foreground">Active Alerts</p>
              </CardContent></Card>
              <Card><CardContent className="p-4 text-center">
                <Clock className="h-8 w-8 mx-auto text-yellow-500 mb-2" />
                <p className="text-2xl font-bold">{stats.acknowledged || 0}</p>
                <p className="text-sm text-muted-foreground">Acknowledged</p>
              </CardContent></Card>
              <Card><CardContent className="p-4 text-center">
                <CheckCircle className="h-8 w-8 mx-auto text-green-500 mb-2" />
                <p className="text-2xl font-bold">{stats.resolved || 0}</p>
                <p className="text-sm text-muted-foreground">Resolved</p>
              </CardContent></Card>
              <Card><CardContent className="p-4 text-center">
                <Shield className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                <p className="text-2xl font-bold">{stats.total || 0}</p>
                <p className="text-sm text-muted-foreground">Total Alerts</p>
              </CardContent></Card>
            </div>

            {/* Quick Nav */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" className="h-20 flex flex-col gap-1" onClick={() => navigate('/super-admin/hostel/alerts-list')}>
                <Bell className="h-5 w-5" /><span>All Alerts</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col gap-1 border-red-300 dark:border-red-700" onClick={() => navigate('/super-admin/hostel/sos-alerts')}>
                <AlertTriangle className="h-5 w-5 text-red-500" /><span>SOS Alerts</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col gap-1" onClick={() => navigate('/super-admin/hostel/curfew-monitor')}>
                <Clock className="h-5 w-5" /><span>Curfew Monitor</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col gap-1 border-pink-300 dark:border-pink-700" onClick={() => navigate('/super-admin/hostel/girls-hostel-safety')}>
                <Shield className="h-5 w-5 text-pink-500" /><span>Girls Safety</span>
              </Button>
            </div>

            {/* Recent Alerts Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" /> Recent Security Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                {recentAlerts.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No security alerts found</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentAlerts.map(a => (
                        <TableRow key={a.id}>
                          <TableCell><Badge variant="outline">{a.alert_type}</Badge></TableCell>
                          <TableCell><span className={`px-2 py-1 rounded text-white text-xs ${severityColor(a.severity)}`}>{a.severity}</span></TableCell>
                          <TableCell className="font-medium">{a.title}</TableCell>
                          <TableCell>{statusBadge(a.status)}</TableCell>
                          <TableCell className="text-sm">{formatDateTime(a.created_at)}</TableCell>
                          <TableCell>
                            <Button size="sm" variant="ghost" onClick={() => navigate(`/super-admin/hostel/alerts-list`)}><Eye className="h-4 w-4" /></Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default SecurityDashboard;
