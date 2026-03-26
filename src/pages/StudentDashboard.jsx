import React from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import StatCard from '@/components/StatCard';
import { BookOpen, IndianRupee, CalendarCheck, ClipboardList, PenSquare, Bus } from 'lucide-react';
import WelcomeMessage from '@/components/WelcomeMessage';
import { ROUTES } from '@/registry/routeRegistry';

const StudentDashboard = () => {
    const { user } = useAuth();
    
    // Placeholder data
    const stats = [
        { title: 'Subjects Enrolled', value: '6', icon: BookOpen },
        { title: 'Attendance', value: '92%', icon: CalendarCheck, change: '100% this week' },
        { title: 'Upcoming Assignments', value: '2', icon: ClipboardList },
        { title: 'Pending Fees', value: '?1,500', icon: IndianRupee, changeType: 'increase' },
    ];
    
    const quickLinks = [
        { title: 'My Timetable', icon: CalendarCheck, path: ROUTES.STUDENT.TIMETABLE || '#' },
        { title: 'My Subjects', icon: BookOpen, path: '#' },
        { title: 'My Fees', icon: IndianRupee, path: ROUTES.STUDENT.FEES || '#' },
        { title: 'Examinations', icon: PenSquare, path: ROUTES.STUDENT.EXAM_SCHEDULE || '#' },
        { title: 'Transport', icon: Bus, path: ROUTES.STUDENT.TRANSPORT_ROUTES || '#' },
    ];

    return (
        <DashboardLayout>
            <WelcomeMessage 
                user={user?.profile?.full_name || user?.user_metadata?.full_name || 'Student'}
                message="Stay on top of your classes and assignments."
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat, index) => (
                    <StatCard key={index} {...stat} index={index} />
                ))}
            </div>

            <div>
                <h2 className="text-xl font-bold text-foreground mb-4">Quick Links</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {quickLinks.map((link, index) => {
                        const Icon = link.icon;
                        return (
                            <Link to={link.path} key={index} className="bg-card p-6 rounded-xl shadow-lg border text-center hover:bg-muted transition-colors group block">
                                <Icon className="h-8 w-8 mx-auto text-primary mb-3 transition-transform group-hover:-translate-y-1" />
                                <h3 className="font-semibold text-foreground">{link.title}</h3>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default StudentDashboard;
