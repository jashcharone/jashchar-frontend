import React, { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Users, UserCheck, IndianRupee, GraduationCap, Layout, Save, X } from 'lucide-react';
import WelcomeMessage from '@/components/WelcomeMessage';
import { Button } from '@/components/ui/button';
import DraggableStatsGrid from '@/components/dashboard/DraggableStatsGrid';
import DraggableWidgetGrid from '@/components/dashboard/DraggableWidgetGrid';
import AttendanceChart from '@/components/dashboard/charts/AttendanceChart';
import FeeCollectionChart from '@/components/dashboard/charts/FeeCollectionChart';

const AdminDashboard = () => {
  const { user, school } = useAuth();
  const currencySymbol = school?.currency_symbol || '₹';
  const [isEditing, setIsEditing] = useState(false);

  // Initial Data
  const initialStats = useMemo(() => [
    { id: 'students', title: 'Total Students', value: '1,250', icon: Users, change: '+5.2%' },
    { id: 'staff', title: 'Total Staff', value: '82', icon: UserCheck, change: '+1.2%' },
    { id: 'fees', title: 'Fees Collection', value: `${currencySymbol}55,000`, icon: IndianRupee, change: '+15%' },
    { id: 'admissions', title: 'New Admissions', value: '120', icon: GraduationCap, change: '+10' },
  ], [currencySymbol]);

  const initialWidgets = useMemo(() => [
    { id: 'attendance', component: <AttendanceChart /> },
    { id: 'feeCollection', component: <FeeCollectionChart /> },
  ], []);

  const [stats, setStats] = useState(initialStats);
  const [widgets, setWidgets] = useState(initialWidgets);

  // Load from LocalStorage
  useEffect(() => {
    const savedStatsOrder = JSON.parse(localStorage.getItem('dashboard-stats-order'));
    const savedWidgetsOrder = JSON.parse(localStorage.getItem('dashboard-widgets-order'));

    if (savedStatsOrder) {
      // Map saved IDs back to full objects
      const reorderedStats = savedStatsOrder.map(id => initialStats.find(s => s.id === id)).filter(Boolean);
      // Append any new stats that weren't in saved order
      const newStats = initialStats.filter(s => !savedStatsOrder.includes(s.id));
      setStats([...reorderedStats, ...newStats]);
    } else {
        setStats(initialStats);
    }

    if (savedWidgetsOrder) {
      const reorderedWidgets = savedWidgetsOrder.map(id => initialWidgets.find(w => w.id === id)).filter(Boolean);
      const newWidgets = initialWidgets.filter(w => !savedWidgetsOrder.includes(w.id));
      setWidgets([...reorderedWidgets, ...newWidgets]);
    } else {
        setWidgets(initialWidgets);
    }
  }, [initialStats, initialWidgets]);

  const saveLayout = () => {
    const statsOrder = stats.map(s => s.id);
    const widgetsOrder = widgets.map(w => w.id);
    localStorage.setItem('dashboard-stats-order', JSON.stringify(statsOrder));
    localStorage.setItem('dashboard-widgets-order', JSON.stringify(widgetsOrder));
    setIsEditing(false);
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex-1">
            <WelcomeMessage 
            user={user?.profile?.full_name || 'Admin'}
            message="Here's what's happening in your school today."
            />
        </div>
        <div className="flex gap-2 shrink-0">
            {isEditing ? (
                <>
                    <Button variant="outline" onClick={() => setIsEditing(false)} className="gap-2">
                        <X className="h-4 w-4" /> Cancel
                    </Button>
                    <Button onClick={saveLayout} className="gap-2">
                        <Save className="h-4 w-4" /> Save Layout
                    </Button>
                </>
            ) : (
                <Button variant="outline" onClick={() => setIsEditing(true)} className="gap-2">
                    <Layout className="h-4 w-4" /> Customize Dashboard
                </Button>
            )}
        </div>
      </div>
      
      <DraggableStatsGrid 
        items={stats} 
        onReorder={setStats} 
        isEditing={isEditing} 
      />
      
      <DraggableWidgetGrid 
        items={widgets} 
        onReorder={setWidgets} 
        isEditing={isEditing} 
      />
    </DashboardLayout>
  );
};

export default AdminDashboard;
