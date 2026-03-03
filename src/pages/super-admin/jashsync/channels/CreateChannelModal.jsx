import React, { useState, useEffect, useMemo } from 'react';
import { 
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { 
    Search, Users, Hash, Megaphone, Lock, GraduationCap, 
    Building2, Plus, X, Check, Loader2, Globe
} from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/services/api";
import { OnlineStatus } from "../chats/ChatIndicators";

/**
 * CreateChannelModal - Modal for creating new channels
 * Supports: Class, Announcement, Department, Public, Private channels
 */
const CreateChannelModal = ({ 
    isOpen, 
    onClose, 
    onChannelCreated 
}) => {
    const [step, setStep] = useState(1); // 1: Type, 2: Details, 3: Members
    const [channelType, setChannelType] = useState(null);
    const [channelName, setChannelName] = useState('');
    const [channelDescription, setChannelDescription] = useState('');
    const [search, setSearch] = useState('');
    const [users, setUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    
    // Channel types
    const channelTypes = [
        {
            id: 'class',
            name: 'Class Channel',
            description: 'For class-specific announcements and discussions',
            icon: GraduationCap,
            color: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
        },
        {
            id: 'announcement',
            name: 'Announcement',
            description: 'Broadcast important updates to many people',
            icon: Megaphone,
            color: 'bg-red-500/20 text-red-400 border-red-500/30'
        },
        {
            id: 'department',
            name: 'Department',
            description: 'For staff/teacher department coordination',
            icon: Building2,
            color: 'bg-orange-500/20 text-orange-400 border-orange-500/30'
        },
        {
            id: 'public',
            name: 'Public Channel',
            description: 'Anyone in the organization can join',
            icon: Globe,
            color: 'bg-green-500/20 text-green-400 border-green-500/30'
        },
        {
            id: 'private',
            name: 'Private Channel',
            description: 'Invite-only, hidden from non-members',
            icon: Lock,
            color: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
        }
    ];
    
    // Fetch users when on members step
    useEffect(() => {
        if (step !== 3 || !isOpen) return;
        
        const fetchUsers = async () => {
            setLoading(true);
            try {
                const data = await api.get('/jashsync/users/available');
                setUsers(data || []);
            } catch (error) {
                console.error('Failed to fetch users:', error);
                setUsers([]);
            } finally {
                setLoading(false);
            }
        };
        
        fetchUsers();
    }, [step, isOpen]);
    
    // Filter users by search
    const filteredUsers = useMemo(() => {
        if (!search.trim()) return users;
        const query = search.toLowerCase();
        return users.filter(u => 
            u.name?.toLowerCase().includes(query) ||
            u.email?.toLowerCase().includes(query) ||
            u.role?.toLowerCase().includes(query)
        );
    }, [users, search]);
    
    // Toggle user selection
    const toggleUser = (user) => {
        setSelectedUsers(prev => {
            const exists = prev.find(u => u.id === user.id);
            if (exists) {
                return prev.filter(u => u.id !== user.id);
            }
            return [...prev, user];
        });
    };
    
    // Check if user is selected
    const isSelected = (userId) => selectedUsers.some(u => u.id === userId);
    
    // Handle create channel
    const handleCreate = async () => {
        if (!channelName.trim()) return;
        
        setCreating(true);
        try {
            const data = await api.post('/jashsync/channels', {
                name: channelName.trim(),
                description: channelDescription.trim(),
                channel_type: channelType,
                member_ids: selectedUsers.map(u => u.id)
            });
            
            onChannelCreated?.(data);
            handleClose();
            
        } catch (error) {
            console.error('Failed to create channel:', error);
        } finally {
            setCreating(false);
        }
    };
    
    // Reset and close
    const handleClose = () => {
        setStep(1);
        setChannelType(null);
        setChannelName('');
        setChannelDescription('');
        setSearch('');
        setSelectedUsers([]);
        onClose();
    };
    
    // Get initials
    const getInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
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
    
    // Selected channel type info
    const selectedType = channelTypes.find(t => t.id === channelType);
    
    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-lg bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                <DialogHeader>
                    <DialogTitle className="text-gray-900 dark:text-white flex items-center gap-2">
                        <Hash className="h-5 w-5 text-purple-400" />
                        {step === 1 ? 'Create Channel' : step === 2 ? 'Channel Details' : 'Add Members'}
                    </DialogTitle>
                    <DialogDescription className="text-gray-500 dark:text-gray-400">
                        {step === 1 && 'Choose the type of channel you want to create'}
                        {step === 2 && 'Give your channel a name and description'}
                        {step === 3 && 'Select people to add to this channel'}
                    </DialogDescription>
                </DialogHeader>
                
                {/* Step 1: Channel Type */}
                {step === 1 && (
                    <div className="grid grid-cols-1 gap-3 py-4">
                        {channelTypes.map((type) => {
                            const IconComponent = type.icon;
                            const isActive = channelType === type.id;
                            
                            return (
                                <div
                                    key={type.id}
                                    onClick={() => setChannelType(type.id)}
                                    className={cn(
                                        "flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all",
                                        "hover:bg-gray-100/50 dark:hover:bg-gray-800/50",
                                        isActive ? type.color : "border-gray-200 dark:border-gray-700 bg-gray-100/30 dark:bg-gray-800/30"
                                    )}
                                >
                                    <div className={cn(
                                        "w-12 h-12 rounded-lg flex items-center justify-center",
                                        type.color
                                    )}>
                                        <IconComponent className="h-6 w-6" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-medium text-gray-900 dark:text-white">{type.name}</h4>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{type.description}</p>
                                    </div>
                                    {isActive && (
                                        <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
                                            <Check className="h-4 w-4 text-white" />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
                
                {/* Step 2: Channel Details */}
                {step === 2 && (
                    <div className="space-y-4 py-4">
                        {/* Selected type badge */}
                        {selectedType && (
                            <div className={cn(
                                "flex items-center gap-2 p-2 rounded-lg",
                                selectedType.color
                            )}>
                                <selectedType.icon className="h-4 w-4" />
                                <span className="text-sm font-medium">{selectedType.name}</span>
                            </div>
                        )}
                        
                        {/* Channel name */}
                        <div className="space-y-2">
                            <Label htmlFor="channelName" className="text-gray-700 dark:text-gray-300">
                                Channel Name <span className="text-red-400">*</span>
                            </Label>
                            <div className="relative">
                                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                                <Input
                                    id="channelName"
                                    value={channelName}
                                    onChange={(e) => setChannelName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                                    placeholder="e.g., class-10-a"
                                    className="pl-9 bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                                    maxLength={50}
                                />
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-500">
                                Names must be lowercase with no spaces. Use hyphens instead.
                            </p>
                        </div>
                        
                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="channelDesc" className="text-gray-700 dark:text-gray-300">
                                Description
                            </Label>
                            <Textarea
                                id="channelDesc"
                                value={channelDescription}
                                onChange={(e) => setChannelDescription(e.target.value)}
                                placeholder="What's this channel about?"
                                className="bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 resize-none"
                                rows={3}
                                maxLength={200}
                            />
                            <p className="text-xs text-gray-600 dark:text-gray-500 text-right">
                                {channelDescription.length}/200
                            </p>
                        </div>
                    </div>
                )}
                
                {/* Step 3: Add Members */}
                {step === 3 && (
                    <div className="py-4">
                        {/* Selected members chips */}
                        {selectedUsers.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                                {selectedUsers.map(user => (
                                    <Badge 
                                        key={user.id}
                                        variant="secondary"
                                        className="gap-1 py-1 pl-1 pr-2"
                                    >
                                        <Avatar className="h-5 w-5">
                                            <AvatarFallback className="text-[10px] bg-purple-600">
                                                {getInitials(user.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        {user.name?.split(' ')[0]}
                                        <button 
                                            onClick={() => toggleUser(user)}
                                            className="ml-1 hover:text-red-400"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        )}
                        
                        {/* Search */}
                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                            <Input
                                placeholder="Search people..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9 bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                            />
                        </div>
                        
                        {/* User list */}
                        <ScrollArea className="h-[250px]">
                            {loading ? (
                                <div className="flex items-center justify-center h-full">
                                    <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
                                </div>
                            ) : filteredUsers.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                                    <Users className="h-10 w-10 mb-3 opacity-50" />
                                    <p>No users found</p>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {filteredUsers.map(user => {
                                        const selected = isSelected(user.id);
                                        const roleBadge = getRoleBadge(user.role);
                                        
                                        return (
                                            <div
                                                key={user.id}
                                                onClick={() => toggleUser(user)}
                                                className={cn(
                                                    "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all",
                                                    "hover:bg-gray-100 dark:hover:bg-gray-800",
                                                    selected && "bg-purple-600/20 border border-purple-500/30"
                                                )}
                                            >
                                                {/* Avatar */}
                                                <div className="relative">
                                                    <Avatar className="h-10 w-10 border-2 border-gray-200 dark:border-gray-700">
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
                                                        <span className="font-medium text-gray-900 dark:text-white truncate">
                                                            {user.name}
                                                        </span>
                                                        <Badge 
                                                            variant="outline" 
                                                            className={cn("text-[10px] py-0", roleBadge.color)}
                                                        >
                                                            {roleBadge.label}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                                        {user.email}
                                                    </p>
                                                </div>
                                                
                                                {/* Checkbox */}
                                                <div className={cn(
                                                    "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                                                    selected 
                                                        ? "border-purple-500 bg-purple-500" 
                                                        : "border-gray-400 dark:border-gray-600"
                                                )}>
                                                    {selected && <Check className="h-3 w-3 text-white" />}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </ScrollArea>
                    </div>
                )}
                
                {/* Footer */}
                <DialogFooter className="flex gap-2">
                    {step > 1 && (
                        <Button 
                            variant="outline" 
                            onClick={() => setStep(step - 1)}
                        >
                            Back
                        </Button>
                    )}
                    
                    <div className="flex-1" />
                    
                    <Button variant="outline" onClick={handleClose}>
                        Cancel
                    </Button>
                    
                    {step < 3 ? (
                        <Button 
                            onClick={() => setStep(step + 1)}
                            disabled={step === 1 && !channelType || step === 2 && !channelName.trim()}
                            className="bg-purple-600 hover:bg-purple-700"
                        >
                            Next
                        </Button>
                    ) : (
                        <Button 
                            onClick={handleCreate}
                            disabled={creating}
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
                                    Create Channel
                                </>
                            )}
                        </Button>
                    )}
                </DialogFooter>
                
                {/* Step indicator */}
                <div className="flex items-center justify-center gap-2 mt-2">
                    {[1, 2, 3].map(s => (
                        <div 
                            key={s}
                            className={cn(
                                "w-2 h-2 rounded-full transition-all",
                                s === step ? "w-6 bg-purple-500" : s < step ? "bg-purple-500/50" : "bg-gray-600"
                            )}
                        />
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default CreateChannelModal;
