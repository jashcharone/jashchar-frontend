import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import api from '@/lib/api';
import { ROUTES } from '@/registry/routeRegistry';
import { formatLongDate } from '@/utils/dateUtils';
import { Calendar, User, Book, Clock, AlertCircle } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';

const StatCard = ({ title, value, subtext, color, icon: Icon }) => (
  <div className={`bg-card p-6 rounded-xl shadow-sm border-l-4 ${color} hover:bg-muted/50 transition-colors`}>
    <div className="flex justify-between items-start">
      <div>
        <h3 className="text-muted-foreground font-medium text-sm uppercase tracking-wide">{title}</h3>
        <p className="text-3xl font-bold text-foreground mt-2">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
      </div>
      {Icon && <Icon className="w-8 h-8 opacity-20 text-foreground" />}
    </div>
  </div>
);

const ProgressBar = ({ label, value, colorClass }) => (
  <div className="mb-4">
    <div className="flex justify-between mb-1">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <span className="text-sm font-bold text-foreground">{value}%</span>
    </div>
    <div className="w-full bg-muted rounded-full h-2.5">
      <div className={`${colorClass} h-2.5 rounded-full`} style={{ width: `${value}%` }}></div>
    </div>
  </div>
);

const StudentDashboard = () => {
  const { session } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Using centralized api client for proper URL handling
        const response = await api.get('/dashboard/student');
        setStats(response.data);
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    if (session?.access_token) fetchStats();
  }, [session]);

  if (loading) return (
    <DashboardLayout>
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    </DashboardLayout>
  );
  
  if (error) return (
    <DashboardLayout>
      <div className="p-6 text-red-500 bg-red-50 rounded-lg m-6">{error}</div>
    </DashboardLayout>
  );

  const profile = stats?.profile || {};

  return (
    <DashboardLayout>
      {/* Header Section */}
      <div className="bg-card rounded-xl shadow-sm p-6 mb-8 flex flex-col md:flex-row gap-6 items-center border border-border">
        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center text-primary text-3xl font-bold border-2 border-primary/20">
          {profile.profile_image ? (
             <img src={profile.profile_image} alt="Profile" className="w-full h-full object-cover rounded-full" />
          ) : (
             profile.full_name?.charAt(0) || 'S'
          )}
        </div>
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-2xl font-bold text-foreground">{profile.full_name}</h1>
          <div className="flex flex-wrap gap-4 mt-2 justify-center md:justify-start text-sm text-muted-foreground">
             <span className="flex items-center gap-1"><User className="w-4 h-4"/> Enroll ID: <span className="text-foreground font-medium">{profile.enrollment_id}</span></span>
             <span className="flex items-center gap-1"><Calendar className="w-4 h-4"/> Class: <span className="text-foreground font-medium">{profile.current_class} - {profile.section}</span></span>
             <span className="flex items-center gap-1"><AlertCircle className="w-4 h-4"/> Roll No: <span className="text-foreground font-medium">{profile.roll_no}</span></span>
          </div>
        </div>
        <div className="text-right hidden md:block">
            <div className="text-sm text-muted-foreground">Current Date</div>
            <div className="text-lg font-bold text-foreground">{formatLongDate(new Date())}</div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Link to={ROUTES.STUDENT.ATTENDANCE}>
            <StatCard 
              title="Attendance" 
              value={stats.attendancePercentage || "0%"} 
              subtext="Current Academic Year" 
              color="border-emerald-500" 
              icon={User}
            />
        </Link>
        <div className="cursor-pointer">
            <StatCard 
              title="Fees Paid" 
              value={`? ${stats.fees?.paid || 0}`} 
              subtext={`Due: ? ${stats.fees?.due || 0}`} 
              color="border-blue-500" 
              icon={Book}
            />
        </div>
        <div className="cursor-pointer">
            <StatCard 
              title="Notifications" 
              value={stats.notifications?.length || 0} 
              subtext="Unread messages" 
              color="border-orange-500" 
              icon={AlertCircle}
            />
        </div>
         <div className="cursor-pointer">
            <StatCard 
              title="Total Results" 
              value={`${stats.results?.total || 0}/${stats.results?.exams || 0}`} 
              subtext="Passed Exams" 
              color="border-violet-500" 
              icon={Book}
            />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - 2/3 width */}
        <div className="lg:col-span-2 space-y-8">
            
            {/* Subject Progress */}
            <div className="bg-card rounded-xl shadow-sm border border-border p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                        <Book className="w-5 h-5 text-primary" /> 
                        Subject Progress
                    </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                    {stats.subjectProgress?.map((subject, idx) => (
                        <ProgressBar 
                            key={idx} 
                            label={subject.name} 
                            value={subject.progress} 
                            colorClass={subject.color} 
                        />
                    ))}
                </div>
            </div>

            {/* Upcoming Classes */}
            <div className="bg-card rounded-xl shadow-sm border border-border p-6">
                <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    Upcoming Classes
                </h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted text-muted-foreground">
                            <tr>
                                <th className="px-4 py-3 rounded-tl-lg">Subject</th>
                                <th className="px-4 py-3">Time</th>
                                <th className="px-4 py-3">Room</th>
                                <th className="px-4 py-3 rounded-tr-lg">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {stats.upcomingClasses?.map((cls, idx) => (
                                <tr key={idx} className="hover:bg-muted/30">
                                    <td className="px-4 py-3 font-medium">{cls.subject}</td>
                                    <td className="px-4 py-3">{cls.time}</td>
                                    <td className="px-4 py-3">{cls.room}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                                            cls.status === 'Live' ? 'bg-red-100 text-red-700' : 
                                            cls.status === 'Upcoming' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                                        }`}>
                                            {cls.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>

        {/* Right Column - 1/3 width */}
        <div className="space-y-8">
            
            {/* Teachers List */}
            <div className="bg-card rounded-xl shadow-sm border border-border p-6">
                <h2 className="text-lg font-bold text-foreground mb-4">My Teachers</h2>
                <div className="space-y-4">
                    {stats.teachers?.map((teacher, idx) => (
                        <div key={idx} className="flex items-center gap-3 pb-3 border-b border-border last:border-0 last:pb-0">
                            <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                                {teacher.image ? (
                                    <img src={teacher.image} alt={teacher.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold text-sm">
                                        {teacher.name.charAt(0)}
                                    </div>
                                )}
                            </div>
                            <div>
                                <h4 className="font-medium text-sm text-foreground">{teacher.name}</h4>
                                <p className="text-xs text-muted-foreground">{teacher.subject}</p>
                            </div>
                            <button className="ml-auto text-xs bg-primary/10 text-primary px-3 py-1 rounded-full hover:bg-primary/20">
                                Message
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Library Books */}
            <div className="bg-card rounded-xl shadow-sm border border-border p-6">
                <h2 className="text-lg font-bold text-foreground mb-4">Library Books</h2>
                <div className="space-y-4">
                    {stats.libraryBooks?.map((book, idx) => (
                        <div key={idx} className="flex gap-3">
                             <div className="w-10 h-14 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                                <Book className="w-5 h-5 text-gray-400" />
                             </div>
                             <div>
                                <h4 className="font-medium text-sm text-foreground line-clamp-1">{book.title}</h4>
                                <p className="text-xs text-muted-foreground">Due: {book.dueDate}</p>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                                    book.status === 'Overdue' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                                }`}>{book.status}</span>
                             </div>
                        </div>
                    ))}
                </div>
                <button className="w-full mt-4 py-2 text-sm text-primary border border-primary/20 rounded-lg hover:bg-primary/5 transition-colors">
                    View All Books
                </button>
            </div>

        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
