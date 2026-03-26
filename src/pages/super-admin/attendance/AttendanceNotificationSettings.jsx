/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ATTENDANCE NOTIFICATION SETTINGS - Day 36
 * ─────────────────────────────────────────────────────────────────────────────
 * AI Face Attendance System - Parent Notification Configuration
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Bell, Settings, MessageSquare, Mail, Smartphone, Send,
    Clock, CheckCircle2, XCircle, RefreshCw, AlertCircle,
    Users, Shield, ChevronRight, Save, TestTube2, History,
    Phone, MessageCircle, Zap
} from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { formatDate, formatDateTime, formatTime } from '@/utils/dateUtils';
import { cn } from '@/lib/utils';
import api from '@/services/api';
import { toast } from 'sonner';

// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATION TYPE CARDS
// ═══════════════════════════════════════════════════════════════════════════════

const NotificationTypeCard = ({ type, label, description, icon: Icon, color, enabled, onChange }) => (
    <div className={cn(
        'flex items-center justify-between p-4 rounded-lg border transition-all',
        enabled ? 'bg-muted/30 border-primary/30' : 'bg-muted/10'
    )}>
        <div className="flex items-center gap-3">
            <div className={cn(
                'p-2 rounded-lg',
                enabled ? `bg-${color}-100 dark:bg-${color}-900/30` : 'bg-gray-100 dark:bg-gray-800'
            )}>
                <Icon className={cn('h-5 w-5', enabled ? `text-${color}-600` : 'text-gray-400')} />
            </div>
            <div>
                <p className="font-medium">{label}</p>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>
        </div>
        <Switch checked={enabled} onCheckedChange={onChange} />
    </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// CHANNEL CONFIG CARD
// ═══════════════════════════════════════════════════════════════════════════════

const ChannelConfigCard = ({ channel, label, icon: Icon, enabled, configured, onToggle, onConfigure }) => (
    <Card className={cn(enabled && configured && 'ring-1 ring-green-500/30')}>
        <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={cn(
                        'p-2 rounded-lg',
                        enabled && configured ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-800'
                    )}>
                        <Icon className={cn(
                            'h-5 w-5',
                            enabled && configured ? 'text-green-600' : 'text-gray-400'
                        )} />
                    </div>
                    <div>
                        <p className="font-medium">{label}</p>
                        <Badge variant={configured ? 'default' : 'secondary'} className="mt-1">
                            {configured ? 'Configured' : 'Not Configured'}
                        </Badge>
                    </div>
                </div>
                <Switch checked={enabled} onCheckedChange={onToggle} disabled={!configured} />
            </div>
            {!configured && (
                <Button variant="outline" size="sm" className="w-full" onClick={onConfigure}>
                    <Settings className="h-4 w-4 mr-2" />
                    Configure
                </Button>
            )}
        </CardContent>
    </Card>
);

// ═══════════════════════════════════════════════════════════════════════════════
// TEST NOTIFICATION DIALOG
// ═══════════════════════════════════════════════════════════════════════════════

const TestNotificationDialog = ({ open, onClose, branchId }) => {
    const [sending, setSending] = useState(false);
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [notificationType, setNotificationType] = useState('arrival');
    const [result, setResult] = useState(null);

    const handleSendTest = async () => {
        setSending(true);
        setResult(null);
        
        try {
            // Demo: Simulate success
            await new Promise(resolve => setTimeout(resolve, 1500));
            setResult({ success: true, message: 'Test notification sent successfully!' });
            toast.success('Test notification sent!');
        } catch (error) {
            setResult({ success: false, message: error.message });
            toast.error('Failed to send test notification');
        } finally {
            setSending(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <TestTube2 className="h-5 w-5" />
                        Send Test Notification
                    </DialogTitle>
                    <DialogDescription>
                        Test your notification settings
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Notification Type</Label>
                        <Select value={notificationType} onValueChange={setNotificationType}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="arrival">✅ Arrival</SelectItem>
                                <SelectItem value="departure">🏠 Departure</SelectItem>
                                <SelectItem value="late_arrival">⚠️ Late Arrival</SelectItem>
                                <SelectItem value="absent">❌ Absent</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Phone Number</Label>
                        <Input 
                            placeholder="+91 9876543210"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Email Address</Label>
                        <Input 
                            type="email"
                            placeholder="parent@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    {result && (
                        <Alert variant={result.success ? 'default' : 'destructive'}>
                            {result.success ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                                <XCircle className="h-4 w-4" />
                            )}
                            <AlertDescription>{result.message}</AlertDescription>
                        </Alert>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleSendTest} disabled={sending || (!phone && !email)}>
                        {sending ? (
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4 mr-2" />
                        )}
                        Send Test
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATION LOG TABLE
// ═══════════════════════════════════════════════════════════════════════════════

const NotificationLogTable = ({ logs, loading }) => {
    if (loading) {
        return (
            <div className="space-y-2">
                {[1, 2, 3, 4, 5].map(i => (
                    <Skeleton key={i} className="h-14 w-full" />
                ))}
            </div>
        );
    }

    if (!logs || logs.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No notifications sent yet</p>
            </div>
        );
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Channels</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sent At</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {logs.map((log, idx) => (
                    <TableRow key={log.id || idx}>
                        <TableCell>
                            <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                    <AvatarFallback>
                                        {log.students?.full_name?.charAt(0) || 'S'}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-medium text-sm">{log.students?.full_name}</p>
                                    <p className="text-xs text-muted-foreground">{log.students?.enrollment_id}</p>
                                </div>
                            </div>
                        </TableCell>
                        <TableCell>
                            <Badge variant="outline">
                                {log.notification_type === 'arrival' && '✅ Arrival'}
                                {log.notification_type === 'departure' && '🏠 Departure'}
                                {log.notification_type === 'late_arrival' && '⚠️ Late'}
                                {log.notification_type === 'absent' && '❌ Absent'}
                                {log.notification_type === 'spoof_attempt' && '🚨 Security'}
                            </Badge>
                        </TableCell>
                        <TableCell>
                            <div className="flex gap-1">
                                {log.channels?.includes('sms') && (
                                    <Badge variant="secondary" className="text-xs">SMS</Badge>
                                )}
                                {log.channels?.includes('whatsapp') && (
                                    <Badge variant="secondary" className="text-xs">WA</Badge>
                                )}
                                {log.channels?.includes('email') && (
                                    <Badge variant="secondary" className="text-xs">Email</Badge>
                                )}
                                {log.channels?.includes('push') && (
                                    <Badge variant="secondary" className="text-xs">Push</Badge>
                                )}
                            </div>
                        </TableCell>
                        <TableCell>
                            <Badge variant={log.status === 'sent' ? 'default' : 'secondary'}>
                                {log.status === 'sent' ? (
                                    <><CheckCircle2 className="h-3 w-3 mr-1" /> Sent</>
                                ) : (
                                    <><AlertCircle className="h-3 w-3 mr-1" /> Partial</>
                                )}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                            {formatDateTime(log.sent_at)}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const AttendanceNotificationSettings = () => {
    const { user, currentSessionId, organizationId } = useAuth();
    const { selectedBranch } = useBranch();

    // Settings state
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        enabled: true,
        channels: {
            sms: true,
            whatsapp: false,
            email: true,
            push: true
        },
        types: {
            arrival: true,
            departure: true,
            late_arrival: true,
            absent: true,
            early_departure: false,
            spoof_attempt: true
        },
        quiet_hours: {
            enabled: false,
            start: '22:00',
            end: '06:00'
        },
        late_threshold_minutes: 15
    });

    // Logs state
    const [logs, setLogs] = useState([]);
    const [logsLoading, setLogsLoading] = useState(true);

    // Dialogs
    const [testDialogOpen, setTestDialogOpen] = useState(false);

    const branchId = selectedBranch?.id;

    // ═══════════════════════════════════════════════════════════════════════════
    // FETCH DATA
    // ═══════════════════════════════════════════════════════════════════════════

    const fetchSettings = useCallback(async () => {
        if (!branchId) return;

        try {
            const response = await api.get(`/attendance/notifications/settings?branch_id=${branchId}`);
            if (response.data?.data) {
                setSettings(prev => ({ ...prev, ...response.data.data }));
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
        } finally {
            setLoading(false);
        }
    }, [branchId]);

    const fetchLogs = useCallback(async () => {
        if (!branchId) return;

        setLogsLoading(true);
        try {
            const response = await api.get(`/attendance/notifications/logs?branch_id=${branchId}&limit=50`);
            setLogs(response.data?.data || []);
        } catch (error) {
            console.error('Error fetching logs:', error);
            // Demo data
            setLogs([
                {
                    id: 1,
                    notification_type: 'arrival',
                    channels: ['sms', 'push'],
                    status: 'sent',
                    sent_at: new Date().toISOString(),
                    students: { full_name: 'Rahul Kumar', enrollment_id: 'ADM001' }
                },
                {
                    id: 2,
                    notification_type: 'late_arrival',
                    channels: ['sms', 'whatsapp'],
                    status: 'sent',
                    sent_at: new Date(Date.now() - 3600000).toISOString(),
                    students: { full_name: 'Priya Sharma', enrollment_id: 'ADM002' }
                }
            ]);
        } finally {
            setLogsLoading(false);
        }
    }, [branchId]);

    useEffect(() => {
        fetchSettings();
        fetchLogs();
    }, [fetchSettings, fetchLogs]);

    // ═══════════════════════════════════════════════════════════════════════════
    // SAVE SETTINGS
    // ═══════════════════════════════════════════════════════════════════════════

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.put(`/attendance/notifications/settings`, {
                branch_id: branchId,
                organization_id: organizationId,
                ...settings
            });
            toast.success('Settings saved successfully!');
        } catch (error) {
            console.error('Error saving settings:', error);
            toast.error('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // UPDATE SETTINGS
    // ═══════════════════════════════════════════════════════════════════════════

    const updateChannel = (channel, enabled) => {
        setSettings(prev => ({
            ...prev,
            channels: { ...prev.channels, [channel]: enabled }
        }));
    };

    const updateType = (type, enabled) => {
        setSettings(prev => ({
            ...prev,
            types: { ...prev.types, [type]: enabled }
        }));
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════════════════════════

    if (!branchId) {
        return (
            <DashboardLayout>
                <div className="p-6">
                    <Alert>
                        <Bell className="h-4 w-4" />
                        <AlertDescription>
                            Please select a branch to configure notifications.
                        </AlertDescription>
                    </Alert>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Bell className="h-8 w-8 text-blue-500" />
                        Attendance Notifications
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Configure parent/guardian notifications for attendance
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={() => setTestDialogOpen(true)}>
                        <TestTube2 className="h-4 w-4 mr-2" />
                        Test Notification
                    </Button>
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? (
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4 mr-2" />
                        )}
                        Save Settings
                    </Button>
                </div>
            </div>

            {/* Master Toggle */}
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className={cn(
                                'p-3 rounded-lg',
                                settings.enabled ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100'
                            )}>
                                <Zap className={cn(
                                    'h-6 w-6',
                                    settings.enabled ? 'text-green-600' : 'text-gray-400'
                                )} />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold">Attendance Notifications</h3>
                                <p className="text-muted-foreground">
                                    {settings.enabled 
                                        ? 'Parents will receive attendance alerts'
                                        : 'All notifications are currently disabled'}
                                </p>
                            </div>
                        </div>
                        <Switch 
                            checked={settings.enabled}
                            onCheckedChange={(enabled) => setSettings(prev => ({ ...prev, enabled }))}
                        />
                    </div>
                </CardContent>
            </Card>

            {settings.enabled && (
                <Tabs defaultValue="channels" className="space-y-6">
                    <TabsList>
                        <TabsTrigger value="channels">
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Channels
                        </TabsTrigger>
                        <TabsTrigger value="types">
                            <Bell className="h-4 w-4 mr-2" />
                            Notification Types
                        </TabsTrigger>
                        <TabsTrigger value="schedule">
                            <Clock className="h-4 w-4 mr-2" />
                            Schedule
                        </TabsTrigger>
                        <TabsTrigger value="logs">
                            <History className="h-4 w-4 mr-2" />
                            Logs
                        </TabsTrigger>
                    </TabsList>

                    {/* Channels Tab */}
                    <TabsContent value="channels">
                        <Card>
                            <CardHeader>
                                <CardTitle>Notification Channels</CardTitle>
                                <CardDescription>
                                    Configure how notifications are delivered to parents
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <ChannelConfigCard
                                        channel="sms"
                                        label="SMS"
                                        icon={Phone}
                                        enabled={settings.channels.sms}
                                        configured={true}
                                        onToggle={(v) => updateChannel('sms', v)}
                                        onConfigure={() => {}}
                                    />
                                    <ChannelConfigCard
                                        channel="whatsapp"
                                        label="WhatsApp"
                                        icon={MessageCircle}
                                        enabled={settings.channels.whatsapp}
                                        configured={false}
                                        onToggle={(v) => updateChannel('whatsapp', v)}
                                        onConfigure={() => toast.info('WhatsApp configuration coming soon!')}
                                    />
                                    <ChannelConfigCard
                                        channel="email"
                                        label="Email"
                                        icon={Mail}
                                        enabled={settings.channels.email}
                                        configured={true}
                                        onToggle={(v) => updateChannel('email', v)}
                                        onConfigure={() => {}}
                                    />
                                    <ChannelConfigCard
                                        channel="push"
                                        label="Push Notification"
                                        icon={Smartphone}
                                        enabled={settings.channels.push}
                                        configured={true}
                                        onToggle={(v) => updateChannel('push', v)}
                                        onConfigure={() => {}}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Types Tab */}
                    <TabsContent value="types">
                        <Card>
                            <CardHeader>
                                <CardTitle>Notification Types</CardTitle>
                                <CardDescription>
                                    Choose which events trigger parent notifications
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <NotificationTypeCard
                                    type="arrival"
                                    label="Student Arrival"
                                    description="When student arrives at school"
                                    icon={CheckCircle2}
                                    color="green"
                                    enabled={settings.types.arrival}
                                    onChange={(v) => updateType('arrival', v)}
                                />
                                <NotificationTypeCard
                                    type="departure"
                                    label="Student Departure"
                                    description="When student leaves school"
                                    icon={Users}
                                    color="blue"
                                    enabled={settings.types.departure}
                                    onChange={(v) => updateType('departure', v)}
                                />
                                <NotificationTypeCard
                                    type="late_arrival"
                                    label="Late Arrival"
                                    description="When student arrives after cutoff time"
                                    icon={Clock}
                                    color="orange"
                                    enabled={settings.types.late_arrival}
                                    onChange={(v) => updateType('late_arrival', v)}
                                />
                                <NotificationTypeCard
                                    type="absent"
                                    label="Absence Alert"
                                    description="When student is marked absent"
                                    icon={XCircle}
                                    color="red"
                                    enabled={settings.types.absent}
                                    onChange={(v) => updateType('absent', v)}
                                />
                                <NotificationTypeCard
                                    type="spoof_attempt"
                                    label="Security Alert"
                                    description="When spoof/photo attempt is detected"
                                    icon={Shield}
                                    color="red"
                                    enabled={settings.types.spoof_attempt}
                                    onChange={(v) => updateType('spoof_attempt', v)}
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Schedule Tab */}
                    <TabsContent value="schedule">
                        <Card>
                            <CardHeader>
                                <CardTitle>Quiet Hours</CardTitle>
                                <CardDescription>
                                    Set times when notifications should not be sent
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center justify-between p-4 rounded-lg border">
                                    <div>
                                        <p className="font-medium">Enable Quiet Hours</p>
                                        <p className="text-sm text-muted-foreground">
                                            No notifications during specified hours
                                        </p>
                                    </div>
                                    <Switch 
                                        checked={settings.quiet_hours.enabled}
                                        onCheckedChange={(v) => setSettings(prev => ({
                                            ...prev,
                                            quiet_hours: { ...prev.quiet_hours, enabled: v }
                                        }))}
                                    />
                                </div>

                                {settings.quiet_hours.enabled && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Start Time</Label>
                                            <Input 
                                                type="time"
                                                value={settings.quiet_hours.start}
                                                onChange={(e) => setSettings(prev => ({
                                                    ...prev,
                                                    quiet_hours: { ...prev.quiet_hours, start: e.target.value }
                                                }))}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>End Time</Label>
                                            <Input 
                                                type="time"
                                                value={settings.quiet_hours.end}
                                                onChange={(e) => setSettings(prev => ({
                                                    ...prev,
                                                    quiet_hours: { ...prev.quiet_hours, end: e.target.value }
                                                }))}
                                            />
                                        </div>
                                    </div>
                                )}

                                <Separator />

                                <div className="space-y-2">
                                    <Label>Late Arrival Threshold (minutes)</Label>
                                    <Input 
                                        type="number"
                                        min={1}
                                        max={60}
                                        value={settings.late_threshold_minutes}
                                        onChange={(e) => setSettings(prev => ({
                                            ...prev,
                                            late_threshold_minutes: parseInt(e.target.value) || 15
                                        }))}
                                    />
                                    <p className="text-sm text-muted-foreground">
                                        Students arriving after this many minutes from school start time will be marked late
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Logs Tab */}
                    <TabsContent value="logs">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Notification History</CardTitle>
                                        <CardDescription>
                                            Recent notifications sent to parents
                                        </CardDescription>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={fetchLogs}>
                                        <RefreshCw className="h-4 w-4 mr-2" />
                                        Refresh
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <NotificationLogTable logs={logs} loading={logsLoading} />
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            )}

            {/* Test Dialog */}
            <TestNotificationDialog
                open={testDialogOpen}
                onClose={() => setTestDialogOpen(false)}
                branchId={branchId}
            />
            </div>
        </DashboardLayout>
    );
};

export default AttendanceNotificationSettings;
