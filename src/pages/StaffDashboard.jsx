import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import axios from 'axios';

const StaffDashboard = () => {
  const { session } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL || '/api'}/dashboard/staff`, {
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
      <h1 className="text-2xl font-bold mb-6 text-foreground capitalize">{stats?.role} Dashboard</h1>

      {stats?.role === 'teacher' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
                <h3 className="font-semibold mb-4">Assigned Classes</h3>
                <ul className="list-disc pl-5">
                    {stats?.assignedClasses?.map((cls, idx) => (
                        <li key={idx} className="text-muted-foreground">{cls}</li>
                    ))}
                </ul>
            </div>
            <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
                <h3 className="font-semibold mb-4">Attendance Task</h3>
                {stats?.attendanceMarked ? (
                    <span className="text-green-600 dark:text-green-400 font-medium">✅ Marked for today</span>
                ) : (
                    <span className="text-red-600 dark:text-red-400 font-medium"> ï¸ Pending for today</span>
                )}
            </div>
        </div>
      )}

      {stats?.role === 'accountant' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
                <h3 className="text-muted-foreground text-sm">Today's Collection</h3>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">₹{stats?.todayCollection}</p>
            </div>
            <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
                <h3 className="text-muted-foreground text-sm">Pending Fees</h3>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">₹{stats?.pendingFees}</p>
            </div>
        </div>
      )}
    </div>
  );
};

export default StaffDashboard;
