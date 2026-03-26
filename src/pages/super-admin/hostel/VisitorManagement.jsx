import React, { useState, useEffect, useCallback } from 'react';
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Users, UserPlus, UserCheck, AlertTriangle, Clock,
  Loader2, RefreshCw, LogOut, XCircle, CheckCircle
} from 'lucide-react';

const VisitorManagement = () => {
  const { user } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();
  const branchId = selectedBranch?.id || user?.profile?.branch_id;

  const [loading, setLoading] = useState(true);
  const [visitors, setVisitors] = useState([]);
  const [stats, setStats] = useState(null);
  const [hostels, setHostels] = useState([]);
  const [selectedHostel, setSelectedHostel] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [dateFrom, setDateFrom] = useState(new Date().toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);

  const fetchHostels = useCallback(async () => {
    if (!branchId) return;
    try {
      const res = await api.get('/hostel/list');
      if (res.data?.success) setHostels(res.data.data || []);
    } catch (err) { console.error('Error fetching hostels:', err); }
  }, [branchId]);

  const fetchVisitors = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    try {
      const params = { date_from: dateFrom, date_to: dateTo };
      if (selectedHostel !== 'all') params.hostel_id = selectedHostel;
      if (selectedStatus !== 'all') params.status = selectedStatus;

      const res = await api.get('/hostel-visitors/list', { params });
      if (res.data?.success) setVisitors(res.data.data || []);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally { setLoading(false); }
  }, [branchId, dateFrom, dateTo, selectedHostel, selectedStatus, toast]);

  const fetchStats = useCallback(async () => {
    if (!branchId) return;
    try {
      const res = await api.get('/hostel-visitors/stats', { params: { date_from: dateFrom, date_to: dateTo } });
      if (res.data?.success) setStats(res.data.data);
    } catch (err) { console.error('Error fetching stats:', err); }
  }, [branchId, dateFrom, dateTo]);

  useEffect(() => { fetchHostels(); }, [fetchHostels]);
  useEffect(() => { fetchVisitors(); fetchStats(); }, [fetchVisitors, fetchStats]);

  const handleCheckout = async (visitorId) => {
    try {
      await api.post(`/hostel-visitors/${visitorId}/checkout`);
      toast({ title: 'Visitor checked out' });
      fetchVisitors();
      fetchStats();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    }
  };

  const handleCancel = async (visitorId) => {
    try {
      await api.post(`/hostel-visitors/${visitorId}/cancel`);
      toast({ title: 'Visit cancelled' });
      fetchVisitors();
      fetchStats();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      in_premises: { label: 'In Premises', variant: 'default', className: 'bg-green-500 dark:bg-green-600' },
      completed: { label: 'Completed', variant: 'secondary', className: '' },
      overstay: { label: 'Overstay', variant: 'destructive', className: '' },
      cancelled: { label: 'Cancelled', variant: 'outline', className: '' }
    };
    const s = map[status] || { label: status, variant: 'outline', className: '' };
    return <Badge variant={s.variant} className={s.className}>{s.label}</Badge>;
  };

  const getApprovalBadge = (status) => {
    const map = {
      auto_approved: { label: 'Auto', className: 'bg-blue-500 dark:bg-blue-600 text-white' },
      approved: { label: 'Approved', className: 'bg-green-500 dark:bg-green-600 text-white' },
      pending: { label: 'Pending', className: 'bg-yellow-500 dark:bg-yellow-600 text-white' },
      rejected: { label: 'Rejected', className: 'bg-red-500 dark:bg-red-600 text-white' }
    };
    const s = map[status] || { label: status, className: '' };
    return <Badge className={s.className}>{s.label}</Badge>;
  };

  const getRelationLabel = (rel) => {
    const map = { father: 'Father', mother: 'Mother', guardian: 'Guardian', sibling: 'Sibling', other: 'Other' };
    return map[rel] || rel;
  };

  const getPurposeLabel = (p) => {
    const map = { meet_student: 'Meet Student', drop_items: 'Drop Items', pickup_student: 'Pickup', emergency: 'Emergency', other: 'Other' };
    return map[p] || p;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl font-bold">🚪 Visitor Management</h1>
          <Button onClick={() => { fetchVisitors(); fetchStats(); }} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card><CardContent className="pt-4 text-center">
              <Users className="w-6 h-6 mx-auto mb-1 text-blue-500" />
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total Visitors</p>
            </CardContent></Card>
            <Card><CardContent className="pt-4 text-center">
              <UserCheck className="w-6 h-6 mx-auto mb-1 text-green-500" />
              <p className="text-2xl font-bold">{stats.inPremises}</p>
              <p className="text-xs text-muted-foreground">In Premises</p>
            </CardContent></Card>
            <Card><CardContent className="pt-4 text-center">
              <CheckCircle className="w-6 h-6 mx-auto mb-1 text-gray-500 dark:text-gray-400" />
              <p className="text-2xl font-bold">{stats.completed}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </CardContent></Card>
            <Card><CardContent className="pt-4 text-center">
              <AlertTriangle className="w-6 h-6 mx-auto mb-1 text-red-500" />
              <p className="text-2xl font-bold">{stats.overstay}</p>
              <p className="text-xs text-muted-foreground">Overstay</p>
            </CardContent></Card>
            <Card><CardContent className="pt-4 text-center">
              <Clock className="w-6 h-6 mx-auto mb-1 text-yellow-500" />
              <p className="text-2xl font-bold">{stats.pending}</p>
              <p className="text-xs text-muted-foreground">Pending Approval</p>
            </CardContent></Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-3 items-end">
              <div>
                <label className="text-xs font-medium mb-1 block">From</label>
                <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-40" />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">To</label>
                <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-40" />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Hostel</label>
                <Select value={selectedHostel} onValueChange={setSelectedHostel}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Hostels</SelectItem>
                    {hostels.map(h => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Status</label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="in_premises">In Premises</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="overstay">Overstay</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Visitors Table */}
        <Card>
          <CardHeader><CardTitle>Visitor Log</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin" /></div>
            ) : visitors.length === 0 ? (
              <p className="text-center py-10 text-muted-foreground">No visitors found</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Visitor</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Relation</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Purpose</TableHead>
                      <TableHead>Entry</TableHead>
                      <TableHead>Exit</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Approval</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visitors.map(v => (
                      <TableRow key={v.id} className={v.visit_status === 'overstay' ? 'bg-red-50 dark:bg-red-950' : ''}>
                        <TableCell className="font-medium">{v.visitor_name}</TableCell>
                        <TableCell>{v.visitor_phone}</TableCell>
                        <TableCell>{getRelationLabel(v.visitor_relation)}</TableCell>
                        <TableCell>
                          {v.student ? `${v.student.first_name} ${v.student.last_name}` : '-'}
                          {v.student?.enrollment_id && <span className="text-xs text-muted-foreground ml-1">({v.student.enrollment_id})</span>}
                        </TableCell>
                        <TableCell>{getPurposeLabel(v.visit_purpose)}</TableCell>
                        <TableCell className="text-xs">{formatDateTime(v.entry_time)}</TableCell>
                        <TableCell className="text-xs">{v.actual_exit_time ? formatDateTime(v.actual_exit_time) : '-'}</TableCell>
                        <TableCell>{getStatusBadge(v.visit_status)}</TableCell>
                        <TableCell>{getApprovalBadge(v.approval_status)}</TableCell>
                        <TableCell>
                          {v.visit_status === 'in_premises' && (
                            <div className="flex gap-1">
                              <Button size="sm" variant="outline" onClick={() => handleCheckout(v.id)}>
                                <LogOut className="w-3 h-3 mr-1" /> Out
                              </Button>
                              <Button size="sm" variant="ghost" className="text-red-500" onClick={() => handleCancel(v.id)}>
                                <XCircle className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default VisitorManagement;
