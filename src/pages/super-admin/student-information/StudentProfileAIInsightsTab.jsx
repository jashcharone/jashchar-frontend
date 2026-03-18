import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import {
  Brain, AlertTriangle, TrendingUp, TrendingDown, Lightbulb,
  Loader2, Activity, BookOpen, ArrowRight, Shield, CheckCircle2
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export default function StudentProfileAIInsightsTab({ studentId }) {
  const { currentSessionId } = useAuth();
  const { selectedBranch } = useBranch();
  const [loading, setLoading] = useState(true);
  const [insight, setInsight] = useState(null);

  const fetchData = useCallback(async () => {
    if (!studentId || !selectedBranch?.id) return;
    setLoading(true);
    try {
      const [attRes, feeRes, marksRes] = await Promise.all([
        supabase
          .from('student_attendance')
          .select('status, date')
          .eq('student_id', studentId)
          .eq('branch_id', selectedBranch.id)
          .eq('session_id', currentSessionId),
        supabase
          .from('fee_assignments')
          .select('total_amount, paid_amount')
          .eq('student_id', studentId)
          .eq('branch_id', selectedBranch.id)
          .eq('session_id', currentSessionId),
        supabase
          .from('exam_marks_v2')
          .select('total_marks, percentage, exam_subjects(max_marks, pass_marks, subjects(name), exams(name, exam_terms(display_order)))')
          .eq('student_id', studentId)
          .eq('branch_id', selectedBranch.id)
          .in('status', ['submitted', 'verified', 'locked']),
      ]);

      const att = attRes.data || [];
      const fees = feeRes.data || [];
      const marks = marksRes.data || [];

      // Attendance
      const totalDays = att.length;
      const present = att.filter(a => a.status === 'present' || a.status === 'late').length;
      const attendancePct = totalDays > 0 ? Math.round((present / totalDays) * 100) : null;

      const sorted = [...att].sort((a, b) => new Date(b.date) - new Date(a.date));
      let consecutiveAbsent = 0;
      for (const a of sorted) { if (a.status === 'absent') consecutiveAbsent++; else break; }

      // Fees
      const totalFee = fees.reduce((s, f) => s + (f.total_amount || 0), 0);
      const paidFee = fees.reduce((s, f) => s + (f.paid_amount || 0), 0);
      const feePct = totalFee > 0 ? Math.round((paidFee / totalFee) * 100) : null;

      // Marks - subject performance
      const subjectMap = {};
      marks.forEach(m => {
        const name = m.exam_subjects?.subjects?.name || 'Unknown';
        const max = m.exam_subjects?.max_marks || 100;
        const pass = m.exam_subjects?.pass_marks || 35;
        const pct = max > 0 ? ((m.total_marks || 0) / max) * 100 : 0;
        if (!subjectMap[name]) subjectMap[name] = [];
        subjectMap[name].push({ pct, passed: (m.total_marks || 0) >= pass });
      });

      const subjects = Object.entries(subjectMap).map(([name, entries]) => {
        const avg = Math.round(entries.reduce((s, e) => s + e.pct, 0) / entries.length);
        const failed = entries.filter(e => !e.passed).length;
        return { name, avg, failed };
      }).sort((a, b) => b.avg - a.avg);

      const avgPct = marks.length > 0
        ? Math.round(marks.reduce((s, m) => s + (m.percentage || 0), 0) / marks.length)
        : null;

      // Risk
      let riskScore = 0;
      if (attendancePct !== null && attendancePct < 50) riskScore += 40;
      else if (attendancePct !== null && attendancePct < 70) riskScore += 25;
      else if (attendancePct !== null && attendancePct < 80) riskScore += 10;
      if (consecutiveAbsent >= 10) riskScore += 20;
      else if (consecutiveAbsent >= 5) riskScore += 10;
      if (feePct !== null && feePct < 50) riskScore += 15;
      if (feePct !== null && feePct < 25) riskScore += 10;
      if (avgPct !== null && avgPct < 35) riskScore += 15;
      else if (avgPct !== null && avgPct < 50) riskScore += 8;

      const riskLevel = riskScore >= 50 ? 'high' : riskScore >= 25 ? 'medium' : 'low';

      // Interventions
      const interventions = [];
      if (attendancePct !== null && attendancePct < 70) interventions.push('Schedule parent meeting for attendance improvement');
      if (consecutiveAbsent >= 5) interventions.push('Immediate home visit recommended');
      if (feePct !== null && feePct < 50) interventions.push('Fee counseling / installment plan needed');
      if (subjects.filter(s => s.failed > 0).length > 0) interventions.push(`Extra coaching for weak subjects: ${subjects.filter(s => s.failed > 0).map(s => s.name).join(', ')}`);
      if (avgPct !== null && avgPct < 40) interventions.push('Enroll in peer tutoring program');
      if (riskScore >= 50) interventions.push('Priority counselor intervention required');

      // Strengths & Weaknesses
      const strongSubjects = subjects.filter(s => s.avg >= 80).map(s => s.name);
      const weakSubjects = subjects.filter(s => s.avg < 40).map(s => s.name);

      // Career suggestion (very basic heuristic)
      let careerHint = null;
      if (subjects.length >= 3) {
        const sciSubs = ['Science', 'Physics', 'Chemistry', 'Biology', 'Mathematics', 'Math', 'Maths'];
        const comSubs = ['Accounts', 'Business Studies', 'Economics', 'Commerce'];
        const sciAvg = subjects.filter(s => sciSubs.some(ss => s.name.toLowerCase().includes(ss.toLowerCase()))).reduce((a, s) => a + s.avg, 0);
        const comAvg = subjects.filter(s => comSubs.some(ss => s.name.toLowerCase().includes(ss.toLowerCase()))).reduce((a, s) => a + s.avg, 0);
        if (sciAvg > comAvg && sciAvg > 0) careerHint = 'Science stream shows strength';
        else if (comAvg > 0) careerHint = 'Commerce/Business aptitude detected';
      }

      setInsight({
        attendancePct, consecutiveAbsent, feePct, avgPct,
        riskScore, riskLevel, interventions,
        strongSubjects, weakSubjects, subjects,
        careerHint, totalDays,
      });
    } catch (err) {
      console.error('Error computing AI insights:', err);
    } finally {
      setLoading(false);
    }
  }, [studentId, selectedBranch, currentSessionId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Computing AI insights...
      </div>
    );
  }

  if (!insight) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Brain className="h-12 w-12 mx-auto mb-3 opacity-40" />
        <p>Insufficient data to generate insights</p>
      </div>
    );
  }

  const riskColor = insight.riskLevel === 'high' ? 'text-red-600' : insight.riskLevel === 'medium' ? 'text-amber-600' : 'text-emerald-600';
  const riskBg = insight.riskLevel === 'high' ? 'bg-red-50 dark:bg-red-950/30 border-red-200' : insight.riskLevel === 'medium' ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200' : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200';

  return (
    <div className="space-y-5">
      {/* Risk Score Card */}
      <Card className={`border ${riskBg}`}>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Brain className={`h-5 w-5 ${riskColor}`} />
              <h4 className="font-bold">Dropout Risk Analysis</h4>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-3xl font-bold ${riskColor}`}>{insight.riskScore}</span>
              <Badge variant={insight.riskLevel === 'high' ? 'destructive' : insight.riskLevel === 'medium' ? 'secondary' : 'default'}>
                {insight.riskLevel.toUpperCase()} RISK
              </Badge>
            </div>
          </div>
          <Progress value={insight.riskScore} className="h-2 mb-3" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div className="text-center p-2 rounded bg-background/60">
              <Activity className="h-4 w-4 mx-auto mb-0.5 text-blue-500" />
              <div className="font-semibold">{insight.attendancePct ?? 'N/A'}%</div>
              <div className="text-xs text-muted-foreground">Attendance</div>
            </div>
            <div className="text-center p-2 rounded bg-background/60">
              <BookOpen className="h-4 w-4 mx-auto mb-0.5 text-purple-500" />
              <div className="font-semibold">{insight.avgPct ?? 'N/A'}%</div>
              <div className="text-xs text-muted-foreground">Academic</div>
            </div>
            <div className="text-center p-2 rounded bg-background/60">
              <Shield className="h-4 w-4 mx-auto mb-0.5 text-emerald-500" />
              <div className="font-semibold">{insight.feePct ?? 'N/A'}%</div>
              <div className="text-xs text-muted-foreground">Fee Paid</div>
            </div>
            <div className="text-center p-2 rounded bg-background/60">
              <AlertTriangle className="h-4 w-4 mx-auto mb-0.5 text-amber-500" />
              <div className="font-semibold">{insight.consecutiveAbsent}</div>
              <div className="text-xs text-muted-foreground">Consec. Absent</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subject Strength */}
      {insight.subjects.length > 0 && (
        <Card>
          <CardContent className="p-5">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Subject Performance
            </h4>
            <div className="space-y-2">
              {insight.subjects.map(s => (
                <div key={s.name} className="flex items-center gap-3">
                  <span className="text-sm font-medium w-32 truncate">{s.name}</span>
                  <Progress value={s.avg} className="flex-1 h-2" />
                  <span className={`text-sm font-semibold w-12 text-right ${s.avg >= 80 ? 'text-emerald-600' : s.avg >= 40 ? 'text-blue-600' : 'text-red-600'}`}>
                    {s.avg}%
                  </span>
                </div>
              ))}
            </div>
            {insight.strongSubjects.length > 0 && (
              <div className="mt-3 text-xs text-emerald-600">
                <CheckCircle2 className="h-3 w-3 inline mr-1" />
                Strong: {insight.strongSubjects.join(', ')}
              </div>
            )}
            {insight.weakSubjects.length > 0 && (
              <div className="mt-1 text-xs text-red-500">
                <AlertTriangle className="h-3 w-3 inline mr-1" />
                Weak: {insight.weakSubjects.join(', ')}
              </div>
            )}
            {insight.careerHint && (
              <div className="mt-2 text-xs text-purple-600 bg-purple-50 dark:bg-purple-950/20 p-2 rounded">
                <Brain className="h-3 w-3 inline mr-1" /> {insight.careerHint}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Interventions */}
      {insight.interventions.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-800">
          <CardContent className="p-5">
            <h4 className="font-semibold mb-3 flex items-center gap-2 text-amber-600">
              <Lightbulb className="h-4 w-4" /> Suggested Interventions
            </h4>
            <div className="space-y-2">
              {insight.interventions.map((int, i) => (
                <div key={i} className="flex items-start gap-2 text-sm p-2 rounded bg-amber-50 dark:bg-amber-950/20">
                  <ArrowRight className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>{int}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {insight.interventions.length === 0 && (
        <Card className="border-emerald-200 dark:border-emerald-800">
          <CardContent className="p-5 text-center">
            <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
            <p className="font-medium text-emerald-600">No interventions needed</p>
            <p className="text-sm text-muted-foreground">This student is performing well across all metrics</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
