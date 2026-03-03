import React, { useState, useEffect } from 'react';
import { 
    Zap, Plus, Search, Filter, MoreVertical, Play, Pause, Trash2,
    Edit3, Copy, Clock, MessageSquare, Users, AlertCircle, CheckCircle,
    Calendar, ArrowRight, RefreshCw, Settings, Bell, Mail, Hash,
    ChevronRight, Sparkles, Activity, TrendingUp, ToggleLeft, ToggleRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useToast } from '@/components/ui/use-toast';
import api from "@/services/api";

/**
 * AutomationDashboard - Manage automation rules and workflows
 * Auto-replies, triggers, scheduled actions
 */
const AutomationDashboard = ({ 
    onCreateRule,
    onViewScheduled
}) => {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState('rules');
    const [searchQuery, setSearchQuery] = useState('');
    const [rules, setRules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalRules: 0,
        activeRules: 0,
        triggeredToday: 0,
        messagesAutomated: 0
    });
    
    // Mock automation rules
    useEffect(() => {
        const loadRules = async () => {
            setLoading(true);
            try {
                // Simulate API call
                await new Promise(resolve => setTimeout(resolve, 800));
                
                const mockRules = [
                    {
                        id: 1,
                        name: 'Fee Reminder Auto-Reply',
                        description: 'Auto-respond to fee-related queries with payment details',
                        trigger: { type: 'keyword', value: ['fee', 'payment', 'dues'] },
                        action: { type: 'reply', template: 'fee_reminder' },
                        target: { type: 'all', value: null },
                        isActive: true,
                        triggeredCount: 245,
                        lastTriggered: new Date(Date.now() - 3600000),
                        createdAt: new Date('2026-02-01')
                    },
                    {
                        id: 2,
                        name: 'Welcome New Parents',
                        description: 'Send welcome message when new parent joins',
                        trigger: { type: 'event', value: 'parent_joined' },
                        action: { type: 'message', content: 'Welcome to our school community! 🎉' },
                        target: { type: 'role', value: 'parent' },
                        isActive: true,
                        triggeredCount: 89,
                        lastTriggered: new Date(Date.now() - 7200000),
                        createdAt: new Date('2026-01-15')
                    },
                    {
                        id: 3,
                        name: 'After-Hours Auto-Reply',
                        description: 'Send auto-reply outside office hours',
                        trigger: { type: 'schedule', value: { start: '18:00', end: '09:00' } },
                        action: { type: 'reply', template: 'after_hours' },
                        target: { type: 'all', value: null },
                        isActive: true,
                        triggeredCount: 567,
                        lastTriggered: new Date(Date.now() - 1800000),
                        createdAt: new Date('2026-01-20')
                    },
                    {
                        id: 4,
                        name: 'Attendance Alert',
                        description: 'Notify parents when child marked absent',
                        trigger: { type: 'event', value: 'student_absent' },
                        action: { type: 'notify', channel: 'parent' },
                        target: { type: 'dynamic', value: 'parent_of_student' },
                        isActive: false,
                        triggeredCount: 156,
                        lastTriggered: new Date(Date.now() - 86400000),
                        createdAt: new Date('2026-02-10')
                    },
                    {
                        id: 5,
                        name: 'Exam Schedule Broadcast',
                        description: 'Auto-broadcast exam schedule 7 days before',
                        trigger: { type: 'schedule', value: { daysBeforeEvent: 7, event: 'exam' } },
                        action: { type: 'broadcast', template: 'exam_schedule' },
                        target: { type: 'class', value: 'all_classes' },
                        isActive: true,
                        triggeredCount: 12,
                        lastTriggered: new Date(Date.now() - 604800000),
                        createdAt: new Date('2026-02-05')
                    }
                ];
                
                setRules(mockRules);
                setStats({
                    totalRules: mockRules.length,
                    activeRules: mockRules.filter(r => r.isActive).length,
                    triggeredToday: 87,
                    messagesAutomated: 1245
                });
                
            } catch (error) {
                console.error('Failed to load rules:', error);
                toast({ title: "Error", description: 'Failed to load automation rules', variant: "destructive" });
            } finally {
                setLoading(false);
            }
        };
        
        loadRules();
    }, []);
    
    // Toggle rule status
    const toggleRule = (id) => {
        setRules(prev => prev.map(rule => 
            rule.id === id ? { ...rule, isActive: !rule.isActive } : rule
        ));
        
        const rule = rules.find(r => r.id === id);
        toast({ 
            title: rule?.isActive ? "Rule Paused" : "Rule Activated",
            description: `"${rule?.name}" has been ${rule?.isActive ? 'paused' : 'activated'}`
        });
    };
    
    // Delete rule
    const deleteRule = (id) => {
        const rule = rules.find(r => r.id === id);
        setRules(prev => prev.filter(r => r.id !== id));
        toast({ title: "Rule Deleted", description: `"${rule?.name}" has been deleted` });
    };
    
    // Duplicate rule
    const duplicateRule = (id) => {
        const rule = rules.find(r => r.id === id);
        if (rule) {
            const newRule = {
                ...rule,
                id: Date.now(),
                name: `${rule.name} (Copy)`,
                isActive: false,
                triggeredCount: 0,
                lastTriggered: null,
                createdAt: new Date()
            };
            setRules(prev => [...prev, newRule]);
            toast({ title: "Rule Duplicated", description: `Copy of "${rule.name}" created` });
        }
    };
    
    // Filter rules
    const filteredRules = rules.filter(rule => {
        if (!searchQuery) return true;
        return rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
               rule.description.toLowerCase().includes(searchQuery.toLowerCase());
    });
    
    // Get trigger icon
    const getTriggerIcon = (type) => {
        switch (type) {
            case 'keyword': return MessageSquare;
            case 'event': return Bell;
            case 'schedule': return Clock;
            default: return Zap;
        }
    };
    
    // Get trigger label
    const getTriggerLabel = (trigger) => {
        switch (trigger.type) {
            case 'keyword':
                return `Keywords: ${trigger.value.join(', ')}`;
            case 'event':
                return `Event: ${trigger.value.replace(/_/g, ' ')}`;
            case 'schedule':
                if (trigger.value.start && trigger.value.end) {
                    return `Time: ${trigger.value.start} - ${trigger.value.end}`;
                }
                return `${trigger.value.daysBeforeEvent} days before ${trigger.value.event}`;
            default:
                return 'Unknown trigger';
        }
    };
    
    // Get action label
    const getActionLabel = (action) => {
        switch (action.type) {
            case 'reply': return 'Auto Reply';
            case 'message': return 'Send Message';
            case 'broadcast': return 'Broadcast';
            case 'notify': return 'Notification';
            default: return 'Action';
        }
    };
    
    // Format time ago
    const formatTimeAgo = (date) => {
        if (!date) return 'Never';
        const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    };
    
    return (
        <div className="h-full flex flex-col bg-white dark:bg-gray-900">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700/50">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                            <Zap className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Automation Engine</h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Automate messages and actions</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button 
                            variant="outline" 
                            onClick={onViewScheduled}
                            className="border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                            <Calendar className="w-4 h-4 mr-2" />
                            Scheduled
                        </Button>
                        <Button 
                            onClick={onCreateRule}
                            className="bg-orange-600 hover:bg-orange-700"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Create Rule
                        </Button>
                    </div>
                </div>
                
                {/* Stats */}
                <div className="grid grid-cols-4 gap-3">
                    <Card className="bg-gray-100/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
                        <CardContent className="p-3 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                <Settings className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                                <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.totalRules}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Total Rules</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-gray-100/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
                        <CardContent className="p-3 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                                <Activity className="w-5 h-5 text-green-400" />
                            </div>
                            <div>
                                <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.activeRules}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Active</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-gray-100/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
                        <CardContent className="p-3 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 text-purple-400" />
                            </div>
                            <div>
                                <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.triggeredToday}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Triggered Today</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-gray-100/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
                        <CardContent className="p-3 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                                <MessageSquare className="w-5 h-5 text-orange-400" />
                            </div>
                            <div>
                                <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.messagesAutomated}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Messages Sent</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
            
            {/* Search */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700/50">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        placeholder="Search automation rules..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                    />
                </div>
            </div>
            
            {/* Rules List */}
            <ScrollArea className="flex-1 p-4">
                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <Card key={i} className="bg-gray-100/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 animate-pulse">
                                <CardContent className="p-4">
                                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2" />
                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : filteredRules.length === 0 ? (
                    <div className="text-center py-12">
                        <Zap className="w-12 h-12 mx-auto text-gray-600 mb-4" />
                        <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">No Automation Rules</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            {searchQuery ? 'No rules match your search' : 'Create your first automation rule to get started'}
                        </p>
                        {!searchQuery && (
                            <Button onClick={onCreateRule} className="bg-orange-600 hover:bg-orange-700">
                                <Plus className="w-4 h-4 mr-2" />
                                Create Rule
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredRules.map((rule) => {
                            const TriggerIcon = getTriggerIcon(rule.trigger.type);
                            
                            return (
                                <Card 
                                    key={rule.id} 
                                    className={cn(
                                        "bg-gray-100/50 dark:bg-gray-800/50 border transition-all",
                                        rule.isActive 
                                            ? "border-orange-500/30 hover:border-orange-500/50" 
                                            : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                                    )}
                                >
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start gap-4 flex-1">
                                                {/* Status Indicator */}
                                                <div className={cn(
                                                    "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                                                    rule.isActive ? "bg-orange-500/20" : "bg-gray-200 dark:bg-gray-700"
                                                )}>
                                                    <TriggerIcon className={cn(
                                                        "w-5 h-5",
                                                        rule.isActive ? "text-orange-400" : "text-gray-500"
                                                    )} />
                                                </div>
                                                
                                                {/* Rule Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h4 className="font-medium text-gray-900 dark:text-white truncate">{rule.name}</h4>
                                                        <Badge 
                                                            variant="outline" 
                                                            className={cn(
                                                                "text-xs",
                                                                rule.isActive 
                                                                    ? "text-green-400 border-green-400/50" 
                                                                    : "text-gray-500 border-gray-600"
                                                            )}
                                                        >
                                                            {rule.isActive ? 'Active' : 'Paused'}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{rule.description}</p>
                                                    
                                                    {/* Trigger & Action */}
                                                    <div className="flex items-center gap-4 text-xs">
                                                        <div className="flex items-center gap-2 text-gray-500">
                                                            <TriggerIcon className="w-3 h-3" />
                                                            <span>{getTriggerLabel(rule.trigger)}</span>
                                                        </div>
                                                        <ArrowRight className="w-3 h-3 text-gray-600" />
                                                        <div className="flex items-center gap-2 text-gray-500">
                                                            <Zap className="w-3 h-3" />
                                                            <span>{getActionLabel(rule.action)}</span>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Stats */}
                                                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                                                        <span className="flex items-center gap-1">
                                                            <Activity className="w-3 h-3" />
                                                            {rule.triggeredCount} triggers
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            Last: {formatTimeAgo(rule.lastTriggered)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* Actions */}
                                            <div className="flex items-center gap-2 ml-4">
                                                <Switch
                                                    checked={rule.isActive}
                                                    onCheckedChange={() => toggleRule(rule.id)}
                                                    className="data-[state=checked]:bg-orange-600"
                                                />
                                                
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                            <MoreVertical className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                                                        <DropdownMenuItem className="hover:bg-gray-100 dark:hover:bg-gray-700">
                                                            <Edit3 className="w-4 h-4 mr-2" />
                                                            Edit Rule
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem 
                                                            className="hover:bg-gray-100 dark:hover:bg-gray-700"
                                                            onClick={() => duplicateRule(rule.id)}
                                                        >
                                                            <Copy className="w-4 h-4 mr-2" />
                                                            Duplicate
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
                                                        <DropdownMenuItem 
                                                            className="text-red-400 hover:bg-red-500/20"
                                                            onClick={() => deleteRule(rule.id)}
                                                        >
                                                            <Trash2 className="w-4 h-4 mr-2" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
                
                {/* Quick Templates */}
                <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-orange-400" />
                        Quick Templates
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { 
                                name: 'Out of Office', 
                                desc: 'Auto-reply when unavailable',
                                icon: Clock 
                            },
                            { 
                                name: 'Welcome Message', 
                                desc: 'Greet new members',
                                icon: Users 
                            },
                            { 
                                name: 'Fee Reminder', 
                                desc: 'Auto-send payment reminders',
                                icon: Bell 
                            },
                            { 
                                name: 'Event Notification', 
                                desc: 'Alert before events',
                                icon: Calendar 
                            },
                        ].map((template, index) => {
                            const Icon = template.icon;
                            return (
                                <Card 
                                    key={index}
                                    className="bg-gray-100/30 dark:bg-gray-800/30 border-gray-200 dark:border-gray-700/50 hover:border-orange-500/30 cursor-pointer transition-colors"
                                    onClick={onCreateRule}
                                >
                                    <CardContent className="p-3 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700/50 flex items-center justify-center">
                                            <Icon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{template.name}</p>
                                            <p className="text-xs text-gray-500 truncate">{template.desc}</p>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-gray-600" />
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            </ScrollArea>
        </div>
    );
};

export default AutomationDashboard;
