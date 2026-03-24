import React from 'react';
import { cn } from "@/lib/utils";
import { formatDayMonth, getWeekdayShortName } from '@/utils/dateUtils';

/**
 * TypingIndicator - Animated typing dots
 * Displays when someone is typing in the conversation
 */
export const TypingIndicator = ({ 
    userName, 
    className,
    variant = 'bubble' // 'bubble' | 'inline' | 'minimal'
}) => {
    if (variant === 'minimal') {
        return (
            <div className={cn("flex items-center gap-1", className)}>
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
        );
    }
    
    if (variant === 'inline') {
        return (
            <div className={cn("flex items-center gap-2 text-sm text-gray-400", className)}>
                {userName && <span className="font-medium text-purple-400">{userName}</span>}
                <span>is typing</span>
                <div className="flex gap-0.5">
                    <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
            </div>
        );
    }
    
    // Default bubble variant
    return (
        <div className={cn("flex items-center gap-2 animate-fadeIn", className)}>
            <div className="bg-gray-200 dark:bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex items-center gap-1.5">
                    <span 
                        className="w-2 h-2 bg-gray-500 rounded-full animate-typing-dot"
                        style={{ animationDelay: '0ms' }}
                    />
                    <span 
                        className="w-2 h-2 bg-gray-500 rounded-full animate-typing-dot"
                        style={{ animationDelay: '200ms' }}
                    />
                    <span 
                        className="w-2 h-2 bg-gray-500 rounded-full animate-typing-dot"
                        style={{ animationDelay: '400ms' }}
                    />
                </div>
            </div>
            {userName && (
                <span className="text-xs text-gray-500">{userName} is typing...</span>
            )}
        </div>
    );
};

/**
 * OnlineStatus - User online/offline status indicator
 */
export const OnlineStatus = ({
    isOnline,
    lastSeen,
    showText = false,
    size = 'md', // 'sm' | 'md' | 'lg'
    className
}) => {
    const sizeClasses = {
        sm: 'w-2 h-2',
        md: 'w-3 h-3',
        lg: 'w-4 h-4'
    };
    
    const formatLastSeen = (timestamp) => {
        if (!timestamp) return 'Offline';
        
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        // Less than a minute
        if (diff < 60000) return 'Just now';
        
        // Less than an hour
        if (diff < 3600000) {
            const mins = Math.floor(diff / 60000);
            return `${mins}m ago`;
        }
        
        // Less than 24 hours
        if (diff < 86400000) {
            const hours = Math.floor(diff / 3600000);
            return `${hours}h ago`;
        }
        
        // Less than a week
        if (diff < 604800000) {
            const days = Math.floor(diff / 86400000);
            return `${days}d ago`;
        }
        
        // Show date
        return formatDayMonth(date, '');
    };
    
    if (showText) {
        return (
            <div className={cn("flex items-center gap-1.5", className)}>
                <span className={cn(
                    sizeClasses[size],
                    "rounded-full",
                    isOnline 
                        ? "bg-green-500 animate-pulse" 
                        : "bg-gray-500"
                )} />
                <span className={cn(
                    "text-xs",
                    isOnline ? "text-green-400" : "text-gray-400"
                )}>
                    {isOnline ? 'Online' : `Last seen ${formatLastSeen(lastSeen)}`}
                </span>
            </div>
        );
    }
    
    return (
        <span 
            className={cn(
                sizeClasses[size],
                "rounded-full border-2 border-gray-900",
                isOnline 
                    ? "bg-green-500 animate-pulse" 
                    : "bg-gray-500",
                className
            )}
            title={isOnline ? 'Online' : `Last seen ${formatLastSeen(lastSeen)}`}
        />
    );
};

/**
 * MessageTicks - WhatsApp-style message delivery status
 */
export const MessageTicks = ({
    status, // 'sending' | 'sent' | 'delivered' | 'read' | 'failed'
    className,
    size = 'sm' // 'xs' | 'sm' | 'md'
}) => {
    const sizeClasses = {
        xs: 'h-3 w-3',
        sm: 'h-3.5 w-3.5',
        md: 'h-4 w-4'
    };
    
    const iconSize = sizeClasses[size];
    
    switch (status) {
        case 'sending':
            return (
                <svg className={cn(iconSize, "text-gray-500 animate-pulse", className)} viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeDasharray="30" strokeDashoffset="10">
                        <animate attributeName="stroke-dashoffset" values="30;0" dur="1s" repeatCount="indefinite"/>
                    </circle>
                </svg>
            );
        
        case 'sent':
            return (
                <svg className={cn(iconSize, "text-gray-400", className)} viewBox="0 0 16 16" fill="none">
                    <path 
                        d="M13.5 4.5L6 12L2.5 8.5" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                    />
                </svg>
            );
        
        case 'delivered':
            return (
                <svg className={cn(iconSize, "text-gray-400", className)} viewBox="0 0 20 16" fill="none">
                    <path 
                        d="M9.5 4.5L2 12" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                    />
                    <path 
                        d="M17.5 4.5L10 12L6.5 8.5" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                    />
                </svg>
            );
        
        case 'read':
            return (
                <svg className={cn(iconSize, "text-blue-400", className)} viewBox="0 0 20 16" fill="none">
                    <path 
                        d="M9.5 4.5L2 12" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                    />
                    <path 
                        d="M17.5 4.5L10 12L6.5 8.5" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                    />
                </svg>
            );
        
        case 'failed':
            return (
                <svg className={cn(iconSize, "text-red-400", className)} viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2"/>
                    <path d="M8 5V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <circle cx="8" cy="11.5" r="0.5" fill="currentColor"/>
                </svg>
            );
        
        default:
            return null;
    }
};

/**
 * UnreadBadge - Unread message count badge
 */
export const UnreadBadge = ({
    count,
    max = 99,
    className,
    variant = 'default' // 'default' | 'dot' | 'minimal'
}) => {
    if (!count || count < 1) return null;
    
    const displayCount = count > max ? `${max}+` : count;
    
    if (variant === 'dot') {
        return (
            <span className={cn(
                "w-2.5 h-2.5 bg-purple-600 rounded-full animate-pulse",
                className
            )} />
        );
    }
    
    if (variant === 'minimal') {
        return (
            <span className={cn(
                "text-xs font-medium text-purple-400",
                className
            )}>
                {displayCount}
            </span>
        );
    }
    
    return (
        <span className={cn(
            "inline-flex items-center justify-center min-w-5 h-5 px-1.5 text-xs font-bold text-white bg-purple-600 rounded-full",
            count > 9 ? "px-2" : "",
            className
        )}>
            {displayCount}
        </span>
    );
};

/**
 * TimeAgo - Relative time display
 */
export const TimeAgo = ({ timestamp, className }) => {
    const getRelativeTime = (date) => {
        if (!date) return '';
        
        const now = new Date();
        const then = new Date(date);
        const diff = now - then;
        
        // Less than a minute
        if (diff < 60000) return 'Just now';
        
        // Less than an hour
        if (diff < 3600000) {
            const mins = Math.floor(diff / 60000);
            return `${mins}m`;
        }
        
        // Less than 24 hours - show time
        if (diff < 86400000) {
            return then.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true
            });
        }
        
        // Yesterday
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        if (then.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        }
        
        // Less than a week
        if (diff < 604800000) {
            return getWeekdayShortName(then);
        }
        
        // Show date
        return formatDayMonth(then, '');
    };
    
    return (
        <span className={cn("text-xs text-gray-400", className)}>
            {getRelativeTime(timestamp)}
        </span>
    );
};

/**
 * MessagePreview - Truncated message preview with type indicator
 */
export const MessagePreview = ({
    text,
    type = 'text',
    isOwn = false,
    maxLength = 50,
    className
}) => {
    const getTypeIcon = () => {
        switch (type) {
            case 'image':
                return '📷';
            case 'video':
                return '🎬';
            case 'audio':
            case 'voice':
                return '🎤';
            case 'document':
            case 'file':
                return '📄';
            case 'location':
                return '📍';
            case 'contact':
                return '👤';
            default:
                return null;
        }
    };
    
    const icon = getTypeIcon();
    const displayText = type !== 'text' 
        ? (icon ? `${icon} ${text || type.charAt(0).toUpperCase() + type.slice(1)}` : text)
        : text;
    
    const truncated = displayText?.length > maxLength 
        ? displayText.substring(0, maxLength) + '...'
        : displayText;
    
    return (
        <span className={cn(
            "text-sm text-gray-400 truncate",
            className
        )}>
            {isOwn && <span className="text-gray-500">You: </span>}
            {truncated || 'Start a conversation'}
        </span>
    );
};

export default {
    TypingIndicator,
    OnlineStatus,
    MessageTicks,
    UnreadBadge,
    TimeAgo,
    MessagePreview
};
