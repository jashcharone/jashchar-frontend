/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * JASHFLOW AI - NOTIFICATION SETTINGS
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Super Admin configuration for notification channels:
 * - WhatsApp (Meta Business API)
 * - JashSync (Internal real-time notifications)
 * - Both
 * 
 * Following PROJECT_MANIFESTO.md: organization_id, branch_id, session_id
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  Alert, AlertDescription, AlertTitle
} from '@/components/ui/alert';
import {
  MessageSquare, Bell, Settings2, Smartphone, Monitor, Send,
  CheckCircle, XCircle, Clock, AlertTriangle, BarChart3, RefreshCw,
  Volume2, Loader2, TestTube, Save
} from 'lucide-react';

const NotificationSettings = () => {
  const { toast } = useToast();
  const { user, organizationId } = useAuth();
  const { selectedBranch } = useBranch();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingSent, setTestingSent] = useState(false);
  const [testChannel, setTestChannel] = useState('');
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Settings state
  const [settings, setSettings] = useState({
    notifications_enabled: true,
    default_channel: 'both',
    notification_types: {
      task_assigned: { whatsapp: true, jashsync: true },
      task_reminder: { whatsapp: true, jashsync: true },
      task_overdue: { whatsapp: true, jashsync: true },
      task_completed: { whatsapp: false, jashsync: true },
      task_escalated: { whatsapp: true, jashsync: true },
      task_comment: { whatsapp: false, jashsync: true },
      daily_summary: { whatsapp: true, jashsync: true },
      ai_suggestion: { whatsapp: false, jashsync: true }
    },
    recipient_overrides: {
      principal: { prefer_whatsapp: true },
      staff: { prefer_whatsapp: true },
      student: { prefer_jashsync: true },
      parent: { prefer_whatsapp: true }
    },
    jashsync_config: {
      default_priority: 'normal',
      overdue_priority: 'urgent',
      escalation_priority: 'high',
      enable_sound: true,
      enable_desktop_notification: true
    },
    whatsapp_config: {
      send_outside_working_hours: false,
      working_hours_start: '08:00',
      working_hours_end: '20:00',
      weekend_notifications: false
    },
    reminder_config: {
      send_reminder_before_hours: 24,
      send_reminder_before_hours_urgent: 4,
      max_reminders_per_task: 3
    }
  });

  // Notification types metadata
  const notificationTypes = [
    { key: 'task_assigned', label: 'Task Assigned', icon: '📋', description: 'When a new task is assigned' },
    { key: 'task_reminder', label: 'Task Reminder', icon: '⏰', description: 'Deadline approaching' },
    { key: 'task_overdue', label: 'Task Overdue', icon: '🚨', description: 'Task past due date' },
    { key: 'task_completed', label: 'Task Completed', icon: '✅', description: 'When task is marked complete' },
    { key: 'task_escalated', label: 'Task Escalated', icon: '⬆️', description: 'Auto-escalation to supervisor' },
    { key: 'task_comment', label: 'New Comment', icon: '💬', description: 'Comment on task' },
    { key: 'daily_summary', label: 'Daily Summary', icon: '📊', description: 'Morning task summary' },
    { key: 'ai_suggestion', label: 'AI Suggestion', icon: '🤖', description: 'AI task recommendations' }
  ];

  // Recipient types
  const recipientTypes = [
    { key: 'principal', label: 'Principal', icon: '👔' },
    { key: 'staff', label: 'Staff', icon: '👥' },
    { key: 'student', label: 'Student', icon: '🎓' },
    { key: 'parent', label: 'Parent', icon: '👨‍👩‍👧' }
  ];

  // Fetch settings
  const fetchSettings = useCallback(async () => {
    if (!organizationId || !selectedBranch?.id) return;
    
    setLoading(true);
    try {
      const response = await api.get('/tasks/notifications/settings', {
        params: {
          organization_id: organizationId,
          branch_id: selectedBranch.id
        }
      });

      if (response.data.success && response.data.data) {
        setSettings(prev => ({
          ...prev,
          ...response.data.data
        }));
      }
    } catch (error) {
      // Use defaults if settings not found
      console.log('Using default notification settings');
    } finally {
      setLoading(false);
    }
  }, [organizationId, selectedBranch?.id]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    if (!organizationId || !selectedBranch?.id) return;
    
    setStatsLoading(true);
    try {
      const response = await api.get('/tasks/notifications/stats', {
        params: {
          organization_id: organizationId,
          branch_id: selectedBranch.id
        }
      });

      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching notification stats:', error);
    } finally {
      setStatsLoading(false);
    }
  }, [organizationId, selectedBranch?.id]);

  useEffect(() => {
    fetchSettings();
    fetchStats();
  }, [fetchSettings, fetchStats]);

  // Save settings
  const saveSettings = async () => {
    setSaving(true);
    try {
      const response = await api.put('/tasks/notifications/settings', {
        organization_id: organizationId,
        branch_id: selectedBranch.id,
        ...settings
      });

      if (response.data.success) {
        toast({
          title: 'Settings Saved',
          description: 'Notification settings updated successfully',
          variant: 'success'
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error saving settings',
        description: error.response?.data?.message || 'Failed to save settings'
      });
    } finally {
      setSaving(false);
    }
  };

  // Send test notification
  const sendTestNotification = async (channel) => {
    setTestChannel(channel);
    setTestingSent(true);
    try {
      const response = await api.post('/tasks/notifications/test', {
        organization_id: organizationId,
        branch_id: selectedBranch.id,
        channel,
        recipient_user_id: user.id
      });

      if (response.data.success) {
        toast({
          title: 'Test Sent!',
          description: `Check your ${channel === 'whatsapp' ? 'WhatsApp' : 'JashSync notifications'}`,
          variant: 'success'
        });
      } else {
        throw new Error(response.data.error);
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Test Failed',
        description: error.response?.data?.error || error.message
      });
    } finally {
      setTestingSent(false);
      setTestChannel('');
    }
  };

  // Update notification type setting
  const updateNotificationType = (typeKey, channel, value) => {
    setSettings(prev => ({
      ...prev,
      notification_types: {
        ...prev.notification_types,
        [typeKey]: {
          ...prev.notification_types[typeKey],
          [channel]: value
        }
      }
    }));
  };

  // Update recipient override
  const updateRecipientOverride = (recipientKey, preferChannel) => {
    setSettings(prev => ({
      ...prev,
      recipient_overrides: {
        ...prev.recipient_overrides,
        [recipientKey]: {
          prefer_whatsapp: preferChannel === 'whatsapp',
          prefer_jashsync: preferChannel === 'jashsync'
        }
      }
    }));
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Settings2 className="h-7 w-7 text-primary" />
              Task Notification Settings
            </h1>
            <p className="text-muted-foreground mt-1">
              Configure WhatsApp and JashSync notification channels
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchSettings}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={saveSettings} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Settings
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">WhatsApp Sent</p>
                    <p className="text-2xl font-bold text-green-600">{stats.whatsapp?.sent || 0}</p>
                  </div>
                  <Smartphone className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">JashSync Sent</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.jashsync?.sent || 0}</p>
                  </div>
                  <Bell className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Notifications</p>
                    <p className="text-2xl font-bold">{stats.combined?.total || 0}</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Success Rate</p>
                    <p className="text-2xl font-bold text-emerald-600">{stats.combined?.success_rate || 100}%</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-emerald-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="channels" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="channels">Channels</TabsTrigger>
            <TabsTrigger value="types">Notification Types</TabsTrigger>
            <TabsTrigger value="recipients">Recipients</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          {/* Channels Tab */}
          <TabsContent value="channels" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Master Switch
                </CardTitle>
                <CardDescription>
                  Enable or disable all task notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Enable Notifications</p>
                    <p className="text-sm text-muted-foreground">
                      Turn off to disable all task notifications
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications_enabled}
                    onCheckedChange={(checked) =>
                      setSettings(prev => ({ ...prev, notifications_enabled: checked }))
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              {/* WhatsApp Card */}
              <Card className="border-green-200 bg-green-50/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-700">
                    <Smartphone className="h-5 w-5" />
                    WhatsApp (Meta Business API)
                  </CardTitle>
                  <CardDescription>
                    Send notifications via WhatsApp messages
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-green-100 text-green-700">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Connected
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Working Hours</Label>
                    <div className="flex gap-2 items-center">
                      <Input
                        type="time"
                        value={settings.whatsapp_config.working_hours_start}
                        onChange={(e) =>
                          setSettings(prev => ({
                            ...prev,
                            whatsapp_config: {
                              ...prev.whatsapp_config,
                              working_hours_start: e.target.value
                            }
                          }))
                        }
                        className="w-28"
                      />
                      <span>to</span>
                      <Input
                        type="time"
                        value={settings.whatsapp_config.working_hours_end}
                        onChange={(e) =>
                          setSettings(prev => ({
                            ...prev,
                            whatsapp_config: {
                              ...prev.whatsapp_config,
                              working_hours_end: e.target.value
                            }
                          }))
                        }
                        className="w-28"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">Send Outside Working Hours</p>
                    </div>
                    <Switch
                      checked={settings.whatsapp_config.send_outside_working_hours}
                      onCheckedChange={(checked) =>
                        setSettings(prev => ({
                          ...prev,
                          whatsapp_config: {
                            ...prev.whatsapp_config,
                            send_outside_working_hours: checked
                          }
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">Weekend Notifications</p>
                    </div>
                    <Switch
                      checked={settings.whatsapp_config.weekend_notifications}
                      onCheckedChange={(checked) =>
                        setSettings(prev => ({
                          ...prev,
                          whatsapp_config: {
                            ...prev.whatsapp_config,
                            weekend_notifications: checked
                          }
                        }))
                      }
                    />
                  </div>

                  <Separator />

                  <Button
                    variant="outline"
                    className="w-full border-green-300 text-green-700 hover:bg-green-100"
                    onClick={() => sendTestNotification('whatsapp')}
                    disabled={testingSent && testChannel === 'whatsapp'}
                  >
                    {testingSent && testChannel === 'whatsapp' ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <TestTube className="h-4 w-4 mr-2" />
                    )}
                    Send Test WhatsApp
                  </Button>
                </CardContent>
              </Card>

              {/* JashSync Card */}
              <Card className="border-blue-200 bg-blue-50/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-700">
                    <Bell className="h-5 w-5" />
                    JashSync (In-App)
                  </CardTitle>
                  <CardDescription>
                    Real-time in-app notifications with sound
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-blue-100 text-blue-700">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <Label>Default Priority</Label>
                    <Select
                      value={settings.jashsync_config.default_priority}
                      onValueChange={(value) =>
                        setSettings(prev => ({
                          ...prev,
                          jashsync_config: {
                            ...prev.jashsync_config,
                            default_priority: value
                          }
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Volume2 className="h-4 w-4 text-blue-600" />
                      <p className="font-medium text-sm">Enable Sound</p>
                    </div>
                    <Switch
                      checked={settings.jashsync_config.enable_sound}
                      onCheckedChange={(checked) =>
                        setSettings(prev => ({
                          ...prev,
                          jashsync_config: {
                            ...prev.jashsync_config,
                            enable_sound: checked
                          }
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4 text-blue-600" />
                      <p className="font-medium text-sm">Desktop Notification</p>
                    </div>
                    <Switch
                      checked={settings.jashsync_config.enable_desktop_notification}
                      onCheckedChange={(checked) =>
                        setSettings(prev => ({
                          ...prev,
                          jashsync_config: {
                            ...prev.jashsync_config,
                            enable_desktop_notification: checked
                          }
                        }))
                      }
                    />
                  </div>

                  <Separator />

                  <Button
                    variant="outline"
                    className="w-full border-blue-300 text-blue-700 hover:bg-blue-100"
                    onClick={() => sendTestNotification('jashsync')}
                    disabled={testingSent && testChannel === 'jashsync'}
                  >
                    {testingSent && testChannel === 'jashsync' ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <TestTube className="h-4 w-4 mr-2" />
                    )}
                    Send Test JashSync
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Default Channel Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Default Notification Channel</CardTitle>
                <CardDescription>
                  Choose the primary channel for task notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  {[
                    { value: 'whatsapp', label: 'WhatsApp Only', icon: Smartphone, color: 'green' },
                    { value: 'jashsync', label: 'JashSync Only', icon: Bell, color: 'blue' },
                    { value: 'both', label: 'Both Channels', icon: Send, color: 'purple' }
                  ].map((option) => (
                    <Card
                      key={option.value}
                      className={`flex-1 cursor-pointer transition-all ${
                        settings.default_channel === option.value
                          ? `border-${option.color}-500 bg-${option.color}-50 ring-2 ring-${option.color}-500`
                          : 'hover:border-gray-400'
                      }`}
                      onClick={() =>
                        setSettings(prev => ({ ...prev, default_channel: option.value }))
                      }
                    >
                      <CardContent className="pt-6 text-center">
                        <option.icon className={`h-8 w-8 mx-auto mb-2 ${
                          settings.default_channel === option.value
                            ? `text-${option.color}-600`
                            : 'text-gray-400'
                        }`} />
                        <p className="font-medium">{option.label}</p>
                        {settings.default_channel === option.value && (
                          <Badge className="mt-2" variant="secondary">Selected</Badge>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notification Types Tab */}
          <TabsContent value="types">
            <Card>
              <CardHeader>
                <CardTitle>Configure by Notification Type</CardTitle>
                <CardDescription>
                  Choose which channels to use for each notification type
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {notificationTypes.map((type) => (
                    <div
                      key={type.key}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{type.icon}</span>
                        <div>
                          <p className="font-medium">{type.label}</p>
                          <p className="text-sm text-muted-foreground">{type.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                          <Smartphone className="h-4 w-4 text-green-600" />
                          <Switch
                            checked={settings.notification_types[type.key]?.whatsapp}
                            onCheckedChange={(checked) =>
                              updateNotificationType(type.key, 'whatsapp', checked)
                            }
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Bell className="h-4 w-4 text-blue-600" />
                          <Switch
                            checked={settings.notification_types[type.key]?.jashsync}
                            onCheckedChange={(checked) =>
                              updateNotificationType(type.key, 'jashsync', checked)
                            }
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recipients Tab */}
          <TabsContent value="recipients">
            <Card>
              <CardHeader>
                <CardTitle>Recipient Preferences</CardTitle>
                <CardDescription>
                  Set preferred notification channel by recipient type
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recipientTypes.map((recipient) => (
                    <div
                      key={recipient.key}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{recipient.icon}</span>
                        <p className="font-medium">{recipient.label}</p>
                      </div>
                      <Select
                        value={
                          settings.recipient_overrides[recipient.key]?.prefer_whatsapp
                            ? 'whatsapp'
                            : 'jashsync'
                        }
                        onValueChange={(value) =>
                          updateRecipientOverride(recipient.key, value)
                        }
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="whatsapp">
                            <div className="flex items-center gap-2">
                              <Smartphone className="h-4 w-4 text-green-600" />
                              WhatsApp
                            </div>
                          </SelectItem>
                          <SelectItem value="jashsync">
                            <div className="flex items-center gap-2">
                              <Bell className="h-4 w-4 text-blue-600" />
                              JashSync
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>

                <Alert className="mt-6">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Parent Notification Tip</AlertTitle>
                  <AlertDescription>
                    Parents usually prefer WhatsApp as they may not have the app open.
                    Students and staff work on the system daily, so JashSync works well.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Advanced Tab */}
          <TabsContent value="advanced" className="space-y-6">
            {/* Reminder Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Reminder Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Reminder Before (hours)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="72"
                      value={settings.reminder_config.send_reminder_before_hours}
                      onChange={(e) =>
                        setSettings(prev => ({
                          ...prev,
                          reminder_config: {
                            ...prev.reminder_config,
                            send_reminder_before_hours: parseInt(e.target.value) || 24
                          }
                        }))
                      }
                    />
                    <p className="text-xs text-muted-foreground">Normal tasks</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Urgent Reminder Before (hours)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="24"
                      value={settings.reminder_config.send_reminder_before_hours_urgent}
                      onChange={(e) =>
                        setSettings(prev => ({
                          ...prev,
                          reminder_config: {
                            ...prev.reminder_config,
                            send_reminder_before_hours_urgent: parseInt(e.target.value) || 4
                          }
                        }))
                      }
                    />
                    <p className="text-xs text-muted-foreground">High priority tasks</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Max Reminders Per Task</Label>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={settings.reminder_config.max_reminders_per_task}
                      onChange={(e) =>
                        setSettings(prev => ({
                          ...prev,
                          reminder_config: {
                            ...prev.reminder_config,
                            max_reminders_per_task: parseInt(e.target.value) || 3
                          }
                        }))
                      }
                    />
                    <p className="text-xs text-muted-foreground">Avoid spam</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Escalation Priority */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  JashSync Priority Levels
                </CardTitle>
                <CardDescription>
                  Configure priority levels for different notification scenarios
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Overdue Tasks Priority</Label>
                    <Select
                      value={settings.jashsync_config.overdue_priority}
                      onValueChange={(value) =>
                        setSettings(prev => ({
                          ...prev,
                          jashsync_config: {
                            ...prev.jashsync_config,
                            overdue_priority: value
                          }
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Escalation Priority</Label>
                    <Select
                      value={settings.jashsync_config.escalation_priority}
                      onValueChange={(value) =>
                        setSettings(prev => ({
                          ...prev,
                          jashsync_config: {
                            ...prev.jashsync_config,
                            escalation_priority: value
                          }
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Save Button (Fixed Bottom) */}
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            size="lg"
            onClick={saveSettings}
            disabled={saving}
            className="shadow-lg"
          >
            {saving ? (
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            ) : (
              <Save className="h-5 w-5 mr-2" />
            )}
            Save All Settings
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default NotificationSettings;
