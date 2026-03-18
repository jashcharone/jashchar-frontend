import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';
import { formatDate } from '@/utils/dateUtils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Loader2, ArrowLeft, AlertTriangle, Users, TrendingDown, RefreshCw, Calendar
} from 'lucide-react';

const AttendanceAnomalies = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();
  const branchId = selectedBranch?.id || user?.profile?.branch_id;

  const [loading, setLoading] = useState(true);
  const [hostels, setHostels] = useState([]);
  const [selectedHostel, setSelectedHostel] = useState('all');
  const [days, setDays] = useState('30');
  const [trends, setTrends] = useState([]);

  useEffect(() => {
    if (!branchId) return;
    api.get('/hostel/list').then(r => { if (r.data?.success) setHostels(r.data.data || []); });
  }, [branchId]);

  const fetchTrends = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    try {
      const params = { branchId, days: parseInt(days) };
      if (selectedHostel !== 'all') params.hostelId = selectedHostel;

      const res = await api.get('/hostel-ai/analysis/attendance-trends', { params });
      if (res.data?.success) setTrends(res.data.data || []);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load trends' });
    } finally {
      setLoading(false);
    }
  }, [branchId, selectedHostel, days]);

  useEffect(() => { fetchTrends(); }, [fetchTrends]);

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-5 w-5" /></Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2"><AlertTriangle className="h-6 w-6 text-orange-500" /> Attendance Anomalies</h1>
              <p className="text-sm text-muted-foreground">AI-detected attendance patterns & anomalies</p>
            </div>
          </div>
          <Button onClick={fetchTrends} variant="outline" size="sm"><RefreshCw className="h-4 w-4 mr-1" /> Refresh</Button>
        </div>

        <div className="flex gap-3">
          <Select value={selectedHostel} onValueChange={setSelectedHostel}>
            <SelectTrigger className="w-60"><SelectValue placeholder="Filter by hostel" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Hostels</SelectItem>
              {hostels.map(h => <SelectItem key={h.id} value={h.id}>{h.hostel_name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={days} onValueChange={setDays}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="14">Last 14 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="60">Last 60 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : trends.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="h-16 w-16 mx-auto text-green-500 mb-4" />
              <p className="text-lg font-semibold text-green-600">No Anomalies Detected</p>
              <p className="text-muted-foreground">Attendance patterns are normal across all hostels</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {trends.slice(0, 4).map((t, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">{formatDate(t.date || t.attendance_date)}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Users className="h-4 w-4" />
                      <span className="font-bold text-lg">{t.present || t.total_present || 0}</span>
                      <span className="text-sm text-muted-foreground">/ {t.total || t.total_students || 0}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      {(t.absent || t.total_absent || 0) > 5 ? (
                        <><TrendingDown className="h-3 w-3 text-red-500" /> <span className="text-xs text-red-500">{t.absent || t.total_absent || 0} absent</span></>
                      ) : (
                        <span className="text-xs text-green-500">Normal</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Full Table */}
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" /> Attendance Trends</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Total Students</TableHead>
                      <TableHead>Present</TableHead>
                      <TableHead>Absent</TableHead>
                      <TableHead>On Leave</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trends.map((t, i) => {
                      const total = t.total || t.total_students || 1;
                      const present = t.present || t.total_present || 0;
                      const rate = Math.round((present / total) * 100);
                      const isAnomaly = rate < 80;
                      return (
                        <TableRow key={i} className={isAnomaly ? 'bg-red-50 dark:bg-red-950' : ''}>
                          <TableCell>{formatDate(t.date || t.attendance_date)}</TableCell>
                          <TableCell>{total}</TableCell>
                          <TableCell className="text-green-600 font-medium">{present}</TableCell>
                          <TableCell className="text-red-600 font-medium">{t.absent || t.total_absent || 0}</TableCell>
                          <TableCell>{t.on_leave || t.total_leave || 0}</TableCell>
                          <TableCell><span className={rate < 80 ? 'text-red-600 font-bold' : 'text-green-600'}>{rate}%</span></TableCell>
                          <TableCell>
                            {isAnomaly ? (
                              <Badge variant="destructive">Anomaly</Badge>
                            ) : (
                              <Badge variant="success">Normal</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AttendanceAnomalies;
