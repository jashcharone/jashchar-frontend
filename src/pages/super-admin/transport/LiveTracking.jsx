import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import api from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
    Bus, RefreshCw, Maximize2, Minimize2, Search, MapPin,
    Navigation, Wifi, WifiOff, Clock, Gauge
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════
// VEHICLE ICON FACTORY
// ═══════════════════════════════════════════════════════════════════════
const STATUS_COLORS = {
    moving: '#22c55e',
    stopped: '#eab308',
    idle: '#f97316',
    offline: '#6b7280'
};

const STATUS_LABELS = {
    moving: 'Moving',
    stopped: 'Stopped',
    idle: 'Idle',
    offline: 'Offline'
};

const createVehicleIcon = (status) => {
    const color = STATUS_COLORS[status] || STATUS_COLORS.offline;
    return L.divIcon({
        className: 'custom-vehicle-marker',
        html: `<div style="
            background: ${color};
            width: 36px; height: 36px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex; align-items: center; justify-content: center;
            color: white; font-size: 16px;
        ">🚌</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -20]
    });
};

// ═══════════════════════════════════════════════════════════════════════
// MAP RECENTER COMPONENT
// ═══════════════════════════════════════════════════════════════════════
const MapRecenter = ({ center, zoom }) => {
    const map = useMap();
    useEffect(() => {
        if (center) map.setView(center, zoom || map.getZoom());
    }, [center, zoom, map]);
    return null;
};

// ═══════════════════════════════════════════════════════════════════════
// LIVE TRACKING PAGE
// ═══════════════════════════════════════════════════════════════════════
export default function LiveTracking() {
    const { user, organizationId } = useAuth();
    const { selectedBranch } = useBranch();
    const branchId = selectedBranch?.id || user?.profile?.branch_id;

    const [vehicles, setVehicles] = useState([]);
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [vehicleTrail, setVehicleTrail] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [lastRefresh, setLastRefresh] = useState(null);
    const [loading, setLoading] = useState(false);

    const containerRef = useRef(null);
    const intervalRef = useRef(null);

    // Default center: India
    const DEFAULT_CENTER = [20.5937, 78.9629];
    const DEFAULT_ZOOM = 5;
    const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
    const [mapZoom, setMapZoom] = useState(DEFAULT_ZOOM);

    // ═══════════════════════════════════════════════════════════════
    // FETCH ALL VEHICLE LOCATIONS
    // ═══════════════════════════════════════════════════════════════
    const fetchVehicles = useCallback(async () => {
        if (!branchId) return;
        setLoading(true);
        try {
            const res = await api.get('/transport/gps/all-vehicles', {
                params: { branchId, organizationId }
            });
            if (res.data.success) {
                setVehicles(res.data.data || []);
                setLastRefresh(new Date());
            }
        } catch {
            // Silently fail on auto-refresh; show error only on manual
        } finally {
            setLoading(false);
        }
    }, [branchId, organizationId]);

    // ═══════════════════════════════════════════════════════════════
    // FETCH VEHICLE TRAIL
    // ═══════════════════════════════════════════════════════════════
    const fetchTrail = useCallback(async (vehicleId) => {
        if (!branchId || !vehicleId) return;
        try {
            const res = await api.get(`/transport/gps/vehicle/${vehicleId}/trail`, {
                params: { branchId, organizationId, hours: 2 }
            });
            if (res.data.success) {
                setVehicleTrail(res.data.data || []);
            }
        } catch {
            setVehicleTrail([]);
        }
    }, [branchId, organizationId]);

    // ═══════════════════════════════════════════════════════════════
    // AUTO-REFRESH (every 10 seconds)
    // ═══════════════════════════════════════════════════════════════
    useEffect(() => {
        fetchVehicles();
    }, [fetchVehicles]);

    useEffect(() => {
        if (autoRefresh) {
            intervalRef.current = setInterval(fetchVehicles, 10000);
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [autoRefresh, fetchVehicles]);

    // ═══════════════════════════════════════════════════════════════
    // VEHICLE SELECTION
    // ═══════════════════════════════════════════════════════════════
    const handleSelectVehicle = (vehicle) => {
        setSelectedVehicle(vehicle);
        if (vehicle.last_latitude && vehicle.last_longitude) {
            setMapCenter([vehicle.last_latitude, vehicle.last_longitude]);
            setMapZoom(15);
        }
        fetchTrail(vehicle.id);
    };

    // ═══════════════════════════════════════════════════════════════
    // FULLSCREEN TOGGLE
    // ═══════════════════════════════════════════════════════════════
    const toggleFullscreen = () => {
        if (!isFullscreen) {
            containerRef.current?.requestFullscreen?.();
        } else {
            document.exitFullscreen?.();
        }
        setIsFullscreen(!isFullscreen);
    };

    useEffect(() => {
        const handler = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handler);
        return () => document.removeEventListener('fullscreenchange', handler);
    }, []);

    // ═══════════════════════════════════════════════════════════════
    // FILTER VEHICLES
    // ═══════════════════════════════════════════════════════════════
    const filteredVehicles = vehicles.filter(v => {
        const matchSearch = !searchTerm ||
            v.vehicle_number?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchStatus = statusFilter === 'all' || v.movement_status === statusFilter;
        return matchSearch && matchStatus;
    });

    // Status counts
    const statusCounts = vehicles.reduce((acc, v) => {
        acc[v.movement_status] = (acc[v.movement_status] || 0) + 1;
        return acc;
    }, {});

    // Trail polyline coordinates
    const trailCoords = vehicleTrail
        .filter(p => p.latitude && p.longitude)
        .map(p => [p.latitude, p.longitude]);

    return (
        <DashboardLayout>
            <div ref={containerRef} className="flex flex-col h-[calc(100vh-80px)] bg-gray-50 dark:bg-gray-900">
                {/* ═══════ HEADER ═══════ */}
                <div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-gray-800 border-b shadow-sm">
                    <div className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-blue-600" />
                        <h1 className="text-lg font-bold text-gray-900 dark:text-white">Live Tracking</h1>
                        <Badge variant="outline" className="text-xs">
                            {vehicles.length} vehicles
                        </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                        {lastRefresh && (
                            <span className="text-xs text-gray-500">
                                Updated: {lastRefresh.toLocaleTimeString('en-IN')}
                            </span>
                        )}
                        <Button
                            variant={autoRefresh ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setAutoRefresh(!autoRefresh)}
                            title={autoRefresh ? 'Auto-refresh ON (10s)' : 'Auto-refresh OFF'}
                        >
                            {autoRefresh ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => { fetchVehicles(); toast.success('Refreshed'); }}
                            disabled={loading}
                        >
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                        <Button variant="outline" size="sm" onClick={toggleFullscreen}>
                            {isFullscreen ?
                                <Minimize2 className="h-4 w-4" /> :
                                <Maximize2 className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>

                {/* ═══════ MAIN CONTENT ═══════ */}
                <div className="flex flex-1 overflow-hidden">
                    {/* ═══════ SIDEBAR ═══════ */}
                    <div className="w-72 bg-white dark:bg-gray-800 border-r flex flex-col overflow-hidden">
                        {/* Search */}
                        <div className="p-3 border-b">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search vehicle..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="pl-9 h-9"
                                />
                            </div>
                        </div>

                        {/* Status Filter Tabs */}
                        <div className="flex flex-wrap gap-1 p-2 border-b">
                            {[
                                { key: 'all', label: 'All', count: vehicles.length },
                                { key: 'moving', label: '🟢', count: statusCounts.moving || 0 },
                                { key: 'stopped', label: '🟡', count: statusCounts.stopped || 0 },
                                { key: 'idle', label: '🟠', count: statusCounts.idle || 0 },
                                { key: 'offline', label: '⚪', count: statusCounts.offline || 0 }
                            ].map(f => (
                                <button
                                    key={f.key}
                                    onClick={() => setStatusFilter(f.key)}
                                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition
                                        ${statusFilter === f.key
                                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                                            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200'
                                        }`}
                                >
                                    {f.label} {f.count}
                                </button>
                            ))}
                        </div>

                        {/* Vehicle List */}
                        <div className="flex-1 overflow-y-auto">
                            {filteredVehicles.length === 0 ? (
                                <div className="p-4 text-center text-gray-500 text-sm">
                                    {vehicles.length === 0
                                        ? 'No vehicles with GPS data'
                                        : 'No vehicles match filter'}
                                </div>
                            ) : (
                                filteredVehicles.map(v => (
                                    <button
                                        key={v.id}
                                        onClick={() => handleSelectVehicle(v)}
                                        className={`w-full text-left p-3 border-b transition hover:bg-gray-50 dark:hover:bg-gray-700
                                            ${selectedVehicle?.id === v.id
                                                ? 'bg-blue-50 dark:bg-blue-900/30 border-l-4 border-l-blue-500'
                                                : ''
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-semibold text-sm text-gray-900 dark:text-white">
                                                {v.vehicle_number}
                                            </span>
                                            <span
                                                className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                                                style={{
                                                    backgroundColor: `${STATUS_COLORS[v.movement_status]}20`,
                                                    color: STATUS_COLORS[v.movement_status]
                                                }}
                                            >
                                                {STATUS_LABELS[v.movement_status]}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                            {v.last_speed != null && (
                                                <span className="flex items-center gap-0.5">
                                                    <Gauge className="h-3 w-3" />
                                                    {v.last_speed?.toFixed(0)} km/h
                                                </span>
                                            )}
                                            <span className="flex items-center gap-0.5">
                                                <Clock className="h-3 w-3" />
                                                {v.minutes_since_update != null
                                                    ? v.minutes_since_update < 1
                                                        ? 'Just now'
                                                        : `${v.minutes_since_update}m ago`
                                                    : 'N/A'}
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-400 mt-0.5 capitalize">
                                            {v.vehicle_type} • {v.capacity} seats
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>

                        {/* Sidebar Footer Stats */}
                        <div className="p-2 border-t bg-gray-50 dark:bg-gray-900">
                            <div className="grid grid-cols-4 gap-1 text-center text-xs">
                                {[
                                    { label: 'Move', count: statusCounts.moving || 0, color: 'text-green-600' },
                                    { label: 'Stop', count: statusCounts.stopped || 0, color: 'text-yellow-600' },
                                    { label: 'Idle', count: statusCounts.idle || 0, color: 'text-orange-600' },
                                    { label: 'Off', count: statusCounts.offline || 0, color: 'text-gray-500' }
                                ].map(s => (
                                    <div key={s.label}>
                                        <div className={`font-bold ${s.color}`}>{s.count}</div>
                                        <div className="text-gray-400">{s.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ═══════ MAP ═══════ */}
                    <div className="flex-1 relative">
                        <MapContainer
                            center={DEFAULT_CENTER}
                            zoom={DEFAULT_ZOOM}
                            className="h-full w-full z-0"
                            zoomControl={true}
                        >
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            <MapRecenter center={mapCenter} zoom={mapZoom} />

                            {/* Vehicle Markers */}
                            {filteredVehicles.map(v => (
                                v.last_latitude && v.last_longitude && (
                                    <Marker
                                        key={v.id}
                                        position={[v.last_latitude, v.last_longitude]}
                                        icon={createVehicleIcon(v.movement_status)}
                                        eventHandlers={{
                                            click: () => handleSelectVehicle(v)
                                        }}
                                    >
                                        <Popup>
                                            <div className="min-w-[180px]">
                                                <div className="font-bold text-sm flex items-center gap-1">
                                                    <Bus className="h-4 w-4" />
                                                    {v.vehicle_number}
                                                </div>
                                                <div className="mt-1 space-y-0.5 text-xs text-gray-600">
                                                    <div className="flex justify-between">
                                                        <span>Status</span>
                                                        <span className="font-medium" style={{ color: STATUS_COLORS[v.movement_status] }}>
                                                            {STATUS_LABELS[v.movement_status]}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Speed</span>
                                                        <span>{v.last_speed?.toFixed(0) || 0} km/h</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Type</span>
                                                        <span className="capitalize">{v.vehicle_type}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Capacity</span>
                                                        <span>{v.capacity} seats</span>
                                                    </div>
                                                    {v.minutes_since_update != null && (
                                                        <div className="flex justify-between">
                                                            <span>Last Update</span>
                                                            <span>
                                                                {v.minutes_since_update < 1
                                                                    ? 'Just now'
                                                                    : `${v.minutes_since_update}m ago`}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </Popup>
                                    </Marker>
                                )
                            ))}

                            {/* Selected Vehicle Trail */}
                            {trailCoords.length > 1 && (
                                <Polyline
                                    positions={trailCoords}
                                    pathOptions={{
                                        color: '#3b82f6',
                                        weight: 4,
                                        opacity: 0.7,
                                        dashArray: '8, 6'
                                    }}
                                />
                            )}
                        </MapContainer>

                        {/* Selected Vehicle Info Bar */}
                        {selectedVehicle && (
                            <div className="absolute bottom-4 left-4 right-4 z-[999] bg-white dark:bg-gray-800 rounded-lg shadow-xl border p-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-10 h-10 rounded-full flex items-center justify-center text-white text-lg"
                                            style={{ backgroundColor: STATUS_COLORS[selectedVehicle.movement_status] }}
                                        >
                                            🚌
                                        </div>
                                        <div>
                                            <div className="font-bold text-sm text-gray-900 dark:text-white">
                                                {selectedVehicle.vehicle_number}
                                            </div>
                                            <div className="text-xs text-gray-500 capitalize">
                                                {selectedVehicle.vehicle_type} • {selectedVehicle.capacity} seats
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs">
                                        <div className="text-center">
                                            <div className="font-bold text-lg text-gray-900 dark:text-white">
                                                {selectedVehicle.last_speed?.toFixed(0) || 0}
                                            </div>
                                            <div className="text-gray-500">km/h</div>
                                        </div>
                                        <div className="text-center">
                                            <div
                                                className="font-bold text-sm"
                                                style={{ color: STATUS_COLORS[selectedVehicle.movement_status] }}
                                            >
                                                {STATUS_LABELS[selectedVehicle.movement_status]}
                                            </div>
                                            <div className="text-gray-500">Status</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="font-bold text-sm text-gray-900 dark:text-white">
                                                {vehicleTrail.length}
                                            </div>
                                            <div className="text-gray-500">Trail pts</div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                setSelectedVehicle(null);
                                                setVehicleTrail([]);
                                            }}
                                        >
                                            ✕
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* No Data Overlay */}
                        {vehicles.length === 0 && !loading && (
                            <div className="absolute inset-0 z-[999] flex items-center justify-center bg-black/10 pointer-events-none">
                                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center pointer-events-auto">
                                    <Navigation className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                                    <h3 className="font-semibold text-gray-700 dark:text-gray-200">
                                        No GPS Data Available
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Vehicle GPS tracking data will appear here once devices start reporting.
                                    </p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="mt-3"
                                        onClick={fetchVehicles}
                                    >
                                        <RefreshCw className="h-4 w-4 mr-1" /> Retry
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
