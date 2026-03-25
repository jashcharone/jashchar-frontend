import React, { useState, useEffect, useRef, useCallback } from 'react';
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
    Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger 
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
    Bug, AlertTriangle, CheckCircle, Clock, Search,
    Copy, Activity, RefreshCw, Download, Wand2,
    Zap, Shield, Server, Timer, Play, Pause, BarChart3,
    AlertCircle, XCircle, Info, Layers, Globe, Database,
    Eye, FileCode, MessageSquare, User
} from 'lucide-react';
import { format, isValid, differenceInHours, addHours } from 'date-fns';
import { useSearchParams } from 'react-router-dom';

// ==================== AUTO CHECK TIMER STORAGE ====================
const AUTO_CHECK_KEY = 'queries_finder_last_auto_check';
const AUTO_CHECK_ENABLED_KEY = 'queries_finder_auto_check_enabled';

const getLastAutoCheck = () => {
    const stored = localStorage.getItem(AUTO_CHECK_KEY);
    return stored ? new Date(stored) : null;
};

const setLastAutoCheckStorage = () => {
    localStorage.setItem(AUTO_CHECK_KEY, new Date().toISOString());
};

const getNextAutoCheck = () => {
    const last = getLastAutoCheck();
    if (!last) return new Date();
    return addHours(last, 24);
};

const getAutoCheckEnabled = () => {
    const stored = localStorage.getItem(AUTO_CHECK_ENABLED_KEY);
    return stored !== 'false';
};

const setAutoCheckEnabledStorage = (enabled) => {
    localStorage.setItem(AUTO_CHECK_ENABLED_KEY, enabled.toString());
};

// ==================== MAIN COMPONENT ====================
const QueriesFinder = () => {
    const { toast } = useToast();
    const [searchParams] = useSearchParams();
    
    // Core State
    const [errors, setErrors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ status: 'All', severity: 'All', source: 'All', search: '' });
    const [stats, setStats] = useState({ 
        total: 0, critical: 0, fixed: 0, pending: 0,
        frontend: 0, backend: 0, api: 0, database: 0,
        userReports: 0
    });
    const [systemEnabled, setSystemEnabled] = useState(true);
    const [toggling, setToggling] = useState(false);
    const [incomingError, setIncomingError] = useState(null);
    const [activeTab, setActiveTab] = useState('all');
    
    // Auto-Check Timer State
    const [autoCheckEnabled, setAutoCheckEnabled] = useState(getAutoCheckEnabled());
    const [timeUntilNextCheck, setTimeUntilNextCheck] = useState('');
    const [isAutoChecking, setIsAutoChecking] = useState(false);
    const [lastCheckTime, setLastCheckTime] = useState(getLastAutoCheck());
    
    // Refs
    const isFetchingRef = useRef(false);
    const prevErrorsRef = useRef([]);
    const mountedRef = useRef(true);
    const timerRef = useRef(null);
    const autoCheckRanRef = useRef(false);

    // ==================== INCOMING ERROR FROM ERROR BOUNDARY ====================
    useEffect(() => {
        const errorId = searchParams.get('errorId');
        const fromBoundary = searchParams.get('from') === 'error-boundary';
        const page = searchParams.get('page');
        
        if (errorId && fromBoundary) {
            setIncomingError({ errorId, page });
            toast({
                title: '🚨 Error Report Received',
                description: `Error ID: ${errorId} from page: ${page}`,
                className: 'bg-red-100 border-red-500 text-red-800',
                duration: 8000
            });
        }
    }, [searchParams]);

    // Safe date formatter
    const safeFormat = (dateStr, formatStr) => {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        return isValid(date) ? format(date, formatStr) : 'Invalid Date';
    };

    // ==================== FETCH ERRORS ====================
    const fetchErrors = useCallback(async () => {
        if (isFetchingRef.current) return;
        isFetchingRef.current = true;
        setLoading(true);
        try {
            const data = await errorLoggerService.getErrors(filters);
            
            if (!mountedRef.current) return;
            
            // Check for newly resolved issues
            if (prevErrorsRef.current.length > 0 && data) {
                const newlyFixed = data.filter(newErr => {
                    const oldErr = prevErrorsRef.current.find(e => e.id === newErr.id);
                    return oldErr && oldErr.status !== 'fixed' && newErr.status === 'fixed';
                });

                if (newlyFixed.length > 0) {
                    toast({
                        title: '✅ Issues Resolved',
                        description: `${newlyFixed.length} issue(s) have been marked as Fixed.`,
                        className: 'bg-green-100 border-green-500 text-green-800'
                    });
                }
            }
            
            prevErrorsRef.current = data || [];
            setErrors(data || []);
            calculateStats(data || []);
        } catch (err) {
            console.error('Failed to fetch errors', err);
        } finally {
            if (mountedRef.current) {
                setLoading(false);
            }
            isFetchingRef.current = false;
        }
    }, [filters]);

    // ==================== AUTO CHECK LOGIC ====================
    const runAutoCheck = useCallback(async () => {
        if (isAutoChecking) return;
        setIsAutoChecking(true);
        setLoading(true);
        
        try {
            // Fetch fresh data first
            const freshData = await errorLoggerService.getErrors({});
            const now = new Date();
            
            // Find stale errors (24+ hours old and not fixed/ignored)
            const staleErrors = (freshData || []).filter(e => {
                if (e.status === 'fixed' || e.status === 'ignored') return false;
                const lastUpdate = new Date(e.updated_at);
                const diff = differenceInHours(now, lastUpdate);
                return diff >= 24;
            });

            if (staleErrors.length === 0) {
                toast({ 
                    title: '🔍 Auto-Check Complete', 
                    description: 'No stale errors found. System is healthy!',
                    className: 'bg-blue-100 border-blue-500 text-blue-800'
                });
            } else {
                let resolvedCount = 0;
                for (const error of staleErrors) {
                    await errorLoggerService.updateStatus(error.id, 'fixed');
                    resolvedCount++;
                }

                toast({ 
                    title: '✨ Auto-Check Complete', 
                    description: `Auto-resolved ${resolvedCount} stale errors (24h+ inactive).`,
                    className: 'bg-green-100 border-green-500 text-green-800'
                });
            }

            setLastAutoCheckStorage();
            setLastCheckTime(new Date());
            await fetchErrors();

        } catch (err) {
            console.error('Auto-check failed', err);
            toast({ variant: 'destructive', title: 'Auto-Check Failed', description: err.message });
        } finally {
            setIsAutoChecking(false);
            setLoading(false);
        }
    }, [isAutoChecking, fetchErrors]);

    // ==================== COUNTDOWN TIMER ====================
    const updateCountdown = useCallback(() => {
        const next = getNextAutoCheck();
        const now = new Date();
        const diffMs = next.getTime() - now.getTime();
        
        if (diffMs <= 0 && autoCheckEnabled && !autoCheckRanRef.current && !isAutoChecking) {
            // Time to run auto-check!
            autoCheckRanRef.current = true;
            runAutoCheck().then(() => {
                autoCheckRanRef.current = false;
            });
            return;
        }
        
        if (diffMs > 0) {
            const hours = Math.floor(diffMs / (1000 * 60 * 60));
            const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
            setTimeUntilNextCheck(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        }
    }, [autoCheckEnabled, isAutoChecking, runAutoCheck]);

    // ==================== INITIALIZE ====================
    useEffect(() => {
        mountedRef.current = true;
        fetchErrors();
        
        // Fetch system status
        errorLoggerService.getSystemStatus().then(data => {
            if (mountedRef.current && data) {
                setSystemEnabled(data.enabled);
            }
        });

        // Start countdown timer (every second)
        timerRef.current = setInterval(updateCountdown, 1000);
        
        // Refresh data every 5 minutes
        const dataInterval = setInterval(fetchErrors, 300000);
        
        return () => {
            mountedRef.current = false;
            if (timerRef.current) clearInterval(timerRef.current);
            clearInterval(dataInterval);
        };
    }, []);

    // Re-fetch when filters change
    useEffect(() => {
        fetchErrors();
    }, [filters.status, filters.severity, filters.source, filters.search]);

    // ==================== HANDLERS ====================
    const handleToggleSystem = async (checked) => {
        setToggling(true);
        try {
            const res = await errorLoggerService.updateSystemStatus(checked);
            if (res.success) {
                setSystemEnabled(checked);
                toast({ 
                    title: checked ? '✅ System Enabled' : '⏸️ System Disabled', 
                    description: res.message 
                });
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to update system status' });
        }
        setToggling(false);
    };

    const handleToggleAutoCheck = (checked) => {
        setAutoCheckEnabled(checked);
        setAutoCheckEnabledStorage(checked);
        toast({
            title: checked ? '⏰ Auto-Check Enabled' : '⏸️ Auto-Check Paused',
            description: checked ? 'Will auto-resolve stale errors every 24 hours' : 'Auto-check is now paused'
        });
    };

    const calculateStats = (data) => {
        setStats({
            total: data.length,
            critical: data.filter(e => e.severity === 'critical' && e.status !== 'fixed').length,
            fixed: data.filter(e => e.status === 'fixed').length,
            pending: data.filter(e => e.status !== 'fixed' && e.status !== 'ignored').length,
            frontend: data.filter(e => e.source === 'frontend').length,
            backend: data.filter(e => e.source === 'backend').length,
            api: data.filter(e => e.source === 'api').length,
            database: data.filter(e => e.source === 'database').length,
            userReports: data.filter(e => e.source === 'user_report' || e.error_message?.startsWith('[USER REPORT]')).length
        });
    };

    const handleStatusChange = async (id, newStatus) => {
        try {
            await errorLoggerService.updateStatus(id, newStatus);
            toast({ title: '✅ Status Updated', description: `Error marked as ${newStatus}` });
            fetchErrors();
        } catch (err) {
            toast({ variant: 'destructive', title: 'Update Failed' });
        }
    };

    const handleBulkResolve = async () => {
        const pendingErrors = errors.filter(e => e.status === 'open' || e.status === 'in_progress');
        if (pendingErrors.length === 0) {
            toast({ title: 'No pending errors to resolve' });
            return;
        }
        
        if (!confirm(`Mark ${pendingErrors.length} errors as fixed?`)) return;
        
        setLoading(true);
        try {
            for (const error of pendingErrors) {
                await errorLoggerService.updateStatus(error.id, 'fixed');
            }
            toast({ 
                title: '✅ Bulk Resolve Complete', 
                description: `Marked ${pendingErrors.length} errors as fixed.`,
                className: 'bg-green-100 border-green-500'
            });
            fetchErrors();
        } catch (err) {
            toast({ variant: 'destructive', title: 'Bulk resolve failed' });
        }
        setLoading(false);
    };

    // ==================== AI PROMPT GENERATION ====================
    const generateAiPrompt = (error) => {
        // Format console logs if available
        const consoleLogs = error.metadata?.console_logs || [];
        const lastErrors = error.metadata?.last_errors || [];
        const allLogs = consoleLogs.length > 0 ? consoleLogs : lastErrors;
        const consoleSection = allLogs.length > 0
            ? `### 📋 Console Logs (F12)
\`\`\`
${allLogs.map(log => `[${log.type}] ${log.timestamp || ''} ${log.message}`).join('\n')}
\`\`\`\n`
            : '';

        // Device info
        const device = error.device_info || error.metadata?.device || {};
        const deviceSection = device.browser
            ? `### 🖥️ Device Info\n- Browser: ${device.browser}\n- OS: ${device.os}\n- Screen: ${device.screenSize}\n- Language: ${device.language}\n`
            : '';

        return `You are an expert AI coding assistant working on the Jashchar ERP project (React + Node.js + Supabase).
Please fix the following error.

### 🚨 Error Report
**Message:** ${error.error_message}
**Location:** ${error.page_url}
**Module:** ${error.module_name || 'Unknown'}
**User Role:** ${error.user_role}
**Source:** ${error.source}
**Frequency:** ${error.frequency} occurrences
**Severity:** ${error.severity}

### 🛠️ Stack Trace
\`\`\`
${error.stack_trace || 'No stack trace available.'}
\`\`\`

${consoleSection}
${deviceSection}
### 🤖 Task Instructions
1. **Analyze**: Identify the specific file and line number causing the crash from the stack trace and console logs.
2. **Context**: If a file path is mentioned (e.g., \`src/pages/...\`), assume it is relative to the project root.
3. **Console Logs**: Use the F12 console output above to understand the full error flow.
4. **Fix**: Provide the corrected code block to fix this issue.
5. **Explanation**: Briefly explain why this error occurred and how the fix resolves it.
`;
    };

    const handleCopyPrompt = (error) => {
        navigator.clipboard.writeText(generateAiPrompt(error));
        toast({ 
            title: '🤖 Prompt Copied!', 
            description: 'Paste this into your AI assistant to get an instant fix.',
            className: 'bg-purple-100 border-purple-500 text-purple-900'
        });
    };

    const handleTestError = async () => {
        try {
            throw new Error("TEST ERROR: Triggered from System Health Center for testing.");
        } catch (err) {
            await errorLoggerService.logError(err, {}, {
                type: 'TEST',
                module: 'system-health-center',
                dashboard: 'master-admin'
            });
            toast({ title: '🧪 Test Error Logged', description: 'Check the list (refresh if needed).' });
            fetchErrors();
        }
    };

    const handleExport = () => {
        const headers = ['ID', 'Message', 'Source', 'Module', 'Status', 'Severity', 'Frequency', 'Page URL', 'User Role', 'Created', 'Updated'];
        const csvContent = [
            headers.join(','),
            ...errors.map(e => [
                e.id, 
                `"${(e.error_message || '').replace(/"/g, '""')}"`, 
                e.source,
                e.module_name || '',
                e.status, 
                e.severity, 
                e.frequency,
                `"${e.page_url}"`,
                e.user_role,
                e.created_at,
                e.updated_at
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.setAttribute('href', URL.createObjectURL(blob));
        link.setAttribute('download', `system_health_report_${format(new Date(), 'yyyy-MM-dd_HHmm')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({ title: '📥 Export Complete', description: 'CSV file downloaded.' });
    };

    // ==================== HELPERS ====================
    const getStatusColor = (status) => {
        switch (status) {
            case 'open': return 'bg-red-500/20 text-red-400 border-red-500/30';
            case 'in_progress': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
            case 'fixed': return 'bg-green-500/20 text-green-400 border-green-500/30';
            case 'ignored': return 'bg-muted text-muted-foreground border-border';
            default: return 'bg-muted text-muted-foreground border-border';
        }
    };

    const getSeverityIcon = (severity) => {
        switch (severity) {
            case 'critical': return <XCircle className="h-4 w-4 text-red-500" />;
            case 'error': return <AlertCircle className="h-4 w-4 text-orange-500" />;
            case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
            case 'info': return <Info className="h-4 w-4 text-blue-500" />;
            default: return <Bug className="h-4 w-4" />;
        }
    };

    const getSourceIcon = (source) => {
        switch (source) {
            case 'frontend': return <Globe className="h-4 w-4 text-blue-500" />;
            case 'backend': return <Server className="h-4 w-4 text-green-500" />;
            case 'api': return <Layers className="h-4 w-4 text-purple-500" />;
            case 'database': return <Database className="h-4 w-4 text-orange-500" />;
            case 'user_report': return <MessageSquare className="h-4 w-4 text-pink-500" />;
            default: return <Bug className="h-4 w-4" />;
        }
    };

    // Check if error is a user report
    const isUserReport = (error) => {
        return error.source === 'user_report' || error.error_message?.startsWith('[USER REPORT]');
    };

    // Filter errors based on active tab
    const getFilteredErrors = () => {
        let filtered = errors;
        if (activeTab === 'critical') filtered = errors.filter(e => e.severity === 'critical' && e.status !== 'fixed');
        if (activeTab === 'pending') filtered = errors.filter(e => e.status !== 'fixed' && e.status !== 'ignored');
        if (activeTab === 'fixed') filtered = errors.filter(e => e.status === 'fixed');
        if (activeTab === 'frontend') filtered = errors.filter(e => e.source === 'frontend');
        if (activeTab === 'backend') filtered = errors.filter(e => e.source === 'backend');
        if (activeTab === 'user_reports') filtered = errors.filter(e => isUserReport(e));
        return filtered;
    };

    const healthScore = Math.max(0, 100 - (stats.critical * 20) - (stats.pending * 5));

    // ==================== RENDER ====================
    return (
        <DashboardLayout>
            <div className="space-y-6 h-full flex flex-col p-1">
                
                {/* ==================== HEADER ==================== */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 p-6 rounded-xl text-white shadow-xl">
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                            <div className="p-3 bg-white/10 rounded-xl backdrop-blur">
                                <Shield className="h-8 w-8 text-cyan-400" />
                            </div>
                            System Health Center
                            <Badge className="bg-purple-500/30 text-purple-200 border-purple-400 text-xs ml-2">
                                AI Powered
                            </Badge>
                        </h1>
                        <p className="text-white/70 mt-2 text-sm">
                            Monitor all system issues across all schools and users. Auto-resolves stale errors every 24 hours.
                        </p>
                        
                        {/* System Toggle */}
                        <div className="flex items-center gap-3 mt-4 bg-white/5 rounded-lg px-4 py-2 w-fit">
                            <Switch 
                                id="system-mode" 
                                checked={systemEnabled}
                                onCheckedChange={handleToggleSystem}
                                disabled={toggling}
                                className="data-[state=checked]:bg-green-500"
                            />
                            <Label htmlFor="system-mode" className="text-sm font-medium text-white/90 cursor-pointer">
                                {systemEnabled ? '🟢 Monitoring Active' : '🔴 Monitoring Paused'}
                            </Label>
                        </div>
                    </div>
                    
                    {/* Auto-Check Timer Card */}
                    <Card className="bg-white/10 backdrop-blur border-white/20 text-white min-w-[280px]">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <Timer className="h-5 w-5 text-cyan-400" />
                                    <span className="font-semibold text-sm">Auto-Check (24h)</span>
                                </div>
                                <Switch 
                                    checked={autoCheckEnabled} 
                                    onCheckedChange={handleToggleAutoCheck}
                                    className="data-[state=checked]:bg-cyan-500 scale-75"
                                />
                            </div>
                            
                            <div className="text-center py-2">
                                <div className="font-mono text-3xl font-bold text-cyan-300">
                                    {isAutoChecking ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <RefreshCw className="h-6 w-6 animate-spin" /> Running...
                                        </span>
                                    ) : autoCheckEnabled ? timeUntilNextCheck || '00:00:00' : 'PAUSED'}
                                </div>
                                <p className="text-xs text-white/50 mt-1">
                                    {lastCheckTime ? `Last: ${safeFormat(lastCheckTime, 'MMM dd, hh:mm a')}` : 'Never run'}
                                </p>
                            </div>
                            
                            <Button 
                                size="sm" 
                                variant="secondary"
                                className="w-full mt-2 bg-white/20 hover:bg-white/30 text-white border-0"
                                onClick={runAutoCheck}
                                disabled={isAutoChecking || loading}
                            >
                                {isAutoChecking ? (
                                    <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Checking...</>
                                ) : (
                                    <><Play className="h-4 w-4 mr-2" /> Run Now</>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* ==================== INCOMING ERROR ALERT ==================== */}
                {incomingError && (
                    <Card className="border-2 border-red-500 bg-red-500/10 shadow-lg">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="bg-red-500/20 p-3 rounded-full animate-pulse">
                                        <AlertTriangle className="h-6 w-6 text-red-500" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-red-500 text-lg">
                                            🚨 NEW ERROR REPORT!
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            <code className="bg-muted px-2 py-0.5 rounded font-mono">{incomingError.errorId}</code>
                                            <span className="mx-2">→</span>
                                            <span className="font-medium">{incomingError.page}</span>
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button 
                                        size="sm" 
                                        variant="destructive"
                                        onClick={() => setFilters(prev => ({ ...prev, search: incomingError.errorId }))}
                                    >
                                        <Search className="h-4 w-4 mr-1" /> Find
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => setIncomingError(null)}>
                                        ✕
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {!systemEnabled ? (
                    <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4 border-2 border-dashed border-border rounded-xl bg-muted/50">
                        <div className="p-6 bg-muted rounded-full">
                            <Pause className="h-16 w-16 text-muted-foreground" />
                        </div>
                        <h2 className="text-2xl font-bold text-foreground">Monitoring Paused</h2>
                        <p className="text-muted-foreground max-w-md">
                            System Health Center is currently inactive. Enable monitoring using the toggle above.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* ==================== HEALTH SCORE & STATS ==================== */}
                        <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
                            {/* Health Score */}
                            <Card className="col-span-2 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-green-500">System Health</span>
                                        <Activity className="h-5 w-5 text-green-500" />
                                    </div>
                                    <div className="flex items-end gap-2">
                                        <span className={`text-4xl font-bold ${healthScore >= 80 ? 'text-green-500' : healthScore >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                                            {healthScore}%
                                        </span>
                                        <span className="text-sm text-green-500/70 mb-1">
                                            {healthScore >= 80 ? 'Excellent' : healthScore >= 50 ? 'Needs Attention' : 'Critical'}
                                        </span>
                                    </div>
                                    <Progress value={healthScore} className="mt-3 h-2" />
                                </CardContent>
                            </Card>

                            {/* Critical */}
                            <Card className={`border-l-4 ${stats.critical > 0 ? 'border-l-red-500 bg-red-500/10' : 'border-l-border'}`}>
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <XCircle className={`h-5 w-5 ${stats.critical > 0 ? 'text-red-500' : 'text-muted-foreground'}`} />
                                        <span className={`text-2xl font-bold ${stats.critical > 0 ? 'text-red-500' : 'text-muted-foreground'}`}>{stats.critical}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">Critical</p>
                                </CardContent>
                            </Card>

                            {/* Pending */}
                            <Card className="border-l-4 border-l-yellow-500">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <Clock className="h-5 w-5 text-yellow-500" />
                                        <span className="text-2xl font-bold text-yellow-500">{stats.pending}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">Pending</p>
                                </CardContent>
                            </Card>

                            {/* Fixed */}
                            <Card className="border-l-4 border-l-green-500">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                        <span className="text-2xl font-bold text-green-500">{stats.fixed}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">Fixed</p>
                                </CardContent>
                            </Card>

                            {/* User Reports */}
                            <Card className={`border-l-4 ${stats.userReports > 0 ? 'border-l-pink-500 bg-pink-500/10' : 'border-l-border'}`}>
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <MessageSquare className={`h-5 w-5 ${stats.userReports > 0 ? 'text-pink-500' : 'text-muted-foreground'}`} />
                                        <span className={`text-2xl font-bold ${stats.userReports > 0 ? 'text-pink-500' : 'text-muted-foreground'}`}>{stats.userReports}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">User Reports</p>
                                </CardContent>
                            </Card>

                            {/* Total */}
                            <Card className="border-l-4 border-l-muted-foreground/50">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <BarChart3 className="h-5 w-5 text-muted-foreground" />
                                        <span className="text-2xl font-bold text-foreground">{stats.total}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">Total Logged</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* ==================== ACTION BAR ==================== */}
                        <div className="flex flex-wrap gap-2 items-center justify-between bg-card p-4 rounded-lg border border-border shadow-sm">
                            <div className="flex gap-2 flex-wrap">
                                <Button onClick={fetchErrors} variant="outline" size="sm">
                                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                                    Refresh
                                </Button>
                                <Button onClick={handleBulkResolve} variant="outline" size="sm" className="text-green-500 border-green-500/30 hover:bg-green-500/10">
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Bulk Resolve All
                                </Button>
                                <Button onClick={handleExport} variant="outline" size="sm">
                                    <Download className="h-4 w-4 mr-2" />
                                    Export CSV
                                </Button>
                                <Button onClick={handleTestError} variant="outline" size="sm" className="text-orange-500 border-orange-500/30 hover:bg-orange-500/10">
                                    <Bug className="h-4 w-4 mr-2" />
                                    Test Error
                                </Button>
                            </div>
                            
                            {/* Filters */}
                            <div className="flex gap-2 items-center flex-wrap">
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input 
                                        placeholder="Search..." 
                                        className="pl-8 w-[200px] h-9" 
                                        value={filters.search}
                                        onChange={(e) => setFilters({...filters, search: e.target.value})}
                                    />
                                </div>
                                <Select value={filters.status} onValueChange={(v) => setFilters({...filters, status: v})}>
                                    <SelectTrigger className="w-[130px] h-9">
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
                                <Select value={filters.severity} onValueChange={(v) => setFilters({...filters, severity: v})}>
                                    <SelectTrigger className="w-[130px] h-9">
                                        <SelectValue placeholder="Severity" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="All">All Severity</SelectItem>
                                        <SelectItem value="critical">🔴 Critical</SelectItem>
                                        <SelectItem value="error">🟠 Error</SelectItem>
                                        <SelectItem value="warning">🟡 Warning</SelectItem>
                                        <SelectItem value="info">🔵 Info</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* ==================== TABS & TABLE ==================== */}
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
                            <TabsList className="bg-muted/50 p-1 flex-wrap h-auto gap-1">
                                <TabsTrigger value="all" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                    <Layers className="h-4 w-4 mr-1" /> All ({stats.total})
                                </TabsTrigger>
                                <TabsTrigger value="user_reports" className="data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-pink-500">
                                    <MessageSquare className="h-4 w-4 mr-1" /> User Reports ({stats.userReports})
                                </TabsTrigger>
                                <TabsTrigger value="critical" className="data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-red-500">
                                    <XCircle className="h-4 w-4 mr-1" /> Critical ({stats.critical})
                                </TabsTrigger>
                                <TabsTrigger value="pending" className="data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-yellow-500">
                                    <Clock className="h-4 w-4 mr-1" /> Pending ({stats.pending})
                                </TabsTrigger>
                                <TabsTrigger value="fixed" className="data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-green-500">
                                    <CheckCircle className="h-4 w-4 mr-1" /> Fixed ({stats.fixed})
                                </TabsTrigger>
                                <TabsTrigger value="frontend" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                    <Globe className="h-4 w-4 mr-1" /> Frontend ({stats.frontend})
                                </TabsTrigger>
                                <TabsTrigger value="backend" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                    <Server className="h-4 w-4 mr-1" /> Backend ({stats.backend})
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value={activeTab} className="mt-4">
                                <Card className="border border-border shadow-sm">
                                    <CardContent className="p-0">
                                        <div className="overflow-auto max-h-[500px]">
                                            <Table>
                                                <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10">
                                                    <TableRow>
                                                        <TableHead className="w-[80px]">Severity</TableHead>
                                                        <TableHead className="w-[90px]">Status</TableHead>
                                                        <TableHead className="w-[80px]">Source</TableHead>
                                                        <TableHead>Error Message</TableHead>
                                                        <TableHead className="w-[120px]">Module</TableHead>
                                                        <TableHead className="w-[60px] text-center">Freq</TableHead>
                                                        <TableHead className="w-[130px]">Last Seen</TableHead>
                                                        <TableHead className="w-[100px] text-right">Actions</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {getFilteredErrors().length === 0 ? (
                                                        <TableRow>
                                                            <TableCell colSpan={8} className="h-48 text-center">
                                                                <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                                                                    <CheckCircle className="h-12 w-12 text-green-500/50" />
                                                                    <p className="text-lg font-medium">All Clear! 🎉</p>
                                                                    <p className="text-sm">No issues found in this category.</p>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    ) : (
                                                        getFilteredErrors().map((error) => (
                                                            <TableRow 
                                                                key={error.id} 
                                                                className={`group cursor-pointer transition-colors border-l-4 ${
                                                                    isUserReport(error)
                                                                        ? 'bg-pink-500/5 hover:bg-pink-500/10 border-l-pink-500'
                                                                        : error.status === 'fixed' 
                                                                        ? 'bg-green-500/5 hover:bg-green-500/10 border-l-green-500' 
                                                                        : error.severity === 'critical'
                                                                        ? 'bg-red-500/5 hover:bg-red-500/10 border-l-red-500'
                                                                        : 'hover:bg-muted/50 border-l-border'
                                                                }`}
                                                            >
                                                                <TableCell>
                                                                    <div className="flex items-center gap-1">
                                                                        {isUserReport(error) ? (
                                                                            <User className="h-4 w-4 text-pink-500" />
                                                                        ) : (
                                                                            getSeverityIcon(error.severity)
                                                                        )}
                                                                        <span className="text-xs capitalize">
                                                                            {isUserReport(error) ? 'report' : error.severity}
                                                                        </span>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Badge className={`${getStatusColor(error.status)} text-xs`} variant="outline">
                                                                        {error.status}
                                                                    </Badge>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <div className="flex items-center gap-1">
                                                                        {getSourceIcon(error.source)}
                                                                        <span className="text-xs">{isUserReport(error) ? 'user' : error.source}</span>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="max-w-[300px]">
                                                                    {isUserReport(error) && (
                                                                        <div className="mb-1 flex items-center gap-2">
                                                                            <Badge className="bg-pink-500/20 text-pink-400 border-pink-500/30 text-[10px]">
                                                                                👤 USER REPORT
                                                                            </Badge>
                                                                            {(() => {
                                                                                const meta = typeof error.metadata === 'string' ? JSON.parse(error.metadata || '{}') : (error.metadata || {});
                                                                                return meta.priority && (
                                                                                    <Badge className={`text-[10px] ${
                                                                                        meta.priority === 'critical' ? 'bg-red-500 text-white' :
                                                                                        meta.priority === 'high' ? 'bg-orange-500 text-white' :
                                                                                        meta.priority === 'medium' ? 'bg-yellow-500 text-black' : 'bg-blue-500 text-white'
                                                                                    }`}>
                                                                                        {meta.priority}
                                                                                    </Badge>
                                                                                );
                                                                            })()}
                                                                        </div>
                                                                    )}
                                                                    <div className="truncate font-mono text-xs" title={error.error_message}>
                                                                        {error.error_message?.replace('[USER REPORT] ', '')}
                                                                    </div>
                                                                    {isUserReport(error) && (() => {
                                                                        const meta = typeof error.metadata === 'string' ? JSON.parse(error.metadata || '{}') : (error.metadata || {});
                                                                        return meta.reporter_email && (
                                                                            <div className="text-[10px] text-pink-400 mt-0.5">
                                                                                📧 {meta.reporter_email}
                                                                            </div>
                                                                        );
                                                                    })()}
                                                                    <div className="text-[10px] text-muted-foreground truncate">
                                                                        {error.page_url}
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <span className="text-xs">{error.module_name || '-'}</span>
                                                                </TableCell>
                                                                <TableCell className="text-center">
                                                                    <Badge variant="secondary" className="text-xs">
                                                                        {error.frequency}
                                                                    </Badge>
                                                                </TableCell>
                                                                <TableCell className="text-xs text-muted-foreground">
                                                                    {safeFormat(error.updated_at, 'MMM dd, hh:mm a')}
                                                                </TableCell>
                                                                <TableCell className="text-right">
                                                                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        <Sheet>
                                                                            <SheetTrigger asChild>
                                                                                <Button variant="ghost" size="sm" className="h-7 px-2">
                                                                                    <Eye className="h-3 w-3" />
                                                                                </Button>
                                                                            </SheetTrigger>
                                                                            <SheetContent className="w-[600px] overflow-y-auto">
                                                                                <SheetHeader className="border-b pb-4">
                                                                                    <SheetTitle className="flex items-center gap-2">
                                                                                        {getSeverityIcon(error.severity)}
                                                                                        {error.status === 'fixed' ? 'Resolved Issue' : 'Active Issue'}
                                                                                    </SheetTitle>
                                                                                    <SheetDescription>
                                                                                        <code className="text-xs bg-muted px-2 py-1 rounded">ID: {error.id}</code>
                                                                                    </SheetDescription>
                                                                                </SheetHeader>

                                                                                <div className="mt-6 space-y-6">
                                                                                    {/* Quick Actions */}
                                                                                    <div className="flex gap-2">
                                                                                        <Button size="sm" variant="outline" onClick={() => handleStatusChange(error.id, 'fixed')} className="flex-1 text-green-500 border-green-500/30 hover:bg-green-500/10">
                                                                                            <CheckCircle className="h-4 w-4 mr-1" /> Mark Fixed
                                                                                        </Button>
                                                                                        <Button size="sm" variant="outline" onClick={() => handleCopyPrompt(error)} className="flex-1 text-purple-500 border-purple-500/30 hover:bg-purple-500/10">
                                                                                            <Wand2 className="h-4 w-4 mr-1" /> AI Fix Prompt
                                                                                        </Button>
                                                                                    </div>

                                                                                    {/* Status Control */}
                                                                                    <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                                                                                        <div>
                                                                                            <Label className="text-xs uppercase text-muted-foreground mb-1">Status</Label>
                                                                                            <Select value={error.status} onValueChange={(v) => handleStatusChange(error.id, v)}>
                                                                                                <SelectTrigger className="h-9 bg-background">
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
                                                                                        <div>
                                                                                            <Label className="text-xs uppercase text-muted-foreground mb-1">Severity</Label>
                                                                                            <div className="flex items-center h-9 gap-2">
                                                                                                {getSeverityIcon(error.severity)}
                                                                                                <span className="capitalize font-medium">{error.severity}</span>
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>

                                                                                    {/* Error Message */}
                                                                                    <div>
                                                                                        <Label className="text-xs uppercase text-muted-foreground mb-2 flex items-center gap-1">
                                                                                            <AlertTriangle className="h-3 w-3" /> Error Message
                                                                                        </Label>
                                                                                        <div className="p-4 bg-red-500/10 text-red-400 rounded-lg text-sm font-mono break-words border border-red-500/30">
                                                                                            {error.error_message}
                                                                                        </div>
                                                                                    </div>

                                                                                    {/* AI Prompt Section */}
                                                                                    <div className="bg-slate-900 rounded-lg p-4">
                                                                                        <div className="flex justify-between items-center mb-3">
                                                                                            <Label className="text-sm font-medium flex items-center gap-2 text-white">
                                                                                                <Zap className="h-4 w-4 text-yellow-400" />
                                                                                                AI Auto-Fix Prompt
                                                                                            </Label>
                                                                                            <Button size="sm" className="bg-purple-600 hover:bg-purple-700" onClick={() => handleCopyPrompt(error)}>
                                                                                                <Copy className="h-3 w-3 mr-1" /> Copy
                                                                                            </Button>
                                                                                        </div>
                                                                                        <Textarea 
                                                                                            readOnly 
                                                                                            value={generateAiPrompt(error)} 
                                                                                            className="h-32 font-mono text-xs bg-slate-950 text-green-400 resize-none border-slate-800"
                                                                                        />
                                                                                    </div>

                                                                                    {/* Stack Trace */}
                                                                                    <div>
                                                                                        <Label className="text-xs uppercase text-muted-foreground mb-2 flex items-center gap-1">
                                                                                            <FileCode className="h-3 w-3" /> Stack Trace
                                                                                        </Label>
                                                                                        <div className="p-4 bg-muted/50 rounded-lg text-xs font-mono overflow-x-auto whitespace-pre-wrap max-h-48 border border-border">
                                                                                            {error.stack_trace || 'No stack trace available.'}
                                                                                        </div>
                                                                                    </div>

                                                                                    {/* Metadata */}
                                                                                    <div className="grid grid-cols-2 gap-3 text-sm bg-muted/50 p-4 rounded-lg">
                                                                                        <div>
                                                                                            <Label className="text-xs uppercase text-muted-foreground">Source</Label>
                                                                                            <div className="flex items-center gap-1 mt-1">
                                                                                                {getSourceIcon(error.source)}
                                                                                                <span>{error.source}</span>
                                                                                            </div>
                                                                                        </div>
                                                                                        <div>
                                                                                            <Label className="text-xs uppercase text-muted-foreground">Module</Label>
                                                                                            <p className="mt-1">{error.module_name || 'Unknown'}</p>
                                                                                        </div>
                                                                                        <div>
                                                                                            <Label className="text-xs uppercase text-muted-foreground">User Role</Label>
                                                                                            <p className="mt-1">{error.user_role || 'Unknown'}</p>
                                                                                        </div>
                                                                                        <div>
                                                                                            <Label className="text-xs uppercase text-muted-foreground">Frequency</Label>
                                                                                            <p className="mt-1">{error.frequency} occurrences</p>
                                                                                        </div>
                                                                                        <div className="col-span-2">
                                                                                            <Label className="text-xs uppercase text-muted-foreground">Page URL</Label>
                                                                                            <a href={error.page_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate block mt-1 text-xs font-mono">
                                                                                                {error.page_url}
                                                                                            </a>
                                                                                        </div>
                                                                                    </div>

                                                                                    {/* USER REPORT DETAILS - Show if source is user_report */}
                                                                                    {(error.source === 'user_report' || error.error_message?.startsWith('[USER REPORT]')) && (() => {
                                                                                        const meta = typeof error.metadata === 'string' ? JSON.parse(error.metadata || '{}') : (error.metadata || {});
                                                                                        return Object.keys(meta).length > 0 && (
                                                                                        <div className="space-y-4 p-4 bg-pink-50 dark:bg-pink-900/20 rounded-lg border border-pink-200 dark:border-pink-800">
                                                                                            <h4 className="font-semibold text-pink-700 dark:text-pink-300 flex items-center gap-2">
                                                                                                <User className="h-4 w-4" />
                                                                                                User Report Details
                                                                                            </h4>
                                                                                            
                                                                                            {/* Title & Description */}
                                                                                            {meta.title && (
                                                                                                <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-lg">
                                                                                                    <Label className="text-xs uppercase text-muted-foreground">Report Title</Label>
                                                                                                    <p className="mt-1 font-semibold text-lg">{meta.title}</p>
                                                                                                </div>
                                                                                            )}
                                                                                            
                                                                                            {meta.description && (
                                                                                                <div>
                                                                                                    <Label className="text-xs uppercase text-muted-foreground">Description</Label>
                                                                                                    <p className="mt-1 text-sm whitespace-pre-wrap bg-muted/50 p-3 rounded-lg">{meta.description}</p>
                                                                                                </div>
                                                                                            )}
                                                                                            
                                                                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                                                                <div>
                                                                                                    <Label className="text-xs uppercase text-muted-foreground">Category</Label>
                                                                                                    <p className="mt-1 font-medium capitalize">{meta.category?.replace('_', ' ') || 'N/A'}</p>
                                                                                                </div>
                                                                                                <div>
                                                                                                    <Label className="text-xs uppercase text-muted-foreground">Priority</Label>
                                                                                                    <Badge className={`mt-1 ${
                                                                                                        meta.priority === 'critical' ? 'bg-red-500' :
                                                                                                        meta.priority === 'high' ? 'bg-orange-500' :
                                                                                                        meta.priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                                                                                                    }`}>
                                                                                                        {meta.priority || 'N/A'}
                                                                                                    </Badge>
                                                                                                </div>
                                                                                                <div>
                                                                                                    <Label className="text-xs uppercase text-muted-foreground">Reporter Email</Label>
                                                                                                    <p className="mt-1 text-blue-600">{meta.reporter_email || 'Not provided'}</p>
                                                                                                </div>
                                                                                                <div>
                                                                                                    <Label className="text-xs uppercase text-muted-foreground">Reporter Name</Label>
                                                                                                    <p className="mt-1">{meta.reporter_name || 'N/A'}</p>
                                                                                                </div>
                                                                                                <div>
                                                                                                    <Label className="text-xs uppercase text-muted-foreground">Reporter Role</Label>
                                                                                                    <p className="mt-1 capitalize">{meta.reporter_role || 'N/A'}</p>
                                                                                                </div>
                                                                                                <div>
                                                                                                    <Label className="text-xs uppercase text-muted-foreground">Reported At</Label>
                                                                                                    <p className="mt-1">{meta.reported_at ? safeFormat(meta.reported_at, 'dd MMM yyyy HH:mm') : 'N/A'}</p>
                                                                                                </div>
                                                                                            </div>

                                                                                            {/* Steps to Reproduce */}
                                                                                            {meta.steps_to_reproduce && (
                                                                                                <div>
                                                                                                    <Label className="text-xs uppercase text-muted-foreground">Steps to Reproduce</Label>
                                                                                                    <p className="mt-1 text-sm whitespace-pre-wrap bg-muted/50 p-3 rounded-lg font-mono">{meta.steps_to_reproduce}</p>
                                                                                                </div>
                                                                                            )}

                                                                                            {/* Expected vs Actual */}
                                                                                            {(meta.expected_behavior || meta.actual_behavior) && (
                                                                                                <div className="grid grid-cols-2 gap-4">
                                                                                                    {meta.expected_behavior && (
                                                                                                        <div>
                                                                                                            <Label className="text-xs uppercase text-green-600">Expected Behavior</Label>
                                                                                                            <p className="mt-1 text-sm whitespace-pre-wrap bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">{meta.expected_behavior}</p>
                                                                                                        </div>
                                                                                                    )}
                                                                                                    {meta.actual_behavior && (
                                                                                                        <div>
                                                                                                            <Label className="text-xs uppercase text-red-600">Actual Behavior</Label>
                                                                                                            <p className="mt-1 text-sm whitespace-pre-wrap bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">{meta.actual_behavior}</p>
                                                                                                        </div>
                                                                                                    )}
                                                                                                </div>
                                                                                            )}

                                                                                            {/* Device Info */}
                                                                                            {meta.device && (
                                                                                                <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-lg">
                                                                                                    <Label className="text-xs uppercase text-muted-foreground mb-2 block">Device Information</Label>
                                                                                                    <div className="grid grid-cols-3 gap-2 text-xs">
                                                                                                        <div><span className="text-muted-foreground">Browser:</span> {meta.device.browser}</div>
                                                                                                        <div><span className="text-muted-foreground">OS:</span> {meta.device.os}</div>
                                                                                                        <div><span className="text-muted-foreground">Screen:</span> {meta.device.screenSize}</div>
                                                                                                    </div>
                                                                                                </div>
                                                                                            )}

                                                                                            {/* Screenshot */}
                                                                                            {meta.screenshot_data && (
                                                                                                <div>
                                                                                                    <Label className="text-xs uppercase text-muted-foreground mb-2 block">Screenshot</Label>
                                                                                                    <div className="border border-border rounded-lg overflow-hidden">
                                                                                                        <img 
                                                                                                            src={meta.screenshot_data} 
                                                                                                            alt="User Screenshot" 
                                                                                                            className="w-full max-h-96 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                                                                                                            onClick={() => window.open(meta.screenshot_data, '_blank')}
                                                                                                            title="Click to view full size"
                                                                                                        />
                                                                                                    </div>
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                    );
                                                                                    })()}
                                                                                </div>
                                                                            </SheetContent>
                                                                        </Sheet>
                                                                        <Button 
                                                                            variant="ghost" 
                                                                            size="sm" 
                                                                            className="h-7 px-2 text-green-600 hover:bg-green-50"
                                                                            onClick={(e) => { e.stopPropagation(); handleStatusChange(error.id, 'fixed'); }}
                                                                        >
                                                                            <CheckCircle className="h-3 w-3" />
                                                                        </Button>
                                                                    </div>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </>
                )}
            </div>
        </DashboardLayout>
    );
};

export default QueriesFinder;
