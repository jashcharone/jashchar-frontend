import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
    Send, Paperclip, Smile, Mic, X, Image, File, 
    Camera, FileText, StopCircle, Loader2
} from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import api from "@/services/api";

// Common emojis for quick access
const QUICK_EMOJIS = [
    '😀', '😂', '❤️', '👍', '👎', '🙏', '🎉', '🔥',
    '😊', '😍', '😢', '😡', '🤔', '👏', '💪', '✨',
    '😎', '🥰', '😭', '😱', '🙄', '💯', '🤣', '😇'
];

// More emoji categories
const EMOJI_CATEGORIES = {
    'Smileys': ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗'],
    'Gestures': ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👋', '🤚', '🖐️', '✋', '👏', '🙌', '🤲', '🙏'],
    'Hearts': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💕', '💞', '💓', '💗', '💖', '💘', '💝'],
    'Objects': ['🎉', '🎊', '🎁', '🏆', '🥇', '⭐', '🌟', '✨', '💫', '🔥', '💯', '📚', '📝', '💼', '📱', '💻'],
};

/**
 * MessageInput - Chat message input with emoji picker, file upload, and voice recording
 */
const MessageInput = ({
    onSend,
    onTypingStart,
    onTypingStop,
    disabled,
    placeholder = "Type a message...",
    className
}) => {
    const [message, setMessage] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showAttachMenu, setShowAttachMenu] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [attachedFile, setAttachedFile] = useState(null);
    
    const textareaRef = useRef(null);
    const fileInputRef = useRef(null);
    const imageInputRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const recordingIntervalRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    
    // Handle typing indicator
    useEffect(() => {
        if (message.trim()) {
            onTypingStart?.();
            
            // Clear previous timeout
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            
            // Set new timeout to stop typing indicator
            typingTimeoutRef.current = setTimeout(() => {
                onTypingStop?.();
            }, 3000);
        } else {
            onTypingStop?.();
        }
        
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, [message, onTypingStart, onTypingStop]);
    
    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + 'px';
        }
    }, [message]);
    
    // Handle send
    const handleSend = useCallback(() => {
        if ((!message.trim() && !attachedFile) || disabled) return;
        
        if (attachedFile) {
            onSend(message.trim() || null, attachedFile.type, {
                url: attachedFile.url,
                thumbnail: attachedFile.thumbnail,
                filename: attachedFile.name,
                size: attachedFile.size
            });
            setAttachedFile(null);
        } else {
            onSend(message.trim(), 'text');
        }
        
        setMessage('');
        onTypingStop?.();
        
        // Reset textarea height
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
    }, [message, attachedFile, disabled, onSend, onTypingStop]);
    
    // Handle Enter key
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };
    
    // Handle emoji selection
    const handleEmojiSelect = (emoji) => {
        setMessage(prev => prev + emoji);
        textareaRef.current?.focus();
    };
    
    // Handle file selection
    const handleFileSelect = async (e, type = 'file') => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        setIsUploading(true);
        setShowAttachMenu(false);
        
        try {
            // Determine message type
            let messageType = type;
            if (type === 'auto') {
                if (file.type.startsWith('image/')) messageType = 'image';
                else if (file.type.startsWith('video/')) messageType = 'video';
                else if (file.type.startsWith('audio/')) messageType = 'audio';
                else messageType = 'document';
            }
            
            // Create local preview URL for immediate display
            const localPreviewUrl = URL.createObjectURL(file);
            
            // Upload to server
            const formData = new FormData();
            formData.append('file', file);
            
            console.log('[MessageInput] Uploading file:', file.name, file.type, file.size);
            
            const response = await api.post('/jashsync/media/upload', formData);
            
            console.log('[MessageInput] Upload response:', response);
            
            // api.post returns data directly
            const uploadedMedia = response || {};
            const publicUrl = uploadedMedia.media?.public_url || uploadedMedia.public_url;
            const thumbnailUrl = uploadedMedia.media?.thumbnail_url || uploadedMedia.thumbnail_url;
            
            if (!publicUrl) {
                throw new Error('Upload failed - no URL returned');
            }
            
            console.log('[MessageInput] File uploaded, URL:', publicUrl);
            
            setAttachedFile({
                file,
                url: publicUrl,
                localPreview: localPreviewUrl, // Keep local preview for immediate display
                name: file.name,
                size: file.size,
                type: messageType,
                thumbnail: thumbnailUrl || (file.type.startsWith('image/') ? publicUrl : null)
            });
        } catch (error) {
            console.error('File upload error:', error);
            alert('Failed to upload file. Please try again.');
        } finally {
            setIsUploading(false);
        }
        
        // Reset input
        e.target.value = '';
    };
    
    // Remove attached file
    const removeAttachment = () => {
        if (attachedFile?.localPreview) {
            URL.revokeObjectURL(attachedFile.localPreview);
        }
        setAttachedFile(null);
    };
    
    // Voice recording
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];
            
            mediaRecorderRef.current.ondataavailable = (e) => {
                audioChunksRef.current.push(e.data);
            };
            
            mediaRecorderRef.current.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const url = URL.createObjectURL(audioBlob);
                
                setAttachedFile({
                    file: audioBlob,
                    url,
                    name: `voice_${Date.now()}.webm`,
                    size: audioBlob.size,
                    type: 'voice',
                    duration: recordingTime
                });
                
                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
            };
            
            mediaRecorderRef.current.start();
            setIsRecording(true);
            setRecordingTime(0);
            
            // Start timer
            recordingIntervalRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
            
        } catch (error) {
            console.error('Recording error:', error);
        }
    };
    
    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            
            if (recordingIntervalRef.current) {
                clearInterval(recordingIntervalRef.current);
            }
        }
    };
    
    const cancelRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
        setIsRecording(false);
        setRecordingTime(0);
        
        if (recordingIntervalRef.current) {
            clearInterval(recordingIntervalRef.current);
        }
    };
    
    // Format recording time
    const formatRecordingTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };
    
    return (
        <div className={cn("border-t border-gray-200 dark:border-gray-700/50 bg-white/50 dark:bg-gray-900/50", className)}>
            {/* Uploading indicator */}
            {isUploading && (
                <div className="px-4 pt-3">
                    <div className="flex items-center gap-3 bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
                        <Loader2 className="h-5 w-5 text-blue-400 animate-spin" />
                        <span className="text-blue-400">Uploading file...</span>
                    </div>
                </div>
            )}
            
            {/* Attachment preview */}
            {attachedFile && !isUploading && (
                <div className="px-4 pt-3">
                    <div className="flex items-center gap-3 bg-gray-100/50 dark:bg-gray-800/50 rounded-lg p-3">
                        {attachedFile.type === 'image' ? (
                            <img 
                                src={attachedFile.localPreview || attachedFile.url} 
                                alt={attachedFile.name}
                                className="w-16 h-16 object-cover rounded"
                            />
                        ) : attachedFile.type === 'voice' ? (
                            <div className="w-12 h-12 rounded-full bg-purple-600/30 flex items-center justify-center">
                                <Mic className="h-5 w-5 text-purple-400" />
                            </div>
                        ) : (
                            <div className="w-12 h-12 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                <File className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{attachedFile.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {attachedFile.duration 
                                    ? formatRecordingTime(attachedFile.duration)
                                    : `${(attachedFile.size / 1024).toFixed(1)} KB`
                                }
                            </p>
                        </div>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={removeAttachment}
                            className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
            
            {/* Recording indicator */}
            {isRecording && (
                <div className="px-4 pt-3">
                    <div className="flex items-center gap-3 bg-red-900/20 border border-red-500/30 rounded-lg p-3">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-red-400 font-medium">Recording...</span>
                        <span className="text-white font-mono">{formatRecordingTime(recordingTime)}</span>
                        <div className="flex-1" />
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={cancelRecording}
                            className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                        >
                            Cancel
                        </Button>
                        <Button 
                            size="sm" 
                            onClick={stopRecording}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            <StopCircle className="h-4 w-4 mr-1" />
                            Stop
                        </Button>
                    </div>
                </div>
            )}
            
            {/* Input area */}
            <div className="p-3">
                <div className="flex items-end gap-2">
                    {/* Emoji picker */}
                    <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                        <PopoverTrigger asChild>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white shrink-0"
                                disabled={disabled || isRecording}
                            >
                                <Smile className="h-5 w-5" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent 
                            className="w-80 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 p-2"
                            align="start"
                            side="top"
                        >
                            {/* Quick emojis */}
                            <div className="grid grid-cols-8 gap-1 mb-3">
                                {QUICK_EMOJIS.map((emoji) => (
                                    <button
                                        key={emoji}
                                        onClick={() => handleEmojiSelect(emoji)}
                                        className="w-8 h-8 flex items-center justify-center text-xl hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                            
                            {/* Categories */}
                            {Object.entries(EMOJI_CATEGORIES).map(([category, emojis]) => (
                                <div key={category} className="mb-3">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 px-1">{category}</p>
                                    <div className="grid grid-cols-8 gap-1">
                                        {emojis.map((emoji) => (
                                            <button
                                                key={emoji}
                                                onClick={() => handleEmojiSelect(emoji)}
                                                className="w-8 h-8 flex items-center justify-center text-xl hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </PopoverContent>
                    </Popover>
                    
                    {/* Attachment menu */}
                    <Popover open={showAttachMenu} onOpenChange={setShowAttachMenu}>
                        <PopoverTrigger asChild>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white shrink-0"
                                disabled={disabled || isRecording || isUploading}
                            >
                                {isUploading ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <Paperclip className="h-5 w-5" />
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent 
                            className="w-48 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 p-1"
                            align="start"
                            side="top"
                        >
                            <button
                                onClick={() => imageInputRef.current?.click()}
                                className="w-full flex items-center gap-3 px-3 py-2 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                            >
                                <Image className="h-4 w-4 text-green-500" />
                                Photo/Video
                            </button>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full flex items-center gap-3 px-3 py-2 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                            >
                                <FileText className="h-4 w-4 text-blue-500" />
                                Document
                            </button>
                            <button
                                onClick={() => {
                                    setShowAttachMenu(false);
                                    // Open camera - for mobile
                                }}
                                className="w-full flex items-center gap-3 px-3 py-2 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                            >
                                <Camera className="h-4 w-4 text-purple-500" />
                                Camera
                            </button>
                        </PopoverContent>
                    </Popover>
                    
                    {/* Hidden file inputs */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={(e) => handleFileSelect(e, 'document')}
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                    />
                    <input
                        ref={imageInputRef}
                        type="file"
                        className="hidden"
                        onChange={(e) => handleFileSelect(e, 'auto')}
                        accept="image/*,video/*"
                    />
                    
                    {/* Message input */}
                    <div className="flex-1 bg-gray-100/50 dark:bg-gray-800/50 rounded-2xl px-4 py-2">
                        <Textarea
                            ref={textareaRef}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={placeholder}
                            disabled={disabled || isRecording}
                            className="min-h-[24px] max-h-[150px] w-full bg-transparent border-0 text-gray-900 dark:text-white placeholder:text-gray-500 resize-none focus-visible:ring-0 p-0"
                            rows={1}
                        />
                    </div>
                    
                    {/* Voice note or Send button */}
                    {message.trim() || attachedFile ? (
                        <Button 
                            onClick={handleSend}
                            disabled={disabled}
                            className="bg-purple-600 hover:bg-purple-700 shrink-0 h-10 w-10 rounded-full p-0"
                        >
                            <Send className="h-5 w-5" />
                        </Button>
                    ) : (
                        <Button 
                            onClick={isRecording ? stopRecording : startRecording}
                            variant={isRecording ? "destructive" : "ghost"}
                            disabled={disabled}
                            className={cn(
                                "shrink-0 h-10 w-10 rounded-full p-0",
                                isRecording 
                                    ? "bg-red-600 hover:bg-red-700" 
                                    : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                            )}
                        >
                            {isRecording ? (
                                <StopCircle className="h-5 w-5" />
                            ) : (
                                <Mic className="h-5 w-5" />
                            )}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MessageInput;
