import React, { useState, useEffect } from 'react';
import { 
    Clock, Calendar, Send, Edit2, Trash2, Pause, Play, Plus,
    RotateCcw, CalendarDays, Users, MessageSquare, Filter,
    ChevronLeft, ChevronRight, MoreVertical, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useToast } from '@/components/ui/use-toast';
import { formatDate, formatTime, formatDateTime } from '@/utils/dateUtils';

/**
 * ScheduledMessages - View and manage scheduled/recurring messages
 * Calendar view + list view of all scheduled sends
 */
const ScheduledMessages = ({ onBack, onScheduleNew }) => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('list'); // 'list', 'calendar'
    const [filter, setFilter] = useState('all'); // 'all', 'scheduled', 'recurring', 'paused'
    const [currentMonth, setCurrentMonth] = useState(new Date());
    
    // Mock scheduled messages
    const [scheduledMessages, setScheduledMessages] = useState([]);
    
    useEffect(() => {
        loadScheduledMessages();
    }, []);
    
    const loadScheduledMessages = async () => {
        setLoading(true);
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Mock data
            const today = new Date();
            const mockData = [
                {
                    id: 1,
                    title: 'Weekly Fee Reminder',
                    message: 'Dear Parents, This is a reminder about pending fee payments...',
                    type: 'recurring',
                    status: 'active',
                    schedule: {
                        frequency: 'weekly',
                        dayOfWeek: 'monday',
                        time: '09:00',
                        nextRun: getNextMonday()
                    },
                    target: { type: 'role', roles: ['parent'] },
                    sentCount: 12,
                    createdAt: '2026-01-15',
                },
                {
                    id: 2,
                    title: 'Exam Schedule Announcement',
                    message: 'Dear Students/Parents, The final examination schedule...',
                    type: 'scheduled',
                    status: 'pending',
                    schedule: {
                        scheduledAt: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
                        time: '10:00'
                    },
                    target: { type: 'all' },
                    sentCount: 0,
                    createdAt: '2026-02-20',
                },
                {
                    id: 3,
                    title: 'Monthly Newsletter',
                    message: 'Welcome to our monthly school newsletter...',
                    type: 'recurring',
                    status: 'active',
                    schedule: {
                        frequency: 'monthly',
                        dayOfMonth: 1,
                        time: '08:00',
                        nextRun: getFirstOfNextMonth()
                    },
                    target: { type: 'role', roles: ['parent', 'student'] },
                    sentCount: 3,
                    createdAt: '2025-12-01',
                },
                {
                    id: 4,
                    title: 'Parent-Teacher Meeting',
                    message: 'You are invited to the parent-teacher meeting...',
                    type: 'scheduled',
                    status: 'pending',
                    schedule: {
                        scheduledAt: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
                        time: '14:00'
                    },
                    target: { type: 'class', classes: ['Class 5', 'Class 6'] },
                    sentCount: 0,
                    createdAt: '2026-02-18',
                },
                {
                    id: 5,
                    title: 'Daily Attendance Summary',
                    message: 'Today\'s attendance summary for your class...',
                    type: 'recurring',
                    status: 'paused',
                    schedule: {
                        frequency: 'daily',
                        time: '16:00',
                        nextRun: null
                    },
                    target: { type: 'role', roles: ['teacher'] },
                    sentCount: 45,
                    createdAt: '2025-11-01',
                },
                {
                    id: 6,
                    title: 'Holiday Notification',
                    message: 'The school will remain closed on...',
                    type: 'scheduled',
                    status: 'sent',
                    schedule: {
                        scheduledAt: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                        time: '08:00',
                        sentAt: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString()
                    },
                    target: { type: 'all' },
                    sentCount: 1,
                    createdAt: '2026-02-15',
                }
            ];
            
            setScheduledMessages(mockData);
        } catch (error) {
            console.error('Failed to load scheduled messages:', error);
            toast({ title: "Error", description: 'Failed to load scheduled messages', variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };
    
    // Filter messages
    const filteredMessages = scheduledMessages.filter(msg => {
        if (filter === 'all') return true;
        if (filter === 'scheduled') return msg.type === 'scheduled' && msg.status !== 'sent';
        if (filter === 'recurring') return msg.type === 'recurring';
        if (filter === 'paused') return msg.status === 'paused';
        return true;
    });
    
    // Toggle pause/resume
    const togglePause = (id) => {
        setScheduledMessages(prev => prev.map(msg => {
            if (msg.id === id) {
                const newStatus = msg.status === 'paused' ? 'active' : 'paused';
                toast({ 
                    title: "Updated", 
                    description: `Message ${newStatus === 'paused' ? 'paused' : 'resumed'}` 
                });
                return { ...msg, status: newStatus };
            }
            return msg;
        }));
    };
    
    // Delete message
    const deleteMessage = (id) => {
        setScheduledMessages(prev => prev.filter(msg => msg.id !== id));
        toast({ title: "Deleted", description: 'Scheduled message deleted' });
    };
    
    // Send now
    const sendNow = (msg) => {
        toast({ title: "Sending", description: `"${msg.title}" is being sent...` });
        setScheduledMessages(prev => prev.map(m => 
            m.id === msg.id ? { ...m, status: 'sent', sentCount: m.sentCount + 1 } : m
        ));
    };
    
    // Get status badge
    const getStatusBadge = (msg) => {
        switch (msg.status) {
            case 'active':
                return <Badge variant="outline" className="text-green-400 border-green-400/50">Active</Badge>;
            case 'pending':
                return <Badge variant="outline" className="text-blue-400 border-blue-400/50">Pending</Badge>;
            case 'paused':
                return <Badge variant="outline" className="text-yellow-400 border-yellow-400/50">Paused</Badge>;
            case 'sent':
                return <Badge variant="outline" className="text-gray-400 border-gray-600">Sent</Badge>;
            default:
                return null;
        }
    };
    
    // Get type badge
    const getTypeBadge = (type) => {
        if (type === 'recurring') {
            return <Badge className="bg-purple-500/20 text-purple-400"><RotateCcw className="w-3 h-3 mr-1" /> Recurring</Badge>;
        }
        return <Badge className="bg-blue-500/20 text-blue-400"><Clock className="w-3 h-3 mr-1" /> One-time</Badge>;
    };
    
    // Calendar helpers
    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const days = [];
        
        // Add padding for days before first of month
        for (let i = 0; i < firstDay.getDay(); i++) {
            days.push(null);
        }
        
        // Add all days of month
        for (let i = 1; i <= lastDay.getDate(); i++) {
            days.push(new Date(year, month, i));
        }
        
        return days;
    };
    
    // Get messages for a specific date
    const getMessagesForDate = (date) => {
        if (!date) return [];
        const dateStr = date.toISOString().split('T')[0];
        return scheduledMessages.filter(msg => {
            if (msg.type === 'scheduled' && msg.schedule.scheduledAt) {
                return msg.schedule.scheduledAt.split('T')[0] === dateStr;
            }
            return false;
        });
    };
    
    // Navigate month
    const navigateMonth = (direction) => {
        setCurrentMonth(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(newDate.getMonth() + direction);
            return newDate;
        });
    };
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="flex items-center gap-3 text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Loading scheduled messages...</span>
                </div>
            </div>
        );
    }
    
    return (
        <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700/50">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={onBack}
                            className="text-gray-400"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Scheduled Messages</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{filteredMessages.length} scheduled</p>
                        </div>
                    </div>
                    
                    <Button onClick={onScheduleNew} className="bg-orange-600 hover:bg-orange-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Schedule New
                    </Button>
                </div>
                
                {/* Controls */}
                <div className="flex items-center justify-between gap-4">
                    <Tabs value={view} onValueChange={setView}>
                        <TabsList className="bg-gray-800">
                            <TabsTrigger value="list" className="data-[state=active]:bg-orange-600">
                                <MessageSquare className="w-4 h-4 mr-2" />
                                List
                            </TabsTrigger>
                            <TabsTrigger value="calendar" className="data-[state=active]:bg-orange-600">
                                <Calendar className="w-4 h-4 mr-2" />
                                Calendar
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                    
                    <Select value={filter} onValueChange={setFilter}>
                        <SelectTrigger className="w-[150px] bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                            <Filter className="w-4 h-4 mr-2 text-gray-400" />
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                            <SelectItem value="all">All Messages</SelectItem>
                            <SelectItem value="scheduled">One-time</SelectItem>
                            <SelectItem value="recurring">Recurring</SelectItem>
                            <SelectItem value="paused">Paused</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            
            {/* Content */}
            <ScrollArea className="flex-1">
                {view === 'list' ? (
                    <div className="p-4 space-y-3">
                        {filteredMessages.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p>No scheduled messages found</p>
                            </div>
                        ) : (
                            filteredMessages.map((msg) => (
                                <Card key={msg.id} className="bg-gray-100/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h3 className="font-medium text-gray-900 dark:text-white">{msg.title}</h3>
                                                    {getTypeBadge(msg.type)}
                                                    {getStatusBadge(msg)}
                                                </div>
                                                
                                                <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                                                    {msg.message}
                                                </p>
                                                
                                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                                    {msg.type === 'recurring' ? (
                                                        <>
                                                            <span className="flex items-center gap-1">
                                                                <RotateCcw className="w-3 h-3" />
                                                                {msg.schedule.frequency.charAt(0).toUpperCase() + msg.schedule.frequency.slice(1)} at {msg.schedule.time}
                                                            </span>
                                                            {msg.schedule.nextRun && (
                                                                <span className="flex items-center gap-1">
                                                                    <Calendar className="w-3 h-3" />
                                                                    Next: {formatDate(msg.schedule.nextRun)}
                                                                </span>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            {msg.status === 'sent' 
                                                                ? `Sent on ${formatDateTime(msg.schedule.sentAt)}`
                                                                : `Scheduled for ${formatDateTime(msg.schedule.scheduledAt)}`
                                                            }
                                                        </span>
                                                    )}
                                                    
                                                    <span className="flex items-center gap-1">
                                                        <Users className="w-3 h-3" />
                                                        {msg.target.type === 'all' ? 'All Users' : 
                                                         msg.target.type === 'role' ? msg.target.roles?.join(', ') :
                                                         msg.target.type === 'class' ? msg.target.classes?.join(', ') : 'Custom'}
                                                    </span>
                                                    
                                                    <span className="flex items-center gap-1">
                                                        <Send className="w-3 h-3" />
                                                        Sent {msg.sentCount} times
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="text-gray-400">
                                                        <MoreVertical className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                                                    {msg.status !== 'sent' && (
                                                        <>
                                                            <DropdownMenuItem 
                                                                className="text-gray-300"
                                                                onClick={() => sendNow(msg)}
                                                            >
                                                                <Send className="w-4 h-4 mr-2" />
                                                                Send Now
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem className="text-gray-300">
                                                                <Edit2 className="w-4 h-4 mr-2" />
                                                                Edit
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem 
                                                                className="text-gray-300"
                                                                onClick={() => togglePause(msg.id)}
                                                            >
                                                                {msg.status === 'paused' ? (
                                                                    <>
                                                                        <Play className="w-4 h-4 mr-2" />
                                                                        Resume
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Pause className="w-4 h-4 mr-2" />
                                                                        Pause
                                                                    </>
                                                                )}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator className="bg-gray-700" />
                                                        </>
                                                    )}
                                                    <DropdownMenuItem 
                                                        className="text-red-400"
                                                        onClick={() => deleteMessage(msg.id)}
                                                    >
                                                        <Trash2 className="w-4 h-4 mr-2" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                ) : (
                    /* Calendar View */
                    <div className="p-4">
                        {/* Calendar Header */}
                        <div className="flex items-center justify-between mb-4">
                            <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => navigateMonth(-1)}
                                className="text-gray-400"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </Button>
                            <h3 className="text-lg font-medium text-white">
                                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                            </h3>
                            <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => navigateMonth(1)}
                                className="text-gray-400"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </Button>
                        </div>
                        
                        {/* Day Names */}
                        <div className="grid grid-cols-7 gap-1 mb-2">
                            {dayNames.map((day) => (
                                <div key={day} className="text-center text-xs text-gray-500 py-2">
                                    {day}
                                </div>
                            ))}
                        </div>
                        
                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 gap-1">
                            {getDaysInMonth(currentMonth).map((date, index) => {
                                const messages = date ? getMessagesForDate(date) : [];
                                const isToday = date && date.toDateString() === new Date().toDateString();
                                
                                return (
                                    <div 
                                        key={index}
                                        className={cn(
                                            "min-h-[80px] p-1 rounded-lg border",
                                            date ? "border-gray-700 bg-gray-800/30" : "border-transparent",
                                            isToday && "border-orange-500/50 bg-orange-500/10"
                                        )}
                                    >
                                        {date && (
                                            <>
                                                <div className={cn(
                                                    "text-xs mb-1",
                                                    isToday ? "text-orange-400 font-bold" : "text-gray-400"
                                                )}>
                                                    {date.getDate()}
                                                </div>
                                                {messages.length > 0 && (
                                                    <div className="space-y-1">
                                                        {messages.slice(0, 2).map((msg) => (
                                                            <div 
                                                                key={msg.id}
                                                                className="text-[10px] p-1 rounded bg-blue-500/20 text-blue-400 truncate"
                                                                title={msg.title}
                                                            >
                                                                {msg.title}
                                                            </div>
                                                        ))}
                                                        {messages.length > 2 && (
                                                            <div className="text-[10px] text-gray-500">
                                                                +{messages.length - 2} more
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        
                        {/* Recurring Messages Section */}
                        <div className="mt-6">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                <RotateCcw className="w-4 h-4 text-purple-400" />
                                Recurring Messages
                            </h4>
                            <div className="space-y-2">
                                {scheduledMessages
                                    .filter(m => m.type === 'recurring' && m.status !== 'paused')
                                    .map((msg) => (
                                        <div 
                                            key={msg.id}
                                            className="flex items-center gap-3 p-3 rounded-lg bg-gray-100/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                                <RotateCcw className="w-4 h-4 text-purple-400" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">{msg.title}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    Every {msg.schedule.frequency} at {msg.schedule.time}
                                                </p>
                                            </div>
                                            {msg.schedule.nextRun && (
                                                <Badge variant="outline" className="text-purple-400 border-purple-400/50">
                                                    Next: {formatDate(msg.schedule.nextRun)}
                                                </Badge>
                                            )}
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </div>
                )}
            </ScrollArea>
        </div>
    );
};

// Helper functions
function getNextMonday() {
    const today = new Date();
    const day = today.getDay();
    const diff = day === 0 ? 1 : 8 - day;
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + diff);
    return nextMonday.toISOString();
}

function getFirstOfNextMonth() {
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    return nextMonth.toISOString();
}

export default ScheduledMessages;
