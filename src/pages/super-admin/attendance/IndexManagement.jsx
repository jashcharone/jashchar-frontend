// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// JASHCHAR ERP - FAISS INDEX MANAGEMENT PAGE (DAY 17)
// Manage FAISS vector indexes for face recognition system
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { aiEngineApi } from '@/services/aiEngineApi';
import { formatDate, formatDateTime } from '@/utils/dateUtils';

import {
    Database, RefreshCw, Settings, Loader2, CheckCircle2, XCircle, AlertTriangle,
    HardDrive, Cpu, Clock, Users, TrendingUp, Activity, Zap, Shield, FileCode,
    BarChart3, PlayCircle, PauseCircle, Trash2, Download, Upload, Info, Server,
    Boxes, GitBranch, LayersIcon, Search, Brain
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// INDEX STATUS CARD
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

const IndexStatusCard = ({ index, onRebuild, isRebuilding }) => {
    const getStatusColor = () => {
        if (index.is_building) return 'bg-yellow-500';
        if (index.total_faces > 0) return 'bg-green-500';
        return 'bg-gray-400';
    };

    const getStatusText = () => {
        if (index.is_building) return 'Building...';
        if (index.total_faces > 0) return 'Active';
        return 'Empty';
    };

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor()} animate-pulse`} />
                        <CardTitle className="text-base">{index.index_name || 'Default Index'}</CardTitle>
                    </div>
                    <Badge variant="outline" className="text-xs">
                        {getStatusText()}
                    </Badge>
                </div>
                <CardDescription className="text-xs">
                    Branch: {index.branch_id?.slice(0, 8)}...
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-500" />
                        <div>
                            <p className="font-semibold">{index.total_faces || 0}</p>
                            <p className="text-xs text-muted-foreground">Faces</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Boxes className="w-4 h-4 text-purple-500" />
                        <div>
                            <p className="font-semibold">{index.embedding_dimension || 512}D</p>
                            <p className="text-xs text-muted-foreground">Dimension</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <HardDrive className="w-4 h-4 text-amber-500" />
                        <div>
                            <p className="font-semibold">{formatBytes(index.index_file_size_bytes)}</p>
                            <p className="text-xs text-muted-foreground">Size</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-green-500" />
                        <div>
                            <p className="font-semibold">{index.build_duration_seconds || 0}s</p>
                            <p className="text-xs text-muted-foreground">Build Time</p>
                        </div>
                    </div>
                </div>
                
                {index.last_build_at && (
                    <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-muted-foreground">
                            Last built: {formatDateTime(index.last_build_at)}
                        </p>
                    </div>
                )}
            </CardContent>
            <CardFooter className="pt-0">
                <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => onRebuild(index)}
                    disabled={isRebuilding || index.is_building}
                >
                    {isRebuilding || index.is_building ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                        <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    Rebuild Index
                </Button>
            </CardFooter>
        </Card>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// AI ENGINE STATUS PANEL
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

const AIEngineStatusPanel = ({ status, loading }) => {
    if (loading) {
        return (
            <Card>
                <CardContent className="py-6">
                    <div className="flex items-center justify-center gap-3">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        <span>Checking AI Engine status...</span>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!status) {
        return (
            <Alert variant="destructive">
                <XCircle className="w-4 h-4" />
                <AlertTitle>AI Engine Unavailable</AlertTitle>
                <AlertDescription>
                    Cannot connect to the Python AI Engine. Please ensure it's running on port 8501.
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <Card className="border-green-500/50 bg-green-500/5">
            <CardContent className="py-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-green-500/10">
                        <Server className="w-8 h-8 text-green-500" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold">AI Engine Online</h3>
                            <Badge className="bg-green-500">Healthy</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                            {status.ai_models?.face_detection?.model || 'RetinaFace'} + {status.ai_models?.face_recognition?.model || 'ArcFace'} + FAISS
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                            <p className="text-2xl font-bold text-green-600">
                                {status.ai_models?.face_detection?.loaded ? '✓' : '×'}
                            </p>
                            <p className="text-xs text-muted-foreground">Detection</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-green-600">
                                {status.ai_models?.face_recognition?.loaded ? '✓' : '×'}
                            </p>
                            <p className="text-xs text-muted-foreground">Recognition</p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// ENROLLMENT STATISTICS PANEL
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

const EnrollmentStatsPanel = ({ stats, loading }) => {
    if (loading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                    <Card key={i}>
                        <CardContent className="py-4">
                            <Skeleton className="h-8 w-16 mb-2" />
                            <Skeleton className="h-4 w-24" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    const statItems = [
        { label: 'Total Enrolled', value: stats?.total || 0, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { label: 'Students', value: stats?.by_type?.student || 0, icon: Users, color: 'text-green-500', bg: 'bg-green-500/10' },
        { label: 'Staff', value: stats?.by_type?.staff || 0, icon: Users, color: 'text-amber-500', bg: 'bg-amber-500/10' },
        { label: 'Visitors', value: stats?.by_type?.visitor || 0, icon: Users, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statItems.map((item, index) => (
                <Card key={index}>
                    <CardContent className="py-4">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${item.bg}`}>
                                <item.icon className={`w-5 h-5 ${item.color}`} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{item.value}</p>
                                <p className="text-xs text-muted-foreground">{item.label}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// REBUILD PROGRESS DIALOG
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

const RebuildProgressDialog = ({ open, onClose, progress, status }) => {
    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Brain className="w-5 h-5 text-primary" />
                        Rebuilding FAISS Index
                    </DialogTitle>
                    <DialogDescription>
                        This process may take a few minutes depending on the number of enrolled faces.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                    <div className="flex items-center gap-3">
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                        <span className="text-sm">{status}</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <p className="text-center text-sm text-muted-foreground">{progress}% Complete</p>
                </div>
                
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={progress < 100}>
                        {progress >= 100 ? 'Close' : 'Please wait...'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

function formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// MAIN INDEX MANAGEMENT COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

const IndexManagement = () => {
    const { user, organizationId } = useAuth();
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    
    const branchId = selectedBranch?.id || user?.profile?.branch_id;
    
    // State
    const [loading, setLoading] = useState(true);
    const [aiEngineStatus, setAiEngineStatus] = useState(null);
    const [indexes, setIndexes] = useState([]);
    const [enrollmentStats, setEnrollmentStats] = useState(null);
    const [statsLoading, setStatsLoading] = useState(true);
    
    // Rebuild state
    const [rebuildDialogOpen, setRebuildDialogOpen] = useState(false);
    const [rebuildProgress, setRebuildProgress] = useState(0);
    const [rebuildStatus, setRebuildStatus] = useState('');
    const [isRebuilding, setIsRebuilding] = useState(false);
    
    // Fetch all data
    const fetchData = useCallback(async () => {
        setLoading(true);
        setStatsLoading(true);
        
        try {
            // Check AI Engine health
            try {
                const health = await aiEngineApi.checkHealth();
                if (health?.success) {
                    // Get detailed status via backend proxy
                    try {
                        const statusResp = await aiEngineApi.getAIStatus();
                        setAiEngineStatus(statusResp?.data || null);
                    } catch {
                        // Fallback to health data
                        setAiEngineStatus(health.data);
                    }
                } else {
                    setAiEngineStatus(null);
                }
            } catch {
                setAiEngineStatus(null);
            }
            
            // Get index status
            try {
                const indexStatus = await aiEngineApi.getIndexStatus();
                if (indexStatus?.success) {
                    setIndexes(indexStatus.data?.indexes || [indexStatus.data]);
                }
            } catch (error) {
                console.error('Failed to get index status:', error);
            }
            
            // Get enrollment counts
            try {
                const counts = await aiEngineApi.getEnrollmentCount();
                if (counts?.success) {
                    setEnrollmentStats(counts.data);
                }
            } catch (error) {
                console.error('Failed to get enrollment counts:', error);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to fetch index data'
            });
        }
        
        setLoading(false);
        setStatsLoading(false);
    }, [branchId, toast]);
    
    useEffect(() => {
        if (branchId) {
            fetchData();
        }
    }, [branchId, fetchData]);
    
    // Handle index rebuild
    const handleRebuildIndex = async (index) => {
        setIsRebuilding(true);
        setRebuildDialogOpen(true);
        setRebuildProgress(0);
        setRebuildStatus('Initializing rebuild...');
        
        try {
            // Simulate progress steps
            const steps = [
                { progress: 10, status: 'Fetching enrolled embeddings...' },
                { progress: 30, status: 'Clearing old index...' },
                { progress: 50, status: 'Building new FAISS index...' },
                { progress: 70, status: 'Adding embeddings to index...' },
                { progress: 90, status: 'Optimizing index...' },
            ];
            
            for (const step of steps) {
                setRebuildProgress(step.progress);
                setRebuildStatus(step.status);
                await new Promise(r => setTimeout(r, 800));
            }
            
            // Actually trigger rebuild
            await aiEngineApi.rebuildIndex();
            
            setRebuildProgress(100);
            setRebuildStatus('Index rebuilt successfully!');
            
            toast({
                title: '✅ Index Rebuilt',
                description: 'FAISS index has been rebuilt successfully'
            });
            
            // Refresh data
            await fetchData();
        } catch (error) {
            console.error('Rebuild error:', error);
            toast({
                variant: 'destructive',
                title: 'Rebuild Failed',
                description: error.message
            });
        }
        
        setIsRebuilding(false);
    };
    
    return (
        <DashboardLayout>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Database className="w-8 h-8 text-primary" />
                    <div>
                        <h1 className="text-2xl font-bold">FAISS Index Management</h1>
                        <p className="text-sm text-muted-foreground">
                            Manage face recognition vector indexes
                        </p>
                    </div>
                </div>
                <Button onClick={fetchData} variant="outline" disabled={loading}>
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>
            
            <div className="space-y-6">
                {/* AI Engine Status */}
                <AIEngineStatusPanel status={aiEngineStatus} loading={loading} />
                
                {/* Enrollment Statistics */}
                <div>
                    <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-primary" />
                        Enrollment Statistics
                    </h2>
                    <EnrollmentStatsPanel stats={enrollmentStats} loading={statsLoading} />
                </div>
                
                {/* Index Cards */}
                <div>
                    <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <LayersIcon className="w-5 h-5 text-primary" />
                        FAISS Indexes
                    </h2>
                    
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[1, 2, 3].map(i => (
                                <Card key={i}>
                                    <CardContent className="py-6">
                                        <Skeleton className="h-32 w-full" />
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : indexes.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {indexes.map((index, i) => (
                                <IndexStatusCard 
                                    key={index.id || i}
                                    index={index}
                                    onRebuild={handleRebuildIndex}
                                    isRebuilding={isRebuilding}
                                />
                            ))}
                        </div>
                    ) : (
                        <Alert>
                            <Info className="w-4 h-4" />
                            <AlertTitle>No Indexes Found</AlertTitle>
                            <AlertDescription>
                                Enroll faces to automatically create a FAISS index for this branch.
                            </AlertDescription>
                        </Alert>
                    )}
                </div>
                
                {/* Index Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Info className="w-5 h-5 text-blue-500" />
                            About FAISS Indexes
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <h4 className="font-medium flex items-center gap-2">
                                    <Zap className="w-4 h-4 text-amber-500" />
                                    Ultra-Fast Search
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                    FAISS enables searching through 100,000+ face embeddings in under 10ms.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-medium flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-green-500" />
                                    Branch Isolation
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                    Each branch has its own isolated index for security and privacy.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-medium flex items-center gap-2">
                                    <Brain className="w-4 h-4 text-purple-500" />
                                    512D ArcFace Embeddings
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                    High-accuracy 512-dimensional face embeddings with 99%+ recognition rate.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-medium flex items-center gap-2">
                                    <RefreshCw className="w-4 h-4 text-blue-500" />
                                    Auto-Sync
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                    Index automatically updates when new faces are enrolled.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
            
            {/* Rebuild Progress Dialog */}
            <RebuildProgressDialog 
                open={rebuildDialogOpen}
                onClose={() => setRebuildDialogOpen(false)}
                progress={rebuildProgress}
                status={rebuildStatus}
            />
        </DashboardLayout>
    );
};

export default IndexManagement;
