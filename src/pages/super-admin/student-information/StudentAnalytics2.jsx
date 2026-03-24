import React, { useState, useEffect, useCallback, useMemo } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart3, TrendingDown, TrendingUp, AlertTriangle, Heart, Users, GraduationCap,
  Loader2, Shield, IndianRupee, Activity, Target, PieChart, ArrowUpDown
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  PieChart as RePieChart, Pie, Cell
} from 'recharts';
import { cn } from '@/lib/utils';

const COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

export default function StudentAnalytics2() {
  const { currentSessionId, organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('risk');

  // Data
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [feeAllocations, setFeeAllocations] = useState([]);
  const [feePayments, setFeePayments] = useState([]);
  const [examMarks, setExamMarks] = useState([]);
  const [classes, setClasses] = useState([]);

  const branchId = selectedBranch?.id;

  // Fetch all data
  const fetchData = useCallback(async () => {
    if (!branchId || !currentSessionId) return;
    setLoading(true);
    try {
      const [studRes, attRes, allocRes, payRes, markRes, classRes] = await Promise.all([
        supabase.from('student_profiles')
          .select('id, full_name, class_id, section_id, gender, admission_date, category_id, is_disabled, classes(name), sections(name), student_categories(name)')
          .eq('branch_id', branchId).eq('session_id', currentSessionId).or('is_disabled.is.null,is_disabled.eq.false'),
        supabase.from('student_attendance')
          .select('student_id, status, date')
          .eq('branch_id', branchId).eq('session_id', currentSessionId),
        supabase.from('student_fee_allocations')
          .select('student_id, fee_master:fee_masters(amount)')
          .eq('branch_id', branchId).eq('session_id', currentSessionId),
        supabase.from('fee_payments')
          .select('student_id, amount')
          .eq('branch_id', branchId).eq('session_id', currentSessionId).is('reverted_at', null),
        supabase.from('exam_marks')
          .select('student_id, marks, is_absent, exam_subjects(max_marks, subjects(name))')
          .not('is_absent', 'eq', true),
        supabase.from('classes')
          .select('id, name').eq('branch_id', branchId).or(`session_id.eq.${currentSessionId},session_id.is.null`).order('display_order'),
      ]);

      setStudents(studRes.data || []);
      setAttendance(attRes.data || []);
      setFeeAllocations(allocRes.data || []);
      setFeePayments(payRes.data || []);
      setExamMarks(markRes.data || []);
      setClasses(classRes.data || []);
    } catch (err) {
      console.error('Analytics fetch error:', err);
    }
    setLoading(false);
  }, [branchId, currentSessionId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ═══════════════════════════════════════════
  // COMPUTED ANALYTICS
  // ═══════════════════════════════════════════

  // Per-student attendance %
  const studentAttendance = useMemo(() => {
    const map = {};
    attendance.forEach(a => {
      if (!map[a.student_id]) map[a.student_id] = { total: 0, present: 0 };
      map[a.student_id].total++;
      if (['present', 'late', 'half_day'].includes(a.status)) map[a.student_id].present++;
    });
    const result = {};
    Object.entries(map).forEach(([sid, d]) => {
      result[sid] = d.total > 0 ? Math.round((d.present / d.total) * 100) : null;
    });
    return result;
  }, [attendance]);

  // Per-student fee paid %
  const studentFees = useMemo(() => {
    const allocated = {};
    feeAllocations.forEach(a => {
      allocated[a.student_id] = (allocated[a.student_id] || 0) + parseFloat(a.fee_master?.amount || 0);
    });
    const paid = {};
    feePayments.forEach(p => {
      paid[p.student_id] = (paid[p.student_id] || 0) + (p.amount || 0);
    });
    const result = {};
    Object.keys(allocated).forEach(sid => {
      const alloc = allocated[sid] || 0;
      const pd = paid[sid] || 0;
      result[sid] = { allocated: alloc, paid: pd, pct: alloc > 0 ? Math.round((pd / alloc) * 100) : 100 };
    });
    return result;
  }, [feeAllocations, feePayments]);

  // Per-student average marks %
  const studentMarks = useMemo(() => {
    const map = {};
    examMarks.forEach(m => {
      if (!map[m.student_id]) map[m.student_id] = { totalObtained: 0, totalMax: 0 };
      map[m.student_id].totalObtained += (m.marks || 0);
      map[m.student_id].totalMax += (m.exam_subjects?.max_marks || 100);
    });
    const result = {};
    Object.entries(map).forEach(([sid, d]) => {
      result[sid] = d.totalMax > 0 ? Math.round((d.totalObtained / d.totalMax) * 100) : null;
    });
    return result;
  }, [examMarks]);

  // ═══════════════════════════════════════════
  // DROPOUT RISK SCORING
  // ═══════════════════════════════════════════
  const riskStudents = useMemo(() => {
    return students.map(s => {
      let riskScore = 0;
      let factors = [];

      const att = studentAttendance[s.id];
      if (att !== null && att !== undefined) {
        if (att < 50) { riskScore += 40; factors.push('Very low attendance'); }
        else if (att < 75) { riskScore += 25; factors.push('Low attendance'); }
        else if (att < 85) { riskScore += 10; factors.push('Below avg attendance'); }
      }

      const fee = studentFees[s.id];
      if (fee) {
        if (fee.pct < 25) { riskScore += 30; factors.push('Major fee default'); }
        else if (fee.pct < 50) { riskScore += 20; factors.push('Fee default'); }
        else if (fee.pct < 75) { riskScore += 10; factors.push('Partial fee pending'); }
      }

      const marks = studentMarks[s.id];
      if (marks !== null && marks !== undefined) {
        if (marks < 35) { riskScore += 30; factors.push('Failing marks'); }
        else if (marks < 50) { riskScore += 15; factors.push('Low marks'); }
      }

      return {
        ...s,
        riskScore: Math.min(riskScore, 100),
        riskLevel: riskScore >= 60 ? 'high' : riskScore >= 30 ? 'medium' : 'low',
        factors,
        attendancePct: att,
        feePct: fee?.pct,
        marksPct: marks,
      };
    }).sort((a, b) => b.riskScore - a.riskScore);
  }, [students, studentAttendance, studentFees, studentMarks]);

  const highRisk = riskStudents.filter(s => s.riskLevel === 'high');
  const medRisk = riskStudents.filter(s => s.riskLevel === 'medium');

  // ═══════════════════════════════════════════
  // CLASS HEALTH SCORE
  // ═══════════════════════════════════════════
  const classHealth = useMemo(() => {
    const classMap = {};
    students.forEach(s => {
      const cname = s.classes?.name || 'Unknown';
      if (!classMap[cname]) classMap[cname] = { students: 0, totalAtt: 0, attCount: 0, totalFee: 0, feeCount: 0, totalMarks: 0, marksCount: 0 };
      classMap[cname].students++;

      const att = studentAttendance[s.id];
      if (att !== null && att !== undefined) { classMap[cname].totalAtt += att; classMap[cname].attCount++; }

      const fee = studentFees[s.id];
      if (fee) { classMap[cname].totalFee += fee.pct; classMap[cname].feeCount++; }

      const marks = studentMarks[s.id];
      if (marks !== null && marks !== undefined) { classMap[cname].totalMarks += marks; classMap[cname].marksCount++; }
    });

    return Object.entries(classMap).map(([name, d]) => {
      const avgAtt = d.attCount > 0 ? Math.round(d.totalAtt / d.attCount) : 0;
      const avgFee = d.feeCount > 0 ? Math.round(d.totalFee / d.feeCount) : 0;
      const avgMarks = d.marksCount > 0 ? Math.round(d.totalMarks / d.marksCount) : 0;
      const health = Math.round((avgAtt * 0.35 + avgFee * 0.3 + avgMarks * 0.35));
      return { name, students: d.students, avgAtt, avgFee, avgMarks, health };
    }).sort((a, b) => b.health - a.health);
  }, [students, studentAttendance, studentFees, studentMarks]);

  // ═══════════════════════════════════════════
  // DEMOGRAPHIC ANALYSIS
  // ═══════════════════════════════════════════
  const demographics = useMemo(() => {
    const genderData = {};
    const categoryData = {};
    students.forEach(s => {
      const g = s.gender || 'Unknown';
      genderData[g] = (genderData[g] || 0) + 1;
      const c = s.student_categories?.name || 'General';
      categoryData[c] = (categoryData[c] || 0) + 1;
    });
    return {
      gender: Object.entries(genderData).map(([name, value]) => ({ name, value })),
      category: Object.entries(categoryData).map(([name, value]) => ({ name, value })),
    };
  }, [students]);

  // ═══════════════════════════════════════════
  // FEE DEFAULTER CORRELATION
  // ═══════════════════════════════════════════
  const feeCorrelation = useMemo(() => {
    const defaulters = riskStudents.filter(s => (s.feePct || 100) < 50);
    const payers = riskStudents.filter(s => (s.feePct || 100) >= 75);
    const avgAttDefault = defaulters.length > 0 ? Math.round(defaulters.reduce((sum, s) => sum + (s.attendancePct || 0), 0) / defaulters.length) : 0;
    const avgAttPayer = payers.length > 0 ? Math.round(payers.reduce((sum, s) => sum + (s.attendancePct || 0), 0) / payers.length) : 0;
    const avgMarksDefault = defaulters.length > 0 ? Math.round(defaulters.reduce((sum, s) => sum + (s.marksPct || 0), 0) / defaulters.length) : 0;
    const avgMarksPayer = payers.length > 0 ? Math.round(payers.reduce((sum, s) => sum + (s.marksPct || 0), 0) / payers.length) : 0;
    return [
      { metric: 'Attendance %', defaulters: avgAttDefault, payers: avgAttPayer },
      { metric: 'Marks %', defaulters: avgMarksDefault, payers: avgMarksPayer },
      { metric: 'Count', defaulters: defaulters.length, payers: payers.length },
    ];
  }, [riskStudents]);

  const riskBadge = (level) => {
    const styles = { high: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400', medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400', low: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400' };
    return <Badge className={cn('text-xs', styles[level])}>{level.toUpperCase()}</Badge>;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-7 w-7 text-primary" /> Student Analytics 2.0
          </h1>
          <p className="text-muted-foreground mt-1">Advanced intelligence — Dropout risk, Class health, Correlations</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'Total Students', value: students.length, icon: Users, color: 'text-blue-600' },
            { label: 'High Risk', value: highRisk.length, icon: AlertTriangle, color: 'text-red-600' },
            { label: 'Medium Risk', value: medRisk.length, icon: Shield, color: 'text-yellow-600' },
            { label: 'Avg Attendance', value: `${classHealth.length > 0 ? Math.round(classHealth.reduce((s, c) => s + c.avgAtt, 0) / classHealth.length) : 0}%`, icon: Activity, color: 'text-green-600' },
            { label: 'Fee Collection', value: `${classHealth.length > 0 ? Math.round(classHealth.reduce((s, c) => s + c.avgFee, 0) / classHealth.length) : 0}%`, icon: IndianRupee, color: 'text-purple-600' },
          ].map((s, i) => (
            <Card key={i}>
              <CardContent className="p-4 flex items-center gap-3">
                <s.icon className={cn('h-8 w-8', s.color)} />
                <div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="risk"><AlertTriangle className="h-4 w-4 mr-1" /> Dropout Risk</TabsTrigger>
            <TabsTrigger value="health"><Heart className="h-4 w-4 mr-1" /> Class Health</TabsTrigger>
            <TabsTrigger value="demographics"><PieChart className="h-4 w-4 mr-1" /> Demographics</TabsTrigger>
            <TabsTrigger value="correlation"><ArrowUpDown className="h-4 w-4 mr-1" /> Fee Correlation</TabsTrigger>
          </TabsList>

          {/* ===== DROPOUT RISK TAB ===== */}
          <TabsContent value="risk" className="mt-4 space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Risk Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Risk Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <RePieChart>
                      <Pie
                        data={[
                          { name: 'High Risk', value: highRisk.length },
                          { name: 'Medium Risk', value: medRisk.length },
                          { name: 'Low Risk', value: students.length - highRisk.length - medRisk.length },
                        ]}
                        cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, value }) => `${name}: ${value}`}
                      >
                        <Cell fill="#ef4444" />
                        <Cell fill="#f59e0b" />
                        <Cell fill="#22c55e" />
                      </Pie>
                      <Tooltip />
                    </RePieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* High Risk List */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" /> High Risk Students ({highRisk.length})
                  </CardTitle>
                  <CardDescription>Students most likely to drop out based on attendance, fees, and marks</CardDescription>
                </CardHeader>
                <CardContent>
                  {highRisk.length === 0 ? (
                    <p className="text-center text-muted-foreground py-6">No high-risk students detected</p>
                  ) : (
                    <div className="max-h-[300px] overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50 sticky top-0">
                          <tr>
                            <th className="py-2 px-3 text-left">Student</th>
                            <th className="py-2 px-3 text-left">Class</th>
                            <th className="py-2 px-3 text-center">Risk</th>
                            <th className="py-2 px-3 text-center">Att%</th>
                            <th className="py-2 px-3 text-center">Fee%</th>
                            <th className="py-2 px-3 text-center">Marks%</th>
                            <th className="py-2 px-3 text-left">Factors</th>
                          </tr>
                        </thead>
                        <tbody>
                          {highRisk.slice(0, 20).map(s => (
                            <tr key={s.id} className="border-b hover:bg-red-50/30 dark:hover:bg-red-950/30">
                              <td className="py-2 px-3 font-medium">{s.full_name}</td>
                              <td className="py-2 px-3">{s.classes?.name} {s.sections?.name}</td>
                              <td className="py-2 px-3 text-center">
                                <Badge variant="destructive" className="text-xs">{s.riskScore}%</Badge>
                              </td>
                              <td className="py-2 px-3 text-center">{s.attendancePct ?? '-'}</td>
                              <td className="py-2 px-3 text-center">{s.feePct ?? '-'}</td>
                              <td className="py-2 px-3 text-center">{s.marksPct ?? '-'}</td>
                              <td className="py-2 px-3 text-xs text-muted-foreground">{s.factors.join(', ')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Medium Risk */}
            {medRisk.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="h-4 w-4 text-yellow-500" /> Medium Risk Students ({medRisk.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-h-[200px] overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 sticky top-0">
                        <tr>
                          <th className="py-2 px-3 text-left">Student</th>
                          <th className="py-2 px-3 text-left">Class</th>
                          <th className="py-2 px-3 text-center">Risk</th>
                          <th className="py-2 px-3 text-left">Factors</th>
                        </tr>
                      </thead>
                      <tbody>
                        {medRisk.slice(0, 15).map(s => (
                          <tr key={s.id} className="border-b">
                            <td className="py-2 px-3 font-medium">{s.full_name}</td>
                            <td className="py-2 px-3">{s.classes?.name} {s.sections?.name}</td>
                            <td className="py-2 px-3 text-center"><Badge className="text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400">{s.riskScore}%</Badge></td>
                            <td className="py-2 px-3 text-xs text-muted-foreground">{s.factors.join(', ')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ===== CLASS HEALTH TAB ===== */}
          <TabsContent value="health" className="mt-4 space-y-4">
            {/* Radar Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Class Health Radar</CardTitle>
                  <CardDescription>Attendance, Fee Collection, and Marks per class</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={classHealth.slice(0, 8)}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} />
                      <Radar name="Attendance" dataKey="avgAtt" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                      <Radar name="Fee %" dataKey="avgFee" stroke="#22c55e" fill="#22c55e" fillOpacity={0.2} />
                      <Radar name="Marks" dataKey="avgMarks" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} />
                      <Legend />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Health Score Ranking</CardTitle>
                  <CardDescription>Composite score: 35% attendance + 30% fees + 35% marks</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={classHealth} layout="vertical" margin={{ left: 50 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, 100]} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="health" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Class Details Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Class-wise Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="py-2 px-3 text-left">Class</th>
                      <th className="py-2 px-3 text-center">Students</th>
                      <th className="py-2 px-3 text-center">Avg Attendance</th>
                      <th className="py-2 px-3 text-center">Fee Collection</th>
                      <th className="py-2 px-3 text-center">Avg Marks</th>
                      <th className="py-2 px-3 text-center">Health Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classHealth.map(c => (
                      <tr key={c.name} className="border-b">
                        <td className="py-2 px-3 font-medium">{c.name}</td>
                        <td className="py-2 px-3 text-center">{c.students}</td>
                        <td className="py-2 px-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Progress value={c.avgAtt} className="w-16 h-2" />
                            <span className="text-xs">{c.avgAtt}%</span>
                          </div>
                        </td>
                        <td className="py-2 px-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Progress value={c.avgFee} className="w-16 h-2" />
                            <span className="text-xs">{c.avgFee}%</span>
                          </div>
                        </td>
                        <td className="py-2 px-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Progress value={c.avgMarks} className="w-16 h-2" />
                            <span className="text-xs">{c.avgMarks}%</span>
                          </div>
                        </td>
                        <td className="py-2 px-3 text-center">
                          <Badge className={cn('text-xs', c.health >= 70 ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400' : c.health >= 50 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400' : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400')}>
                            {c.health}%
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== DEMOGRAPHICS TAB ===== */}
          <TabsContent value="demographics" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Gender Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <RePieChart>
                      <Pie data={demographics.gender} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                        {demographics.gender.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </RePieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Category Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={demographics.category}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ===== FEE CORRELATION TAB ===== */}
          <TabsContent value="correlation" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Fee Default vs Performance Correlation</CardTitle>
                <CardDescription>Comparing fee defaulters (&lt;50% paid) vs regular payers (&gt;75% paid)</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={feeCorrelation}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="metric" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="defaulters" name="Fee Defaulters (<50%)" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="payers" name="Regular Payers (>75%)" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {feeCorrelation.map((fc, i) => (
                <Card key={i}>
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-muted-foreground mb-2">{fc.metric}</p>
                    <div className="flex items-center justify-center gap-6">
                      <div>
                        <p className="text-xl font-bold text-red-600">{fc.defaulters}</p>
                        <p className="text-xs text-muted-foreground">Defaulters</p>
                      </div>
                      <div className="text-muted-foreground">vs</div>
                      <div>
                        <p className="text-xl font-bold text-green-600">{fc.payers}</p>
                        <p className="text-xs text-muted-foreground">Payers</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
