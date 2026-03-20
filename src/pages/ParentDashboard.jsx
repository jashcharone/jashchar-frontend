import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, GraduationCap, Calendar, CreditCard, BookOpen, 
  ArrowLeft, Clock, MapPin, Phone, Mail, ChevronRight,
  TrendingUp, Bell, FileText, Bus, Building, CheckCircle2,
  XCircle, AlertCircle, IndianRupee, Award, BarChart3, Star,
  CalendarDays, Loader2
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { useToast } from '@/components/ui/use-toast';
import WelcomeMessage from '@/components/WelcomeMessage';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { ParentSelectedChildProvider, useParentSelectedChild } from '@/contexts/ParentSelectedChildContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabaseClient';
import { format } from 'date-fns';

// Child Card Component - Shows in the "My Children" view
const ChildCard = ({ child, onViewDashboard, index }) => {
  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
  };

  const bgGradients = [
    'from-pink-500/80 via-purple-500/60 to-transparent',
    'from-blue-500/80 via-indigo-500/60 to-transparent',
    'from-green-500/80 via-teal-500/60 to-transparent',
    'from-orange-500/80 via-red-500/60 to-transparent',
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.15, duration: 0.5 }}
      className="relative overflow-hidden rounded-2xl shadow-xl"
    >
      {/* Background with gradient overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ 
          backgroundImage: `url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop')`,
          filter: 'brightness(0.7)'
        }}
      />
      <div className={`absolute inset-0 bg-gradient-to-r ${bgGradients[index % bgGradients.length]}`} />
      
      <div className="relative p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6">
        {/* Student Photo */}
        <div className="w-32 h-40 bg-white rounded-lg shadow-lg overflow-hidden flex-shrink-0">
          {child.photo_url ? (
            <img src={child.photo_url} alt={child.full_name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <span className="text-4xl font-bold text-gray-400">
                {getInitials(child.full_name || child.first_name)}
              </span>
            </div>
          )}
        </div>

        {/* Student Info */}
        <div className="flex-1 text-white">
          <h3 className="text-2xl font-bold mb-1">
            {child.full_name || `${child.first_name} ${child.last_name}`}
          </h3>
          <p className="text-white/80 mb-4">My Child</p>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <GraduationCap size={16} className="text-red-300" />
              <span className="text-sm">{child.class_name || 'Class'} {child.section_name ? `(${child.section_name})` : ''}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-red-300" />
              <span className="text-sm">Roll No: {child.roll_number || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-red-300" />
              <span className="text-sm">{child.school_code || child.admission_number || child.student_id || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-red-300" />
              <span className="text-sm">
                {child.date_of_birth ? format(new Date(child.date_of_birth), 'dd.MMM.yyyy') : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Dashboard Button */}
        <div className="sm:self-start">
          <Button 
            onClick={() => onViewDashboard(child)}
            className="bg-red-500 hover:bg-red-600 text-white rounded-full px-6"
          >
            <span className="mr-2">●</span> Dashboard
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

// Child Dashboard Component - Shows when "Dashboard" is clicked
const ChildDashboard = ({ child, onBack }) => {
  const [feeData, setFeeData] = useState(null);
  const [attendanceData, setAttendanceData] = useState(null);
  const [recentExam, setRecentExam] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChildData = async () => {
      try {
        // Fetch fee payments (non-reverted)
        const { data: fees } = await supabase
          .from('fee_payments')
          .select('amount, payment_date, payment_mode, reverted_at')
          .eq('student_id', child.id)
          .is('reverted_at', null)
          .order('payment_date', { ascending: false });

        const paidFees = fees?.reduce((sum, f) => sum + (f.amount || 0), 0) || 0;

        // Fetch fee allocations for total (amount is in fee_masters table)
        const { data: allocs, error: allocError } = await supabase
          .from('student_fee_allocations')
          .select('fee_master_id, fee_masters(amount)')
          .eq('student_id', child.id);

        // Calculate total fees from fee_masters
        const totalFees = allocError ? 0 : (allocs || []).reduce((sum, a) => sum + (a.fee_masters?.amount || 0), 0);

        setFeeData({
          total: totalFees,
          paid: paidFees,
          remaining: Math.max(totalFees - paidFees, 0),
          recentPayments: (fees || []).slice(0, 3),
        });

        // Fetch attendance for current month
        const now = new Date();
        const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
        const monthEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()}`;
        
        const { data: attRecords } = await supabase
          .from('student_attendance')
          .select('status, date')
          .eq('student_id', child.id)
          .gte('date', monthStart)
          .lte('date', monthEnd);

        const attCounts = { present: 0, absent: 0, late: 0, leave: 0, total: 0 };
        (attRecords || []).forEach(r => {
          attCounts.total++;
          if (r.status === 'present' || r.status === 'late' || r.status === 'half_day') attCounts.present++;
          else if (r.status === 'absent') attCounts.absent++;
          else if (r.status === 'late') attCounts.late++;
          else if (r.status === 'leave') attCounts.leave++;
        });
        attCounts.percentage = attCounts.total > 0 ? Math.round((attCounts.present / attCounts.total) * 100) : 0;

        // Check today's attendance
        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const todayRecord = (attRecords || []).find(r => r.date === today);

        setAttendanceData({ ...attCounts, todayStatus: todayRecord?.status || null });

        // Fetch latest exam result (using exam_marks table)
        const { data: examMarks, error: examError } = await supabase
          .from('exam_marks')
          .select('marks_obtained, marks_theory, marks_practical, exam_subject_id, exam_subjects(max_marks, subject_name, exams(name, exam_date))')
          .eq('student_id', child.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (!examError && examMarks?.length) {
          const latestExam = examMarks[0]?.exam_subjects?.exams?.name;
          const examGroup = examMarks.filter(m => m.exam_subjects?.exams?.name === latestExam);
          const totalObtained = examGroup.reduce((s, m) => s + (m.marks_obtained || m.marks_theory || 0), 0);
          const totalMax = examGroup.reduce((s, m) => s + (m.exam_subjects?.max_marks || 100), 0);
          setRecentExam({
            name: latestExam,
            percentage: totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0,
            subjects: examGroup.length,
          });
        }

      } catch (error) {
        console.error('Error fetching child data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChildData();
  }, [child.id]);

  const getAttStatusColor = (status) => {
    if (status === 'present') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400';
    if (status === 'absent') return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400';
    if (status === 'late') return 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400';
    if (status === 'leave') return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400';
    return 'bg-gray-100 text-gray-500';
  };

  const quickLinks = [
    { title: 'Attendance', icon: CheckCircle2, path: '/Parent/attendance', color: 'text-emerald-500' },
    { title: 'Fee Details', icon: CreditCard, path: '/Parent/fees', color: 'text-blue-500' },
    { title: 'Exam Results', icon: Award, path: '/Parent/exam-result', color: 'text-purple-500' },
    { title: 'Apply Leave', icon: CalendarDays, path: '/Parent/apply-leave', color: 'text-amber-500' },
    { title: 'Homework', icon: BookOpen, path: '/Parent/homework', color: 'text-pink-500' },
    { title: 'Timetable', icon: Clock, path: '/Parent/timetable', color: 'text-indigo-500' },
    { title: 'Transport', icon: Bus, path: '/Parent/transport', color: 'text-teal-500' },
    { title: 'Notice Board', icon: Bell, path: '/Parent/notice-board', color: 'text-red-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-4 flex-1">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center overflow-hidden border-2 border-primary/20">
            {child.photo_url ? (
              <img src={child.photo_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl font-bold text-primary">
                {(child.full_name || child.first_name || '?')[0].toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold">{child.full_name || `${child.first_name} ${child.last_name}`}</h1>
            <p className="text-sm text-muted-foreground">
              {child.class_name} {child.section_name && `(${child.section_name})`} • Roll #{child.roll_number || 'N/A'}
            </p>
          </div>
        </div>
        {/* Today's Status */}
        {attendanceData?.todayStatus && (
          <Badge className={`text-sm px-3 py-1 ${getAttStatusColor(attendanceData.todayStatus)}`}>
            Today: {attendanceData.todayStatus.charAt(0).toUpperCase() + attendanceData.todayStatus.slice(1)}
          </Badge>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading dashboard...
        </div>
      ) : (
        <>
          {/* ── Summary Cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
              <Card className="border-emerald-200 dark:border-emerald-800">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                    <div>
                      <p className="text-2xl font-bold text-emerald-600">{attendanceData?.percentage || 0}%</p>
                      <p className="text-xs text-muted-foreground">Attendance This Month</p>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-2 text-xs">
                    <span className="text-emerald-600">P: {attendanceData?.present || 0}</span>
                    <span className="text-red-500">A: {attendanceData?.absent || 0}</span>
                    <span className="text-blue-500">L: {attendanceData?.leave || 0}</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
              <Card className="border-blue-200 dark:border-blue-800">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <IndianRupee className="h-8 w-8 text-blue-500" />
                    <div>
                      <p className="text-2xl font-bold text-blue-600">₹{(feeData?.remaining || 0).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Fee Pending</p>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Paid: ₹{(feeData?.paid || 0).toLocaleString()} / ₹{(feeData?.total || 0).toLocaleString()}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="border-purple-200 dark:border-purple-800">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Award className="h-8 w-8 text-purple-500" />
                    <div>
                      <p className="text-2xl font-bold text-purple-600">{recentExam?.percentage || '-'}%</p>
                      <p className="text-xs text-muted-foreground">Last Exam Score</p>
                    </div>
                  </div>
                  {recentExam && (
                    <p className="text-xs text-muted-foreground mt-2 truncate">{recentExam.name} ({recentExam.subjects} subjects)</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <GraduationCap className="h-8 w-8 text-primary" />
                    <div>
                      <p className="text-lg font-bold">{child.class_name}</p>
                      <p className="text-xs text-muted-foreground">
                        Section {child.section_name || '-'} • Roll #{child.roll_number || '-'}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Adm#: {child.school_code || child.admission_number || '-'}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* ── Quick Links ── */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
                {quickLinks.map((link, i) => (
                  <motion.a
                    key={link.title}
                    href={link.path}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-muted/50 transition-colors text-center"
                  >
                    <div className={`p-2 rounded-lg bg-muted/50 ${link.color}`}>
                      <link.icon className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-medium">{link.title}</span>
                  </motion.a>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* ── Recent Fee Payments ── */}
          {feeData?.recentPayments?.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="h-4 w-4" /> Recent Fee Payments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {feeData.recentPayments.map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div>
                        <p className="font-medium text-sm">₹{(p.amount || 0).toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">
                          {p.payment_date ? format(new Date(p.payment_date), 'dd MMM yyyy') : ''} • {p.payment_mode || 'Cash'}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-emerald-600">Paid</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

// Main Parent Dashboard Component - Inner component that uses context
const ParentDashboardInner = () => {
  const { toast } = useToast();
  const { user, school } = useAuth();
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const { selectedChild, setSelectedChild } = useParentSelectedChild();

  useEffect(() => {
    const fetchChildren = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        console.log('[ParentDashboard] User:', user.id, 'Email:', user.email);
        console.log('[ParentDashboard] User metadata:', JSON.stringify(user.user_metadata));

        // Use backend API to fetch children (bypasses RLS using service role)
        const { data: session } = await supabase.auth.getSession();
        const token = session?.session?.access_token;
        const branchId = user.user_metadata?.branch_id || school?.id;
        
        const response = await fetch('/api/students/parent/children', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'x-branch-id': branchId
          }
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const result = await response.json();
        console.log('[ParentDashboard] API response:', JSON.stringify(result, null, 2));
        console.log('[ParentDashboard] Children count:', result.children?.length || 0);

        if (result.children && result.children.length > 0) {
          console.log('[ParentDashboard] Setting children:', result.children.map(c => c.full_name));
          setChildren(result.children);
          // Don't auto-select first child - show children list first
          // setSelectedChild(result.children[0]);
        } else {
          // No children linked
          console.log('[ParentDashboard] No children in response');
          setChildren([]);
        }

      } catch (error) {
        console.error('Error fetching children:', error);
        toast({ variant: "destructive", title: "Error", description: "Failed to load children data" });
      } finally {
        setLoading(false);
      }
    };

    fetchChildren();
  }, [user, school, toast]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading your children...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // If a child is selected, show their dashboard
  if (selectedChild) {
    return (
      <DashboardLayout>
        <ChildDashboard child={selectedChild} onBack={() => setSelectedChild(null)} />
      </DashboardLayout>
    );
  }

  // Show list of children (My Children view)
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <WelcomeMessage 
          user={user?.user_metadata?.full_name || user?.user_metadata?.first_name || user?.profile?.full_name || 'Parent'}
          message="Welcome! Here are your children enrolled in our school."
        />

        {/* Children List */}
        <div className="space-y-6">
          {children.length === 0 ? (
            <Card className="p-8 text-center">
              <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Children Linked</h3>
              <p className="text-muted-foreground">
                No children are linked to your account yet. Please contact the school administration.
              </p>
            </Card>
          ) : (
            children.map((child, index) => (
              <ChildCard 
                key={child.id} 
                child={child} 
                index={index}
                onViewDashboard={setSelectedChild}
              />
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

// Main wrapper component that provides the context
const ParentDashboard = () => {
  return (
    <ParentSelectedChildProvider>
      <ParentDashboardInner />
    </ParentSelectedChildProvider>
  );
};

export default ParentDashboard;
