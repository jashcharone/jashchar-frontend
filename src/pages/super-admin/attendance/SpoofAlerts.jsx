// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// JASHCHAR ERP - SPOOF ALERTS MANAGEMENT (Day 28 - Anti-Spoofing UI)
// Manage and review anti-spoofing detection alerts
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { usePermissions } from '@/contexts/PermissionContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDate, formatDateTime } from '@/utils/dateUtils';

import {
    Shield, ShieldAlert, ShieldX, ShieldCheck, AlertTriangle, AlertCircle, AlertOctagon,
    Camera, Eye, EyeOff, CheckCircle2, XCircle, Clock, Calendar, RefreshCw, Search,
    Filter, FileText, User, UserX, Image, Video, Printer, Smartphone, Fingerprint, HelpCircle,
    BarChart3, TrendingUp, TrendingDown, Activity, PieChart, ChevronRight, ChevronDown,
    ExternalLink, Download, Settings, Loader2, CircleDot, Ban, CheckCheck, XOctagon,
    Zap, Target, Scan
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

const SPOOF_TYPE_INFO = {
    print_attack: { label: 'Print Attack', icon: Printer, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/30', desc: 'Printed photo' },
    screen_attack: { label: 'Screen Attack', icon: Smartphone, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30', desc: 'Phone/tablet display' },
    video_replay: { label: 'Video Replay', icon: Video, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/30', desc: 'Video playback' },
    mask_attack: { label: 'Mask Attack', icon: Fingerprint, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30', desc: '3D mask/silicone' },
    unknown_spoof: { label: 'Unknown', icon: HelpCircle, color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-800', desc: 'Unclassified' }
};

const SEVERITY_INFO = {
    low: { label: 'Low', color: 'text-green-600 bg-green-100 border-green-300 dark:text-green-400 dark:bg-green-900/30 dark:border-green-700', weight: 1 },
    medium: { label: 'Medium', color: 'text-yellow-600 bg-yellow-100 border-yellow-300 dark:text-yellow-400 dark:bg-yellow-900/30 dark:border-yellow-700', weight: 2 },
    high: { label: 'High', color: 'text-orange-600 bg-orange-100 border-orange-300 dark:text-orange-400 dark:bg-orange-900/30 dark:border-orange-700', weight: 3 },
    critical: { label: 'Critical', color: 'text-red-600 bg-red-100 border-red-300 dark:text-red-400 dark:bg-red-900/30 dark:border-red-700 animate-pulse', weight: 4 }
};

const STATUS_INFO = {
    new: { label: 'New', color: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30', icon: CircleDot },
    reviewed: { label: 'Reviewed', color: 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30', icon: Eye },
    investigated: { label: 'Investigated', color: 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30', icon: Search },
    resolved: { label: 'Resolved', color: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30', icon: CheckCheck },
    false_positive: { label: 'False Positive', color: 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-800', icon: XOctagon }
};

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

const SpoofAlerts = () => {
    const { user, session, currentSessionId, organizationId } = useAuth();
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    const { canView } = usePermissions();
    
    const branchId = selectedBranch?.id || user?.profile?.branch_id;
    
    // Data State
    const [alerts, setAlerts] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    
    // Filter State
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterSeverity, setFilterSeverity] = useState('all');
    const [filterType, setFilterType] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [dateRange, setDateRange] = useState(7); // Days
    
    // Dialog State
    const [selectedAlert, setSelectedAlert] = useState(null);
    const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
    const [reviewNotes, setReviewNotes] = useState('');
    const [reviewStatus, setReviewStatus] = useState('reviewed');
    const [isFalsePositive, setIsFalsePositive] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    
    // Active Tab
    const [activeTab, setActiveTab] = useState('alerts');
    
    // Permissions
    const hasViewPermission = canView('attendance.spoof_alerts') || canView('attendance');

    // ═══════════════════════════════════════════════════════════════════════════════════════════════
    // DATA FETCHING
    // ═══════════════════════════════════════════════════════════════════════════════════════════════
    
    const fetchAlerts = useCallback(async () => {
        if (!branchId || !organizationId) return;
        
        try {
            const params = new URLSearchParams({
                branch_id: branchId,
                organization_id: organizationId,
                days: dateRange
            });
            
            if (filterStatus !== 'all') params.append('status', filterStatus);
            if (filterSeverity !== 'all') params.append('severity', filterSeverity);
            if (filterType !== 'all') params.append('spoof_type', filterType);
            
            const response = await fetch(`${API_BASE_URL}/api/camera/spoof-alerts?${params.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`,
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();
            
            if (data.success) {
                setAlerts(data.data || []);
            } else {
                console.error('Failed to fetch alerts:', data.message);
            }
        } catch (error) {
            console.error('Error fetching alerts:', error);
        }
    }, [branchId, organizationId, session, dateRange, filterStatus, filterSeverity, filterType]);
    
    const fetchSummary = useCallback(async () => {
        if (!branchId || !organizationId) return;
        
        try {
            const params = new URLSearchParams({
                branch_id: branchId,
                organization_id: organizationId,
                days: dateRange
            });
            
            const response = await fetch(`${API_BASE_URL}/api/camera/spoof-alerts/summary?${params.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`,
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();
            
            if (data.success) {
                setSummary(data.data);
            }
        } catch (error) {
            console.error('Error fetching summary:', error);
        }
    }, [branchId, organizationId, session, dateRange]);
    
    const refreshData = useCallback(async () => {
        setRefreshing(true);
        await Promise.all([fetchAlerts(), fetchSummary()]);
        setRefreshing(false);
    }, [fetchAlerts, fetchSummary]);
    
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await Promise.all([fetchAlerts(), fetchSummary()]);
            setLoading(false);
        };
        
        if (branchId && organizationId) {
            loadData();
        }
    }, [branchId, organizationId, fetchAlerts, fetchSummary]);

    // ═══════════════════════════════════════════════════════════════════════════════════════════════
    // ALERT REVIEW
    // ═══════════════════════════════════════════════════════════════════════════════════════════════
    
    const openReviewDialog = (alert) => {
        setSelectedAlert(alert);
        setReviewNotes(alert.review_notes || '');
        setReviewStatus(alert.status === 'new' ? 'reviewed' : alert.status);
        setIsFalsePositive(alert.is_false_positive || false);
        setReviewDialogOpen(true);
    };
    
    const submitReview = async () => {
        if (!selectedAlert) return;
        
        setSubmitting(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/camera/spoof-alerts/${selectedAlert.id}/review`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    status: isFalsePositive ? 'false_positive' : reviewStatus,
                    review_notes: reviewNotes,
                    is_false_positive: isFalsePositive,
                    reviewed_by: user?.id
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                toast({
                    title: 'Review Submitted',
                    description: 'Alert has been updated successfully'
                });
                setReviewDialogOpen(false);
                refreshData();
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: data.message || 'Failed to update alert'
                });
            }
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Network error while updating alert'
            });
        } finally {
            setSubmitting(false);
        }
    };

    // ═══════════════════════════════════════════════════════════════════════════════════════════════
    // FILTERED ALERTS
    // ═══════════════════════════════════════════════════════════════════════════════════════════════
    
    const filteredAlerts = useMemo(() => {
        return alerts.filter(alert => {
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const matchesName = alert.attempted_person_name?.toLowerCase().includes(query);
                const matchesId = alert.attempted_person_id?.toLowerCase().includes(query);
                const matchesLocation = alert.detection_location?.toLowerCase().includes(query);
                if (!matchesName && !matchesId && !matchesLocation) return false;
            }
            return true;
        });
    }, [alerts, searchQuery]);

    // ═══════════════════════════════════════════════════════════════════════════════════════════════
    // RENDER HELPERS
    // ═══════════════════════════════════════════════════════════════════════════════════════════════
    
    const renderSpoofTypeIcon = (type) => {
        const info = SPOOF_TYPE_INFO[type] || SPOOF_TYPE_INFO.unknown_spoof;
        const Icon = info.icon;
        return <Icon className={`w-4 h-4 ${info.color}`} />;
    };
    
    const renderSeverityBadge = (severity) => {
        const info = SEVERITY_INFO[severity] || SEVERITY_INFO.medium;
        return (
            <Badge variant="outline" className={`${info.color} text-xs font-medium`}>
                {info.label}
            </Badge>
        );
    };
    
    const renderStatusBadge = (status) => {
        const info = STATUS_INFO[status] || STATUS_INFO.new;
        const Icon = info.icon;
        return (
            <Badge variant="outline" className={`${info.color} text-xs font-medium flex items-center gap-1`}>
                <Icon className="w-3 h-3" />
                {info.label}
            </Badge>
        );
    };

    // ═══════════════════════════════════════════════════════════════════════════════════════════════
    // RENDER - NO PERMISSION
    // ═══════════════════════════════════════════════════════════════════════════════════════════════
    
    if (!hasViewPermission) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                        <XCircle className="w-16 h-16 mx-auto text-destructive mb-4" />
                        <h2 className="text-xl font-semibold">Access Denied</h2>
                        <p className="text-muted-foreground">You don't have permission to view this page.</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    // ═══════════════════════════════════════════════════════════════════════════════════════════════
    // RENDER - MAIN UI
    // ═══════════════════════════════════════════════════════════════════════════════════════════════
    
    return (
        <DashboardLayout>
            <div className="p-4 md:p-6 space-y-4">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                            <ShieldAlert className="w-7 h-7 md:w-8 md:h-8 text-red-500" />
                            Anti-Spoofing Alerts
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Monitor and review face recognition spoof detection alerts
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <Select value={String(dateRange)} onValueChange={(v) => setDateRange(Number(v))}>
                            <SelectTrigger className="w-32">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1">Last 24h</SelectItem>
                                <SelectItem value="7">Last 7 days</SelectItem>
                                <SelectItem value="30">Last 30 days</SelectItem>
                                <SelectItem value="90">Last 90 days</SelectItem>
                            </SelectContent>
                        </Select>
                        
                        <Button variant="outline" size="icon" onClick={refreshData} disabled={refreshing}>
                            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </div>

                {/* Stats Dashboard */}
                {summary && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        <Card className={`${summary.critical_alerts > 0 ? 'border-red-500 bg-red-50/50' : ''}`}>
                            <CardContent className="pt-4 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2.5 rounded-xl ${summary.critical_alerts > 0 ? 'bg-red-500/20' : 'bg-gray-200 dark:bg-gray-700'}`}>
                                        <AlertOctagon className={`h-5 w-5 ${summary.critical_alerts > 0 ? 'text-red-600' : 'text-gray-500 dark:text-gray-400'}`} />
                                    </div>
                                    <div>
                                        <p className={`text-2xl font-bold ${summary.critical_alerts > 0 ? 'text-red-700 dark:text-red-400' : ''}`}>
                                            {summary.critical_alerts || 0}
                                        </p>
                                        <p className="text-xs text-muted-foreground">Critical</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        
                        <Card>
                            <CardContent className="pt-4 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-blue-500/20">
                                        <CircleDot className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">{summary.new_alerts || 0}</p>
                                        <p className="text-xs text-muted-foreground">Pending Review</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        
                        <Card>
                            <CardContent className="pt-4 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-purple-500/20">
                                        <Activity className="h-5 w-5 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">{summary.total_alerts || 0}</p>
                                        <p className="text-xs text-muted-foreground">Total Alerts</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        
                        <Card>
                            <CardContent className="pt-4 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-green-500/20">
                                        <CheckCheck className="h-5 w-5 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">{summary.reviewed_alerts || 0}</p>
                                        <p className="text-xs text-muted-foreground">Reviewed</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        
                        <Card>
                            <CardContent className="pt-4 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-gray-500/20">
                                        <XOctagon className="h-5 w-5 text-gray-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">{summary.false_positives || 0}</p>
                                        <p className="text-xs text-muted-foreground">False Positives</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Attack Types Breakdown */}
                {summary && (
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <BarChart3 className="w-4 h-4" />
                                Attack Types Breakdown
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                {Object.entries(SPOOF_TYPE_INFO).map(([type, info]) => {
                                    const count = summary[`${type}s`] || summary[type] || 0;
                                    const Icon = info.icon;
                                    return (
                                        <div key={type} className={`flex items-center gap-3 p-3 rounded-lg ${info.bg}`}>
                                            <div className="p-2 rounded-lg bg-white/50">
                                                <Icon className={`w-5 h-5 ${info.color}`} />
                                            </div>
                                            <div>
                                                <p className={`text-xl font-bold ${info.color}`}>{count}</p>
                                                <p className="text-xs text-muted-foreground">{info.label}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Tabs: Alerts / Analytics */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList>
                        <TabsTrigger value="alerts" className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            Alerts ({filteredAlerts.length})
                        </TabsTrigger>
                        <TabsTrigger value="analytics" className="flex items-center gap-2">
                            <PieChart className="w-4 h-4" />
                            Analytics
                        </TabsTrigger>
                    </TabsList>
                    
                    {/* ALERTS TAB */}
                    <TabsContent value="alerts" className="space-y-4">
                        {/* Filters */}
                        <Card>
                            <CardContent className="pt-4">
                                <div className="flex flex-wrap items-center gap-3">
                                    <div className="flex-1 min-w-[200px]">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Search by name, ID, location..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="pl-9"
                                            />
                                        </div>
                                    </div>
                                    
                                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                                        <SelectTrigger className="w-32">
                                            <SelectValue placeholder="Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Status</SelectItem>
                                            <SelectItem value="new">New</SelectItem>
                                            <SelectItem value="reviewed">Reviewed</SelectItem>
                                            <SelectItem value="investigated">Investigated</SelectItem>
                                            <SelectItem value="resolved">Resolved</SelectItem>
                                            <SelectItem value="false_positive">False Positive</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    
                                    <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                                        <SelectTrigger className="w-32">
                                            <SelectValue placeholder="Severity" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Severity</SelectItem>
                                            <SelectItem value="critical">Critical</SelectItem>
                                            <SelectItem value="high">High</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="low">Low</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    
                                    <Select value={filterType} onValueChange={setFilterType}>
                                        <SelectTrigger className="w-36">
                                            <SelectValue placeholder="Attack Type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Types</SelectItem>
                                            <SelectItem value="print_attack">Print Attack</SelectItem>
                                            <SelectItem value="screen_attack">Screen Attack</SelectItem>
                                            <SelectItem value="video_replay">Video Replay</SelectItem>
                                            <SelectItem value="mask_attack">Mask Attack</SelectItem>
                                            <SelectItem value="unknown_spoof">Unknown</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Alerts List */}
                        {loading ? (
                            <div className="flex items-center justify-center h-64">
                                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : filteredAlerts.length === 0 ? (
                            <Card>
                                <CardContent className="flex flex-col items-center justify-center h-64">
                                    <ShieldCheck className="w-16 h-16 text-green-500 mb-4" />
                                    <h3 className="text-lg font-semibold">No Spoof Alerts</h3>
                                    <p className="text-muted-foreground text-center mt-2">
                                        No suspicious activity detected in the selected timeframe.
                                        <br />
                                        Your face recognition system is secure!
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-3">
                                {filteredAlerts.map((alert) => {
                                    const typeInfo = SPOOF_TYPE_INFO[alert.spoof_type] || SPOOF_TYPE_INFO.unknown_spoof;
                                    const TypeIcon = typeInfo.icon;
                                    
                                    return (
                                        <Card 
                                            key={alert.id} 
                                            className={`hover:shadow-md transition-shadow cursor-pointer ${
                                                alert.severity === 'critical' ? 'border-red-400 bg-red-50/30' : 
                                                alert.severity === 'high' ? 'border-orange-300' : ''
                                            }`}
                                            onClick={() => openReviewDialog(alert)}
                                        >
                                            <CardContent className="pt-4 pb-4">
                                                <div className="flex items-start gap-4">
                                                    {/* Snapshot Thumbnail */}
                                                    <div className={`w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 ${typeInfo.bg} flex items-center justify-center`}>
                                                        {alert.snapshot_base64 ? (
                                                            <img 
                                                                src={`data:image/jpeg;base64,${alert.snapshot_base64}`}
                                                                alt="Spoof snapshot"
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <TypeIcon className={`w-8 h-8 ${typeInfo.color}`} />
                                                        )}
                                                    </div>
                                                    
                                                    {/* Alert Details */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-sm font-medium ${typeInfo.bg} ${typeInfo.color}`}>
                                                                <TypeIcon className="w-3.5 h-3.5" />
                                                                {typeInfo.label}
                                                            </span>
                                                            {renderSeverityBadge(alert.severity)}
                                                            {renderStatusBadge(alert.status)}
                                                        </div>
                                                        
                                                        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-sm">
                                                            {alert.attempted_person_name && (
                                                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                                                    <User className="w-3.5 h-3.5" />
                                                                    <span>Impersonating: <span className="font-medium text-foreground">{alert.attempted_person_name}</span></span>
                                                                </div>
                                                            )}
                                                            
                                                            {alert.detection_location && (
                                                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                                                    <Camera className="w-3.5 h-3.5" />
                                                                    <span>{alert.detection_location}</span>
                                                                </div>
                                                            )}
                                                            
                                                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                                                <Clock className="w-3.5 h-3.5" />
                                                                <span>{formatDateTime(alert.detected_at)}</span>
                                                            </div>
                                                            
                                                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                                                <Target className="w-3.5 h-3.5" />
                                                                <span>Liveness: <span className="font-medium">{Math.round((alert.liveness_score || 0) * 100)}%</span></span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Actions */}
                                                    <div className="flex-shrink-0 flex items-center">
                                                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}
                    </TabsContent>
                    
                    {/* ANALYTICS TAB */}
                    <TabsContent value="analytics" className="space-y-4">
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center h-64">
                                <PieChart className="w-16 h-16 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold">Analytics Coming Soon</h3>
                                <p className="text-muted-foreground text-center mt-2">
                                    Detailed charts and trend analysis will be available in the next update.
                                </p>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
            
            {/* REVIEW DIALOG */}
            <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-primary" />
                            Review Spoof Alert
                        </DialogTitle>
                        <DialogDescription>
                            Review the detected spoof attempt and update its status
                        </DialogDescription>
                    </DialogHeader>
                    
                    {selectedAlert && (
                        <div className="space-y-4">
                            {/* Alert Summary */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-xs text-muted-foreground">Attack Type</Label>
                                    <div className="flex items-center gap-2 mt-1">
                                        {renderSpoofTypeIcon(selectedAlert.spoof_type)}
                                        <span className="font-medium">{SPOOF_TYPE_INFO[selectedAlert.spoof_type]?.label || 'Unknown'}</span>
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Detected At</Label>
                                    <p className="font-medium mt-1">{formatDateTime(selectedAlert.detected_at)}</p>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Liveness Score</Label>
                                    <div className="mt-1">
                                        <Progress value={(selectedAlert.liveness_score || 0) * 100} className="h-2" />
                                        <span className="text-xs text-muted-foreground mt-1">
                                            {Math.round((selectedAlert.liveness_score || 0) * 100)}% (Lower = More likely fake)
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Spoof Probability</Label>
                                    <div className="mt-1">
                                        <Progress value={(selectedAlert.spoof_probability || 0) * 100} className="h-2 bg-red-100 [&>div]:bg-red-500" />
                                        <span className="text-xs text-muted-foreground mt-1">
                                            {Math.round((selectedAlert.spoof_probability || 0) * 100)}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Snapshot */}
                            {selectedAlert.snapshot_base64 && (
                                <div>
                                    <Label className="text-xs text-muted-foreground">Captured Snapshot</Label>
                                    <div className="mt-2 rounded-lg overflow-hidden border max-w-sm">
                                        <img 
                                            src={`data:image/jpeg;base64,${selectedAlert.snapshot_base64}`}
                                            alt="Spoof detection snapshot"
                                            className="w-full"
                                        />
                                    </div>
                                </div>
                            )}
                            
                            {/* Method Scores */}
                            {selectedAlert.method_scores && Object.keys(selectedAlert.method_scores).length > 0 && (
                                <div>
                                    <Label className="text-xs text-muted-foreground">Detection Method Scores</Label>
                                    <div className="grid grid-cols-3 gap-2 mt-2">
                                        {Object.entries(selectedAlert.method_scores).map(([method, score]) => (
                                            <div key={method} className="p-2 rounded-lg bg-muted/50">
                                                <p className="text-xs text-muted-foreground capitalize">{method}</p>
                                                <p className="font-medium">{Math.round(parseFloat(score) * 100)}%</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            <Separator />
                            
                            {/* Review Form */}
                            <div className="space-y-4">
                                <div>
                                    <Label>Update Status</Label>
                                    <Select value={reviewStatus} onValueChange={setReviewStatus} disabled={isFalsePositive}>
                                        <SelectTrigger className="mt-1">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="reviewed">Reviewed</SelectItem>
                                            <SelectItem value="investigated">Investigated</SelectItem>
                                            <SelectItem value="resolved">Resolved</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="falsePositive"
                                        checked={isFalsePositive}
                                        onChange={(e) => setIsFalsePositive(e.target.checked)}
                                        className="rounded"
                                    />
                                    <Label htmlFor="falsePositive" className="font-normal cursor-pointer">
                                        Mark as False Positive (Not a real spoof attempt)
                                    </Label>
                                </div>
                                
                                <div>
                                    <Label>Review Notes</Label>
                                    <Textarea
                                        value={reviewNotes}
                                        onChange={(e) => setReviewNotes(e.target.value)}
                                        placeholder="Add any notes about this alert..."
                                        className="mt-1"
                                        rows={3}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                    
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={submitReview} disabled={submitting}>
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Submit Review
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
};

export default SpoofAlerts;
