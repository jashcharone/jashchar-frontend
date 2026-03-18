// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// JASHCHAR ERP - WEARABLE DEVICES MANAGEMENT
// Smart bands, watches, NFC wristbands for attendance tracking
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
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Watch,
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
    Calendar,
    Clock,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Loader2,
    User,
    Users,
    Smartphone,
    Bluetooth,
    BluetoothConnected,
    BluetoothOff,
    Battery,
    BatteryCharging,
    BatteryLow,
    BatteryFull,
    BatteryMedium,
    Heart,
    Footprints,
    Zap,
    Signal,
    SignalHigh,
    SignalLow,
    SignalMedium,
    Search,
    Link,
    Unlink,
    QrCode,
    Nfc,
    CreditCard,
    GraduationCap,
    Briefcase,
    X,
    Save,
    History,
    MapPin,
    Bell,
    BellRing,
    Vibrate,
    Sun,
    Moon,
    ArrowUpRight,
    ArrowDownRight,
    MoreVertical,
    Download,
    Upload,
    Filter
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// WEARABLE TYPE CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

const wearableTypes = {
    smart_band: {
        name: 'Smart Band',
        name_kn: 'ಸ್ಮಾರ್ಟ್ ಬ್ಯಾಂಡ್',
        icon: Watch,
        color: 'text-violet-500',
        bg: 'bg-violet-100 dark:bg-violet-900/30',
        description: 'Mi Band, Fitbit, Honor Band',
        features: ['NFC', 'Heart Rate', 'Steps', 'Bluetooth'],
    },
    smart_watch: {
        name: 'Smart Watch',
        name_kn: 'ಸ್ಮಾರ್ಟ್ ವಾಚ್',
        icon: Watch,
        color: 'text-blue-500',
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        description: 'Apple Watch, Galaxy Watch, Noise',
        features: ['NFC', 'GPS', 'Bluetooth', 'WiFi'],
    },
    nfc_wristband: {
        name: 'NFC Wristband',
        name_kn: 'ಎನ್ಎಫ್ಸಿ ರಿಸ್ಟ್‌ಬ್ಯಾಂಡ್',
        icon: CreditCard,
        color: 'text-green-500',
        bg: 'bg-green-100 dark:bg-green-900/30',
        description: 'Silicon NFC wristband (Low cost)',
        features: ['NFC'],
    },
    beacon_tag: {
        name: 'Beacon Tag',
        name_kn: 'ಬೀಕನ್ ಟ್ಯಾಗ್',
        icon: Bluetooth,
        color: 'text-amber-500',
        bg: 'bg-amber-100 dark:bg-amber-900/30',
        description: 'BLE beacon keychain/tag',
        features: ['Bluetooth', 'Proximity'],
    },
};

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// BATTERY STATUS COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

const BatteryStatus = ({ level, isCharging }) => {
    const getBatteryIcon = () => {
        if (isCharging) return BatteryCharging;
        if (level >= 80) return BatteryFull;
        if (level >= 50) return BatteryMedium;
        if (level >= 20) return BatteryLow;
        return Battery;
    };
    
    const BatteryIcon = getBatteryIcon();
    const color = level >= 50 ? 'text-green-500' : level >= 20 ? 'text-amber-500' : 'text-red-500';
    
    return (
        <div className={`flex items-center gap-1 ${color}`}>
            <BatteryIcon className="w-4 h-4" />
            <span className="text-xs font-medium">{level}%</span>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// CONNECTION STATUS BADGE
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

const ConnectionBadge = ({ status, lastSeen }) => {
    const config = {
        connected: { label: 'Connected', color: 'bg-green-500', icon: BluetoothConnected },
        disconnected: { label: 'Disconnected', color: 'bg-gray-400', icon: BluetoothOff },
        in_range: { label: 'In Range', color: 'bg-blue-500', icon: Signal },
        out_of_range: { label: 'Out of Range', color: 'bg-amber-500', icon: SignalLow },
        never_connected: { label: 'Never Connected', color: 'bg-red-500', icon: Bluetooth },
    };
    
    const { label, color, icon: Icon } = config[status] || config.disconnected;
    
    return (
        <Badge className={`${color} text-white flex items-center gap-1`}>
            <Icon className="w-3 h-3" />
            {label}
        </Badge>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// WEARABLE CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

const WearableCard = ({ wearable, onEdit, onUnpair, onViewHistory, onPing }) => {
    const typeConfig = wearableTypes[wearable.wearable_type] || wearableTypes.smart_band;
    const Icon = typeConfig.icon;
    
    const isOnline = wearable.connection_status === 'connected' || wearable.connection_status === 'in_range';
    
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            whileHover={{ y: -2 }}
            className="group"
        >
            <Card className={`relative overflow-hidden transition-all hover:shadow-lg ${
                isOnline ? 'border-green-200' : 'border-gray-200'
            }`}>
                {/* Status Indicator */}
                <div className={`absolute top-0 left-0 right-0 h-1 ${
                    isOnline ? 'bg-green-500' : 'bg-gray-300'
                }`} />
                
                <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`p-3 rounded-xl ${typeConfig.bg}`}>
                                <Icon className={`w-6 h-6 ${typeConfig.color}`} />
                            </div>
                            <div>
                                <CardTitle className="text-base">{wearable.device_name}</CardTitle>
                                <CardDescription className="text-xs">
                                    {typeConfig.name} • {wearable.device_serial || 'No Serial'}
                                </CardDescription>
                            </div>
                        </div>
                        <ConnectionBadge status={wearable.connection_status} lastSeen={wearable.last_seen} />
                    </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                    {/* Assigned User */}
                    {wearable.user_name ? (
                        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                wearable.user_type === 'student' ? 'bg-blue-100' : 'bg-amber-100'
                            }`}>
                                {wearable.user_type === 'student' 
                                    ? <GraduationCap className="w-5 h-5 text-blue-600" />
                                    : <Briefcase className="w-5 h-5 text-amber-600" />
                                }
                            </div>
                            <div className="flex-1">
                                <p className="font-medium">{wearable.user_name}</p>
                                <p className="text-xs text-muted-foreground">
                                    {wearable.user_code} • {wearable.user_type === 'student' ? 'Student' : 'Staff'}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <AlertTriangle className="w-5 h-5 text-amber-500" />
                            <span className="text-sm text-amber-700">Not assigned to any user</span>
                        </div>
                    )}
                    
                    {/* Device Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="text-center p-2 bg-muted/30 rounded-lg">
                            <BatteryStatus level={wearable.battery_level || 0} isCharging={wearable.is_charging} />
                            <p className="text-xs text-muted-foreground mt-1">Battery</p>
                        </div>
                        <div className="text-center p-2 bg-muted/30 rounded-lg">
                            <div className="flex items-center justify-center gap-1 text-blue-500">
                                <Heart className="w-4 h-4" />
                                <span className="text-xs font-medium">{wearable.heart_rate || '--'}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">BPM</p>
                        </div>
                        <div className="text-center p-2 bg-muted/30 rounded-lg">
                            <div className="flex items-center justify-center gap-1 text-green-500">
                                <Footprints className="w-4 h-4" />
                                <span className="text-xs font-medium">{wearable.steps_today || 0}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Steps</p>
                        </div>
                    </div>
                    
                    {/* Last Activity */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Last seen: {wearable.last_seen 
                                ? new Date(wearable.last_seen).toLocaleString('en-IN')
                                : 'Never'
                            }
                        </span>
                        <span className="flex items-center gap-1">
                            <Activity className="w-3 h-3" />
                            {wearable.attendance_count || 0} check-ins
                        </span>
                    </div>
                </CardContent>
                
                <CardFooter className="border-t bg-muted/30 gap-2 pt-3">
                    <Button variant="outline" size="sm" onClick={() => onPing(wearable)} className="flex-1">
                        <Vibrate className="w-4 h-4 mr-1" />
                        Ping
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => onViewHistory(wearable)}>
                        <History className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => onEdit(wearable)}>
                        <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => onUnpair(wearable)}
                        className="text-destructive hover:bg-destructive hover:text-white"
                    >
                        <Unlink className="w-4 h-4" />
                    </Button>
                </CardFooter>
            </Card>
        </motion.div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// ADD/PAIR WEARABLE DIALOG
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

const PairWearableDialog = ({ open, onClose, branchId, organizationId, onSaved }) => {
    const { toast } = useToast();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [scanning, setScanning] = useState(false);
    const [discoveredDevices, setDiscoveredDevices] = useState([]);
    const [selectedDevice, setSelectedDevice] = useState(null);
    const [searchType, setSearchType] = useState('student');
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [formData, setFormData] = useState({
        wearable_type: 'smart_band',
        device_name: '',
        device_serial: '',
        nfc_uid: '',
        bluetooth_mac: '',
    });
    
    // Reset on open
    useEffect(() => {
        if (open) {
            setStep(1);
            setSelectedDevice(null);
            setSelectedUser(null);
            setDiscoveredDevices([]);
            setFormData({
                wearable_type: 'smart_band',
                device_name: '',
                device_serial: '',
                nfc_uid: '',
                bluetooth_mac: '',
            });
        }
    }, [open]);
    
    // Simulate Bluetooth scan
    const startScan = async () => {
        setScanning(true);
        setDiscoveredDevices([]);
        
        // Simulate discovering devices
        setTimeout(() => {
            const mockDevices = [
                { id: 1, name: 'Mi Band 8', mac: 'AA:BB:CC:DD:EE:F1', rssi: -45, type: 'smart_band' },
                { id: 2, name: 'Galaxy Watch 5', mac: 'AA:BB:CC:DD:EE:F2', rssi: -62, type: 'smart_watch' },
                { id: 3, name: 'Fitbit Charge 5', mac: 'AA:BB:CC:DD:EE:F3', rssi: -58, type: 'smart_band' },
                { id: 4, name: 'NFC Band #1234', mac: 'AA:BB:CC:DD:EE:F4', rssi: -70, type: 'nfc_wristband' },
            ];
            setDiscoveredDevices(mockDevices);
            setScanning(false);
        }, 3000);
    };
    
    // Search users
    const searchUsers = async () => {
        if (!searchTerm || searchTerm.length < 2) return;
        
        setLoading(true);
        const table = searchType === 'student' ? 'student_profiles' : 'employee_profiles';
        
        let query;
        if (searchType === 'student') {
            query = supabase
                .from(table)
                .select('id, full_name, school_code, class_id, photo_url')
                .eq('branch_id', branchId)
                .or(`full_name.ilike.%${searchTerm}%,school_code.ilike.%${searchTerm}%`)
                .limit(15);
        } else {
            query = supabase
                .from(table)
                .select('id, full_name, phone, designation_id, photo_url')
                .eq('branch_id', branchId)
                .or(`full_name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
                .limit(15);
        }
        
        const { data, error } = await query;
        
        if (error) {
            toast({ variant: 'destructive', title: 'Search failed', description: error.message });
        } else {
            setSearchResults(data || []);
        }
        setLoading(false);
    };
    
    // Save wearable
    const handleSave = async () => {
        if (!selectedUser || !formData.device_name) {
            toast({ variant: 'destructive', title: 'Validation Error', description: 'Please select a user and enter device name' });
            return;
        }
        
        setLoading(true);
        
        try {
            // Insert into wearable_devices table
            const payload = {
                organization_id: organizationId,
                branch_id: branchId,
                wearable_type: formData.wearable_type,
                device_name: formData.device_name,
                device_serial: formData.device_serial || null,
                nfc_uid: formData.nfc_uid || null,
                bluetooth_mac: formData.bluetooth_mac || null,
                user_type: searchType,
                user_id: selectedUser.id,
                user_name: selectedUser.full_name,
                user_code: searchType === 'student' ? selectedUser.school_code : selectedUser.phone,
                connection_status: 'never_connected',
                battery_level: 100,
                is_active: true,
            };
            
            const { error } = await supabase
                .from('wearable_devices')
                .insert(payload);
            
            if (error) throw error;
            
            toast({
                title: 'Wearable Paired Successfully',
                description: `${formData.device_name} assigned to ${selectedUser.full_name}`,
            });
            
            onSaved();
            onClose();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        }
        
        setLoading(false);
    };
    
    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Watch className="w-5 h-5 text-primary" />
                        Pair Wearable Device
                    </DialogTitle>
                    <DialogDescription>
                        Step {step} of 3: {step === 1 ? 'Discover Device' : step === 2 ? 'Select User' : 'Confirm Details'}
                    </DialogDescription>
                </DialogHeader>
                
                {/* Progress Indicator */}
                <div className="flex items-center gap-2 py-4">
                    {[1, 2, 3].map((s) => (
                        <React.Fragment key={s}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${
                                step >= s ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                            }`}>
                                {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
                            </div>
                            {s < 3 && <div className={`flex-1 h-1 rounded ${step > s ? 'bg-primary' : 'bg-muted'}`} />}
                        </React.Fragment>
                    ))}
                </div>
                
                {/* Step 1: Discover Device */}
                {step === 1 && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {Object.entries(wearableTypes).map(([key, config]) => {
                                const TypeIcon = config.icon;
                                return (
                                    <div
                                        key={key}
                                        onClick={() => setFormData(prev => ({ ...prev, wearable_type: key }))}
                                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                            formData.wearable_type === key 
                                                ? 'border-primary bg-primary/5' 
                                                : 'border-muted hover:border-primary/50'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${config.bg}`}>
                                                <TypeIcon className={`w-5 h-5 ${config.color}`} />
                                            </div>
                                            <div>
                                                <p className="font-medium">{config.name}</p>
                                                <p className="text-xs text-muted-foreground">{config.description}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        
                        <Separator />
                        
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="font-medium flex items-center gap-2">
                                    <Bluetooth className="w-4 h-4" />
                                    Discover Nearby Devices
                                </h4>
                                <Button onClick={startScan} disabled={scanning} size="sm">
                                    {scanning ? (
                                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Scanning...</>
                                    ) : (
                                        <><Search className="w-4 h-4 mr-2" />Scan</>
                                    )}
                                </Button>
                            </div>
                            
                            {scanning && (
                                <div className="flex flex-col items-center py-8">
                                    <div className="relative">
                                        <div className="w-20 h-20 rounded-full border-4 border-primary/30 animate-ping absolute" />
                                        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                                            <Bluetooth className="w-8 h-8 text-primary animate-pulse" />
                                        </div>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-4">Scanning for devices...</p>
                                </div>
                            )}
                            
                            {!scanning && discoveredDevices.length > 0 && (
                                <ScrollArea className="h-48">
                                    <div className="space-y-2">
                                        {discoveredDevices.map((device) => (
                                            <div
                                                key={device.id}
                                                onClick={() => {
                                                    setSelectedDevice(device);
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        device_name: device.name,
                                                        bluetooth_mac: device.mac,
                                                        wearable_type: device.type,
                                                    }));
                                                }}
                                                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                                                    selectedDevice?.id === device.id 
                                                        ? 'border-primary bg-primary/5' 
                                                        : 'hover:bg-muted'
                                                }`}
                                            >
                                                <Bluetooth className={`w-5 h-5 ${
                                                    device.rssi > -50 ? 'text-green-500' : 
                                                    device.rssi > -70 ? 'text-amber-500' : 'text-red-500'
                                                }`} />
                                                <div className="flex-1">
                                                    <p className="font-medium">{device.name}</p>
                                                    <p className="text-xs text-muted-foreground">{device.mac}</p>
                                                </div>
                                                <Badge variant="outline">
                                                    <Signal className="w-3 h-3 mr-1" />
                                                    {device.rssi} dBm
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            )}
                            
                            {!scanning && discoveredDevices.length === 0 && (
                                <Alert>
                                    <AlertDescription>
                                        No devices found. Click "Scan" or enter details manually below.
                                    </AlertDescription>
                                </Alert>
                            )}
                        </div>
                        
                        <Separator />
                        
                        <div className="space-y-4">
                            <h4 className="font-medium">Manual Entry</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <Label>Device Name *</Label>
                                    <Input
                                        value={formData.device_name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, device_name: e.target.value }))}
                                        placeholder="My Smart Band"
                                    />
                                </div>
                                <div>
                                    <Label>Serial Number</Label>
                                    <Input
                                        value={formData.device_serial}
                                        onChange={(e) => setFormData(prev => ({ ...prev, device_serial: e.target.value }))}
                                        placeholder="SN123456789"
                                    />
                                </div>
                                <div>
                                    <Label>NFC UID (Hex)</Label>
                                    <Input
                                        value={formData.nfc_uid}
                                        onChange={(e) => setFormData(prev => ({ ...prev, nfc_uid: e.target.value }))}
                                        placeholder="04:A5:B6:C7:D8"
                                    />
                                </div>
                                <div>
                                    <Label>Bluetooth MAC</Label>
                                    <Input
                                        value={formData.bluetooth_mac}
                                        onChange={(e) => setFormData(prev => ({ ...prev, bluetooth_mac: e.target.value }))}
                                        placeholder="AA:BB:CC:DD:EE:FF"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Step 2: Select User */}
                {step === 2 && (
                    <div className="space-y-4">
                        <Tabs value={searchType} onValueChange={setSearchType}>
                            <TabsList className="grid grid-cols-2 w-full">
                                <TabsTrigger value="student" className="flex items-center gap-2">
                                    <GraduationCap className="w-4 h-4" />
                                    Student
                                </TabsTrigger>
                                <TabsTrigger value="staff" className="flex items-center gap-2">
                                    <Briefcase className="w-4 h-4" />
                                    Staff
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                        
                        <div className="flex gap-2">
                            <div className="flex-1 relative">
                                <Input
                                    placeholder={`Search ${searchType} by name or ID...`}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
                                    className="pl-10"
                                />
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            </div>
                            <Button onClick={searchUsers} disabled={loading}>
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
                            </Button>
                        </div>
                        
                        {searchResults.length > 0 && (
                            <ScrollArea className="h-64 border rounded-lg">
                                <div className="p-2 space-y-2">
                                    {searchResults.map((user) => (
                                        <div
                                            key={user.id}
                                            onClick={() => setSelectedUser(user)}
                                            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                                                selectedUser?.id === user.id 
                                                    ? 'bg-primary/10 border-primary border' 
                                                    : 'hover:bg-muted border border-transparent'
                                            }`}
                                        >
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                                searchType === 'student' ? 'bg-blue-100' : 'bg-amber-100'
                                            }`}>
                                                {searchType === 'student' 
                                                    ? <GraduationCap className="w-5 h-5 text-blue-600" />
                                                    : <Briefcase className="w-5 h-5 text-amber-600" />
                                                }
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium">{user.full_name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {searchType === 'student' ? user.school_code : user.phone}
                                                </p>
                                            </div>
                                            {selectedUser?.id === user.id && (
                                                <CheckCircle2 className="w-5 h-5 text-primary" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        )}
                        
                        {selectedUser && (
                            <Alert className="border-primary/50 bg-primary/5">
                                <User className="w-4 h-4" />
                                <AlertDescription className="flex items-center justify-between">
                                    <span>Selected: <strong>{selectedUser.full_name}</strong></span>
                                    <Button variant="ghost" size="sm" onClick={() => setSelectedUser(null)}>
                                        <X className="w-4 h-4" />
                                    </Button>
                                </AlertDescription>
                            </Alert>
                        )}
                    </div>
                )}
                
                {/* Step 3: Confirm */}
                {step === 3 && (
                    <div className="space-y-4">
                        <Alert className="border-green-200 bg-green-50">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            <AlertDescription className="text-green-700">
                                Ready to pair! Please review the details below.
                            </AlertDescription>
                        </Alert>
                        
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Watch className="w-4 h-4" />
                                    Device Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Type:</span>
                                    <span className="font-medium">{wearableTypes[formData.wearable_type]?.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Name:</span>
                                    <span className="font-medium">{formData.device_name}</span>
                                </div>
                                {formData.device_serial && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Serial:</span>
                                        <span className="font-medium">{formData.device_serial}</span>
                                    </div>
                                )}
                                {formData.bluetooth_mac && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Bluetooth MAC:</span>
                                        <span className="font-medium font-mono">{formData.bluetooth_mac}</span>
                                    </div>
                                )}
                                {formData.nfc_uid && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">NFC UID:</span>
                                        <span className="font-medium font-mono">{formData.nfc_uid}</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                        
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    Assigned To
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-3">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                        searchType === 'student' ? 'bg-blue-100' : 'bg-amber-100'
                                    }`}>
                                        {searchType === 'student' 
                                            ? <GraduationCap className="w-6 h-6 text-blue-600" />
                                            : <Briefcase className="w-6 h-6 text-amber-600" />
                                        }
                                    </div>
                                    <div>
                                        <p className="font-semibold">{selectedUser?.full_name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {searchType === 'student' ? selectedUser?.school_code : selectedUser?.phone}
                                        </p>
                                        <Badge variant="outline" className="mt-1 capitalize">{searchType}</Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
                
                <DialogFooter className="flex justify-between">
                    <div>
                        {step > 1 && (
                            <Button variant="outline" onClick={() => setStep(s => s - 1)}>
                                Back
                            </Button>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onClose}>Cancel</Button>
                        {step < 3 ? (
                            <Button 
                                onClick={() => setStep(s => s + 1)}
                                disabled={step === 1 && !formData.device_name || step === 2 && !selectedUser}
                            >
                                Next
                            </Button>
                        ) : (
                            <Button onClick={handleSave} disabled={loading}>
                                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                <Link className="w-4 h-4 mr-2" />
                                Pair Device
                            </Button>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// ATTENDANCE HISTORY DIALOG
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

const AttendanceHistoryDialog = ({ open, onClose, wearable }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        if (open && wearable) {
            fetchHistory();
        }
    }, [open, wearable]);
    
    const fetchHistory = async () => {
        setLoading(true);
        
        // Fetch attendance logs for this wearable
        const { data, error } = await supabase
            .from('attendance_logs_unified')
            .select('*')
            .eq('device_id', wearable.id)
            .order('recorded_at', { ascending: false })
            .limit(50);
        
        if (!error) {
            setHistory(data || []);
        }
        setLoading(false);
    };
    
    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <History className="w-5 h-5" />
                        Attendance History - {wearable?.device_name}
                    </DialogTitle>
                </DialogHeader>
                
                <ScrollArea className="h-[400px]">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin" />
                        </div>
                    ) : history.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <History className="w-12 h-12 mx-auto mb-2 opacity-30" />
                            <p>No attendance records yet</p>
                        </div>
                    ) : (
                        <div className="space-y-3 p-1">
                            {history.map((record, idx) => (
                                <div key={idx} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                        record.attendance_type === 'check_in' ? 'bg-green-100' : 'bg-amber-100'
                                    }`}>
                                        {record.attendance_type === 'check_in' 
                                            ? <ArrowUpRight className="w-5 h-5 text-green-600" />
                                            : <ArrowDownRight className="w-5 h-5 text-amber-600" />
                                        }
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium capitalize">{record.attendance_type?.replace('_', ' ')}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(record.recorded_at).toLocaleString('en-IN')}
                                        </p>
                                    </div>
                                    <Badge variant="outline">{record.source || 'wearable'}</Badge>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
                
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// MAIN WEARABLE DEVICES COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

const WearableDevices = () => {
    const { user, currentSessionId, organizationId } = useAuth();
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    const { canView, canAdd, canEdit, canDelete } = usePermissions();
    
    const branchId = selectedBranch?.id || user?.profile?.branch_id;
    
    // State
    const [loading, setLoading] = useState(true);
    const [wearables, setWearables] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterUserType, setFilterUserType] = useState('all');
    
    // Dialogs
    const [pairDialogOpen, setPairDialogOpen] = useState(false);
    const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
    const [selectedWearable, setSelectedWearable] = useState(null);
    
    // Permissions
    const hasViewPermission = canView('attendance.wearables') || canView('attendance');
    const hasAddPermission = canAdd('attendance.wearables') || canAdd('attendance');
    const hasEditPermission = canEdit('attendance.wearables') || canEdit('attendance');
    const hasDeletePermission = canDelete('attendance.wearables') || canDelete('attendance');
    
    // Fetch wearables
    useEffect(() => {
        if (branchId) {
            fetchWearables();
        }
    }, [branchId]);
    
    const fetchWearables = async () => {
        setLoading(true);
        
        const { data, error } = await supabase
            .from('wearable_devices')
            .select('*')
            .eq('branch_id', branchId)
            .order('created_at', { ascending: false });
        
        if (error) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } else {
            setWearables(data || []);
        }
        
        setLoading(false);
    };
    
    // Filter wearables
    const filteredWearables = wearables.filter(w => {
        const matchesSearch = !searchTerm || 
            w.device_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            w.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            w.device_serial?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesType = filterType === 'all' || w.wearable_type === filterType;
        const matchesStatus = filterStatus === 'all' || 
            (filterStatus === 'connected' && (w.connection_status === 'connected' || w.connection_status === 'in_range')) ||
            (filterStatus === 'disconnected' && w.connection_status !== 'connected' && w.connection_status !== 'in_range');
        const matchesUserType = filterUserType === 'all' || w.user_type === filterUserType;
        
        return matchesSearch && matchesType && matchesStatus && matchesUserType;
    });
    
    // Stats
    const stats = {
        total: wearables.length,
        connected: wearables.filter(w => w.connection_status === 'connected' || w.connection_status === 'in_range').length,
        students: wearables.filter(w => w.user_type === 'student').length,
        staff: wearables.filter(w => w.user_type === 'staff').length,
        lowBattery: wearables.filter(w => (w.battery_level || 0) < 20).length,
    };
    
    // Handlers
    const handlePing = async (wearable) => {
        toast({
            title: '📳 Ping Sent!',
            description: `Vibration sent to ${wearable.device_name}`,
        });
    };
    
    const handleViewHistory = (wearable) => {
        setSelectedWearable(wearable);
        setHistoryDialogOpen(true);
    };
    
    const handleEdit = (wearable) => {
        // TODO: Implement edit dialog
        toast({ title: 'Edit coming soon', description: 'Edit functionality will be added' });
    };
    
    const handleUnpair = async (wearable) => {
        if (!confirm(`Are you sure you want to unpair ${wearable.device_name}?`)) return;
        
        const { error } = await supabase
            .from('wearable_devices')
            .delete()
            .eq('id', wearable.id);
        
        if (error) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } else {
            toast({ title: 'Device Unpaired', description: `${wearable.device_name} has been removed` });
            fetchWearables();
        }
    };
    
    return (
        <DashboardLayout>
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-violet-100">
                                <Watch className="w-6 h-6 text-violet-600" />
                            </div>
                            Wearable Devices
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Manage smart bands, watches, and NFC wristbands for attendance
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" onClick={fetchWearables}>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Refresh
                        </Button>
                        {hasAddPermission && (
                            <Button onClick={() => setPairDialogOpen(true)}>
                                <Plus className="w-4 h-4 mr-2" />
                                Pair New Device
                            </Button>
                        )}
                    </div>
                </div>
                
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Devices</p>
                                    <p className="text-2xl font-bold">{stats.total}</p>
                                </div>
                                <Watch className="w-8 h-8 text-violet-500" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Connected</p>
                                    <p className="text-2xl font-bold text-green-600">{stats.connected}</p>
                                </div>
                                <BluetoothConnected className="w-8 h-8 text-green-500" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Students</p>
                                    <p className="text-2xl font-bold text-blue-600">{stats.students}</p>
                                </div>
                                <GraduationCap className="w-8 h-8 text-blue-500" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Staff</p>
                                    <p className="text-2xl font-bold text-amber-600">{stats.staff}</p>
                                </div>
                                <Briefcase className="w-8 h-8 text-amber-500" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Low Battery</p>
                                    <p className="text-2xl font-bold text-red-600">{stats.lowBattery}</p>
                                </div>
                                <BatteryLow className="w-8 h-8 text-red-500" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
                
                {/* Filters */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="flex-1 min-w-[200px] relative">
                                <Input
                                    placeholder="Search devices, users..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            </div>
                            <Select value={filterType} onValueChange={setFilterType}>
                                <SelectTrigger className="w-[150px]">
                                    <SelectValue placeholder="Device Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="smart_band">Smart Band</SelectItem>
                                    <SelectItem value="smart_watch">Smart Watch</SelectItem>
                                    <SelectItem value="nfc_wristband">NFC Wristband</SelectItem>
                                    <SelectItem value="beacon_tag">Beacon Tag</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={filterStatus} onValueChange={setFilterStatus}>
                                <SelectTrigger className="w-[150px]">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="connected">Connected</SelectItem>
                                    <SelectItem value="disconnected">Disconnected</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={filterUserType} onValueChange={setFilterUserType}>
                                <SelectTrigger className="w-[150px]">
                                    <SelectValue placeholder="User Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Users</SelectItem>
                                    <SelectItem value="student">Students</SelectItem>
                                    <SelectItem value="staff">Staff</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>
                
                {/* Wearables Grid */}
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : filteredWearables.length === 0 ? (
                    <Card className="py-12">
                        <div className="text-center">
                            <Watch className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No Wearable Devices</h3>
                            <p className="text-muted-foreground mb-4">
                                {wearables.length === 0 
                                    ? "Start by pairing your first wearable device"
                                    : "No devices match your current filters"
                                }
                            </p>
                            {hasAddPermission && wearables.length === 0 && (
                                <Button onClick={() => setPairDialogOpen(true)}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Pair First Device
                                </Button>
                            )}
                        </div>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <AnimatePresence>
                            {filteredWearables.map((wearable) => (
                                <WearableCard
                                    key={wearable.id}
                                    wearable={wearable}
                                    onEdit={handleEdit}
                                    onUnpair={handleUnpair}
                                    onViewHistory={handleViewHistory}
                                    onPing={handlePing}
                                />
                            ))}
                        </AnimatePresence>
                    </div>
                )}
                
                {/* Pair Dialog */}
                <PairWearableDialog
                    open={pairDialogOpen}
                    onClose={() => setPairDialogOpen(false)}
                    branchId={branchId}
                    organizationId={organizationId}
                    onSaved={fetchWearables}
                />
                
                {/* History Dialog */}
                <AttendanceHistoryDialog
                    open={historyDialogOpen}
                    onClose={() => setHistoryDialogOpen(false)}
                    wearable={selectedWearable}
                />
            </div>
        </DashboardLayout>
    );
};

export default WearableDevices;
