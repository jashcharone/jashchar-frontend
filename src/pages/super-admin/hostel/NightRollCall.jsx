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
import { Badge } from '@/components/ui/badge';
import {
  Loader2, Save, CheckCircle, XCircle, Moon, ArrowLeft, Users, DoorOpen
} from 'lucide-react';

const NightRollCall = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();

  const branchId = selectedBranch?.id || user?.profile?.branch_id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hostels, setHostels] = useState([]);
  const [selectedHostel, setSelectedHostel] = useState('');
  const [roomsData, setRoomsData] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [expandedRooms, setExpandedRooms] = useState({});

  const today = new Date().toISOString().split('T')[0];

  // Fetch hostels
  useEffect(() => {
    const load = async () => {
      if (!branchId) return;
      try {
        const res = await api.get('/hostel/list');
        if (res.data?.success) {
          const list = res.data.data || [];
          setHostels(list);
          if (list.length > 0) setSelectedHostel(list[0].id);
        }
      } catch (err) {
        console.error('Error:', err);
      }
    };
    load();
  }, [branchId]);

  // Fetch students grouped by room
  const fetchRollCall = useCallback(async () => {
    if (!branchId || !selectedHostel) return;
    setLoading(true);
    try {
      const res = await api.get('/hostel-attendance/roll-call/students', {
        params: { hostelId: selectedHostel }
      });
      if (res.data?.success) {
        const rooms = res.data.data || [];
        setRoomsData(rooms);

        // Check existing night roll call attendance
        const existingRes = await api.get('/hostel-attendance/by-date', {
          params: { date: today, hostelId: selectedHostel, attendanceType: 'night_rollcall' }
        });
        const existing = {};
        if (existingRes.data?.success) {
          (existingRes.data.data || []).forEach(r => {
            existing[r.student_id] = r.status;
          });
        }

        // Initialize — default present
        const map = {};
        const expanded = {};
        rooms.forEach(room => {
          expanded[room.roomId] = true;
          room.students.forEach(s => {
            map[s.studentId] = existing[s.studentId] || 'present';
          });
        });
        setAttendanceMap(map);
        setExpandedRooms(expanded);
      }
    } catch (err) {
      console.error('Error:', err);
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally {
      setLoading(false);
    }
  }, [branchId, selectedHostel, today, toast]);

  useEffect(() => { fetchRollCall(); }, [fetchRollCall]);

  const toggleRoom = (roomId) => {
    setExpandedRooms(prev => ({ ...prev, [roomId]: !prev[roomId] }));
  };

  const toggleStatus = (studentId) => {
    setAttendanceMap(prev => ({
      ...prev,
      [studentId]: prev[studentId] === 'present' ? 'absent' : 'present'
    }));
  };

  const markRoomAllPresent = (room) => {
    const map = { ...attendanceMap };
    room.students.forEach(s => { map[s.studentId] = 'present'; });
    setAttendanceMap(map);
  };

  // Save
  const handleSave = async () => {
    setSaving(true);
    try {
      const records = [];
      roomsData.forEach(room => {
        room.students.forEach(s => {
          records.push({
            student_id: s.studentId,
            hostel_id: selectedHostel,
            room_id: room.roomId,
            attendance_date: today,
            attendance_type: 'night_rollcall',
            status: attendanceMap[s.studentId] || 'present'
          });
        });
      });

      const res = await api.post('/hostel-attendance/mark-bulk', { records });
      if (res.data?.success) {
        toast({
          title: '✅ Night Roll Call Saved',
          description: `${res.data.count || records.length} records saved`
        });
      }
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally {
      setSaving(false);
    }
  };

  const totalStudents = roomsData.reduce((acc, r) => acc + r.students.length, 0);
  const presentCount = Object.values(attendanceMap).filter(v => v === 'present').length;
  const absentCount = Object.values(attendanceMap).filter(v => v === 'absent').length;

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">🌙 Night Roll Call</h1>
            <p className="text-sm text-muted-foreground mt-1">Room-by-room night roll call check</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving || totalStudents === 0}>
              {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
              Save Roll Call
            </Button>
          </div>
        </div>

        {/* Hostel selector + summary */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="w-full md:w-64">
            <Select value={selectedHostel} onValueChange={setSelectedHostel}>
              <SelectTrigger><SelectValue placeholder="Select Hostel" /></SelectTrigger>
              <SelectContent>
                {hostels.map(h => (
                  <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-3">
            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 px-3 py-1">
              <Users className="w-3 h-3 mr-1" /> Total: {totalStudents}
            </Badge>
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 px-3 py-1">
              <CheckCircle className="w-3 h-3 mr-1" /> Present: {presentCount}
            </Badge>
            <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 px-3 py-1">
              <XCircle className="w-3 h-3 mr-1" /> Absent: {absentCount}
            </Badge>
          </div>
        </div>

        {/* Room Cards */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : roomsData.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12 text-muted-foreground">
              <DoorOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium">No rooms with students</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {roomsData.map(room => {
              const roomPresent = room.students.filter(s => attendanceMap[s.studentId] === 'present').length;
              const roomTotal = room.students.length;
              const allPresent = roomPresent === roomTotal;

              return (
                <Card key={room.roomId} className={allPresent ? 'border-green-200 dark:border-green-800' : 'border-orange-200 dark:border-orange-800'}>
                  <CardHeader
                    className="cursor-pointer py-3"
                    onClick={() => toggleRoom(room.roomId)}
                  >
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-base flex items-center gap-2">
                        <DoorOpen className="w-5 h-5" />
                        {room.roomName}
                        <Badge variant="outline" className="ml-2">
                          {roomPresent}/{roomTotal}
                        </Badge>
                        {allPresent && <CheckCircle className="w-4 h-4 text-green-500" />}
                      </CardTitle>
                      <div className="flex gap-2 items-center">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => { e.stopPropagation(); markRoomAllPresent(room); }}
                        >
                          All ✓
                        </Button>
                        <span className="text-sm text-muted-foreground">
                          {expandedRooms[room.roomId] ? '▲' : '▼'}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  {expandedRooms[room.roomId] && (
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {room.students.map(s => {
                          const isPresent = attendanceMap[s.studentId] === 'present';
                          return (
                            <div
                              key={s.studentId}
                              className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                                isPresent ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800' : 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
                              }`}
                              onClick={() => toggleStatus(s.studentId)}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                                  isPresent ? 'bg-green-500' : 'bg-red-500'
                                }`}>
                                  {isPresent ? '✓' : '✗'}
                                </div>
                                <div>
                                  <p className="font-medium text-sm">
                                    {s.student?.full_name || s.student?.first_name || 'Unknown'}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {s.student?.admission_number || '-'} • Bed: {s.bedNumber || '-'}
                                    {s.student?.class?.name ? ` • ${s.student.class.name}` : ''}
                                  </p>
                                </div>
                              </div>
                              <Badge className={isPresent ? 'bg-green-500' : 'bg-red-500'}>
                                {isPresent ? 'PRESENT' : 'ABSENT'}
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        {/* Bottom Save */}
        {totalStudents > 0 && (
          <div className="flex justify-end">
            <Button size="lg" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Moon className="w-4 h-4 mr-2" />}
              Complete Roll Call ({totalStudents} students)
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default NightRollCall;
