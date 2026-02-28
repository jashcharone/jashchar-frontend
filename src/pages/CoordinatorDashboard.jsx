/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * COORDINATOR DASHBOARD
 * Department and academic coordination
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
    Users, BookOpen, Calendar, ClipboardList, 
    FileText, CheckCircle2, Clock, Target,
    TrendingUp, MessageSquare, ChevronRight, Activity
} from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useNavigate, useParams } from 'react-router-dom';
import WelcomeMessage from '@/components/WelcomeMessage';
import StatCard from '@/components/StatCard';

const CoordinatorDashboard = () => {
    const { user, school, currentSessionId } = useAuth();
    const { selectedBranch } = useBranch();
    const navigate = useNavigate();
    const { roleSlug } = useParams();
    const basePath = roleSlug || 'super-admin';
    
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        assignedClasses: 0,
        totalTeachers: 0,
        pendingTasks: 0,
        completedTasks: 0
    });

    const branchId = selectedBranch?.id;

    useEffect(() => {
        if (branchId) {
            fetchDashboardData();
        }
    }, [branchId, currentSessionId]);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            // Fetch classes count
            const { count: classesCount } = await supabase
                .from('classes')
                .select('*', { count: 'exact', head: true })
                .eq('branch_id', branchId)
                .eq('session_id', currentSessionId);

            setStats({
                assignedClasses: classesCount || 8,
                totalTeachers: 12,
                pendingTasks: 5,
                completedTasks: 18
            });
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const quickActions = [
        { label: 'Class Timetable', icon: Calendar, path: `/${basePath}/academics/class-timetable`, color: 'bg-blue-500' },
        { label: 'Assign Subjects', icon: BookOpen, path: `/${basePath}/academics/assign-class-teacher`, color: 'bg-green-500' },
        { label: 'Lesson Plans', icon: FileText, path: `/${basePath}/lesson-planning`, color: 'bg-purple-500' },
        { label: 'Teacher Schedule', icon: Users, path: `/${basePath}/academics/teachers-timetable`, color: 'bg-orange-500' },
    ];

    const departmentProgress = [
        { name: 'Mathematics', progress: 85, teachers: 3 },
        { name: 'Science', progress: 78, teachers: 4 },
        { name: 'Languages', progress: 92, teachers: 5 },
        { name: 'Social Studies', progress: 70, teachers: 2 },
    ];

    const upcomingMeetings = [
        { title: 'Department Meeting', date: 'Today, 3:00 PM', type: 'internal' },
        { title: 'Curriculum Review', date: 'Tomorrow, 10:00 AM', type: 'academic' },
        { title: 'Parent-Teacher Meet Prep', date: 'Friday, 2:00 PM', type: 'preparation' },
    ];

    const statCards = [
        { title: 'Assigned Classes', value: stats.assignedClasses, icon: BookOpen, color: 'text-blue-600' },
        { title: 'Team Teachers', value: stats.totalTeachers, icon: Users, color: 'text-green-600' },
        { title: 'Pending Tasks', value: stats.pendingTasks, icon: ClipboardList, color: 'text-orange-600' },
        { title: 'Completed', value: stats.completedTasks, icon: CheckCircle2, color: 'text-emerald-600' },
    ];

    return (
        <DashboardLayout>
            <WelcomeMessage
                user={user?.profile?.full_name || 'Coordinator'}
                message="Department coordination and academic management"
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

                {/* Department Progress */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Target className="w-5 h-5 text-primary" />
                            Department Syllabus Progress
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {departmentProgress.map((dept, index) => (
                                <div key={index} className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="font-medium">{dept.name}</span>
                                        <span className="text-muted-foreground">{dept.teachers} Teachers</span>
                                    </div>
                                    <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                                        <div 
                                            className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all"
                                            style={{ width: `${dept.progress}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground text-right">{dept.progress}% Complete</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Upcoming Meetings */}
            <Card className="mt-6">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-primary" />
                        Upcoming Meetings
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {upcomingMeetings.map((meeting, index) => (
                            <div key={index} className="p-4 rounded-lg border bg-muted/30">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="font-semibold">{meeting.title}</p>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            <Clock className="w-3 h-3 inline mr-1" />
                                            {meeting.date}
                                        </p>
                                    </div>
                                    <Badge variant="outline">{meeting.type}</Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </DashboardLayout>
    );
};

export default CoordinatorDashboard;
