/**
 * NotificationBadge Component
 * ═══════════════════════════════════════════════════════════════════════════
 * Badge indicator showing unread notification count
 * Day 22 Implementation - For header/sidebar notification bell
 * ═══════════════════════════════════════════════════════════════════════════
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Bell, BellRing } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useJashSyncSocket } from '@/contexts/JashSyncSocketContext';
import useJashSyncNotifications from '@/hooks/useJashSyncNotifications';
import { formatDistanceToNow } from 'date-fns';

/**
 * Mini notification item for popover
 */
const MiniNotificationItem = ({ notification, onClick }) => {
    const isUrgent = notification.is_urgent || notification.priority_score >= 80;
    
    return (
        <div
            className={cn(
                "p-3 border-b border-gray-200 dark:border-gray-700 cursor-pointer transition-colors",
                "hover:bg-gray-100 dark:hover:bg-gray-800",
                !notification.is_read && "bg-blue-50/50 dark:bg-blue-900/10"
            )}
            onClick={() => onClick(notification)}
        >
            <div className="flex items-start gap-2">
                <div className={cn(
                    "w-2 h-2 rounded-full mt-2 shrink-0",
                    isUrgent && "bg-red-500",
                    !isUrgent && !notification.is_read && "bg-blue-500",
                    notification.is_read && "bg-transparent"
                )} />
                
                <div className="flex-1 min-w-0">
                    <p className={cn(
                        "text-sm truncate",
                        !notification.is_read && "font-medium text-gray-900 dark:text-white",
                        notification.is_read && "text-gray-600 dark:text-gray-400"
                    )}>
                        {notification.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 truncate mt-0.5">
                        {notification.short_body || notification.body}
                    </p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-600 mt-1">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </p>
                </div>
            </div>
        </div>
    );
};

/**
 * Notification Badge with Popover
 */
const NotificationBadge = ({ 
    variant = 'icon', // 'icon' | 'button' | 'minimal'
    showPreview = true,
    maxPreviewItems = 5,
    onViewAll,
    className 
}) => {
    const { socket, isConnected } = useJashSyncSocket();
    const {
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        markAsRead
    } = useJashSyncNotifications({ autoFetch: true, limit: maxPreviewItems });
    
    const [isOpen, setIsOpen] = useState(false);
    const [hasNewNotification, setHasNewNotification] = useState(false);
    
    // Handle socket notification updates
    useEffect(() => {
        if (!socket || !isConnected) return;
        
        const handleUnreadUpdate = (data) => {
            // Trigger refresh
            fetchNotifications({ reset: true });
        };
        
        const handleNewNotification = () => {
            setHasNewNotification(true);
            // Reset animation after a bit
            setTimeout(() => setHasNewNotification(false), 2000);
        };
        
        socket.on('jashsync:unread_count', handleUnreadUpdate);
        socket.on('jashsync:notification', handleNewNotification);
        
        return () => {
            socket.off('jashsync:unread_count', handleUnreadUpdate);
            socket.off('jashsync:notification', handleNewNotification);
        };
    }, [socket, isConnected, fetchNotifications]);
    
    // Handle notification click
    const handleNotificationClick = useCallback(async (notification) => {
        if (!notification.is_read) {
            await markAsRead([notification.id]);
        }
        
        setIsOpen(false);
        
        if (notification.action_url) {
            window.location.href = notification.action_url;
        }
    }, [markAsRead]);
    
    // Handle view all click
    const handleViewAll = useCallback(() => {
        setIsOpen(false);
        if (onViewAll) {
            onViewAll();
        } else {
            // Default: navigate to JashSync notifications tab
            window.location.href = '/super/jashsync?tab=notifications';
        }
    }, [onViewAll]);
    
    // Render based on variant
    const renderTrigger = () => {
        const BellIcon = hasNewNotification ? BellRing : Bell;
        
        if (variant === 'minimal') {
            return (
                <div className={cn("relative", className)}>
                    <BellIcon className={cn(
                        "h-5 w-5 text-gray-600 dark:text-gray-400",
                        hasNewNotification && "animate-wiggle text-yellow-500"
                    )} />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </div>
            );
        }
        
        if (variant === 'button') {
            return (
                <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                        "relative gap-2",
                        hasNewNotification && "animate-pulse",
                        className
                    )}
                >
                    <BellIcon className="h-4 w-4" />
                    <span>Notifications</span>
                    {unreadCount > 0 && (
                        <Badge className="ml-1 bg-red-500 text-white text-xs">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </Badge>
                    )}
                </Button>
            );
        }
        
        // Default: icon variant
        return (
            <Button
                variant="ghost"
                size="icon"
                className={cn(
                    "relative",
                    hasNewNotification && "animate-pulse",
                    className
                )}
            >
                <BellIcon className={cn(
                    "h-5 w-5",
                    hasNewNotification && "text-yellow-500"
                )} />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center px-1">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </Button>
        );
    };
    
    if (!showPreview) {
        return (
            <div onClick={handleViewAll} className="cursor-pointer">
                {renderTrigger()}
            </div>
        );
    }
    
    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                {renderTrigger()}
            </PopoverTrigger>
            <PopoverContent
                className="w-[340px] p-0 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                align="end"
                sideOffset={8}
            >
                {/* Header */}
                <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">Notifications</h4>
                        {unreadCount > 0 && (
                            <p className="text-xs text-gray-500">{unreadCount} unread</p>
                        )}
                    </div>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-blue-600 dark:text-blue-400"
                            onClick={async () => {
                                const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
                                if (unreadIds.length > 0) {
                                    await markAsRead(unreadIds);
                                }
                            }}
                        >
                            Mark all read
                        </Button>
                    )}
                </div>
                
                {/* Notification List */}
                <ScrollArea className="max-h-[300px]">
                    {loading && notifications.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Loading...</p>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No notifications</p>
                        </div>
                    ) : (
                        notifications.map(notification => (
                            <MiniNotificationItem
                                key={notification.id}
                                notification={notification}
                                onClick={handleNotificationClick}
                            />
                        ))
                    )}
                </ScrollArea>
                
                {/* Footer */}
                <div className="p-2 border-t border-gray-200 dark:border-gray-700">
                    <Button
                        variant="ghost"
                        className="w-full text-sm text-blue-600 dark:text-blue-400"
                        onClick={handleViewAll}
                    >
                        View all notifications
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
};

export default NotificationBadge;
