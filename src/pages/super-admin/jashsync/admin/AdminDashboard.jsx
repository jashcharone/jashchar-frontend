import React, { useState, useEffect } from 'react';
import { 
    Settings, Users, Shield, BarChart3, MessageSquare, AlertTriangle,
    TrendingUp, Activity, Clock, Calendar, ChevronRight, Bell,
    Ban, CheckCircle, XCircle, Eye, Filter, Download, RefreshCw,
    Loader2, Search, UserCog, FileText, Megaphone, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useToast } from '@/components/ui/use-toast';
import { formatDate, formatDateTime, getRelativeDate } from '@/utils/dateUtils';

/**
 * AdminDashboard - Main admin console dashboard
 * Overview of system health, moderation queue, and quick actions
 */
const AdminDashboard = ({ 
    onViewModeration,
    onViewPermissions,
    onViewAnalytics,
    className 
}) => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [timeRange, setTimeRange] = useState('7d');
    
    // Dashboard stats
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeUsers: 0,
        totalMessages: 0,
        todayMessages: 0,
        totalChannels: 0,
        totalBroadcasts: 0,
        pendingModeration: 0,
        reportedMessages: 0,
        blockedUsers: 0,
        systemHealth: 'good' // good, warning, critical
    });
    
    // Recent activities
    const [recentActivities, setRecentActivities] = useState([]);
    
    // Alerts
    const [alerts, setAlerts] = useState([]);
    
    useEffect(() => {
        loadDashboardData();
    }, [timeRange]);
    
    const loadDashboardData = async () => {
        setLoading(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Mock stats
            setStats({
                totalUsers: 1247,
                activeUsers: 856,
                totalMessages: 45678,
                todayMessages: 1234,
                totalChannels: 24,
                totalBroadcasts: 156,
                pendingModeration: 8,
                reportedMessages: 3,
                blockedUsers: 12,
                systemHealth: 'good'
            });
            
            // Mock activities
            setRecentActivities([
                { id: 1, type: 'user_joined', user: 'Rajesh Kumar', role: 'Parent', time: new Date(Date.now() - 30 * 60000) },
                { id: 2, type: 'broadcast_sent', user: 'Admin', target: 'All Parents', count: 450, time: new Date(Date.now() - 2 * 3600000) },
                { id: 3, type: 'channel_created', channel: 'Class 5 Updates', creator: 'Head Teacher', time: new Date(Date.now() - 5 * 3600000) },
                { id: 4, type: 'message_reported', reporter: 'Sunita Devi', reason: 'Inappropriate', time: new Date(Date.now() - 8 * 3600000) },
                { id: 5, type: 'user_blocked', user: 'Unknown Contact', by: 'System', reason: 'Spam', time: new Date(Date.now() - 24 * 3600000) },
            ]);
            
            // Mock alerts
            setAlerts([
                { id: 1, type: 'warning', message: '3 messages pending moderation review', time: new Date() },
                { id: 2, type: 'info', message: 'Message credit balance low (< 1000)', time: new Date(Date.now() - 3600000) },
            ]);
            
        } catch (error) {
            console.error('Failed to load dashboard:', error);
            toast({ title: "Error", description: 'Failed to load dashboard data', variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };
    
    const refreshData = async () => {
        setRefreshing(true);
        await loadDashboardData();
        setRefreshing(false);
        toast({ title: "Refreshed", description: 'Dashboard data updated' });
    };
    
    // Get activity icon
    const getActivityIcon = (type) => {
        switch (type) {
            case 'user_joined': return <Users className="w-4 h-4 text-green-400" />;
            case 'broadcast_sent': return <Megaphone className="w-4 h-4 text-blue-400" />;
            case 'channel_created': return <MessageSquare className="w-4 h-4 text-purple-400" />;
            case 'message_reported': return <AlertTriangle className="w-4 h-4 text-orange-400" />;
            case 'user_blocked': return <Ban className="w-4 h-4 text-red-400" />;
            default: return <Activity className="w-4 h-4 text-gray-400" />;
        }
    };
    
    // Get activity description
    const getActivityDescription = (activity) => {
        switch (activity.type) {
            case 'user_joined':
                return <><strong className="text-white">{activity.user}</strong> joined as {activity.role}</>;
            case 'broadcast_sent':
                return <><strong className="text-white">{activity.user}</strong> sent broadcast to {activity.target} ({activity.count} recipients)</>;
            case 'channel_created':
                return <><strong className="text-white">{activity.channel}</strong> channel created by {activity.creator}</>;
            case 'message_reported':
                return <><strong className="text-white">{activity.reporter}</strong> reported a message: {activity.reason}</>;
            case 'user_blocked':
                return <><strong className="text-white">{activity.user}</strong> blocked by {activity.by} ({activity.reason})</>;
            default:
                return 'Unknown activity';
        }
    };
    
    if (loading) {
        return (
            <div className={cn("flex items-center justify-center", className)}>
                <div className="flex items-center gap-3 text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Loading admin dashboard...</span>
                </div>
            </div>
        );
    }
    
    return (
        <div className={cn("flex flex-col h-full", className)}>
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700/50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
                            <Settings className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Admin Console</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Manage and monitor JashSync</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <Select value={timeRange} onValueChange={setTimeRange}>
                            <SelectTrigger className="w-[130px] bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
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
                    </div>
                </div>
                
                {/* System Health */}
                <div className="mt-4 flex items-center gap-2">
                    <div className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-full",
                        stats.systemHealth === 'good' && "bg-green-500/10 border border-green-500/30",
                        stats.systemHealth === 'warning' && "bg-yellow-500/10 border border-yellow-500/30",
                        stats.systemHealth === 'critical' && "bg-red-500/10 border border-red-500/30"
                    )}>
                        <div className={cn(
                            "w-2 h-2 rounded-full animate-pulse",
                            stats.systemHealth === 'good' && "bg-green-500",
                            stats.systemHealth === 'warning' && "bg-yellow-500",
                            stats.systemHealth === 'critical' && "bg-red-500"
                        )} />
                        <span className={cn(
                            "text-sm",
                            stats.systemHealth === 'good' && "text-green-400",
                            stats.systemHealth === 'warning' && "text-yellow-400",
                            stats.systemHealth === 'critical' && "text-red-400"
                        )}>
                            System {stats.systemHealth === 'good' ? 'Healthy' : stats.systemHealth === 'warning' ? 'Warning' : 'Critical'}
                        </span>
                    </div>
                    
                    {alerts.length > 0 && (
                        <Badge variant="outline" className="text-orange-400 border-orange-400/50">
                            <Bell className="w-3 h-3 mr-1" />
                            {alerts.length} Alert{alerts.length > 1 ? 's' : ''}
                        </Badge>
                    )}
                </div>
            </div>
            
            <ScrollArea className="flex-1">
                <div className="p-4 space-y-6">
                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="bg-gray-100/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Total Users</p>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalUsers.toLocaleString()}</p>
                                        <p className="text-xs text-green-400">
                                            {stats.activeUsers.toLocaleString()} active
                                        </p>
                                    </div>
                                    <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                                        <Users className="w-6 h-6 text-blue-400" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        
                        <Card className="bg-gray-100/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Messages</p>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalMessages.toLocaleString()}</p>
                                        <p className="text-xs text-purple-400">
                                            +{stats.todayMessages.toLocaleString()} today
                                        </p>
                                    </div>
                                    <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                                        <MessageSquare className="w-6 h-6 text-purple-400" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        
                        <Card className="bg-gray-100/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Channels</p>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalChannels}</p>
                                        <p className="text-xs text-green-400">
                                            {stats.totalBroadcasts} broadcasts
                                        </p>
                                    </div>
                                    <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                                        <Megaphone className="w-6 h-6 text-green-400" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        
                        <Card 
                            className="bg-gray-800/50 border-gray-700 cursor-pointer hover:border-orange-500/50 transition-colors"
                            onClick={onViewModeration}
                        >
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Moderation</p>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pendingModeration}</p>
                                        <p className="text-xs text-orange-400">
                                            {stats.reportedMessages} reported
                                        </p>
                                    </div>
                                    <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
                                        <AlertTriangle className="w-6 h-6 text-orange-400" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                    
                    {/* Alerts Section */}
                    {alerts.length > 0 && (
                        <Card className="bg-orange-500/10 border-orange-500/30">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm text-orange-400 flex items-center gap-2">
                                    <Bell className="w-4 h-4" />
                                    System Alerts
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {alerts.map((alert) => (
                                    <div 
                                        key={alert.id}
                                        className={cn(
                                            "flex items-center gap-3 p-3 rounded-lg",
                                            alert.type === 'warning' ? "bg-orange-500/10" : "bg-blue-500/10"
                                        )}
                                    >
                                        {alert.type === 'warning' ? (
                                            <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0" />
                                        ) : (
                                            <Bell className="w-4 h-4 text-blue-400 shrink-0" />
                                        )}
                                        <p className="text-sm text-gray-700 dark:text-gray-300 flex-1">{alert.message}</p>
                                        <span className="text-xs text-gray-500">{getRelativeDate(alert.time)}</span>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}
                    
                    {/* Quick Actions */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <Card 
                            className="bg-gray-100/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 cursor-pointer hover:border-purple-500/50 transition-colors"
                            onClick={onViewModeration}
                        >
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                                    <Shield className="w-6 h-6 text-purple-400" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900 dark:text-white">Moderation</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Review flagged content</p>
                                </div>
                                {stats.pendingModeration > 0 && (
                                    <Badge className="bg-orange-600">{stats.pendingModeration}</Badge>
                                )}
                                <ChevronRight className="w-5 h-5 text-gray-500" />
                            </CardContent>
                        </Card>
                        
                        <Card 
                            className="bg-gray-800/50 border-gray-700 cursor-pointer hover:border-blue-500/50 transition-colors"
                            onClick={onViewPermissions}
                        >
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                                    <UserCog className="w-6 h-6 text-blue-400" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-white">Permissions</p>
                                    <p className="text-xs text-gray-400">Manage user roles</p>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-500" />
                            </CardContent>
                        </Card>
                        
                        <Card 
                            className="bg-gray-800/50 border-gray-700 cursor-pointer hover:border-green-500/50 transition-colors"
                            onClick={onViewAnalytics}
                        >
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                                    <BarChart3 className="w-6 h-6 text-green-400" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-white">Analytics</p>
                                    <p className="text-xs text-gray-400">View detailed reports</p>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-500" />
                            </CardContent>
                        </Card>
                    </div>
                    
                    {/* Recent Activity */}
                    <Card className="bg-gray-100/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm text-gray-300 flex items-center gap-2">
                                    <Activity className="w-4 h-4" />
                                    Recent Activity
                                </CardTitle>
                                <Button variant="ghost" size="sm" className="text-xs text-purple-400">
                                    View All
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {recentActivities.map((activity) => (
                                <div key={activity.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700/30">
                                    <div className="w-8 h-8 rounded-lg bg-gray-700/50 flex items-center justify-center">
                                        {getActivityIcon(activity.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-gray-300 truncate">
                                            {getActivityDescription(activity)}
                                        </p>
                                    </div>
                                    <span className="text-xs text-gray-500 shrink-0">
                                        {getRelativeDate(activity.time)}
                                    </span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                    
                    {/* Usage Summary */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <Card className="bg-gray-100/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm text-gray-300">Message Distribution</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-400">Direct Messages</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
                                                <div className="w-[60%] h-full bg-blue-500 rounded-full" />
                                            </div>
                                            <span className="text-sm text-white">60%</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-400">Channel Messages</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
                                                <div className="w-[25%] h-full bg-purple-500 rounded-full" />
                                            </div>
                                            <span className="text-sm text-white">25%</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-400">Broadcasts</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
                                                <div className="w-[15%] h-full bg-green-500 rounded-full" />
                                            </div>
                                            <span className="text-sm text-white">15%</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        
                        <Card className="bg-gray-100/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm text-gray-300">User Engagement</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-400">Parents</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
                                                <div className="w-[75%] h-full bg-orange-500 rounded-full" />
                                            </div>
                                            <span className="text-sm text-white">75%</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-400">Teachers</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
                                                <div className="w-[90%] h-full bg-blue-500 rounded-full" />
                                            </div>
                                            <span className="text-sm text-white">90%</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-400">Staff</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
                                                <div className="w-[85%] h-full bg-green-500 rounded-full" />
                                            </div>
                                            <span className="text-sm text-white">85%</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </ScrollArea>
        </div>
    );
};

export default AdminDashboard;
