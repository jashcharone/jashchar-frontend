/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SPORTS COACH DASHBOARD
 * Physical education and sports activities management
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
    Trophy, Users, Calendar, Clock, Target,
    Activity, Medal, Dumbbell, Timer, ChevronRight,
    ClipboardList, MapPin, Shirt
} from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useNavigate } from 'react-router-dom';
import WelcomeMessage from '@/components/WelcomeMessage';
import StatCard from '@/components/StatCard';

const SportsCoachDashboard = () => {
    const { user, school } = useAuth();
    const { selectedBranch } = useBranch();
    const navigate = useNavigate();
    
    const [stats] = useState({
        totalTeams: 8,
        activeStudents: 245,
        upcomingEvents: 3,
        practiceToday: 4
    });

    const todaySchedule = [
        { time: '06:00 - 07:30 AM', activity: 'Cricket Practice', venue: 'Main Ground', team: 'Senior Boys', students: 22 },
        { time: '07:30 - 08:30 AM', activity: 'Athletics Training', venue: 'Track Field', team: 'All', students: 35 },
        { time: '03:30 - 05:00 PM', activity: 'Basketball Practice', venue: 'Indoor Court', team: 'Girls Team', students: 15 },
        { time: '05:00 - 06:30 PM', activity: 'Football Practice', venue: 'Main Ground', team: 'Junior Boys', students: 25 },
    ];

    const upcomingEvents = [
        { name: 'Inter-School Cricket Tournament', date: 'Mar 5-7, 2026', venue: 'City Stadium', status: 'Registered' },
        { name: 'Annual Sports Day', date: 'Mar 15, 2026', venue: 'School Ground', status: 'Preparing' },
        { name: 'District Athletics Meet', date: 'Mar 25, 2026', venue: 'District Stadium', status: 'Selection Pending' },
    ];

    const quickActions = [
        { label: 'Class Schedule', icon: Calendar, path: '/super-admin/academics/class-timetable', color: 'bg-blue-500' },
        { label: 'Student Attendance', icon: ClipboardList, path: '/super-admin/attendance/student-attendance', color: 'bg-green-500' },
        { label: 'Equipment', icon: Dumbbell, path: '/super-admin/inventory/item-list', color: 'bg-purple-500' },
        { label: 'Events Calendar', icon: Trophy, path: '/super-admin/annual-calendar', color: 'bg-orange-500' },
    ];

    const teams = [
        { name: 'Cricket - Senior Boys', members: 22, icon: '🏏' },
        { name: 'Cricket - Junior Boys', members: 18, icon: '🏏' },
        { name: 'Football - Boys', members: 25, icon: '⚽' },
        { name: 'Basketball - Girls', members: 15, icon: '🏀' },
        { name: 'Volleyball', members: 12, icon: '🏐' },
        { name: 'Athletics', members: 35, icon: '🏃' },
        { name: 'Kabaddi', members: 14, icon: '🤾' },
        { name: 'Badminton', members: 16, icon: '🏸' },
    ];

    const statCards = [
        { title: 'Sports Teams', value: stats.totalTeams, icon: Shirt, color: 'text-blue-600' },
        { title: 'Active Athletes', value: stats.activeStudents, icon: Users, color: 'text-green-600' },
        { title: 'Upcoming Events', value: stats.upcomingEvents, icon: Trophy, color: 'text-orange-600' },
        { title: "Today's Sessions", value: stats.practiceToday, icon: Timer, color: 'text-purple-600' },
    ];

    return (
        <DashboardLayout>
            <WelcomeMessage
                user={user?.profile?.full_name || 'Sports Coach'}
                message="Physical education and sports management"
            />

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {statCards.map((stat, index) => (
                    <StatCard key={index} {...stat} index={index} />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Quick Actions */}
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="w-5 h-5 text-primary" />
                            Quick Actions
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {quickActions.map((action, index) => (
                            <Button
                                key={index}
                                variant="outline"
                                className="w-full justify-start gap-3"
                                onClick={() => navigate(action.path)}
                            >
                                <div className={`p-2 rounded-lg ${action.color}`}>
                                    <action.icon className="w-4 h-4 text-white" />
                                </div>
                                {action.label}
                                <ChevronRight className="w-4 h-4 ml-auto" />
                            </Button>
                        ))}
                    </CardContent>
                </Card>

                {/* Today's Schedule */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-primary" />
                            Today's Practice Schedule
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {todaySchedule.map((session, index) => (
                                <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 rounded-full bg-primary/10">
                                            <Dumbbell className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-semibold">{session.activity}</p>
                                            <p className="text-sm text-muted-foreground">
                                                <MapPin className="w-3 h-3 inline mr-1" />
                                                {session.venue} • {session.team}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <Badge variant="outline">{session.time}</Badge>
                                        <p className="text-sm text-muted-foreground mt-1">{session.students} students</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Teams Overview */}
            <Card className="mt-6">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shirt className="w-5 h-5 text-primary" />
                        Teams Overview
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {teams.map((team, index) => (
                            <div key={index} className="p-4 rounded-lg border bg-muted/30 text-center">
                                <span className="text-3xl">{team.icon}</span>
                                <p className="font-medium mt-2 text-sm">{team.name}</p>
                                <Badge variant="secondary" className="mt-1">{team.members} members</Badge>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Upcoming Events */}
            <Card className="mt-6">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-primary" />
                        Upcoming Events
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {upcomingEvents.map((event, index) => (
                            <div key={index} className="p-4 rounded-lg border bg-gradient-to-br from-primary/5 to-primary/10">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-semibold">{event.name}</p>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            <Calendar className="w-3 h-3 inline mr-1" />{event.date}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            <MapPin className="w-3 h-3 inline mr-1" />{event.venue}
                                        </p>
                                    </div>
                                </div>
                                <Badge 
                                    className="mt-3" 
                                    variant={event.status === 'Registered' ? 'default' : 'outline'}
                                >
                                    {event.status}
                                </Badge>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </DashboardLayout>
    );
};

export default SportsCoachDashboard;
