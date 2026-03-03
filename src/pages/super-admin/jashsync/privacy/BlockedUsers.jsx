import React, { useState, useEffect } from 'react';
import { 
    UserX, Search, ChevronLeft, Trash2, MoreVertical, 
    UserPlus, AlertCircle, Loader2, Shield, MessageSquare,
    Phone, Mail, Calendar, Check, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
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
import { formatDate } from '@/utils/dateUtils';

/**
 * BlockedUsers - Manage blocked users list
 * View, unblock users, and block new users
 */
const BlockedUsers = ({ 
    open,
    onOpenChange,
    onBack
}) => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [blockedUsers, setBlockedUsers] = useState([]);
    const [showBlockModal, setShowBlockModal] = useState(false);
    const [showUnblockConfirm, setShowUnblockConfirm] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [blockSearchQuery, setBlockSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    
    useEffect(() => {
        if (open) {
            loadBlockedUsers();
        }
    }, [open]);
    
    const loadBlockedUsers = async () => {
        setLoading(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 800));
            
            // Mock blocked users
            const mockUsers = [
                {
                    id: 1,
                    name: 'Rajesh Kumar',
                    role: 'Parent',
                    avatar: null,
                    phone: '+91 98765 43210',
                    email: 'rajesh@example.com',
                    blockedAt: '2026-02-15',
                    reason: 'Spam messages'
                },
                {
                    id: 2,
                    name: 'Priya Sharma',
                    role: 'Parent',
                    avatar: null,
                    phone: '+91 87654 32109',
                    email: 'priya@example.com',
                    blockedAt: '2026-02-10',
                    reason: 'Inappropriate content'
                },
                {
                    id: 3,
                    name: 'Unknown User',
                    role: 'External',
                    avatar: null,
                    phone: '+91 76543 21098',
                    email: null,
                    blockedAt: '2026-01-28',
                    reason: 'Unknown sender'
                },
            ];
            
            setBlockedUsers(mockUsers);
            
        } catch (error) {
            console.error('Failed to load blocked users:', error);
            toast({ title: "Error", description: 'Failed to load blocked users', variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };
    
    // Search for users to block
    const searchUsers = async (query) => {
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }
        
        setSearching(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Mock search results
            const mockResults = [
                { id: 10, name: 'Amit Patel', role: 'Parent', avatar: null },
                { id: 11, name: 'Sunita Devi', role: 'Parent', avatar: null },
                { id: 12, name: 'Vikram Singh', role: 'Staff', avatar: null },
            ].filter(u => u.name.toLowerCase().includes(query.toLowerCase()));
            
            setSearchResults(mockResults);
            
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setSearching(false);
        }
    };
    
    // Block a user
    const blockUser = async (user) => {
        try {
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const newBlocked = {
                ...user,
                blockedAt: new Date().toISOString().split('T')[0],
                reason: 'Manually blocked'
            };
            
            setBlockedUsers(prev => [newBlocked, ...prev]);
            setShowBlockModal(false);
            setBlockSearchQuery('');
            setSearchResults([]);
            
            toast({ title: "Blocked", description: `${user.name} has been blocked` });
            
        } catch (error) {
            console.error('Failed to block user:', error);
            toast({ title: "Error", description: 'Failed to block user', variant: "destructive" });
        }
    };
    
    // Unblock a user
    const unblockUser = async () => {
        if (!selectedUser) return;
        
        try {
            await new Promise(resolve => setTimeout(resolve, 500));
            
            setBlockedUsers(prev => prev.filter(u => u.id !== selectedUser.id));
            setShowUnblockConfirm(false);
            
            toast({ title: "Unblocked", description: `${selectedUser.name} has been unblocked` });
            setSelectedUser(null);
            
        } catch (error) {
            console.error('Failed to unblock user:', error);
            toast({ title: "Error", description: 'Failed to unblock user', variant: "destructive" });
        }
    };
    
    // Filter blocked users
    const filteredUsers = blockedUsers.filter(user => 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.role.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    // Get initials
    const getInitials = (name) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };
    
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 max-w-lg p-0 max-h-[85vh]">
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
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center">
                            <UserX className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                            <DialogTitle className="text-gray-900 dark:text-white">Blocked Users</DialogTitle>
                            <DialogDescription>
                                {blockedUsers.length} user{blockedUsers.length !== 1 ? 's' : ''} blocked
                            </DialogDescription>
                        </div>
                        <Button 
                            size="sm"
                            onClick={() => setShowBlockModal(true)}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            <UserPlus className="w-4 h-4 mr-2" />
                            Block
                        </Button>
                    </div>
                </DialogHeader>
                
                {/* Search */}
                <div className="px-4 py-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search blocked users..."
                            className="pl-10 bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                        />
                    </div>
                </div>
                
                {/* List */}
                <ScrollArea className="flex-1 max-h-[calc(85vh-180px)]">
                    <div className="p-4 pt-2 space-y-2">
                        {loading ? (
                            <div className="flex items-center justify-center py-12 text-gray-400">
                                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                                Loading...
                            </div>
                        ) : filteredUsers.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p className="font-medium">No blocked users</p>
                                <p className="text-sm">Users you block won't be able to message you</p>
                            </div>
                        ) : (
                            filteredUsers.map((user) => (
                                <Card key={user.id} className="bg-gray-100/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
                                    <CardContent className="p-3">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="w-10 h-10">
                                                <AvatarImage src={user.avatar} />
                                                <AvatarFallback className="bg-red-500/20 text-red-400">
                                                    {getInitials(user.name)}
                                                </AvatarFallback>
                                            </Avatar>
                                            
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium text-gray-900 dark:text-white truncate">{user.name}</p>
                                                    <Badge variant="outline" className="text-xs text-gray-400 border-gray-600">
                                                        {user.role}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                                    <Calendar className="w-3 h-3" />
                                                    Blocked {formatDate(user.blockedAt)}
                                                </div>
                                            </div>
                                            
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="text-gray-400">
                                                        <MoreVertical className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                                                    <DropdownMenuItem 
                                                        className="text-green-400"
                                                        onClick={() => {
                                                            setSelectedUser(user);
                                                            setShowUnblockConfirm(true);
                                                        }}
                                                    >
                                                        <Check className="w-4 h-4 mr-2" />
                                                        Unblock
                                                    </DropdownMenuItem>
                                                    {user.phone && (
                                                        <DropdownMenuItem className="text-gray-300">
                                                            <Phone className="w-4 h-4 mr-2" />
                                                            {user.phone}
                                                        </DropdownMenuItem>
                                                    )}
                                                    {user.email && (
                                                        <DropdownMenuItem className="text-gray-300">
                                                            <Mail className="w-4 h-4 mr-2" />
                                                            {user.email}
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                        
                                        {user.reason && (
                                            <div className="mt-2 ml-13 text-xs text-gray-500 flex items-center gap-1">
                                                <AlertCircle className="w-3 h-3" />
                                                Reason: {user.reason}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </ScrollArea>
                
                {/* Info Note */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700/50">
                    <div className="p-3 rounded-lg bg-gray-100/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            <strong className="text-gray-300">Note:</strong> Blocked users cannot send you messages, 
                            see your online status, or add you to groups. They won't be notified that they've been blocked.
                        </p>
                    </div>
                </div>
            </DialogContent>
            
            {/* Block User Modal */}
            <Dialog open={showBlockModal} onOpenChange={setShowBlockModal}>
                <DialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-gray-900 dark:text-white">Block a User</DialogTitle>
                        <DialogDescription>
                            Search for a user to block them from messaging you
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <Input
                                value={blockSearchQuery}
                                onChange={(e) => {
                                    setBlockSearchQuery(e.target.value);
                                    searchUsers(e.target.value);
                                }}
                                placeholder="Search by name..."
                                className="pl-10 bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                            />
                        </div>
                        
                        {searching && (
                            <div className="flex items-center justify-center py-4 text-gray-400">
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                Searching...
                            </div>
                        )}
                        
                        {searchResults.length > 0 && (
                            <div className="space-y-2 max-h-[200px] overflow-y-auto">
                                {searchResults.map((user) => (
                                    <Card 
                                        key={user.id} 
                                        className="bg-gray-800/50 border-gray-700 cursor-pointer hover:border-red-500/50 transition-colors"
                                        onClick={() => blockUser(user)}
                                    >
                                        <CardContent className="p-3 flex items-center gap-3">
                                            <Avatar className="w-8 h-8">
                                                <AvatarFallback className="bg-gray-700 text-gray-300 text-xs">
                                                    {getInitials(user.name)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-white">{user.name}</p>
                                                <p className="text-xs text-gray-400">{user.role}</p>
                                            </div>
                                            <UserX className="w-4 h-4 text-red-400" />
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                        
                        {blockSearchQuery.length >= 2 && !searching && searchResults.length === 0 && (
                            <div className="text-center py-4 text-gray-500">
                                No users found
                            </div>
                        )}
                    </div>
                    
                    <DialogFooter>
                        <Button 
                            variant="outline" 
                            onClick={() => setShowBlockModal(false)}
                            className="border-gray-700"
                        >
                            Cancel
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            
            {/* Unblock Confirmation */}
            <AlertDialog open={showUnblockConfirm} onOpenChange={setShowUnblockConfirm}>
                <AlertDialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-white">Unblock User?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to unblock <strong className="text-white">{selectedUser?.name}</strong>? 
                            They will be able to message you again.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={unblockUser}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            Unblock
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Dialog>
    );
};

export default BlockedUsers;
