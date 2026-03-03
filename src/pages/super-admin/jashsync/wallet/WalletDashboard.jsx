import React, { useState, useEffect, useMemo } from 'react';
import { 
    Wallet, CreditCard, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
    Calendar, Clock, RefreshCw, Download, Filter, Plus, Zap, Gift,
    MessageCircle, Send, BarChart3, PieChart, AlertTriangle, CheckCircle,
    IndianRupee, Percent, Star, Crown, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import api from "@/services/api";

/**
 * WalletDashboard - Message credits, balance, and usage analytics
 * Comprehensive wallet management for JashSync messaging
 */
const WalletDashboard = ({ 
    onRecharge,
    onViewHistory,
    className 
}) => {
    const [loading, setLoading] = useState(true);
    const [walletData, setWalletData] = useState(null);
    const [usageData, setUsageData] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [selectedPeriod, setSelectedPeriod] = useState('month');
    
    // Fetch wallet data
    useEffect(() => {
        const fetchWalletData = async () => {
            setLoading(true);
            try {
                // const response = await api.get('/jashsync/wallet');
                // setWalletData(response.data);
                
                // Mock data for development
                setWalletData({
                    balance: 4567.50,
                    messagesLeft: 45675,
                    currency: 'INR',
                    costPerMessage: 0.10,
                    plan: 'premium',
                    planExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                    lastRecharge: {
                        amount: 2000,
                        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                        bonus: 200
                    }
                });
                
                setUsageData({
                    thisMonth: {
                        sent: 12456,
                        cost: 1245.60,
                        byType: {
                            chat: 4500,
                            broadcast: 6200,
                            channel: 1756
                        }
                    },
                    lastMonth: {
                        sent: 10234,
                        cost: 1023.40
                    },
                    daily: [
                        { date: '28 Feb', sent: 456 },
                        { date: '27 Feb', sent: 523 },
                        { date: '26 Feb', sent: 389 },
                        { date: '25 Feb', sent: 612 },
                        { date: '24 Feb', sent: 478 },
                        { date: '23 Feb', sent: 534 },
                        { date: '22 Feb', sent: 401 }
                    ]
                });
                
                setTransactions([
                    {
                        id: '1',
                        type: 'recharge',
                        amount: 2000,
                        bonus: 200,
                        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                        status: 'completed',
                        description: 'Wallet Recharge',
                        paymentMethod: 'UPI'
                    },
                    {
                        id: '2',
                        type: 'usage',
                        amount: -156.50,
                        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                        status: 'completed',
                        description: 'Daily Usage - 1565 messages'
                    },
                    {
                        id: '3',
                        type: 'usage',
                        amount: -234.20,
                        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                        status: 'completed',
                        description: 'Broadcast - Fee Reminder'
                    },
                    {
                        id: '4',
                        type: 'bonus',
                        amount: 500,
                        date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
                        status: 'completed',
                        description: 'Referral Bonus'
                    },
                    {
                        id: '5',
                        type: 'recharge',
                        amount: 5000,
                        bonus: 500,
                        date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                        status: 'completed',
                        description: 'Wallet Recharge',
                        paymentMethod: 'Card'
                    }
                ]);
                
            } catch (error) {
                console.error('Failed to fetch wallet data:', error);
            } finally {
                setLoading(false);
            }
        };
        
        fetchWalletData();
    }, []);
    
    // Calculate usage percentage change
    const usageChange = useMemo(() => {
        if (!usageData) return 0;
        const current = usageData.thisMonth.sent;
        const previous = usageData.lastMonth.sent;
        if (previous === 0) return 100;
        return ((current - previous) / previous * 100).toFixed(1);
    }, [usageData]);
    
    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2
        }).format(amount);
    };
    
    // Format date
    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-IN', { 
            day: '2-digit', 
            month: 'short',
            year: 'numeric'
        });
    };
    
    // Get max daily usage for chart
    const maxDailyUsage = useMemo(() => {
        if (!usageData?.daily) return 1;
        return Math.max(...usageData.daily.map(d => d.sent));
    }, [usageData]);
    
    // Recharge packages
    const rechargePackages = [
        { amount: 500, messages: '5K', bonus: 0, popular: false },
        { amount: 1000, messages: '10K', bonus: 500, popular: false },
        { amount: 2000, messages: '22K', bonus: 2000, popular: true },
        { amount: 5000, messages: '55K', bonus: 5000, popular: false },
        { amount: 10000, messages: '115K', bonus: 15000, popular: false },
    ];
    
    if (loading) {
        return (
            <div className={cn("flex items-center justify-center h-full", className)}>
                <RefreshCw className="h-8 w-8 animate-spin text-purple-400" />
            </div>
        );
    }
    
    return (
        <div className={cn("h-full bg-white dark:bg-gray-900 overflow-auto", className)}>
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                            <Wallet className="h-6 w-6 text-purple-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Message Wallet</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Manage credits & track usage</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={onViewHistory}>
                            <Clock className="h-4 w-4 mr-2" />
                            History
                        </Button>
                        <Button 
                            size="sm" 
                            onClick={onRecharge}
                            className="bg-gradient-to-r from-purple-600 to-pink-600"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Recharge
                        </Button>
                    </div>
                </div>
                
                {/* Balance Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Current Balance */}
                    <Card className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-purple-500/30">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
                                <IndianRupee className="h-4 w-4" />
                                Current Balance
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-gray-900 dark:text-white">
                                {formatCurrency(walletData?.balance || 0)}
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                                <MessageCircle className="h-4 w-4 text-purple-400" />
                                <span className="text-sm text-purple-400">
                                    ~{walletData?.messagesLeft?.toLocaleString()} messages left
                                </span>
                            </div>
                            {walletData?.plan === 'premium' && (
                                <Badge className="mt-3 bg-gradient-to-r from-amber-500 to-orange-500">
                                    <Crown className="h-3 w-3 mr-1" />
                                    Premium Plan
                                </Badge>
                            )}
                        </CardContent>
                    </Card>
                    
                    {/* This Month Usage */}
                    <Card className="bg-gray-100/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700/50">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
                                <Send className="h-4 w-4" />
                                This Month
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-gray-900 dark:text-white">
                                {usageData?.thisMonth.sent.toLocaleString()}
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                    {formatCurrency(usageData?.thisMonth.cost || 0)} spent
                                </span>
                                <div className={cn(
                                    "flex items-center gap-0.5 text-xs",
                                    parseFloat(usageChange) >= 0 ? "text-green-400" : "text-red-400"
                                )}>
                                    {parseFloat(usageChange) >= 0 ? (
                                        <TrendingUp className="h-3 w-3" />
                                    ) : (
                                        <TrendingDown className="h-3 w-3" />
                                    )}
                                    {Math.abs(parseFloat(usageChange))}%
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    
                    {/* Cost per Message */}
                    <Card className="bg-gray-100/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700/50">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
                                <Zap className="h-4 w-4" />
                                Rate
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-gray-900 dark:text-white">
                                ₹{walletData?.costPerMessage?.toFixed(2)}
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                per message
                            </p>
                            <div className="flex items-center gap-1 mt-1 text-xs text-green-400">
                                <Percent className="h-3 w-3" />
                                Premium discount applied
                            </div>
                        </CardContent>
                    </Card>
                </div>
                
                {/* Usage by Type */}
                <Card className="bg-gray-100/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700/50">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
                                <PieChart className="h-5 w-5 text-purple-400" />
                                Usage Breakdown
                            </CardTitle>
                            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                                <SelectTrigger className="w-32 h-8 bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                                    <SelectItem value="week">This Week</SelectItem>
                                    <SelectItem value="month">This Month</SelectItem>
                                    <SelectItem value="year">This Year</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Usage by Type Chart */}
                            <div className="space-y-4">
                                {[
                                    { label: 'Broadcast', value: usageData?.thisMonth.byType.broadcast || 0, color: 'bg-red-500', icon: Send },
                                    { label: 'Direct Chat', value: usageData?.thisMonth.byType.chat || 0, color: 'bg-purple-500', icon: MessageCircle },
                                    { label: 'Channels', value: usageData?.thisMonth.byType.channel || 0, color: 'bg-blue-500', icon: BarChart3 }
                                ].map((item, idx) => {
                                    const total = usageData?.thisMonth.sent || 1;
                                    const percentage = (item.value / total * 100).toFixed(1);
                                    return (
                                        <div key={idx} className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <item.icon className="h-4 w-4 text-gray-400" />
                                                    <span className="text-sm text-gray-900 dark:text-white">{item.label}</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {item.value.toLocaleString()}
                                                    </span>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                                                        ({percentage}%)
                                                    </span>
                                                </div>
                                            </div>
                                            <Progress value={parseFloat(percentage)} className="h-2" />
                                        </div>
                                    );
                                })}
                            </div>
                            
                            {/* Daily Usage Chart */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Daily Usage (Last 7 days)</h4>
                                <div className="flex items-end justify-between h-32 gap-2">
                                    {usageData?.daily.map((day, idx) => (
                                        <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                                            <div 
                                                className="w-full bg-gradient-to-t from-purple-600 to-pink-500 rounded-t transition-all"
                                                style={{ 
                                                    height: `${(day.sent / maxDailyUsage) * 100}%`,
                                                    minHeight: '8px'
                                                }}
                                            />
                                            <span className="text-[10px] text-gray-500">{day.date.split(' ')[0]}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                
                {/* Quick Recharge Packages */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-purple-400" />
                        Quick Recharge
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {rechargePackages.map((pkg, idx) => (
                            <Card 
                                key={idx}
                                onClick={() => onRecharge?.(pkg)}
                                className={cn(
                                    "cursor-pointer hover:border-purple-500/50 transition-all",
                                    pkg.popular 
                                        ? "border-purple-500/50 bg-purple-500/10" 
                                        : "bg-gray-100/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700/50"
                                )}
                            >
                                <CardContent className="p-4 text-center">
                                    {pkg.popular && (
                                        <Badge className="mb-2 bg-gradient-to-r from-purple-600 to-pink-600">
                                            <Star className="h-3 w-3 mr-1" />
                                            Popular
                                        </Badge>
                                    )}
                                    <div className="text-2xl font-bold text-gray-900 dark:text-white">₹{pkg.amount}</div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">{pkg.messages} messages</div>
                                    {pkg.bonus > 0 && (
                                        <div className="text-xs text-green-400 mt-1 flex items-center justify-center gap-1">
                                            <Gift className="h-3 w-3" />
                                            +{pkg.bonus} bonus
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
                
                {/* Recent Transactions */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <Clock className="h-5 w-5 text-purple-400" />
                            Recent Transactions
                        </h3>
                        <Button variant="ghost" size="sm" onClick={onViewHistory}>
                            View All
                            <ArrowUpRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>
                    
                    <Card className="bg-gray-100/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700/50">
                        <CardContent className="p-0">
                            <div className="divide-y divide-gray-200 dark:divide-gray-700/50">
                                {transactions.slice(0, 5).map((tx) => (
                                    <div key={tx.id} className="p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "w-10 h-10 rounded-lg flex items-center justify-center",
                                                tx.type === 'recharge' && "bg-green-500/20 text-green-400",
                                                tx.type === 'usage' && "bg-red-500/20 text-red-400",
                                                tx.type === 'bonus' && "bg-amber-500/20 text-amber-400"
                                            )}>
                                                {tx.type === 'recharge' && <ArrowDownRight className="h-5 w-5" />}
                                                {tx.type === 'usage' && <ArrowUpRight className="h-5 w-5" />}
                                                {tx.type === 'bonus' && <Gift className="h-5 w-5" />}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white">{tx.description}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {formatDate(tx.date)}
                                                    {tx.paymentMethod && ` • via ${tx.paymentMethod}`}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={cn(
                                                "font-bold",
                                                tx.amount >= 0 ? "text-green-400" : "text-red-400"
                                            )}>
                                                {tx.amount >= 0 ? '+' : ''}{formatCurrency(tx.amount)}
                                            </p>
                                            {tx.bonus > 0 && (
                                                <p className="text-xs text-amber-400">+{formatCurrency(tx.bonus)} bonus</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
                
                {/* Low Balance Warning */}
                {walletData?.balance < 500 && (
                    <Card className="bg-red-500/10 border-red-500/30">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <AlertTriangle className="h-8 w-8 text-red-400" />
                                <div className="flex-1">
                                    <h4 className="font-medium text-red-400">Low Balance Alert</h4>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Your balance is below ₹500. Recharge now to avoid service interruption.
                                    </p>
                                </div>
                                <Button 
                                    onClick={onRecharge}
                                    className="bg-red-600 hover:bg-red-700"
                                >
                                    Recharge Now
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default WalletDashboard;
