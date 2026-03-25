// ╔═══════════════════════════════════════════════════════════════════════════════════╗
// ║  DAY 40: FACE ATTENDANCE ADMIN SETTINGS & LAUNCH CHECKLIST                       ║
// ║  Master Configuration, AI Tuning, System Settings, Go-Live Checklist             ║
// ╚═══════════════════════════════════════════════════════════════════════════════════╝

import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/lib/supabaseClient';
import { aiEngineApi } from '@/services/aiEngineApi';
import { formatDate } from '@/utils/dateUtils';
import {
  Settings, Save, RotateCcw, Shield, Brain, Camera, Bell,
  Clock, Zap, Eye, CheckCircle, XCircle, AlertTriangle,
  Rocket, Lock, Database, Server, Monitor, Smartphone,
  RefreshCw, ChevronRight, Gauge
} from 'lucide-react';

// ═══════════════════════════════ SETTINGS STATE ═══════════════════════════════
const defaultSettings = {
  // AI Recognition Settings
  ai: {
    confidenceThreshold: 0.6,
    maxFaceDistance: 0.4,
    minFaceSize: 80,
    maxFacesPerFrame: 20,
    recognitionModel: 'buffalo_l',
    embeddingDimension: 512,
    enableGPU: false,
    batchProcessing: true,
  },
  // Liveness & Anti-Spoof Settings
  security: {
    livenessEnabled: true,
    livenessSensitivity: 'medium',
    photoAttackDetection: true,
    videoReplayDetection: true,
    maskDetection: true,
    spoofAlertEnabled: true,
    maxSpoofAttemptsBeforeLock: 3,
    spoofLockDurationMinutes: 30,
  },
  // Attendance Settings
  attendance: {
    autoMarkAttendance: true,
    requireLivenessForAttendance: true,
    allowMultipleCheckins: false,
    entryWindowStart: '07:00',
    entryWindowEnd: '10:00',
    exitWindowStart: '14:00',
    exitWindowEnd: '17:00',
    lateThresholdMinutes: 15,
    absentAfterMinutes: 60,
    weekendDays: [0, 6],
  },
  // Camera Settings
  camera: {
    defaultResolution: '720p',
    frameRate: 15,
    captureInterval: 2,
    enableNightVision: false,
    motionDetection: true,
    saveUnknownFaces: true,
    maxConcurrentCameras: 10,
  },
  // Notification Settings
  notifications: {
    enabled: true,
    instantArrival: true,
    instantDeparture: false,
    lateAlert: true,
    absentAlert: true,
    spoofAlert: true,
    quietHoursStart: '21:00',
    quietHoursEnd: '07:00',
    smsEnabled: false,
    emailEnabled: true,
    pushEnabled: true,
    whatsappEnabled: false,
  },
  // System Settings
  system: {
    dataRetentionDays: 365,
    logLevel: 'info',
    autoRebuildIndex: true,
    rebuildIndexInterval: 'weekly',
    enableAnalytics: true,
    enableMobileAPI: true,
    maintenanceMode: false,
  },
};

// ═══════════════════════════════ SETTINGS SECTION ═══════════════════════════════
const SettingsSection = ({ title, icon: Icon, children }) => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-sm flex items-center gap-2">
        <Icon className="w-4 h-4 text-blue-600" />
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      {children}
    </CardContent>
  </Card>
);

const SettingRow = ({ label, description, children }) => (
  <div className="flex items-center justify-between py-2">
    <div className="flex-1">
      <Label className="text-sm font-medium">{label}</Label>
      {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
    </div>
    <div className="ml-4">{children}</div>
  </div>
);

// ═══════════════════════════════ LAUNCH CHECKLIST ═══════════════════════════════
const LaunchCheckItem = ({ label, status, detail, onCheck }) => {
  const icons = {
    passed: <CheckCircle className="w-5 h-5 text-green-500" />,
    failed: <XCircle className="w-5 h-5 text-red-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
    checking: <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />,
    pending: <div className="w-5 h-5 border-2 border-gray-300 dark:border-gray-600 rounded-full" />,
  };

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg hover:shadow-sm transition-shadow">
      <div className="flex items-center gap-3">
        {icons[status]}
        <div>
          <p className="text-sm font-medium">{label}</p>
          {detail && <p className="text-xs text-gray-500 dark:text-gray-400">{detail}</p>}
        </div>
      </div>
      <Button variant="ghost" size="sm" onClick={onCheck} disabled={status === 'checking'}>
        <RefreshCw className="w-4 h-4" />
      </Button>
    </div>
  );
};

// ═══════════════════════════════ MAIN COMPONENT ═══════════════════════════════
export default function FaceAttendanceAdminSettings() {
  const { user, currentSessionId, organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  const branchId = selectedBranch?.id;

  const [settings, setSettings] = useState(defaultSettings);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [launchChecklist, setLaunchChecklist] = useState({
    aiEngine: 'pending',
    faissIndex: 'pending',
    cameras: 'pending',
    facesRegistered: 'pending',
    attendanceRules: 'pending',
    notifications: 'pending',
    testsPassing: 'pending',
    security: 'pending',
  });

  // ═══════════════════ LOAD SETTINGS ═══════════════════
  const loadSettings = useCallback(async () => {
    if (!branchId || !organizationId) return;
    try {
      const { data, error } = await supabase
        .from('face_attendance_settings')
        .select('*')
        .eq('branch_id', branchId)
        .eq('organization_id', organizationId)
        .maybeSingle();

      if (data && !error) {
        setSettings(prev => ({ ...prev, ...data.settings }));
      }
    } catch {
      // Use defaults
    }
  }, [branchId, organizationId]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // ═══════════════════ UPDATE SETTING ═══════════════════
  const updateSetting = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: { ...prev[category], [key]: value },
    }));
    setHasChanges(true);
  };

  // ═══════════════════ SAVE SETTINGS ═══════════════════
  const saveSettings = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('face_attendance_settings')
        .upsert({
          branch_id: branchId,
          organization_id: organizationId,
          session_id: currentSessionId,
          settings: settings,
          updated_by: user?.id,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'branch_id,organization_id' });

      if (!error) {
        setHasChanges(false);
      }
    } catch (err) {
      console.error('Save error:', err);
    }
    setSaving(false);
  };

  // ═══════════════════ RESET TO DEFAULTS ═══════════════════
  const resetDefaults = () => {
    setSettings(defaultSettings);
    setHasChanges(true);
  };

  // ═══════════════════ RUN LAUNCH CHECK ═══════════════════
  const runLaunchCheck = async (checkKey) => {
    setLaunchChecklist(prev => ({ ...prev, [checkKey]: 'checking' }));

    try {
      switch (checkKey) {
        case 'aiEngine': {
          const data = await aiEngineApi.checkHealth();
          setLaunchChecklist(prev => ({
            ...prev,
            aiEngine: data ? 'passed' : 'failed',
          }));
          break;
        }
        case 'faissIndex': {
          const data = await aiEngineApi.getIndexStatus();
          const totalFaces = data?.total_faces || data?.data?.total_faces || 0;
          setLaunchChecklist(prev => ({
            ...prev,
            faissIndex: totalFaces > 0 ? 'passed' : 'warning',
          }));
          break;
        }
        case 'cameras': {
          const { data, error } = await supabase
            .from('ai_cameras')
            .select('id, status')
            .eq('branch_id', branchId);
          const active = data?.filter(c => c.status === 'active').length || 0;
          setLaunchChecklist(prev => ({
            ...prev,
            cameras: !error && active > 0 ? 'passed' : active === 0 && data?.length > 0 ? 'warning' : 'failed',
          }));
          break;
        }
        case 'facesRegistered': {
          const { count, error } = await supabase
            .from('face_embeddings')
            .select('id', { count: 'exact', head: true })
            .eq('branch_id', branchId);
          setLaunchChecklist(prev => ({
            ...prev,
            facesRegistered: !error && count > 0 ? 'passed' : 'warning',
          }));
          break;
        }
        case 'attendanceRules': {
          setLaunchChecklist(prev => ({
            ...prev,
            attendanceRules: settings.attendance.entryWindowStart ? 'passed' : 'warning',
          }));
          break;
        }
        case 'notifications': {
          const hasChannel = settings.notifications.smsEnabled ||
            settings.notifications.emailEnabled ||
            settings.notifications.pushEnabled;
          setLaunchChecklist(prev => ({
            ...prev,
            notifications: hasChannel ? 'passed' : 'warning',
          }));
          break;
        }
        case 'testsPassing': {
          // Quick health + index check via backend proxy
          try {
            const [h, i] = await Promise.all([
              aiEngineApi.checkHealth(),
              aiEngineApi.getIndexStatus(),
            ]);
            setLaunchChecklist(prev => ({
              ...prev,
              testsPassing: h && i ? 'passed' : 'warning',
            }));
          } catch {
            setLaunchChecklist(prev => ({ ...prev, testsPassing: 'failed' }));
          }
          break;
        }
        case 'security': {
          setLaunchChecklist(prev => ({
            ...prev,
            security: settings.security.livenessEnabled ? 'passed' : 'warning',
          }));
          break;
        }
        default:
          break;
      }
    } catch {
      setLaunchChecklist(prev => ({ ...prev, [checkKey]: 'failed' }));
    }
  };

  // ═══════════════════ RUN ALL LAUNCH CHECKS ═══════════════════
  const runAllLaunchChecks = async () => {
    const keys = Object.keys(launchChecklist);
    for (const key of keys) {
      await runLaunchCheck(key);
    }
  };

  const passedChecks = Object.values(launchChecklist).filter(v => v === 'passed').length;
  const totalChecks = Object.keys(launchChecklist).length;
  const isReadyToLaunch = passedChecks === totalChecks;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* ═══════ HEADER ═══════ */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Settings className="w-7 h-7 text-blue-600" />
              🎛️ Face Attendance Admin Settings
            </h1>
            <p className="text-gray-500 mt-1">
              Master configuration, AI tuning, security settings & launch prep
            </p>
          </div>
          <div className="flex gap-2">
          <Button variant="outline" onClick={resetDefaults}>
            <RotateCcw className="w-4 h-4 mr-2" /> Reset Defaults
          </Button>
          <Button onClick={saveSettings} disabled={!hasChanges || saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>

      {hasChanges && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Unsaved Changes</AlertTitle>
          <AlertDescription>You have unsaved changes. Click "Save Settings" to apply.</AlertDescription>
        </Alert>
      )}

      {/* ═══════ MAIN TABS ═══════ */}
      <Tabs defaultValue="ai" className="space-y-4">
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="ai"><Brain className="w-4 h-4 mr-1" /> AI Engine</TabsTrigger>
          <TabsTrigger value="security"><Shield className="w-4 h-4 mr-1" /> Security</TabsTrigger>
          <TabsTrigger value="attendance"><Clock className="w-4 h-4 mr-1" /> Attendance</TabsTrigger>
          <TabsTrigger value="camera"><Camera className="w-4 h-4 mr-1" /> Camera</TabsTrigger>
          <TabsTrigger value="system"><Server className="w-4 h-4 mr-1" /> System</TabsTrigger>
          <TabsTrigger value="launch"><Rocket className="w-4 h-4 mr-1" /> Launch</TabsTrigger>
        </TabsList>

        {/* ═══════ AI ENGINE SETTINGS ═══════ */}
        <TabsContent value="ai" className="space-y-4">
          <SettingsSection title="Face Recognition Configuration" icon={Brain}>
            <SettingRow label="Confidence Threshold" description={`Current: ${settings.ai.confidenceThreshold} (Higher = stricter matching)`}>
              <div className="w-48 flex items-center gap-2">
                <Slider
                  value={[settings.ai.confidenceThreshold]}
                  min={0.3}
                  max={0.95}
                  step={0.05}
                  onValueChange={([v]) => updateSetting('ai', 'confidenceThreshold', v)}
                />
                <span className="text-sm font-mono w-12">{settings.ai.confidenceThreshold}</span>
              </div>
            </SettingRow>

            <Separator />

            <SettingRow label="Max Face Distance" description={`Current: ${settings.ai.maxFaceDistance} (Lower = more precise)`}>
              <div className="w-48 flex items-center gap-2">
                <Slider
                  value={[settings.ai.maxFaceDistance]}
                  min={0.2}
                  max={0.8}
                  step={0.05}
                  onValueChange={([v]) => updateSetting('ai', 'maxFaceDistance', v)}
                />
                <span className="text-sm font-mono w-12">{settings.ai.maxFaceDistance}</span>
              </div>
            </SettingRow>

            <Separator />

            <SettingRow label="Minimum Face Size (px)" description="Minimum face detection size in pixels">
              <Input
                type="number"
                value={settings.ai.minFaceSize}
                onChange={(e) => updateSetting('ai', 'minFaceSize', parseInt(e.target.value) || 80)}
                className="w-24"
              />
            </SettingRow>

            <Separator />

            <SettingRow label="Max Faces Per Frame" description="Maximum simultaneous faces to process">
              <Input
                type="number"
                value={settings.ai.maxFacesPerFrame}
                onChange={(e) => updateSetting('ai', 'maxFacesPerFrame', parseInt(e.target.value) || 20)}
                className="w-24"
              />
            </SettingRow>

            <Separator />

            <SettingRow label="Recognition Model" description="ArcFace model variant">
              <Select value={settings.ai.recognitionModel} onValueChange={(v) => updateSetting('ai', 'recognitionModel', v)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="buffalo_l">Buffalo L (Best)</SelectItem>
                  <SelectItem value="buffalo_m">Buffalo M (Balanced)</SelectItem>
                  <SelectItem value="buffalo_s">Buffalo S (Fast)</SelectItem>
                </SelectContent>
              </Select>
            </SettingRow>

            <Separator />

            <SettingRow label="GPU Acceleration" description="Use NVIDIA CUDA for faster processing">
              <Switch
                checked={settings.ai.enableGPU}
                onCheckedChange={(v) => updateSetting('ai', 'enableGPU', v)}
              />
            </SettingRow>

            <SettingRow label="Batch Processing" description="Process multiple faces in batched mode">
              <Switch
                checked={settings.ai.batchProcessing}
                onCheckedChange={(v) => updateSetting('ai', 'batchProcessing', v)}
              />
            </SettingRow>
          </SettingsSection>
        </TabsContent>

        {/* ═══════ SECURITY SETTINGS ═══════ */}
        <TabsContent value="security" className="space-y-4">
          <SettingsSection title="Liveness & Anti-Spoof Detection" icon={Shield}>
            <SettingRow label="Liveness Detection" description="Verify the person is real (not a photo/video)">
              <Switch
                checked={settings.security.livenessEnabled}
                onCheckedChange={(v) => updateSetting('security', 'livenessEnabled', v)}
              />
            </SettingRow>

            <Separator />

            <SettingRow label="Detection Sensitivity" description="How strict the anti-spoof checks are">
              <Select
                value={settings.security.livenessSensitivity}
                onValueChange={(v) => updateSetting('security', 'livenessSensitivity', v)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </SettingRow>

            <Separator />

            <SettingRow label="Photo Attack Detection" description="Detect printed photo attacks">
              <Switch
                checked={settings.security.photoAttackDetection}
                onCheckedChange={(v) => updateSetting('security', 'photoAttackDetection', v)}
              />
            </SettingRow>

            <SettingRow label="Video Replay Detection" description="Detect video replay attacks">
              <Switch
                checked={settings.security.videoReplayDetection}
                onCheckedChange={(v) => updateSetting('security', 'videoReplayDetection', v)}
              />
            </SettingRow>

            <SettingRow label="Mask Detection" description="Detect 3D mask attacks">
              <Switch
                checked={settings.security.maskDetection}
                onCheckedChange={(v) => updateSetting('security', 'maskDetection', v)}
              />
            </SettingRow>

            <Separator />

            <SettingRow label="Spoof Alert Notifications" description="Send alerts on detected spoof attempts">
              <Switch
                checked={settings.security.spoofAlertEnabled}
                onCheckedChange={(v) => updateSetting('security', 'spoofAlertEnabled', v)}
              />
            </SettingRow>

            <SettingRow label="Lock After Failed Attempts" description="Lock after N spoof attempts">
              <Input
                type="number"
                value={settings.security.maxSpoofAttemptsBeforeLock}
                onChange={(e) => updateSetting('security', 'maxSpoofAttemptsBeforeLock', parseInt(e.target.value) || 3)}
                className="w-20"
              />
            </SettingRow>

            <SettingRow label="Lock Duration (minutes)" description="How long to lock after spoof detection">
              <Input
                type="number"
                value={settings.security.spoofLockDurationMinutes}
                onChange={(e) => updateSetting('security', 'spoofLockDurationMinutes', parseInt(e.target.value) || 30)}
                className="w-20"
              />
            </SettingRow>
          </SettingsSection>
        </TabsContent>

        {/* ═══════ ATTENDANCE SETTINGS ═══════ */}
        <TabsContent value="attendance" className="space-y-4">
          <SettingsSection title="Attendance Configuration" icon={Clock}>
            <SettingRow label="Auto-Mark Attendance" description="Automatically mark attendance on face recognition">
              <Switch
                checked={settings.attendance.autoMarkAttendance}
                onCheckedChange={(v) => updateSetting('attendance', 'autoMarkAttendance', v)}
              />
            </SettingRow>

            <SettingRow label="Require Liveness Check" description="Require liveness verification for attendance">
              <Switch
                checked={settings.attendance.requireLivenessForAttendance}
                onCheckedChange={(v) => updateSetting('attendance', 'requireLivenessForAttendance', v)}
              />
            </SettingRow>

            <SettingRow label="Allow Multiple Check-ins" description="Allow re-checking in the same day">
              <Switch
                checked={settings.attendance.allowMultipleCheckins}
                onCheckedChange={(v) => updateSetting('attendance', 'allowMultipleCheckins', v)}
              />
            </SettingRow>

            <Separator />

            <SettingRow label="Entry Window" description="When students can check in">
              <div className="flex items-center gap-2">
                <Input
                  type="time"
                  value={settings.attendance.entryWindowStart}
                  onChange={(e) => updateSetting('attendance', 'entryWindowStart', e.target.value)}
                  className="w-32"
                />
                <span className="text-xs text-gray-400">to</span>
                <Input
                  type="time"
                  value={settings.attendance.entryWindowEnd}
                  onChange={(e) => updateSetting('attendance', 'entryWindowEnd', e.target.value)}
                  className="w-32"
                />
              </div>
            </SettingRow>

            <SettingRow label="Exit Window" description="When students can check out">
              <div className="flex items-center gap-2">
                <Input
                  type="time"
                  value={settings.attendance.exitWindowStart}
                  onChange={(e) => updateSetting('attendance', 'exitWindowStart', e.target.value)}
                  className="w-32"
                />
                <span className="text-xs text-gray-400">to</span>
                <Input
                  type="time"
                  value={settings.attendance.exitWindowEnd}
                  onChange={(e) => updateSetting('attendance', 'exitWindowEnd', e.target.value)}
                  className="w-32"
                />
              </div>
            </SettingRow>

            <Separator />

            <SettingRow label="Late Threshold (minutes)" description="Minutes after start to mark as late">
              <Input
                type="number"
                value={settings.attendance.lateThresholdMinutes}
                onChange={(e) => updateSetting('attendance', 'lateThresholdMinutes', parseInt(e.target.value) || 15)}
                className="w-24"
              />
            </SettingRow>

            <SettingRow label="Absent After (minutes)" description="Minutes after start to mark as absent">
              <Input
                type="number"
                value={settings.attendance.absentAfterMinutes}
                onChange={(e) => updateSetting('attendance', 'absentAfterMinutes', parseInt(e.target.value) || 60)}
                className="w-24"
              />
            </SettingRow>
          </SettingsSection>
        </TabsContent>

        {/* ═══════ CAMERA SETTINGS ═══════ */}
        <TabsContent value="camera" className="space-y-4">
          <SettingsSection title="Camera Configuration" icon={Camera}>
            <SettingRow label="Default Resolution" description="Default camera capture resolution">
              <Select value={settings.camera.defaultResolution} onValueChange={(v) => updateSetting('camera', 'defaultResolution', v)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="480p">480p</SelectItem>
                  <SelectItem value="720p">720p</SelectItem>
                  <SelectItem value="1080p">1080p</SelectItem>
                </SelectContent>
              </Select>
            </SettingRow>

            <SettingRow label="Frame Rate" description="Frames per second for processing">
              <Input
                type="number"
                value={settings.camera.frameRate}
                onChange={(e) => updateSetting('camera', 'frameRate', parseInt(e.target.value) || 15)}
                className="w-24"
              />
            </SettingRow>

            <SettingRow label="Capture Interval (seconds)" description="Seconds between face capture attempts">
              <Input
                type="number"
                value={settings.camera.captureInterval}
                onChange={(e) => updateSetting('camera', 'captureInterval', parseInt(e.target.value) || 2)}
                className="w-24"
              />
            </SettingRow>

            <Separator />

            <SettingRow label="Night Vision / IR" description="Enable infrared camera support">
              <Switch
                checked={settings.camera.enableNightVision}
                onCheckedChange={(v) => updateSetting('camera', 'enableNightVision', v)}
              />
            </SettingRow>

            <SettingRow label="Motion Detection" description="Only process when motion detected">
              <Switch
                checked={settings.camera.motionDetection}
                onCheckedChange={(v) => updateSetting('camera', 'motionDetection', v)}
              />
            </SettingRow>

            <SettingRow label="Save Unknown Faces" description="Store unrecognized face snapshots">
              <Switch
                checked={settings.camera.saveUnknownFaces}
                onCheckedChange={(v) => updateSetting('camera', 'saveUnknownFaces', v)}
              />
            </SettingRow>

            <SettingRow label="Max Concurrent Cameras" description="Maximum cameras processing simultaneously">
              <Input
                type="number"
                value={settings.camera.maxConcurrentCameras}
                onChange={(e) => updateSetting('camera', 'maxConcurrentCameras', parseInt(e.target.value) || 10)}
                className="w-24"
              />
            </SettingRow>
          </SettingsSection>
        </TabsContent>

        {/* ═══════ SYSTEM SETTINGS ═══════ */}
        <TabsContent value="system" className="space-y-4">
          <SettingsSection title="System Configuration" icon={Server}>
            <SettingRow label="Data Retention (days)" description="How long to keep recognition logs">
              <Input
                type="number"
                value={settings.system.dataRetentionDays}
                onChange={(e) => updateSetting('system', 'dataRetentionDays', parseInt(e.target.value) || 365)}
                className="w-24"
              />
            </SettingRow>

            <SettingRow label="Log Level" description="System logging verbosity">
              <Select value={settings.system.logLevel} onValueChange={(v) => updateSetting('system', 'logLevel', v)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="warn">Warning</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="debug">Debug</SelectItem>
                </SelectContent>
              </Select>
            </SettingRow>

            <Separator />

            <SettingRow label="Auto Rebuild FAISS Index" description="Periodically rebuild the search index">
              <Switch
                checked={settings.system.autoRebuildIndex}
                onCheckedChange={(v) => updateSetting('system', 'autoRebuildIndex', v)}
              />
            </SettingRow>

            <SettingRow label="Rebuild Interval" description="How often to auto-rebuild">
              <Select value={settings.system.rebuildIndexInterval} onValueChange={(v) => updateSetting('system', 'rebuildIndexInterval', v)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </SettingRow>

            <Separator />

            <SettingRow label="Enable Analytics" description="Collect and display analytics data">
              <Switch
                checked={settings.system.enableAnalytics}
                onCheckedChange={(v) => updateSetting('system', 'enableAnalytics', v)}
              />
            </SettingRow>

            <SettingRow label="Enable Mobile API" description="Mobile app access for parents/teachers">
              <Switch
                checked={settings.system.enableMobileAPI}
                onCheckedChange={(v) => updateSetting('system', 'enableMobileAPI', v)}
              />
            </SettingRow>

            <Separator />

            <SettingRow label="Maintenance Mode" description="⚠️ Disables all face recognition temporarily">
              <Switch
                checked={settings.system.maintenanceMode}
                onCheckedChange={(v) => updateSetting('system', 'maintenanceMode', v)}
              />
            </SettingRow>

            {settings.system.maintenanceMode && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Maintenance Mode Active</AlertTitle>
                <AlertDescription>
                  Face recognition and attendance marking are currently disabled. Turn off maintenance mode to resume normal operation.
                </AlertDescription>
              </Alert>
            )}
          </SettingsSection>
        </TabsContent>

        {/* ═══════ LAUNCH CHECKLIST ═══════ */}
        <TabsContent value="launch" className="space-y-4">
          <Card className="border-2 border-blue-200">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Rocket className="w-5 h-5 text-blue-600" />
                    🚀 Go-Live Launch Checklist
                  </CardTitle>
                  <CardDescription>
                    Verify all systems are ready before launching AI Face Attendance
                  </CardDescription>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">
                    {passedChecks}/{totalChecks}
                  </div>
                  <Button size="sm" onClick={runAllLaunchChecks} className="mt-1">
                    <RefreshCw className="w-4 h-4 mr-1" /> Check All
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <LaunchCheckItem
                label="AI Engine (Python FastAPI)"
                status={launchChecklist.aiEngine}
                detail="Port 8501 - InsightFace + FAISS"
                onCheck={() => runLaunchCheck('aiEngine')}
              />
              <LaunchCheckItem
                label="FAISS Vector Index"
                status={launchChecklist.faissIndex}
                detail="Face embedding search index built"
                onCheck={() => runLaunchCheck('faissIndex')}
              />
              <LaunchCheckItem
                label="AI Cameras Configured"
                status={launchChecklist.cameras}
                detail="At least one camera active"
                onCheck={() => runLaunchCheck('cameras')}
              />
              <LaunchCheckItem
                label="Faces Registered"
                status={launchChecklist.facesRegistered}
                detail="Student/staff face embeddings stored"
                onCheck={() => runLaunchCheck('facesRegistered')}
              />
              <LaunchCheckItem
                label="Attendance Rules Configured"
                status={launchChecklist.attendanceRules}
                detail="Entry/exit windows, thresholds set"
                onCheck={() => runLaunchCheck('attendanceRules')}
              />
              <LaunchCheckItem
                label="Notification Channels"
                status={launchChecklist.notifications}
                detail="SMS/Email/Push configured"
                onCheck={() => runLaunchCheck('notifications')}
              />
              <LaunchCheckItem
                label="System Tests Passing"
                status={launchChecklist.testsPassing}
                detail="Health & connectivity tests green"
                onCheck={() => runLaunchCheck('testsPassing')}
              />
              <LaunchCheckItem
                label="Security Module Active"
                status={launchChecklist.security}
                detail="Liveness + Anti-spoof enabled"
                onCheck={() => runLaunchCheck('security')}
              />
            </CardContent>
          </Card>

          {/* Launch Status */}
          {passedChecks > 0 && (
            <Card className={`border-2 ${isReadyToLaunch ? 'border-green-300 bg-green-50' : 'border-yellow-300 bg-yellow-50'}`}>
              <CardContent className="p-6 text-center">
                {isReadyToLaunch ? (
                  <>
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
                    <h2 className="text-xl font-bold text-green-800 mt-3">🎉 System Ready for Launch!</h2>
                    <p className="text-green-600 mt-1">All checks passed. AI Face Attendance is ready to go live.</p>
                    <Button className="mt-4 bg-green-600 hover:bg-green-700">
                      <Rocket className="w-4 h-4 mr-2" /> Activate Face Attendance System
                    </Button>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto" />
                    <h2 className="text-xl font-bold text-yellow-800 mt-3">
                      Almost Ready - {totalChecks - passedChecks} Items Need Attention
                    </h2>
                    <p className="text-yellow-600 mt-1">
                      Resolve the items above before going live.
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* 40-Day Implementation Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">📋 40-Day Implementation Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { week: 'Week 1-2', days: 'Days 1-14', title: 'Core AI Engine', items: ['Python FastAPI', 'InsightFace ArcFace', 'FAISS Vector Index', 'Liveness Detection', 'Anti-Spoof Module'], color: 'purple' },
                  { week: 'Week 3', days: 'Days 15-21', title: 'Camera & Recognition', items: ['Camera Management', 'Face Registration', 'Live Recognition', 'Entry/Exit Tracking', 'Spoof Alerts'], color: 'blue' },
                  { week: 'Week 4-5', days: 'Days 22-35', title: 'Analytics & Reports', items: ['Analytics Dashboard', 'Heatmaps', 'Late Tracking', 'Unknown Faces', 'Report Generation'], color: 'green' },
                  { week: 'Week 6-7', days: 'Days 36-40', title: 'Integration & Launch', items: ['Parent Notifications', 'Mobile API', 'Test Dashboard', 'Help Center', 'Admin Settings'], color: 'orange' },
                ].map((phase, i) => (
                  <div key={i} className={`p-4 bg-${phase.color}-50 rounded-lg border border-${phase.color}-200`}>
                    <Badge className="mb-2">{phase.week}</Badge>
                    <h4 className="font-semibold text-sm">{phase.title}</h4>
                    <p className="text-xs text-gray-500 mb-2">{phase.days}</p>
                    <ul className="text-xs space-y-1">
                      {phase.items.map((item, j) => (
                        <li key={j} className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-green-500" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </DashboardLayout>
  );
}
