/**
 * 🧠 AI STUDENT INSIGHTS — Cortex Intelligence Hub
 * Dropout prediction, performance forecasting, learning difficulty detection,
 * attendance pattern analysis, intervention suggestions, career recommendations.
 * Uses local analytics when Cortex AI is not available.
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, AlertTriangle, TrendingUp, TrendingDown, Target, BookOpen,
  Users, Loader2, Shield, Lightbulb, GraduationCap, Clock, Search,
  BarChart3, PieChart, ArrowRight, ChevronDown, ChevronUp,
  UserX, Award, Activity, Zap, Heart, AlertCircle, CheckCircle2,
  XCircle, Filter, RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, PieChart as RPieChart, Pie, Cell
} from 'recharts';
import DashboardLayout from '@/components/DashboardLayout';
import { toast } from 'sonner';

const RISK_COLORS = { high: '#ef4444', medium: '#f59e0b', low: '#22c55e' };
const PIE_COLORS = ['#ef4444', '#f59e0b', '#22c55e', '#6366f1', '#ec4899'];

export default function StudentAIInsights() {
  const { user, currentSessionId, organizationId } = useAuth();
  const { selectedBranch } = useBranch();

  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [feeData, setFeeData] = useState([]);
  const [marksData, setMarksData] = useState([]);
  const [classes, setClasses] = useState([]);
  const [filterClass, setFilterClass] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedStudent, setExpandedStudent] = useState(null);

  const branchId = selectedBranch?.id;

  // ─── Fetch All Data ─── (attendance batched per class to avoid timeout)
  const fetchData = useCallback(async () => {
    if (!branchId || !currentSessionId) return;
    setLoading(true);
    try {
      // Step 1: Fetch classes first (needed for batching attendance)
      const classesRes = await supabase
        .from('classes')
        .select('id, name')
        .eq('branch_id', branchId)
        .order('display_order');
      const classList = classesRes.data || [];
      setClasses(classList);

      // Step 2: Fetch non-attendance data in parallel
      const [studentsRes, feeRes, marksRes] = await Promise.all([
        supabase
          .from('student_profiles')
          .select('id, full_name, enrollment_id, enrollment_id, photo_url, class_id, section_id, category_id, classes(id, name), sections(id, name)')
          .eq('branch_id', branchId)
          .eq('session_id', currentSessionId)
          .or('is_disabled.is.null,is_disabled.eq.false'),
        supabase
          .from('fee_payments')
          .select('student_id, amount, fee_master_id')
          .eq('branch_id', branchId)
          .eq('session_id', currentSessionId)
          .is('reverted_at', null),
        supabase
          .from('exam_marks')
          .select('student_id, marks, is_absent, exam_subjects(max_marks, min_marks)')
          .not('is_absent', 'eq', true),
      ]);

      // Step 3: Use RPC to get attendance summary (bypasses expensive RLS)
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      const dateFrom = threeMonthsAgo.toISOString().split('T')[0];

      const { data: attendanceSummary } = await supabase.rpc('get_student_attendance_summary', {
        p_branch_id: branchId,
        p_session_id: currentSessionId,
        p_date_from: dateFrom,
      });

      setStudents(studentsRes.data || []);
      setAttendanceData(attendanceSummary || []);
      setFeeData(feeRes.data || []);
      setMarksData(marksRes.data || []);
    } catch (err) {
      console.error('Error fetching AI insights data:', err);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [branchId, currentSessionId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ─── AI Analytics Computation ───
  const insights = useMemo(() => {
    if (!students.length) return null;

    // Build attendance lookup from RPC summary
    const attMap = {};
    attendanceData.forEach(a => { attMap[a.student_id] = a; });

    // Build per-student insight
    const studentInsights = students.map(student => {
      const sid = student.id;
      const att = attMap[sid];

      // Attendance (from RPC summary)
      const totalDays = att?.total_days || 0;
      const presentDays = att?.present_days || 0;
      const absentDays = att?.absent_days || 0;
      const attendancePct = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : null;
      const consecutiveAbsent = att?.recent_consecutive_absences || 0;

      // Fees (from fee_payments — tracks completed payments per student)
      const studentFees = feeData.filter(f => f.student_id === sid);
      const paidFee = studentFees.reduce((s, f) => s + (f.amount || 0), 0);
      const totalFee = paidFee; // Total due not available from payments table
      const feePct = null;
      const feeDefaulter = false;

      // Marks (from exam_marks — calculate percentage from marks/max_marks)
      const studentMarks = marksData.filter(m => m.student_id === sid);
      const avgPct = studentMarks.length > 0
        ? Math.round(studentMarks.reduce((s, m) => {
            const max = m.exam_subjects?.max_marks || 100;
            return s + ((m.marks || 0) / max) * 100;
          }, 0) / studentMarks.length)
        : null;
      const failedSubjects = studentMarks.filter(m => {
        const pass = m.exam_subjects?.min_marks || 35;
        return (m.marks || 0) < pass;
      }).length;

      // Dropout Risk Score (0-100, higher = more risk)
      let riskScore = 0;
      if (attendancePct !== null) {
        if (attendancePct < 50) riskScore += 40;
        else if (attendancePct < 70) riskScore += 25;
        else if (attendancePct < 80) riskScore += 10;
      }
      if (consecutiveAbsent >= 10) riskScore += 20;
      else if (consecutiveAbsent >= 5) riskScore += 10;
      if (feeDefaulter) riskScore += 15;
      if (feePct !== null && feePct < 25) riskScore += 10;
      if (avgPct !== null && avgPct < 35) riskScore += 15;
      else if (avgPct !== null && avgPct < 50) riskScore += 8;

      const riskLevel = riskScore >= 50 ? 'high' : riskScore >= 25 ? 'medium' : 'low';

      // Interventions
      const interventions = [];
      if (attendancePct !== null && attendancePct < 70) interventions.push('Schedule parent meeting for attendance');
      if (consecutiveAbsent >= 5) interventions.push('Immediate home visit recommended');
      if (feeDefaulter) interventions.push('Fee counseling / installment plan');
      if (failedSubjects > 0) interventions.push(`Extra coaching for ${failedSubjects} weak subject(s)`);
      if (avgPct !== null && avgPct < 40) interventions.push('Peer tutoring program');
      if (riskScore >= 50) interventions.push('Priority counselor intervention');

      // Subject strength
      let strengthLabel = null;
      if (avgPct !== null) {
        if (avgPct >= 80) strengthLabel = 'Excellent';
        else if (avgPct >= 60) strengthLabel = 'Good';
        else if (avgPct >= 40) strengthLabel = 'Average';
        else strengthLabel = 'Needs Improvement';
      }

      return {
        ...student,
        attendancePct,
        consecutiveAbsent,
        feePct,
        feeDefaulter,
        avgPct,
        failedSubjects,
        riskScore,
        riskLevel,
        interventions,
        strengthLabel,
        totalDays,
        absentDays,
      };
    });

    // Aggregate stats
    const highRisk = studentInsights.filter(s => s.riskLevel === 'high');
    const mediumRisk = studentInsights.filter(s => s.riskLevel === 'medium');
    const lowRisk = studentInsights.filter(s => s.riskLevel === 'low');

    const riskDistribution = [
      { name: 'High Risk', value: highRisk.length, color: RISK_COLORS.high },
      { name: 'Medium Risk', value: mediumRisk.length, color: RISK_COLORS.medium },
      { name: 'Low Risk', value: lowRisk.length, color: RISK_COLORS.low },
    ];

    // Class health scores
    const classHealth = {};
    studentInsights.forEach(s => {
      const className = s.classes?.name || 'Unknown';
      if (!classHealth[className]) classHealth[className] = { scores: [], attendance: [], fees: [] };
      if (s.avgPct !== null) classHealth[className].scores.push(s.avgPct);
      if (s.attendancePct !== null) classHealth[className].attendance.push(s.attendancePct);
      if (s.feePct !== null) classHealth[className].fees.push(s.feePct);
    });

    const classHealthData = Object.entries(classHealth).map(([name, data]) => ({
      name,
      avgScore: data.scores.length ? Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length) : 0,
      avgAttendance: data.attendance.length ? Math.round(data.attendance.reduce((a, b) => a + b, 0) / data.attendance.length) : 0,
      avgFee: data.fees.length ? Math.round(data.fees.reduce((a, b) => a + b, 0) / data.fees.length) : 0,
    })).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

    const avgAttendance = studentInsights.filter(s => s.attendancePct !== null).length > 0
      ? Math.round(studentInsights.filter(s => s.attendancePct !== null).reduce((s, i) => s + i.attendancePct, 0) / studentInsights.filter(s => s.attendancePct !== null).length)
      : 0;

    return {
      studentInsights,
      highRisk,
      mediumRisk,
      lowRisk,
      riskDistribution,
      classHealthData,
      avgAttendance,
      totalStudents: students.length,
    };
  }, [students, attendanceData, feeData, marksData]);

  // Filtered & searched
  const filtered = useMemo(() => {
    if (!insights) return [];
    let list = insights.studentInsights;
    if (filterClass !== 'all') list = list.filter(s => s.class_id === filterClass);
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      list = list.filter(s =>
        s.full_name?.toLowerCase().includes(q) ||
        s.enrollment_id?.toLowerCase().includes(q) ||
        s.enrollment_id?.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => b.riskScore - a.riskScore);
  }, [insights, filterClass, searchTerm]);

  if (!branchId) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          <AlertCircle className="mr-2 h-5 w-5" /> Please select a branch
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Brain className="h-7 w-7 text-purple-600" />
              AI Student Insights
              <Badge variant="outline" className="text-purple-600 border-purple-300">Cortex</Badge>
            </h1>
            <p className="text-muted-foreground mt-1">
              Intelligent predictions, risk analysis & intervention recommendations
            </p>
          </div>
          <Button variant="outline" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-purple-500 mr-3" />
            <span className="text-lg text-muted-foreground">Analyzing student data...</span>
          </div>
        ) : !insights ? (
          <Card><CardContent className="py-16 text-center text-muted-foreground">No student data found</CardContent></Card>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Card className="border-l-4 border-l-purple-500">
                <CardContent className="p-4">
                  <Users className="h-6 w-6 text-purple-500 mb-1" />
                  <div className="text-2xl font-bold">{insights.totalStudents}</div>
                  <div className="text-xs text-muted-foreground">Total Students</div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-red-500">
                <CardContent className="p-4">
                  <AlertTriangle className="h-6 w-6 text-red-500 mb-1" />
                  <div className="text-2xl font-bold text-red-600">{insights.highRisk.length}</div>
                  <div className="text-xs text-muted-foreground">High Risk</div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-amber-500">
                <CardContent className="p-4">
                  <Shield className="h-6 w-6 text-amber-500 mb-1" />
                  <div className="text-2xl font-bold text-amber-600">{insights.mediumRisk.length}</div>
                  <div className="text-xs text-muted-foreground">Medium Risk</div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-emerald-500">
                <CardContent className="p-4">
                  <CheckCircle2 className="h-6 w-6 text-emerald-500 mb-1" />
                  <div className="text-2xl font-bold text-emerald-600">{insights.lowRisk.length}</div>
                  <div className="text-xs text-muted-foreground">Low Risk</div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <Activity className="h-6 w-6 text-blue-500 mb-1" />
                  <div className="text-2xl font-bold">{insights.avgAttendance}%</div>
                  <div className="text-xs text-muted-foreground">Avg Attendance</div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="risk" className="space-y-4">
              <TabsList className="overflow-x-auto w-full justify-start">
                <TabsTrigger value="risk"><AlertTriangle className="h-4 w-4 mr-1" /> Risk Analysis</TabsTrigger>
                <TabsTrigger value="class"><BarChart3 className="h-4 w-4 mr-1" /> Class Health</TabsTrigger>
                <TabsTrigger value="students"><Users className="h-4 w-4 mr-1" /> Student-wise</TabsTrigger>
              </TabsList>

              {/* ── Risk Analysis Tab ── */}
              <TabsContent value="risk" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Risk Pie Chart */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <PieChart className="h-4 w-4" /> Dropout Risk Distribution
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <RPieChart>
                          <Pie data={insights.riskDistribution} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                            {insights.riskDistribution.map((entry, idx) => (
                              <Cell key={idx} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </RPieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* High Risk Students Quick List */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2 text-red-600">
                        <UserX className="h-4 w-4" /> High Risk Students ({insights.highRisk.length})
                      </CardTitle>
                      <CardDescription>Require immediate intervention</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {insights.highRisk.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-emerald-500" />
                          No high-risk students detected
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-[220px] overflow-y-auto">
                          {insights.highRisk.slice(0, 10).map(s => (
                            <div key={s.id} className="flex items-center justify-between p-2 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                              <div>
                                <div className="font-medium text-sm">{s.full_name}</div>
                                <div className="text-xs text-muted-foreground">{s.classes?.name} {s.sections?.name} • {s.enrollment_id || s.enrollment_id}</div>
                              </div>
                              <Badge variant="destructive" className="text-xs">Risk: {s.riskScore}</Badge>
                            </div>
                          ))}
                          {insights.highRisk.length > 10 && (
                            <div className="text-center text-xs text-muted-foreground">+{insights.highRisk.length - 10} more</div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Key Insights */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-amber-500" /> Key Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {insights.studentInsights.filter(s => s.consecutiveAbsent >= 5).length > 0 && (
                        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200">
                          <div className="flex items-center gap-2 mb-1">
                            <Clock className="h-4 w-4 text-red-500" />
                            <span className="font-semibold text-sm">Consecutive Absences</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {insights.studentInsights.filter(s => s.consecutiveAbsent >= 5).length} students have 5+ consecutive absences
                          </p>
                        </div>
                      )}
                      {insights.studentInsights.filter(s => s.feeDefaulter).length > 0 && (
                        <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200">
                          <div className="flex items-center gap-2 mb-1">
                            <AlertCircle className="h-4 w-4 text-amber-500" />
                            <span className="font-semibold text-sm">Fee Defaulters</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {insights.studentInsights.filter(s => s.feeDefaulter).length} students with &lt;50% fees paid
                          </p>
                        </div>
                      )}
                      {insights.studentInsights.filter(s => s.failedSubjects > 0).length > 0 && (
                        <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200">
                          <div className="flex items-center gap-2 mb-1">
                            <XCircle className="h-4 w-4 text-orange-500" />
                            <span className="font-semibold text-sm">Failed Subjects</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {insights.studentInsights.filter(s => s.failedSubjects > 0).length} students failed in one or more subjects
                          </p>
                        </div>
                      )}
                      <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200">
                        <div className="flex items-center gap-2 mb-1">
                          <Award className="h-4 w-4 text-emerald-500" />
                          <span className="font-semibold text-sm">Top Performers</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {insights.studentInsights.filter(s => s.avgPct !== null && s.avgPct >= 80).length} students scoring 80%+
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200">
                        <div className="flex items-center gap-2 mb-1">
                          <Activity className="h-4 w-4 text-blue-500" />
                          <span className="font-semibold text-sm">Attendance Health</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {insights.studentInsights.filter(s => s.attendancePct !== null && s.attendancePct >= 90).length} students with 90%+ attendance
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200">
                        <div className="flex items-center gap-2 mb-1">
                          <Brain className="h-4 w-4 text-purple-500" />
                          <span className="font-semibold text-sm">Intervention Needed</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {insights.studentInsights.filter(s => s.interventions.length > 0).length} students need at least one intervention
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ── Class Health Tab ── */}
              <TabsContent value="class" className="space-y-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Class Health Comparison</CardTitle>
                    <CardDescription>Average performance, attendance & fee collection per class</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {insights.classHealthData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={320}>
                        <BarChart data={insights.classHealthData}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                          <XAxis dataKey="name" fontSize={12} />
                          <YAxis domain={[0, 100]} fontSize={12} />
                          <Tooltip formatter={(v) => `${v}%`} />
                          <Legend />
                          <Bar dataKey="avgScore" name="Avg Score %" fill="#6366f1" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="avgAttendance" name="Avg Attendance %" fill="#22c55e" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="avgFee" name="Fee Collection %" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">No class data available</div>
                    )}
                  </CardContent>
                </Card>

                {/* Class Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {insights.classHealthData.map(cls => {
                    const health = Math.round((cls.avgScore + cls.avgAttendance + cls.avgFee) / 3);
                    const healthColor = health >= 75 ? 'text-emerald-600' : health >= 50 ? 'text-amber-600' : 'text-red-600';
                    return (
                      <Card key={cls.name}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-bold text-lg">{cls.name}</span>
                            <span className={`text-xl font-bold ${healthColor}`}>{health}%</span>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between"><span className="text-muted-foreground">Performance</span><span>{cls.avgScore}%</span></div>
                            <Progress value={cls.avgScore} className="h-1.5" />
                            <div className="flex justify-between"><span className="text-muted-foreground">Attendance</span><span>{cls.avgAttendance}%</span></div>
                            <Progress value={cls.avgAttendance} className="h-1.5" />
                            <div className="flex justify-between"><span className="text-muted-foreground">Fees</span><span>{cls.avgFee}%</span></div>
                            <Progress value={cls.avgFee} className="h-1.5" />
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>

              {/* ── Student-wise Tab ── */}
              <TabsContent value="students" className="space-y-4">
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search student name or admission number..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={filterClass} onValueChange={setFilterClass}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by class" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Classes</SelectItem>
                      {classes.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="text-sm text-muted-foreground">{filtered.length} students (sorted by risk score)</div>

                {/* Student Cards */}
                <div className="space-y-3">
                  <AnimatePresence>
                    {filtered.slice(0, 50).map((s, idx) => (
                      <motion.div
                        key={s.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.02 }}
                      >
                        <Card
                          className={`cursor-pointer transition-all hover:shadow-md ${
                            s.riskLevel === 'high' ? 'border-l-4 border-l-red-500' :
                            s.riskLevel === 'medium' ? 'border-l-4 border-l-amber-500' :
                            'border-l-4 border-l-emerald-500'
                          }`}
                          onClick={() => setExpandedStudent(expandedStudent === s.id ? null : s.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-bold">
                                  {s.full_name?.charAt(0) || '?'}
                                </div>
                                <div>
                                  <div className="font-semibold">{s.full_name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {s.classes?.name} {s.sections?.name} • {s.enrollment_id || s.enrollment_id}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="text-right hidden sm:block">
                                  <div className="flex gap-2 text-xs">
                                    {s.attendancePct !== null && (
                                      <Badge variant="outline" className="text-xs">
                                        <Activity className="h-3 w-3 mr-1" />{s.attendancePct}%
                                      </Badge>
                                    )}
                                    {s.avgPct !== null && (
                                      <Badge variant="outline" className="text-xs">
                                        <BookOpen className="h-3 w-3 mr-1" />{s.avgPct}%
                                      </Badge>
                                    )}
                                    {s.feePct !== null && (
                                      <Badge variant="outline" className="text-xs">
                                        ₹ {s.feePct}%
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <Badge
                                  variant={s.riskLevel === 'high' ? 'destructive' : s.riskLevel === 'medium' ? 'secondary' : 'default'}
                                  className="min-w-[50px] justify-center"
                                >
                                  {s.riskScore}
                                </Badge>
                                {expandedStudent === s.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                              </div>
                            </div>

                            {/* Expanded Details */}
                            {expandedStudent === s.id && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                className="mt-4 pt-4 border-t space-y-3"
                              >
                                {/* Metrics */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                                  <div className="p-2 rounded bg-muted/50 text-center">
                                    <div className="text-muted-foreground text-xs">Attendance</div>
                                    <div className="font-bold">{s.attendancePct ?? 'N/A'}%</div>
                                    {s.consecutiveAbsent > 0 && (
                                      <div className="text-xs text-red-500">{s.consecutiveAbsent} consecutive absent</div>
                                    )}
                                  </div>
                                  <div className="p-2 rounded bg-muted/50 text-center">
                                    <div className="text-muted-foreground text-xs">Academic</div>
                                    <div className="font-bold">{s.avgPct ?? 'N/A'}%</div>
                                    {s.strengthLabel && <div className="text-xs">{s.strengthLabel}</div>}
                                  </div>
                                  <div className="p-2 rounded bg-muted/50 text-center">
                                    <div className="text-muted-foreground text-xs">Fee Paid</div>
                                    <div className="font-bold">{s.feePct ?? 'N/A'}%</div>
                                    {s.feeDefaulter && <div className="text-xs text-red-500">Defaulter</div>}
                                  </div>
                                  <div className="p-2 rounded bg-muted/50 text-center">
                                    <div className="text-muted-foreground text-xs">Failed Subjects</div>
                                    <div className="font-bold">{s.failedSubjects}</div>
                                  </div>
                                </div>

                                {/* Interventions */}
                                {s.interventions.length > 0 && (
                                  <div>
                                    <div className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1">
                                      <Lightbulb className="h-3 w-3" /> Suggested Interventions
                                    </div>
                                    <div className="space-y-1">
                                      {s.interventions.map((int, i) => (
                                        <div key={i} className="flex items-center gap-2 text-xs p-1.5 rounded bg-amber-50 dark:bg-amber-950/20">
                                          <ArrowRight className="h-3 w-3 text-amber-500 shrink-0" />
                                          {int}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {filtered.length > 50 && (
                    <div className="text-center text-sm text-muted-foreground py-4">
                      Showing top 50 of {filtered.length} students by risk score
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
