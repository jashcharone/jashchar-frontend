import React, { useState, useEffect, useMemo } from 'react';
import { 
    Megaphone, Plus, Clock, Check, X, BarChart3, Search, Filter,
    Send, Calendar, Users, Eye, Trash2, Copy, MoreVertical,
    RefreshCw, CheckCircle, XCircle, AlertCircle, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import api from "@/services/api";
import { TimeAgo } from "../chats/ChatIndicators";
import { formatDate } from "@/utils/dateUtils";

/**
 * BroadcastList - List of all broadcasts with stats
 * Shows sent, scheduled, draft broadcasts
 */
const BroadcastList = ({ 
    onCreateBroadcast, 
    onSelectBroadcast,
    selectedBroadcastId,
    className 
}) => {
    const [search, setSearch] = useState('');
    const [broadcasts, setBroadcasts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('all');
    const [stats, setStats] = useState({
        total: 0,
        sent: 0,
        scheduled: 0,
        draft: 0,
        totalRecipients: 0,
        deliveryRate: 0
    });
    
    // Fetch broadcasts
    useEffect(() => {
        const fetchBroadcasts = async () => {
            setLoading(true);
            try {
                const response = await api.get('/jashsync/broadcasts');
                setBroadcasts(response.data?.broadcasts || []);
                setStats(response.data?.stats || {});
            } catch (error) {
                console.error('Failed to fetch broadcasts:', error);
                // Mock data for development
                setBroadcasts([
                    {
                        id: '1',
                        title: 'Fee Reminder - March 2026',
                        message: 'Dear Parent, This is a reminder that the fee for March 2026 is due...',
                        status: 'sent',
                        type: 'fee_reminder',
                        sentAt: new Date(Date.now() - 86400000).toISOString(),
                        scheduledFor: null,
                        recipients: {
                            total: 450,
                            delivered: 445,
                            read: 380,
                            failed: 5
                        },
                        createdBy: 'Admin'
                    },
                    {
                        id: '2',
                        title: 'PTM Notice - Class 10',
                        message: 'Dear Parents, Parent Teacher Meeting is scheduled for 10th March 2026...',
                        status: 'scheduled',
                        type: 'announcement',
                        sentAt: null,
                        scheduledFor: new Date(Date.now() + 259200000).toISOString(),
                        recipients: {
                            total: 520,
                            delivered: 0,
                            read: 0,
                            failed: 0
                        },
                        createdBy: 'Principal'
                    },
                    {
                        id: '3',
                        title: 'Holiday Announcement - Holi',
                        message: 'Dear All, Wishing you a colorful Holi! School will remain closed on...',
                        status: 'sent',
                        type: 'holiday',
                        sentAt: new Date(Date.now() - 172800000).toISOString(),
                        scheduledFor: null,
                        recipients: {
                            total: 1200,
                            delivered: 1195,
                            read: 1050,
                            failed: 5
                        },
                        createdBy: 'Admin'
                    },
                    {
                        id: '4',
                        title: 'Exam Schedule Update',
                        message: 'Dear Students, The final exam schedule has been updated...',
                        status: 'draft',
                        type: 'exam',
                        sentAt: null,
                        scheduledFor: null,
                        recipients: {
                            total: 0,
                            delivered: 0,
                            read: 0,
                            failed: 0
                        },
                        createdBy: 'Admin'
                    },
                    {
                        id: '5',
                        title: 'Sports Day Invitation',
                        message: 'Dear Parents, You are cordially invited to our Annual Sports Day...',
                        status: 'scheduled',
                        type: 'event',
                        sentAt: null,
                        scheduledFor: new Date(Date.now() + 604800000).toISOString(),
                        recipients: {
                            total: 850,
                            delivered: 0,
                            read: 0,
                            failed: 0
                        },
                        createdBy: 'Sports Teacher'
                    }
                ]);
                
                setStats({
                    total: 5,
                    sent: 2,
                    scheduled: 2,
                    draft: 1,
                    totalRecipients: 3020,
                    deliveryRate: 98.5
                });
            } finally {
                setLoading(false);
            }
        };
        
        fetchBroadcasts();
    }, []);
    
    // Filter broadcasts
    const filteredBroadcasts = useMemo(() => {
        let result = [...broadcasts];
        
        // Filter by status
        if (activeFilter !== 'all') {
            result = result.filter(b => b.status === activeFilter);
        }
        
        // Search
        if (search.trim()) {
            const query = search.toLowerCase();
            result = result.filter(b => 
                b.title?.toLowerCase().includes(query) ||
                b.message?.toLowerCase().includes(query)
            );
        }
        
        // Sort by date (newest first)
        result.sort((a, b) => {
            const dateA = new Date(a.sentAt || a.scheduledFor || a.createdAt || 0).getTime();
            const dateB = new Date(b.sentAt || b.scheduledFor || b.createdAt || 0).getTime();
            return dateB - dateA;
        });
        
        return result;
    }, [broadcasts, activeFilter, search]);
    
    // Get status badge
    const getStatusBadge = (status) => {
        const config = {
            sent: { label: 'Sent', icon: CheckCircle, className: 'bg-green-500/20 text-green-400 border-green-500/30' },
            scheduled: { label: 'Scheduled', icon: Clock, className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
            draft: { label: 'Draft', icon: AlertCircle, className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
            failed: { label: 'Failed', icon: XCircle, className: 'bg-red-500/20 text-red-400 border-red-500/30' },
            sending: { label: 'Sending', icon: RefreshCw, className: 'bg-purple-500/20 text-purple-400 border-purple-500/30' }
        };
        return config[status] || config.draft;
    };
    
    // Get type badge
    const getTypeBadge = (type) => {
        const config = {
            fee_reminder: { label: 'Fee', color: 'text-orange-400' },
            announcement: { label: 'Announce', color: 'text-blue-400' },
            holiday: { label: 'Holiday', color: 'text-green-400' },
            exam: { label: 'Exam', color: 'text-red-400' },
            event: { label: 'Event', color: 'text-purple-400' },
            general: { label: 'General', color: 'text-gray-400' }
        };
        return config[type] || config.general;
    };
    
    // Handle actions
    const handleDelete = async (broadcastId, e) => {
        e.stopPropagation();
        // API call would go here
        setBroadcasts(prev => prev.filter(b => b.id !== broadcastId));
    };
    
    const handleDuplicate = async (broadcast, e) => {
        e.stopPropagation();
        const newBroadcast = {
            ...broadcast,
            id: Date.now().toString(),
            title: `${broadcast.title} (Copy)`,
            status: 'draft',
            sentAt: null,
            scheduledFor: null,
            recipients: { total: 0, delivered: 0, read: 0, failed: 0 }
        };
        setBroadcasts(prev => [newBroadcast, ...prev]);
    };
    
    return (
        <div className={cn("flex flex-col h-full bg-white dark:bg-gray-900", className)}>
            {/* Header with Stats */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700/50">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center">
                            <Megaphone className="h-5 w-5 text-red-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Broadcast Center</h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{stats.total} campaigns • {stats.deliveryRate}% delivery</p>
                        </div>
                    </div>
                    <Button 
                        onClick={onCreateBroadcast}
                        className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        New Broadcast
                    </Button>
                </div>
                
                {/* Quick Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                    {[
                        { label: 'Total Sent', value: stats.totalRecipients?.toLocaleString() || '0', icon: Send, color: 'text-green-400' },
                        { label: 'Sent', value: stats.sent || 0, icon: CheckCircle, color: 'text-blue-400' },
                        { label: 'Scheduled', value: stats.scheduled || 0, icon: Clock, color: 'text-yellow-400' },
                        { label: 'Drafts', value: stats.draft || 0, icon: AlertCircle, color: 'text-gray-500 dark:text-gray-400' }
                    ].map((stat, idx) => (
                        <div key={idx} className="bg-gray-100/50 dark:bg-gray-800/50 rounded-lg p-2 text-center">
                            <stat.icon className={cn("h-4 w-4 mx-auto mb-1", stat.color)} />
                            <p className="text-lg font-bold text-gray-900 dark:text-white">{stat.value}</p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400">{stat.label}</p>
                        </div>
                    ))}
                </div>
                
                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <Input
                        placeholder="Search broadcasts..."
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
                        <TabsTrigger value="all" className="flex-1 text-xs data-[state=active]:bg-red-600">
                            All
                        </TabsTrigger>
                        <TabsTrigger value="sent" className="flex-1 text-xs data-[state=active]:bg-red-600">
                            Sent
                        </TabsTrigger>
                        <TabsTrigger value="scheduled" className="flex-1 text-xs data-[state=active]:bg-red-600">
                            Scheduled
                        </TabsTrigger>
                        <TabsTrigger value="draft" className="flex-1 text-xs data-[state=active]:bg-red-600">
                            Drafts
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>
            
            {/* Broadcast List */}
            <ScrollArea className="flex-1">
                {loading ? (
                    <div className="flex items-center justify-center h-32">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500" />
                    </div>
                ) : filteredBroadcasts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 text-gray-500 dark:text-gray-400">
                        <Megaphone className="h-8 w-8 mb-2 opacity-50" />
                        <p className="text-sm">No broadcasts found</p>
                        <Button 
                            variant="link" 
                            onClick={onCreateBroadcast}
                            className="text-red-400 mt-2"
                        >
                            Create your first broadcast
                        </Button>
                    </div>
                ) : (
                    <div className="p-2 space-y-2">
                        {filteredBroadcasts.map((broadcast) => {
                            const statusBadge = getStatusBadge(broadcast.status);
                            const typeBadge = getTypeBadge(broadcast.type);
                            const isSelected = broadcast.id === selectedBroadcastId;
                            const StatusIcon = statusBadge.icon;
                            
                            return (
                                <div
                                    key={broadcast.id}
                                    onClick={() => onSelectBroadcast?.(broadcast)}
                                    className={cn(
                                        "p-4 rounded-lg border cursor-pointer transition-all group",
                                        "hover:bg-gray-100/70 dark:hover:bg-gray-800/70 hover:border-gray-300 dark:hover:border-gray-600",
                                        isSelected 
                                            ? "bg-red-600/10 border-red-500/30" 
                                            : "bg-gray-100/30 dark:bg-gray-800/30 border-gray-200 dark:border-gray-700/50"
                                    )}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        {/* Left - Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-medium text-gray-900 dark:text-white truncate">
                                                    {broadcast.title}
                                                </h3>
                                                <Badge variant="outline" className={cn("text-[10px] py-0", typeBadge.color)}>
                                                    {typeBadge.label}
                                                </Badge>
                                            </div>
                                            
                                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate mb-2">
                                                {broadcast.message}
                                            </p>
                                            
                                            {/* Stats row */}
                                            <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-500">
                                                <div className="flex items-center gap-1">
                                                    <Users className="h-3 w-3" />
                                                    {broadcast.recipients?.total || 0} recipients
                                                </div>
                                                
                                                {broadcast.status === 'sent' && (
                                                    <>
                                                        <div className="flex items-center gap-1 text-green-400">
                                                            <Check className="h-3 w-3" />
                                                            {broadcast.recipients?.delivered || 0} delivered
                                                        </div>
                                                        <div className="flex items-center gap-1 text-blue-400">
                                                            <Eye className="h-3 w-3" />
                                                            {broadcast.recipients?.read || 0} read
                                                        </div>
                                                        {broadcast.recipients?.failed > 0 && (
                                                            <div className="flex items-center gap-1 text-red-400">
                                                                <X className="h-3 w-3" />
                                                                {broadcast.recipients.failed} failed
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                                
                                                {broadcast.status === 'scheduled' && broadcast.scheduledFor && (
                                                    <div className="flex items-center gap-1 text-blue-400">
                                                        <Calendar className="h-3 w-3" />
                                                        {formatDate(broadcast.scheduledFor)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        
                                        {/* Right - Status & Actions */}
                                        <div className="flex flex-col items-end gap-2">
                                            <Badge 
                                                variant="outline" 
                                                className={cn("gap-1", statusBadge.className)}
                                            >
                                                <StatusIcon className={cn(
                                                    "h-3 w-3",
                                                    broadcast.status === 'sending' && "animate-spin"
                                                )} />
                                                {statusBadge.label}
                                            </Badge>
                                            
                                            {(broadcast.sentAt || broadcast.scheduledFor) && (
                                                <span className="text-xs text-gray-500">
                                                    <TimeAgo date={broadcast.sentAt || broadcast.scheduledFor} />
                                                </span>
                                            )}
                                            
                                            {/* Actions */}
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon"
                                                        className="h-7 w-7 opacity-0 group-hover:opacity-100"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                                                    <DropdownMenuItem onClick={() => onSelectBroadcast?.(broadcast)}>
                                                        <Eye className="h-4 w-4 mr-2" />
                                                        View Details
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={(e) => handleDuplicate(broadcast, e)}>
                                                        <Copy className="h-4 w-4 mr-2" />
                                                        Duplicate
                                                    </DropdownMenuItem>
                                                    {broadcast.status === 'sent' && (
                                                        <DropdownMenuItem>
                                                            <BarChart3 className="h-4 w-4 mr-2" />
                                                            View Analytics
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
                                                    <DropdownMenuItem 
                                                        onClick={(e) => handleDelete(broadcast.id, e)}
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
                    </div>
                )}
            </ScrollArea>
        </div>
    );
};

export default BroadcastList;
