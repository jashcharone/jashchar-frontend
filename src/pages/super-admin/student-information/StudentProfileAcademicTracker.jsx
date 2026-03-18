import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import {
  Loader2, TrendingUp, TrendingDown, Minus, Award, BookOpen,
  BarChart3, Target, Star, Medal, AlertCircle, CheckCircle2, XCircle
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';

export default function StudentProfileAcademicTracker({ studentId }) {
  const { currentSessionId } = useAuth();
  const { selectedBranch } = useBranch();

  const [marks, setMarks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMarks = useCallback(async () => {
    if (!studentId || !selectedBranch?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('exam_marks_v2')
        .select(`
          id, total_marks, percentage, grade, grade_point, is_absent,
          status, marks_theory, marks_practical,
          exam_subjects (
            id, max_marks, pass_marks,
            subjects ( id, name ),
            exams ( id, name, exam_date, 
              exam_terms ( id, name, display_order )
            )
          )
        `)
        .eq('student_id', studentId)
        .eq('branch_id', selectedBranch.id)
        .in('status', ['submitted', 'verified', 'locked']);

      if (error) throw error;
      setMarks(data || []);
    } catch (err) {
      console.error('Error fetching academic marks:', err);
    } finally {
      setLoading(false);
    }
  }, [studentId, selectedBranch]);

  useEffect(() => { fetchMarks(); }, [fetchMarks]);

  // ─── Derived Data ───
  const analytics = useMemo(() => {
    if (!marks.length) return null;

    // Group by exam
    const examMap = {};
    const subjectMap = {};

    marks.forEach(m => {
      const es = m.exam_subjects;
      if (!es) return;
      const examName = es.exams?.name || 'Unknown';
      const examTermOrder = es.exams?.exam_terms?.display_order || 0;
      const subjectName = es.subjects?.name || 'Unknown';
      const maxMarks = es.max_marks || 100;
      const passMarks = es.pass_marks || 35;
      const pct = maxMarks > 0 ? ((m.total_marks || 0) / maxMarks) * 100 : 0;
      const passed = (m.total_marks || 0) >= passMarks && !m.is_absent;

      if (!examMap[examName]) {
        examMap[examName] = { name: examName, order: examTermOrder, subjects: [], totalMarks: 0, totalMax: 0, passed: 0, failed: 0 };
      }
      examMap[examName].subjects.push({ subject: subjectName, marks: m.total_marks || 0, max: maxMarks, pct, grade: m.grade, passed });
      examMap[examName].totalMarks += (m.total_marks || 0);
      examMap[examName].totalMax += maxMarks;
      if (passed) examMap[examName].passed++; else examMap[examName].failed++;

      if (!subjectMap[subjectName]) subjectMap[subjectName] = [];
      subjectMap[subjectName].push({ exam: examName, order: examTermOrder, marks: m.total_marks || 0, max: maxMarks, pct, grade: m.grade });
    });

    // Sort exams by term order
    const exams = Object.values(examMap).sort((a, b) => a.order - b.order);

    // Subject strength
    const subjects = Object.entries(subjectMap).map(([name, entries]) => {
      const avgPct = entries.reduce((s, e) => s + e.pct, 0) / entries.length;
      const trend = entries.length >= 2
        ? entries.sort((a, b) => a.order - b.order).slice(-1)[0].pct - entries.sort((a, b) => a.order - b.order).slice(-2)[0].pct
        : 0;
      return { name, avgPct: Math.round(avgPct * 10) / 10, trend: Math.round(trend * 10) / 10, entries };
    }).sort((a, b) => b.avgPct - a.avgPct);

    // Overall
    const totalMarks = marks.reduce((s, m) => s + (m.total_marks || 0), 0);
    const totalMax = marks.reduce((s, m) => s + (m.exam_subjects?.max_marks || 100), 0);
    const overallPct = totalMax > 0 ? Math.round((totalMarks / totalMax) * 100 * 10) / 10 : 0;

    // Trend chart data (exam-wise percentage)
    const trendData = exams.map(e => ({
      name: e.name.length > 12 ? e.name.substring(0, 12) + '...' : e.name,
      percentage: e.totalMax > 0 ? Math.round((e.totalMarks / e.totalMax) * 100 * 10) / 10 : 0,
    }));

    // Radar data (subject strength)
    const radarData = subjects.slice(0, 8).map(s => ({
      subject: s.name.length > 10 ? s.name.substring(0, 10) + '...' : s.name,
      percentage: s.avgPct,
    }));

    return { exams, subjects, overallPct, totalMarks, totalMax, trendData, radarData, totalExams: exams.length };
  }, [marks]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading academic data...
      </div>
    );
  }

  if (!analytics || marks.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-40" />
        <p className="font-medium">No exam results available yet</p>
        <p className="text-sm mt-1">Marks data will appear here once exams are evaluated</p>
      </div>
    );
  }

  const getStrengthColor = (pct) => {
    if (pct >= 80) return 'text-emerald-600';
    if (pct >= 60) return 'text-blue-600';
    if (pct >= 40) return 'text-amber-600';
    return 'text-red-600';
  };

  const getStrengthBg = (pct) => {
    if (pct >= 80) return 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200';
    if (pct >= 60) return 'bg-blue-50 dark:bg-blue-950/30 border-blue-200';
    if (pct >= 40) return 'bg-amber-50 dark:bg-amber-950/30 border-amber-200';
    return 'bg-red-50 dark:bg-red-950/30 border-red-200';
  };

  const getGradeColor = (pct) => {
    if (pct >= 90) return 'default';
    if (pct >= 75) return 'secondary';
    if (pct >= 40) return 'outline';
    return 'destructive';
  };

  return (
    <div className="space-y-6">
      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Target className="h-7 w-7 mx-auto text-primary mb-1" />
            <div className="text-2xl font-bold">{analytics.overallPct}%</div>
            <div className="text-xs text-muted-foreground">Overall</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <BookOpen className="h-7 w-7 mx-auto text-blue-500 mb-1" />
            <div className="text-2xl font-bold">{analytics.totalExams}</div>
            <div className="text-xs text-muted-foreground">Exams</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Star className="h-7 w-7 mx-auto text-emerald-500 mb-1" />
            <div className="text-2xl font-bold">{analytics.subjects.filter(s => s.avgPct >= 80).length}</div>
            <div className="text-xs text-muted-foreground">Strong Subjects</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <AlertCircle className="h-7 w-7 mx-auto text-red-500 mb-1" />
            <div className="text-2xl font-bold">{analytics.subjects.filter(s => s.avgPct < 40).length}</div>
            <div className="text-xs text-muted-foreground">Weak Subjects</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="subjects">Subject Analysis</TabsTrigger>
          <TabsTrigger value="exams">Exam Details</TabsTrigger>
        </TabsList>

        {/* ── Overview Tab ── */}
        <TabsContent value="overview" className="space-y-6">
          {/* Trend Chart */}
          {analytics.trendData.length > 1 && (
            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" /> Performance Trend
                </h4>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={analytics.trendData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="name" fontSize={12} />
                    <YAxis domain={[0, 100]} fontSize={12} />
                    <Tooltip formatter={(v) => [`${v}%`, 'Percentage']} />
                    <Line type="monotone" dataKey="percentage" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Radar Chart */}
          {analytics.radarData.length >= 3 && (
            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" /> Subject Strength Map
                </h4>
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={analytics.radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" fontSize={11} />
                    <PolarRadiusAxis domain={[0, 100]} fontSize={10} />
                    <Radar dataKey="percentage" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Subject Analysis Tab ── */}
        <TabsContent value="subjects" className="space-y-3">
          {analytics.subjects.map(subj => (
            <Card key={subj.name} className={`border ${getStrengthBg(subj.avgPct)}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{subj.name}</span>
                    <Badge variant={getGradeColor(subj.avgPct)}>{Math.round(subj.avgPct)}%</Badge>
                    {subj.trend > 0 && <TrendingUp className="h-4 w-4 text-emerald-500" />}
                    {subj.trend < 0 && <TrendingDown className="h-4 w-4 text-red-500" />}
                    {subj.trend === 0 && <Minus className="h-4 w-4 text-muted-foreground" />}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {subj.trend > 0 ? `+${subj.trend}%` : subj.trend < 0 ? `${subj.trend}%` : 'Stable'}
                  </span>
                </div>
                <Progress value={subj.avgPct} className="h-2 mb-2" />
                <div className="flex gap-2 flex-wrap text-xs text-muted-foreground">
                  {subj.entries.sort((a, b) => a.order - b.order).map((e, i) => (
                    <span key={i} className="bg-background/50 px-2 py-0.5 rounded">
                      {e.exam}: {e.marks}/{e.max} {e.grade && `(${e.grade})`}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
          {analytics.subjects.length > 0 && (
            <div className="text-xs text-muted-foreground text-center pt-2">
              {analytics.subjects.filter(s => s.avgPct >= 80).length > 0 && (
                <span className="text-emerald-600">
                  Strong: {analytics.subjects.filter(s => s.avgPct >= 80).map(s => s.name).join(', ')}
                </span>
              )}
              {analytics.subjects.filter(s => s.avgPct < 40).length > 0 && (
                <span className="text-red-500 ml-4">
                  Needs Improvement: {analytics.subjects.filter(s => s.avgPct < 40).map(s => s.name).join(', ')}
                </span>
              )}
            </div>
          )}
        </TabsContent>

        {/* ── Exam Details Tab ── */}
        <TabsContent value="exams" className="space-y-4">
          {analytics.exams.map(exam => {
            const examPct = exam.totalMax > 0 ? Math.round((exam.totalMarks / exam.totalMax) * 100 * 10) / 10 : 0;
            return (
              <Card key={exam.name}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Award className="h-4 w-4 text-primary" />
                      {exam.name}
                    </h4>
                    <div className="flex items-center gap-2">
                      <Badge variant={getGradeColor(examPct)}>{examPct}%</Badge>
                      <span className="text-sm text-muted-foreground">
                        {exam.totalMarks}/{exam.totalMax}
                      </span>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-muted-foreground">
                          <th className="text-left py-2 pr-4">Subject</th>
                          <th className="text-center py-2 px-2">Marks</th>
                          <th className="text-center py-2 px-2">Max</th>
                          <th className="text-center py-2 px-2">%</th>
                          <th className="text-center py-2 px-2">Grade</th>
                          <th className="text-center py-2 pl-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {exam.subjects.map((s, i) => (
                          <tr key={i} className="border-b last:border-0">
                            <td className="py-2 pr-4 font-medium">{s.subject}</td>
                            <td className="text-center py-2 px-2">{s.marks}</td>
                            <td className="text-center py-2 px-2 text-muted-foreground">{s.max}</td>
                            <td className={`text-center py-2 px-2 font-medium ${getStrengthColor(s.pct)}`}>
                              {Math.round(s.pct)}%
                            </td>
                            <td className="text-center py-2 px-2">
                              {s.grade && <Badge variant="outline" className="text-xs">{s.grade}</Badge>}
                            </td>
                            <td className="text-center py-2 pl-2">
                              {s.passed ? (
                                <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-500 mx-auto" />
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="text-emerald-600">{exam.passed} passed</span>
                    {exam.failed > 0 && <span className="text-red-500">{exam.failed} failed</span>}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
}
