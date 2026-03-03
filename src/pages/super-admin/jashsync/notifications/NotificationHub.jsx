import React, { useState, useEffect, useMemo } from 'react';
import { 
    Bell, Search, Filter, Check, CheckCheck, Trash2, MoreVertical,
    Star, StarOff, Archive, Clock, AlertCircle, AlertTriangle,
    MessageCircle, Megaphone, Hash, Calendar, CreditCard,
    Settings, RefreshCw, ChevronDown, Eye, X, Loader2
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
import useJashSyncNotifications from "@/hooks/useJashSyncNotifications";
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
    const [activeFilter, setActiveFilter] = useState('all');
    const [selectedIds, setSelectedIds] = useState([]);
    const [selectMode, setSelectMode] = useState(false);
    
    // Use the notifications hook
    const {
        notifications,
        loading,
        error,
        unreadCount,
        hasMore,
        fetchNotifications,
        loadMore,
        markAsRead,
        markAllAsRead,
        deleteNotification: deleteNotif,
        clearNotifications,
        getPriorityLevel
    } = useJashSyncNotifications({
        autoFetch: true,
        limit: 50
    });
    
    // Priority levels config
    const priorityConfig = {
        urgent: { label: 'Urgent', color: 'text-red-400 bg-red-500/20', icon: AlertCircle },
        high: { label: 'High', color: 'text-orange-400 bg-orange-500/20', icon: AlertTriangle },
        normal: { label: 'Normal', color: 'text-blue-400 bg-blue-500/20', icon: Bell },
        low: { label: 'Low', color: 'text-gray-400 bg-gray-500/20', icon: Bell }
    };
    
    // Notification types config
    const typeConfig = {
        message: { label: 'Message', icon: MessageCircle, color: 'text-purple-400' },
        mention: { label: 'Mention', icon: MessageCircle, color: 'text-pink-400' },
        broadcast: { label: 'Broadcast', icon: Megaphone, color: 'text-red-400' },
        channel_post: { label: 'Channel', icon: Hash, color: 'text-blue-400' },
        group_invite: { label: 'Invite', icon: MessageCircle, color: 'text-green-400' },
        wallet: { label: 'Wallet', icon: CreditCard, color: 'text-yellow-400' },
        admin_action: { label: 'Admin', icon: Settings, color: 'text-orange-400' },
        ai_alert: { label: 'AI Alert', icon: AlertTriangle, color: 'text-purple-400' },
        reaction: { label: 'Reaction', icon: Star, color: 'text-pink-400' },
        system: { label: 'System', icon: Settings, color: 'text-gray-400' }
    };
    
    // Calculate stats
    const stats = useMemo(() => {
        const urgent = notifications.filter(n => getPriorityLevel(n) === 'urgent' && !n.is_read).length;
        const starred = notifications.filter(n => n.is_starred).length;
        return { unread: unreadCount, urgent, starred, total: notifications.length };
    }, [notifications, unreadCount, getPriorityLevel]);
    
    // Filter notifications
    const filteredNotifications = useMemo(() => {
        let result = [...notifications];
        
        // Filter by tab
        switch (activeFilter) {
            case 'unread':
                result = result.filter(n => !n.is_read);
                break;
            case 'starred':
                result = result.filter(n => n.is_starred);
                break;
            case 'urgent':
                result = result.filter(n => n.is_urgent || getPriorityLevel(n) === 'urgent' || getPriorityLevel(n) === 'high');
                break;
        }
        
        // Search
        if (search.trim()) {
            const query = search.toLowerCase();
            result = result.filter(n => 
                n.title?.toLowerCase().includes(query) ||
                n.body?.toLowerCase().includes(query) ||
                n.short_body?.toLowerCase().includes(query)
            );
        }
        
        // Sort by priority and time (already sorted by backend, but apply local sorting for filters)
        result.sort((a, b) => {
            // Unread first
            if (!a.is_read && b.is_read) return -1;
            if (a.is_read && !b.is_read) return 1;
            
            // Then by priority score
            const aPriority = a.priority_score || 50;
            const bPriority = b.priority_score || 50;
            if (bPriority !== aPriority) return bPriority - aPriority;
            
            // Then by time
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        
        return result;
    }, [notifications, activeFilter, search, getPriorityLevel]);
    
    // Actions
    const handleMarkAsRead = async (ids) => {
        await markAsRead(ids);
        setSelectedIds([]);
    };
    
    const handleMarkAllAsRead = async () => {
        await markAllAsRead();
    };
    
    const handleDeleteNotification = async (id) => {
        await deleteNotif(id);
    };
    
    const handleDeleteSelected = async () => {
        await Promise.all(selectedIds.map(id => deleteNotif(id)));
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
    
    const handleRefresh = () => {
        fetchNotifications({ reset: true });
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
                                            onClick={() => handleMarkAsRead(selectedIds)}
                                        >
                                            <Check className="h-4 w-4 mr-1" />
                                            Mark Read
                                        </Button>
                                        <Button 
                                            variant="destructive" 
                                            size="sm"
                                            onClick={handleDeleteSelected}
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
                                    variant="ghost" 
                                    size="icon"
                                    onClick={handleRefresh}
                                    disabled={loading}
                                >
                                    <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                                </Button>
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={handleMarkAllAsRead}
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
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
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
                        <Loader2 className="h-8 w-8 animate-spin text-yellow-400" />
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
                            const typeInfo = typeConfig[notification.notification_type] || typeConfig.system;
                            const priorityLevel = getPriorityLevel(notification);
                            const priorityInfo = priorityConfig[priorityLevel] || priorityConfig.normal;
                            const TypeIcon = typeInfo.icon;
                            const isSelected = selectedIds.includes(notification.id);
                            
                            return (
                                <div
                                    key={notification.id}
                                    className={cn(
                                        "p-3 rounded-lg border transition-all group cursor-pointer",
                                        "hover:bg-gray-100/70 dark:hover:bg-gray-800/70",
                                        !notification.is_read && "bg-gray-100/50 dark:bg-gray-800/50 border-l-2 border-l-purple-500",
                                        notification.is_read && "bg-gray-100/20 dark:bg-gray-800/20 border-gray-200 dark:border-gray-700/30",
                                        isSelected && "ring-1 ring-purple-500"
                                    )}
                                    onClick={() => {
                                        if (!notification.is_read) {
                                            handleMarkAsRead([notification.id]);
                                        }
                                        if (notification.action_url) {
                                            window.location.href = notification.action_url;
                                        }
                                    }}
                                >
                                    <div className="flex items-start gap-3">
                                        {/* Checkbox (select mode) */}
                                        {selectMode && (
                                            <Checkbox
                                                checked={isSelected}
                                                onCheckedChange={() => toggleSelect(notification.id)}
                                                onClick={(e) => e.stopPropagation()}
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
                                                    !notification.is_read ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"
                                                )}>
                                                    {notification.title}
                                                </h4>
                                                {notification.is_urgent && (
                                                    <Badge className="bg-red-500/20 text-red-400 text-[10px]">
                                                        Urgent
                                                    </Badge>
                                                )}
                                                {priorityLevel === 'high' && !notification.is_urgent && (
                                                    <Badge className="bg-orange-500/20 text-orange-400 text-[10px]">
                                                        High
                                                    </Badge>
                                                )}
                                            </div>
                                            
                                            <p className={cn(
                                                "text-sm truncate",
                                                !notification.is_read ? "text-gray-700 dark:text-gray-300" : "text-gray-600 dark:text-gray-500"
                                            )}>
                                                {notification.short_body || notification.body}
                                            </p>
                                            
                                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                                <Badge variant="outline" className={cn("text-[10px] py-0", typeInfo.color)}>
                                                    {typeInfo.label}
                                                </Badge>
                                                {notification.sender_name && (
                                                    <>
                                                        <span>•</span>
                                                        <span>{notification.sender_name}</span>
                                                    </>
                                                )}
                                                <span>•</span>
                                                <TimeAgo date={notification.created_at} />
                                            </div>
                                        </div>
                                        
                                        {/* Actions */}
                                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                            {/* Star */}
                                            <Button 
                                                variant="ghost" 
                                                size="icon"
                                                className={cn(
                                                    "h-8 w-8",
                                                    notification.is_starred ? "text-yellow-400" : "text-gray-500 opacity-0 group-hover:opacity-100"
                                                )}
                                            >
                                                {notification.is_starred ? (
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
                                                    >
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                                                    {!notification.is_read && (
                                                        <DropdownMenuItem onClick={() => handleMarkAsRead([notification.id])}>
                                                            <Eye className="h-4 w-4 mr-2" />
                                                            Mark as Read
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
                                                    <DropdownMenuItem 
                                                        onClick={() => handleDeleteNotification(notification.id)}
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
                        
                        {/* Load More */}
                        {hasMore && (
                            <Button
                                variant="ghost"
                                className="w-full mt-2"
                                onClick={loadMore}
                                disabled={loading}
                            >
                                {loading ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : null}
                                Load More
                            </Button>
                        )}
                    </div>
                )}
            </ScrollArea>
        </div>
    );
};

export default NotificationHub;
