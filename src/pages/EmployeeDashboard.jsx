import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import WelcomeMessage from '@/components/WelcomeMessage';
import StatCard from '@/components/StatCard';
import { CalendarCheck, Briefcase, ClipboardList, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const EmployeeDashboard = () => {
    const { user } = useAuth();

    const stats = [
        { title: 'Attendance', value: '95%', icon: CalendarCheck, change: 'Present Today' },
        { title: 'Pending Tasks', value: '3', icon: ClipboardList, changeType: 'increase' },
        { title: 'Available Leave', value: '12', icon: Briefcase },
        { title: 'Work Hours', value: '45h', icon: Clock, change: 'This Week' },
    ];

    return (
        <DashboardLayout>
            <WelcomeMessage 
                user={user?.profile?.full_name || 'Employee'}
                message="Here is your work overview."
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat, index) => (
                    <StatCard key={index} {...stat} index={index} />
                ))}
            </div>

            <div className="bg-card p-6 rounded-xl shadow-lg border text-center text-muted-foreground">
                <p>Welcome to the Employee Dashboard. Select an option from the sidebar to get started.</p>
            </div>
        </DashboardLayout>
    );
};

export default EmployeeDashboard;
