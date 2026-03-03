import React, { useState, useEffect } from 'react';
import { 
    Zap, MessageSquare, Clock, Bell, Users, Hash, ChevronRight,
    ChevronLeft, Check, X, Plus, Trash2, Loader2, AlertCircle,
    Mail, Megaphone, Calendar, ArrowRight, Sparkles, Save
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { cn } from "@/lib/utils";
import { useToast } from '@/components/ui/use-toast';
import api from "@/services/api";

/**
 * CreateRuleModal - Create/Edit automation rules
 * Step-by-step wizard for rule creation
 */
const CreateRuleModal = ({ 
    open, 
    onOpenChange,
    editRule = null,
    onRuleCreated
}) => {
    const { toast } = useToast();
    const [step, setStep] = useState(1); // 1: Basics, 2: Trigger, 3: Action, 4: Target, 5: Review
    const [saving, setSaving] = useState(false);
    
    const [rule, setRule] = useState({
        name: '',
        description: '',
        triggerType: 'keyword',
        triggerConfig: {
            keywords: [],
            eventType: '',
            scheduleType: 'time_range',
            startTime: '09:00',
            endTime: '18:00',
            daysBeforeEvent: 1,
            eventCategory: ''
        },
        actionType: 'reply',
        actionConfig: {
            message: '',
            template: '',
            broadcastType: 'immediate'
        },
        targetType: 'all',
        targetConfig: {
            roles: [],
            classes: [],
            channels: []
        },
        isActive: true
    });
    
    const [newKeyword, setNewKeyword] = useState('');
    
    // Trigger types
    const triggerTypes = [
        { 
            id: 'keyword', 
            label: 'Keyword Match', 
            icon: MessageSquare, 
            description: 'Trigger when message contains specific words',
            color: 'text-blue-400 bg-blue-500/20'
        },
        { 
            id: 'event', 
            label: 'System Event', 
            icon: Bell, 
            description: 'Trigger on specific system events',
            color: 'text-green-400 bg-green-500/20'
        },
        { 
            id: 'schedule', 
            label: 'Time/Schedule', 
            icon: Clock, 
            description: 'Trigger at specific times or dates',
            color: 'text-orange-400 bg-orange-500/20'
        },
    ];
    
    // Event types
    const eventTypes = [
        { id: 'parent_joined', label: 'New Parent Joined' },
        { id: 'student_absent', label: 'Student Marked Absent' },
        { id: 'fee_overdue', label: 'Fee Payment Overdue' },
        { id: 'exam_scheduled', label: 'Exam Scheduled' },
        { id: 'homework_assigned', label: 'Homework Assigned' },
        { id: 'result_published', label: 'Result Published' },
    ];
    
    // Action types
    const actionTypes = [
        { 
            id: 'reply', 
            label: 'Auto Reply', 
            icon: MessageSquare, 
            description: 'Send automatic response',
            color: 'text-blue-400 bg-blue-500/20'
        },
        { 
            id: 'message', 
            label: 'Send Message', 
            icon: Mail, 
            description: 'Send a direct message',
            color: 'text-purple-400 bg-purple-500/20'
        },
        { 
            id: 'broadcast', 
            label: 'Broadcast', 
            icon: Megaphone, 
            description: 'Send to multiple recipients',
            color: 'text-orange-400 bg-orange-500/20'
        },
        { 
            id: 'notify', 
            label: 'Notification', 
            icon: Bell, 
            description: 'Send push notification',
            color: 'text-green-400 bg-green-500/20'
        },
    ];
    
    // Target types
    const targetTypes = [
        { id: 'all', label: 'All Users', description: 'Everyone in the system' },
        { id: 'role', label: 'By Role', description: 'Specific user roles' },
        { id: 'class', label: 'By Class', description: 'Students/Parents of specific classes' },
        { id: 'channel', label: 'Channels', description: 'Specific chat channels' },
        { id: 'dynamic', label: 'Dynamic', description: 'Based on event context' },
    ];
    
    // Message templates
    const messageTemplates = [
        { id: 'fee_reminder', label: 'Fee Reminder', preview: 'Dear Parent, This is a reminder that the fee payment...' },
        { id: 'welcome', label: 'Welcome Message', preview: 'Welcome to our school community! We are glad to have you...' },
        { id: 'after_hours', label: 'After Hours', preview: 'Thank you for your message. Our office hours are...' },
        { id: 'exam_schedule', label: 'Exam Schedule', preview: 'Dear Student/Parent, This is to inform you about the upcoming...' },
        { id: 'attendance_alert', label: 'Attendance Alert', preview: 'Dear Parent, We would like to inform you that your ward...' },
    ];
    
    // Roles list
    const roles = [
        { id: 'parent', label: 'Parents' },
        { id: 'student', label: 'Students' },
        { id: 'teacher', label: 'Teachers' },
        { id: 'staff', label: 'Staff' },
        { id: 'admin', label: 'Administrators' },
    ];
    
    // Classes list
    const classes = [
        { id: 'all', label: 'All Classes' },
        { id: 'nursery', label: 'Nursery' },
        { id: 'lkg', label: 'LKG' },
        { id: 'ukg', label: 'UKG' },
        { id: 'class1', label: 'Class 1' },
        { id: 'class2', label: 'Class 2' },
        { id: 'class3', label: 'Class 3' },
        { id: 'class4', label: 'Class 4' },
        { id: 'class5', label: 'Class 5' },
    ];
    
    // Reset form when modal opens/closes
    useEffect(() => {
        if (open) {
            if (editRule) {
                // Populate form with edit data
                setRule(editRule);
            } else {
                // Reset to defaults
                setRule({
                    name: '',
                    description: '',
                    triggerType: 'keyword',
                    triggerConfig: {
                        keywords: [],
                        eventType: '',
                        scheduleType: 'time_range',
                        startTime: '09:00',
                        endTime: '18:00',
                        daysBeforeEvent: 1,
                        eventCategory: ''
                    },
                    actionType: 'reply',
                    actionConfig: {
                        message: '',
                        template: '',
                        broadcastType: 'immediate'
                    },
                    targetType: 'all',
                    targetConfig: {
                        roles: [],
                        classes: [],
                        channels: []
                    },
                    isActive: true
                });
            }
            setStep(1);
        }
    }, [open, editRule]);
    
    // Add keyword
    const addKeyword = () => {
        if (newKeyword.trim() && !rule.triggerConfig.keywords.includes(newKeyword.trim())) {
            setRule(prev => ({
                ...prev,
                triggerConfig: {
                    ...prev.triggerConfig,
                    keywords: [...prev.triggerConfig.keywords, newKeyword.trim()]
                }
            }));
            setNewKeyword('');
        }
    };
    
    // Remove keyword
    const removeKeyword = (keyword) => {
        setRule(prev => ({
            ...prev,
            triggerConfig: {
                ...prev.triggerConfig,
                keywords: prev.triggerConfig.keywords.filter(k => k !== keyword)
            }
        }));
    };
    
    // Toggle role/class selection
    const toggleSelection = (type, id) => {
        setRule(prev => ({
            ...prev,
            targetConfig: {
                ...prev.targetConfig,
                [type]: prev.targetConfig[type].includes(id)
                    ? prev.targetConfig[type].filter(i => i !== id)
                    : [...prev.targetConfig[type], id]
            }
        }));
    };
    
    // Save rule
    const saveRule = async () => {
        if (!rule.name.trim()) {
            toast({ title: "Error", description: 'Please enter a rule name', variant: "destructive" });
            return;
        }
        
        setSaving(true);
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            toast({ title: "Success", description: `Rule "${rule.name}" has been created` });
            onRuleCreated?.(rule);
            onOpenChange(false);
            
        } catch (error) {
            console.error('Failed to save rule:', error);
            toast({ title: "Error", description: 'Failed to save rule', variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };
    
    // Validate step
    const canProceed = () => {
        switch (step) {
            case 1: return rule.name.trim().length > 0;
            case 2: 
                if (rule.triggerType === 'keyword') return rule.triggerConfig.keywords.length > 0;
                if (rule.triggerType === 'event') return rule.triggerConfig.eventType;
                return true;
            case 3: return rule.actionConfig.message || rule.actionConfig.template;
            case 4: 
                if (rule.targetType === 'role') return rule.targetConfig.roles.length > 0;
                if (rule.targetType === 'class') return rule.targetConfig.classes.length > 0;
                return true;
            default: return true;
        }
    };
    
    // Steps config
    const steps = [
        { num: 1, label: 'Basics' },
        { num: 2, label: 'Trigger' },
        { num: 3, label: 'Action' },
        { num: 4, label: 'Target' },
        { num: 5, label: 'Review' },
    ];
    
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 max-w-2xl p-0 max-h-[90vh]">
                {/* Header */}
                <DialogHeader className="p-4 pb-2 border-b border-gray-200 dark:border-gray-700/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                            <Zap className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <DialogTitle className="text-gray-900 dark:text-white">
                                {editRule ? 'Edit Automation Rule' : 'Create Automation Rule'}
                            </DialogTitle>
                            <DialogDescription>
                                Step {step} of 5: {steps.find(s => s.num === step)?.label}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>
                
                {/* Progress Steps */}
                <div className="px-4 py-3 border-b border-gray-700/50">
                    <div className="flex items-center justify-between">
                        {steps.map((s, index) => (
                            <React.Fragment key={s.num}>
                                <div 
                                    className={cn(
                                        "flex items-center gap-2 cursor-pointer",
                                        step >= s.num ? "text-orange-400" : "text-gray-500"
                                    )}
                                    onClick={() => step > s.num && setStep(s.num)}
                                >
                                    <div className={cn(
                                        "w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium",
                                        step === s.num ? "bg-orange-600 text-white" :
                                        step > s.num ? "bg-orange-600/30 text-orange-400" :
                                        "bg-gray-700 text-gray-500"
                                    )}>
                                        {step > s.num ? <Check className="w-4 h-4" /> : s.num}
                                    </div>
                                    <span className="text-xs hidden sm:inline">{s.label}</span>
                                </div>
                                {index < steps.length - 1 && (
                                    <div className={cn(
                                        "flex-1 h-px mx-2",
                                        step > s.num ? "bg-orange-600/50" : "bg-gray-700"
                                    )} />
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
                
                <ScrollArea className="flex-1 max-h-[calc(90vh-250px)]">
                    <div className="p-4 space-y-4">
                        {/* Step 1: Basics */}
                        {step === 1 && (
                            <div className="space-y-4">
                                <div>
                                    <Label className="text-gray-900 dark:text-white mb-2 block">Rule Name *</Label>
                                    <Input
                                        value={rule.name}
                                        onChange={(e) => setRule(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="e.g., Fee Payment Auto-Reply"
                                        className="bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                                    />
                                </div>
                                
                                <div>
                                    <Label className="text-gray-900 dark:text-white mb-2 block">Description</Label>
                                    <Textarea
                                        value={rule.description}
                                        onChange={(e) => setRule(prev => ({ ...prev, description: e.target.value }))}
                                        placeholder="Briefly describe what this automation does..."
                                        className="bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 min-h-[80px]"
                                    />
                                </div>
                                
                                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-100/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">Enable Rule</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Rule will start working immediately</p>
                                    </div>
                                    <Switch
                                        checked={rule.isActive}
                                        onCheckedChange={(checked) => setRule(prev => ({ ...prev, isActive: checked }))}
                                        className="data-[state=checked]:bg-orange-600"
                                    />
                                </div>
                            </div>
                        )}
                        
                        {/* Step 2: Trigger */}
                        {step === 2 && (
                            <div className="space-y-4">
                                <Label className="text-white mb-2 block">When should this rule trigger?</Label>
                                
                                <div className="grid gap-3">
                                    {triggerTypes.map((trigger) => {
                                        const Icon = trigger.icon;
                                        return (
                                            <Card 
                                                key={trigger.id}
                                                className={cn(
                                                    "bg-gray-800/50 cursor-pointer transition-all",
                                                    rule.triggerType === trigger.id 
                                                        ? "border-orange-500" 
                                                        : "border-gray-700 hover:border-gray-600"
                                                )}
                                                onClick={() => setRule(prev => ({ ...prev, triggerType: trigger.id }))}
                                            >
                                                <CardContent className="p-4 flex items-center gap-4">
                                                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", trigger.color)}>
                                                        <Icon className="w-5 h-5" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="font-medium text-white">{trigger.label}</p>
                                                        <p className="text-xs text-gray-400">{trigger.description}</p>
                                                    </div>
                                                    {rule.triggerType === trigger.id && (
                                                        <Check className="w-5 h-5 text-orange-400" />
                                                    )}
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                                
                                {/* Trigger Config */}
                                <div className="mt-4 p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                                    {rule.triggerType === 'keyword' && (
                                        <div className="space-y-3">
                                            <Label className="text-white text-sm">Keywords to match</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    value={newKeyword}
                                                    onChange={(e) => setNewKeyword(e.target.value)}
                                                    placeholder="Enter keyword..."
                                                    className="bg-gray-700 border-gray-600"
                                                    onKeyDown={(e) => e.key === 'Enter' && addKeyword()}
                                                />
                                                <Button onClick={addKeyword} className="bg-orange-600 hover:bg-orange-700">
                                                    <Plus className="w-4 h-4" />
                                                </Button>
                                            </div>
                                            {rule.triggerConfig.keywords.length > 0 && (
                                                <div className="flex flex-wrap gap-2">
                                                    {rule.triggerConfig.keywords.map((kw) => (
                                                        <Badge 
                                                            key={kw} 
                                                            variant="outline" 
                                                            className="text-orange-400 border-orange-400/50"
                                                        >
                                                            {kw}
                                                            <X 
                                                                className="w-3 h-3 ml-1 cursor-pointer" 
                                                                onClick={() => removeKeyword(kw)}
                                                            />
                                                        </Badge>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    
                                    {rule.triggerType === 'event' && (
                                        <div className="space-y-3">
                                            <Label className="text-white text-sm">Select Event Type</Label>
                                            <Select
                                                value={rule.triggerConfig.eventType}
                                                onValueChange={(value) => setRule(prev => ({
                                                    ...prev,
                                                    triggerConfig: { ...prev.triggerConfig, eventType: value }
                                                }))}
                                            >
                                                <SelectTrigger className="bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                                                    <SelectValue placeholder="Choose an event..." />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                                                    {eventTypes.map((event) => (
                                                        <SelectItem key={event.id} value={event.id}>
                                                            {event.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                    
                                    {rule.triggerType === 'schedule' && (
                                        <div className="space-y-4">
                                            <div>
                                                <Label className="text-gray-900 dark:text-white text-sm mb-2 block">Schedule Type</Label>
                                                <Select
                                                    value={rule.triggerConfig.scheduleType}
                                                    onValueChange={(value) => setRule(prev => ({
                                                        ...prev,
                                                        triggerConfig: { ...prev.triggerConfig, scheduleType: value }
                                                    }))}
                                                >
                                                    <SelectTrigger className="bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                                                        <SelectItem value="time_range">Time Range (e.g., After Hours)</SelectItem>
                                                        <SelectItem value="before_event">Days Before Event</SelectItem>
                                                        <SelectItem value="recurring">Recurring Schedule</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            
                                            {rule.triggerConfig.scheduleType === 'time_range' && (
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <Label className="text-xs text-gray-400 mb-1 block">Active From</Label>
                                                        <Input
                                                            type="time"
                                                            value={rule.triggerConfig.startTime}
                                                            onChange={(e) => setRule(prev => ({
                                                                ...prev,
                                                                triggerConfig: { ...prev.triggerConfig, startTime: e.target.value }
                                                            }))}
                                                            className="bg-gray-700 border-gray-600"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label className="text-xs text-gray-400 mb-1 block">Active Until</Label>
                                                        <Input
                                                            type="time"
                                                            value={rule.triggerConfig.endTime}
                                                            onChange={(e) => setRule(prev => ({
                                                                ...prev,
                                                                triggerConfig: { ...prev.triggerConfig, endTime: e.target.value }
                                                            }))}
                                                            className="bg-gray-700 border-gray-600"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        
                        {/* Step 3: Action */}
                        {step === 3 && (
                            <div className="space-y-4">
                                <Label className="text-white mb-2 block">What action should be taken?</Label>
                                
                                <div className="grid gap-3">
                                    {actionTypes.map((action) => {
                                        const Icon = action.icon;
                                        return (
                                            <Card 
                                                key={action.id}
                                                className={cn(
                                                    "bg-gray-800/50 cursor-pointer transition-all",
                                                    rule.actionType === action.id 
                                                        ? "border-orange-500" 
                                                        : "border-gray-700 hover:border-gray-600"
                                                )}
                                                onClick={() => setRule(prev => ({ ...prev, actionType: action.id }))}
                                            >
                                                <CardContent className="p-4 flex items-center gap-4">
                                                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", action.color)}>
                                                        <Icon className="w-5 h-5" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="font-medium text-white">{action.label}</p>
                                                        <p className="text-xs text-gray-400">{action.description}</p>
                                                    </div>
                                                    {rule.actionType === action.id && (
                                                        <Check className="w-5 h-5 text-orange-400" />
                                                    )}
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                                
                                {/* Action Config */}
                                <div className="mt-4 p-4 rounded-lg bg-gray-100/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 space-y-4">
                                    <div>
                                        <Label className="text-gray-900 dark:text-white text-sm mb-2 block">Use Template</Label>
                                        <Select
                                            value={rule.actionConfig.template}
                                            onValueChange={(value) => setRule(prev => ({
                                                ...prev,
                                                actionConfig: { ...prev.actionConfig, template: value }
                                            }))}
                                        >
                                            <SelectTrigger className="bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                                                <SelectValue placeholder="Select a template or write custom..." />
                                            </SelectTrigger>
                                            <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                                                <SelectItem value="">Custom Message</SelectItem>
                                                {messageTemplates.map((t) => (
                                                    <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    
                                    {!rule.actionConfig.template && (
                                        <div>
                                            <Label className="text-gray-900 dark:text-white text-sm mb-2 block">Custom Message</Label>
                                            <Textarea
                                                value={rule.actionConfig.message}
                                                onChange={(e) => setRule(prev => ({
                                                    ...prev,
                                                    actionConfig: { ...prev.actionConfig, message: e.target.value }
                                                }))}
                                                placeholder="Enter the message to send..."
                                                className="bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 min-h-[100px]"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">
                                                Use {'{name}'}, {'{class}'}, {'{amount}'} for dynamic content
                                            </p>
                                        </div>
                                    )}
                                    
                                    {rule.actionConfig.template && (
                                        <div className="p-3 rounded bg-gray-700/50 border border-gray-600">
                                            <p className="text-xs text-gray-400 mb-1">Template Preview:</p>
                                            <p className="text-sm text-gray-300">
                                                {messageTemplates.find(t => t.id === rule.actionConfig.template)?.preview}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        
                        {/* Step 4: Target */}
                        {step === 4 && (
                            <div className="space-y-4">
                                <Label className="text-white mb-2 block">Who should receive this?</Label>
                                
                                <div className="grid gap-2">
                                    {targetTypes.map((target) => (
                                        <Card 
                                            key={target.id}
                                            className={cn(
                                                "bg-gray-800/50 cursor-pointer transition-all",
                                                rule.targetType === target.id 
                                                    ? "border-orange-500" 
                                                    : "border-gray-700 hover:border-gray-600"
                                            )}
                                            onClick={() => setRule(prev => ({ ...prev, targetType: target.id }))}
                                        >
                                            <CardContent className="p-3 flex items-center gap-3">
                                                <div className="flex-1">
                                                    <p className="font-medium text-white text-sm">{target.label}</p>
                                                    <p className="text-xs text-gray-400">{target.description}</p>
                                                </div>
                                                {rule.targetType === target.id && (
                                                    <Check className="w-5 h-5 text-orange-400" />
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                                
                                {/* Target Config */}
                                {rule.targetType === 'role' && (
                                    <div className="mt-4 p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                                        <Label className="text-white text-sm mb-3 block">Select Roles</Label>
                                        <div className="flex flex-wrap gap-2">
                                            {roles.map((role) => (
                                                <Badge
                                                    key={role.id}
                                                    variant="outline"
                                                    className={cn(
                                                        "cursor-pointer transition-all",
                                                        rule.targetConfig.roles.includes(role.id)
                                                            ? "bg-orange-600 text-white border-orange-600"
                                                            : "border-gray-600 hover:border-gray-500"
                                                    )}
                                                    onClick={() => toggleSelection('roles', role.id)}
                                                >
                                                    {role.label}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                {rule.targetType === 'class' && (
                                    <div className="mt-4 p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                                        <Label className="text-white text-sm mb-3 block">Select Classes</Label>
                                        <div className="flex flex-wrap gap-2">
                                            {classes.map((cls) => (
                                                <Badge
                                                    key={cls.id}
                                                    variant="outline"
                                                    className={cn(
                                                        "cursor-pointer transition-all",
                                                        rule.targetConfig.classes.includes(cls.id)
                                                            ? "bg-orange-600 text-white border-orange-600"
                                                            : "border-gray-600 hover:border-gray-500"
                                                    )}
                                                    onClick={() => toggleSelection('classes', cls.id)}
                                                >
                                                    {cls.label}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {/* Step 5: Review */}
                        {step === 5 && (
                            <div className="space-y-4">
                                <Card className="bg-gray-100/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-white text-lg flex items-center gap-2">
                                            <Zap className="w-5 h-5 text-orange-400" />
                                            {rule.name}
                                        </CardTitle>
                                        <CardDescription>{rule.description || 'No description'}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {/* Trigger Summary */}
                                        <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-700/30">
                                            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                                {React.createElement(getTriggerIcon(rule.triggerType), { className: "w-4 h-4 text-blue-400" })}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-xs text-gray-400">Trigger</p>
                                                <p className="text-sm text-white">
                                                    {rule.triggerType === 'keyword' && `Keywords: ${rule.triggerConfig.keywords.join(', ')}`}
                                                    {rule.triggerType === 'event' && `Event: ${eventTypes.find(e => e.id === rule.triggerConfig.eventType)?.label}`}
                                                    {rule.triggerType === 'schedule' && `Schedule: ${rule.triggerConfig.startTime} - ${rule.triggerConfig.endTime}`}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <ArrowRight className="w-4 h-4 text-gray-600 mx-auto" />
                                        
                                        {/* Action Summary */}
                                        <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-700/30">
                                            <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                                {React.createElement(actionTypes.find(a => a.id === rule.actionType)?.icon || Zap, { className: "w-4 h-4 text-purple-400" })}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-xs text-gray-400">Action</p>
                                                <p className="text-sm text-white">
                                                    {actionTypes.find(a => a.id === rule.actionType)?.label}
                                                    {rule.actionConfig.template && ` (${messageTemplates.find(t => t.id === rule.actionConfig.template)?.label})`}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <ArrowRight className="w-4 h-4 text-gray-600 mx-auto" />
                                        
                                        {/* Target Summary */}
                                        <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-700/30">
                                            <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                                                <Users className="w-4 h-4 text-green-400" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-xs text-gray-400">Target</p>
                                                <p className="text-sm text-white">
                                                    {targetTypes.find(t => t.id === rule.targetType)?.label}
                                                    {rule.targetType === 'role' && rule.targetConfig.roles.length > 0 && 
                                                        ` (${rule.targetConfig.roles.map(r => roles.find(rl => rl.id === r)?.label).join(', ')})`}
                                                    {rule.targetType === 'class' && rule.targetConfig.classes.length > 0 && 
                                                        ` (${rule.targetConfig.classes.map(c => classes.find(cl => cl.id === c)?.label).join(', ')})`}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        {/* Status */}
                                        <div className="flex items-center justify-between pt-2 border-t border-gray-700">
                                            <span className="text-sm text-gray-400">Status</span>
                                            <Badge 
                                                variant="outline" 
                                                className={rule.isActive ? "text-green-400 border-green-400/50" : "text-gray-500 border-gray-600"}
                                            >
                                                {rule.isActive ? 'Will be Active' : 'Will be Paused'}
                                            </Badge>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}
                    </div>
                </ScrollArea>
                
                {/* Footer */}
                <div className="p-4 border-t border-gray-700/50 flex justify-between">
                    <Button 
                        variant="outline" 
                        onClick={() => step > 1 ? setStep(step - 1) : onOpenChange(false)}
                        className="border-gray-700"
                    >
                        <ChevronLeft className="w-4 h-4 mr-2" />
                        {step > 1 ? 'Back' : 'Cancel'}
                    </Button>
                    
                    {step < 5 ? (
                        <Button 
                            onClick={() => setStep(step + 1)}
                            disabled={!canProceed()}
                            className="bg-orange-600 hover:bg-orange-700"
                        >
                            Next
                            <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                    ) : (
                        <Button 
                            onClick={saveRule}
                            disabled={saving}
                            className="bg-orange-600 hover:bg-orange-700"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Create Rule
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

// Helper function for trigger icon
const getTriggerIcon = (type) => {
    switch (type) {
        case 'keyword': return MessageSquare;
        case 'event': return Bell;
        case 'schedule': return Clock;
        default: return Zap;
    }
};

export default CreateRuleModal;
