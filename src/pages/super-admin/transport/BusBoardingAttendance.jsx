import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDate, formatTime } from '@/utils/dateUtils';
import {
  Loader2, ArrowLeft, Bus, CheckCircle, XCircle, Clock, Users, MapPin,
  Save, UserCheck, UserX, AlertTriangle, Search
} from 'lucide-react';

const BusBoardingAttendance = () => {
  const navigate = useNavigate();
  const { user, currentSessionId, organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();
  const branchId = selectedBranch?.id || user?.profile?.branch_id;

  const [trips, setTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [students, setStudents] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchTrips = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);

    const { data } = await supabase
      .from('transport_trips')
      .select(`*, vehicle:vehicle_id(vehicle_number), route:route_id(route_title), driver:driver_id(driver_name)`)
      .eq('branch_id', branchId)
      .eq('session_id', currentSessionId)
      .eq('trip_date', selectedDate)
      .in('status', ['scheduled', 'in_progress'])
      .order('scheduled_start_time');

    setTrips(data || []);
    setLoading(false);
  }, [branchId, currentSessionId, selectedDate]);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  const loadTripAttendance = async (trip) => {
    setSelectedTrip(trip);
    setLoading(true);

    // Get students assigned to this trip's route
    const { data: studentData } = await supabase
      .from('student_transport_details')
      .select(`
        id, student_id, seat_number, pickup_type, special_instructions,
        student:student_id(id, student_name, enrollment_id, section_name, class_name),
        pickup_point:pickup_id(pickup_point_name, stop_order)
      `)
      .eq('branch_id', branchId)
      .eq('session_id', currentSessionId)
      .eq('route_id', trip.route_id)
      .eq('is_active', true)
      .order('pickup_point(stop_order)');

    // Get existing attendance for this trip
    const { data: existingAttendance } = await supabase
      .from('transport_boarding_attendance')
      .select('*')
      .eq('trip_id', trip.id);

    // Build attendance map
    const attMap = {};
    (existingAttendance || []).forEach(a => {
      attMap[a.student_id] = {
        id: a.id,
        status: a.boarding_status,
        boarding_time: a.boarding_time,
        notes: a.notes || ''
      };
    });

    setStudents(studentData || []);
    setAttendanceRecords(attMap);
    setLoading(false);
  };

  const markAttendance = (studentId, status) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
        boarding_time: status === 'boarded' ? new Date().toISOString() : null
      }
    }));
  };

  const updateNote = (studentId, notes) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], notes }
    }));
  };

  const saveAttendance = async () => {
    if (!selectedTrip) return;
    setSaving(true);

    const records = students.map(s => {
      const att = attendanceRecords[s.student_id] || {};
      return {
        trip_id: selectedTrip.id,
        student_id: s.student_id,
        boarding_status: att.status || 'absent',
        boarding_time: att.boarding_time || null,
        stop_id: s.pickup_id || null,
        notes: att.notes || null,
        branch_id: branchId,
        session_id: currentSessionId,
        organization_id: organizationId
      };
    });

    // Delete existing + re-insert (upsert pattern)
    await supabase.from('transport_boarding_attendance').delete().eq('trip_id', selectedTrip.id);

    const { error } = await supabase.from('transport_boarding_attendance').insert(records);

    if (error) {
      toast({ variant: 'destructive', title: 'Error saving attendance', description: error.message });
    } else {
      // Update trip counts
      const boarded = records.filter(r => r.boarding_status === 'boarded').length;
      await supabase.from('transport_trips').update({
        total_students: records.length,
        boarded_students: boarded
      }).eq('id', selectedTrip.id);

      toast({ title: 'Success!', description: `Attendance saved — ${boarded}/${records.length} boarded.` });
    }
    setSaving(false);
  };

  const markAllPresent = () => {
    const updated = {};
    students.forEach(s => {
      updated[s.student_id] = {
        ...attendanceRecords[s.student_id],
        status: 'boarded',
        boarding_time: new Date().toISOString()
      };
    });
    setAttendanceRecords(updated);
  };

  const markAllAbsent = () => {
    const updated = {};
    students.forEach(s => {
      updated[s.student_id] = { ...attendanceRecords[s.student_id], status: 'absent', boarding_time: null };
    });
    setAttendanceRecords(updated);
  };

  // Stats
  const stats = useMemo(() => {
    const total = students.length;
    const boarded = students.filter(s => attendanceRecords[s.student_id]?.status === 'boarded').length;
    const absent = students.filter(s => attendanceRecords[s.student_id]?.status === 'absent').length;
    const late = students.filter(s => attendanceRecords[s.student_id]?.status === 'late').length;
    const unmarked = total - boarded - absent - late;
    return { total, boarded, absent, late, unmarked };
  }, [students, attendanceRecords]);

  // Group students by stop
  const studentsByStop = useMemo(() => {
    const grouped = {};
    students.forEach(s => {
      const stop = s.pickup_point?.pickup_point_name || 'Unassigned Stop';
      if (!grouped[stop]) grouped[stop] = { order: s.pickup_point?.stop_order || 999, students: [] };
      grouped[stop].students.push(s);
    });
    return Object.entries(grouped).sort((a, b) => a[1].order - b[1].order);
  }, [students]);

  return (
    <DashboardLayout>
      <div className="p-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4 gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>

        <h1 className="text-2xl font-bold mb-6">🚌 Bus Boarding Attendance</h1>

        {!selectedTrip ? (
          <>
            {/* Trip Selection */}
            <div className="flex items-center gap-4 mb-6">
              <div className="space-y-1">
                <Label className="text-xs">Select Date</Label>
                <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-[180px]" />
              </div>
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input className="pl-9" placeholder="Search trips..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : trips.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <Bus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No active trips found for {formatDate(selectedDate)}.</p>
                <p className="text-xs mt-2">Schedule trips first in Trip Management.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {trips.filter(trip => {
                  if (!searchTerm) return true;
                  const term = searchTerm.toLowerCase();
                  return (trip.route?.route_title || '').toLowerCase().includes(term) ||
                    (trip.vehicle?.vehicle_number || '').toLowerCase().includes(term) ||
                    (trip.driver?.driver_name || '').toLowerCase().includes(term) ||
                    (trip.trip_type || '').toLowerCase().includes(term);
                }).map(trip => (
                  <div key={trip.id} className="border rounded-lg p-4 cursor-pointer hover:shadow-md hover:border-primary/50 transition-all" onClick={() => loadTripAttendance(trip)}>
                    <div className="flex justify-between items-start mb-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        trip.trip_type === 'morning_pickup' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400'
                      }`}>
                        {trip.trip_type === 'morning_pickup' ? '🌅 Morning' : '🌇 Drop'}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        trip.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {trip.status === 'in_progress' ? '🟡 In Progress' : '⏳ Scheduled'}
                      </span>
                    </div>
                    <p className="font-semibold text-sm">{trip.route?.route_title || 'N/A'}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      <Bus className="inline h-3 w-3 mr-1" />{trip.vehicle?.vehicle_number || 'N/A'}
                      {trip.driver && <span className="ml-2">👤 {trip.driver.driver_name}</span>}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      <Clock className="inline h-3 w-3 mr-1" />{trip.scheduled_start_time || '--:--'} → {trip.scheduled_end_time || '--:--'}
                    </p>
                    <Button variant="outline" className="w-full mt-3 text-xs" size="sm">Take Attendance →</Button>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {/* Attendance Taking */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div>
                <Button variant="outline" size="sm" onClick={() => { setSelectedTrip(null); setStudents([]); setAttendanceRecords({}); }} className="mb-2">
                  ← Back to Trips
                </Button>
                <h2 className="text-lg font-semibold">
                  {selectedTrip.route?.route_title} — {selectedTrip.vehicle?.vehicle_number}
                  {selectedTrip.driver && <span className="text-sm font-normal text-muted-foreground ml-2">({selectedTrip.driver.driver_name})</span>}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={markAllPresent}>
                  <UserCheck className="mr-1 h-3 w-3" /> All Present
                </Button>
                <Button variant="outline" size="sm" onClick={markAllAbsent}>
                  <UserX className="mr-1 h-3 w-3" /> All Absent
                </Button>
                <Button onClick={saveAttendance} disabled={saving} size="sm">
                  {saving ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Save className="mr-1 h-3 w-3" />}
                  Save Attendance
                </Button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
              <div className="bg-card rounded-lg shadow p-3 border-l-4 border-blue-500">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-xl font-bold">{stats.total}</p>
              </div>
              <div className="bg-card rounded-lg shadow p-3 border-l-4 border-green-500">
                <p className="text-xs text-muted-foreground">Boarded</p>
                <p className="text-xl font-bold text-green-600">{stats.boarded}</p>
              </div>
              <div className="bg-card rounded-lg shadow p-3 border-l-4 border-red-500">
                <p className="text-xs text-muted-foreground">Absent</p>
                <p className="text-xl font-bold text-red-600">{stats.absent}</p>
              </div>
              <div className="bg-card rounded-lg shadow p-3 border-l-4 border-yellow-500">
                <p className="text-xs text-muted-foreground">Late</p>
                <p className="text-xl font-bold text-yellow-600">{stats.late}</p>
              </div>
              <div className="bg-card rounded-lg shadow p-3 border-l-4 border-gray-400">
                <p className="text-xs text-muted-foreground">Unmarked</p>
                <p className="text-xl font-bold">{stats.unmarked}</p>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : students.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No students assigned to this route.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {studentsByStop.map(([stop, { students: stopStudents }]) => (
                  <div key={stop}>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-2">
                      <MapPin className="h-3 w-3" /> {stop} ({stopStudents.length} students)
                    </h3>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs uppercase bg-muted/50">
                          <tr>
                            <th className="px-3 py-2 w-10">#</th>
                            <th className="px-3 py-2">Student</th>
                            <th className="px-3 py-2">Class</th>
                            <th className="px-3 py-2">Seat</th>
                            <th className="px-3 py-2 text-center">Status</th>
                            <th className="px-3 py-2">Note</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stopStudents.map((s, idx) => {
                            const att = attendanceRecords[s.student_id];
                            const status = att?.status;
                            return (
                              <tr key={s.id} className={`border-b border-border ${
                                status === 'boarded' ? 'bg-green-50 dark:bg-green-900/10' : 
                                status === 'absent' ? 'bg-red-50 dark:bg-red-900/10' : 
                                status === 'late' ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''
                              }`}>
                                <td className="px-3 py-2">{idx + 1}</td>
                                <td className="px-3 py-2">
                                  <div>
                                    <span className="font-medium">{s.student?.student_name || 'N/A'}</span>
                                    {s.student?.enrollment_id && <span className="text-xs text-muted-foreground ml-1">({s.student.enrollment_id})</span>}
                                  </div>
                                </td>
                                <td className="px-3 py-2 text-xs">{s.student?.class_name || ''} {s.student?.section_name || ''}</td>
                                <td className="px-3 py-2 text-xs">{s.seat_number || '-'}</td>
                                <td className="px-3 py-2">
                                  <div className="flex items-center justify-center gap-1">
                                    <Button
                                      variant={status === 'boarded' ? 'default' : 'outline'} size="icon"
                                      className={`h-7 w-7 ${status === 'boarded' ? 'bg-green-600 hover:bg-green-700' : ''}`}
                                      onClick={() => markAttendance(s.student_id, 'boarded')} title="Present">
                                      <CheckCircle className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      variant={status === 'absent' ? 'default' : 'outline'} size="icon"
                                      className={`h-7 w-7 ${status === 'absent' ? 'bg-red-600 hover:bg-red-700' : ''}`}
                                      onClick={() => markAttendance(s.student_id, 'absent')} title="Absent">
                                      <XCircle className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      variant={status === 'late' ? 'default' : 'outline'} size="icon"
                                      className={`h-7 w-7 ${status === 'late' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}`}
                                      onClick={() => markAttendance(s.student_id, 'late')} title="Late">
                                      <AlertTriangle className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </td>
                                <td className="px-3 py-2">
                                  <Input
                                    value={att?.notes || ''} placeholder="Note..."
                                    onChange={(e) => updateNote(s.student_id, e.target.value)}
                                    className="h-7 text-xs" />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default BusBoardingAttendance;
