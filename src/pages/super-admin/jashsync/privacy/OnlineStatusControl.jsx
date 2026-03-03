import React, { useState, useEffect } from 'react';
import { 
    Eye, EyeOff, ChevronLeft, Search, Users, UserCheck, UserX,
    Loader2, Clock, Check, X, Filter, Globe, UserPlus, Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
import { formatDate, getRelativeDate } from '@/utils/dateUtils';

/**
 * OnlineStatusControl - Advanced online status visibility controls
 * Hide from specific users, custom visibility rules
 */
const OnlineStatusControl = ({ 
    open,
    onOpenChange
}) => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [searchQuery, setSearchQuery] = useState('');
    
    // Settings
    const [globalStatus, setGlobalStatus] = useState('online'); // online, away, busy, invisible
    const [customMessage, setCustomMessage] = useState('');
    
    // Lists
    const [hiddenFromUsers, setHiddenFromUsers] = useState([]);
    const [alwaysVisibleTo, setAlwaysVisibleTo] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    
    useEffect(() => {
        if (open) {
            loadData();
        }
    }, [open]);
    
    const loadData = async () => {
        setLoading(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 800));
            
            // Mock data
            setHiddenFromUsers([
                { id: 1, name: 'Rajesh Kumar', role: 'Parent', avatar: null, addedAt: '2026-02-20' },
                { id: 2, name: 'External Contact', role: 'External', avatar: null, addedAt: '2026-02-18' },
            ]);
            
            setAlwaysVisibleTo([
                { id: 10, name: 'Principal Admin', role: 'Admin', avatar: null, addedAt: '2026-01-15' },
                { id: 11, name: 'Head Teacher', role: 'Teacher', avatar: null, addedAt: '2026-01-15' },
            ]);
            
        } catch (error) {
            console.error('Failed to load data:', error);
            toast({ title: "Error", description: 'Failed to load settings', variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };
    
    // Search users
    const searchUsers = async (query) => {
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }
        
        setSearching(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 400));
            
            // Mock results
            const results = [
                { id: 20, name: 'Amit Sharma', role: 'Parent', avatar: null },
                { id: 21, name: 'Sunita Patel', role: 'Teacher', avatar: null },
                { id: 22, name: 'Vikram Singh', role: 'Staff', avatar: null },
            ].filter(u => 
                u.name.toLowerCase().includes(query.toLowerCase()) &&
                !hiddenFromUsers.find(h => h.id === u.id) &&
                !alwaysVisibleTo.find(a => a.id === u.id)
            );
            
            setSearchResults(results);
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setSearching(false);
        }
    };
    
    // Add to hidden list
    const hideFromUser = (user) => {
        setHiddenFromUsers(prev => [...prev, { ...user, addedAt: new Date().toISOString() }]);
        setSearchResults(prev => prev.filter(u => u.id !== user.id));
        toast({ title: "Hidden", description: `Your status is now hidden from ${user.name}` });
    };
    
    // Remove from hidden list
    const unhideFromUser = (userId) => {
        const user = hiddenFromUsers.find(u => u.id === userId);
        setHiddenFromUsers(prev => prev.filter(u => u.id !== userId));
        if (user) {
            toast({ title: "Visible", description: `${user.name} can now see your status` });
        }
    };
    
    // Add to always visible list
    const addAlwaysVisible = (user) => {
        setAlwaysVisibleTo(prev => [...prev, { ...user, addedAt: new Date().toISOString() }]);
        setSearchResults(prev => prev.filter(u => u.id !== user.id));
        toast({ title: "Added", description: `${user.name} will always see your status` });
    };
    
    // Remove from always visible list
    const removeAlwaysVisible = (userId) => {
        const user = alwaysVisibleTo.find(u => u.id === userId);
        setAlwaysVisibleTo(prev => prev.filter(u => u.id !== userId));
        if (user) {
            toast({ title: "Removed", description: `${user.name} removed from always visible list` });
        }
    };
    
    // Status options
    const statusOptions = [
        { value: 'online', label: 'Online', color: 'bg-green-500', description: 'Available for messages' },
        { value: 'away', label: 'Away', color: 'bg-yellow-500', description: 'Temporarily unavailable' },
        { value: 'busy', label: 'Busy', color: 'bg-red-500', description: 'Do not disturb' },
        { value: 'invisible', label: 'Invisible', color: 'bg-gray-500', description: 'Appear offline to others' },
    ];
    
    // Get initials
    const getInitials = (name) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };
    
    if (loading) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 max-w-lg">
                    <div className="flex items-center justify-center py-12 text-gray-400">
                        <Loader2 className="w-6 h-6 animate-spin mr-2" />
                        Loading...
                    </div>
                </DialogContent>
            </Dialog>
        );
    }
    
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
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                            <Eye className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <DialogTitle className="text-gray-900 dark:text-white">Online Status Control</DialogTitle>
                            <DialogDescription>
                                Manage who can see your online status
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>
                
                <ScrollArea className="flex-1 max-h-[calc(85vh-100px)]">
                    <div className="p-4 space-y-6">
                        {/* Current Status */}
                        <Card className="bg-gray-100/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                    <Globe className="w-4 h-4" />
                                    Your Current Status
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-2">
                                    {statusOptions.map((status) => (
                                        <Card
                                            key={status.value}
                                            className={cn(
                                                "cursor-pointer transition-all border",
                                                globalStatus === status.value
                                                    ? "border-green-500 bg-green-500/10"
                                                        : "border-gray-200 dark:border-gray-700 bg-gray-100/30 dark:bg-gray-800/30 hover:border-gray-300 dark:hover:border-gray-600"
                                            )}
                                            onClick={() => setGlobalStatus(status.value)}
                                        >
                                            <CardContent className="p-3 flex items-center gap-3">
                                                <div className={cn("w-3 h-3 rounded-full", status.color)} />
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{status.label}</p>
                                                    <p className="text-xs text-gray-500">{status.description}</p>
                                                </div>
                                                {globalStatus === status.value && (
                                                    <Check className="w-4 h-4 text-green-400" />
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                                
                                <div>
                                    <Label className="text-xs text-gray-400 mb-1 block">Custom Status Message</Label>
                                    <Input
                                        value={customMessage}
                                        onChange={(e) => setCustomMessage(e.target.value)}
                                        placeholder="e.g., In a meeting until 3 PM"
                                        className="bg-gray-700 border-gray-600"
                                        maxLength={50}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">{customMessage.length}/50 characters</p>
                                </div>
                            </CardContent>
                        </Card>
                        
                        {/* Tabs for Hidden/Visible */}
                        <Tabs value={activeTab} onValueChange={setActiveTab}>
                            <TabsList className="w-full bg-gray-800">
                                <TabsTrigger value="overview" className="flex-1 data-[state=active]:bg-green-600">
                                    Overview
                                </TabsTrigger>
                                <TabsTrigger value="hidden" className="flex-1 data-[state=active]:bg-green-600">
                                    Hidden From ({hiddenFromUsers.length})
                                </TabsTrigger>
                                <TabsTrigger value="visible" className="flex-1 data-[state=active]:bg-green-600">
                                    Always Visible ({alwaysVisibleTo.length})
                                </TabsTrigger>
                            </TabsList>
                            
                            {/* Overview Tab */}
                            <TabsContent value="overview" className="mt-4 space-y-4">
                                <Card className="bg-gray-100/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
                                    <CardContent className="p-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="text-center p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                                                <EyeOff className="w-8 h-8 text-red-400 mx-auto mb-2" />
                                                <p className="text-2xl font-bold text-red-400">{hiddenFromUsers.length}</p>
                                                <p className="text-xs text-gray-400">Hidden From</p>
                                            </div>
                                            <div className="text-center p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                                                <Eye className="w-8 h-8 text-green-400 mx-auto mb-2" />
                                                <p className="text-2xl font-bold text-green-400">{alwaysVisibleTo.length}</p>
                                                <p className="text-xs text-gray-400">Always Visible To</p>
                                            </div>
                                        </div>
                                        
                                        <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                                            <p className="text-xs text-blue-300">
                                                <strong>Tip:</strong> Use "Hidden From" for users you want to appear offline to. 
                                                Use "Always Visible To" for important contacts who should always see your status.
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                            
                            {/* Hidden From Tab */}
                            <TabsContent value="hidden" className="mt-4 space-y-4">
                                {/* Search */}
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                    <Input
                                        value={searchQuery}
                                        onChange={(e) => {
                                            setSearchQuery(e.target.value);
                                            searchUsers(e.target.value);
                                        }}
                                        placeholder="Search users to hide from..."
                                        className="pl-10 bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                                    />
                                </div>
                                
                                {/* Search Results */}
                                {searchResults.length > 0 && (
                                    <Card className="bg-gray-100/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
                                        <CardContent className="p-2 space-y-1">
                                            {searchResults.map((user) => (
                                                <div 
                                                    key={user.id}
                                                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 cursor-pointer"
                                                    onClick={() => hideFromUser(user)}
                                                >
                                                    <Avatar className="w-8 h-8">
                                                        <AvatarFallback className="bg-gray-200 dark:bg-gray-700 text-xs">
                                                            {getInitials(user.name)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1">
                                                        <p className="text-sm text-gray-900 dark:text-white">{user.name}</p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">{user.role}</p>
                                                    </div>
                                                    <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300">
                                                        <EyeOff className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </CardContent>
                                    </Card>
                                )}
                                
                                {/* Hidden Users List */}
                                {hiddenFromUsers.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        <Shield className="w-10 h-10 mx-auto mb-2 opacity-50" />
                                        <p>No users hidden</p>
                                        <p className="text-xs">Search above to hide your status from specific users</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {hiddenFromUsers.map((user) => (
                                            <Card key={user.id} className="bg-gray-100/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
                                                <CardContent className="p-3 flex items-center gap-3">
                                                    <Avatar className="w-10 h-10">
                                                        <AvatarFallback className="bg-red-500/20 text-red-400">
                                                            {getInitials(user.name)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">{user.role}</p>
                                                    </div>
                                                    <Button 
                                                        size="sm" 
                                                        variant="outline"
                                                        className="border-gray-300 dark:border-gray-600 text-green-400 hover:bg-green-500/10"
                                                        onClick={() => unhideFromUser(user.id)}
                                                    >
                                                        <Eye className="w-4 h-4 mr-1" />
                                                        Show
                                                    </Button>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </TabsContent>
                            
                            {/* Always Visible Tab */}
                            <TabsContent value="visible" className="mt-4 space-y-4">
                                {/* Search */}
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                    <Input
                                        value={searchQuery}
                                        onChange={(e) => {
                                            setSearchQuery(e.target.value);
                                            searchUsers(e.target.value);
                                        }}
                                        placeholder="Search users to always show status to..."
                                        className="pl-10 bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                                    />
                                </div>
                                
                                {/* Search Results */}
                                {searchResults.length > 0 && (
                                    <Card className="bg-gray-100/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
                                        <CardContent className="p-2 space-y-1">
                                            {searchResults.map((user) => (
                                                <div 
                                                    key={user.id}
                                                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 cursor-pointer"
                                                    onClick={() => addAlwaysVisible(user)}
                                                >
                                                    <Avatar className="w-8 h-8">
                                                        <AvatarFallback className="bg-gray-200 dark:bg-gray-700 text-xs">
                                                            {getInitials(user.name)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1">
                                                        <p className="text-sm text-gray-900 dark:text-white">{user.name}</p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">{user.role}</p>
                                                    </div>
                                                    <Button size="sm" variant="ghost" className="text-green-400 hover:text-green-300">
                                                        <UserPlus className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </CardContent>
                                    </Card>
                                )}
                                
                                {/* Always Visible List */}
                                {alwaysVisibleTo.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                                        <p>No priority contacts</p>
                                        <p className="text-xs">Add users who should always see your status</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {alwaysVisibleTo.map((user) => (
                                            <Card key={user.id} className="bg-gray-100/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
                                                <CardContent className="p-3 flex items-center gap-3">
                                                    <Avatar className="w-10 h-10">
                                                        <AvatarFallback className="bg-green-500/20 text-green-400">
                                                            {getInitials(user.name)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">{user.role}</p>
                                                    </div>
                                                    <Button 
                                                        size="sm" 
                                                        variant="outline"
                                                        className="border-gray-300 dark:border-gray-600 text-red-400 hover:bg-red-500/10"
                                                        onClick={() => removeAlwaysVisible(user.id)}
                                                    >
                                                        <X className="w-4 h-4 mr-1" />
                                                        Remove
                                                    </Button>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                                
                                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                                    <p className="text-xs text-green-300">
                                        <strong>Note:</strong> Users in this list will see your status even when 
                                        you're set to "Invisible" or have restricted visibility.
                                    </p>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
};

export default OnlineStatusControl;
