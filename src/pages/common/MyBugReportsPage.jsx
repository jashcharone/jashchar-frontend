/**
 * MyBugReportsPage - User's Bug Report History
 * ═══════════════════════════════════════════════════════════════════════════════
 * Shows all bug reports submitted by the logged-in user with status updates
 * Accessible to ALL authenticated users (students, teachers, parents, staff)
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { errorLoggerService } from '@/services/errorLoggerService';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { 
    Card, CardContent, CardHeader, CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription 
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import { 
    Bug, CheckCircle, Clock, RefreshCw, Eye, 
    AlertCircle, AlertTriangle, Info, FileText,
    Image, Monitor, Calendar, Target, ListOrdered,
    XCircle, Loader2, History, Smartphone
} from 'lucide-react';
import { formatDateTime } from '@/utils/dateUtils';
import { cn } from '@/lib/utils';

const MyBugReportsPage = () => {
    const { toast } = useToast();
    const { user } = useAuth();
    
    // State
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [stats, setStats] = useState({ 
        total: 0, 
        pending: 0, 
        inProgress: 0,
        resolved: 0 
    });

    // ==================== FETCH USER'S BUG REPORTS ====================
    const fetchMyReports = useCallback(async () => {
        if (!user?.id) return;
        
        setLoading(true);
        try {
            // Use the new endpoint that fetches only user's own reports
            const myReports = await errorLoggerService.getMyReports();
            
            // Sort by newest first (backend already does this, but ensure)
            myReports.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            
            setReports(myReports);
            
            // Calculate stats
            setStats({
                total: myReports.length,
                pending: myReports.filter(r => r.status === 'open').length,
                inProgress: myReports.filter(r => r.status === 'in_progress').length,
                resolved: myReports.filter(r => r.status === 'fixed' || r.status === 'ignored').length
            });
            
        } catch (err) {
            console.error('Failed to fetch my bug reports', err);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to load your bug reports' });
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    // ==================== INITIALIZE ====================
    useEffect(() => {
        fetchMyReports();
        // Auto-refresh every 5 minutes
        const interval = setInterval(fetchMyReports, 300000);
        return () => clearInterval(interval);
    }, [fetchMyReports]);

    // ==================== VIEW DETAILS ====================
    const viewDetails = (report) => {
        setSelectedReport(report);
        setIsDetailOpen(true);
    };

    // ==================== STATUS HELPERS ====================
    const getStatusBadge = (status) => {
        const config = {
            open: { 
                label: 'Pending', 
                icon: Clock, 
                className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' 
            },
            in_progress: { 
                label: 'Being Fixed', 
                icon: Loader2, 
                className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' 
            },
            fixed: { 
                label: 'Fixed ✓', 
                icon: CheckCircle, 
                className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
            },
            ignored: { 
                label: 'Closed', 
                icon: XCircle, 
                className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' 
            }
        };
        const { label, icon: Icon, className } = config[status] || config.open;
        return (
            <Badge className={cn('flex items-center gap-1', className)}>
                <Icon className={cn('h-3 w-3', status === 'in_progress' && 'animate-spin')} />
                {label}
            </Badge>
        );
    };

    const getPriorityBadge = (priority) => {
        const styles = {
            critical: 'bg-red-500 text-white',
            high: 'bg-orange-500 text-white',
            medium: 'bg-yellow-500 text-white',
            low: 'bg-blue-500 text-white'
        };
        return (
            <Badge className={`${styles[priority] || styles.medium} text-xs`}>
                {priority || 'Medium'}
            </Badge>
        );
    };

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

    // ==================== RENDER ====================
    return (
        <DashboardLayout>
            <div className="p-4 md:p-8 space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
                            <History className="h-7 w-7 text-pink-500" />
                            My Bug Reports
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Track the status of bugs you've reported
                        </p>
                    </div>
                    <Button onClick={fetchMyReports} variant="outline" disabled={loading}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                                <FileText className="h-4 w-4" /> Total Submitted
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">{stats.total}</p>
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
                                <Loader2 className="h-4 w-4 text-blue-500" /> Being Fixed
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold text-blue-500">{stats.inProgress}</p>
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

                {/* Reports List */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Your Submitted Bug Reports</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center justify-center p-12">
                                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : reports.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-12 text-center">
                                <Bug className="h-12 w-12 text-muted-foreground/50 mb-4" />
                                <h3 className="text-lg font-semibold">No Bug Reports Yet</h3>
                                <p className="text-muted-foreground text-sm mt-1 max-w-md">
                                    You haven't submitted any bug reports. Use the pink 🐛 icon in the header to report issues.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {reports.map((report) => (
                                    <div 
                                        key={report.id}
                                        className={cn(
                                            "border rounded-lg p-4 transition-all hover:shadow-md cursor-pointer",
                                            report.status === 'fixed' && "border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-900/10",
                                            report.status === 'in_progress' && "border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-900/10"
                                        )}
                                        onClick={() => viewDetails(report)}
                                    >
                                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                                            {/* Left: Title & Category */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start gap-2">
                                                    <h3 className="font-semibold text-sm md:text-base truncate">
                                                        {report.metadata?.title || report.error_message?.replace('[USER REPORT]', '').trim()}
                                                    </h3>
                                                    {report.metadata?.screenshot_data && (
                                                        <Badge variant="outline" className="shrink-0 text-xs bg-green-50 dark:bg-green-900/20 text-green-600">
                                                            <Image className="h-3 w-3" />
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                                    <Badge variant="outline" className="text-xs">
                                                        {getCategoryLabel(report.metadata?.category)}
                                                    </Badge>
                                                    {getPriorityBadge(report.metadata?.priority)}
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-2">
                                                    Reported on {formatDateTime(report.created_at)}
                                                </p>
                                            </div>
                                            
                                            {/* Right: Status */}
                                            <div className="flex flex-col items-end gap-2">
                                                {getStatusBadge(report.status)}
                                                {report.status === 'fixed' && (
                                                    <span className="text-xs text-green-600 dark:text-green-400">
                                                        ✓ Your issue has been resolved!
                                                    </span>
                                                )}
                                                {report.status === 'in_progress' && (
                                                    <span className="text-xs text-blue-600 dark:text-blue-400">
                                                        Our team is working on it
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Detail Dialog */}
                <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                    <DialogContent className="max-w-3xl max-h-[90vh] p-0 overflow-hidden">
                        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-muted/30">
                            <div className="flex items-start justify-between">
                                <div>
                                    <DialogTitle className="flex items-center gap-2 text-lg">
                                        <Bug className="h-5 w-5 text-pink-500" />
                                        Bug Report Details
                                    </DialogTitle>
                                    <DialogDescription className="mt-1">
                                        Submitted on {formatDateTime(selectedReport?.created_at)}
                                    </DialogDescription>
                                </div>
                                {selectedReport && getStatusBadge(selectedReport.status)}
                            </div>
                        </DialogHeader>

                        {selectedReport && (
                            <ScrollArea className="max-h-[calc(90vh-180px)]">
                                <div className="px-6 py-4 space-y-6">
                                    {/* Status Banner */}
                                    {selectedReport.status === 'fixed' && (
                                        <div className="bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center gap-3">
                                            <CheckCircle className="h-6 w-6 text-green-600 shrink-0" />
                                            <div>
                                                <h4 className="font-semibold text-green-700 dark:text-green-400">Issue Resolved!</h4>
                                                <p className="text-sm text-green-600 dark:text-green-500">
                                                    Your reported bug has been fixed by our team. Thank you for helping us improve!
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                    {selectedReport.status === 'in_progress' && (
                                        <div className="bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-center gap-3">
                                            <Loader2 className="h-6 w-6 text-blue-600 animate-spin shrink-0" />
                                            <div>
                                                <h4 className="font-semibold text-blue-700 dark:text-blue-400">Being Fixed</h4>
                                                <p className="text-sm text-blue-600 dark:text-blue-500">
                                                    Our development team is currently working on fixing this issue.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Bug Info */}
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs font-medium text-muted-foreground uppercase">Category</label>
                                                <p className="mt-1">
                                                    <Badge variant="outline">{getCategoryLabel(selectedReport.metadata?.category)}</Badge>
                                                </p>
                                            </div>
                                            <div>
                                                <label className="text-xs font-medium text-muted-foreground uppercase">Priority</label>
                                                <p className="mt-1">{getPriorityBadge(selectedReport.metadata?.priority)}</p>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-xs font-medium text-muted-foreground uppercase">Bug Title</label>
                                            <p className="mt-1 font-semibold">
                                                {selectedReport.metadata?.title || selectedReport.error_message?.replace('[USER REPORT]', '').trim()}
                                            </p>
                                        </div>

                                        <div>
                                            <label className="text-xs font-medium text-muted-foreground uppercase">Description</label>
                                            <div className="mt-1 bg-muted/50 p-3 rounded-lg">
                                                <p className="text-sm whitespace-pre-wrap">
                                                    {selectedReport.metadata?.description || 'No description provided'}
                                                </p>
                                            </div>
                                        </div>

                                        {selectedReport.metadata?.steps_to_reproduce && (
                                            <div>
                                                <label className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1">
                                                    <ListOrdered className="h-3 w-3" /> Steps to Reproduce
                                                </label>
                                                <div className="mt-1 bg-muted/50 p-3 rounded-lg">
                                                    <p className="text-sm whitespace-pre-wrap">
                                                        {selectedReport.metadata.steps_to_reproduce}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Expected vs Actual */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {selectedReport.metadata?.expected_behavior && (
                                                <div>
                                                    <label className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1">
                                                        <Target className="h-3 w-3 text-green-500" /> Expected
                                                    </label>
                                                    <div className="mt-1 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
                                                        <p className="text-sm">{selectedReport.metadata.expected_behavior}</p>
                                                    </div>
                                                </div>
                                            )}
                                            {selectedReport.metadata?.actual_behavior && (
                                                <div>
                                                    <label className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1">
                                                        <AlertTriangle className="h-3 w-3 text-red-500" /> Actual
                                                    </label>
                                                    <div className="mt-1 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                                                        <p className="text-sm">{selectedReport.metadata.actual_behavior}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Screenshot */}
                                        {selectedReport.metadata?.screenshot_data && (
                                            <div>
                                                <label className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1">
                                                    <Image className="h-3 w-3" /> Screenshot Attached
                                                </label>
                                                <div className="mt-2 border rounded-lg overflow-hidden">
                                                    <img 
                                                        src={selectedReport.metadata.screenshot_data} 
                                                        alt="Bug Screenshot" 
                                                        className="w-full h-auto max-h-[300px] object-contain cursor-zoom-in"
                                                        onClick={() => window.open(selectedReport.metadata.screenshot_data, '_blank')}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* Technical Info */}
                                        <div className="pt-4 border-t">
                                            <label className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1 mb-2">
                                                <Monitor className="h-3 w-3" /> Technical Details
                                            </label>
                                            <div className="grid grid-cols-2 gap-3 text-xs">
                                                <div>
                                                    <span className="text-muted-foreground">Page:</span>
                                                    <span className="ml-1 font-mono">{selectedReport.page_url?.replace(window.location.origin, '')}</span>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground">Browser:</span>
                                                    <span className="ml-1">{selectedReport.metadata?.device?.browser || 'Unknown'}</span>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground">Device:</span>
                                                    <span className="ml-1">
                                                        {selectedReport.metadata?.device?.isMobile ? 'Mobile' : 'Desktop'}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground">Screen:</span>
                                                    <span className="ml-1">{selectedReport.metadata?.device?.screenSize || 'Unknown'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Timestamps */}
                                        <div className="pt-4 border-t grid grid-cols-2 gap-4 text-xs">
                                            <div>
                                                <span className="text-muted-foreground">Submitted:</span>
                                                <span className="ml-1">{formatDateTime(selectedReport.created_at)}</span>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground">Last Updated:</span>
                                                <span className="ml-1">{formatDateTime(selectedReport.updated_at)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </ScrollArea>
                        )}

                        {/* Footer */}
                        <div className="px-6 py-4 border-t bg-muted/30 flex justify-end">
                            <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
                                Close
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
};

export default MyBugReportsPage;
