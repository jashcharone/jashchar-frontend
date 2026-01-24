import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, GraduationCap, Calendar, CreditCard, BookOpen, 
  ArrowLeft, Clock, MapPin, Phone, Mail, ChevronRight,
  TrendingUp, Bell, FileText, Bus, Building, CheckCircle2
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { useToast } from '@/components/ui/use-toast';
import WelcomeMessage from '@/components/WelcomeMessage';
import { useAuth } from '@/contexts/SupabaseAuthContext';
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
              <span className="text-sm">{child.admission_number || child.student_id || 'N/A'}</span>
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
  const [activeTab, setActiveTab] = useState('overview');
  const [feeData, setFeeData] = useState(null);
  const [attendanceData, setAttendanceData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChildData = async () => {
      try {
        // Fetch fee summary for this child
        const { data: fees } = await supabase
          .from('fee_payments')
          .select('amount, status, payment_date')
          .eq('student_id', child.id)
          .order('payment_date', { ascending: false });

        // Calculate fee summary
        const totalFees = fees?.reduce((sum, f) => sum + (f.amount || 0), 0) || 0;
        const paidFees = fees?.filter(f => f.status === 'paid').reduce((sum, f) => sum + (f.amount || 0), 0) || 0;
        
        setFeeData({
          total: totalFees,
          paid: paidFees,
          remaining: totalFees - paidFees,
          payments: fees || []
        });

        // Fetch attendance (mock data for now)
        setAttendanceData({
          present: 85,
          absent: 10,
          late: 5,
          percentage: '85%'
        });

      } catch (error) {
        console.error('Error fetching child data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChildData();
  }, [child.id]);

  const stats = [
    { title: 'Total Fees', value: `₹${feeData?.total?.toLocaleString() || 0}`, icon: CreditCard, color: 'text-blue-500' },
    { title: 'Attendance', value: attendanceData?.percentage || '0%', icon: CheckCircle2, color: 'text-green-500' },
    { title: 'Total Due Days', value: '0.00', icon: Clock, color: 'text-orange-500' },
    { title: 'Homework', value: '0', icon: BookOpen, color: 'text-purple-500' },
  ];

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{child.full_name || `${child.first_name} ${child.last_name}`} - Dashboard</h1>
          <p className="text-muted-foreground">{child.class_name} {child.section_name && `(${child.section_name})`}</p>
        </div>
      </div>

      {/* Fee Summary Chart Area */}
      <Card>
        <CardHeader>
          <CardTitle>My Annual Fee Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-32 flex items-end justify-between gap-2 mb-4">
            {months.map((month, i) => (
              <div key={month} className="flex-1 flex flex-col items-center">
                <div 
                  className="w-full bg-gray-200 dark:bg-gray-700 rounded-t" 
                  style={{ height: `${Math.random() * 80 + 20}%` }}
                />
                <span className="text-xs text-muted-foreground mt-1">{month}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded" />
              <span>Total</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded" />
              <span>Collected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded" />
              <span>Remaining</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg bg-gray-100 dark:bg-gray-800 ${stat.color}`}>
                    <stat.icon size={24} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-500">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                  </div>
                </div>
                <div className="mt-3 text-xs text-muted-foreground uppercase">
                  Interval: 30 Days
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Attendance Overview */}
      <Card>
        <CardHeader>
          <CardTitle>My Annual Attendance Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-32 flex items-end justify-between gap-2 mb-4">
            {months.map((month, i) => (
              <div key={month} className="flex-1 flex flex-col items-center">
                <div 
                  className="w-full bg-gradient-to-t from-green-500 to-green-300 rounded-t opacity-70" 
                  style={{ height: `${Math.random() * 60 + 40}%` }}
                />
                <span className="text-xs text-muted-foreground mt-1">{month}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded" />
              <span>Total Presents</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded" />
              <span>Total Absents</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded" />
              <span>Total Late</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon">◀</Button>
            <Button variant="ghost" size="icon">▶</Button>
            <span className="text-sm">Today</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-red-500" />
            <span className="font-medium">January 2026</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">Month</Button>
            <Button variant="outline" size="sm">Week</Button>
            <Button variant="outline" size="sm">Day</Button>
            <Button variant="outline" size="sm">List</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
              <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
            {Array.from({ length: 35 }, (_, i) => {
              const day = i - 2; // Adjust for starting day
              const isCurrentMonth = day > 0 && day <= 31;
              const isToday = day === 21;
              return (
                <div 
                  key={i} 
                  className={`text-center py-4 rounded ${
                    isToday ? 'bg-red-500 text-white' : 
                    isCurrentMonth ? 'hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer' : 
                    'text-gray-300 dark:text-gray-600'
                  }`}
                >
                  {isCurrentMonth ? day : ''}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Main Parent Dashboard Component
const ParentDashboard = () => {
  const { toast } = useToast();
  const { user, school } = useAuth();
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedChild, setSelectedChild] = useState(null);

  useEffect(() => {
    const fetchChildren = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Get parent's branch_id from branch_users
        const { data: branchUser } = await supabase
          .from('branch_users')
          .select('branch_id')
          .eq('user_id', user.id)
          .maybeSingle();

        const branchId = branchUser?.branch_id || school?.id;

        if (!branchId) {
          console.warn('No branch_id found for parent');
          setLoading(false);
          return;
        }

        // Fetch children linked to this parent
        // Try multiple approaches to find linked students
        
        // Approach 1: Check student_parents junction table
        let { data: studentParents } = await supabase
          .from('student_parents')
          .select('student_id')
          .eq('parent_user_id', user.id);

        let studentIds = studentParents?.map(sp => sp.student_id) || [];

        // Approach 2: Check students table directly for parent_id
        if (studentIds.length === 0) {
          const { data: directStudents } = await supabase
            .from('students')
            .select('id')
            .eq('parent_id', user.id);
          
          studentIds = directStudents?.map(s => s.id) || [];
        }

        // Approach 3: Check students by parent email
        if (studentIds.length === 0 && user.email) {
          const { data: emailStudents } = await supabase
            .from('students')
            .select('id')
            .or(`father_email.eq.${user.email},mother_email.eq.${user.email},guardian_email.eq.${user.email}`);
          
          studentIds = emailStudents?.map(s => s.id) || [];
        }

        if (studentIds.length > 0) {
          // Fetch full student details
          const { data: studentsData } = await supabase
            .from('students')
            .select(`
              id,
              student_id,
              admission_number,
              first_name,
              last_name,
              full_name,
              date_of_birth,
              roll_number,
              photo_url,
              class_id,
              section_id,
              classes(name),
              sections(name)
            `)
            .in('id', studentIds);

          const formattedChildren = studentsData?.map(s => ({
            ...s,
            class_name: s.classes?.name || 'N/A',
            section_name: s.sections?.name || ''
          })) || [];

          setChildren(formattedChildren);
        } else {
          // Demo data for testing
          setChildren([
            {
              id: 'demo-1',
              full_name: 'Arjun Kumar',
              first_name: 'Arjun',
              last_name: 'Kumar',
              class_name: 'Six (A)',
              section_name: 'A',
              roll_number: '1',
              admission_number: 'RSM-00001',
              date_of_birth: '2008-12-29',
              photo_url: null
            },
            {
              id: 'demo-2',
              full_name: 'Priya Kumar',
              first_name: 'Priya',
              last_name: 'Kumar',
              class_name: 'Seven (A)',
              section_name: 'A',
              roll_number: '2',
              admission_number: 'RSM-00008',
              date_of_birth: '2000-07-13',
              photo_url: null
            }
          ]);
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
          user={user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Parent'}
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

export default ParentDashboard;
