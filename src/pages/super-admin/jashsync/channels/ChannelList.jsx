import React, { useState, useEffect, useMemo } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    Search, Plus, Hash, Megaphone, Lock, Users, 
    Bell, BellOff, Pin, MoreVertical, GraduationCap, 
    Building2, Settings
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import api from "@/services/api";
import { useJashSyncSocket } from "@/contexts/JashSyncSocketContext";
import { UnreadBadge, TimeAgo } from "../chats/ChatIndicators";

/**
 * ChannelList - Left panel showing all channels
 * Categories: Class Channels, Department, Announcements, Custom
 */
const ChannelList = ({ 
    onSelectChannel, 
    selectedChannelId,
    onCreateChannel,
    refreshTrigger,
    className 
}) => {
    const [search, setSearch] = useState('');
    const [channels, setChannels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('all');
    const { socket, isConnected } = useJashSyncSocket();
    
    // Channel type icons
    const channelTypeIcons = {
        class: GraduationCap,
        department: Building2,
        announcement: Megaphone,
        private: Lock,
        public: Hash
    };
    
    // Fetch channels
    useEffect(() => {
        const fetchChannels = async () => {
            setLoading(true);
            try {
                const data = await api.get('/jashsync/channels');
                setChannels(data || []);
            } catch (error) {
                console.error('Failed to fetch channels:', error);
                setChannels([]);
            } finally {
                setLoading(false);
            }
        };
        
        fetchChannels();
    }, [refreshTrigger]);
    
    // Socket listeners for real-time updates
    useEffect(() => {
        if (!socket || !isConnected) return;
        
        const handleNewChannelMessage = (data) => {
            setChannels(prev => prev.map(ch => 
                ch.id === data.channelId 
                    ? { 
                        ...ch, 
                        lastMessage: data.message,
                        unreadCount: ch.id === selectedChannelId ? 0 : (ch.unreadCount || 0) + 1
                    } 
                    : ch
            ));
        };
        
        const handleChannelCreated = (channel) => {
            setChannels(prev => [channel, ...prev]);
        };
        
        socket.on('channel:message', handleNewChannelMessage);
        socket.on('channel:created', handleChannelCreated);
        
        return () => {
            socket.off('channel:message', handleNewChannelMessage);
            socket.off('channel:created', handleChannelCreated);
        };
    }, [socket, isConnected, selectedChannelId]);
    
    // Filter and search channels
    const filteredChannels = useMemo(() => {
        let result = [...channels];
        
        // Filter by type
        if (activeFilter !== 'all') {
            result = result.filter(ch => ch.type === activeFilter);
        }
        
        // Search
        if (search.trim()) {
            const query = search.toLowerCase();
            result = result.filter(ch => 
                ch.name?.toLowerCase().includes(query) ||
                ch.description?.toLowerCase().includes(query)
            );
        }
        
        // Sort: Pinned first, then by last message time
        result.sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            const timeA = new Date(a.lastMessage?.timestamp || 0).getTime();
            const timeB = new Date(b.lastMessage?.timestamp || 0).getTime();
            return timeB - timeA;
        });
        
        return result;
    }, [channels, activeFilter, search]);
    
    // Get channel icon
    const getChannelIcon = (type) => {
        const IconComponent = channelTypeIcons[type] || Hash;
        return IconComponent;
    };
    
    // Get channel color
    const getChannelColor = (type) => {
        const colors = {
            class: 'text-blue-400 bg-blue-500/20',
            department: 'text-orange-400 bg-orange-500/20',
            announcement: 'text-red-400 bg-red-500/20',
            private: 'text-purple-400 bg-purple-500/20',
            public: 'text-green-400 bg-green-500/20'
        };
        return colors[type] || 'text-gray-400 bg-gray-500/20';
    };
    
    // Handle channel actions
    const handleTogglePin = async (channelId, e) => {
        e.stopPropagation();
        setChannels(prev => prev.map(ch => 
            ch.id === channelId ? { ...ch, isPinned: !ch.isPinned } : ch
        ));
    };
    
    const handleToggleMute = async (channelId, e) => {
        e.stopPropagation();
        setChannels(prev => prev.map(ch => 
            ch.id === channelId ? { ...ch, isMuted: !ch.isMuted } : ch
        ));
    };
    
    return (
        <div className={cn("flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700/50", className)}>
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700/50">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Hash className="h-5 w-5 text-purple-400" />
                        Channels
                    </h2>
                    <Button 
                        size="sm" 
                        onClick={onCreateChannel}
                        className="bg-purple-600 hover:bg-purple-700"
                    >
                        <Plus className="h-4 w-4 mr-1" />
                        New
                    </Button>
                </div>
                
                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <Input
                        placeholder="Search channels..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:border-purple-500"
                    />
                </div>
            </div>
            
            {/* Filter Tabs */}
            <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700/50">
                <Tabs value={activeFilter} onValueChange={setActiveFilter}>
                    <TabsList className="w-full bg-gray-100/50 dark:bg-gray-800/50 p-1">
                        <TabsTrigger value="all" className="flex-1 text-xs data-[state=active]:bg-purple-600">
                            All
                        </TabsTrigger>
                        <TabsTrigger value="class" className="flex-1 text-xs data-[state=active]:bg-purple-600">
                            Class
                        </TabsTrigger>
                        <TabsTrigger value="announcement" className="flex-1 text-xs data-[state=active]:bg-purple-600">
                            Announce
                        </TabsTrigger>
                        <TabsTrigger value="department" className="flex-1 text-xs data-[state=active]:bg-purple-600">
                            Dept
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>
            
            {/* Channel List */}
            <ScrollArea className="flex-1">
                {loading ? (
                    <div className="flex items-center justify-center h-32">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
                    </div>
                ) : filteredChannels.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                        <Hash className="h-8 w-8 mb-2 opacity-50" />
                        <p className="text-sm">No channels found</p>
                    </div>
                ) : (
                    <div className="p-2 space-y-1">
                        {filteredChannels.map((channel) => {
                            const IconComponent = getChannelIcon(channel.type);
                            const colorClass = getChannelColor(channel.type);
                            const isSelected = channel.id === selectedChannelId;
                            
                            return (
                                <div
                                    key={channel.id}
                                    onClick={() => onSelectChannel?.(channel)}
                                    className={cn(
                                        "flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all group",
                                        "hover:bg-gray-100 dark:hover:bg-gray-800/70",
                                        isSelected && "bg-purple-600/20 border border-purple-500/30"
                                    )}
                                >
                                    {/* Channel Icon */}
                                    <div className={cn(
                                        "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                                        colorClass
                                    )}>
                                        <IconComponent className="h-5 w-5" />
                                    </div>
                                    
                                    {/* Channel Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className={cn(
                                                "font-medium truncate",
                                                channel.unreadCount > 0 ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"
                                            )}>
                                                {channel.name}
                                            </span>
                                            {channel.isPinned && (
                                                <Pin className="h-3 w-3 text-yellow-500" />
                                            )}
                                            {channel.isMuted && (
                                                <BellOff className="h-3 w-3 text-gray-500" />
                                            )}
                                        </div>
                                        
                                        {/* Last message preview */}
                                        {channel.lastMessage && (
                                            <p className={cn(
                                                "text-sm truncate mt-0.5",
                                                channel.unreadCount > 0 ? "text-gray-700 dark:text-gray-300" : "text-gray-600 dark:text-gray-500"
                                            )}>
                                                <span className="text-gray-500 dark:text-gray-400">
                                                    {channel.lastMessage.sender}:
                                                </span>{' '}
                                                {channel.lastMessage.content}
                                            </p>
                                        )}
                                        
                                        {/* Meta - Members & Time */}
                                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-600 dark:text-gray-500">
                                            <Users className="h-3 w-3" />
                                            <span>{channel.memberCount}</span>
                                            {channel.lastMessage?.timestamp && (
                                                <>
                                                    <span>•</span>
                                                    <TimeAgo date={channel.lastMessage.timestamp} />
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Right side - Badge & Actions */}
                                    <div className="flex flex-col items-end gap-2">
                                        {channel.unreadCount > 0 && (
                                            <UnreadBadge count={channel.unreadCount} />
                                        )}
                                        
                                        {/* Actions dropdown */}
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon"
                                                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                                                <DropdownMenuItem onClick={(e) => handleTogglePin(channel.id, e)}>
                                                    <Pin className="h-4 w-4 mr-2" />
                                                    {channel.isPinned ? 'Unpin' : 'Pin'}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={(e) => handleToggleMute(channel.id, e)}>
                                                    {channel.isMuted ? (
                                                        <>
                                                            <Bell className="h-4 w-4 mr-2" />
                                                            Unmute
                                                        </>
                                                    ) : (
                                                        <>
                                                            <BellOff className="h-4 w-4 mr-2" />
                                                            Mute
                                                        </>
                                                    )}
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
                            );
                        })}
                    </div>
                )}
            </ScrollArea>
            
            {/* Footer Stats */}
            <div className="p-3 border-t border-gray-200 dark:border-gray-700/50 bg-gray-100/30 dark:bg-gray-800/30">
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>{channels.length} channels</span>
                    <span>{channels.reduce((acc, ch) => acc + (ch.unreadCount || 0), 0)} unread</span>
                </div>
            </div>
        </div>
    );
};

export default ChannelList;
