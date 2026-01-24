import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import StatCard from '@/components/StatCard';
import { Users, ClipboardList, BookOpen, Clock, CalendarPlus } from 'lucide-react';
import WelcomeMessage from '@/components/WelcomeMessage';

const TeacherDashboard = () => {
    const { user, school } = useAuth();
    
    // Placeholder data
    const stats = [
        { title: 'My Classes', value: '4', icon: Users },
        { title: 'My Subjects', value: '3', icon: BookOpen },
        { title: 'Assignments to Grade', value: '2', icon: ClipboardList, changeType: 'increase' },
        { title: 'Today\'s Classes', value: '5', icon: Clock },
    ];
    
    const schedule = [
        { time: '09:00 - 10:00', class: 'Class 10-A', subject: 'Physics' },
        { time: '10:00 - 11:00', class: 'Class 10-B', subject: 'Physics' },
        { time: '11:30 - 12:30', class: 'Class 9-A', subject: 'Mathematics' },
    ];

    return (
        <DashboardLayout>
            <WelcomeMessage
                user={user?.profile?.full_name || 'Teacher'}
                message={school?.name ? `${school.name} - Today's Schedule` : "Here is your schedule and summary for today."}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat, index) => (
                    <StatCard key={index} {...stat} index={index} />
                ))}
            </div>

            <div className="bg-card p-6 rounded-xl shadow-lg border">
                <h2 className="text-xl font-bold text-foreground mb-4">Today's Schedule</h2>
                <ul className="space-y-4">
                    {schedule.map((item, index) => (
                        <li key={index} className="flex items-center justify-between p-4 rounded-lg bg-background border">
                            <div className="flex items-center">
                                <div className="p-2 bg-primary/10 rounded-full mr-4">
                                    <Clock className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <p className="font-semibold text-foreground">{item.subject}</p>
                                    <p className="text-sm text-muted-foreground">{item.class}</p>
                                </div>
                            </div>
                            <div className="text-sm font-medium text-primary">{item.time}</div>
                        </li>
                    ))}
                    {schedule.length === 0 && <p className="text-muted-foreground text-center py-4">No classes scheduled for today.</p>}
                </ul>
            </div>
        </DashboardLayout>
    );
};

export default TeacherDashboard;
