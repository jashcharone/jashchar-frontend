import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import axios from 'axios';
import { ROUTES } from '@/registry/routeRegistry';

const StudentDashboard = () => {
  const { session } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL || '/api'}/dashboard/student`, {
          headers: { Authorization: `Bearer ${session?.access_token}` }
        });
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

  if (loading) return <div className="p-6">Loading Dashboard...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div className="p-6 bg-background min-h-screen">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-2xl font-bold">
            {stats?.profile?.full_name?.charAt(0)}
        </div>
        <div>
            <h1 className="text-2xl font-bold text-foreground">Welcome, {stats?.profile?.full_name}</h1>
            <p className="text-muted-foreground">Admission No: {stats?.profile?.admission_no}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Link to={ROUTES.STUDENT.ATTENDANCE}>
            <div className="bg-card p-6 rounded-lg shadow-sm border-l-4 border-green-500 hover:bg-muted/50 transition-colors">
                <h3 className="text-muted-foreground font-medium">Attendance</h3>
                <p className="text-3xl font-bold text-foreground mt-2">{stats?.attendancePercentage}%</p>
                <p className="text-xs text-muted-foreground mt-1">View Detailed Report</p>
            </div>
        </Link>
        <Link to={ROUTES.STUDENT.APPLY_LEAVE}>
            <div className="bg-card p-6 rounded-lg shadow-sm border-l-4 border-purple-500 hover:bg-muted/50 transition-colors">
                <h3 className="text-muted-foreground font-medium">Apply for Leave</h3>
                <p className="text-3xl font-bold text-foreground mt-2">{stats?.leaveBalance || '12'}</p>
                <p className="text-xs text-muted-foreground mt-1">Days Remaining</p>
            </div>
        </Link>
        <div className="bg-card p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
            <h3 className="text-muted-foreground font-medium">Timetable Today</h3>
            <div className="mt-2 space-y-2">
                {stats?.timetable?.map((t, i) => (
                    <div key={i} className="flex justify-between text-sm">
                        <span className="font-medium">{t.subject}</span>
                        <span className="text-muted-foreground">{t.time}</span>
                    </div>
                ))}
            </div>
        </div>
        <div className="bg-card p-6 rounded-lg shadow-sm border-l-4 border-orange-500">
            <h3 className="text-muted-foreground font-medium">Homework Due</h3>
            <div className="mt-2 space-y-2">
                {stats?.homework?.map((h, i) => (
                    <div key={i} className="text-sm border-b border-border pb-2 last:border-0">
                        <p className="font-medium">{h.subject}: {h.title}</p>
                        <p className="text-xs text-red-500 dark:text-red-400">Due: {h.due}</p>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
