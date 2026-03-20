// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// JASHCHAR ERP - AI CAMERA MANAGEMENT (Day 9)
// Manage IP Cameras, USB Cameras, and RTSP streams for AI Face Recognition
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { usePermissions } from '@/contexts/PermissionContext';
import { aiEngineApi } from '@/services/aiEngineApi';
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
import { Slider } from '@/components/ui/slider';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Video,
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
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Loader2,
    Camera,
    Monitor,
    Server,
    Network,
    Shield,
    Save,
    X,
    Zap,
    Globe,
    Database,
    Cpu,
    Play,
    Square,
    ScanFace,
    Gauge,
    Clock,
    Info,
    HardDrive,
    Usb,
    Radio
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// CAMERA TYPE CONFIGURATIONS
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

const cameraTypeConfig = {
    ip_camera: { 
        icon: Globe, 
        color: 'text-blue-500', 
        bg: 'bg-blue-100',
        label: 'IP Camera (RTSP)',
        description: 'Network camera with RTSP stream'
    },
    usb_camera: { 
        icon: Usb, 
        color: 'text-green-500', 
        bg: 'bg-green-100',
        label: 'USB Camera',
        description: 'Direct USB connected camera'
    },
    webcam: { 
        icon: Camera, 
        color: 'text-purple-500', 
        bg: 'bg-purple-100',
        label: 'Webcam',
        description: 'Built-in or external webcam'
    },
    nvr_channel: { 
        icon: HardDrive, 
        color: 'text-amber-500', 
        bg: 'bg-amber-100',
        label: 'NVR Channel',
        description: 'NVR/DVR channel stream'
    },
};

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// CAMERA CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

const CameraCard = ({ camera, onEdit, onDelete, onToggle, onTest, onPreview }) => {
    const [testing, setTesting] = useState(false);
    const config = cameraTypeConfig[camera.camera_type] || cameraTypeConfig.ip_camera;
    const Icon = config.icon;
    
    const isOnline = camera.status === 'online';
    
    const handleTest = async () => {
        setTesting(true);
        await onTest(camera);
        setTesting(false);
    };
    
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            whileHover={{ scale: 1.01 }}
        >
            <Card className={`relative overflow-hidden ${!camera.is_active ? 'opacity-60' : ''}`}>
                {/* Status indicator line */}
                <div className={`absolute top-0 left-0 right-0 h-1 ${isOnline ? 'bg-green-500' : camera.status === 'error' ? 'bg-red-500' : 'bg-gray-400'}`} />
                
                <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div className={`p-3 rounded-xl ${config.bg}`}>
                            <Icon className={`h-8 w-8 ${config.color}`} />
                        </div>
                        
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold truncate">{camera.camera_name}</h3>
                                <Badge variant={camera.is_active ? 'default' : 'secondary'} className="text-xs">
                                    {camera.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                                {camera.is_primary && (
                                    <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-300">
                                        Primary
                                    </Badge>
                                )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {config.label}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                {camera.location_name && (
                                    <span className="flex items-center gap-1">
                                        <MapPin className="w-3 h-3" />
                                        {camera.location_name}
                                    </span>
                                )}
                                {camera.purpose && (
                                    <span className="flex items-center gap-1">
                                        <ScanFace className="w-3 h-3" />
                                        {camera.purpose}
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
                                ) : camera.status === 'error' ? (
                                    <>
                                        <AlertTriangle className="w-4 h-4 text-red-500" />
                                        <span className="text-xs text-red-600">Error</span>
                                    </>
                                ) : (
                                    <>
                                        <WifiOff className="w-4 h-4 text-gray-500" />
                                        <span className="text-xs text-gray-600">Offline</span>
                                    </>
                                )}
                            </div>
                            {camera.resolution && (
                                <span className="text-xs text-muted-foreground">
                                    {camera.resolution}
                                </span>
                            )}
                        </div>
                    </div>
                    
                    {/* Connection info */}
                    {camera.stream_url && (
                        <div className="flex items-center gap-4 mt-4 pt-4 border-t text-xs text-muted-foreground">
                            <span className="flex items-center gap-1 truncate">
                                <Network className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">{camera.stream_url}</span>
                            </span>
                        </div>
                    )}
                </CardContent>
                
                <CardFooter className="bg-muted/30 border-t flex justify-between">
                    <div className="flex items-center gap-2">
                        <Switch 
                            checked={camera.is_active}
                            onCheckedChange={() => onToggle(camera)}
                        />
                        <span className="text-xs text-muted-foreground">Active</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => onPreview(camera)} title="Preview">
                            <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={handleTest} disabled={testing} title="Test Connection">
                            {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => onEdit(camera)} title="Edit">
                            <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => onDelete(camera)} 
                            className="text-destructive"
                            title="Delete"
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        </motion.div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// AI ENGINE STATUS COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

const AIEngineStatus = ({ health, indexStatus, onRebuildIndex }) => {
    const [rebuilding, setRebuilding] = useState(false);
    
    const handleRebuild = async () => {
        setRebuilding(true);
        await onRebuildIndex();
        setRebuilding(false);
    };
    
    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Cpu className="w-5 h-5 text-purple-500" />
                    AI Engine Status
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Health Status */}
                <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Engine Status</span>
                    {health ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Online
                        </Badge>
                    ) : (
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
                            <XCircle className="w-3 h-3 mr-1" />
                            Offline
                        </Badge>
                    )}
                </div>
                
                {/* Models Status */}
                {health && (
                    <>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Face Detector</span>
                            <Badge variant="outline" className={health.detector_loaded ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}>
                                {health.detector_loaded ? 'Loaded (YuNet)' : 'Not Loaded'}
                            </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Face Recognizer</span>
                            <Badge variant="outline" className={health.recognizer_loaded ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}>
                                {health.recognizer_loaded ? 'Loaded (ArcFace)' : 'Not Loaded'}
                            </Badge>
                        </div>
                    </>
                )}
                
                <Separator />
                
                {/* FAISS Index Status */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">FAISS Indexes</span>
                        <span className="text-sm font-medium">{indexStatus?.total_indexes || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Total Faces Enrolled</span>
                        <span className="text-sm font-medium">{indexStatus?.total_embeddings || 0}</span>
                    </div>
                </div>
                
                <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={handleRebuild}
                    disabled={rebuilding || !health}
                >
                    {rebuilding ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Rebuilding...
                        </>
                    ) : (
                        <>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Rebuild Index
                        </>
                    )}
                </Button>
            </CardContent>
        </Card>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// RECOGNITION SETTINGS COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

const RecognitionSettings = ({ settings, onSave }) => {
    const [localSettings, setLocalSettings] = useState(settings || {});
    const [saving, setSaving] = useState(false);
    
    useEffect(() => {
        if (settings) {
            setLocalSettings(settings);
        }
    }, [settings]);
    
    const handleSave = async () => {
        setSaving(true);
        await onSave(localSettings);
        setSaving(false);
    };
    
    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Settings className="w-5 h-5 text-blue-500" />
                    Recognition Settings
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Match Threshold */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <Label>Match Threshold</Label>
                        <span className="text-sm font-medium">{(localSettings.match_threshold || 0.6).toFixed(2)}</span>
                    </div>
                    <Slider
                        value={[localSettings.match_threshold || 0.6]}
                        onValueChange={([value]) => setLocalSettings(prev => ({ ...prev, match_threshold: value }))}
                        min={0.3}
                        max={0.9}
                        step={0.05}
                    />
                    <p className="text-xs text-muted-foreground">
                        Higher = stricter matching (recommended: 0.55-0.65)
                    </p>
                </div>
                
                {/* Liveness Detection */}
                <div className="flex items-center justify-between">
                    <div>
                        <Label>Liveness Detection</Label>
                        <p className="text-xs text-muted-foreground">Anti-spoofing check</p>
                    </div>
                    <Switch
                        checked={localSettings.liveness_enabled || false}
                        onCheckedChange={(checked) => setLocalSettings(prev => ({ ...prev, liveness_enabled: checked }))}
                    />
                </div>
                
                {/* Auto Attendance */}
                <div className="flex items-center justify-between">
                    <div>
                        <Label>Auto Mark Attendance</Label>
                        <p className="text-xs text-muted-foreground">Automatically mark when recognized</p>
                    </div>
                    <Switch
                        checked={localSettings.auto_attendance || true}
                        onCheckedChange={(checked) => setLocalSettings(prev => ({ ...prev, auto_attendance: checked }))}
                    />
                </div>
                
                {/* Cooldown Period */}
                <div className="space-y-2">
                    <Label>Cooldown Period (seconds)</Label>
                    <Input
                        type="number"
                        value={localSettings.cooldown_seconds || 30}
                        onChange={(e) => setLocalSettings(prev => ({ ...prev, cooldown_seconds: parseInt(e.target.value) }))}
                        min={10}
                        max={300}
                    />
                    <p className="text-xs text-muted-foreground">
                        Time before same person can be re-recognized
                    </p>
                </div>
                
                <Button 
                    className="w-full" 
                    onClick={handleSave}
                    disabled={saving}
                >
                    {saving ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4 mr-2" />
                            Save Settings
                        </>
                    )}
                </Button>
            </CardContent>
        </Card>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// CAMERA FORM DIALOG
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

const CameraFormDialog = ({ open, onClose, camera, onSave }) => {
    const [formData, setFormData] = useState({
        camera_name: '',
        camera_type: 'ip_camera',
        stream_url: '',
        location_name: '',
        purpose: 'entry',
        resolution: '1280x720',
        fps: 15,
        is_active: true,
        is_primary: false,
        credentials_username: '',
        credentials_password: '',
        notes: ''
    });
    const [saving, setSaving] = useState(false);
    
    useEffect(() => {
        if (camera) {
            setFormData({
                camera_name: camera.camera_name || '',
                camera_type: camera.camera_type || 'ip_camera',
                stream_url: camera.stream_url || '',
                location_name: camera.location_name || '',
                purpose: camera.purpose || 'entry',
                resolution: camera.resolution || '1280x720',
                fps: camera.fps || 15,
                is_active: camera.is_active !== false,
                is_primary: camera.is_primary || false,
                credentials_username: camera.credentials?.username || '',
                credentials_password: camera.credentials?.password || '',
                notes: camera.notes || ''
            });
        } else {
            setFormData({
                camera_name: '',
                camera_type: 'ip_camera',
                stream_url: '',
                location_name: '',
                purpose: 'entry',
                resolution: '1280x720',
                fps: 15,
                is_active: true,
                is_primary: false,
                credentials_username: '',
                credentials_password: '',
                notes: ''
            });
        }
    }, [camera, open]);
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        
        const payload = {
            ...formData,
            credentials: formData.credentials_username ? {
                username: formData.credentials_username,
                password: formData.credentials_password
            } : null
        };
        delete payload.credentials_username;
        delete payload.credentials_password;
        
        await onSave(payload, camera?.id);
        setSaving(false);
    };
    
    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Video className="w-5 h-5 text-blue-500" />
                        {camera ? 'Edit Camera' : 'Add New Camera'}
                    </DialogTitle>
                    <DialogDescription>
                        Configure camera settings for AI face recognition
                    </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Camera Name */}
                        <div className="space-y-2">
                            <Label htmlFor="camera_name">Camera Name *</Label>
                            <Input
                                id="camera_name"
                                value={formData.camera_name}
                                onChange={(e) => setFormData(prev => ({ ...prev, camera_name: e.target.value }))}
                                placeholder="Main Entrance Camera"
                                required
                            />
                        </div>
                        
                        {/* Camera Type */}
                        <div className="space-y-2">
                            <Label>Camera Type *</Label>
                            <Select 
                                value={formData.camera_type}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, camera_type: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(cameraTypeConfig).map(([key, cfg]) => (
                                        <SelectItem key={key} value={key}>
                                            <div className="flex items-center gap-2">
                                                <cfg.icon className={`w-4 h-4 ${cfg.color}`} />
                                                {cfg.label}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    
                    {/* Stream URL */}
                    <div className="space-y-2">
                        <Label htmlFor="stream_url">Stream URL / Device Path *</Label>
                        <Input
                            id="stream_url"
                            value={formData.stream_url}
                            onChange={(e) => setFormData(prev => ({ ...prev, stream_url: e.target.value }))}
                            placeholder="rtsp://192.168.1.100:554/stream1 or /dev/video0"
                            required
                        />
                        <p className="text-xs text-muted-foreground">
                            For IP cameras: rtsp://ip:port/path | For USB: /dev/video0 | For NVR: rtsp://ip:port/channel/1
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Location */}
                        <div className="space-y-2">
                            <Label htmlFor="location_name">Location</Label>
                            <Input
                                id="location_name"
                                value={formData.location_name}
                                onChange={(e) => setFormData(prev => ({ ...prev, location_name: e.target.value }))}
                                placeholder="Main Gate, Building A"
                            />
                        </div>
                        
                        {/* Purpose */}
                        <div className="space-y-2">
                            <Label>Purpose</Label>
                            <Select 
                                value={formData.purpose}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, purpose: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="entry">Entry</SelectItem>
                                    <SelectItem value="exit">Exit</SelectItem>
                                    <SelectItem value="both">Entry & Exit</SelectItem>
                                    <SelectItem value="classroom">Classroom</SelectItem>
                                    <SelectItem value="monitoring">Monitoring Only</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Resolution */}
                        <div className="space-y-2">
                            <Label>Resolution</Label>
                            <Select 
                                value={formData.resolution}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, resolution: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="640x480">640x480 (VGA)</SelectItem>
                                    <SelectItem value="1280x720">1280x720 (HD)</SelectItem>
                                    <SelectItem value="1920x1080">1920x1080 (FHD)</SelectItem>
                                    <SelectItem value="2560x1440">2560x1440 (2K)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        
                        {/* FPS */}
                        <div className="space-y-2">
                            <Label htmlFor="fps">FPS</Label>
                            <Input
                                id="fps"
                                type="number"
                                value={formData.fps}
                                onChange={(e) => setFormData(prev => ({ ...prev, fps: parseInt(e.target.value) }))}
                                min={5}
                                max={30}
                            />
                        </div>
                    </div>
                    
                    {/* Credentials (for RTSP) */}
                    {formData.camera_type === 'ip_camera' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="credentials_username">Username (optional)</Label>
                                <Input
                                    id="credentials_username"
                                    value={formData.credentials_username}
                                    onChange={(e) => setFormData(prev => ({ ...prev, credentials_username: e.target.value }))}
                                    placeholder="admin"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="credentials_password">Password (optional)</Label>
                                <Input
                                    id="credentials_password"
                                    type="password"
                                    value={formData.credentials_password}
                                    onChange={(e) => setFormData(prev => ({ ...prev, credentials_password: e.target.value }))}
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>
                    )}
                    
                    {/* Switches */}
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <Switch
                                checked={formData.is_active}
                                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                            />
                            <Label>Active</Label>
                        </div>
                        <div className="flex items-center gap-2">
                            <Switch
                                checked={formData.is_primary}
                                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_primary: checked }))}
                            />
                            <Label>Primary Camera</Label>
                        </div>
                    </div>
                    
                    {/* Notes */}
                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                            id="notes"
                            value={formData.notes}
                            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                            placeholder="Additional notes about this camera..."
                            rows={2}
                        />
                    </div>
                    
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={saving}>
                            {saving ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    {camera ? 'Update Camera' : 'Add Camera'}
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

const CameraManagement = () => {
    const { user, currentSessionId, organizationId } = useAuth();
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    const { canView, canCreate, canEdit, canDelete } = usePermissions();
    
    const branchId = selectedBranch?.id || user?.profile?.branch_id;
    
    // State
    const [cameras, setCameras] = useState([]);
    const [loading, setLoading] = useState(true);
    const [aiHealth, setAIHealth] = useState(null);
    const [indexStatus, setIndexStatus] = useState(null);
    const [recognitionSettings, setRecognitionSettings] = useState(null);
    
    // Dialog states
    const [formDialogOpen, setFormDialogOpen] = useState(false);
    const [selectedCamera, setSelectedCamera] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [cameraToDelete, setCameraToDelete] = useState(null);
    
    // Permissions
    const hasViewPermission = canView('attendance.camera_management') || canView('attendance');
    const hasCreatePermission = canCreate('attendance.camera_management') || canCreate('attendance');
    const hasEditPermission = canEdit('attendance.camera_management') || canEdit('attendance');
    const hasDeletePermission = canDelete('attendance.camera_management') || canDelete('attendance');
    
    // ═══════════════════════════════════════════════════════════════════════════════════════════════
    // DATA FETCHING
    // ═══════════════════════════════════════════════════════════════════════════════════════════════
    
    const fetchCameras = useCallback(async () => {
        try {
            const data = await aiEngineApi.getCameras();
            setCameras(data.cameras || []);
        } catch (error) {
            console.error('Error fetching cameras:', error);
            toast({
                title: 'Error',
                description: 'Failed to load cameras',
                variant: 'destructive'
            });
        }
    }, [toast]);
    
    const fetchAIStatus = useCallback(async () => {
        try {
            const [healthRes, index] = await Promise.all([
                aiEngineApi.checkHealth().catch(() => null),
                aiEngineApi.getIndexStatus().catch(() => null)
            ]);
            // Map backend response to expected frontend shape
            if (healthRes) {
                const models = healthRes.data?.models_ready || healthRes.models_ready || {};
                setAIHealth({
                    ...healthRes,
                    detector_loaded: models.face_detector || false,
                    recognizer_loaded: models.face_recognizer || false
                });
            } else {
                setAIHealth(null);
            }
            setIndexStatus(index);
        } catch (error) {
            console.error('Error fetching AI status:', error);
        }
    }, []);
    
    const fetchSettings = useCallback(async () => {
        try {
            const data = await aiEngineApi.getRecognitionSettings();
            setRecognitionSettings(data.settings || {});
        } catch (error) {
            console.error('Error fetching settings:', error);
        }
    }, []);
    
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await Promise.all([
                fetchCameras(),
                fetchAIStatus(),
                fetchSettings()
            ]);
            setLoading(false);
        };
        
        if (branchId) {
            loadData();
        }
    }, [branchId, fetchCameras, fetchAIStatus, fetchSettings]);
    
    // ═══════════════════════════════════════════════════════════════════════════════════════════════
    // HANDLERS
    // ═══════════════════════════════════════════════════════════════════════════════════════════════
    
    const handleAddCamera = () => {
        setSelectedCamera(null);
        setFormDialogOpen(true);
    };
    
    const handleEditCamera = (camera) => {
        setSelectedCamera(camera);
        setFormDialogOpen(true);
    };
    
    const handleSaveCamera = async (data, cameraId) => {
        try {
            if (cameraId) {
                await aiEngineApi.updateCamera(cameraId, data);
                toast({ title: 'Success', description: 'Camera updated successfully' });
            } else {
                await aiEngineApi.createCamera(data);
                toast({ title: 'Success', description: 'Camera added successfully' });
            }
            setFormDialogOpen(false);
            await fetchCameras();
        } catch (error) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to save camera',
                variant: 'destructive'
            });
        }
    };
    
    const handleDeleteClick = (camera) => {
        setCameraToDelete(camera);
        setDeleteDialogOpen(true);
    };
    
    const handleConfirmDelete = async () => {
        try {
            await aiEngineApi.deleteCamera(cameraToDelete.id);
            toast({ title: 'Success', description: 'Camera deleted successfully' });
            setDeleteDialogOpen(false);
            setCameraToDelete(null);
            await fetchCameras();
        } catch (error) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to delete camera',
                variant: 'destructive'
            });
        }
    };
    
    const handleToggleCamera = async (camera) => {
        try {
            await aiEngineApi.updateCamera(camera.id, { is_active: !camera.is_active });
            await fetchCameras();
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to update camera status',
                variant: 'destructive'
            });
        }
    };
    
    const handleTestCamera = async (camera) => {
        try {
            const result = await aiEngineApi.testCameraConnection(camera.id);
            if (result.success) {
                toast({
                    title: 'Connection Successful',
                    description: `Camera "${camera.camera_name}" is reachable`
                });
            } else {
                toast({
                    title: 'Connection Failed',
                    description: result.error || 'Unable to connect to camera',
                    variant: 'destructive'
                });
            }
            await fetchCameras();
        } catch (error) {
            toast({
                title: 'Test Failed',
                description: error.message || 'Connection test failed',
                variant: 'destructive'
            });
        }
    };
    
    const handlePreviewCamera = (camera) => {
        toast({
            title: 'Preview',
            description: 'Camera preview will be available in the next update'
        });
    };
    
    const handleSaveSettings = async (settings) => {
        try {
            await aiEngineApi.updateRecognitionSettings(settings);
            toast({ title: 'Success', description: 'Settings saved successfully' });
            await fetchSettings();
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to save settings',
                variant: 'destructive'
            });
        }
    };
    
    const handleRebuildIndex = async () => {
        try {
            await aiEngineApi.rebuildIndex(branchId);
            toast({ title: 'Success', description: 'Index rebuild started' });
            await fetchAIStatus();
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to rebuild index',
                variant: 'destructive'
            });
        }
    };
    
    // ═══════════════════════════════════════════════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════════════════════════════════════════════
    
    if (!hasViewPermission) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-[60vh]">
                    <Alert variant="destructive" className="max-w-md">
                        <Shield className="w-4 h-4" />
                        <AlertDescription>
                            You don't have permission to view Camera Management.
                        </AlertDescription>
                    </Alert>
                </div>
            </DashboardLayout>
        );
    }
    
    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Video className="w-7 h-7 text-blue-600" />
                            AI Camera Management
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Manage cameras for AI-powered face recognition attendance
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={() => { fetchCameras(); fetchAIStatus(); }}>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Refresh
                        </Button>
                        {hasCreatePermission && (
                            <Button onClick={handleAddCamera}>
                                <Plus className="w-4 h-4 mr-2" />
                                Add Camera
                            </Button>
                        )}
                    </div>
                </div>
                
                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Camera List */}
                    <div className="lg:col-span-2 space-y-4">
                        {loading ? (
                            <Card className="p-8">
                                <div className="flex items-center justify-center">
                                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                                </div>
                            </Card>
                        ) : cameras.length === 0 ? (
                            <Card className="p-8">
                                <div className="text-center space-y-4">
                                    <Video className="w-16 h-16 mx-auto text-muted-foreground" />
                                    <div>
                                        <h3 className="font-semibold text-lg">No Cameras Configured</h3>
                                        <p className="text-muted-foreground">
                                            Add your first camera to start AI face recognition
                                        </p>
                                    </div>
                                    {hasCreatePermission && (
                                        <Button onClick={handleAddCamera}>
                                            <Plus className="w-4 h-4 mr-2" />
                                            Add First Camera
                                        </Button>
                                    )}
                                </div>
                            </Card>
                        ) : (
                            <AnimatePresence>
                                {cameras.map((camera) => (
                                    <CameraCard
                                        key={camera.id}
                                        camera={camera}
                                        onEdit={hasEditPermission ? handleEditCamera : null}
                                        onDelete={hasDeletePermission ? handleDeleteClick : null}
                                        onToggle={hasEditPermission ? handleToggleCamera : null}
                                        onTest={handleTestCamera}
                                        onPreview={handlePreviewCamera}
                                    />
                                ))}
                            </AnimatePresence>
                        )}
                    </div>
                    
                    {/* Sidebar */}
                    <div className="space-y-4">
                        <AIEngineStatus 
                            health={aiHealth} 
                            indexStatus={indexStatus}
                            onRebuildIndex={handleRebuildIndex}
                        />
                        <RecognitionSettings 
                            settings={recognitionSettings}
                            onSave={handleSaveSettings}
                        />
                    </div>
                </div>
            </div>
            
            {/* Camera Form Dialog */}
            <CameraFormDialog
                open={formDialogOpen}
                onClose={() => setFormDialogOpen(false)}
                camera={selectedCamera}
                onSave={handleSaveCamera}
            />
            
            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="w-5 h-5" />
                            Delete Camera
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete "{cameraToDelete?.camera_name}"? 
                            This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleConfirmDelete}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
};

export default CameraManagement;
