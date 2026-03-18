import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import api from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
    Bell, Save, Settings, Mail, MessageSquare, Smartphone,
    CheckCircle, ToggleLeft, ToggleRight
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════
// NOTIFICATION EVENT DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════
const NOTIFICATION_EVENTS = [
    { key: 'student_boarded', label: 'Student Boarded Bus', description: 'When student boards the bus at pickup point', target: 'parent', icon: '🚌', defaultChannels: ['in_app', 'push'] },
    { key: 'student_reached_school', label: 'Student Reached School', description: 'When bus arrives at school campus', target: 'parent', icon: '🏫', defaultChannels: ['in_app', 'push'] },
    { key: 'bus_departure', label: 'Bus Departure', description: 'When bus departs from school/starting point', target: 'parent', icon: '🚏', defaultChannels: ['in_app'] },
    { key: 'bus_delay', label: 'Bus Delay Alert', description: 'When bus is delayed beyond threshold', target: 'parent', icon: '⏰', defaultChannels: ['in_app', 'push', 'sms'] },
    { key: 'speed_violation', label: 'Speed Violation', description: 'When vehicle exceeds speed limit in any zone', target: 'admin', icon: '⚡', defaultChannels: ['in_app', 'push'] },
    { key: 'geofence_breach', label: 'Geofence Breach', description: 'When vehicle exits a defined geofence zone', target: 'admin', icon: '🔒', defaultChannels: ['in_app', 'push'] },
    { key: 'emergency_sos', label: 'Emergency SOS', description: 'When SOS button is pressed by driver or parent', target: 'both', icon: '🆘', defaultChannels: ['in_app', 'push', 'sms'] },
    { key: 'document_expiry', label: 'Document Expiry Reminder', description: 'Vehicle/driver document nearing expiry', target: 'admin', icon: '📄', defaultChannels: ['in_app', 'email'] },
    { key: 'maintenance_due', label: 'Maintenance Due', description: 'Scheduled maintenance reminder', target: 'admin', icon: '🔧', defaultChannels: ['in_app'] },
    { key: 'trip_started', label: 'Trip Started', description: 'When driver starts a trip', target: 'admin', icon: '▶️', defaultChannels: ['in_app'] },
    { key: 'trip_completed', label: 'Trip Completed', description: 'When driver completes a trip', target: 'admin', icon: '✅', defaultChannels: ['in_app'] },
    { key: 'vehicle_breakdown', label: 'Vehicle Breakdown', description: 'When vehicle breakdown is reported', target: 'both', icon: '🛠️', defaultChannels: ['in_app', 'push', 'sms'] }
];

const CHANNELS = [
    { key: 'in_app', label: 'In-App', icon: Bell, color: 'text-blue-600' },
    { key: 'push', label: 'Push', icon: Smartphone, color: 'text-green-600' },
    { key: 'sms', label: 'SMS', icon: MessageSquare, color: 'text-purple-600' },
    { key: 'email', label: 'Email', icon: Mail, color: 'text-orange-600' }
];

const TARGET_LABELS = {
    parent: { label: 'Parents', color: 'bg-blue-100 text-blue-700' },
    admin: { label: 'Admins', color: 'bg-purple-100 text-purple-700' },
    both: { label: 'Both', color: 'bg-gray-100 text-gray-700' }
};

export default function NotificationSettings() {
    const { user, organizationId } = useAuth();
    const { selectedBranch } = useBranch();
    const branchId = selectedBranch?.id || user?.profile?.branch_id;

    const [settings, setSettings] = useState({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [globalEnabled, setGlobalEnabled] = useState(true);
    const [delayThreshold, setDelayThreshold] = useState(10); // minutes
    const [speedAlertThreshold, setSpeedAlertThreshold] = useState(60); // km/h

    // ═══════════════════════════════════════════════════════════════
    // INITIALIZE SETTINGS
    // ═══════════════════════════════════════════════════════════════
    const fetchSettings = useCallback(async () => {
        if (!branchId) return;
        setLoading(true);
        try {
            const res = await api.get('/transport/notification-settings', {
                params: { branchId, organizationId }
            });
            if (res.data.success && res.data.data) {
                setSettings(res.data.data.events || initDefaultSettings());
                setGlobalEnabled(res.data.data.global_enabled !== false);
                setDelayThreshold(res.data.data.delay_threshold || 10);
                setSpeedAlertThreshold(res.data.data.speed_alert_threshold || 60);
            } else {
                setSettings(initDefaultSettings());
            }
        } catch {
            // If endpoint doesn't exist yet, use defaults
            setSettings(initDefaultSettings());
        } finally { setLoading(false); }
    }, [branchId, organizationId]);

    useEffect(() => { fetchSettings(); }, [fetchSettings]);

    const initDefaultSettings = () => {
        const defaults = {};
        NOTIFICATION_EVENTS.forEach(evt => {
            defaults[evt.key] = {
                enabled: true,
                channels: { in_app: true, push: evt.defaultChannels.includes('push'), sms: evt.defaultChannels.includes('sms'), email: evt.defaultChannels.includes('email') }
            };
        });
        return defaults;
    };

    // ═══════════════════════════════════════════════════════════════
    // TOGGLE HANDLERS
    // ═══════════════════════════════════════════════════════════════
    const toggleEvent = (eventKey) => {
        setSettings(prev => ({
            ...prev,
            [eventKey]: {
                ...prev[eventKey],
                enabled: !prev[eventKey]?.enabled
            }
        }));
    };

    const toggleChannel = (eventKey, channel) => {
        setSettings(prev => ({
            ...prev,
            [eventKey]: {
                ...prev[eventKey],
                channels: {
                    ...prev[eventKey]?.channels,
                    [channel]: !prev[eventKey]?.channels?.[channel]
                }
            }
        }));
    };

    // ═══════════════════════════════════════════════════════════════
    // SAVE
    // ═══════════════════════════════════════════════════════════════
    const handleSave = async () => {
        setSaving(true);
        try {
            await api.post('/transport/notification-settings', {
                events: settings,
                global_enabled: globalEnabled,
                delay_threshold: delayThreshold,
                speed_alert_threshold: speedAlertThreshold,
                branch_id: branchId,
                organization_id: organizationId
            });
            toast.success('Notification settings saved');
        } catch {
            toast.error('Failed to save settings');
        } finally { setSaving(false); }
    };

    // Count enabled
    const enabledCount = Object.values(settings).filter(s => s?.enabled).length;

    return (
        <DashboardLayout>
            <div className="p-4 space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Bell className="h-6 w-6 text-blue-600" />
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Transport Notifications</h1>
                            <p className="text-sm text-gray-500">Configure automated notifications for transport events</p>
                        </div>
                    </div>
                    <Button onClick={handleSave} disabled={saving}>
                        <Save className="h-4 w-4 mr-1" />
                        {saving ? 'Saving...' : 'Save Settings'}
                    </Button>
                </div>

                {/* Global Settings */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border p-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Settings className="h-5 w-5 text-gray-500" />
                            <h3 className="font-semibold text-gray-900 dark:text-white">Global Settings</h3>
                        </div>
                        <button onClick={() => setGlobalEnabled(!globalEnabled)}
                            className="flex items-center gap-1 text-sm">
                            {globalEnabled
                                ? <ToggleRight className="h-6 w-6 text-green-600" />
                                : <ToggleLeft className="h-6 w-6 text-gray-400" />
                            }
                            {globalEnabled ? 'Enabled' : 'Disabled'}
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <Label>Bus Delay Threshold (minutes)</Label>
                            <Input type="number" value={delayThreshold}
                                onChange={e => setDelayThreshold(parseInt(e.target.value) || 10)}
                                min={1} max={60} />
                            <p className="text-xs text-gray-500 mt-1">Alert when bus is delayed beyond this</p>
                        </div>
                        <div>
                            <Label>Speed Alert Threshold (km/h)</Label>
                            <Input type="number" value={speedAlertThreshold}
                                onChange={e => setSpeedAlertThreshold(parseInt(e.target.value) || 60)}
                                min={20} max={120} />
                            <p className="text-xs text-gray-500 mt-1">Alert when speed exceeds this limit</p>
                        </div>
                        <div className="flex items-end">
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg w-full text-center">
                                <p className="text-2xl font-bold text-blue-600">{enabledCount}/{NOTIFICATION_EVENTS.length}</p>
                                <p className="text-xs text-gray-500">Events Enabled</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Channel Legend */}
                <div className="flex items-center gap-4 flex-wrap">
                    <span className="text-sm text-gray-500 font-medium">Channels:</span>
                    {CHANNELS.map(ch => (
                        <div key={ch.key} className="flex items-center gap-1 text-sm text-gray-600">
                            <ch.icon className={`h-4 w-4 ${ch.color}`} />
                            {ch.label}
                        </div>
                    ))}
                </div>

                {/* Event Settings */}
                <div className="space-y-2">
                    {NOTIFICATION_EVENTS.map(evt => {
                        const evtSettings = settings[evt.key] || { enabled: false, channels: {} };
                        const target = TARGET_LABELS[evt.target];
                        return (
                            <div key={evt.key}
                                className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border p-4 transition
                                    ${!evtSettings.enabled ? 'opacity-60' : ''}`}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-3 flex-1">
                                        <span className="text-2xl">{evt.icon}</span>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h4 className="font-semibold text-gray-900 dark:text-white">{evt.label}</h4>
                                                <Badge className={`text-xs ${target.color}`}>{target.label}</Badge>
                                            </div>
                                            <p className="text-sm text-gray-500 mt-0.5">{evt.description}</p>

                                            {/* Channel Toggles */}
                                            {evtSettings.enabled && (
                                                <div className="flex gap-2 mt-3">
                                                    {CHANNELS.map(ch => {
                                                        const isOn = evtSettings.channels?.[ch.key];
                                                        return (
                                                            <button key={ch.key}
                                                                onClick={() => toggleChannel(evt.key, ch.key)}
                                                                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition
                                                                    ${isOn
                                                                        ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                                                        : 'bg-gray-50 border-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
                                                                    }`}
                                                            >
                                                                <ch.icon className="h-3.5 w-3.5" />
                                                                {ch.label}
                                                                {isOn && <CheckCircle className="h-3 w-3" />}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Enable Toggle */}
                                    <button onClick={() => toggleEvent(evt.key)}>
                                        {evtSettings.enabled
                                            ? <ToggleRight className="h-7 w-7 text-green-600" />
                                            : <ToggleLeft className="h-7 w-7 text-gray-400" />
                                        }
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </DashboardLayout>
    );
}
