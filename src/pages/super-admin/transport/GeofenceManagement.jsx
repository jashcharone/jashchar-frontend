import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Circle, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import api from '@/services/api';
import { formatDateTime } from '@/utils/dateUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
    AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import {
    Shield, Plus, Pencil, Trash2, MapPin, AlertTriangle, CheckCircle,
    Clock, Gauge, Eye, Radio, Search
} from 'lucide-react';

const ZONE_TYPES = [
    { value: 'school', label: 'School Campus', color: '#22c55e' },
    { value: 'route_corridor', label: 'Route Corridor', color: '#3b82f6' },
    { value: 'restricted', label: 'Restricted Area', color: '#ef4444' },
    { value: 'pickup_zone', label: 'Pickup Zone', color: '#f59e0b' },
    { value: 'speed_zone', label: 'Speed Zone', color: '#8b5cf6' }
];

const SEVERITY_COLORS = {
    critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#22c55e', info: '#3b82f6'
};

// Map click handler component
const MapClickHandler = ({ onClick }) => {
    useMapEvents({ click: (e) => onClick(e.latlng) });
    return null;
};

export default function GeofenceManagement() {
    const { user, organizationId } = useAuth();
    const { selectedBranch } = useBranch();
    const branchId = selectedBranch?.id || user?.profile?.branch_id;

    // Geofence state
    const [geofences, setGeofences] = useState([]);
    const [formData, setFormData] = useState({
        zone_name: '', zone_type: 'school', center_latitude: '',
        center_longitude: '', radius_meters: 500, speed_limit: 40, is_active: true
    });
    const [editingId, setEditingId] = useState(null);
    const [deleteId, setDeleteId] = useState(null);
    const [isPlacing, setIsPlacing] = useState(false);

    // Alert state
    const [alerts, setAlerts] = useState([]);
    const [alertFilter, setAlertFilter] = useState('unresolved');

    // Active tab
    const [activeTab, setActiveTab] = useState('zones');
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const DEFAULT_CENTER = [15.3173, 75.7139]; // Karnataka

    // ═══════════════════════════════════════════════════════════════
    // FETCH DATA
    // ═══════════════════════════════════════════════════════════════
    const fetchGeofences = useCallback(async () => {
        if (!branchId) return;
        try {
            const res = await api.get('/transport/geofences', { params: { branchId, organizationId } });
            if (res.data.success) setGeofences(res.data.data || []);
        } catch { toast.error('Failed to load geofences'); }
    }, [branchId, organizationId]);

    const fetchAlerts = useCallback(async () => {
        if (!branchId) return;
        try {
            const params = { branchId, organizationId, limit: 100 };
            if (alertFilter === 'unresolved') params.is_resolved = false;
            if (alertFilter === 'resolved') params.is_resolved = true;
            const res = await api.get('/transport/alerts', { params });
            if (res.data.success) setAlerts(res.data.data || []);
        } catch { toast.error('Failed to load alerts'); }
    }, [branchId, organizationId, alertFilter]);

    useEffect(() => { fetchGeofences(); }, [fetchGeofences]);
    useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

    // ═══════════════════════════════════════════════════════════════
    // GEOFENCE CRUD
    // ═══════════════════════════════════════════════════════════════
    const handleSave = async () => {
        if (!formData.zone_name || !formData.center_latitude || !formData.center_longitude) {
            return toast.error('Zone name and location are required');
        }
        setLoading(true);
        try {
            const payload = {
                ...formData,
                center_latitude: parseFloat(formData.center_latitude),
                center_longitude: parseFloat(formData.center_longitude),
                radius_meters: parseInt(formData.radius_meters),
                speed_limit: parseInt(formData.speed_limit),
                branch_id: branchId,
                organization_id: organizationId
            };
            if (editingId) {
                await api.put(`/transport/geofences/${editingId}`, payload);
                toast.success('Geofence updated');
            } else {
                await api.post('/transport/geofences', payload);
                toast.success('Geofence created');
            }
            resetForm();
            fetchGeofences();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Save failed');
        } finally { setLoading(false); }
    };

    const handleEdit = (gf) => {
        setEditingId(gf.id);
        setFormData({
            zone_name: gf.zone_name, zone_type: gf.zone_type,
            center_latitude: gf.center_latitude, center_longitude: gf.center_longitude,
            radius_meters: gf.radius_meters, speed_limit: gf.speed_limit,
            is_active: gf.is_active
        });
    };

    const handleDelete = async () => {
        try {
            await api.delete(`/transport/geofences/${deleteId}`, { params: { branchId } });
            toast.success('Geofence deleted');
            setDeleteId(null);
            fetchGeofences();
        } catch { toast.error('Delete failed'); }
    };

    const resetForm = () => {
        setEditingId(null);
        setFormData({
            zone_name: '', zone_type: 'school', center_latitude: '',
            center_longitude: '', radius_meters: 500, speed_limit: 40, is_active: true
        });
        setIsPlacing(false);
    };

    // Map click to set coordinates
    const handleMapClick = (latlng) => {
        if (!isPlacing) return;
        setFormData(prev => ({
            ...prev,
            center_latitude: latlng.lat.toFixed(7),
            center_longitude: latlng.lng.toFixed(7)
        }));
        setIsPlacing(false);
    };

    // ═══════════════════════════════════════════════════════════════
    // ALERT ACTIONS
    // ═══════════════════════════════════════════════════════════════
    const handleResolveAlert = async (alertId) => {
        try {
            await api.put(`/transport/alerts/${alertId}/resolve`, {
                resolved_by: user?.id, branchId, organizationId
            });
            toast.success('Alert resolved');
            fetchAlerts();
        } catch { toast.error('Failed to resolve alert'); }
    };

    const handleMarkAllRead = async () => {
        try {
            await api.put('/transport/alerts/mark-read', { branchId, organizationId });
            toast.success('All alerts marked as read');
            fetchAlerts();
        } catch { toast.error('Failed'); }
    };

    // Zone color lookup
    const getZoneColor = (type) => ZONE_TYPES.find(z => z.value === type)?.color || '#6b7280';

    // Stats
    const totalZones = geofences.length;
    const activeZones = geofences.filter(g => g.is_active).length;
    const unresolvedAlerts = alerts.filter(a => !a.is_resolved).length;
    const criticalAlerts = alerts.filter(a => a.severity === 'critical' && !a.is_resolved).length;

    return (
        <DashboardLayout>
            <div className="p-4 space-y-4">
                {/* ═══════ HEADER ═══════ */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Shield className="h-6 w-6 text-purple-600" />
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Geofencing & Speed Monitoring</h1>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input className="pl-9 w-[220px] h-8" placeholder="Search zones/alerts..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                </div>

                {/* ═══════ STATS ═══════ */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                        { label: 'Total Zones', value: totalZones, icon: MapPin, color: 'text-blue-600 bg-blue-50' },
                        { label: 'Active Zones', value: activeZones, icon: Radio, color: 'text-green-600 bg-green-50' },
                        { label: 'Unresolved Alerts', value: unresolvedAlerts, icon: AlertTriangle, color: 'text-yellow-600 bg-yellow-50' },
                        { label: 'Critical Alerts', value: criticalAlerts, icon: AlertTriangle, color: 'text-red-600 bg-red-50' }
                    ].map((s, i) => (
                        <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${s.color}`}><s.icon className="h-5 w-5" /></div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
                                    <p className="text-xs text-gray-500">{s.label}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ═══════ TABS ═══════ */}
                <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-fit">
                    {[
                        { key: 'zones', label: '🗺️ Geofence Zones' },
                        { key: 'alerts', label: '🚨 Alert Dashboard' }
                    ].map(t => (
                        <button
                            key={t.key}
                            onClick={() => setActiveTab(t.key)}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                                activeTab === t.key
                                    ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >{t.label}</button>
                    ))}
                </div>

                {/* ═══════ ZONES TAB ═══════ */}
                {activeTab === 'zones' && (
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                        {/* Form Panel */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border p-4 space-y-3">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                                {editingId ? '✏️ Edit Zone' : '➕ New Geofence Zone'}
                            </h3>

                            <div>
                                <Label>Zone Name *</Label>
                                <Input value={formData.zone_name}
                                    onChange={e => setFormData(p => ({ ...p, zone_name: e.target.value }))}
                                    placeholder="e.g. School Campus" />
                            </div>

                            <div>
                                <Label>Zone Type</Label>
                                <select value={formData.zone_type}
                                    onChange={e => setFormData(p => ({ ...p, zone_type: e.target.value }))}
                                    className="w-full border rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700"
                                >
                                    {ZONE_TYPES.map(z => (
                                        <option key={z.value} value={z.value}>{z.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <Label>Latitude *</Label>
                                    <Input type="number" step="0.0000001" value={formData.center_latitude}
                                        onChange={e => setFormData(p => ({ ...p, center_latitude: e.target.value }))}
                                        placeholder="15.3173" />
                                </div>
                                <div>
                                    <Label>Longitude *</Label>
                                    <Input type="number" step="0.0000001" value={formData.center_longitude}
                                        onChange={e => setFormData(p => ({ ...p, center_longitude: e.target.value }))}
                                        placeholder="75.7139" />
                                </div>
                            </div>

                            <Button variant="outline" size="sm" className="w-full"
                                onClick={() => setIsPlacing(!isPlacing)}
                            >
                                <MapPin className="h-4 w-4 mr-1" />
                                {isPlacing ? '🟢 Click on map to set location' : 'Pick location on map'}
                            </Button>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <Label>Radius (meters)</Label>
                                    <Input type="number" value={formData.radius_meters}
                                        onChange={e => setFormData(p => ({ ...p, radius_meters: e.target.value }))}
                                        placeholder="500" />
                                </div>
                                <div>
                                    <Label>Speed Limit (km/h)</Label>
                                    <Input type="number" value={formData.speed_limit}
                                        onChange={e => setFormData(p => ({ ...p, speed_limit: e.target.value }))}
                                        placeholder="40" />
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <input type="checkbox" id="isActive" checked={formData.is_active}
                                    onChange={e => setFormData(p => ({ ...p, is_active: e.target.checked }))}
                                    className="rounded" />
                                <Label htmlFor="isActive">Active</Label>
                            </div>

                            <div className="flex gap-2">
                                <Button onClick={handleSave} disabled={loading} className="flex-1">
                                    {loading ? 'Saving...' : editingId ? 'Update' : 'Create Zone'}
                                </Button>
                                {editingId && (
                                    <Button variant="outline" onClick={resetForm}>Cancel</Button>
                                )}
                            </div>

                            {/* Zone List */}
                            <div className="border-t pt-3 mt-3 space-y-2">
                                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Zones ({geofences.length})
                                </h4>
                                {geofences.filter(gf => {
                                    if (!searchTerm) return true;
                                    const term = searchTerm.toLowerCase();
                                    return (gf.zone_name || '').toLowerCase().includes(term) ||
                                        (gf.zone_type || '').toLowerCase().includes(term);
                                }).map(gf => (
                                    <div key={gf.id}
                                        className="flex items-center justify-between p-2 rounded-lg border bg-gray-50 dark:bg-gray-700"
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: getZoneColor(gf.zone_type) }} />
                                            <div>
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {gf.zone_name}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {gf.radius_meters}m • {gf.speed_limit} km/h
                                                    {!gf.is_active && ' • Inactive'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button variant="ghost" size="sm"
                                                onClick={() => handleEdit(gf)}>
                                                <Pencil className="h-3 w-3" />
                                            </Button>
                                            <Button variant="ghost" size="sm"
                                                onClick={() => setDeleteId(gf.id)}>
                                                <Trash2 className="h-3 w-3 text-red-500" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Map Panel */}
                        <div className="xl:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border overflow-hidden"
                            style={{ minHeight: '500px' }}
                        >
                            <MapContainer
                                center={DEFAULT_CENTER}
                                zoom={10}
                                className="h-full w-full"
                                style={{ minHeight: '500px' }}
                            >
                                <TileLayer
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                                <MapClickHandler onClick={handleMapClick} />

                                {/* Geofence Circles */}
                                {geofences.map(gf => (
                                    gf.center_latitude && gf.center_longitude && (
                                        <React.Fragment key={gf.id}>
                                            <Circle
                                                center={[parseFloat(gf.center_latitude), parseFloat(gf.center_longitude)]}
                                                radius={gf.radius_meters || 500}
                                                pathOptions={{
                                                    color: getZoneColor(gf.zone_type),
                                                    fillColor: getZoneColor(gf.zone_type),
                                                    fillOpacity: 0.15,
                                                    weight: 2,
                                                    dashArray: gf.is_active ? '' : '8, 6'
                                                }}
                                            >
                                                <Popup>
                                                    <div className="text-sm">
                                                        <strong>{gf.zone_name}</strong>
                                                        <div className="text-xs text-gray-500 mt-1">
                                                            Type: {ZONE_TYPES.find(z => z.value === gf.zone_type)?.label}<br />
                                                            Radius: {gf.radius_meters}m<br />
                                                            Speed Limit: {gf.speed_limit} km/h<br />
                                                            Status: {gf.is_active ? '✅ Active' : '❌ Inactive'}
                                                        </div>
                                                    </div>
                                                </Popup>
                                            </Circle>
                                            <Marker
                                                position={[parseFloat(gf.center_latitude), parseFloat(gf.center_longitude)]}
                                                icon={L.divIcon({
                                                    className: 'geofence-label',
                                                    html: `<div style="background:${getZoneColor(gf.zone_type)};color:white;padding:2px 6px;border-radius:4px;font-size:11px;white-space:nowrap;font-weight:600;box-shadow:0 1px 3px rgba(0,0,0,0.3)">${gf.zone_name}</div>`,
                                                    iconSize: [0, 0],
                                                    iconAnchor: [0, 0]
                                                })}
                                            />
                                        </React.Fragment>
                                    )
                                ))}

                                {/* Placement marker */}
                                {formData.center_latitude && formData.center_longitude && (
                                    <Circle
                                        center={[parseFloat(formData.center_latitude), parseFloat(formData.center_longitude)]}
                                        radius={parseInt(formData.radius_meters) || 500}
                                        pathOptions={{
                                            color: getZoneColor(formData.zone_type),
                                            fillColor: getZoneColor(formData.zone_type),
                                            fillOpacity: 0.25,
                                            weight: 3,
                                            dashArray: '4, 4'
                                        }}
                                    />
                                )}
                            </MapContainer>

                            {isPlacing && (
                                <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[999] bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg shadow-lg text-sm font-medium">
                                    📍 Click on the map to set geofence center
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ═══════ ALERTS TAB ═══════ */}
                {activeTab === 'alerts' && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex gap-1">
                                {['unresolved', 'resolved', 'all'].map(f => (
                                    <button key={f}
                                        onClick={() => setAlertFilter(f)}
                                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition capitalize ${
                                            alertFilter === f
                                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                                                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                                        }`}
                                    >{f}</button>
                                ))}
                            </div>
                            <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
                                <Eye className="h-4 w-4 mr-1" /> Mark All Read
                            </Button>
                        </div>

                        {alerts.length === 0 ? (
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center shadow-sm border">
                                <CheckCircle className="h-12 w-12 mx-auto text-green-300 mb-3" />
                                <p className="text-gray-500">No alerts found</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {alerts.filter(alert => {
                                    if (!searchTerm) return true;
                                    const term = searchTerm.toLowerCase();
                                    return (alert.alert_type || '').toLowerCase().includes(term) ||
                                        (alert.geofence?.zone_name || '').toLowerCase().includes(term) ||
                                        (alert.vehicle?.vehicle_number || '').toLowerCase().includes(term);
                                }).map(alert => (
                                    <div key={alert.id}
                                        className={`bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border flex items-start gap-3
                                            ${!alert.is_read ? 'border-l-4' : ''}
                                        `}
                                        style={!alert.is_read ? { borderLeftColor: SEVERITY_COLORS[alert.severity] || '#3b82f6' } : {}}
                                    >
                                        <div className="p-2 rounded-lg"
                                            style={{
                                                backgroundColor: `${SEVERITY_COLORS[alert.severity] || '#3b82f6'}15`,
                                                color: SEVERITY_COLORS[alert.severity] || '#3b82f6'
                                            }}
                                        >
                                            {alert.alert_type === 'speed_violation'
                                                ? <Gauge className="h-5 w-5" />
                                                : alert.alert_type === 'geofence_breach'
                                                    ? <Shield className="h-5 w-5" />
                                                    : <AlertTriangle className="h-5 w-5" />
                                            }
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <p className="font-semibold text-sm text-gray-900 dark:text-white">
                                                        {alert.title || alert.alert_type?.replace(/_/g, ' ')}
                                                    </p>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                                                        {alert.message}
                                                    </p>
                                                </div>
                                                <Badge
                                                    style={{
                                                        backgroundColor: `${SEVERITY_COLORS[alert.severity]}20`,
                                                        color: SEVERITY_COLORS[alert.severity]
                                                    }}
                                                >
                                                    {alert.severity}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                                {alert.transport_vehicles?.vehicle_number && (
                                                    <span>🚌 {alert.transport_vehicles.vehicle_number}</span>
                                                )}
                                                {alert.speed && <span>⚡ {alert.speed} km/h</span>}
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {formatDateTime(alert.created_at)}
                                                </span>
                                                {alert.is_resolved && (
                                                    <span className="text-green-600 font-medium">✅ Resolved</span>
                                                )}
                                            </div>
                                        </div>
                                        {!alert.is_resolved && (
                                            <Button variant="outline" size="sm"
                                                onClick={() => handleResolveAlert(alert.id)}
                                            >
                                                <CheckCircle className="h-4 w-4 mr-1" /> Resolve
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Delete Dialog */}
                <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete Geofence Zone?</AlertDialogTitle>
                            <AlertDialogDescription>This will permanently remove this zone. Alerts generated by this zone will remain.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </DashboardLayout>
    );
}
