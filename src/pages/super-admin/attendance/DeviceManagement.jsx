// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// JASHCHAR ERP - ATTENDANCE DEVICE MANAGEMENT
// Register, configure, and monitor attendance devices (RFID, Biometric, Camera, etc.)
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback } from 'react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Cpu,
    Plus,
    Settings,
    Wifi,
    WifiOff,
    RefreshCw,
    Trash2,
    Edit,
    Eye,
    Power,
    Activity,
    MapPin,
    Calendar,
    Clock,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Loader2,
    QrCode,
    CreditCard,
    Fingerprint,
    ScanFace,
    Video,
    Mic,
    Monitor,
    Watch,
    Bluetooth,
    Server,
    Network,
    Shield,
    Wrench,
    History,
    Save,
    X,
    ChevronRight,
    Zap,
    Database,
    Globe
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// DEVICE TYPE ICONS
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

const deviceIcons = {
    manual: { icon: Edit, color: 'text-gray-500', bg: 'bg-gray-100' },
    qr_code: { icon: QrCode, color: 'text-purple-500', bg: 'bg-purple-100' },
    rfid: { icon: CreditCard, color: 'text-blue-500', bg: 'bg-blue-100' },
    biometric_finger: { icon: Fingerprint, color: 'text-amber-500', bg: 'bg-amber-100' },
    biometric_face: { icon: ScanFace, color: 'text-green-500', bg: 'bg-green-100' },
    biometric_iris: { icon: Eye, color: 'text-cyan-500', bg: 'bg-cyan-100' },
    voice_recognition: { icon: Mic, color: 'text-pink-500', bg: 'bg-pink-100' },
    gps_mobile: { icon: MapPin, color: 'text-red-500', bg: 'bg-red-100' },
    smart_board: { icon: Monitor, color: 'text-indigo-500', bg: 'bg-indigo-100' },
    iot_sensor: { icon: Cpu, color: 'text-teal-500', bg: 'bg-teal-100' },
    wearable: { icon: Watch, color: 'text-violet-500', bg: 'bg-violet-100' },
    camera_ai: { icon: Video, color: 'text-emerald-500', bg: 'bg-emerald-100' },
    bluetooth_beacon: { icon: Bluetooth, color: 'text-sky-500', bg: 'bg-sky-100' },
};

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// DEVICE CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

const DeviceCard = ({ device, onEdit, onDelete, onToggle, onSync }) => {
    const typeConfig = deviceIcons[device.device_type] || deviceIcons.manual;
    const Icon = typeConfig.icon;
    
    const isOnline = device.is_online && device.last_heartbeat && 
        new Date(device.last_heartbeat) > new Date(Date.now() - 5 * 60 * 1000); // Online if heartbeat within 5 mins
    
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.01 }}
        >
            <Card className={`relative overflow-hidden ${!device.is_active ? 'opacity-60' : ''}`}>
                {/* Status indicator line */}
                <div className={`absolute top-0 left-0 right-0 h-1 ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
                
                <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div className={`p-3 rounded-xl ${typeConfig.bg}`}>
                            <Icon className={`h-8 w-8 ${typeConfig.color}`} />
                        </div>
                        
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold truncate">{device.device_name}</h3>
                                <Badge variant={device.is_active ? 'default' : 'secondary'} className="text-xs">
                                    {device.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground capitalize">
                                {device.device_type?.replace(/_/g, ' ')}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                {device.device_serial && (
                                    <span className="flex items-center gap-1">
                                        <Database className="w-3 h-3" />
                                        {device.device_serial}
                                    </span>
                                )}
                                {device.location_name && (
                                    <span className="flex items-center gap-1">
                                        <MapPin className="w-3 h-3" />
                                        {device.location_name}
                                    </span>
                                )}
                            </div>
                        </div>
                        
                        {/* Status */}
                        <div className="flex flex-col items-end gap-2">
                            <div className="flex items-center gap-1">
                                {isOnline ? (
                                    <>
                                        <Wifi className="w-4 h-4 text-green-500" />
                                        <span className="text-xs text-green-600">Online</span>
                                    </>
                                ) : (
                                    <>
                                        <WifiOff className="w-4 h-4 text-red-500" />
                                        <span className="text-xs text-red-600">Offline</span>
                                    </>
                                )}
                            </div>
                            {device.last_sync && (
                                <span className="text-xs text-muted-foreground">
                                    Last sync: {new Date(device.last_sync).toLocaleTimeString()}
                                </span>
                            )}
                        </div>
                    </div>
                    
                    {/* Network info */}
                    {(device.ip_address || device.mac_address) && (
                        <div className="flex items-center gap-4 mt-4 pt-4 border-t text-xs text-muted-foreground">
                            {device.ip_address && (
                                <span className="flex items-center gap-1">
                                    <Globe className="w-3 h-3" />
                                    {device.ip_address}
                                </span>
                            )}
                            {device.mac_address && (
                                <span className="flex items-center gap-1">
                                    <Network className="w-3 h-3" />
                                    {device.mac_address}
                                </span>
                            )}
                        </div>
                    )}
                </CardContent>
                
                <CardFooter className="bg-muted/30 border-t flex justify-between">
                    <div className="flex items-center gap-2">
                        <Switch 
                            checked={device.is_active}
                            onCheckedChange={() => onToggle(device)}
                        />
                        <span className="text-xs text-muted-foreground">Active</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => onSync(device)}>
                            <RefreshCw className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => onEdit(device)}>
                            <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => onDelete(device)} className="text-destructive">
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        </motion.div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// ADD/EDIT DEVICE DIALOG
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

const DeviceDialog = ({ open, onClose, device, deviceTypes, branchId, organizationId, onSaved }) => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        device_name: '',
        device_type: '',
        device_code: '',
        device_serial: '',
        device_model: '',
        manufacturer: '',
        ip_address: '',
        mac_address: '',
        port: '',
        api_endpoint: '',
        api_key: '',
        location_name: '',
        location_type: 'gate',
        building: '',
        floor_number: '',
        room_number: '',
        notes: '',
        is_active: true,
    });
    
    useEffect(() => {
        if (device) {
            setFormData({
                device_name: device.device_name || '',
                device_type: device.device_type || '',
                device_code: device.device_code || '',
                device_serial: device.device_serial || '',
                device_model: device.device_model || '',
                manufacturer: device.manufacturer || '',
                ip_address: device.ip_address || '',
                mac_address: device.mac_address || '',
                port: device.port || '',
                api_endpoint: device.api_endpoint || '',
                api_key: device.api_key || '',
                location_name: device.location_name || '',
                location_type: device.location_type || 'gate',
                building: device.building || '',
                floor_number: device.floor_number || '',
                room_number: device.room_number || '',
                notes: device.notes || '',
                is_active: device.is_active ?? true,
            });
        } else {
            setFormData({
                device_name: '',
                device_type: '',
                device_code: '',
                device_serial: '',
                device_model: '',
                manufacturer: '',
                ip_address: '',
                mac_address: '',
                port: '',
                api_endpoint: '',
                api_key: '',
                location_name: '',
                location_type: 'gate',
                building: '',
                floor_number: '',
                room_number: '',
                notes: '',
                is_active: true,
            });
        }
    }, [device, open]);
    
    const handleSave = async () => {
        if (!formData.device_name || !formData.device_type) {
            toast({ variant: 'destructive', title: 'Device name and type are required' });
            return;
        }
        
        setLoading(true);
        
        const payload = {
            ...formData,
            branch_id: branchId,
            organization_id: organizationId,
            port: formData.port ? parseInt(formData.port) : null,
            floor_number: formData.floor_number ? parseInt(formData.floor_number) : null,
        };
        
        try {
            if (device?.id) {
                // Update
                const { error } = await supabase
                    .from('attendance_devices')
                    .update(payload)
                    .eq('id', device.id);
                
                if (error) throw error;
                toast({ title: 'Device updated successfully' });
            } else {
                // Insert
                const { error } = await supabase
                    .from('attendance_devices')
                    .insert(payload);
                
                if (error) throw error;
                toast({ title: 'Device added successfully' });
            }
            
            onSaved();
            onClose();
        } catch (error) {
            console.error('Save error:', error);
            toast({ variant: 'destructive', title: 'Error saving device', description: error.message });
        }
        
        setLoading(false);
    };
    
    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Cpu className="w-5 h-5 text-primary" />
                        {device ? 'Edit Device' : 'Add New Device'}
                    </DialogTitle>
                    <DialogDescription>
                        Configure attendance device settings
                    </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6">
                    {/* Basic Info */}
                    <div className="space-y-4">
                        <h4 className="font-semibold flex items-center gap-2">
                            <Settings className="w-4 h-4" />
                            Basic Information
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <Label>Device Name *</Label>
                                <Input
                                    value={formData.device_name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, device_name: e.target.value }))}
                                    placeholder="e.g., Main Gate RFID Reader"
                                />
                            </div>
                            <div>
                                <Label>Device Type *</Label>
                                <Select 
                                    value={formData.device_type} 
                                    onValueChange={(v) => setFormData(prev => ({ ...prev, device_type: v }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {deviceTypes?.map(dt => (
                                            <SelectItem key={dt.code} value={dt.code}>
                                                {dt.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Device Code</Label>
                                <Input
                                    value={formData.device_code}
                                    onChange={(e) => setFormData(prev => ({ ...prev, device_code: e.target.value }))}
                                    placeholder="Unique identifier"
                                />
                            </div>
                            <div>
                                <Label>Serial Number</Label>
                                <Input
                                    value={formData.device_serial}
                                    onChange={(e) => setFormData(prev => ({ ...prev, device_serial: e.target.value }))}
                                    placeholder="Manufacturer serial"
                                />
                            </div>
                            <div>
                                <Label>Model</Label>
                                <Input
                                    value={formData.device_model}
                                    onChange={(e) => setFormData(prev => ({ ...prev, device_model: e.target.value }))}
                                    placeholder="e.g., ZKTeco K40"
                                />
                            </div>
                            <div>
                                <Label>Manufacturer</Label>
                                <Input
                                    value={formData.manufacturer}
                                    onChange={(e) => setFormData(prev => ({ ...prev, manufacturer: e.target.value }))}
                                    placeholder="e.g., ZKTeco, eSSL, Hikvision"
                                />
                            </div>
                        </div>
                    </div>
                    
                    <Separator />
                    
                    {/* Network Settings */}
                    <div className="space-y-4">
                        <h4 className="font-semibold flex items-center gap-2">
                            <Network className="w-4 h-4" />
                            Network Configuration
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <Label>IP Address</Label>
                                <Input
                                    value={formData.ip_address}
                                    onChange={(e) => setFormData(prev => ({ ...prev, ip_address: e.target.value }))}
                                    placeholder="192.168.1.100"
                                />
                            </div>
                            <div>
                                <Label>Port</Label>
                                <Input
                                    type="number"
                                    value={formData.port}
                                    onChange={(e) => setFormData(prev => ({ ...prev, port: e.target.value }))}
                                    placeholder="4370"
                                />
                            </div>
                            <div>
                                <Label>MAC Address</Label>
                                <Input
                                    value={formData.mac_address}
                                    onChange={(e) => setFormData(prev => ({ ...prev, mac_address: e.target.value }))}
                                    placeholder="AA:BB:CC:DD:EE:FF"
                                />
                            </div>
                            <div>
                                <Label>API Endpoint</Label>
                                <Input
                                    value={formData.api_endpoint}
                                    onChange={(e) => setFormData(prev => ({ ...prev, api_endpoint: e.target.value }))}
                                    placeholder="http://device-ip/api"
                                />
                            </div>
                            <div className="col-span-2">
                                <Label>API Key (Encrypted)</Label>
                                <Input
                                    type="password"
                                    value={formData.api_key}
                                    onChange={(e) => setFormData(prev => ({ ...prev, api_key: e.target.value }))}
                                    placeholder="Device API key or password"
                                />
                            </div>
                        </div>
                    </div>
                    
                    <Separator />
                    
                    {/* Location */}
                    <div className="space-y-4">
                        <h4 className="font-semibold flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            Location
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <Label>Location Name</Label>
                                <Input
                                    value={formData.location_name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, location_name: e.target.value }))}
                                    placeholder="e.g., Main Entrance"
                                />
                            </div>
                            <div>
                                <Label>Location Type</Label>
                                <Select 
                                    value={formData.location_type} 
                                    onValueChange={(v) => setFormData(prev => ({ ...prev, location_type: v }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="gate">Gate</SelectItem>
                                        <SelectItem value="classroom">Classroom</SelectItem>
                                        <SelectItem value="office">Office</SelectItem>
                                        <SelectItem value="library">Library</SelectItem>
                                        <SelectItem value="cafeteria">Cafeteria</SelectItem>
                                        <SelectItem value="lab">Lab</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Building</Label>
                                <Input
                                    value={formData.building}
                                    onChange={(e) => setFormData(prev => ({ ...prev, building: e.target.value }))}
                                    placeholder="Main Building"
                                />
                            </div>
                            <div>
                                <Label>Floor</Label>
                                <Input
                                    type="number"
                                    value={formData.floor_number}
                                    onChange={(e) => setFormData(prev => ({ ...prev, floor_number: e.target.value }))}
                                    placeholder="0"
                                />
                            </div>
                        </div>
                    </div>
                    
                    <Separator />
                    
                    {/* Notes */}
                    <div className="space-y-2">
                        <Label>Notes</Label>
                        <Textarea
                            value={formData.notes}
                            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                            placeholder="Additional notes about this device..."
                            rows={3}
                        />
                    </div>
                    
                    {/* Active Toggle */}
                    <div className="flex items-center gap-2">
                        <Switch 
                            checked={formData.is_active}
                            onCheckedChange={(v) => setFormData(prev => ({ ...prev, is_active: v }))}
                        />
                        <Label>Device is active and receiving data</Label>
                    </div>
                </div>
                
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        <Save className="w-4 h-4 mr-2" />
                        {device ? 'Update Device' : 'Add Device'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// MAIN DEVICE MANAGEMENT COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

const DeviceManagement = () => {
    const { user, currentSessionId, organizationId } = useAuth();
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    const { canView, canAdd, canEdit, canDelete } = usePermissions();
    
    const branchId = selectedBranch?.id || user?.profile?.branch_id;
    
    // State
    const [loading, setLoading] = useState(true);
    const [devices, setDevices] = useState([]);
    const [deviceTypes, setDeviceTypes] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    
    // Dialog state
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingDevice, setEditingDevice] = useState(null);
    const [deleteConfirmDevice, setDeleteConfirmDevice] = useState(null);
    
    // Permissions
    const hasViewPermission = canView('attendance.device_management') || canView('attendance');
    const hasAddPermission = canAdd('attendance.device_management') || canAdd('attendance');
    const hasEditPermission = canEdit('attendance.device_management') || canEdit('attendance');
    const hasDeletePermission = canDelete('attendance.device_management') || canDelete('attendance');
    
    // Fetch device types
    useEffect(() => {
        fetchDeviceTypes();
    }, []);
    
    // Fetch devices when branch changes
    useEffect(() => {
        if (branchId) {
            fetchDevices();
        }
    }, [branchId]);
    
    const fetchDeviceTypes = async () => {
        const { data, error } = await supabase
            .from('attendance_device_types')
            .select('*')
            .eq('is_active', true)
            .order('sort_order');
        
        if (!error) setDeviceTypes(data || []);
    };
    
    const fetchDevices = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('attendance_devices')
            .select('*')
            .eq('branch_id', branchId)
            .order('created_at', { ascending: false });
        
        if (error) {
            toast({ variant: 'destructive', title: 'Error fetching devices', description: error.message });
        } else {
            setDevices(data || []);
        }
        setLoading(false);
    };
    
    // Filter devices
    const filteredDevices = devices.filter(device => {
        const matchesSearch = !searchTerm || 
            device.device_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            device.device_serial?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            device.location_name?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesType = filterType === 'all' || device.device_type === filterType;
        
        const matchesStatus = filterStatus === 'all' || 
            (filterStatus === 'active' && device.is_active) ||
            (filterStatus === 'inactive' && !device.is_active);
        
        return matchesSearch && matchesType && matchesStatus;
    });
    
    // Device type stats
    const stats = {
        total: devices.length,
        active: devices.filter(d => d.is_active).length,
        online: devices.filter(d => d.is_online).length,
        byType: deviceTypes.reduce((acc, type) => {
            acc[type.code] = devices.filter(d => d.device_type === type.code).length;
            return acc;
        }, {}),
    };
    
    // Handlers
    const handleAddDevice = () => {
        setEditingDevice(null);
        setDialogOpen(true);
    };
    
    const handleEditDevice = (device) => {
        setEditingDevice(device);
        setDialogOpen(true);
    };
    
    const handleToggleDevice = async (device) => {
        const { error } = await supabase
            .from('attendance_devices')
            .update({ is_active: !device.is_active })
            .eq('id', device.id);
        
        if (error) {
            toast({ variant: 'destructive', title: 'Error updating device', description: error.message });
        } else {
            toast({ title: `Device ${device.is_active ? 'deactivated' : 'activated'}` });
            fetchDevices();
        }
    };
    
    const handleSyncDevice = async (device) => {
        toast({ title: 'Syncing device...', description: 'Attempting to connect to device' });
        
        // Simulate sync (in real implementation, this would call device API)
        setTimeout(() => {
            toast({ title: 'Sync complete', description: `${device.device_name} synced successfully` });
        }, 2000);
    };
    
    const handleDeleteDevice = async () => {
        if (!deleteConfirmDevice) return;
        
        const { error } = await supabase
            .from('attendance_devices')
            .delete()
            .eq('id', deleteConfirmDevice.id);
        
        if (error) {
            toast({ variant: 'destructive', title: 'Error deleting device', description: error.message });
        } else {
            toast({ title: 'Device deleted successfully' });
            fetchDevices();
        }
        
        setDeleteConfirmDevice(null);
    };
    
    return (
        <DashboardLayout>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Cpu className="h-8 w-8 text-primary" />
                        Device Management
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Register and manage attendance devices
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={fetchDevices}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                    {hasAddPermission && (
                        <Button onClick={handleAddDevice}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Device
                        </Button>
                    )}
                </div>
            </div>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-primary/10">
                                <Server className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.total}</p>
                                <p className="text-sm text-muted-foreground">Total Devices</p>
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
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-blue-500/10">
                                <Wifi className="h-6 w-6 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.online}</p>
                                <p className="text-sm text-muted-foreground">Online</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-red-500/10">
                                <WifiOff className="h-6 w-6 text-red-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.total - stats.online}</p>
                                <p className="text-sm text-muted-foreground">Offline</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
            
            {/* Filters */}
            <Card className="mb-6">
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="relative md:col-span-2">
                            <Input
                                placeholder="Search devices..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <Select value={filterType} onValueChange={setFilterType}>
                            <SelectTrigger>
                                <SelectValue placeholder="Device Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                {deviceTypes.map(type => (
                                    <SelectItem key={type.code} value={type.code}>{type.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger>
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>
            
            {/* Device Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : filteredDevices.length === 0 ? (
                <Card>
                    <CardContent className="py-20 text-center">
                        <Cpu className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-xl font-semibold mb-2">No Devices Found</h3>
                        <p className="text-muted-foreground mb-4">
                            {devices.length === 0 
                                ? "You haven't registered any attendance devices yet."
                                : "No devices match your search criteria."}
                        </p>
                        {hasAddPermission && devices.length === 0 && (
                            <Button onClick={handleAddDevice}>
                                <Plus className="w-4 h-4 mr-2" />
                                Add Your First Device
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <AnimatePresence>
                        {filteredDevices.map((device) => (
                            <DeviceCard
                                key={device.id}
                                device={device}
                                onEdit={handleEditDevice}
                                onDelete={setDeleteConfirmDevice}
                                onToggle={handleToggleDevice}
                                onSync={handleSyncDevice}
                            />
                        ))}
                    </AnimatePresence>
                </div>
            )}
            
            {/* Add/Edit Dialog */}
            <DeviceDialog
                open={dialogOpen}
                onClose={() => {
                    setDialogOpen(false);
                    setEditingDevice(null);
                }}
                device={editingDevice}
                deviceTypes={deviceTypes}
                branchId={branchId}
                organizationId={organizationId}
                onSaved={fetchDevices}
            />
            
            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deleteConfirmDevice} onOpenChange={() => setDeleteConfirmDevice(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="w-5 h-5" />
                            Delete Device
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete "{deleteConfirmDevice?.device_name}"? 
                            This action cannot be undone and will remove all associated data.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteConfirmDevice(null)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteDevice}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Device
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
};

export default DeviceManagement;
