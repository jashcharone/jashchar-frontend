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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Loader2, ArrowLeft, ShieldAlert, Clock, AlertTriangle, Phone, RefreshCw
} from 'lucide-react';

const CurfewViolations = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();

  const branchId = selectedBranch?.id || user?.profile?.branch_id;

  const [loading, setLoading] = useState(true);
  const [hostels, setHostels] = useState([]);
  const [selectedHostel, setSelectedHostel] = useState('all');
  const [violations, setViolations] = useState([]);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Fetch hostels
  useEffect(() => {
    const load = async () => {
      if (!branchId) return;
      try {
        const res = await api.get('/hostel/list');
        if (res.data?.success) setHostels(res.data.data || []);
      } catch (err) {
        console.error('Error:', err);
      }
    };
    load();
  }, [branchId]);

  // Fetch violations
  const fetchViolations = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    try {
      const params = { startDate, endDate };
      if (selectedHostel !== 'all') params.hostelId = selectedHostel;

      const res = await api.get('/hostel-attendance/violations', { params });
      if (res.data?.success) setViolations(res.data.data || []);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally {
      setLoading(false);
    }
  }, [branchId, startDate, endDate, selectedHostel, toast]);

  useEffect(() => { fetchViolations(); }, [fetchViolations]);

  const absentCount = violations.filter(v => v.status === 'absent').length;
  const lateCount = violations.filter(v => v.status === 'late').length;

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">🚨 Curfew Violations</h1>
            <p className="text-sm text-muted-foreground mt-1">Track students who violated curfew or missed night roll call</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <Button variant="outline" size="sm" onClick={fetchViolations}>
              <RefreshCw className="w-4 h-4 mr-1" /> Refresh
            </Button>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <ShieldAlert className="w-6 h-6 mx-auto text-red-500 mb-1" />
              <p className="text-2xl font-bold text-red-600">{violations.length}</p>
              <p className="text-xs text-muted-foreground">Total Violations</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <AlertTriangle className="w-6 h-6 mx-auto text-orange-500 mb-1" />
              <p className="text-2xl font-bold text-orange-600">{absentCount}</p>
              <p className="text-xs text-muted-foreground">Absent (Missing)</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="w-6 h-6 mx-auto text-yellow-500 mb-1" />
              <p className="text-2xl font-bold text-yellow-600">{lateCount}</p>
              <p className="text-xs text-muted-foreground">Late Returns</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Hostel</label>
                <Select value={selectedHostel} onValueChange={setSelectedHostel}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Hostels</SelectItem>
                    {hostels.map(h => (
                      <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">From</label>
                <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">To</label>
                <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
              </div>
              <div className="flex items-end">
                <Button className="w-full" onClick={fetchViolations} disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <ShieldAlert className="w-4 h-4 mr-1" />}
                  Search
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Violations Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Violations ({formatDate(startDate)} — {formatDate(endDate)})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            ) : violations.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ShieldAlert className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-lg font-medium">No violations found</p>
                <p className="text-sm">Great! All students followed the curfew rules.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Enroll ID</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Hostel</TableHead>
                      <TableHead>Room</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {violations.map((v, idx) => (
                      <TableRow key={v.id} className={v.status === 'absent' ? 'bg-red-50' : 'bg-yellow-50'}>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell className="text-sm">{formatDate(v.attendance_date)}</TableCell>
                        <TableCell className="font-medium">
                          {v.student?.full_name || v.student?.first_name || '-'}
                        </TableCell>
                        <TableCell>{v.student?.enrollment_id || '-'}</TableCell>
                        <TableCell>
                          {v.student?.class?.name || '-'}
                          {v.student?.section?.name ? ` - ${v.student.section.name}` : ''}
                        </TableCell>
                        <TableCell>{v.hostel?.name || '-'}</TableCell>
                        <TableCell>{v.room?.room_number_name || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {v.attendance_type?.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={v.status === 'absent' ? 'bg-red-500' : 'bg-yellow-500'}>
                            {v.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {(v.student?.phone || v.student?.father_phone) && (
                            <a
                              href={`tel:${v.student?.father_phone || v.student?.phone}`}
                              className="inline-flex items-center gap-1 text-blue-600 hover:underline text-xs"
                            >
                              <Phone className="w-3 h-3" />
                              {v.student?.father_phone || v.student?.phone}
                            </a>
                          )}
                        </TableCell>
                        <TableCell className="text-xs max-w-[120px] truncate">{v.remarks || v.late_reason || '-'}</TableCell>
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

export default CurfewViolations;
