import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Loader2, Save, CheckCircle, XCircle, Clock, Users, ArrowLeft
} from 'lucide-react';

const MarkAttendance = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();

  const branchId = selectedBranch?.id || user?.profile?.branch_id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hostels, setHostels] = useState([]);
  const [selectedHostel, setSelectedHostel] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedType, setSelectedType] = useState('morning');
  const [students, setStudents] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});

  // Fetch hostels
  useEffect(() => {
    const fetchHostels = async () => {
      if (!branchId) return;
      try {
        const res = await api.get('/hostel/list');
        if (res.data?.success) {
          const list = res.data.data || [];
          setHostels(list);
          if (list.length > 0) setSelectedHostel(list[0].id);
        }
      } catch (err) {
        console.error('Error fetching hostels:', err);
      }
    };
    fetchHostels();
  }, [branchId]);

  // Fetch students for roll call (allocated hostel students)
  const fetchStudents = useCallback(async () => {
    if (!branchId || !selectedHostel) return;
    setLoading(true);
    try {
      const res = await api.get('/hostel-attendance/roll-call/students', {
        params: { hostelId: selectedHostel }
      });
      if (res.data?.success) {
        const rooms = res.data.data || [];
        // Flatten to student list with room info
        const allStudents = [];
        rooms.forEach(room => {
          room.students.forEach(s => {
            allStudents.push({
              ...s,
              roomName: room.roomName,
              roomId: room.roomId,
              hostelName: room.hostelName
            });
          });
        });
        setStudents(allStudents);

        // Check existing attendance for this date/type
        const existingRes = await api.get('/hostel-attendance/by-date', {
          params: { date: selectedDate, hostelId: selectedHostel, attendanceType: selectedType }
        });
        const existing = {};
        if (existingRes.data?.success) {
          (existingRes.data.data || []).forEach(r => {
            existing[r.student_id] = r.status;
          });
        }

        // Initialize attendance map — default to 'present' if no existing
        const map = {};
        allStudents.forEach(s => {
          map[s.studentId] = existing[s.studentId] || 'present';
        });
        setAttendanceMap(map);
      }
    } catch (err) {
      console.error('Error fetching students:', err);
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally {
      setLoading(false);
    }
  }, [branchId, selectedHostel, selectedDate, selectedType, toast]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  // Toggle status
  const toggleStatus = (studentId, status) => {
    setAttendanceMap(prev => ({ ...prev, [studentId]: status }));
  };

  // Mark all present
  const markAllPresent = () => {
    const map = {};
    students.forEach(s => { map[s.studentId] = 'present'; });
    setAttendanceMap(map);
  };

  // Mark all absent
  const markAllAbsent = () => {
    const map = {};
    students.forEach(s => { map[s.studentId] = 'absent'; });
    setAttendanceMap(map);
  };

  // Save bulk attendance
  const handleSave = async () => {
    if (students.length === 0) return;
    setSaving(true);
    try {
      const records = students.map(s => ({
        student_id: s.studentId,
        hostel_id: selectedHostel,
        room_id: s.roomId,
        attendance_date: selectedDate,
        attendance_type: selectedType,
        status: attendanceMap[s.studentId] || 'present'
      }));

      const res = await api.post('/hostel-attendance/mark-bulk', { records });
      if (res.data?.success) {
        toast({
          title: '✅ Attendance Saved',
          description: `${res.data.count || records.length} records saved successfully`
        });
      }
    } catch (err) {
      console.error('Error saving attendance:', err);
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally {
      setSaving(false);
    }
  };

  const statusColors = {
    present: 'bg-green-500 hover:bg-green-600',
    absent: 'bg-red-500 hover:bg-red-600',
    late: 'bg-yellow-500 hover:bg-yellow-600',
    on_leave: 'bg-blue-500 hover:bg-blue-600',
    medical_leave: 'bg-purple-500 hover:bg-purple-600'
  };

  const counts = {
    present: Object.values(attendanceMap).filter(v => v === 'present').length,
    absent: Object.values(attendanceMap).filter(v => v === 'absent').length,
    late: Object.values(attendanceMap).filter(v => v === 'late').length,
    onLeave: Object.values(attendanceMap).filter(v => v === 'on_leave' || v === 'medical_leave').length
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">📋 Mark Hostel Attendance</h1>
            <p className="text-sm text-muted-foreground mt-1">Bulk mark attendance for hostel students</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving || students.length === 0}>
              {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
              Save Attendance
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Date</label>
                <Input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Hostel</label>
                <Select value={selectedHostel} onValueChange={setSelectedHostel}>
                  <SelectTrigger><SelectValue placeholder="Select Hostel" /></SelectTrigger>
                  <SelectContent>
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
              <div className="flex items-end gap-2">
                <Button variant="outline" size="sm" onClick={markAllPresent}>
                  <CheckCircle className="w-3 h-3 mr-1" /> All Present
                </Button>
                <Button variant="outline" size="sm" onClick={markAllAbsent}>
                  <XCircle className="w-3 h-3 mr-1" /> All Absent
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary badges */}
        <div className="flex gap-3 flex-wrap">
          <Badge className="bg-green-100 text-green-800 px-3 py-1">
            <CheckCircle className="w-3 h-3 mr-1" /> Present: {counts.present}
          </Badge>
          <Badge className="bg-red-100 text-red-800 px-3 py-1">
            <XCircle className="w-3 h-3 mr-1" /> Absent: {counts.absent}
          </Badge>
          <Badge className="bg-yellow-100 text-yellow-800 px-3 py-1">
            <Clock className="w-3 h-3 mr-1" /> Late: {counts.late}
          </Badge>
          <Badge className="bg-blue-100 text-blue-800 px-3 py-1">
            <Users className="w-3 h-3 mr-1" /> Leave: {counts.onLeave}
          </Badge>
        </div>

        {/* Student Attendance Grid */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Students ({students.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            ) : students.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-lg font-medium">No students allocated</p>
                <p className="text-sm">Select a hostel with allocated students</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Adm. No</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Room</TableHead>
                      <TableHead>Bed</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((s, idx) => (
                      <TableRow key={s.studentId} className={attendanceMap[s.studentId] === 'absent' ? 'bg-red-50' : ''}>
                        <TableCell className="font-medium">{idx + 1}</TableCell>
                        <TableCell>{s.student?.full_name || s.student?.first_name || '-'}</TableCell>
                        <TableCell>{s.student?.admission_number || '-'}</TableCell>
                        <TableCell>
                          {s.student?.class?.name || '-'}
                          {s.student?.section?.name ? ` - ${s.student.section.name}` : ''}
                        </TableCell>
                        <TableCell>{s.roomName || '-'}</TableCell>
                        <TableCell>{s.bedNumber || '-'}</TableCell>
                        <TableCell>
                          <div className="flex gap-1 justify-center">
                            {['present', 'absent', 'late', 'on_leave'].map(status => (
                              <button
                                key={status}
                                onClick={() => toggleStatus(s.studentId, status)}
                                className={`px-2 py-1 rounded text-xs font-medium text-white transition-all ${
                                  attendanceMap[s.studentId] === status
                                    ? statusColors[status]
                                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                }`}
                              >
                                {status === 'present' ? 'P' : status === 'absent' ? 'A' : status === 'late' ? 'L' : 'LV'}
                              </button>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bottom Save Button */}
        {students.length > 0 && (
          <div className="flex justify-end">
            <Button size="lg" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Attendance ({students.length} students)
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MarkAttendance;
