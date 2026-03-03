import React, { useState, useEffect } from 'react';
import { 
    Shield, Eye, EyeOff, Clock, Check, CheckCheck, MessageSquare,
    Users, UserX, Bell, BellOff, Lock, Unlock, Info, Save,
    Settings, ChevronRight, AlertCircle, Loader2, ToggleLeft, ToggleRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useToast } from '@/components/ui/use-toast';

/**
 * PrivacySettings - Main privacy control dashboard
 * Control online status, read receipts, last seen, who can message you
 */
const PrivacySettings = ({ 
    onViewBlocked,
    onViewOnlineStatus,
    className 
}) => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    
    // Privacy settings state
    const [settings, setSettings] = useState({
        // Online Status
        showOnlineStatus: true,
        onlineStatusVisibility: 'everyone', // everyone, contacts, role, nobody
        
        // Last Seen
        showLastSeen: true,
        lastSeenVisibility: 'everyone',
        
        // Read Receipts
        sendReadReceipts: true,
        readReceiptVisibility: 'everyone',
        
        // Typing Indicator
        showTypingIndicator: true,
        
        // Profile Photo
        profilePhotoVisibility: 'everyone',
        
        // About/Status
        aboutVisibility: 'everyone',
        
        // Who can message
        whoCanMessage: 'everyone', // everyone, contacts, role, nobody
        
        // Who can add to groups/channels
        whoCanAddToGroups: 'everyone',
        
        // Notifications
        muteNotifications: false,
        muteDuration: null, // null, '1h', '8h', '24h', '7d', 'forever'
        
        // Security
        twoFactorEnabled: false,
        sessionTimeout: '30d', // '1d', '7d', '30d', 'never'
        
        // Data
        autoDeleteMessages: false,
        deleteAfter: '30d' // '7d', '30d', '90d', '1y'
    });
    
    // Original settings for comparison
    const [originalSettings, setOriginalSettings] = useState(null);
    
    // Stats
    const [stats, setStats] = useState({
        blockedUsers: 3,
        mutedChats: 5,
        hiddenFromCount: 0
    });
    
    useEffect(() => {
        loadSettings();
    }, []);
    
    // Check for changes
    useEffect(() => {
        if (originalSettings) {
            const changed = JSON.stringify(settings) !== JSON.stringify(originalSettings);
            setHasChanges(changed);
        }
    }, [settings, originalSettings]);
    
    const loadSettings = async () => {
        setLoading(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 800));
            
            // Mock loaded settings
            const loaded = {
                showOnlineStatus: true,
                onlineStatusVisibility: 'everyone',
                showLastSeen: true,
                lastSeenVisibility: 'contacts',
                sendReadReceipts: true,
                readReceiptVisibility: 'everyone',
                showTypingIndicator: true,
                profilePhotoVisibility: 'everyone',
                aboutVisibility: 'contacts',
                whoCanMessage: 'everyone',
                whoCanAddToGroups: 'contacts',
                muteNotifications: false,
                muteDuration: null,
                twoFactorEnabled: false,
                sessionTimeout: '30d',
                autoDeleteMessages: false,
                deleteAfter: '30d'
            };
            
            setSettings(loaded);
            setOriginalSettings(loaded);
            
        } catch (error) {
            console.error('Failed to load settings:', error);
            toast({ title: "Error", description: 'Failed to load privacy settings', variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };
    
    const updateSetting = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };
    
    const saveSettings = async () => {
        setSaving(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 1200));
            
            setOriginalSettings({ ...settings });
            setHasChanges(false);
            
            toast({ title: "Saved", description: 'Privacy settings updated successfully' });
            
        } catch (error) {
            console.error('Failed to save settings:', error);
            toast({ title: "Error", description: 'Failed to save settings', variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };
    
    const resetSettings = () => {
        if (originalSettings) {
            setSettings({ ...originalSettings });
        }
    };
    
    // Visibility options
    const visibilityOptions = [
        { value: 'everyone', label: 'Everyone', icon: Users },
        { value: 'contacts', label: 'My Contacts', icon: Users },
        { value: 'role', label: 'Same Role Only', icon: Shield },
        { value: 'nobody', label: 'Nobody', icon: EyeOff },
    ];
    
    if (loading) {
        return (
            <div className={cn("flex items-center justify-center", className)}>
                <div className="flex items-center gap-3 text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Loading privacy settings...</span>
                </div>
            </div>
        );
    }
    
    return (
        <div className={cn("flex flex-col h-full", className)}>
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700/50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                            <Shield className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Privacy Settings</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Control who sees your information</p>
                        </div>
                    </div>
                    
                    {hasChanges && (
                        <div className="flex items-center gap-2">
                            <Button 
                                variant="outline" 
                                size="sm"
                                onClick={resetSettings}
                                className="border-gray-200 dark:border-gray-700"
                            >
                                Reset
                            </Button>
                            <Button 
                                size="sm"
                                onClick={saveSettings}
                                disabled={saving}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        Save Changes
                                    </>
                                )}
                            </Button>
                        </div>
                    )}
                </div>
                
                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-3 mt-4">
                    <Card 
                        className="bg-gray-800/50 border-gray-700 cursor-pointer hover:border-gray-600 transition-colors"
                        onClick={onViewBlocked}
                    >
                        <CardContent className="p-3 flex items-center justify-between">
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Blocked Users</p>
                                <p className="text-xl font-bold text-red-400">{stats.blockedUsers}</p>
                            </div>
                            <UserX className="w-5 h-5 text-red-400" />
                        </CardContent>
                    </Card>
                    
                    <Card className="bg-gray-100/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
                        <CardContent className="p-3 flex items-center justify-between">
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Muted Chats</p>
                                <p className="text-xl font-bold text-yellow-400">{stats.mutedChats}</p>
                            </div>
                            <BellOff className="w-5 h-5 text-yellow-400" />
                        </CardContent>
                    </Card>
                    
                    <Card 
                        className="bg-gray-800/50 border-gray-700 cursor-pointer hover:border-gray-600 transition-colors"
                        onClick={onViewOnlineStatus}
                    >
                        <CardContent className="p-3 flex items-center justify-between">
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Hidden From</p>
                                <p className="text-xl font-bold text-blue-400">{stats.hiddenFromCount}</p>
                            </div>
                            <EyeOff className="w-5 h-5 text-blue-400" />
                        </CardContent>
                    </Card>
                </div>
            </div>
            
            {/* Settings List */}
            <ScrollArea className="flex-1">
                <div className="p-4 space-y-6">
                    {/* Online Status Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Eye className="w-4 h-4 text-green-400" />
                            <h3 className="font-medium text-gray-900 dark:text-white">Online Status</h3>
                        </div>
                        
                        <Card className="bg-gray-100/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
                            <CardContent className="p-4 space-y-4">
                                {/* Show Online Status */}
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">Show Online Status</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Let others see when you're online</p>
                                    </div>
                                    <Switch
                                        checked={settings.showOnlineStatus}
                                        onCheckedChange={(v) => updateSetting('showOnlineStatus', v)}
                                        className="data-[state=checked]:bg-green-600"
                                    />
                                </div>
                                
                                {settings.showOnlineStatus && (
                                    <div className="flex items-center justify-between pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                                        <p className="text-sm text-gray-700 dark:text-gray-300">Who can see</p>
                                        <Select
                                            value={settings.onlineStatusVisibility}
                                            onValueChange={(v) => updateSetting('onlineStatusVisibility', v)}
                                        >
                                            <SelectTrigger className="w-[140px] bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                                                {visibilityOptions.map((opt) => (
                                                    <SelectItem key={opt.value} value={opt.value}>
                                                        {opt.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                                
                                <Separator className="bg-gray-200 dark:bg-gray-700" />
                                
                                {/* Show Last Seen */}
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">Show Last Seen</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Let others see when you were last active</p>
                                    </div>
                                    <Switch
                                        checked={settings.showLastSeen}
                                        onCheckedChange={(v) => updateSetting('showLastSeen', v)}
                                        className="data-[state=checked]:bg-green-600"
                                    />
                                </div>
                                
                                {settings.showLastSeen && (
                                    <div className="flex items-center justify-between pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                                        <p className="text-sm text-gray-700 dark:text-gray-300">Who can see</p>
                                        <Select
                                            value={settings.lastSeenVisibility}
                                            onValueChange={(v) => updateSetting('lastSeenVisibility', v)}
                                        >
                                            <SelectTrigger className="w-[140px] bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                                                {visibilityOptions.map((opt) => (
                                                    <SelectItem key={opt.value} value={opt.value}>
                                                        {opt.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                    
                    {/* Read Receipts Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <CheckCheck className="w-4 h-4 text-blue-400" />
                            <h3 className="font-medium text-gray-900 dark:text-white">Read Receipts</h3>
                        </div>
                        
                        <Card className="bg-gray-100/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
                            <CardContent className="p-4 space-y-4">
                                {/* Send Read Receipts */}
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">Send Read Receipts</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Let senders know when you've read their messages</p>
                                    </div>
                                    <Switch
                                        checked={settings.sendReadReceipts}
                                        onCheckedChange={(v) => updateSetting('sendReadReceipts', v)}
                                        className="data-[state=checked]:bg-blue-600"
                                    />
                                </div>
                                
                                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                                    <div className="flex items-start gap-2">
                                        <Info className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                                        <p className="text-xs text-blue-300">
                                            If you turn off read receipts, you won't be able to see read receipts from others either.
                                        </p>
                                    </div>
                                </div>
                                
                                <Separator className="bg-gray-200 dark:bg-gray-700" />
                                
                                {/* Typing Indicator */}
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">Typing Indicator</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Show when you're typing a message</p>
                                    </div>
                                    <Switch
                                        checked={settings.showTypingIndicator}
                                        onCheckedChange={(v) => updateSetting('showTypingIndicator', v)}
                                        className="data-[state=checked]:bg-blue-600"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                    
                    {/* Profile Visibility Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-purple-400" />
                            <h3 className="font-medium text-gray-900 dark:text-white">Profile Visibility</h3>
                        </div>
                        
                        <Card className="bg-gray-100/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
                            <CardContent className="p-4 space-y-4">
                                {/* Profile Photo */}
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-gray-900 dark:text-white">Profile Photo</p>
                                    <Select
                                        value={settings.profilePhotoVisibility}
                                        onValueChange={(v) => updateSetting('profilePhotoVisibility', v)}
                                    >
                                        <SelectTrigger className="w-[140px] bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                                            {visibilityOptions.map((opt) => (
                                                <SelectItem key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                
                                {/* About/Status */}
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-gray-900 dark:text-white">About/Status</p>
                                    <Select
                                        value={settings.aboutVisibility}
                                        onValueChange={(v) => updateSetting('aboutVisibility', v)}
                                    >
                                        <SelectTrigger className="w-[140px] bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                                            {visibilityOptions.map((opt) => (
                                                <SelectItem key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                    
                    {/* Messaging Controls Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-orange-400" />
                            <h3 className="font-medium text-gray-900 dark:text-white">Messaging Controls</h3>
                        </div>
                        
                        <Card className="bg-gray-100/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
                            <CardContent className="p-4 space-y-4">
                                {/* Who can message */}
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-900 dark:text-white">Who can message me</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Control who can start conversations</p>
                                    </div>
                                    <Select
                                        value={settings.whoCanMessage}
                                        onValueChange={(v) => updateSetting('whoCanMessage', v)}
                                    >
                                        <SelectTrigger className="w-[140px] bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                                            {visibilityOptions.map((opt) => (
                                                <SelectItem key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                
                                {/* Who can add to groups */}
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-900 dark:text-white">Who can add me to groups</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Control group/channel invitations</p>
                                    </div>
                                    <Select
                                        value={settings.whoCanAddToGroups}
                                        onValueChange={(v) => updateSetting('whoCanAddToGroups', v)}
                                    >
                                        <SelectTrigger className="w-[140px] bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                                            {visibilityOptions.map((opt) => (
                                                <SelectItem key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                    
                    {/* Security Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Lock className="w-4 h-4 text-red-400" />
                            <h3 className="font-medium text-gray-900 dark:text-white">Security</h3>
                        </div>
                        
                        <Card className="bg-gray-100/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
                            <CardContent className="p-4 space-y-4">
                                {/* Two Factor */}
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">Two-Factor Authentication</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Add extra security to your account</p>
                                    </div>
                                    <Switch
                                        checked={settings.twoFactorEnabled}
                                        onCheckedChange={(v) => updateSetting('twoFactorEnabled', v)}
                                        className="data-[state=checked]:bg-red-600"
                                    />
                                </div>
                                
                                <Separator className="bg-gray-200 dark:bg-gray-700" />
                                
                                {/* Session Timeout */}
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-900 dark:text-white">Session Timeout</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Auto logout after inactivity</p>
                                    </div>
                                    <Select
                                        value={settings.sessionTimeout}
                                        onValueChange={(v) => updateSetting('sessionTimeout', v)}
                                    >
                                        <SelectTrigger className="w-[140px] bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                                            <SelectItem value="1d">1 Day</SelectItem>
                                            <SelectItem value="7d">7 Days</SelectItem>
                                            <SelectItem value="30d">30 Days</SelectItem>
                                            <SelectItem value="never">Never</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                    
                    {/* Data & Storage Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Settings className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                            <h3 className="font-medium text-gray-900 dark:text-white">Data & Storage</h3>
                        </div>
                        
                        <Card className="bg-gray-100/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
                            <CardContent className="p-4 space-y-4">
                                {/* Auto Delete */}
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">Auto-delete Messages</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Automatically delete old messages</p>
                                    </div>
                                    <Switch
                                        checked={settings.autoDeleteMessages}
                                        onCheckedChange={(v) => updateSetting('autoDeleteMessages', v)}
                                        className="data-[state=checked]:bg-gray-600"
                                    />
                                </div>
                                
                                {settings.autoDeleteMessages && (
                                    <div className="flex items-center justify-between pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                                        <p className="text-sm text-gray-700 dark:text-gray-300">Delete after</p>
                                        <Select
                                            value={settings.deleteAfter}
                                            onValueChange={(v) => updateSetting('deleteAfter', v)}
                                        >
                                            <SelectTrigger className="w-[140px] bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                                                <SelectItem value="7d">7 Days</SelectItem>
                                                <SelectItem value="30d">30 Days</SelectItem>
                                                <SelectItem value="90d">90 Days</SelectItem>
                                                <SelectItem value="1y">1 Year</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                    
                    {/* Quick Actions */}
                    <div className="space-y-3 pt-4">
                        <Button
                            variant="outline"
                            className="w-full justify-between border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                            onClick={onViewBlocked}
                        >
                            <span className="flex items-center gap-2">
                                <UserX className="w-4 h-4 text-red-400" />
                                Blocked Users
                            </span>
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-red-400 border-red-400/50">
                                    {stats.blockedUsers}
                                </Badge>
                                <ChevronRight className="w-4 h-4" />
                            </div>
                        </Button>
                        
                        <Button
                            variant="outline"
                            className="w-full justify-between border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                            onClick={onViewOnlineStatus}
                        >
                            <span className="flex items-center gap-2">
                                <Eye className="w-4 h-4 text-green-400" />
                                Online Status Controls
                            </span>
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </ScrollArea>
        </div>
    );
};

export default PrivacySettings;
