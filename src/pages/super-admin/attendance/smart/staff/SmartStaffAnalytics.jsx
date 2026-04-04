/**
 * SMART STAFF ANALYTICS DASHBOARD
 */
import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, Users, Clock, AlertTriangle, CheckCircle2, TrendingUp, Calendar, Loader2, RefreshCw, Briefcase, Cpu, CreditCard, Scan, QrCode } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6', '#EC4899'];
const attendanceMethods = { face: { icon: Scan, label: 'Face Recognition', color: '#8B5CF6' }, qr: { icon: QrCode, label: 'QR Code', color: '#10B981' }, card: { icon: CreditCard, label: 'Smart Card', color: '#3B82F6' }, biometric: { icon: Cpu, label: 'Biometric', color: '#F59E0B' }, manual: { icon: Users, label: 'Manual', color: '#6B7280' } };

const SmartStaffAnalytics = () => {
    const { user, currentSessionId } = useAuth();
    const { selectedBranch } = useBranch();
    const branchId = selectedBranch?.id || user?.profile?.branch_id;

    const [loading, setLoading] = useState(false);
    const [dateRange, setDateRange] = useState('week');
    const [analytics, setAnalytics] = useState({
        overview: { total: 120, present: 108, absent: 8, late: 4, avgAttendance: 90 },
        byDepartment: [
            { name: 'Teaching', present: 55, absent: 3, late: 2, total: 60 },
            { name: 'Admin', present: 18, absent: 2, late: 0, total: 20 },
            { name: 'IT', present: 8, absent: 1, late: 1, total: 10 },
            { name: 'HR', present: 7, absent: 1, late: 0, total: 8 },
            { name: 'Accounts', present: 6, absent: 0, late: 1, total: 7 },
            { name: 'Library', present: 5, absent: 1, late: 0, total: 6 },
            { name: 'Security', present: 9, absent: 0, late: 0, total: 9 }
        ],
        byMethod: [
            { name: 'Face Recognition', value: 65, method: 'face' },
            { name: 'Smart Card', value: 25, method: 'card' },
            { name: 'QR Code', value: 5, method: 'qr' },
            { name: 'Manual', value: 5, method: 'manual' }
        ],
        trend: [
            { day: 'Mon', present: 110, late: 5 },
            { day: 'Tue', present: 108, late: 4 },
            { day: 'Wed', present: 112, late: 3 },
            { day: 'Thu', present: 105, late: 7 },
            { day: 'Fri', present: 100, late: 8 },
            { day: 'Sat', present: 98, late: 4 }
        ],
        topLateComers: [
            { name: 'Ramesh Kumar', department: 'Teaching', lateCount: 5 },
            { name: 'Suresh Babu', department: 'Admin', lateCount: 4 },
            { name: 'Manjunath S', department: 'IT', lateCount: 3 }
        ]
    });

    const fetchAnalytics = useCallback(async () => {
        if (!branchId) return;
        setLoading(true);
        try {
            const { count: totalStaff } = await supabase.from('employee_profiles').select('id', { count: 'exact' }).eq('branch_id', branchId).eq('status', 'Active');
            const { count: faceCount } = await supabase.from('face_embeddings').select('id', { count: 'exact' }).eq('branch_id', branchId).eq('person_type', 'staff');
            
            setAnalytics(prev => ({
                ...prev,
                overview: { ...prev.overview, total: totalStaff || prev.overview.total },
                faceRegistered: faceCount || 0
            }));
        } catch (err) { console.error('Analytics error:', err); }
        finally { setLoading(false); }
    }, [branchId, dateRange]);

    useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

    const { overview, byDepartment, byMethod, trend, topLateComers } = analytics;

    return (
        <DashboardLayout>
            <div className="p-4 md:p-6 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2"><BarChart3 className="h-7 w-7 text-indigo-600" />Staff Attendance Analytics</h1>
                        <p className="text-muted-foreground">Smart attendance insights and reports for staff</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Select value={dateRange} onValueChange={setDateRange}>
                            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="today">Today</SelectItem>
                                <SelectItem value="week">This Week</SelectItem>
                                <SelectItem value="month">This Month</SelectItem>
                                <SelectItem value="year">This Year</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button variant="outline" onClick={fetchAnalytics} disabled={loading}><RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />Refresh</Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {[
                        { label: 'Total Staff', value: overview.total, icon: Users, color: 'bg-blue-100 text-blue-700' },
                        { label: 'Present Today', value: overview.present, icon: CheckCircle2, color: 'bg-green-100 text-green-700' },
                        { label: 'Absent', value: overview.absent, icon: AlertTriangle, color: 'bg-red-100 text-red-700' },
                        { label: 'Late', value: overview.late, icon: Clock, color: 'bg-yellow-100 text-yellow-700' },
                        { label: 'Avg Attendance', value: `${overview.avgAttendance}%`, icon: TrendingUp, color: 'bg-purple-100 text-purple-700' }
                    ].map((stat, i) => (
                        <Card key={i}>
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className={`p-3 rounded-lg ${stat.color}`}><stat.icon className="h-6 w-6" /></div>
                                <div><p className="text-sm text-muted-foreground">{stat.label}</p><p className="text-2xl font-bold">{stat.value}</p></div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-lg flex items-center gap-2"><Briefcase className="h-5 w-5" />Attendance by Department</CardTitle></CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={byDepartment}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="present" fill="#10B981" name="Present" />
                                    <Bar dataKey="absent" fill="#EF4444" name="Absent" />
                                    <Bar dataKey="late" fill="#F59E0B" name="Late" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-lg flex items-center gap-2"><Cpu className="h-5 w-5" />Attendance by Method</CardTitle></CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie data={byMethod} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                                        {byMethod.map((entry, i) => <Cell key={`cell-${i}`} fill={attendanceMethods[entry.method]?.color || COLORS[i % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-lg flex items-center gap-2"><Calendar className="h-5 w-5" />Weekly Attendance Trend</CardTitle></CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={trend}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="day" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="present" stroke="#10B981" strokeWidth={2} name="Present" />
                                <Line type="monotone" dataKey="late" stroke="#F59E0B" strokeWidth={2} name="Late" />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-lg flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-yellow-600" />Top Late Comers</CardTitle></CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {topLateComers.map((person, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <Badge variant="outline" className="h-8 w-8 rounded-full flex items-center justify-center">{i + 1}</Badge>
                                        <div><p className="font-medium">{person.name}</p><p className="text-sm text-muted-foreground">{person.department}</p></div>
                                    </div>
                                    <Badge variant="outline" className="bg-yellow-100 text-yellow-700">{person.lateCount} late arrivals</Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default SmartStaffAnalytics;
