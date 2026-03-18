/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ACADEMIC INTELLIGENCE HUB
 * ═══════════════════════════════════════════════════════════════════════════════
 * Day 21 of 21-Day Academic Intelligence Master Plan
 * Unified dashboard connecting all academic modules
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    Brain, BookOpen, GraduationCap, Users, ClipboardList, Calendar,
    BarChart2, Sparkles, TrendingUp, AlertTriangle, CheckCircle,
    Clock, Award, FileText, Activity, Loader2, RefreshCw, ChevronRight,
    Zap, Target, Bell, Shield, Star, ArrowRight, BookMarked, Briefcase,
    PieChart, LineChart as LineChartIcon, Grid3X3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import axios from 'axios';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { toast } from 'sonner';
import { formatDate, formatDateTime } from '@/utils/dateUtils';
import {
    AreaChart, Area, LineChart, Line, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];

// Module Cards Configuration
const MODULES = [
    { key: 'curriculum', name: 'Curriculum Master', icon: BookMarked, path: '/super-admin/academics/curriculum', color: 'bg-blue-500' },
    { key: 'learning_outcomes', name: 'Learning Outcomes', icon: Target, path: '/super-admin/academics/learning-outcomes', color: 'bg-green-500' },
    { key: 'lesson_plans', name: 'Lesson Plans', icon: ClipboardList, path: '/super-admin/academics/lesson-plans', color: 'bg-purple-500' },
    { key: 'teacher_workload', name: 'Teacher Workload', icon: Briefcase, path: '/super-admin/academics/teacher-workload', color: 'bg-orange-500' },
    { key: 'timetable', name: 'Enhanced Timetable', icon: Calendar, path: '/super-admin/academics/enhanced-timetable', color: 'bg-cyan-500' },
    { key: 'study_materials', name: 'Study Materials', icon: BookOpen, path: '/super-admin/academics/study-materials', color: 'bg-indigo-500' },
    { key: 'homework', name: 'Enhanced Homework', icon: FileText, path: '/super-admin/academics/enhanced-homework', color: 'bg-rose-500' },
    { key: 'class_activities', name: 'Class Activities', icon: Activity, path: '/super-admin/academics/class-activities', color: 'bg-amber-500' },
    { key: 'competency_badges', name: 'Competency Badges', icon: Award, path: '/super-admin/academics/competency-badges', color: 'bg-yellow-500' },
    { key: 'analytics', name: 'Academic Analytics', icon: BarChart2, path: '/super-admin/academics/analytics', color: 'bg-teal-500' },
    { key: 'ai_insights', name: 'AI Insights', icon: Brain, path: '/super-admin/academics/ai-insights', color: 'bg-pink-500' },
    { key: 'syllabus_progress', name: 'Syllabus Progress', icon: TrendingUp, path: '/super-admin/academics/syllabus-progress', color: 'bg-lime-500' },
    { key: 'reports', name: 'Reports Engine', icon: PieChart, path: '/super-admin/academics/reports-engine', color: 'bg-violet-500' },
];

export default function AcademicIntelligenceHub() {
    const { currentSessionId, organizationId, user } = useAuth();
    const { selectedBranch } = useBranch();

    // State
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    // Data states
    const [overview, setOverview] = useState(null);
    const [quickStats, setQuickStats] = useState(null);
    const [trends, setTrends] = useState([]);
    const [classPerformance, setClassPerformance] = useState([]);
    const [teacherDashboard, setTeacherDashboard] = useState([]);
    const [alerts, setAlerts] = useState(null);
    const [activityFeed, setActivityFeed] = useState([]);
    const [moduleHealth, setModuleHealth] = useState(null);

    // ═══════════════════════════════════════════════════════════════════════════
    // DATA FETCHING
    // ═══════════════════════════════════════════════════════════════════════════

    useEffect(() => {
        if (selectedBranch?.id) {
            loadData();
        }
    }, [selectedBranch?.id, currentSessionId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [overviewRes, statsRes, trendsRes, feedRes, alertsRes] = await Promise.all([
                axios.get('/api/academic-hub/overview'),
                axios.get('/api/academic-hub/quick-stats'),
                axios.get('/api/academic-hub/trends'),
                axios.get('/api/academic-hub/activity-feed'),
                axios.get('/api/academic-hub/alerts')
            ]);

            setOverview(overviewRes.data.data);
            setQuickStats(statsRes.data.data);
            setTrends(trendsRes.data.data || []);
            setActivityFeed(feedRes.data.data || []);
            setAlerts(alertsRes.data.data);
        } catch (error) {
            console.error('Load data error:', error);
            toast.error('Failed to load academic hub data');
        } finally {
            setLoading(false);
        }
    };

    const loadClassPerformance = async () => {
        try {
            const res = await axios.get('/api/academic-hub/class-performance');
            setClassPerformance(res.data.data || []);
        } catch (error) {
            console.error('Load class performance error:', error);
        }
    };

    const loadTeacherDashboard = async () => {
        try {
            const res = await axios.get('/api/academic-hub/teacher-dashboard');
            setTeacherDashboard(res.data.data || []);
        } catch (error) {
            console.error('Load teacher dashboard error:', error);
        }
    };

    const loadModuleHealth = async () => {
        try {
            const res = await axios.get('/api/academic-hub/module-health');
            setModuleHealth(res.data.data);
        } catch (error) {
            console.error('Load module health error:', error);
        }
    };

    useEffect(() => {
        if (activeTab === 'classes') loadClassPerformance();
        if (activeTab === 'teachers') loadTeacherDashboard();
        if (activeTab === 'health') loadModuleHealth();
    }, [activeTab]);

    // ═══════════════════════════════════════════════════════════════════════════
    // RENDER HELPERS
    // ═══════════════════════════════════════════════════════════════════════════

    const StatCard = ({ title, value, icon: Icon, color, trend, link }) => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
        >
            <Card className="relative overflow-hidden hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm text-muted-foreground">{title}</p>
                            <h3 className="text-2xl font-bold mt-1">{value}</h3>
                            {trend && (
                                <div className="flex items-center gap-1 mt-1 text-xs text-green-600">
                                    <TrendingUp className="h-3 w-3" />
                                    {trend}
                                </div>
                            )}
                        </div>
                        <div className={`p-3 rounded-xl ${color}`}>
                            <Icon className="h-5 w-5 text-white" />
                        </div>
                    </div>
                    {link && (
                        <Link to={link} className="absolute inset-0">
                            <span className="sr-only">View {title}</span>
                        </Link>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );

    const ModuleCard = ({ module, data }) => {
        const Icon = module.icon;
        const moduleData = data?.[module.key];

        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -5 }}
                transition={{ duration: 0.2 }}
            >
                <Link to={module.path}>
                    <Card className="h-full hover:shadow-xl transition-all cursor-pointer border-2 hover:border-primary/30">
                        <CardContent className="p-4">
                            <div className={`w-12 h-12 rounded-xl ${module.color} flex items-center justify-center mb-3`}>
                                <Icon className="h-6 w-6 text-white" />
                            </div>
                            <h3 className="font-semibold text-sm mb-1">{module.name}</h3>
                            {moduleData && (
                                <div className="text-xs text-muted-foreground space-y-1">
                                    {Object.entries(moduleData).slice(0, 2).map(([key, val]) => (
                                        <div key={key} className="flex justify-between">
                                            <span className="capitalize">{key.replace(/_/g, ' ')}:</span>
                                            <span className="font-medium">{val || 0}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className="flex items-center justify-end mt-3 text-primary text-xs font-medium">
                                Open <ChevronRight className="h-3 w-3 ml-1" />
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            </motion.div>
        );
    };

    const ActivityFeedItem = ({ item }) => {
        const icons = {
            lesson_plan: BookOpen,
            homework: ClipboardList,
            material: FileText,
            activity: Activity,
            badge: Award
        };
        const Icon = icons[item.type] || Activity;

        return (
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
            >
                <div className="p-2 bg-primary/10 rounded-lg">
                    <Icon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(item.timestamp)}
                </span>
            </motion.div>
        );
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // LOADING STATE
    // ═══════════════════════════════════════════════════════════════════════════

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                        <Brain className="h-16 w-16 text-primary mx-auto mb-4" />
                    </motion.div>
                    <p className="text-muted-foreground">Loading Academic Intelligence Hub...</p>
                </div>
            </div>
        );
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // MAIN RENDER
    // ═══════════════════════════════════════════════════════════════════════════

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-primary to-purple-600 rounded-xl">
                            <Brain className="h-8 w-8 text-white" />
                        </div>
                        Academic Intelligence Hub
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Unified dashboard connecting all 13 academic intelligence modules
                    </p>
                </div>

                <div className="flex gap-2">
                    <Button variant="outline" onClick={loadData}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <StatCard
                    title="Lessons Today"
                    value={quickStats?.lessons_today || 0}
                    icon={BookOpen}
                    color="bg-blue-500"
                />
                <StatCard
                    title="Homework Due"
                    value={quickStats?.homework_due || 0}
                    icon={ClipboardList}
                    color="bg-orange-500"
                />
                <StatCard
                    title="Pending Approvals"
                    value={quickStats?.pending_approvals || 0}
                    icon={Clock}
                    color="bg-yellow-500"
                />
                <StatCard
                    title="Activities This Week"
                    value={quickStats?.activities_this_week || 0}
                    icon={Activity}
                    color="bg-green-500"
                />
                <StatCard
                    title="Active Alerts"
                    value={quickStats?.unresolved_alerts || 0}
                    icon={AlertTriangle}
                    color="bg-red-500"
                />
            </div>

            {/* Main Content Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-flex">
                    <TabsTrigger value="overview">
                        <Grid3X3 className="h-4 w-4 mr-2" />
                        Overview
                    </TabsTrigger>
                    <TabsTrigger value="trends">
                        <LineChartIcon className="h-4 w-4 mr-2" />
                        Trends
                    </TabsTrigger>
                    <TabsTrigger value="classes">
                        <Users className="h-4 w-4 mr-2" />
                        Classes
                    </TabsTrigger>
                    <TabsTrigger value="teachers">
                        <Briefcase className="h-4 w-4 mr-2" />
                        Teachers
                    </TabsTrigger>
                    <TabsTrigger value="health">
                        <Shield className="h-4 w-4 mr-2" />
                        Health
                    </TabsTrigger>
                </TabsList>

                {/* ═══════════════════════════════════════════════════════════════ */}
                {/* OVERVIEW TAB */}
                {/* ═══════════════════════════════════════════════════════════════ */}
                <TabsContent value="overview" className="space-y-6">
                    <div className="grid lg:grid-cols-3 gap-6">
                        {/* Modules Grid */}
                        <div className="lg:col-span-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Sparkles className="h-5 w-5 text-primary" />
                                        Academic Intelligence Modules
                                    </CardTitle>
                                    <CardDescription>
                                        13 integrated modules for complete academic management
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                        {MODULES.map(module => (
                                            <ModuleCard 
                                                key={module.key} 
                                                module={module} 
                                                data={overview}
                                            />
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Activity Feed & Alerts */}
                        <div className="space-y-6">
                            {/* Alerts Summary */}
                            <Card className="border-orange-200 bg-orange-50/50">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Bell className="h-5 w-5 text-orange-600" />
                                        Active Alerts
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    {alerts?.overdue_homeworks > 0 && (
                                        <div className="flex items-center justify-between p-2 bg-white rounded-lg">
                                            <span className="text-sm">Overdue Homework</span>
                                            <Badge variant="destructive">{alerts.overdue_homeworks}</Badge>
                                        </div>
                                    )}
                                    {alerts?.pending_lesson_approvals > 0 && (
                                        <div className="flex items-center justify-between p-2 bg-white rounded-lg">
                                            <span className="text-sm">Pending Approvals</span>
                                            <Badge variant="secondary">{alerts.pending_lesson_approvals}</Badge>
                                        </div>
                                    )}
                                    {alerts?.low_progress_syllabi > 0 && (
                                        <div className="flex items-center justify-between p-2 bg-white rounded-lg">
                                            <span className="text-sm">Low Syllabus Progress</span>
                                            <Badge className="bg-yellow-500">{alerts.low_progress_syllabi}</Badge>
                                        </div>
                                    )}
                                    {alerts?.teachers_overloaded > 0 && (
                                        <div className="flex items-center justify-between p-2 bg-white rounded-lg">
                                            <span className="text-sm">Overloaded Teachers</span>
                                            <Badge variant="destructive">{alerts.teachers_overloaded}</Badge>
                                        </div>
                                    )}
                                    {(!alerts || Object.values(alerts).every(v => !v || v === 0)) && (
                                        <div className="text-center py-4 text-muted-foreground">
                                            <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                                            <p className="text-sm">All clear! No active alerts.</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Activity Feed */}
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Activity className="h-5 w-5" />
                                        Recent Activity
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-1 max-h-80 overflow-auto">
                                        {activityFeed.length === 0 ? (
                                            <div className="text-center py-8 text-muted-foreground">
                                                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                                <p className="text-sm">No recent activity</p>
                                            </div>
                                        ) : (
                                            activityFeed.map((item, idx) => (
                                                <ActivityFeedItem key={idx} item={item} />
                                            ))
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                {/* ═══════════════════════════════════════════════════════════════ */}
                {/* TRENDS TAB */}
                {/* ═══════════════════════════════════════════════════════════════ */}
                <TabsContent value="trends" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Weekly Activity Trends</CardTitle>
                            <CardDescription>Activity across all modules over the past 8 weeks</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {trends.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <LineChartIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>No trend data available yet</p>
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height={400}>
                                    <AreaChart data={trends}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="week" tickFormatter={(v) => formatDate(v)} />
                                        <YAxis />
                                        <Tooltip labelFormatter={(v) => formatDate(v)} />
                                        <Legend />
                                        <Area type="monotone" dataKey="lessons" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} name="Lessons" />
                                        <Area type="monotone" dataKey="homeworks" stackId="1" stroke="#22c55e" fill="#22c55e" fillOpacity={0.6} name="Homework" />
                                        <Area type="monotone" dataKey="activities" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} name="Activities" />
                                        <Area type="monotone" dataKey="badges" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} name="Badges" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ═══════════════════════════════════════════════════════════════ */}
                {/* CLASSES TAB */}
                {/* ═══════════════════════════════════════════════════════════════ */}
                <TabsContent value="classes" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Class-wise Academic Performance</CardTitle>
                            <CardDescription>Comparative analysis across all classes</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {classPerformance.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>No class data available</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {classPerformance.map((cls, idx) => (
                                        <motion.div
                                            key={cls.class_id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <h3 className="font-semibold">{cls.class_name}</h3>
                                                    <p className="text-sm text-muted-foreground">{cls.student_count} students</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Badge>{cls.total_badges} badges</Badge>
                                                    <Badge variant="outline">{cls.avg_points} pts</Badge>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-xs text-muted-foreground mb-1">Homework Completion</p>
                                                    <Progress value={cls.homework_rate || 0} className="h-2" />
                                                    <p className="text-xs text-right mt-1">{cls.homework_rate || 0}%</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground mb-1">Syllabus Progress</p>
                                                    <Progress value={cls.syllabus_progress || 0} className="h-2" />
                                                    <p className="text-xs text-right mt-1">{cls.syllabus_progress || 0}%</p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ═══════════════════════════════════════════════════════════════ */}
                {/* TEACHERS TAB */}
                {/* ═══════════════════════════════════════════════════════════════ */}
                <TabsContent value="teachers" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Teacher Performance Dashboard</CardTitle>
                            <CardDescription>Activity and contribution across all teachers</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {teacherDashboard.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>No teacher data available</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b">
                                                <th className="text-left p-3">Teacher</th>
                                                <th className="text-center p-3">Periods/Week</th>
                                                <th className="text-center p-3">Lesson Plans</th>
                                                <th className="text-center p-3">Homework</th>
                                                <th className="text-center p-3">Materials</th>
                                                <th className="text-center p-3">Activities</th>
                                                <th className="text-center p-3">Syllabus %</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {teacherDashboard.map(teacher => (
                                                <tr key={teacher.employee_id} className="border-b hover:bg-gray-50">
                                                    <td className="p-3 font-medium">{teacher.teacher_name}</td>
                                                    <td className="p-3 text-center">
                                                        <Badge variant={teacher.total_periods > 35 ? 'destructive' : 'outline'}>
                                                            {teacher.total_periods}
                                                        </Badge>
                                                    </td>
                                                    <td className="p-3 text-center">{teacher.lesson_plans}</td>
                                                    <td className="p-3 text-center">{teacher.homeworks}</td>
                                                    <td className="p-3 text-center">{teacher.materials}</td>
                                                    <td className="p-3 text-center">{teacher.activities}</td>
                                                    <td className="p-3 text-center">
                                                        <span className={teacher.syllabus_progress >= 70 ? 'text-green-600' : teacher.syllabus_progress >= 40 ? 'text-yellow-600' : 'text-red-600'}>
                                                            {teacher.syllabus_progress || 0}%
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ═══════════════════════════════════════════════════════════════ */}
                {/* HEALTH TAB */}
                {/* ═══════════════════════════════════════════════════════════════ */}
                <TabsContent value="health" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5" />
                                Module Health Status
                            </CardTitle>
                            <CardDescription>
                                System health check for all academic intelligence modules
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {!moduleHealth ? (
                                <div className="text-center py-12">
                                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                                    <p className="text-muted-foreground">Checking module health...</p>
                                </div>
                            ) : (
                                <>
                                    {/* Overall Health */}
                                    <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="font-semibold text-lg">Overall System Health</h3>
                                                <p className="text-sm text-muted-foreground">
                                                    {moduleHealth.healthy_modules} of {moduleHealth.total_modules} modules healthy
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-4xl font-bold text-green-600">
                                                    {moduleHealth.overall_health.toFixed(0)}%
                                                </span>
                                            </div>
                                        </div>
                                        <Progress value={moduleHealth.overall_health} className="h-3 mt-3" />
                                    </div>

                                    {/* Module List */}
                                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {moduleHealth.modules?.map(mod => (
                                            <motion.div
                                                key={mod.module}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className={`p-4 rounded-lg border ${mod.status === 'healthy' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="font-medium">{mod.module}</span>
                                                    {mod.status === 'healthy' ? (
                                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                                    ) : (
                                                        <AlertTriangle className="h-5 w-5 text-red-600" />
                                                    )}
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    {mod.records.toLocaleString()} records
                                                </p>
                                                {mod.error && (
                                                    <p className="text-xs text-red-600 mt-1">Error: {mod.error}</p>
                                                )}
                                            </motion.div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Footer Banner */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-primary to-purple-600 rounded-xl p-6 text-white"
            >
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            <Sparkles className="h-6 w-6" />
                            21-Day Academic Intelligence Plan Complete!
                        </h3>
                        <p className="text-white/80 mt-1">
                            13 integrated modules • Unified dashboard • AI-powered insights • World-class academic management
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Badge className="bg-white/20 text-white hover:bg-white/30">
                            <Star className="h-3 w-3 mr-1" /> Enterprise Ready
                        </Badge>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
