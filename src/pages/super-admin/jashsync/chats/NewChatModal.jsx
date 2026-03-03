import React, { useState, useEffect, useMemo } from 'react';
import { 
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    Search, Users, User, GraduationCap, Briefcase, Plus, X, 
    Check, MessageCircle, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/services/api";
import { OnlineStatus } from "./ChatIndicators";

/**
 * NewChatModal - Modal for creating new conversations
 * Allows selecting users (parents, staff, teachers) to start a chat
 */
const NewChatModal = ({ 
    isOpen, 
    onClose, 
    onChatCreated 
}) => {
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [isGroupMode, setIsGroupMode] = useState(false);
    const [groupName, setGroupName] = useState('');
    
    // Fetch available users
    useEffect(() => {
        if (!isOpen) return;
        
        const fetchUsers = async () => {
            setLoading(true);
            try {
                // Fetch users from different categories
                const data = await api.get('/jashsync/users/available');
                console.log('[NewChatModal] Users fetched:', data?.length, data);
                setUsers(data || []);
            } catch (error) {
                console.error('Failed to fetch users:', error);
                // Mock data for development
                setUsers([
                    { id: '1', name: 'John Parent', email: 'john@parent.com', role: 'parent', avatar: null, isOnline: true },
                    { id: '2', name: 'Sarah Teacher', email: 'sarah@school.com', role: 'teacher', avatar: null, isOnline: false },
                    { id: '3', name: 'Mike Staff', email: 'mike@school.com', role: 'staff', avatar: null, isOnline: true },
                    { id: '4', name: 'Emily Parent', email: 'emily@parent.com', role: 'parent', avatar: null, isOnline: false },
                    { id: '5', name: 'David Principal', email: 'david@school.com', role: 'staff', avatar: null, isOnline: true },
                    { id: '6', name: 'Lisa Teacher', email: 'lisa@school.com', role: 'teacher', avatar: null, isOnline: false },
                ]);
            } finally {
                setLoading(false);
            }
        };
        
        fetchUsers();
    }, [isOpen]);
    
    // Filter users based on search and tab
    const filteredUsers = useMemo(() => {
        let result = [...users];
        
        // Filter by tab
        if (activeTab !== 'all') {
            result = result.filter(u => u.role === activeTab);
        }
        
        // Filter by search
        if (search.trim()) {
            const query = search.toLowerCase();
            result = result.filter(u => 
                u.name?.toLowerCase().includes(query) ||
                u.email?.toLowerCase().includes(query)
            );
        }
        
        return result;
    }, [users, activeTab, search]);
    
    // Toggle user selection
    const toggleUserSelection = (user) => {
        if (isGroupMode) {
            setSelectedUsers(prev => {
                const exists = prev.find(u => u.id === user.id);
                if (exists) {
                    return prev.filter(u => u.id !== user.id);
                }
                return [...prev, user];
            });
        } else {
            // Single user mode - start chat immediately
            handleCreateChat([user]);
        }
    };
    
    // Check if user is selected
    const isSelected = (userId) => selectedUsers.some(u => u.id === userId);
    
    // Create chat/group
    const handleCreateChat = async (chatUsers = selectedUsers) => {
        if (chatUsers.length === 0) return;
        
        setCreating(true);
        try {
            const isGroup = isGroupMode && chatUsers.length > 1;
            
            const response = await api.post('/jashsync/conversations', {
                type: isGroup ? 'group' : 'direct',
                name: isGroup ? groupName || `Group (${chatUsers.length} members)` : null,
                members: chatUsers.map(u => u.id)
            });
            
            onChatCreated?.(response);
            handleClose();
            
        } catch (error) {
            console.error('Failed to create chat:', error);
        } finally {
            setCreating(false);
        }
    };
    
    // Handle close
    const handleClose = () => {
        setSearch('');
        setSelectedUsers([]);
        setIsGroupMode(false);
        setGroupName('');
        onClose();
    };
    
    // Get role badge color
    const getRoleBadge = (role) => {
        const config = {
            parent: { label: 'Parent', color: 'bg-green-500/20 text-green-400' },
            teacher: { label: 'Teacher', color: 'bg-blue-500/20 text-blue-400' },
            staff: { label: 'Staff', color: 'bg-purple-500/20 text-purple-400' },
            admin: { label: 'Admin', color: 'bg-orange-500/20 text-orange-400' }
        };
        return config[role] || { label: role, color: 'bg-gray-500/20 text-gray-400' };
    };
    
    // Get initials
    const getInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-lg bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                <DialogHeader>
                    <DialogTitle className="text-gray-900 dark:text-white flex items-center gap-2">
                        <MessageCircle className="h-5 w-5 text-purple-400" />
                        {isGroupMode ? 'New Group Chat' : 'New Conversation'}
                    </DialogTitle>
                    <DialogDescription className="text-gray-500 dark:text-gray-400">
                        {isGroupMode 
                            ? 'Select multiple people to create a group chat'
                            : 'Select a person to start messaging'
                        }
                    </DialogDescription>
                </DialogHeader>
                
                {/* Group mode toggle */}
                <div className="flex items-center justify-between py-2">
                    <Button
                        variant={isGroupMode ? 'secondary' : 'outline'}
                        size="sm"
                        onClick={() => {
                            setIsGroupMode(!isGroupMode);
                            if (!isGroupMode) setSelectedUsers([]);
                        }}
                        className="gap-2"
                    >
                        <Users className="h-4 w-4" />
                        {isGroupMode ? 'Group Mode ON' : 'Create Group'}
                    </Button>
                    
                    {isGroupMode && selectedUsers.length > 0 && (
                        <Badge variant="secondary">
                            {selectedUsers.length} selected
                        </Badge>
                    )}
                </div>
                
                {/* Group name input */}
                {isGroupMode && selectedUsers.length > 0 && (
                    <Input
                        placeholder="Group name (optional)"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        className="bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                    />
                )}
                
                {/* Selected users chips */}
                {isGroupMode && selectedUsers.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {selectedUsers.map(user => (
                            <Badge 
                                key={user.id}
                                variant="secondary"
                                className="gap-1 py-1 pl-1 pr-2"
                            >
                                <Avatar className="h-5 w-5">
                                    <AvatarImage src={user.avatar} />
                                    <AvatarFallback className="text-[10px] bg-purple-600">
                                        {getInitials(user.name)}
                                    </AvatarFallback>
                                </Avatar>
                                {user.name?.split(' ')[0]}
                                <button 
                                    onClick={() => toggleUserSelection(user)}
                                    className="ml-1 hover:text-red-400"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        ))}
                    </div>
                )}
                
                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search by name or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                    />
                </div>
                
                {/* User type tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                        <TabsTrigger value="all" className="data-[state=active]:bg-purple-600">
                            All
                        </TabsTrigger>
                        <TabsTrigger value="parent" className="data-[state=active]:bg-purple-600">
                            <GraduationCap className="h-3.5 w-3.5 mr-1" />
                            Parents
                        </TabsTrigger>
                        <TabsTrigger value="teacher" className="data-[state=active]:bg-purple-600">
                            <User className="h-3.5 w-3.5 mr-1" />
                            Teachers
                        </TabsTrigger>
                        <TabsTrigger value="staff" className="data-[state=active]:bg-purple-600">
                            <Briefcase className="h-3.5 w-3.5 mr-1" />
                            Staff
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
                
                {/* User list */}
                <ScrollArea className="h-[300px] -mx-6 px-6">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <Search className="h-10 w-10 mb-3 opacity-50" />
                            <p>{search ? 'No users match your search' : 'No users available'}</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {filteredUsers.map(user => {
                                const selected = isSelected(user.id);
                                const roleBadge = getRoleBadge(user.role);
                                
                                return (
                                    <div
                                        key={user.id}
                                        onClick={() => toggleUserSelection(user)}
                                        className={cn(
                                            "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all",
                                            "hover:bg-gray-800",
                                            selected && "bg-purple-600/20 border border-purple-500/30"
                                        )}
                                    >
                                        {/* Avatar with online status */}
                                        <div className="relative">
                                            <Avatar className="h-10 w-10 border-2 border-gray-700">
                                                <AvatarImage src={user.avatar} />
                                                <AvatarFallback className="bg-purple-600/30 text-purple-300">
                                                    {getInitials(user.name)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <OnlineStatus 
                                                isOnline={user.isOnline}
                                                className="absolute bottom-0 right-0"
                                                size="sm"
                                            />
                                        </div>
                                        
                                        {/* User info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-white truncate">
                                                    {user.name}
                                                </span>
                                                <Badge 
                                                    variant="outline" 
                                                    className={cn("text-[10px] py-0", roleBadge.color)}
                                                >
                                                    {roleBadge.label}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-gray-400 truncate">
                                                {user.email}
                                            </p>
                                        </div>
                                        
                                        {/* Selection indicator */}
                                        {isGroupMode && (
                                            <div className={cn(
                                                "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                                                selected 
                                                    ? "border-purple-500 bg-purple-500" 
                                                    : "border-gray-600"
                                            )}>
                                                {selected && <Check className="h-3 w-3 text-white" />}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </ScrollArea>
                
                {/* Footer */}
                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>
                        Cancel
                    </Button>
                    {isGroupMode && (
                        <Button 
                            onClick={() => handleCreateChat()}
                            disabled={selectedUsers.length < 2 || creating}
                            className="bg-purple-600 hover:bg-purple-700"
                        >
                            {creating ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Group
                                </>
                            )}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default NewChatModal;
