import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
    Send, Paperclip, Smile, Mic, MoreVertical, Phone, Video,
    Search, ArrowLeft, Check, CheckCheck, Clock, Image, File,
    Pin, Trash2, Copy, Forward, Reply, X, Download
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import api from "@/services/api";
import { useJashSyncSocket } from "@/contexts/JashSyncSocketContext";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { formatDate } from "@/utils/dateUtils";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";

/**
 * ChatWindow - Main chat display with messages and input
 * WhatsApp-style messaging experience
 */
const ChatWindow = ({ 
    conversation, 
    onBack, // For mobile view
    onClose,
    className 
}) => {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [typingUsers, setTypingUsers] = useState([]);
    const [replyTo, setReplyTo] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1);
    
    const messagesEndRef = useRef(null);
    const scrollAreaRef = useRef(null);
    
    const { 
        isConnected, 
        joinConversation, 
        leaveConversation,
        markAllRead,
        startTyping,
        stopTyping,
        on, 
        off 
    } = useJashSyncSocket();
    
    // Fetch messages
    const fetchMessages = useCallback(async (pageNum = 1) => {
        if (!conversation?.id) return;
        
        try {
            setLoading(true);
            const response = await api.get(`/jashsync/conversations/${conversation.id}/messages`, {
                params: { page: pageNum, limit: 50 }
            });
            
            const newMessages = response.data || [];
            
            if (pageNum === 1) {
                setMessages(newMessages);
            } else {
                setMessages(prev => [...newMessages, ...prev]);
            }
            
            setHasMore(newMessages.length === 50);
        } catch (error) {
            console.error('Failed to fetch messages:', error);
        } finally {
            setLoading(false);
        }
    }, [conversation?.id]);
    
    // Initial load and join room
    useEffect(() => {
        if (conversation?.id) {
            fetchMessages(1);
            setPage(1);
            
            // Join WebSocket room
            if (isConnected) {
                joinConversation(conversation.id);
                markAllRead(conversation.id);
            }
        }
        
        return () => {
            if (conversation?.id && isConnected) {
                leaveConversation(conversation.id);
            }
        };
    }, [conversation?.id, isConnected]);
    
    // Real-time message updates
    useEffect(() => {
        if (!isConnected || !conversation?.id) return;
        
        const handleNewMessage = (data) => {
            if (data.conversationId === conversation.id) {
                // Prevent duplicate messages by checking if already exists
                setMessages(prev => {
                    const exists = prev.some(m => m.id === data.message?.id);
                    if (exists) return prev;
                    return [...prev, data.message];
                });
                // Auto-mark as read since we're viewing
                markAllRead(conversation.id);
                scrollToBottom();
            }
        };
        
        const handleTyping = (data) => {
            if (data.conversationId === conversation.id && data.userId !== user?.id) {
                setTypingUsers(prev => {
                    if (data.isTyping) {
                        return prev.includes(data.userId) ? prev : [...prev, data.userId];
                    } else {
                        return prev.filter(id => id !== data.userId);
                    }
                });
            }
        };
        
        const handleMessageDeleted = (data) => {
            if (data.conversationId === conversation.id) {
                setMessages(prev => 
                    prev.map(m => m.id === data.messageId 
                        ? { ...m, deleted_at: new Date().toISOString(), content: 'This message was deleted' }
                        : m
                    )
                );
            }
        };
        
        const handleMessageRead = (data) => {
            if (data.conversationId === conversation.id) {
                setMessages(prev => 
                    prev.map(m => ({ ...m, status: 'read' }))
                );
            }
        };
        
        on('new_message', handleNewMessage);
        on('user_typing', handleTyping);
        on('message_deleted', handleMessageDeleted);
        on('messages_read', handleMessageRead);
        
        return () => {
            off('new_message', handleNewMessage);
            off('user_typing', handleTyping);
            off('message_deleted', handleMessageDeleted);
            off('messages_read', handleMessageRead);
        };
    }, [isConnected, conversation?.id, user?.id]);
    
    // Scroll to bottom
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);
    
    // Scroll to bottom on initial messages
    useEffect(() => {
        if (messages.length > 0 && page === 1) {
            scrollToBottom();
        }
    }, [messages, page]);
    
    // Load more messages
    const loadMore = useCallback(() => {
        if (!loading && hasMore) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchMessages(nextPage);
        }
    }, [loading, hasMore, page, fetchMessages]);
    
    // Send message
    const handleSendMessage = async (content, type = 'text', media = null) => {
        if (!content?.trim() && !media) return;
        if (!conversation?.id) return;
        
        try {
            setSending(true);
            
            const payload = {
                content: content?.trim(),
                content_type: type, // Changed from message_type to content_type
                ...(media && {
                    media_url: media.url,
                    media_thumbnail_url: media.thumbnail,
                    media_filename: media.filename,
                    media_size: media.size
                }),
                ...(replyTo && { reply_to_id: replyTo.id })
            };
            
            const message = await api.post(
                `/jashsync/conversations/${conversation.id}/messages`,
                payload
            );
            
            // Add to local messages immediately (api.post returns data directly)
            // Prevent duplicate by checking if ID already exists
            if (message?.id) {
                setMessages(prev => {
                    const exists = prev.some(m => m.id === message.id);
                    if (exists) return prev;
                    return [...prev, message];
                });
            }
            scrollToBottom();
            setReplyTo(null);
            
        } catch (error) {
            console.error('Failed to send message:', error);
        } finally {
            setSending(false);
        }
    };
    
    // Delete message
    const handleDeleteMessage = async (messageId) => {
        try {
            await api.delete(`/jashsync/messages/${messageId}`, {
                data: { forEveryone: true }
            });
        } catch (error) {
            console.error('Failed to delete message:', error);
        }
    };
    
    // Get display info
    const getDisplayName = () => {
        if (conversation?.type === 'group') return conversation.name;
        const otherMember = conversation?.members?.find(m => m.user_id !== user?.id);
        return otherMember?.name || otherMember?.email || 'Unknown';
    };
    
    const getAvatar = () => {
        if (conversation?.type === 'group') return conversation.avatar_url;
        const otherMember = conversation?.members?.find(m => m.user_id !== user?.id);
        return otherMember?.avatar_url;
    };
    
    const getOnlineStatus = () => {
        // TODO: Get from onlineUsers
        return 'Online';
    };
    
    // Group messages by date
    const groupMessagesByDate = useCallback(() => {
        const groups = [];
        let currentDate = null;
        let currentGroup = [];
        
        messages.forEach(msg => {
            if (!msg || !msg.created_at) return; // Skip invalid messages
            const msgDate = new Date(msg.created_at).toDateString();
            
            if (msgDate !== currentDate) {
                if (currentGroup.length > 0) {
                    groups.push({ date: currentDate, messages: currentGroup });
                }
                currentDate = msgDate;
                currentGroup = [msg];
            } else {
                currentGroup.push(msg);
            }
        });
        
        if (currentGroup.length > 0) {
            groups.push({ date: currentDate, messages: currentGroup });
        }
        
        return groups;
    }, [messages]);
    
    // Format date label
    const formatDateLabel = (dateStr) => {
        const date = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (date.toDateString() === today.toDateString()) return 'Today';
        if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
        return formatDate(dateStr);
    };
    
    // No conversation selected
    if (!conversation) {
        return (
            <div className={cn("h-full flex flex-col bg-gray-50/30 dark:bg-gray-900/30", className)}>
                <div className="flex-1 flex items-center justify-center p-8">
                    <div className="text-center">
                        <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-600/20 to-blue-600/20 flex items-center justify-center">
                            <Send className="w-10 h-10 text-purple-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">JashSync Messaging</h3>
                        <p className="text-gray-500 dark:text-gray-400 max-w-sm">
                            Select a conversation from the left panel to start messaging or create a new chat.
                        </p>
                    </div>
                </div>
            </div>
        );
    }
    
    const messageGroups = groupMessagesByDate();
    
    return (
        <div className={cn("h-full flex flex-col bg-gray-50/30 dark:bg-gray-900/30", className)}>
            {/* Chat Header */}
            <div className="p-3 border-b border-gray-200 dark:border-gray-700/50 flex items-center gap-3 bg-white/50 dark:bg-gray-900/50">
                {/* Back button for mobile */}
                {onBack && (
                    <Button variant="ghost" size="icon" onClick={onBack} className="lg:hidden">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                )}
                
                {/* Avatar */}
                <Avatar className="h-10 w-10 border-2 border-gray-200 dark:border-gray-700">
                    <AvatarImage src={getAvatar()} />
                    <AvatarFallback className="bg-purple-600/30 text-purple-300">
                        {getDisplayName()?.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                
                {/* Name and status */}
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">{getDisplayName()}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        {typingUsers.length > 0 ? (
                            <span className="text-green-400">typing...</span>
                        ) : (
                            getOnlineStatus()
                        )}
                    </p>
                </div>
                
                {/* Actions */}
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                        <Phone className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                        <Video className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                        <Search className="h-5 w-5" />
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                                <MoreVertical className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                            <DropdownMenuItem className="text-gray-900 dark:text-white">
                                <Pin className="h-4 w-4 mr-2" /> Pin chat
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-gray-900 dark:text-white">
                                <Image className="h-4 w-4 mr-2" /> Media & files
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-500 dark:text-red-400">
                                <Trash2 className="h-4 w-4 mr-2" /> Delete chat
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
            
            {/* Messages Area */}
            <ScrollArea 
                ref={scrollAreaRef}
                className="flex-1 p-4"
                onScroll={(e) => {
                    // Load more when scrolled to top
                    if (e.target.scrollTop === 0 && hasMore && !loading) {
                        loadMore();
                    }
                }}
            >
                {/* Loading indicator */}
                {loading && page > 1 && (
                    <div className="text-center py-2">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Loading earlier messages...</span>
                    </div>
                )}
                
                {/* Message groups */}
                {messageGroups.map((group, groupIdx) => (
                    <div key={groupIdx}>
                        {/* Date separator */}
                        <div className="flex justify-center my-4">
                            <span className="px-3 py-1 bg-gray-200/80 dark:bg-gray-800/80 rounded-full text-xs text-gray-600 dark:text-gray-400">
                                {formatDateLabel(group.date)}
                            </span>
                        </div>
                        
                        {/* Messages */}
                        {group.messages.map((message, msgIdx) => {
                            const isOwn = message.sender_id === user?.id;
                            const showAvatar = !isOwn && (
                                msgIdx === group.messages.length - 1 ||
                                group.messages[msgIdx + 1]?.sender_id !== message.sender_id
                            );
                            
                            return (
                                <MessageBubble
                                    key={message.id}
                                    message={message}
                                    isOwn={isOwn}
                                    showAvatar={showAvatar}
                                    onReply={() => setReplyTo(message)}
                                    onDelete={() => handleDeleteMessage(message.id)}
                                />
                            );
                        })}
                    </div>
                ))}
                
                {/* Typing indicator */}
                {typingUsers.length > 0 && (
                    <div className="flex items-center gap-2 ml-12 mt-2">
                        <div className="bg-gray-200 dark:bg-gray-800 rounded-2xl px-4 py-2">
                            <div className="flex gap-1">
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    </div>
                )}
                
                <div ref={messagesEndRef} />
            </ScrollArea>
            
            {/* Reply preview */}
            {replyTo && (
                <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700/50 bg-gray-100/50 dark:bg-gray-800/50 flex items-center gap-2">
                    <div className="w-1 h-10 bg-purple-500 rounded-full" />
                    <div className="flex-1 min-w-0">
                        <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">{replyTo.sender?.name || 'Message'}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{replyTo.content}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setReplyTo(null)}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            )}
            
            {/* Message Input */}
            <MessageInput
                onSend={handleSendMessage}
                onTypingStart={() => startTyping(conversation.id)}
                onTypingStop={() => stopTyping(conversation.id)}
                disabled={sending}
                replyTo={replyTo}
            />
        </div>
    );
};

export default ChatWindow;
