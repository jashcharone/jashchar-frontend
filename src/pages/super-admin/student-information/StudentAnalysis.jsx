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
  Users, UserPlus, UserMinus, UserCheck, GraduationCap, IndianRupee,
  Loader2, Download, Printer, FileSpreadsheet, BarChart3, PieChart,
  TrendingUp, TrendingDown, Calendar, Filter, RefreshCw, ChevronDown,
  AlertCircle, CheckCircle2, Clock, Eye, MapPin, Phone, Mail, Home
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fetchPrintHeaderData, buildOrgHeaderHtml, PRINT_STYLES } from '@/utils/printOrgHeader';

// ═══════════════════════════════════════════════════════════
// STUDENT ANALYSIS - World-Class Student Analytics Module
// Designed for 500+ schools, built to last 50+ years
// ═══════════════════════════════════════════════════════════

const StatCard = ({ title, value, subtitle, icon: Icon, color = 'text-primary', bgColor = 'bg-primary/10', trend, trendLabel }) => (
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
      {trend !== undefined && (
        <div className="mt-3 flex items-center gap-1 text-xs">
          {trend >= 0 ? <TrendingUp className="h-3 w-3 text-green-500" /> : <TrendingDown className="h-3 w-3 text-red-500" />}
          <span className={trend >= 0 ? 'text-green-600' : 'text-red-600'}>{Math.abs(trend)}%</span>
          {trendLabel && <span className="text-muted-foreground ml-1">{trendLabel}</span>}
        </div>
      )}
    </CardContent>
  </Card>
);

const ProgressBar = ({ value, max, color = 'bg-primary', label, showValue = true }) => {
  const percentage = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="space-y-1">
      {label && (
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{label}</span>
          {showValue && <span className="font-medium">{value} <span className="text-muted-foreground">({percentage}%)</span></span>}
        </div>
      )}
      <div className="h-2.5 bg-muted rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-500", color)} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
};

const StudentAnalysis = () => {
  const { user, currentSessionId, organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();
  const printRef = useRef();

  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedSection, setSelectedSection] = useState('all');
  const [sections, setSections] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(currentSessionId);

  // Analytics Data
  const [stats, setStats] = useState({
    totalStudents: 0, maleStudents: 0, femaleStudents: 0, otherGender: 0,
    newAdmissions: 0, disabledStudents: 0, activeStudents: 0,
    avgAge: 0, withPhone: 0, withEmail: 0, withPhoto: 0,
  });
  const [classWiseData, setClassWiseData] = useState([]);
  const [genderByClass, setGenderByClass] = useState([]);
  const [admissionTrend, setAdmissionTrend] = useState([]);
  const [ageDistribution, setAgeDistribution] = useState([]);
  const [categoryDistribution, setCategoryDistribution] = useState([]);
  const [feesOverview, setFeesOverview] = useState({ totalAllocated: 0, totalPaid: 0, totalDue: 0 });
  const [studentList, setStudentList] = useState([]);
  const [printHeaderData, setPrintHeaderData] = useState({});

  // Fetch print header data (org logo, school info) for PDF
  useEffect(() => {
    if (selectedBranch?.id) fetchPrintHeaderData(supabase, selectedBranch.id).then(setPrintHeaderData);
  }, [selectedBranch]);

  const fetchClasses = useCallback(async () => {
    if (!selectedBranch) return;
    const { data } = await supabase.from('classes').select('id, name')
      .eq('branch_id', selectedBranch.id).order('name');
    setClasses(data || []);
  }, [selectedBranch]);

  const fetchSections = useCallback(async () => {
    if (!selectedClass || selectedClass === 'all') { setSections([]); return; }
    const { data } = await supabase.from('class_sections').select('sections(id, name)')
      .eq('class_id', selectedClass);
    setSections((data || []).map(d => d.sections).filter(Boolean));
  }, [selectedClass]);

  useEffect(() => { fetchClasses(); }, [fetchClasses]);
  useEffect(() => { fetchSections(); setSelectedSection('all'); }, [fetchSections]);

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
      // Build base query filters
      let query = supabase.from('student_profiles')
        .select('id, full_name, gender, date_of_birth, phone, email, photo_url, admission_date, school_code, father_name, mother_name, father_phone, mother_phone, guardian_phone, is_disabled, class_id, section_id, classes!student_profiles_class_id_fkey(id, name), sections!student_profiles_section_id_fkey(id, name), category_id, student_categories(id, name)')
        .eq('branch_id', selectedBranch.id)
        .eq('session_id', selectedSessionId);

      if (selectedClass !== 'all') query = query.eq('class_id', selectedClass);
      if (selectedSection !== 'all') query = query.eq('section_id', selectedSection);

      const { data: students, error } = await query.order('full_name');
      if (error) throw error;

      const allStudents = students || [];
      setStudentList(allStudents);

      // === CORE STATS ===
      const active = allStudents.filter(s => !s.is_disabled);
      const disabled = allStudents.filter(s => s.is_disabled);
      const males = allStudents.filter(s => s.gender?.toLowerCase() === 'male');
      const females = allStudents.filter(s => s.gender?.toLowerCase() === 'female');
      const others = allStudents.filter(s => s.gender && !['male', 'female'].includes(s.gender.toLowerCase()));
      
      // New admissions this month
      const thisMonth = new Date();
      const monthStart = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1);
      const newAdm = allStudents.filter(s => s.admission_date && new Date(s.admission_date) >= monthStart);

      // Data completeness
      const withPhone = allStudents.filter(s => s.phone || s.father_phone || s.mother_phone || s.guardian_phone);
      const withEmail = allStudents.filter(s => s.email);
      const withPhoto = allStudents.filter(s => s.photo_url);

      // Average age
      const ages = allStudents.map(s => {
        if (!s.date_of_birth) return null;
        const diff = Date.now() - new Date(s.date_of_birth).getTime();
        return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
      }).filter(a => a !== null);
      const avgAge = ages.length > 0 ? (ages.reduce((a, b) => a + b, 0) / ages.length).toFixed(1) : 0;

      setStats({
        totalStudents: allStudents.length, maleStudents: males.length, femaleStudents: females.length,
        otherGender: others.length, newAdmissions: newAdm.length, disabledStudents: disabled.length,
        activeStudents: active.length, avgAge: parseFloat(avgAge),
        withPhone: withPhone.length, withEmail: withEmail.length, withPhoto: withPhoto.length,
      });

      // === CLASS-WISE DISTRIBUTION ===
      const classMap = {};
      allStudents.forEach(s => {
        const cn = s.classes?.name || 'Unassigned';
        if (!classMap[cn]) classMap[cn] = { name: cn, total: 0, male: 0, female: 0, other: 0, sections: {} };
        classMap[cn].total++;
        if (s.gender?.toLowerCase() === 'male') classMap[cn].male++;
        else if (s.gender?.toLowerCase() === 'female') classMap[cn].female++;
        else classMap[cn].other++;
        
        const sn = s.sections?.name || 'No Section';
        if (!classMap[cn].sections[sn]) classMap[cn].sections[sn] = 0;
        classMap[cn].sections[sn]++;
      });
      const classArr = Object.values(classMap).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
      setClassWiseData(classArr);
      setGenderByClass(classArr);

      // === ADMISSION TREND (Month-wise for current session) ===
      const monthMap = {};
      allStudents.forEach(s => {
        if (!s.admission_date) return;
        const d = new Date(s.admission_date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = format(d, 'MMM yyyy');
        if (!monthMap[key]) monthMap[key] = { key, label, count: 0 };
        monthMap[key].count++;
      });
      setAdmissionTrend(Object.values(monthMap).sort((a, b) => a.key.localeCompare(b.key)));

      // === AGE DISTRIBUTION ===
      const ageGroups = { '3-5': 0, '6-8': 0, '9-11': 0, '12-14': 0, '15-17': 0, '18+': 0 };
      ages.forEach(a => {
        if (a <= 5) ageGroups['3-5']++;
        else if (a <= 8) ageGroups['6-8']++;
        else if (a <= 11) ageGroups['9-11']++;
        else if (a <= 14) ageGroups['12-14']++;
        else if (a <= 17) ageGroups['15-17']++;
        else ageGroups['18+']++;
      });
      setAgeDistribution(Object.entries(ageGroups).map(([range, count]) => ({ range, count })));

      // === CATEGORY / ADMISSION TYPE DISTRIBUTION ===
      const catMap = {};
      allStudents.forEach(s => {
        const cat = s.student_categories?.name || 'General';
        if (!catMap[cat]) catMap[cat] = 0;
        catMap[cat]++;
      });
      setCategoryDistribution(Object.entries(catMap).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count));

      // === FEES OVERVIEW ===
      if (allStudents.length > 0) {
        const studentIds = allStudents.map(s => s.id);
        const batchSize = 100;
        let totalAlloc = 0, totalPaid = 0;
        
        for (let i = 0; i < studentIds.length; i += batchSize) {
          const batch = studentIds.slice(i, i + batchSize);
          const [allocRes, payRes] = await Promise.all([
            supabase.from('student_fee_allocations').select('student_id, fee_master:fee_masters(amount)').in('student_id', batch),
            supabase.from('fee_payments').select('student_id, amount').in('student_id', batch).is('reverted_at', null),
          ]);
          if (allocRes.data) allocRes.data.forEach(a => { totalAlloc += parseFloat(a.fee_master?.amount || 0); });
          if (payRes.data) payRes.data.forEach(p => { totalPaid += parseFloat(p.amount || 0); });
        }
        setFeesOverview({ totalAllocated: totalAlloc, totalPaid: totalPaid, totalDue: Math.max(0, totalAlloc - totalPaid) });
      }

    } catch (error) {
      console.error('Analytics error:', error);
      toast({ variant: 'destructive', title: 'Error loading analytics', description: error.message });
    } finally {
      setLoading(false);
    }
  }, [selectedBranch, selectedSessionId, selectedClass, selectedSection, toast]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  // === EXPORT FUNCTIONS ===
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const sessionName = sessions.find(s => s.id === selectedSessionId)?.name || 'Active';
    const orgHeader = buildOrgHeaderHtml(printHeaderData);
    printWindow.document.write(`
      <html><head><title>Student Analysis Report - ${selectedBranch?.name || 'School'}</title>
      <style>${PRINT_STYLES}</style></head><body>
      ${orgHeader}
      <h1>📊 Student Analysis Report</h1>
      <p class="report-meta"><strong>Session:</strong> ${sessionName} | <strong>Generated:</strong> ${format(new Date(), 'dd MMM yyyy, hh:mm a')}</p>
      
      <div class="stats-grid">
        <div class="stat-box"><div class="stat-value">${stats.totalStudents}</div><div class="stat-label">Total Students</div></div>
        <div class="stat-box"><div class="stat-value">${stats.activeStudents}</div><div class="stat-label">Active</div></div>
        <div class="stat-box"><div class="stat-value">${stats.maleStudents}</div><div class="stat-label">Male</div></div>
        <div class="stat-box"><div class="stat-value">${stats.femaleStudents}</div><div class="stat-label">Female</div></div>
      </div>

      <h2>Class-wise Distribution</h2>
      <table>
        <thead><tr><th>Class</th><th>Total</th><th>Male</th><th>Female</th><th>Other</th><th>Sections</th></tr></thead>
        <tbody>${classWiseData.map(c => `<tr><td>${c.name}</td><td><strong>${c.total}</strong></td><td>${c.male}</td><td>${c.female}</td><td>${c.other}</td><td>${Object.entries(c.sections).map(([s, n]) => `${s}: ${n}`).join(', ')}</td></tr>`).join('')}</tbody>
      </table>

      <h2>Admission Type Distribution</h2>
      <table>
        <thead><tr><th>Category</th><th>Count</th><th>Percentage</th></tr></thead>
        <tbody>${categoryDistribution.map(c => `<tr><td>${c.name}</td><td>${c.count}</td><td>${stats.totalStudents > 0 ? ((c.count / stats.totalStudents) * 100).toFixed(1) : 0}%</td></tr>`).join('')}</tbody>
      </table>

      <h2>Age Distribution</h2>
      <table>
        <thead><tr><th>Age Group</th><th>Count</th><th>Percentage</th></tr></thead>
        <tbody>${ageDistribution.map(a => `<tr><td>${a.range} years</td><td>${a.count}</td><td>${stats.totalStudents > 0 ? ((a.count / stats.totalStudents) * 100).toFixed(1) : 0}%</td></tr>`).join('')}</tbody>
      </table>

      <h2>Fees Overview</h2>
      <div class="stats-grid">
        <div class="stat-box"><div class="stat-value">₹${feesOverview.totalAllocated.toLocaleString('en-IN')}</div><div class="stat-label">Total Allocated</div></div>
        <div class="stat-box"><div class="stat-value text-green">₹${feesOverview.totalPaid.toLocaleString('en-IN')}</div><div class="stat-label">Total Paid</div></div>
        <div class="stat-box"><div class="stat-value text-red">₹${feesOverview.totalDue.toLocaleString('en-IN')}</div><div class="stat-label">Total Due</div></div>
        <div class="stat-box"><div class="stat-value">${feesOverview.totalAllocated > 0 ? Math.round((feesOverview.totalPaid / feesOverview.totalAllocated) * 100) : 0}%</div><div class="stat-label">Collection Rate</div></div>
      </div>

      <h2>Data Completeness</h2>
      <table>
        <thead><tr><th>Field</th><th>Available</th><th>Missing</th><th>Completeness</th></tr></thead>
        <tbody>
          <tr><td>Phone Number</td><td>${stats.withPhone}</td><td>${stats.totalStudents - stats.withPhone}</td><td>${stats.totalStudents > 0 ? ((stats.withPhone / stats.totalStudents) * 100).toFixed(1) : 0}%</td></tr>
          <tr><td>Email</td><td>${stats.withEmail}</td><td>${stats.totalStudents - stats.withEmail}</td><td>${stats.totalStudents > 0 ? ((stats.withEmail / stats.totalStudents) * 100).toFixed(1) : 0}%</td></tr>
          <tr><td>Photo</td><td>${stats.withPhoto}</td><td>${stats.totalStudents - stats.withPhoto}</td><td>${stats.totalStudents > 0 ? ((stats.withPhoto / stats.totalStudents) * 100).toFixed(1) : 0}%</td></tr>
        </tbody>
      </table>

      <div class="footer">Generated by Jashchar ERP • ${format(new Date(), 'dd MMMM yyyy, hh:mm a')}</div>
      </body></html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };

  const handleExportExcel = () => {
    // CSV Export
    const headers = ['Admission No', 'Student Name', 'Class', 'Section', 'Gender', 'DOB', 'Age', 'Father Name', 'Mother Name', 'Phone', 'Email', 'Admission Date', 'Admission Type', 'Status'];
    const rows = studentList.map(s => {
      const age = s.date_of_birth ? Math.floor((Date.now() - new Date(s.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : '';
      return [
        s.school_code || '', s.full_name || '', s.classes?.name || '', s.sections?.name || '',
        s.gender || '', s.date_of_birth || '', age, s.father_name || '', s.mother_name || '',
        s.phone || s.father_phone || s.mother_phone || '', s.email || '',
        s.admission_date || '', s.student_categories?.name || '', s.is_disabled ? 'Disabled' : 'Active'
      ];
    });

    const csvContent = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Student_Analysis_${selectedBranch?.name || 'School'}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    toast({ title: 'Export successful', description: `${rows.length} students exported to CSV` });
  };

  const maxClassCount = Math.max(...classWiseData.map(c => c.total), 1);

  return (
    <DashboardLayout>
      <div ref={printRef}>
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="h-7 w-7 text-indigo-600" />
              Student Analysis
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Comprehensive student analytics & insights</p>
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

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-end gap-4">
              <div className="space-y-1 min-w-[180px]">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1"><Filter className="h-3 w-3" /> Class</label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="All Classes" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 min-w-[180px]">
                <label className="text-xs font-medium text-muted-foreground">Section</label>
                <Select value={selectedSection} onValueChange={setSelectedSection} disabled={selectedClass === 'all'}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="All Sections" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sections</SelectItem>
                    {sections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
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
            <span className="ml-3 text-muted-foreground">Loading analytics...</span>
          </div>
        ) : (
          <>
            {/* ═══ KEY METRICS ═══ */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
              <StatCard title="Total Students" value={stats.totalStudents} icon={Users} color="text-blue-600" bgColor="bg-blue-100 dark:bg-blue-900/30" />
              <StatCard title="Active" value={stats.activeStudents} icon={UserCheck} color="text-green-600" bgColor="bg-green-100 dark:bg-green-900/30" subtitle={`${stats.totalStudents > 0 ? ((stats.activeStudents / stats.totalStudents) * 100).toFixed(0) : 0}% of total`} />
              <StatCard title="Boys ♂" value={stats.maleStudents} icon={Users} color="text-sky-600" bgColor="bg-sky-100 dark:bg-sky-900/30" subtitle={`${stats.totalStudents > 0 ? ((stats.maleStudents / stats.totalStudents) * 100).toFixed(0) : 0}%`} />
              <StatCard title="Girls ♀" value={stats.femaleStudents} icon={Users} color="text-pink-600" bgColor="bg-pink-100 dark:bg-pink-900/30" subtitle={`${stats.totalStudents > 0 ? ((stats.femaleStudents / stats.totalStudents) * 100).toFixed(0) : 0}%`} />
              <StatCard title="New This Month" value={stats.newAdmissions} icon={UserPlus} color="text-emerald-600" bgColor="bg-emerald-100 dark:bg-emerald-900/30" />
              <StatCard title="Disabled" value={stats.disabledStudents} icon={UserMinus} color="text-red-600" bgColor="bg-red-100 dark:bg-red-900/30" />
            </div>

            {/* ═══ FEES OVERVIEW STRIP ═══ */}
            <Card className="mb-6 border-indigo-200 dark:border-indigo-800">
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-6">
                  <div className="flex items-center gap-1">
                    <IndianRupee className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">Fees Overview</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Allocated</p>
                      <p className="font-bold">₹{feesOverview.totalAllocated.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="h-8 w-px bg-border" />
                    <div className="text-center">
                      <p className="text-xs text-green-600">Collected</p>
                      <p className="font-bold text-green-600">₹{feesOverview.totalPaid.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="h-8 w-px bg-border" />
                    <div className="text-center">
                      <p className="text-xs text-red-600">Due</p>
                      <p className="font-bold text-red-600">₹{feesOverview.totalDue.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="h-8 w-px bg-border" />
                    <div className="flex items-center gap-2 min-w-[150px]">
                      <Progress value={feesOverview.totalAllocated > 0 ? Math.round((feesOverview.totalPaid / feesOverview.totalAllocated) * 100) : 0} className="h-2.5" />
                      <span className="text-sm font-bold">{feesOverview.totalAllocated > 0 ? Math.round((feesOverview.totalPaid / feesOverview.totalAllocated) * 100) : 0}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* ═══ CLASS-WISE DISTRIBUTION ═══ */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2"><GraduationCap className="h-5 w-5 text-indigo-500" /> Class-wise Distribution</CardTitle>
                  <CardDescription>Student count per class with gender breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                    {classWiseData.map((c, i) => (
                      <div key={i} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{c.name}</span>
                          <div className="flex items-center gap-2 text-xs">
                            <Badge variant="outline" className="text-sky-600 border-sky-300">{c.male}M</Badge>
                            <Badge variant="outline" className="text-pink-600 border-pink-300">{c.female}F</Badge>
                            {c.other > 0 && <Badge variant="outline">{c.other}O</Badge>}
                            <span className="font-bold ml-1">{c.total}</span>
                          </div>
                        </div>
                        <div className="flex h-3 rounded-full overflow-hidden bg-muted">
                          <div className="bg-sky-500 transition-all" style={{ width: `${(c.male / maxClassCount) * 100}%` }} />
                          <div className="bg-pink-500 transition-all" style={{ width: `${(c.female / maxClassCount) * 100}%` }} />
                          {c.other > 0 && <div className="bg-amber-500 transition-all" style={{ width: `${(c.other / maxClassCount) * 100}%` }} />}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {Object.entries(c.sections).map(([sn, cnt]) => `${sn}: ${cnt}`).join(' | ')}
                        </div>
                      </div>
                    ))}
                    {classWiseData.length === 0 && <p className="text-center text-muted-foreground py-8">No data available</p>}
                  </div>
                </CardContent>
              </Card>

              {/* ═══ AGE DISTRIBUTION ═══ */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2"><Users className="h-5 w-5 text-amber-500" /> Age Distribution</CardTitle>
                  <CardDescription>Average age: {stats.avgAge} years</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {ageDistribution.map((a, i) => (
                      <ProgressBar key={i} label={`${a.range} years`} value={a.count} max={stats.totalStudents}
                        color={i === 0 ? 'bg-emerald-500' : i === 1 ? 'bg-blue-500' : i === 2 ? 'bg-indigo-500' : i === 3 ? 'bg-purple-500' : i === 4 ? 'bg-amber-500' : 'bg-red-500'} />
                    ))}
                  </div>

                  <div className="mt-6 pt-4 border-t">
                    <CardTitle className="text-base flex items-center gap-2 mb-3"><PieChart className="h-5 w-5 text-violet-500" /> Admission Type</CardTitle>
                    <div className="space-y-2">
                      {categoryDistribution.map((c, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{c.name}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-violet-500 rounded-full" style={{ width: `${stats.totalStudents > 0 ? (c.count / stats.totalStudents) * 100 : 0}%` }} />
                            </div>
                            <span className="font-medium w-8 text-right">{c.count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ═══ ADMISSION TREND ═══ */}
            {admissionTrend.length > 0 && (
              <Card className="mb-6">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-5 w-5 text-green-500" /> Admission Trend</CardTitle>
                  <CardDescription>Month-wise new admissions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end gap-2 h-40 overflow-x-auto pb-2">
                    {admissionTrend.map((m, i) => {
                      const maxCount = Math.max(...admissionTrend.map(t => t.count), 1);
                      const height = (m.count / maxCount) * 100;
                      return (
                        <div key={i} className="flex flex-col items-center gap-1 min-w-[50px]">
                          <span className="text-xs font-bold">{m.count}</span>
                          <div className="w-8 bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t transition-all" style={{ height: `${Math.max(height, 4)}%` }} />
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap">{m.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ═══ DATA COMPLETENESS ═══ */}
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-emerald-500" /> Data Completeness</CardTitle>
                <CardDescription>Quality of student records</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-blue-500" /><span className="text-sm font-medium">Phone Numbers</span></div>
                    <ProgressBar value={stats.withPhone} max={stats.totalStudents} color="bg-blue-500" />
                    <p className="text-xs text-muted-foreground">{stats.totalStudents - stats.withPhone} students missing phone</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-purple-500" /><span className="text-sm font-medium">Email Address</span></div>
                    <ProgressBar value={stats.withEmail} max={stats.totalStudents} color="bg-purple-500" />
                    <p className="text-xs text-muted-foreground">{stats.totalStudents - stats.withEmail} students missing email</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2"><Eye className="h-4 w-4 text-amber-500" /><span className="text-sm font-medium">Profile Photo</span></div>
                    <ProgressBar value={stats.withPhoto} max={stats.totalStudents} color="bg-amber-500" />
                    <p className="text-xs text-muted-foreground">{stats.totalStudents - stats.withPhoto} students missing photo</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ═══ CLASS-WISE TABLE (Detailed for Print/Export) ═══ */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Detailed Class-wise Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="p-3 text-left font-semibold">#</th>
                        <th className="p-3 text-left font-semibold">Class</th>
                        <th className="p-3 text-center font-semibold">Total</th>
                        <th className="p-3 text-center font-semibold">Male</th>
                        <th className="p-3 text-center font-semibold">Female</th>
                        <th className="p-3 text-center font-semibold">Other</th>
                        <th className="p-3 text-left font-semibold">Sections</th>
                        <th className="p-3 text-center font-semibold">% of School</th>
                      </tr>
                    </thead>
                    <tbody>
                      {classWiseData.map((c, i) => (
                        <tr key={i} className="border-b hover:bg-muted/30">
                          <td className="p-3 text-muted-foreground">{i + 1}</td>
                          <td className="p-3 font-medium">{c.name}</td>
                          <td className="p-3 text-center font-bold">{c.total}</td>
                          <td className="p-3 text-center text-sky-600">{c.male}</td>
                          <td className="p-3 text-center text-pink-600">{c.female}</td>
                          <td className="p-3 text-center">{c.other}</td>
                          <td className="p-3 text-xs">{Object.entries(c.sections).map(([s, n]) => `${s}(${n})`).join(', ')}</td>
                          <td className="p-3 text-center">{stats.totalStudents > 0 ? ((c.total / stats.totalStudents) * 100).toFixed(1) : 0}%</td>
                        </tr>
                      ))}
                      {classWiseData.length > 0 && (
                        <tr className="border-t-2 font-bold bg-muted/50">
                          <td className="p-3" colSpan={2}>TOTAL</td>
                          <td className="p-3 text-center">{stats.totalStudents}</td>
                          <td className="p-3 text-center text-sky-600">{stats.maleStudents}</td>
                          <td className="p-3 text-center text-pink-600">{stats.femaleStudents}</td>
                          <td className="p-3 text-center">{stats.otherGender}</td>
                          <td className="p-3"></td>
                          <td className="p-3 text-center">100%</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentAnalysis;
