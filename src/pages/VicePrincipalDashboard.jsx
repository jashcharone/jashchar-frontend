/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * VICE PRINCIPAL DASHBOARD
 * Academic management and administrative oversight
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
    Users, GraduationCap, BookOpen, Calendar, Clock, 
    ClipboardCheck, FileText, AlertTriangle, CheckCircle2,
    TrendingUp, Award, MessageSquare, Bell, ChevronRight,
    UserCheck, Briefcase, Activity
} from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useNavigate } from 'react-router-dom';
import WelcomeMessage from '@/components/WelcomeMessage';
import StatCard from '@/components/StatCard';

const VicePrincipalDashboard = () => {
    const { user, school, currentSessionId } = useAuth();
    const { selectedBranch } = useBranch();
    const navigate = useNavigate();
    
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalStudents: 0,
        totalTeachers: 0,
        pendingLeaves: 0,
        todayAbsent: 0,
        upcomingExams: 0,
        pendingApprovals: 0
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
            // Fetch students count
            const { count: studentsCount } = await supabase
                .from('students')
                .select('*', { count: 'exact', head: true })
                .eq('branch_id', branchId)
                .eq('session_id', currentSessionId);

            // Fetch teachers count
            const { count: teachersCount } = await supabase
                .from('staff')
                .select('*', { count: 'exact', head: true })
                .eq('branch_id', branchId)
                .eq('role', 'Teacher');

            // Fetch pending leave requests
            const { count: pendingLeaves } = await supabase
                .from('staff_leaves')
                .select('*', { count: 'exact', head: true })
                .eq('branch_id', branchId)
                .eq('status', 'pending');

            setStats({
                totalStudents: studentsCount || 0,
                totalTeachers: teachersCount || 0,
                pendingLeaves: pendingLeaves || 0,
                todayAbsent: 3,
                upcomingExams: 2,
                pendingApprovals: pendingLeaves || 0
            });
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const quickActions = [
        { label: 'Teacher Attendance', icon: UserCheck, path: '/super-admin/human-resource/staff-attendance', color: 'bg-blue-500' },
        { label: 'Leave Requests', icon: FileText, path: '/super-admin/human-resource/approve-leave-request', color: 'bg-green-500' },
        { label: 'Exam Schedule', icon: Calendar, path: '/super-admin/examinations/exam-schedule', color: 'bg-purple-500' },
        { label: 'Student Reports', icon: GraduationCap, path: '/super-admin/reports', color: 'bg-orange-500' },
    ];

    const todaySchedule = [
        { time: '09:00 AM', event: 'Staff Meeting', type: 'meeting' },
        { time: '10:30 AM', event: 'Class Observation - 10A', type: 'observation' },
        { time: '12:00 PM', event: 'Parent Meeting', type: 'meeting' },
        { time: '02:00 PM', event: 'Exam Committee', type: 'committee' },
    ];

    const statCards = [
        { title: 'Total Students', value: stats.totalStudents, icon: GraduationCap, color: 'text-blue-600' },
        { title: 'Total Teachers', value: stats.totalTeachers, icon: Users, color: 'text-green-600' },
        { title: 'Pending Leaves', value: stats.pendingLeaves, icon: FileText, color: 'text-orange-600', changeType: stats.pendingLeaves > 0 ? 'alert' : 'neutral' },
        { title: 'Today Absent', value: stats.todayAbsent, icon: AlertTriangle, color: 'text-red-600' },
    ];

    return (
        <DashboardLayout>
            <WelcomeMessage
                user={user?.profile?.full_name || 'Vice Principal'}
                message="Academic oversight and staff management"
            />

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {loading ? (
                    [...Array(4)].map((_, i) => (
                        <Card key={i}>
                            <CardContent className="p-6">
                                <Skeleton className="h-4 w-24 mb-2" />
                                <Skeleton className="h-8 w-16" />
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    statCards.map((stat, index) => (
                        <StatCard key={index} {...stat} index={index} />
                    ))
                )}
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
                            Today's Schedule
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {todaySchedule.map((item, index) => (
                                <div key={index} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 border">
                                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                                        <Clock className="w-5 h-5 text-primary" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold">{item.event}</p>
                                        <p className="text-sm text-muted-foreground">{item.time}</p>
                                    </div>
                                    <Badge variant={item.type === 'meeting' ? 'default' : 'secondary'}>
                                        {item.type}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Pending Approvals Alert */}
            {stats.pendingApprovals > 0 && (
                <Card className="mt-6 border-orange-500/50 bg-orange-50 dark:bg-orange-950/20">
                    <CardContent className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="w-6 h-6 text-orange-500" />
                            <div>
                                <p className="font-semibold text-orange-700 dark:text-orange-400">
                                    {stats.pendingApprovals} Pending Approval{stats.pendingApprovals > 1 ? 's' : ''}
                                </p>
                                <p className="text-sm text-orange-600 dark:text-orange-500">
                                    Leave requests awaiting your review
                                </p>
                            </div>
                        </div>
                        <Button 
                            variant="outline" 
                            className="border-orange-500 text-orange-600 hover:bg-orange-100"
                            onClick={() => navigate('/super-admin/human-resource/approve-leave-request')}
                        >
                            Review Now
                        </Button>
                    </CardContent>
                </Card>
            )}
        </DashboardLayout>
    );
};

export default VicePrincipalDashboard;
