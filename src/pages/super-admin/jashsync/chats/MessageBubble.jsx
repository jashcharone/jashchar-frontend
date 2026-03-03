import React, { useState } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
    Check, CheckCheck, Clock, Reply, Forward, Copy, Trash2, 
    MoreVertical, Download, Play, Pause, File, Image as ImageIcon
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

/**
 * MessageBubble - Individual message display component
 * WhatsApp-style message bubbles with reactions, replies, and media support
 */
const MessageBubble = ({
    message,
    isOwn,
    showAvatar,
    onReply,
    onDelete,
    onForward,
    onReaction
}) => {
    const [showActions, setShowActions] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    
    // Format time
    const formatTime = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        });
    };
    
    // Message status icon
    const MessageStatus = ({ status }) => {
        switch (status) {
            case 'read':
                return <CheckCheck className="h-3.5 w-3.5 text-blue-400" />;
            case 'delivered':
                return <CheckCheck className="h-3.5 w-3.5 text-gray-400" />;
            case 'sent':
                return <Check className="h-3.5 w-3.5 text-gray-400" />;
            default:
                return <Clock className="h-3.5 w-3.5 text-gray-500" />;
        }
    };
    
    // Copy message to clipboard
    const copyMessage = () => {
        navigator.clipboard.writeText(message.content);
    };
    
    // Render media based on type
    const renderMedia = () => {
        if (!message.media_url) return null;
        
        const mediaType = message.message_type;
        
        switch (mediaType) {
            case 'image':
                return (
                    <div className="relative mb-2 rounded-lg overflow-hidden max-w-sm">
                        {!imageLoaded && (
                            <div className="w-64 h-48 bg-gray-700 animate-pulse flex items-center justify-center">
                                <ImageIcon className="h-8 w-8 text-gray-500" />
                            </div>
                        )}
                        <img
                            src={message.media_url}
                            alt={message.media_filename || 'Image'}
                            className={cn(
                                "max-w-full rounded-lg cursor-pointer",
                                !imageLoaded && "hidden"
                            )}
                            onLoad={() => setImageLoaded(true)}
                            onClick={() => window.open(message.media_url, '_blank')}
                        />
                    </div>
                );
            
            case 'video':
                return (
                    <div className="relative mb-2 rounded-lg overflow-hidden max-w-sm">
                        <video
                            src={message.media_url}
                            poster={message.media_thumbnail_url}
                            controls
                            className="max-w-full rounded-lg"
                        />
                    </div>
                );
            
            case 'audio':
            case 'voice':
                return (
                    <div className="flex items-center gap-3 bg-gray-200/50 dark:bg-gray-700/50 rounded-full px-3 py-2 mb-2 min-w-[200px]">
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 rounded-full p-0"
                            onClick={() => setIsPlaying(!isPlaying)}
                        >
                            {isPlaying ? (
                                <Pause className="h-4 w-4" />
                            ) : (
                                <Play className="h-4 w-4" />
                            )}
                        </Button>
                        <div className="flex-1">
                            <div className="h-1 bg-gray-300 dark:bg-gray-600 rounded-full">
                                <div className="h-1 bg-purple-500 rounded-full w-1/3" />
                            </div>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">0:30</span>
                    </div>
                );
            
            case 'document':
            case 'file':
                return (
                    <a 
                        href={message.media_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 bg-gray-200/50 dark:bg-gray-700/50 rounded-lg p-3 mb-2 hover:bg-gray-200/70 dark:hover:bg-gray-700/70 transition-colors"
                    >
                        <div className="w-10 h-10 rounded-lg bg-purple-600/30 flex items-center justify-center">
                            <File className="h-5 w-5 text-purple-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {message.media_filename || 'Document'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {message.media_size ? `${(message.media_size / 1024).toFixed(1)} KB` : 'File'}
                            </p>
                        </div>
                        <Download className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    </a>
                );
            
            default:
                return null;
        }
    };
    
    // Render reply preview if message is a reply
    const renderReplyPreview = () => {
        if (!message.reply_to) return null;
        
        return (
            <div className="mb-2 pl-2 border-l-2 border-purple-500 bg-gray-100/50 dark:bg-gray-800/50 rounded px-2 py-1">
                <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                    {message.reply_to.sender?.name || 'Message'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {message.reply_to.content}
                </p>
            </div>
        );
    };
    
    // Render reactions
    const renderReactions = () => {
        if (!message.reactions || message.reactions.length === 0) return null;
        
        // Group reactions by emoji
        const grouped = message.reactions.reduce((acc, r) => {
            acc[r.emoji] = (acc[r.emoji] || 0) + 1;
            return acc;
        }, {});
        
        return (
            <div className="flex gap-1 mt-1">
                {Object.entries(grouped).map(([emoji, count]) => (
                    <button
                        key={emoji}
                        className="flex items-center gap-1 px-2 py-0.5 bg-gray-200/50 dark:bg-gray-700/50 rounded-full text-xs hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => onReaction?.(emoji)}
                    >
                        <span>{emoji}</span>
                        <span className="text-gray-500 dark:text-gray-400">{count}</span>
                    </button>
                ))}
            </div>
        );
    };
    
    // Check if message is deleted
    if (message.deleted_at) {
        return (
            <div className={cn(
                "flex mb-2",
                isOwn ? "justify-end" : "justify-start"
            )}>
                <div className={cn(
                    "max-w-[75%] rounded-2xl px-4 py-2 italic",
                    isOwn 
                        ? "bg-gray-200/50 dark:bg-gray-800/50 text-gray-500 rounded-br-sm" 
                        : "bg-gray-200/50 dark:bg-gray-800/50 text-gray-500 rounded-bl-sm"
                )}>
                    <span className="flex items-center gap-2">
                        <Trash2 className="h-3.5 w-3.5" />
                        This message was deleted
                    </span>
                </div>
            </div>
        );
    }
    
    return (
        <div 
            className={cn(
                "flex gap-2 mb-2 group",
                isOwn ? "justify-end" : "justify-start"
            )}
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
        >
            {/* Avatar (for other users) */}
            {!isOwn && (
                <div className="w-8 shrink-0">
                    {showAvatar ? (
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={message.sender?.avatar_url} />
                            <AvatarFallback className="bg-purple-600/30 text-purple-300 text-xs">
                                {message.sender?.name?.slice(0, 2).toUpperCase() || '??'}
                            </AvatarFallback>
                        </Avatar>
                    ) : null}
                </div>
            )}
            
            {/* Message content */}
            <div className={cn(
                "relative max-w-[75%]",
                isOwn ? "order-1" : "order-2"
            )}>
                {/* Sender name for group chats */}
                {!isOwn && showAvatar && message.sender?.name && (
                    <p className="text-xs text-purple-400 font-medium mb-1 ml-1">
                        {message.sender.name}
                    </p>
                )}
                
                {/* Bubble */}
                <div className={cn(
                    "rounded-2xl px-4 py-2",
                    isOwn 
                        ? "bg-purple-600 text-white rounded-br-sm" 
                        : "bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-sm"
                )}>
                    {/* Reply preview */}
                    {renderReplyPreview()}
                    
                    {/* Media */}
                    {renderMedia()}
                    
                    {/* Text content */}
                    {message.content && (
                        <p className="text-sm whitespace-pre-wrap break-words">
                            {message.content}
                        </p>
                    )}
                    
                    {/* Time and status */}
                    <div className={cn(
                        "flex items-center gap-1 mt-1 justify-end",
                        isOwn ? "text-purple-200" : "text-gray-500 dark:text-gray-400"
                    )}>
                        {message.edited_at && (
                            <span className="text-[10px] opacity-70">edited</span>
                        )}
                        <span className="text-[10px]">{formatTime(message.created_at)}</span>
                        {isOwn && <MessageStatus status={message.status || message.delivery_status} />}
                    </div>
                </div>
                
                {/* Reactions */}
                {renderReactions()}
            </div>
            
            {/* Quick actions */}
            <div className={cn(
                "flex items-center gap-1 transition-opacity",
                showActions ? "opacity-100" : "opacity-0",
                isOwn ? "order-0" : "order-3"
            )}>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                        >
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align={isOwn ? "end" : "start"} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                        <DropdownMenuItem onClick={onReply} className="text-gray-900 dark:text-white">
                            <Reply className="h-4 w-4 mr-2" /> Reply
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={copyMessage} className="text-gray-900 dark:text-white">
                            <Copy className="h-4 w-4 mr-2" /> Copy
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={onForward} className="text-gray-900 dark:text-white">
                            <Forward className="h-4 w-4 mr-2" /> Forward
                        </DropdownMenuItem>
                        {isOwn && (
                            <DropdownMenuItem onClick={onDelete} className="text-red-500 dark:text-red-400">
                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
};

export default MessageBubble;
