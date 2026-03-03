import React, { useState, useEffect } from 'react';
import { 
    Megaphone, Send, Clock, Save, ArrowLeft, Users, FileText,
    Image, Paperclip, Smile, Calendar, X, Check, ChevronDown,
    GraduationCap, Building2, User, Loader2, AlertCircle,
    Eye, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import api from "@/services/api";
import { formatDate } from "@/utils/dateUtils";

/**
 * BroadcastComposer - Create/Edit broadcast messages
 * Full composer with recipient selection, templates, scheduling
 */
const BroadcastComposer = ({ 
    broadcast, // For editing existing broadcast
    onBack,
    onSave,
    className 
}) => {
    const [title, setTitle] = useState(broadcast?.title || '');
    const [message, setMessage] = useState(broadcast?.message || '');
    const [broadcastType, setBroadcastType] = useState(broadcast?.type || 'general');
    const [selectedRecipients, setSelectedRecipients] = useState([]);
    const [recipientGroups, setRecipientGroups] = useState([]);
    const [scheduleDate, setScheduleDate] = useState(null);
    const [scheduleTime, setScheduleTime] = useState('09:00');
    const [isScheduled, setIsScheduled] = useState(false);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [sending, setSending] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    
    // Broadcast types
    const broadcastTypes = [
        { id: 'general', label: 'General', icon: Megaphone },
        { id: 'fee_reminder', label: 'Fee Reminder', icon: FileText },
        { id: 'announcement', label: 'Announcement', icon: Megaphone },
        { id: 'exam', label: 'Exam Notice', icon: GraduationCap },
        { id: 'event', label: 'Event', icon: Calendar },
        { id: 'holiday', label: 'Holiday', icon: Calendar },
    ];
    
    // Fetch recipient groups
    useEffect(() => {
        const fetchRecipientGroups = async () => {
            setLoading(true);
            try {
                const response = await api.get('/jashsync/broadcast/recipient-groups');
                setRecipientGroups(response.data || []);
            } catch (error) {
                // Mock data
                setRecipientGroups([
                    { id: 'all_parents', name: 'All Parents', count: 850, icon: 'users', type: 'parents' },
                    { id: 'all_teachers', name: 'All Teachers', count: 65, icon: 'user', type: 'teachers' },
                    { id: 'all_staff', name: 'All Staff', count: 45, icon: 'building', type: 'staff' },
                    { id: 'class_10', name: 'Class 10 Parents', count: 120, icon: 'graduation', type: 'class' },
                    { id: 'class_9', name: 'Class 9 Parents', count: 115, icon: 'graduation', type: 'class' },
                    { id: 'class_8', name: 'Class 8 Parents', count: 110, icon: 'graduation', type: 'class' },
                    { id: 'fee_defaulters', name: 'Fee Defaulters', count: 45, icon: 'alert', type: 'special' },
                    { id: 'transport_users', name: 'Transport Users', count: 320, icon: 'bus', type: 'special' },
                    { id: 'hostel_students', name: 'Hostel Students', count: 85, icon: 'home', type: 'special' },
                ]);
            } finally {
                setLoading(false);
            }
        };
        
        const fetchTemplates = async () => {
            try {
                const response = await api.get('/jashsync/broadcast/templates');
                setTemplates(response.data || []);
            } catch (error) {
                // Mock templates
                setTemplates([
                    { id: '1', name: 'Fee Reminder', type: 'fee_reminder', content: 'Dear Parent, This is a reminder that the fee for {month} is due. Kindly pay by {due_date} to avoid late fee. Amount: ₹{amount}. Thank you.' },
                    { id: '2', name: 'PTM Notice', type: 'announcement', content: 'Dear Parent, Parent Teacher Meeting is scheduled for {date} at {time}. Your presence is requested to discuss {student_name}\'s progress.' },
                    { id: '3', name: 'Holiday Notice', type: 'holiday', content: 'Dear All, School will remain closed on {date} on account of {occasion}. Classes will resume on {resume_date}.' },
                    { id: '4', name: 'Exam Schedule', type: 'exam', content: 'Dear Students, {exam_name} examinations will commence from {start_date}. Please collect your hall tickets from the office.' },
                ]);
            }
        };
        
        fetchRecipientGroups();
        fetchTemplates();
    }, []);
    
    // Toggle recipient group
    const toggleRecipientGroup = (groupId) => {
        setSelectedRecipients(prev => {
            if (prev.includes(groupId)) {
                return prev.filter(id => id !== groupId);
            }
            return [...prev, groupId];
        });
    };
    
    // Calculate total recipients
    const totalRecipients = selectedRecipients.reduce((acc, groupId) => {
        const group = recipientGroups.find(g => g.id === groupId);
        return acc + (group?.count || 0);
    }, 0);
    
    // Apply template
    const applyTemplate = (template) => {
        setSelectedTemplate(template);
        setMessage(template.content);
        setBroadcastType(template.type);
    };
    
    // Handle save as draft
    const handleSaveDraft = async () => {
        setSaving(true);
        try {
            await api.post('/jashsync/broadcasts/draft', {
                title,
                message,
                type: broadcastType,
                recipient_groups: selectedRecipients
            });
            onSave?.({ status: 'draft' });
        } catch (error) {
            console.error('Failed to save draft:', error);
        } finally {
            setSaving(false);
        }
    };
    
    // Handle send/schedule
    const handleSend = async () => {
        if (!title.trim() || !message.trim() || selectedRecipients.length === 0) return;
        
        setSending(true);
        try {
            const payload = {
                title,
                message,
                type: broadcastType,
                recipient_groups: selectedRecipients,
                scheduled_for: isScheduled && scheduleDate 
                    ? new Date(`${scheduleDate.toISOString().split('T')[0]}T${scheduleTime}`).toISOString()
                    : null
            };
            
            await api.post('/jashsync/broadcasts', payload);
            onSave?.({ status: isScheduled ? 'scheduled' : 'sent' });
        } catch (error) {
            console.error('Failed to send broadcast:', error);
        } finally {
            setSending(false);
        }
    };
    
    // Get icon for group
    const getGroupIcon = (iconType) => {
        const icons = {
            users: Users,
            user: User,
            building: Building2,
            graduation: GraduationCap,
            alert: AlertCircle,
            bus: Megaphone,
            home: Building2
        };
        return icons[iconType] || Users;
    };
    
    return (
        <div className={cn("flex flex-col h-full bg-white dark:bg-gray-900", className)}>
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={onBack}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {broadcast ? 'Edit Broadcast' : 'New Broadcast'}
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {totalRecipients > 0 
                                ? `${totalRecipients.toLocaleString()} recipients selected`
                                : 'Select recipients to continue'
                            }
                        </p>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    <Button 
                        variant="outline" 
                        onClick={handleSaveDraft}
                        disabled={saving || !title.trim()}
                    >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                        Save Draft
                    </Button>
                    <Button 
                        variant="outline"
                        onClick={() => setShowPreview(true)}
                        disabled={!message.trim()}
                    >
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                    </Button>
                </div>
            </div>
            
            <div className="flex-1 flex overflow-hidden">
                {/* Left - Composer */}
                <div className="flex-1 p-4 overflow-auto">
                    <div className="max-w-2xl space-y-6">
                        {/* Title */}
                        <div className="space-y-2">
                            <Label htmlFor="title" className="text-gray-700 dark:text-gray-300">
                                Broadcast Title <span className="text-red-400">*</span>
                            </Label>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g., Fee Reminder - March 2026"
                                className="bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                            />
                        </div>
                        
                        {/* Type */}
                        <div className="space-y-2">
                            <Label className="text-gray-700 dark:text-gray-300">Broadcast Type</Label>
                            <Select value={broadcastType} onValueChange={setBroadcastType}>
                                <SelectTrigger className="bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                                    {broadcastTypes.map(type => (
                                        <SelectItem key={type.id} value={type.id}>
                                            <div className="flex items-center gap-2">
                                                <type.icon className="h-4 w-4" />
                                                {type.label}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        
                        {/* Templates */}
                        {templates.length > 0 && (
                            <div className="space-y-2">
                                <Label className="text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                    <Sparkles className="h-4 w-4 text-purple-400" />
                                    Quick Templates
                                </Label>
                                <div className="flex flex-wrap gap-2">
                                    {templates.map(template => (
                                        <Badge
                                            key={template.id}
                                            variant={selectedTemplate?.id === template.id ? 'default' : 'outline'}
                                            className="cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700"
                                            onClick={() => applyTemplate(template)}
                                        >
                                            {template.name}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {/* Message */}
                        <div className="space-y-2">
                            <Label htmlFor="message" className="text-gray-700 dark:text-gray-300">
                                Message <span className="text-red-400">*</span>
                            </Label>
                            <Textarea
                                id="message"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Type your message here..."
                                className="bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 min-h-[200px] resize-none"
                                maxLength={1000}
                            />
                            <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-500">
                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="sm" className="h-7 px-2">
                                        <Smile className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm" className="h-7 px-2">
                                        <Paperclip className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm" className="h-7 px-2">
                                        <Image className="h-4 w-4" />
                                    </Button>
                                </div>
                                <span>{message.length}/1000</span>
                            </div>
                        </div>
                        
                        {/* Schedule Option */}
                        <div className="space-y-3 p-4 bg-gray-100/50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700/50">
                            <div className="flex items-center justify-between">
                                <Label className="text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-blue-400" />
                                    Schedule for later
                                </Label>
                                <Checkbox
                                    checked={isScheduled}
                                    onCheckedChange={setIsScheduled}
                                />
                            </div>
                            
                            {isScheduled && (
                                <div className="flex items-center gap-3 mt-3">
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="w-40 justify-start">
                                                <Calendar className="h-4 w-4 mr-2" />
                                                {scheduleDate ? formatDate(scheduleDate) : 'Pick date'}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                                            <CalendarComponent
                                                mode="single"
                                                selected={scheduleDate}
                                                onSelect={setScheduleDate}
                                                disabled={(date) => date < new Date()}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    
                                    <Input
                                        type="time"
                                        value={scheduleTime}
                                        onChange={(e) => setScheduleTime(e.target.value)}
                                        className="w-32 bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                
                {/* Right - Recipients Panel */}
                <div className="w-80 border-l border-gray-200 dark:border-gray-700/50 flex flex-col">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700/50">
                        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <Users className="h-4 w-4 text-purple-400" />
                            Recipients
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Select groups to send broadcast
                        </p>
                    </div>
                    
                    <ScrollArea className="flex-1">
                        {loading ? (
                            <div className="flex items-center justify-center h-32">
                                <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
                            </div>
                        ) : (
                            <div className="p-2 space-y-1">
                                {recipientGroups.map(group => {
                                    const isSelected = selectedRecipients.includes(group.id);
                                    const IconComponent = getGroupIcon(group.icon);
                                    
                                    return (
                                        <div
                                            key={group.id}
                                            onClick={() => toggleRecipientGroup(group.id)}
                                            className={cn(
                                                "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all",
                                                "hover:bg-gray-100 dark:hover:bg-gray-800",
                                                isSelected && "bg-purple-600/20 border border-purple-500/30"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-8 h-8 rounded-lg flex items-center justify-center",
                                                isSelected ? "bg-purple-500/30" : "bg-gray-200 dark:bg-gray-700/50"
                                            )}>
                                                <IconComponent className="h-4 w-4" />
                                            </div>
                                            
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                    {group.name}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {group.count} people
                                                </p>
                                            </div>
                                            
                                            <div className={cn(
                                                "w-5 h-5 rounded border-2 flex items-center justify-center",
                                                isSelected 
                                                    ? "border-purple-500 bg-purple-500" 
                                                    : "border-gray-400 dark:border-gray-600"
                                            )}>
                                                {isSelected && <Check className="h-3 w-3 text-white" />}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </ScrollArea>
                    
                    {/* Selected Summary */}
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700/50 bg-gray-100/50 dark:bg-gray-800/50">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Total Recipients</span>
                            <Badge variant="secondary">{totalRecipients.toLocaleString()}</Badge>
                        </div>
                        
                        <Button 
                            onClick={handleSend}
                            disabled={sending || !title.trim() || !message.trim() || selectedRecipients.length === 0}
                            className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
                        >
                            {sending ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    {isScheduled ? 'Scheduling...' : 'Sending...'}
                                </>
                            ) : (
                                <>
                                    {isScheduled ? <Clock className="h-4 w-4 mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                                    {isScheduled ? 'Schedule Broadcast' : 'Send Now'}
                                </>
                            )}
                        </Button>
                        
                        {!isScheduled && totalRecipients > 0 && (
                            <p className="text-xs text-center text-gray-500 mt-2">
                                Estimated cost: ₹{(totalRecipients * 0.10).toFixed(2)}
                            </p>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Preview Modal */}
            {showPreview && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 w-full max-w-md overflow-hidden">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                            <h3 className="font-semibold text-gray-900 dark:text-white">Message Preview</h3>
                            <Button variant="ghost" size="icon" onClick={() => setShowPreview(false)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        
                        <div className="p-4">
                            {/* Phone mockup */}
                            <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-4 max-w-xs mx-auto">
                                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback className="bg-purple-600">JS</AvatarFallback>
                                    </Avatar>
                                    <span className="font-medium text-gray-900 dark:text-white text-sm">JashSync</span>
                                </div>
                                
                                <div className="bg-purple-600/20 rounded-lg p-3 mb-2">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">{title || 'Broadcast Title'}</p>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                        {message || 'Your message will appear here...'}
                                    </p>
                                </div>
                                
                                <p className="text-[10px] text-gray-500 text-right">
                                    {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                        
                        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setShowPreview(false)}>
                                Edit Message
                            </Button>
                            <Button 
                                onClick={() => {
                                    setShowPreview(false);
                                    handleSend();
                                }}
                                disabled={selectedRecipients.length === 0}
                                className="bg-gradient-to-r from-red-600 to-orange-600"
                            >
                                <Send className="h-4 w-4 mr-2" />
                                Send
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BroadcastComposer;
