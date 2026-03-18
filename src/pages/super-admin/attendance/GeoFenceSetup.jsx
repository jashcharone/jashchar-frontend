// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// JASHCHAR ERP - GEO-FENCE ZONE MANAGEMENT
// Configure GPS-based attendance zones and boundaries
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { usePermissions } from '@/contexts/PermissionContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MapPin,
    Plus,
    Save,
    Trash2,
    Edit,
    RefreshCw,
    Loader2,
    Navigation,
    Circle,
    Map,
    Compass,
    Target,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Settings,
    Eye,
    EyeOff,
    Maximize2,
    Minimize2,
    Crosshair,
    Building,
    Home,
    School,
    Bus,
    Wifi,
    Calendar
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// ZONE TYPE CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

const zoneTypeConfig = {
    campus: { icon: School, color: '#3B82F6', label: 'Campus', description: 'Main school/college area' },
    building: { icon: Building, color: '#8B5CF6', label: 'Building', description: 'Specific building' },
    gate: { icon: MapPin, color: '#10B981', label: 'Gate', description: 'Entry/Exit point' },
    parking: { icon: Bus, color: '#F59E0B', label: 'Parking', description: 'Parking area' },
    playground: { icon: Target, color: '#EF4444', label: 'Playground', description: 'Sports area' },
    hostel: { icon: Home, color: '#EC4899', label: 'Hostel', description: 'Hostel premises' },
    wifi_zone: { icon: Wifi, color: '#06B6D4', label: 'WiFi Zone', description: 'WiFi attendance area' },
    custom: { icon: Circle, color: '#6B7280', label: 'Custom', description: 'Custom zone' },
};

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// MAP COMPONENT (Using Leaflet.js concept - simplified for demo)
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

const SimpleMapPreview = ({ zones, selectedZone, onSelectZone, center, zoom }) => {
    const canvasRef = useRef(null);
    const [canvasSize, setCanvasSize] = useState({ width: 800, height: 500 });
    
    // Convert lat/lng to canvas coordinates
    const latLngToPixel = (lat, lng) => {
        const scale = Math.pow(2, zoom) * 256 / 360;
        const x = (lng - center[1]) * scale + canvasSize.width / 2;
        const y = (center[0] - lat) * scale + canvasSize.height / 2;
        return { x, y };
    };
    
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);
        
        // Draw background grid
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 1;
        for (let i = 0; i < canvasSize.width; i += 50) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, canvasSize.height);
            ctx.stroke();
        }
        for (let i = 0; i < canvasSize.height; i += 50) {
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(canvasSize.width, i);
            ctx.stroke();
        }
        
        // Draw center crosshair
        ctx.strokeStyle = '#3B82F6';
        ctx.lineWidth = 2;
        const centerX = canvasSize.width / 2;
        const centerY = canvasSize.height / 2;
        ctx.beginPath();
        ctx.moveTo(centerX - 20, centerY);
        ctx.lineTo(centerX + 20, centerY);
        ctx.moveTo(centerX, centerY - 20);
        ctx.lineTo(centerX, centerY + 20);
        ctx.stroke();
        
        // Draw zones
        zones.forEach(zone => {
            if (!zone.center_latitude || !zone.center_longitude) return;
            
            const pos = latLngToPixel(zone.center_latitude, zone.center_longitude);
            const config = zoneTypeConfig[zone.zone_type] || zoneTypeConfig.custom;
            const isSelected = selectedZone?.id === zone.id;
            
            // Draw radius circle
            const radiusPixels = (zone.radius_meters || 100) * Math.pow(2, zoom - 15);
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, radiusPixels, 0, 2 * Math.PI);
            ctx.fillStyle = config.color + '30';
            ctx.fill();
            ctx.strokeStyle = isSelected ? '#000' : config.color;
            ctx.lineWidth = isSelected ? 3 : 2;
            ctx.stroke();
            
            // Draw center point
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, isSelected ? 8 : 6, 0, 2 * Math.PI);
            ctx.fillStyle = config.color;
            ctx.fill();
            
            // Draw label
            ctx.fillStyle = '#1F2937';
            ctx.font = isSelected ? 'bold 12px sans-serif' : '11px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(zone.zone_name, pos.x, pos.y - radiusPixels - 10);
        });
        
    }, [zones, selectedZone, center, zoom, canvasSize]);
    
    const handleClick = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Check if clicked on a zone
        for (const zone of zones) {
            if (!zone.center_latitude || !zone.center_longitude) continue;
            
            const pos = latLngToPixel(zone.center_latitude, zone.center_longitude);
            const radiusPixels = (zone.radius_meters || 100) * Math.pow(2, zoom - 15);
            const distance = Math.sqrt(Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2));
            
            if (distance <= radiusPixels) {
                onSelectZone(zone);
                return;
            }
        }
        
        onSelectZone(null);
    };
    
    return (
        <div className="relative border rounded-xl overflow-hidden bg-gradient-to-br from-blue-50 to-green-50">
            <canvas
                ref={canvasRef}
                width={canvasSize.width}
                height={canvasSize.height}
                onClick={handleClick}
                className="cursor-crosshair"
            />
            
            {/* Map Controls */}
            <div className="absolute top-4 right-4 flex flex-col gap-2">
                <Button variant="secondary" size="icon">
                    <Plus className="w-4 h-4" />
                </Button>
                <Button variant="secondary" size="icon">
                    <Minimize2 className="w-4 h-4" />
                </Button>
                <Button variant="secondary" size="icon">
                    <Crosshair className="w-4 h-4" />
                </Button>
            </div>
            
            {/* Legend */}
            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-lg text-xs">
                <p className="font-semibold mb-2">Zone Types</p>
                <div className="grid grid-cols-2 gap-1">
                    {Object.entries(zoneTypeConfig).slice(0, 6).map(([key, config]) => (
                        <div key={key} className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: config.color }} />
                            <span>{config.label}</span>
                        </div>
                    ))}
                </div>
            </div>
            
            {/* Instructions */}
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm p-2 rounded-lg shadow text-xs">
                <p className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    Click on map to select zone
                </p>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// ZONE CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

const ZoneCard = ({ zone, onEdit, onDelete, onToggle, isSelected }) => {
    const config = zoneTypeConfig[zone.zone_type] || zoneTypeConfig.custom;
    const Icon = config.icon;
    
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ scale: 1.02 }}
        >
            <Card className={`relative overflow-hidden cursor-pointer transition-all ${
                isSelected ? 'ring-2 ring-primary' : ''
            } ${!zone.is_active ? 'opacity-60' : ''}`}>
                <div 
                    className="absolute top-0 left-0 w-1 h-full" 
                    style={{ backgroundColor: config.color }}
                />
                
                <CardContent className="pt-4 pl-4">
                    <div className="flex items-start gap-3">
                        <div 
                            className="p-2 rounded-lg"
                            style={{ backgroundColor: config.color + '20' }}
                        >
                            <Icon className="h-5 w-5" style={{ color: config.color }} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-sm truncate">{zone.zone_name}</h3>
                                <Badge variant={zone.is_active ? 'default' : 'secondary'} className="text-xs">
                                    {zone.is_active ? 'Active' : 'Off'}
                                </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{config.label}</p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <Circle className="w-3 h-3" />
                                    {zone.radius_meters}m
                                </span>
                                {zone.center_latitude && (
                                    <span className="flex items-center gap-1">
                                        <Navigation className="w-3 h-3" />
                                        {zone.center_latitude.toFixed(4)}, {zone.center_longitude.toFixed(4)}
                                    </span>
                                )}
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-1">
                            <Switch 
                                checked={zone.is_active}
                                onCheckedChange={() => onToggle(zone)}
                            />
                        </div>
                    </div>
                </CardContent>
                
                <CardFooter className="py-2 bg-muted/30 border-t justify-end gap-1">
                    <Button variant="ghost" size="sm" onClick={() => onEdit(zone)}>
                        <Edit className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onDelete(zone)} className="text-destructive">
                        <Trash2 className="w-3 h-3" />
                    </Button>
                </CardFooter>
            </Card>
        </motion.div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// ZONE DIALOG
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

const ZoneDialog = ({ open, onClose, zone, branchId, organizationId, onSaved }) => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [gettingLocation, setGettingLocation] = useState(false);
    const [formData, setFormData] = useState({
        zone_name: '',
        zone_type: 'campus',
        description: '',
        center_latitude: '',
        center_longitude: '',
        radius_meters: 100,
        altitude_meters: null,
        allowed_methods: ['gps'],
        check_in_allowed: true,
        check_out_allowed: true,
        active_days: [1, 2, 3, 4, 5], // Mon-Fri
        active_start_time: '07:00',
        active_end_time: '18:00',
        is_active: true,
    });
    
    useEffect(() => {
        if (zone) {
            setFormData({
                zone_name: zone.zone_name || '',
                zone_type: zone.zone_type || 'campus',
                description: zone.description || '',
                center_latitude: zone.center_latitude || '',
                center_longitude: zone.center_longitude || '',
                radius_meters: zone.radius_meters || 100,
                altitude_meters: zone.altitude_meters || null,
                allowed_methods: zone.allowed_methods || ['gps'],
                check_in_allowed: zone.check_in_allowed ?? true,
                check_out_allowed: zone.check_out_allowed ?? true,
                active_days: zone.active_days || [1, 2, 3, 4, 5],
                active_start_time: zone.active_start_time || '07:00',
                active_end_time: zone.active_end_time || '18:00',
                is_active: zone.is_active ?? true,
            });
        } else {
            setFormData({
                zone_name: '',
                zone_type: 'campus',
                description: '',
                center_latitude: '',
                center_longitude: '',
                radius_meters: 100,
                altitude_meters: null,
                allowed_methods: ['gps'],
                check_in_allowed: true,
                check_out_allowed: true,
                active_days: [1, 2, 3, 4, 5],
                active_start_time: '07:00',
                active_end_time: '18:00',
                is_active: true,
            });
        }
    }, [zone, open]);
    
    const getCurrentLocation = () => {
        if (!navigator.geolocation) {
            toast({ variant: 'destructive', title: 'Geolocation not supported' });
            return;
        }
        
        setGettingLocation(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setFormData(prev => ({
                    ...prev,
                    center_latitude: position.coords.latitude.toFixed(6),
                    center_longitude: position.coords.longitude.toFixed(6),
                }));
                toast({ title: 'Location captured successfully' });
                setGettingLocation(false);
            },
            (error) => {
                toast({ variant: 'destructive', title: 'Location error', description: error.message });
                setGettingLocation(false);
            },
            { enableHighAccuracy: true }
        );
    };
    
    const handleSave = async () => {
        if (!formData.zone_name) {
            toast({ variant: 'destructive', title: 'Zone name is required' });
            return;
        }
        
        if (!formData.center_latitude || !formData.center_longitude) {
            toast({ variant: 'destructive', title: 'Please set the zone center coordinates' });
            return;
        }
        
        setLoading(true);
        
        const payload = {
            ...formData,
            branch_id: branchId,
            organization_id: organizationId,
            center_latitude: parseFloat(formData.center_latitude),
            center_longitude: parseFloat(formData.center_longitude),
        };
        
        try {
            if (zone?.id) {
                const { error } = await supabase
                    .from('geo_fence_zones')
                    .update(payload)
                    .eq('id', zone.id);
                
                if (error) throw error;
                toast({ title: 'Zone updated successfully' });
            } else {
                const { error } = await supabase
                    .from('geo_fence_zones')
                    .insert(payload);
                
                if (error) throw error;
                toast({ title: 'Zone created successfully' });
            }
            
            onSaved();
            onClose();
        } catch (error) {
            console.error('Save error:', error);
            toast({ variant: 'destructive', title: 'Error saving zone', description: error.message });
        }
        
        setLoading(false);
    };
    
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    const toggleDay = (day) => {
        setFormData(prev => ({
            ...prev,
            active_days: prev.active_days.includes(day)
                ? prev.active_days.filter(d => d !== day)
                : [...prev.active_days, day].sort(),
        }));
    };
    
    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-primary" />
                        {zone ? 'Edit Zone' : 'Create New Zone'}
                    </DialogTitle>
                    <DialogDescription>
                        Configure geo-fence zone for GPS-based attendance
                    </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6">
                    {/* Basic Info */}
                    <div className="space-y-4">
                        <h4 className="font-semibold flex items-center gap-2">
                            <Settings className="w-4 h-4" />
                            Zone Information
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <Label>Zone Name *</Label>
                                <Input
                                    value={formData.zone_name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, zone_name: e.target.value }))}
                                    placeholder="e.g., Main Campus"
                                />
                            </div>
                            <div>
                                <Label>Zone Type</Label>
                                <Select 
                                    value={formData.zone_type} 
                                    onValueChange={(v) => setFormData(prev => ({ ...prev, zone_type: v }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(zoneTypeConfig).map(([key, config]) => (
                                            <SelectItem key={key} value={key}>
                                                <div className="flex items-center gap-2">
                                                    <config.icon className="w-4 h-4" style={{ color: config.color }} />
                                                    {config.label}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Radius (meters)</Label>
                                <div className="space-y-2">
                                    <Input
                                        type="number"
                                        value={formData.radius_meters}
                                        onChange={(e) => setFormData(prev => ({ ...prev, radius_meters: parseInt(e.target.value) }))}
                                        min={10}
                                        max={5000}
                                    />
                                    <Slider
                                        value={[formData.radius_meters]}
                                        onValueChange={([v]) => setFormData(prev => ({ ...prev, radius_meters: v }))}
                                        min={10}
                                        max={1000}
                                        step={10}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <Separator />
                    
                    {/* Location */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="font-semibold flex items-center gap-2">
                                <Navigation className="w-4 h-4" />
                                Center Coordinates
                            </h4>
                            <Button variant="outline" size="sm" onClick={getCurrentLocation} disabled={gettingLocation}>
                                {gettingLocation ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <Crosshair className="w-4 h-4 mr-2" />
                                )}
                                Get Current Location
                            </Button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <Label>Latitude *</Label>
                                <Input
                                    type="number"
                                    step="0.000001"
                                    value={formData.center_latitude}
                                    onChange={(e) => setFormData(prev => ({ ...prev, center_latitude: e.target.value }))}
                                    placeholder="12.9716"
                                />
                            </div>
                            <div>
                                <Label>Longitude *</Label>
                                <Input
                                    type="number"
                                    step="0.000001"
                                    value={formData.center_longitude}
                                    onChange={(e) => setFormData(prev => ({ ...prev, center_longitude: e.target.value }))}
                                    placeholder="77.5946"
                                />
                            </div>
                        </div>
                        
                        {formData.center_latitude && formData.center_longitude && (
                            <Alert className="border-green-500/50 bg-green-500/5">
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                <AlertDescription>
                                    Coordinates set: {formData.center_latitude}, {formData.center_longitude}
                                </AlertDescription>
                            </Alert>
                        )}
                    </div>
                    
                    <Separator />
                    
                    {/* Schedule */}
                    <div className="space-y-4">
                        <h4 className="font-semibold flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Active Schedule
                        </h4>
                        <div className="space-y-4">
                            <div>
                                <Label>Active Days</Label>
                                <div className="flex gap-2 mt-2">
                                    {dayNames.map((name, index) => (
                                        <Button
                                            key={index}
                                            variant={formData.active_days.includes(index) ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => toggleDay(index)}
                                        >
                                            {name}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <Label>Start Time</Label>
                                    <Input
                                        type="time"
                                        value={formData.active_start_time}
                                        onChange={(e) => setFormData(prev => ({ ...prev, active_start_time: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <Label>End Time</Label>
                                    <Input
                                        type="time"
                                        value={formData.active_end_time}
                                        onChange={(e) => setFormData(prev => ({ ...prev, active_end_time: e.target.value }))}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <Separator />
                    
                    {/* Options */}
                    <div className="space-y-4">
                        <h4 className="font-semibold">Options</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex items-center justify-between p-3 border rounded-lg">
                                <Label>Allow Check-in</Label>
                                <Switch 
                                    checked={formData.check_in_allowed}
                                    onCheckedChange={(v) => setFormData(prev => ({ ...prev, check_in_allowed: v }))}
                                />
                            </div>
                            <div className="flex items-center justify-between p-3 border rounded-lg">
                                <Label>Allow Check-out</Label>
                                <Switch 
                                    checked={formData.check_out_allowed}
                                    onCheckedChange={(v) => setFormData(prev => ({ ...prev, check_out_allowed: v }))}
                                />
                            </div>
                            <div className="flex items-center justify-between p-3 border rounded-lg col-span-2">
                                <Label>Zone is Active</Label>
                                <Switch 
                                    checked={formData.is_active}
                                    onCheckedChange={(v) => setFormData(prev => ({ ...prev, is_active: v }))}
                                />
                            </div>
                        </div>
                    </div>
                    
                    {/* Description */}
                    <div>
                        <Label>Description</Label>
                        <Textarea
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Additional notes about this zone..."
                            rows={2}
                        />
                    </div>
                </div>
                
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        <Save className="w-4 h-4 mr-2" />
                        {zone ? 'Update Zone' : 'Create Zone'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// MAIN GEO-FENCE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

const GeoFenceSetup = () => {
    const { user, organizationId } = useAuth();
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    const { canView, canAdd, canEdit, canDelete } = usePermissions();
    
    const branchId = selectedBranch?.id || user?.profile?.branch_id;
    
    // State
    const [loading, setLoading] = useState(true);
    const [zones, setZones] = useState([]);
    const [selectedZone, setSelectedZone] = useState(null);
    const [mapCenter, setMapCenter] = useState([12.9716, 77.5946]); // Default: Bangalore
    const [mapZoom, setMapZoom] = useState(15);
    
    // Dialog state
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingZone, setEditingZone] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    
    // Permissions
    const hasAddPermission = canAdd('attendance.geo_fence') || canAdd('attendance');
    
    // Fetch zones
    useEffect(() => {
        if (branchId) {
            fetchZones();
        }
    }, [branchId]);
    
    // Update map center when zones load
    useEffect(() => {
        if (zones.length > 0 && zones[0].center_latitude && zones[0].center_longitude) {
            setMapCenter([zones[0].center_latitude, zones[0].center_longitude]);
        }
    }, [zones]);
    
    const fetchZones = async () => {
        setLoading(true);
        
        const { data, error } = await supabase
            .from('geo_fence_zones')
            .select('*')
            .eq('branch_id', branchId)
            .order('created_at', { ascending: false });
        
        if (error) {
            toast({ variant: 'destructive', title: 'Error fetching zones', description: error.message });
        } else {
            setZones(data || []);
        }
        
        setLoading(false);
    };
    
    // Stats
    const stats = {
        total: zones.length,
        active: zones.filter(z => z.is_active).length,
    };
    
    // Handlers
    const handleAddZone = () => {
        setEditingZone(null);
        setDialogOpen(true);
    };
    
    const handleEditZone = (zone) => {
        setEditingZone(zone);
        setDialogOpen(true);
    };
    
    const handleToggleZone = async (zone) => {
        const { error } = await supabase
            .from('geo_fence_zones')
            .update({ is_active: !zone.is_active })
            .eq('id', zone.id);
        
        if (error) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } else {
            toast({ title: `Zone ${zone.is_active ? 'deactivated' : 'activated'}` });
            fetchZones();
        }
    };
    
    const handleDeleteZone = async () => {
        if (!deleteConfirm) return;
        
        const { error } = await supabase
            .from('geo_fence_zones')
            .delete()
            .eq('id', deleteConfirm.id);
        
        if (error) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } else {
            toast({ title: 'Zone deleted' });
            fetchZones();
        }
        
        setDeleteConfirm(null);
    };
    
    const handleSelectZone = (zone) => {
        setSelectedZone(zone);
        if (zone && zone.center_latitude && zone.center_longitude) {
            setMapCenter([zone.center_latitude, zone.center_longitude]);
        }
    };
    
    return (
        <DashboardLayout>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <MapPin className="h-8 w-8 text-primary" />
                        Geo-Fence Zones
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Configure GPS-based attendance boundaries
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={fetchZones}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                    {hasAddPermission && (
                        <Button onClick={handleAddZone}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Zone
                        </Button>
                    )}
                </div>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-primary/10">
                                <Map className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.total}</p>
                                <p className="text-sm text-muted-foreground">Total Zones</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-green-500/10">
                                <CheckCircle2 className="h-6 w-6 text-green-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.active}</p>
                                <p className="text-sm text-muted-foreground">Active</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
            
            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Map View */}
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Map className="w-5 h-5" />
                                Zone Map
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="flex items-center justify-center h-[500px] bg-muted rounded-xl">
                                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                </div>
                            ) : (
                                <SimpleMapPreview
                                    zones={zones}
                                    selectedZone={selectedZone}
                                    onSelectZone={handleSelectZone}
                                    center={mapCenter}
                                    zoom={mapZoom}
                                />
                            )}
                        </CardContent>
                    </Card>
                </div>
                
                {/* Zone List */}
                <div>
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MapPin className="w-5 h-5" />
                                Zones ({zones.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-3">
                            <ScrollArea className="h-[500px] pr-2">
                                {zones.length === 0 ? (
                                    <div className="text-center py-8">
                                        <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                                        <p className="text-muted-foreground mb-4">No zones configured</p>
                                        {hasAddPermission && (
                                            <Button onClick={handleAddZone}>
                                                <Plus className="w-4 h-4 mr-2" />
                                                Add First Zone
                                            </Button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <AnimatePresence>
                                            {zones.map((zone) => (
                                                <div key={zone.id} onClick={() => handleSelectZone(zone)}>
                                                    <ZoneCard
                                                        zone={zone}
                                                        onEdit={handleEditZone}
                                                        onDelete={setDeleteConfirm}
                                                        onToggle={handleToggleZone}
                                                        isSelected={selectedZone?.id === zone.id}
                                                    />
                                                </div>
                                            ))}
                                        </AnimatePresence>
                                    </div>
                                )}
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>
            </div>
            
            {/* Zone Dialog */}
            <ZoneDialog
                open={dialogOpen}
                onClose={() => {
                    setDialogOpen(false);
                    setEditingZone(null);
                }}
                zone={editingZone}
                branchId={branchId}
                organizationId={organizationId}
                onSaved={fetchZones}
            />
            
            {/* Delete Confirmation */}
            <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="w-5 h-5" />
                            Delete Zone
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete "{deleteConfirm?.zone_name}"? 
                            This will affect GPS-based attendance tracking.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteZone}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
};

export default GeoFenceSetup;
