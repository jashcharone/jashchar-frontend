import React, { useState, useEffect, useCallback, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  GraduationCap, Users, BookOpen, Loader2, Printer, FileSpreadsheet,
  BarChart3, TrendingUp, Calendar, Filter, RefreshCw, CheckCircle2,
  Clock, Layers, UserCheck, School, Award, LayoutGrid
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

// ═══════════════════════════════════════════════════════════
// ACADEMIC ANALYSIS - World-Class Academic Analytics Module
// Designed for 500+ schools, built to last 50+ years
// ═══════════════════════════════════════════════════════════

const StatCard = ({ title, value, subtitle, icon: Icon, color = 'text-primary', bgColor = 'bg-primary/10' }) => (
  <Card className="relative overflow-hidden hover:shadow-lg transition-shadow">
    <CardContent className="p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          <p className={cn("text-3xl font-bold", color)}>{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <div className={cn("p-3 rounded-xl", bgColor)}>
          <Icon className={cn("h-6 w-6", color)} />
        </div>
      </div>
    </CardContent>
  </Card>
);

const AcademicAnalysis = () => {
  const { user, currentSessionId, organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();
  const printRef = useRef();

  const [loading, setLoading] = useState(true);

  // Analytics Data
  const [stats, setStats] = useState({
    totalClasses: 0, totalSections: 0, totalSubjects: 0, totalSubjectGroups: 0,
    totalStudents: 0, totalTeachers: 0, avgStudentsPerClass: 0, avgStudentsPerSection: 0,
    classTeachersAssigned: 0, subjectTeachersAssigned: 0,
  });
  const [classDetails, setClassDetails] = useState([]);
  const [subjectSummary, setSubjectSummary] = useState([]);
  const [teacherWorkload, setTeacherWorkload] = useState([]);
  const [sectionDistribution, setSectionDistribution] = useState([]);
  const [studentTeacherRatio, setStudentTeacherRatio] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(currentSessionId);

  const fetchSessions = useCallback(async () => {
    if (!selectedBranch) return;
    const { data } = await supabase.from('sessions')
      .select('id, name, is_active')
      .eq('branch_id', selectedBranch.id)
      .order('name', { ascending: false });
    setSessions(data || []);
  }, [selectedBranch]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);
  useEffect(() => { if (currentSessionId) setSelectedSessionId(currentSessionId); }, [currentSessionId]);

  const fetchAnalytics = useCallback(async () => {
    if (!selectedBranch || !selectedSessionId) return;
    setLoading(true);

    try {
      // === 1. CLASSES ===
      const { data: classesData } = await supabase.from('classes').select('id, name')
        .eq('branch_id', selectedBranch.id).order('name');
      const allClasses = classesData || [];

      // === 2. SECTIONS (via class_sections join table) ===
      const { data: classSectionsData } = await supabase.from('class_sections')
        .select('class_id, section_id, sections(id, name)')
        .in('class_id', allClasses.map(c => c.id));
      const allClassSections = classSectionsData || [];

      // Unique sections
      const uniqueSections = new Set(allClassSections.map(cs => cs.section_id));

      // === 3. SUBJECTS ===
      const { data: subjectsData } = await supabase.from('subjects').select('id, name, code, type')
        .eq('branch_id', selectedBranch.id).order('name');
      const allSubjects = subjectsData || [];

      // === 4. SUBJECT GROUPS ===
      const { data: subjectGroupsData } = await supabase.from('subject_groups')
        .select('id, name, class_id, subject_ids')
        .eq('branch_id', selectedBranch.id);
      const allSubjectGroups = subjectGroupsData || [];

      // === 5. STUDENTS (count per class/section) ===
      const { data: studentsData } = await supabase.from('student_profiles')
        .select('id, class_id, section_id')
        .eq('branch_id', selectedBranch.id)
        .eq('session_id', selectedSessionId)
        .eq('is_disabled', false);
      const allStudents = studentsData || [];

      // === 6. TEACHERS / CLASS TEACHERS ===
      const { data: classTeachersData } = await supabase.from('class_teachers')
        .select('id, class_id, section_id, teacher:teacher_id(id, full_name)')
        .eq('branch_id', selectedBranch.id);
      const allClassTeachers = classTeachersData || [];

      // === 7. SUBJECT TEACHERS ===
      const { data: subjectTeachersData } = await supabase.from('subject_teachers')
        .select('id, class_id, section_id, subject_id, teacher_id')
        .eq('branch_id', selectedBranch.id);
      const allSubjectTeachers = subjectTeachersData || [];

      // === 8. ALL TEACHERS (employee_profiles) ===
      const { data: employeesData } = await supabase.from('employee_profiles')
        .select('id, full_name, department_id, designation_id')
        .eq('branch_id', selectedBranch.id);
      const allEmployees = employeesData || [];

      // === COMPUTE STATS ===
      const totalTeachers = new Set([
        ...allClassTeachers.map(ct => ct.teacher?.id),
        ...allSubjectTeachers.map(st => st.teacher_id)
      ].filter(Boolean)).size;

      const avgPerClass = allClasses.length > 0 ? Math.round(allStudents.length / allClasses.length) : 0;
      const totalSectionCount = allClassSections.length;
      const avgPerSection = totalSectionCount > 0 ? Math.round(allStudents.length / totalSectionCount) : 0;

      setStats({
        totalClasses: allClasses.length,
        totalSections: uniqueSections.size,
        totalSubjects: allSubjects.length,
        totalSubjectGroups: allSubjectGroups.length,
        totalStudents: allStudents.length,
        totalTeachers: totalTeachers || allEmployees.length,
        avgStudentsPerClass: avgPerClass,
        avgStudentsPerSection: avgPerSection,
        classTeachersAssigned: allClassTeachers.length,
        subjectTeachersAssigned: allSubjectTeachers.length,
      });

      // === CLASS DETAIL TABLE ===
      const classDetailMap = {};
      allClasses.forEach(c => {
        classDetailMap[c.id] = {
          id: c.id, name: c.name, sections: [], studentCount: 0,
          classTeacher: null, subjectCount: 0, sectionDetails: {},
        };
      });

      // Add sections to classes
      allClassSections.forEach(cs => {
        if (classDetailMap[cs.class_id]) {
          const sName = cs.sections?.name || 'Unknown';
          classDetailMap[cs.class_id].sections.push(sName);
          classDetailMap[cs.class_id].sectionDetails[sName] = { students: 0, classTeacher: null, subjectTeachers: 0 };
        }
      });

      // Count students per class per section
      allStudents.forEach(s => {
        if (classDetailMap[s.class_id]) {
          classDetailMap[s.class_id].studentCount++;
          // Find section name
          const sectionCs = allClassSections.find(cs => cs.class_id === s.class_id && cs.section_id === s.section_id);
          const sName = sectionCs?.sections?.name;
          if (sName && classDetailMap[s.class_id].sectionDetails[sName]) {
            classDetailMap[s.class_id].sectionDetails[sName].students++;
          }
        }
      });

      // Assign class teachers
      allClassTeachers.forEach(ct => {
        if (classDetailMap[ct.class_id]) {
          const name = ct.teacher?.full_name || 'Assigned';
          classDetailMap[ct.class_id].classTeacher = name;
          // Section-specific
          const sectionCs = allClassSections.find(cs => cs.class_id === ct.class_id && cs.section_id === ct.section_id);
          const sName = sectionCs?.sections?.name;
          if (sName && classDetailMap[ct.class_id].sectionDetails[sName]) {
            classDetailMap[ct.class_id].sectionDetails[sName].classTeacher = name;
          }
        }
      });

      // Count subject groups per class
      allSubjectGroups.forEach(sg => {
        if (sg.class_id && classDetailMap[sg.class_id]) {
          classDetailMap[sg.class_id].subjectCount += (sg.subject_ids?.length || 0);
        }
      });

      // Count subject teachers per class
      allSubjectTeachers.forEach(st => {
        if (classDetailMap[st.class_id]) {
          const sectionCs = allClassSections.find(cs => cs.class_id === st.class_id && cs.section_id === st.section_id);
          const sName = sectionCs?.sections?.name;
          if (sName && classDetailMap[st.class_id].sectionDetails[sName]) {
            classDetailMap[st.class_id].sectionDetails[sName].subjectTeachers++;
          }
        }
      });

      setClassDetails(Object.values(classDetailMap).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true })));

      // === SUBJECT SUMMARY ===
      const subjectMap = {};
      allSubjects.forEach(s => {
        subjectMap[s.id] = { name: s.name, code: s.code, type: s.type || 'Theory', classCount: 0, teacherCount: 0 };
      });
      // Which classes teach which subject (via subject groups)
      allSubjectGroups.forEach(sg => {
        (sg.subject_ids || []).forEach(sid => {
          if (subjectMap[sid]) subjectMap[sid].classCount++;
        });
      });
      allSubjectTeachers.forEach(st => {
        if (subjectMap[st.subject_id]) subjectMap[st.subject_id].teacherCount++;
      });
      setSubjectSummary(Object.values(subjectMap).sort((a, b) => a.name.localeCompare(b.name)));

      // === TEACHER WORKLOAD ===
      // Build employee name map for lookups
      const empNameMap = {};
      allEmployees.forEach(e => { empNameMap[e.id] = e.full_name || 'Unknown'; });
      const teacherMap = {};
      allClassTeachers.forEach(ct => {
        const id = ct.teacher?.id;
        if (!id) return;
        const name = ct.teacher?.full_name || empNameMap[id] || `Teacher`;
        if (!teacherMap[id]) teacherMap[id] = { id, name, classesHandled: 0, sectionsHandled: 0, subjectsHandled: 0, isClassTeacher: true };
        teacherMap[id].classesHandled++;
      });
      allSubjectTeachers.forEach(st => {
        const id = st.teacher_id;
        if (!id) return;
        const name = empNameMap[id] || `Teacher`;
        if (!teacherMap[id]) teacherMap[id] = { id, name, classesHandled: 0, sectionsHandled: 0, subjectsHandled: 0, isClassTeacher: false };
        teacherMap[id].subjectsHandled++;
      });
      setTeacherWorkload(Object.values(teacherMap).sort((a, b) => (b.classesHandled + b.subjectsHandled) - (a.classesHandled + a.subjectsHandled)));

      // === SECTION DISTRIBUTION ===
      const sectDist = allClasses.map(c => {
        const classSecs = allClassSections.filter(cs => cs.class_id === c.id);
        return { class: c.name, sections: classSecs.length };
      });
      setSectionDistribution(sectDist);

      // === STUDENT-TEACHER RATIO per class ===
      const ratioData = Object.values(classDetailMap).map(c => {
        const teachers = new Set([
          ...allClassTeachers.filter(ct => ct.class_id === c.id).map(ct => ct.teacher?.id),
          ...allSubjectTeachers.filter(st => st.class_id === c.id).map(st => st.teacher_id),
        ].filter(Boolean)).size;
        return { class: c.name, students: c.studentCount, teachers, ratio: teachers > 0 ? `${Math.round(c.studentCount / teachers)}:1` : 'N/A' };
      }).filter(r => r.students > 0);
      setStudentTeacherRatio(ratioData);

    } catch (error) {
      console.error('Academic analytics error:', error);
      toast({ variant: 'destructive', title: 'Error loading academic analytics', description: error.message });
    } finally {
      setLoading(false);
    }
  }, [selectedBranch, selectedSessionId, toast]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  // === EXPORT ===
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html><head><title>Academic Analysis Report - ${selectedBranch?.name || 'School'}</title>
      <style>
        body { font-family: 'Segoe UI', sans-serif; margin: 20px; color: #333; }
        h1 { font-size: 20px; color: #1a1a2e; border-bottom: 2px solid #1a1a2e; padding-bottom: 8px; }
        h2 { font-size: 16px; margin-top: 24px; color: #16213e; }
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 16px 0; }
        .stat-box { border: 1px solid #ddd; border-radius: 8px; padding: 12px; text-align: center; }
        .stat-value { font-size: 24px; font-weight: bold; }
        .stat-label { font-size: 11px; color: #666; text-transform: uppercase; }
        table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 12px; }
        th { background: #1a1a2e; color: white; padding: 8px 12px; text-align: left; }
        td { padding: 6px 12px; border-bottom: 1px solid #eee; }
        tr:nth-child(even) { background: #f8f9fa; }
        .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #999; border-top: 1px solid #ddd; padding-top: 8px; }
        @media print { body { margin: 10px; } }
      </style></head><body>
      <h1>🎓 Academic Analysis Report</h1>
      <p><strong>School:</strong> ${selectedBranch?.name || ''} | <strong>Session:</strong> ${sessions.find(s => s.id === selectedSessionId)?.name || 'Active'} | <strong>Date:</strong> ${format(new Date(), 'dd MMM yyyy, hh:mm a')}</p>

      <div class="stats-grid">
        <div class="stat-box"><div class="stat-value">${stats.totalClasses}</div><div class="stat-label">Classes</div></div>
        <div class="stat-box"><div class="stat-value">${stats.totalSections}</div><div class="stat-label">Sections</div></div>
        <div class="stat-box"><div class="stat-value">${stats.totalSubjects}</div><div class="stat-label">Subjects</div></div>
        <div class="stat-box"><div class="stat-value">${stats.totalStudents}</div><div class="stat-label">Students</div></div>
      </div>

      <h2>Class-wise Academic Details</h2>
      <table>
        <thead><tr><th>Class</th><th>Sections</th><th>Students</th><th>Class Teacher</th><th>Subjects</th><th>Avg/Section</th></tr></thead>
        <tbody>${classDetails.map(c => `<tr><td>${c.name}</td><td>${c.sections.join(', ') || '-'}</td><td><strong>${c.studentCount}</strong></td><td>${c.classTeacher || 'Not Assigned'}</td><td>${c.subjectCount}</td><td>${c.sections.length > 0 ? Math.round(c.studentCount / c.sections.length) : c.studentCount}</td></tr>`).join('')}</tbody>
      </table>

      <h2>Subject Summary</h2>
      <table>
        <thead><tr><th>Subject</th><th>Code</th><th>Type</th><th>Classes Using</th><th>Teachers Assigned</th></tr></thead>
        <tbody>${subjectSummary.map(s => `<tr><td>${s.name}</td><td>${s.code || '-'}</td><td>${s.type}</td><td>${s.classCount}</td><td>${s.teacherCount}</td></tr>`).join('')}</tbody>
      </table>

      <h2>Teacher Workload</h2>
      <table>
        <thead><tr><th>Teacher</th><th>Class Teacher Of</th><th>Subject Assignments</th><th>Total Load</th></tr></thead>
        <tbody>${teacherWorkload.map(t => `<tr><td>${t.name}</td><td>${t.classesHandled}</td><td>${t.subjectsHandled}</td><td>${t.classesHandled + t.subjectsHandled}</td></tr>`).join('')}</tbody>
      </table>

      <h2>Student-Teacher Ratio</h2>
      <table>
        <thead><tr><th>Class</th><th>Students</th><th>Teachers</th><th>Ratio</th></tr></thead>
        <tbody>${studentTeacherRatio.map(r => `<tr><td>${r.class}</td><td>${r.students}</td><td>${r.teachers}</td><td>${r.ratio}</td></tr>`).join('')}</tbody>
      </table>

      <div class="footer">Generated by Jashchar ERP | ${format(new Date(), 'dd MMMM yyyy')}</div>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleExportExcel = () => {
    let csv = 'Academic Analysis Report\n';
    csv += `School: ${selectedBranch?.name || ''}\nDate: ${format(new Date(), 'dd MMM yyyy')}\n\n`;
    
    csv += 'Class-wise Details\nClass,Sections,Students,Class Teacher,Subjects,Avg Per Section\n';
    classDetails.forEach(c => {
      csv += `"${c.name}","${c.sections.join(', ')}",${c.studentCount},"${c.classTeacher || 'Not Assigned'}",${c.subjectCount},${c.sections.length > 0 ? Math.round(c.studentCount / c.sections.length) : c.studentCount}\n`;
    });

    csv += '\n\nSubject Summary\nSubject,Code,Type,Classes Using,Teachers Assigned\n';
    subjectSummary.forEach(s => {
      csv += `"${s.name}","${s.code || ''}","${s.type}",${s.classCount},${s.teacherCount}\n`;
    });

    csv += '\n\nTeacher Workload\nTeacher,Class Teacher Of,Subject Assignments,Total Load\n';
    teacherWorkload.forEach(t => {
      csv += `"${t.name}",${t.classesHandled},${t.subjectsHandled},${t.classesHandled + t.subjectsHandled}\n`;
    });

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Academic_Analysis_${selectedBranch?.name || 'School'}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    toast({ title: 'Export successful', description: 'Academic analysis exported to CSV' });
  };

  const maxStudents = Math.max(...classDetails.map(c => c.studentCount), 1);

  return (
    <DashboardLayout>
      <div ref={printRef}>
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <GraduationCap className="h-7 w-7 text-purple-600" />
              Academic Analysis
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Comprehensive academic structure analytics & insights</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={fetchAnalytics} disabled={loading}>
              <RefreshCw className={cn("h-4 w-4 mr-1", loading && "animate-spin")} /> Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-1" /> Print
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportExcel}>
              <FileSpreadsheet className="h-4 w-4 mr-1" /> Export Excel
            </Button>
          </div>
        </div>

        {/* Session Filter */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-end gap-4">
              <div className="space-y-1 min-w-[200px]">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" /> Session</label>
                <Select value={selectedSessionId || ''} onValueChange={setSelectedSessionId}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Select Session" /></SelectTrigger>
                  <SelectContent>
                    {sessions.map(s => <SelectItem key={s.id} value={s.id}>{s.name}{s.is_active ? ' ✦' : ''}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-3 text-muted-foreground">Loading academic analytics...</span>
          </div>
        ) : (
          <>
            {/* ═══ KEY METRICS ═══ */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
              <StatCard title="Classes" value={stats.totalClasses} icon={School} color="text-blue-600" bgColor="bg-blue-100 dark:bg-blue-900/30" />
              <StatCard title="Sections" value={stats.totalSections} icon={Layers} color="text-purple-600" bgColor="bg-purple-100 dark:bg-purple-900/30" subtitle={`${stats.totalClasses > 0 ? (stats.totalSections / stats.totalClasses).toFixed(1) : 0} avg/class`} />
              <StatCard title="Subjects" value={stats.totalSubjects} icon={BookOpen} color="text-amber-600" bgColor="bg-amber-100 dark:bg-amber-900/30" />
              <StatCard title="Students" value={stats.totalStudents} icon={Users} color="text-emerald-600" bgColor="bg-emerald-100 dark:bg-emerald-900/30" subtitle={`${stats.avgStudentsPerClass} avg/class`} />
              <StatCard title="Teaching Staff" value={stats.totalTeachers} icon={UserCheck} color="text-indigo-600" bgColor="bg-indigo-100 dark:bg-indigo-900/30" subtitle={`${stats.classTeachersAssigned} class teachers`} />
            </div>

            {/* Quick Ratios */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="border-blue-200 dark:border-blue-800">
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground uppercase">Student : Teacher Ratio</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.totalTeachers > 0 ? `${Math.round(stats.totalStudents / stats.totalTeachers)}:1` : 'N/A'}</p>
                </CardContent>
              </Card>
              <Card className="border-purple-200 dark:border-purple-800">
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground uppercase">Avg Students / Section</p>
                  <p className="text-3xl font-bold text-purple-600">{stats.avgStudentsPerSection}</p>
                </CardContent>
              </Card>
              <Card className="border-emerald-200 dark:border-emerald-800">
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground uppercase">Subject Groups</p>
                  <p className="text-3xl font-bold text-emerald-600">{stats.totalSubjectGroups}</p>
                </CardContent>
              </Card>
            </div>

            {/* ═══ CLASS-WISE STRENGTH BAR CHART ═══ */}
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><BarChart3 className="h-5 w-5 text-blue-500" /> Class-wise Student Strength</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {classDetails.map((c, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{c.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{c.sections.join(', ')}</span>
                          <span className="font-bold">{c.studentCount}</span>
                        </div>
                      </div>
                      <div className="h-3 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                          style={{ width: `${(c.studentCount / maxStudents) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* ═══ CLASS DETAIL TABLE ═══ */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2"><School className="h-5 w-5 text-indigo-500" /> Class-wise Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="p-2.5 text-left font-semibold">Class</th>
                          <th className="p-2.5 text-center font-semibold">Sections</th>
                          <th className="p-2.5 text-center font-semibold">Students</th>
                          <th className="p-2.5 text-left font-semibold">Class Teacher</th>
                          <th className="p-2.5 text-center font-semibold">Subjects</th>
                        </tr>
                      </thead>
                      <tbody>
                        {classDetails.map((c, i) => (
                          <tr key={i} className="border-b hover:bg-muted/30">
                            <td className="p-2.5 font-medium">{c.name}</td>
                            <td className="p-2.5 text-center">
                              <Badge variant="outline">{c.sections.length}</Badge>
                            </td>
                            <td className="p-2.5 text-center font-bold">{c.studentCount}</td>
                            <td className="p-2.5 text-xs">
                              {c.classTeacher ? (
                                <span className="text-green-600 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />{c.classTeacher}</span>
                              ) : (
                                <span className="text-red-500 flex items-center gap-1"><Clock className="h-3 w-3" />Not Assigned</span>
                              )}
                            </td>
                            <td className="p-2.5 text-center">{c.subjectCount}</td>
                          </tr>
                        ))}
                        {classDetails.length > 0 && (
                          <tr className="border-t-2 font-bold bg-muted/50">
                            <td className="p-2.5">TOTAL</td>
                            <td className="p-2.5 text-center">{classDetails.reduce((s, c) => s + c.sections.length, 0)}</td>
                            <td className="p-2.5 text-center">{stats.totalStudents}</td>
                            <td className="p-2.5 text-xs">{stats.classTeachersAssigned} assigned</td>
                            <td className="p-2.5 text-center">{stats.totalSubjects}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* ═══ SUBJECT SUMMARY ═══ */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2"><BookOpen className="h-5 w-5 text-amber-500" /> Subject Summary</CardTitle>
                  <CardDescription>{stats.totalSubjects} subjects configured</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0">
                        <tr className="border-b bg-muted/50">
                          <th className="p-2.5 text-left font-semibold">Subject</th>
                          <th className="p-2.5 text-center font-semibold">Code</th>
                          <th className="p-2.5 text-center font-semibold">Type</th>
                          <th className="p-2.5 text-center font-semibold">Classes</th>
                          <th className="p-2.5 text-center font-semibold">Teachers</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subjectSummary.map((s, i) => (
                          <tr key={i} className="border-b hover:bg-muted/30">
                            <td className="p-2.5 font-medium">{s.name}</td>
                            <td className="p-2.5 text-center text-xs font-mono text-muted-foreground">{s.code || '-'}</td>
                            <td className="p-2.5 text-center">
                              <Badge variant={s.type === 'Practical' ? 'secondary' : 'outline'} className="text-[10px]">{s.type}</Badge>
                            </td>
                            <td className="p-2.5 text-center">{s.classCount}</td>
                            <td className="p-2.5 text-center">
                              {s.teacherCount > 0 ? (
                                <span className="text-green-600">{s.teacherCount}</span>
                              ) : (
                                <span className="text-red-500 text-xs">None</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ═══ TEACHER WORKLOAD ═══ */}
            {teacherWorkload.length > 0 && (
              <Card className="mb-6">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2"><UserCheck className="h-5 w-5 text-green-500" /> Teacher Workload</CardTitle>
                  <CardDescription>Teaching assignments per staff member</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="p-3 text-left font-semibold">#</th>
                          <th className="p-3 text-left font-semibold">Teacher Name</th>
                          <th className="p-3 text-center font-semibold">Class Teacher</th>
                          <th className="p-3 text-center font-semibold">Subject Assignments</th>
                          <th className="p-3 text-center font-semibold">Total Load</th>
                          <th className="p-3 text-center font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {teacherWorkload.map((t, i) => {
                          const totalLoad = t.classesHandled + t.subjectsHandled;
                          return (
                            <tr key={i} className="border-b hover:bg-muted/30">
                              <td className="p-3 text-muted-foreground">{i + 1}</td>
                              <td className="p-3 font-medium">{t.name}</td>
                              <td className="p-3 text-center">
                                {t.classesHandled > 0 ? <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">{t.classesHandled}</Badge> : <span className="text-muted-foreground">-</span>}
                              </td>
                              <td className="p-3 text-center">{t.subjectsHandled}</td>
                              <td className="p-3 text-center font-bold">{totalLoad}</td>
                              <td className="p-3 text-center">
                                <Badge variant={totalLoad > 8 ? 'destructive' : totalLoad > 4 ? 'secondary' : 'default'} className="text-[10px]">
                                  {totalLoad > 8 ? 'Heavy' : totalLoad > 4 ? 'Moderate' : 'Light'}
                                </Badge>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ═══ STUDENT-TEACHER RATIO ═══ */}
            {studentTeacherRatio.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2"><Award className="h-5 w-5 text-purple-500" /> Student-Teacher Ratio by Class</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {studentTeacherRatio.map((r, i) => (
                      <Card key={i} className="border">
                        <CardContent className="p-3 text-center">
                          <p className="text-xs text-muted-foreground">{r.class}</p>
                          <p className={cn("text-xl font-bold mt-1", 
                            r.ratio === 'N/A' ? 'text-red-500' : parseInt(r.ratio) > 40 ? 'text-red-600' : parseInt(r.ratio) > 25 ? 'text-amber-600' : 'text-green-600'
                          )}>{r.ratio}</p>
                          <p className="text-[10px] text-muted-foreground">{r.students}S / {r.teachers}T</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AcademicAnalysis;
