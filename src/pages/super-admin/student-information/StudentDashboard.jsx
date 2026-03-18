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
  Loader2, RefreshCw, PieChart, TrendingUp, TrendingDown, Calendar,
  BarChart3, Home, Bus, Building2, Search, Sheet, CreditCard,
  Clock, UserX, Activity, ArrowRight, Plus, Upload, Contact, BookOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { formatDate } from '@/utils/dateUtils';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/registry/routeRegistry';

// ═══════════════════════════════════════════════════════════
// STUDENT DASHBOARD - World-Class Admin Student Overview
// ═══════════════════════════════════════════════════════════

const StatCard = ({ title, value, subtitle, icon: Icon, color = 'text-primary', bgColor = 'bg-primary/10', trend, trendLabel, onClick }) => (
  <Card className={cn("relative overflow-hidden hover:shadow-lg transition-all", onClick && "cursor-pointer hover:scale-[1.02]")} onClick={onClick}>
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

const QuickActionButton = ({ icon: Icon, label, onClick, color = 'text-primary', bgColor = 'bg-primary/10' }) => (
  <button onClick={onClick} className="flex flex-col items-center gap-2 p-4 rounded-xl border hover:shadow-md transition-all hover:scale-105 bg-card">
    <div className={cn("p-3 rounded-xl", bgColor)}>
      <Icon className={cn("h-5 w-5", color)} />
    </div>
    <span className="text-xs font-medium text-center">{label}</span>
  </button>
);

const StudentDashboard = () => {
  const { user, currentSessionId, organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(currentSessionId);

  // Dashboard Data
  const [stats, setStats] = useState({
    totalStudents: 0, activeStudents: 0, maleStudents: 0, femaleStudents: 0,
    newAdmissionsThisMonth: 0, disabledStudents: 0,
    withPhone: 0, withEmail: 0, withPhoto: 0,
    hostelStudents: 0, transportStudents: 0, rteStudents: 0,
  });
  const [todayAttendance, setTodayAttendance] = useState({ present: 0, absent: 0, late: 0, total: 0 });
  const [feesOverview, setFeesOverview] = useState({ totalAllocated: 0, totalPaid: 0, totalDue: 0 });
  const [classWiseData, setClassWiseData] = useState([]);
  const [categoryDistribution, setCategoryDistribution] = useState([]);
  const [recentAdmissions, setRecentAdmissions] = useState([]);
  const [genderRatio, setGenderRatio] = useState({ malePercent: 0, femalePercent: 0 });

  // Fetch sessions
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

  // Fetch all dashboard data
  const fetchDashboardData = useCallback(async () => {
    if (!selectedBranch || !selectedSessionId) return;
    setLoading(true);

    try {
      // 1. Fetch students
      const { data: students, error: studErr } = await supabase.from('student_profiles')
        .select('id, full_name, gender, date_of_birth, phone, email, photo_url, admission_date, school_code, father_name, father_phone, mother_phone, guardian_phone, is_disabled, class_id, section_id, classes!student_profiles_class_id_fkey(id, name), sections!student_profiles_section_id_fkey(id, name), category_id, student_categories(id, name), transport_details_id, hostel_details_id, is_rte_student')
        .eq('branch_id', selectedBranch.id)
        .eq('session_id', selectedSessionId)
        .order('created_at', { ascending: false });
      if (studErr) throw studErr;

      const allStudents = students || [];

      // Core stats
      const active = allStudents.filter(s => !s.is_disabled);
      const disabled = allStudents.filter(s => s.is_disabled);
      const males = allStudents.filter(s => s.gender?.toLowerCase() === 'male');
      const females = allStudents.filter(s => s.gender?.toLowerCase() === 'female');

      const thisMonth = new Date();
      const monthStart = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1);
      const newAdm = allStudents.filter(s => s.admission_date && new Date(s.admission_date) >= monthStart);

      const withPhone = allStudents.filter(s => s.phone || s.father_phone || s.mother_phone || s.guardian_phone);
      const withEmail = allStudents.filter(s => s.email);
      const withPhoto = allStudents.filter(s => s.photo_url);
      const hostelStudents = allStudents.filter(s => s.hostel_details_id);
      const transportStudents = allStudents.filter(s => s.transport_details_id);
      const rteStudents = allStudents.filter(s => s.is_rte_student);

      setStats({
        totalStudents: allStudents.length,
        activeStudents: active.length,
        maleStudents: males.length,
        femaleStudents: females.length,
        newAdmissionsThisMonth: newAdm.length,
        disabledStudents: disabled.length,
        withPhone: withPhone.length,
        withEmail: withEmail.length,
        withPhoto: withPhoto.length,
        hostelStudents: hostelStudents.length,
        transportStudents: transportStudents.length,
        rteStudents: rteStudents.length,
      });

      // Gender ratio
      const total = allStudents.length || 1;
      setGenderRatio({
        malePercent: Math.round((males.length / total) * 100),
        femalePercent: Math.round((females.length / total) * 100),
      });

      // Class-wise distribution
      const classMap = {};
      allStudents.forEach(s => {
        const clsName = s.classes?.name || 'Unassigned';
        if (!classMap[clsName]) classMap[clsName] = { name: clsName, total: 0, male: 0, female: 0 };
        classMap[clsName].total++;
        if (s.gender?.toLowerCase() === 'male') classMap[clsName].male++;
        else if (s.gender?.toLowerCase() === 'female') classMap[clsName].female++;
      });
      setClassWiseData(Object.values(classMap).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true })));

      // Category distribution
      const catMap = {};
      allStudents.forEach(s => {
        const cat = s.student_categories?.name || 'General';
        if (!catMap[cat]) catMap[cat] = 0;
        catMap[cat]++;
      });
      setCategoryDistribution(Object.entries(catMap).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count));

      // Recent admissions (last 10)
      setRecentAdmissions(allStudents.slice(0, 10));

      // 2. Today's attendance
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data: attendanceData } = await supabase.from('student_attendance')
        .select('id, status')
        .eq('branch_id', selectedBranch.id)
        .eq('session_id', selectedSessionId)
        .eq('date', today);

      if (attendanceData) {
        const present = attendanceData.filter(a => a.status === 'present' || a.status === 'Present').length;
        const absent = attendanceData.filter(a => a.status === 'absent' || a.status === 'Absent').length;
        const late = attendanceData.filter(a => a.status === 'late' || a.status === 'Late' || a.status === 'half_day').length;
        setTodayAttendance({ present, absent, late, total: attendanceData.length });
      }

      // 3. Fees overview
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
      console.error('Dashboard error:', error);
      toast({ variant: 'destructive', title: 'Error loading dashboard', description: error.message });
    } finally {
      setLoading(false);
    }
  }, [selectedBranch, selectedSessionId, toast]);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  const maxClassCount = Math.max(...classWiseData.map(c => c.total), 1);
  const attendancePercent = todayAttendance.total > 0 ? Math.round((todayAttendance.present / todayAttendance.total) * 100) : 0;
  const feeCollectionPercent = feesOverview.totalAllocated > 0 ? Math.round((feesOverview.totalPaid / feesOverview.totalAllocated) * 100) : 0;

  return (
    <DashboardLayout>
      <div>
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <Activity className="h-6 w-6 sm:h-7 sm:w-7 text-indigo-600" />
              Student Dashboard
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Real-time student overview & insights</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedSessionId || ''} onValueChange={setSelectedSessionId}>
              <SelectTrigger className="h-9 w-full sm:w-[200px]">
                <Calendar className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                <SelectValue placeholder="Select Session" />
              </SelectTrigger>
              <SelectContent>
                {sessions.map(s => <SelectItem key={s.id} value={s.id}>{s.name}{s.is_active ? ' ✦' : ''}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={fetchDashboardData} disabled={loading}>
              <RefreshCw className={cn("h-4 w-4 mr-1", loading && "animate-spin")} /> Refresh
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-3 text-muted-foreground">Loading dashboard...</span>
          </div>
        ) : (
          <>
            {/* ═══ KEY METRICS ROW 1 ═══ */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
              <StatCard
                title="Total Students" value={stats.totalStudents} icon={Users}
                color="text-blue-600" bgColor="bg-blue-100 dark:bg-blue-900/30"
                subtitle={`${stats.activeStudents} active`}
                onClick={() => navigate(ROUTES.SUPER_ADMIN.STUDENT_DETAILS)}
              />
              <StatCard
                title="Boys ♂" value={stats.maleStudents} icon={Users}
                color="text-sky-600" bgColor="bg-sky-100 dark:bg-sky-900/30"
                subtitle={`${genderRatio.malePercent}%`}
              />
              <StatCard
                title="Girls ♀" value={stats.femaleStudents} icon={Users}
                color="text-pink-600" bgColor="bg-pink-100 dark:bg-pink-900/30"
                subtitle={`${genderRatio.femalePercent}%`}
              />
              <StatCard
                title="New This Month" value={stats.newAdmissionsThisMonth} icon={UserPlus}
                color="text-emerald-600" bgColor="bg-emerald-100 dark:bg-emerald-900/30"
                onClick={() => navigate(ROUTES.SUPER_ADMIN.STUDENT_ADMISSION)}
              />
              <StatCard
                title="Today's Attendance" value={`${attendancePercent}%`} icon={UserCheck}
                color={attendancePercent >= 75 ? "text-green-600" : "text-red-600"}
                bgColor={attendancePercent >= 75 ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30"}
                subtitle={`${todayAttendance.present}/${todayAttendance.total} present`}
              />
              <StatCard
                title="Disabled" value={stats.disabledStudents} icon={UserMinus}
                color="text-red-600" bgColor="bg-red-100 dark:bg-red-900/30"
                onClick={() => navigate(ROUTES.SUPER_ADMIN.DISABLED_STUDENTS)}
              />
            </div>

            {/* ═══ FEES OVERVIEW + QUICK STATS ═══ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {/* Fees Collection Card */}
              <Card className="border-indigo-200 dark:border-indigo-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <IndianRupee className="h-5 w-5 text-indigo-500" /> Fee Collection
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-bold text-indigo-600">{feeCollectionPercent}%</span>
                    <Badge variant={feeCollectionPercent >= 75 ? "default" : feeCollectionPercent >= 50 ? "secondary" : "destructive"}>
                      {feeCollectionPercent >= 75 ? 'Good' : feeCollectionPercent >= 50 ? 'Average' : 'Low'}
                    </Badge>
                  </div>
                  <Progress value={feeCollectionPercent} className="h-3" />
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Allocated</p>
                      <p className="font-bold text-sm">₹{feesOverview.totalAllocated.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
                      <p className="text-xs text-green-600">Collected</p>
                      <p className="font-bold text-sm text-green-600">₹{feesOverview.totalPaid.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20">
                      <p className="text-xs text-red-600">Due</p>
                      <p className="font-bold text-sm text-red-600">₹{feesOverview.totalDue.toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Student Distribution Card */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-violet-500" /> Student Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2"><Home className="h-4 w-4 text-blue-500" /> Day Scholars</span>
                    <span className="font-bold">{stats.totalStudents - stats.hostelStudents}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2"><Building2 className="h-4 w-4 text-purple-500" /> Hostel Students</span>
                    <span className="font-bold">{stats.hostelStudents}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2"><Bus className="h-4 w-4 text-amber-500" /> Transport Students</span>
                    <span className="font-bold">{stats.transportStudents}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2"><GraduationCap className="h-4 w-4 text-green-500" /> RTE Students</span>
                    <span className="font-bold">{stats.rteStudents}</span>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="text-xs text-muted-foreground mb-1">Gender Split</div>
                    <div className="flex h-4 rounded-full overflow-hidden">
                      <div className="bg-sky-500 transition-all" style={{ width: `${genderRatio.malePercent}%` }} title={`Boys: ${genderRatio.malePercent}%`} />
                      <div className="bg-pink-500 transition-all" style={{ width: `${genderRatio.femalePercent}%` }} title={`Girls: ${genderRatio.femalePercent}%`} />
                    </div>
                    <div className="flex justify-between text-xs mt-1">
                      <span className="text-sky-600">♂ {genderRatio.malePercent}%</span>
                      <span className="text-pink-600">♀ {genderRatio.femalePercent}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Data Completeness Card */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Activity className="h-5 w-5 text-emerald-500" /> Data Completeness
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { label: 'Phone Number', value: stats.withPhone, color: 'bg-blue-500' },
                    { label: 'Email Address', value: stats.withEmail, color: 'bg-purple-500' },
                    { label: 'Profile Photo', value: stats.withPhoto, color: 'bg-amber-500' },
                  ].map((item, i) => {
                    const pct = stats.totalStudents > 0 ? Math.round((item.value / stats.totalStudents) * 100) : 0;
                    return (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{item.label}</span>
                          <span className="font-medium">{item.value}/{stats.totalStudents} <span className="text-muted-foreground">({pct}%)</span></span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className={cn("h-full rounded-full transition-all duration-500", item.color)} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>

            {/* ═══ QUICK ACTIONS ═══ */}
            <Card className="mb-6">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-7 gap-3">
                  <QuickActionButton icon={Plus} label="New Admission" color="text-emerald-600" bgColor="bg-emerald-100 dark:bg-emerald-900/30" onClick={() => navigate(ROUTES.SUPER_ADMIN.STUDENT_ADMISSION)} />
                  <QuickActionButton icon={Search} label="Search Student" color="text-blue-600" bgColor="bg-blue-100 dark:bg-blue-900/30" onClick={() => navigate(ROUTES.SUPER_ADMIN.STUDENT_DETAILS)} />
                  <QuickActionButton icon={Upload} label="Bulk Upload" color="text-violet-600" bgColor="bg-violet-100 dark:bg-violet-900/30" onClick={() => navigate(ROUTES.SUPER_ADMIN.STUDENT_BULK_UPLOAD)} />
                  <QuickActionButton icon={Contact} label="ID Cards" color="text-amber-600" bgColor="bg-amber-100 dark:bg-amber-900/30" onClick={() => navigate(ROUTES.SUPER_ADMIN.STUDENT_ID_CARD)} />
                  <QuickActionButton icon={BarChart3} label="Analysis" color="text-indigo-600" bgColor="bg-indigo-100 dark:bg-indigo-900/30" onClick={() => navigate(ROUTES.SUPER_ADMIN.STUDENT_ANALYSIS)} />
                  <QuickActionButton icon={BookOpen} label="Online Admission" color="text-cyan-600" bgColor="bg-cyan-100 dark:bg-cyan-900/30" onClick={() => navigate(ROUTES.SUPER_ADMIN.ONLINE_ADMISSION_LIST)} />
                  <QuickActionButton icon={UserX} label="Disabled" color="text-red-600" bgColor="bg-red-100 dark:bg-red-900/30" onClick={() => navigate(ROUTES.SUPER_ADMIN.DISABLED_STUDENTS)} />
                </div>
              </CardContent>
            </Card>

            {/* ═══ CLASS-WISE DISTRIBUTION + RECENT ADMISSIONS ═══ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Class-wise Distribution */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-indigo-500" /> Class-wise Strength
                  </CardTitle>
                  <CardDescription>Boys vs Girls per class</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                    {classWiseData.map((c, i) => (
                      <div key={i} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{c.name}</span>
                          <div className="flex items-center gap-2 text-xs">
                            <Badge variant="outline" className="text-sky-600 border-sky-300">{c.male} M</Badge>
                            <Badge variant="outline" className="text-pink-600 border-pink-300">{c.female} F</Badge>
                            <span className="font-bold ml-1">{c.total}</span>
                          </div>
                        </div>
                        <div className="flex h-3 rounded-full overflow-hidden bg-muted">
                          <div className="bg-sky-500 transition-all" style={{ width: `${(c.male / maxClassCount) * 100}%` }} />
                          <div className="bg-pink-500 transition-all" style={{ width: `${(c.female / maxClassCount) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                    {classWiseData.length === 0 && <p className="text-center text-muted-foreground py-8">No data available</p>}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Admissions */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Clock className="h-5 w-5 text-emerald-500" /> Recent Admissions
                      </CardTitle>
                      <CardDescription>Latest 10 student admissions</CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.SUPER_ADMIN.STUDENT_DETAILS)} className="text-xs">
                      View All <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {recentAdmissions.map((student, i) => (
                      <div key={student.id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => navigate(`/super-admin/student-information/profile/${student.id}`)}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                            {student.full_name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="text-sm font-medium leading-tight">{student.full_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {student.classes?.name || '-'} {student.sections?.name ? `• ${student.sections.name}` : ''} {student.school_code ? `• ${student.school_code}` : ''}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">{student.admission_date ? formatDate(student.admission_date) : '-'}</p>
                          <Badge variant={student.is_disabled ? "destructive" : "default"} className="text-[10px] px-1.5 py-0">
                            {student.is_disabled ? 'Disabled' : 'Active'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {recentAdmissions.length === 0 && <p className="text-center text-muted-foreground py-8">No recent admissions</p>}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ═══ CATEGORY DISTRIBUTION + TODAY'S ATTENDANCE ═══ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Category Distribution */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-violet-500" /> Admission Category
                  </CardTitle>
                  <CardDescription>Student distribution by category</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {categoryDistribution.map((c, i) => {
                      const pct = stats.totalStudents > 0 ? Math.round((c.count / stats.totalStudents) * 100) : 0;
                      const colors = ['bg-indigo-500', 'bg-violet-500', 'bg-pink-500', 'bg-amber-500', 'bg-emerald-500', 'bg-sky-500', 'bg-red-500'];
                      return (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground flex items-center gap-2">
                            <div className={cn("w-3 h-3 rounded-full", colors[i % colors.length])} />
                            {c.name}
                          </span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                              <div className={cn("h-full rounded-full", colors[i % colors.length])} style={{ width: `${pct}%` }} />
                            </div>
                            <span className="font-medium w-8 text-right">{c.count}</span>
                            <span className="text-xs text-muted-foreground w-10 text-right">{pct}%</span>
                          </div>
                        </div>
                      );
                    })}
                    {categoryDistribution.length === 0 && <p className="text-center text-muted-foreground py-4">No category data</p>}
                  </div>
                </CardContent>
              </Card>

              {/* Today's Attendance Summary */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-green-500" /> Today's Attendance
                  </CardTitle>
                  <CardDescription>{format(new Date(), 'EEEE, dd MMMM yyyy')}</CardDescription>
                </CardHeader>
                <CardContent>
                  {todayAttendance.total > 0 ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-center">
                        <div className="relative">
                          <svg className="w-32 h-32" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted" />
                            <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8"
                              className={attendancePercent >= 75 ? "text-green-500" : "text-red-500"}
                              strokeDasharray={`${attendancePercent * 2.64} 264`}
                              strokeLinecap="round" transform="rotate(-90 50 50)" />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-2xl font-bold">{attendancePercent}%</span>
                            <span className="text-xs text-muted-foreground">Present</span>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                          <p className="text-xl font-bold text-green-600">{todayAttendance.present}</p>
                          <p className="text-xs text-green-700">Present</p>
                        </div>
                        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
                          <p className="text-xl font-bold text-red-600">{todayAttendance.absent}</p>
                          <p className="text-xs text-red-700">Absent</p>
                        </div>
                        <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                          <p className="text-xl font-bold text-amber-600">{todayAttendance.late}</p>
                          <p className="text-xs text-amber-700">Late</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Clock className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Attendance not marked yet today</p>
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
};

export default StudentDashboard;
