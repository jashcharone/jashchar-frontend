import React, { useState, useEffect } from 'react';
import { 
    BarChart3, TrendingUp, TrendingDown, ChevronLeft, Calendar,
    Users, MessageSquare, Megaphone, Download, RefreshCw, Loader2,
    ArrowUpRight, ArrowDownRight, Clock, Activity, Target, Eye,
    PieChart, LineChart, Hash, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useToast } from '@/components/ui/use-toast';
import { formatDate, formatDateTime } from '@/utils/dateUtils';

/**
 * AnalyticsView - Detailed messaging analytics and reports
 * Charts, trends, and insights for JashSync usage
 */
const AnalyticsView = ({ 
    open,
    onOpenChange
}) => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [timeRange, setTimeRange] = useState('7d');
    const [activeTab, setActiveTab] = useState('overview');
    
    // Analytics data
    const [analytics, setAnalytics] = useState({
        overview: null,
        messages: null,
        users: null,
        channels: null,
        broadcasts: null
    });
    
    useEffect(() => {
        if (open) {
            loadAnalytics();
        }
    }, [open, timeRange]);
    
    const loadAnalytics = async () => {
        setLoading(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Mock analytics data
            setAnalytics({
                overview: {
                    totalMessages: 45678,
                    messagesTrend: 12.5,
                    totalUsers: 1247,
                    usersTrend: 5.2,
                    activeUsers: 856,
                    activeUsersTrend: 8.3,
                    avgResponseTime: '2.5 min',
                    responseTimeTrend: -15.2,
                    deliveryRate: 98.5,
                    readRate: 76.3
                },
                messages: {
                    daily: [
                        { date: '26 Feb', count: 1523, dms: 912, channels: 401, broadcasts: 210 },
                        { date: '27 Feb', count: 1687, dms: 1012, channels: 465, broadcasts: 210 },
                        { date: '28 Feb', count: 1456, dms: 874, channels: 382, broadcasts: 200 },
                        { date: '1 Mar', count: 1789, dms: 1073, channels: 486, broadcasts: 230 },
                        { date: '2 Mar', count: 1234, dms: 740, channels: 324, broadcasts: 170 }
                    ],
                    byType: {
                        text: 78,
                        image: 15,
                        file: 5,
                        video: 2
                    },
                    peakHours: [
                        { hour: '8 AM', count: 234 },
                        { hour: '9 AM', count: 456 },
                        { hour: '10 AM', count: 523 },
                        { hour: '11 AM', count: 412 },
                        { hour: '12 PM', count: 289 },
                        { hour: '1 PM', count: 178 },
                        { hour: '2 PM', count: 345 },
                        { hour: '3 PM', count: 467 },
                        { hour: '4 PM', count: 398 },
                        { hour: '5 PM', count: 234 }
                    ]
                },
                users: {
                    byRole: [
                        { role: 'Parents', count: 850, active: 620, percentage: 68 },
                        { role: 'Teachers', count: 45, active: 42, percentage: 4 },
                        { role: 'Students', count: 320, active: 180, percentage: 26 },
                        { role: 'Staff', count: 25, active: 14, percentage: 2 },
                        { role: 'Admin', count: 7, active: 7, percentage: 0.5 }
                    ],
                    engagement: [
                        { level: 'Highly Active', count: 312, percentage: 25 },
                        { level: 'Active', count: 544, percentage: 44 },
                        { level: 'Moderate', count: 248, percentage: 20 },
                        { level: 'Low', count: 143, percentage: 11 }
                    ],
                    newUsers: 45,
                    churned: 3
                },
                channels: {
                    total: 24,
                    active: 18,
                    topChannels: [
                        { name: 'School Announcements', members: 1200, messages: 456 },
                        { name: 'Class 5 Updates', members: 87, messages: 234 },
                        { name: 'Staff Room', members: 52, messages: 189 },
                        { name: 'Parent-Teacher', members: 156, messages: 167 },
                        { name: 'Events & Activities', members: 890, messages: 145 }
                    ]
                },
                broadcasts: {
                    total: 156,
                    thisWeek: 12,
                    avgDeliveryRate: 98.5,
                    avgReadRate: 76.3,
                    topBroadcasts: [
                        { title: 'Fee Payment Reminder', sent: 850, delivered: 845, read: 678, date: '2026-02-28' },
                        { title: 'Holiday Announcement', sent: 1200, delivered: 1195, read: 1089, date: '2026-02-26' },
                        { title: 'Exam Schedule', sent: 450, delivered: 448, read: 412, date: '2026-02-25' }
                    ]
                }
            });
            
        } catch (error) {
            console.error('Failed to load analytics:', error);
            toast({ title: "Error", description: 'Failed to load analytics', variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };
    
    const refreshData = async () => {
        setRefreshing(true);
        await loadAnalytics();
        setRefreshing(false);
        toast({ title: "Refreshed", description: 'Analytics data updated' });
    };
    
    const exportReport = () => {
        toast({ title: "Export Started", description: 'Report generation in progress...' });
        // Simulate export
        setTimeout(() => {
            toast({ title: "Export Complete", description: 'Report downloaded successfully' });
        }, 2000);
    };
    
    // Render trend badge
    const renderTrend = (value, inverse = false) => {
        const isPositive = inverse ? value < 0 : value > 0;
        return (
            <Badge 
                variant="outline" 
                className={cn(
                    "text-xs",
                    isPositive ? "text-green-400 border-green-400/50" : "text-red-400 border-red-400/50"
                )}
            >
                {isPositive ? (
                    <ArrowUpRight className="w-3 h-3 mr-1" />
                ) : (
                    <ArrowDownRight className="w-3 h-3 mr-1" />
                )}
                {Math.abs(value)}%
            </Badge>
        );
    };
    
    // Simple bar chart component
    const SimpleBarChart = ({ data, maxValue, color = "blue" }) => (
        <div className="flex items-end gap-1 h-32">
            {data.map((item, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div 
                        className={cn(
                            "w-full rounded-t transition-all",
                            `bg-${color}-500`
                        )}
                        style={{ 
                            height: `${(item.count / maxValue) * 100}%`,
                            backgroundColor: color === 'blue' ? '#3b82f6' : 
                                            color === 'purple' ? '#a855f7' : 
                                            color === 'green' ? '#22c55e' : '#3b82f6'
                        }}
                    />
                    <span className="text-[10px] text-gray-500">{item.date || item.hour}</span>
                </div>
            ))}
        </div>
    );
    
    if (loading) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 max-w-5xl">
                    <div className="flex items-center justify-center py-12 text-gray-400">
                        <Loader2 className="w-6 h-6 animate-spin mr-2" />
                        Loading analytics...
                    </div>
                </DialogContent>
            </Dialog>
        );
    }
    
    const { overview, messages, users, channels, broadcasts } = analytics;
    
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 max-w-5xl p-0 max-h-[90vh]">
                {/* Header */}
                <DialogHeader className="p-4 pb-2 border-b border-gray-200 dark:border-gray-700/50">
                    <div className="flex items-center gap-3">
                        <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => onOpenChange(false)}
                            className="text-gray-400"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </Button>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center">
                            <BarChart3 className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                            <DialogTitle className="text-gray-900 dark:text-white">Analytics Dashboard</DialogTitle>
                            <DialogDescription>
                                Messaging insights and performance metrics
                            </DialogDescription>
                        </div>
                        
                        <Select value={timeRange} onValueChange={setTimeRange}>
                            <SelectTrigger className="w-[140px] bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                                <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                                <SelectItem value="24h">Last 24 hours</SelectItem>
                                <SelectItem value="7d">Last 7 days</SelectItem>
                                <SelectItem value="30d">Last 30 days</SelectItem>
                                <SelectItem value="90d">Last 90 days</SelectItem>
                            </SelectContent>
                        </Select>
                        
                        <Button 
                            variant="outline" 
                            size="icon"
                            onClick={refreshData}
                            disabled={refreshing}
                            className="border-gray-200 dark:border-gray-700"
                        >
                            <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
                        </Button>
                        
                        <Button 
                            variant="outline" 
                            onClick={exportReport}
                            className="border-gray-200 dark:border-gray-700"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Export
                        </Button>
                    </div>
                </DialogHeader>
                
                {/* Tabs */}
                <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700/50">
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="bg-gray-100 dark:bg-gray-800">
                            <TabsTrigger value="overview" className="data-[state=active]:bg-green-600">
                                <Activity className="w-4 h-4 mr-2" />
                                Overview
                            </TabsTrigger>
                            <TabsTrigger value="messages" className="data-[state=active]:bg-green-600">
                                <MessageSquare className="w-4 h-4 mr-2" />
                                Messages
                            </TabsTrigger>
                            <TabsTrigger value="users" className="data-[state=active]:bg-green-600">
                                <Users className="w-4 h-4 mr-2" />
                                Users
                            </TabsTrigger>
                            <TabsTrigger value="channels" className="data-[state=active]:bg-green-600">
                                <Hash className="w-4 h-4 mr-2" />
                                Channels
                            </TabsTrigger>
                            <TabsTrigger value="broadcasts" className="data-[state=active]:bg-green-600">
                                <Megaphone className="w-4 h-4 mr-2" />
                                Broadcasts
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
                
                {/* Content */}
                <ScrollArea className="flex-1 max-h-[calc(90vh-180px)]">
                    <div className="p-4">
                        {/* Overview Tab */}
                        {activeTab === 'overview' && overview && (
                            <div className="space-y-6">
                                {/* Key Metrics */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    <Card className="bg-gray-100/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
                                        <CardContent className="p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <MessageSquare className="w-5 h-5 text-blue-400" />
                                                {renderTrend(overview.messagesTrend)}
                                            </div>
                                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{overview.totalMessages.toLocaleString()}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Total Messages</p>
                                        </CardContent>
                                    </Card>
                                    
                                    <Card className="bg-gray-100/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
                                        <CardContent className="p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <Users className="w-5 h-5 text-green-400" />
                                                {renderTrend(overview.activeUsersTrend)}
                                            </div>
                                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{overview.activeUsers.toLocaleString()}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Active Users</p>
                                        </CardContent>
                                    </Card>
                                    
                                    <Card className="bg-gray-100/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
                                        <CardContent className="p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <Clock className="w-5 h-5 text-purple-400" />
                                                {renderTrend(overview.responseTimeTrend, true)}
                                            </div>
                                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{overview.avgResponseTime}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Avg Response Time</p>
                                        </CardContent>
                                    </Card>
                                    
                                    <Card className="bg-gray-100/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
                                        <CardContent className="p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <Target className="w-5 h-5 text-orange-400" />
                                            </div>
                                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{overview.deliveryRate}%</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Delivery Rate</p>
                                        </CardContent>
                                    </Card>
                                </div>
                                
                                {/* Message Trend Chart */}
                                <Card className="bg-gray-100/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm text-gray-700 dark:text-gray-300">Message Activity</CardTitle>
                                        <CardDescription>Daily message volume</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <SimpleBarChart 
                                            data={messages?.daily || []} 
                                            maxValue={Math.max(...(messages?.daily?.map(d => d.count) || [1]))}
                                            color="blue"
                                        />
                                    </CardContent>
                                </Card>
                                
                                {/* Two Column Stats */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {/* Message Types */}
                                    <Card className="bg-gray-100/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm text-gray-700 dark:text-gray-300">Message Types</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            {messages?.byType && Object.entries(messages.byType).map(([type, percentage]) => (
                                                <div key={type} className="space-y-1">
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="text-gray-500 dark:text-gray-400 capitalize">{type}</span>
                                                        <span className="text-gray-900 dark:text-white">{percentage}%</span>
                                                    </div>
                                                    <Progress value={percentage} className="h-2" />
                                                </div>
                                            ))}
                                        </CardContent>
                                    </Card>
                                    
                                    {/* Peak Hours */}
                                    <Card className="bg-gray-100/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm text-gray-700 dark:text-gray-300">Peak Activity Hours</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <SimpleBarChart 
                                                data={messages?.peakHours || []} 
                                                maxValue={Math.max(...(messages?.peakHours?.map(h => h.count) || [1]))}
                                                color="purple"
                                            />
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        )}
                        
                        {/* Messages Tab */}
                        {activeTab === 'messages' && messages && (
                            <div className="space-y-6">
                                <Card className="bg-gray-100/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm text-gray-700 dark:text-gray-300">Daily Message Breakdown</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {messages.daily.map((day, i) => (
                                                <div key={i} className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm text-gray-700 dark:text-gray-300">{day.date}</span>
                                                        <span className="text-sm font-medium text-gray-900 dark:text-white">{day.count.toLocaleString()} messages</span>
                                                    </div>
                                                    <div className="flex gap-1 h-4">
                                                        <div 
                                                            className="bg-blue-500 rounded-l" 
                                                            style={{ width: `${(day.dms / day.count) * 100}%` }}
                                                            title={`DMs: ${day.dms}`}
                                                        />
                                                        <div 
                                                            className="bg-purple-500" 
                                                            style={{ width: `${(day.channels / day.count) * 100}%` }}
                                                            title={`Channels: ${day.channels}`}
                                                        />
                                                        <div 
                                                            className="bg-green-500 rounded-r" 
                                                            style={{ width: `${(day.broadcasts / day.count) * 100}%` }}
                                                            title={`Broadcasts: ${day.broadcasts}`}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded bg-blue-500" />
                                                <span className="text-xs text-gray-400">Direct Messages</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded bg-purple-500" />
                                                <span className="text-xs text-gray-400">Channel Messages</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded bg-green-500" />
                                                <span className="text-xs text-gray-400">Broadcasts</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}
                        
                        {/* Users Tab */}
                        {activeTab === 'users' && users && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {/* Users by Role */}
                                    <Card className="bg-gray-100/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm text-gray-700 dark:text-gray-300">Users by Role</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            {users.byRole.map((role, i) => (
                                                <div key={i} className="flex items-center gap-4">
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="text-sm text-gray-900 dark:text-white">{role.role}</span>
                                                            <span className="text-xs text-gray-500 dark:text-gray-400">{role.count} ({role.active} active)</span>
                                                        </div>
                                                        <Progress value={(role.active / role.count) * 100} className="h-2" />
                                                    </div>
                                                </div>
                                            ))}
                                        </CardContent>
                                    </Card>
                                    
                                    {/* Engagement Levels */}
                                    <Card className="bg-gray-100/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm text-gray-700 dark:text-gray-300">Engagement Levels</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            {users.engagement.map((level, i) => (
                                                <div key={i} className="flex items-center gap-4">
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="text-sm text-gray-900 dark:text-white">{level.level}</span>
                                                            <span className="text-xs text-gray-500 dark:text-gray-400">{level.count} users ({level.percentage}%)</span>
                                                        </div>
                                                        <Progress value={level.percentage} className="h-2" />
                                                    </div>
                                                </div>
                                            ))}
                                        </CardContent>
                                    </Card>
                                </div>
                                
                                {/* User Growth */}
                                <div className="grid grid-cols-2 gap-4">
                                    <Card className="bg-green-500/10 border-green-500/30">
                                        <CardContent className="p-4 text-center">
                                            <TrendingUp className="w-8 h-8 text-green-400 mx-auto mb-2" />
                                            <p className="text-2xl font-bold text-gray-900 dark:text-white">+{users.newUsers}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">New Users This Week</p>
                                        </CardContent>
                                    </Card>
                                    <Card className="bg-red-500/10 border-red-500/30">
                                        <CardContent className="p-4 text-center">
                                            <TrendingDown className="w-8 h-8 text-red-400 mx-auto mb-2" />
                                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{users.churned}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Churned Users</p>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        )}
                        
                        {/* Channels Tab */}
                        {activeTab === 'channels' && channels && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <Card className="bg-gray-100/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
                                        <CardContent className="p-4 text-center">
                                            <Hash className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{channels.total}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Total Channels</p>
                                        </CardContent>
                                    </Card>
                                    <Card className="bg-gray-100/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
                                        <CardContent className="p-4 text-center">
                                            <Zap className="w-8 h-8 text-green-400 mx-auto mb-2" />
                                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{channels.active}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Active Channels</p>
                                        </CardContent>
                                    </Card>
                                </div>
                                
                                <Card className="bg-gray-100/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm text-gray-700 dark:text-gray-300">Top Channels</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {channels.topChannels.map((channel, i) => (
                                                <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-gray-200/50 dark:bg-gray-700/30">
                                                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold">
                                                        {i + 1}
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="font-medium text-gray-900 dark:text-white">{channel.name}</p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">{channel.members} members</p>
                                                    </div>
                                                    <Badge variant="outline" className="text-purple-400 border-purple-400/50">
                                                        {channel.messages} msgs
                                                    </Badge>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}
                        
                        {/* Broadcasts Tab */}
                        {activeTab === 'broadcasts' && broadcasts && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    <Card className="bg-gray-100/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
                                        <CardContent className="p-4">
                                            <Megaphone className="w-5 h-5 text-orange-400 mb-2" />
                                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{broadcasts.total}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Total Broadcasts</p>
                                        </CardContent>
                                    </Card>
                                    <Card className="bg-gray-100/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
                                        <CardContent className="p-4">
                                            <Activity className="w-5 h-5 text-blue-400 mb-2" />
                                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{broadcasts.thisWeek}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">This Week</p>
                                        </CardContent>
                                    </Card>
                                    <Card className="bg-gray-100/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
                                        <CardContent className="p-4">
                                            <Target className="w-5 h-5 text-green-400 mb-2" />
                                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{broadcasts.avgDeliveryRate}%</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Avg Delivery Rate</p>
                                        </CardContent>
                                    </Card>
                                    <Card className="bg-gray-100/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
                                        <CardContent className="p-4">
                                            <Eye className="w-5 h-5 text-purple-400 mb-2" />
                                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{broadcasts.avgReadRate}%</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Avg Read Rate</p>
                                        </CardContent>
                                    </Card>
                                </div>
                                
                                <Card className="bg-gray-100/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm text-gray-700 dark:text-gray-300">Recent Broadcasts</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {broadcasts.topBroadcasts.map((bc, i) => (
                                                <div key={i} className="p-3 rounded-lg bg-gray-200/50 dark:bg-gray-700/30">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <p className="font-medium text-gray-900 dark:text-white">{bc.title}</p>
                                                        <span className="text-xs text-gray-500">{formatDate(bc.date)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-xs">
                                                        <span className="text-gray-500 dark:text-gray-400">Sent: <strong className="text-gray-900 dark:text-white">{bc.sent}</strong></span>
                                                        <span className="text-green-400">Delivered: <strong>{bc.delivered}</strong> ({Math.round(bc.delivered/bc.sent*100)}%)</span>
                                                        <span className="text-blue-400">Read: <strong>{bc.read}</strong> ({Math.round(bc.read/bc.sent*100)}%)</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
};

export default AnalyticsView;
