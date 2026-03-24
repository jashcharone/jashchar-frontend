import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { formatDateWithMonthName } from '@/utils/dateUtils';
import { 
    Hash, Users, Settings, Pin, ArrowLeft, Send, Smile, 
    Paperclip, MoreVertical, Search, Bell, BellOff, 
    GraduationCap, Building2, Megaphone, Lock, Image,
    File, ChevronDown, AtSign, Reply
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import api from "@/services/api";
import { useJashSyncSocket } from "@/contexts/JashSyncSocketContext";
import { TypingIndicator, TimeAgo, OnlineStatus } from "../chats/ChatIndicators";

/**
 * ChannelWindow - Main channel view with messages
 * Shows channel messages, input, and member panel
 */
const ChannelWindow = ({ 
    channel, 
    onBack,
    className 
}) => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [sending, setSending] = useState(false);
    const [showMembers, setShowMembers] = useState(false);
    const [members, setMembers] = useState([]);
    const [typingUsers, setTypingUsers] = useState([]);
    const [replyTo, setReplyTo] = useState(null);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const { socket, isConnected, userId } = useJashSyncSocket();
    
    // Channel type icons
    const channelTypeIcons = {
        class: GraduationCap,
        department: Building2,
        announcement: Megaphone,
        private: Lock,
        public: Hash
    };
    
    // Fetch messages when channel changes
    useEffect(() => {
        if (!channel?.id) return;
        
        const fetchMessages = async () => {
            setLoading(true);
            try {
                const data = await api.get(`/jashsync/channels/${channel.id}/messages`);
                setMessages(data || []);
            } catch (error) {
                console.error('Failed to fetch channel messages:', error);
                setMessages([]);
            } finally {
                setLoading(false);
            }
        };
        
        const fetchMembers = async () => {
            try {
                const data = await api.get(`/jashsync/channels/${channel.id}/members`);
                setMembers(data || []);
            } catch (error) {
                console.error('Failed to fetch channel members:', error);
                setMembers([]);
            }
        };
        
        fetchMessages();
        fetchMembers();
        
        // Join channel room
        if (socket && isConnected) {
            socket.emit('channel:join', { channelId: channel.id });
        }
        
        return () => {
            if (socket && isConnected) {
                socket.emit('channel:leave', { channelId: channel.id });
            }
        };
    }, [channel?.id, socket, isConnected]);
    
    // Socket listeners
    useEffect(() => {
        if (!socket || !isConnected || !channel?.id) return;
        
        const handleNewMessage = (data) => {
            if (data.channelId === channel.id) {
                setMessages(prev => [...prev, data.message]);
                scrollToBottom();
            }
        };
        
        const handleTyping = (data) => {
            if (data.channelId === channel.id && data.userId !== userId) {
                setTypingUsers(prev => {
                    if (!prev.find(u => u.id === data.userId)) {
                        return [...prev, { id: data.userId, name: data.userName }];
                    }
                    return prev;
                });
                
                // Remove after 3 seconds
                setTimeout(() => {
                    setTypingUsers(prev => prev.filter(u => u.id !== data.userId));
                }, 3000);
            }
        };
        
        socket.on('channel:message', handleNewMessage);
        socket.on('channel:typing', handleTyping);
        
        return () => {
            socket.off('channel:message', handleNewMessage);
            socket.off('channel:typing', handleTyping);
        };
    }, [socket, isConnected, channel?.id, userId]);
    
    // Auto scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    
    useEffect(() => {
        scrollToBottom();
    }, [messages]);
    
    // Send message
    const handleSend = async () => {
        if (!inputValue.trim() || sending) return;
        
        setSending(true);
        try {
            const newMsg = await api.post(`/jashsync/channels/${channel.id}/messages`, {
                content: inputValue.trim(),
                content_type: 'text',
                reply_to_id: replyTo?.id
            });
            
            // Add to local messages
            if (newMsg) {
                setMessages(prev => [...prev, newMsg]);
            }
            setInputValue('');
            setReplyTo(null);
            scrollToBottom();
        } catch (error) {
            console.error('Failed to send message:', error);
        } finally {
            setSending(false);
        }
    };
    
    // Handle typing indicator
    const handleTyping = () => {
        if (socket && isConnected) {
            socket.emit('channel:typing', { channelId: channel.id });
        }
    };
    
    // Get initials
    const getInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };
    
    // Group messages by date
    const groupedMessages = useMemo(() => {
        const groups = {};
        messages.forEach(msg => {
            const msgTime = msg.timestamp || msg.created_at;
            const date = formatDateWithMonthName(msgTime);
            if (!groups[date]) groups[date] = [];
            groups[date].push(msg);
        });
        return groups;
    }, [messages]);
    
    // No channel selected
    if (!channel) {
        return (
            <div className={cn("h-full flex flex-col bg-gray-50/30 dark:bg-gray-900/30", className)}>
                <div className="flex-1 flex items-center justify-center p-8">
                    <div className="text-center">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                            <Hash className="w-8 h-8 text-gray-400 dark:text-gray-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-500 dark:text-gray-400">No channel selected</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-500 mt-1">Select a channel to view messages</p>
                    </div>
                </div>
            </div>
        );
    }
    
    const ChannelIcon = channelTypeIcons[channel.type] || Hash;
    
    return (
        <div className={cn("h-full flex flex-col bg-gray-50/30 dark:bg-gray-900/30", className)}>
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700/50 flex items-center justify-between bg-white/50 dark:bg-gray-900/50">
                <div className="flex items-center gap-3">
                    {/* Back button (mobile) */}
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={onBack}
                        className="lg:hidden"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    
                    {/* Channel icon */}
                    <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        channel.type === 'class' && "bg-blue-500/20 text-blue-400",
                        channel.type === 'announcement' && "bg-red-500/20 text-red-400",
                        channel.type === 'department' && "bg-orange-500/20 text-orange-400",
                        channel.type === 'private' && "bg-purple-500/20 text-purple-400",
                        (!channel.type || channel.type === 'public') && "bg-green-500/20 text-green-400"
                    )}>
                        <ChannelIcon className="h-5 w-5" />
                    </div>
                    
                    {/* Channel info */}
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            {channel.name}
                            {channel.isPinned && <Pin className="h-3 w-3 text-yellow-500" />}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {channel.memberCount || members.length} members
                        </p>
                    </div>
                </div>
                
                {/* Header actions */}
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                        <Search className="h-5 w-5" />
                    </Button>
                    
                    <Sheet open={showMembers} onOpenChange={setShowMembers}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                                <Users className="h-5 w-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                            <SheetHeader>
                                <SheetTitle className="text-gray-900 dark:text-white">Channel Members</SheetTitle>
                            </SheetHeader>
                            <div className="mt-4 space-y-2">
                                {members.map(member => (
                                    <div key={member.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                                        <div className="relative">
                                            <Avatar className="h-10 w-10">
                                                <AvatarImage src={member.user_avatar || member.avatar} />
                                                <AvatarFallback className="bg-purple-600/30">
                                                    {getInitials(member.user_name || member.name)}
                                                </AvatarFallback>
                                            </Avatar>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-gray-900 dark:text-white font-medium">{member.user_name || member.name || 'Unknown'}</p>
                                            <Badge variant="outline" className="text-xs">
                                                {member.role || 'member'}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </SheetContent>
                    </Sheet>
                    
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                                <MoreVertical className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                            <DropdownMenuItem>
                                <Pin className="h-4 w-4 mr-2" />
                                Pin Channel
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <BellOff className="h-4 w-4 mr-2" />
                                Mute Notifications
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
                            <DropdownMenuItem>
                                <Settings className="h-4 w-4 mr-2" />
                                Channel Settings
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
            
            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
                    </div>
                ) : (
                    <div className="space-y-4">
                        {Object.entries(groupedMessages).map(([date, msgs]) => (
                            <div key={date}>
                                {/* Date divider */}
                                <div className="flex items-center gap-4 my-4">
                                    <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                                    <span className="text-xs text-gray-600 dark:text-gray-500 px-2">{date}</span>
                                    <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                                </div>
                                
                                {/* Messages for this date */}
                                {msgs.map((msg, idx) => (
                                    <ChannelMessage 
                                        key={msg.id}
                                        message={msg}
                                        showSender={idx === 0 || msgs[idx-1]?.sender?.id !== msg.sender?.id}
                                        onReply={() => setReplyTo(msg)}
                                        isOwn={msg.sender?.id === userId}
                                    />
                                ))}
                            </div>
                        ))}
                        
                        {/* Typing indicator */}
                        {typingUsers.length > 0 && (
                            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
                                <TypingIndicator variant="inline" />
                                <span>
                                    {typingUsers.map(u => u.name).join(', ')} typing...
                                </span>
                            </div>
                        )}
                        
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </ScrollArea>
            
            {/* Reply preview */}
            {replyTo && (
                <div className="px-4 py-2 bg-gray-100/50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700/50 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                        <Reply className="h-4 w-4 text-purple-400" />
                        <span className="text-gray-500 dark:text-gray-400">Replying to</span>
                        <span className="text-gray-900 dark:text-white font-medium">{replyTo.sender?.name}</span>
                        <span className="text-gray-600 dark:text-gray-500 truncate max-w-xs">
                            {replyTo.content}
                        </span>
                    </div>
                    <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setReplyTo(null)}
                        className="text-gray-500 dark:text-gray-400"
                    >
                        ✕
                    </Button>
                </div>
            )}
            
            {/* Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700/50 bg-white/50 dark:bg-gray-900/50">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white shrink-0">
                        <Paperclip className="h-5 w-5" />
                    </Button>
                    
                    <Input
                        ref={inputRef}
                        value={inputValue}
                        onChange={(e) => {
                            setInputValue(e.target.value);
                            handleTyping();
                        }}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                        placeholder={`Message #${channel.name}`}
                        className="flex-1 bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:border-purple-500"
                    />
                    
                    <Button variant="ghost" size="icon" className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white shrink-0">
                        <Smile className="h-5 w-5" />
                    </Button>
                    
                    <Button 
                        onClick={handleSend}
                        disabled={!inputValue.trim() || sending}
                        className="bg-purple-600 hover:bg-purple-700 shrink-0"
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
};

/**
 * ChannelMessage - Individual message in channel
 */
const ChannelMessage = ({ message, showSender, onReply, isOwn }) => {
    const getInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };
    
    const getRoleColor = (role) => {
        const colors = {
            admin: 'text-red-400',
            teacher: 'text-blue-400',
            staff: 'text-orange-400',
            parent: 'text-green-400'
        };
        return colors[role] || 'text-gray-400';
    };
    
    // System message
    if (message.type === 'system') {
        return (
            <div className="flex justify-center my-2">
                <span className="text-xs text-gray-600 dark:text-gray-500 bg-gray-100/50 dark:bg-gray-800/50 px-3 py-1 rounded-full">
                    {message.content}
                </span>
            </div>
        );
    }
    
    return (
        <div className={cn("group hover:bg-gray-100/30 dark:hover:bg-gray-800/30 -mx-2 px-2 py-1 rounded-lg transition-colors")}>
            <div className="flex items-start gap-3">
                {/* Avatar */}
                {showSender ? (
                    <Avatar className="h-9 w-9 mt-1">
                        <AvatarImage src={message.sender?.avatar} />
                        <AvatarFallback className="bg-purple-600/30 text-purple-300 text-sm">
                            {getInitials(message.sender?.name)}
                        </AvatarFallback>
                    </Avatar>
                ) : (
                    <div className="w-9" /> // Spacer
                )}
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                    {/* Sender name & time */}
                    {showSender && (
                        <div className="flex items-center gap-2 mb-0.5">
                            <span className={cn("font-medium", getRoleColor(message.sender?.role))}>
                                {message.sender?.name}
                            </span>
                            <Badge variant="outline" className="text-[10px] py-0">
                                {message.sender?.role}
                            </Badge>
                            <span className="text-xs text-gray-600 dark:text-gray-500">
                                {new Date(message.timestamp || message.created_at).toLocaleTimeString('en-IN', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </span>
                        </div>
                    )}
                    
                    {/* Reply reference */}
                    {message.replyTo && (
                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-500 mb-1 pl-2 border-l-2 border-purple-500/50">
                            <Reply className="h-3 w-3" />
                            <span className="font-medium">{message.replyTo.sender}</span>
                            <span className="truncate max-w-xs">{message.replyTo.content}</span>
                        </div>
                    )}
                    
                    {/* Message content */}
                    <p className="text-gray-800 dark:text-gray-200 break-words">{message.content}</p>
                </div>
                
                {/* Actions */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7"
                        onClick={onReply}
                    >
                        <Reply className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                            <DropdownMenuItem>Copy Text</DropdownMenuItem>
                            <DropdownMenuItem>Pin Message</DropdownMenuItem>
                            {isOwn && (
                                <>
                                    <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
                                    <DropdownMenuItem className="text-red-400">Delete</DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </div>
    );
};

export default ChannelWindow;
