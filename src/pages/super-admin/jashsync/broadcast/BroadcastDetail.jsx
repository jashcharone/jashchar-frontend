import React, { useState, useMemo } from 'react';
import { 
    Megaphone, ArrowLeft, Users, CheckCircle, Eye, XCircle,
    Clock, Calendar, BarChart3, Send, RefreshCw, Copy,
    Download, Search, Filter, ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { formatDate, formatDateTime } from "@/utils/dateUtils";

/**
 * BroadcastDetail - View broadcast details and analytics
 * Shows delivery stats, read receipts, failed list
 */
const BroadcastDetail = ({ 
    broadcast,
    onBack,
    onResend,
    className 
}) => {
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState('overview');
    const [recipientFilter, setRecipientFilter] = useState('all');
    
    // Mock recipient data
    const recipients = useMemo(() => [
        { id: '1', name: 'Rahul Sharma', phone: '+91 98765 43210', status: 'read', readAt: new Date(Date.now() - 3600000).toISOString() },
        { id: '2', name: 'Priya Patel', phone: '+91 98765 43211', status: 'delivered', deliveredAt: new Date(Date.now() - 7200000).toISOString() },
        { id: '3', name: 'Amit Kumar', phone: '+91 98765 43212', status: 'read', readAt: new Date(Date.now() - 1800000).toISOString() },
        { id: '4', name: 'Sunita Devi', phone: '+91 98765 43213', status: 'failed', error: 'Phone unreachable' },
        { id: '5', name: 'Vikram Singh', phone: '+91 98765 43214', status: 'read', readAt: new Date(Date.now() - 5400000).toISOString() },
        { id: '6', name: 'Meera Gupta', phone: '+91 98765 43215', status: 'delivered', deliveredAt: new Date(Date.now() - 3000000).toISOString() },
        { id: '7', name: 'Rajesh Verma', phone: '+91 98765 43216', status: 'read', readAt: new Date(Date.now() - 900000).toISOString() },
        { id: '8', name: 'Anita Joshi', phone: '+91 98765 43217', status: 'failed', error: 'Invalid number' },
    ], []);
    
    // Filter recipients
    const filteredRecipients = useMemo(() => {
        let result = [...recipients];
        
        if (recipientFilter !== 'all') {
            result = result.filter(r => r.status === recipientFilter);
        }
        
        if (search.trim()) {
            const query = search.toLowerCase();
            result = result.filter(r => 
                r.name?.toLowerCase().includes(query) ||
                r.phone?.includes(query)
            );
        }
        
        return result;
    }, [recipients, recipientFilter, search]);
    
    // Stats calculations
    const stats = useMemo(() => {
        const total = broadcast?.recipients?.total || recipients.length;
        const delivered = broadcast?.recipients?.delivered || recipients.filter(r => r.status !== 'failed').length;
        const read = broadcast?.recipients?.read || recipients.filter(r => r.status === 'read').length;
        const failed = broadcast?.recipients?.failed || recipients.filter(r => r.status === 'failed').length;
        
        return {
            total,
            delivered,
            read,
            failed,
            deliveryRate: total > 0 ? ((delivered / total) * 100).toFixed(1) : 0,
            readRate: delivered > 0 ? ((read / delivered) * 100).toFixed(1) : 0
        };
    }, [broadcast, recipients]);
    
    // Get status color
    const getStatusColor = (status) => {
        const colors = {
            read: 'text-blue-400',
            delivered: 'text-green-400',
            failed: 'text-red-400',
            pending: 'text-yellow-400'
        };
        return colors[status] || 'text-gray-400';
    };
    
    // Get status icon
    const getStatusIcon = (status) => {
        const icons = {
            read: Eye,
            delivered: CheckCircle,
            failed: XCircle,
            pending: Clock
        };
        return icons[status] || Clock;
    };
    
    if (!broadcast) {
        return (
            <div className={cn("flex items-center justify-center h-full", className)}>
                <div className="text-center text-gray-500 dark:text-gray-400">
                    <Megaphone className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Select a broadcast to view details</p>
                </div>
            </div>
        );
    }
    
    return (
        <div className={cn("flex flex-col h-full bg-gray-50/50 dark:bg-gray-900/50", className)}>
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700/50">
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                        <Button variant="ghost" size="icon" onClick={onBack} className="mt-1">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{broadcast.title}</h2>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge 
                                    variant="outline" 
                                    className={cn(
                                        broadcast.status === 'sent' && "text-green-400 border-green-500/30",
                                        broadcast.status === 'scheduled' && "text-blue-400 border-blue-500/30",
                                        broadcast.status === 'draft' && "text-yellow-400 border-yellow-500/30"
                                    )}
                                >
                                    {broadcast.status}
                                </Badge>
                                {broadcast.sentAt && (
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                        Sent {formatDateTime(broadcast.sentAt)}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Export
                        </Button>
                        {broadcast.status === 'sent' && (
                            <Button variant="outline" size="sm" onClick={onResend}>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Resend Failed
                            </Button>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                <div className="px-4 border-b border-gray-200 dark:border-gray-700/50">
                    <TabsList className="bg-transparent h-auto p-0 gap-4">
                        <TabsTrigger 
                            value="overview" 
                            className="bg-transparent px-0 pb-3 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-purple-500 rounded-none"
                        >
                            <BarChart3 className="h-4 w-4 mr-2" />
                            Overview
                        </TabsTrigger>
                        <TabsTrigger 
                            value="recipients" 
                            className="bg-transparent px-0 pb-3 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-purple-500 rounded-none"
                        >
                            <Users className="h-4 w-4 mr-2" />
                            Recipients ({stats.total})
                        </TabsTrigger>
                    </TabsList>
                </div>
                
                {/* Overview Tab */}
                <TabsContent value="overview" className="flex-1 p-4 m-0 overflow-auto">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <div className="bg-gray-100/50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700/50">
                            <div className="flex items-center justify-between mb-2">
                                <Users className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                                <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</span>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Total Recipients</p>
                        </div>
                        
                        <div className="bg-gray-100/50 dark:bg-gray-800/50 rounded-xl p-4 border border-green-500/20">
                            <div className="flex items-center justify-between mb-2">
                                <CheckCircle className="h-5 w-5 text-green-400" />
                                <span className="text-2xl font-bold text-green-400">{stats.delivered}</span>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Delivered</p>
                            <Progress value={parseFloat(stats.deliveryRate)} className="h-1 mt-2" />
                        </div>
                        
                        <div className="bg-gray-100/50 dark:bg-gray-100/50 dark:bg-gray-800/50 rounded-xl p-4 border border-blue-500/20">
                            <div className="flex items-center justify-between mb-2">
                                <Eye className="h-5 w-5 text-blue-400" />
                                <span className="text-2xl font-bold text-blue-400">{stats.read}</span>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Read</p>
                            <Progress value={parseFloat(stats.readRate)} className="h-1 mt-2" />
                        </div>
                        
                        <div className="bg-gray-100/50 dark:bg-gray-800/50 rounded-xl p-4 border border-red-500/20">
                            <div className="flex items-center justify-between mb-2">
                                <XCircle className="h-5 w-5 text-red-400" />
                                <span className="text-2xl font-bold text-red-400">{stats.failed}</span>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Failed</p>
                        </div>
                    </div>
                    
                    {/* Message Preview */}
                    <div className="bg-gray-100/50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700/50 mb-6">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Message Content</h3>
                        <div className="bg-white dark:bg-gray-900/50 rounded-lg p-4">
                            <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{broadcast.message}</p>
                        </div>
                    </div>
                    
                    {/* Delivery Timeline */}
                    <div className="bg-gray-100/50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700/50">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Delivery Rates</h3>
                        <div className="space-y-3">
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-500 dark:text-gray-400">Delivery Rate</span>
                                    <span className="text-green-400">{stats.deliveryRate}%</span>
                                </div>
                                <Progress value={parseFloat(stats.deliveryRate)} className="h-2" />
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-500 dark:text-gray-400">Read Rate</span>
                                    <span className="text-blue-400">{stats.readRate}%</span>
                                </div>
                                <Progress value={parseFloat(stats.readRate)} className="h-2" />
                            </div>
                        </div>
                    </div>
                </TabsContent>
                
                {/* Recipients Tab */}
                <TabsContent value="recipients" className="flex-1 flex flex-col m-0 overflow-hidden">
                    {/* Filter Bar */}
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700/50 flex items-center gap-3">
                        <div className="relative flex-1 max-w-xs">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                            <Input
                                placeholder="Search recipients..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9 bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                            />
                        </div>
                        
                        <div className="flex items-center gap-2">
                            {['all', 'delivered', 'read', 'failed'].map(filter => (
                                <Button
                                    key={filter}
                                    variant={recipientFilter === filter ? 'secondary' : 'ghost'}
                                    size="sm"
                                    onClick={() => setRecipientFilter(filter)}
                                    className="capitalize"
                                >
                                    {filter}
                                </Button>
                            ))}
                        </div>
                    </div>
                    
                    {/* Recipients List */}
                    <ScrollArea className="flex-1">
                        <div className="p-4 space-y-2">
                            {filteredRecipients.map(recipient => {
                                const StatusIcon = getStatusIcon(recipient.status);
                                
                                return (
                                    <div 
                                        key={recipient.id}
                                        className="flex items-center gap-3 p-3 bg-gray-100/30 dark:bg-gray-800/30 rounded-lg border border-gray-200 dark:border-gray-700/50"
                                    >
                                        <Avatar className="h-10 w-10">
                                            <AvatarFallback className="bg-purple-600/30 text-purple-400 dark:text-purple-300">
                                                {recipient.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                            </AvatarFallback>
                                        </Avatar>
                                        
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 dark:text-white truncate">{recipient.name}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{recipient.phone}</p>
                                        </div>
                                        
                                        <div className="text-right">
                                            <div className={cn("flex items-center gap-1", getStatusColor(recipient.status))}>
                                                <StatusIcon className="h-4 w-4" />
                                                <span className="text-sm capitalize">{recipient.status}</span>
                                            </div>
                                            {recipient.readAt && (
                                                <p className="text-xs text-gray-500">
                                                    {new Date(recipient.readAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            )}
                                            {recipient.error && (
                                                <p className="text-xs text-red-400">{recipient.error}</p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </ScrollArea>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default BroadcastDetail;
