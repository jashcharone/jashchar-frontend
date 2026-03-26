import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import StatCard from '@/components/StatCard';
import { BookOpen, CheckSquare, BookX, Users } from 'lucide-react';
import WelcomeMessage from '@/components/WelcomeMessage';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const bookIssueData = [
    { day: 'Mon', issued: 12, returned: 8 },
    { day: 'Tue', issued: 15, returned: 10 },
    { day: 'Wed', issued: 8, returned: 11 },
    { day: 'Thu', issued: 18, returned: 15 },
    { day: 'Fri', issued: 25, returned: 20 },
    { day: 'Sat', issued: 30, returned: 22 },
];


const LibrarianDashboard = () => {
    const { user, school } = useAuth();
    
    const stats = [
        { title: 'Total Books', value: '8,500', icon: BookOpen, change: '+50 this week' },
        { title: 'Books Issued', value: '250', icon: CheckSquare, change: '+15 today' },
        { title: 'Books Overdue', value: '15', icon: BookX, change: '+2', changeType: 'increase' },
        { title: 'Library Members', value: '1,200', icon: Users, change: '+5 new' },
    ];
    
    return (
        <DashboardLayout>
            <WelcomeMessage 
                user={user?.profile?.full_name || 'Librarian'}
                message={school?.name ? `Library - ${school.name}` : "Here's an overview of the library's activity."}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat, index) => (
                    <StatCard key={index} {...stat} index={index} />
                ))}
            </div>

            <div className="bg-card p-6 rounded-xl shadow-lg border">
                <h2 className="text-xl font-bold text-foreground mb-4">Weekly Book Circulation</h2>
                <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                    <BarChart data={bookIssueData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))"/>
                        <YAxis stroke="hsl(var(--muted-foreground))"/>
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}/>
                        <Bar dataKey="issued" fill="hsl(var(--primary))" name="Issued" radius={[4, 4, 0, 0]}/>
                        <Bar dataKey="returned" fill="hsl(var(--secondary))" name="Returned" radius={[4, 4, 0, 0]}/>
                    </BarChart>
                </ResponsiveContainer>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default LibrarianDashboard;
