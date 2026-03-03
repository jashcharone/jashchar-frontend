import React, { useState, useEffect } from 'react';
import { 
    UserCog, Shield, Users, ChevronLeft, Search, Save,
    Check, X, Plus, Trash2, Edit2, MoreVertical, Loader2,
    Lock, Unlock, MessageSquare, Megaphone, Settings, Eye,
    Crown, User, GraduationCap, Briefcase, UserCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { useToast } from '@/components/ui/use-toast';

/**
 * PermissionsManager - Manage user roles and permissions for JashSync
 * Configure what each role can do in the messaging system
 */
const PermissionsManager = ({ 
    open,
    onOpenChange
}) => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [activeTab, setActiveTab] = useState('roles');
    const [searchQuery, setSearchQuery] = useState('');
    
    // Roles and permissions
    const [roles, setRoles] = useState([]);
    const [selectedRole, setSelectedRole] = useState(null);
    
    // Permission categories
    const permissionCategories = [
        {
            id: 'messaging',
            label: 'Messaging',
            icon: MessageSquare,
            permissions: [
                { id: 'send_direct_messages', label: 'Send Direct Messages', description: 'Send private messages to other users' },
                { id: 'create_groups', label: 'Create Groups', description: 'Create new group conversations' },
                { id: 'add_members_to_groups', label: 'Add Members to Groups', description: 'Add other users to groups' },
                { id: 'delete_own_messages', label: 'Delete Own Messages', description: 'Delete messages they sent' },
                { id: 'edit_own_messages', label: 'Edit Own Messages', description: 'Edit messages they sent' },
            ]
        },
        {
            id: 'channels',
            label: 'Channels',
            icon: Users,
            permissions: [
                { id: 'view_channels', label: 'View Channels', description: 'See and join public channels' },
                { id: 'create_channels', label: 'Create Channels', description: 'Create new channels' },
                { id: 'manage_channels', label: 'Manage Channels', description: 'Edit and delete channels' },
                { id: 'post_in_channels', label: 'Post in Channels', description: 'Send messages in channels' },
                { id: 'pin_messages', label: 'Pin Messages', description: 'Pin important messages in channels' },
            ]
        },
        {
            id: 'broadcast',
            label: 'Broadcast',
            icon: Megaphone,
            permissions: [
                { id: 'send_broadcasts', label: 'Send Broadcasts', description: 'Send broadcast messages' },
                { id: 'schedule_broadcasts', label: 'Schedule Broadcasts', description: 'Schedule broadcasts for later' },
                { id: 'broadcast_to_all', label: 'Broadcast to All', description: 'Send broadcasts to all users' },
                { id: 'broadcast_to_role', label: 'Broadcast to Role', description: 'Send broadcasts to specific roles' },
                { id: 'view_broadcast_analytics', label: 'View Analytics', description: 'See broadcast delivery stats' },
            ]
        },
        {
            id: 'media',
            label: 'Media',
            icon: Eye,
            permissions: [
                { id: 'upload_media', label: 'Upload Media', description: 'Upload images, videos, and files' },
                { id: 'access_media_vault', label: 'Access Media Vault', description: 'Browse all uploaded media' },
                { id: 'delete_media', label: 'Delete Media', description: 'Delete uploaded media files' },
                { id: 'share_media', label: 'Share Media', description: 'Share media in messages' },
            ]
        },
        {
            id: 'admin',
            label: 'Administration',
            icon: Settings,
            permissions: [
                { id: 'access_admin_panel', label: 'Access Admin Panel', description: 'View admin dashboard' },
                { id: 'moderate_content', label: 'Moderate Content', description: 'Review and moderate messages' },
                { id: 'manage_users', label: 'Manage Users', description: 'Block/unblock users' },
                { id: 'view_analytics', label: 'View Analytics', description: 'Access detailed analytics' },
                { id: 'manage_settings', label: 'Manage Settings', description: 'Change system settings' },
            ]
        },
    ];
    
    useEffect(() => {
        if (open) {
            loadRoles();
        }
    }, [open]);
    
    const loadRoles = async () => {
        setLoading(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 800));
            
            // Mock roles data
            const mockRoles = [
                {
                    id: 1,
                    name: 'Super Admin',
                    slug: 'super_admin',
                    description: 'Full access to all features',
                    icon: Crown,
                    color: 'text-purple-400',
                    userCount: 2,
                    isSystem: true,
                    permissions: permissionCategories.flatMap(cat => cat.permissions.map(p => p.id))
                },
                {
                    id: 2,
                    name: 'Admin',
                    slug: 'admin',
                    description: 'Administrative access',
                    icon: Shield,
                    color: 'text-blue-400',
                    userCount: 5,
                    isSystem: true,
                    permissions: [
                        'send_direct_messages', 'create_groups', 'add_members_to_groups', 'delete_own_messages', 'edit_own_messages',
                        'view_channels', 'create_channels', 'manage_channels', 'post_in_channels', 'pin_messages',
                        'send_broadcasts', 'schedule_broadcasts', 'broadcast_to_all', 'broadcast_to_role', 'view_broadcast_analytics',
                        'upload_media', 'access_media_vault', 'delete_media', 'share_media',
                        'access_admin_panel', 'moderate_content', 'manage_users', 'view_analytics'
                    ]
                },
                {
                    id: 3,
                    name: 'Teacher',
                    slug: 'teacher',
                    description: 'Teaching staff',
                    icon: GraduationCap,
                    color: 'text-green-400',
                    userCount: 45,
                    isSystem: true,
                    permissions: [
                        'send_direct_messages', 'create_groups', 'add_members_to_groups', 'delete_own_messages', 'edit_own_messages',
                        'view_channels', 'post_in_channels', 'pin_messages',
                        'send_broadcasts', 'broadcast_to_role',
                        'upload_media', 'access_media_vault', 'share_media'
                    ]
                },
                {
                    id: 4,
                    name: 'Staff',
                    slug: 'staff',
                    description: 'Non-teaching staff',
                    icon: Briefcase,
                    color: 'text-orange-400',
                    userCount: 25,
                    isSystem: true,
                    permissions: [
                        'send_direct_messages', 'delete_own_messages', 'edit_own_messages',
                        'view_channels', 'post_in_channels',
                        'upload_media', 'share_media'
                    ]
                },
                {
                    id: 5,
                    name: 'Parent',
                    slug: 'parent',
                    description: 'Parents / Guardians',
                    icon: User,
                    color: 'text-yellow-400',
                    userCount: 850,
                    isSystem: true,
                    permissions: [
                        'send_direct_messages', 'delete_own_messages',
                        'view_channels',
                        'upload_media', 'share_media'
                    ]
                },
                {
                    id: 6,
                    name: 'Student',
                    slug: 'student',
                    description: 'Students',
                    icon: UserCheck,
                    color: 'text-cyan-400',
                    userCount: 320,
                    isSystem: true,
                    permissions: [
                        'send_direct_messages',
                        'view_channels',
                        'share_media'
                    ]
                },
            ];
            
            setRoles(mockRoles);
            if (mockRoles.length > 0) {
                setSelectedRole(mockRoles[0]);
            }
            
        } catch (error) {
            console.error('Failed to load roles:', error);
            toast({ title: "Error", description: 'Failed to load roles', variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };
    
    // Toggle permission
    const togglePermission = (permissionId) => {
        if (!selectedRole || selectedRole.isSystem && selectedRole.slug === 'super_admin') return;
        
        setRoles(prev => prev.map(role => {
            if (role.id === selectedRole.id) {
                const newPermissions = role.permissions.includes(permissionId)
                    ? role.permissions.filter(p => p !== permissionId)
                    : [...role.permissions, permissionId];
                return { ...role, permissions: newPermissions };
            }
            return role;
        }));
        
        setSelectedRole(prev => ({
            ...prev,
            permissions: prev.permissions.includes(permissionId)
                ? prev.permissions.filter(p => p !== permissionId)
                : [...prev.permissions, permissionId]
        }));
        
        setHasChanges(true);
    };
    
    // Toggle category permissions
    const toggleCategory = (categoryId) => {
        if (!selectedRole || selectedRole.isSystem && selectedRole.slug === 'super_admin') return;
        
        const category = permissionCategories.find(c => c.id === categoryId);
        if (!category) return;
        
        const categoryPermIds = category.permissions.map(p => p.id);
        const allEnabled = categoryPermIds.every(pid => selectedRole.permissions.includes(pid));
        
        setRoles(prev => prev.map(role => {
            if (role.id === selectedRole.id) {
                let newPermissions;
                if (allEnabled) {
                    newPermissions = role.permissions.filter(p => !categoryPermIds.includes(p));
                } else {
                    newPermissions = [...new Set([...role.permissions, ...categoryPermIds])];
                }
                return { ...role, permissions: newPermissions };
            }
            return role;
        }));
        
        setSelectedRole(prev => {
            let newPermissions;
            if (allEnabled) {
                newPermissions = prev.permissions.filter(p => !categoryPermIds.includes(p));
            } else {
                newPermissions = [...new Set([...prev.permissions, ...categoryPermIds])];
            }
            return { ...prev, permissions: newPermissions };
        });
        
        setHasChanges(true);
    };
    
    // Save changes
    const saveChanges = async () => {
        setSaving(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            setHasChanges(false);
            toast({ title: "Saved", description: 'Permissions updated successfully' });
            
        } catch (error) {
            console.error('Failed to save:', error);
            toast({ title: "Error", description: 'Failed to save permissions', variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };
    
    // Filter roles
    const filteredRoles = roles.filter(role =>
        role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        role.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    if (loading) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 max-w-4xl">
                    <div className="flex items-center justify-center py-12 text-gray-400">
                        <Loader2 className="w-6 h-6 animate-spin mr-2" />
                        Loading permissions...
                    </div>
                </DialogContent>
            </Dialog>
        );
    }
    
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
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center">
                            <UserCog className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                            <DialogTitle className="text-gray-900 dark:text-white">Permissions Manager</DialogTitle>
                            <DialogDescription>
                                Configure role-based permissions for JashSync
                            </DialogDescription>
                        </div>
                        {hasChanges && (
                            <Button 
                                onClick={saveChanges}
                                disabled={saving}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        Save Changes
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </DialogHeader>
                
                {/* Main Content - Two Column Layout */}
                <div className="flex h-[calc(90vh-100px)]">
                    {/* Left: Role List */}
                    <div className="w-80 border-r border-gray-200 dark:border-gray-700/50 flex flex-col">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700/50">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <Input
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search roles..."
                                    className="pl-10 bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                                />
                            </div>
                        </div>
                        
                        <ScrollArea className="flex-1">
                            <div className="p-2 space-y-1">
                                {filteredRoles.map((role) => {
                                    const RoleIcon = role.icon;
                                    return (
                                        <Card 
                                            key={role.id}
                                            className={cn(
                                                "cursor-pointer transition-all",
                                                selectedRole?.id === role.id 
                                                    ? "bg-blue-500/20 border-blue-500" 
                                                    : "bg-gray-100/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                                            )}
                                            onClick={() => setSelectedRole(role)}
                                        >
                                            <CardContent className="p-3">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "w-10 h-10 rounded-lg flex items-center justify-center",
                                                        selectedRole?.id === role.id ? "bg-blue-500/30" : "bg-gray-200/50 dark:bg-gray-700/50"
                                                    )}>
                                                        <RoleIcon className={cn("w-5 h-5", role.color)} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-gray-900 dark:text-white truncate">{role.name}</p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{role.description}</p>
                                                    </div>
                                                    <Badge variant="outline" className="text-xs text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600">
                                                        {role.userCount}
                                                    </Badge>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        </ScrollArea>
                    </div>
                    
                    {/* Right: Permission Settings */}
                    <div className="flex-1 flex flex-col">
                        {selectedRole ? (
                            <>
                                {/* Role Header */}
                                <div className="p-4 border-b border-gray-200 dark:border-gray-700/50">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-12 h-12 rounded-xl flex items-center justify-center bg-gray-200/50 dark:bg-gray-700/50"
                                        )}>
                                            {React.createElement(selectedRole.icon, { 
                                                className: cn("w-6 h-6", selectedRole.color) 
                                            })}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900 dark:text-white text-lg">{selectedRole.name}</h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{selectedRole.description}</p>
                                        </div>
                                        {selectedRole.slug === 'super_admin' && (
                                            <Badge className="ml-auto bg-purple-500/20 text-purple-400">
                                                <Lock className="w-3 h-3 mr-1" />
                                                Full Access
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="mt-3 flex items-center gap-4 text-sm text-gray-400">
                                        <span>{selectedRole.userCount} users</span>
                                        <span>•</span>
                                        <span>{selectedRole.permissions.length} permissions</span>
                                    </div>
                                </div>
                                
                                {/* Permissions */}
                                <ScrollArea className="flex-1">
                                    <div className="p-4">
                                        {selectedRole.slug === 'super_admin' ? (
                                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                                <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mb-4">
                                                    <Crown className="w-8 h-8 text-purple-400" />
                                                </div>
                                                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Full Access Role</h4>
                                                <p className="text-gray-500 dark:text-gray-400 max-w-md">
                                                    Super Admin has access to all permissions by default. 
                                                    This role cannot be modified for security reasons.
                                                </p>
                                            </div>
                                        ) : (
                                            <Accordion type="multiple" defaultValue={permissionCategories.map(c => c.id)}>
                                                {permissionCategories.map((category) => {
                                                    const CategoryIcon = category.icon;
                                                    const categoryPermIds = category.permissions.map(p => p.id);
                                                    const enabledCount = categoryPermIds.filter(pid => 
                                                        selectedRole.permissions.includes(pid)
                                                    ).length;
                                                    const allEnabled = enabledCount === categoryPermIds.length;
                                                    const someEnabled = enabledCount > 0 && !allEnabled;
                                                    
                                                    return (
                                                        <AccordionItem key={category.id} value={category.id} className="border-gray-200 dark:border-gray-700">
                                                            <AccordionTrigger className="hover:no-underline py-3">
                                                                <div className="flex items-center gap-3 flex-1">
                                                                    <CategoryIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                                                                    <span className="font-medium text-gray-900 dark:text-white">{category.label}</span>
                                                                    <Badge 
                                                                        variant="outline" 
                                                                        className={cn(
                                                                            "ml-2",
                                                                            allEnabled ? "text-green-400 border-green-400/50" :
                                                                            someEnabled ? "text-yellow-400 border-yellow-400/50" :
                                                                            "text-gray-500 border-gray-600"
                                                                        )}
                                                                    >
                                                                        {enabledCount}/{categoryPermIds.length}
                                                                    </Badge>
                                                                </div>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        toggleCategory(category.id);
                                                                    }}
                                                                    className={cn(
                                                                        "mr-2",
                                                                        allEnabled ? "text-green-400" : "text-gray-400"
                                                                    )}
                                                                >
                                                                    {allEnabled ? 'Disable All' : 'Enable All'}
                                                                </Button>
                                                            </AccordionTrigger>
                                                            <AccordionContent>
                                                                <div className="space-y-2 pl-8 pb-2">
                                                                    {category.permissions.map((permission) => {
                                                                        const isEnabled = selectedRole.permissions.includes(permission.id);
                                                                        return (
                                                                            <div 
                                                                                key={permission.id}
                                                                                className="flex items-center justify-between p-3 rounded-lg bg-gray-100/50 dark:bg-gray-800/50 hover:bg-gray-200/50 dark:hover:bg-gray-800 transition-colors"
                                                                            >
                                                                                <div className="flex items-center gap-3">
                                                                                    <Checkbox
                                                                                        checked={isEnabled}
                                                                                        onCheckedChange={() => togglePermission(permission.id)}
                                                                                        className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                                                                    />
                                                                                    <div>
                                                                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{permission.label}</p>
                                                                                        <p className="text-xs text-gray-500">{permission.description}</p>
                                                                                    </div>
                                                                                </div>
                                                                                {isEnabled ? (
                                                                                    <Unlock className="w-4 h-4 text-green-400" />
                                                                                ) : (
                                                                                    <Lock className="w-4 h-4 text-gray-600" />
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </AccordionContent>
                                                        </AccordionItem>
                                                    );
                                                })}
                                            </Accordion>
                                        )}
                                    </div>
                                </ScrollArea>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-gray-500">
                                <p>Select a role to manage permissions</p>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default PermissionsManager;
