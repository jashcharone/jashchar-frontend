/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SYLLABUS PROGRESS TRACKER
 * ═══════════════════════════════════════════════════════════════════════════════
 * Day 19 of 21-Day Academic Intelligence Master Plan
 * Comprehensive syllabus tracking with chapter progress, teaching logs, and alerts
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { formatDate, formatDateWithMonthName } from '@/utils/dateUtils';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BookOpen, Plus, Edit2, Trash2, Eye, Search, Filter,
    CheckCircle, Clock, AlertTriangle, PlayCircle, PauseCircle,
    Calendar, Users, Target, TrendingUp, TrendingDown,
    FileText, List, ChevronRight, ChevronDown, BarChart3,
    BookMarked, GraduationCap, CheckSquare, Square,
    RefreshCw, Download, Bell, Settings, Layers,
    ArrowUpRight, ArrowDownRight, Minus, BookCheck, ClipboardList
} from 'lucide-react';
import api from '@/services/api';

// ═══════════════════════════════════════════════════════════════════════════════
// STATUS CONFIGURATIONS
// ═══════════════════════════════════════════════════════════════════════════════

const CHAPTER_STATUS_CONFIG = {
    not_started: { label: 'Not Started', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300', icon: Square },
    planned: { label: 'Planned', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: Calendar },
    in_progress: { label: 'In Progress', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', icon: PlayCircle },
    completed: { label: 'Completed', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle },
    revision: { label: 'Revision', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', icon: RefreshCw },
    assessment_done: { label: 'Assessment Done', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: CheckSquare }
};

const PACING_STATUS_CONFIG = {
    ahead: { label: 'Ahead of Schedule', color: 'text-green-600 dark:text-green-400', icon: TrendingUp },
    on_track: { label: 'On Track', color: 'text-blue-600 dark:text-blue-400', icon: Minus },
    slightly_behind: { label: 'Slightly Behind', color: 'text-yellow-600 dark:text-yellow-400', icon: TrendingDown },
    behind: { label: 'Behind Schedule', color: 'text-orange-600 dark:text-orange-400', icon: AlertTriangle },
    critical: { label: 'Critical', color: 'text-red-600 dark:text-red-400', icon: AlertTriangle },
    not_started: { label: 'Not Started', color: 'text-gray-600 dark:text-gray-400', icon: Square }
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function SyllabusProgressTracker() {
    const { user, currentSessionId, organizationId } = useAuth();
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    
    // State
    const [activeTab, setActiveTab] = useState('dashboard');
    const [loading, setLoading] = useState(true);
    const [syllabi, setSyllabi] = useState([]);
    const [selectedSyllabus, setSelectedSyllabus] = useState(null);
    const [dashboard, setDashboard] = useState(null);
    const [teachingLogs, setTeachingLogs] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [sections, setSections] = useState([]);
    
    // Dialog states
    const [showSyllabusDialog, setShowSyllabusDialog] = useState(false);
    const [showChapterDialog, setShowChapterDialog] = useState(false);
    const [showLogDialog, setShowLogDialog] = useState(false);
    const [showProgressDialog, setShowProgressDialog] = useState(false);
    
    // Filters
    const [filters, setFilters] = useState({
        class_id: '',
        subject_id: '',
        status: ''
    });

    // ═══════════════════════════════════════════════════════════════════════════════
    // DATA FETCHING
    // ═══════════════════════════════════════════════════════════════════════════════

    const fetchDashboard = useCallback(async () => {
        try {
            const response = await api.get('/syllabus-progress/dashboard', {
                params: { class_id: filters.class_id || undefined }
            });
            if (response.data.success) {
                setDashboard(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching dashboard:', error);
        }
    }, [filters.class_id]);

    const fetchSyllabi = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get('/syllabus-progress/syllabi', {
                params: {
                    class_id: filters.class_id || undefined,
                    subject_id: filters.subject_id || undefined,
                    status: filters.status || undefined
                }
            });
            if (response.data.success) {
                setSyllabi(response.data.data || []);
            }
        } catch (error) {
            console.error('Error fetching syllabi:', error);
            toast({ title: 'Error', description: 'Failed to fetch syllabi', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    }, [filters, toast]);

    const fetchTeachingLogs = useCallback(async () => {
        try {
            const response = await api.get('/syllabus-progress/teaching-logs', {
                params: { limit: 50 }
            });
            if (response.data.success) {
                setTeachingLogs(response.data.data || []);
            }
        } catch (error) {
            console.error('Error fetching teaching logs:', error);
        }
    }, []);

    const fetchAlerts = useCallback(async () => {
        try {
            const response = await api.get('/syllabus-progress/alerts', {
                params: { status: 'active', limit: 20 }
            });
            if (response.data.success) {
                setAlerts(response.data.data || []);
            }
        } catch (error) {
            console.error('Error fetching alerts:', error);
        }
    }, []);

    const fetchClasses = async () => {
        try {
            const response = await api.get('/academics/classes');
            if (response.data.success) {
                setClasses(response.data.data || []);
            }
        } catch (error) {
            console.error('Error fetching classes:', error);
        }
    };

    const fetchSubjects = async () => {
        try {
            const response = await api.get('/academics/subjects');
            if (response.data.success) {
                setSubjects(response.data.data || []);
            }
        } catch (error) {
            console.error('Error fetching subjects:', error);
        }
    };

    const fetchSections = async (classId) => {
        if (!classId) return;
        try {
            const response = await api.get(`/academics/classes/${classId}/sections`);
            if (response.data.success) {
                setSections(response.data.data || []);
            }
        } catch (error) {
            console.error('Error fetching sections:', error);
        }
    };

    useEffect(() => {
        fetchClasses();
        fetchSubjects();
        fetchDashboard();
        fetchSyllabi();
        fetchTeachingLogs();
        fetchAlerts();
    }, []);

    useEffect(() => {
        fetchSyllabi();
        fetchDashboard();
    }, [filters]);

    // ═══════════════════════════════════════════════════════════════════════════════
    // ACTIONS
    // ═══════════════════════════════════════════════════════════════════════════════

    const handleAcknowledgeAlert = async (alertId) => {
        try {
            await api.post(`/syllabus-progress/alerts/${alertId}/acknowledge`);
            toast({ title: 'Success', description: 'Alert acknowledged' });
            fetchAlerts();
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to acknowledge alert', variant: 'destructive' });
        }
    };

    const handleGenerateAlerts = async () => {
        try {
            const response = await api.post('/syllabus-progress/alerts/generate');
            toast({ 
                title: 'Alerts Generated', 
                description: `${response.data.data?.length || 0} new alerts generated`
            });
            fetchAlerts();
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to generate alerts', variant: 'destructive' });
        }
    };

    // ═══════════════════════════════════════════════════════════════════════════════
    // RENDER HELPERS
    // ═══════════════════════════════════════════════════════════════════════════════

    const renderPacingBadge = (status) => {
        const config = PACING_STATUS_CONFIG[status] || PACING_STATUS_CONFIG.not_started;
        const Icon = config.icon;
        return (
            <span className={`inline-flex items-center gap-1 text-sm font-medium ${config.color}`}>
                <Icon className="w-4 h-4" />
                {config.label}
            </span>
        );
    };

    const renderChapterStatusBadge = (status) => {
        const config = CHAPTER_STATUS_CONFIG[status] || CHAPTER_STATUS_CONFIG.not_started;
        const Icon = config.icon;
        return (
            <Badge className={`${config.color} gap-1`}>
                <Icon className="w-3 h-3" />
                {config.label}
            </Badge>
        );
    };

    // ═══════════════════════════════════════════════════════════════════════════════
    // DASHBOARD TAB
    // ═══════════════════════════════════════════════════════════════════════════════

    const DashboardTab = () => (
        <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-blue-600">Total Syllabi</p>
                                <p className="text-3xl font-bold text-blue-700">
                                    {dashboard?.summary?.total_syllabi || 0}
                                </p>
                            </div>
                            <BookOpen className="w-12 h-12 text-blue-400" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-green-600">Completed</p>
                                <p className="text-3xl font-bold text-green-700">
                                    {dashboard?.summary?.completed_syllabi || 0}
                                </p>
                            </div>
                            <CheckCircle className="w-12 h-12 text-green-400" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-yellow-600">Avg Completion</p>
                                <p className="text-3xl font-bold text-yellow-700">
                                    {Math.round(dashboard?.summary?.average_completion || 0)}%
                                </p>
                            </div>
                            <TrendingUp className="w-12 h-12 text-yellow-400" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-red-600">Behind Schedule</p>
                                <p className="text-3xl font-bold text-red-700">
                                    {dashboard?.summary?.behind_schedule || 0}
                                </p>
                            </div>
                            <AlertTriangle className="w-12 h-12 text-red-400" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Syllabi Progress */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-primary" />
                            Syllabi Progress Overview
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[400px]">
                            <div className="space-y-4">
                                {(dashboard?.syllabi_progress || []).map((syllabus) => (
                                    <div key={syllabus.id} className="p-4 bg-muted/30 rounded-lg">
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <h4 className="font-medium">{syllabus.syllabus_name}</h4>
                                                <p className="text-sm text-muted-foreground">
                                                    {classes.find(c => c.id === syllabus.class_id)?.class_name || 'Class'} - 
                                                    {subjects.find(s => s.id === syllabus.subject_id)?.subject_name || 'Subject'}
                                                </p>
                                            </div>
                                            {renderPacingBadge(syllabus.progress?.pacing_status)}
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between text-sm">
                                                <span>Chapters: {syllabus.progress?.completed_chapters || 0}/{syllabus.progress?.total_chapters || 0}</span>
                                                <span className="font-medium">{syllabus.progress?.completion_percentage || 0}%</span>
                                            </div>
                                            <Progress 
                                                value={syllabus.progress?.completion_percentage || 0} 
                                                className="h-2"
                                            />
                                        </div>
                                    </div>
                                ))}
                                {(!dashboard?.syllabi_progress || dashboard.syllabi_progress.length === 0) && (
                                    <div className="text-center py-8 text-muted-foreground">
                                        No syllabi found. Create your first syllabus to start tracking.
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>

                {/* Active Alerts */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Bell className="w-5 h-5 text-primary" />
                                Active Alerts
                            </CardTitle>
                            <Button variant="outline" size="sm" onClick={handleGenerateAlerts}>
                                <RefreshCw className="w-4 h-4 mr-1" />
                                Scan
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[400px]">
                            <div className="space-y-3">
                                {(dashboard?.active_alerts || []).map((alert) => (
                                    <div 
                                        key={alert.id} 
                                        className={`p-3 rounded-lg border ${
                                            alert.alert_level === 'critical' ? 'bg-red-50 border-red-200' :
                                            alert.alert_level === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                                            'bg-blue-50 border-blue-200'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <Badge variant={
                                                    alert.alert_level === 'critical' ? 'destructive' :
                                                    alert.alert_level === 'warning' ? 'warning' : 'default'
                                                }>
                                                    {alert.alert_level}
                                                </Badge>
                                                <h5 className="font-medium mt-1">{alert.title}</h5>
                                                <p className="text-sm text-muted-foreground">{alert.message}</p>
                                            </div>
                                            <Button 
                                                variant="ghost" 
                                                size="sm"
                                                onClick={() => handleAcknowledgeAlert(alert.id)}
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                                {(!dashboard?.active_alerts || dashboard.active_alerts.length === 0) && (
                                    <div className="text-center py-8 text-muted-foreground">
                                        No active alerts. Great job!
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Teaching Logs */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ClipboardList className="w-5 h-5 text-primary" />
                        Recent Teaching Logs
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left p-2">Date</th>
                                    <th className="text-left p-2">Teacher</th>
                                    <th className="text-left p-2">Class</th>
                                    <th className="text-left p-2">Subject</th>
                                    <th className="text-left p-2">Topic Summary</th>
                                    <th className="text-left p-2">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(dashboard?.recent_logs || []).slice(0, 5).map((log) => (
                                    <tr key={log.id} className="border-b hover:bg-muted/50">
                                        <td className="p-2">{formatDate(log.teaching_date)}</td>
                                        <td className="p-2">{log.teacher?.first_name} {log.teacher?.last_name}</td>
                                        <td className="p-2">{log.class?.class_name}</td>
                                        <td className="p-2">{log.subject?.subject_name}</td>
                                        <td className="p-2 max-w-xs truncate">{log.topic_summary}</td>
                                        <td className="p-2">
                                            {log.is_verified ? (
                                                <Badge variant="success">Verified</Badge>
                                            ) : (
                                                <Badge variant="outline">Pending</Badge>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );

    // ═══════════════════════════════════════════════════════════════════════════════
    // SYLLABI TAB
    // ═══════════════════════════════════════════════════════════════════════════════

    const SyllabiTab = () => {
        const [syllabusForm, setSyllabusForm] = useState({
            syllabus_name: '',
            class_id: '',
            subject_id: '',
            description: '',
            textbook_name: '',
            total_periods_required: 0,
            periods_per_week: 0,
            start_date: '',
            end_date: '',
            board_name: ''
        });

        const handleCreateSyllabus = async () => {
            try {
                const response = await api.post('/syllabus-progress/syllabi', syllabusForm);
                if (response.data.success) {
                    toast({ title: 'Success', description: 'Syllabus created successfully' });
                    setShowSyllabusDialog(false);
                    fetchSyllabi();
                    setSyllabusForm({
                        syllabus_name: '',
                        class_id: '',
                        subject_id: '',
                        description: '',
                        textbook_name: '',
                        total_periods_required: 0,
                        periods_per_week: 0,
                        start_date: '',
                        end_date: '',
                        board_name: ''
                    });
                }
            } catch (error) {
                toast({ title: 'Error', description: 'Failed to create syllabus', variant: 'destructive' });
            }
        };

        return (
            <div className="space-y-6">
                {/* Filters & Actions */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-3">
                        <Select 
                            value={filters.class_id} 
                            onValueChange={(v) => setFilters(prev => ({ ...prev, class_id: v }))}
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="All Classes" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">All Classes</SelectItem>
                                {classes.map(cls => (
                                    <SelectItem key={cls.id} value={cls.id}>{cls.class_name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select 
                            value={filters.subject_id} 
                            onValueChange={(v) => setFilters(prev => ({ ...prev, subject_id: v }))}
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="All Subjects" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">All Subjects</SelectItem>
                                {subjects.map(sub => (
                                    <SelectItem key={sub.id} value={sub.id}>{sub.subject_name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select 
                            value={filters.status} 
                            onValueChange={(v) => setFilters(prev => ({ ...prev, status: v }))}
                        >
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="All Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">All Status</SelectItem>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="archived">Archived</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <Dialog open={showSyllabusDialog} onOpenChange={setShowSyllabusDialog}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="w-4 h-4 mr-2" />
                                Create Syllabus
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>Create New Syllabus</DialogTitle>
                                <DialogDescription>Define the syllabus structure for a class and subject</DialogDescription>
                            </DialogHeader>
                            <div className="grid grid-cols-2 gap-4 py-4">
                                <div className="col-span-2">
                                    <Label>Syllabus Name</Label>
                                    <Input 
                                        value={syllabusForm.syllabus_name}
                                        onChange={(e) => setSyllabusForm(prev => ({ ...prev, syllabus_name: e.target.value }))}
                                        placeholder="e.g., Mathematics Class X - 2026"
                                    />
                                </div>
                                <div>
                                    <Label>Class</Label>
                                    <Select 
                                        value={syllabusForm.class_id}
                                        onValueChange={(v) => setSyllabusForm(prev => ({ ...prev, class_id: v }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Class" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {classes.map(cls => (
                                                <SelectItem key={cls.id} value={cls.id}>{cls.class_name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Subject</Label>
                                    <Select 
                                        value={syllabusForm.subject_id}
                                        onValueChange={(v) => setSyllabusForm(prev => ({ ...prev, subject_id: v }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Subject" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {subjects.map(sub => (
                                                <SelectItem key={sub.id} value={sub.id}>{sub.subject_name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Board/Curriculum</Label>
                                    <Input 
                                        value={syllabusForm.board_name}
                                        onChange={(e) => setSyllabusForm(prev => ({ ...prev, board_name: e.target.value }))}
                                        placeholder="e.g., CBSE, ICSE, State Board"
                                    />
                                </div>
                                <div>
                                    <Label>Textbook Name</Label>
                                    <Input 
                                        value={syllabusForm.textbook_name}
                                        onChange={(e) => setSyllabusForm(prev => ({ ...prev, textbook_name: e.target.value }))}
                                        placeholder="Primary textbook name"
                                    />
                                </div>
                                <div>
                                    <Label>Total Periods Required</Label>
                                    <Input 
                                        type="number"
                                        value={syllabusForm.total_periods_required}
                                        onChange={(e) => setSyllabusForm(prev => ({ ...prev, total_periods_required: parseInt(e.target.value) || 0 }))}
                                    />
                                </div>
                                <div>
                                    <Label>Periods Per Week</Label>
                                    <Input 
                                        type="number"
                                        value={syllabusForm.periods_per_week}
                                        onChange={(e) => setSyllabusForm(prev => ({ ...prev, periods_per_week: parseInt(e.target.value) || 0 }))}
                                    />
                                </div>
                                <div>
                                    <Label>Start Date</Label>
                                    <Input 
                                        type="date"
                                        value={syllabusForm.start_date}
                                        onChange={(e) => setSyllabusForm(prev => ({ ...prev, start_date: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <Label>End Date</Label>
                                    <Input 
                                        type="date"
                                        value={syllabusForm.end_date}
                                        onChange={(e) => setSyllabusForm(prev => ({ ...prev, end_date: e.target.value }))}
                                    />
                                </div>
                                <div className="col-span-2">
                                    <Label>Description</Label>
                                    <Textarea 
                                        value={syllabusForm.description}
                                        onChange={(e) => setSyllabusForm(prev => ({ ...prev, description: e.target.value }))}
                                        placeholder="Brief description of the syllabus"
                                        rows={3}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setShowSyllabusDialog(false)}>Cancel</Button>
                                <Button onClick={handleCreateSyllabus}>Create Syllabus</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Syllabi Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {syllabi.map((syllabus) => (
                        <Card key={syllabus.id} className="hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => setSelectedSyllabus(syllabus)}>
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle className="text-lg">{syllabus.syllabus_name}</CardTitle>
                                        <CardDescription>
                                            {syllabus.class?.class_name} - {syllabus.subject?.subject_name}
                                        </CardDescription>
                                    </div>
                                    <Badge variant={
                                        syllabus.status === 'active' ? 'success' :
                                        syllabus.status === 'draft' ? 'secondary' : 'outline'
                                    }>
                                        {syllabus.status}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {syllabus.board_name && (
                                        <p className="text-sm text-muted-foreground">
                                            Board: {syllabus.board_name}
                                        </p>
                                    )}
                                    <div className="flex items-center gap-4 text-sm">
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-4 h-4 text-muted-foreground" />
                                            {syllabus.total_periods_required} periods
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-4 h-4 text-muted-foreground" />
                                            {syllabus.periods_per_week}/week
                                        </span>
                                    </div>
                                    {syllabus.start_date && syllabus.end_date && (
                                        <p className="text-sm text-muted-foreground">
                                            {formatDate(syllabus.start_date)} - {formatDate(syllabus.end_date)}
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {syllabi.length === 0 && !loading && (
                    <div className="text-center py-12">
                        <BookOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium">No Syllabi Found</h3>
                        <p className="text-muted-foreground">Create your first syllabus to start tracking progress</p>
                    </div>
                )}
            </div>
        );
    };

    // ═══════════════════════════════════════════════════════════════════════════════
    // TEACHING LOGS TAB
    // ═══════════════════════════════════════════════════════════════════════════════

    const TeachingLogsTab = () => {
        const [logForm, setLogForm] = useState({
            teaching_date: new Date().toISOString().split('T')[0],
            class_id: '',
            section_id: '',
            subject_id: '',
            period_number: '',
            topic_summary: '',
            teaching_method: '',
            homework_given: false,
            homework_description: '',
            students_present: '',
            student_participation: ''
        });

        const handleCreateLog = async () => {
            try {
                const response = await api.post('/syllabus-progress/teaching-logs', logForm);
                if (response.data.success) {
                    toast({ title: 'Success', description: 'Teaching log created successfully' });
                    setShowLogDialog(false);
                    fetchTeachingLogs();
                    setLogForm({
                        teaching_date: new Date().toISOString().split('T')[0],
                        class_id: '',
                        section_id: '',
                        subject_id: '',
                        period_number: '',
                        topic_summary: '',
                        teaching_method: '',
                        homework_given: false,
                        homework_description: '',
                        students_present: '',
                        student_participation: ''
                    });
                }
            } catch (error) {
                toast({ title: 'Error', description: 'Failed to create teaching log', variant: 'destructive' });
            }
        };

        const handleVerifyLog = async (logId) => {
            try {
                await api.post(`/syllabus-progress/teaching-logs/${logId}/verify`);
                toast({ title: 'Success', description: 'Teaching log verified' });
                fetchTeachingLogs();
            } catch (error) {
                toast({ title: 'Error', description: 'Failed to verify log', variant: 'destructive' });
            }
        };

        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <ClipboardList className="w-5 h-5" />
                        Daily Teaching Logs
                    </h2>
                    <Dialog open={showLogDialog} onOpenChange={setShowLogDialog}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="w-4 h-4 mr-2" />
                                Add Teaching Log
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>Create Teaching Log</DialogTitle>
                                <DialogDescription>Record what was taught in today's class</DialogDescription>
                            </DialogHeader>
                            <div className="grid grid-cols-2 gap-4 py-4">
                                <div>
                                    <Label>Date</Label>
                                    <Input 
                                        type="date"
                                        value={logForm.teaching_date}
                                        onChange={(e) => setLogForm(prev => ({ ...prev, teaching_date: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <Label>Period Number</Label>
                                    <Input 
                                        type="number"
                                        value={logForm.period_number}
                                        onChange={(e) => setLogForm(prev => ({ ...prev, period_number: e.target.value }))}
                                        placeholder="1-8"
                                    />
                                </div>
                                <div>
                                    <Label>Class</Label>
                                    <Select 
                                        value={logForm.class_id}
                                        onValueChange={(v) => {
                                            setLogForm(prev => ({ ...prev, class_id: v }));
                                            fetchSections(v);
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Class" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {classes.map(cls => (
                                                <SelectItem key={cls.id} value={cls.id}>{cls.class_name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Section</Label>
                                    <Select 
                                        value={logForm.section_id}
                                        onValueChange={(v) => setLogForm(prev => ({ ...prev, section_id: v }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Section" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {sections.map(sec => (
                                                <SelectItem key={sec.id} value={sec.id}>{sec.section_name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Subject</Label>
                                    <Select 
                                        value={logForm.subject_id}
                                        onValueChange={(v) => setLogForm(prev => ({ ...prev, subject_id: v }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Subject" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {subjects.map(sub => (
                                                <SelectItem key={sub.id} value={sub.id}>{sub.subject_name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Teaching Method</Label>
                                    <Select 
                                        value={logForm.teaching_method}
                                        onValueChange={(v) => setLogForm(prev => ({ ...prev, teaching_method: v }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Method" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Lecture">Lecture</SelectItem>
                                            <SelectItem value="Discussion">Discussion</SelectItem>
                                            <SelectItem value="Activity">Activity</SelectItem>
                                            <SelectItem value="Lab">Lab/Practical</SelectItem>
                                            <SelectItem value="Project">Project Work</SelectItem>
                                            <SelectItem value="Assessment">Assessment</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="col-span-2">
                                    <Label>Topic Summary</Label>
                                    <Textarea 
                                        value={logForm.topic_summary}
                                        onChange={(e) => setLogForm(prev => ({ ...prev, topic_summary: e.target.value }))}
                                        placeholder="What was taught in this class..."
                                        rows={3}
                                    />
                                </div>
                                <div>
                                    <Label>Students Present</Label>
                                    <Input 
                                        type="number"
                                        value={logForm.students_present}
                                        onChange={(e) => setLogForm(prev => ({ ...prev, students_present: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <Label>Student Participation</Label>
                                    <Select 
                                        value={logForm.student_participation}
                                        onValueChange={(v) => setLogForm(prev => ({ ...prev, student_participation: v }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Level" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="poor">Poor</SelectItem>
                                            <SelectItem value="average">Average</SelectItem>
                                            <SelectItem value="good">Good</SelectItem>
                                            <SelectItem value="excellent">Excellent</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setShowLogDialog(false)}>Cancel</Button>
                                <Button onClick={handleCreateLog}>Save Log</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Logs Table */}
                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="text-left p-3">Date</th>
                                        <th className="text-left p-3">Period</th>
                                        <th className="text-left p-3">Class/Section</th>
                                        <th className="text-left p-3">Subject</th>
                                        <th className="text-left p-3">Topic</th>
                                        <th className="text-left p-3">Method</th>
                                        <th className="text-left p-3">Participation</th>
                                        <th className="text-left p-3">Status</th>
                                        <th className="text-left p-3">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {teachingLogs.map((log) => (
                                        <tr key={log.id} className="border-b hover:bg-muted/30">
                                            <td className="p-3">{formatDate(log.teaching_date)}</td>
                                            <td className="p-3">{log.period_number || '-'}</td>
                                            <td className="p-3">
                                                {log.class?.class_name}
                                                {log.section?.section_name && ` - ${log.section.section_name}`}
                                            </td>
                                            <td className="p-3">{log.subject?.subject_name}</td>
                                            <td className="p-3 max-w-xs truncate">{log.topic_summary}</td>
                                            <td className="p-3">{log.teaching_method || '-'}</td>
                                            <td className="p-3">
                                                {log.student_participation && (
                                                    <Badge variant={
                                                        log.student_participation === 'excellent' ? 'success' :
                                                        log.student_participation === 'good' ? 'default' :
                                                        log.student_participation === 'average' ? 'secondary' : 'destructive'
                                                    }>
                                                        {log.student_participation}
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="p-3">
                                                {log.is_verified ? (
                                                    <Badge variant="success">Verified</Badge>
                                                ) : (
                                                    <Badge variant="outline">Pending</Badge>
                                                )}
                                            </td>
                                            <td className="p-3">
                                                <div className="flex items-center gap-1">
                                                    {!log.is_verified && (
                                                        <Button 
                                                            variant="ghost" 
                                                            size="sm"
                                                            onClick={() => handleVerifyLog(log.id)}
                                                        >
                                                            <CheckCircle className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                    <Button variant="ghost" size="sm">
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {teachingLogs.length === 0 && (
                    <div className="text-center py-12">
                        <ClipboardList className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium">No Teaching Logs</h3>
                        <p className="text-muted-foreground">Start recording daily teaching activities</p>
                    </div>
                )}
            </div>
        );
    };

    // ═══════════════════════════════════════════════════════════════════════════════
    // ALERTS TAB
    // ═══════════════════════════════════════════════════════════════════════════════

    const AlertsTab = () => (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Syllabus Alerts
                </h2>
                <Button onClick={handleGenerateAlerts}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Scan for Issues
                </Button>
            </div>

            <div className="space-y-4">
                {alerts.map((alert) => (
                    <Card key={alert.id} className={`border-l-4 ${
                        alert.alert_level === 'critical' ? 'border-l-red-500 bg-red-50' :
                        alert.alert_level === 'warning' ? 'border-l-yellow-500 bg-yellow-50' :
                        'border-l-blue-500 bg-blue-50'
                    }`}>
                        <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Badge variant={
                                            alert.alert_level === 'critical' ? 'destructive' :
                                            alert.alert_level === 'warning' ? 'warning' : 'default'
                                        }>
                                            {alert.alert_level.toUpperCase()}
                                        </Badge>
                                        <span className="text-sm text-muted-foreground">
                                            {alert.alert_type.replace(/_/g, ' ')}
                                        </span>
                                    </div>
                                    <h3 className="font-medium text-lg">{alert.title}</h3>
                                    <p className="text-muted-foreground mt-1">{alert.message}</p>
                                    
                                    {alert.recommended_action && (
                                        <div className="mt-3 p-2 bg-white/50 rounded">
                                            <p className="text-sm">
                                                <strong>Recommended Action:</strong> {alert.recommended_action}
                                            </p>
                                        </div>
                                    )}
                                    
                                    <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                                        {alert.syllabus?.syllabus_name && (
                                            <span>Syllabus: {alert.syllabus.syllabus_name}</span>
                                        )}
                                        {alert.teacher && (
                                            <span>Teacher: {alert.teacher.first_name} {alert.teacher.last_name}</span>
                                        )}
                                        <span>Created: {formatDate(alert.created_at)}</span>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                    <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => handleAcknowledgeAlert(alert.id)}
                                    >
                                        <CheckCircle className="w-4 h-4 mr-1" />
                                        Acknowledge
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {alerts.length === 0 && (
                    <div className="text-center py-12">
                        <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
                        <h3 className="text-lg font-medium">All Clear!</h3>
                        <p className="text-muted-foreground">No active alerts. Everything is on track.</p>
                    </div>
                )}
            </div>
        </div>
    );

    // ═══════════════════════════════════════════════════════════════════════════════
    // MAIN RENDER
    // ═══════════════════════════════════════════════════════════════════════════════

    return (
        <div className="container mx-auto p-6 max-w-7xl">
            <div className="mb-6">
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <BookCheck className="w-8 h-8 text-primary" />
                    Syllabus Progress Tracker
                </h1>
                <p className="text-muted-foreground mt-1">
                    Track curriculum completion, teaching logs, and syllabus pacing
                </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4 mb-6">
                    <TabsTrigger value="dashboard" className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        Dashboard
                    </TabsTrigger>
                    <TabsTrigger value="syllabi" className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        Syllabi
                    </TabsTrigger>
                    <TabsTrigger value="logs" className="flex items-center gap-2">
                        <ClipboardList className="w-4 h-4" />
                        Teaching Logs
                    </TabsTrigger>
                    <TabsTrigger value="alerts" className="flex items-center gap-2">
                        <Bell className="w-4 h-4" />
                        Alerts
                        {alerts.length > 0 && (
                            <Badge variant="destructive" className="ml-1">{alerts.length}</Badge>
                        )}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="dashboard">
                    <DashboardTab />
                </TabsContent>

                <TabsContent value="syllabi">
                    <SyllabiTab />
                </TabsContent>

                <TabsContent value="logs">
                    <TeachingLogsTab />
                </TabsContent>

                <TabsContent value="alerts">
                    <AlertsTab />
                </TabsContent>
            </Tabs>

            {/* Syllabus Detail Dialog */}
            {selectedSyllabus && (
                <Dialog open={!!selectedSyllabus} onOpenChange={() => setSelectedSyllabus(null)}>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{selectedSyllabus.syllabus_name}</DialogTitle>
                            <DialogDescription>
                                {selectedSyllabus.class?.class_name} - {selectedSyllabus.subject?.subject_name}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                                <Card>
                                    <CardContent className="p-4 text-center">
                                        <p className="text-sm text-muted-foreground">Total Periods</p>
                                        <p className="text-2xl font-bold">{selectedSyllabus.total_periods_required}</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="p-4 text-center">
                                        <p className="text-sm text-muted-foreground">Periods/Week</p>
                                        <p className="text-2xl font-bold">{selectedSyllabus.periods_per_week}</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="p-4 text-center">
                                        <p className="text-sm text-muted-foreground">Board</p>
                                        <p className="text-2xl font-bold">{selectedSyllabus.board_name || '-'}</p>
                                    </CardContent>
                                </Card>
                            </div>

                            {selectedSyllabus.description && (
                                <div>
                                    <Label>Description</Label>
                                    <p className="text-muted-foreground">{selectedSyllabus.description}</p>
                                </div>
                            )}

                            {selectedSyllabus.textbook_name && (
                                <div>
                                    <Label>Textbook</Label>
                                    <p className="text-muted-foreground">{selectedSyllabus.textbook_name}</p>
                                </div>
                            )}

                            <div className="flex items-center gap-4">
                                {selectedSyllabus.start_date && (
                                    <div>
                                        <Label>Start Date</Label>
                                        <p>{formatDate(selectedSyllabus.start_date)}</p>
                                    </div>
                                )}
                                {selectedSyllabus.end_date && (
                                    <div>
                                        <Label>End Date</Label>
                                        <p>{formatDate(selectedSyllabus.end_date)}</p>
                                    </div>
                                )}
                            </div>

                            {/* Chapters list would go here */}
                            <div>
                                <Label>Chapters ({selectedSyllabus.chapters?.length || 0})</Label>
                                <div className="mt-2 space-y-2">
                                    {(selectedSyllabus.chapters || []).map((chapter, index) => (
                                        <div key={chapter.id} className="p-3 bg-muted/30 rounded flex items-center justify-between">
                                            <div>
                                                <span className="font-medium">Ch {chapter.chapter_number}: </span>
                                                {chapter.chapter_name}
                                            </div>
                                            <Badge variant="outline">{chapter.estimated_periods} periods</Badge>
                                        </div>
                                    ))}
                                    {(!selectedSyllabus.chapters || selectedSyllabus.chapters.length === 0) && (
                                        <p className="text-muted-foreground text-sm">No chapters added yet</p>
                                    )}
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setSelectedSyllabus(null)}>Close</Button>
                            <Button>
                                <Edit2 className="w-4 h-4 mr-2" />
                                Edit Syllabus
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
