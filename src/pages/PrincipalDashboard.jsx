import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import WelcomeMessage from '@/components/WelcomeMessage';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { supabase } from '@/lib/customSupabaseClient';
import { ROUTES } from '@/registry/routeRegistry';
import { formatDayMonth } from '@/utils/dateUtils';
import {
  Users, Briefcase, UserCheck, BookOpen, CalendarCheck,
  TrendingUp, TrendingDown, ArrowRight, Clock,
  AlertTriangle, CheckCircle2, GraduationCap, FileText, Bell
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ============================================================================
// STAT CARD (Principal-specific design)
// ============================================================================
const PrincipalStatCard = ({ title, value, icon: Icon, gradient, subtitle, delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (isVisible && typeof value === 'number') {
      const duration = 1200;
      const steps = 50;
      const increment = value / steps;
      let current = 0;
      const timer = setInterval(() => {
        current += increment;
        if (current >= value) {
          setAnimatedValue(value);
          clearInterval(timer);
        } else {
          setAnimatedValue(Math.floor(current));
        }
      }, duration / steps);
      return () => clearInterval(timer);
    } else {
      setAnimatedValue(value);
    }
  }, [isVisible, value]);

  return (
    <div className={cn(
      'relative overflow-hidden rounded-2xl p-6 text-white transition-all duration-500 transform',
      isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-4 opacity-0 scale-95',
      `bg-gradient-to-br ${gradient}`
    )}>
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/10 -mr-10 -mt-10" />
      <div className="absolute bottom-0 left-0 w-20 h-20 rounded-full bg-white/5 -ml-6 -mb-6" />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
            <Icon className="h-6 w-6" />
          </div>
        </div>
        <div className="text-3xl font-bold tracking-tight">
          {typeof animatedValue === 'number' ? animatedValue.toLocaleString('en-IN') : animatedValue}
        </div>
        <div className="text-sm font-medium text-white/80 mt-1">{title}</div>
        {subtitle && <div className="text-xs text-white/60 mt-1">{subtitle}</div>}
      </div>
    </div>
  );
};

// ============================================================================
// PRINCIPAL DASHBOARD
// ============================================================================
const PrincipalDashboard = () => {
  const { user, school, currentSessionId } = useAuth();
  const { selectedBranch } = useBranch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashData, setDashData] = useState({
    totalStudents: 0,
    totalStaff: 0,
    teacherCount: 0,
    studentAttendanceToday: { present: 0, absent: 0, late: 0, total: 0, rate: 0 },
    staffAttendanceToday: { present: 0, absent: 0, total: 0, rate: 0 },
    pendingLeaves: 0,
    recentNotices: [],
    classCount: 0,
    sectionCount: 0,
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      const branchId = selectedBranch?.id || user?.profile?.branch_id;
      const sessionId = currentSessionId;
      
      console.log('[PrincipalDashboard] Fetching data:', { 
        branchId, sessionId, 
        selectedBranch: selectedBranch?.id, 
        profileBranch: user?.profile?.branch_id,
        userId: user?.id 
      });
      
      if (!branchId || !sessionId) {
        console.warn('[PrincipalDashboard] Missing branchId or sessionId, skipping fetch');
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const today = new Date().toISOString().split('T')[0];

        const [
          studentsRes,
          staffRes,
          studentAttRes,
          staffAttRes,
          pendingLeavesRes,
          noticesRes,
          classesRes,
          sectionsRes,
        ] = await Promise.all([
          // Active students count
          supabase.from('student_profiles').select('*', { count: 'exact', head: true })
            .eq('branch_id', branchId).eq('session_id', sessionId)
            .or('is_disabled.is.null,is_disabled.eq.false'),
          // Staff with role info
          supabase.from('employee_profiles').select('id, role_id, roles(name)')
            .eq('branch_id', branchId).or('is_disabled.is.null,is_disabled.eq.false'),
          // Today's student attendance
          supabase.from('student_attendance').select('id, status')
            .eq('branch_id', branchId).eq('session_id', sessionId).eq('date', today),
          // Today's staff attendance
          supabase.from('staff_attendance').select('id, status')
            .eq('branch_id', branchId).eq('session_id', sessionId).eq('attendance_date', today),
          // Pending leave requests
          supabase.from('leave_requests').select('id', { count: 'exact', head: true })
            .eq('branch_id', branchId).eq('status', 'pending'),
          // Recent notices (notices table uses notice_date, no is_published column)
          supabase.from('notices').select('id, title, notice_date, message')
            .eq('branch_id', branchId)
            .order('notice_date', { ascending: false }).limit(5),
          // Classes — handle NULL session_id (classes table has no is_active column)
          supabase.from('classes').select('id', { count: 'exact', head: true })
            .eq('branch_id', branchId)
            .or(`session_id.eq.${sessionId},session_id.is.null`),
          // Sections — handle NULL session_id (sections table has no is_active column)
          supabase.from('sections').select('id', { count: 'exact', head: true })
            .eq('branch_id', branchId)
            .or(`session_id.eq.${sessionId},session_id.is.null`),
        ]);

        // Debug: Log all query results for troubleshooting
        if (studentsRes.error) console.error('[PrincipalDashboard] Students error:', studentsRes.error);
        if (staffRes.error) console.error('[PrincipalDashboard] Staff error:', staffRes.error);
        if (studentAttRes.error) console.error('[PrincipalDashboard] StudentAtt error:', studentAttRes.error);
        if (staffAttRes.error) console.error('[PrincipalDashboard] StaffAtt error:', staffAttRes.error);
        if (pendingLeavesRes.error) console.error('[PrincipalDashboard] Leaves error:', pendingLeavesRes.error);
        if (noticesRes.error) console.error('[PrincipalDashboard] Notices error:', noticesRes.error);
        if (classesRes.error) console.error('[PrincipalDashboard] Classes error:', classesRes.error);
        if (sectionsRes.error) console.error('[PrincipalDashboard] Sections error:', sectionsRes.error);
        
        console.log('[PrincipalDashboard] Results:', {
          students: studentsRes.count, staff: staffRes.data?.length,
          classes: classesRes.count, sections: sectionsRes.count
        });

        // Students
        const totalStudents = studentsRes.count || 0;

        // Staff breakdown
        const staffData = staffRes.data || [];
        const totalStaff = staffData.length;
        const teacherCount = staffData.filter(e => {
          const roleName = e.roles?.name?.toLowerCase() || '';
          return roleName.includes('teacher');
        }).length;

        // Student attendance
        const studentAtt = studentAttRes.data || [];
        const studentPresent = studentAtt.filter(a => a.status === 'present' || a.status === 'late').length;
        const studentAbsent = studentAtt.filter(a => a.status === 'absent').length;
        const studentLate = studentAtt.filter(a => a.status === 'late').length;
        const studentTotal = studentAtt.length;
        const studentRate = studentTotal > 0 ? Math.round((studentPresent / studentTotal) * 100) : 0;

        // Staff attendance
        const staffAtt = staffAttRes.data || [];
        const staffPresent = staffAtt.filter(a => a.status === 'present' || a.status === 'late').length;
        const staffAbsent = staffAtt.filter(a => a.status === 'absent').length;
        const staffTotal = staffAtt.length;
        const staffRate = staffTotal > 0 ? Math.round((staffPresent / staffTotal) * 100) : 0;

        setDashData({
          totalStudents,
          totalStaff,
          teacherCount,
          studentAttendanceToday: { present: studentPresent, absent: studentAbsent, late: studentLate, total: studentTotal, rate: studentRate },
          staffAttendanceToday: { present: staffPresent, absent: staffAbsent, total: staffTotal, rate: staffRate },
          pendingLeaves: pendingLeavesRes.count || 0,
          recentNotices: noticesRes.data || [],
          classCount: classesRes.count || 0,
          sectionCount: sectionsRes.count || 0,
        });
      } catch (err) {
        console.error('[PrincipalDashboard] Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [selectedBranch?.id, currentSessionId, user?.profile?.branch_id]);

  const { studentAttendanceToday: stuAtt, staffAttendanceToday: staffAtt } = dashData;

  return (
    <DashboardLayout>
      {/* Welcome */}
      <WelcomeMessage
        user={user?.profile?.full_name || 'Principal'}
        message={school?.name ? `Managing ${school.name}` : "Here's your school overview."}
      />

      {/* Loading Skeleton */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-36 bg-muted animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : (
        <>
          {/* Main Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <PrincipalStatCard
              title="Total Students"
              value={dashData.totalStudents}
              icon={Users}
              gradient="from-violet-600 via-purple-600 to-indigo-600"
              subtitle={`${dashData.classCount} classes · ${dashData.sectionCount} sections`}
              delay={0}
            />
            <PrincipalStatCard
              title="Total Staff"
              value={dashData.totalStaff}
              icon={Briefcase}
              gradient="from-emerald-500 via-green-500 to-teal-500"
              subtitle={`${dashData.teacherCount} teachers`}
              delay={100}
            />
            <PrincipalStatCard
              title="Student Attendance"
              value={stuAtt.total > 0 ? `${stuAtt.rate}%` : 'No data'}
              icon={CalendarCheck}
              gradient="from-cyan-500 via-blue-500 to-indigo-500"
              subtitle={stuAtt.total > 0 ? `${stuAtt.present} present · ${stuAtt.absent} absent` : 'Not marked yet'}
              delay={200}
            />
            <PrincipalStatCard
              title="Staff Attendance"
              value={staffAtt.total > 0 ? `${staffAtt.rate}%` : 'No data'}
              icon={UserCheck}
              gradient="from-amber-500 via-orange-500 to-yellow-500"
              subtitle={staffAtt.total > 0 ? `${staffAtt.present} present · ${staffAtt.absent} absent` : 'Not marked yet'}
              delay={300}
            />
          </div>

          {/* Secondary Stats & Info */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Student Attendance Breakdown */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <CalendarCheck className="h-5 w-5 text-blue-500" />
                  Today's Student Attendance
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stuAtt.total > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Attendance Rate</span>
                      <span className="text-2xl font-bold text-blue-600">{stuAtt.rate}%</span>
                    </div>
                    <Progress value={stuAtt.rate} className="h-3" />
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                      <div className="text-center p-2 bg-green-50 dark:bg-green-950/30 rounded-lg">
                        <div className="text-lg font-bold text-green-600">{stuAtt.present}</div>
                        <div className="text-xs text-muted-foreground">Present</div>
                      </div>
                      <div className="text-center p-2 bg-red-50 dark:bg-red-950/30 rounded-lg">
                        <div className="text-lg font-bold text-red-600">{stuAtt.absent}</div>
                        <div className="text-xs text-muted-foreground">Absent</div>
                      </div>
                      <div className="text-center p-2 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
                        <div className="text-lg font-bold text-amber-600">{stuAtt.late}</div>
                        <div className="text-xs text-muted-foreground">Late</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-6 text-muted-foreground">
                    <Clock className="h-10 w-10 mb-2 opacity-40" />
                    <p className="text-sm">Attendance not marked yet today</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Staff Attendance Breakdown */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-orange-500" />
                  Today's Staff Attendance
                </CardTitle>
              </CardHeader>
              <CardContent>
                {staffAtt.total > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Attendance Rate</span>
                      <span className="text-2xl font-bold text-orange-600">{staffAtt.rate}%</span>
                    </div>
                    <Progress value={staffAtt.rate} className="h-3" />
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="text-center p-2 bg-green-50 dark:bg-green-950/30 rounded-lg">
                        <div className="text-lg font-bold text-green-600">{staffAtt.present}</div>
                        <div className="text-xs text-muted-foreground">Present</div>
                      </div>
                      <div className="text-center p-2 bg-red-50 dark:bg-red-950/30 rounded-lg">
                        <div className="text-lg font-bold text-red-600">{staffAtt.absent}</div>
                        <div className="text-xs text-muted-foreground">Absent</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-6 text-muted-foreground">
                    <Clock className="h-10 w-10 mb-2 opacity-40" />
                    <p className="text-sm">Staff attendance not marked yet</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pending Actions & Quick Links */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Actions & Quick Links
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashData.pendingLeaves > 0 && (
                    <div
                      className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-950/50 transition-colors"
                      onClick={() => navigate(ROUTES.SUPER_ADMIN.APPROVE_STAFF_LEAVE)}
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive" className="text-xs">{dashData.pendingLeaves}</Badge>
                        <span className="text-sm font-medium">Pending Leave Requests</span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <div
                    className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-950/50 transition-colors"
                    onClick={() => navigate(ROUTES.SUPER_ADMIN.STUDENT_DETAILS)}
                  >
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">View Students</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div
                    className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/30 rounded-lg cursor-pointer hover:bg-green-100 dark:hover:bg-green-950/50 transition-colors"
                    onClick={() => navigate(ROUTES.SUPER_ADMIN.STAFF_DIRECTORY)}
                  >
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">View Staff Directory</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div
                    className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-950/50 transition-colors"
                    onClick={() => navigate(ROUTES.SUPER_ADMIN.CLASS_TIMETABLE)}
                  >
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium">Class Timetable</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Notices */}
          {dashData.recentNotices.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Bell className="h-5 w-5 text-indigo-500" />
                    Recent Notices
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.SUPER_ADMIN.NOTICE_BOARD)}>
                    View All <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {dashData.recentNotices.map(notice => (
                    <div key={notice.id} className="flex items-center justify-between p-3 bg-muted/40 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{notice.title}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {notice.notice_date ? formatDayMonth(notice.notice_date, '') : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </DashboardLayout>
  );
};

export default PrincipalDashboard;
