import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { supabase } from '@/lib/customSupabaseClient';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import {
  Users, CheckCircle2, XCircle, Clock, CalendarDays, TrendingUp,
  AlertTriangle, Loader2, BarChart3, Filter, ChevronLeft, ChevronRight
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell
} from 'recharts';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, parseISO } from 'date-fns';
import { formatDate } from '@/utils/dateUtils';

const STATUS_COLORS = {
  present: '#10b981',
  absent: '#ef4444',
  late: '#f97316',
  half_day: '#eab308',
  leave: '#3b82f6',
  holiday: '#a855f7',
};

const PIE_COLORS = ['#10b981', '#ef4444', '#f97316', '#3b82f6', '#eab308', '#a855f7'];

export default function StudentAttendanceDashboard() {
  const { user, currentSessionId, organizationId } = useAuth();
  const { selectedBranch } = useBranch();

  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('all');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [attendanceData, setAttendanceData] = useState([]);
  const [students, setStudents] = useState([]);
  const [threshold, setThreshold] = useState(75);

  // Fetch classes
  useEffect(() => {
    if (!selectedBranch?.id) return;
    (async () => {
      const { data } = await supabase
        .from('classes')
        .select('id, name')
        .eq('branch_id', selectedBranch.id)
        .order('display_order');
      setClasses(data || []);
    })();
  }, [selectedBranch]);

  // Fetch attendance data for the month
  const fetchData = useCallback(async () => {
    if (!selectedBranch?.id || !currentSessionId) return;
    setLoading(true);
    try {
      const monthStart = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
      const monthEnd = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

      let query = supabase
        .from('student_attendance')
        .select('student_id, date, status, is_late, class_id, section_id')
        .eq('branch_id', selectedBranch.id)
        .eq('session_id', currentSessionId)
        .gte('date', monthStart)
        .lte('date', monthEnd);

      if (selectedClass !== 'all') {
        query = query.eq('class_id', selectedClass);
      }

      const { data: attendance } = await query;

      // Fetch student list for the same filter
      let studentQuery = supabase
        .from('student_profiles')
        .select('id, full_name, class_id, section_id, classes(name), sections(name), photo_url')
        .eq('branch_id', selectedBranch.id)
        .eq('session_id', currentSessionId)
        .eq('status', 'active');

      if (selectedClass !== 'all') {
        studentQuery = studentQuery.eq('class_id', selectedClass);
      }

      const { data: studentsList } = await studentQuery;

      setAttendanceData(attendance || []);
      setStudents(studentsList || []);
    } catch (err) {
      console.error('Error fetching attendance:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedBranch, currentSessionId, currentMonth, selectedClass]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ─── Analytics ───
  const analytics = useMemo(() => {
    if (!attendanceData.length && !students.length) return null;

    // Overall counts
    const statusCounts = { present: 0, absent: 0, late: 0, leave: 0, half_day: 0, holiday: 0 };
    attendanceData.forEach(a => {
      const s = a.status || 'present';
      if (statusCounts[s] !== undefined) statusCounts[s]++;
    });
    const totalRecords = attendanceData.length;
    const presentRate = totalRecords > 0
      ? Math.round(((statusCounts.present + statusCounts.late + statusCounts.half_day) / totalRecords) * 100 * 10) / 10
      : 0;

    // Pie data
    const pieData = Object.entries(statusCounts)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' '), value }));

    // Per-student attendance
    const studentAttMap = {};
    attendanceData.forEach(a => {
      if (!studentAttMap[a.student_id]) studentAttMap[a.student_id] = { present: 0, absent: 0, late: 0, leave: 0, total: 0 };
      studentAttMap[a.student_id].total++;
      const s = a.status || 'present';
      if (s === 'present' || s === 'late' || s === 'half_day') studentAttMap[a.student_id].present++;
      else if (s === 'absent') studentAttMap[a.student_id].absent++;
      else if (s === 'leave') studentAttMap[a.student_id].leave++;
    });

    // Below threshold
    const belowThreshold = students
      .map(s => {
        const att = studentAttMap[s.id];
        if (!att || att.total === 0) return null;
        const pct = Math.round((att.present / att.total) * 100);
        if (pct < threshold) return { ...s, pct, absent: att.absent, total: att.total };
        return null;
      })
      .filter(Boolean)
      .sort((a, b) => a.pct - b.pct);

    // Class-wise breakdown
    const classMap = {};
    attendanceData.forEach(a => {
      const cid = a.class_id;
      if (!classMap[cid]) classMap[cid] = { present: 0, total: 0 };
      classMap[cid].total++;
      if (a.status === 'present' || a.status === 'late' || a.status === 'half_day') classMap[cid].present++;
    });
    const classWise = classes.map(c => {
      const d = classMap[c.id];
      return {
        name: c.name,
        attendance: d ? Math.round((d.present / d.total) * 100) : 0,
        total: d?.total || 0,
      };
    }).filter(c => c.total > 0);

    // Daily trend for the month
    const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });
    const dailyMap = {};
    attendanceData.forEach(a => {
      if (!dailyMap[a.date]) dailyMap[a.date] = { present: 0, total: 0 };
      dailyMap[a.date].total++;
      if (a.status === 'present' || a.status === 'late' || a.status === 'half_day') dailyMap[a.date].present++;
    });
    const dailyTrend = days
      .filter(d => getDay(d) !== 0) // Skip Sundays
      .map(d => {
        const key = format(d, 'yyyy-MM-dd');
        const entry = dailyMap[key];
        return {
          date: format(d, 'dd'),
          rate: entry ? Math.round((entry.present / entry.total) * 100) : null,
        };
      })
      .filter(d => d.rate !== null);

    // Calendar heatmap
    const calendarDays = days.map(d => {
      const key = format(d, 'yyyy-MM-dd');
      const dayRecords = attendanceData.filter(a => a.date === key);
      if (!dayRecords.length) return { date: d, rate: null, dow: getDay(d) };
      const present = dayRecords.filter(a => ['present', 'late', 'half_day'].includes(a.status)).length;
      return { date: d, rate: Math.round((present / dayRecords.length) * 100), dow: getDay(d) };
    });

    return { statusCounts, presentRate, totalRecords, pieData, belowThreshold, classWise, dailyTrend, calendarDays, totalStudents: students.length };
  }, [attendanceData, students, classes, currentMonth, threshold]);

  const getHeatColor = (rate) => {
    if (rate === null) return 'bg-muted/20';
    if (rate >= 90) return 'bg-emerald-500';
    if (rate >= 75) return 'bg-emerald-300';
    if (rate >= 60) return 'bg-yellow-400';
    if (rate >= 40) return 'bg-orange-400';
    return 'bg-red-500';
  };

  if (!selectedBranch?.id) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          <AlertTriangle className="mr-2 h-5 w-5" /> Please select a branch first
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <CalendarDays className="h-6 w-6 text-primary" />
              Attendance Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              {format(currentMonth, 'MMMM yyyy')} — Student attendance overview
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {/* Month Navigation */}
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" onClick={() => setCurrentMonth(m => subMonths(m, 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium px-2 min-w-[120px] text-center">
                {format(currentMonth, 'MMM yyyy')}
              </span>
              <Button variant="outline" size="icon" onClick={() => setCurrentMonth(m => addMonths(m, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            {/* Class Filter */}
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading attendance data...
          </div>
        ) : !analytics ? (
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground">
              <CalendarDays className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No attendance data for {format(currentMonth, 'MMMM yyyy')}</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* ── Stat Cards ── */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Users className="h-7 w-7 mx-auto text-primary mb-1" />
                    <div className="text-2xl font-bold">{analytics.totalStudents}</div>
                    <div className="text-xs text-muted-foreground">Students</div>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                <Card className="border-emerald-200 dark:border-emerald-800">
                  <CardContent className="p-4 text-center">
                    <CheckCircle2 className="h-7 w-7 mx-auto text-emerald-500 mb-1" />
                    <div className="text-2xl font-bold text-emerald-600">{analytics.presentRate}%</div>
                    <div className="text-xs text-muted-foreground">Avg Attendance</div>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card className="border-red-200 dark:border-red-800">
                  <CardContent className="p-4 text-center">
                    <XCircle className="h-7 w-7 mx-auto text-red-500 mb-1" />
                    <div className="text-2xl font-bold text-red-600">{analytics.statusCounts.absent}</div>
                    <div className="text-xs text-muted-foreground">Absences</div>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                <Card className="border-orange-200 dark:border-orange-800">
                  <CardContent className="p-4 text-center">
                    <Clock className="h-7 w-7 mx-auto text-orange-500 mb-1" />
                    <div className="text-2xl font-bold text-orange-600">{analytics.statusCounts.late}</div>
                    <div className="text-xs text-muted-foreground">Late Arrivals</div>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card className="border-amber-200 dark:border-amber-800">
                  <CardContent className="p-4 text-center">
                    <AlertTriangle className="h-7 w-7 mx-auto text-amber-500 mb-1" />
                    <div className="text-2xl font-bold text-amber-600">{analytics.belowThreshold.length}</div>
                    <div className="text-xs text-muted-foreground">Below {threshold}%</div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* ── Calendar Heatmap ── */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" /> Attendance Heatmap
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-7 gap-1 text-center mb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                      <div key={d} className="text-xs text-muted-foreground font-medium">{d}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {/* Empty cells for offset */}
                    {Array.from({ length: getDay(startOfMonth(currentMonth)) }).map((_, i) => (
                      <div key={`empty-${i}`} className="aspect-square" />
                    ))}
                    {analytics.calendarDays.map((day, i) => (
                      <div
                        key={i}
                        className={`aspect-square rounded-md flex items-center justify-center text-xs font-medium ${getHeatColor(day.rate)} ${day.rate !== null ? 'text-white' : 'text-muted-foreground'} ${day.dow === 0 ? 'opacity-40' : ''}`}
                        title={day.rate !== null ? `${format(day.date, 'dd MMM')}: ${day.rate}%` : format(day.date, 'dd MMM')}
                      >
                        {format(day.date, 'd')}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-center gap-3 mt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-500" /> &gt;90%</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-300" /> 75-90%</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-400" /> 60-75%</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-orange-400" /> 40-60%</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500" /> &lt;40%</span>
                  </div>
                </CardContent>
              </Card>

              {/* ── Status Distribution Pie ── */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" /> Status Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie data={analytics.pieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {analytics.pieData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* ── Daily Trend ── */}
              {analytics.dailyTrend.length > 0 && (
                <Card className="lg:col-span-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" /> Daily Attendance Trend
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={analytics.dailyTrend}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey="date" fontSize={11} />
                        <YAxis domain={[0, 100]} fontSize={11} />
                        <Tooltip formatter={(v) => [`${v}%`, 'Attendance']} />
                        <Line type="monotone" dataKey="rate" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* ── Class-wise Attendance Bar ── */}
              {analytics.classWise.length > 0 && selectedClass === 'all' && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" /> Class-wise Attendance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={analytics.classWise}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey="name" fontSize={11} />
                        <YAxis domain={[0, 100]} fontSize={11} />
                        <Tooltip formatter={(v) => [`${v}%`, 'Attendance']} />
                        <Bar dataKey="attendance" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* ── Below Threshold Alerts ── */}
              <Card className={analytics.classWise.length > 0 && selectedClass === 'all' ? '' : 'lg:col-span-2'}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    Below {threshold}% Attendance
                    <Badge variant="destructive" className="ml-auto">{analytics.belowThreshold.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analytics.belowThreshold.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald-400" />
                      All students are above {threshold}% attendance
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                      {analytics.belowThreshold.map(s => (
                        <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{s.full_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {s.classes?.name} {s.sections?.name && `- ${s.sections.name}`}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-lg font-bold text-red-600">{s.pct}%</span>
                            <p className="text-xs text-muted-foreground">{s.absent} absent / {s.total} days</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
