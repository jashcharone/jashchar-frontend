import React, { useState, useEffect, useMemo } from 'react';
import { 
    Clock, Search, Filter, Download, ArrowUpRight, ArrowDownRight,
    Calendar, ChevronDown, Gift, CreditCard, Send, RefreshCw,
    CheckCircle, XCircle, AlertCircle, IndianRupee, X, FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import api from "@/services/api";

/**
 * TransactionHistory - Full transaction history with filters
 * Search, filter by type/date, export functionality
 */
const TransactionHistory = ({ 
    open, 
    onOpenChange 
}) => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('all');
    const [selectedTx, setSelectedTx] = useState(null);
    
    // Fetch transactions
    useEffect(() => {
        if (!open) return;
        
        const fetchTransactions = async () => {
            setLoading(true);
            try {
                // const response = await api.get('/jashsync/wallet/transactions');
                // setTransactions(response.data);
                
                // Mock data for development
                setTransactions([
                    {
                        id: 'TXN1709301234',
                        type: 'recharge',
                        amount: 2000,
                        bonus: 200,
                        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                        status: 'completed',
                        description: 'Wallet Recharge',
                        paymentMethod: 'UPI',
                        upiId: 'school@upi',
                        balanceAfter: 4567.50
                    },
                    {
                        id: 'TXN1709291234',
                        type: 'usage',
                        amount: -156.50,
                        messagesCount: 1565,
                        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                        status: 'completed',
                        description: 'Daily Usage',
                        balanceAfter: 2567.50
                    },
                    {
                        id: 'TXN1709281234',
                        type: 'usage',
                        amount: -234.20,
                        messagesCount: 2342,
                        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                        status: 'completed',
                        description: 'Broadcast - Fee Reminder March',
                        broadcastId: 'BC123',
                        balanceAfter: 2724.00
                    },
                    {
                        id: 'TXN1709271234',
                        type: 'bonus',
                        amount: 500,
                        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                        status: 'completed',
                        description: 'Referral Bonus - ABC School',
                        referralCode: 'REF456',
                        balanceAfter: 2958.20
                    },
                    {
                        id: 'TXN1709201234',
                        type: 'recharge',
                        amount: 5000,
                        bonus: 500,
                        date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
                        status: 'completed',
                        description: 'Wallet Recharge',
                        paymentMethod: 'Card',
                        cardLast4: '4242',
                        balanceAfter: 2458.20
                    },
                    {
                        id: 'TXN1709151234',
                        type: 'usage',
                        amount: -89.00,
                        messagesCount: 890,
                        date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
                        status: 'completed',
                        description: 'Channel Messages - Class 10-A',
                        balanceAfter: -2041.80
                    },
                    {
                        id: 'TXN1709101234',
                        type: 'refund',
                        amount: 200,
                        date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
                        status: 'completed',
                        description: 'Failed broadcast refund',
                        originalTxId: 'TXN1709091234',
                        balanceAfter: -1952.80
                    },
                    {
                        id: 'TXN1709091234',
                        type: 'usage',
                        amount: -200,
                        messagesCount: 2000,
                        date: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
                        status: 'failed',
                        description: 'Broadcast - Parent Meeting (Failed)',
                        error: 'Service temporarily unavailable',
                        balanceAfter: -2152.80
                    },
                    {
                        id: 'TXN1709011234',
                        type: 'recharge',
                        amount: 1000,
                        bonus: 100,
                        date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                        status: 'completed',
                        description: 'Wallet Recharge',
                        paymentMethod: 'Net Banking',
                        bank: 'HDFC Bank',
                        balanceAfter: -1952.80
                    }
                ]);
                
            } catch (error) {
                console.error('Failed to fetch transactions:', error);
            } finally {
                setLoading(false);
            }
        };
        
        fetchTransactions();
    }, [open]);
    
    // Transaction type config
    const typeConfig = {
        recharge: { label: 'Recharge', icon: ArrowDownRight, color: 'text-green-400 bg-green-500/20' },
        usage: { label: 'Usage', icon: ArrowUpRight, color: 'text-red-400 bg-red-500/20' },
        bonus: { label: 'Bonus', icon: Gift, color: 'text-amber-400 bg-amber-500/20' },
        refund: { label: 'Refund', icon: RefreshCw, color: 'text-blue-400 bg-blue-500/20' }
    };
    
    // Status config
    const statusConfig = {
        completed: { label: 'Completed', icon: CheckCircle, color: 'text-green-400' },
        pending: { label: 'Pending', icon: AlertCircle, color: 'text-amber-400' },
        failed: { label: 'Failed', icon: XCircle, color: 'text-red-400' }
    };
    
    // Filter transactions
    const filteredTransactions = useMemo(() => {
        let result = [...transactions];
        
        // Type filter
        if (typeFilter !== 'all') {
            result = result.filter(tx => tx.type === typeFilter);
        }
        
        // Status filter
        if (statusFilter !== 'all') {
            result = result.filter(tx => tx.status === statusFilter);
        }
        
        // Date filter
        if (dateFilter !== 'all') {
            const now = new Date();
            const filterDate = new Date();
            
            switch (dateFilter) {
                case 'today':
                    filterDate.setHours(0, 0, 0, 0);
                    break;
                case 'week':
                    filterDate.setDate(now.getDate() - 7);
                    break;
                case 'month':
                    filterDate.setMonth(now.getMonth() - 1);
                    break;
                case '3months':
                    filterDate.setMonth(now.getMonth() - 3);
                    break;
            }
            
            result = result.filter(tx => new Date(tx.date) >= filterDate);
        }
        
        // Search
        if (search.trim()) {
            const query = search.toLowerCase();
            result = result.filter(tx => 
                tx.id?.toLowerCase().includes(query) ||
                tx.description?.toLowerCase().includes(query)
            );
        }
        
        // Sort by date (newest first)
        result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        return result;
    }, [transactions, typeFilter, statusFilter, dateFilter, search]);
    
    // Calculate totals
    const totals = useMemo(() => {
        const credits = filteredTransactions
            .filter(tx => tx.amount > 0 && tx.status === 'completed')
            .reduce((sum, tx) => sum + tx.amount + (tx.bonus || 0), 0);
            
        const debits = filteredTransactions
            .filter(tx => tx.amount < 0 && tx.status === 'completed')
            .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
            
        return { credits, debits, net: credits - debits };
    }, [filteredTransactions]);
    
    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2
        }).format(Math.abs(amount));
    };
    
    // Format date
    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-IN', { 
            day: '2-digit', 
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };
    
    // Export transactions
    const exportTransactions = () => {
        const csv = [
            ['Date', 'Transaction ID', 'Type', 'Description', 'Amount', 'Status'].join(','),
            ...filteredTransactions.map(tx => [
                formatDate(tx.date),
                tx.id,
                tx.type,
                `"${tx.description}"`,
                tx.amount,
                tx.status
            ].join(','))
        ].join('\n');
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `jashsync_transactions_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };
    
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 max-w-3xl max-h-[85vh] p-0">
                <DialogHeader className="p-4 pb-2 border-b border-gray-200 dark:border-gray-700/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                            <Clock className="h-5 w-5 text-purple-400" />
                        </div>
                        <div>
                            <DialogTitle className="text-gray-900 dark:text-white">Transaction History</DialogTitle>
                            <DialogDescription>
                                {filteredTransactions.length} transactions found
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>
                
                <div className="p-4 border-b border-gray-200 dark:border-gray-700/50 space-y-4">
                    {/* Search & Filters */}
                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="relative flex-1 min-w-48">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search by ID or description..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9 bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                            />
                        </div>
                        
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger className="w-32 bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                                <SelectValue placeholder="Type" />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="recharge">Recharge</SelectItem>
                                <SelectItem value="usage">Usage</SelectItem>
                                <SelectItem value="bonus">Bonus</SelectItem>
                                <SelectItem value="refund">Refund</SelectItem>
                            </SelectContent>
                        </Select>
                        
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-32 bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="failed">Failed</SelectItem>
                            </SelectContent>
                        </Select>
                        
                        <Select value={dateFilter} onValueChange={setDateFilter}>
                            <SelectTrigger className="w-32 bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                                <SelectValue placeholder="Date" />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                                <SelectItem value="all">All Time</SelectItem>
                                <SelectItem value="today">Today</SelectItem>
                                <SelectItem value="week">Last 7 days</SelectItem>
                                <SelectItem value="month">Last 30 days</SelectItem>
                                <SelectItem value="3months">Last 3 months</SelectItem>
                            </SelectContent>
                        </Select>
                        
                        <Button variant="outline" size="sm" onClick={exportTransactions}>
                            <Download className="h-4 w-4 mr-2" />
                            Export
                        </Button>
                    </div>
                    
                    {/* Summary Cards */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Credits</p>
                            <p className="text-lg font-bold text-green-400">+{formatCurrency(totals.credits)}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Debits</p>
                            <p className="text-lg font-bold text-red-400">-{formatCurrency(totals.debits)}</p>
                        </div>
                        <div className={cn(
                            "p-3 rounded-lg border",
                            totals.net >= 0 ? "bg-purple-500/10 border-purple-500/30" : "bg-amber-500/10 border-amber-500/30"
                        )}>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Net</p>
                            <p className={cn(
                                "text-lg font-bold",
                                totals.net >= 0 ? "text-purple-400" : "text-amber-400"
                            )}>
                                {totals.net >= 0 ? '+' : '-'}{formatCurrency(totals.net)}
                            </p>
                        </div>
                    </div>
                </div>
                
                {/* Transaction List */}
                <ScrollArea className="flex-1 max-h-[50vh]">
                    {loading ? (
                        <div className="flex items-center justify-center h-32">
                            <RefreshCw className="h-8 w-8 animate-spin text-purple-400" />
                        </div>
                    ) : filteredTransactions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                            <FileText className="h-8 w-8 mb-2 opacity-50" />
                            <p className="text-sm">No transactions found</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200 dark:divide-gray-700/50">
                            {filteredTransactions.map((tx) => {
                                const typeInfo = typeConfig[tx.type] || typeConfig.usage;
                                const statusInfo = statusConfig[tx.status] || statusConfig.completed;
                                const TypeIcon = typeInfo.icon;
                                const StatusIcon = statusInfo.icon;
                                
                                return (
                                    <div 
                                        key={tx.id}
                                        onClick={() => setSelectedTx(tx)}
                                        className="p-4 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "w-10 h-10 rounded-lg flex items-center justify-center",
                                                typeInfo.color
                                            )}>
                                                <TypeIcon className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white">{tx.description}</p>
                                                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                                    <span className="font-mono">{tx.id}</span>
                                                    <span>•</span>
                                                    <span>{formatDate(tx.date)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="text-right">
                                            <p className={cn(
                                                "text-lg font-bold",
                                                tx.amount >= 0 ? "text-green-400" : "text-red-400"
                                            )}>
                                                {tx.amount >= 0 ? '+' : ''}{formatCurrency(tx.amount)}
                                            </p>
                                            <div className="flex items-center justify-end gap-1">
                                                <StatusIcon className={cn("h-3 w-3", statusInfo.color)} />
                                                <span className={cn("text-xs", statusInfo.color)}>
                                                    {statusInfo.label}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </ScrollArea>
                
                {/* Transaction Detail Modal */}
                {selectedTx && (
                    <Dialog open={!!selectedTx} onOpenChange={() => setSelectedTx(null)}>
                            <DialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 max-w-md">
                            <DialogHeader>
                                <DialogTitle className="text-white">Transaction Details</DialogTitle>
                            </DialogHeader>
                            
                            <div className="space-y-4">
                                {/* Amount */}
                                <div className="text-center py-4 border-b border-gray-700/50">
                                    <p className={cn(
                                        "text-3xl font-bold",
                                        selectedTx.amount >= 0 ? "text-green-400" : "text-red-400"
                                    )}>
                                        {selectedTx.amount >= 0 ? '+' : ''}{formatCurrency(selectedTx.amount)}
                                    </p>
                                    {selectedTx.bonus > 0 && (
                                        <p className="text-sm text-amber-400 mt-1">
                                            +{formatCurrency(selectedTx.bonus)} bonus
                                        </p>
                                    )}
                                </div>
                                
                                {/* Details */}
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Transaction ID</span>
                                        <span className="text-white font-mono">{selectedTx.id}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Type</span>
                                        <Badge className={typeConfig[selectedTx.type]?.color}>
                                            {typeConfig[selectedTx.type]?.label}
                                        </Badge>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Status</span>
                                        <span className={statusConfig[selectedTx.status]?.color}>
                                            {statusConfig[selectedTx.status]?.label}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Date</span>
                                        <span className="text-white">{formatDate(selectedTx.date)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Description</span>
                                        <span className="text-white text-right max-w-[60%]">{selectedTx.description}</span>
                                    </div>
                                    
                                    {selectedTx.paymentMethod && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-400">Payment Method</span>
                                            <span className="text-white">{selectedTx.paymentMethod}</span>
                                        </div>
                                    )}
                                    
                                    {selectedTx.messagesCount && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-400">Messages</span>
                                            <span className="text-white">{selectedTx.messagesCount.toLocaleString()}</span>
                                        </div>
                                    )}
                                    
                                    {selectedTx.balanceAfter !== undefined && (
                                        <div className="flex justify-between text-sm pt-2 border-t border-gray-700/50">
                                            <span className="text-gray-400">Balance After</span>
                                            <span className="text-purple-400 font-medium">
                                                {formatCurrency(selectedTx.balanceAfter)}
                                            </span>
                                        </div>
                                    )}
                                    
                                    {selectedTx.error && (
                                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                                            <p className="text-xs text-red-400">{selectedTx.error}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default TransactionHistory;
