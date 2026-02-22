/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * HOSTEL WARDEN DASHBOARD
 * Hostel room, student, and mess management
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
    Building, Users, Bed, UtensilsCrossed, Clock,
    AlertTriangle, CheckCircle2, DoorOpen, Key,
    ClipboardList, FileText, ChevronRight, Activity,
    UserCheck, Moon, Sun
} from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useNavigate } from 'react-router-dom';
import WelcomeMessage from '@/components/WelcomeMessage';
import StatCard from '@/components/StatCard';

const HostelWardenDashboard = () => {
    const { user, school, currentSessionId } = useAuth();
    const { selectedBranch } = useBranch();
    const navigate = useNavigate();
    
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalStudents: 0,
        occupiedRooms: 0,
        availableRooms: 0,
        pendingRequests: 0
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
            // Fetch hostel students
            const { count: studentsCount } = await supabase
                .from('hostel_students')
                .select('*', { count: 'exact', head: true })
                .eq('branch_id', branchId);

            // Fetch rooms
            const { data: rooms } = await supabase
                .from('hostel_rooms')
                .select('id, room_status')
                .eq('branch_id', branchId);

            const occupied = rooms?.filter(r => r.room_status === 'occupied').length || 0;
            const available = rooms?.filter(r => r.room_status === 'available').length || 0;

            setStats({
                totalStudents: studentsCount || 0,
                occupiedRooms: occupied,
                availableRooms: available,
                pendingRequests: 3
            });
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const quickActions = [
        { label: 'Room Allocation', icon: Key, path: '/super-admin/hostel/rooms', color: 'bg-blue-500' },
        { label: 'Student List', icon: Users, path: '/super-admin/hostel/hostel-students', color: 'bg-green-500' },
        { label: 'Attendance', icon: ClipboardList, path: '/super-admin/hostel/attendance', color: 'bg-purple-500' },
        { label: 'Mess Management', icon: UtensilsCrossed, path: '/super-admin/hostel', color: 'bg-orange-500' },
    ];

    const recentActivities = [
        { type: 'checkin', message: 'Rahul Kumar checked in', time: '10 mins ago', icon: DoorOpen },
        { type: 'request', message: 'Room change request from Priya', time: '30 mins ago', icon: FileText },
        { type: 'attendance', message: 'Night attendance completed', time: '2 hours ago', icon: UserCheck },
        { type: 'mess', message: 'Dinner menu updated', time: '3 hours ago', icon: UtensilsCrossed },
    ];

    const roomBlockStatus = [
        { block: 'Block A - Boys', total: 50, occupied: 45, type: 'boys' },
        { block: 'Block B - Boys', total: 40, occupied: 38, type: 'boys' },
        { block: 'Block C - Girls', total: 45, occupied: 42, type: 'girls' },
        { block: 'Block D - Girls', total: 35, occupied: 30, type: 'girls' },
    ];

    const todayMess = [
        { meal: 'Breakfast', time: '7:00 - 9:00 AM', menu: 'Idli, Sambar, Chutney, Tea', status: 'completed' },
        { meal: 'Lunch', time: '12:30 - 2:00 PM', menu: 'Rice, Dal, Roti, Sabzi', status: 'ongoing' },
        { meal: 'Snacks', time: '4:30 - 5:30 PM', menu: 'Samosa, Tea', status: 'upcoming' },
        { meal: 'Dinner', time: '7:30 - 9:00 PM', menu: 'Chapati, Paneer, Rice', status: 'upcoming' },
    ];

    const statCards = [
        { title: 'Total Students', value: stats.totalStudents, icon: Users, color: 'text-blue-600' },
        { title: 'Occupied Rooms', value: stats.occupiedRooms, icon: Bed, color: 'text-green-600' },
        { title: 'Available Rooms', value: stats.availableRooms, icon: DoorOpen, color: 'text-purple-600' },
        { title: 'Pending Requests', value: stats.pendingRequests, icon: FileText, color: 'text-orange-600' },
    ];

    return (
        <DashboardLayout>
            <WelcomeMessage
                user={user?.profile?.full_name || 'Hostel Warden'}
                message="Hostel management and student welfare"
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

                {/* Block Occupancy */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building className="w-5 h-5 text-primary" />
                            Block Occupancy Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {roomBlockStatus.map((block, index) => (
                                <div key={index} className="p-4 rounded-lg border bg-muted/30">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <p className="font-semibold">{block.block}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {block.occupied}/{block.total} Rooms
                                            </p>
                                        </div>
                                        <Badge variant={block.type === 'boys' ? 'default' : 'secondary'}>
                                            {block.type === 'boys' ? '♂️ Boys' : '♀️ Girls'}
                                        </Badge>
                                    </div>
                                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full ${block.type === 'boys' ? 'bg-blue-500' : 'bg-pink-500'}`}
                                            style={{ width: `${(block.occupied / block.total) * 100}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1 text-right">
                                        {Math.round((block.occupied / block.total) * 100)}% Occupied
                                    </p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Mess Schedule */}
            <Card className="mt-6">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <UtensilsCrossed className="w-5 h-5 text-primary" />
                        Today's Mess Schedule
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {todayMess.map((meal, index) => (
                            <div key={index} className={`p-4 rounded-lg border ${
                                meal.status === 'ongoing' ? 'bg-green-50 dark:bg-green-950/20 border-green-500' :
                                meal.status === 'completed' ? 'bg-muted/30' : 'bg-muted/10'
                            }`}>
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-semibold">{meal.meal}</span>
                                    {meal.status === 'ongoing' && (
                                        <Badge className="bg-green-500">Live</Badge>
                                    )}
                                    {meal.status === 'completed' && (
                                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                                    )}
                                </div>
                                <p className="text-sm text-muted-foreground mb-1">
                                    <Clock className="w-3 h-3 inline mr-1" />{meal.time}
                                </p>
                                <p className="text-sm">{meal.menu}</p>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Recent Activities */}
            <Card className="mt-6">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-primary" />
                        Recent Activities
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {recentActivities.map((activity, index) => (
                            <div key={index} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 border">
                                <div className="p-2 rounded-full bg-primary/10">
                                    <activity.icon className="w-4 h-4 text-primary" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium">{activity.message}</p>
                                    <p className="text-sm text-muted-foreground">{activity.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </DashboardLayout>
    );
};

export default HostelWardenDashboard;
