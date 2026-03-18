import React, { useState, useEffect, useCallback } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  ClipboardList, Loader2, RefreshCw, Save, CheckSquare, XSquare,
  Users, UserCheck, UserX
} from 'lucide-react';

const MEAL_TYPES = ['breakfast', 'lunch', 'snacks', 'dinner'];
const MEAL_LABELS = { breakfast: '🌅 Breakfast', lunch: '☀️ Lunch', snacks: '🍪 Snacks', dinner: '🌙 Dinner' };

const MessAttendance = () => {
  const { user } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();
  const branchId = selectedBranch?.id || user?.profile?.branch_id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hostels, setHostels] = useState([]);
  const [selectedHostel, setSelectedHostel] = useState('');
  const [mealDate, setMealDate] = useState(new Date().toISOString().split('T')[0]);
  const [mealType, setMealType] = useState('lunch');
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [existingAttendance, setExistingAttendance] = useState([]);

  const fetchHostels = useCallback(async () => {
    if (!branchId) return;
    try {
      const res = await api.get('/hostel/list');
      if (res.data?.success) {
        const list = res.data.data || [];
        setHostels(list);
        if (list.length > 0 && !selectedHostel) setSelectedHostel(list[0].id);
      }
    } catch (err) { console.error('Error:', err); }
  }, [branchId, selectedHostel]);

  const fetchStudents = useCallback(async () => {
    if (!branchId || !selectedHostel) return;
    try {
      const res = await api.get('/hostel/allocations', { params: { hostel_id: selectedHostel } });
      if (res.data?.success) setStudents(res.data.data || []);
    } catch (err) { console.error('Error fetching students:', err); }
  }, [branchId, selectedHostel]);

  const fetchAttendance = useCallback(async () => {
    if (!branchId || !selectedHostel || !mealDate || !mealType) return;
    setLoading(true);
    try {
      const res = await api.get('/hostel-mess/attendance', {
        params: { hostelId: selectedHostel, mealDate, mealType }
      });
      const records = res.data?.data || [];
      setExistingAttendance(records);

      // Pre-fill attendance from existing records
      const attMap = {};
      records.forEach(r => { attMap[r.student_id] = r.status; });
      setAttendance(attMap);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally { setLoading(false); }
  }, [branchId, selectedHostel, mealDate, mealType, toast]);

  useEffect(() => { fetchHostels(); }, [fetchHostels]);
  useEffect(() => { fetchStudents(); }, [fetchStudents]);
  useEffect(() => { fetchAttendance(); }, [fetchAttendance]);

  const toggleAttendance = (studentId) => {
    setAttendance(prev => {
      const current = prev[studentId];
      if (!current || current === 'absent') return { ...prev, [studentId]: 'present' };
      return { ...prev, [studentId]: 'absent' };
    });
  };

  const markAll = (status) => {
    const newAtt = {};
    students.forEach(s => {
      const sid = s.student_id || s.student?.id;
      if (sid) newAtt[sid] = status;
    });
    setAttendance(newAtt);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const records = Object.entries(attendance).map(([studentId, status]) => ({
        student_id: studentId,
        hostel_id: selectedHostel,
        meal_date: mealDate,
        meal_type: mealType,
        status
      }));

      if (records.length === 0) {
        toast({ variant: 'destructive', title: 'No records', description: 'Mark attendance first' });
        setSaving(false);
        return;
      }

      const res = await api.post('/hostel-mess/attendance/mark', { records });
      if (res.data?.success) {
        toast({ title: 'Saved', description: `${res.data.data?.length || 0} records saved` });
        fetchAttendance();
      }
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally { setSaving(false); }
  };

  const presentCount = Object.values(attendance).filter(s => s === 'present').length;
  const absentCount = Object.values(attendance).filter(s => s === 'absent').length;
  const totalStudents = students.length;

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ClipboardList className="h-6 w-6 text-green-600" /> Mess Attendance
            </h1>
            <p className="text-muted-foreground mt-1">Mark meal attendance for hostel students</p>
          </div>
          <Button onClick={handleSave} disabled={saving || Object.keys(attendance).length === 0}>
            {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
            Save Attendance
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="text-sm font-medium">Hostel</label>
            <Select value={selectedHostel} onValueChange={setSelectedHostel}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="Select Hostel" /></SelectTrigger>
              <SelectContent>
                {hostels.map(h => <SelectItem key={h.id} value={h.id}>{h.hostel_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Date</label>
            <Input type="date" value={mealDate} onChange={e => setMealDate(e.target.value)} className="w-[160px]" />
          </div>
          <div>
            <label className="text-sm font-medium">Meal</label>
            <Select value={mealType} onValueChange={setMealType}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {MEAL_TYPES.map(mt => <SelectItem key={mt} value={mt}>{MEAL_LABELS[mt]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="sm" onClick={fetchAttendance}><RefreshCw className="h-4 w-4 mr-1" /> Refresh</Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-3 flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div><p className="text-xs text-muted-foreground">Total</p><p className="text-xl font-bold">{totalStudents}</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-green-500" />
              <div><p className="text-xs text-muted-foreground">Present</p><p className="text-xl font-bold text-green-600">{presentCount}</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 flex items-center gap-2">
              <UserX className="h-5 w-5 text-red-500" />
              <div><p className="text-xs text-muted-foreground">Absent</p><p className="text-xl font-bold text-red-600">{absentCount}</p></div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => markAll('present')}>
            <CheckSquare className="h-4 w-4 mr-1 text-green-500" /> Mark All Present
          </Button>
          <Button variant="outline" size="sm" onClick={() => markAll('absent')}>
            <XSquare className="h-4 w-4 mr-1 text-red-500" /> Mark All Absent
          </Button>
        </div>

        {/* Student List */}
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-green-600" /></div>
        ) : students.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">No students allocated to this hostel</CardContent></Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8">#</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Admission No</TableHead>
                    <TableHead>Room</TableHead>
                    <TableHead className="text-center">Present</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((s, idx) => {
                    const sid = s.student_id || s.student?.id;
                    const studentName = s.student ? `${s.student.first_name || ''} ${s.student.last_name || ''}`.trim() : (s.student_name || 'Unknown');
                    const admNo = s.student?.admission_number || s.admission_number || '-';
                    const room = s.room_number || s.room?.room_number || '-';
                    const status = attendance[sid];

                    return (
                      <TableRow key={sid || idx} className={status === 'present' ? 'bg-green-50' : status === 'absent' ? 'bg-red-50' : ''}>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell className="font-medium">{studentName}</TableCell>
                        <TableCell>{admNo}</TableCell>
                        <TableCell>{room}</TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={status === 'present'}
                            onCheckedChange={() => toggleAttendance(sid)}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MessAttendance;
