/**
 * NotificationToast Component
 * ═══════════════════════════════════════════════════════════════════════════
 * Real-time notification popup for JashSync
 * Day 22 Implementation - Shows toast notifications when new alerts arrive
 * ═══════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, MessageCircle, Megaphone, Hash, CreditCard, Bell,
    AlertTriangle, User, Brain, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useJashSyncSocket } from '@/contexts/JashSyncSocketContext';

// Notification type icons
const TYPE_ICONS = {
    message: MessageCircle,
    mention: MessageCircle,
    broadcast: Megaphone,
    channel_post: Hash,
    wallet: CreditCard,
    admin_action: AlertTriangle,
    ai_alert: Brain,
    group_invite: User,
    reminder: Clock,
    system: Bell
};

// Priority colors
const PRIORITY_COLORS = {
    urgent: 'border-l-red-500 bg-red-500/5',
    high: 'border-l-orange-500 bg-orange-500/5',
    normal: 'border-l-blue-500 bg-blue-500/5',
    low: 'border-l-gray-500 bg-gray-500/5'
};

/**
 * Single Toast Item
 */
const ToastItem = ({ notification, onClose, onClick }) => {
    const Icon = TYPE_ICONS[notification.notification_type] || Bell;
    
    const getPriorityLevel = () => {
        const score = notification.priority_score || 50;
        if (notification.is_urgent || score >= 80) return 'urgent';
        if (score >= 60) return 'high';
        if (score >= 40) return 'normal';
        return 'low';
    };
    
    const priority = getPriorityLevel();
    
    return (
        <motion.div
            initial={{ opacity: 0, x: 300, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.9 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className={cn(
                "w-[380px] bg-white dark:bg-gray-800 rounded-lg shadow-lg border-l-4 border border-gray-200 dark:border-gray-700",
                "cursor-pointer hover:shadow-xl transition-shadow",
                PRIORITY_COLORS[priority]
            )}
            onClick={() => onClick(notification)}
        >
            <div className="p-4">
                <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                        priority === 'urgent' && "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
                        priority === 'high' && "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400",
                        priority === 'normal' && "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
                        priority === 'low' && "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                    )}>
                        <Icon className="h-5 w-5" />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                            <h4 className="font-medium text-gray-900 dark:text-white truncate">
                                {notification.title}
                            </h4>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 shrink-0 hover:bg-gray-200 dark:hover:bg-gray-700"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onClose(notification.id);
                                }}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-0.5">
                            {notification.short_body || notification.body}
                        </p>
                        
                        {notification.sender_name && (
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                from {notification.sender_name}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

/**
 * Notification Toast Container
 */
const NotificationToast = () => {
    const [toasts, setToasts] = useState([]);
    const { socket, isConnected } = useJashSyncSocket();
    
    // Auto-dismiss timer (seconds)
    const AUTO_DISMISS_TIME = 5000;
    const MAX_VISIBLE_TOASTS = 4;
    
    // Handle new notification
    const handleNewNotification = useCallback((data) => {
        const { notification } = data;
        
        if (!notification) return;
        
        // Add to toasts
        setToasts(prev => {
            const newToasts = [notification, ...prev].slice(0, MAX_VISIBLE_TOASTS + 2);
            return newToasts;
        });
        
        // Play sound if enabled (check localStorage)
        const soundEnabled = localStorage.getItem('jashsync_notification_sound') !== 'false';
        if (soundEnabled) {
            playNotificationSound(notification.is_urgent);
        }
        
        // Auto-dismiss after timeout
        setTimeout(() => {
            dismissToast(notification.id);
        }, AUTO_DISMISS_TIME);
    }, []);
    
    // Dismiss a toast
    const dismissToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);
    
    // Handle toast click (navigate and mark as read)
    const handleToastClick = useCallback(async (notification) => {
        dismissToast(notification.id);
        
        // Navigate to action URL if available
        if (notification.action_url) {
            window.location.href = notification.action_url;
        }
    }, [dismissToast]);
    
    // Play notification sound
    const playNotificationSound = (isUrgent) => {
        try {
            // Use Web Audio API for better control
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);
            
            // Different sounds for urgent vs normal
            if (isUrgent) {
                oscillator.frequency.value = 800;
                oscillator.type = 'sine';
                gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
                oscillator.start(ctx.currentTime);
                oscillator.stop(ctx.currentTime + 0.3);
            } else {
                oscillator.frequency.value = 500;
                oscillator.type = 'sine';
                gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
                oscillator.start(ctx.currentTime);
                oscillator.stop(ctx.currentTime + 0.2);
            }
        } catch (e) {
            // Silently fail if audio not supported
        }
    };
    
    // Subscribe to socket events
    useEffect(() => {
        if (!socket || !isConnected) return;
        
        // Listen for notification events
        socket.on('jashsync:notification', handleNewNotification);
        
        return () => {
            socket.off('jashsync:notification', handleNewNotification);
        };
    }, [socket, isConnected, handleNewNotification]);
    
    // Listen for custom events (from hook)
    useEffect(() => {
        const handleCustomEvent = (event) => {
            handleNewNotification(event.detail);
        };
        
        window.addEventListener('jashsync_notification_toast', handleCustomEvent);
        
        return () => {
            window.removeEventListener('jashsync_notification_toast', handleCustomEvent);
        };
    }, [handleNewNotification]);
    
    return (
        <div className="fixed bottom-4 right-4 z-[100] space-y-2">
            <AnimatePresence mode="popLayout">
                {toasts.slice(0, MAX_VISIBLE_TOASTS).map((toast) => (
                    <ToastItem
                        key={toast.id}
                        notification={toast}
                        onClose={dismissToast}
                        onClick={handleToastClick}
                    />
                ))}
            </AnimatePresence>
            
            {/* Overflow indicator */}
            {toasts.length > MAX_VISIBLE_TOASTS && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center text-sm text-gray-500 dark:text-gray-400"
                >
                    +{toasts.length - MAX_VISIBLE_TOASTS} more notifications
                </motion.div>
            )}
        </div>
    );
};

export default NotificationToast;

/**
 * Helper to trigger notification toast from anywhere
 */
export const showNotificationToast = (notification) => {
    window.dispatchEvent(new CustomEvent('jashsync_notification_toast', {
        detail: { notification }
    }));
};
