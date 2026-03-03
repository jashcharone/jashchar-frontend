import React, { useState, useEffect } from 'react';
import { 
    Shield, AlertTriangle, CheckCircle, XCircle, Eye, Search,
    ChevronLeft, Filter, MoreVertical, MessageSquare, User,
    Clock, Ban, Flag, Trash2, Check, X, Loader2, FileText,
    Image, Video, File, AlertCircle, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useToast } from '@/components/ui/use-toast';
import { formatDate, formatDateTime, getRelativeDate } from '@/utils/dateUtils';

/**
 * ModerationPanel - Content moderation and review system
 * Review reported messages, approve/reject content, manage flags
 */
const ModerationPanel = ({ 
    open,
    onOpenChange
}) => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('pending');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all');
    
    // Moderation items
    const [items, setItems] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);
    
    // Action dialogs
    const [showActionDialog, setShowActionDialog] = useState(false);
    const [actionType, setActionType] = useState(null); // 'approve', 'reject', 'warn', 'ban'
    const [actionNote, setActionNote] = useState('');
    const [processing, setProcessing] = useState(false);
    
    useEffect(() => {
        if (open) {
            loadModerationItems();
        }
    }, [open, activeTab]);
    
    const loadModerationItems = async () => {
        setLoading(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 800));
            
            // Mock data
            const mockItems = [
                {
                    id: 1,
                    type: 'reported',
                    status: 'pending',
                    message: {
                        id: 101,
                        content: 'This is a reported message with inappropriate content that needs review...',
                        type: 'text',
                        sender: { id: 1, name: 'Unknown User', role: 'Parent', avatar: null },
                        channel: 'Direct Message',
                        sentAt: '2026-02-28T10:30:00'
                    },
                    report: {
                        reporter: { name: 'Sunita Devi', role: 'Teacher' },
                        reason: 'inappropriate_content',
                        description: 'Contains offensive language',
                        reportedAt: '2026-02-28T11:00:00'
                    },
                    createdAt: '2026-02-28T11:00:00'
                },
                {
                    id: 2,
                    type: 'reported',
                    status: 'pending',
                    message: {
                        id: 102,
                        content: 'Spam message promoting external services and products...',
                        type: 'text',
                        sender: { id: 2, name: 'Rajesh K', role: 'External', avatar: null },
                        channel: 'Class 5 Updates',
                        sentAt: '2026-02-27T15:45:00'
                    },
                    report: {
                        reporter: { name: 'Principal', role: 'Admin' },
                        reason: 'spam',
                        description: 'Promotional spam in school channel',
                        reportedAt: '2026-02-27T16:00:00'
                    },
                    createdAt: '2026-02-27T16:00:00'
                },
                {
                    id: 3,
                    type: 'flagged',
                    status: 'pending',
                    message: {
                        id: 103,
                        content: null,
                        type: 'image',
                        mediaUrl: '/placeholder-image.jpg',
                        sender: { id: 3, name: 'Amit Patel', role: 'Parent', avatar: null },
                        channel: 'Direct Message',
                        sentAt: '2026-02-26T09:15:00'
                    },
                    flag: {
                        type: 'auto_detected',
                        reason: 'Potential inappropriate image',
                        confidence: 0.75
                    },
                    createdAt: '2026-02-26T09:15:00'
                },
                {
                    id: 4,
                    type: 'reported',
                    status: 'reviewed',
                    resolution: 'approved',
                    message: {
                        id: 104,
                        content: 'Normal message that was incorrectly reported',
                        type: 'text',
                        sender: { id: 4, name: 'Vikram Singh', role: 'Teacher', avatar: null },
                        channel: 'Staff Channel',
                        sentAt: '2026-02-25T14:00:00'
                    },
                    report: {
                        reporter: { name: 'Anonymous', role: 'Unknown' },
                        reason: 'other',
                        description: 'False report',
                        reportedAt: '2026-02-25T14:30:00'
                    },
                    reviewedBy: 'Admin',
                    reviewedAt: '2026-02-25T15:00:00',
                    createdAt: '2026-02-25T14:30:00'
                }
            ];
            
            // Filter by tab
            const filtered = mockItems.filter(item => {
                if (activeTab === 'pending') return item.status === 'pending';
                if (activeTab === 'reviewed') return item.status === 'reviewed';
                return true;
            });
            
            setItems(filtered);
            
        } catch (error) {
            console.error('Failed to load moderation items:', error);
            toast({ title: "Error", description: 'Failed to load moderation queue', variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };
    
    // Filter items
    const filteredItems = items.filter(item => {
        if (filterType !== 'all' && item.type !== filterType) return false;
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
                (item.message?.content?.toLowerCase().includes(query)) ||
                (item.message?.sender?.name.toLowerCase().includes(query)) ||
                (item.report?.description?.toLowerCase().includes(query))
            );
        }
        return true;
    });
    
    // Handle action
    const handleAction = async () => {
        if (!selectedItem || !actionType) return;
        
        setProcessing(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Update item
            setItems(prev => prev.map(item => {
                if (item.id === selectedItem.id) {
                    return {
                        ...item,
                        status: 'reviewed',
                        resolution: actionType,
                        reviewedAt: new Date().toISOString()
                    };
                }
                return item;
            }));
            
            let message = '';
            switch (actionType) {
                case 'approve':
                    message = 'Content approved and restored';
                    break;
                case 'reject':
                    message = 'Content removed';
                    break;
                case 'warn':
                    message = 'Warning sent to user';
                    break;
                case 'ban':
                    message = 'User has been banned';
                    break;
            }
            
            toast({ title: "Action Completed", description: message });
            setShowActionDialog(false);
            setSelectedItem(null);
            setActionNote('');
            
            // Refresh if on pending tab
            if (activeTab === 'pending') {
                loadModerationItems();
            }
            
        } catch (error) {
            console.error('Action failed:', error);
            toast({ title: "Error", description: 'Failed to complete action', variant: "destructive" });
        } finally {
            setProcessing(false);
        }
    };
    
    // Get reason label
    const getReasonLabel = (reason) => {
        const labels = {
            inappropriate_content: 'Inappropriate Content',
            spam: 'Spam',
            harassment: 'Harassment',
            misinformation: 'Misinformation',
            other: 'Other'
        };
        return labels[reason] || reason;
    };
    
    // Get initials
    const getInitials = (name) => {
        return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';
    };
    
    // Get message preview
    const getMessagePreview = (message) => {
        if (message.type === 'text') return message.content;
        if (message.type === 'image') return '[Image]';
        if (message.type === 'video') return '[Video]';
        if (message.type === 'file') return '[File]';
        return '[Media]';
    };
    
    // Get type icon
    const getTypeIcon = (type) => {
        switch (type) {
            case 'text': return <MessageSquare className="w-4 h-4" />;
            case 'image': return <Image className="w-4 h-4" />;
            case 'video': return <Video className="w-4 h-4" />;
            case 'file': return <File className="w-4 h-4" />;
            default: return <FileText className="w-4 h-4" />;
        }
    };
    
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 max-w-4xl p-0 max-h-[90vh]">
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
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                            <Shield className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                            <DialogTitle className="text-gray-900 dark:text-white">Moderation Queue</DialogTitle>
                            <DialogDescription>
                                Review and moderate reported content
                            </DialogDescription>
                        </div>
                        <Button 
                            variant="outline" 
                            size="sm"
                            onClick={loadModerationItems}
                            className="border-gray-200 dark:border-gray-700"
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Refresh
                        </Button>
                    </div>
                </DialogHeader>
                
                {/* Tabs & Filters */}
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700/50">
                    <div className="flex items-center justify-between gap-4">
                        <Tabs value={activeTab} onValueChange={setActiveTab}>
                            <TabsList className="bg-gray-100 dark:bg-gray-800">
                                <TabsTrigger value="pending" className="data-[state=active]:bg-purple-600">
                                    <AlertTriangle className="w-4 h-4 mr-2" />
                                    Pending
                                </TabsTrigger>
                                <TabsTrigger value="reviewed" className="data-[state=active]:bg-purple-600">
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Reviewed
                                </TabsTrigger>
                                <TabsTrigger value="all" className="data-[state=active]:bg-purple-600">
                                    All
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                        
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <Input
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search..."
                                    className="pl-10 w-[200px] bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                                />
                            </div>
                            
                            <Select value={filterType} onValueChange={setFilterType}>
                                <SelectTrigger className="w-[130px] bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                                    <Filter className="w-4 h-4 mr-2 text-gray-400" />
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="reported">Reported</SelectItem>
                                    <SelectItem value="flagged">Auto-Flagged</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
                
                {/* Content */}
                <ScrollArea className="flex-1 max-h-[calc(90vh-200px)]">
                    <div className="p-4 space-y-3">
                        {loading ? (
                            <div className="flex items-center justify-center py-12 text-gray-400">
                                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                                Loading moderation queue...
                            </div>
                        ) : filteredItems.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p className="font-medium">No items to review</p>
                                <p className="text-sm">
                                    {activeTab === 'pending' ? 'All caught up! No pending moderation items.' : 'No items match your filters.'}
                                </p>
                            </div>
                        ) : (
                            filteredItems.map((item) => (
                                <Card key={item.id} className="bg-gray-100/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
                                    <CardContent className="p-4">
                                        <div className="flex items-start gap-4">
                                            {/* Sender Avatar */}
                                            <Avatar className="w-10 h-10">
                                                <AvatarImage src={item.message.sender.avatar} />
                                                <AvatarFallback className={cn(
                                                    item.status === 'pending' ? "bg-orange-500/20 text-orange-400" : "bg-gray-700 text-gray-300"
                                                )}>
                                                    {getInitials(item.message.sender.name)}
                                                </AvatarFallback>
                                            </Avatar>
                                            
                                            <div className="flex-1 min-w-0">
                                                {/* Header */}
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-medium text-gray-900 dark:text-white">{item.message.sender.name}</span>
                                                    <Badge variant="outline" className="text-xs text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600">
                                                        {item.message.sender.role}
                                                    </Badge>
                                                    {item.type === 'reported' && (
                                                        <Badge className="bg-orange-500/20 text-orange-400">
                                                            <Flag className="w-3 h-3 mr-1" />
                                                            Reported
                                                        </Badge>
                                                    )}
                                                    {item.type === 'flagged' && (
                                                        <Badge className="bg-yellow-500/20 text-yellow-400">
                                                            <AlertCircle className="w-3 h-3 mr-1" />
                                                            Auto-Flagged
                                                        </Badge>
                                                    )}
                                                    {item.status === 'reviewed' && (
                                                        <Badge className={cn(
                                                            "ml-auto",
                                                            item.resolution === 'approved' ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                                                        )}>
                                                            {item.resolution === 'approved' ? <Check className="w-3 h-3 mr-1" /> : <X className="w-3 h-3 mr-1" />}
                                                            {item.resolution === 'approved' ? 'Approved' : 'Rejected'}
                                                        </Badge>
                                                    )}
                                                </div>
                                                
                                                {/* Message Content */}
                                                <div className="p-3 rounded-lg bg-gray-200/50 dark:bg-gray-700/30 border border-gray-300/50 dark:border-gray-600/50 mb-2">
                                                    <div className="flex items-center gap-2 mb-1 text-xs text-gray-500">
                                                        {getTypeIcon(item.message.type)}
                                                        <span>{item.message.channel}</span>
                                                        <span>•</span>
                                                        <span>{formatDateTime(item.message.sentAt)}</span>
                                                    </div>
                                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                                        {getMessagePreview(item.message)}
                                                    </p>
                                                </div>
                                                
                                                {/* Report Info */}
                                                {item.report && (
                                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                                        <span>Reported by: <strong className="text-gray-700 dark:text-gray-300">{item.report.reporter.name}</strong></span>
                                                        <span>Reason: <strong className="text-orange-400">{getReasonLabel(item.report.reason)}</strong></span>
                                                        <span>{getRelativeDate(item.report.reportedAt)}</span>
                                                    </div>
                                                )}
                                                
                                                {/* Flag Info */}
                                                {item.flag && (
                                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                                        <span>Flagged: <strong className="text-yellow-400">{item.flag.reason}</strong></span>
                                                        <span>Confidence: {Math.round(item.flag.confidence * 100)}%</span>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {/* Actions */}
                                            {item.status === 'pending' ? (
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="border-green-500/50 text-green-400 hover:bg-green-500/10"
                                                        onClick={() => {
                                                            setSelectedItem(item);
                                                            setActionType('approve');
                                                            setShowActionDialog(true);
                                                        }}
                                                    >
                                                        <Check className="w-4 h-4 mr-1" />
                                                        Approve
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                                                        onClick={() => {
                                                            setSelectedItem(item);
                                                            setActionType('reject');
                                                            setShowActionDialog(true);
                                                        }}
                                                    >
                                                        <X className="w-4 h-4 mr-1" />
                                                        Remove
                                                    </Button>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="text-gray-400">
                                                                <MoreVertical className="w-4 h-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                                                            <DropdownMenuItem 
                                                                className="text-yellow-600 dark:text-yellow-400"
                                                                onClick={() => {
                                                                    setSelectedItem(item);
                                                                    setActionType('warn');
                                                                    setShowActionDialog(true);
                                                                }}
                                                            >
                                                                <AlertTriangle className="w-4 h-4 mr-2" />
                                                                Warn User
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem 
                                                                className="text-red-600 dark:text-red-400"
                                                                onClick={() => {
                                                                    setSelectedItem(item);
                                                                    setActionType('ban');
                                                                    setShowActionDialog(true);
                                                                }}
                                                            >
                                                                <Ban className="w-4 h-4 mr-2" />
                                                                Ban User
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
                                                            <DropdownMenuItem className="text-gray-700 dark:text-gray-300">
                                                                <Eye className="w-4 h-4 mr-2" />
                                                                View Context
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            ) : (
                                                <div className="text-xs text-gray-500 text-right">
                                                    <p>Reviewed by {item.reviewedBy}</p>
                                                    <p>{getRelativeDate(item.reviewedAt)}</p>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </DialogContent>
            
            {/* Action Dialog */}
            <AlertDialog open={showActionDialog} onOpenChange={setShowActionDialog}>
                <AlertDialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-gray-900 dark:text-white">
                            {actionType === 'approve' && 'Approve Content'}
                            {actionType === 'reject' && 'Remove Content'}
                            {actionType === 'warn' && 'Warn User'}
                            {actionType === 'ban' && 'Ban User'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {actionType === 'approve' && 'This will mark the content as approved and dismiss the report.'}
                            {actionType === 'reject' && 'This will remove the content and notify the sender.'}
                            {actionType === 'warn' && 'This will send a warning to the user about their content.'}
                            {actionType === 'ban' && 'This will permanently ban the user from JashSync. This action cannot be undone.'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    
                    <div className="space-y-4 py-4">
                        <div>
                            <label className="text-sm text-gray-500 dark:text-gray-400 mb-2 block">
                                Add a note (optional)
                            </label>
                            <Textarea
                                value={actionNote}
                                onChange={(e) => setActionNote(e.target.value)}
                                placeholder="Add any notes about this decision..."
                                className="bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 min-h-[80px]"
                            />
                        </div>
                    </div>
                    
                    <AlertDialogFooter>
                        <AlertDialogCancel 
                            className="bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700"
                            disabled={processing}
                        >
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                handleAction();
                            }}
                            disabled={processing}
                            className={cn(
                                actionType === 'approve' && "bg-green-600 hover:bg-green-700",
                                actionType === 'reject' && "bg-red-600 hover:bg-red-700",
                                actionType === 'warn' && "bg-yellow-600 hover:bg-yellow-700",
                                actionType === 'ban' && "bg-red-600 hover:bg-red-700"
                            )}
                        >
                            {processing ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    {actionType === 'approve' && <Check className="w-4 h-4 mr-2" />}
                                    {actionType === 'reject' && <Trash2 className="w-4 h-4 mr-2" />}
                                    {actionType === 'warn' && <AlertTriangle className="w-4 h-4 mr-2" />}
                                    {actionType === 'ban' && <Ban className="w-4 h-4 mr-2" />}
                                    Confirm
                                </>
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Dialog>
    );
};

export default ModerationPanel;
