/**
 * useJashSyncSocket Hook
 * ═══════════════════════════════════════════════════════════════════════════════
 * Real-time WebSocket connection for JashSync messaging platform
 * 
 * Features:
 * - Auto-connect/auto-reconnect
 * - Room management (join/leave)
 * - Real-time message events
 * - Typing indicators
 * - Read receipts
 * - Online status
 * - Presence tracking
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';

// Socket.io server URL
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

/**
 * JashSync WebSocket Hook
 * @param {Object} options - Configuration options
 * @param {boolean} options.autoConnect - Auto-connect on mount (default: true)
 * @param {Function} options.onMessage - Callback when new message received
 * @param {Function} options.onTyping - Callback when typing indicator received
 * @param {Function} options.onUserStatus - Callback when user status changes
 * @param {Function} options.onDelivered - Callback when message delivered
 * @param {Function} options.onRead - Callback when message read
 */
const useJashSyncSocket = (options = {}) => {
    const { user, organizationId, currentSessionId } = useAuth();
    const { selectedBranch } = useBranch();
    
    const socketRef = useRef(null);
    const [connected, setConnected] = useState(false);
    const [connectionError, setConnectionError] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState(new Set());
    const [typingUsers, setTypingUsers] = useState(new Map()); // roomId -> Set<userId>
    const reconnectAttemptRef = useRef(0);
    const maxReconnectAttempts = 5;
    
    // Callbacks refs to avoid re-renders
    const onMessageRef = useRef(options.onMessage);
    const onTypingRef = useRef(options.onTyping);
    const onUserStatusRef = useRef(options.onUserStatus);
    const onDeliveredRef = useRef(options.onDelivered);
    const onReadRef = useRef(options.onRead);
    
    // Update refs when callbacks change
    useEffect(() => {
        onMessageRef.current = options.onMessage;
        onTypingRef.current = options.onTyping;
        onUserStatusRef.current = options.onUserStatus;
        onDeliveredRef.current = options.onDelivered;
        onReadRef.current = options.onRead;
    }, [options.onMessage, options.onTyping, options.onUserStatus, options.onDelivered, options.onRead]);
    
    /**
     * Connect to JashSync WebSocket
     */
    const connect = useCallback(() => {
        if (!user?.id || !organizationId) {
            console.warn('[JashSync Socket] Cannot connect - missing auth context');
            return;
        }
        
        // Disconnect existing socket if any
        if (socketRef.current?.connected) {
            socketRef.current.disconnect();
        }
        
        console.log('[JashSync Socket] Connecting to:', SOCKET_URL);
        
        const socket = io(`${SOCKET_URL}/jashsync`, {
            auth: {
                userId: user.id,
                organizationId: organizationId,
                branchId: selectedBranch?.id,
                sessionId: currentSessionId
            },
            transports: ['websocket', 'polling'],
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: maxReconnectAttempts,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 10000
        });
        
        // Connection events
        socket.on('connect', () => {
            console.log('[JashSync Socket] ✅ Connected:', socket.id);
            setConnected(true);
            setConnectionError(null);
            reconnectAttemptRef.current = 0;
        });
        
        socket.on('disconnect', (reason) => {
            console.log('[JashSync Socket] ❌ Disconnected:', reason);
            setConnected(false);
            
            if (reason === 'io server disconnect') {
                // Server initiated disconnect - don't auto-reconnect
                setConnectionError('Disconnected by server');
            }
        });
        
        socket.on('connect_error', (error) => {
            console.error('[JashSync Socket] Connection error:', error.message);
            setConnected(false);
            setConnectionError(error.message);
            reconnectAttemptRef.current++;
            
            if (reconnectAttemptRef.current >= maxReconnectAttempts) {
                console.error('[JashSync Socket] Max reconnect attempts reached');
            }
        });
        
        // Message events
        socket.on('message:new', (data) => {
            console.log('[JashSync Socket] New message:', data);
            onMessageRef.current?.(data);
        });
        
        socket.on('message:delivered', (data) => {
            console.log('[JashSync Socket] Message delivered:', data);
            onDeliveredRef.current?.(data);
        });
        
        socket.on('message:read', (data) => {
            console.log('[JashSync Socket] Message read:', data);
            onReadRef.current?.(data);
        });
        
        socket.on('message:deleted', (data) => {
            console.log('[JashSync Socket] Message deleted:', data);
        });
        
        socket.on('message:edited', (data) => {
            console.log('[JashSync Socket] Message edited:', data);
        });
        
        // Typing events
        socket.on('typing:start', (data) => {
            const { roomId, userId, userName } = data;
            setTypingUsers(prev => {
                const newMap = new Map(prev);
                if (!newMap.has(roomId)) {
                    newMap.set(roomId, new Map());
                }
                newMap.get(roomId).set(userId, { userName, timestamp: Date.now() });
                return newMap;
            });
            onTypingRef.current?.({ ...data, isTyping: true });
        });
        
        socket.on('typing:stop', (data) => {
            const { roomId, userId } = data;
            setTypingUsers(prev => {
                const newMap = new Map(prev);
                if (newMap.has(roomId)) {
                    newMap.get(roomId).delete(userId);
                    if (newMap.get(roomId).size === 0) {
                        newMap.delete(roomId);
                    }
                }
                return newMap;
            });
            onTypingRef.current?.({ ...data, isTyping: false });
        });
        
        // User presence events
        socket.on('user:online', (data) => {
            const { userId } = data;
            setOnlineUsers(prev => new Set([...prev, userId]));
            onUserStatusRef.current?.({ userId, status: 'online' });
        });
        
        socket.on('user:offline', (data) => {
            const { userId } = data;
            setOnlineUsers(prev => {
                const newSet = new Set(prev);
                newSet.delete(userId);
                return newSet;
            });
            onUserStatusRef.current?.({ userId, status: 'offline' });
        });
        
        socket.on('presence:sync', (data) => {
            // Sync online users list
            if (data.onlineUsers) {
                setOnlineUsers(new Set(data.onlineUsers));
            }
        });
        
        // Channel events
        socket.on('channel:message', (data) => {
            console.log('[JashSync Socket] Channel message:', data);
            onMessageRef.current?.(data);
        });
        
        socket.on('channel:joined', (data) => {
            console.log('[JashSync Socket] User joined channel:', data);
        });
        
        socket.on('channel:left', (data) => {
            console.log('[JashSync Socket] User left channel:', data);
        });
        
        // Broadcast events
        socket.on('broadcast:new', (data) => {
            console.log('[JashSync Socket] New broadcast:', data);
            onMessageRef.current?.({ ...data, type: 'broadcast' });
        });
        
        // Error handling
        socket.on('error', (error) => {
            console.error('[JashSync Socket] Server error:', error);
            setConnectionError(error.message || 'Server error');
        });
        
        socketRef.current = socket;
        
        return socket;
    }, [user?.id, organizationId, selectedBranch?.id, currentSessionId]);
    
    /**
     * Disconnect from WebSocket
     */
    const disconnect = useCallback(() => {
        if (socketRef.current) {
            console.log('[JashSync Socket] Disconnecting...');
            socketRef.current.disconnect();
            socketRef.current = null;
            setConnected(false);
        }
    }, []);
    
    /**
     * Join a conversation/channel room
     * @param {string} roomId - Room ID (conversation or channel)
     * @param {string} roomType - 'conversation' | 'channel'
     */
    const joinRoom = useCallback((roomId, roomType = 'conversation') => {
        if (!socketRef.current?.connected) {
            console.warn('[JashSync Socket] Cannot join room - not connected');
            return;
        }
        
        console.log('[JashSync Socket] Joining room:', roomId, roomType);
        socketRef.current.emit('room:join', { roomId, roomType });
    }, []);
    
    /**
     * Leave a room
     * @param {string} roomId - Room ID
     */
    const leaveRoom = useCallback((roomId) => {
        if (!socketRef.current?.connected) return;
        
        console.log('[JashSync Socket] Leaving room:', roomId);
        socketRef.current.emit('room:leave', { roomId });
    }, []);
    
    /**
     * Send a message via WebSocket
     * @param {Object} message - Message data
     * @param {string} message.roomId - Target room
     * @param {string} message.content - Message content
     * @param {string} message.type - Message type (text, image, etc.)
     */
    const sendMessage = useCallback((message) => {
        if (!socketRef.current?.connected) {
            console.warn('[JashSync Socket] Cannot send message - not connected');
            return false;
        }
        
        socketRef.current.emit('message:send', {
            ...message,
            senderId: user?.id,
            organizationId,
            timestamp: new Date().toISOString()
        });
        
        return true;
    }, [user?.id, organizationId]);
    
    /**
     * Send typing indicator
     * @param {string} roomId - Room ID
     * @param {boolean} isTyping - Whether user is typing
     */
    const sendTyping = useCallback((roomId, isTyping) => {
        if (!socketRef.current?.connected) return;
        
        socketRef.current.emit(isTyping ? 'typing:start' : 'typing:stop', {
            roomId,
            userId: user?.id,
            userName: user?.user_metadata?.name || 'Unknown'
        });
    }, [user?.id, user?.user_metadata?.name]);
    
    /**
     * Mark messages as read
     * @param {string} roomId - Room ID
     * @param {string[]} messageIds - Message IDs to mark as read
     */
    const markAsRead = useCallback((roomId, messageIds) => {
        if (!socketRef.current?.connected) return;
        
        socketRef.current.emit('message:read', {
            roomId,
            messageIds,
            readBy: user?.id,
            readAt: new Date().toISOString()
        });
    }, [user?.id]);
    
    /**
     * Subscribe to a channel
     * @param {string} channelId - Channel ID
     */
    const subscribeChannel = useCallback((channelId) => {
        if (!socketRef.current?.connected) return;
        
        socketRef.current.emit('channel:subscribe', {
            channelId,
            userId: user?.id
        });
    }, [user?.id]);
    
    /**
     * Unsubscribe from a channel
     * @param {string} channelId - Channel ID
     */
    const unsubscribeChannel = useCallback((channelId) => {
        if (!socketRef.current?.connected) return;
        
        socketRef.current.emit('channel:unsubscribe', {
            channelId,
            userId: user?.id
        });
    }, [user?.id]);
    
    /**
     * Get typing users for a room
     * @param {string} roomId - Room ID
     * @returns {Array} List of typing users
     */
    const getTypingUsersForRoom = useCallback((roomId) => {
        if (!typingUsers.has(roomId)) return [];
        
        const now = Date.now();
        const typingTimeout = 5000; // 5 seconds timeout
        
        return Array.from(typingUsers.get(roomId).entries())
            .filter(([_, data]) => now - data.timestamp < typingTimeout)
            .map(([userId, data]) => ({ userId, ...data }));
    }, [typingUsers]);
    
    /**
     * Check if a user is online
     * @param {string} userId - User ID
     * @returns {boolean}
     */
    const isUserOnline = useCallback((userId) => {
        return onlineUsers.has(userId);
    }, [onlineUsers]);
    
    // Auto-connect on mount (if enabled)
    useEffect(() => {
        if (options.autoConnect !== false && user?.id && organizationId) {
            connect();
        }
        
        // Cleanup on unmount
        return () => {
            disconnect();
        };
    }, [user?.id, organizationId]); // Don't include connect/disconnect in deps
    
    // Clear stale typing indicators
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            const typingTimeout = 5000;
            
            setTypingUsers(prev => {
                const newMap = new Map();
                
                prev.forEach((users, roomId) => {
                    const activeUsers = new Map();
                    users.forEach((data, userId) => {
                        if (now - data.timestamp < typingTimeout) {
                            activeUsers.set(userId, data);
                        }
                    });
                    
                    if (activeUsers.size > 0) {
                        newMap.set(roomId, activeUsers);
                    }
                });
                
                return newMap;
            });
        }, 3000);
        
        return () => clearInterval(interval);
    }, []);
    
    return {
        // Connection state
        connected,
        connectionError,
        socket: socketRef.current,
        
        // Connection methods
        connect,
        disconnect,
        
        // Room methods
        joinRoom,
        leaveRoom,
        
        // Messaging methods
        sendMessage,
        sendTyping,
        markAsRead,
        
        // Channel methods
        subscribeChannel,
        unsubscribeChannel,
        
        // Presence
        onlineUsers: Array.from(onlineUsers),
        isUserOnline,
        
        // Typing
        typingUsers,
        getTypingUsersForRoom
    };
};

export default useJashSyncSocket;
