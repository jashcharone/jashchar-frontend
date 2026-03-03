/**
 * useJashSyncNotifications Hook
 * ═══════════════════════════════════════════════════════════════════════════════
 * Real-time notification management for JashSync
 * 
 * Features:
 * - Fetch notifications with filters
 * - Mark read/unread
 * - Delete notifications
 * - Real-time updates via Socket.io
 * - Priority-based sorting
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import api from '@/services/api';
import useJashSyncSocket from './useJashSyncSocket';

/**
 * JashSync Notifications Hook
 * @param {Object} options - Configuration options
 * @param {boolean} options.autoFetch - Auto-fetch notifications on mount (default: true)
 * @param {number} options.limit - Notifications per page (default: 50)
 * @param {Function} options.onNewNotification - Callback when new notification arrives
 */
const useJashSyncNotifications = (options = {}) => {
    const {
        autoFetch = true,
        limit = 50,
        onNewNotification
    } = options;
    
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [offset, setOffset] = useState(0);
    
    const onNewNotificationRef = useRef(onNewNotification);
    
    // Update ref when callback changes
    useEffect(() => {
        onNewNotificationRef.current = onNewNotification;
    }, [onNewNotification]);
    
    // Socket connection for real-time updates
    const { connected } = useJashSyncSocket({
        onMessage: () => {} // Using custom event listeners below
    });
    
    /**
     * Fetch notifications from backend
     */
    const fetchNotifications = useCallback(async ({ 
        reset = false, 
        unreadOnly = false, 
        category = null, 
        type = null 
    } = {}) => {
        try {
            setLoading(true);
            setError(null);
            
            const params = new URLSearchParams({
                limit: String(limit),
                offset: String(reset ? 0 : offset)
            });
            
            if (unreadOnly) params.append('unread_only', 'true');
            if (category) params.append('category', category);
            if (type) params.append('type', type);
            
            const response = await api.get(`/jashsync/notifications?${params}`);
            const data = response?.data || {};
            
            if (reset) {
                setNotifications(data.notifications || []);
                setOffset(limit);
            } else {
                setNotifications(prev => [...prev, ...(data.notifications || [])]);
                setOffset(prev => prev + limit);
            }
            
            setUnreadCount(data.unread_count || 0);
            setHasMore(data.has_more || false);
            
            return data;
        } catch (err) {
            console.error('[JashSync Notifications] Fetch error:', err);
            setError(err.message || 'Failed to fetch notifications');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [limit, offset]);
    
    /**
     * Mark notifications as read
     */
    const markAsRead = useCallback(async (notificationIds) => {
        if (!notificationIds || notificationIds.length === 0) return;
        
        try {
            const response = await api.post('/jashsync/notifications/read', {
                notification_ids: notificationIds
            });
            
            // Update local state
            setNotifications(prev => prev.map(n => 
                notificationIds.includes(n.id) 
                    ? { ...n, is_read: true, read_at: new Date().toISOString() } 
                    : n
            ));
            
            setUnreadCount(response.data.unread_count || Math.max(0, unreadCount - notificationIds.length));
            
            return response.data;
        } catch (err) {
            console.error('[JashSync Notifications] Mark read error:', err);
            throw err;
        }
    }, [unreadCount]);
    
    /**
     * Mark all notifications as read
     */
    const markAllAsRead = useCallback(async () => {
        try {
            const response = await api.post('/jashsync/notifications/read-all');
            
            // Update local state
            setNotifications(prev => prev.map(n => ({ 
                ...n, 
                is_read: true, 
                read_at: new Date().toISOString() 
            })));
            
            setUnreadCount(0);
            
            return response.data;
        } catch (err) {
            console.error('[JashSync Notifications] Mark all read error:', err);
            throw err;
        }
    }, []);
    
    /**
     * Delete a notification
     */
    const deleteNotification = useCallback(async (notificationId) => {
        try {
            await api.delete(`/jashsync/notifications/${notificationId}`);
            
            // Update local state
            const notification = notifications.find(n => n.id === notificationId);
            setNotifications(prev => prev.filter(n => n.id !== notificationId));
            
            if (notification && !notification.is_read) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
            
            return true;
        } catch (err) {
            console.error('[JashSync Notifications] Delete error:', err);
            throw err;
        }
    }, [notifications]);
    
    /**
     * Clear all notifications
     */
    const clearNotifications = useCallback(async (olderThanDays = null) => {
        try {
            const params = olderThanDays ? `?older_than_days=${olderThanDays}` : '';
            await api.delete(`/jashsync/notifications${params}`);
            
            if (olderThanDays) {
                // Refetch to get updated list
                await fetchNotifications({ reset: true });
            } else {
                setNotifications([]);
                setUnreadCount(0);
            }
            
            return true;
        } catch (err) {
            console.error('[JashSync Notifications] Clear error:', err);
            throw err;
        }
    }, [fetchNotifications]);
    
    /**
     * Get unread count
     */
    const refreshUnreadCount = useCallback(async () => {
        try {
            const response = await api.get('/jashsync/notifications/unread-count');
            setUnreadCount(response.data.count || 0);
            return response.data.count;
        } catch (err) {
            console.error('[JashSync Notifications] Get unread count error:', err);
            throw err;
        }
    }, []);
    
    /**
     * Handle real-time notification
     */
    const handleNewNotification = useCallback((data) => {
        const { notification, unreadCount: newCount } = data;
        
        // Add to top of list
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(newCount);
        
        // Call callback if provided
        if (onNewNotificationRef.current) {
            onNewNotificationRef.current(notification);
        }
    }, []);
    
    /**
     * Handle unread count update
     */
    const handleUnreadCountUpdate = useCallback((data) => {
        setUnreadCount(data.count || 0);
    }, []);
    
    // Listen for socket events
    useEffect(() => {
        // These events are emitted by the backend notification service
        // We'll listen via the global event system
        const handleNotificationEvent = (event) => {
            if (event.type === 'jashsync:notification') {
                handleNewNotification(event.detail);
            } else if (event.type === 'jashsync:unread_count') {
                handleUnreadCountUpdate(event.detail);
            }
        };
        
        window.addEventListener('jashsync_notification', handleNotificationEvent);
        
        return () => {
            window.removeEventListener('jashsync_notification', handleNotificationEvent);
        };
    }, [handleNewNotification, handleUnreadCountUpdate]);
    
    // Auto-fetch on mount
    useEffect(() => {
        if (autoFetch) {
            fetchNotifications({ reset: true });
        }
    }, [autoFetch]); // eslint-disable-line react-hooks/exhaustive-deps
    
    // Load more function
    const loadMore = useCallback(() => {
        if (!loading && hasMore) {
            fetchNotifications();
        }
    }, [loading, hasMore, fetchNotifications]);
    
    // Helper to check if notification is urgent based on priority score
    const isUrgent = useCallback((notification) => {
        return notification.is_urgent || notification.priority_score >= 80;
    }, []);
    
    // Helper to get priority level from score
    const getPriorityLevel = useCallback((notification) => {
        const score = notification.priority_score || 50;
        if (score >= 80) return 'urgent';
        if (score >= 60) return 'high';
        if (score >= 40) return 'normal';
        return 'low';
    }, []);
    
    return {
        // State
        notifications,
        loading,
        error,
        unreadCount,
        hasMore,
        connected,
        
        // Actions
        fetchNotifications,
        loadMore,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearNotifications,
        refreshUnreadCount,
        
        // Helpers
        isUrgent,
        getPriorityLevel
    };
};

export default useJashSyncNotifications;
