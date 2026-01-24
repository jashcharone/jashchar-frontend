import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import StatCard from '@/components/StatCard';
import WelcomeMessage from '@/components/WelcomeMessage';
import { Users, UserCheck, Briefcase, BookOpen } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const PrincipalDashboard = () => {
    const { user, school } = useAuth();

    // Placeholder data - replace with real data from your backend
    const stats = [
        { title: 'Total Students', value: '1,250', icon: Users, change: '+12 this week', changeType: 'increase' },
        { title: 'Total Teachers', value: '85', icon: Briefcase, change: '+1 this month', changeType: 'increase' },
        { title: 'Today\'s Attendance', value: '95%', icon: UserCheck, change: '2% from yesterday', changeType: 'increase' },
        { title: 'Subjects Offered', value: '45', icon: BookOpen },
    ];

    return (
        <DashboardLayout>
            <WelcomeMessage 
                user={user?.profile?.full_name || 'Principal'}
                message={school?.name ? `Managing ${school.name}` : "Here's your school overview."}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat, index) => (
                    <StatCard key={index} {...stat} index={index} />
                ))}
            </div>
             {/* More components like Teacher Performance, Class Performance etc. can be added here */}
        </DashboardLayout>
    );
};

export default PrincipalDashboard;
