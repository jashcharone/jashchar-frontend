import React, { useState, useEffect } from 'react';
import { 
    Bell, BellOff, Moon, Sun, Volume2, VolumeX, Clock,
    MessageCircle, Megaphone, Hash, Calendar, CreditCard, 
    Settings, AlertTriangle, Save, ChevronRight, X, 
    Smartphone, Mail, Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { useToast } from '@/components/ui/use-toast';
import api from "@/services/api";

/**
 * NotificationSettings - Comprehensive notification preferences
 * Quiet hours, per-channel settings, delivery preferences
 */
const NotificationSettings = ({ 
    open, 
    onOpenChange 
}) => {
    const { toast } = useToast();
    const [settings, setSettings] = useState({
        // Global settings
        enabled: true,
        sound: true,
        soundVolume: 70,
        vibration: true,
        showPreview: true,
        
        // Quiet hours
        quietHoursEnabled: false,
        quietHoursStart: '22:00',
        quietHoursEnd: '07:00',
        quietHoursAllowUrgent: true,
        
        // Delivery channels
        pushEnabled: true,
        emailEnabled: false,
        emailDigest: 'daily',
        smsEnabled: false,
        smsOnlyUrgent: true,
        
        // Per-type settings
        typeSettings: {
            message: { enabled: true, sound: true, priority: 'normal' },
            broadcast: { enabled: true, sound: true, priority: 'normal' },
            channel: { enabled: true, sound: true, priority: 'normal' },
            fee: { enabled: true, sound: true, priority: 'high' },
            event: { enabled: true, sound: true, priority: 'normal' },
            system: { enabled: true, sound: false, priority: 'low' }
        },
        
        // AI settings
        aiFilterEnabled: true,
        aiPriorityEnabled: true,
        aiSummaryEnabled: true
    });
    
    const [saving, setSaving] = useState(false);
    
    const notificationTypes = [
        { key: 'message', label: 'Direct Messages', icon: MessageCircle, description: '1:1 conversations' },
        { key: 'broadcast', label: 'Broadcasts', icon: Megaphone, description: 'Mass communication' },
        { key: 'channel', label: 'Channel Updates', icon: Hash, description: 'Group discussions' },
        { key: 'fee', label: 'Fee Alerts', icon: CreditCard, description: 'Payment notifications' },
        { key: 'event', label: 'Events', icon: Calendar, description: 'Calendar reminders' },
        { key: 'system', label: 'System', icon: Settings, description: 'App notifications' }
    ];
    
    const handleSave = async () => {
        setSaving(true);
        try {
            await api.post('/jashsync/notification-settings', settings);
            toast({ title: "Success", description: 'Settings saved successfully' });
            onOpenChange(false);
        } catch (error) {
            console.error('Failed to save settings:', error);
            toast({ title: "Error", description: 'Failed to save settings', variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };
    
    const updateSetting = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };
    
    const updateTypeSetting = (type, key, value) => {
        setSettings(prev => ({
            ...prev,
            typeSettings: {
                ...prev.typeSettings,
                [type]: { ...prev.typeSettings[type], [key]: value }
            }
        }));
    };
    
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 max-w-lg max-h-[85vh] p-0">
                <DialogHeader className="p-4 pb-2 border-b border-gray-200 dark:border-gray-700/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center">
                            <Settings className="h-5 w-5 text-yellow-400" />
                        </div>
                        <div>
                            <DialogTitle className="text-gray-900 dark:text-white">Notification Settings</DialogTitle>
                            <DialogDescription>
                                Customize how you receive notifications
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>
                
                <ScrollArea className="flex-1 max-h-[60vh]">
                    <div className="p-4 space-y-6">
                        {/* Master Toggle */}
                        <div className="bg-gray-100/50 dark:bg-gray-800/50 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {settings.enabled ? (
                                        <Bell className="h-5 w-5 text-yellow-400" />
                                    ) : (
                                        <BellOff className="h-5 w-5 text-gray-500" />
                                    )}
                                    <div>
                                        <h4 className="font-medium text-gray-900 dark:text-white">Notifications</h4>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {settings.enabled ? 'Enabled' : 'Disabled'}
                                        </p>
                                    </div>
                                </div>
                                <Switch
                                    checked={settings.enabled}
                                    onCheckedChange={(checked) => updateSetting('enabled', checked)}
                                />
                            </div>
                        </div>
                        
                        <Accordion type="multiple" defaultValue={['sound', 'quiet']} className="space-y-2">
                            {/* Sound & Vibration */}
                            <AccordionItem value="sound" className="border-gray-200 dark:border-gray-700/50 bg-gray-100/30 dark:bg-gray-800/30 rounded-lg px-4">
                                <AccordionTrigger className="py-3 hover:no-underline">
                                    <div className="flex items-center gap-2">
                                        <Volume2 className="h-4 w-4 text-purple-400" />
                                        <span className="text-sm font-medium">Sound & Vibration</span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="space-y-4 pt-2 pb-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            {settings.sound ? (
                                                <Volume2 className="h-4 w-4 text-gray-400" />
                                            ) : (
                                                <VolumeX className="h-4 w-4 text-gray-400" />
                                            )}
                                            <Label className="text-sm">Sound</Label>
                                        </div>
                                        <Switch
                                            checked={settings.sound}
                                            onCheckedChange={(checked) => updateSetting('sound', checked)}
                                            disabled={!settings.enabled}
                                        />
                                    </div>
                                    
                                    {settings.sound && (
                                        <div className="space-y-2">
                                            <Label className="text-xs text-gray-400">Volume</Label>
                                            <div className="flex items-center gap-4">
                                                <VolumeX className="h-4 w-4 text-gray-500" />
                                                <Slider
                                                    value={[settings.soundVolume]}
                                                    onValueChange={([value]) => updateSetting('soundVolume', value)}
                                                    max={100}
                                                    step={10}
                                                    className="flex-1"
                                                />
                                                <Volume2 className="h-4 w-4 text-gray-500" />
                                            </div>
                                        </div>
                                    )}
                                    
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Smartphone className="h-4 w-4 text-gray-400" />
                                            <Label className="text-sm">Vibration</Label>
                                        </div>
                                        <Switch
                                            checked={settings.vibration}
                                            onCheckedChange={(checked) => updateSetting('vibration', checked)}
                                            disabled={!settings.enabled}
                                        />
                                    </div>
                                    
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <Label className="text-sm">Show Preview</Label>
                                            <p className="text-xs text-gray-500">Show message content in notification</p>
                                        </div>
                                        <Switch
                                            checked={settings.showPreview}
                                            onCheckedChange={(checked) => updateSetting('showPreview', checked)}
                                            disabled={!settings.enabled}
                                        />
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                            
                            {/* Quiet Hours */}
                            <AccordionItem value="quiet" className="border-gray-200 dark:border-gray-700/50 bg-gray-100/30 dark:bg-gray-800/30 rounded-lg px-4">
                                <AccordionTrigger className="py-3 hover:no-underline">
                                    <div className="flex items-center gap-2">
                                        <Moon className="h-4 w-4 text-blue-400" />
                                        <span className="text-sm font-medium">Quiet Hours</span>
                                        {settings.quietHoursEnabled && (
                                            <Badge className="bg-blue-500/20 text-blue-400 text-[10px] ml-2">
                                                Active
                                            </Badge>
                                        )}
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="space-y-4 pt-2 pb-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <Label className="text-sm">Enable Quiet Hours</Label>
                                            <p className="text-xs text-gray-500">Mute notifications during set times</p>
                                        </div>
                                        <Switch
                                            checked={settings.quietHoursEnabled}
                                            onCheckedChange={(checked) => updateSetting('quietHoursEnabled', checked)}
                                            disabled={!settings.enabled}
                                        />
                                    </div>
                                    
                                    {settings.quietHoursEnabled && (
                                        <>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1">
                                                    <Label className="text-xs text-gray-500 dark:text-gray-400">Start Time</Label>
                                                    <Input
                                                        type="time"
                                                        value={settings.quietHoursStart}
                                                        onChange={(e) => updateSetting('quietHoursStart', e.target.value)}
                                                        className="bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-sm"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs text-gray-500 dark:text-gray-400">End Time</Label>
                                                    <Input
                                                        type="time"
                                                        value={settings.quietHoursEnd}
                                                        onChange={(e) => updateSetting('quietHoursEnd', e.target.value)}
                                                        className="bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-sm"
                                                    />
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center justify-between p-2 bg-red-500/10 rounded-lg border border-red-500/20">
                                                <div className="flex items-center gap-2">
                                                    <AlertTriangle className="h-4 w-4 text-red-400" />
                                                    <Label className="text-sm text-red-300">Allow Urgent</Label>
                                                </div>
                                                <Switch
                                                    checked={settings.quietHoursAllowUrgent}
                                                    onCheckedChange={(checked) => updateSetting('quietHoursAllowUrgent', checked)}
                                                />
                                            </div>
                                        </>
                                    )}
                                </AccordionContent>
                            </AccordionItem>
                            
                            {/* Delivery Channels */}
                            <AccordionItem value="delivery" className="border-gray-200 dark:border-gray-700/50 bg-gray-100/30 dark:bg-gray-800/30 rounded-lg px-4">
                                <AccordionTrigger className="py-3 hover:no-underline">
                                    <div className="flex items-center gap-2">
                                        <Globe className="h-4 w-4 text-green-400" />
                                        <span className="text-sm font-medium">Delivery Channels</span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="space-y-4 pt-2 pb-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Smartphone className="h-4 w-4 text-gray-400" />
                                            <div>
                                                <Label className="text-sm">Push Notifications</Label>
                                                <p className="text-xs text-gray-500">Browser & mobile push</p>
                                            </div>
                                        </div>
                                        <Switch
                                            checked={settings.pushEnabled}
                                            onCheckedChange={(checked) => updateSetting('pushEnabled', checked)}
                                            disabled={!settings.enabled}
                                        />
                                    </div>
                                    
                                    <div className="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-700/50">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Mail className="h-4 w-4 text-gray-400" />
                                                <div>
                                                    <Label className="text-sm">Email Notifications</Label>
                                                    <p className="text-xs text-gray-500">Send digest via email</p>
                                                </div>
                                            </div>
                                            <Switch
                                                checked={settings.emailEnabled}
                                                onCheckedChange={(checked) => updateSetting('emailEnabled', checked)}
                                                disabled={!settings.enabled}
                                            />
                                        </div>
                                        
                                        {settings.emailEnabled && (
                                            <div className="pl-6 space-y-1">
                                                <Label className="text-xs text-gray-500 dark:text-gray-400">Email Frequency</Label>
                                                <Select 
                                                    value={settings.emailDigest}
                                                    onValueChange={(value) => updateSetting('emailDigest', value)}
                                                >
                                                    <SelectTrigger className="bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 h-8 text-sm">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                                                        <SelectItem value="instant">Instant</SelectItem>
                                                        <SelectItem value="hourly">Hourly Digest</SelectItem>
                                                        <SelectItem value="daily">Daily Digest</SelectItem>
                                                        <SelectItem value="weekly">Weekly Digest</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                            
                            {/* Per-Type Settings */}
                            <AccordionItem value="types" className="border-gray-200 dark:border-gray-700/50 bg-gray-100/30 dark:bg-gray-800/30 rounded-lg px-4">
                                <AccordionTrigger className="py-3 hover:no-underline">
                                    <div className="flex items-center gap-2">
                                        <Bell className="h-4 w-4 text-yellow-400" />
                                        <span className="text-sm font-medium">Notification Types</span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="space-y-3 pt-2 pb-4">
                                    {notificationTypes.map((type) => {
                                        const TypeIcon = type.icon;
                                        const typeSetting = settings.typeSettings[type.key];
                                        
                                        return (
                                            <div 
                                                key={type.key}
                                                className="flex items-center justify-between p-2 rounded-lg bg-gray-100/50 dark:bg-gray-800/50"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <TypeIcon className="h-4 w-4 text-gray-400" />
                                                    <div>
                                                        <Label className="text-sm">{type.label}</Label>
                                                        <p className="text-[10px] text-gray-500">{type.description}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className={cn(
                                                            "h-6 px-2",
                                                            typeSetting.sound ? "text-purple-400" : "text-gray-500"
                                                        )}
                                                        onClick={() => updateTypeSetting(type.key, 'sound', !typeSetting.sound)}
                                                    >
                                                        {typeSetting.sound ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
                                                    </Button>
                                                    <Switch
                                                        checked={typeSetting.enabled}
                                                        onCheckedChange={(checked) => updateTypeSetting(type.key, 'enabled', checked)}
                                                        disabled={!settings.enabled}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </AccordionContent>
                            </AccordionItem>
                            
                            {/* AI Settings */}
                            <AccordionItem value="ai" className="border-gray-200 dark:border-gray-700/50 bg-gray-100/30 dark:bg-gray-800/30 rounded-lg px-4">
                                <AccordionTrigger className="py-3 hover:no-underline">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm">🤖</span>
                                        <span className="text-sm font-medium">AI Features</span>
                                        <Badge className="bg-purple-500/20 text-purple-400 text-[10px] ml-2">
                                            Beta
                                        </Badge>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="space-y-4 pt-2 pb-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <Label className="text-sm">Smart Filtering</Label>
                                            <p className="text-xs text-gray-500">AI filters less important notifications</p>
                                        </div>
                                        <Switch
                                            checked={settings.aiFilterEnabled}
                                            onCheckedChange={(checked) => updateSetting('aiFilterEnabled', checked)}
                                            disabled={!settings.enabled}
                                        />
                                    </div>
                                    
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <Label className="text-sm">Auto Priority</Label>
                                            <p className="text-xs text-gray-500">AI assigns priority to notifications</p>
                                        </div>
                                        <Switch
                                            checked={settings.aiPriorityEnabled}
                                            onCheckedChange={(checked) => updateSetting('aiPriorityEnabled', checked)}
                                            disabled={!settings.enabled}
                                        />
                                    </div>
                                    
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <Label className="text-sm">Daily Summary</Label>
                                            <p className="text-xs text-gray-500">AI-generated notification summary</p>
                                        </div>
                                        <Switch
                                            checked={settings.aiSummaryEnabled}
                                            onCheckedChange={(checked) => updateSetting('aiSummaryEnabled', checked)}
                                            disabled={!settings.enabled}
                                        />
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </div>
                </ScrollArea>
                
                {/* Footer */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700/50 flex justify-end gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-gradient-to-r from-yellow-500 to-orange-500"
                    >
                        {saving ? (
                            <>
                                <span className="animate-spin mr-2">⟳</span>
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4 mr-2" />
                                Save Settings
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default NotificationSettings;
