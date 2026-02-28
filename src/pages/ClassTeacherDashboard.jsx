/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * CLASS TEACHER DASHBOARD
 * Assigned class management with teaching duties
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
    Users, GraduationCap, ClipboardCheck, Calendar,
    Clock, FileText, MessageSquare, AlertTriangle,
    CheckCircle2, UserCheck, BookOpen, ChevronRight,
    Activity, Bell, Award
} from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useNavigate, useParams } from 'react-router-dom';
import WelcomeMessage from '@/components/WelcomeMessage';
import StatCard from '@/components/StatCard';

const ClassTeacherDashboard = () => {
    const { user, school, currentSessionId } = useAuth();
    const { selectedBranch } = useBranch();
    const navigate = useNavigate();
    const { roleSlug } = useParams();
    const basePath = roleSlug || 'super-admin';
    
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalStudents: 0,
        presentToday: 0,
        absentToday: 0,
        pendingLeaves: 0
    });
    const [assignedClass, setAssignedClass] = useState({ name: 'Class 10-A', students: 45 });

    const branchId = selectedBranch?.id;

    useEffect(() => {
        if (branchId) {
            fetchDashboardData();
        }
    }, [branchId, currentSessionId]);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            // Fetch assigned class students
            // In real implementation, get class teacher's assigned class first
            setStats({
                totalStudents: 45,
                presentToday: 42,
                absentToday: 3,
                pendingLeaves: 2
            });
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const quickActions = [
        { label: 'Mark Attendance', icon: ClipboardCheck, path: `/${basePath}/attendance/student-attendance`, color: 'bg-green-500' },
        { label: 'Class Students', icon: Users, path: `/${basePath}/student-details`, color: 'bg-blue-500' },
        { label: 'Leave Requests', icon: FileText, path: `/${basePath}/attendance/approve-leave`, color: 'bg-orange-500' },
        { label: 'Send Notice', icon: MessageSquare, path: `/${basePath}/communicate/send-email`, color: 'bg-purple-500' },
    ];

    const recentActivity = [
        { type: 'attendance', message: 'Attendance marked for today', time: '30 mins ago', icon: CheckCircle2 },
        { type: 'leave', message: 'Leave request from Rahul Kumar', time: '1 hour ago', icon: FileText },
        { type: 'notice', message: 'Exam schedule shared with parents', time: '2 hours ago', icon: Bell },
        { type: 'result', message: 'Unit test results uploaded', time: 'Yesterday', icon: Award },
    ];

    const absentStudents = [
        { name: 'Priya Sharma', rollNo: '12', reason: 'Medical Leave' },
        { name: 'Amit Patel', rollNo: '23', reason: 'Not Informed' },
        { name: 'Sneha Reddy', rollNo: '31', reason: 'Family Function' },
    ];

    const statCards = [
        { title: 'Class Strength', value: stats.totalStudents, icon: Users, color: 'text-blue-600' },
        { title: 'Present Today', value: stats.presentToday, icon: CheckCircle2, color: 'text-green-600' },
        { title: 'Absent Today', value: stats.absentToday, icon: AlertTriangle, color: 'text-red-600' },
        { title: 'Leave Requests', value: stats.pendingLeaves, icon: FileText, color: 'text-orange-600' },
    ];

    const attendancePercentage = Math.round((stats.presentToday / stats.totalStudents) * 100);

    return (
        <DashboardLayout>
            <WelcomeMessage
                user={user?.profile?.full_name || 'Class Teacher'}
                message={`Managing ${assignedClass.name} - ${assignedClass.students} Students`}
            />

            {/* Class Info Banner */}
            <Card className="mb-6 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
                <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-full bg-primary/20">
                                <GraduationCap className="w-8 h-8 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">{assignedClass.name}</h3>
                                <p className="text-muted-foreground">Class Teacher • {assignedClass.students} Students</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-3xl font-bold text-primary">{attendancePercentage}%</p>
                            <p className="text-sm text-muted-foreground">Today's Attendance</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

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

                {/* Absent Students Today */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-red-500" />
                            Absent Students Today
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {stats.absentToday > 0 ? (
                            <div className="space-y-3">
                                {absentStudents.map((student, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
                                                <span className="font-bold text-red-600">{student.rollNo}</span>
                                            </div>
                                            <div>
                                                <p className="font-medium">{student.name}</p>
                                                <p className="text-sm text-muted-foreground">Roll No: {student.rollNo}</p>
                                            </div>
                                        </div>
                                        <Badge variant={student.reason === 'Not Informed' ? 'destructive' : 'outline'}>
                                            {student.reason}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-green-600">
                                <CheckCircle2 className="w-12 h-12 mx-auto mb-2" />
                                <p className="font-medium">All students present today!</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity */}
            <Card className="mt-6">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-primary" />
                        Recent Activity
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {recentActivity.map((activity, index) => (
                            <div key={index} className="p-4 rounded-lg border bg-muted/30">
                                <div className="flex items-start gap-3">
                                    <activity.icon className="w-5 h-5 text-primary mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium">{activity.message}</p>
                                        <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </DashboardLayout>
    );
};

export default ClassTeacherDashboard;
