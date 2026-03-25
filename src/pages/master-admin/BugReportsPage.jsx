import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { errorLoggerService } from '@/services/errorLoggerService';
import { 
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { 
    Card, CardContent, CardHeader, CardTitle, CardDescription 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { 
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription 
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import { 
    Bug, AlertTriangle, CheckCircle, Clock, Search,
    RefreshCw, Eye, User, Monitor, MapPin, 
    AlertCircle, XCircle, Info, Image, FileText,
    ChevronLeft, ChevronRight, Filter, Mail, Globe,
    Smartphone, Target, ListOrdered, MessageSquare,
    Calendar, ZoomIn, ExternalLink, Copy, Terminal, Database,
    Wand2
} from 'lucide-react';
import { formatDateTime } from '@/utils/dateUtils';

// ==================== MAIN COMPONENT ====================
const BugReportsPage = () => {
    const { toast } = useToast();
    
    // State
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ 
        status: 'All', 
        severity: 'All', 
        search: '' 
    });
    const [stats, setStats] = useState({ 
        total: 0, 
        critical: 0, 
        pending: 0, 
        resolved: 0 
    });
    const [selectedReport, setSelectedReport] = useState(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    // ==================== FETCH USER BUG REPORTS ====================
    const fetchReports = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch user reports from backend with source filter and high limit
            const response = await errorLoggerService.getErrors({ 
                source: 'user_report', 
                limit: 500 
            });
            const allData = response?.data || response || [];
            
            // Additional client-side filter as safety net
            const userReports = (Array.isArray(allData) ? allData : []).filter(e => 
                e.source === 'user_report' || 
                e.error_message?.startsWith('[USER REPORT]') ||
                e.metadata?.isUserReport === true
            );
            
            // Apply local filters
            let filtered = userReports;
            
            if (filters.status !== 'All') {
                filtered = filtered.filter(r => r.status === filters.status);
            }
            if (filters.severity !== 'All') {
                // Check both metadata.priority and severity field
                filtered = filtered.filter(r => 
                    r.metadata?.priority === filters.severity || 
                    r.severity === filters.severity ||
                    // Map severity to priority levels
                    (filters.severity === 'high' && r.severity === 'error') ||
                    (filters.severity === 'medium' && r.severity === 'warning') ||
                    (filters.severity === 'low' && r.severity === 'info')
                );
            }
            if (filters.search) {
                const searchLower = filters.search.toLowerCase();
                filtered = filtered.filter(r => 
                    r.error_message?.toLowerCase().includes(searchLower) ||
                    r.metadata?.title?.toLowerCase().includes(searchLower) ||
                    r.metadata?.description?.toLowerCase().includes(searchLower) ||
                    r.metadata?.reporter_name?.toLowerCase().includes(searchLower) ||
                    r.metadata?.reporter_email?.toLowerCase().includes(searchLower) ||
                    r.page_url?.toLowerCase().includes(searchLower) ||
                    r.user_role?.toLowerCase().includes(searchLower)
                );
            }
            
            // Sort by newest first
            filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            
            setReports(filtered);
            calculateStats(filtered);
            
        } catch (err) {
            console.error('Failed to fetch bug reports', err);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to load bug reports' });
        } finally {
            setLoading(false);
        }
    }, [filters]);

    // ==================== STATS CALCULATION ====================
    const calculateStats = (data) => {
        setStats({
            total: data.length,
            critical: data.filter(e => e.severity === 'critical' && e.status !== 'fixed').length,
            pending: data.filter(e => e.status !== 'fixed' && e.status !== 'ignored').length,
            resolved: data.filter(e => e.status === 'fixed').length
        });
    };

    // ==================== INITIALIZE ====================
    useEffect(() => {
        fetchReports();
        // Auto-refresh every 2 minutes
        const interval = setInterval(fetchReports, 120000);
        return () => clearInterval(interval);
    }, []);

    // Re-fetch when filters change
    useEffect(() => {
        fetchReports();
        setCurrentPage(1);
    }, [filters.status, filters.severity, filters.search]);

    // ==================== HANDLERS ====================
    const handleStatusChange = async (id, newStatus) => {
        try {
            await errorLoggerService.updateStatus(id, newStatus);
            toast({ title: '✅ Status Updated', description: `Report marked as ${newStatus}` });
            fetchReports();
        } catch (err) {
            toast({ variant: 'destructive', title: 'Update Failed' });
        }
    };

    const viewDetails = (report) => {
        setSelectedReport(report);
        setIsDetailOpen(true);
    };

    // ==================== PAGINATION ====================
    const totalPages = Math.ceil(reports.length / pageSize);
    const paginatedReports = reports.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    // ==================== SEVERITY BADGE ====================
    const getSeverityBadge = (severity) => {
        const styles = {
            critical: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
            error: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
            warning: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
            info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
        };
        const icons = {
            critical: <AlertCircle className="h-3 w-3 mr-1" />,
            error: <XCircle className="h-3 w-3 mr-1" />,
            warning: <AlertTriangle className="h-3 w-3 mr-1" />,
            info: <Info className="h-3 w-3 mr-1" />
        };
        return (
            <Badge className={`${styles[severity] || styles.info} flex items-center text-xs`}>
                {icons[severity] || icons.info}{severity}
            </Badge>
        );
    };

    // ==================== STATUS BADGE ====================
    const getStatusBadge = (status) => {
        const styles = {
            open: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
            in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
            fixed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
            ignored: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
        };
        return (
            <Badge className={`${styles[status] || styles.open} text-xs`}>
                {status?.replace('_', ' ').toUpperCase()}
            </Badge>
        );
    };

    // ==================== CATEGORY LABEL ====================
    const getCategoryLabel = (category) => {
        const labels = {
            'ui_bug': 'UI/Visual Bug',
            'functional_bug': 'Functional Bug',
            'data_issue': 'Data Issue',
            'performance': 'Performance Issue',
            'crash': 'Crash/Error',
            'security': 'Security Concern',
            'accessibility': 'Accessibility',
            'suggestion': 'Feature Suggestion',
            'other': 'Other'
        };
        return labels[category] || category || 'General';
    };

    // ==================== PRIORITY BADGE ====================
    const getPriorityBadge = (priority) => {
        const styles = {
            critical: 'bg-red-500 text-white',
            high: 'bg-orange-500 text-white',
            medium: 'bg-yellow-500 text-white',
            low: 'bg-blue-500 text-white',
            error: 'bg-orange-500 text-white',
            warning: 'bg-yellow-500 text-white',
            info: 'bg-blue-500 text-white'
        };
        const labels = {
            critical: 'Critical',
            high: 'High',
            medium: 'Medium',
            low: 'Low',
            error: 'High',
            warning: 'Medium',
            info: 'Low'
        };
        return (
            <Badge className={`${styles[priority] || styles.medium} text-xs`}>
                {labels[priority] || priority}
            </Badge>
        );
    };

    // ==================== EXTRACT USER REPORT MESSAGE ====================
    const extractMessage = (report) => {
        let msg = report.error_message || '';
        // Remove [USER REPORT] prefix for cleaner display
        if (msg.startsWith('[USER REPORT]')) {
            msg = msg.replace('[USER REPORT]', '').trim();
        }
        // Try to extract description from metadata
        if (report.metadata?.description) {
            return report.metadata.description;
        }
        return msg || 'No description provided';
    };

    // ==================== RENDER ====================
    return (
        <DashboardLayout>
            <div className="p-4 md:p-8 space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
                            <Bug className="h-7 w-7 text-pink-500" />
                            User Bug Reports
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            View and manage bug reports submitted by users
                        </p>
                    </div>
                    <Button onClick={fetchReports} variant="outline" disabled={loading}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                                <FileText className="h-4 w-4" /> Total Reports
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">{stats.total}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 text-red-500" /> Critical
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold text-red-500">{stats.critical}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                                <Clock className="h-4 w-4 text-yellow-500" /> Pending
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold text-yellow-500">{stats.pending}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500" /> Resolved
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold text-green-500">{stats.resolved}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <Filter className="h-4 w-4" /> Filters
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search by title, description, reporter name, email..."
                                        value={filters.search}
                                        onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
                                        className="pl-9"
                                    />
                                </div>
                            </div>
                            <Select 
                                value={filters.status} 
                                onValueChange={(v) => setFilters(f => ({ ...f, status: v }))}
                            >
                                <SelectTrigger className="w-full md:w-[150px]">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="All">All Status</SelectItem>
                                    <SelectItem value="open">Open</SelectItem>
                                    <SelectItem value="in_progress">In Progress</SelectItem>
                                    <SelectItem value="fixed">Fixed</SelectItem>
                                    <SelectItem value="ignored">Ignored</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select 
                                value={filters.severity} 
                                onValueChange={(v) => setFilters(f => ({ ...f, severity: v }))}
                            >
                                <SelectTrigger className="w-full md:w-[150px]">
                                    <SelectValue placeholder="Priority" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="All">All Priority</SelectItem>
                                    <SelectItem value="critical">Critical</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="low">Low</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Reports Table */}
                <Card>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex items-center justify-center p-12">
                                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : reports.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-12 text-center">
                                <Bug className="h-12 w-12 text-muted-foreground/50 mb-4" />
                                <h3 className="text-lg font-semibold">No Bug Reports</h3>
                                <p className="text-muted-foreground text-sm mt-1">
                                    No user-submitted bug reports found
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[50px]">#</TableHead>
                                                <TableHead>Bug Title</TableHead>
                                                <TableHead className="hidden md:table-cell">Category</TableHead>
                                                <TableHead>Priority</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="hidden lg:table-cell">Reported By</TableHead>
                                                <TableHead className="hidden xl:table-cell">Date</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {paginatedReports.map((report, index) => (
                                                <TableRow key={report.id}>
                                                    <TableCell className="font-mono text-xs text-muted-foreground">
                                                        {(currentPage - 1) * pageSize + index + 1}
                                                    </TableCell>
                                                    <TableCell className="max-w-[200px] md:max-w-[300px]">
                                                        <div className="flex items-start gap-2">
                                                            <div className="flex-1 min-w-0">
                                                                <p className="truncate text-sm font-medium">
                                                                    {report.metadata?.title || extractMessage(report)}
                                                                </p>
                                                                <p className="text-xs text-muted-foreground truncate">
                                                                    {report.page_url?.replace(window.location.origin, '')}
                                                                </p>
                                                            </div>
                                                            {report.metadata?.screenshot_data && (
                                                                <Badge variant="outline" className="text-xs shrink-0 bg-green-50 dark:bg-green-900/20 text-green-600">
                                                                    <Image className="h-3 w-3" />
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="hidden md:table-cell">
                                                        <Badge variant="outline" className="text-xs">
                                                            {getCategoryLabel(report.metadata?.category) || report.module_name || 'General'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        {getPriorityBadge(report.metadata?.priority || report.severity)}
                                                    </TableCell>
                                                    <TableCell>
                                                        {getStatusBadge(report.status)}
                                                    </TableCell>
                                                    <TableCell className="hidden lg:table-cell">
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-medium">{report.metadata?.reporter_name || 'Unknown'}</span>
                                                            <span className="text-xs text-muted-foreground capitalize">{report.metadata?.reporter_role || report.user_role || ''}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="hidden xl:table-cell text-xs text-muted-foreground">
                                                        {formatDateTime(report.created_at)}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => viewDetails(report)}
                                                            >
                                                                <Eye className="h-3 w-3 mr-1" />
                                                                View
                                                            </Button>
                                                            <Select
                                                                value={report.status}
                                                                onValueChange={(v) => handleStatusChange(report.id, v)}
                                                            >
                                                                <SelectTrigger className="w-[100px] h-8 text-xs">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="open">Open</SelectItem>
                                                                    <SelectItem value="in_progress">In Progress</SelectItem>
                                                                    <SelectItem value="fixed">Fixed</SelectItem>
                                                                    <SelectItem value="ignored">Ignored</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-between px-4 py-3 border-t">
                                        <p className="text-sm text-muted-foreground">
                                            Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, reports.length)} of {reports.length}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={currentPage === 1}
                                                onClick={() => setCurrentPage(p => p - 1)}
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                            </Button>
                                            <span className="text-sm">
                                                Page {currentPage} of {totalPages}
                                            </span>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={currentPage === totalPages}
                                                onClick={() => setCurrentPage(p => p + 1)}
                                            >
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Detail Dialog - Full Information */}
                <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                    <DialogContent className="max-w-4xl max-h-[95vh] p-0 overflow-hidden">
                        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-muted/30">
                            <div className="flex items-start justify-between">
                                <div>
                                    <DialogTitle className="flex items-center gap-2 text-xl">
                                        <Bug className="h-6 w-6 text-pink-500" />
                                        Bug Report Details
                                    </DialogTitle>
                                    <DialogDescription className="mt-1">
                                        Report ID: <code className="bg-muted px-2 py-0.5 rounded text-xs">{selectedReport?.id}</code>
                                    </DialogDescription>
                                </div>
                                {selectedReport && (
                                    <div className="flex items-center gap-2">
                                        {getSeverityBadge(selectedReport.severity)}
                                        {getStatusBadge(selectedReport.status)}
                                    </div>
                                )}
                            </div>
                        </DialogHeader>

                        {selectedReport && (
                            <Tabs defaultValue="details" className="flex flex-col h-[calc(95vh-180px)]">
                                <TabsList className="mx-6 mt-4 grid grid-cols-4 w-fit">
                                    <TabsTrigger value="details" className="text-xs">
                                        <FileText className="h-3 w-3 mr-1" /> Details
                                    </TabsTrigger>
                                    <TabsTrigger value="reporter" className="text-xs">
                                        <User className="h-3 w-3 mr-1" /> Reporter
                                    </TabsTrigger>
                                    <TabsTrigger value="technical" className="text-xs">
                                        <Monitor className="h-3 w-3 mr-1" /> Technical
                                    </TabsTrigger>
                                    <TabsTrigger value="screenshot" className="text-xs">
                                        <Image className="h-3 w-3 mr-1" /> Screenshot
                                    </TabsTrigger>
                                </TabsList>

                                <ScrollArea className="flex-1 px-6 pb-6">
                                    {/* Tab 1: Bug Details */}
                                    <TabsContent value="details" className="space-y-4 mt-4">
                                        {/* Category & Priority */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-xs font-medium text-muted-foreground uppercase">Category</label>
                                                <div>
                                                    <Badge variant="outline" className="text-sm">
                                                        {getCategoryLabel(selectedReport.metadata?.category) || 'General'}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-medium text-muted-foreground uppercase">Priority</label>
                                                <div>
                                                    {getPriorityBadge(selectedReport.metadata?.priority || selectedReport.severity)}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Bug Title */}
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-muted-foreground uppercase">Bug Title</label>
                                            <p className="text-base font-semibold">
                                                {selectedReport.metadata?.title || extractMessage(selectedReport)}
                                            </p>
                                        </div>

                                        {/* Description */}
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-muted-foreground uppercase">Description</label>
                                            <div className="bg-muted/50 p-4 rounded-lg border">
                                                <p className="text-sm whitespace-pre-wrap">
                                                    {selectedReport.metadata?.description || extractMessage(selectedReport)}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Steps to Reproduce */}
                                        {selectedReport.metadata?.steps_to_reproduce && (
                                            <div className="space-y-1">
                                                <label className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1">
                                                    <ListOrdered className="h-3 w-3" /> Steps to Reproduce
                                                </label>
                                                <div className="bg-muted/50 p-4 rounded-lg border">
                                                    <p className="text-sm whitespace-pre-wrap">
                                                        {selectedReport.metadata.steps_to_reproduce}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Expected vs Actual Behavior */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {selectedReport.metadata?.expected_behavior && (
                                                <div className="space-y-1">
                                                    <label className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1">
                                                        <Target className="h-3 w-3 text-green-500" /> Expected Behavior
                                                    </label>
                                                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                                                        <p className="text-sm whitespace-pre-wrap">
                                                            {selectedReport.metadata.expected_behavior}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                            {selectedReport.metadata?.actual_behavior && (
                                                <div className="space-y-1">
                                                    <label className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1">
                                                        <AlertTriangle className="h-3 w-3 text-red-500" /> Actual Behavior
                                                    </label>
                                                    <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                                                        <p className="text-sm whitespace-pre-wrap">
                                                            {selectedReport.metadata.actual_behavior}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Timestamps */}
                                        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                                            <div className="space-y-1">
                                                <label className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" /> Reported At
                                                </label>
                                                <p className="text-sm">{formatDateTime(selectedReport.created_at)}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1">
                                                    <Clock className="h-3 w-3" /> Last Updated
                                                </label>
                                                <p className="text-sm">{formatDateTime(selectedReport.updated_at)}</p>
                                            </div>
                                        </div>
                                    </TabsContent>

                                    {/* Tab 2: Reporter Information */}
                                    <TabsContent value="reporter" className="space-y-4 mt-4">
                                        <Card>
                                            <CardHeader className="pb-3">
                                                <CardTitle className="text-sm flex items-center gap-2">
                                                    <User className="h-4 w-4 text-blue-500" />
                                                    Reporter Information
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-1">
                                                        <label className="text-xs font-medium text-muted-foreground uppercase">Name</label>
                                                        <p className="text-sm font-medium">
                                                            {selectedReport.metadata?.reporter_name || 'Unknown'}
                                                        </p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1">
                                                            <Mail className="h-3 w-3" /> Email
                                                        </label>
                                                        <p className="text-sm">
                                                            {selectedReport.metadata?.reporter_email || 'Not provided'}
                                                        </p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-xs font-medium text-muted-foreground uppercase">Role</label>
                                                        <Badge variant="outline" className="capitalize">
                                                            {selectedReport.metadata?.reporter_role || selectedReport.user_role || 'Unknown'}
                                                        </Badge>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-xs font-medium text-muted-foreground uppercase">User ID</label>
                                                        <code className="text-xs bg-muted px-2 py-1 rounded">
                                                            {selectedReport.user_id || 'N/A'}
                                                        </code>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        <Card>
                                            <CardHeader className="pb-3">
                                                <CardTitle className="text-sm flex items-center gap-2">
                                                    <Globe className="h-4 w-4 text-purple-500" />
                                                    Page Information
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <div className="space-y-1">
                                                    <label className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1">
                                                        <MapPin className="h-3 w-3" /> Page URL
                                                    </label>
                                                    <div className="flex items-center gap-2">
                                                        <code className="text-xs bg-muted px-2 py-1 rounded flex-1 overflow-auto">
                                                            {selectedReport.page_url}
                                                        </code>
                                                        <Button 
                                                            size="sm" 
                                                            variant="outline"
                                                            onClick={() => window.open(selectedReport.page_url, '_blank')}
                                                        >
                                                            <ExternalLink className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs font-medium text-muted-foreground uppercase">Module</label>
                                                    <Badge variant="secondary">
                                                        {selectedReport.metadata?.module_name || selectedReport.module_name || 'Unknown'}
                                                    </Badge>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </TabsContent>

                                    {/* Tab 3: Technical Information */}
                                    <TabsContent value="technical" className="space-y-4 mt-4">
                                        <Card>
                                            <CardHeader className="pb-3">
                                                <CardTitle className="text-sm flex items-center gap-2">
                                                    <Monitor className="h-4 w-4 text-orange-500" />
                                                    Device Information
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                {(selectedReport.device_info || selectedReport.metadata?.device) ? (
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-1">
                                                            <label className="text-xs font-medium text-muted-foreground uppercase">Browser</label>
                                                            <p className="text-sm">
                                                                {selectedReport.metadata?.device?.browser || 'Unknown'}
                                                            </p>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-xs font-medium text-muted-foreground uppercase">Operating System</label>
                                                            <p className="text-sm">
                                                                {selectedReport.metadata?.device?.os || 'Unknown'}
                                                            </p>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-xs font-medium text-muted-foreground uppercase">Screen Size</label>
                                                            <p className="text-sm">
                                                                {selectedReport.metadata?.device?.screenSize || 'Unknown'}
                                                            </p>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-xs font-medium text-muted-foreground uppercase">Device Type</label>
                                                            <Badge variant="outline">
                                                                {selectedReport.metadata?.device?.isMobile ? (
                                                                    <><Smartphone className="h-3 w-3 mr-1" /> Mobile</>
                                                                ) : (
                                                                    <><Monitor className="h-3 w-3 mr-1" /> Desktop</>
                                                                )}
                                                            </Badge>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-xs font-medium text-muted-foreground uppercase">Language</label>
                                                            <p className="text-sm">
                                                                {selectedReport.metadata?.device?.language || selectedReport.device_info?.language || 'Unknown'}
                                                            </p>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-xs font-medium text-muted-foreground uppercase">Platform</label>
                                                            <p className="text-sm">
                                                                {selectedReport.metadata?.device?.platform || selectedReport.device_info?.platform || 'Unknown'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-muted-foreground">No device information available</p>
                                                )}
                                                
                                                {(selectedReport.device_info?.userAgent || selectedReport.metadata?.device?.userAgent) && (
                                                    <div className="mt-4 space-y-1">
                                                        <label className="text-xs font-medium text-muted-foreground uppercase">User Agent</label>
                                                        <code className="text-xs bg-muted p-2 rounded block overflow-auto max-h-20">
                                                            {selectedReport.device_info?.userAgent || selectedReport.metadata?.device?.userAgent}
                                                        </code>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>

                                        {/* Stack Trace if available */}
                                        {selectedReport.stack_trace && (
                                            <Card>
                                                <CardHeader className="pb-3">
                                                    <CardTitle className="text-sm flex items-center gap-2">
                                                        <FileText className="h-4 w-4 text-red-500" />
                                                        Stack Trace / Technical Details
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-48 whitespace-pre-wrap font-mono">
                                                        {selectedReport.stack_trace}
                                                    </pre>
                                                </CardContent>
                                            </Card>
                                        )}

                                        {/* Console Logs if available */}
                                        {selectedReport.metadata?.console_logs && selectedReport.metadata.console_logs.length > 0 && (
                                            <Card>
                                                <CardHeader className="pb-3">
                                                    <div className="flex items-center justify-between">
                                                        <CardTitle className="text-sm flex items-center gap-2">
                                                            <Terminal className="h-4 w-4 text-yellow-500" />
                                                            Console Logs ({selectedReport.metadata.console_logs.length} entries)
                                                        </CardTitle>
                                                        <Button 
                                                            size="sm" 
                                                            variant="outline"
                                                            onClick={() => {
                                                                const logsText = selectedReport.metadata.console_logs.map(log => 
                                                                    `[${log.type}] ${log.timestamp || ''} - ${log.message}`
                                                                ).join('\n');
                                                                navigator.clipboard.writeText(logsText);
                                                                toast({ title: 'Copied!', description: 'Console logs copied to clipboard' });
                                                            }}
                                                        >
                                                            <Copy className="h-3 w-3 mr-1" /> Copy Logs
                                                        </Button>
                                                    </div>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="bg-gray-900 dark:bg-black p-3 rounded-lg overflow-auto max-h-64 font-mono text-xs">
                                                        {selectedReport.metadata.console_logs.map((log, index) => (
                                                            <div 
                                                                key={index} 
                                                                className={`py-1 border-b border-gray-800 last:border-0 ${
                                                                    log.type === 'error' ? 'text-red-400' :
                                                                    log.type === 'warning' ? 'text-yellow-400' :
                                                                    log.type === 'resource_error' ? 'text-orange-400' :
                                                                    log.type === 'memory_info' ? 'text-blue-400' :
                                                                    log.type === 'timing_info' ? 'text-green-400' :
                                                                    'text-gray-300'
                                                                }`}
                                                            >
                                                                <span className="text-gray-500">[{log.type}]</span>{' '}
                                                                {log.timestamp && <span className="text-gray-600">{log.timestamp.split('T')[1]?.split('.')[0] || ''}</span>}{' '}
                                                                <span>{log.message}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        )}

                                        {/* Full Raw Data - For Developer Copy */}
                                        <Card>
                                            <CardHeader className="pb-3">
                                                <div className="flex items-center justify-between">
                                                    <CardTitle className="text-sm flex items-center gap-2">
                                                        <Database className="h-4 w-4 text-purple-500" />
                                                        Full Raw Data (F12 Console Copy)
                                                    </CardTitle>
                                                    <Button 
                                                        size="sm" 
                                                        variant="default"
                                                        className="bg-purple-600 hover:bg-purple-700"
                                                        onClick={() => {
                                                            // Create clean copy without screenshot data (too large)
                                                            const cleanReport = {
                                                                ...selectedReport,
                                                                metadata: {
                                                                    ...selectedReport.metadata,
                                                                    screenshot_data: selectedReport.metadata?.screenshot_data ? '[BASE64_IMAGE_DATA_EXCLUDED]' : null
                                                                }
                                                            };
                                                            const jsonText = JSON.stringify(cleanReport, null, 2);
                                                            navigator.clipboard.writeText(jsonText);
                                                            toast({ 
                                                                title: 'Copied!', 
                                                                description: 'Full bug report data copied to clipboard (ready for F12 paste)' 
                                                            });
                                                        }}
                                                    >
                                                        <Copy className="h-3 w-3 mr-1" /> Copy All Data
                                                    </Button>
                                                </div>
                                                <CardDescription className="text-xs">
                                                    Complete bug report data in JSON format - Copy and paste in F12 console for debugging
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <pre className="text-xs bg-gray-900 dark:bg-black text-green-400 p-3 rounded-lg overflow-auto max-h-72 whitespace-pre-wrap font-mono">
                                                    {JSON.stringify({
                                                        id: selectedReport.id,
                                                        status: selectedReport.status,
                                                        severity: selectedReport.severity,
                                                        source: selectedReport.source,
                                                        module_name: selectedReport.module_name,
                                                        page_url: selectedReport.page_url,
                                                        error_message: selectedReport.error_message,
                                                        stack_trace: selectedReport.stack_trace,
                                                        user_id: selectedReport.user_id,
                                                        user_role: selectedReport.user_role,
                                                        created_at: selectedReport.created_at,
                                                        updated_at: selectedReport.updated_at,
                                                        device_info: selectedReport.device_info,
                                                        metadata: {
                                                            ...selectedReport.metadata,
                                                            screenshot_data: selectedReport.metadata?.screenshot_data ? '[BASE64_IMAGE - See Screenshot Tab]' : null,
                                                            console_logs: selectedReport.metadata?.console_logs || []
                                                        }
                                                    }, null, 2)}
                                                </pre>
                                            </CardContent>
                                        </Card>
                                    </TabsContent>

                                    {/* Tab 4: Screenshot */}
                                    <TabsContent value="screenshot" className="space-y-4 mt-4">
                                        {selectedReport.metadata?.screenshot_data ? (
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                                        <CheckCircle className="h-3 w-3 mr-1" />
                                                        Screenshot Attached
                                                    </Badge>
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm"
                                                        onClick={() => {
                                                            const link = document.createElement('a');
                                                            link.href = selectedReport.metadata.screenshot_data;
                                                            link.download = `bug-report-${selectedReport.id}-screenshot.png`;
                                                            link.click();
                                                        }}
                                                    >
                                                        <Image className="h-3 w-3 mr-1" /> Download
                                                    </Button>
                                                </div>
                                                <div className="border rounded-lg overflow-hidden bg-muted/30">
                                                    <img 
                                                        src={selectedReport.metadata.screenshot_data} 
                                                        alt="Bug Screenshot" 
                                                        className="w-full h-auto max-h-[500px] object-contain cursor-zoom-in"
                                                        onClick={() => window.open(selectedReport.metadata.screenshot_data, '_blank')}
                                                    />
                                                </div>
                                                <p className="text-xs text-muted-foreground text-center">
                                                    Click on the image to view in full size
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                                                    <Image className="h-8 w-8 text-muted-foreground" />
                                                </div>
                                                <h3 className="text-lg font-semibold">No Screenshot</h3>
                                                <p className="text-muted-foreground text-sm mt-1">
                                                    The reporter did not attach a screenshot
                                                </p>
                                            </div>
                                        )}
                                    </TabsContent>
                                </ScrollArea>

                                {/* Action Footer */}
                                <div className="flex justify-between items-center px-6 py-4 border-t bg-muted/30">
                                    <div className="flex items-center gap-2">
                                        <div className="text-xs text-muted-foreground">
                                            Report #{selectedReport.id?.slice(0, 8)}...
                                        </div>
                                        <Button
                                            size="sm"
                                            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                                            onClick={() => {
                                                const meta = selectedReport.metadata || {};
                                                const consoleLogs = meta.console_logs || meta.last_errors || [];
                                                const device = selectedReport.device_info || meta.device || {};

                                                const consoleSection = consoleLogs.length > 0
                                                    ? `### 📋 Console Logs (F12 - ${consoleLogs.length} entries)\n\`\`\`\n${consoleLogs.map(log => `[${log.type}] ${log.timestamp || ''} ${log.message}`).join('\n')}\n\`\`\`\n`
                                                    : '### 📋 Console Logs\nNo console logs captured.\n';

                                                const deviceSection = device.browser
                                                    ? `### 🖥️ Device Info\n- Browser: ${device.browser}\n- OS: ${device.os}\n- Screen: ${device.screenSize}\n- Language: ${device.language || 'N/A'}\n`
                                                    : '';

                                                const prompt = `You are an expert AI coding assistant working on the Jashchar ERP project (React + Node.js + Supabase).
A user has reported a bug. Please analyze all the information below and fix it.

### 🚨 Bug Report
**Title:** ${selectedReport.error_message?.replace('[USER REPORT] ', '')}
**Category:** ${meta.category || selectedReport.module_name || 'Unknown'}
**Priority:** ${meta.priority || selectedReport.severity || 'medium'}
**Page URL:** ${selectedReport.page_url}
**Reporter:** ${meta.reporter_name || 'Unknown'} (${meta.reporter_email || 'N/A'}) - Role: ${selectedReport.user_role || meta.reporter_role || 'N/A'}
**Reported At:** ${meta.reported_at || selectedReport.created_at}

### 📝 User Description
${meta.description || 'No description provided.'}

### 🔄 Steps to Reproduce
${meta.steps_to_reproduce || 'Not provided.'}

### ✅ Expected Behavior
${meta.expected_behavior || 'Not provided.'}

### ❌ Actual Behavior
${meta.actual_behavior || 'Not provided.'}

### 🛠️ Stack Trace
\`\`\`
${selectedReport.stack_trace || 'No stack trace available.'}
\`\`\`

${consoleSection}
${deviceSection}
### 🤖 Task Instructions
1. **Analyze**: Read the bug description, console logs, and stack trace carefully.
2. **Locate**: Find the exact file and code causing this issue.
3. **Console Logs**: Use the F12 console output above to trace the full error flow.
4. **Fix**: Provide the corrected code to fix this issue.
5. **Explain**: Briefly explain the root cause and how the fix resolves it.
`;
                                                navigator.clipboard.writeText(prompt);
                                                toast({
                                                    title: '🤖 AI Fix Prompt Copied!',
                                                    description: 'Paste this into GitHub Copilot or any AI assistant to get an instant fix.',
                                                    className: 'bg-purple-100 border-purple-500 text-purple-900'
                                                });
                                            }}
                                        >
                                            <Wand2 className="h-3 w-3 mr-1" /> Copy for AI Fix
                                        </Button>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Select
                                            value={selectedReport.status}
                                            onValueChange={(v) => {
                                                handleStatusChange(selectedReport.id, v);
                                                setSelectedReport(prev => ({ ...prev, status: v }));
                                            }}
                                        >
                                            <SelectTrigger className="w-[150px]">
                                                <SelectValue placeholder="Update Status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="open">Open</SelectItem>
                                                <SelectItem value="in_progress">In Progress</SelectItem>
                                                <SelectItem value="fixed">Fixed</SelectItem>
                                                <SelectItem value="ignored">Ignored</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
                                            Close
                                        </Button>
                                    </div>
                                </div>
                            </Tabs>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
};

export default BugReportsPage;
