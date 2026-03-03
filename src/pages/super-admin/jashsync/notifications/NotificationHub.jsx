import React, { useState, useEffect, useMemo } from 'react';
import { 
    Bell, Search, Filter, Check, CheckCheck, Trash2, MoreVertical,
    Star, StarOff, Archive, Clock, AlertCircle, AlertTriangle,
    MessageCircle, Megaphone, Hash, Calendar, CreditCard,
    Settings, RefreshCw, ChevronDown, Eye, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import api from "@/services/api";
import { TimeAgo } from "../chats/ChatIndicators";

/**
 * NotificationHub - Priority inbox with AI-powered filtering
 * Shows all notifications with smart categorization
 */
const NotificationHub = ({ 
    onOpenSettings,
    className 
}) => {
    const [search, setSearch] = useState('');
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('all');
    const [selectedIds, setSelectedIds] = useState([]);
    const [selectMode, setSelectMode] = useState(false);
    
    // Priority levels
    const priorityConfig = {
        urgent: { label: 'Urgent', color: 'text-red-400 bg-red-500/20', icon: AlertCircle },
        high: { label: 'High', color: 'text-orange-400 bg-orange-500/20', icon: AlertTriangle },
        normal: { label: 'Normal', color: 'text-blue-400 bg-blue-500/20', icon: Bell },
        low: { label: 'Low', color: 'text-gray-400 bg-gray-500/20', icon: Bell }
    };
    
    // Notification types
    const typeConfig = {
        message: { label: 'Message', icon: MessageCircle, color: 'text-purple-400' },
        broadcast: { label: 'Broadcast', icon: Megaphone, color: 'text-red-400' },
        channel: { label: 'Channel', icon: Hash, color: 'text-blue-400' },
        fee: { label: 'Fee', icon: CreditCard, color: 'text-green-400' },
        event: { label: 'Event', icon: Calendar, color: 'text-orange-400' },
        system: { label: 'System', icon: Settings, color: 'text-gray-400' }
    };
    
    // Fetch notifications
    useEffect(() => {
        const fetchNotifications = async () => {
            setLoading(true);
            try {
                const response = await api.get('/jashsync/notifications');
                setNotifications(response.data || []);
            } catch (error) {
                console.error('Failed to fetch notifications:', error);
                // Mock data for development
                setNotifications([
                    {
                        id: '1',
                        type: 'fee',
                        priority: 'urgent',
                        title: 'Fee Payment Overdue',
                        message: '5 students have fee payments overdue by more than 30 days',
                        timestamp: new Date(Date.now() - 900000).toISOString(),
                        isRead: false,
                        isStarred: true,
                        sender: { name: 'System', avatar: null },
                        actionUrl: '/fees/defaulters'
                    },
                    {
                        id: '2',
                        type: 'message',
                        priority: 'high',
                        title: 'New Message from Principal',
                        message: 'Regarding the upcoming annual day celebration...',
                        timestamp: new Date(Date.now() - 1800000).toISOString(),
                        isRead: false,
                        isStarred: false,
                        sender: { name: 'Principal Sir', avatar: null },
                        actionUrl: '/jashsync?tab=chats'
                    },
                    {
                        id: '3',
                        type: 'broadcast',
                        priority: 'normal',
                        title: 'Broadcast Delivered',
                        message: 'Your "Fee Reminder - March" broadcast was delivered to 445/450 recipients',
                        timestamp: new Date(Date.now() - 3600000).toISOString(),
                        isRead: true,
                        isStarred: false,
                        sender: { name: 'JashSync', avatar: null },
                        actionUrl: '/jashsync?tab=broadcast'
                    },
                    {
                        id: '4',
                        type: 'channel',
                        priority: 'normal',
                        title: '15 new messages in #class-10-a',
                        message: 'Sarah Teacher: Tomorrow exam schedule has been...',
                        timestamp: new Date(Date.now() - 7200000).toISOString(),
                        isRead: false,
                        isStarred: false,
                        sender: { name: 'Class 10-A', avatar: null },
                        actionUrl: '/jashsync?tab=channels'
                    },
                    {
                        id: '5',
                        type: 'event',
                        priority: 'high',
                        title: 'PTM Tomorrow',
                        message: 'Parent Teacher Meeting scheduled for tomorrow 10 AM - 1 PM',
                        timestamp: new Date(Date.now() - 14400000).toISOString(),
                        isRead: true,
                        isStarred: true,
                        sender: { name: 'Calendar', avatar: null },
                        actionUrl: '/calendar'
                    },
                    {
                        id: '6',
                        type: 'system',
                        priority: 'low',
                        title: 'Wallet Balance Low',
                        message: 'Your JashSync wallet balance is below ₹500. Recharge to continue sending messages.',
                        timestamp: new Date(Date.now() - 86400000).toISOString(),
                        isRead: true,
                        isStarred: false,
                        sender: { name: 'System', avatar: null },
                        actionUrl: '/jashsync?tab=wallet'
                    },
                    {
                        id: '7',
                        type: 'message',
                        priority: 'normal',
                        title: '3 unread messages',
                        message: 'You have 3 unread messages from parents',
                        timestamp: new Date(Date.now() - 172800000).toISOString(),
                        isRead: true,
                        isStarred: false,
                        sender: { name: 'JashSync', avatar: null },
                        actionUrl: '/jashsync?tab=chats'
                    }
                ]);
            } finally {
                setLoading(false);
            }
        };
        
        fetchNotifications();
    }, []);
    
    // Calculate stats
    const stats = useMemo(() => {
        const unread = notifications.filter(n => !n.isRead).length;
        const urgent = notifications.filter(n => n.priority === 'urgent' && !n.isRead).length;
        const starred = notifications.filter(n => n.isStarred).length;
        return { unread, urgent, starred, total: notifications.length };
    }, [notifications]);
    
    // Filter notifications
    const filteredNotifications = useMemo(() => {
        let result = [...notifications];
        
        // Filter by tab
        switch (activeFilter) {
            case 'unread':
                result = result.filter(n => !n.isRead);
                break;
            case 'starred':
                result = result.filter(n => n.isStarred);
                break;
            case 'urgent':
                result = result.filter(n => n.priority === 'urgent' || n.priority === 'high');
                break;
        }
        
        // Search
        if (search.trim()) {
            const query = search.toLowerCase();
            result = result.filter(n => 
                n.title?.toLowerCase().includes(query) ||
                n.message?.toLowerCase().includes(query)
            );
        }
        
        // Sort by priority and time
        result.sort((a, b) => {
            // Unread first
            if (!a.isRead && b.isRead) return -1;
            if (a.isRead && !b.isRead) return 1;
            
            // Then by priority
            const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
            const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
            if (pDiff !== 0) return pDiff;
            
            // Then by time
            return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        });
        
        return result;
    }, [notifications, activeFilter, search]);
    
    // Actions
    const markAsRead = async (ids) => {
        setNotifications(prev => prev.map(n => 
            ids.includes(n.id) ? { ...n, isRead: true } : n
        ));
        setSelectedIds([]);
    };
    
    const markAllAsRead = async () => {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    };
    
    const toggleStar = async (id) => {
        setNotifications(prev => prev.map(n => 
            n.id === id ? { ...n, isStarred: !n.isStarred } : n
        ));
    };
    
    const deleteNotification = async (id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };
    
    const deleteSelected = async () => {
        setNotifications(prev => prev.filter(n => !selectedIds.includes(n.id)));
        setSelectedIds([]);
        setSelectMode(false);
    };
    
    const toggleSelect = (id) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };
    
    const selectAll = () => {
        setSelectedIds(filteredNotifications.map(n => n.id));
    };
    
    return (
        <div className={cn("flex flex-col h-full bg-white dark:bg-gray-900", className)}>
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700/50">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center">
                            <Bell className="h-5 w-5 text-yellow-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                Notifications
                                {stats.unread > 0 && (
                                    <Badge className="bg-red-500">{stats.unread}</Badge>
                                )}
                            </h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {stats.urgent > 0 && <span className="text-red-400">{stats.urgent} urgent • </span>}
                                {stats.total} total
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        {selectMode ? (
                            <>
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => { setSelectMode(false); setSelectedIds([]); }}
                                >
                                    Cancel
                                </Button>
                                {selectedIds.length > 0 && (
                                    <>
                                        <Button 
                                            variant="outline" 
                                            size="sm"
                                            onClick={() => markAsRead(selectedIds)}
                                        >
                                            <Check className="h-4 w-4 mr-1" />
                                            Mark Read
                                        </Button>
                                        <Button 
                                            variant="destructive" 
                                            size="sm"
                                            onClick={deleteSelected}
                                        >
                                            <Trash2 className="h-4 w-4 mr-1" />
                                            Delete
                                        </Button>
                                    </>
                                )}
                            </>
                        ) : (
                            <>
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={markAllAsRead}
                                    disabled={stats.unread === 0}
                                >
                                    <CheckCheck className="h-4 w-4 mr-1" />
                                    Mark All Read
                                </Button>
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => setSelectMode(true)}
                                >
                                    <Check className="h-4 w-4 mr-1" />
                                    Select
                                </Button>
                                <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={onOpenSettings}
                                >
                                    <Settings className="h-4 w-4" />
                                </Button>
                            </>
                        )}
                    </div>
                </div>
                
                {/* Quick Stats */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                    {[
                        { label: 'Unread', value: stats.unread, color: 'text-blue-400', filter: 'unread' },
                        { label: 'Urgent', value: stats.urgent, color: 'text-red-400', filter: 'urgent' },
                        { label: 'Starred', value: stats.starred, color: 'text-yellow-400', filter: 'starred' },
                        { label: 'All', value: stats.total, color: 'text-gray-500 dark:text-gray-400', filter: 'all' }
                    ].map((stat, idx) => (
                        <div 
                            key={idx} 
                            onClick={() => setActiveFilter(stat.filter)}
                            className={cn(
                                "bg-gray-100/50 dark:bg-gray-800/50 rounded-lg p-2 text-center cursor-pointer transition-all",
                                "hover:bg-gray-200 dark:hover:bg-gray-800",
                                activeFilter === stat.filter && "ring-1 ring-purple-500"
                            )}
                        >
                            <p className={cn("text-lg font-bold", stat.color)}>{stat.value}</p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400">{stat.label}</p>
                        </div>
                    ))}
                </div>
                
                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <Input
                        placeholder="Search notifications..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                    />
                </div>
            </div>
            
            {/* Filter Tabs */}
            <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700/50">
                <Tabs value={activeFilter} onValueChange={setActiveFilter}>
                    <TabsList className="w-full bg-gray-100/50 dark:bg-gray-800/50 p-1">
                        <TabsTrigger value="all" className="flex-1 text-xs data-[state=active]:bg-yellow-600">
                            All
                        </TabsTrigger>
                        <TabsTrigger value="unread" className="flex-1 text-xs data-[state=active]:bg-yellow-600">
                            Unread
                        </TabsTrigger>
                        <TabsTrigger value="urgent" className="flex-1 text-xs data-[state=active]:bg-yellow-600">
                            Urgent
                        </TabsTrigger>
                        <TabsTrigger value="starred" className="flex-1 text-xs data-[state=active]:bg-yellow-600">
                            Starred
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>
            
            {/* Select All (when in select mode) */}
            {selectMode && (
                <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700/50 flex items-center justify-between bg-gray-100/30 dark:bg-gray-800/30">
                    <div className="flex items-center gap-2">
                        <Checkbox 
                            checked={selectedIds.length === filteredNotifications.length && filteredNotifications.length > 0}
                            onCheckedChange={(checked) => checked ? selectAll() : setSelectedIds([])}
                        />
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            {selectedIds.length} selected
                        </span>
                    </div>
                </div>
            )}
            
            {/* Notification List */}
            <ScrollArea className="flex-1">
                {loading ? (
                    <div className="flex items-center justify-center h-32">
                        <RefreshCw className="h-8 w-8 animate-spin text-yellow-400" />
                    </div>
                ) : filteredNotifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 text-gray-500 dark:text-gray-400">
                        <Bell className="h-8 w-8 mb-2 opacity-50" />
                        <p className="text-sm">
                            {activeFilter === 'all' ? 'No notifications' : `No ${activeFilter} notifications`}
                        </p>
                    </div>
                ) : (
                    <div className="p-2 space-y-1">
                        {filteredNotifications.map((notification) => {
                            const typeInfo = typeConfig[notification.type] || typeConfig.system;
                            const priorityInfo = priorityConfig[notification.priority] || priorityConfig.normal;
                            const TypeIcon = typeInfo.icon;
                            const PriorityIcon = priorityInfo.icon;
                            const isSelected = selectedIds.includes(notification.id);
                            
                            return (
                                <div
                                    key={notification.id}
                                    className={cn(
                                        "p-3 rounded-lg border transition-all group cursor-pointer",
                                        "hover:bg-gray-100/70 dark:hover:bg-gray-800/70",
                                        !notification.isRead && "bg-gray-100/50 dark:bg-gray-800/50 border-l-2 border-l-purple-500",
                                        notification.isRead && "bg-gray-100/20 dark:bg-gray-800/20 border-gray-200 dark:border-gray-700/30",
                                        isSelected && "ring-1 ring-purple-500"
                                    )}
                                >
                                    <div className="flex items-start gap-3">
                                        {/* Checkbox (select mode) */}
                                        {selectMode && (
                                            <Checkbox
                                                checked={isSelected}
                                                onCheckedChange={() => toggleSelect(notification.id)}
                                                className="mt-1"
                                            />
                                        )}
                                        
                                        {/* Type Icon */}
                                        <div className={cn(
                                            "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                                            priorityInfo.color
                                        )}>
                                            <TypeIcon className="h-5 w-5" />
                                        </div>
                                        
                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <h4 className={cn(
                                                    "font-medium truncate",
                                                    !notification.isRead ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"
                                                )}>
                                                    {notification.title}
                                                </h4>
                                                {notification.priority === 'urgent' && (
                                                    <Badge className="bg-red-500/20 text-red-400 text-[10px]">
                                                        Urgent
                                                    </Badge>
                                                )}
                                                {notification.priority === 'high' && (
                                                    <Badge className="bg-orange-500/20 text-orange-400 text-[10px]">
                                                        High
                                                    </Badge>
                                                )}
                                            </div>
                                            
                                            <p className={cn(
                                                "text-sm truncate",
                                                !notification.isRead ? "text-gray-700 dark:text-gray-300" : "text-gray-600 dark:text-gray-500"
                                            )}>
                                                {notification.message}
                                            </p>
                                            
                                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                                <Badge variant="outline" className={cn("text-[10px] py-0", typeInfo.color)}>
                                                    {typeInfo.label}
                                                </Badge>
                                                <span>•</span>
                                                <TimeAgo date={notification.timestamp} />
                                            </div>
                                        </div>
                                        
                                        {/* Actions */}
                                        <div className="flex items-center gap-1">
                                            {/* Star */}
                                            <Button 
                                                variant="ghost" 
                                                size="icon"
                                                className={cn(
                                                    "h-8 w-8",
                                                    notification.isStarred ? "text-yellow-400" : "text-gray-500 opacity-0 group-hover:opacity-100"
                                                )}
                                                onClick={(e) => { e.stopPropagation(); toggleStar(notification.id); }}
                                            >
                                                {notification.isStarred ? (
                                                    <Star className="h-4 w-4 fill-current" />
                                                ) : (
                                                    <StarOff className="h-4 w-4" />
                                                )}
                                            </Button>
                                            
                                            {/* More actions */}
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon"
                                                        className="h-8 w-8 opacity-0 group-hover:opacity-100"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                                                    {!notification.isRead && (
                                                        <DropdownMenuItem onClick={() => markAsRead([notification.id])}>
                                                            <Eye className="h-4 w-4 mr-2" />
                                                            Mark as Read
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuItem onClick={() => toggleStar(notification.id)}>
                                                        <Star className="h-4 w-4 mr-2" />
                                                        {notification.isStarred ? 'Unstar' : 'Star'}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
                                                    <DropdownMenuItem 
                                                        onClick={() => deleteNotification(notification.id)}
                                                        className="text-red-400"
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </ScrollArea>
        </div>
    );
};

export default NotificationHub;
