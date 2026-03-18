import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import api from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
    AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import {
    AlertTriangle, Shield, CheckCircle, Clock, MapPin, Phone,
    Bus, RefreshCw, Eye, Filter, Search
} from 'lucide-react';

const STATUS_CONFIG = {
    active: { label: 'ACTIVE', color: 'bg-red-600 text-white animate-pulse', icon: AlertTriangle },
    investigating: { label: 'Investigating', color: 'bg-orange-100 text-orange-700', icon: Eye },
    resolved: { label: 'Resolved', color: 'bg-green-100 text-green-700', icon: CheckCircle }
};

const TRIGGER_LABELS = {
    driver: '👨‍✈️ Driver',
    parent: '👤 Parent',
    admin: '🛡️ Admin',
    system: '🤖 System'
};

export default function SOSAlerts() {
    const { user, organizationId } = useAuth();
    const { selectedBranch } = useBranch();
    const branchId = selectedBranch?.id || user?.profile?.branch_id;

    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState('active');
    const [selectedAlert, setSelectedAlert] = useState(null);
    const [resolveDialog, setResolveDialog] = useState(null);
    const [resolutionNotes, setResolutionNotes] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // ═══════════════════════════════════════════════════════════════
    // FETCH SOS ALERTS
    // ═══════════════════════════════════════════════════════════════
    const fetchAlerts = useCallback(async () => {
        if (!branchId) return;
        setLoading(true);
        try {
            const res = await api.get('/transport/sos', {
                params: { branchId, organizationId, status: statusFilter }
            });
            if (res.data.success) setAlerts(res.data.data || []);
        } catch { toast.error('Failed to load SOS alerts'); }
        finally { setLoading(false); }
    }, [branchId, organizationId, statusFilter]);

    useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

    // Auto-refresh every 10s for active alerts
    useEffect(() => {
        if (statusFilter === 'active') {
            const interval = setInterval(fetchAlerts, 10000);
            return () => clearInterval(interval);
        }
    }, [statusFilter, fetchAlerts]);

    // ═══════════════════════════════════════════════════════════════
    // RESOLVE SOS
    // ═══════════════════════════════════════════════════════════════
    const handleResolve = async () => {
        if (!resolveDialog) return;
        try {
            await api.put(`/transport/sos/${resolveDialog}/resolve`, {
                resolution_notes: resolutionNotes,
                branchId, organizationId
            });
            toast.success('SOS alert resolved');
            setResolveDialog(null);
            setResolutionNotes('');
            fetchAlerts();
        } catch { toast.error('Failed to resolve'); }
    };

    // Stats
    const activeCount = alerts.filter(a => a.status === 'active').length;
    const investigatingCount = alerts.filter(a => a.status === 'investigating').length;
    const resolvedCount = alerts.filter(a => a.status === 'resolved').length;

    const getTimeSince = (date) => {
        const mins = Math.round((Date.now() - new Date(date).getTime()) / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        if (mins < 1440) return `${Math.round(mins / 60)}h ago`;
        return `${Math.round(mins / 1440)}d ago`;
    };

    return (
        <DashboardLayout>
            <div className="p-4 space-y-4">
                {/* ═══════ HEADER ═══════ */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Shield className="h-6 w-6 text-red-600" />
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Emergency SOS Dashboard</h1>
                            <p className="text-sm text-gray-500">Real-time emergency alerts from drivers and parents</p>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={fetchAlerts} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} /> Refresh
                    </Button>
                </div>

                {/* ═══════ STATS ═══════ */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className={`rounded-xl p-4 border shadow-sm ${activeCount > 0 ? 'bg-red-50 border-red-200 dark:bg-red-950/30' : 'bg-white dark:bg-gray-800'}`}>
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${activeCount > 0 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-400'}`}>
                                <AlertTriangle className="h-6 w-6" />
                            </div>
                            <div>
                                <p className={`text-3xl font-bold ${activeCount > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                                    {activeCount}
                                </p>
                                <p className="text-xs text-gray-500">Active Emergencies</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-orange-100 text-orange-600">
                                <Eye className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white">{investigatingCount}</p>
                                <p className="text-xs text-gray-500">Under Investigation</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-green-100 text-green-600">
                                <CheckCircle className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white">{resolvedCount}</p>
                                <p className="text-xs text-gray-500">Resolved</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Active Emergency Banner */}
                {activeCount > 0 && (
                    <div className="bg-red-600 text-white rounded-xl p-4 flex items-center gap-3 animate-pulse shadow-lg">
                        <AlertTriangle className="h-8 w-8 flex-shrink-0" />
                        <div>
                            <h3 className="font-bold text-lg">⚠️ ACTIVE SOS ALERT{activeCount > 1 ? 'S' : ''}</h3>
                            <p className="text-red-100 text-sm">
                                {activeCount} emergency alert{activeCount > 1 ? 's' : ''} require{activeCount === 1 ? 's' : ''} immediate attention
                            </p>
                        </div>
                    </div>
                )}

                {/* ═══════ FILTER TABS + SEARCH ═══════ */}
                <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex gap-1">
                        {[
                            { key: 'active', label: '🔴 Active', count: activeCount },
                            { key: 'investigating', label: '🟠 Investigating', count: investigatingCount },
                            { key: 'resolved', label: '🟢 Resolved', count: resolvedCount },
                            { key: 'all', label: 'All', count: alerts.length }
                        ].map(f => (
                            <button key={f.key}
                                onClick={() => setStatusFilter(f.key)}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                                    statusFilter === f.key
                                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200'
                                }`}
                            >
                                {f.label} ({f.count})
                            </button>
                        ))}
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input className="pl-9 w-[200px] h-8" placeholder="Search alerts..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                </div>

                {/* ═══════ SOS ALERT LIST ═══════ */}
                {alerts.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center shadow-sm border">
                        <Shield className="h-16 w-16 mx-auto text-green-200 mb-4" />
                        <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300">All Clear</h3>
                        <p className="text-gray-400 mt-1">No emergency alerts at this time</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {alerts.filter(alert => {
                            if (!searchTerm) return true;
                            const term = searchTerm.toLowerCase();
                            return (alert.description || '').toLowerCase().includes(term) ||
                                (alert.trigger_type || '').toLowerCase().includes(term) ||
                                (alert.transport_vehicles?.vehicle_number || '').toLowerCase().includes(term) ||
                                (alert.status || '').toLowerCase().includes(term);
                        }).map(alert => {
                            const config = STATUS_CONFIG[alert.status] || STATUS_CONFIG.active;
                            const StatusIcon = config.icon;

                            return (
                                <div key={alert.id}
                                    className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border overflow-hidden
                                        ${alert.status === 'active' ? 'border-red-300 ring-2 ring-red-100 dark:ring-red-900/50' : ''}
                                    `}
                                >
                                    <div className="p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-start gap-3">
                                                <div className={`p-2 rounded-lg ${
                                                    alert.status === 'active'
                                                        ? 'bg-red-100 text-red-600'
                                                        : alert.status === 'investigating'
                                                            ? 'bg-orange-100 text-orange-600'
                                                            : 'bg-green-100 text-green-600'
                                                }`}>
                                                    <StatusIcon className="h-6 w-6" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h4 className="font-bold text-gray-900 dark:text-white">
                                                            🆘 Emergency SOS
                                                        </h4>
                                                        <Badge className={config.color}>{config.label}</Badge>
                                                        <Badge variant="outline" className="text-xs">
                                                            {TRIGGER_LABELS[alert.trigger_type] || alert.trigger_type}
                                                        </Badge>
                                                    </div>
                                                    {alert.description && (
                                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                            {alert.description}
                                                        </p>
                                                    )}
                                                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 flex-wrap">
                                                        {alert.transport_vehicles?.vehicle_number && (
                                                            <span className="flex items-center gap-1">
                                                                <Bus className="h-3 w-3" />
                                                                {alert.transport_vehicles.vehicle_number}
                                                            </span>
                                                        )}
                                                        {alert.latitude && alert.longitude && (
                                                            <a
                                                                href={`https://www.openstreetmap.org/?mlat=${alert.latitude}&mlon=${alert.longitude}#map=16/${alert.latitude}/${alert.longitude}`}
                                                                target="_blank" rel="noopener noreferrer"
                                                                className="flex items-center gap-1 text-blue-600 hover:underline"
                                                            >
                                                                <MapPin className="h-3 w-3" />
                                                                View Location
                                                            </a>
                                                        )}
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            {getTimeSince(alert.created_at)}
                                                        </span>
                                                    </div>
                                                    {alert.resolution_notes && (
                                                        <div className="mt-2 bg-green-50 dark:bg-green-900/20 p-2 rounded text-sm text-green-700 dark:text-green-300">
                                                            <strong>Resolution:</strong> {alert.resolution_notes}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            {alert.status !== 'resolved' && (
                                                <Button variant="destructive" size="sm"
                                                    onClick={() => {
                                                        setResolveDialog(alert.id);
                                                        setResolutionNotes('');
                                                    }}
                                                >
                                                    <CheckCircle className="h-4 w-4 mr-1" /> Resolve
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Resolve Dialog */}
                <AlertDialog open={!!resolveDialog} onOpenChange={() => setResolveDialog(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Resolve SOS Alert</AlertDialogTitle>
                            <AlertDialogDescription>
                                Confirm that the emergency has been handled and resolved.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="py-2">
                            <Textarea
                                placeholder="Resolution notes (what action was taken)..."
                                value={resolutionNotes}
                                onChange={e => setResolutionNotes(e.target.value)}
                                rows={3}
                            />
                        </div>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleResolve} className="bg-green-600 hover:bg-green-700">
                                <CheckCircle className="h-4 w-4 mr-1" /> Mark Resolved
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </DashboardLayout>
    );
}
