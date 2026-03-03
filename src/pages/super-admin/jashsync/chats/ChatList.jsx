import React, { useState, useEffect, useMemo } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
    Search, Plus, Users, Filter, Pin, Archive, 
    Check, CheckCheck, Clock, MessageCircle, Bell, BellOff
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate, getRelativeDate } from "@/utils/dateUtils";
import api from "@/services/api";
import { useJashSyncSocket } from "@/contexts/JashSyncSocketContext";

/**
 * ChatList - Left panel showing all conversations
 * WhatsApp-style chat list with real-time updates
 */
const ChatList = ({ 
    onSelectChat, 
    selectedChatId, 
    onNewChat, 
    className 
}) => {
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all'); // all, unread, pinned, archived
    
    const { isConnected, onlineUsers, on, off } = useJashSyncSocket();
    
    // Fetch conversations
    useEffect(() => {
        const fetchConversations = async () => {
            try {
                setLoading(true);
                const response = await api.get('/jashsync/conversations');
                setConversations(response.data || []);
            } catch (error) {
                console.error('Failed to fetch conversations:', error);
            } finally {
                setLoading(false);
            }
        };
        
        fetchConversations();
    }, []);
    
    // Real-time updates
    useEffect(() => {
        if (!isConnected) return;
        
        const handleNewMessage = (data) => {
            setConversations(prev => {
                const idx = prev.findIndex(c => c.id === data.conversationId);
                if (idx > -1) {
                    const updated = [...prev];
                    updated[idx] = {
                        ...updated[idx],
                        last_message_text: data.message.content,
                        last_message_at: data.message.created_at,
                        unread_count: (updated[idx].unread_count || 0) + 1
                    };
                    // Move to top
                    const [item] = updated.splice(idx, 1);
                    return [item, ...updated];
                }
                return prev;
            });
        };
        
        on('new_message', handleNewMessage);
        
        return () => {
            off('new_message', handleNewMessage);
        };
    }, [isConnected, on, off]);
    
    // Filter and search conversations
    const filteredConversations = useMemo(() => {
        let result = [...conversations];
        
        // Apply filter
        switch (filter) {
            case 'unread':
                result = result.filter(c => c.unread_count > 0);
                break;
            case 'pinned':
                result = result.filter(c => c.is_pinned);
                break;
            case 'archived':
                result = result.filter(c => c.is_archived);
                break;
            default:
                result = result.filter(c => !c.is_archived);
        }
        
        // Apply search
        if (search.trim()) {
            const query = search.toLowerCase();
            result = result.filter(c => 
                c.name?.toLowerCase().includes(query) ||
                c.last_message_text?.toLowerCase().includes(query)
            );
        }
        
        // Sort: pinned first, then by last message
        return result.sort((a, b) => {
            if (a.is_pinned && !b.is_pinned) return -1;
            if (!a.is_pinned && b.is_pinned) return 1;
            return new Date(b.last_message_at || 0) - new Date(a.last_message_at || 0);
        });
    }, [conversations, filter, search]);
    
    // Check if user is online
    const isUserOnline = (userId) => onlineUsers.some(u => u.userId === userId);
    
    // Get display name for conversation
    const getDisplayName = (conv) => {
        if (conv.type === 'group') return conv.name;
        // For 1:1, show other person's name
        const otherMember = conv.members?.find(m => !m.is_current_user);
        return otherMember?.name || otherMember?.email || conv.name || 'Unknown';
    };
    
    // Get avatar for conversation
    const getAvatar = (conv) => {
        if (conv.type === 'group') return conv.avatar_url;
        const otherMember = conv.members?.find(m => !m.is_current_user);
        return otherMember?.avatar_url;
    };
    
    // Get initials
    const getInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };
    
    // Format time
    const formatTime = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now - date;
        
        // Less than 24 hours
        if (diff < 86400000) {
            return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        }
        // Less than a week
        if (diff < 604800000) {
            return date.toLocaleDateString('en-US', { weekday: 'short' });
        }
        // Otherwise show date
        return formatDate(dateStr);
    };
    
    // Message status icon
    const MessageStatus = ({ status }) => {
        switch (status) {
            case 'read':
                return <CheckCheck className="h-3.5 w-3.5 text-blue-400" />;
            case 'delivered':
                return <CheckCheck className="h-3.5 w-3.5 text-gray-400" />;
            case 'sent':
                return <Check className="h-3.5 w-3.5 text-gray-400" />;
            default:
                return <Clock className="h-3.5 w-3.5 text-gray-500" />;
        }
    };
    
    return (
        <div className={cn("h-full flex flex-col bg-white/50 dark:bg-gray-900/50 border-r border-gray-200 dark:border-gray-700/50", className)}>
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700/50">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <MessageCircle className="h-5 w-5 text-purple-400" />
                        Chats
                        {isConnected && (
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        )}
                    </h2>
                    <Button 
                        size="sm" 
                        onClick={onNewChat}
                        className="bg-purple-600 hover:bg-purple-700"
                    >
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
                
                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search conversations..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 bg-gray-100/50 dark:bg-gray-800/50 border-gray-300 dark:border-gray-700"
                    />
                </div>
                
                {/* Filter tabs */}
                <div className="flex gap-1 mt-3">
                    {[
                        { key: 'all', label: 'All' },
                        { key: 'unread', label: 'Unread' },
                        { key: 'pinned', label: 'Pinned', icon: Pin },
                        { key: 'archived', label: 'Archived', icon: Archive }
                    ].map(({ key, label, icon: Icon }) => (
                        <Button
                            key={key}
                            size="sm"
                            variant={filter === key ? 'secondary' : 'ghost'}
                            onClick={() => setFilter(key)}
                            className="text-xs h-7 px-2"
                        >
                            {Icon && <Icon className="h-3 w-3 mr-1" />}
                            {label}
                        </Button>
                    ))}
                </div>
            </div>
            
            {/* Conversation List */}
            <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                    {loading ? (
                        // Loading skeletons
                        [...Array(5)].map((_, i) => (
                            <div key={i} className="p-3 rounded-lg bg-gray-100/50 dark:bg-gray-800/50 animate-pulse">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-700" />
                                    <div className="flex-1">
                                        <div className="h-4 w-28 bg-gray-300 dark:bg-gray-700 rounded mb-2" />
                                        <div className="h-3 w-40 bg-gray-200 dark:bg-gray-700/50 rounded" />
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : filteredConversations.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                            <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p className="text-sm">
                                {search ? 'No conversations match your search' : 'No conversations yet'}
                            </p>
                            <Button 
                                variant="ghost" 
                                onClick={onNewChat}
                                className="mt-2 text-purple-400"
                            >
                                Start a new chat
                            </Button>
                        </div>
                    ) : (
                        filteredConversations.map((conv) => {
                            const isSelected = conv.id === selectedChatId;
                            const displayName = getDisplayName(conv);
                            const avatar = getAvatar(conv);
                            const otherUserId = conv.members?.find(m => !m.is_current_user)?.user_id;
                            const online = conv.type !== 'group' && isUserOnline(otherUserId);
                            
                            return (
                                <div
                                    key={conv.id}
                                    onClick={() => onSelectChat(conv)}
                                    className={cn(
                                        "p-3 rounded-lg cursor-pointer transition-all",
                                        "hover:bg-gray-100 dark:hover:bg-gray-800/70",
                                        isSelected 
                                            ? "bg-purple-100 dark:bg-purple-600/20 border border-purple-300 dark:border-purple-500/30" 
                                            : "bg-gray-50 dark:bg-gray-800/30"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        {/* Avatar */}
                                        <div className="relative">
                                            <Avatar className="h-12 w-12 border-2 border-gray-200 dark:border-gray-700">
                                                <AvatarImage src={avatar} />
                                                <AvatarFallback className="bg-purple-600/30 text-purple-300">
                                                    {conv.type === 'group' ? (
                                                        <Users className="h-5 w-5" />
                                                    ) : (
                                                        getInitials(displayName)
                                                    )}
                                                </AvatarFallback>
                                            </Avatar>
                                            {/* Online indicator */}
                                            {online && (
                                                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full" />
                                            )}
                                        </div>
                                        
                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-0.5">
                                                <span className="font-medium text-gray-900 dark:text-white truncate flex items-center gap-1">
                                                    {conv.is_pinned && <Pin className="h-3 w-3 text-yellow-500" />}
                                                    {displayName}
                                                </span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0 ml-2">
                                                    {formatTime(conv.last_message_at)}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 truncate">
                                                    {conv.is_me_sender && (
                                                        <MessageStatus status={conv.last_message_status} />
                                                    )}
                                                    <span className="truncate">
                                                        {conv.last_message_text || 'Start a conversation'}
                                                    </span>
                                                </div>
                                                {conv.unread_count > 0 && (
                                                    <Badge 
                                                        variant="default"
                                                        className="bg-purple-600 text-white h-5 min-w-5 flex items-center justify-center text-xs shrink-0 ml-2"
                                                    >
                                                        {conv.unread_count > 99 ? '99+' : conv.unread_count}
                                                    </Badge>
                                                )}
                                                {conv.is_muted && (
                                                    <BellOff className="h-3.5 w-3.5 text-gray-500 ml-1" />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </ScrollArea>
        </div>
    );
};

export default ChatList;
