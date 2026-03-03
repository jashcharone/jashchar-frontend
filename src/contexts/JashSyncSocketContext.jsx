/**
 * JASHSYNC SOCKET CONTEXT
 * ═══════════════════════════════════════════════════════════════════════════
 * React Context for JashSync WebSocket connection
 * 
 * Features:
 * - Auto connect/reconnect
 * - Room management
 * - Message events
 * - Typing indicators
 * - Online status tracking
 * ═══════════════════════════════════════════════════════════════════════════
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './SupabaseAuthContext';
import { useBranch } from './BranchContext';

// Socket context
const JashSyncSocketContext = createContext(null);

// Socket connection states
export const ConnectionState = {
    DISCONNECTED: 'disconnected',
    CONNECTING: 'connecting',
    CONNECTED: 'connected',
    ERROR: 'error'
};

/**
 * JashSync Socket Provider Component
 */
export function JashSyncSocketProvider({ children }) {
    const { user, currentSessionId, organizationId, token } = useAuth();
    const { selectedBranch } = useBranch();
    
    const [socket, setSocket] = useState(null);
    const [connectionState, setConnectionState] = useState(ConnectionState.DISCONNECTED);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [typingUsers, setTypingUsers] = useState({}); // { conversationId: [userId1, userId2] }
    const [unreadCount, setUnreadCount] = useState(0);
    
    const socketRef = useRef(null);
    const reconnectAttempts = useRef(0);
    const maxReconnectAttempts = 5;
    
    // Get socket URL from environment or default
    const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    
    /**
     * Initialize socket connection
     */
    const connect = useCallback(() => {
        if (!user?.id || !organizationId) {
            console.log('JashSync Socket: Missing auth data, skipping connection');
            return;
        }
        
        if (socketRef.current?.connected) {
            console.log('JashSync Socket: Already connected');
            return;
        }
        
        console.log('JashSync Socket: Connecting to', socketUrl);
        setConnectionState(ConnectionState.CONNECTING);
        
        const newSocket = io(`${socketUrl}/jashsync`, {
            auth: {
                token,
                userId: user.id,
                organizationId,
                branchId: selectedBranch?.id,
                sessionId: currentSessionId
            },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: maxReconnectAttempts,
            timeout: 20000
        });
        
        // Connection events
        newSocket.on('connect', () => {
            console.log('✅ JashSync Socket: Connected', newSocket.id);
            setConnectionState(ConnectionState.CONNECTED);
            reconnectAttempts.current = 0;
            
            // Request online users list
            newSocket.emit('get_online_users');
        });
        
        newSocket.on('disconnect', (reason) => {
            console.log('🔌 JashSync Socket: Disconnected -', reason);
            setConnectionState(ConnectionState.DISCONNECTED);
        });
        
        newSocket.on('connect_error', (error) => {
            console.error('❌ JashSync Socket: Connection error', error.message);
            setConnectionState(ConnectionState.ERROR);
            reconnectAttempts.current++;
            
            if (reconnectAttempts.current >= maxReconnectAttempts) {
                console.log('JashSync Socket: Max reconnect attempts reached');
            }
        });
        
        // Online users
        newSocket.on('online_users', (users) => {
            setOnlineUsers(users);
        });
        
        newSocket.on('user_status_change', ({ userId, status }) => {
            setOnlineUsers(prev => {
                if (status === 'online') {
                    return prev.find(u => u.userId === userId) 
                        ? prev 
                        : [...prev, { userId, connectedAt: new Date() }];
                } else {
                    return prev.filter(u => u.userId !== userId);
                }
            });
        });
        
        // Typing indicators
        newSocket.on('user_typing', ({ conversationId, userId, isTyping }) => {
            setTypingUsers(prev => {
                const current = prev[conversationId] || [];
                if (isTyping) {
                    return {
                        ...prev,
                        [conversationId]: current.includes(userId) ? current : [...current, userId]
                    };
                } else {
                    return {
                        ...prev,
                        [conversationId]: current.filter(id => id !== userId)
                    };
                }
            });
        });
        
        socketRef.current = newSocket;
        setSocket(newSocket);
        
    }, [user?.id, organizationId, selectedBranch?.id, currentSessionId, token, socketUrl]);
    
    /**
     * Disconnect socket
     */
    const disconnect = useCallback(() => {
        if (socketRef.current) {
            console.log('JashSync Socket: Disconnecting...');
            socketRef.current.disconnect();
            socketRef.current = null;
            setSocket(null);
            setConnectionState(ConnectionState.DISCONNECTED);
        }
    }, []);
    
    /**
     * Join a conversation room
     */
    const joinConversation = useCallback((conversationId) => {
        if (socketRef.current?.connected) {
            socketRef.current.emit('join_room', conversationId);
        }
    }, []);
    
    /**
     * Leave a conversation room
     */
    const leaveConversation = useCallback((conversationId) => {
        if (socketRef.current?.connected) {
            socketRef.current.emit('leave_room', conversationId);
        }
    }, []);
    
    /**
     * Join a channel room
     */
    const joinChannel = useCallback((channelId) => {
        if (socketRef.current?.connected) {
            socketRef.current.emit('join_channel', channelId);
        }
    }, []);
    
    /**
     * Send message through socket
     */
    const sendMessage = useCallback((conversationId, message) => {
        if (socketRef.current?.connected) {
            socketRef.current.emit('send_message', { conversationId, message });
        }
    }, []);
    
    /**
     * Mark message as delivered
     */
    const markDelivered = useCallback((conversationId, messageId, senderId) => {
        if (socketRef.current?.connected) {
            socketRef.current.emit('message_delivered', { conversationId, messageId, senderId });
        }
    }, []);
    
    /**
     * Mark message as read
     */
    const markRead = useCallback((conversationId, messageId, senderId) => {
        if (socketRef.current?.connected) {
            socketRef.current.emit('message_read', { conversationId, messageId, senderId });
        }
    }, []);
    
    /**
     * Mark all messages in conversation as read
     */
    const markAllRead = useCallback((conversationId) => {
        if (socketRef.current?.connected) {
            socketRef.current.emit('mark_all_read', { conversationId });
        }
    }, []);
    
    /**
     * Send typing start indicator
     */
    const startTyping = useCallback((conversationId) => {
        if (socketRef.current?.connected) {
            socketRef.current.emit('typing_start', { conversationId });
        }
    }, []);
    
    /**
     * Send typing stop indicator
     */
    const stopTyping = useCallback((conversationId) => {
        if (socketRef.current?.connected) {
            socketRef.current.emit('typing_stop', { conversationId });
        }
    }, []);
    
    /**
     * Check if user is online
     */
    const isUserOnline = useCallback((userId) => {
        return onlineUsers.some(u => u.userId === userId);
    }, [onlineUsers]);
    
    /**
     * Subscribe to socket events
     */
    const on = useCallback((event, callback) => {
        if (socketRef.current) {
            socketRef.current.on(event, callback);
        }
    }, []);
    
    /**
     * Unsubscribe from socket events
     */
    const off = useCallback((event, callback) => {
        if (socketRef.current) {
            socketRef.current.off(event, callback);
        }
    }, []);
    
    // Auto connect when auth is available
    useEffect(() => {
        if (user?.id && organizationId) {
            connect();
        }
        
        return () => {
            disconnect();
        };
    }, [user?.id, organizationId, connect, disconnect]);
    
    // Context value
    const value = {
        // State
        socket,
        isConnected: connectionState === ConnectionState.CONNECTED,
        connectionState,
        onlineUsers,
        typingUsers,
        unreadCount,
        
        // Connection methods
        connect,
        disconnect,
        
        // Room methods
        joinConversation,
        leaveConversation,
        joinChannel,
        
        // Message methods
        sendMessage,
        markDelivered,
        markRead,
        markAllRead,
        
        // Typing methods
        startTyping,
        stopTyping,
        
        // Status methods
        isUserOnline,
        
        // Event subscription
        on,
        off,
        
        // Unread management
        setUnreadCount
    };
    
    return (
        <JashSyncSocketContext.Provider value={value}>
            {children}
        </JashSyncSocketContext.Provider>
    );
}

/**
 * Custom hook to use JashSync socket context
 */
export function useJashSyncSocket() {
    const context = useContext(JashSyncSocketContext);
    if (!context) {
        throw new Error('useJashSyncSocket must be used within JashSyncSocketProvider');
    }
    return context;
}

/**
 * Custom hook for conversation-level socket operations
 * Auto joins/leaves room on mount/unmount
 */
export function useConversationSocket(conversationId) {
    const socket = useJashSyncSocket();
    const [messages, setMessages] = useState([]);
    
    useEffect(() => {
        if (!conversationId || !socket.isConnected) return;
        
        // Join room
        socket.joinConversation(conversationId);
        
        // Listen for new messages
        const handleNewMessage = (data) => {
            if (data.conversationId === conversationId) {
                setMessages(prev => [...prev, data.message]);
            }
        };
        
        socket.on('new_message', handleNewMessage);
        
        // Cleanup
        return () => {
            socket.leaveConversation(conversationId);
            socket.off('new_message', handleNewMessage);
        };
    }, [conversationId, socket.isConnected]);
    
    return {
        ...socket,
        messages,
        clearMessages: () => setMessages([]),
        typingUsers: socket.typingUsers[conversationId] || []
    };
}

/**
 * Custom hook for channel-level socket operations
 */
export function useChannelSocket(channelId) {
    const socket = useJashSyncSocket();
    const [broadcasts, setBroadcasts] = useState([]);
    
    useEffect(() => {
        if (!channelId || !socket.isConnected) return;
        
        // Join channel
        socket.joinChannel(channelId);
        
        // Listen for new broadcasts
        const handleNewBroadcast = (data) => {
            if (data.channelId === channelId) {
                setBroadcasts(prev => [data, ...prev]);
            }
        };
        
        socket.on('new_broadcast', handleNewBroadcast);
        
        // Cleanup
        return () => {
            socket.off('new_broadcast', handleNewBroadcast);
        };
    }, [channelId, socket.isConnected]);
    
    return {
        ...socket,
        broadcasts,
        clearBroadcasts: () => setBroadcasts([])
    };
}

export default JashSyncSocketContext;
