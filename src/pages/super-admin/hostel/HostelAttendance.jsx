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
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Calendar, Users, UserX, Clock, CheckCircle, XCircle, AlertTriangle,
  Loader2, RefreshCw, Search
} from 'lucide-react';

const HostelAttendance = () => {
  const navigate = useNavigate();
  const { user, currentSessionId } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();

  const branchId = selectedBranch?.id || user?.profile?.branch_id;

  const [loading, setLoading] = useState(true);
  const [hostels, setHostels] = useState([]);
  const [selectedHostel, setSelectedHostel] = useState('all');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedType, setSelectedType] = useState('morning');
  const [attendanceData, setAttendanceData] = useState([]);
  const [summary, setSummary] = useState({ total: 0, present: 0, absent: 0, late: 0, onLeave: 0 });

  // Fetch hostels list
  const fetchHostels = useCallback(async () => {
    if (!branchId) return;
    try {
      const res = await api.get('/hostel/list');
      if (res.data?.success) setHostels(res.data.data || []);
    } catch (err) {
      console.error('Error fetching hostels:', err);
    }
  }, [branchId]);

  // Fetch attendance data
  const fetchAttendance = useCallback(async () => {
    if (!branchId || !selectedDate) return;
    setLoading(true);
    try {
      const params = { date: selectedDate, attendanceType: selectedType };
      if (selectedHostel !== 'all') params.hostelId = selectedHostel;

      const res = await api.get('/hostel-attendance/by-date', { params });
      if (res.data?.success) {
        const records = res.data.data || [];
        setAttendanceData(records);

        // Calculate summary
        const s = { total: records.length, present: 0, absent: 0, late: 0, onLeave: 0 };
        records.forEach(r => {
          if (r.status === 'present') s.present++;
          else if (r.status === 'absent') s.absent++;
          else if (r.status === 'late') s.late++;
          else if (r.status === 'on_leave' || r.status === 'medical_leave') s.onLeave++;
        });
        setSummary(s);
      }
    } catch (err) {
      console.error('Error fetching attendance:', err);
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally {
      setLoading(false);
    }
  }, [branchId, selectedDate, selectedType, selectedHostel, toast]);

  useEffect(() => { fetchHostels(); }, [fetchHostels]);
  useEffect(() => { fetchAttendance(); }, [fetchAttendance]);

  const statusBadge = (status) => {
    const map = {
      present: { color: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400', icon: <CheckCircle className="w-3 h-3" /> },
      absent: { color: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400', icon: <XCircle className="w-3 h-3" /> },
      late: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-400', icon: <Clock className="w-3 h-3" /> },
      on_leave: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400', icon: <Calendar className="w-3 h-3" /> },
      medical_leave: { color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-400', icon: <AlertTriangle className="w-3 h-3" /> }
    };
    const s = map[status] || map.absent;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${s.color}`}>
        {s.icon} {status?.replace('_', ' ')}
      </span>
    );
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">🏨 Hostel Attendance</h1>
            <p className="text-sm text-muted-foreground mt-1">View and manage hostel attendance records</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchAttendance}>
              <RefreshCw className="w-4 h-4 mr-1" /> Refresh
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
          <Card>
            <CardContent className="p-3 sm:p-4 text-center">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 mx-auto text-blue-500 mb-1" />
              <p className="text-lg sm:text-2xl font-bold">{summary.total}</p>
              <p className="text-xs text-muted-foreground">Total Records</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4 text-center">
              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 mx-auto text-green-500 mb-1" />
              <p className="text-lg sm:text-2xl font-bold text-green-600">{summary.present}</p>
              <p className="text-xs text-muted-foreground">Present</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4 text-center">
              <XCircle className="w-5 h-5 sm:w-6 sm:h-6 mx-auto text-red-500 mb-1" />
              <p className="text-lg sm:text-2xl font-bold text-red-600">{summary.absent}</p>
              <p className="text-xs text-muted-foreground">Absent</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4 text-center">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 mx-auto text-yellow-500 mb-1" />
              <p className="text-lg sm:text-2xl font-bold text-yellow-600">{summary.late}</p>
              <p className="text-xs text-muted-foreground">Late</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4 text-center">
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6 mx-auto text-purple-500 mb-1" />
              <p className="text-lg sm:text-2xl font-bold text-purple-600">{summary.onLeave}</p>
              <p className="text-xs text-muted-foreground">On Leave</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Date</label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Hostel</label>
                <Select value={selectedHostel} onValueChange={setSelectedHostel}>
                  <SelectTrigger><SelectValue placeholder="All Hostels" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Hostels</SelectItem>
                    {hostels.map(h => (
                      <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Type</label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">🌅 Morning</SelectItem>
                    <SelectItem value="evening">🌇 Evening</SelectItem>
                    <SelectItem value="night_rollcall">🌙 Night Roll Call</SelectItem>
                    <SelectItem value="curfew_check">🔒 Curfew Check</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button className="w-full" onClick={fetchAttendance}>
                  <Search className="w-4 h-4 mr-1" /> Search
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Attendance Records — {formatDate(selectedDate)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            ) : attendanceData.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <UserX className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-lg font-medium">No attendance records found</p>
                <p className="text-sm">No records for {formatDate(selectedDate)}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead className="hidden sm:table-cell">Admission No</TableHead>
                      <TableHead className="hidden md:table-cell">Class</TableHead>
                      <TableHead className="hidden lg:table-cell">Hostel</TableHead>
                      <TableHead className="hidden lg:table-cell">Room</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden md:table-cell">Marked By</TableHead>
                      <TableHead className="hidden sm:table-cell">Time</TableHead>
                      <TableHead className="hidden lg:table-cell">Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendanceData.map((record, idx) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">{idx + 1}</TableCell>
                        <TableCell className="text-sm">{record.student?.full_name || record.student?.first_name || '-'}</TableCell>
                        <TableCell className="hidden sm:table-cell">{record.student?.admission_number || '-'}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          {record.student?.class?.name || '-'}
                          {record.student?.section?.name ? ` - ${record.student.section.name}` : ''}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">{record.hostel?.name || '-'}</TableCell>
                        <TableCell className="hidden lg:table-cell">{record.room?.room_number_name || '-'}</TableCell>
                        <TableCell>{statusBadge(record.status)}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="outline" className="text-xs">{record.marked_by}</Badge>
                        </TableCell>
                        <TableCell className="text-xs hidden sm:table-cell">
                          {record.check_in_time ? new Date(record.check_in_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '-'}
                        </TableCell>
                        <TableCell className="text-xs max-w-[150px] truncate hidden lg:table-cell">{record.remarks || '-'}</TableCell>
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

export default HostelAttendance;
