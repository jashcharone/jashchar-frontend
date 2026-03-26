import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import StatCard from '@/components/StatCard';
import { Phone, UserPlus, Mail, Building, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import WelcomeMessage from '@/components/WelcomeMessage';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const ReceptionistDashboard = () => {
    const { user, school } = useAuth();
    const stats = [
        { title: 'Today\'s Visitors', value: '25', icon: UserPlus, change: '+5 from yesterday' },
        { title: 'Phone Calls Logged', value: '62', icon: Phone },
        { title: 'New Enquiries', value: '12', icon: Mail, change: '+3 today' },
        { title: 'Couriers In/Out', value: '8', icon: Building },
    ];
    
    const appointments = [
        { time: '10:00 AM', name: 'Mr. John Doe', reason: 'Admission Enquiry' },
        { time: '11:30 AM', name: 'Mrs. Jane Smith', reason: 'Meeting with Principal' },
        { time: '02:00 PM', name: 'Book Delivery', reason: 'Library Supplies' },
    ];

    return (
        <DashboardLayout>
            <WelcomeMessage 
                user={user?.profile?.full_name || 'Receptionist'}
                message={school?.name ? `Front desk - ${school.name}` : "Here's what's on the front desk today."}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat, index) => (
                    <StatCard key={index} {...stat} index={index} />
                ))}
            </div>
            
            <div className="bg-card p-6 rounded-xl shadow-lg border">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-foreground">Today's Appointments</h2>
                    <Button variant="outline" size="sm">
                        <UserPlus className="mr-2 h-4 w-4" /> Add Visitor
                    </Button>
                </div>
                <ul className="space-y-4">
                    {appointments.map((appt, index) => (
                        <li key={index} className="flex items-center p-3 rounded-lg hover:bg-muted transition-colors">
                            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 mr-4">
                                <Clock className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-grow">
                                <p className="font-semibold text-foreground">{appt.name}</p>
                                <p className="text-sm text-muted-foreground">{appt.reason}</p>
                            </div>
                            <div className="text-sm font-medium text-primary">{appt.time}</div>
                        </li>
                    ))}
                </ul>
            </div>
        </DashboardLayout>
    );
};

export default ReceptionistDashboard;
