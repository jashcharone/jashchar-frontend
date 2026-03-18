/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * COMPREHENSIVE REPORTS ENGINE
 * ═══════════════════════════════════════════════════════════════════════════════
 * Day 20 of 21-Day Academic Intelligence Master Plan
 * Complete report generation, scheduling, and analytics system
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText, Download, Calendar, Clock, Star, StarOff, Play, Pause,
    Filter, Search, RefreshCw, Plus, Trash2, Eye, Settings, BarChart2,
    PieChart, TrendingUp, CheckCircle, XCircle, Loader2, AlertTriangle,
    Mail, Bell, Bookmark, Grid, List, Folder, ChevronRight, Sparkles,
    Sheet, Image, FileType, Table, Users, GraduationCap,
    BookOpen, CreditCard, Briefcase, Building, ClipboardList, Archive
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import axios from 'axios';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { toast } from 'sonner';
import { formatDate, formatDateTime } from '@/utils/dateUtils';
import {
    BarChart, Bar, LineChart, Line, PieChart as RechartsPie, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart
} from 'recharts';

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];

// Category Icons mapping
const CATEGORY_ICONS = {
    'Student': Users,
    'Academic': GraduationCap,
    'Attendance': ClipboardList,
    'Examination': BookOpen,
    'Fee': CreditCard,
    'Staff': Briefcase,
    'Class': Building,
    'Administrative': Archive
};

// Output format icons
const FORMAT_ICONS = {
    'pdf': FileType,
    'excel': Sheet,
    'csv': Table,
    'html': FileText
};

export default function ReportsEngine() {
    const { currentSessionId, organizationId } = useAuth();
    const { selectedBranch } = useBranch();

    // State
    const [activeTab, setActiveTab] = useState('dashboard');
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

    // Data states
    const [dashboard, setDashboard] = useState(null);
    const [categories, setCategories] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [instances, setInstances] = useState([]);
    const [scheduled, setScheduled] = useState([]);
    const [favorites, setFavorites] = useState([]);
    const [analytics, setAnalytics] = useState(null);

    // Filter states
    const [selectedCategory, setSelectedCategory] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('grid');

    // Dialog states
    const [generateDialog, setGenerateDialog] = useState({ open: false, template: null });
    const [scheduleDialog, setScheduleDialog] = useState({ open: false, template: null });
    const [previewDialog, setPreviewDialog] = useState({ open: false, instance: null });

    // Form states
    const [generateParams, setGenerateParams] = useState({});
    const [scheduleForm, setScheduleForm] = useState({
        schedule_name: '',
        frequency: 'daily',
        run_time: '06:00',
        output_format: 'pdf',
        email_recipients: '',
        is_active: true
    });

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
            const [dashRes, catRes, tplRes, instRes, schedRes, favRes] = await Promise.all([
                axios.get('/api/reports-engine/dashboard'),
                axios.get('/api/reports-engine/categories'),
                axios.get('/api/reports-engine/templates'),
                axios.get('/api/reports-engine/instances'),
                axios.get('/api/reports-engine/scheduled'),
                axios.get('/api/reports-engine/favorites')
            ]);

            setDashboard(dashRes.data.data);
            setCategories(catRes.data.data || []);
            setTemplates(tplRes.data.data || []);
            setInstances(instRes.data.data || []);
            setScheduled(schedRes.data.data || []);
            setFavorites(favRes.data.data || []);
        } catch (error) {
            console.error('Load data error:', error);
            toast.error('Failed to load reports data');
        } finally {
            setLoading(false);
        }
    };

    const loadAnalytics = async () => {
        try {
            const res = await axios.get('/api/reports-engine/analytics');
            setAnalytics(res.data.data);
        } catch (error) {
            console.error('Load analytics error:', error);
        }
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // FILTERED DATA
    // ═══════════════════════════════════════════════════════════════════════════

    const filteredTemplates = useMemo(() => {
        return templates.filter(t => {
            if (selectedCategory && t.category_id !== selectedCategory) return false;
            if (searchTerm && !t.template_name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
            return true;
        });
    }, [templates, selectedCategory, searchTerm]);

    const favoriteIds = useMemo(() => {
        return new Set(favorites.map(f => f.template_id));
    }, [favorites]);

    // ═══════════════════════════════════════════════════════════════════════════
    // ACTIONS
    // ═══════════════════════════════════════════════════════════════════════════

    const handleGenerateReport = async () => {
        if (!generateDialog.template) return;

        setGenerating(true);
        try {
            const res = await axios.post('/api/reports-engine/generate', {
                template_id: generateDialog.template.id,
                parameters: generateParams,
                output_format: generateParams.output_format || 'pdf'
            });

            toast.success('Report generated successfully!');
            setGenerateDialog({ open: false, template: null });
            setGenerateParams({});

            // Refresh instances
            const instRes = await axios.get('/api/reports-engine/instances');
            setInstances(instRes.data.data || []);

            // Open preview
            setPreviewDialog({ 
                open: true, 
                instance: { ...res.data.data, report_data: res.data.data.report_data }
            });

        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to generate report');
        } finally {
            setGenerating(false);
        }
    };

    const handleScheduleReport = async () => {
        if (!scheduleDialog.template) return;

        try {
            await axios.post('/api/reports-engine/scheduled', {
                ...scheduleForm,
                template_id: scheduleDialog.template.id,
                parameters: generateParams,
                email_recipients: scheduleForm.email_recipients.split(',').map(e => e.trim()).filter(Boolean)
            });

            toast.success('Report scheduled successfully!');
            setScheduleDialog({ open: false, template: null });
            setScheduleForm({
                schedule_name: '',
                frequency: 'daily',
                run_time: '06:00',
                output_format: 'pdf',
                email_recipients: '',
                is_active: true
            });

            // Refresh scheduled
            const schedRes = await axios.get('/api/reports-engine/scheduled');
            setScheduled(schedRes.data.data || []);

        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to schedule report');
        }
    };

    const toggleFavorite = async (template) => {
        try {
            if (favoriteIds.has(template.id)) {
                await axios.delete(`/api/reports-engine/favorites/${template.id}`);
                toast.success('Removed from favorites');
            } else {
                await axios.post('/api/reports-engine/favorites', {
                    template_id: template.id
                });
                toast.success('Added to favorites');
            }

            // Refresh favorites
            const favRes = await axios.get('/api/reports-engine/favorites');
            setFavorites(favRes.data.data || []);
        } catch (error) {
            toast.error('Failed to update favorites');
        }
    };

    const toggleScheduledReport = async (schedule) => {
        try {
            await axios.patch(`/api/reports-engine/scheduled/${schedule.id}/toggle`, {
                is_active: !schedule.is_active
            });
            toast.success(schedule.is_active ? 'Schedule paused' : 'Schedule activated');

            // Refresh scheduled
            const schedRes = await axios.get('/api/reports-engine/scheduled');
            setScheduled(schedRes.data.data || []);
        } catch (error) {
            toast.error('Failed to toggle schedule');
        }
    };

    const deleteScheduledReport = async (id) => {
        try {
            await axios.delete(`/api/reports-engine/scheduled/${id}`);
            toast.success('Schedule deleted');
            setScheduled(prev => prev.filter(s => s.id !== id));
        } catch (error) {
            toast.error('Failed to delete schedule');
        }
    };

    const deleteInstance = async (id) => {
        try {
            await axios.delete(`/api/reports-engine/instances/${id}`);
            toast.success('Report deleted');
            setInstances(prev => prev.filter(i => i.id !== id));
        } catch (error) {
            toast.error('Failed to delete report');
        }
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // RENDER COMPONENTS
    // ═══════════════════════════════════════════════════════════════════════════

    // Stats Card Component
    const StatCard = ({ title, value, icon: Icon, color, trend }) => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <Card>
                <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm text-muted-foreground">{title}</p>
                            <h3 className="text-2xl font-bold mt-1">{value}</h3>
                            {trend && (
                                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                    <TrendingUp className="h-3 w-3 text-green-500" />
                                    {trend}
                                </p>
                            )}
                        </div>
                        <div className={`p-3 rounded-full ${color}`}>
                            <Icon className="h-5 w-5 text-white" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );

    // Template Card Component
    const TemplateCard = ({ template }) => {
        const CategoryIcon = CATEGORY_ICONS[template.category?.category_name] || FileText;
        const isFavorite = favoriteIds.has(template.id);

        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
            >
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                            <div className={`p-2 rounded-lg ${template.category?.color || 'bg-blue-100'}`}>
                                <CategoryIcon className="h-5 w-5 text-blue-600" />
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFavorite(template);
                                }}
                            >
                                {isFavorite ? (
                                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                ) : (
                                    <StarOff className="h-4 w-4 text-gray-400" />
                                )}
                            </Button>
                        </div>

                        <h3 className="font-semibold text-sm mb-1 line-clamp-2">{template.template_name}</h3>
                        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                            {template.description || 'No description'}
                        </p>

                        <div className="flex gap-2 mb-3">
                            <Badge variant="outline" className="text-xs">
                                {template.category?.category_name || 'General'}
                            </Badge>
                            {template.is_system && (
                                <Badge variant="secondary" className="text-xs">System</Badge>
                            )}
                        </div>

                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                className="flex-1"
                                onClick={() => setGenerateDialog({ open: true, template })}
                            >
                                <Play className="h-3 w-3 mr-1" />
                                Generate
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setScheduleDialog({ open: true, template })}
                            >
                                <Calendar className="h-3 w-3" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        );
    };

    // Instance Row Component
    const InstanceRow = ({ instance }) => {
        const FormatIcon = FORMAT_ICONS[instance.output_format] || FileText;

        const statusConfig = {
            completed: { color: 'text-green-600 bg-green-100', icon: CheckCircle },
            processing: { color: 'text-blue-600 bg-blue-100', icon: Loader2 },
            failed: { color: 'text-red-600 bg-red-100', icon: XCircle },
            pending: { color: 'text-yellow-600 bg-yellow-100', icon: Clock }
        };

        const status = statusConfig[instance.status] || statusConfig.pending;
        const StatusIcon = status.icon;

        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-between p-4 bg-white rounded-lg border hover:shadow-md transition-shadow"
            >
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-gray-100 rounded">
                        <FormatIcon className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                        <h4 className="font-medium">{instance.report_name}</h4>
                        <p className="text-sm text-muted-foreground">
                            {formatDateTime(instance.created_at)} • {instance.total_records || 0} records
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <Badge className={status.color}>
                        <StatusIcon className={`h-3 w-3 mr-1 ${instance.status === 'processing' ? 'animate-spin' : ''}`} />
                        {instance.status}
                    </Badge>

                    <div className="flex gap-2">
                        {instance.status === 'completed' && (
                            <>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setPreviewDialog({ open: true, instance })}
                                >
                                    <Eye className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="ghost">
                                    <Download className="h-4 w-4" />
                                </Button>
                            </>
                        )}
                        <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600"
                            onClick={() => deleteInstance(instance.id)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
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
                    <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading Reports Engine...</p>
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
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <BarChart2 className="h-6 w-6 text-primary" />
                        Reports Engine
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Generate, schedule, and manage all your reports in one place
                    </p>
                </div>

                <div className="flex gap-2">
                    <Button variant="outline" onClick={loadData}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Main Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-flex">
                    <TabsTrigger value="dashboard">
                        <PieChart className="h-4 w-4 mr-2" />
                        Dashboard
                    </TabsTrigger>
                    <TabsTrigger value="templates">
                        <FileText className="h-4 w-4 mr-2" />
                        Templates
                    </TabsTrigger>
                    <TabsTrigger value="history">
                        <Archive className="h-4 w-4 mr-2" />
                        History
                    </TabsTrigger>
                    <TabsTrigger value="scheduled">
                        <Calendar className="h-4 w-4 mr-2" />
                        Scheduled
                    </TabsTrigger>
                    <TabsTrigger value="favorites">
                        <Star className="h-4 w-4 mr-2" />
                        Favorites
                    </TabsTrigger>
                </TabsList>

                {/* ═══════════════════════════════════════════════════════════════ */}
                {/* DASHBOARD TAB */}
                {/* ═══════════════════════════════════════════════════════════════ */}
                <TabsContent value="dashboard" className="space-y-6">
                    {/* Stats Cards */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard
                            title="Total Generated"
                            value={dashboard?.stats?.total_generated || 0}
                            icon={FileText}
                            color="bg-blue-500"
                            trend="Last 30 days"
                        />
                        <StatCard
                            title="Completed"
                            value={dashboard?.stats?.completed_count || 0}
                            icon={CheckCircle}
                            color="bg-green-500"
                        />
                        <StatCard
                            title="Failed"
                            value={dashboard?.stats?.failed_count || 0}
                            icon={XCircle}
                            color="bg-red-500"
                        />
                        <StatCard
                            title="Active Schedules"
                            value={dashboard?.stats?.scheduled_active || 0}
                            icon={Calendar}
                            color="bg-purple-500"
                        />
                    </div>

                    {/* Categories & Recent */}
                    <div className="grid lg:grid-cols-3 gap-6">
                        {/* Categories */}
                        <Card className="lg:col-span-1">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Folder className="h-5 w-5" />
                                    Report Categories
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {categories.map(cat => {
                                        const Icon = CATEGORY_ICONS[cat.category_name] || FileText;
                                        return (
                                            <motion.div
                                                key={cat.id}
                                                whileHover={{ x: 5 }}
                                                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                                                onClick={() => {
                                                    setSelectedCategory(cat.id);
                                                    setActiveTab('templates');
                                                }}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded ${cat.color || 'bg-blue-100'}`}>
                                                        <Icon className="h-4 w-4" />
                                                    </div>
                                                    <span className="font-medium">{cat.category_name}</span>
                                                </div>
                                                <ChevronRight className="h-4 w-4 text-gray-400" />
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Recent Reports */}
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Clock className="h-5 w-5" />
                                    Recent Reports
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {dashboard?.recent_reports?.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                            <p>No reports generated yet</p>
                                            <p className="text-sm">Start by selecting a template</p>
                                        </div>
                                    ) : (
                                        dashboard?.recent_reports?.map(report => (
                                            <InstanceRow key={report.id} instance={report} />
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* ═══════════════════════════════════════════════════════════════ */}
                {/* TEMPLATES TAB */}
                {/* ═══════════════════════════════════════════════════════════════ */}
                <TabsContent value="templates" className="space-y-6">
                    {/* Filters */}
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder="Search templates..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>

                                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                    <SelectTrigger className="w-full md:w-48">
                                        <SelectValue placeholder="All Categories" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">All Categories</SelectItem>
                                        {categories.map(cat => (
                                            <SelectItem key={cat.id} value={cat.id}>
                                                {cat.category_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <div className="flex gap-1 border rounded-lg p-1">
                                    <Button
                                        variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                                        size="sm"
                                        onClick={() => setViewMode('grid')}
                                    >
                                        <Grid className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                                        size="sm"
                                        onClick={() => setViewMode('list')}
                                    >
                                        <List className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Templates Grid */}
                    {filteredTemplates.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                                <h3 className="font-medium mb-2">No templates found</h3>
                                <p className="text-muted-foreground">
                                    Try adjusting your filters or search term
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className={viewMode === 'grid' 
                            ? "grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                            : "space-y-3"
                        }>
                            {filteredTemplates.map(template => (
                                <TemplateCard key={template.id} template={template} />
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* ═══════════════════════════════════════════════════════════════ */}
                {/* HISTORY TAB */}
                {/* ═══════════════════════════════════════════════════════════════ */}
                <TabsContent value="history" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <Archive className="h-5 w-5" />
                                    Generated Reports History
                                </span>
                                <Badge variant="outline">{instances.length} reports</Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {instances.length === 0 ? (
                                    <div className="text-center py-12 text-muted-foreground">
                                        <Archive className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p>No reports in history</p>
                                    </div>
                                ) : (
                                    instances.map(instance => (
                                        <InstanceRow key={instance.id} instance={instance} />
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ═══════════════════════════════════════════════════════════════ */}
                {/* SCHEDULED TAB */}
                {/* ═══════════════════════════════════════════════════════════════ */}
                <TabsContent value="scheduled" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <Calendar className="h-5 w-5" />
                                    Scheduled Reports
                                </span>
                                <Badge variant="outline">{scheduled.length} schedules</Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {scheduled.length === 0 ? (
                                    <div className="text-center py-12 text-muted-foreground">
                                        <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p>No scheduled reports</p>
                                        <p className="text-sm">Schedule a report from the templates tab</p>
                                    </div>
                                ) : (
                                    scheduled.map(schedule => (
                                        <motion.div
                                            key={schedule.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="flex items-center justify-between p-4 bg-white rounded-lg border hover:shadow-md"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`p-2 rounded ${schedule.is_active ? 'bg-green-100' : 'bg-gray-100'}`}>
                                                    <Calendar className={`h-5 w-5 ${schedule.is_active ? 'text-green-600' : 'text-gray-600'}`} />
                                                </div>
                                                <div>
                                                    <h4 className="font-medium">{schedule.schedule_name}</h4>
                                                    <p className="text-sm text-muted-foreground">
                                                        {schedule.frequency} at {schedule.run_time} • 
                                                        Next: {formatDateTime(schedule.next_run_at)}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Badge variant={schedule.is_active ? 'default' : 'secondary'}>
                                                    {schedule.is_active ? 'Active' : 'Paused'}
                                                </Badge>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => toggleScheduledReport(schedule)}
                                                >
                                                    {schedule.is_active ? (
                                                        <Pause className="h-4 w-4" />
                                                    ) : (
                                                        <Play className="h-4 w-4" />
                                                    )}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-red-600"
                                                    onClick={() => deleteScheduledReport(schedule.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ═══════════════════════════════════════════════════════════════ */}
                {/* FAVORITES TAB */}
                {/* ═══════════════════════════════════════════════════════════════ */}
                <TabsContent value="favorites" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <Star className="h-5 w-5 text-yellow-500" />
                                    Favorite Reports
                                </span>
                                <Badge variant="outline">{favorites.length} favorites</Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {favorites.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>No favorite reports yet</p>
                                    <p className="text-sm">Star templates to add them here</p>
                                </div>
                            ) : (
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {favorites.map(fav => {
                                        const template = templates.find(t => t.id === fav.template_id);
                                        if (!template) return null;
                                        return <TemplateCard key={fav.id} template={template} />;
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* GENERATE REPORT DIALOG */}
            {/* ═══════════════════════════════════════════════════════════════════ */}
            <Dialog open={generateDialog.open} onOpenChange={(open) => setGenerateDialog({ open, template: open ? generateDialog.template : null })}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Play className="h-5 w-5 text-primary" />
                            Generate Report
                        </DialogTitle>
                        <DialogDescription>
                            {generateDialog.template?.template_name}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Output Format */}
                        <div className="space-y-2">
                            <Label>Output Format</Label>
                            <Select
                                value={generateParams.output_format || 'pdf'}
                                onValueChange={(v) => setGenerateParams(prev => ({ ...prev, output_format: v }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pdf">PDF Document</SelectItem>
                                    <SelectItem value="excel">Excel Spreadsheet</SelectItem>
                                    <SelectItem value="csv">CSV File</SelectItem>
                                    <SelectItem value="html">HTML Preview</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Dynamic filters based on template */}
                        {generateDialog.template?.filters_config?.map(filter => (
                            <div key={filter.key} className="space-y-2">
                                <Label>{filter.label}</Label>
                                {filter.type === 'select' ? (
                                    <Select
                                        value={generateParams[filter.key] || ''}
                                        onValueChange={(v) => setGenerateParams(prev => ({ ...prev, [filter.key]: v }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder={`Select ${filter.label}`} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {filter.options?.map(opt => (
                                                <SelectItem key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                ) : filter.type === 'date' ? (
                                    <Input
                                        type="date"
                                        value={generateParams[filter.key] || ''}
                                        onChange={(e) => setGenerateParams(prev => ({ ...prev, [filter.key]: e.target.value }))}
                                    />
                                ) : (
                                    <Input
                                        placeholder={`Enter ${filter.label}`}
                                        value={generateParams[filter.key] || ''}
                                        onChange={(e) => setGenerateParams(prev => ({ ...prev, [filter.key]: e.target.value }))}
                                    />
                                )}
                            </div>
                        ))}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setGenerateDialog({ open: false, template: null })}>
                            Cancel
                        </Button>
                        <Button onClick={handleGenerateReport} disabled={generating}>
                            {generating ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Play className="h-4 w-4 mr-2" />
                                    Generate
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* SCHEDULE REPORT DIALOG */}
            {/* ═══════════════════════════════════════════════════════════════════ */}
            <Dialog open={scheduleDialog.open} onOpenChange={(open) => setScheduleDialog({ open, template: open ? scheduleDialog.template : null })}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-primary" />
                            Schedule Report
                        </DialogTitle>
                        <DialogDescription>
                            Setup automatic generation for: {scheduleDialog.template?.template_name}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Schedule Name</Label>
                            <Input
                                placeholder="e.g., Weekly Student Report"
                                value={scheduleForm.schedule_name}
                                onChange={(e) => setScheduleForm(prev => ({ ...prev, schedule_name: e.target.value }))}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Frequency</Label>
                                <Select
                                    value={scheduleForm.frequency}
                                    onValueChange={(v) => setScheduleForm(prev => ({ ...prev, frequency: v }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="daily">Daily</SelectItem>
                                        <SelectItem value="weekly">Weekly</SelectItem>
                                        <SelectItem value="monthly">Monthly</SelectItem>
                                        <SelectItem value="quarterly">Quarterly</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Run Time</Label>
                                <Input
                                    type="time"
                                    value={scheduleForm.run_time}
                                    onChange={(e) => setScheduleForm(prev => ({ ...prev, run_time: e.target.value }))}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Output Format</Label>
                            <Select
                                value={scheduleForm.output_format}
                                onValueChange={(v) => setScheduleForm(prev => ({ ...prev, output_format: v }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pdf">PDF Document</SelectItem>
                                    <SelectItem value="excel">Excel Spreadsheet</SelectItem>
                                    <SelectItem value="csv">CSV File</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Email Recipients (comma-separated)</Label>
                            <Textarea
                                placeholder="admin@school.com, principal@school.com"
                                value={scheduleForm.email_recipients}
                                onChange={(e) => setScheduleForm(prev => ({ ...prev, email_recipients: e.target.value }))}
                                rows={2}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setScheduleDialog({ open: false, template: null })}>
                            Cancel
                        </Button>
                        <Button onClick={handleScheduleReport} disabled={!scheduleForm.schedule_name}>
                            <Calendar className="h-4 w-4 mr-2" />
                            Create Schedule
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* PREVIEW DIALOG */}
            {/* ═══════════════════════════════════════════════════════════════════ */}
            <Dialog open={previewDialog.open} onOpenChange={(open) => setPreviewDialog({ open, instance: open ? previewDialog.instance : null })}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Eye className="h-5 w-5 text-primary" />
                            Report Preview
                        </DialogTitle>
                        <DialogDescription>
                            {previewDialog.instance?.report_name} • {previewDialog.instance?.total_records || 0} records
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        {previewDialog.instance?.report_data?.length > 0 ? (
                            <div className="border rounded-lg overflow-auto max-h-96">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 sticky top-0">
                                        <tr>
                                            {Object.keys(previewDialog.instance.report_data[0] || {}).map(key => (
                                                <th key={key} className="px-4 py-2 text-left font-medium border-b">
                                                    {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {previewDialog.instance.report_data.slice(0, 50).map((row, i) => (
                                            <tr key={i} className="hover:bg-gray-50">
                                                {Object.values(row).map((val, j) => (
                                                    <td key={j} className="px-4 py-2 border-b">
                                                        {typeof val === 'object' ? JSON.stringify(val) : String(val ?? '')}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>No data to preview</p>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPreviewDialog({ open: false, instance: null })}>
                            Close
                        </Button>
                        <Button>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
